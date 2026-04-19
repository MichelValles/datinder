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
  question_text: string
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
    <main className="min-h-screen bg-[#163b4f] flex flex-col items-center justify-center p-4">
      {/* Progress */}
      <div className="w-full max-w-sm mb-6">
        <div className="flex justify-between text-white/70 text-xs mb-2 font-semibold uppercase tracking-widest">
          <span>Pregunta {current + 1} / {questions.length}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="bg-white/15 rounded-full h-1.5">
          <div
            className="bg-[#edbe00] rounded-full h-1.5 transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Card */}
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="bg-[#163b4f] px-7 py-5 text-center">
          <p className="text-white/60 text-xs font-bold uppercase tracking-widest">
            ¿Con cuál te identificas más?
          </p>
          <h2 className="text-white text-lg font-bold mt-2 leading-snug">
            {q.question_text || `Pregunta ${q.order_num}`}
          </h2>
        </div>

        <div className="p-5 flex flex-col gap-3">
          <button
            onClick={() => handleAnswer(0)}
            disabled={saving}
            className={`py-5 px-5 rounded-xl text-base font-semibold border-2 transition-all duration-200 text-left ${
              selected === 0
                ? 'bg-[#163b4f] border-[#163b4f] text-white scale-[0.97]'
                : 'border-[#163b4f]/20 text-[#163b4f] hover:border-[#163b4f]/50 hover:bg-[#163b4f]/5 active:scale-[0.97]'
            }`}
          >
            <span className="text-[10px] font-bold uppercase tracking-widest opacity-50 block mb-1">
              Opción A
            </span>
            {q.text_option_a}
          </button>

          <p className="text-[#163b4f]/25 text-sm font-semibold text-center">— o —</p>

          <button
            onClick={() => handleAnswer(1)}
            disabled={saving}
            className={`py-5 px-5 rounded-xl text-base font-semibold border-2 transition-all duration-200 text-left ${
              selected === 1
                ? 'bg-[#edbe00] border-[#edbe00] text-[#021f35] scale-[0.97]'
                : 'border-[#edbe00]/40 text-[#c9a100] hover:border-[#edbe00]/70 hover:bg-[#edbe00]/5 active:scale-[0.97]'
            }`}
          >
            <span className="text-[10px] font-bold uppercase tracking-widest opacity-50 block mb-1">
              Opción B
            </span>
            {q.text_option_b}
          </button>
        </div>
      </div>
    </main>
  )
}
