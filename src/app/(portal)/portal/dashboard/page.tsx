import { redirect } from 'next/navigation'
import { createClient as createServerSupabase } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { promoteNewLeadsToCritico, getStaleLeadIds } from '@/lib/portal/alerts'
import { applyCampusVisibility } from '@/lib/portal/leadAccess'
import { checkSupervisorPlanningGate } from '@/lib/portal/planningGate'
import { findDuplicatePairs, canonicalPairKey } from '@/lib/portal/duplicates'
import { leadStatusRank } from '@/lib/utils'
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
  const isSupervisor = employee.role === 'supervisor'
  const isDirector = employee.role === 'director'

  // Planning gate: block supervisors during last 5 days if plan not complete (directors exempt)
  if (isSupervisor) {
    const gate = await checkSupervisorPlanningGate(employee.id, adminClient)
    if (gate.required && !gate.complete) redirect('/portal/reportes?planning=required')
  }

  // Colegas del mismo recinto (para la reasignación inline del LeadTable). Admin no la usa.
  let supervisedEmployees: { id: string; full_name: string }[] = []
  if (!isAdmin) {
    const { data: campusEmps } = await adminClient
      .from('employees')
      .select('id, full_name')
      .overlaps('campus', employee.campus as string[])
      .eq('active', true)
      .neq('id', user.id)
    supervisedEmployees = (campusEmps ?? []) as { id: string; full_name: string }[]
  }

  // Filtro de recinto para las alertas: admin = todos; el resto = su(s) recinto(s).
  const campusFilter = isAdmin ? undefined : (employee.campus as string[])

  await promoteNewLeadsToCritico(campusFilter)
  const staleLeadIds = await getStaleLeadIds(campusFilter)

  const showDuplicates = searchParams.duplicates === '1'
  const showStale     = searchParams.stale === '1'
  const status        = searchParams.status
  const campus        = searchParams.campus
  const source        = searchParams.source

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function applyRoleFilter(query: any) {
    return applyCampusVisibility(query, employee!)
  }

  // ── Leads query (filtered, for the table) ──────────────────────────────────
  let leadsQuery = adminClient
    .from('leads')
    .select('id, created_at, nombre, apellido, telefono, campus, programa_interes, status, source, last_action_at, assignment_source, lead_source_text, activity_id, assigned_to')
    .order('last_action_at', { ascending: false })
    .range(0, 1999)

  leadsQuery = applyRoleFilter(leadsQuery)
  if (status)   leadsQuery = leadsQuery.eq('status', status)
  if (campus)   leadsQuery = leadsQuery.eq('campus', campus)
  if (source)   leadsQuery = leadsQuery.eq('source', source)
  if (showStale && staleLeadIds.length > 0) leadsQuery = leadsQuery.in('id', staleLeadIds)
  if (showStale && staleLeadIds.length === 0) leadsQuery = leadsQuery.eq('id', 'no-match')

  const { data: leads } = await leadsQuery

  // Orden por defecto: por prioridad de estado ("por urgencia"). El query ya viene
  // ordenado por última actividad, así que un sort estable conserva ese orden
  // dentro de cada estado. El filtrado del empleado (estado/recinto/origen) se
  // aplica antes en el query, no afecta este orden.
  const sortedLeads = [...(leads ?? [])].sort(
    (a, b) => leadStatusRank(a.status) - leadStatusRank(b.status)
  )

  // ── Stats query ────────────────────────────────────────────────────────────
  let statsQuery = adminClient.from('leads').select('status', { count: 'exact', head: false })
  statsQuery = applyRoleFilter(statsQuery)
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
  dupLeadsQuery = applyRoleFilter(dupLeadsQuery)

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
  sourcesQuery = applyRoleFilter(sourcesQuery)
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
    <div className="min-h-screen bg-surface">
      <PortalHeader employee={employee as Employee} />

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">

        <h1 className="text-2xl font-bold font-display text-ink mb-5">Dashboard</h1>

        {/* ── Alert banners ────────────────────────────────────────── */}
        {staleLeadIds.length > 0 && (
          <a href={showStale ? '/portal/dashboard' : '/portal/dashboard?stale=1'}
            className="block mb-3 p-4 rounded-2xl bg-amber-50 border border-amber-200 hover:bg-amber-100 transition-colors">
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
            className="block mb-5 p-4 rounded-2xl bg-red-50 border border-red-200 hover:bg-red-100 transition-colors">
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
            className={`flex items-center gap-2 px-3.5 py-2 rounded-full border text-xs font-semibold transition-all ${
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
            className={`flex items-center gap-2 px-3.5 py-2 rounded-full border text-xs font-semibold transition-all ${
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
                className={`portal-stat-card ${isActive ? 'portal-stat-card--active' : ''}`}
              >
                <div className={`portal-chip ${isActive ? 'bg-white/15' : iconBg}`}>
                  <Icon className={`h-4 w-4 ${isActive ? 'text-white' : color}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`text-xs leading-tight truncate ${isActive ? 'text-white/80' : 'text-ink-muted'}`}>{label}</p>
                  <p className={`text-base font-bold leading-tight font-display ${isActive ? 'text-white' : 'text-ink'}`}>{value}</p>
                </div>
              </a>
            )
          })}
        </div>

        {/* ── Main content area ─────────────────────────────────────── */}
        {showDuplicates ? (
          <>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-ink font-display">
                Leads duplicados · {duplicateCount} par{duplicateCount !== 1 ? 'es' : ''} detectado{duplicateCount !== 1 ? 's' : ''}
              </h2>
              <a href="/portal/dashboard" className="text-xs text-accent hover:underline font-semibold">
                ← Volver a todos los leads
              </a>
            </div>
            <DuplicatesView />
          </>
        ) : (
          <>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-ink font-display">
                {showStale
                  ? `Seguimiento pendiente · ${staleLeadIds.length} leads`
                  : `${isAdmin ? 'Todos los leads' : 'Leads de mi recinto'} · ${counts.total} total`}
              </h2>
              <div className="flex items-center gap-3">
                {isAdmin ? (
                  <a href="/portal/admin" className="text-xs text-accent hover:underline font-semibold">
                    Panel Admin →
                  </a>
                ) : (
                  <a href="/portal/reportes" className="text-xs text-accent hover:underline font-semibold">
                    {(isSupervisor || isDirector) ? 'Reportes del Equipo →' : 'Plan y Reportes →'}
                  </a>
                )}
              </div>
            </div>
            <LeadTable
              leads={sortedLeads as Lead[]}
              staleLeadIds={staleLeadIds}
              employee={employee as Employee}
              activities={(activities ?? []) as Activity[]}
              sources={sources}
              currentSource={source ?? ''}
              teamMembers={supervisedEmployees}
            />
          </>
        )}
      </div>
    </div>
  )
}
