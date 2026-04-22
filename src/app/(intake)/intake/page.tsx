import { createClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { MapPin, Calendar, Users } from 'lucide-react'
import LeadForm from '@/components/forms/LeadFormIntake'
import Image from 'next/image'

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function formatDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('es-PR', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })
}

const TYPE_LABELS: Record<string, string> = {
  feria: 'Feria de Empleo / Educación',
  visita_escuela: 'Visita a Escuela',
  evento_comunitario: 'Evento Comunitario',
  otro: 'Actividad',
}

interface IntakePageProps {
  searchParams: { activity_id?: string }
}

export default async function IntakePage({ searchParams }: IntakePageProps) {
  const activityId = searchParams.activity_id
  if (!activityId) redirect('/')

  const admin = getAdminClient()
  const { data: activity } = await admin
    .from('activities')
    .select('id, name, type, activity_date, location, description')
    .eq('id', activityId)
    .single()

  if (!activity) redirect('/')

  const typeLabel = TYPE_LABELS[activity.type] ?? 'Actividad'
  const source = `Actividad: ${activity.name}`

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy/5 to-gold/5">
      {/* Header */}
      <div className="bg-navy text-white py-5 px-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Image src="/logo.png" alt="D'Mart Institute" width={120} height={36} className="h-9 w-auto brightness-0 invert" />
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Activity context card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-gold" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-0.5">{typeLabel}</p>
              <h1 className="text-lg font-bold text-navy leading-tight">{activity.name}</h1>
              {activity.description && (
                <p className="text-sm text-gray-500 mt-1">{activity.description}</p>
              )}
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                {activity.activity_date && (
                  <span className="flex items-center gap-1.5 text-xs text-gray-600">
                    <Calendar className="h-3.5 w-3.5 text-gray-400" />
                    <span className="capitalize">{formatDate(activity.activity_date)}</span>
                  </span>
                )}
                {activity.location && (
                  <span className="flex items-center gap-1.5 text-xs text-gray-600">
                    <MapPin className="h-3.5 w-3.5 text-gray-400" />
                    {activity.location}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Lead form */}
        <LeadForm
          source={source}
          activityId={activity.id}
          title="Solicita Información"
          subtitle="Completa el formulario y un consejero académico se comunicará contigo."
          compact
        />
      </div>
    </div>
  )
}
