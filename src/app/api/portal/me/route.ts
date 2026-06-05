import { NextResponse } from 'next/server'
import { createClient as createServerSupabase } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })

  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data: emp } = await admin
    .from('employees')
    .select('id, full_name, role, campus')
    .eq('id', user.id)
    .eq('active', true)
    .single()

  if (!emp) return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })
  return NextResponse.json({ employee: emp })
}
