'use server'

import { createClient } from '@supabase/supabase-js'

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export async function getParticipantCount(quizId: string): Promise<number> {
  const supabase = db()
  const { data: questions } = await supabase
    .from('questions')
    .select('id')
    .eq('quiz_id', quizId)
  const qIds = questions?.map(q => q.id) ?? []
  if (!qIds.length) return 0
  const { data } = await supabase
    .from('responses')
    .select('user_id')
    .in('question_id', qIds)
  return new Set(data?.map(r => r.user_id) ?? []).size
}

export async function getTopPairs(quizId: string): Promise<Array<{
  nameA: string
  nameB: string
  similarity: number
}>> {
  const supabase = db()
  const { data: questions } = await supabase
    .from('questions')
    .select('id')
    .eq('quiz_id', quizId)
  const qIds = questions?.map(q => q.id) ?? []
  if (!qIds.length) return []

  const { data: responses } = await supabase
    .from('responses')
    .select('user_id, question_id, answer, users(name)')
    .in('question_id', qIds)
    .limit(8000)

  if (!responses?.length) return []

  type Row = { user_id: string; question_id: string; answer: number; users: { name: string } | { name: string }[] | null }

  // Build per-user answer maps
  const userAnswers = new Map<string, Map<string, number>>()
  const userNames = new Map<string, string>()
  for (const row of responses as Row[]) {
    if (!userAnswers.has(row.user_id)) userAnswers.set(row.user_id, new Map())
    userAnswers.get(row.user_id)!.set(row.question_id, row.answer)
    const u = Array.isArray(row.users) ? row.users[0] : row.users
    if (u && !userNames.has(row.user_id)) userNames.set(row.user_id, u.name)
  }

  const users = Array.from(userAnswers.keys())
  const pairs: Array<{ nameA: string; nameB: string; similarity: number }> = []

  for (let i = 0; i < Math.min(users.length, 50); i++) {
    for (let j = i + 1; j < Math.min(users.length, 50); j++) {
      const a = userAnswers.get(users[i])!
      const b = userAnswers.get(users[j])!
      let matches = 0, total = 0
      for (const [qId, ans] of a) {
        if (b.has(qId)) {
          total++
          if (b.get(qId) === ans) matches++
        }
      }
      if (total < 5) continue
      pairs.push({
        nameA: userNames.get(users[i]) ?? 'Anónimo',
        nameB: userNames.get(users[j]) ?? 'Anónimo',
        similarity: Math.round((matches / total) * 100),
      })
    }
  }

  return pairs.sort((a, b) => b.similarity - a.similarity).slice(0, 5)
}
