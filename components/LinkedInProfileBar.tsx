'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type Profile = { name: string; avatarUrl: string | null }

export default function LinkedInProfileBar() {
  const router = useRouter()
  const pathname = usePathname()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [signingOut, setSigningOut] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return
      if (session.user.app_metadata?.provider !== 'linkedin_oidc') return
      setProfile({
        name: session.user.user_metadata?.full_name
          ?? session.user.user_metadata?.name
          ?? 'Usuario',
        avatarUrl: session.user.user_metadata?.avatar_url ?? null,
      })
    })
  }, [])

  if (!profile) return null
  if (pathname.startsWith('/admin')) return null

  async function handleSignOut() {
    setSigningOut(true)
    await supabase.auth.signOut()
    localStorage.removeItem('datinder_identity')
    router.push('/')
    router.refresh()
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 sm:bottom-auto sm:top-0 z-50 flex justify-center pointer-events-none">
      <div className="pointer-events-auto w-full max-w-sm mb-3 mx-3 sm:mb-0 sm:mt-3">
        <div className="flex items-center gap-3 bg-[#021f35]/95 backdrop-blur-sm border border-white/10 rounded-2xl px-4 py-3 shadow-2xl">
          {profile.avatarUrl ? (
            <img
              src={profile.avatarUrl}
              alt={profile.name}
              className="w-8 h-8 rounded-full object-cover shrink-0 ring-2 ring-[#0A66C2]"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-[#0A66C2] flex items-center justify-center shrink-0">
              <span className="text-white font-bold text-xs">{profile.name[0].toUpperCase()}</span>
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <span className="text-white font-semibold text-sm truncate">{profile.name}</span>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="#0A66C2" className="shrink-0">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
            </div>
            <p className="text-white/40 text-xs">LinkedIn conectado</p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/profile"
              className="text-[#edbe00] hover:text-[#c9a100] text-xs font-bold transition-colors whitespace-nowrap"
            >
              Mis quizzes
            </Link>
            <span className="text-white/20">·</span>
            <button
              onClick={handleSignOut}
              disabled={signingOut}
              className="cursor-pointer text-white/40 hover:text-red-400 text-xs transition-colors"
            >
              {signingOut ? '...' : 'Salir'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
