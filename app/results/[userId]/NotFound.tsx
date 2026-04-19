'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function ResultNotFound({ userId }: { userId: string }) {
  useEffect(() => {
    try {
      const stored = localStorage.getItem('datinder_quiz_history')
      if (!stored) return
      const history = JSON.parse(stored)
      const updated = history.filter((e: { userId: string }) => e.userId !== userId)
      localStorage.setItem('datinder_quiz_history', JSON.stringify(updated))
    } catch {}
  }, [userId])

  return (
    <main className="min-h-screen bg-[#163b4f] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 text-center w-full max-w-sm shadow-xl">
        <div className="text-5xl mb-4">🗑️</div>
        <p className="text-[#021f35] font-bold text-lg mb-2">Respuestas eliminadas</p>
        <p className="text-[#163b4f]/60 text-sm mb-6">
          Este registro ya no existe. Se ha eliminado de tu historial.
        </p>
        <Link
          href="/"
          className="block bg-[#163b4f] text-white font-bold rounded-xl py-3 px-6 hover:bg-[#021f35] transition-colors"
        >
          Volver al inicio
        </Link>
      </div>
    </main>
  )
}
