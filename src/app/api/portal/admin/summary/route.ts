import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerSupabase } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function nextMonth(month: string): string {
  const d = new Date(month + 'T00:00:00')
  d.setMonth(d.getMonth() + 1)
  return d.toISOString().slice(0, 10)
}

function leadSource(lead: { activity_id: string | null; lead_source_text: string | null }): string {
  if (lead.activity_id) return 'Actividad (QR)'
  if (lead.lead_source_text && lead.lead_source_text.trim()) return 'Web / Formulario'
  return 'Manual'
}

function normalizePhone(p: string | null): string {
  if (!p) return ''
  return p.replace(/\D/g, '')
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })

    const admin = getAdminClient()

    const { data: selfEmp } = await admin.from('employees').select('role').eq('id', user.id).single()
    if (!selfEmp || selfEmp.role !== 'admin')
      return NextResponse.json({ error: 'No autorizado.' }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const month = searchParams.get('month')
    if (!month) return NextResponse.json({ error: 'El mes es requerido.' }, { status: 400 })

    const monthEnd = nextMonth(month)

    // Fetch everything in parallel
    const [employeesRes, leadsRes, allLeadsRes, activitiesRes, reportsRes, contractsRes] = await Promise.all([
      admin.from('employees').select('id, full_name, campus, role, active').order('full_name'),
      // Slim leads for existing UI totals
      admin.from('leads')
        .select('assigned_to, status')
        .gte('created_at', month)
        .lt('created_at', monthEnd)
        .not('assigned_to', 'is', null),
      // Full leads for enriched report
      admin.from('leads')
        .select('id, nombre, apellido, telefono, email, campus, programa_interes, status, assignment_source, lead_source_text, activity_id, assigned_to, created_at')
        .gte('created_at', month)
        .lt('created_at', monthEnd)
        .not('assigned_to', 'is', null)
        .order('created_at', { ascending: false }),
      admin.from('activities').select('*').eq('month', month),
      admin.from('monthly_reports')
        .select('employee_id, performance_score, leads_acquired, leads_enrolled, activities_completed, notes')
        .eq('month', month)
        .eq('report_type', 'performance'),
      // Private contracts for the month
      admin.from('private_contracts')
        .select('employee_id, program, total_contract, created_at')
        .gte('created_at', month)
        .lt('created_at', monthEnd),
    ])

    const employees = (employeesRes.data ?? []).filter((e) => e.role !== 'admin')
    const leads = leadsRes.data ?? []
    const allLeads = allLeadsRes.data ?? []
    const activities = activitiesRes.data ?? []
    const reports = reportsRes.data ?? []
    const contracts = contractsRes.data ?? []

    // Build lookups
    const reportMap = new Map(reports.map((r) => [r.employee_id, r]))
    const empNameMap = new Map(employees.map((e) => [e.id, e.full_name]))

    // Count leads per employee (for existing UI)
    const leadsCountMap = new Map<string, number>()
    const matriculadosMap = new Map<string, number>()
    leads.forEach((l) => {
      if (!l.assigned_to) return
      leadsCountMap.set(l.assigned_to, (leadsCountMap.get(l.assigned_to) ?? 0) + 1)
      if (l.status === 'Matriculado') {
        matriculadosMap.set(l.assigned_to, (matriculadosMap.get(l.assigned_to) ?? 0) + 1)
      }
    })

    // Group activities per employee
    const activitiesMap = new Map<string, typeof activities>()
    activities.forEach((a) => {
      if (!activitiesMap.has(a.employee_id)) activitiesMap.set(a.employee_id, [])
      activitiesMap.get(a.employee_id)!.push(a)
    })

    // Per-employee breakdowns from full leads
    const statusBreakdownMap = new Map<string, Record<string, number>>()
    const sourceBreakdownMap = new Map<string, Record<string, number>>()
    const programsBreakdownMap = new Map<string, Record<string, number>>()

    allLeads.forEach((l) => {
      if (!l.assigned_to) return
      const empId = l.assigned_to as string

      // Status
      if (!statusBreakdownMap.has(empId)) statusBreakdownMap.set(empId, {})
      const sb = statusBreakdownMap.get(empId)!
      sb[l.status] = (sb[l.status] ?? 0) + 1

      // Source
      if (!sourceBreakdownMap.has(empId)) sourceBreakdownMap.set(empId, {})
      const src = leadSource(l)
      const srb = sourceBreakdownMap.get(empId)!
      srb[src] = (srb[src] ?? 0) + 1

      // Program
      if (l.programa_interes) {
        if (!programsBreakdownMap.has(empId)) programsBreakdownMap.set(empId, {})
        const pb = programsBreakdownMap.get(empId)!
        pb[l.programa_interes] = (pb[l.programa_interes] ?? 0) + 1
      }
    })

    // Private contracts per employee
    const contractsCountMap = new Map<string, number>()
    const contractsTotalMap = new Map<string, number>()
    contracts.forEach((c) => {
      contractsCountMap.set(c.employee_id, (contractsCountMap.get(c.employee_id) ?? 0) + 1)
      contractsTotalMap.set(c.employee_id, (contractsTotalMap.get(c.employee_id) ?? 0) + Number(c.total_contract))
    })

    // Detect duplicate pairs (same normalized phone OR same email within period leads)
    type LeadRow = typeof allLeads[number]
    interface DupPair {
      lead1: { id: string; nombre: string; apellido: string; telefono: string | null; email: string | null; employee_name: string }
      lead2: { id: string; nombre: string; apellido: string; telefono: string | null; email: string | null; employee_name: string }
      match_type: 'phone' | 'email'
    }
    const dupPairs: DupPair[] = []
    const seenPairs = new Set<string>()

    const phoneIndex = new Map<string, LeadRow[]>()
    const emailIndex = new Map<string, LeadRow[]>()

    allLeads.forEach((l) => {
      const ph = normalizePhone(l.telefono)
      if (ph.length >= 7) {
        if (!phoneIndex.has(ph)) phoneIndex.set(ph, [])
        phoneIndex.get(ph)!.push(l)
      }
      const em = (l.email ?? '').toLowerCase().trim()
      if (em) {
        if (!emailIndex.has(em)) emailIndex.set(em, [])
        emailIndex.get(em)!.push(l)
      }
    })

    const addPairs = (groups: Map<string, LeadRow[]>, matchType: 'phone' | 'email') => {
      groups.forEach((group) => {
        if (group.length < 2) return
        for (let i = 0; i < group.length; i++) {
          for (let j = i + 1; j < group.length; j++) {
            const key = [group[i].id, group[j].id].sort().join('|')
            if (seenPairs.has(key)) continue
            seenPairs.add(key)
            dupPairs.push({
              lead1: { id: group[i].id, nombre: group[i].nombre, apellido: group[i].apellido, telefono: group[i].telefono, email: group[i].email, employee_name: empNameMap.get(group[i].assigned_to as string) ?? '—' },
              lead2: { id: group[j].id, nombre: group[j].nombre, apellido: group[j].apellido, telefono: group[j].telefono, email: group[j].email, employee_name: empNameMap.get(group[j].assigned_to as string) ?? '—' },
              match_type: matchType,
            })
          }
        }
      })
    }

    addPairs(phoneIndex, 'phone')
    addPairs(emailIndex, 'email')

    // Build enriched employee stats
    const employeeStats = employees.map((emp) => {
      const empActivities = activitiesMap.get(emp.id) ?? []
      const report = reportMap.get(emp.id) ?? null

      // Top 5 programs
      const progRaw = programsBreakdownMap.get(emp.id) ?? {}
      const programs_breakdown = Object.fromEntries(
        Object.entries(progRaw).sort((a, b) => b[1] - a[1]).slice(0, 5)
      )

      return {
        id: emp.id,
        full_name: emp.full_name,
        campus: emp.campus,
        active: emp.active,
        leads_count: leadsCountMap.get(emp.id) ?? 0,
        matriculados_count: matriculadosMap.get(emp.id) ?? 0,
        activities_planned: empActivities.length,
        activities_completed: empActivities.filter((a) => a.status === 'terminada').length,
        activities: empActivities,
        report_submitted: !!report,
        performance_score: report?.performance_score ?? null,
        report_notes: report?.notes ?? null,
        // enriched
        status_breakdown: statusBreakdownMap.get(emp.id) ?? {},
        source_breakdown: sourceBreakdownMap.get(emp.id) ?? {},
        programs_breakdown,
        contracts_count: contractsCountMap.get(emp.id) ?? 0,
        contracts_total: contractsTotalMap.get(emp.id) ?? 0,
      }
    })

    const totals = {
      total_leads: leads.length,
      total_matriculados: leads.filter((l) => l.status === 'Matriculado').length,
      total_activities_planned: activities.length,
      total_activities_completed: activities.filter((a) => a.status === 'terminada').length,
      reports_submitted: reports.length,
      total_employees: employees.length,
      total_contracts: contracts.length,
      duplicate_pairs_count: dupPairs.length,
    }

    // Annotate leads with employee names and source label
    const leadsAnnotated = allLeads.map((l) => ({
      ...l,
      employee_name: empNameMap.get(l.assigned_to as string) ?? '—',
      source_label: leadSource(l),
    }))

    return NextResponse.json({ month, totals, employees: employeeStats, leads: leadsAnnotated, duplicate_pairs: dupPairs })
  } catch (err) {
    console.error('[admin/summary] error:', err)
    return NextResponse.json({ error: 'Error interno.' }, { status: 500 })
  }
}
