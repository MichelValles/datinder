import { startQuiz } from './actions'

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-[#163b4f] p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm">
        <div className="text-center mb-8">
          <img
            src="https://i.ibb.co/8gNrP0q6/Chat-GPT-Image-May-29-2025-08-27-01-PM.png"
            alt="DaTinder"
            className="h-24 w-auto mx-auto mb-5 object-contain"
          />
          <p className="text-[#163b4f]/60 text-sm leading-relaxed">
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
            className="border-2 border-[#e8edf1] rounded-xl px-4 py-4 text-center text-base text-[#021f35] placeholder:text-[#163b4f]/40 focus:outline-none focus:border-[#163b4f] transition-colors"
          />
          <button
            type="submit"
            className="bg-[#edbe00] hover:bg-[#c9a100] text-[#021f35] font-bold py-4 rounded-xl text-base tracking-wide transition-colors"
          >
            Empezar el quiz →
          </button>
        </form>
      </div>
    </main>
  )
}
