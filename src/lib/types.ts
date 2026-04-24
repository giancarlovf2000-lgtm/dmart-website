// ============================================================
// D'Mart Institute — TypeScript Interfaces
// ============================================================

export interface Campus {
  id: string
  created_at: string
  updated_at: string
  name: string
  slug: string
  address: string
  city: string
  state: string
  zip: string
  phone: string
  email: string | null
  active: boolean
}

export interface Category {
  id: string
  created_at: string
  name: string
  slug: string
  description: string | null
  color: string | null
  icon: string | null
  sort_order: number
}

export interface Program {
  id: string
  created_at: string
  updated_at: string
  category_id: string
  name: string
  slug: string
  description: string | null
  duration_weeks: number | null
  credits: number | null
  hours: number | null
  schedule_options: string[] | null
  active: boolean
  sort_order: number
  // Joined fields
  category?: Category
  campuses?: Campus[]
}

export interface ProgramCampus {
  id: string
  program_id: string
  campus_id: string
  program?: Program
  campus?: Campus
}

// ============================================================
// Portal types
// ============================================================

export type LeadStatus =
  | 'Nuevo Lead'
  | 'Crítico'
  | 'Contacto Inicial (Pendiente de Respuesta)'
  | 'Contacto Establecido'
  | 'Cita Programada'
  | 'No Asistió a la Cita'
  | 'Reagendado'
  | 'En Espera de Documentos'
  | 'Orientado (En Proceso de Matricularse)'
  | 'Seguimiento a Futuro'
  | 'Matriculado'
  | 'Desinteresado / Rechazado'
  | 'Graduado'
  | 'Graduado con Reválida'

export type CommunicationType =
  | 'Llamada'
  | 'Mensaje de texto'
  | 'Email'
  | 'Visita presencial'
  | 'WhatsApp'
  | 'Otro'

export type ActionType = 'status_change' | 'note_added' | 'lead_created' | 'lead_assigned'

export type AssignmentSource = 'website' | 'manual' | 'import'

export type EmployeeRole = 'admin' | 'empleado'

export interface Employee {
  id: string
  full_name: string
  campus: string[]
  role: EmployeeRole
  active: boolean
  round_robin_index: number
  created_at: string
}

export interface LeadHistory {
  id: string
  lead_id: string
  employee_id: string | null
  action_type: ActionType
  old_status: string | null
  new_status: string | null
  note: string | null
  communication_type: CommunicationType | null
  created_at: string
  employee?: Pick<Employee, 'full_name'>
}

export interface Activity {
  id: string
  employee_id: string
  month: string
  name: string
  description: string | null
  type: 'feria' | 'visita_escuela' | 'evento_comunitario' | 'otro'
  planned_leads: number | null
  actual_leads: number | null
  activity_date: string | null
  location: string | null
  status: 'planificada' | 'terminada'
  created_at: string
}

export interface MonthlyReport {
  id: string
  employee_id: string
  month: string
  report_type: 'planning' | 'performance'
  leads_acquired: number | null
  leads_contacted: number | null
  leads_enrolled: number | null
  notes: string | null
  performance_score: 'deficiente' | 'basico' | 'bueno' | 'excelente' | null
  activities_completed: number | null
  created_at: string
}

export interface Lead {
  id: string
  created_at: string
  updated_at: string
  nombre: string
  apellido: string
  email: string
  telefono: string
  campus: string | null
  programa_interes: string | null
  horario: string | null
  source: string | null
  utm_source: string | null
  utm_medium: string | null
  utm_campaign: string | null
  page_source: string | null
  status: LeadStatus
  notes: string | null
  assigned_to: string | null
  assignment_source: AssignmentSource | null
  last_action_at: string
  activity_id: string | null
  lead_source_text: string | null
  employee?: Pick<Employee, 'full_name'>
  activity?: Pick<Activity, 'name'>
}

export type LeadInsert = Omit<Lead, 'id' | 'created_at' | 'updated_at' | 'status' | 'last_action_at' | 'employee' | 'activity'> & {
  status?: LeadStatus
}

export interface GraduateProfile {
  id: string
  lead_id: string
  full_name: string
  program: string
  campus: string | null
  specialty: string | null
  bio: string | null
  photo_url: string | null
  graduation_date: string | null
  available: boolean
  consent_given: boolean
  consent_date: string | null
  created_at: string
}

export interface JobRequest {
  id: string
  graduate_id: string
  client_name: string
  client_email: string
  client_phone: string
  service_description: string
  preferred_date: string | null
  status: 'pendiente' | 'en_proceso' | 'completado' | 'cancelado'
  notes: string | null
  created_at: string
  graduate?: Pick<GraduateProfile, 'full_name' | 'program'>
}

export interface Document {
  id: string
  created_at: string
  title: string
  description: string | null
  file_url: string
  category: string | null
  language: string
  active: boolean
  sort_order: number
}

export interface SiteSetting {
  id: string
  created_at: string
  updated_at: string
  key: string
  value: string | null
  description: string | null
}

// ============================================================
// Static data types (not stored in DB — Saturday courses)
// ============================================================

export interface PrivadoSabatino {
  id: number
  title: string
  description: string
  icon: string
  tag: string
}

// ============================================================
// Form types
// ============================================================

export interface LeadFormData {
  nombre: string
  apellido: string
  email: string
  telefono: string
  campus: string
  programa_interes: string
  horario: string
}

export interface LeadFormPayload extends LeadFormData {
  source?: string
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  page_source?: string
}

// ============================================================
// API response types
// ============================================================

export interface ApiResponse<T = null> {
  success: boolean
  data?: T
  error?: string
}
