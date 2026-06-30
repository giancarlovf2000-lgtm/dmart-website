'use client'

import { useState } from 'react'
import { LogOut, Building2, LayoutDashboard, ClipboardList, BookOpen, X, ChevronRight, ChevronLeft, LayoutGrid, UserPlus, FileText, QrCode, BarChart3, Users, Download, Lock, AlertTriangle, GitMerge, Scissors } from 'lucide-react'
import type { Employee } from '@/lib/types'

interface PortalHeaderProps {
  employee: Pick<Employee, 'full_name' | 'campus' | 'role'>
}

interface TutorialStep {
  icon: React.ElementType
  title: string
  description: string
  tip?: string
}

const STEPS_EMPLEADO: TutorialStep[] = [
  {
    icon: LayoutGrid,
    title: 'Tu Dashboard',
    description: 'La pantalla principal muestra todos tus leads organizados por estado. Los contadores en la parte superior te muestran cuántos leads tienes en cada etapa del proceso de admisión.',
    tip: 'Cada vez que cargas el dashboard se revisan automáticamente tus leads para actualizar alertas y estados.',
  },
  {
    icon: UserPlus,
    title: 'Agregar un Lead',
    description: 'Usa el botón "Nuevo Lead" en el Dashboard para registrar un prospecto manualmente. Completa nombre, apellido, correo, teléfono, recinto y programa de interés.',
    tip: 'Si el lead viene de una feria u otra actividad, selecciona la actividad en el formulario para que quede vinculado y cuente en tus estadísticas.',
  },
  {
    icon: FileText,
    title: 'Gestionar un Lead',
    description: 'Haz clic en cualquier lead para ver su perfil completo. Desde ahí puedes cambiar su estado (Nuevo Lead → Interesado → Aplicó → Matriculado, etc.) y agregar notas de seguimiento con el tipo de comunicación.',
    tip: 'Cada cambio de estado queda registrado en el historial con fecha, hora y tu nombre — sirve de evidencia de seguimiento.',
  },
  {
    icon: AlertTriangle,
    title: 'Estado "Crítico" y Alertas',
    description: 'Si un lead queda en estado "Nuevo Lead" por más de 24 horas sin que lo atiendas, el sistema lo cambia automáticamente a "Crítico". Los leads en otros estados sin actividad por 7 días o más aparecen marcados con "Seguimiento pendiente" en tu dashboard.',
    tip: 'Atender un lead es tan simple como entrar a su perfil y hacer cualquier acción — cambiar estado, agregar una nota o registrar una llamada. Eso reinicia el contador.',
  },
  {
    icon: GitMerge,
    title: 'Leads Duplicados',
    description: 'El sistema detecta automáticamente cuando tienes dos leads que podrían ser la misma persona — por mismo teléfono, mismo correo electrónico o mismo nombre completo. Cuando hay duplicados, verás una alerta en el dashboard.',
    tip: 'Al entrar a la alerta de duplicados tienes dos opciones: "Combinar" (une los dos leads en uno, conservando el historial de ambos) o "No son duplicados" (descarta la alerta si en realidad son personas distintas).',
  },
  {
    icon: QrCode,
    title: 'Código QR para Actividades',
    description: 'Ve a "Plan y Reportes" → tab "Plan del Mes" y crea una actividad (feria, visita a escuela, etc.). Una vez creada, aparece automáticamente un código QR en la tarjeta de la actividad. Muéstralo en pantalla o imprímelo.',
    tip: 'Cuando un prospecto escanea el QR con su celular, llena el formulario de captación y el lead queda registrado automáticamente a tu nombre y vinculado a esa actividad.',
  },
  {
    icon: BarChart3,
    title: 'Informe de Cierre',
    description: 'Al final del mes ve a "Plan y Reportes" → "Informe de Cierre". Haz clic en "Generar reporte automático" para calcular tus estadísticas y enviar tu informe al supervisor.',
    tip: 'Tu puntuación: Básico = 100 leads y 10 matriculados · Bueno = 150 y 15 · Excelente = 200 y 20. Ambas condiciones deben cumplirse para la puntuación más alta.',
  },
]

const STEPS_SUPERVISOR: TutorialStep[] = [
  {
    icon: LayoutGrid,
    title: 'Tu Dashboard de Equipo',
    description: 'Ves los leads de todo tu equipo en una sola vista — los tuyos y los de cada representante. Las alertas de inactividad y leads críticos aplican a todos los leads del equipo.',
    tip: 'Puedes filtrar por estado o recinto. Si ves muchos leads "Críticos" de un representante, es señal de que necesita apoyo.',
  },
  {
    icon: AlertTriangle,
    title: 'Alertas: Crítico y Seguimiento',
    description: 'Un lead pasa automáticamente a "Crítico" si lleva más de 24 horas en estado "Nuevo Lead" sin ser atendido. Los leads en estados intermedios sin actividad por 7+ días muestran la alerta "Seguimiento pendiente".',
    tip: 'Estas alertas aplican a los leads de todo tu equipo. Úsalas para identificar cuál representante tiene leads abandonados y hacer seguimiento.',
  },
  {
    icon: GitMerge,
    title: 'Duplicados del Equipo',
    description: 'El sistema detecta leads duplicados por mismo teléfono, correo o nombre en todo tu equipo. Verás la alerta en el dashboard cuando existan pares duplicados.',
    tip: '"Combinar" une los dos leads en uno conservando el historial completo. "No son duplicados" descarta la alerta — útil si dos personas distintas coinciden en nombre.',
  },
  {
    icon: UserPlus,
    title: 'Agregar y Asignar Leads',
    description: 'Al crear un nuevo lead aparece el selector "Asignar a". Elige a cuál representante asignárselo. También puedes reasignar leads existentes desde el perfil del lead.',
    tip: 'Para reasignar un lead existente, entra al perfil del lead y busca el selector "Asignado a" — cambia el nombre y se guarda automáticamente.',
  },
  {
    icon: Download,
    title: 'Reporte del Equipo',
    description: 'En "Plan y Reportes" → tab "Equipo", selecciona el mes y descarga el reporte completo. CSV es para análisis en Excel; HTML es para presentar al director del recinto.',
    tip: 'El reporte incluye desglose por representante, actividades del mes, programas más solicitados y el historial de seguimiento de cada lead.',
  },
  {
    icon: BarChart3,
    title: 'Tu Informe Personal',
    description: 'Como supervisor también tienes tus propias métricas. Desde "Plan y Reportes" puedes planificar tus actividades y enviar tu propio informe de cierre mensual.',
    tip: 'Tu informe solo incluye tus leads directos, no los del equipo. Recuerda también crear actividades propias para generar tu código QR de captación.',
  },
]

const STEPS_ADMIN: TutorialStep[] = [
  {
    icon: Users,
    title: 'Gestión de Empleados',
    description: 'En el tab "Empleados" del Panel Admin puedes agregar nuevos empleados, editar su rol (Representante, Supervisor, Admin), asignar recintos y cambiar contraseñas.',
    tip: 'Para asignar un equipo a un supervisor, edita al empleado, cambia el rol a "Supervisor" y selecciona los representantes que supervisará.',
  },
  {
    icon: Lock,
    title: 'Cambiar Contraseña',
    description: 'Al editar cualquier empleado, hay un campo opcional "Nueva Contraseña" al final del formulario. Déjalo en blanco para no cambiarla, o escribe una nueva (mín. 8 caracteres).',
    tip: 'La contraseña nueva toma efecto inmediatamente — el empleado la necesitará en su próximo inicio de sesión.',
  },
  {
    icon: BarChart3,
    title: 'Informe General',
    description: 'El tab "Informe General" genera un resumen ejecutivo del mes: total de leads, matriculados, actividades y desempeño individual de cada representante.',
    tip: 'Selecciona cualquier mes anterior para ver el historial de rendimiento del equipo.',
  },
  {
    icon: ClipboardList,
    title: 'Informes de Cierre',
    description: 'El tab "Informes Enviados" muestra los informes mensuales enviados por todos los representantes — puedes ver sus métricas, puntuación y notas.',
    tip: 'Si un representante no aparece en la lista, aún no ha enviado su informe del mes.',
  },
  {
    icon: FileText,
    title: 'Importar Leads (CSV)',
    description: 'Desde el tab "Empleados" usa el botón "Importar CSV" para cargar leads históricos de Airtable u otras herramientas. El sistema detecta las columnas automáticamente.',
    tip: 'El importador muestra una vista previa de las primeras filas y te deja mapear las columnas antes de importar.',
  },
]

function TutorialModal({ role, onClose }: { role: string; onClose: () => void }) {
  const steps = role === 'admin' ? STEPS_ADMIN : (role === 'supervisor' || role === 'director') ? STEPS_SUPERVISOR : STEPS_EMPLEADO
  const [current, setCurrent] = useState(0)
  const step = steps[current]
  const Icon = step.icon
  const isFirst = current === 0
  const isLast = current === steps.length - 1

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-accent" />
            <span className="text-sm font-bold text-ink font-display">Tutorial</span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="h-4 w-4 text-gray-500" />
          </button>
        </div>

        {/* Step content */}
        <div className="px-6 py-6 flex-1">
          <div className="flex items-center justify-center mb-5">
            <div className="h-14 w-14 rounded-2xl bg-accent-soft flex items-center justify-center">
              <Icon className="h-7 w-7 text-accent" />
            </div>
          </div>

          <h2 className="text-base font-bold text-ink text-center mb-2 font-display">{step.title}</h2>
          <p className="text-sm text-gray-600 text-center leading-relaxed">{step.description}</p>

          {step.tip && (
            <div className="mt-4 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
              <p className="text-xs text-amber-800">
                <span className="font-semibold">Consejo: </span>{step.tip}
              </p>
            </div>
          )}
        </div>

        {/* Progress dots */}
        <div className="flex justify-center gap-1.5 pb-2">
          {steps.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`h-1.5 rounded-full transition-all ${i === current ? 'w-5 bg-accent' : 'w-1.5 bg-gray-200 hover:bg-gray-300'}`}
            />
          ))}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
          <button
            onClick={() => setCurrent((c) => c - 1)}
            disabled={isFirst}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-0 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Anterior
          </button>

          <span className="text-xs text-gray-400">{current + 1} / {steps.length}</span>

          {isLast ? (
            <button
              onClick={onClose}
              className="portal-btn"
            >
              ¡Listo!
            </button>
          ) : (
            <button
              onClick={() => setCurrent((c) => c + 1)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-semibold text-accent hover:bg-accent-soft transition-colors"
            >
              Siguiente
              <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default function PortalHeader({ employee }: PortalHeaderProps) {
  const [showTutorial, setShowTutorial] = useState(false)

  async function handleLogout() {
    await fetch('/api/portal/auth/logout', { method: 'POST' })
    window.location.href = '/portal/login'
  }

  return (
    <>
      <header className="bg-white/80 backdrop-blur border-b border-black/[0.06] px-4 md:px-6 py-3.5 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-9 w-9 rounded-full bg-ink text-white flex items-center justify-center text-sm font-bold flex-shrink-0 font-display">
              {employee.full_name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-ink font-display truncate">{employee.full_name}</p>
              <p className="text-xs text-ink-muted capitalize truncate">
                {employee.role === 'admin' ? 'Administrador' : employee.role === 'supervisor' ? 'Supervisor de Admisiones' : employee.role === 'director' ? 'Director de Recinto' : 'Representante de Admisiones'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0 overflow-x-auto no-scrollbar">
            {employee.campus.length > 0 && (
              <div className="hidden sm:flex items-center gap-1 mr-2">
                {employee.campus.map((c) => (
                  <span
                    key={c}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-accent-soft text-accent"
                  >
                    <Building2 className="h-3 w-3" />
                    {c}
                  </span>
                ))}
              </div>
            )}

            <button
              onClick={() => setShowTutorial(true)}
              className="flex items-center gap-1.5 text-sm font-medium text-ink-muted hover:text-ink hover:bg-surface transition-colors px-3 py-1.5 rounded-full"
            >
              <BookOpen className="h-4 w-4" />
              <span className="hidden sm:inline">Tutorial</span>
            </button>

            <a
              href="/portal/dashboard"
              className="flex items-center gap-1.5 text-sm font-medium text-ink-muted hover:text-ink hover:bg-surface transition-colors px-3 py-1.5 rounded-full"
            >
              <LayoutDashboard className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </a>

            {employee.role === 'admin' ? (
              <>
                <a
                  href="/portal/admin"
                  className="flex items-center gap-1.5 text-sm font-medium text-ink-muted hover:text-ink hover:bg-surface transition-colors px-3 py-1.5 rounded-full"
                >
                  <ClipboardList className="h-4 w-4" />
                  <span className="hidden sm:inline">Panel Admin</span>
                </a>
                <a
                  href="/portal/reportes"
                  className="flex items-center gap-1.5 text-sm font-medium text-ink-muted hover:text-ink hover:bg-surface transition-colors px-3 py-1.5 rounded-full"
                >
                  <BarChart3 className="h-4 w-4" />
                  <span className="hidden sm:inline">Reportes</span>
                </a>
              </>
            ) : (
              <a
                href="/portal/reportes"
                className="flex items-center gap-1.5 text-sm font-medium text-ink-muted hover:text-ink hover:bg-surface transition-colors px-3 py-1.5 rounded-full"
              >
                <ClipboardList className="h-4 w-4" />
                <span className="hidden sm:inline">Plan y Reportes</span>
              </a>
            )}

            <a
              href="/portal/contratos-privados"
              className="flex items-center gap-1.5 text-sm font-medium text-ink-muted hover:text-ink hover:bg-surface transition-colors px-3 py-1.5 rounded-full"
            >
              <Scissors className="h-4 w-4" />
              <span className="hidden sm:inline">Prog. Privados</span>
            </a>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-sm font-medium text-ink-muted hover:text-ink hover:bg-surface transition-colors px-3 py-1.5 rounded-full"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Cerrar sesión</span>
            </button>
          </div>
        </div>
      </header>

      {showTutorial && (
        <TutorialModal role={employee.role} onClose={() => setShowTutorial(false)} />
      )}
    </>
  )
}
