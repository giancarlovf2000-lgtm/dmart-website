'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Check, ChevronRight, ChevronLeft, Printer, AlertCircle, CheckCircle } from 'lucide-react'
import PortalHeader from '@/components/portal/PortalHeader'
import type { Employee } from '@/lib/types'

// ─── Business constants ──────────────────────────────────────────────────────

const PROGRAMS = {
  caballeros:  { label: 'Corte y Estilo Caballeros',   equipCost: 110, noEquipment: false },
  damas:       { label: 'Corte y Estilo Damas',         equipCost: 80,  noEquipment: false },
  unas:        { label: 'Técnica de Uñas',              equipCost: 40,  noEquipment: false },
  facturacion: { label: 'Facturación a Planes Médicos', equipCost: 0,   noEquipment: true  },
} as const
type ProgramKey = keyof typeof PROGRAMS

const PROGRAM_COST        = 495
const ADMISSION           = 25
const PROG_DEFERRED_ADMIN = 25
const EQ_DEFERRED_ADMIN   = 20
const EQ_DEPOSIT_RATE     = 0.50
const DISCOUNT            = 0.10
const WEEKS               = 11

function fmt(n: number) { return `$${n.toFixed(2)}` }

function calcPrices(prog: ProgramKey, progPlan: 'complete' | 'deferred', eqPlan: 'complete' | 'deferred' | 'student' | 'none') {
  const eq = PROGRAMS[prog].equipCost

  const progCompleteAmt    = PROGRAM_COST * (1 - DISCOUNT)                // 445.50
  const progDeferredWeekly = (PROGRAM_COST + PROG_DEFERRED_ADMIN) / WEEKS // 47.27
  const eqCompleteAmt      = eq * (1 - DISCOUNT)
  // Plan diferido del kit: depósito del 50% + $20 al inicio; el 50% restante en 11 cuotas.
  const eqDeferredDeposit  = eq * EQ_DEPOSIT_RATE + EQ_DEFERRED_ADMIN
  const eqDeferredWeekly   = (eq * EQ_DEPOSIT_RATE) / WEEKS

  const progInitial = progPlan === 'complete' ? progCompleteAmt : 0
  const eqInitial   = eqPlan === 'complete' ? eqCompleteAmt : eqPlan === 'deferred' ? eqDeferredDeposit : 0
  const initial     = ADMISSION + progInitial + eqInitial

  const weeklyProg  = progPlan === 'deferred' ? progDeferredWeekly : 0
  const weeklyEq    = eqPlan   === 'deferred' ? eqDeferredWeekly  : 0
  const weeklyTotal = weeklyProg + weeklyEq

  const totalContract = ADMISSION
    + (progPlan === 'complete' ? progCompleteAmt : PROGRAM_COST + PROG_DEFERRED_ADMIN)
    + (eqPlan === 'complete' ? eqCompleteAmt : eqPlan === 'deferred' ? eq + EQ_DEFERRED_ADMIN : 0)

  const scenario = progPlan === 'complete'
    ? (eqPlan === 'complete' ? 1 : eqPlan === 'deferred' ? 2 : 5)
    : (eqPlan === 'complete' ? 3 : eqPlan === 'deferred' ? 4 : 6)

  return { initial, weeklyProg, weeklyEq, weeklyTotal, totalContract, scenario, progCompleteAmt, eqCompleteAmt, progDeferredWeekly, eqDeferredWeekly, eqDeferredDeposit }
}

// ─── Student info type ───────────────────────────────────────────────────────

interface StudentInfo {
  nombre: string
  ssn4: string
  dob: string
  age: string
  telefono: string
  email: string
  direccion: string
  emergencia_nombre: string
  emergencia_tel: string
  fecha_inicio: string
  fecha_fin: string
  horario: string
  modalidad: string
  menor: boolean
  tutor_nombre: string
  tutor_tel: string
}

const emptyStudent = (): StudentInfo => ({
  nombre: '', ssn4: '', dob: '', age: '', telefono: '', email: '',
  direccion: '', emergencia_nombre: '', emergencia_tel: '',
  fecha_inicio: '', fecha_fin: '', horario: '', modalidad: 'Presencial',
  menor: false, tutor_nombre: '', tutor_tel: '',
})

// ─── Contract HTML builder ───────────────────────────────────────────────────

function buildContractHtml(params: {
  program: ProgramKey
  progPlan: 'complete' | 'deferred' | null
  eqPlan: 'complete' | 'deferred' | 'student' | 'none' | null
  student: StudentInfo
  prices: ReturnType<typeof calcPrices>
  employeeName: string
  blank?: boolean
}) {
  const { program, progPlan, eqPlan, student, prices, employeeName, blank: isBlank = false } = params
  const progLabel = PROGRAMS[program].label
  const eq = PROGRAMS[program].equipCost

  const check = (cond: boolean) => cond ? '☑' : '☐'
  const blank = (label: string) => `<span style="border-bottom:1px solid #000;display:inline-block;min-width:180px;">&nbsp;${label}&nbsp;</span>`

  const eqCompleteLabel = `${fmt(prices.eqCompleteAmt)} (10% desc.)`
  const eqDeferredLabel = `11 cuotas de ≈${fmt(prices.eqDeferredWeekly)}/sem`
  const eqDepositLabel  = fmt(prices.eqDeferredDeposit)

  const termsAndConditions = `
<h3 style="margin:20px 0 8px;font-size:13px;border-bottom:2px solid #c9a227;padding-bottom:3px;">TÉRMINOS Y CONDICIONES</h3>
<ol type="a" style="font-size:11px;line-height:1.6;margin:0;padding-left:20px;">
  <li style="margin-bottom:6px;"><strong>Flexibilidad Curricular.</strong> La Institución podrá actualizar o modificar profesores, currículo, contenido académico, reglamentos, horarios y metodologías de enseñanza cuando sea necesario por razones académicas, operacionales o regulatorias. Se compromete a proveer certificado de participación y/o de completar al completar las 36 horas de contacto con la cuenta al día.</li>
  <li style="margin-bottom:6px;"><strong>Derecho de Cancelación y Posposición.</strong> La Institución se reserva el derecho de cancelar, posponer o reprogramar cualquier programa por inscripción insuficiente, situaciones operacionales o causas fuera de su control razonable. Si la Institución cancela oficialmente el programa, el estudiante no será responsable por balances pendientes futuros exclusivamente relacionados con ese programa, siempre que la cuenta esté al día al momento de la cancelación.</li>
  <li style="margin-bottom:6px;"><strong>Costo del Programa y Plan de Pago Diferido.</strong> El costo base de todos los programas privados cortos es de $495.00. El estudiante que no pague el monto completo antes del inicio podrá utilizar el plan de pago diferido autorizado con cargo administrativo de $25.00. Total a financiar: $520.00 ($495.00 + $25.00), distribuido en 11 pagos semanales referenciales de aproximadamente $47.27 ($520.00 ÷ 11), sin descuento.</li>
  <li style="margin-bottom:6px;"><strong>Descuento por Pago Completo del Programa.</strong> El estudiante que pague el costo completo del programa antes del inicio oficial o en el primer día de clases podrá recibir un descuento promocional del 10%. Total con descuento: $445.50. El cargo de admisión de $25.00 se cobra por separado al inicio y no se acredita a este total.</li>
  <li style="margin-bottom:6px;"><strong>Cargo de Admisión.</strong> El cargo de admisión de $25.00 es no reembolsable, se cobra por separado al inicio en todos los escenarios, NO se acredita al costo del programa, no reduce el monto a financiar y no se distribuye dentro de los 11 pagos semanales.</li>
  <li style="margin-bottom:6px;"><strong>Independencia de Planes de Pago del Programa y Equipo.</strong> La selección del plan de pago del programa es independiente de la selección del equipo/materiales/kit. El pago completo del programa no obliga el pago completo del equipo, y viceversa. El descuento del 10% aplica solo al componente pagado en su totalidad antes del inicio.</li>
  <li style="margin-bottom:6px;"><strong>Costos Base y Descuento por Pago Completo de Equipo/Materiales/Kit.</strong> Costos base: Corte y Estilo Caballeros $110.00, Corte y Estilo Damas $80.00, Técnica de Uñas $40.00. El pago completo antes del inicio oficial recibe descuento del 10%: Caballeros $99.00, Damas $72.00, Uñas $36.00.</li>
  <li style="margin-bottom:6px;"><strong>Plan de Pago Diferido de Equipo.</strong> El estudiante que utilice el plan diferido de equipo paga al inicio un depósito equivalente al 50% del costo del kit más $20.00 de cargo administrativo, y financia el 50% restante del kit en 11 pagos semanales sin descuento. Valores referenciales — Caballeros: depósito $75.00 y ≈$5.00/sem; Damas: depósito $60.00 y ≈$3.64/sem; Uñas: depósito $40.00 y ≈$1.82/sem.</li>
  <li style="margin-bottom:6px;"><strong>Cargo Administrativo del Plan Diferido de Equipo.</strong> El cargo de $20.00 aplica solo cuando el estudiante selecciona el plan diferido de equipo y se cobra dentro del depósito inicial. Si paga el equipo completamente antes del inicio: aplica el 10% de descuento y NO aplica el cargo administrativo ni el depósito. El equipo diferido no recibe descuento.</li>
  <li style="margin-bottom:6px;"><strong>Opción de Equipo Aportado por el Estudiante.</strong> El estudiante puede aportar o adquirir el equipo, materiales o kit fuera de la institución. En tal caso no aplican cargos por el componente de equipo. La equivalencia técnica debe ser validada por el Academic Officer de la institución antes del inicio del programa.</li>
  <li style="margin-bottom:6px;"><strong>No Reembolsabilidad del Equipo Adquirido.</strong> El equipo, materiales o kits educativos adquiridos a través de la institución no son reembolsables una vez entregados.</li>
  <li style="margin-bottom:6px;"><strong>Responsabilidad del Estudiante por Daños.</strong> El estudiante es responsable por daños intencionales o uso negligente del equipo, herramientas, mobiliario o propiedad institucional. La institución podrá requerir reparación, restitución o compensación económica.</li>
  <li style="margin-bottom:6px;"><strong>Procedimientos de Cobro.</strong> Balances en mora, pagos devueltos, cuentas delincuentes o incumplimiento de pagos podrán ser referidos a procesos de cobro internos o externos, incluyendo agencias de cobro autorizadas, costos administrativos, cargos bancarios, honorarios legales y otros costos razonables permitidos por ley.</li>
  <li style="margin-bottom:6px;"><strong>Retención de Documentos.</strong> La institución podrá retener certificados, constancias, documentos académicos o evidencia de completar mientras existan balances pendientes relacionados con la matrícula, equipo, materiales o planes de pago.</li>
  <li style="margin-bottom:6px;"><strong>Reposición de Clases.</strong> La ausencia del profesor, situaciones de emergencia o interrupciones operacionales podrán resultar en reposición de clases en fechas determinadas por la institución.</li>
  <li style="margin-bottom:6px;"><strong>Reconocimiento de Políticas Institucionales.</strong> El estudiante reconoce haber recibido orientación sobre las normas institucionales, políticas disciplinarias, políticas financieras y requisitos mínimos de asistencia para el programa matriculado.</li>
  <li style="margin-bottom:6px;"><strong>No Renuncia de Obligaciones Financieras.</strong> La falta de asistencia, abandono voluntario o discontinuación del programa por parte del estudiante no lo exime de las obligaciones financieras establecidas en este Contrato.</li>
  <li style="margin-bottom:6px;"><strong>Menores de Edad y Firma del Padre/Madre/Tutor.</strong> El estudiante menor de 18 años deberá contar con la firma del padre, madre o tutor legal, quien acepta las obligaciones financieras y académicas de forma solidaria con el estudiante.</li>
  <li style="margin-bottom:6px;"><strong>Autorización para Comunicaciones.</strong> El estudiante autoriza a la institución a contactarle vía telefónica, mensaje de texto, correo electrónico o correo postal para fines académicos, administrativos y de cobro relacionados con este Contrato. El estudiante podrá actualizar su información de contacto en cualquier momento mediante notificación escrita a la institución.</li>
  <li style="margin-bottom:6px;"><strong>Autorización para Recopilación de Datos.</strong> El estudiante autoriza a la institución a recopilar, mantener y procesar información personal y académica necesaria para administrar la matrícula, cumplir con obligaciones contractuales y cumplir con los requisitos regulatorios aplicables en Puerto Rico.</li>
  <li style="margin-bottom:6px;"><strong>Ley Aplicable.</strong> Este Contrato se rige e interpreta conforme a las leyes de Puerto Rico. Cualquier controversia se ventilará en los tribunales competentes de Puerto Rico, sin perjuicio de los derechos del estudiante reconocidos por la legislación aplicable.</li>
  <li style="margin-bottom:6px;"><strong>Separabilidad.</strong> Si alguna disposición de este Contrato fuera declarada nula, ilegal o inaplicable por un foro competente, las demás disposiciones permanecerán en plena vigencia y efecto.</li>
  <li style="margin-bottom:6px;"><strong>Validación de Calculadora/Dashboard.</strong> Los cálculos finales en las Tablas 1 al 4 deben coincidir con la calculadora/dashboard de admisiones institucional y ser validados por la Oficina de Tesorería antes de la firma del estudiante. En caso de discrepancia, prevalecen los montos validados por Tesorería.</li>
  <li style="margin-bottom:6px;"><strong>Acuerdo Completo.</strong> Este Contrato con sus apéndices, políticas institucionales incorporadas o reglamentos firmados por las partes constituye el acuerdo completo. Cualquier enmienda deberá constar por escrito y ser firmada por ambas partes.</li>
</ol>`

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Contrato — ${progLabel} — ${student.nombre}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: Arial, sans-serif; color: #1f2937; margin: 0; padding: 24px; font-size: 12px; }
  h1 { font-size: 16px; color: #0a1628; text-align: center; margin: 0 0 2px; }
  h2 { font-size: 13px; color: #0a1628; border-bottom: 2px solid #c9a227; padding-bottom: 3px; margin: 18px 0 8px; }
  .subtitle { text-align: center; font-size: 11px; color: #6b7280; margin-bottom: 4px; }
  .inst { text-align: center; font-size: 11px; color: #0a1628; font-weight: bold; letter-spacing: 1px; margin-bottom: 16px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 10px; font-size: 11px; }
  th { background: #0a1628; color: #fff; padding: 5px 8px; text-align: left; font-size: 11px; }
  td { padding: 4px 8px; border-bottom: 1px solid #e5e7eb; vertical-align: top; }
  td.label { font-weight: bold; color: #374151; width: 38%; }
  .check-row td { padding: 3px 8px; }
  .sig-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 16px; }
  .sig-box { border-top: 1px solid #374151; padding-top: 6px; }
  .sig-label { font-size: 10px; color: #6b7280; }
  @media print {
    body { margin: 0; padding: 16px; }
    h2 { page-break-after: avoid; }
    ol li { page-break-inside: avoid; }
    .no-break { page-break-inside: avoid; }
  }
</style>
</head>
<body>

<div class="inst">D'MART INSTITUTE</div>
<h1>CONTRATO DE MATRÍCULA</h1>
<p class="subtitle">Programas Privados Cortos — Sección de Educación Continua</p>
<p class="subtitle">Fecha de generación: ${new Date().toLocaleDateString('es-PR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
${isBlank ? '<p class="subtitle" style="color:#b45309;font-weight:bold;">FORMULARIO EN BLANCO — Marque o circule las opciones deseadas y complete a mano</p>' : ''}

<h2>INFORMACIÓN DEL ESTUDIANTE</h2>
<table>
  <tr><td class="label">Nombre completo</td><td>${student.nombre || '&nbsp;'}</td><td class="label">Últimos 4 del SS</td><td>${student.ssn4 ? `XXX-XX-${student.ssn4}` : '&nbsp;'}</td></tr>
  <tr><td class="label">Fecha de nacimiento</td><td>${student.dob || '&nbsp;'}</td><td class="label">Edad</td><td>${student.age || '&nbsp;'}</td></tr>
  <tr><td class="label">Teléfono</td><td>${student.telefono || '&nbsp;'}</td><td class="label">Correo electrónico</td><td>${student.email || '&nbsp;'}</td></tr>
  <tr><td class="label">Dirección postal</td><td colspan="3">${student.direccion || '&nbsp;'}</td></tr>
  <tr><td class="label">Contacto de emergencia</td><td>${student.emergencia_nombre || '&nbsp;'}</td><td class="label">Tel. emergencia</td><td>${student.emergencia_tel || '&nbsp;'}</td></tr>
  ${student.menor ? `<tr><td class="label">Nombre del padre/madre/tutor</td><td>${student.tutor_nombre || '&nbsp;'}</td><td class="label">Tel. tutor</td><td>${student.tutor_tel || '&nbsp;'}</td></tr>` : ''}
</table>

<h2>DATOS DEL PROGRAMA</h2>
<table>
  <tr><td class="label">Fecha de inicio</td><td>${student.fecha_inicio || '&nbsp;'}</td><td class="label">Fecha estimada de finalización</td><td>${student.fecha_fin || '&nbsp;'}</td></tr>
  <tr><td class="label">Horario</td><td>${student.horario || '&nbsp;'}</td><td class="label">Modalidad</td><td>${student.modalidad || '&nbsp;'}</td></tr>
</table>

<h2>TABLA 1 — PROGRAMA SELECCIONADO</h2>
<table>
  <thead><tr><th>Programa</th><th>Horas</th><th>Costo Programa</th><th>Costo Equipo</th></tr></thead>
  <tbody>
    <tr><td>${progLabel}</td><td>36</td><td>$495.00</td><td>${PROGRAMS[program].noEquipment ? 'No aplica' : fmt(eq)}</td></tr>
  </tbody>
</table>

<h2>TABLA 2 — PLAN DE PAGO DEL PROGRAMA</h2>
<table>
  <thead><tr><th>Sel.</th><th>Plan</th><th>Total</th><th>Cuota Semanal</th></tr></thead>
  <tbody>
    <tr class="check-row"><td>${check(progPlan === 'complete')}</td><td>Pago completo antes o en el primer día de clases (10% de descuento)</td><td>$445.50</td><td>$0.00</td></tr>
    <tr class="check-row"><td>${check(progPlan === 'deferred')}</td><td>Plan diferido — 11 cuotas semanales (cargo administrativo $25.00 incluido)</td><td>$520.00</td><td>≈$47.27</td></tr>
  </tbody>
</table>

<h2>TABLA 3 — TRATAMIENTO DE EQUIPO / MATERIALES / KIT</h2>
<table>
  <thead><tr><th>Sel.</th><th>Opción</th><th>Monto</th><th>Cuota Semanal</th></tr></thead>
  <tbody>
    <tr class="check-row"><td>${check(eqPlan === 'complete')}</td><td>Pago completo antes o al inicio (10% de descuento)</td><td>${eqCompleteLabel}</td><td>$0.00</td></tr>
    <tr class="check-row"><td>${check(eqPlan === 'deferred')}</td><td>Plan diferido — depósito 50% del kit + $20.00 al inicio, resto en 11 cuotas semanales</td><td>${eqDepositLabel} depósito</td><td>${eqDeferredLabel}</td></tr>
    <tr class="check-row"><td>${check(eqPlan === 'student')}</td><td>El estudiante aporta su propio equipo (debe ser validado por Academic Officer)</td><td>$0.00</td><td>$0.00</td></tr>
    <tr class="check-row"><td>${check(eqPlan === 'none')}</td><td>Este programa no requiere kit institucional</td><td>—</td><td>—</td></tr>
  </tbody>
</table>

<h2>TABLA 4 — RESUMEN FINANCIERO FINAL</h2>
<div class="no-break">
<table>
  <tr><td class="label">Programa seleccionado</td><td colspan="3">${isBlank ? progLabel : `${progLabel} (Escenario #${prices.scenario})`}</td></tr>
  <tr><td class="label">Cargo de admisión (no reembolsable, separado)</td><td colspan="3">$25.00</td></tr>
  <tr><td class="label">Plan de pago del programa</td><td colspan="3">${isBlank ? blank('') : (progPlan === 'complete' ? 'Pago completo — $445.50' : 'Plan diferido — 11 cuotas de ≈$47.27/sem')}</td></tr>
  <tr><td class="label">Tratamiento de equipo</td><td colspan="3">${isBlank ? blank('') : (eqPlan === 'complete' ? `Pago completo — ${eqCompleteLabel}` : eqPlan === 'deferred' ? `Plan diferido — depósito ${eqDepositLabel} (50% del kit + $20) + ${eqDeferredLabel}` : 'Estudiante aporta su propio equipo')}</td></tr>
  <tr style="background:#fef9c3;"><td class="label"><strong>Pago inicial mínimo a cobrar HOY</strong></td><td colspan="3">${isBlank ? blank('') : `<strong>${fmt(prices.initial)}</strong> (incluye cargo admisión de $25.00)`}</td></tr>
  <tr><td class="label">Cuota semanal — Programa</td><td colspan="3">${isBlank ? blank('') : (prices.weeklyProg > 0 ? fmt(prices.weeklyProg) : '$0.00')}</td></tr>
  <tr><td class="label">Cuota semanal — Equipo/materiales</td><td colspan="3">${isBlank ? blank('') : (prices.weeklyEq > 0 ? fmt(prices.weeklyEq) : '$0.00')}</td></tr>
  <tr style="background:#f0fdf4;"><td class="label"><strong>Total cuota semanal</strong></td><td colspan="3">${isBlank ? blank('') : `<strong>${prices.weeklyTotal > 0 ? fmt(prices.weeklyTotal) : '$0.00'}</strong>`}</td></tr>
  <tr><td class="label">Fecha del primer pago semanal</td><td colspan="3">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</td></tr>
  <tr><td class="label">Fecha del último pago semanal</td><td colspan="3">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</td></tr>
  <tr><td class="label">Nota de ajuste — último pago</td><td colspan="3">El último pago podrá ajustarse por redondeo, validado por la Oficina de Tesorería.</td></tr>
  <tr style="background:#eff6ff;"><td class="label"><strong>Total estimado del contrato</strong></td><td colspan="3">${isBlank ? blank('') : `<strong>${fmt(prices.totalContract)}</strong>`}</td></tr>
</table>
<p style="font-size:10px;color:#6b7280;margin:4px 0 12px;">Validado por Oficial de Tesorería: ${blank('')} &nbsp; Fecha: ${blank('')}</p>
</div>

${termsAndConditions}

<h2 style="margin-top:24px;">FIRMAS</h2>
<div class="sig-grid">
  <div class="sig-box">
    <div style="height:36px;"></div>
    <div class="sig-label">Firma del Estudiante &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Fecha</div>
    <div style="font-size:11px;margin-top:4px;">${student.nombre}</div>
  </div>
  ${student.menor ? `<div class="sig-box">
    <div style="height:36px;"></div>
    <div class="sig-label">Firma Padre/Madre/Tutor &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Fecha</div>
    <div style="font-size:11px;margin-top:4px;">${student.tutor_nombre || '(Tutor Legal)'}</div>
  </div>` : '<div></div>'}
  <div class="sig-box" style="margin-top:20px;">
    <div style="height:36px;"></div>
    <div class="sig-label">Firma del Oficial de Tesorería &nbsp;&nbsp;&nbsp;&nbsp; Fecha</div>
  </div>
  <div class="sig-box" style="margin-top:20px;">
    <div style="height:36px;"></div>
    <div class="sig-label">Firma del Representante de Admisiones &nbsp; Fecha</div>
    <div style="font-size:11px;margin-top:4px;">${employeeName}</div>
  </div>
</div>

<p style="font-size:9px;color:#9ca3af;text-align:center;margin-top:24px;">
  D'MART Institute · Documento generado electrónicamente — debe ser revisado y validado por Tesorería antes de su firma.
</p>

</body>
</html>`
}

// ─── Contract history row type ───────────────────────────────────────────────

interface ContractRow {
  id: string
  program: ProgramKey
  scenario: number
  student_name: string
  initial_payment: number
  weekly_total: number
  total_contract: number
  created_at: string
  employee_name: string
  campus: string | null
}

const PROGRAM_LABELS: Record<string, string> = {
  caballeros:  'Corte y Estilo Caballeros',
  damas:       'Corte y Estilo Damas',
  unas:        'Técnica de Uñas',
  facturacion: 'Facturación a Planes Médicos',
}

// ─── Main component ──────────────────────────────────────────────────────────

function ContratosPrivadosContent() {
  const searchParams = useSearchParams()
  const [employee, setEmployee] = useState<Pick<Employee, 'full_name' | 'campus' | 'role'> | null>(null)
  const [step, setStep] = useState(1)
  const [program, setProgram] = useState<ProgramKey | null>(null)
  const [progPlan, setProgPlan] = useState<'complete' | 'deferred' | null>(null)
  const [eqPlan, setEqPlan] = useState<'complete' | 'deferred' | 'student' | 'none' | null>(null)
  const [student, setStudent] = useState<StudentInfo>(emptyStudent())
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [contracts, setContracts] = useState<ContractRow[]>([])
  const [loadingContracts, setLoadingContracts] = useState(true)
  const [blankProgram, setBlankProgram] = useState<ProgramKey>('caballeros')

  useEffect(() => {
    // Pre-fill from lead profile URL params
    const programParam = searchParams.get('program') as ProgramKey | null
    if (programParam && programParam in PROGRAMS) {
      setProgram(programParam)
      setEqPlan(PROGRAMS[programParam].noEquipment ? 'none' : null)
      setStep(2)
      setStudent((prev) => ({
        ...prev,
        nombre: searchParams.get('nombre') ?? '',
        telefono: searchParams.get('telefono') ?? '',
        email: searchParams.get('email') ?? '',
      }))
    }

    fetch('/api/portal/me')
      .then((r) => r.json())
      .then((d) => { if (d.employee) setEmployee(d.employee) })
      .catch(() => {})

    fetch('/api/portal/private-contracts')
      .then((r) => r.json())
      .then((d) => { setContracts(d.contracts ?? []); setLoadingContracts(false) })
      .catch(() => setLoadingContracts(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function setSI(field: keyof StudentInfo, value: string | boolean) {
    setStudent((p) => ({ ...p, [field]: value }))
  }

  const prices = program && progPlan && eqPlan ? calcPrices(program, progPlan, eqPlan) : null

  async function handlePrint() {
    if (!program || !progPlan || !eqPlan || !prices) return
    setSaving(true); setSaveError(''); setSaved(false)

    const html = buildContractHtml({
      program, progPlan, eqPlan, student, prices,
      employeeName: employee?.full_name ?? '',
    })

    const res = await fetch('/api/portal/private-contracts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        program, scenario: prices.scenario,
        student_name: student.nombre,
        student_phone: student.telefono,
        student_email: student.email,
        program_payment: progPlan,
        equipment_option: eqPlan,
        initial_payment: prices.initial,
        weekly_total: prices.weeklyTotal,
        total_contract: prices.totalContract,
        start_date: student.fecha_inicio,
        campus: student.horario ? undefined : undefined,
        contract_html: html,
      }),
    })

    if (res.ok) {
      setSaved(true)
      const d = await res.json()
      setContracts((prev) => [{
        id: d.id, program, scenario: prices.scenario,
        student_name: student.nombre,
        initial_payment: prices.initial, weekly_total: prices.weeklyTotal,
        total_contract: prices.totalContract,
        created_at: new Date().toISOString(),
        employee_name: employee?.full_name ?? '',
        campus: null,
      }, ...prev])
    } else {
      const data = await res.json()
      setSaveError(data.error ?? 'Error al guardar.')
    }
    setSaving(false)

    const win = window.open('', '_blank')
    if (win) {
      win.document.write(html)
      win.document.close()
      setTimeout(() => win.print(), 600)
    }
  }

  // Imprimir un contrato EN BLANCO de un programa (copia física, sin guardar).
  function printBlankContract(prog: ProgramKey) {
    const refPrices = calcPrices(prog, 'deferred', PROGRAMS[prog].noEquipment ? 'none' : 'deferred')
    const html = buildContractHtml({
      program: prog, progPlan: null, eqPlan: null,
      student: emptyStudent(), prices: refPrices, employeeName: '', blank: true,
    })
    const win = window.open('', '_blank')
    if (win) {
      win.document.write(html)
      win.document.close()
      setTimeout(() => win.print(), 600)
    }
  }

  // Reabrir un contrato del historial (HTML guardado).
  async function handleViewContract(id: string) {
    const res = await fetch(`/api/portal/private-contracts/${id}`)
    if (!res.ok) { alert('No se pudo cargar el contrato.'); return }
    const { contract_html } = await res.json()
    if (!contract_html) {
      alert('Este contrato no se puede abrir (fue generado antes de esta actualización).')
      return
    }
    const win = window.open('', '_blank')
    if (win) {
      win.document.write(contract_html)
      win.document.close()
    }
  }

  if (!employee) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="animate-spin h-8 w-8 rounded-full border-4 border-ink border-t-transparent" />
      </div>
    )
  }

  // ── Step indicators ────────────────────────────────────────────────────────
  const steps = ['Programa', 'Estudiante', 'Pagos', 'Contrato']

  const inputCls = 'w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent-ring bg-white'
  const labelCls = 'text-xs font-medium text-gray-600 mb-1 block'

  return (
    <>
      <PortalHeader employee={employee} />
      <div className="min-h-screen bg-surface pb-16">
        <div className="bg-white border-b border-gray-200 px-4 md:px-6 py-4">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-base font-bold text-gray-900">Programas Privados Cortos</h1>
            <p className="text-xs text-gray-500 mt-0.5">Genera cotización y contrato para el prospecto</p>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 md:px-6 py-6 space-y-6">

          {/* Contratos en blanco para imprimir (copias físicas, por si se cae el internet) */}
          <div className="bg-white rounded-2xl border border-black/[0.06] shadow-soft p-5">
            <div className="flex items-center gap-2 mb-1">
              <Printer className="h-4 w-4 text-accent" />
              <h2 className="text-sm font-bold text-gray-900">Contratos en blanco para imprimir</h2>
            </div>
            <p className="text-xs text-gray-500 mb-4">
              Descarga un contrato en blanco por programa para tener copias físicas (por si se va el internet).
              El estudiante marca o circula las opciones de pago y de materiales a mano.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <select value={blankProgram} onChange={(e) => setBlankProgram(e.target.value as ProgramKey)}
                className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-accent-ring">
                {(Object.entries(PROGRAMS) as [ProgramKey, { label: string }][]).map(([key, prog]) => (
                  <option key={key} value={key}>{prog.label}</option>
                ))}
              </select>
              <button onClick={() => printBlankContract(blankProgram)}
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-white text-sm font-semibold hover:bg-accent-hover transition-colors">
                <Printer className="h-4 w-4" /> Descargar / Imprimir contrato en blanco
              </button>
            </div>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-0">
            {steps.map((label, i) => {
              const n = i + 1
              const done = step > n
              const active = step === n
              return (
                <div key={label} className="flex items-center flex-1 last:flex-none">
                  <div className="flex flex-col items-center">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${done ? 'bg-green-500 text-white' : active ? 'bg-ink text-white' : 'bg-gray-100 text-gray-400'}`}>
                      {done ? <Check className="h-4 w-4" /> : n}
                    </div>
                    <span className={`text-xs mt-1 font-medium ${active ? 'text-ink' : done ? 'text-green-600' : 'text-gray-400'}`}>{label}</span>
                  </div>
                  {i < steps.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-1 mb-5 transition-colors ${done ? 'bg-green-400' : 'bg-gray-200'}`} />
                  )}
                </div>
              )
            })}
          </div>

          {/* ── Step 1: Program selection ────────────────────────────────── */}
          {step === 1 && (
            <div className="bg-white rounded-2xl border border-black/[0.06] shadow-soft p-6">
              <h2 className="text-sm font-bold text-gray-900 mb-4">¿Qué programa desea el prospecto?</h2>
              <div className="space-y-3">
                {(Object.entries(PROGRAMS) as [ProgramKey, { label: string; equipCost: number; noEquipment: boolean }][]).map(([key, prog]) => (
                  <button
                    key={key}
                    onClick={() => { setProgram(key); setEqPlan(prog.noEquipment ? 'none' : null) }}
                    className={`w-full text-left border-2 rounded-xl p-4 transition-all ${program === key ? 'border-ink bg-surface' : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-gray-900">{prog.label}</p>
                        <p className="text-xs text-gray-500 mt-0.5">36 horas de contacto</p>
                        <div className="flex gap-4 mt-2 text-xs text-gray-600">
                          <span>Programa: <span className="font-medium">$495.00</span></span>
                          {prog.noEquipment
                            ? <span className="text-gray-400 italic">Sin equipo institucional</span>
                            : <span>Equipo: <span className="font-medium">${prog.equipCost}.00</span></span>
                          }
                        </div>
                      </div>
                      <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${program === key ? 'border-ink bg-ink' : 'border-gray-300'}`}>
                        {program === key && <Check className="h-3.5 w-3.5 text-white" />}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              <div className="mt-5 flex justify-end">
                <button
                  onClick={() => setStep(2)}
                  disabled={!program}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-ink text-white text-sm font-semibold hover:bg-black disabled:opacity-40 transition-colors"
                >
                  Continuar <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* ── Step 2: Student info ─────────────────────────────────────── */}
          {step === 2 && (
            <div className="bg-white rounded-2xl border border-black/[0.06] shadow-soft p-6">
              <h2 className="text-sm font-bold text-gray-900 mb-4">Información del Estudiante</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className={labelCls}>Nombre completo <span className="text-red-500">*</span></label>
                  <input className={inputCls} value={student.nombre} onChange={(e) => setSI('nombre', e.target.value)} placeholder="Nombre y apellido(s)" />
                </div>
                <div>
                  <label className={labelCls}>Últimos 4 dígitos del Seguro Social</label>
                  <input className={inputCls} maxLength={4} value={student.ssn4} onChange={(e) => setSI('ssn4', e.target.value.replace(/\D/g, ''))} placeholder="XXXX" />
                </div>
                <div>
                  <label className={labelCls}>Fecha de nacimiento</label>
                  <input className={inputCls} type="date" value={student.dob} onChange={(e) => setSI('dob', e.target.value)} />
                </div>
                <div>
                  <label className={labelCls}>Edad</label>
                  <input className={inputCls} type="number" min={14} max={99} value={student.age} onChange={(e) => setSI('age', e.target.value)} placeholder="Edad" />
                </div>
                <div>
                  <label className={labelCls}>Teléfono <span className="text-red-500">*</span></label>
                  <input className={inputCls} type="tel" value={student.telefono} onChange={(e) => setSI('telefono', e.target.value)} placeholder="(787) 000-0000" />
                </div>
                <div>
                  <label className={labelCls}>Correo electrónico</label>
                  <input className={inputCls} type="email" value={student.email} onChange={(e) => setSI('email', e.target.value)} placeholder="correo@email.com" />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelCls}>Dirección postal</label>
                  <input className={inputCls} value={student.direccion} onChange={(e) => setSI('direccion', e.target.value)} placeholder="Calle, ciudad, estado, código postal" />
                </div>
                <div>
                  <label className={labelCls}>Contacto de emergencia — Nombre</label>
                  <input className={inputCls} value={student.emergencia_nombre} onChange={(e) => setSI('emergencia_nombre', e.target.value)} placeholder="Nombre completo" />
                </div>
                <div>
                  <label className={labelCls}>Contacto de emergencia — Teléfono</label>
                  <input className={inputCls} type="tel" value={student.emergencia_tel} onChange={(e) => setSI('emergencia_tel', e.target.value)} placeholder="(787) 000-0000" />
                </div>
                <div>
                  <label className={labelCls}>Fecha de inicio <span className="text-gray-400 font-normal">(opcional)</span></label>
                  <input className={inputCls} type="date" value={student.fecha_inicio} onChange={(e) => setSI('fecha_inicio', e.target.value)} />
                </div>
                <div>
                  <label className={labelCls}>Fecha estimada de finalización</label>
                  <input className={inputCls} type="date" value={student.fecha_fin} onChange={(e) => setSI('fecha_fin', e.target.value)} />
                </div>
                <div>
                  <label className={labelCls}>Horario</label>
                  <select className={inputCls} value={student.horario} onChange={(e) => setSI('horario', e.target.value)}>
                    <option value="">Seleccionar…</option>
                    {['Diurno', 'Nocturno', 'Sabatino'].map((h) => <option key={h}>{h}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Modalidad</label>
                  <select className={inputCls} value={student.modalidad} onChange={(e) => setSI('modalidad', e.target.value)}>
                    <option>Presencial</option>
                    <option>Híbrido</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={student.menor} onChange={(e) => setSI('menor', e.target.checked)} className="h-4 w-4 rounded border-gray-300" />
                    <span className="text-sm text-gray-700">El estudiante es menor de 18 años (requiere firma de padre/madre/tutor)</span>
                  </label>
                </div>

                {student.menor && (
                  <>
                    <div>
                      <label className={labelCls}>Nombre del padre/madre/tutor <span className="text-red-500">*</span></label>
                      <input className={inputCls} value={student.tutor_nombre} onChange={(e) => setSI('tutor_nombre', e.target.value)} placeholder="Nombre completo del tutor" />
                    </div>
                    <div>
                      <label className={labelCls}>Teléfono del tutor <span className="text-red-500">*</span></label>
                      <input className={inputCls} type="tel" value={student.tutor_tel} onChange={(e) => setSI('tutor_tel', e.target.value)} placeholder="(787) 000-0000" />
                    </div>
                  </>
                )}
              </div>
              <div className="mt-5 flex justify-between">
                <button onClick={() => setStep(1)} className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">
                  <ChevronLeft className="h-4 w-4" /> Atrás
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={!student.nombre.trim() || !student.telefono.trim()}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-ink text-white text-sm font-semibold hover:bg-black disabled:opacity-40 transition-colors"
                >
                  Continuar <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* ── Step 3: Payment options ──────────────────────────────────── */}
          {step === 3 && program && (
            <div className="space-y-4">
              {/* Program payment */}
              <div className="bg-white rounded-2xl border border-black/[0.06] shadow-soft p-6">
                <h2 className="text-sm font-bold text-gray-900 mb-1">Sección A — Plan de Pago del Programa</h2>
                <p className="text-xs text-gray-400 mb-4">Cargo de admisión de $25.00 se cobra por separado en todos los casos.</p>
                <div className="space-y-3">
                  {([
                    { key: 'complete' as const, title: 'Pago Completo', desc: `$445.50 total · 10% de descuento incluido · Un solo pago antes o en el primer día de clases` },
                    { key: 'deferred' as const, title: 'Plan Diferido', desc: `11 cuotas de ≈$47.27/semana · Cargo administrativo $25.00 incluido · Sin descuento aplicado` },
                  ]).map(({ key, title, desc }) => (
                    <button key={key} onClick={() => setProgPlan(key)}
                      className={`w-full text-left border-2 rounded-xl p-4 transition-all ${progPlan === key ? 'border-ink bg-surface' : 'border-gray-200 hover:border-gray-300'}`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">{title}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                        </div>
                        <div className={`h-5 w-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${progPlan === key ? 'border-ink bg-ink' : 'border-gray-300'}`}>
                          {progPlan === key && <Check className="h-3 w-3 text-white" />}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Equipment payment — only when program requires equipment */}
              {!PROGRAMS[program].noEquipment ? (
                <div className="bg-white rounded-2xl border border-black/[0.06] shadow-soft p-6">
                  <h2 className="text-sm font-bold text-gray-900 mb-1">Sección B — Equipo / Materiales / Kit</h2>
                  <p className="text-xs text-gray-400 mb-4">Costo base del equipo para {PROGRAMS[program].label}: ${PROGRAMS[program].equipCost}.00</p>
                  <div className="space-y-3">
                    {([
                      { key: 'complete' as const, title: 'Pago Completo de Equipo', desc: `${fmt(PROGRAMS[program].equipCost * (1 - DISCOUNT))} (10% desc.) · Un solo pago antes o al inicio del programa` },
                      { key: 'deferred' as const, title: 'Plan Diferido de Equipo', desc: `Depósito ${fmt(PROGRAMS[program].equipCost * EQ_DEPOSIT_RATE + EQ_DEFERRED_ADMIN)} hoy (50% del kit + $20) · resto en 11 cuotas de ≈${fmt((PROGRAMS[program].equipCost * EQ_DEPOSIT_RATE) / WEEKS)}/semana · Sin descuento` },
                      { key: 'student' as const, title: 'El estudiante aporta su propio equipo', desc: 'El estudiante adquiere el equipo fuera de la institución · Debe ser validado por el Academic Officer antes del inicio' },
                    ]).map(({ key, title, desc }) => (
                      <button key={key} onClick={() => setEqPlan(key)}
                        className={`w-full text-left border-2 rounded-xl p-4 transition-all ${eqPlan === key ? 'border-ink bg-surface' : 'border-gray-200 hover:border-gray-300'}`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="font-semibold text-gray-900 text-sm">{title}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                          </div>
                          <div className={`h-5 w-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${eqPlan === key ? 'border-ink bg-ink' : 'border-gray-300'}`}>
                            {eqPlan === key && <Check className="h-3 w-3 text-white" />}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
                  <p className="text-sm text-blue-800 font-medium">Este programa no incluye equipo o kit institucional.</p>
                  <p className="text-xs text-blue-600 mt-1">Facturación a Planes Médicos no requiere equipo — solo aplica el pago del programa y el cargo de admisión.</p>
                </div>
              )}

              {/* Live price summary */}
              {prices && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
                  <h3 className="text-sm font-bold text-amber-900 mb-3">Resumen de Precios — Escenario #{prices.scenario}</h3>
                  <div className="space-y-1.5 text-sm">
                    {[
                      ['Cargo de admisión (separado)', fmt(ADMISSION)],
                      [progPlan === 'complete' ? 'Programa (pago completo, 10% desc.)' : 'Programa (diferido, 11 cuotas)', progPlan === 'complete' ? fmt(prices.progCompleteAmt) : `11 × ${fmt(prices.progDeferredWeekly)}`],
                      [eqPlan === 'none' ? 'Equipo (no aplica)' : eqPlan === 'complete' ? 'Equipo (pago completo, 10% desc.)' : eqPlan === 'deferred' ? 'Equipo (diferido, 11 cuotas)' : 'Equipo (aportado por estudiante)', eqPlan === 'none' ? 'No aplica' : eqPlan === 'complete' ? fmt(prices.eqCompleteAmt) : eqPlan === 'deferred' ? `11 × ${fmt(prices.eqDeferredWeekly)}` : '$0.00'],
                      ...(eqPlan === 'deferred' ? [['Depósito de equipo (hoy, 50% + $20)', fmt(prices.eqDeferredDeposit)]] : []),
                    ].map(([label, value]) => (
                      <div key={label} className="flex justify-between text-amber-800">
                        <span className="text-xs">{label}</span>
                        <span className="text-xs font-medium">{value}</span>
                      </div>
                    ))}
                    <div className="border-t border-amber-200 pt-2 mt-2 space-y-1.5">
                      <div className="flex justify-between font-bold text-amber-900">
                        <span>Pago inicial mínimo (HOY)</span>
                        <span>{fmt(prices.initial)}</span>
                      </div>
                      {prices.weeklyTotal > 0 && (
                        <div className="flex justify-between text-amber-800">
                          <span className="text-xs">Cuota semanal total</span>
                          <span className="text-xs font-semibold">{fmt(prices.weeklyTotal)}/semana</span>
                        </div>
                      )}
                      <div className="flex justify-between text-amber-700">
                        <span className="text-xs">Total estimado del contrato</span>
                        <span className="text-xs font-semibold">{fmt(prices.totalContract)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-between">
                <button onClick={() => setStep(2)} className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">
                  <ChevronLeft className="h-4 w-4" /> Atrás
                </button>
                <button
                  onClick={() => setStep(4)}
                  disabled={!progPlan || !eqPlan}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-ink text-white text-sm font-semibold hover:bg-black disabled:opacity-40 transition-colors"
                >
                  Ver Contrato <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* ── Step 4: Summary + print ──────────────────────────────────── */}
          {step === 4 && program && progPlan && eqPlan && prices && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-black/[0.06] shadow-soft p-6">
                <h2 className="text-sm font-bold text-gray-900 mb-4">Resumen del Contrato</h2>
                <div className="grid sm:grid-cols-2 gap-3 text-sm">
                  {[
                    ['Programa', PROGRAMS[program].label],
                    ['Horas', '36 horas de contacto'],
                    ['Estudiante', student.nombre],
                    ['Teléfono', student.telefono],
                    ['Fecha de inicio', student.fecha_inicio],
                    ['Horario', student.horario || '—'],
                    ['Plan de pago', progPlan === 'complete' ? 'Pago completo del programa' : 'Plan diferido — 11 cuotas'],
                    ['Equipo', eqPlan === 'none' ? 'No aplica (sin equipo)' : eqPlan === 'complete' ? 'Pago completo de equipo' : eqPlan === 'deferred' ? 'Plan diferido de equipo' : 'Estudiante aporta equipo'],
                    ['Escenario aplicable', `#${prices.scenario}`],
                    ['Pago inicial mínimo', fmt(prices.initial)],
                    ['Cuota semanal total', prices.weeklyTotal > 0 ? `${fmt(prices.weeklyTotal)}/semana` : '$0.00'],
                    ['Total estimado', fmt(prices.totalContract)],
                  ].map(([label, value]) => (
                    <div key={label} className="flex flex-col">
                      <span className="text-xs text-gray-400">{label}</span>
                      <span className="font-medium text-gray-800">{value}</span>
                    </div>
                  ))}
                </div>

                {saveError && (
                  <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 flex gap-2 items-start">
                    <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700">{saveError}</p>
                  </div>
                )}
                {saved && (
                  <div className="mt-4 p-3 rounded-lg bg-green-50 border border-green-200 flex gap-2 items-start">
                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-green-700">Contrato guardado en el historial.</p>
                  </div>
                )}

                <div className="mt-6 flex justify-between items-center flex-wrap gap-3">
                  <button onClick={() => setStep(3)} className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">
                    <ChevronLeft className="h-4 w-4" /> Editar opciones
                  </button>
                  <div className="flex gap-3">
                    <button
                      onClick={() => { setStep(1); setProgram(null); setProgPlan(null); setEqPlan(null); setStudent(emptyStudent()); setSaved(false) }}
                      className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50"
                    >
                      Nuevo contrato
                    </button>
                    <button
                      onClick={handlePrint}
                      disabled={saving}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-white text-sm font-semibold hover:bg-accent-hover disabled:opacity-50 transition-colors"
                    >
                      <Printer className="h-4 w-4" />
                      {saving ? 'Guardando…' : 'Generar e Imprimir Contrato'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── History ───────────────────────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-black/[0.06] shadow-soft overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-bold text-gray-900">Contratos Generados</h2>
            </div>
            {loadingContracts ? (
              <div className="p-10 flex justify-center">
                <div className="animate-spin h-6 w-6 rounded-full border-4 border-ink border-t-transparent" />
              </div>
            ) : contracts.length === 0 ? (
              <div className="p-10 text-center">
                <p className="text-sm text-gray-400">Aún no has generado ningún contrato.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs">Fecha</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs">Estudiante</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs hidden sm:table-cell">Programa</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs hidden md:table-cell">Esc.</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs">Total</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs hidden lg:table-cell">Generado por</th>
                      <th className="text-right px-4 py-3 font-semibold text-gray-600 text-xs">Ver</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {contracts.map((c) => (
                      <tr key={c.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                          {new Date(c.created_at).toLocaleDateString('es-PR', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-900">{c.student_name}</td>
                        <td className="px-4 py-3 text-xs text-gray-600 hidden sm:table-cell">{PROGRAM_LABELS[c.program] ?? c.program}</td>
                        <td className="px-4 py-3 text-xs text-gray-500 hidden md:table-cell">#{c.scenario}</td>
                        <td className="px-4 py-3 text-xs font-medium text-gray-800">{fmt(c.total_contract)}</td>
                        <td className="px-4 py-3 text-xs text-gray-500 hidden lg:table-cell">{c.employee_name}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => handleViewContract(c.id)}
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-full border border-black/[0.1] text-xs font-semibold text-ink hover:bg-surface transition-colors"
                          >
                            Ver
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

export default function ContratosPrivadosPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="animate-spin h-8 w-8 rounded-full border-4 border-ink border-t-transparent" />
      </div>
    }>
      <ContratosPrivadosContent />
    </Suspense>
  )
}
