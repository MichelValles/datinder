import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import { headers } from 'next/headers'
import { createQuiz, logoutAdmin } from './actions'

export default async function AdminPage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const h = await headers()
  const host = h.get('host') ?? 'datinder.fun'
  const proto = host.startsWith('localhost') ? 'http' : 'https'

  const { data: quizzes } = await supabase
    .from('quizzes')
    .select('id, title, slug, is_finalized, created_at')
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">

      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-[#021f35]">Mis quizzes</h1>
        <form action={logoutAdmin}>
          <button className="text-[#163b4f]/50 hover:text-[#163b4f] text-sm font-medium transition-colors">
            Cerrar sesión →
          </button>
        </form>
      </div>

      <div className="bg-white border border-[#d0d8e0] rounded-2xl p-6 mb-6">
        <h2 className="text-xs font-bold text-[#163b4f] uppercase tracking-widest mb-4">
          Nuevo Quiz
        </h2>
        <form action={createQuiz} className="flex gap-3">
          <input
            type="text"
            name="title"
            placeholder="Título del quiz..."
            required
            maxLength={100}
            className="flex-1 bg-[#f4f7f9] border border-[#d0d8e0] text-[#021f35] rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#163b4f] transition-colors placeholder:text-[#163b4f]/30 text-sm"
          />
          <button
            type="submit"
            className="bg-[#edbe00] hover:bg-[#c9a100] text-[#021f35] font-bold px-5 py-2.5 rounded-xl transition-colors text-sm shrink-0"
          >
            + Crear
          </button>
        </form>
      </div>

      <div className="flex flex-col gap-3">
        {!quizzes?.length && (
          <p className="text-[#163b4f]/40 text-center py-12">No hay quizzes aún.</p>
        )}

        {quizzes?.map(q => (
          <div
            key={q.id}
            className="bg-white border border-[#d0d8e0] rounded-2xl p-5 flex items-center gap-4 hover:border-[#163b4f]/30 transition-colors"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-[#021f35] truncate">{q.title}</span>
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                  q.is_finalized
                    ? 'bg-green-100 text-green-700 border border-green-200'
                    : 'bg-amber-100 text-amber-700 border border-amber-200'
                }`}>
                  {q.is_finalized ? 'Activo' : 'Borrador'}
                </span>
              </div>
              <p className="text-[#163b4f]/40 text-xs mt-1">
                {new Date(q.created_at).toLocaleDateString('es-ES', {
                  day: 'numeric', month: 'short', year: 'numeric',
                })}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {q.is_finalized && (
                <a
                  href={`${proto}://${host}/?quiz=${q.slug ?? q.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Abrir quiz"
                  className="bg-[#edbe00] hover:bg-[#c9a100] text-[#021f35] text-sm font-bold px-3 py-2 rounded-xl transition-colors"
                >
                  ↗
                </a>
              )}
              <Link
                href={`/admin/quiz/${q.id}`}
                className="bg-[#163b4f] hover:bg-[#1e4d67] text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
              >
                Editar
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
