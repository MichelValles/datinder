import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import QuestionsEditor from './QuestionsEditor'

export default async function QuestionsPage({
  params,
}: {
  params: Promise<{ quizId: string }>
}) {
  const { quizId } = await params

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data: questions, error } = await supabase
    .from('questions')
    .select('id, order_num, question_text, text_option_a, text_option_b')
    .eq('quiz_id', quizId)
    .order('order_num')

  if (error || !questions) notFound()

  return <QuestionsEditor questions={questions} quizId={quizId} />
}
