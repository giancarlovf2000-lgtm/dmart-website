import { NextResponse } from 'next/server'
import { createClient as createServerSupabase } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET() {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })

  const admin = getAdminClient()

  // Verify admin role
  const { data: employee } = await admin.from('employees').select('role').eq('id', user.id).single()
  if (!employee || employee.role !== 'admin')
    return NextResponse.json({ error: 'No autorizado.' }, { status: 403 })

  // Fetch all performance reports with employee name
  const { data: reports, error } = await admin
    .from('monthly_reports')
    .select('*, employees(full_name, campus)')
    .eq('report_type', 'performance')
    .order('month', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: 'Error al obtener los informes.' }, { status: 500 })

  return NextResponse.json({ reports: reports ?? [] })
}
