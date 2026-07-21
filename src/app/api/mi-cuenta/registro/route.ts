import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getAdminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

// Registro público de estudiantes/profesores con acceso inmediato (email_confirm: true).
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  const fullName = typeof body?.full_name === 'string' ? body.full_name.trim().slice(0, 120) : ''
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase().slice(0, 160) : ''
  const password = typeof body?.password === 'string' ? body.password : ''
  const type = body?.type === 'profesor' ? 'profesor' : 'estudiante'
  const programa = typeof body?.programa === 'string' ? body.programa.trim().slice(0, 120) || null : null
  const campus = typeof body?.campus === 'string' ? body.campus.trim().slice(0, 60) || null : null
  const phone = typeof body?.phone === 'string' ? body.phone.trim().slice(0, 40) || null : null

  if (fullName.length < 2) return NextResponse.json({ error: 'Escribe tu nombre completo.' }, { status: 400 })
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return NextResponse.json({ error: 'Correo electrónico inválido.' }, { status: 400 })
  if (password.length < 6) return NextResponse.json({ error: 'La contraseña debe tener al menos 6 caracteres.' }, { status: 400 })

  const admin = getAdminClient()

  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email, password, email_confirm: true,
    user_metadata: { full_name: fullName, contributor_type: type },
  })
  if (authError || !authData.user) {
    const msg = /already been registered|already exists/i.test(authError?.message ?? '')
      ? 'Ese correo ya tiene una cuenta. Inicia sesión.'
      : 'No se pudo crear la cuenta. Intenta de nuevo.'
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  const { error: profileError } = await admin.from('content_contributors').insert({
    id: authData.user.id,
    full_name: fullName,
    email,
    type,
    programa,
    campus,
    phone,
  })
  if (profileError) {
    // Rollback the auth user if the profile insert fails.
    await admin.auth.admin.deleteUser(authData.user.id)
    console.error('[registro] profile insert', profileError)
    return NextResponse.json({ error: 'No se pudo crear el perfil. Intenta de nuevo.' }, { status: 500 })
  }

  return NextResponse.json({ success: true }, { status: 201 })
}
