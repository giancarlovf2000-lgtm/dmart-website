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

// GET → posts guardados. Filtros: ?calendar_id=… , ?limit=…
export async function GET(request: NextRequest) {
  const caller = await requireAdmin()
  if (!caller) return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const calendarId = searchParams.get('calendar_id')
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '0', 10) || 0, 200)

  const admin = getAdminClient()
  let query = admin
    .from('saved_posts')
    .select('id, calendar_id, post_date, title, config, image_url, created_at')

  if (calendarId) {
    query = query.eq('calendar_id', calendarId).order('post_date', { ascending: true })
  } else {
    query = query.order('created_at', { ascending: false })
  }
  if (limit) query = query.limit(limit)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: 'Error al obtener los posts.' }, { status: 500 })
  return NextResponse.json({ posts: data ?? [] })
}

// POST → guardar un post { calendar_id, post_date, title, config, image_url }
export async function POST(request: NextRequest) {
  const caller = await requireAdmin()
  if (!caller) return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })

  const body = await request.json().catch(() => null)
  const calendarId = typeof body?.calendar_id === 'string' ? body.calendar_id : null
  const postDate = typeof body?.post_date === 'string' ? body.post_date.trim() : ''
  const title = typeof body?.title === 'string' ? body.title.trim().slice(0, 200) : null
  const config = body?.config
  const imageUrl = typeof body?.image_url === 'string' ? body.image_url : null

  if (!calendarId) return NextResponse.json({ error: 'Selecciona un calendario.' }, { status: 400 })
  if (!/^\d{4}-\d{2}-\d{2}$/.test(postDate))
    return NextResponse.json({ error: 'Fecha inválida.' }, { status: 400 })
  if (!config || typeof config !== 'object')
    return NextResponse.json({ error: 'Contenido inválido.' }, { status: 400 })

  const admin = getAdminClient()
  const { data, error } = await admin
    .from('saved_posts')
    .insert({
      calendar_id: calendarId,
      post_date: postDate,
      title,
      config,
      image_url: imageUrl,
      created_by: caller.id,
    })
    .select('id, calendar_id, post_date, title, config, image_url, created_at')
    .single()
  if (error) return NextResponse.json({ error: 'Error al guardar el post.' }, { status: 500 })

  return NextResponse.json({ post: data })
}
