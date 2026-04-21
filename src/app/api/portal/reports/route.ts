import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerSupabase } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function calcScore(leads: number, enrolled: number): 'deficiente' | 'basico' | 'bueno' | 'excelente' {
  if (leads >= 200 && enrolled >= 20) return 'excelente'
  if (leads >= 150 && enrolled >= 15) return 'bueno'
  if (leads >= 100 && enrolled >= 10) return 'basico'
  return 'deficiente'
}

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const month = searchParams.get('month')

  const admin = getAdminClient()
  let query = admin
    .from('monthly_reports')
    .select('*')
    .eq('employee_id', user.id)
    .order('month', { ascending: false })

  if (month) query = query.eq('month', month)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: 'Error al obtener reportes.' }, { status: 500 })
  return NextResponse.json({ reports: data ?? [] })
}

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })

  const body = await request.json()
  const { month, report_type, leads_acquired, leads_contacted, leads_enrolled, notes, auto_calculate } = body

  if (!month) return NextResponse.json({ error: 'El mes es requerido.' }, { status: 400 })
  if (!['planning', 'performance'].includes(report_type))
    return NextResponse.json({ error: 'Tipo de reporte inválido.' }, { status: 400 })

  const admin = getAdminClient()

  let finalLeads = leads_acquired ?? null
  let finalEnrolled = leads_enrolled ?? null
  let finalContacted = leads_contacted ?? null
  let performanceScore: string | null = null
  let activitiesCompleted: number | null = null

  if (auto_calculate && report_type === 'performance') {
    // Month range: first to last day
    const monthStart = month // e.g. '2026-04-01'
    const d = new Date(monthStart + 'T00:00:00')
    d.setMonth(d.getMonth() + 1)
    const monthEnd = d.toISOString().slice(0, 10)

    const [leadsRes, enrolledRes, activitiesRes] = await Promise.all([
      admin.from('leads')
        .select('id', { count: 'exact', head: true })
        .eq('assigned_to', user.id)
        .gte('created_at', monthStart)
        .lt('created_at', monthEnd),
      admin.from('leads')
        .select('id', { count: 'exact', head: true })
        .eq('assigned_to', user.id)
        .eq('status', 'Matriculado')
        .gte('created_at', monthStart)
        .lt('created_at', monthEnd),
      admin.from('activities')
        .select('id', { count: 'exact', head: true })
        .eq('employee_id', user.id)
        .eq('status', 'terminada')
        .eq('month', monthStart),
    ])

    finalLeads = leadsRes.count ?? 0
    finalEnrolled = enrolledRes.count ?? 0
    activitiesCompleted = activitiesRes.count ?? 0
    performanceScore = calcScore(finalLeads, finalEnrolled)
  } else if (report_type === 'performance' && finalLeads !== null && finalEnrolled !== null) {
    performanceScore = calcScore(finalLeads, finalEnrolled)
  }

  const { data, error } = await admin
    .from('monthly_reports')
    .upsert({
      employee_id: user.id,
      month,
      report_type,
      leads_acquired: finalLeads,
      leads_contacted: finalContacted,
      leads_enrolled: finalEnrolled,
      notes: notes?.trim() || null,
      performance_score: performanceScore,
      activities_completed: activitiesCompleted,
    }, { onConflict: 'employee_id,month,report_type' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: 'Error al guardar el reporte.' }, { status: 500 })
  return NextResponse.json({ report: data }, { status: 201 })
}

// GET auto-calculate data for preview without saving
export async function PUT(request: NextRequest) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })

  const body = await request.json()
  const { month } = body
  if (!month) return NextResponse.json({ error: 'El mes es requerido.' }, { status: 400 })

  const admin = getAdminClient()
  const monthStart = month
  const d = new Date(monthStart + 'T00:00:00')
  d.setMonth(d.getMonth() + 1)
  const monthEnd = d.toISOString().slice(0, 10)

  const [leadsRes, enrolledRes, activityLeadsRes, activitiesRes] = await Promise.all([
    admin.from('leads')
      .select('id', { count: 'exact', head: true })
      .eq('assigned_to', user.id)
      .gte('created_at', monthStart)
      .lt('created_at', monthEnd),
    admin.from('leads')
      .select('id', { count: 'exact', head: true })
      .eq('assigned_to', user.id)
      .eq('status', 'Matriculado')
      .gte('created_at', monthStart)
      .lt('created_at', monthEnd),
    admin.from('leads')
      .select('id', { count: 'exact', head: true })
      .eq('assigned_to', user.id)
      .not('activity_id', 'is', null)
      .gte('created_at', monthStart)
      .lt('created_at', monthEnd),
    admin.from('activities')
      .select('id', { count: 'exact', head: true })
      .eq('employee_id', user.id)
      .eq('status', 'terminada')
      .eq('month', monthStart),
  ])

  const leads = leadsRes.count ?? 0
  const enrolled = enrolledRes.count ?? 0
  const actLeads = activityLeadsRes.count ?? 0
  const completed = activitiesRes.count ?? 0

  return NextResponse.json({
    leads_acquired: leads,
    leads_from_activities: actLeads,
    leads_manual: leads - actLeads,
    leads_enrolled: enrolled,
    activities_completed: completed,
    performance_score: calcScore(leads, enrolled),
  })
}
