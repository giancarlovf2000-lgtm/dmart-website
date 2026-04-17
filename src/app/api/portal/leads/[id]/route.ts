import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerSupabase } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })

  const admin = getAdminClient()

  const { data: employee } = await admin
    .from('employees')
    .select('id, role')
    .eq('id', user.id)
    .single()

  if (!employee) return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })

  const { data: lead, error: leadError } = await admin
    .from('leads')
    .select('*, employee:assigned_to(full_name), activity:activity_id(name)')
    .eq('id', params.id)
    .single()

  if (leadError || !lead)
    return NextResponse.json({ error: 'Lead no encontrado.' }, { status: 404 })

  // Employees can only see their own leads
  if (employee.role !== 'admin' && lead.assigned_to !== user.id)
    return NextResponse.json({ error: 'No autorizado.' }, { status: 403 })

  const { data: history } = await admin
    .from('lead_history')
    .select('*, employee:employee_id(full_name)')
    .eq('lead_id', params.id)
    .order('created_at', { ascending: false })

  return NextResponse.json({ lead, history: history ?? [] })
}
