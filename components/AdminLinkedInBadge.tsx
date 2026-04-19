'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type Profile = { name: string; avatarUrl: string | null }

export default function AdminLinkedInBadge() {
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

  return (
    <div className="flex items-center gap-2 border-l border-white/20 pl-4">
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
      <span className="text-white/70 text-xs font-medium truncate max-w-[120px]">{profile.name}</span>
      <svg width="10" height="10" viewBox="0 0 24 24" fill="#0A66C2" className="shrink-0">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
      </svg>
    </div>
  )
}
