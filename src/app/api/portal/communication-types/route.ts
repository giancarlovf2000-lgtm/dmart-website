import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerSupabase } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function getAuthenticatedEmployee(supabase: Awaited<ReturnType<typeof createServerSupabase>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const admin = getAdminClient()
  const { data: employee } = await admin
    .from('employees')
    .select('id, active')
    .eq('id', user.id)
    .single()
  if (!employee || !employee.active) return null
  return { user, admin }
}

// Lista de tipos de seguimiento (comunicación). Editable solo agregando.
export async function GET() {
  const supabase = await createServerSupabase()
  const auth = await getAuthenticatedEmployee(supabase)
  if (!auth) return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })

  const { data, error } = await auth.admin
    .from('communication_types')
    .select('id, name')
    .order('name')

  if (error) return NextResponse.json({ error: 'Error al obtener los tipos.' }, { status: 500 })
  return NextResponse.json({ types: data ?? [] })
}

// Agregar un nuevo tipo. Cualquier empleado puede crear; nadie edita ni borra.
export async function POST(request: NextRequest) {
  const supabase = await createServerSupabase()
  const auth = await getAuthenticatedEmployee(supabase)
  if (!auth) return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })

  const body = await request.json()
  const name = String(body.name ?? '').trim().slice(0, 50)
  if (name.length < 2)
    return NextResponse.json({ error: 'El nombre del tipo es muy corto.' }, { status: 400 })

  // Evitar duplicados case-insensitive
  const { data: existing } = await auth.admin
    .from('communication_types')
    .select('id, name')
    .ilike('name', name)
    .maybeSingle()
  if (existing)
    return NextResponse.json({ type: existing, existed: true })

  const { data, error } = await auth.admin
    .from('communication_types')
    .insert({ name, created_by: auth.user.id })
    .select('id, name')
    .single()

  if (error) return NextResponse.json({ error: 'Error al crear el tipo.' }, { status: 500 })
  return NextResponse.json({ type: data }, { status: 201 })
}
