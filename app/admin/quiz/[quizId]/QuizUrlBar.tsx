'use client'

import { useState } from 'react'

export default function QuizUrlBar({ url }: { url: string }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 min-w-0 bg-[#f4f7f9] border border-[#d0d8e0] rounded-xl px-3 py-2.5 text-sm text-[#163b4f] font-mono truncate">
        {url}
      </div>
      <button
        onClick={copy}
        className={`text-sm font-semibold px-4 py-2.5 rounded-xl border transition-colors shrink-0 ${
          copied
            ? 'bg-green-100 text-green-700 border-green-200'
            : 'bg-[#f4f7f9] hover:bg-[#e8edf1] text-[#163b4f] border-[#d0d8e0]'
        }`}
      >
        {copied ? '✓ Copiado' : 'Copiar'}
      </button>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm font-bold bg-[#edbe00] hover:bg-[#c9a100] text-[#021f35] px-4 py-2.5 rounded-xl transition-colors shrink-0"
      >
        Abrir →
      </a>
    </div>
  )
}
