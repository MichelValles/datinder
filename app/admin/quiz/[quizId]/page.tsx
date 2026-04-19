'use client'

import { use, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { saveQuiz, toggleFinalized, deleteQuiz } from '../../actions'

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

type Quiz = {
  id: string
  title: string
  is_finalized: boolean
}

function QuizEditorClient({ quiz, questions }: { quiz: Quiz; questions: Question[] }) {
  const [saved, setSaved] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const saveAction = saveQuiz.bind(null, quiz.id)

  async function handleSave(formData: FormData) {
    startTransition(async () => {
      await saveAction(formData)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    })
  }

  function handleToggle() {
    startTransition(async () => {
      await toggleFinalized(quiz.id, quiz.is_finalized)
      router.refresh()
    })
  }

  function handleDelete() {
    if (!confirm(`¿Eliminar "${quiz.title}"? Esta acción no se puede deshacer.`)) return
    startTransition(async () => {
      await deleteQuiz(quiz.id)
    })
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white pb-24">
      <div className="max-w-3xl mx-auto p-6">

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link
            href="/admin"
            className="text-gray-400 hover:text-white transition-colors text-sm"
          >
            ← Volver
          </Link>
          <span className="text-gray-700">/</span>
          <span className="text-gray-300 text-sm truncate">{quiz.title}</span>
        </div>

        <form action={handleSave} className="flex flex-col gap-6">

          {/* Quiz title + status */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Título del Quiz
            </label>
            <input
              type="text"
              name="title"
              defaultValue={quiz.title}
              required
              maxLength={100}
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-pink-500 transition-colors text-lg font-semibold"
            />

            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-800">
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-400">Estado:</span>
                <span
                  className={`text-xs px-3 py-1 rounded-full font-medium ${
                    quiz.is_finalized
                      ? 'bg-green-900/50 text-green-400 border border-green-800'
                      : 'bg-yellow-900/50 text-yellow-400 border border-yellow-800'
                  }`}
                >
                  {quiz.is_finalized ? '✓ Activo' : '○ Borrador'}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleToggle}
                  disabled={isPending}
                  className="text-sm bg-gray-800 hover:bg-gray-700 px-4 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                >
                  {quiz.is_finalized ? 'Poner borrador' : 'Activar'}
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isPending}
                  className="text-sm bg-red-950 hover:bg-red-900 text-red-400 px-4 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>

          {/* Questions */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-gray-800">
              <h2 className="font-semibold">Preguntas ({questions.length})</h2>
              <p className="text-gray-400 text-xs mt-0.5">
                Edita el texto de cada opción A y B
              </p>
            </div>

            <div className="divide-y divide-gray-800">
              {questions.map((q) => (
                <div key={q.id} className="p-5">
                  <input type="hidden" name={`qid_${q.order_num}`} value={q.id} />
                  <div className="flex items-start gap-4">
                    <span className="text-gray-600 font-mono text-sm w-6 pt-3 shrink-0">
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

          {/* Save button — sticky */}
          <div className="fixed bottom-0 left-0 right-0 bg-gray-950/90 backdrop-blur border-t border-gray-800 p-4">
            <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
              <span className={`text-sm transition-opacity duration-300 ${saved ? 'text-green-400 opacity-100' : 'opacity-0'}`}>
                ✓ Guardado
              </span>
              <button
                type="submit"
                disabled={isPending}
                className="ml-auto bg-pink-600 hover:bg-pink-500 disabled:opacity-50 text-white font-bold px-8 py-3 rounded-xl transition-colors"
              >
                {isPending ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </div>

        </form>
      </div>
    </main>
  )
}

// Server component wrapper that fetches data
import { notFound } from 'next/navigation'

export default async function AdminQuizPage({
  params,
}: {
  params: Promise<{ quizId: string }>
}) {
  const { quizId } = await params

  const supabaseServer = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const [{ data: quiz }, { data: questions }] = await Promise.all([
    supabaseServer.from('quizzes').select('id, title, is_finalized').eq('id', quizId).single(),
    supabaseServer.from('questions').select('id, order_num, text_option_a, text_option_b').eq('quiz_id', quizId).order('order_num'),
  ])

  if (!quiz) notFound()

  return <QuizEditorClient quiz={quiz} questions={questions ?? []} />
}
