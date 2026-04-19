import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import TabNav from './TabNav'

export default async function QuizLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ quizId: string }>
}) {
  const { quizId } = await params

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data: quiz } = await supabase
    .from('quizzes')
    .select('id, title, is_finalized')
    .eq('id', quizId)
    .single()

  if (!quiz) notFound()

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="border-b border-gray-800 bg-gray-900/60">
        <div className="max-w-4xl mx-auto px-6 pt-6 pb-0">
          <div className="flex items-center gap-2 text-sm mb-3">
            <Link href="/admin" className="text-gray-400 hover:text-white transition-colors">
              Admin
            </Link>
            <span className="text-gray-700">/</span>
            <span className="text-gray-200 font-medium truncate max-w-xs">{quiz.title}</span>
            <span
              className={`ml-1 text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${
                quiz.is_finalized
                  ? 'bg-green-900/60 text-green-400 border border-green-800'
                  : 'bg-yellow-900/60 text-yellow-400 border border-yellow-800'
              }`}
            >
              {quiz.is_finalized ? 'Activo' : 'Borrador'}
            </span>
          </div>

          <TabNav quizId={quizId} />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-6">
        {children}
      </div>
    </div>
  )
}
