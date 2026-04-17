'use client'

import { useEffect, useState } from 'react'
import { Plus, CheckCircle, X, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react'
import PortalHeader from '@/components/portal/PortalHeader'
import Button from '@/components/ui/Button'
import type { Activity, MonthlyReport, Employee } from '@/lib/types'

const ACTIVITY_TYPES = [
  { value: 'feria', label: 'Feria de Empleo / Educación' },
  { value: 'visita_escuela', label: 'Visita a Escuela' },
  { value: 'evento_comunitario', label: 'Evento Comunitario' },
  { value: 'otro', label: 'Otro' },
]

function firstOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1).toISOString().slice(0, 10)
}

function monthLabel(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('es-PR', { month: 'long', year: 'numeric' })
}

export default function ReportesPage() {
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [activities, setActivities] = useState<Activity[]>([])
  const [reports, setReports] = useState<MonthlyReport[]>([])
  const [activeTab, setActiveTab] = useState<'plan' | 'cierre'>('plan')
  const [showNewActivity, setShowNewActivity] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const currentMonth = firstOfMonth(new Date())

  const [activityForm, setActivityForm] = useState({ name: '', type: 'feria', description: '', planned_leads: '' })
  const [performanceForm, setPerformanceForm] = useState({ leads_acquired: '', leads_contacted: '', leads_enrolled: '', notes: '' })
  const [editingLeads, setEditingLeads] = useState<Record<string, string>>({})

  async function loadData() {
    const [actRes, repRes] = await Promise.all([
      fetch(`/api/portal/activities?month=${currentMonth}`),
      fetch('/api/portal/reports'),
    ])

    if (actRes.ok) { const d = await actRes.json(); setActivities(d.activities ?? []) }
    if (repRes.ok) { const d = await repRes.json(); setReports(d.reports ?? []) }
    setLoading(false)
  }

  useEffect(() => { loadData() }, [])

  async function createActivity(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSaving(true)

    const res = await fetch('/api/portal/activities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...activityForm, month: currentMonth, planned_leads: activityForm.planned_leads || null }),
    })

    if (!res.ok) { const d = await res.json(); setError(d.error ?? 'Error.'); setSaving(false); return }
    setActivityForm({ name: '', type: 'feria', description: '', planned_leads: '' })
    setShowNewActivity(false)
    await loadData()
    setSaving(false)
  }

  async function updateActualLeads(actId: string, value: string) {
    await fetch(`/api/portal/activities/${actId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actual_leads: parseInt(value, 10) || 0 }),
    })
    await loadData()
    setEditingLeads((prev) => { const n = { ...prev }; delete n[actId]; return n })
  }

  async function submitPerformance(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSaving(true)

    const res = await fetch('/api/portal/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        month: currentMonth,
        report_type: 'performance',
        leads_acquired: parseInt(performanceForm.leads_acquired, 10) || null,
        leads_contacted: parseInt(performanceForm.leads_contacted, 10) || null,
        leads_enrolled: parseInt(performanceForm.leads_enrolled, 10) || null,
        notes: performanceForm.notes,
      }),
    })

    if (!res.ok) { const d = await res.json(); setError(d.error ?? 'Error.'); setSaving(false); return }
    setSuccess('Informe guardado exitosamente.')
    await loadData()
    setSaving(false)
  }

  const performanceReport = reports.find((r) => r.report_type === 'performance' && r.month === currentMonth)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header placeholder — employee loaded from session in real app */}
      <div className="bg-white border-b border-gray-200 px-4 md:px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h1 className="text-base font-bold text-gray-900">Reportes y Actividades</h1>
          <a href="/portal/dashboard" className="text-sm text-navy hover:underline">← Dashboard</a>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 md:px-6 py-6">
        {/* Month indicator */}
        <div className="mb-5 text-sm text-gray-500">
          Mes actual: <span className="font-semibold text-gray-800 capitalize">{monthLabel(currentMonth)}</span>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
          {(['plan', 'cierre'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-colors ${activeTab === tab ? 'bg-white text-navy shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {tab === 'plan' ? 'Plan del Mes' : 'Informe de Cierre'}
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 flex gap-2 items-start">
            <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 rounded-lg bg-green-50 border border-green-200 flex gap-2 items-start">
            <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-green-700">{success}</p>
          </div>
        )}

        {/* Plan tab */}
        {activeTab === 'plan' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">Planifica las actividades que realizarás este mes para generar leads.</p>
              <button
                onClick={() => setShowNewActivity(!showNewActivity)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gold text-white text-sm font-semibold hover:bg-gold/90 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Nueva Actividad
              </button>
            </div>

            {showNewActivity && (
              <form onSubmit={createActivity} className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
                <h3 className="text-sm font-bold text-gray-900">Nueva Actividad</h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="form-label">Nombre <span className="text-red-500">*</span></label>
                    <input type="text" required value={activityForm.name} onChange={(e) => setActivityForm((p) => ({ ...p, name: e.target.value }))} className="form-input" placeholder="Nombre de la actividad" />
                  </div>
                  <div>
                    <label className="form-label">Tipo <span className="text-red-500">*</span></label>
                    <select value={activityForm.type} onChange={(e) => setActivityForm((p) => ({ ...p, type: e.target.value }))} className="form-input">
                      {ACTIVITY_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Leads Esperados</label>
                    <input type="number" min={0} value={activityForm.planned_leads} onChange={(e) => setActivityForm((p) => ({ ...p, planned_leads: e.target.value }))} className="form-input" placeholder="0" />
                  </div>
                  <div>
                    <label className="form-label">Descripción</label>
                    <input type="text" value={activityForm.description} onChange={(e) => setActivityForm((p) => ({ ...p, description: e.target.value }))} className="form-input" placeholder="Opcional" />
                  </div>
                </div>
                <div className="flex gap-2 pt-1">
                  <button type="button" onClick={() => setShowNewActivity(false)} className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">Cancelar</button>
                  <Button type="submit" variant="gold" size="sm" loading={saving}>Guardar Actividad</Button>
                </div>
              </form>
            )}

            {activities.length === 0 && !showNewActivity ? (
              <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
                <p className="text-gray-500 text-sm">No hay actividades planificadas para este mes.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activities.map((act) => (
                  <div key={act.id} className="bg-white rounded-xl border border-gray-200 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{act.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {ACTIVITY_TYPES.find((t) => t.value === act.type)?.label ?? act.type}
                          {act.description && ` · ${act.description}`}
                        </p>
                      </div>
                      <div className="text-right text-xs text-gray-500">
                        <p>Esperados: <span className="font-medium text-gray-700">{act.planned_leads ?? '—'}</span></p>
                        <p className="mt-0.5">Generados: <span className={`font-medium ${act.actual_leads != null ? 'text-green-700' : 'text-gray-400'}`}>{act.actual_leads ?? '—'}</span></p>
                      </div>
                    </div>

                    {/* Update actual leads */}
                    <div className="mt-3 flex items-center gap-2">
                      {editingLeads[act.id] !== undefined ? (
                        <>
                          <input
                            type="number"
                            min={0}
                            value={editingLeads[act.id]}
                            onChange={(e) => setEditingLeads((p) => ({ ...p, [act.id]: e.target.value }))}
                            className="w-20 px-2 py-1.5 text-sm border border-gray-200 rounded-lg"
                          />
                          <button onClick={() => updateActualLeads(act.id, editingLeads[act.id])} className="text-xs px-3 py-1.5 rounded-lg bg-green-50 text-green-700 font-medium hover:bg-green-100 transition-colors">
                            Guardar
                          </button>
                          <button onClick={() => setEditingLeads((p) => { const n = { ...p }; delete n[act.id]; return n })} className="text-xs text-gray-400 hover:text-gray-600">
                            Cancelar
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => setEditingLeads((p) => ({ ...p, [act.id]: String(act.actual_leads ?? '') }))}
                          className="text-xs text-navy hover:underline"
                        >
                          Actualizar leads generados
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Cierre tab */}
        {activeTab === 'cierre' && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-sm font-bold text-gray-900 mb-1">Informe de Cierre del Mes</h2>
            <p className="text-xs text-gray-500 mb-5">Resumen de tu desempeño durante {monthLabel(currentMonth)}.</p>

            {performanceReport && (
              <div className="mb-5 p-3 rounded-lg bg-green-50 border border-green-200 flex gap-2 items-start">
                <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-green-700">Informe enviado. Puedes actualizarlo si es necesario.</p>
              </div>
            )}

            <form onSubmit={submitPerformance} className="space-y-4">
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="form-label">Leads Adquiridos</label>
                  <input type="number" min={0} value={performanceForm.leads_acquired || String(performanceReport?.leads_acquired ?? '')} onChange={(e) => setPerformanceForm((p) => ({ ...p, leads_acquired: e.target.value }))} className="form-input" placeholder="0" />
                </div>
                <div>
                  <label className="form-label">Leads Contactados</label>
                  <input type="number" min={0} value={performanceForm.leads_contacted || String(performanceReport?.leads_contacted ?? '')} onChange={(e) => setPerformanceForm((p) => ({ ...p, leads_contacted: e.target.value }))} className="form-input" placeholder="0" />
                </div>
                <div>
                  <label className="form-label">Matriculados</label>
                  <input type="number" min={0} value={performanceForm.leads_enrolled || String(performanceReport?.leads_enrolled ?? '')} onChange={(e) => setPerformanceForm((p) => ({ ...p, leads_enrolled: e.target.value }))} className="form-input" placeholder="0" />
                </div>
              </div>
              <div>
                <label className="form-label">Notas / Observaciones del Mes</label>
                <textarea
                  rows={4}
                  value={performanceForm.notes || (performanceReport?.notes ?? '')}
                  onChange={(e) => setPerformanceForm((p) => ({ ...p, notes: e.target.value }))}
                  className="form-input resize-none"
                  placeholder="Describe los logros, retos y observaciones del mes…"
                />
              </div>
              <Button type="submit" variant="gold" size="sm" loading={saving}>
                {performanceReport ? 'Actualizar Informe' : 'Enviar Informe de Cierre'}
              </Button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
