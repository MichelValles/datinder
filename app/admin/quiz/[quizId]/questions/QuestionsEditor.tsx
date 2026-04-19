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
      {/* Autofill panel */}
      <div className="bg-white border border-[#d0d8e0] rounded-2xl p-5 mb-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="font-bold text-[#021f35] text-sm">Autorellenar preguntas</h2>
            <p className="text-[#163b4f]/50 text-xs mt-0.5">
              Sustituye todas las preguntas por un conjunto predefinido
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={isAutofilling}
              onClick={() => handleAutofill('easy')}
              className="text-sm bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 px-4 py-2 rounded-xl transition-colors disabled:opacity-50 font-semibold"
            >
              😊 Fácil
            </button>
            <button
              type="button"
              disabled={isAutofilling}
              onClick={() => handleAutofill('medium')}
              className="text-sm bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 px-4 py-2 rounded-xl transition-colors disabled:opacity-50 font-semibold"
            >
              🤔 Medio
            </button>
            <button
              type="button"
              disabled={isAutofilling}
              onClick={() => handleAutofill('hard')}
              className="text-sm bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-4 py-2 rounded-xl transition-colors disabled:opacity-50 font-semibold"
            >
              🔥 Difícil
            </button>
          </div>
        </div>
        {isAutofilling && (
          <p className="text-xs text-[#163b4f]/50 mt-3">Rellenando preguntas...</p>
        )}
      </div>

      <form action={handleSave}>
        <div className="bg-white border border-[#d0d8e0] rounded-2xl overflow-hidden mb-24">
          <div className="px-5 py-4 border-b border-[#e8edf1] flex items-center justify-between">
            <div>
              <h2 className="font-bold text-[#021f35]">Preguntas</h2>
              <p className="text-[#163b4f]/50 text-xs mt-0.5">
                Edita la pregunta y las opciones A y B
              </p>
            </div>
            <span className="text-xs text-[#163b4f]/30 font-medium">{questions.length} preguntas</span>
          </div>

          <div className="divide-y divide-[#e8edf1]">
            {questions.map((q) => (
              <div key={q.id} className="p-5">
                <input type="hidden" name={`qid_${q.order_num}`} value={q.id} />
                <div className="flex items-start gap-4">
                  <span className="text-[#163b4f]/30 font-mono text-sm w-6 pt-3 shrink-0 text-right">
                    {q.order_num}
                  </span>
                  <div className="flex-1 flex flex-col gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-[#163b4f]/50 uppercase tracking-widest mb-1.5">
                        Pregunta
                      </label>
                      <input
                        type="text"
                        name={`qt_${q.order_num}`}
                        defaultValue={q.question_text}
                        placeholder="Escribe la pregunta..."
                        className="w-full bg-[#f4f7f9] border border-[#d0d8e0] text-[#021f35] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#163b4f] transition-colors placeholder:text-[#163b4f]/25"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-[#163b4f] uppercase tracking-widest mb-1.5">
                          Opción A
                        </label>
                        <input
                          type="text"
                          name={`qa_${q.order_num}`}
                          defaultValue={q.text_option_a}
                          placeholder="Escribe la opción A..."
                          className="w-full bg-[#f4f7f9] border border-[#d0d8e0] text-[#021f35] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#163b4f] transition-colors placeholder:text-[#163b4f]/25"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-[#edbe00] uppercase tracking-widest mb-1.5">
                          Opción B
                        </label>
                        <input
                          type="text"
                          name={`qb_${q.order_num}`}
                          defaultValue={q.text_option_b}
                          placeholder="Escribe la opción B..."
                          className="w-full bg-[#f4f7f9] border border-[#d0d8e0] text-[#021f35] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#c9a100] transition-colors placeholder:text-[#163b4f]/25"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur border-t border-[#d0d8e0] p-4 z-10">
          <div className="max-w-4xl mx-auto flex items-center justify-end gap-4">
            <span
              className={`text-sm text-green-600 font-semibold transition-opacity duration-300 ${
                saved ? 'opacity-100' : 'opacity-0'
              }`}
            >
              ✓ Cambios guardados
            </span>
            <button
              type="submit"
              disabled={isPending}
              className="bg-[#edbe00] hover:bg-[#c9a100] disabled:opacity-50 text-[#021f35] font-bold px-8 py-3 rounded-xl transition-colors"
            >
              {isPending ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </div>
      </form>
    </>
  )
}
