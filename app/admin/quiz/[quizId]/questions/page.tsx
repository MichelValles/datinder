'use client'

import { useState, useTransition } from 'react'
import { createClient } from '@supabase/supabase-js'
import { saveQuestions } from '../../../actions'
import { notFound } from 'next/navigation'
import { use } from 'react'

const supabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type Question = {
  id: string
  order_num: number
  text_option_a: string
  text_option_b: string
}

function QuestionsEditor({ questions, quizId }: { questions: Question[]; quizId: string }) {
  const [saved, setSaved] = useState(false)
  const [isPending, startTransition] = useTransition()

  const saveAction = saveQuestions.bind(null, quizId)

  async function handleSave(formData: FormData) {
    startTransition(async () => {
      await saveAction(formData)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    })
  }

  return (
    <form action={handleSave}>
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden mb-24">
        <div className="p-5 border-b border-gray-800 flex items-center justify-between">
          <div>
            <h2 className="font-semibold">Preguntas</h2>
            <p className="text-gray-400 text-xs mt-0.5">Edita el texto de cada opción A y B</p>
          </div>
          <span className="text-xs text-gray-500">{questions.length} preguntas</span>
        </div>

        <div className="divide-y divide-gray-800">
          {questions.map((q) => (
            <div key={q.id} className="p-5">
              <input type="hidden" name={`qid_${q.order_num}`} value={q.id} />
              <div className="flex items-start gap-4">
                <span className="text-gray-600 font-mono text-sm w-6 pt-3 shrink-0 text-right">
                  {q.order_num}
                </span>
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-pink-400 uppercase tracking-widest mb-1.5">
                      Opción A
                    </label>
                    <input
                      type="text"
                      name={`qa_${q.order_num}`}
                      defaultValue={q.text_option_a}
                      placeholder="Escribe la opción A..."
                      className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-pink-500 transition-colors placeholder:text-gray-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-red-400 uppercase tracking-widest mb-1.5">
                      Opción B
                    </label>
                    <input
                      type="text"
                      name={`qb_${q.order_num}`}
                      defaultValue={q.text_option_b}
                      placeholder="Escribe la opción B..."
                      className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500 transition-colors placeholder:text-gray-600"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sticky save bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-950/95 backdrop-blur border-t border-gray-800 p-4 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-end gap-4">
          <span
            className={`text-sm text-green-400 transition-opacity duration-300 ${saved ? 'opacity-100' : 'opacity-0'}`}
          >
            ✓ Cambios guardados
          </span>
          <button
            type="submit"
            disabled={isPending}
            className="bg-pink-600 hover:bg-pink-500 disabled:opacity-50 text-white font-bold px-8 py-3 rounded-xl transition-colors"
          >
            {isPending ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </form>
  )
}

export default async function QuestionsPage({
  params,
}: {
  params: Promise<{ quizId: string }>
}) {
  const { quizId } = await params

  const { data: questions, error } = await supabaseClient
    .from('questions')
    .select('id, order_num, text_option_a, text_option_b')
    .eq('quiz_id', quizId)
    .order('order_num')

  if (error || !questions) notFound()

  return <QuestionsEditor questions={questions} quizId={quizId} />
}
