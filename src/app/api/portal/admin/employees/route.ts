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

export async function GET() {
  const supabase = await createServerSupabase()
  const user = await requireAdmin(supabase)
  if (!user) return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })

  const admin = getAdminClient()

  // Get employees with current-month lead counts
  const monthStart = new Date()
  monthStart.setDate(1)
  monthStart.setHours(0, 0, 0, 0)

  const { data: employees, error } = await admin
    .from('employees')
    .select('*')
    .order('full_name')

  if (error) return NextResponse.json({ error: 'Error al obtener empleados.' }, { status: 500 })

  // Get lead counts per employee this month
  const { data: leadCounts } = await admin
    .from('leads')
    .select('assigned_to')
    .gte('created_at', monthStart.toISOString())
    .not('assigned_to', 'is', null)

  const countMap: Record<string, number> = {}
  leadCounts?.forEach((l) => {
    if (l.assigned_to) countMap[l.assigned_to] = (countMap[l.assigned_to] ?? 0) + 1
  })

  const result = employees?.map((e) => ({
    ...e,
    leads_this_month: countMap[e.id] ?? 0,
  }))

  return NextResponse.json({ employees: result ?? [] })
}

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabase()
  const user = await requireAdmin(supabase)
  if (!user) return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })

  const body = await request.json()
  const { full_name, email, password, campus, role } = body

  if (!full_name?.trim()) return NextResponse.json({ error: 'El nombre es requerido.' }, { status: 400 })
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return NextResponse.json({ error: 'Correo inválido.' }, { status: 400 })
  if (!password || password.length < 8)
    return NextResponse.json({ error: 'La contraseña debe tener al menos 8 caracteres.' }, { status: 400 })
  if (!Array.isArray(campus) || campus.length === 0)
    return NextResponse.json({ error: 'Selecciona al menos un recinto.' }, { status: 400 })

  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Create auth user
  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email: email.trim().toLowerCase(),
    password,
    email_confirm: true,
  })

  if (authError || !authData.user) {
    console.error('Auth user creation error:', authError)
    return NextResponse.json(
      { error: authError?.message ?? 'Error al crear el usuario.' },
      { status: 500 }
    )
  }

  // Create employee profile
  const { data: employee, error: empError } = await adminClient
    .from('employees')
    .insert({
      id: authData.user.id,
      full_name: full_name.trim(),
      campus,
      role: role === 'admin' ? 'admin' : 'empleado',
    })
    .select()
    .single()

  if (empError) {
    // Rollback: delete the auth user we just created
    await adminClient.auth.admin.deleteUser(authData.user.id)
    console.error('Employee insert error:', empError)
    return NextResponse.json({ error: 'Error al crear el perfil del empleado.' }, { status: 500 })
  }

  return NextResponse.json({ employee }, { status: 201 })
}
