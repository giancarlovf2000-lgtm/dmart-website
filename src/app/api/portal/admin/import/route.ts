import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerSupabase } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import type { LeadStatus } from '@/lib/types'

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// Normalize string for case/accent-insensitive matching
function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

// Former employees that should be redirected to Carmen Peña
const FORMER_EMPLOYEE_REDIRECTS: Record<string, string> = {
  'melisa tirado': 'carmen pena',
  'zuleika ortiz velez': 'carmen pena',
  'zuleika ortiz': 'carmen pena',
}

const STATUS_MAP: Record<string, LeadStatus> = {
  'transferido matriculado': 'Matriculado',
  'transferido cancelado': 'Desinteresado / Rechazado',
  'matriculado': 'Matriculado',
  'nuevo lead': 'Nuevo Lead',
  'critico': 'Crítico',
  'crítico': 'Crítico',
  'contacto inicial (pendiente de respuesta)': 'Contacto Inicial (Pendiente de Respuesta)',
  'contacto establecido': 'Contacto Establecido',
  'cita programada': 'Cita Programada',
  'no asistio a la cita': 'No Asistió a la Cita',
  'no asistió a la cita': 'No Asistió a la Cita',
  'reagendado': 'Reagendado',
  'en espera de documentos': 'En Espera de Documentos',
  'orientado (en proceso de matricularse)': 'Orientado (En Proceso de Matricularse)',
  'seguimiento a futuro': 'Seguimiento a Futuro',
  'desinteresado / rechazado': 'Desinteresado / Rechazado',
  'desinteresado': 'Desinteresado / Rechazado',
  'rechazado': 'Desinteresado / Rechazado',
}

export interface CsvRow {
  full_name?: string
  lead_date?: string
  from?: string
  representante?: string
  status?: string
  interest?: string
  seguimiento?: string
  phone?: string
  email?: string
}

async function requireAdmin(supabase: Awaited<ReturnType<typeof createServerSupabase>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const admin = getAdminClient()
  const { data: employee } = await admin
    .from('employees')
    .select('id, role')
    .eq('id', user.id)
    .single()
  if (!employee || employee.role !== 'admin') return null
  return user
}

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabase()
  const user = await requireAdmin(supabase)
  if (!user) return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })

  const body = await request.json()
  const rows: CsvRow[] = body.rows
  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: 'No hay filas para importar.' }, { status: 400 })
  }
  if (rows.length > 200) {
    return NextResponse.json({ error: 'Máximo 200 filas por solicitud.' }, { status: 400 })
  }

  const admin = getAdminClient()

  // Fetch all active employees for name lookup (include campus for lead assignment)
  const { data: employees } = await admin
    .from('employees')
    .select('id, full_name, campus')
    .eq('active', true)

  // Build normalized name → employee record map
  const employeeMap = new Map<string, { id: string; campus: string[] }>()
  employees?.forEach((e) => {
    employeeMap.set(normalize(e.full_name), { id: e.id, campus: e.campus ?? [] })
  })

  let imported = 0
  let skipped = 0
  const errors: string[] = []

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const rowNum = i + 1

    try {
      // Parse name
      const fullName = (row.full_name ?? '').trim()
      const spaceIdx = fullName.indexOf(' ')
      const nombre = spaceIdx >= 0 ? fullName.slice(0, spaceIdx).trim() : fullName
      const apellido = spaceIdx >= 0 ? fullName.slice(spaceIdx + 1).trim() : ''

      if (!nombre || nombre.length < 1) {
        skipped++
        continue
      }

      // Parse phone — required
      const telefono = (row.phone ?? '').replace(/\D/g, '').slice(0, 20)
      if (!telefono || telefono.length < 7) {
        skipped++
        errors.push(`Fila ${rowNum}: teléfono inválido ("${row.phone ?? ''}")`)
        continue
      }

      // Parse email — optional
      const emailRaw = (row.email ?? '').trim().toLowerCase()
      const email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailRaw) ? emailRaw : ''

      // Parse date — Airtable exports as "M/D/YYYY H:MMam" or "M/D/YYYY H:MMpm"
      let createdAt: string | null = null
      if (row.lead_date) {
        const raw = row.lead_date.trim()
        // Normalize lowercase am/pm without space → "7:59am" → "7:59 AM"
        const normalized = raw.replace(/(\d)(am|pm)\b/gi, (_, d, ap) => `${d} ${ap.toUpperCase()}`)
        let parsed = new Date(normalized)
        if (isNaN(parsed.getTime())) {
          // Try DD/MM/YYYY (European) by swapping day/month
          const parts = normalized.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/)
          if (parts) parsed = new Date(`${parts[3]}-${parts[2].padStart(2, '0')}-${parts[1].padStart(2, '0')}`)
        }
        if (!isNaN(parsed.getTime())) createdAt = parsed.toISOString()
      }

      // Map status
      const rawStatus = normalize(row.status ?? '')
      const status: LeadStatus = STATUS_MAP[rawStatus] ?? 'Nuevo Lead'

      // Resolve representante
      const rawRep = normalize(row.representante ?? '')
      let assignedTo: string | null = null
      let assignedCampus: string | null = null
      let redirectedFrom: string | null = null

      if (rawRep) {
        const redirectTarget = FORMER_EMPLOYEE_REDIRECTS[rawRep]
        if (redirectTarget) {
          // Former employee — redirect to Carmen Peña
          const emp = employeeMap.get(redirectTarget)
          if (emp) {
            assignedTo = emp.id
            assignedCampus = emp.campus[0] ?? null
            redirectedFrom = row.representante?.trim() ?? null
          }
        } else {
          const emp = employeeMap.get(rawRep)
          if (emp) {
            assignedTo = emp.id
            assignedCampus = emp.campus[0] ?? null
          }
        }
      }

      // Build lead record — omit created_at here; we override it via UPDATE below
      // to bypass any BEFORE INSERT trigger that resets it to now()
      const leadRecord: Record<string, unknown> = {
        nombre: nombre.slice(0, 100),
        apellido: apellido.slice(0, 100),
        email: email.slice(0, 254),
        telefono: telefono.slice(0, 20),
        campus: assignedCampus,
        programa_interes: row.interest ? row.interest.trim().slice(0, 200) : null,
        source: row.from ? row.from.trim().slice(0, 200) : 'Importado de Airtable',
        status,
        assignment_source: 'import',
        assigned_to: assignedTo,
        last_action_at: createdAt ?? new Date().toISOString(),
      }

      const { data: inserted, error: insertError } = await admin
        .from('leads')
        .insert(leadRecord)
        .select('id')
        .single()

      if (insertError || !inserted) {
        errors.push(`Fila ${rowNum}: ${insertError?.message ?? 'Error al insertar'}`)
        skipped++
        continue
      }

      const leadId = inserted.id

      // Override created_at via UPDATE — works even if INSERT trigger resets it
      if (createdAt) {
        await admin
          .from('leads')
          .update({ created_at: createdAt })
          .eq('id', leadId)
      }

      // Insert seguimiento note if present
      if (row.seguimiento && row.seguimiento.trim()) {
        await admin.from('lead_history').insert({
          lead_id: leadId,
          employee_id: null,
          action_type: 'note_added',
          note: row.seguimiento.trim().slice(0, 2000),
          new_status: status,
        })
      }

      // Insert redirect note if former employee was remapped
      if (redirectedFrom && assignedTo) {
        const carmenName = employees?.find((e: { id: string; full_name: string }) => e.id === assignedTo)?.full_name ?? 'Carmen Peña'
        await admin.from('lead_history').insert({
          lead_id: leadId,
          employee_id: null,
          action_type: 'note_added',
          note: `Lead de ${redirectedFrom} asignado a ${carmenName}`,
          new_status: status,
        })
      }

      imported++
    } catch (err) {
      errors.push(`Fila ${rowNum}: error inesperado`)
      skipped++
      console.error(`[import] row ${rowNum} error:`, err)
    }
  }

  return NextResponse.json({ imported, skipped, errors }, { status: 200 })
}
