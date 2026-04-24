import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerSupabase } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })

    const admin = getAdminClient()

    const body = await request.json()
    const {
      lead_id, full_name, program, campus, specialty, bio,
      photo_url, graduation_date, consent_given, consent_date,
    } = body

    if (!lead_id || !full_name || !program) {
      return NextResponse.json({ error: 'lead_id, full_name y program son requeridos.' }, { status: 400 })
    }

    // Upsert so re-submitting doesn't fail if record already exists
    const { data, error } = await admin
      .from('graduate_profiles')
      .upsert({
        lead_id,
        full_name,
        program,
        campus: campus ?? null,
        specialty: specialty ?? null,
        bio: bio ?? null,
        photo_url: photo_url ?? null,
        graduation_date: graduation_date ?? null,
        consent_given: consent_given ?? false,
        consent_date: consent_date ?? null,
        created_by: user.id,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'lead_id' })
      .select()
      .single()

    if (error) {
      console.error('[portal/graduates POST]', error)
      return NextResponse.json({ error: 'Error al crear el perfil.' }, { status: 500 })
    }

    return NextResponse.json({ graduate: data }, { status: 201 })
  } catch (err) {
    console.error('[portal/graduates POST] unexpected:', err)
    return NextResponse.json({ error: 'Error interno.' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const supabase = await createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })

    const admin = getAdminClient()
    const { data, error } = await admin
      .from('graduate_profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ error: 'Error al obtener perfiles.' }, { status: 500 })

    return NextResponse.json({ graduates: data ?? [] })
  } catch (err) {
    console.error('[portal/graduates GET] unexpected:', err)
    return NextResponse.json({ error: 'Error interno.' }, { status: 500 })
  }
}
