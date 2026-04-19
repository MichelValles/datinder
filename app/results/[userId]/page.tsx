import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import Link from 'next/link'

type OtherResponse = {
  user_id: string
  question_id: string
  answer: number
  users: { name: string }[] | { name: string } | null
}

export default async function ResultsPage({
  params,
}: {
  params: Promise<{ userId: string }>
}) {
  const { userId } = await params

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const [{ data: currentUser }, { data: myResponses }] = await Promise.all([
    supabase.from('users').select('name').eq('id', userId).single(),
    supabase.from('responses').select('question_id, answer').eq('user_id', userId),
  ])

  if (!currentUser) notFound()

  if (!myResponses?.length) {
    return (
      <main className="min-h-screen bg-[#163b4f] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 text-center w-full max-w-sm shadow-xl">
          <div className="text-5xl mb-4">😕</div>
          <p className="text-[#163b4f]/70 mb-6">No has respondido ninguna pregunta aún.</p>
          <Link href="/" className="text-[#163b4f] font-bold">Volver al inicio</Link>
        </div>
      </main>
    )
  }

  const myAnswerMap = new Map(myResponses.map(r => [r.question_id, r.answer]))
  const myQuestionIds = Array.from(myAnswerMap.keys())

  const { data: otherResponses } = await supabase
    .from('responses')
    .select('user_id, question_id, answer, users(name)')
    .in('question_id', myQuestionIds)
    .neq('user_id', userId)

  const userMap = new Map<string, { name: string; matches: number; total: number }>()

  for (const row of ((otherResponses ?? []) as OtherResponse[])) {
    if (!myAnswerMap.has(row.question_id)) continue
    const entry = userMap.get(row.user_id) ?? {
      name: (Array.isArray(row.users) ? row.users[0]?.name : row.users?.name) ?? 'Anónimo',
      matches: 0,
      total: 0,
    }
    entry.total++
    if (myAnswerMap.get(row.question_id) === row.answer) entry.matches++
    userMap.set(row.user_id, entry)
  }

  const ranking = Array.from(userMap.values())
    .map(({ name, matches, total }) => ({
      name,
      similarity: total > 0 ? Math.round((matches / total) * 100) : 0,
      shared: total,
    }))
    .sort((a, b) => b.similarity - a.similarity)

  const medal = (i: number) =>
    i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : null

  return (
    <main className="min-h-screen bg-[#163b4f] p-4">
      <div className="max-w-sm mx-auto">
        <div className="text-center pt-10 pb-6">
          <img
            src="https://i.ibb.co/8gNrP0q6/Chat-GPT-Image-May-29-2025-08-27-01-PM.png"
            alt="DaTinder"
            className="h-16 w-auto mx-auto mb-4 object-contain"
          />
          <h1 className="text-3xl font-bold text-white">Tus matches</h1>
          <p className="text-white/60 mt-1 text-sm">Hola, {currentUser.name}!</p>
        </div>

        {ranking.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center shadow-xl">
            <div className="text-4xl mb-3">🏝️</div>
            <p className="text-[#021f35] font-bold">Aún eres el único aquí.</p>
            <p className="text-[#163b4f]/50 text-sm mt-2">
              ¡Comparte el quiz con tus amigos!
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {ranking.map((r, i) => {
              const m = medal(i)
              const scoreColor =
                r.similarity >= 80
                  ? 'text-[#163b4f]'
                  : r.similarity >= 60
                  ? 'text-[#c9a100]'
                  : 'text-[#163b4f]/40'

              return (
                <div
                  key={`${r.name}-${i}`}
                  className="bg-white rounded-2xl p-4 flex items-center gap-3 shadow-lg"
                >
                  <div className="text-2xl w-9 text-center shrink-0">
                    {m ?? (
                      <span className="text-[#163b4f]/30 font-bold text-sm">{i + 1}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-[#021f35] truncate">{r.name}</div>
                    <div className="text-xs text-[#163b4f]/40">
                      {r.shared} preguntas en común
                    </div>
                  </div>
                  <div className={`text-2xl font-bold shrink-0 ${scoreColor}`}>
                    {r.similarity}%
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <div className="mt-6 pb-10">
          <Link
            href="/"
            className="block text-center bg-[#edbe00] hover:bg-[#c9a100] text-[#021f35] font-bold rounded-xl py-4 transition-colors"
          >
            Repetir quiz →
          </Link>
        </div>
      </div>
    </main>
  )
}
