import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerSupabase } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
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
  const { month, report_type, leads_acquired, leads_contacted, leads_enrolled, notes } = body

  if (!month) return NextResponse.json({ error: 'El mes es requerido.' }, { status: 400 })
  if (!['planning', 'performance'].includes(report_type))
    return NextResponse.json({ error: 'Tipo de reporte inválido.' }, { status: 400 })

  const admin = getAdminClient()
  const { data, error } = await admin
    .from('monthly_reports')
    .upsert({
      employee_id: user.id,
      month,
      report_type,
      leads_acquired: leads_acquired ?? null,
      leads_contacted: leads_contacted ?? null,
      leads_enrolled: leads_enrolled ?? null,
      notes: notes?.trim() || null,
    }, { onConflict: 'employee_id,month,report_type' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: 'Error al guardar el reporte.' }, { status: 500 })
  return NextResponse.json({ report: data }, { status: 201 })
}
