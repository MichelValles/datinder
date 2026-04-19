import { createClient } from '@supabase/supabase-js'
import { startQuiz } from './actions'

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const sp = await searchParams
  const quizSlug = typeof sp.quiz === 'string' ? sp.quiz : undefined

  let quizTitle: string | null = null

  if (quizSlug) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { data } = await supabase
      .from('quizzes')
      .select('title')
      .eq('slug', quizSlug)
      .eq('is_finalized', true)
      .maybeSingle()
    quizTitle = data?.title ?? null
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-[#163b4f] p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm">
        <div className="text-center mb-8">
          <img
            src="https://i.ibb.co/8gNrP0q6/Chat-GPT-Image-May-29-2025-08-27-01-PM.png"
            alt="DaTinder"
            className="h-24 w-auto mx-auto mb-5 object-contain"
          />
          {quizTitle ? (
            <>
              <h2 className="text-lg font-bold text-[#021f35]">{quizTitle}</h2>
              <p className="text-[#163b4f]/50 text-sm mt-1">
                Responde 20 preguntas y descubre quién piensa como tú
              </p>
            </>
          ) : (
            <p className="text-[#163b4f]/60 text-sm leading-relaxed">
              Responde 20 preguntas y descubre<br />quién piensa como tú
            </p>
          )}
        </div>

        <form action={startQuiz} className="flex flex-col gap-3">
          {quizSlug && <input type="hidden" name="quizId" value={quizSlug} />}
          <input
            type="text"
            name="name"
            placeholder="¿Cómo te llamas?"
            required
            maxLength={50}
            autoComplete="off"
            className="border-2 border-[#e8edf1] rounded-xl px-4 py-3.5 text-center text-base text-[#021f35] placeholder:text-[#163b4f]/40 focus:outline-none focus:border-[#163b4f] transition-colors"
          />
          <input
            type="text"
            name="empresa"
            placeholder="Empresa (opcional)"
            maxLength={100}
            autoComplete="organization"
            className="border-2 border-[#e8edf1] rounded-xl px-4 py-3.5 text-center text-base text-[#021f35] placeholder:text-[#163b4f]/30 focus:outline-none focus:border-[#163b4f] transition-colors"
          />
          <button
            type="submit"
            className="bg-[#edbe00] hover:bg-[#c9a100] text-[#021f35] font-bold py-4 rounded-xl text-base tracking-wide transition-colors mt-1"
          >
            Empezar el quiz →
          </button>
        </form>
      </div>
    </main>
  )
}
