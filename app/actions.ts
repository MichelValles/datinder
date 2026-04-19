'use server'

import { createClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

const QUESTIONS = [
  { order_num: 1,  text_option_a: 'Madrugador 🌅',           text_option_b: 'Noctámbulo 🌙' },
  { order_num: 2,  text_option_a: 'Ciudad 🏙️',               text_option_b: 'Naturaleza 🌿' },
  { order_num: 3,  text_option_a: 'Perros 🐶',               text_option_b: 'Gatos 🐱' },
  { order_num: 4,  text_option_a: 'Netflix en casa 🛋️',       text_option_b: 'Cine 🎬' },
  { order_num: 5,  text_option_a: 'Planificador 📋',          text_option_b: 'Espontáneo 🎲' },
  { order_num: 6,  text_option_a: 'Dulce 🍫',                text_option_b: 'Salado 🍟' },
  { order_num: 7,  text_option_a: 'Me recargo solo 🔋',       text_option_b: 'Me recargo en grupo 🎉' },
  { order_num: 8,  text_option_a: 'Verano ☀️',               text_option_b: 'Invierno ❄️' },
  { order_num: 9,  text_option_a: 'Acción / Aventura 💥',    text_option_b: 'Romance / Drama 💕' },
  { order_num: 10, text_option_a: 'Viajar ✈️',               text_option_b: 'Quedarse en casa 🏠' },
  { order_num: 11, text_option_a: 'Lógica 🧠',               text_option_b: 'Emoción ❤️' },
  { order_num: 12, text_option_a: 'Comida rápida 🍔',         text_option_b: 'Cocinar en casa 🍳' },
  { order_num: 13, text_option_a: 'Leer 📚',                 text_option_b: 'Ver series 📺' },
  { order_num: 14, text_option_a: 'Minimalista 🤍',          text_option_b: 'Coleccionista 🗂️' },
  { order_num: 15, text_option_a: 'Playa 🏖️',               text_option_b: 'Montaña 🏔️' },
  { order_num: 16, text_option_a: 'Mensajes ✉️',             text_option_b: 'Llamadas 📞' },
  { order_num: 17, text_option_a: 'Café ☕',                 text_option_b: 'Té 🍵' },
  { order_num: 18, text_option_a: 'Trabajar duro 💪',         text_option_b: 'Trabajar inteligente 🎯' },
  { order_num: 19, text_option_a: 'Ficción 🐉',              text_option_b: 'No ficción 📰' },
  { order_num: 20, text_option_a: 'Vivir el presente 🌸',    text_option_b: 'Planear el futuro 🚀' },
]

export async function startQuiz(formData: FormData) {
  const name = (formData.get('name') as string)?.trim()
  if (!name) return

  const supabase = db()

  const requestedSlug = (formData.get('quizId') as string) || null

  // Find the target quiz (by slug if provided, otherwise any finalized)
  const { data: existing } = requestedSlug
    ? await supabase.from('quizzes').select('id').eq('slug', requestedSlug).eq('is_finalized', true).maybeSingle()
    : await supabase.from('quizzes').select('id').eq('is_finalized', true).limit(1).maybeSingle()

  let quizId: string

  if (existing) {
    quizId = existing.id
  } else {
    const { data: quiz, error } = await supabase
      .from('quizzes')
      .insert({ title: 'DaTinder Quiz' })
      .select('id')
      .single()

    if (error || !quiz) throw new Error('No se pudo crear el quiz')
    quizId = quiz.id

    await supabase
      .from('questions')
      .insert(QUESTIONS.map(q => ({ ...q, quiz_id: quizId })))
  }

  const empresa = (formData.get('empresa') as string)?.trim() || null
  const linkedin_url = (formData.get('linkedin_url') as string)?.trim() || null

  const { data: user, error } = await supabase
    .from('users')
    .insert({ name, empresa, linkedin_url })
    .select('id')
    .single()

  if (error || !user) throw new Error('No se pudo crear el usuario')

  redirect(`/quiz/${quizId}?userId=${user.id}`)
}

export async function startQuizDirect(
  name: string,
  empresa: string | null,
  linkedin_url: string | null,
  quizSlug: string | null
): Promise<string> {
  if (!name?.trim()) return '/'
  const supabase = db()

  const { data: existing } = quizSlug
    ? await supabase.from('quizzes').select('id').eq('slug', quizSlug).eq('is_finalized', true).maybeSingle()
    : await supabase.from('quizzes').select('id').eq('is_finalized', true).limit(1).maybeSingle()

  if (!existing) return quizSlug ? `/?quiz=${quizSlug}` : '/'

  const { data: user, error } = await supabase
    .from('users')
    .insert({ name: name.trim(), empresa: empresa || null, linkedin_url: linkedin_url || null })
    .select('id')
    .single()

  if (error || !user) return '/'
  return `/quiz/${existing.id}?userId=${user.id}`
}

export async function createLinkedInUser(
  name: string,
  quizSlug: string | null,
  providerToken: string | null,
  avatarUrl: string | null = null
): Promise<{ url: string; linkedin_url: string | null }> {
  const supabase = db()

  // LinkedIn OIDC no expone vanityName con scopes estándar (openid+profile+email).
  // Usamos búsqueda por nombre como proxy útil.
  const linkedin_url: string | null = providerToken
    ? `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(name)}`
    : null

  let quizId: string | null = null
  if (quizSlug) {
    const { data: quiz } = await supabase
      .from('quizzes')
      .select('id')
      .eq('slug', quizSlug)
      .eq('is_finalized', true)
      .maybeSingle()
    quizId = quiz?.id ?? null
  }

  if (!quizId) return { url: quizSlug ? `/?quiz=${quizSlug}` : '/', linkedin_url }

  const { data: user, error } = await supabase
    .from('users')
    .insert({ name, linkedin_url, avatar_url: avatarUrl })
    .select('id')
    .single()

  if (error || !user) return { url: quizSlug ? `/?quiz=${quizSlug}` : '/', linkedin_url }

  return { url: `/quiz/${quizId}?userId=${user.id}`, linkedin_url }
}
