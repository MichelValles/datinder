'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { getParticipantCount, getTopPairs } from '@/app/actions-public'
import QRCode from '@/components/QRCode'

type Pair = { nameA: string; nameB: string; similarity: number }

const INTERVAL = 8000
const medal = (i: number) => i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '✨'

export default function LiveScreen({
  quizId,
  quizTitle,
  quizUrl,
}: {
  quizId: string
  quizTitle: string
  quizUrl: string
}) {
  const [count, setCount] = useState<number>(0)
  const [pairs, setPairs] = useState<Pair[]>([])
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [progress, setProgress] = useState(100)
  const lastFetch = useRef(Date.now())

  const refresh = useCallback(async () => {
    const [c, p] = await Promise.all([
      getParticipantCount(quizId),
      getTopPairs(quizId),
    ])
    setCount(c)
    setPairs(p)
    setLastUpdate(new Date())
    lastFetch.current = Date.now()
    setProgress(100)
  }, [quizId])

  useEffect(() => {
    refresh()
    const id = setInterval(refresh, INTERVAL)
    return () => clearInterval(id)
  }, [refresh])

  // Smooth progress bar via rAF
  useEffect(() => {
    const raf = { id: 0 }
    function tick() {
      const elapsed = Date.now() - lastFetch.current
      setProgress(Math.max(0, 100 - (elapsed / INTERVAL) * 100))
      raf.id = requestAnimationFrame(tick)
    }
    raf.id = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.id)
  }, [])

  return (
    <main className="min-h-screen bg-[#021f35] text-white flex flex-col p-8 lg:p-12 overflow-hidden">

      {/* Progress bar — top of page */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-white/10 z-50">
        <div
          className="h-full bg-[#edbe00] transition-none"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-3">
          <img src="/images/logo-yellow.svg" alt="datinder" className="h-12 w-auto" />
          <span className="font-bold text-3xl tracking-tight">datinder</span>
        </div>
        <div className="text-right">
          <div className="text-white/40 text-xs uppercase tracking-widest">Modo Evento</div>
          <div className="text-white/60 text-sm mt-0.5">{quizTitle}</div>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

        {/* Left: QR + counter */}
        <div className="flex flex-col items-center gap-6">
          <div className="bg-white rounded-3xl p-6 shadow-2xl">
            <QRCode url={quizUrl} size={200} />
          </div>
          <div className="text-center">
            <div className="text-xs text-white/40 uppercase tracking-widest mb-1">Únete en</div>
            <div className="text-[#edbe00] font-bold text-lg">datinder.fun</div>
          </div>
          <div className="bg-white/10 border border-white/20 rounded-2xl px-8 py-5 text-center w-full">
            <div className="text-[#edbe00] text-6xl font-bold">{count}</div>
            <div className="text-white/50 text-sm mt-2 font-semibold">
              {count === 1 ? 'participante' : 'participantes'}
            </div>
          </div>
        </div>

        {/* Right: Top matches */}
        <div className="lg:col-span-2">
          <h2 className="text-white/40 text-xs uppercase tracking-widest mb-6 font-bold">
            Top matches
          </h2>
          {pairs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3">
              <div className="text-5xl animate-pulse">⏳</div>
              <p className="text-white/40">Esperando participantes...</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {pairs.map((pair, i) => (
                <div
                  key={`${pair.nameA}-${pair.nameB}`}
                  className="bg-white/10 border border-white/10 rounded-2xl px-6 py-5 flex items-center gap-4"
                >
                  <span className="text-4xl w-10 shrink-0">{medal(i)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-bold text-xl truncate">
                      {pair.nameA} <span className="text-[#edbe00]">&</span> {pair.nameB}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className={`text-3xl font-bold ${
                      pair.similarity >= 80 ? 'text-[#edbe00]' :
                      pair.similarity >= 60 ? 'text-white' : 'text-white/50'
                    }`}>
                      {pair.similarity}%
                    </div>
                    <div className="text-white/30 text-xs">compatibilidad</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-8 pt-4 border-t border-white/10">
        <span className="text-white/20 text-xs">
          Actualizado {lastUpdate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          {' · '}próxima en {Math.ceil((progress / 100) * (INTERVAL / 1000))}s
        </span>
        <button
          onClick={refresh}
          className="text-white/30 hover:text-white text-xs transition-colors cursor-pointer"
        >
          ↻ Actualizar ahora
        </button>
      </div>
    </main>
  )
}
