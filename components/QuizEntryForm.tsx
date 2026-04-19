'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { startQuizDirect } from '@/app/actions'
import LinkedInLoginButton from './LinkedInLoginButton'
import Link from 'next/link'

const IDENTITY_KEY = 'datinder_identity'

type Identity = {
  name: string
  empresa: string | null
  linkedin_url: string | null
  isLinkedIn: boolean
}

export function saveIdentity(id: Identity) {
  localStorage.setItem(IDENTITY_KEY, JSON.stringify(id))
}

export function clearIdentity() {
  localStorage.removeItem(IDENTITY_KEY)
}

export default function QuizEntryForm({
  quizSlug,
  quizTitle,
}: {
  quizSlug: string
  quizTitle: string | null
}) {
  const router = useRouter()
  const [identity, setIdentity] = useState<Identity | null>(null)
  const [loading, setLoading] = useState(false)
  const [showFull, setShowFull] = useState(false)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(IDENTITY_KEY)
      if (stored) setIdentity(JSON.parse(stored))
    } catch {}
    setHydrated(true)
  }, [])

  async function startWithIdentity(id: Identity) {
    setLoading(true)
    const url = await startQuizDirect(id.name, id.empresa, id.linkedin_url, quizSlug)
    router.push(url)
  }

  async function handleFormSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const fd = new FormData(e.currentTarget)
    const name = (fd.get('name') as string)?.trim()
    const empresa = (fd.get('empresa') as string)?.trim() || null
    const linkedin_url = (fd.get('linkedin_url') as string)?.trim() || null
    if (!name) { setLoading(false); return }
    const id: Identity = { name, empresa, linkedin_url, isLinkedIn: false }
    saveIdentity(id)
    const url = await startQuizDirect(name, empresa, linkedin_url, quizSlug)
    router.push(url)
  }

  function handleLogout() {
    clearIdentity()
    setIdentity(null)
    setShowFull(false)
  }

  if (!hydrated) return null

  return (
    <div className="flex flex-col gap-0">
      {quizTitle ? (
        <div className="text-center mb-6">
          <h2 className="text-lg font-bold text-[#021f35]">{quizTitle}</h2>
          <p className="text-[#163b4f]/50 text-sm mt-1">Responde 20 preguntas y descubre quién piensa como tú</p>
        </div>
      ) : (
        <p className="text-center text-[#163b4f]/60 text-sm mb-6 leading-relaxed">
          Responde 20 preguntas y descubre<br />quién piensa como tú
        </p>
      )}

      {identity && !showFull ? (
        /* ── Quick start ── */
        <div className="flex flex-col gap-3">
          <div className="bg-[#f4f7f9] rounded-2xl p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[#163b4f] flex items-center justify-center shrink-0">
              <span className="text-white font-bold text-xl">{identity.name[0].toUpperCase()}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-bold text-[#021f35] truncate">{identity.name}</p>
                {identity.isLinkedIn && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="#0A66C2">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                )}
              </div>
              {identity.empresa && (
                <p className="text-[#163b4f]/50 text-xs truncate">{identity.empresa}</p>
              )}
            </div>
          </div>

          <button
            onClick={() => startWithIdentity(identity)}
            disabled={loading}
            className="cursor-pointer bg-[#edbe00] hover:bg-[#c9a100] disabled:opacity-60 text-[#021f35] font-bold py-4 rounded-xl text-base tracking-wide transition-colors"
          >
            {loading ? 'Cargando...' : 'Empezar el quiz →'}
          </button>

          <div className="flex items-center justify-center gap-4 mt-1">
            <button
              onClick={() => setShowFull(true)}
              className="cursor-pointer text-[#163b4f]/40 hover:text-[#163b4f]/70 text-xs transition-colors"
            >
              No soy yo
            </button>
            <span className="text-[#163b4f]/20">·</span>
            <button
              onClick={handleLogout}
              className="cursor-pointer text-[#163b4f]/40 hover:text-red-400 text-xs transition-colors"
            >
              Cambiar identidad
            </button>
          </div>
        </div>
      ) : (
        /* ── Full form ── */
        <div className="flex flex-col gap-0">
          <LinkedInLoginButton quizSlug={quizSlug} />

          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-[#e8edf1]" />
            <span className="text-[#163b4f]/30 text-xs font-semibold">o entra manualmente</span>
            <div className="flex-1 h-px bg-[#e8edf1]" />
          </div>

          <form onSubmit={handleFormSubmit} className="flex flex-col gap-3">
            <input
              type="text"
              name="name"
              placeholder="¿Cómo te llamas?"
              required
              maxLength={50}
              autoComplete="off"
              className="border-2 border-[#e8edf1] rounded-xl px-4 py-3.5 text-center text-base text-[#021f35] placeholder:text-[#163b4f]/40 focus:outline-none focus:border-[#163b4f] transition-colors"
            />
            <input
              type="text"
              name="empresa"
              placeholder="Empresa (opcional)"
              maxLength={100}
              autoComplete="organization"
              className="border-2 border-[#e8edf1] rounded-xl px-4 py-3.5 text-center text-base text-[#021f35] placeholder:text-[#163b4f]/30 focus:outline-none focus:border-[#163b4f] transition-colors"
            />
            <input
              type="url"
              name="linkedin_url"
              placeholder="linkedin.com/in/tu-perfil (opcional)"
              maxLength={200}
              autoComplete="url"
              className="border-2 border-[#e8edf1] rounded-xl px-4 py-3.5 text-center text-sm text-[#021f35] placeholder:text-[#163b4f]/25 focus:outline-none focus:border-[#0A66C2] transition-colors"
            />
            <button
              type="submit"
              disabled={loading}
              className="cursor-pointer bg-[#edbe00] hover:bg-[#c9a100] disabled:opacity-60 text-[#021f35] font-bold py-4 rounded-xl text-base tracking-wide transition-colors mt-1"
            >
              {loading ? 'Cargando...' : 'Empezar el quiz →'}
            </button>
          </form>

          {showFull && (
            <button
              onClick={() => setShowFull(false)}
              className="cursor-pointer mt-3 text-[#163b4f]/30 hover:text-[#163b4f]/60 text-xs text-center transition-colors"
            >
              ← Volver
            </button>
          )}
        </div>
      )}

      <div className="mt-5 text-center">
        <Link href="/" className="text-[#163b4f]/30 hover:text-[#163b4f]/60 text-xs transition-colors">
          ← Ver todos los quizzes
        </Link>
      </div>
    </div>
  )
}
