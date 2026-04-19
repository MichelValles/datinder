import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import { deleteParticipant, clearParticipants } from '../../../actions'
import ConfirmForm from '../../../components/ConfirmForm'
import LocalDate from '@/components/LocalDate'

type ParticipantRow = {
  user_id: string
  users:
    | { id: string; name: string; empresa: string | null; created_at: string }
    | { id: string; name: string; empresa: string | null; created_at: string }[]
    | null
}

export default async function ParticipantsPage({
  params,
}: {
  params: Promise<{ quizId: string }>
}) {
  const { quizId } = await params

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data: questions } = await supabase
    .from('questions')
    .select('id')
    .eq('quiz_id', quizId)

  const qIds = questions?.map((q) => q.id) ?? []

  const { data: rawResponses } = qIds.length
    ? await supabase
        .from('responses')
        .select('user_id, users(id, name, empresa, created_at)')
        .in('question_id', qIds)
    : { data: [] }

  const userMap = new Map<
    string,
    { id: string; name: string; empresa: string | null; created_at: string; answerCount: number }
  >()

  for (const row of ((rawResponses ?? []) as ParticipantRow[])) {
    const uid = row.user_id
    const user = Array.isArray(row.users) ? row.users[0] : row.users
    if (!user) continue
    if (!userMap.has(uid)) {
      userMap.set(uid, { ...user, answerCount: 0 })
    }
    userMap.get(uid)!.answerCount++
  }

  const participants = Array.from(userMap.values()).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )

  const clearAction = clearParticipants.bind(null, quizId)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-bold text-[#021f35]">Participantes</h2>
          <p className="text-[#163b4f]/50 text-sm mt-0.5">{participants.length} en total</p>
        </div>
        {participants.length > 0 && (
          <ConfirmForm
            action={clearAction}
            message="¿Eliminar todos los participantes y sus respuestas? Esta acción no se puede deshacer."
          >
            <button
              type="submit"
              className="text-sm bg-[#f4f7f9] hover:bg-red-50 text-[#163b4f]/60 hover:text-red-500 border border-[#d0d8e0] hover:border-red-200 px-4 py-2 rounded-xl transition-colors"
            >
              Vaciar todos
            </button>
          </ConfirmForm>
        )}
      </div>

      {participants.length === 0 ? (
        <div className="bg-white border border-[#d0d8e0] rounded-2xl p-12 text-center">
          <div className="text-4xl mb-3">🏜️</div>
          <p className="text-[#163b4f]/50">Nadie ha respondido este quiz aún.</p>
        </div>
      ) : (
        <div className="bg-white border border-[#d0d8e0] rounded-2xl overflow-hidden">
          <div className="divide-y divide-[#e8edf1]">
            {participants.map((p, i) => {
              const deleteAction = deleteParticipant.bind(null, p.id, quizId)
              return (
                <div
                  key={p.id}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-[#f4f7f9] transition-colors"
                >
                  <span className="text-[#163b4f]/30 text-sm w-6 text-right shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[#021f35] truncate">
                      {p.name}
                      {p.empresa && (
                        <span className="ml-2 text-xs font-medium text-[#163b4f]/50 bg-[#e8edf1] px-2 py-0.5 rounded-full">
                          {p.empresa}
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-[#163b4f]/40 mt-0.5">
                      {p.answerCount}/{qIds.length} respuestas ·{' '}
                      <LocalDate iso={p.created_at} format="date" />
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      href={`/admin/quiz/${quizId}/participants/${p.id}`}
                      className="text-sm bg-[#163b4f] hover:bg-[#1e4d67] text-white px-3 py-1.5 rounded-lg transition-colors font-semibold"
                    >
                      Ver detalle
                    </Link>
                    <ConfirmForm
                      action={deleteAction}
                      message={`¿Eliminar a "${p.name}" y todas sus respuestas?`}
                    >
                      <button
                        type="submit"
                        className="text-sm text-[#163b4f]/30 hover:text-red-500 px-2 py-1.5 rounded-lg transition-colors"
                        title="Eliminar participante"
                      >
                        ✕
                      </button>
                    </ConfirmForm>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
