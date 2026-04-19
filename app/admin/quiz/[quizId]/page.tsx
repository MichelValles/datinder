import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import { headers } from 'next/headers'
import { updateQuizSettings, toggleFinalized, deleteQuiz, clearParticipants } from '../../actions'
import ConfirmForm from '../../components/ConfirmForm'
import QuizUrlBar from './QuizUrlBar'

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

  const { data: quiz } = await supabase
    .from('quizzes')
    .select('id, title, is_finalized, created_at')
    .eq('id', quizId)
    .single()

  if (!quiz) notFound()

  const { data: questions } = await supabase
    .from('questions')
    .select('id')
    .eq('quiz_id', quizId)

  const qIds = questions?.map((q) => q.id) ?? []

  let participantCount = 0
  if (qIds.length > 0) {
    const { data: responses } = await supabase
      .from('responses')
      .select('user_id')
      .in('question_id', qIds)
    participantCount = new Set(responses?.map((r) => r.user_id) ?? []).size
  }

  const h = await headers()
  const host = h.get('host') ?? 'datinder.vercel.app'
  const proto = host.startsWith('localhost') ? 'http' : 'https'
  const quizUrl = `${proto}://${host}/?quiz=${quizId}`

  const saveSettings = updateQuizSettings.bind(null, quizId)
  const toggleAction = toggleFinalized.bind(null, quizId, quiz.is_finalized)
  const deleteAction = deleteQuiz.bind(null, quizId)
  const clearAction  = clearParticipants.bind(null, quizId)

  return (
    <div className="flex flex-col gap-5 max-w-2xl">

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Preguntas',     value: qIds.length },
          { label: 'Participantes', value: participantCount },
          {
            label: 'Creado',
            value: new Date(quiz.created_at).toLocaleDateString('es-ES', {
              day: 'numeric', month: 'short',
            }),
          },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-[#d0d8e0] rounded-2xl p-4 text-center">
            <div className="text-2xl font-bold text-[#021f35]">{s.value}</div>
            <div className="text-xs text-[#163b4f]/50 mt-1 font-medium">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Quiz URL — only when published */}
      {quiz.is_finalized && (
        <div className="bg-[#163b4f] rounded-2xl p-6">
          <h2 className="text-xs font-bold text-white/50 uppercase tracking-widest mb-1">
            URL del Quiz
          </h2>
          <p className="text-white/70 text-xs mb-4">
            Comparte este enlace para que los participantes puedan acceder al quiz.
          </p>
          <QuizUrlBar url={quizUrl} />
        </div>
      )}

      {/* Title */}
      <div className="bg-white border border-[#d0d8e0] rounded-2xl p-6">
        <h2 className="text-xs font-bold text-[#163b4f] uppercase tracking-widest mb-4">
          Nombre del Quiz
        </h2>
        <form action={saveSettings} className="flex gap-3">
          <input
            type="text"
            name="title"
            defaultValue={quiz.title}
            required
            maxLength={100}
            className="flex-1 bg-[#f4f7f9] border border-[#d0d8e0] text-[#021f35] rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#163b4f] transition-colors text-sm"
          />
          <button
            type="submit"
            className="bg-[#edbe00] hover:bg-[#c9a100] text-[#021f35] font-bold px-5 py-2.5 rounded-xl text-sm transition-colors shrink-0"
          >
            Guardar
          </button>
        </form>
      </div>

      {/* Publication */}
      <div className="bg-white border border-[#d0d8e0] rounded-2xl p-6">
        <h2 className="text-xs font-bold text-[#163b4f] uppercase tracking-widest mb-4">
          Publicación
        </h2>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[#021f35] font-semibold">
              {quiz.is_finalized ? 'Quiz activo' : 'Quiz en borrador'}
            </p>
            <p className="text-[#163b4f]/50 text-sm mt-0.5">
              {quiz.is_finalized
                ? 'Los usuarios pueden acceder y responder.'
                : 'Solo visible desde el admin.'}
            </p>
          </div>
          <form action={toggleAction}>
            <button
              type="submit"
              className={`text-sm font-bold px-5 py-2.5 rounded-xl transition-colors shrink-0 ${
                quiz.is_finalized
                  ? 'bg-amber-100 hover:bg-amber-200 text-amber-700 border border-amber-200'
                  : 'bg-green-100 hover:bg-green-200 text-green-700 border border-green-200'
              }`}
            >
              {quiz.is_finalized ? 'Volver a borrador' : 'Publicar quiz'}
            </button>
          </form>
        </div>
      </div>

      {/* Danger zone */}
      <div className="bg-white border border-red-200 rounded-2xl p-6">
        <h2 className="text-xs font-bold text-red-500 uppercase tracking-widest mb-4">
          Zona de peligro
        </h2>
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between py-3 border-b border-[#f0e0e0] gap-4">
            <div>
              <p className="text-[#021f35] text-sm font-semibold">Vaciar participantes</p>
              <p className="text-[#163b4f]/50 text-xs mt-0.5">
                Elimina todos los usuarios y sus respuestas de este quiz.
              </p>
            </div>
            <ConfirmForm
              action={clearAction}
              message="¿Vaciar todos los participantes? Esta acción no se puede deshacer."
            >
              <button
                type="submit"
                className="text-sm bg-[#f4f7f9] hover:bg-red-50 text-[#163b4f]/60 hover:text-red-500 border border-[#d0d8e0] hover:border-red-200 px-4 py-2 rounded-xl transition-colors shrink-0"
              >
                Vaciar
              </button>
            </ConfirmForm>
          </div>

          <div className="flex items-center justify-between py-3 gap-4">
            <div>
              <p className="text-[#021f35] text-sm font-semibold">Eliminar quiz</p>
              <p className="text-[#163b4f]/50 text-xs mt-0.5">
                Elimina el quiz, preguntas y todas las respuestas permanentemente.
              </p>
            </div>
            <ConfirmForm
              action={deleteAction}
              message={`¿Eliminar "${quiz.title}"? Esta acción no se puede deshacer.`}
            >
              <button
                type="submit"
                className="text-sm bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-4 py-2 rounded-xl transition-colors shrink-0"
              >
                Eliminar
              </button>
            </ConfirmForm>
          </div>
        </div>
      </div>

    </div>
  )
}
