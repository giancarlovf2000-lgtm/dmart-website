import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerSupabase } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })

  const body = await request.json()
  const admin = getAdminClient()

  // Verify ownership
  const { data: activity } = await admin
    .from('activities')
    .select('employee_id')
    .eq('id', params.id)
    .single()

  if (!activity || activity.employee_id !== user.id)
    return NextResponse.json({ error: 'No autorizado.' }, { status: 403 })

  const updates: Record<string, unknown> = {}
  if (body.actual_leads !== undefined) updates.actual_leads = parseInt(body.actual_leads, 10)
  if (body.name !== undefined) updates.name = body.name.trim()
  if (body.description !== undefined) updates.description = body.description?.trim() || null
  if (body.planned_leads !== undefined) updates.planned_leads = parseInt(body.planned_leads, 10)
  if (body.activity_date !== undefined) updates.activity_date = body.activity_date || null
  if (body.location !== undefined) updates.location = body.location?.trim() || null

  // Marking as terminada: auto-count leads with this activity_id
  if (body.status === 'terminada') {
    updates.status = 'terminada'
    const { count } = await admin
      .from('leads')
      .select('id', { count: 'exact', head: true })
      .eq('activity_id', params.id)
    updates.actual_leads = count ?? 0
  }

  const { data, error } = await admin
    .from('activities')
    .update(updates)
    .eq('id', params.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: 'Error al actualizar la actividad.' }, { status: 500 })
  return NextResponse.json({ activity: data })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })

  const admin = getAdminClient()

  const { data: activity } = await admin
    .from('activities')
    .select('employee_id')
    .eq('id', params.id)
    .single()

  if (!activity || activity.employee_id !== user.id)
    return NextResponse.json({ error: 'No autorizado.' }, { status: 403 })

  const { error } = await admin.from('activities').delete().eq('id', params.id)
  if (error) return NextResponse.json({ error: 'Error al eliminar la actividad.' }, { status: 500 })
  return NextResponse.json({ success: true })
}
