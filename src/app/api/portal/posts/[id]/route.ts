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

// DELETE → elimina un post guardado (y su imagen del Storage si aplica).
export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const caller = await requireAdmin()
  if (!caller) return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })

  const admin = getAdminClient()

  // Intentar borrar la imagen del bucket (best-effort).
  const { data: post } = await admin
    .from('saved_posts')
    .select('image_url')
    .eq('id', params.id)
    .single()
  if (post?.image_url) {
    const marker = '/saved-post-images/'
    const idx = post.image_url.indexOf(marker)
    if (idx !== -1) {
      const path = post.image_url.slice(idx + marker.length)
      await admin.storage.from('saved-post-images').remove([path])
    }
  }

  const { error } = await admin.from('saved_posts').delete().eq('id', params.id)
  if (error) return NextResponse.json({ error: 'Error al eliminar el post.' }, { status: 500 })
  return NextResponse.json({ ok: true })
}
