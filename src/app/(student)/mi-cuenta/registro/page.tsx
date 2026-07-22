'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { AlertCircle, GraduationCap, BookOpen, MailCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'

export default function StudentRegisterPage() {
  const [type, setType] = useState<'estudiante' | 'profesor'>('estudiante')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [programa, setPrograma] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const supabase = createClient()
      const cleanEmail = email.trim().toLowerCase()
      const { data, error: signErr } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: { full_name: fullName.trim(), contributor_type: type, programa: programa.trim() || null },
          emailRedirectTo: `${window.location.origin}/mi-cuenta`,
        },
      })
      if (signErr) {
        setError(/already registered|already exists/i.test(signErr.message)
          ? 'Ese correo ya tiene una cuenta. Inicia sesión.'
          : 'No se pudo crear la cuenta. Intenta de nuevo.')
        setLoading(false)
        return
      }
      // Si "Confirm email" está ON, no hay sesión → mostrar "revisa tu correo".
      if (data.session) { window.location.href = '/mi-cuenta'; return }
      setSent(true)
    } catch {
      setError('Ocurrió un error. Intenta de nuevo.')
    }
    setLoading(false)
  }

  async function resend() {
    const supabase = createClient()
    await supabase.auth.resend({ type: 'signup', email: email.trim().toLowerCase(), options: { emailRedirectTo: `${window.location.origin}/mi-cuenta` } })
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Image src="/logo.png" alt="D'Mart Institute" width={160} height={60} className="h-14 w-auto" />
        </div>

        {sent ? (
          <div className="bg-white rounded-2xl shadow-soft border border-black/[0.06] p-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50">
              <MailCheck className="h-7 w-7 text-emerald-600" />
            </div>
            <h1 className="text-xl font-bold text-ink font-display">Confirma tu correo</h1>
            <p className="text-sm text-gray-600 mt-2">
              Te enviamos un correo a <span className="font-semibold text-ink">{email.trim().toLowerCase()}</span>.
              Ábrelo y haz clic en el enlace para activar tu cuenta. Luego podrás entrar.
            </p>
            <p className="text-xs text-gray-400 mt-3">¿No lo ves? Revisa la carpeta de spam.</p>
            <button onClick={resend} className="mt-4 text-sm font-bold text-accent hover:underline">Reenviar correo</button>
            <div className="mt-6 pt-4 border-t border-gray-100">
              <Link href="/mi-cuenta/entrar" className="text-sm font-semibold text-gray-500 hover:text-ink">Ir a iniciar sesión</Link>
            </div>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-2xl shadow-soft border border-black/[0.06] p-8">
              <div className="mb-6">
                <h1 className="text-xl font-bold text-ink font-display">Crea tu cuenta</h1>
                <p className="text-sm text-gray-500 mt-1">Sube fotos y videos para que la institución los use en sus redes.</p>
              </div>

              {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 flex gap-2 items-start">
                  <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="form-label">Soy</label>
                  <div className="grid grid-cols-2 gap-2">
                    {([['estudiante', 'Estudiante', GraduationCap], ['profesor', 'Profesor(a)', BookOpen]] as const).map(([k, l, Icon]) => (
                      <button type="button" key={k} onClick={() => setType(k)}
                        className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-semibold transition-colors ${type === k ? 'bg-accent text-white border-accent' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
                        <Icon className="h-4 w-4" /> {l}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label htmlFor="name" className="form-label">Nombre completo</label>
                  <input id="name" required value={fullName} onChange={(e) => setFullName(e.target.value)} className="form-input" placeholder="Tu nombre" />
                </div>
                <div>
                  <label htmlFor="email" className="form-label">Correo electrónico</label>
                  <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="form-input" placeholder="tucorreo@email.com" autoComplete="email" />
                </div>
                <div>
                  <label htmlFor="password" className="form-label">Contraseña</label>
                  <input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="form-input" placeholder="Mínimo 6 caracteres" autoComplete="new-password" />
                </div>
                <div>
                  <label htmlFor="programa" className="form-label">Programa / Curso <span className="text-gray-400 font-normal">(opcional)</span></label>
                  <input id="programa" value={programa} onChange={(e) => setPrograma(e.target.value)} className="form-input" placeholder="Ej: Cosmetología" />
                </div>
                <Button type="submit" variant="gold" size="lg" fullWidth loading={loading}>
                  {loading ? 'Creando cuenta…' : 'Crear cuenta'}
                </Button>
                <p className="text-[11px] text-gray-400 text-center">Te enviaremos un correo para confirmar tu cuenta.</p>
              </form>
            </div>

            <p className="text-center text-sm text-gray-500 mt-6">
              ¿Ya tienes cuenta?{' '}
              <Link href="/mi-cuenta/entrar" className="font-bold text-accent hover:underline">Entra aquí</Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
