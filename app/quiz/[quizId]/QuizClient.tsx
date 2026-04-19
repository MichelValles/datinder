'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type Question = {
  id: string
  order_num: number
  text_option_a: string
  text_option_b: string
}

export default function QuizClient({
  questions,
  userId,
}: {
  questions: Question[]
  userId: string
}) {
  const [current, setCurrent] = useState(0)
  const [selected, setSelected] = useState<0 | 1 | null>(null)
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  const q = questions[current]
  const progress = (current / questions.length) * 100

  async function handleAnswer(answer: 0 | 1) {
    if (saving) return
    setSaving(true)
    setSelected(answer)

    await supabase.from('responses').insert({
      user_id: userId,
      question_id: q.id,
      answer,
    })

    await new Promise(r => setTimeout(r, 320))

    if (current + 1 < questions.length) {
      setCurrent(c => c + 1)
      setSelected(null)
      setSaving(false)
    } else {
      router.push(`/results/${userId}`)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-pink-500 to-red-500 flex flex-col items-center justify-center p-4">
      {/* Progress */}
      <div className="w-full max-w-sm mb-5">
        <div className="flex justify-between text-white/90 text-sm mb-2 font-medium">
          <span>Pregunta {current + 1} de {questions.length}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="bg-white/30 rounded-full h-2">
          <div
            className="bg-white rounded-full h-2 transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Card */}
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm">
        <div className="p-7 text-center">
          <div className="text-4xl mb-3">🤔</div>
          <h2 className="text-base font-bold text-gray-500 uppercase tracking-wider mb-6">
            ¿Con cuál te identificas más?
          </h2>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => handleAnswer(0)}
              disabled={saving}
              className={`py-5 px-5 rounded-2xl text-base font-semibold border-2 transition-all duration-200 text-left ${
                selected === 0
                  ? 'bg-pink-500 border-pink-500 text-white scale-[0.97]'
                  : 'border-pink-200 text-pink-700 hover:bg-pink-50 active:scale-[0.97]'
              }`}
            >
              <span className="text-[10px] font-bold uppercase tracking-widest opacity-50 block mb-1">
                Opción A
              </span>
              {q.text_option_a}
            </button>

            <p className="text-gray-300 text-sm font-semibold">— o —</p>

            <button
              onClick={() => handleAnswer(1)}
              disabled={saving}
              className={`py-5 px-5 rounded-2xl text-base font-semibold border-2 transition-all duration-200 text-left ${
                selected === 1
                  ? 'bg-red-500 border-red-500 text-white scale-[0.97]'
                  : 'border-red-200 text-red-700 hover:bg-red-50 active:scale-[0.97]'
              }`}
            >
              <span className="text-[10px] font-bold uppercase tracking-widest opacity-50 block mb-1">
                Opción B
              </span>
              {q.text_option_b}
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}
