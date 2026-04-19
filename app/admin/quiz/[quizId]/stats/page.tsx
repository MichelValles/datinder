import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import StatsCharts from './StatsCharts'

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export default async function QuizStatsPage({
  params,
}: {
  params: Promise<{ quizId: string }>
}) {
  const { quizId } = await params
  const supabase = db()

  const [{ data: quiz }, { data: questions }] = await Promise.all([
    supabase.from('quizzes').select('title').eq('id', quizId).single(),
    supabase
      .from('questions')
      .select('id, order_num, question_text, text_option_a, text_option_b')
      .eq('quiz_id', quizId)
      .order('order_num'),
  ])

  if (!quiz) notFound()

  const questionIds = (questions ?? []).map((q) => q.id)

  const { data: responses } = await supabase
    .from('responses')
    .select('user_id, question_id, answer')
    .in('question_id', questionIds.length ? questionIds : ['none'])

  const userIds = [...new Set((responses ?? []).map((r) => r.user_id))]

  const { data: users } = userIds.length
    ? await supabase
        .from('users')
        .select('id, name, empresa, linkedin_url, created_at')
        .in('id', userIds)
    : { data: [] }

  // A/B distribution per question
  const questionStats = (questions ?? []).map((q) => {
    const qr = (responses ?? []).filter((r) => r.question_id === q.id)
    const votesA = qr.filter((r) => r.answer === 0).length
    const votesB = qr.filter((r) => r.answer === 1).length
    const total = votesA + votesB
    return {
      label: q.question_text ? q.question_text.slice(0, 40) : `P${q.order_num}`,
      optionA: q.text_option_a || 'Opción A',
      optionB: q.text_option_b || 'Opción B',
      votesA,
      votesB,
      pctA: total > 0 ? Math.round((votesA / total) * 100) : 0,
      pctB: total > 0 ? Math.round((votesB / total) * 100) : 0,
    }
  })

  // Participation by day
  const dayMap = new Map<string, number>()
  for (const u of users ?? []) {
    const day = (u.created_at as string).slice(0, 10)
    dayMap.set(day, (dayMap.get(day) ?? 0) + 1)
  }
  const participationByDay = Array.from(dayMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count }))

  // Top companies
  const companyMap = new Map<string, number>()
  for (const u of users ?? []) {
    if (u.empresa) companyMap.set(u.empresa, (companyMap.get(u.empresa) ?? 0) + 1)
  }
  const topCompanies = Array.from(companyMap.entries())
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([name, count]) => ({ name, count }))

  // Top matches between participants
  const userAnswers = new Map<string, Map<string, number>>()
  for (const r of responses ?? []) {
    if (!userAnswers.has(r.user_id)) userAnswers.set(r.user_id, new Map())
    userAnswers.get(r.user_id)!.set(r.question_id, r.answer)
  }
  const userMeta = new Map(
    (users ?? []).map((u) => [u.id, { name: u.name, linkedin_url: u.linkedin_url ?? null }])
  )

  const allUsers = Array.from(userAnswers.keys())
  const pairs: Array<{
    nameA: string; linkedinA: string | null
    nameB: string; linkedinB: string | null
    similarity: number; matches: number; total: number
  }> = []

  for (let i = 0; i < Math.min(allUsers.length, 80); i++) {
    for (let j = i + 1; j < Math.min(allUsers.length, 80); j++) {
      const a = userAnswers.get(allUsers[i])!
      const b = userAnswers.get(allUsers[j])!
      let matches = 0, total = 0
      for (const [qId, ans] of a) {
        if (b.has(qId)) { total++; if (b.get(qId) === ans) matches++ }
      }
      if (total < 5) continue
      const metaA = userMeta.get(allUsers[i])
      const metaB = userMeta.get(allUsers[j])
      pairs.push({
        nameA: metaA?.name ?? 'Anónimo',
        linkedinA: metaA?.linkedin_url ?? null,
        nameB: metaB?.name ?? 'Anónimo',
        linkedinB: metaB?.linkedin_url ?? null,
        similarity: Math.round((matches / total) * 100),
        matches,
        total,
      })
    }
  }
  const topPairs = pairs.sort((a, b) => b.similarity - a.similarity).slice(0, 20)

  const totalParticipants = userIds.length
  const withLinkedIn = (users ?? []).filter((u) => u.linkedin_url).length
  const totalResponses = responses?.length ?? 0
  const maxPossible = totalParticipants * (questions?.length ?? 20)
  const completionRate = maxPossible > 0 ? Math.round((totalResponses / maxPossible) * 100) : 0

  return (
    <StatsCharts
      summary={{ totalParticipants, withLinkedIn, completionRate, totalResponses }}
      questionStats={questionStats}
      participationByDay={participationByDay}
      topCompanies={topCompanies}
      topPairs={topPairs}
    />
  )
}
