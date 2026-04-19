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
  quizTitle,
  quizId,
}: {
  questions: Question[]
  userId: string
  quizTitle: string | null
  quizId: string
}) {
  const [current, setCurrent] = useState(0)
  const [selected, setSelected] = useState<0 | 1 | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(false)
  const [answers, setAnswers] = useState<Map<number, 0 | 1>>(new Map())
  const router = useRouter()

  const q = questions[current]
  const progress = ((current + (selected !== null ? 1 : 0)) / questions.length) * 100

  function handleBack() {
    if (current === 0 || saving) return
    const prev = current - 1
    setCurrent(prev)
    setSelected(answers.get(prev) ?? null)
  }

  async function handleAnswer(answer: 0 | 1) {
    if (saving) return
    setSaving(true)
    setSelected(answer)

    const alreadyAnswered = answers.has(current)
    const newAnswers = new Map(answers).set(current, answer)
    setAnswers(newAnswers)

    try {
      setSaveError(false)
      if (alreadyAnswered) {
        const { error } = await supabase
          .from('responses')
          .update({ answer })
          .eq('user_id', userId)
          .eq('question_id', q.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('responses').insert({
          user_id: userId,
          question_id: q.id,
          answer,
        })
        if (error) throw error
      }
    } catch {
      setSaveError(true)
      setSaving(false)
      setSelected(answers.get(current) ?? null)
      return
    }

    await new Promise(r => setTimeout(r, 320))

    if (current + 1 < questions.length) {
      const next = current + 1
      setCurrent(next)
      setSelected(newAnswers.get(next) ?? null)
      setSaving(false)
    } else {
      // Save to quiz history
      try {
        const prev = JSON.parse(localStorage.getItem('datinder_quiz_history') || '[]')
        const entry = { quizId, userId, quizTitle: quizTitle ?? 'Quiz', completedAt: new Date().toISOString() }
        const updated = [entry, ...prev.filter((e: { quizId: string; userId: string }) => !(e.quizId === quizId && e.userId === userId))].slice(0, 20)
        localStorage.setItem('datinder_quiz_history', JSON.stringify(updated))
      } catch {}
      router.push(`/quiz/${quizId}/waiting?userId=${userId}`)
    }
  }

  return (
    <main className="min-h-screen bg-[#f0f4f7] flex flex-col items-center justify-start sm:justify-center p-4 pt-6 sm:p-6">

      {/* Logo + título */}
      <div className="flex flex-col items-center gap-1.5 mb-8">
        <a href="/" className="flex items-center gap-2.5">
          <img src="/images/logo-yellow.svg" alt="DaTinder" className="h-10 w-auto" />
          <span className="text-[#021f35] font-bold text-3xl tracking-tight">datinder</span>
        </a>
        {quizTitle && (
          <p className="text-[#163b4f]/50 text-base font-medium">{quizTitle}</p>
        )}
      </div>

      {/* Progress + botón atrás */}
      <div className="w-full max-w-2xl mb-6">
        <div className="flex justify-between items-center mb-2">
          <button
            onClick={handleBack}
            disabled={current === 0 || saving}
            className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#d0d8e0] text-[#163b4f] text-sm font-semibold shadow-sm hover:bg-[#f4f7f9] active:scale-95 transition-all disabled:opacity-0 disabled:pointer-events-none"
          >
            ← Anterior
          </button>
          <span className="text-[#163b4f]/50 text-xs font-semibold uppercase tracking-widest">
            {current + 1} / {questions.length}
          </span>
          <span className="text-[#163b4f]/50 text-xs font-semibold w-14 text-right">
            {Math.round(progress)}%
          </span>
        </div>
        <div className="bg-[#163b4f]/10 rounded-full h-1.5">
          <div
            className="bg-[#edbe00] rounded-full h-1.5 transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {saveError && (
        <div className="w-full max-w-2xl mb-3 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 text-red-600 text-sm text-center">
          Error al guardar. Comprueba tu conexión e inténtalo de nuevo.
        </div>
      )}

      {/* Card */}
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-2xl overflow-hidden">

        {/* Question */}
        <div className="px-8 py-8 sm:px-12 sm:py-10 border-b border-[#e8edf1]">
          <p className="text-[#163b4f]/40 text-xs font-bold uppercase tracking-widest mb-3 text-center">
            ¿Con cuál te identificas más?
          </p>
          <h2 className="text-[#021f35] text-2xl sm:text-3xl font-bold text-center leading-snug">
            {q.question_text || `Pregunta ${q.order_num}`}
          </h2>
        </div>

        {/* Options */}
        <div className="p-6 sm:p-8 flex flex-col gap-4">
          {([0, 1] as const).map((answer) => {
            const isSelected = selected === answer
            const label = answer === 0 ? 'Opción A' : 'Opción B'
            const text = answer === 0 ? q.text_option_a : q.text_option_b
            return (
              <button
                key={answer}
                onClick={() => handleAnswer(answer)}
                disabled={saving}
                className={`cursor-pointer py-6 px-7 rounded-2xl text-lg sm:text-xl font-semibold border-2 transition-all duration-200 text-left ${
                  isSelected
                    ? 'bg-[#163b4f] border-[#163b4f] text-white scale-[0.98]'
                    : 'border-[#163b4f]/15 text-[#021f35] hover:border-[#163b4f]/40 hover:bg-[#163b4f]/5 active:scale-[0.98]'
                }`}
              >
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-40 block mb-1.5">
                  {label}
                </span>
                {text}
              </button>
            )
          })}
        </div>
      </div>
    </main>
  )
}
