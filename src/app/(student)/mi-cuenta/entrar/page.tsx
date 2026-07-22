'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Mail, Lock, AlertCircle, MailCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'

export default function StudentLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [needsConfirm, setNeedsConfirm] = useState(false)
  const [resent, setResent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setNeedsConfirm(false)
    const supabase = createClient()
    await supabase.auth.signOut()
    const { error: authError } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password })
    if (authError) {
      if (/not confirmed|email_not_confirmed|confirm/i.test(authError.message)) {
        setNeedsConfirm(true)
      } else {
        setError('Credenciales incorrectas. Verifica tu correo y contraseña.')
      }
      setLoading(false)
      return
    }
    window.location.href = '/mi-cuenta'
  }

  async function resend() {
    const supabase = createClient()
    await supabase.auth.resend({ type: 'signup', email: email.trim().toLowerCase(), options: { emailRedirectTo: `${window.location.origin}/mi-cuenta` } })
    setResent(true)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <Image src="/logo.png" alt="D'Mart Institute" width={160} height={60} className="h-14 w-auto" />
        </div>

        <div className="bg-white rounded-2xl shadow-soft border border-black/[0.06] p-8">
          <div className="mb-6">
            <h1 className="text-xl font-bold text-ink font-display">Portal de Estudiantes</h1>
            <p className="text-sm text-gray-500 mt-1">Entra para subir tu contenido.</p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 flex gap-2 items-start">
              <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {needsConfirm && (
            <div className="mb-4 p-3 rounded-lg bg-amber-50 border border-amber-200">
              <div className="flex gap-2 items-start">
                <MailCheck className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800">Tu cuenta aún no está confirmada. Revisa tu correo (y el spam) y abre el enlace de confirmación.</p>
              </div>
              <button onClick={resend} disabled={resent} className="mt-2 text-sm font-bold text-accent hover:underline disabled:text-gray-400">
                {resent ? 'Correo reenviado ✓' : 'Reenviar correo de confirmación'}
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="form-label">Correo Electrónico</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="tucorreo@email.com" className="form-input pl-10" autoComplete="email" />
              </div>
            </div>
            <div>
              <label htmlFor="password" className="form-label">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" className="form-input pl-10" autoComplete="current-password" />
              </div>
            </div>
            <Button type="submit" variant="gold" size="lg" fullWidth loading={loading}>
              {loading ? 'Entrando…' : 'Entrar'}
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          ¿No tienes cuenta?{' '}
          <Link href="/mi-cuenta/registro" className="font-bold text-accent hover:underline">Crea una aquí</Link>
        </p>
      </div>
    </div>
  )
}
