import { startQuiz } from './actions'

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-pink-500 to-red-500 p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-6xl mb-3">💘</div>
          <h1 className="text-4xl font-bold text-gray-800">DaTinder</h1>
          <p className="text-gray-400 text-sm mt-2 leading-relaxed">
            Responde 20 preguntas y descubre<br />quién piensa como tú
          </p>
        </div>

        <form action={startQuiz} className="flex flex-col gap-4">
          <input
            type="text"
            name="name"
            placeholder="¿Cómo te llamas?"
            required
            maxLength={50}
            autoComplete="off"
            className="border-2 border-gray-100 rounded-2xl px-4 py-4 text-center text-lg focus:outline-none focus:border-pink-400 transition-colors"
          />
          <button
            type="submit"
            className="bg-gradient-to-r from-pink-500 to-red-500 text-white font-bold py-4 rounded-2xl text-lg hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-pink-200"
          >
            Empezar el quiz 🚀
          </button>
        </form>
      </div>
    </main>
  )
}
