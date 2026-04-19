import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import { deleteParticipant, clearParticipants } from '../../../actions'

type ParticipantRow = {
  user_id: string
  users: { id: string; name: string; created_at: string } | { id: string; name: string; created_at: string }[] | null
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

  const { data: rawResponses } = await supabase
    .from('responses')
    .select('user_id, users(id, name, created_at)')
    .in('question_id', qIds)

  // Deduplicate by user_id, count answers
  const userMap = new Map<
    string,
    { id: string; name: string; created_at: string; answerCount: number }
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
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-white">Participantes</h2>
          <p className="text-gray-400 text-sm mt-0.5">{participants.length} en total</p>
        </div>
        {participants.length > 0 && (
          <form
            action={clearAction}
            onSubmit={(e) => {
              if (!confirm('¿Eliminar todos los participantes y sus respuestas?'))
                // eslint-disable-next-line no-undef
                e.preventDefault()
            }}
          >
            <button
              type="submit"
              className="text-sm bg-gray-800 hover:bg-red-950 text-gray-300 hover:text-red-400 px-4 py-2 rounded-xl transition-colors"
            >
              Vaciar todos
            </button>
          </form>
        )}
      </div>

      {participants.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-12 text-center">
          <div className="text-4xl mb-3">🏜️</div>
          <p className="text-gray-400">Nadie ha respondido este quiz aún.</p>
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          <div className="divide-y divide-gray-800">
            {participants.map((p, i) => {
              const deleteAction = deleteParticipant.bind(null, p.id, quizId)
              return (
                <div key={p.id} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-800/50 transition-colors">
                  <span className="text-gray-600 text-sm w-6 text-right shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white truncate">{p.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {p.answerCount}/{qIds.length} respuestas ·{' '}
                      {new Date(p.created_at).toLocaleDateString('es-ES', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      href={`/admin/quiz/${quizId}/participants/${p.id}`}
                      className="text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      Ver detalle
                    </Link>
                    <form
                      action={deleteAction}
                      onSubmit={(e) => {
                        if (!confirm(`¿Eliminar a "${p.name}" y todas sus respuestas?`))
                          // eslint-disable-next-line no-undef
                          e.preventDefault()
                      }}
                    >
                      <button
                        type="submit"
                        className="text-sm text-gray-600 hover:text-red-400 px-2 py-1.5 rounded-lg transition-colors"
                      >
                        ✕
                      </button>
                    </form>
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
