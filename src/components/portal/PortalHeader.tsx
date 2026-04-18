'use client'

import { useRouter } from 'next/navigation'
import { LogOut, Building2 } from 'lucide-react'
import type { Employee } from '@/lib/types'

interface PortalHeaderProps {
  employee: Pick<Employee, 'full_name' | 'campus' | 'role'>
}

export default function PortalHeader({ employee }: PortalHeaderProps) {
  const router = useRouter()

  async function handleLogout() {
    await fetch('/api/portal/auth/logout', { method: 'POST' })
    // Hard redirect to ensure the cleared session cookie is re-read by the server
    window.location.href = '/portal/login'
  }

  return (
    <header className="bg-white border-b border-gray-200 px-4 md:px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-navy text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
            {employee.full_name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">{employee.full_name}</p>
            <p className="text-xs text-gray-500 capitalize">
              {employee.role === 'admin' ? 'Administrador' : 'Consejera de Admisiones'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {employee.campus.length > 0 && (
            <div className="hidden sm:flex items-center gap-1">
              {employee.campus.map((c) => (
                <span
                  key={c}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-navy/10 text-navy"
                >
                  <Building2 className="h-3 w-3" />
                  {c}
                </span>
              ))}
            </div>
          )}

          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors px-2 py-1.5 rounded-lg hover:bg-gray-100"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Cerrar sesión</span>
          </button>
        </div>
      </div>
    </header>
  )
}
