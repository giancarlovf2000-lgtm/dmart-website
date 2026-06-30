import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerSupabase } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

function getAdminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

async function requireAdmin() {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const admin = getAdminClient()
  const { data: emp } = await admin.from('employees').select('id, role').eq('id', user.id).single()
  if (!emp || emp.role !== 'admin') return null
  return emp
}

// DELETE → elimina un calendario y sus posts (ON DELETE CASCADE).
export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const caller = await requireAdmin()
  if (!caller) return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })

  const admin = getAdminClient()
  const { error } = await admin.from('post_calendars').delete().eq('id', params.id)
  if (error) return NextResponse.json({ error: 'Error al eliminar el calendario.' }, { status: 500 })
  return NextResponse.json({ ok: true })
}
