import { redirect } from 'next/navigation'
import { createClient as createServerSupabase } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { promoteNewLeadsToCritico, getStaleLeadIds } from '@/lib/portal/alerts'
import { findDuplicatePairs, canonicalPairKey } from '@/lib/portal/duplicates'
import PortalHeader from '@/components/portal/PortalHeader'
import LeadTable from '@/components/portal/LeadTable'
import DuplicatesView from '@/components/portal/DuplicatesView'
import type { Lead, Employee, Activity } from '@/lib/types'
import {
  AlertTriangle, Users, Calendar, GraduationCap, Flame,
  Clock, Phone, CalendarX2, RotateCcw, FileText, BookOpen,
  Timer, XCircle, Copy,
} from 'lucide-react'

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

interface DashboardPageProps {
  searchParams: { status?: string; campus?: string; source?: string; stale?: string; duplicates?: string }
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/portal/login')

  const adminClient = getAdminClient()

  const { data: employee } = await adminClient
    .from('employees')
    .select('id, full_name, campus, role, active')
    .eq('id', user.id)
    .single()
  if (!employee || !employee.active) redirect('/portal/login')

  const isAdmin = employee.role === 'admin'
  const employeeIdFilter = isAdmin ? undefined : user.id

  await promoteNewLeadsToCritico(employeeIdFilter)
  const staleLeadIds = await getStaleLeadIds(employeeIdFilter)

  const showDuplicates = searchParams.duplicates === '1'
  const showStale     = searchParams.stale === '1'
  const status        = searchParams.status
  const campus        = searchParams.campus
  const source        = searchParams.source

  // ── Leads query (filtered, for the table) ──────────────────────────────────
  let leadsQuery = adminClient
    .from('leads')
    .select('id, created_at, nombre, apellido, telefono, campus, programa_interes, status, source, last_action_at, assignment_source, lead_source_text, activity_id, assigned_to')
    .order('last_action_at', { ascending: false })
    .range(0, 1999)

  if (!isAdmin) leadsQuery = leadsQuery.eq('assigned_to', user.id)
  if (status)   leadsQuery = leadsQuery.eq('status', status)
  if (campus)   leadsQuery = leadsQuery.eq('campus', campus)
  if (source)   leadsQuery = leadsQuery.eq('source', source)
  if (showStale && staleLeadIds.length > 0) leadsQuery = leadsQuery.in('id', staleLeadIds)
  if (showStale && staleLeadIds.length === 0) leadsQuery = leadsQuery.eq('id', 'no-match')

  const { data: leads } = await leadsQuery

  // ── Stats query ────────────────────────────────────────────────────────────
  let statsQuery = adminClient.from('leads').select('status', { count: 'exact', head: false })
  if (!isAdmin) statsQuery = statsQuery.eq('assigned_to', user.id)
  const { data: allLeads } = await statsQuery

  const countByStatus = (s: string) => allLeads?.filter((l) => l.status === s).length ?? 0
  const counts = {
    total:               allLeads?.length ?? 0,
    nuevo:               countByStatus('Nuevo Lead'),
    critico:             countByStatus('Crítico'),
    contacto_inicial:    countByStatus('Contacto Inicial (Pendiente de Respuesta)'),
    contacto_establecido:countByStatus('Contacto Establecido'),
    cita:                countByStatus('Cita Programada'),
    no_asistio:          countByStatus('No Asistió a la Cita'),
    reagendado:          countByStatus('Reagendado'),
    documentos:          countByStatus('En Espera de Documentos'),
    orientado:           countByStatus('Orientado (En Proceso de Matricularse)'),
    futuro:              countByStatus('Seguimiento a Futuro'),
    matriculado:         countByStatus('Matriculado'),
    desinteresado:       countByStatus('Desinteresado / Rechazado'),
  }

  // ── Duplicate count (server-side, for the alert + badge) ──────────────────
  let dupLeadsQuery = adminClient
    .from('leads')
    .select('id, nombre, apellido, email, telefono')
    .range(0, 1999)
  if (!isAdmin) dupLeadsQuery = dupLeadsQuery.eq('assigned_to', user.id)

  const [{ data: dupLeadsRaw }, { data: dismissedPairs }] = await Promise.all([
    dupLeadsQuery,
    adminClient.from('dismissed_lead_pairs').select('lead_id_a, lead_id_b'),
  ])

  const dismissedSet = new Set(
    (dismissedPairs ?? []).map((p) => canonicalPairKey(p.lead_id_a, p.lead_id_b))
  )
  const duplicateCount = findDuplicatePairs(dupLeadsRaw ?? [], dismissedSet).length

  // ── Sources for filter dropdown ────────────────────────────────────────────
  let sourcesQuery = adminClient.from('leads').select('source').not('source', 'is', null)
  if (!isAdmin) sourcesQuery = sourcesQuery.eq('assigned_to', user.id)
  const { data: sourceRows } = await sourcesQuery
  const sources = Array.from(new Set((sourceRows ?? []).map((r) => r.source as string).filter(Boolean))).sort()

  // ── Activities for "Add Lead" modal ────────────────────────────────────────
  const monthStart = new Date()
  monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0)
  const { data: activities } = await adminClient
    .from('activities').select('id, name')
    .eq('employee_id', user.id)
    .gte('month', monthStart.toISOString().slice(0, 10))

  const currentStatusFilter = searchParams.status ?? ''

  const allStats = [
    { label: 'Nuevo Lead',               filterValue: 'Nuevo Lead',                               value: counts.nuevo,               icon: Users,        color: 'text-blue-600',    iconBg: 'bg-blue-50' },
    { label: 'Crítico',                  filterValue: 'Crítico',                                  value: counts.critico,             icon: Flame,        color: 'text-red-600',     iconBg: 'bg-red-50' },
    { label: 'Contacto Inicial',         filterValue: 'Contacto Inicial (Pendiente de Respuesta)',value: counts.contacto_inicial,    icon: Clock,        color: 'text-orange-500',  iconBg: 'bg-orange-50' },
    { label: 'Contacto Establecido',     filterValue: 'Contacto Establecido',                     value: counts.contacto_establecido,icon: Phone,        color: 'text-teal-600',    iconBg: 'bg-teal-50' },
    { label: 'Cita Programada',          filterValue: 'Cita Programada',                          value: counts.cita,                icon: Calendar,     color: 'text-indigo-600',  iconBg: 'bg-indigo-50' },
    { label: 'No Asistió a la Cita',     filterValue: 'No Asistió a la Cita',                     value: counts.no_asistio,          icon: CalendarX2,   color: 'text-rose-500',    iconBg: 'bg-rose-50' },
    { label: 'Reagendado',               filterValue: 'Reagendado',                               value: counts.reagendado,          icon: RotateCcw,    color: 'text-amber-600',   iconBg: 'bg-amber-50' },
    { label: 'En Espera de Documentos',  filterValue: 'En Espera de Documentos',                  value: counts.documentos,          icon: FileText,     color: 'text-purple-600',  iconBg: 'bg-purple-50' },
    { label: 'Orientado',                filterValue: 'Orientado (En Proceso de Matricularse)',    value: counts.orientado,           icon: BookOpen,     color: 'text-emerald-600', iconBg: 'bg-emerald-50' },
    { label: 'Seguimiento a Futuro',     filterValue: 'Seguimiento a Futuro',                     value: counts.futuro,              icon: Timer,        color: 'text-slate-500',   iconBg: 'bg-slate-50' },
    { label: 'Matriculado',              filterValue: 'Matriculado',                              value: counts.matriculado,         icon: GraduationCap,color: 'text-green-600',   iconBg: 'bg-green-50' },
    { label: 'Desinteresado / Rechazado',filterValue: 'Desinteresado / Rechazado',                value: counts.desinteresado,       icon: XCircle,      color: 'text-gray-500',    iconBg: 'bg-gray-100' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <PortalHeader employee={employee as Employee} />

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">

        {/* ── Alert banners ────────────────────────────────────────── */}
        {staleLeadIds.length > 0 && (
          <a href={showStale ? '/portal/dashboard' : '/portal/dashboard?stale=1'}
            className="block mb-3 p-4 rounded-xl bg-amber-50 border border-amber-200 hover:bg-amber-100 transition-colors">
            <div className="flex gap-3 items-start">
              <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-800">
                  {staleLeadIds.length} lead{staleLeadIds.length > 1 ? 's' : ''} con seguimiento pendiente
                </p>
                <p className="text-xs text-amber-700 mt-0.5">
                  Más de 7 días sin actividad. Haz clic para filtrarlos.
                </p>
              </div>
            </div>
          </a>
        )}

        {duplicateCount > 0 && (
          <a href={showDuplicates ? '/portal/dashboard' : '/portal/dashboard?duplicates=1'}
            className="block mb-5 p-4 rounded-xl bg-red-50 border border-red-200 hover:bg-red-100 transition-colors">
            <div className="flex gap-3 items-start">
              <Copy className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-800">
                  {duplicateCount} posible{duplicateCount > 1 ? 's' : ''} lead{duplicateCount > 1 ? 's' : ''} duplicado{duplicateCount > 1 ? 's' : ''} detectado{duplicateCount > 1 ? 's' : ''}
                </p>
                <p className="text-xs text-red-700 mt-0.5">
                  Leads con el mismo teléfono, correo o nombre. Haz clic para revisarlos y fusionarlos.
                </p>
              </div>
            </div>
          </a>
        )}

        {/* ── Special filter buttons (stale + duplicates) ──────────── */}
        <div className="flex gap-2 mb-3">
          <a
            href={showStale ? '/portal/dashboard' : '/portal/dashboard?stale=1'}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${
              showStale
                ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                : 'bg-white border-amber-200 text-amber-700 hover:bg-amber-50'
            }`}
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            Seguimiento pendiente · {staleLeadIds.length}
          </a>
          <a
            href={showDuplicates ? '/portal/dashboard' : '/portal/dashboard?duplicates=1'}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${
              showDuplicates
                ? 'bg-red-600 text-white border-red-600 shadow-sm'
                : 'bg-white border-red-200 text-red-700 hover:bg-red-50'
            }`}
          >
            <Copy className="h-3.5 w-3.5" />
            Duplicados · {duplicateCount}
          </a>
        </div>

        {/* ── Status filter cards ───────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mb-6">
          {allStats.map(({ label, filterValue, value, icon: Icon, color, iconBg }) => {
            const isActive = currentStatusFilter === filterValue
            const href = isActive ? '/portal/dashboard' : `/portal/dashboard?status=${encodeURIComponent(filterValue)}`
            return (
              <a key={label} href={href}
                title={isActive ? `Quitar filtro: ${label}` : `Filtrar por: ${label}`}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-all ${
                  isActive
                    ? 'bg-navy text-white border-navy shadow-sm'
                    : 'bg-white border-gray-200 hover:border-navy/40 hover:shadow-sm'
                }`}
              >
                <div className={`flex-shrink-0 p-1 rounded-md ${isActive ? 'bg-white/20' : iconBg}`}>
                  <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-white' : color}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`text-xs leading-tight truncate ${isActive ? 'text-white/90' : 'text-gray-500'}`}>{label}</p>
                  <p className={`text-sm font-bold leading-tight ${isActive ? 'text-white' : 'text-gray-800'}`}>{value}</p>
                </div>
              </a>
            )
          })}
        </div>

        {/* ── Main content area ─────────────────────────────────────── */}
        {showDuplicates ? (
          <>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-700">
                Leads duplicados · {duplicateCount} par{duplicateCount !== 1 ? 'es' : ''} detectado{duplicateCount !== 1 ? 's' : ''}
              </h2>
              <a href="/portal/dashboard" className="text-xs text-navy hover:underline font-medium">
                ← Volver a todos los leads
              </a>
            </div>
            <DuplicatesView />
          </>
        ) : (
          <>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-700">
                {showStale
                  ? `Seguimiento pendiente · ${staleLeadIds.length} leads`
                  : `${isAdmin ? 'Todos los leads' : 'Mis leads'} · ${counts.total} total`}
              </h2>
              <div className="flex items-center gap-3">
                <a href="/portal/reportes" className="text-xs text-navy hover:underline font-medium">
                  Plan y Reportes →
                </a>
                {isAdmin && !showStale && (
                  <a href="/portal/admin" className="text-xs text-navy hover:underline font-medium">
                    Ver empleados →
                  </a>
                )}
              </div>
            </div>
            <LeadTable
              leads={(leads ?? []) as Lead[]}
              staleLeadIds={staleLeadIds}
              employee={employee as Employee}
              activities={(activities ?? []) as Activity[]}
              sources={sources}
              currentSource={source ?? ''}
            />
          </>
        )}
      </div>
    </div>
  )
}
