import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import { updateQuizSettings, toggleFinalized, deleteQuiz, clearParticipants } from '../../actions'

export default async function QuizSettingsPage({
  params,
}: {
  params: Promise<{ quizId: string }>
}) {
  const { quizId } = await params

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const [{ data: quiz }, { data: questions }, { data: responses }] = await Promise.all([
    supabase.from('quizzes').select('id, title, is_finalized, created_at').eq('id', quizId).single(),
    supabase.from('questions').select('id', { count: 'exact' }).eq('quiz_id', quizId),
    supabase
      .from('responses')
      .select('user_id', { count: 'exact' })
      .in('question_id', await supabase
        .from('questions')
        .select('id')
        .eq('quiz_id', quizId)
        .then(r => (r.data ?? []).map(q => q.id))
      ),
  ])

  if (!quiz) notFound()

  const participantCount = new Set(responses?.map(r => r.user_id) ?? []).size

  const saveSettings = updateQuizSettings.bind(null, quizId)
  const toggleAction = toggleFinalized.bind(null, quizId, quiz.is_finalized)
  const deleteAction = deleteQuiz.bind(null, quizId)
  const clearAction = clearParticipants.bind(null, quizId)

  return (
    <div className="flex flex-col gap-6 max-w-2xl">

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Preguntas', value: questions?.length ?? 0 },
          { label: 'Participantes', value: participantCount },
          { label: 'Creado', value: new Date(quiz.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) },
        ].map(s => (
          <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-2xl p-4 text-center">
            <div className="text-2xl font-bold text-white">{s.value}</div>
            <div className="text-xs text-gray-400 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Title */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
          Nombre del Quiz
        </h2>
        <form action={saveSettings} className="flex gap-3">
          <input
            type="text"
            name="title"
            defaultValue={quiz.title}
            required
            maxLength={100}
            className="flex-1 bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-2.5 focus:outline-none focus:border-pink-500 transition-colors text-sm"
          />
          <button
            type="submit"
            className="bg-pink-600 hover:bg-pink-500 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors shrink-0"
          >
            Guardar
          </button>
        </form>
      </div>

      {/* Publication status */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
          Publicación
        </h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white font-medium">
              {quiz.is_finalized ? 'Quiz activo' : 'Quiz en borrador'}
            </p>
            <p className="text-gray-400 text-sm mt-0.5">
              {quiz.is_finalized
                ? 'Los usuarios pueden acceder y responder.'
                : 'Solo visible desde el admin. Los usuarios no pueden acceder.'}
            </p>
          </div>
          <form action={toggleAction}>
            <button
              type="submit"
              className={`text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors shrink-0 ${
                quiz.is_finalized
                  ? 'bg-yellow-900/50 hover:bg-yellow-900 text-yellow-400 border border-yellow-800'
                  : 'bg-green-900/50 hover:bg-green-900 text-green-400 border border-green-800'
              }`}
            >
              {quiz.is_finalized ? 'Volver a borrador' : 'Publicar quiz'}
            </button>
          </form>
        </div>
      </div>

      {/* Danger zone */}
      <div className="bg-gray-900 border border-red-900/40 rounded-2xl p-6">
        <h2 className="text-sm font-semibold text-red-400 uppercase tracking-wider mb-4">
          Zona de peligro
        </h2>
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between py-3 border-b border-gray-800">
            <div>
              <p className="text-white text-sm font-medium">Vaciar participantes</p>
              <p className="text-gray-400 text-xs mt-0.5">
                Elimina todos los usuarios y sus respuestas de este quiz.
              </p>
            </div>
            <form action={clearAction} onSubmit={(e) => {
              // eslint-disable-next-line no-undef
              if (!confirm('¿Vaciar todos los participantes? Esta acción no se puede deshacer.')) e.preventDefault()
            }}>
              <button
                type="submit"
                className="text-sm bg-gray-800 hover:bg-red-950 text-gray-300 hover:text-red-400 px-4 py-2 rounded-xl transition-colors shrink-0"
              >
                Vaciar
              </button>
            </form>
          </div>
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-white text-sm font-medium">Eliminar quiz</p>
              <p className="text-gray-400 text-xs mt-0.5">
                Elimina el quiz, sus preguntas y todas las respuestas permanentemente.
              </p>
            </div>
            <form action={deleteAction} onSubmit={(e) => {
              // eslint-disable-next-line no-undef
              if (!confirm(`¿Eliminar "${quiz.title}"? Esta acción no se puede deshacer.`)) e.preventDefault()
            }}>
              <button
                type="submit"
                className="text-sm bg-red-950 hover:bg-red-900 text-red-400 px-4 py-2 rounded-xl transition-colors shrink-0"
              >
                Eliminar
              </button>
            </form>
          </div>
        </div>
      </div>

    </div>
  )
}
