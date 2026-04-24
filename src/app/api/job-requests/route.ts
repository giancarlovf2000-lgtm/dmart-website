import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { graduate_id, client_name, client_email, client_phone, service_description, preferred_date } = body

    if (!graduate_id || !client_name?.trim() || !client_email?.trim() ||
        !client_phone?.trim() || !service_description?.trim()) {
      return NextResponse.json({ error: 'Todos los campos requeridos deben estar completos.' }, { status: 400 })
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(client_email)) {
      return NextResponse.json({ error: 'Por favor ingresa un correo electrónico válido.' }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { error } = await supabase.from('job_requests').insert({
      graduate_id,
      client_name: client_name.trim().slice(0, 200),
      client_email: client_email.trim().toLowerCase().slice(0, 254),
      client_phone: client_phone.trim().slice(0, 30),
      service_description: service_description.trim().slice(0, 1000),
      preferred_date: preferred_date || null,
    })

    if (error) {
      console.error('[/api/job-requests POST]', error)
      return NextResponse.json({ error: 'Error al enviar la solicitud.' }, { status: 500 })
    }

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (err) {
    console.error('[/api/job-requests POST] unexpected:', err)
    return NextResponse.json({ error: 'Error interno.' }, { status: 500 })
  }
}
