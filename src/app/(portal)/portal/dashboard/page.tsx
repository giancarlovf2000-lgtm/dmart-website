import { redirect } from 'next/navigation'
import { createClient as createServerSupabase } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { promoteNewLeadsToCritico, getStaleLeadIds } from '@/lib/portal/alerts'
import PortalHeader from '@/components/portal/PortalHeader'
import LeadTable from '@/components/portal/LeadTable'
import type { Lead, Employee, Activity } from '@/lib/types'
import { AlertTriangle, Users, Calendar, GraduationCap, Flame, Clock, Phone, CalendarX2, RotateCcw, FileText, BookOpen, Timer, XCircle } from 'lucide-react'

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

interface DashboardPageProps {
  searchParams: { status?: string; campus?: string; page?: string; source?: string }
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/portal/login')

  const adminClient = getAdminClient()

  // Fetch employee profile
  const { data: employee } = await adminClient
    .from('employees')
    .select('id, full_name, campus, role, active')
    .eq('id', user.id)
    .single()

  if (!employee || !employee.active) redirect('/portal/login')

  const isAdmin = employee.role === 'admin'
  const employeeIdFilter = isAdmin ? undefined : user.id

  // Run alert checks (server-side, before rendering)
  await promoteNewLeadsToCritico(employeeIdFilter)
  const staleLeadIds = await getStaleLeadIds(employeeIdFilter)

  // Build lead query with filters — no row limit (up to 2000)
  const status = searchParams.status
  const campus = searchParams.campus
  const source = searchParams.source

  let leadsQuery = adminClient
    .from('leads')
    .select('id, created_at, nombre, apellido, telefono, campus, programa_interes, status, source, last_action_at, assignment_source, lead_source_text, activity_id, assigned_to')
    .order('last_action_at', { ascending: false })
    .range(0, 1999)

  if (!isAdmin) leadsQuery = leadsQuery.eq('assigned_to', user.id)
  if (status) leadsQuery = leadsQuery.eq('status', status)
  if (campus) leadsQuery = leadsQuery.eq('campus', campus)
  if (source) leadsQuery = leadsQuery.eq('source', source)

  const { data: leads } = await leadsQuery

  // Distinct sources for filter dropdown
  let sourcesQuery = adminClient.from('leads').select('source').not('source', 'is', null)
  if (!isAdmin) sourcesQuery = sourcesQuery.eq('assigned_to', user.id)
  const { data: sourceRows } = await sourcesQuery
  const uniqueSources = Array.from(new Set((sourceRows ?? []).map((r) => r.source as string).filter(Boolean))).sort()
  const sources = uniqueSources

  // Stats counts — all 12 statuses
  let statsQuery = adminClient.from('leads').select('status', { count: 'exact', head: false })
  if (!isAdmin) statsQuery = statsQuery.eq('assigned_to', user.id)
  const { data: allLeads } = await statsQuery

  const countByStatus = (s: string) => allLeads?.filter((l) => l.status === s).length ?? 0

  const counts = {
    total: allLeads?.length ?? 0,
    nuevo: countByStatus('Nuevo Lead'),
    critico: countByStatus('Crítico'),
    contacto_inicial: countByStatus('Contacto Inicial (Pendiente de Respuesta)'),
    contacto_establecido: countByStatus('Contacto Establecido'),
    cita: countByStatus('Cita Programada'),
    no_asistio: countByStatus('No Asistió a la Cita'),
    reagendado: countByStatus('Reagendado'),
    documentos: countByStatus('En Espera de Documentos'),
    orientado: countByStatus('Orientado (En Proceso de Matricularse)'),
    futuro: countByStatus('Seguimiento a Futuro'),
    matriculado: countByStatus('Matriculado'),
    desinteresado: countByStatus('Desinteresado / Rechazado'),
  }

  // Fetch current month activities for "Add Lead" modal
  const monthStart = new Date()
  monthStart.setDate(1)
  monthStart.setHours(0, 0, 0, 0)

  const { data: activities } = await adminClient
    .from('activities')
    .select('id, name')
    .eq('employee_id', user.id)
    .gte('month', monthStart.toISOString().slice(0, 10))

  const currentStatusFilter = searchParams.status ?? ''

  const allStats = [
    { label: 'Nuevo Lead',                            filterValue: 'Nuevo Lead',                                    value: counts.nuevo,              icon: Users,       color: 'text-blue-600',   iconBg: 'bg-blue-50' },
    { label: 'Crítico',                               filterValue: 'Crítico',                                       value: counts.critico,            icon: Flame,       color: 'text-red-600',    iconBg: 'bg-red-50' },
    { label: 'Contacto Inicial',                      filterValue: 'Contacto Inicial (Pendiente de Respuesta)',      value: counts.contacto_inicial,   icon: Clock,       color: 'text-orange-500', iconBg: 'bg-orange-50' },
    { label: 'Contacto Establecido',                  filterValue: 'Contacto Establecido',                          value: counts.contacto_establecido, icon: Phone,     color: 'text-teal-600',   iconBg: 'bg-teal-50' },
    { label: 'Cita Programada',                       filterValue: 'Cita Programada',                               value: counts.cita,               icon: Calendar,    color: 'text-indigo-600', iconBg: 'bg-indigo-50' },
    { label: 'No Asistió a la Cita',                  filterValue: 'No Asistió a la Cita',                          value: counts.no_asistio,         icon: CalendarX2,  color: 'text-rose-500',   iconBg: 'bg-rose-50' },
    { label: 'Reagendado',                            filterValue: 'Reagendado',                                    value: counts.reagendado,         icon: RotateCcw,   color: 'text-amber-600',  iconBg: 'bg-amber-50' },
    { label: 'En Espera de Documentos',               filterValue: 'En Espera de Documentos',                       value: counts.documentos,         icon: FileText,    color: 'text-purple-600', iconBg: 'bg-purple-50' },
    { label: 'Orientado',                             filterValue: 'Orientado (En Proceso de Matricularse)',         value: counts.orientado,          icon: BookOpen,    color: 'text-emerald-600',iconBg: 'bg-emerald-50' },
    { label: 'Seguimiento a Futuro',                  filterValue: 'Seguimiento a Futuro',                          value: counts.futuro,             icon: Timer,       color: 'text-slate-500',  iconBg: 'bg-slate-50' },
    { label: 'Matriculado',                           filterValue: 'Matriculado',                                   value: counts.matriculado,        icon: GraduationCap, color: 'text-green-600',iconBg: 'bg-green-50' },
    { label: 'Desinteresado / Rechazado',             filterValue: 'Desinteresado / Rechazado',                     value: counts.desinteresado,      icon: XCircle,     color: 'text-gray-500',   iconBg: 'bg-gray-100' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <PortalHeader employee={employee as Employee} />

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
        {/* Stale alert banner */}
        {staleLeadIds.length > 0 && (
          <div className="mb-5 p-4 rounded-xl bg-amber-50 border border-amber-200 flex gap-3 items-start">
            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-800">
                {staleLeadIds.length} lead{staleLeadIds.length > 1 ? 's' : ''} con seguimiento pendiente
              </p>
              <p className="text-xs text-amber-700 mt-0.5">
                Estos leads llevan más de 7 días sin actividad. Están marcados con{' '}
                <AlertTriangle className="inline h-3 w-3" /> en la tabla.
              </p>
            </div>
          </div>
        )}

        {/* All 12 statuses — clickable filter cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mb-6">
          {allStats.map(({ label, filterValue, value, icon: Icon, color, iconBg }) => {
            const isActive = currentStatusFilter === filterValue
            const href = isActive ? '/portal/dashboard' : `/portal/dashboard?status=${encodeURIComponent(filterValue)}`
            return (
              <a
                key={label}
                href={href}
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

        {/* Lead table with filters */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700">
            {isAdmin ? 'Todos los leads' : 'Mis leads'} · {counts.total} total
          </h2>
          {isAdmin && (
            <a href="/portal/admin" className="text-xs text-navy hover:underline font-medium">
              Ver empleados →
            </a>
          )}
        </div>

        <LeadTable
          leads={(leads ?? []) as Lead[]}
          staleLeadIds={staleLeadIds}
          employee={employee as Employee}
          activities={(activities ?? []) as Activity[]}
          sources={sources}
          currentSource={source ?? ''}
        />
      </div>
    </div>
  )
}
