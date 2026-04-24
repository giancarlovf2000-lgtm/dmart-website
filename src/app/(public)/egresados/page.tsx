'use client'

import { useEffect, useState } from 'react'
import { GraduationCap, MapPin, Briefcase, X, AlertCircle, CheckCircle } from 'lucide-react'
import type { Metadata } from 'next'

// Note: metadata export can't be in a 'use client' component — SEO handled via layout/head
// For a future server-component version, move fetch to server and pass data as props.

interface Graduate {
  id: string
  full_name: string
  program: string
  campus: string | null
  specialty: string | null
  bio: string | null
  photo_url: string | null
  graduation_date: string | null
}

const STATUS_LABELS: Record<string, string> = {
  pendiente: 'Pendiente',
  en_proceso: 'En proceso',
  completado: 'Completado',
  cancelado: 'Cancelado',
}

const CAMPUS_COLORS: Record<string, string> = {
  'Barranquitas': 'bg-navy/10 text-navy',
  'Vega Alta':    'bg-gold/20 text-yellow-800',
}

function initials(name: string) {
  return name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase()
}

function BookingModal({ graduate, onClose }: { graduate: Graduate; onClose: () => void }) {
  const [form, setForm] = useState({
    client_name: '', client_email: '', client_phone: '',
    service_description: '', preferred_date: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!form.client_name.trim() || !form.client_email.trim() ||
        !form.client_phone.trim() || !form.service_description.trim()) {
      setError('Por favor completa todos los campos requeridos.')
      return
    }
    setLoading(true)
    const res = await fetch('/api/job-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ graduate_id: graduate.id, ...form }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error ?? 'Error al enviar la solicitud.'); return }
    setSuccess(true)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl">
          <div>
            <h2 className="text-base font-bold text-gray-900">Solicitar Servicio</h2>
            <p className="text-xs text-gray-500 mt-0.5">{graduate.full_name} · {graduate.specialty}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="h-4 w-4 text-gray-500" />
          </button>
        </div>

        {success ? (
          <div className="px-6 py-10 text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-gray-900 mb-2">¡Solicitud enviada!</h3>
            <p className="text-sm text-gray-600 mb-6">
              El departamento de colocaciones de D&apos;Mart Institute se pondrá en contacto contigo
              para coordinar los detalles del servicio.
            </p>
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl bg-navy text-white text-sm font-medium hover:bg-navy/90 transition-colors"
            >
              Cerrar
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 flex gap-2 items-start">
                <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Tu nombre <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={form.client_name}
                onChange={(e) => setForm((f) => ({ ...f, client_name: e.target.value }))}
                placeholder="Juan García"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Correo electrónico <span className="text-red-500">*</span></label>
              <input
                type="email"
                value={form.client_email}
                onChange={(e) => setForm((f) => ({ ...f, client_email: e.target.value }))}
                placeholder="juan@email.com"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Teléfono <span className="text-red-500">*</span></label>
              <input
                type="tel"
                value={form.client_phone}
                onChange={(e) => setForm((f) => ({ ...f, client_phone: e.target.value }))}
                placeholder="787-555-0000"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Descripción del servicio <span className="text-red-500">*</span></label>
              <textarea
                value={form.service_description}
                onChange={(e) => setForm((f) => ({ ...f, service_description: e.target.value }))}
                rows={4}
                placeholder="Describe el trabajo que necesitas realizar…"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30 resize-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Fecha preferida <span className="text-gray-400 font-normal">(opcional)</span></label>
              <input
                type="date"
                value={form.preferred_date}
                onChange={(e) => setForm((f) => ({ ...f, preferred_date: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30"
              />
            </div>

            <p className="text-xs text-gray-400 leading-relaxed">
              D&apos;Mart Institute coordinará esta solicitud a través del departamento de colocaciones. Tus datos de contacto solo serán usados para coordinar el servicio.
            </p>

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2.5 rounded-xl bg-gold text-navy text-sm font-bold hover:bg-gold/90 transition-colors disabled:opacity-60"
              >
                {loading ? 'Enviando…' : 'Enviar Solicitud'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default function EgresadosPage() {
  const [graduates, setGraduates] = useState<Graduate[]>([])
  const [loading, setLoading] = useState(true)
  const [campusFilter, setCampusFilter] = useState('')
  const [booking, setBooking] = useState<Graduate | null>(null)

  useEffect(() => {
    fetch('/api/graduates')
      .then((r) => r.json())
      .then((d) => { setGraduates(d.graduates ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const campuses = Array.from(new Set(graduates.map((g) => g.campus).filter(Boolean) as string[])).sort()
  const filtered = campusFilter ? graduates.filter((g) => g.campus === campusFilter) : graduates

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-gradient-to-br from-navy via-navy/95 to-navy/80 text-white py-16 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-sm font-semibold mb-4">
            <GraduationCap className="h-4 w-4" />
            Departamento de Colocaciones
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold mb-4 leading-tight">
            Egresados con Reválida
          </h1>
          <p className="text-base text-white/80 max-w-2xl mx-auto">
            Contrata a nuestros egresados certificados para realizar trabajos profesionales.
            Todos los perfiles han sido verificados y certificados por D&apos;Mart Institute.
            D&apos;Mart coordina el proceso — tú solo envías tu solicitud.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10">
        {/* Campus filter */}
        {campuses.length > 1 && (
          <div className="flex flex-wrap gap-2 mb-8">
            <button
              onClick={() => setCampusFilter('')}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all border ${
                campusFilter === '' ? 'bg-navy text-white border-navy' : 'bg-white text-gray-600 border-gray-200 hover:border-navy/40'
              }`}
            >
              Todos los recintos
            </button>
            {campuses.map((c) => (
              <button
                key={c}
                onClick={() => setCampusFilter(campusFilter === c ? '' : c)}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all border ${
                  campusFilter === c ? 'bg-navy text-white border-navy' : 'bg-white text-gray-600 border-gray-200 hover:border-navy/40'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-24">
            <div className="animate-spin h-8 w-8 rounded-full border-4 border-navy border-t-transparent" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24">
            <GraduationCap className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg font-medium">Próximamente</p>
            <p className="text-gray-400 text-sm mt-1">
              Nuestros primeros egresados certificados estarán disponibles muy pronto.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((grad) => (
              <div
                key={grad.id}
                className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-6 flex flex-col"
              >
                {/* Photo + name */}
                <div className="flex items-center gap-4 mb-4">
                  {grad.photo_url ? (
                    <img
                      src={grad.photo_url}
                      alt={grad.full_name}
                      className="h-16 w-16 rounded-full object-cover border-2 border-gray-100 flex-shrink-0"
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-full bg-navy text-white flex items-center justify-center text-lg font-bold flex-shrink-0">
                      {initials(grad.full_name)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-bold text-gray-900 leading-tight truncate">{grad.full_name}</p>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">{grad.program}</p>
                  </div>
                </div>

                {/* Campus badge */}
                {grad.campus && (
                  <span className={`inline-flex items-center gap-1 self-start px-2.5 py-1 rounded-full text-xs font-medium mb-3 ${CAMPUS_COLORS[grad.campus] ?? 'bg-gray-100 text-gray-600'}`}>
                    <MapPin className="h-3 w-3" />
                    {grad.campus}
                  </span>
                )}

                {/* Specialty */}
                {grad.specialty && (
                  <div className="flex items-start gap-2 mb-3">
                    <Briefcase className="h-3.5 w-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-gray-700 leading-snug">{grad.specialty}</p>
                  </div>
                )}

                {/* Bio */}
                {grad.bio && (
                  <p className="text-xs text-gray-500 leading-relaxed mb-4 line-clamp-3">{grad.bio}</p>
                )}

                <div className="mt-auto pt-4">
                  <button
                    onClick={() => setBooking(grad)}
                    className="w-full py-2.5 rounded-xl bg-gold text-navy text-sm font-bold hover:bg-gold/90 transition-colors"
                  >
                    Solicitar Servicio
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Disclaimer */}
        <p className="text-center text-xs text-gray-400 mt-12 max-w-xl mx-auto">
          Los perfiles en esta página corresponden a egresados que han otorgado su consentimiento para aparecer en este directorio.
          D&apos;Mart Institute actúa como intermediario en el proceso de colocación de empleo y no garantiza disponibilidad específica.
        </p>
      </div>

      {booking && <BookingModal graduate={booking} onClose={() => setBooking(null)} />}
    </div>
  )
}
