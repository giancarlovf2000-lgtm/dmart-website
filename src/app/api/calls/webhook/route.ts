import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message } = body

    if (!message) return NextResponse.json({ received: true })

    const { type, call } = message

    console.log('[Vapi webhook]', type, call?.id)

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ received: true })
    }

    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()

    if (type === 'status-update' && call?.id) {
      const status = call.status // queued, ringing, in-progress, forwarding, ended
      await supabase
        .from('calls')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('vapi_call_id', call.id)
    }

    if (type === 'end-of-call-report' && call?.id) {
      const update: Record<string, unknown> = {
        status: 'completed',
        updated_at: new Date().toISOString(),
        ended_reason: call.endedReason ?? null,
        duration_seconds: call.duration ?? null,
        recording_url: call.recordingUrl ?? null,
        cost_usd: call.cost ?? null,
      }

      // Save transcript
      if (message.transcript) {
        update.transcript = message.transcript
      }

      // Save summary if available
      if (message.summary) {
        update.summary = message.summary
      }

      // Determine outcome from ended reason
      const endedReason: string = call.endedReason ?? ''
      if (endedReason.includes('customer-ended') || endedReason.includes('assistant-ended')) {
        update.outcome = 'completed'
      } else if (endedReason.includes('no-answer') || endedReason.includes('busy')) {
        update.outcome = 'no_answer'
      } else if (endedReason.includes('voicemail')) {
        update.outcome = 'voicemail'
      } else {
        update.outcome = 'error'
      }

      await supabase
        .from('calls')
        .update(update)
        .eq('vapi_call_id', call.id)

      // Update lead status
      if (call.metadata?.lead_id) {
        await supabase
          .from('leads')
          .update({ call_status: 'completed' })
          .eq('id', call.metadata.lead_id)
      }
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error('[Vapi webhook error]', err)
    return NextResponse.json({ received: true }) // Always return 200 to Vapi
  }
}
