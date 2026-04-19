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

  // Reuse existing quiz or create one with questions
  const { data: existing } = await supabase
    .from('quizzes')
    .select('id')
    .limit(1)
    .maybeSingle()

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

  const { data: user, error } = await supabase
    .from('users')
    .insert({ name })
    .select('id')
    .single()

  if (error || !user) throw new Error('No se pudo crear el usuario')

  redirect(`/quiz/${quizId}?userId=${user.id}`)
}
