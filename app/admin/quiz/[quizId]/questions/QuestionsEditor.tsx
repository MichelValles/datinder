'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { saveQuestions, autofillQuestions } from '../../../actions'

type Question = {
  id: string
  order_num: number
  question_text: string
  text_option_a: string
  text_option_b: string
}

export default function QuestionsEditor({
  questions,
  quizId,
}: {
  questions: Question[]
  quizId: string
}) {
  const [saved, setSaved] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [isAutofilling, startAutofill] = useTransition()
  const router = useRouter()

  const saveAction = saveQuestions.bind(null, quizId)

  async function handleSave(formData: FormData) {
    startTransition(async () => {
      await saveAction(formData)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    })
  }

  function handleAutofill(level: 'easy' | 'medium' | 'hard') {
    startAutofill(async () => {
      await autofillQuestions(quizId, level)
      router.refresh()
    })
  }

  return (
    <>
      {/* Autofill */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 mb-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="font-semibold text-white text-sm">Autorellenar preguntas</h2>
            <p className="text-gray-400 text-xs mt-0.5">Sustituye todas las preguntas por un conjunto predefinido</p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={isAutofilling}
              onClick={() => handleAutofill('easy')}
              className="text-sm bg-green-900/40 hover:bg-green-900/70 text-green-400 border border-green-800 px-4 py-2 rounded-xl transition-colors disabled:opacity-50"
            >
              😊 Fácil
            </button>
            <button
              type="button"
              disabled={isAutofilling}
              onClick={() => handleAutofill('medium')}
              className="text-sm bg-yellow-900/40 hover:bg-yellow-900/70 text-yellow-400 border border-yellow-800 px-4 py-2 rounded-xl transition-colors disabled:opacity-50"
            >
              🤔 Medio
            </button>
            <button
              type="button"
              disabled={isAutofilling}
              onClick={() => handleAutofill('hard')}
              className="text-sm bg-red-900/40 hover:bg-red-900/70 text-red-400 border border-red-800 px-4 py-2 rounded-xl transition-colors disabled:opacity-50"
            >
              🔥 Difícil
            </button>
          </div>
        </div>
        {isAutofilling && (
          <p className="text-xs text-gray-400 mt-3">Rellenando preguntas...</p>
        )}
      </div>

      <form action={handleSave}>
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden mb-24">
          <div className="p-5 border-b border-gray-800 flex items-center justify-between">
            <div>
              <h2 className="font-semibold">Preguntas</h2>
              <p className="text-gray-400 text-xs mt-0.5">
                Edita la pregunta y las opciones A y B
              </p>
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
                  <div className="flex-1 flex flex-col gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                        Pregunta
                      </label>
                      <input
                        type="text"
                        name={`qt_${q.order_num}`}
                        defaultValue={q.question_text}
                        placeholder="Escribe la pregunta..."
                        className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-pink-500 transition-colors placeholder:text-gray-600"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
              </div>
            ))}
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 bg-gray-950/95 backdrop-blur border-t border-gray-800 p-4 z-10">
          <div className="max-w-4xl mx-auto flex items-center justify-end gap-4">
            <span
              className={`text-sm text-green-400 transition-opacity duration-300 ${
                saved ? 'opacity-100' : 'opacity-0'
              }`}
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
    </>
  )
}
