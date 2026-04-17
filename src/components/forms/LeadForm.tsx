'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { User, Mail, Phone, MapPin, BookOpen, Clock, Send, AlertCircle } from 'lucide-react'
import Button from '@/components/ui/Button'
import { ALL_PROGRAMS, cn } from '@/lib/utils'
import type { LeadFormData } from '@/lib/types'

interface LeadFormProps {
  defaultProgram?: string
  defaultCampus?: string
  source?: string
  className?: string
  compact?: boolean
  title?: string
  subtitle?: string
}

const CAMPUSES = ['Barranquitas', 'Vega Alta', 'No tengo preferencia']
const HORARIOS = ['Diurno', 'Nocturno', 'Sabatino']

function getUTMParams() {
  if (typeof window === 'undefined') return {}
  const params = new URLSearchParams(window.location.search)
  return {
    utm_source: params.get('utm_source') ?? undefined,
    utm_medium: params.get('utm_medium') ?? undefined,
    utm_campaign: params.get('utm_campaign') ?? undefined,
  }
}

function getSource() {
  if (typeof window === 'undefined') return 'direct'
  const referrer = document.referrer
  if (!referrer) return 'direct'
  try {
    const url = new URL(referrer)
    return url.hostname
  } catch {
    return 'direct'
  }
}

export default function LeadForm({
  defaultProgram = '',
  defaultCampus = '',
  source,
  className,
  compact = false,
  title = 'Solicita Información',
  subtitle = 'Completa el formulario y un consejero se comunicará contigo.',
}: LeadFormProps) {
  const router = useRouter()
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [formData, setFormData] = useState<LeadFormData>({
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    campus: defaultCampus,
    programa_interes: defaultProgram,
    horario: '',
  })

  const [utmData, setUtmData] = useState<{
    utm_source?: string
    utm_medium?: string
    utm_campaign?: string
  }>({})
  const [detectedSource, setDetectedSource] = useState('direct')

  useEffect(() => {
    setUtmData(getUTMParams())
    setDetectedSource(getSource())
  }, [])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    setErrorMsg('')

    const payload = {
      ...formData,
      source: source ?? detectedSource,
      page_source: typeof window !== 'undefined' ? window.location.pathname : '/',
      ...utmData,
    }

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error ?? 'Error al enviar el formulario. Por favor intenta de nuevo.')
      }

      router.push('/gracias')
    } catch (err) {
      setStatus('error')
      setErrorMsg(err instanceof Error ? err.message : 'Error inesperado. Por favor intenta de nuevo.')
    }
  }

  const inputClass = 'form-input'
  const labelClass = 'form-label'

  return (
    <div className={cn('bg-white rounded-2xl shadow-card', compact ? 'p-6' : 'p-8 md:p-10', className)}>
      {/* Header */}
      {(title || subtitle) && (
        <div className="mb-6">
          {title && (
            <h3 className={cn('font-bold text-navy', compact ? 'text-xl' : 'text-2xl md:text-3xl')}>
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="text-gray-500 text-sm mt-1">{subtitle}</p>
          )}
        </div>
      )}

      {/* Error state */}
      {status === 'error' && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex gap-3">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{errorMsg}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div className={cn('grid gap-4', compact ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2')}>
          {/* Nombre */}
          <div>
            <label htmlFor="nombre" className={labelClass}>
              Nombre <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                id="nombre"
                name="nombre"
                type="text"
                required
                value={formData.nombre}
                onChange={handleChange}
                placeholder="Tu nombre"
                className={cn(inputClass, 'pl-10')}
                autoComplete="given-name"
              />
            </div>
          </div>

          {/* Apellido */}
          <div>
            <label htmlFor="apellido" className={labelClass}>
              Apellido <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                id="apellido"
                name="apellido"
                type="text"
                required
                value={formData.apellido}
                onChange={handleChange}
                placeholder="Tu apellido"
                className={cn(inputClass, 'pl-10')}
                autoComplete="family-name"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className={labelClass}>
              Correo Electrónico <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="tucorreo@email.com"
                className={cn(inputClass, 'pl-10')}
                autoComplete="email"
              />
            </div>
          </div>

          {/* Telefono */}
          <div>
            <label htmlFor="telefono" className={labelClass}>
              Teléfono <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                id="telefono"
                name="telefono"
                type="tel"
                required
                value={formData.telefono}
                onChange={handleChange}
                placeholder="(787) 000-0000"
                className={cn(inputClass, 'pl-10')}
                autoComplete="tel"
              />
            </div>
          </div>

          {/* Campus */}
          <div>
            <label htmlFor="campus" className={labelClass}>
              Recinto de Interés
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              <select
                id="campus"
                name="campus"
                value={formData.campus}
                onChange={handleChange}
                className={cn(inputClass, 'pl-10 appearance-none cursor-pointer')}
              >
                <option value="">Seleccionar recinto…</option>
                {CAMPUSES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Horario */}
          <div>
            <label htmlFor="horario" className={labelClass}>
              Horario Preferido
            </label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              <select
                id="horario"
                name="horario"
                value={formData.horario}
                onChange={handleChange}
                className={cn(inputClass, 'pl-10 appearance-none cursor-pointer')}
              >
                <option value="">Seleccionar horario…</option>
                {HORARIOS.map((h) => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Programa de interés */}
          <div className={compact ? '' : 'md:col-span-2'}>
            <label htmlFor="programa_interes" className={labelClass}>
              Programa de Interés
            </label>
            <div className="relative">
              <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              <select
                id="programa_interes"
                name="programa_interes"
                value={formData.programa_interes}
                onChange={handleChange}
                className={cn(inputClass, 'pl-10 appearance-none cursor-pointer')}
              >
                <option value="">Seleccionar programa…</option>
                {ALL_PROGRAMS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Privacy note */}
        <p className="text-xs text-gray-400 mt-4 leading-relaxed">
          Al enviar este formulario, autorizas a D'Mart Institute a contactarte con información sobre nuestros programas.
          Tu información es confidencial y no será compartida con terceros.
        </p>

        {/* Submit */}
        <div className="mt-6">
          <Button
            type="submit"
            variant="gold"
            size="lg"
            fullWidth
            loading={status === 'loading'}
            className="text-base"
          >
            <Send className="h-5 w-5" />
            {status === 'loading' ? 'Enviando…' : 'Solicitar Información Gratis'}
          </Button>
        </div>
      </form>
    </div>
  )
}
