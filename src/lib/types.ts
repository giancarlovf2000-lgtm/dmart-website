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
  status: 'new' | 'contacted' | 'enrolled' | 'closed'
  notes: string | null
}

export type LeadInsert = Omit<Lead, 'id' | 'created_at' | 'updated_at' | 'status'> & {
  status?: Lead['status']
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
