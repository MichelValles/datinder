'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type Profile = { name: string; avatarUrl: string | null }

export default function LinkedInProfileBar() {
  const pathname = usePathname()
  const [profile, setProfile] = useState<Profile | null>(null)

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

  return (
    <Link
      href="/profile"
      className="fixed top-3 right-3 z-50 flex items-center gap-2 bg-[#021f35]/90 backdrop-blur-sm border border-white/10 rounded-full pl-1 pr-3 py-1 shadow-xl hover:bg-[#021f35] transition-colors"
      title={profile.name}
    >
      {profile.avatarUrl ? (
        <img
          src={profile.avatarUrl}
          alt={profile.name}
          className="w-7 h-7 rounded-full object-cover ring-2 ring-[#0A66C2]"
        />
      ) : (
        <div className="w-7 h-7 rounded-full bg-[#0A66C2] flex items-center justify-center shrink-0">
          <span className="text-white font-bold text-xs">{profile.name[0].toUpperCase()}</span>
        </div>
      )}
      <img src="/images/logo-yellow.svg" alt="datinder" className="h-4 w-auto" />
    </Link>
  )
}
