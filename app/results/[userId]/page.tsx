import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import LiveRefresher from '@/components/LiveRefresher'
import ShareButton from './ShareButton'
import ResultNotFound from './NotFound'

type OtherResponse = {
  user_id: string
  question_id: string
  answer: number
  users: { name: string; linkedin_url: string | null; avatar_url: string | null }[] | { name: string; linkedin_url: string | null; avatar_url: string | null } | null
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
    supabase.from('users').select('name, linkedin_url').eq('id', userId).single(),
    supabase.from('responses').select('question_id, answer').eq('user_id', userId),
  ])

  if (!currentUser) return <ResultNotFound userId={userId} />

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
    .select('user_id, question_id, answer, users(name, linkedin_url, avatar_url)')
    .in('question_id', myQuestionIds)
    .neq('user_id', userId)
    .limit(4000)

  const userMap = new Map<string, { name: string; linkedin_url: string | null; avatar_url: string | null; matches: number; total: number }>()

  for (const row of ((otherResponses ?? []) as OtherResponse[])) {
    if (!myAnswerMap.has(row.question_id)) continue
    const u = Array.isArray(row.users) ? row.users[0] : row.users
    const entry = userMap.get(row.user_id) ?? {
      name: u?.name ?? 'Anónimo',
      linkedin_url: u?.linkedin_url ?? null,
      avatar_url: u?.avatar_url ?? null,
      matches: 0,
      total: 0,
    }
    entry.total++
    if (myAnswerMap.get(row.question_id) === row.answer) entry.matches++
    userMap.set(row.user_id, entry)
  }

  const ranking = Array.from(userMap.values())
    .map(({ name, linkedin_url, avatar_url, matches, total }) => ({
      name,
      linkedin_url,
      avatar_url,
      similarity: total > 0 ? Math.round((matches / total) * 100) : 0,
      matches,
      shared: total,
    }))
    .sort((a, b) => b.similarity - a.similarity)

  const medal = (i: number) =>
    i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : null

  return (
    <main className="min-h-screen bg-[#163b4f] p-4 pb-24">
      <div className="max-w-sm mx-auto">
        <div className="text-center pt-10 pb-4">
          <Link href="/" className="flex items-center justify-center gap-2 mb-4">
            <img src="/images/logo-yellow.svg" alt="DaTinder" className="h-9 w-auto" />
            <span className="text-white font-bold text-2xl tracking-tight">datinder</span>
          </Link>
          <h1 className="text-3xl font-bold text-white">Tus matches</h1>
          <div className="flex items-center justify-center gap-2 mt-1">
            <p className="text-white/60 text-sm">Hola, {currentUser.name}!</p>
            {currentUser.linkedin_url && (
              <a
                href={currentUser.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#0A66C2] bg-white rounded-full p-1 hover:bg-blue-50 transition-colors"
                title="Tu perfil de LinkedIn"
              >
                <LinkedInIcon size={14} />
              </a>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2 mb-5">
          <ShareButton name={currentUser.name} matchCount={ranking.length} />
          <Link
            href="/"
            className="block text-center bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl py-3 transition-colors"
          >
            Repetir quiz →
          </Link>
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
                  {r.avatar_url ? (
                    <img
                      src={r.avatar_url}
                      alt={r.name}
                      className="w-9 h-9 rounded-full object-cover shrink-0 ring-2 ring-[#0A66C2]/30"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-[#163b4f]/10 flex items-center justify-center shrink-0">
                      <span className="text-[#163b4f]/40 font-bold text-sm">{r.name[0]?.toUpperCase()}</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    {r.linkedin_url ? (
                      <a
                        href={r.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-bold text-[#021f35] truncate hover:text-[#0A66C2] transition-colors block"
                      >
                        {r.name}
                      </a>
                    ) : (
                      <div className="font-bold text-[#021f35] truncate">{r.name}</div>
                    )}
                    <div className="text-xs text-[#163b4f]/40">
                      {r.matches}/{r.shared} respuestas iguales
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-2xl font-bold ${scoreColor}`}>
                      {r.similarity}%
                    </span>
                    {r.linkedin_url && (
                      <a
                        href={r.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Ver perfil de LinkedIn"
                        className="flex items-center justify-center w-8 h-8 rounded-full bg-[#0A66C2] hover:bg-[#004182] text-white transition-colors"
                      >
                        <LinkedInIcon size={14} />
                      </a>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

      </div>
      <LiveRefresher intervalMs={15000} />
    </main>
  )
}

function LinkedInIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  )
}
