import { NextRequest, NextResponse } from 'next/server'

const VAPI_API_URL = 'https://api.vapi.ai/call/phone'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { lead_id, nombre, telefono, programa_interes, campus } = body

    if (!telefono) {
      return NextResponse.json({ success: false, error: 'Número de teléfono requerido.' }, { status: 400 })
    }

    const vapiKey = process.env.VAPI_PRIVATE_KEY
    if (!vapiKey) {
      console.warn('VAPI_PRIVATE_KEY not configured — skipping call')
      return NextResponse.json({ success: true, skipped: true })
    }

    // Format Puerto Rico phone number
    const raw = telefono.replace(/\D/g, '')
    const e164 = raw.startsWith('1') ? `+${raw}` : raw.length === 10 ? `+1${raw}` : `+${raw}`

    // Build assistant config inline (no pre-created assistant needed)
    const assistantConfig = {
      model: {
        provider: 'openai',
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Eres una asistente de admisiones de D'Mart Institute, una institución vocacional acreditada en Puerto Rico con recintos en Barranquitas y Vega Alta.

Tu nombre es Sofia y hablas únicamente en español, con un tono cálido, profesional y motivador.

INFORMACIÓN DEL CANDIDATO:
- Nombre: ${nombre || 'estudiante'}
- Programa de interés: ${programa_interes || 'programas vocacionales'}
- Recinto preferido: ${campus || 'cualquier recinto'}

TU OBJETIVO:
1. Presentarte y confirmar que la persona solicitó información sobre D'Mart Institute
2. Responder preguntas sobre el programa de interés
3. Explicar brevemente el proceso de admisión (5 pasos: formulario → consejero → documentos → FAFSA → clases)
4. Mencionar que hay ayuda económica disponible (FAFSA/Pell Grant)
5. Invitar al candidato a visitar el recinto o hablar con un consejero
6. Si muestran interés, confirmar sus datos de contacto

INFORMACIÓN DE PROGRAMAS:
- Todos los programas principales duran 56 semanas aproximadamente
- Horarios: Diurno y Nocturno disponibles
- Ayuda económica federal disponible (FAFSA/Pell Grant)
- Acreditados por ACCSC, Departamento de Educación de PR y Junta de Instituciones Postsecundarias

RECINTOS:
- Barranquitas: Urb. San Cristóbal #12 Calle B, Zona Industrial. Tel: (787) 857-6929
- Vega Alta: Centro Gran Caribe, Ave. Luis Meléndez Class. Tel: (787) 883-8180
- Horario de oficina: Lunes-Jueves 8am-10pm, Viernes 8am-5pm, Sábado 8am-12pm

REGLAS IMPORTANTES:
- NO menciones precios ni costos de matrícula
- NO inventes información que no tienes
- Si no sabes algo, di que un consejero le llamará con más detalles
- Mantén la llamada entre 3-5 minutos
- Si no contestan, NO dejes mensaje de voz extenso, solo di que llamarás de nuevo

INICIO DE LLAMADA:
Comienza diciendo: "Hola, ¿hablo con ${nombre || 'el candidato'}? Le llamo de parte de D'Mart Institute. Mi nombre es Sofía. Nos comunicamos porque usted solicitó información sobre [programa]. ¿Tiene un momento para hablar?"`,
          },
        ],
        temperature: 0.7,
        maxTokens: 250,
      },
      voice: {
        provider: 'azure',
        voiceId: 'es-PR-KarinaNeural',
      },
      firstMessage: `Hola, ¿hablo con ${nombre || 'el candidato'}? Le llamo de parte de D'Mart Institute. Mi nombre es Sofía. Nos comunicamos porque usted solicitó información sobre ${programa_interes || 'nuestros programas'}. ¿Tiene un momento para hablar?`,
      endCallMessage: 'Muchas gracias por su tiempo. Un consejero estará en contacto con usted pronto. ¡Que tenga un excelente día!',
      endCallPhrases: ['adiós', 'hasta luego', 'gracias adiós', 'no me interesa', 'llámame después', 'estoy ocupado'],
      recordingEnabled: true,
      transcriber: {
        provider: 'deepgram',
        language: 'es',
        model: 'nova-2',
      },
      serverUrl: process.env.NEXT_PUBLIC_SITE_URL
        ? `${process.env.NEXT_PUBLIC_SITE_URL}/api/calls/webhook`
        : undefined,
    }

    const payload = {
      phoneNumberId: process.env.VAPI_PHONE_NUMBER_ID,
      customer: {
        number: e164,
        name: nombre || undefined,
      },
      assistant: assistantConfig,
      metadata: {
        lead_id: lead_id || null,
        nombre,
        programa_interes,
        campus,
      },
    }

    const response = await fetch(VAPI_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${vapiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    const vapiData = await response.json()

    if (!response.ok) {
      console.error('Vapi error status:', response.status, 'body:', JSON.stringify(vapiData))
      console.error('Vapi payload sent:', JSON.stringify({ ...payload, assistant: '...' }))
      return NextResponse.json({ success: false, error: 'Error al iniciar la llamada.', detail: vapiData }, { status: 500 })
    }

    console.log('Vapi call initiated successfully:', vapiData.id, 'to:', e164)

    // Save call record to Supabase if configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (supabaseUrl && supabaseKey) {
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(supabaseUrl, supabaseKey)
      await supabase.from('calls').insert({
        lead_id: lead_id || null,
        vapi_call_id: vapiData.id,
        phone_number: e164,
        nombre,
        programa_interes,
        campus,
        status: 'initiated',
      })
      if (lead_id) {
        await supabase.from('leads').update({
          call_status: 'called',
          last_called_at: new Date().toISOString(),
        }).eq('id', lead_id)
      }
    }

    return NextResponse.json({ success: true, call_id: vapiData.id })
  } catch (err) {
    console.error('Call initiation error:', err)
    return NextResponse.json({ success: false, error: 'Error interno.' }, { status: 500 })
  }
}
