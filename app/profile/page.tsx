'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type QuizEntry = {
  quizId: string
  userId: string
  quizTitle: string
  completedAt: string
}

type Profile = { name: string; avatarUrl: string | null }

export default function ProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [history, setHistory] = useState<QuizEntry[]>([])
  const [signingOut, setSigningOut] = useState(false)

  useEffect(() => {
    // Load LinkedIn session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user.app_metadata?.provider === 'linkedin_oidc') {
        setProfile({
          name: session.user.user_metadata?.full_name
            ?? session.user.user_metadata?.name
            ?? 'Usuario',
          avatarUrl: session.user.user_metadata?.avatar_url ?? null,
        })
      } else {
        // No LinkedIn session, try localStorage identity
        try {
          const stored = localStorage.getItem('datinder_identity')
          if (stored) {
            const id = JSON.parse(stored)
            setProfile({ name: id.name, avatarUrl: null })
          }
        } catch {}
      }
    })

    // Load quiz history
    try {
      const stored = localStorage.getItem('datinder_quiz_history')
      if (stored) setHistory(JSON.parse(stored))
    } catch {}
  }, [])

  async function handleSignOut() {
    setSigningOut(true)
    await supabase.auth.signOut()
    localStorage.removeItem('datinder_identity')
    router.push('/')
  }

  function formatDate(iso: string) {
    const d = new Date(iso)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24))
    if (diffDays === 0) return 'Hoy'
    if (diffDays === 1) return 'Ayer'
    if (diffDays < 7) return `Hace ${diffDays} días`
    return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
  }

  return (
    <main className="min-h-screen bg-[#163b4f] p-4">
      <div className="max-w-sm mx-auto pt-8 pb-12">

        {/* Header */}
        <div className="flex items-center gap-2.5 mb-8">
          <Link href="/">
            <img src="/images/logo-yellow.svg" alt="DaTinder" className="h-8 w-auto" />
          </Link>
          <span className="text-white/40 text-sm">/ Mi perfil</span>
        </div>

        {/* Profile card */}
        {profile ? (
          <div className="bg-white rounded-3xl p-6 shadow-2xl mb-6 text-center">
            <div className="flex flex-col items-center gap-3">
              {profile.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={profile.name}
                  className="w-20 h-20 rounded-full object-cover ring-4 ring-[#0A66C2]/20"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-[#163b4f] flex items-center justify-center">
                  <span className="text-white font-bold text-3xl">{profile.name[0].toUpperCase()}</span>
                </div>
              )}

              <div>
                <h1 className="text-[#021f35] text-xl font-bold">{profile.name}</h1>
                <div className="flex items-center justify-center gap-1.5 mt-1">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="#0A66C2">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                  <span className="text-[#0A66C2] text-sm font-medium">Conectado con LinkedIn</span>
                </div>
              </div>

              <button
                onClick={handleSignOut}
                disabled={signingOut}
                className="cursor-pointer mt-1 text-xs text-[#163b4f]/40 hover:text-red-500 transition-colors border border-[#e8edf1] hover:border-red-200 rounded-lg px-4 py-2"
              >
                {signingOut ? 'Saliendo...' : 'Cerrar sesión'}
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white/10 rounded-2xl p-6 mb-6 text-center">
            <p className="text-white/50 text-sm">Sin sesión activa.</p>
            <Link href="/" className="text-[#edbe00] text-sm font-bold mt-2 block">Volver al inicio →</Link>
          </div>
        )}

        {/* Quiz history */}
        <div>
          <h2 className="text-white/50 text-xs font-bold uppercase tracking-widest mb-3">
            Quizzes realizados
          </h2>

          {history.length === 0 ? (
            <div className="bg-white/10 border border-white/10 rounded-2xl p-8 text-center">
              <div className="text-4xl mb-3">📋</div>
              <p className="text-white/40 text-sm">Aún no has completado ningún quiz.</p>
              <Link
                href="/"
                className="inline-block mt-4 bg-[#edbe00] hover:bg-[#c9a100] text-[#021f35] font-bold rounded-xl px-6 py-3 text-sm transition-colors"
              >
                Explorar quizzes →
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {history.map((entry, i) => (
                <Link
                  key={`${entry.quizId}-${i}`}
                  href={`/results/${entry.userId}`}
                  className="bg-white rounded-2xl p-4 flex items-center gap-4 hover:bg-[#f4f7f9] transition-colors shadow-sm group"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#163b4f]/10 flex items-center justify-center shrink-0">
                    <span className="text-xl">🎯</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[#021f35] truncate">{entry.quizTitle || 'Quiz'}</p>
                    <p className="text-xs text-[#163b4f]/40 mt-0.5">{formatDate(entry.completedAt)}</p>
                  </div>
                  <span className="text-[#163b4f]/30 group-hover:text-[#163b4f]/60 font-bold transition-colors shrink-0">
                    Ver matches →
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

      </div>
    </main>
  )
}
