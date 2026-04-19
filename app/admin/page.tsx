import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import { createQuiz, logoutAdmin } from './actions'

export default async function AdminPage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data: quizzes } = await supabase
    .from('quizzes')
    .select('id, title, is_finalized, created_at')
    .order('created_at', { ascending: false })

  return (
    <main className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Panel de Admin</h1>
            <p className="text-gray-400 text-sm mt-0.5">DaTinder</p>
          </div>
          <form action={logoutAdmin}>
            <button className="text-gray-400 hover:text-white text-sm transition-colors">
              Cerrar sesión →
            </button>
          </form>
        </div>

        {/* Create Quiz */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Nuevo Quiz</h2>
          <form action={createQuiz} className="flex gap-3">
            <input
              type="text"
              name="title"
              placeholder="Título del quiz..."
              required
              maxLength={100}
              className="flex-1 bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-2.5 focus:outline-none focus:border-pink-500 transition-colors placeholder:text-gray-500 text-sm"
            />
            <button
              type="submit"
              className="bg-pink-600 hover:bg-pink-500 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm shrink-0"
            >
              + Crear
            </button>
          </form>
        </div>

        {/* Quiz list */}
        <div className="flex flex-col gap-3">
          {!quizzes?.length && (
            <p className="text-gray-500 text-center py-12">No hay quizzes aún.</p>
          )}

          {quizzes?.map(q => (
            <div
              key={q.id}
              className="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex items-center gap-4 hover:border-gray-700 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold truncate">{q.title}</span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      q.is_finalized
                        ? 'bg-green-900/50 text-green-400 border border-green-800'
                        : 'bg-yellow-900/50 text-yellow-400 border border-yellow-800'
                    }`}
                  >
                    {q.is_finalized ? 'Activo' : 'Borrador'}
                  </span>
                </div>
                <p className="text-gray-500 text-xs mt-1">
                  {new Date(q.created_at).toLocaleDateString('es-ES', {
                    day: 'numeric', month: 'short', year: 'numeric',
                  })}
                </p>
              </div>

              <Link
                href={`/admin/quiz/${q.id}`}
                className="bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors shrink-0"
              >
                Editar
              </Link>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
