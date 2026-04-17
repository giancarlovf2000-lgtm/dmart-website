import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerSupabase } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createServerSupabase()
  const user = await requireAdmin(supabase)
  if (!user) return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })

  const body = await request.json()
  const admin = getAdminClient()

  const updates: Record<string, unknown> = {}
  if (body.full_name !== undefined) updates.full_name = body.full_name.trim()
  if (body.campus !== undefined) updates.campus = body.campus
  if (body.role !== undefined) updates.role = body.role
  if (body.active !== undefined) updates.active = body.active

  const { data, error } = await admin
    .from('employees')
    .update(updates)
    .eq('id', params.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: 'Error al actualizar el empleado.' }, { status: 500 })
  return NextResponse.json({ employee: data })
}
