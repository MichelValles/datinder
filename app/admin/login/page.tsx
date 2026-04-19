'use client'

import { useActionState } from 'react'
import { loginAdmin } from '../actions'

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(loginAdmin, null)

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-950 p-4">
      <div className="bg-gray-900 rounded-2xl p-8 w-full max-w-sm shadow-xl border border-gray-800">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🔐</div>
          <h1 className="text-2xl font-bold text-white">Admin</h1>
          <p className="text-gray-400 text-sm mt-1">DaTinder Panel</p>
        </div>

        <form action={formAction} className="flex flex-col gap-4">
          <input
            type="password"
            name="password"
            placeholder="Contraseña"
            required
            autoFocus
            className="bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-pink-500 transition-colors placeholder:text-gray-500"
          />

          {state?.error && (
            <p className="text-red-400 text-sm text-center">{state.error}</p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="bg-pink-600 hover:bg-pink-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors"
          >
            {pending ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </main>
  )
}
