import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getInsertClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

// Assignment uses raw fetch() against the REST API to avoid any Supabase JS client
// auth/session state that could interfere when requests carry browser cookies.
async function assignLeadToEmployee(leadId: string, campus: string | null) {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error('[assignment] env vars missing — SUPABASE_URL:', !!SUPABASE_URL, 'SERVICE_KEY:', !!SERVICE_KEY)
    return
  }

  try {
    const headers: Record<string, string> = {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
    }

    // Build employee query — always filter role=empleado, active=true, order by round_robin_index
    const isAny = !campus || campus === 'No tengo preferencia'
    let empUrl = `${SUPABASE_URL}/rest/v1/employees?active=eq.true&role=eq.empleado&select=id,round_robin_index&order=round_robin_index.asc`
    if (!isAny) {
      // PostgREST array-contains syntax: campus=cs.{"Vega Alta"}
      empUrl += `&campus=cs.${encodeURIComponent(`{"${campus}"}`)}`
    }

    console.log('[assignment] querying employees, campus:', campus, 'isAny:', isAny)
    const empRes = await fetch(empUrl, { headers })
    const employees: { id: string; round_robin_index: number }[] = await empRes.json()
    console.log('[assignment] employees found:', employees?.length ?? 0)

    if (!Array.isArray(employees) || employees.length === 0) return

    const chosen = employees[0]
    const total = employees.length
    const nextIndex = (chosen.round_robin_index + 1) % total
    const now = new Date().toISOString()

    console.log('[assignment] assigning leadId:', leadId, 'to employee:', chosen.id)

    const [empUpdate, leadUpdate, histInsert] = await Promise.all([
      fetch(`${SUPABASE_URL}/rest/v1/employees?id=eq.${chosen.id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ round_robin_index: nextIndex }),
      }),
      fetch(`${SUPABASE_URL}/rest/v1/leads?id=eq.${leadId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          assigned_to: chosen.id,
          assignment_source: 'website',
          status: 'Nuevo Lead',
          last_action_at: now,
        }),
      }),
      fetch(`${SUPABASE_URL}/rest/v1/lead_history`, {
        method: 'POST',
        headers: { ...headers, Prefer: 'return=minimal' },
        body: JSON.stringify({
          lead_id: leadId,
          employee_id: chosen.id,
          action_type: 'lead_assigned',
          new_status: 'Nuevo Lead',
          note: 'Lead asignado automáticamente desde formulario web',
        }),
      }),
    ])

    console.log('[assignment] done — empStatus:', empUpdate.status, 'leadStatus:', leadUpdate.status, 'histStatus:', histInsert.status)
  } catch (err) {
    console.error('[assignment] error:', err)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const {
      nombre,
      apellido,
      email,
      telefono,
      campus,
      programa_interes,
      horario,
      source,
      utm_source,
      utm_medium,
      utm_campaign,
      page_source,
    } = body

    // Validate required fields
    if (!nombre || typeof nombre !== 'string' || nombre.trim().length < 2) {
      return NextResponse.json(
        { success: false, error: 'El nombre es requerido.' },
        { status: 400 }
      )
    }

    if (!apellido || typeof apellido !== 'string' || apellido.trim().length < 2) {
      return NextResponse.json(
        { success: false, error: 'El apellido es requerido.' },
        { status: 400 }
      )
    }

    if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Por favor ingresa un correo electrónico válido.' },
        { status: 400 }
      )
    }

    if (!telefono || typeof telefono !== 'string' || telefono.trim().length < 7) {
      return NextResponse.json(
        { success: false, error: 'Por favor ingresa un número de teléfono válido.' },
        { status: 400 }
      )
    }

    const sanitizedLead = {
      nombre: nombre.trim().slice(0, 100),
      apellido: apellido.trim().slice(0, 100),
      email: email.trim().toLowerCase().slice(0, 254),
      telefono: telefono.trim().slice(0, 20),
      campus: typeof campus === 'string' ? campus.trim().slice(0, 100) : null,
      programa_interes: typeof programa_interes === 'string' ? programa_interes.trim().slice(0, 200) : null,
      horario: typeof horario === 'string' ? horario.trim().slice(0, 50) : null,
      source: typeof source === 'string' ? source.trim().slice(0, 200) : 'direct',
      utm_source: typeof utm_source === 'string' ? utm_source.trim().slice(0, 100) : null,
      utm_medium: typeof utm_medium === 'string' ? utm_medium.trim().slice(0, 100) : null,
      utm_campaign: typeof utm_campaign === 'string' ? utm_campaign.trim().slice(0, 200) : null,
      page_source: typeof page_source === 'string' ? page_source.trim().slice(0, 500) : null,
      status: 'Nuevo Lead' as const,
      last_action_at: new Date().toISOString(),
    }

    const insertClient = getInsertClient()

    if (insertClient) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: insertedLead, error } = await (insertClient as any)
        .from('leads')
        .insert(sanitizedLead)
        .select('id')
        .single()

      if (error) {
        console.error('Supabase insert error:', error)
        return NextResponse.json(
          { success: false, error: 'Error al guardar la información. Por favor intenta de nuevo.' },
          { status: 500 }
        )
      }

      if (insertedLead?.id) {
        await assignLeadToEmployee(insertedLead.id, sanitizedLead.campus)
      }

      return NextResponse.json({ success: true, lead_id: insertedLead?.id ?? null }, { status: 201 })
    } else {
      console.log('[Lead captured - no DB configured]', sanitizedLead)
    }

    return NextResponse.json({ success: true, lead_id: null }, { status: 201 })
  } catch (err) {
    console.error('API route error:', err)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor.' },
      { status: 500 }
    )
  }
}
