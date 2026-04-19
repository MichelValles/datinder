'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { getParticipantCount } from '@/app/actions-public'
import { Suspense } from 'react'

const INTERVAL = 5000

function WaitingContent() {
  const { quizId } = useParams<{ quizId: string }>()
  const searchParams = useSearchParams()
  const userId = searchParams.get('userId') ?? ''

  const [count, setCount] = useState<number | null>(null)
  const [progress, setProgress] = useState(100)
  const lastFetch = useRef(Date.now())

  useEffect(() => {
    async function fetchCount() {
      const c = await getParticipantCount(quizId)
      setCount(c)
      lastFetch.current = Date.now()
      setProgress(100)
    }

    fetchCount()
    const poll = setInterval(fetchCount, INTERVAL)
    return () => clearInterval(poll)
  }, [quizId])

  // Smooth progress bar
  useEffect(() => {
    const raf = { id: 0 }
    function tick() {
      const elapsed = Date.now() - lastFetch.current
      const pct = Math.max(0, 100 - (elapsed / INTERVAL) * 100)
      setProgress(pct)
      raf.id = requestAnimationFrame(tick)
    }
    raf.id = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.id)
  }, [])

  return (
    <main className="min-h-screen bg-[#163b4f] flex flex-col items-center justify-start sm:justify-center p-6 pt-10 sm:pt-6 text-center">
      <a href="/" className="flex items-center gap-2.5 mb-12">
        <img src="/images/logo-yellow.svg" alt="DaTinder" className="h-10 w-auto" />
        <span className="text-white font-bold text-2xl tracking-tight">datinder</span>
      </a>

      <div className="bg-white/10 border border-white/20 rounded-3xl p-10 max-w-sm w-full flex flex-col items-center gap-6">
        <div className="text-6xl animate-bounce">🎉</div>
        <div>
          <h1 className="text-white text-2xl font-bold mb-2">¡Quiz completado!</h1>
          <p className="text-white/60 text-sm">Cuantos más participantes, mejores los matches.</p>
        </div>

        {count !== null && (
          <div className="bg-[#edbe00] rounded-2xl px-8 py-4 text-center">
            <div className="text-[#021f35] text-4xl font-bold">{count}</div>
            <div className="text-[#021f35]/70 text-sm font-semibold mt-1">
              {count === 1 ? 'participante' : 'participantes'}
            </div>
          </div>
        )}

        {/* Progress bar */}
        <div className="w-full">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-white/30 text-xs">Próxima actualización</span>
            <span className="text-white/30 text-xs">{Math.ceil((progress / 100) * (INTERVAL / 1000))}s</span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
            <div
              className="h-full bg-[#edbe00] rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      <a
        href={`/results/${userId}`}
        className="mt-8 bg-[#edbe00] hover:bg-[#c9a100] text-[#021f35] font-bold rounded-2xl px-10 py-4 text-lg transition-colors"
      >
        Ver mis matches →
      </a>
    </main>
  )
}

export default function WaitingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#163b4f]" />}>
      <WaitingContent />
    </Suspense>
  )
}
