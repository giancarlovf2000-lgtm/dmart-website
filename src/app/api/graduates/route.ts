import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data, error } = await supabase
      .from('graduate_profiles')
      .select('id, full_name, program, campus, specialty, bio, photo_url, graduation_date, created_at')
      .eq('available', true)
      .eq('consent_given', true)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[/api/graduates GET]', error)
      return NextResponse.json({ error: 'Error al obtener egresados.' }, { status: 500 })
    }

    return NextResponse.json({ graduates: data ?? [] })
  } catch (err) {
    console.error('[/api/graduates GET] unexpected:', err)
    return NextResponse.json({ error: 'Error interno.' }, { status: 500 })
  }
}
