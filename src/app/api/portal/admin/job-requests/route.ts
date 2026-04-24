import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerSupabase } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function requireAdmin() {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const admin = getAdminClient()
  const { data: emp } = await admin.from('employees').select('role').eq('id', user.id).single()
  if (!emp || emp.role !== 'admin') return null
  return { user, admin }
}

export async function GET() {
  try {
    const ctx = await requireAdmin()
    if (!ctx) return NextResponse.json({ error: 'No autorizado.' }, { status: 403 })

    const { data: requests, error } = await ctx.admin
      .from('job_requests')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ error: 'Error al obtener solicitudes.' }, { status: 500 })

    // Fetch graduate names separately to avoid join issues
    const gradIds = Array.from(new Set((requests ?? []).map((r) => r.graduate_id).filter(Boolean)))
    const gradMap = new Map<string, { full_name: string; program: string }>()
    if (gradIds.length > 0) {
      const { data: grads } = await ctx.admin
        .from('graduate_profiles')
        .select('id, full_name, program')
        .in('id', gradIds)
      ;(grads ?? []).forEach((g) => gradMap.set(g.id, { full_name: g.full_name, program: g.program }))
    }

    const result = (requests ?? []).map((r) => ({
      ...r,
      graduate: gradMap.get(r.graduate_id) ?? null,
    }))

    return NextResponse.json({ requests: result })
  } catch (err) {
    console.error('[admin/job-requests GET]', err)
    return NextResponse.json({ error: 'Error interno.' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const ctx = await requireAdmin()
    if (!ctx) return NextResponse.json({ error: 'No autorizado.' }, { status: 403 })

    const { id, status, notes } = await request.json()
    if (!id) return NextResponse.json({ error: 'ID requerido.' }, { status: 400 })

    const VALID = ['pendiente', 'en_proceso', 'completado', 'cancelado']
    if (status && !VALID.includes(status))
      return NextResponse.json({ error: 'Estado inválido.' }, { status: 400 })

    const updates: Record<string, unknown> = {}
    if (status) updates.status = status
    if (notes !== undefined) updates.notes = notes

    const { error } = await ctx.admin.from('job_requests').update(updates).eq('id', id)
    if (error) return NextResponse.json({ error: 'Error al actualizar.' }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[admin/job-requests PATCH]', err)
    return NextResponse.json({ error: 'Error interno.' }, { status: 500 })
  }
}
