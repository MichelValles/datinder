'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { createLinkedInUser } from '@/app/actions'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

function CallbackHandler() {
  const router = useRouter()
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const quiz = params.get('quiz')

    async function handleSession(session: { user: { user_metadata: Record<string, string> }, provider_token?: string | null } | null) {
      if (!session) {
        setErrorMsg('No se recibió sesión de LinkedIn')
        return
      }
      try {
        const meta = session.user.user_metadata
        const name: string = meta.full_name ?? meta.name ?? 'Usuario'
        const providerToken: string | null = session.provider_token ?? null
        const avatarUrl: string | null = meta.avatar_url ?? meta.picture ?? null
        const { url, linkedin_url } = await createLinkedInUser(name, quiz ?? null, providerToken, avatarUrl)
        localStorage.setItem('datinder_identity', JSON.stringify({
          name, empresa: null, linkedin_url, isLinkedIn: true,
        }))
        router.push(url)
      } catch (e) {
        setErrorMsg(e instanceof Error ? e.message : String(e))
      }
    }

    // Caso 1: código PKCE en query params
    const code = params.get('code')
    if (code) {
      supabase.auth.exchangeCodeForSession(window.location.href)
        .then(({ data, error }) => {
          if (error) { setErrorMsg(`PKCE: ${error.message}`); return }
          handleSession(data.session as Parameters<typeof handleSession>[0])
        })
      return
    }

    // Caso 2: tokens en hash (implicit flow) — Supabase JS los detecta automáticamente
    const hash = new URLSearchParams(window.location.hash.replace('#', ''))
    if (hash.get('access_token')) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        handleSession(session as Parameters<typeof handleSession>[0])
      })
      return
    }

    // Caso 3: esperar a que Supabase procese la URL
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        subscription.unsubscribe()
        handleSession(session as Parameters<typeof handleSession>[0])
      } else if (event === 'SIGNED_OUT') {
        setErrorMsg('LinkedIn cerró la sesión inesperadamente')
      }
    })

    // Timeout de seguridad
    const timeout = setTimeout(() => {
      subscription.unsubscribe()
      setErrorMsg(`Sin código ni tokens. URL: ${window.location.href}`)
    }, 10000)

    return () => {
      clearTimeout(timeout)
      subscription.unsubscribe()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (errorMsg) {
    return (
      <main className="min-h-screen bg-[#163b4f] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 text-center max-w-sm w-full">
          <p className="text-[#021f35] font-bold mb-2">Error al conectar con LinkedIn</p>
          <p className="text-red-500 text-xs mb-4 break-all">{errorMsg}</p>
          <a href="/" className="text-[#0A66C2] text-sm font-medium">← Volver al inicio</a>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#163b4f] flex flex-col items-center justify-center gap-4">
      <div className="flex items-center gap-2.5">
        <img src="/images/logo-yellow.svg" alt="DaTinder" className="h-10 w-auto animate-pulse" />
        <span className="text-white font-bold text-2xl tracking-tight">datinder</span>
      </div>
      <p className="text-white/60 text-sm">Conectando con LinkedIn...</p>
    </main>
  )
}

export default function CallbackPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#163b4f]" />}>
      <CallbackHandler />
    </Suspense>
  )
}
