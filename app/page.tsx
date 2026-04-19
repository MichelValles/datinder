import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import QuizEntryForm from '@/components/QuizEntryForm'

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const sp = await searchParams
  const quizSlug = typeof sp.quiz === 'string' ? sp.quiz : undefined

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  if (!quizSlug) {
    const { data: quizzes } = await supabase
      .from('quizzes')
      .select('id, title, slug, created_at')
      .eq('is_finalized', true)
      .order('created_at', { ascending: false })

    return (
      <main className="min-h-screen bg-[#163b4f] flex flex-col items-center justify-start sm:justify-center p-4 pt-10 sm:pt-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-3">
              <img src="/images/logo-yellow.svg" alt="DaTinder" className="h-12 w-auto" />
              <span className="text-white font-bold text-3xl tracking-tight">datinder</span>
            </div>
            <p className="text-white/60 text-sm">
              Elige un quiz para descubrir quién piensa como tú
            </p>
          </div>

          {!quizzes?.length ? (
            <div className="bg-white/10 rounded-2xl p-8 text-center">
              <p className="text-white/50 text-sm">No hay quizzes disponibles aún.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {quizzes.map((q) => (
                <Link
                  key={q.id}
                  href={`/?quiz=${q.slug ?? q.id}`}
                  className="bg-white rounded-2xl px-6 py-4 flex items-center justify-between gap-4 hover:bg-[#f4f7f9] transition-colors shadow-sm group"
                >
                  <span className="font-bold text-[#021f35] truncate">{q.title}</span>
                  <span className="text-[#edbe00] font-bold text-lg shrink-0 group-hover:translate-x-0.5 transition-transform">
                    →
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    )
  }

  const { data } = await supabase
    .from('quizzes')
    .select('title')
    .eq('slug', quizSlug)
    .eq('is_finalized', true)
    .maybeSingle()
  const quizTitle = data?.title ?? null

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-[#163b4f] p-4 pb-24">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm mb-16">
        <div className="flex items-center justify-center gap-2.5 mb-7">
          <img src="/images/logo-yellow.svg" alt="DaTinder" className="h-10 w-auto" />
          <span className="text-[#021f35] font-bold text-2xl tracking-tight">datinder</span>
        </div>
        <QuizEntryForm quizSlug={quizSlug} quizTitle={quizTitle} />
      </div>
    </main>
  )
}
