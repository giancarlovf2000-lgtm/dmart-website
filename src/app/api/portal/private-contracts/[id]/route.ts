import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerSupabase } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

function getAdminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

async function getEmployee() {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const admin = getAdminClient()
  const { data: emp } = await admin.from('employees').select('id, role, campus').eq('id', user.id).eq('active', true).single()
  if (!emp) return null
  return { user, emp, admin }
}

// Devuelve el HTML guardado de un contrato para reabrirlo, con control de acceso por rol.
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await getEmployee()
  if (!auth) return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })
  const { user, emp, admin } = auth

  const { data: contract } = await admin
    .from('private_contracts')
    .select('id, employee_id, contract_html')
    .eq('id', params.id)
    .single()

  if (!contract) return NextResponse.json({ error: 'Contrato no encontrado.' }, { status: 404 })

  // Verificar acceso: admin todos; supervisor su equipo; director su recinto; resto el propio.
  let allowed = false
  if (emp.role === 'admin') {
    allowed = true
  } else if (contract.employee_id === user.id) {
    allowed = true
  } else if (emp.role === 'supervisor') {
    const { data: m } = await admin.from('employees').select('id').eq('id', contract.employee_id).eq('supervisor_id', user.id).single()
    allowed = !!m
  } else if (emp.role === 'director') {
    const { data: m } = await admin.from('employees').select('id').eq('id', contract.employee_id).contains('campus', emp.campus as string[]).single()
    allowed = !!m
  }

  if (!allowed) return NextResponse.json({ error: 'No autorizado.' }, { status: 403 })

  return NextResponse.json({ contract_html: contract.contract_html ?? null })
}
