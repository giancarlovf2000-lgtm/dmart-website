import { redirect } from 'next/navigation'
import { createClient as createServerSupabase } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { promoteNewLeadsToCritico, getStaleLeadIds } from '@/lib/portal/alerts'
import PortalHeader from '@/components/portal/PortalHeader'
import LeadTable from '@/components/portal/LeadTable'
import type { Lead, Employee, Activity } from '@/lib/types'
import { AlertTriangle, Users, Calendar, GraduationCap, Flame } from 'lucide-react'

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

interface DashboardPageProps {
  searchParams: { status?: string; campus?: string; page?: string }
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

  let leadsQuery = adminClient
    .from('leads')
    .select('id, created_at, nombre, apellido, telefono, campus, programa_interes, status, last_action_at, assignment_source, lead_source_text, activity_id, assigned_to')
    .order('last_action_at', { ascending: false })
    .range(0, 1999)

  if (!isAdmin) leadsQuery = leadsQuery.eq('assigned_to', user.id)
  if (status) leadsQuery = leadsQuery.eq('status', status)
  if (campus) leadsQuery = leadsQuery.eq('campus', campus)

  const { data: leads } = await leadsQuery

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

  const keyStats = [
    { label: 'Nuevo Lead', value: counts.nuevo, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Crítico', value: counts.critico, icon: Flame, color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'Cita Programada', value: counts.cita, icon: Calendar, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Matriculado', value: counts.matriculado, icon: GraduationCap, color: 'text-green-600', bg: 'bg-green-50' },
  ]

  const allStats: { label: string; value: number }[] = [
    { label: 'Nuevo Lead', value: counts.nuevo },
    { label: 'Crítico', value: counts.critico },
    { label: 'Contacto Inicial', value: counts.contacto_inicial },
    { label: 'Contacto Establecido', value: counts.contacto_establecido },
    { label: 'Cita Programada', value: counts.cita },
    { label: 'No Asistió a la Cita', value: counts.no_asistio },
    { label: 'Reagendado', value: counts.reagendado },
    { label: 'En Espera de Documentos', value: counts.documentos },
    { label: 'Orientado', value: counts.orientado },
    { label: 'Seguimiento a Futuro', value: counts.futuro },
    { label: 'Matriculado', value: counts.matriculado },
    { label: 'Desinteresado / Rechazado', value: counts.desinteresado },
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

        {/* Key stats — 4 large cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
          {keyStats.map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className={`inline-flex p-2 rounded-lg ${bg} mb-2`}>
                <Icon className={`h-4 w-4 ${color}`} />
              </div>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* All 12 statuses — compact grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mb-6">
          {allStats.map(({ label, value }) => (
            <div key={label} className="bg-white rounded-lg border border-gray-100 px-3 py-2 flex items-center justify-between gap-2">
              <p className="text-xs text-gray-500 leading-tight truncate" title={label}>{label}</p>
              <p className="text-sm font-bold text-gray-800 flex-shrink-0">{value}</p>
            </div>
          ))}
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
        />
      </div>
    </div>
  )
}
