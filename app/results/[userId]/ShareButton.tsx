'use client'

import { useState } from 'react'

export default function ShareButton({ name, matchCount }: { name: string; matchCount: number }) {
  const [copied, setCopied] = useState(false)

  async function handleShare() {
    const url = window.location.href
    const text = `He hecho el quiz de datinder y tengo ${matchCount} matches 🔥 ¿Cuánto coincidimos tú y yo?`

    if (navigator.share) {
      try {
        await navigator.share({ title: 'Mis matches en datinder', text, url })
        return
      } catch {}
    }

    await navigator.clipboard.writeText(`${text}\n${url}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <button
      onClick={handleShare}
      className="cursor-pointer flex items-center justify-center gap-2 bg-[#edbe00] hover:bg-[#c9a100] text-[#021f35] font-bold rounded-xl py-4 transition-colors w-full"
    >
      {copied ? (
        <>✓ Enlace copiado</>
      ) : (
        <>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
          </svg>
          Compartir mis matches
        </>
      )}
    </button>
  )
}
