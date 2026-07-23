'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { X, AlertCircle, Camera } from 'lucide-react'
import { createClient as createBrowserSupabase } from '@/lib/supabase/client'
import CommTypeSelect from '@/components/portal/CommTypeSelect'
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
            program: leadProgram?.trim() || 'Sin especificar',
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
          setError(`Estado actualizado, pero ocurrió un error al crear el perfil de egresado: ${d.error ?? 'Error desconocido'}. Contacta al administrador.`)
          setLoading(false)
          router.refresh()
          return
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
    <div className="portal-modal-overlay">
      <div className="portal-modal max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-black/[0.05] sticky top-0 bg-white rounded-t-neu-lg z-10">
          <h2 className="text-base font-bold text-ink">Cambiar Estado del Lead</h2>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-surface transition-colors">
            <X className="h-4 w-4 text-ink-muted" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-accent-soft flex gap-2 items-start">
              <AlertCircle className="h-4 w-4 text-accent flex-shrink-0 mt-0.5" />
              <p className="text-sm text-accent">{error}</p>
            </div>
          )}

          <div>
            <label className="portal-label">Nuevo Estado <span className="text-accent">*</span></label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value as LeadStatus)}
              className="portal-select"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="portal-label">Tipo de Seguimiento <span className="text-accent">*</span></label>
            <CommTypeSelect
              value={communicationType}
              onChange={(v) => setCommunicationType(v)}
              placeholder="Seleccionar tipo…"
              className="portal-select"
            />
          </div>

          <div>
            <label className="portal-label">
              Nota de Seguimiento <span className="text-accent">*</span>
              <span className="text-ink-muted/60 font-normal ml-1">(mín. 20 caracteres)</span>
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={4}
              placeholder="Describe el tipo de contacto realizado y el resultado de la comunicación…"
              className="portal-textarea resize-none"
            />
            <p className={`text-xs mt-1 ${note.trim().length >= 20 ? 'text-ink' : 'text-ink-muted/60'}`}>
              {note.trim().length}/20 caracteres mínimos
            </p>
          </div>

          {/* ── Graduate profile section (only for Graduado con Reválida) ── */}
          {isGradRevalida && (
            <div className="pt-2 border-t border-black/[0.05] space-y-4">
              <p className="text-xs font-semibold text-ink-muted uppercase tracking-wide">
                Perfil de Egresado con Reválida
              </p>

              {/* Photo */}
              <div>
                <label className="portal-label">Foto del Estudiante</label>
                <div className="flex items-center gap-4">
                  {photoPreview ? (
                    <img src={photoPreview} alt="preview" className="h-16 w-16 rounded-full object-cover shadow-neu-sm" />
                  ) : (
                    <div className="h-16 w-16 rounded-full bg-surface flex items-center justify-center shadow-neu-inset">
                      <Camera className="h-6 w-6 text-ink-muted/60" />
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="text-sm text-ink hover:underline font-medium"
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
                <label className="portal-label">Especialidad / Servicios que Ofrece <span className="text-accent">*</span></label>
                <input
                  type="text"
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  placeholder="Ej: Electricidad residencial, Cosmetología, Contabilidad…"
                  className="portal-input"
                />
              </div>

              {/* Bio */}
              <div>
                <label className="portal-label">Descripción breve <span className="text-ink-muted/60 font-normal">(opcional)</span></label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  placeholder="Breve descripción del estudiante y sus habilidades…"
                  className="portal-textarea resize-none"
                />
              </div>

              {/* Graduation date */}
              <div>
                <label className="portal-label">Fecha de Graduación <span className="text-ink-muted/60 font-normal">(opcional)</span></label>
                <input
                  type="date"
                  value={graduationDate}
                  onChange={(e) => setGraduationDate(e.target.value)}
                  className="portal-input"
                />
              </div>

              {/* FERPA consent checkbox */}
              <label className="flex items-start gap-3 p-3 rounded-xl bg-surface cursor-pointer">
                <input
                  type="checkbox"
                  checked={consentGiven}
                  onChange={(e) => setConsentGiven(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-ink flex-shrink-0"
                />
                <span className="text-xs text-ink-muted leading-relaxed">
                  <strong className="text-ink">Consentimiento FERPA requerido:</strong> El estudiante ha firmado el formulario de consentimiento para aparecer en la plataforma pública de egresados de D&apos;Mart Institute.
                </span>
              </label>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="portal-btn-ghost flex-1"
            >
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="portal-btn flex-1">
              {loading && <span className="portal-spinner h-4 w-4 border-2 border-white/30 border-t-white" />}
              Guardar Cambio
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
