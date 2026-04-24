'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { X, AlertCircle, Camera } from 'lucide-react'
import { createClient as createBrowserSupabase } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import type { LeadStatus, CommunicationType } from '@/lib/types'

const STATUSES: LeadStatus[] = [
  'Nuevo Lead',
  'Crítico',
  'Contacto Inicial (Pendiente de Respuesta)',
  'Contacto Establecido',
  'Cita Programada',
  'No Asistió a la Cita',
  'Reagendado',
  'En Espera de Documentos',
  'Orientado (En Proceso de Matricularse)',
  'Seguimiento a Futuro',
  'Matriculado',
  'Desinteresado / Rechazado',
  'Graduado',
  'Graduado con Reválida',
]

const COMMUNICATION_TYPES: CommunicationType[] = [
  'Llamada',
  'Mensaje de texto',
  'Email',
  'Visita presencial',
  'WhatsApp',
  'Otro',
]

interface StatusChangeModalProps {
  leadId: string
  leadName: string
  leadProgram?: string | null
  leadCampus?: string | null
  currentStatus: LeadStatus
  onClose: () => void
}

export default function StatusChangeModal({
  leadId, leadName, leadProgram, leadCampus, currentStatus, onClose,
}: StatusChangeModalProps) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)

  const [newStatus, setNewStatus] = useState<LeadStatus>(currentStatus)
  const [communicationType, setCommunicationType] = useState<CommunicationType | ''>('')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Graduate profile fields
  const [specialty, setSpecialty] = useState('')
  const [bio, setBio] = useState('')
  const [graduationDate, setGraduationDate] = useState('')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [consentGiven, setConsentGiven] = useState(false)

  const isGradRevalida = newStatus === 'Graduado con Reválida'

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    const reader = new FileReader()
    reader.onload = (ev) => setPhotoPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  async function uploadPhoto(file: File): Promise<string> {
    const supabase = createBrowserSupabase()
    const ext = file.name.split('.').pop()
    const path = `${leadId}-${Date.now()}.${ext}`
    const { error: uploadError } = await supabase.storage
      .from('graduate-photos')
      .upload(path, file, { upsert: true })
    if (uploadError) throw new Error('Error al subir la foto.')
    const { data } = supabase.storage.from('graduate-photos').getPublicUrl(path)
    return data.publicUrl
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (newStatus === currentStatus) {
      setError('Selecciona un estado diferente al actual.')
      return
    }
    if (!communicationType) {
      setError('Selecciona el tipo de comunicación realizado.')
      return
    }
    if (note.trim().length < 20) {
      setError(`La nota debe tener al menos 20 caracteres. (${note.trim().length}/20)`)
      return
    }
    if (isGradRevalida) {
      if (!specialty.trim()) { setError('La especialidad es requerida.'); return }
      if (!consentGiven) { setError('Debes confirmar que el estudiante firmó el formulario de consentimiento.'); return }
    }

    setLoading(true)

    try {
      // 1. Upload photo if provided
      let photoUrl: string | null = null
      if (isGradRevalida && photoFile) {
        photoUrl = await uploadPhoto(photoFile)
      }

      // 2. PATCH lead status
      const statusRes = await fetch(`/api/portal/leads/${leadId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_status: newStatus, communication_type: communicationType, note: note.trim() }),
      })
      if (!statusRes.ok) {
        const d = await statusRes.json()
        setError(d.error ?? 'Error al actualizar el estado.')
        setLoading(false)
        return
      }

      // 3. Create graduate profile if Graduado con Reválida
      if (isGradRevalida) {
        const profileRes = await fetch('/api/portal/graduates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lead_id: leadId,
            full_name: leadName,
            program: leadProgram ?? '',
            campus: leadCampus ?? null,
            specialty: specialty.trim(),
            bio: bio.trim() || null,
            photo_url: photoUrl,
            graduation_date: graduationDate || null,
            consent_given: true,
            consent_date: new Date().toISOString(),
          }),
        })
        if (!profileRes.ok) {
          const d = await profileRes.json()
          // Status was already updated — warn but don't block
          console.error('Graduate profile error:', d.error)
        }
      }

      router.refresh()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado.')
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl">
          <h2 className="text-base font-bold text-gray-900">Cambiar Estado del Lead</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="h-4 w-4 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 flex gap-2 items-start">
              <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div>
            <label className="form-label">Nuevo Estado <span className="text-red-500">*</span></label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value as LeadStatus)}
              className="form-input"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label">Tipo de Comunicación <span className="text-red-500">*</span></label>
            <select
              value={communicationType}
              onChange={(e) => setCommunicationType(e.target.value as CommunicationType)}
              className="form-input"
            >
              <option value="">Seleccionar tipo…</option>
              {COMMUNICATION_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label">
              Nota de Seguimiento <span className="text-red-500">*</span>
              <span className="text-gray-400 font-normal ml-1">(mín. 20 caracteres)</span>
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={4}
              placeholder="Describe el tipo de contacto realizado y el resultado de la comunicación…"
              className="form-input resize-none"
            />
            <p className={`text-xs mt-1 ${note.trim().length >= 20 ? 'text-green-600' : 'text-gray-400'}`}>
              {note.trim().length}/20 caracteres mínimos
            </p>
          </div>

          {/* ── Graduate profile section (only for Graduado con Reválida) ── */}
          {isGradRevalida && (
            <div className="pt-2 border-t border-emerald-100 space-y-4">
              <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">
                Perfil de Egresado con Reválida
              </p>

              {/* Photo */}
              <div>
                <label className="form-label">Foto del Estudiante</label>
                <div className="flex items-center gap-4">
                  {photoPreview ? (
                    <img src={photoPreview} alt="preview" className="h-16 w-16 rounded-full object-cover border border-gray-200" />
                  ) : (
                    <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center border border-dashed border-gray-300">
                      <Camera className="h-6 w-6 text-gray-400" />
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="text-sm text-navy hover:underline font-medium"
                  >
                    {photoPreview ? 'Cambiar foto' : 'Subir foto'}
                  </button>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handlePhotoChange}
                  />
                </div>
              </div>

              {/* Specialty */}
              <div>
                <label className="form-label">Especialidad / Servicios que Ofrece <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  placeholder="Ej: Electricidad residencial, Cosmetología, Contabilidad…"
                  className="form-input"
                />
              </div>

              {/* Bio */}
              <div>
                <label className="form-label">Descripción breve <span className="text-gray-400 font-normal">(opcional)</span></label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  placeholder="Breve descripción del estudiante y sus habilidades…"
                  className="form-input resize-none"
                />
              </div>

              {/* Graduation date */}
              <div>
                <label className="form-label">Fecha de Graduación <span className="text-gray-400 font-normal">(opcional)</span></label>
                <input
                  type="date"
                  value={graduationDate}
                  onChange={(e) => setGraduationDate(e.target.value)}
                  className="form-input"
                />
              </div>

              {/* FERPA consent checkbox */}
              <label className="flex items-start gap-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consentGiven}
                  onChange={(e) => setConsentGiven(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-emerald-600 flex-shrink-0"
                />
                <span className="text-xs text-emerald-800 leading-relaxed">
                  <strong>Consentimiento FERPA requerido:</strong> El estudiante ha firmado el formulario de consentimiento para aparecer en la plataforma pública de egresados de D&apos;Mart Institute.
                </span>
              </label>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <Button type="submit" variant="gold" size="sm" loading={loading} className="flex-1">
              Guardar Cambio
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
