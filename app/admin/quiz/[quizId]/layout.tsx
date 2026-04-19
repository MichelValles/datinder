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
    <div className="min-h-[calc(100vh-4rem)]">
      <div className="bg-white border-b border-[#d0d8e0]">
        <div className="max-w-4xl mx-auto px-6 pt-5 pb-0">
          <div className="flex items-center gap-2 text-sm mb-3">
            <Link
              href="/admin"
              className="text-[#163b4f]/50 hover:text-[#163b4f] transition-colors font-medium"
            >
              Admin
            </Link>
            <span className="text-[#163b4f]/25">/</span>
            <span className="text-[#021f35] font-semibold truncate max-w-xs">{quiz.title}</span>
            <span className={`ml-1 text-xs px-2.5 py-0.5 rounded-full font-semibold shrink-0 ${
              quiz.is_finalized
                ? 'bg-green-100 text-green-700 border border-green-200'
                : 'bg-amber-100 text-amber-700 border border-amber-200'
            }`}>
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
