'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Mail, Lock, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import Image from 'next/image'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()

    // Clear any existing session first so stale cookies can't bleed into the new login
    await supabase.auth.signOut()

    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError) {
      setError('Credenciales incorrectas. Verifica tu correo y contraseña.')
      setLoading(false)
      return
    }

    // Hard redirect so the server reads the fresh session cookie from scratch.
    // router.push() is client-side and can carry over a stale middleware session.
    window.location.href = '/portal/dashboard'
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Image src="/logo.png" alt="D'Mart Institute" width={160} height={60} className="h-14 w-auto" />
        </div>

        <div className="bg-white rounded-2xl shadow-card p-8">
          <div className="mb-6">
            <h1 className="text-xl font-bold text-navy">Portal de Empleados</h1>
            <p className="text-sm text-gray-500 mt-1">Acceso exclusivo para personal autorizado.</p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 flex gap-2 items-start">
              <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="form-label">Correo Electrónico</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="correo@dmartinstitute.edu"
                  className="form-input pl-10"
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="form-label">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="form-input pl-10"
                  autoComplete="current-password"
                />
              </div>
            </div>

            <Button type="submit" variant="gold" size="lg" fullWidth loading={loading}>
              {loading ? 'Iniciando sesión…' : 'Iniciar Sesión'}
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          ¿Problemas para acceder? Contacta al administrador.
        </p>
      </div>
    </div>
  )
}
