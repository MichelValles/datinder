import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import QuizClient from './QuizClient'

export default async function QuizPage({
  params,
  searchParams,
}: {
  params: Promise<{ quizId: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { quizId } = await params
  const sp = await searchParams
  const userId = typeof sp.userId === 'string' ? sp.userId : undefined

  if (!userId) notFound()

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data: questions, error } = await supabase
    .from('questions')
    .select('id, order_num, question_text, text_option_a, text_option_b')
    .eq('quiz_id', quizId)
    .order('order_num')

  if (error || !questions?.length) notFound()

  return <QuizClient questions={questions} userId={userId} />
}
