'use client'

import { useActionState } from 'react'
import { loginAdmin } from '../actions'

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(loginAdmin, null)

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <div className="bg-white border border-[#d0d8e0] rounded-2xl p-8 w-full max-w-sm shadow-lg">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[#021f35]">Acceso Admin</h1>
          <p className="text-[#163b4f]/50 text-sm mt-1">
            Introduce la contraseña para continuar
          </p>
        </div>

        <form action={formAction} className="flex flex-col gap-4">
          <input
            type="password"
            name="password"
            placeholder="Contraseña"
            required
            autoFocus
            className="bg-[#f4f7f9] border border-[#d0d8e0] text-[#021f35] rounded-xl px-4 py-3 focus:outline-none focus:border-[#163b4f] transition-colors placeholder:text-[#163b4f]/30"
          />

          {state?.error && (
            <p className="text-red-500 text-sm text-center">{state.error}</p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="bg-[#edbe00] hover:bg-[#c9a100] disabled:opacity-50 text-[#021f35] font-bold py-3 rounded-xl transition-colors"
          >
            {pending ? 'Entrando...' : 'Entrar →'}
          </button>
        </form>
      </div>
    </div>
  )
}
