import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const {
      nombre,
      apellido,
      email,
      telefono,
      campus,
      programa_interes,
      horario,
      source,
      utm_source,
      utm_medium,
      utm_campaign,
      page_source,
    } = body

    // Validate required fields
    if (!nombre || typeof nombre !== 'string' || nombre.trim().length < 2) {
      return NextResponse.json(
        { success: false, error: 'El nombre es requerido.' },
        { status: 400 }
      )
    }

    if (!apellido || typeof apellido !== 'string' || apellido.trim().length < 2) {
      return NextResponse.json(
        { success: false, error: 'El apellido es requerido.' },
        { status: 400 }
      )
    }

    if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Por favor ingresa un correo electrónico válido.' },
        { status: 400 }
      )
    }

    if (!telefono || typeof telefono !== 'string' || telefono.trim().length < 7) {
      return NextResponse.json(
        { success: false, error: 'Por favor ingresa un número de teléfono válido.' },
        { status: 400 }
      )
    }

    // Sanitize inputs
    const sanitizedLead = {
      nombre: nombre.trim().slice(0, 100),
      apellido: apellido.trim().slice(0, 100),
      email: email.trim().toLowerCase().slice(0, 254),
      telefono: telefono.trim().slice(0, 20),
      campus: typeof campus === 'string' ? campus.trim().slice(0, 100) : null,
      programa_interes: typeof programa_interes === 'string' ? programa_interes.trim().slice(0, 200) : null,
      horario: typeof horario === 'string' ? horario.trim().slice(0, 50) : null,
      source: typeof source === 'string' ? source.trim().slice(0, 200) : 'direct',
      utm_source: typeof utm_source === 'string' ? utm_source.trim().slice(0, 100) : null,
      utm_medium: typeof utm_medium === 'string' ? utm_medium.trim().slice(0, 100) : null,
      utm_campaign: typeof utm_campaign === 'string' ? utm_campaign.trim().slice(0, 200) : null,
      page_source: typeof page_source === 'string' ? page_source.trim().slice(0, 500) : null,
      status: 'new' as const,
    }

    // Skip DB insert if Supabase credentials are not configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey)
      const { data: insertedLead, error } = await supabase
        .from('leads')
        .insert(sanitizedLead)
        .select('id')
        .single()
      if (error) {
        console.error('Supabase insert error:', error)
        return NextResponse.json(
          { success: false, error: 'Error al guardar la información. Por favor intenta de nuevo.' },
          { status: 500 }
        )
      }
      return NextResponse.json({ success: true, lead_id: insertedLead?.id ?? null }, { status: 201 })
    } else {
      // Log lead to console in dev when DB is not configured
      console.log('[Lead captured - no DB configured]', sanitizedLead)
    }

    return NextResponse.json({ success: true, lead_id: null }, { status: 201 })
  } catch (err) {
    console.error('API route error:', err)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor.' },
      { status: 500 }
    )
  }
}
