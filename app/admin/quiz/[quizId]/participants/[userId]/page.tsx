import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import Link from 'next/link'

type QuestionData = {
  id: string
  order_num: number
  text_option_a: string
  text_option_b: string
}

type ResponseRow = {
  answer: number
  questions: QuestionData | QuestionData[] | null
}

type OtherResponseRow = {
  user_id: string
  question_id: string
  answer: number
  users: { name: string } | { name: string }[] | null
}

export default async function ParticipantDetailPage({
  params,
}: {
  params: Promise<{ quizId: string; userId: string }>
}) {
  const { quizId, userId } = await params

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const [{ data: user }, { data: questions }] = await Promise.all([
    supabase.from('users').select('id, name, empresa, created_at').eq('id', userId).single(),
    supabase.from('questions').select('id, order_num, text_option_a, text_option_b').eq('quiz_id', quizId).order('order_num'),
  ])

  if (!user || !questions?.length) notFound()

  const qIds = questions.map((q) => q.id)

  const { data: myResponses } = await supabase
    .from('responses')
    .select('answer, questions(id, order_num, text_option_a, text_option_b)')
    .eq('user_id', userId)
    .in('question_id', qIds)

  const myAnswerMap = new Map(
    ((myResponses ?? []) as ResponseRow[]).map((r) => {
      const q = Array.isArray(r.questions) ? r.questions[0] : r.questions
      return [q?.id, r.answer]
    })
  )

  const { data: othersRaw } = await supabase
    .from('responses')
    .select('user_id, question_id, answer, users(name)')
    .in('question_id', qIds)
    .neq('user_id', userId)

  const matchMap = new Map<string, { name: string; matches: number; total: number }>()

  for (const row of ((othersRaw ?? []) as OtherResponseRow[])) {
    if (!myAnswerMap.has(row.question_id)) continue
    const entry = matchMap.get(row.user_id) ?? {
      name: (Array.isArray(row.users) ? row.users[0]?.name : row.users?.name) ?? 'Anónimo',
      matches: 0,
      total: 0,
    }
    entry.total++
    if (myAnswerMap.get(row.question_id) === row.answer) entry.matches++
    matchMap.set(row.user_id, entry)
  }

  const ranking = Array.from(matchMap.values())
    .map(({ name, matches, total }) => ({
      name,
      similarity: total > 0 ? Math.round((matches / total) * 100) : 0,
      shared: total,
    }))
    .sort((a, b) => b.similarity - a.similarity)

  const sortedResponses = ((myResponses ?? []) as ResponseRow[])
    .map((r) => ({ ...r, questions: Array.isArray(r.questions) ? r.questions[0] : r.questions }))
    .filter((r) => r.questions)
    .sort((a, b) => (a.questions!.order_num ?? 0) - (b.questions!.order_num ?? 0))

  const medal = (i: number) => (i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : null)

  return (
    <div className="flex flex-col gap-5">

      <div className="flex items-center gap-4">
        <Link
          href={`/admin/quiz/${quizId}/participants`}
          className="text-[#163b4f]/50 hover:text-[#163b4f] text-sm font-medium transition-colors"
        >
          ← Participantes
        </Link>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold text-[#021f35] truncate">
            {user.name}
            {user.empresa && (
              <span className="ml-2 text-sm font-medium text-[#163b4f]/50 bg-[#e8edf1] px-2.5 py-0.5 rounded-full">
                {user.empresa}
              </span>
            )}
          </h2>
          <p className="text-[#163b4f]/40 text-xs mt-0.5">
            {sortedResponses.length}/{questions.length} respuestas ·{' '}
            {new Date(user.created_at).toLocaleString('es-ES', {
              day: 'numeric', month: 'short', year: 'numeric',
              hour: '2-digit', minute: '2-digit',
            })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Answers */}
        <div className="bg-white border border-[#d0d8e0] rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[#e8edf1]">
            <h3 className="font-bold text-[#021f35]">Sus respuestas</h3>
          </div>
          <div className="divide-y divide-[#e8edf1]">
            {sortedResponses.length === 0 && (
              <p className="text-[#163b4f]/40 text-sm p-5">Sin respuestas.</p>
            )}
            {sortedResponses.map((r) => {
              const q = r.questions!
              const choseA = r.answer === 0
              return (
                <div key={q.id} className="px-5 py-3 flex items-start gap-3">
                  <span className="text-[#163b4f]/25 font-mono text-xs w-5 pt-0.5 shrink-0 text-right">
                    {q.order_num}
                  </span>
                  <div className="flex-1 min-w-0 flex gap-2">
                    <span className={`text-xs px-2 py-1 rounded-lg font-bold shrink-0 ${
                      choseA
                        ? 'bg-[#163b4f] text-white'
                        : 'bg-[#f4f7f9] text-[#163b4f]/30'
                    }`}>
                      A
                    </span>
                    <span className={`text-xs flex-1 py-1 ${choseA ? 'text-[#021f35]' : 'text-[#163b4f]/30 line-through'}`}>
                      {q.text_option_a || '—'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0 flex gap-2">
                    <span className={`text-xs px-2 py-1 rounded-lg font-bold shrink-0 ${
                      !choseA
                        ? 'bg-[#edbe00] text-[#021f35]'
                        : 'bg-[#f4f7f9] text-[#163b4f]/30'
                    }`}>
                      B
                    </span>
                    <span className={`text-xs flex-1 py-1 ${!choseA ? 'text-[#021f35]' : 'text-[#163b4f]/30 line-through'}`}>
                      {q.text_option_b || '—'}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Matches */}
        <div className="bg-white border border-[#d0d8e0] rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[#e8edf1]">
            <h3 className="font-bold text-[#021f35]">Sus matches</h3>
            <p className="text-[#163b4f]/40 text-xs mt-0.5">
              {ranking.length} participantes comparados
            </p>
          </div>
          <div className="divide-y divide-[#e8edf1]">
            {ranking.length === 0 && (
              <p className="text-[#163b4f]/40 text-sm p-5">
                No hay otros participantes para comparar.
              </p>
            )}
            {ranking.map((r, i) => {
              const m = medal(i)
              const color =
                r.similarity >= 80
                  ? 'text-[#163b4f]'
                  : r.similarity >= 60
                  ? 'text-[#c9a100]'
                  : 'text-[#163b4f]/40'
              return (
                <div key={`${r.name}-${i}`} className="px-5 py-3 flex items-center gap-3">
                  <span className="text-lg w-7 text-center shrink-0">
                    {m ?? <span className="text-[#163b4f]/25 text-sm font-mono">{i + 1}</span>}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#021f35] truncate">{r.name}</p>
                    <p className="text-xs text-[#163b4f]/40">{r.shared} preguntas</p>
                  </div>
                  <span className={`text-lg font-bold shrink-0 ${color}`}>
                    {r.similarity}%
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
