import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import { headers } from 'next/headers'
import LiveScreen from './LiveScreen'

export default async function LivePage({
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
    .select('title, slug, is_finalized')
    .eq('id', quizId)
    .single()

  if (!quiz) notFound()

  const h = await headers()
  const host = h.get('host') ?? 'datinder.fun'
  const proto = host.startsWith('localhost') ? 'http' : 'https'
  const quizUrl = `${proto}://${host}/?quiz=${quiz.slug ?? quizId}`

  return <LiveScreen quizId={quizId} quizTitle={quiz.title} quizUrl={quizUrl} />
}
