'use server'

import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'datinder2024'

// ── Auth ──────────────────────────────────────────────────────────────────────

export async function loginAdmin(_: unknown, formData: FormData) {
  const password = formData.get('password') as string
  if (password !== ADMIN_PASSWORD) return { error: 'Contraseña incorrecta' }

  const cookieStore = await cookies()
  cookieStore.set('admin_session', 'authenticated', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  })
  redirect('/admin')
}

export async function logoutAdmin() {
  const cookieStore = await cookies()
  cookieStore.delete('admin_session')
  redirect('/admin/login')
}

// ── Quizzes ───────────────────────────────────────────────────────────────────

function toSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export async function createQuiz(formData: FormData) {
  const title = (formData.get('title') as string)?.trim()
  if (!title) return

  const supabase = db()
  const baseSlug = toSlug(title)
  const slug = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`

  const { data: quiz, error } = await supabase
    .from('quizzes')
    .insert({ title, slug })
    .select('id')
    .single()

  if (error || !quiz) return

  await supabase.from('questions').insert(
    Array.from({ length: 20 }, (_, i) => ({
      quiz_id: quiz.id,
      order_num: i + 1,
      text_option_a: '',
      text_option_b: '',
    }))
  )

  redirect(`/admin/quiz/${quiz.id}`)
}

export async function updateQuizSettings(quizId: string, formData: FormData) {
  const title = (formData.get('title') as string)?.trim()
  if (title) {
    const baseSlug = toSlug(title)
    const slug = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`
    await db().from('quizzes').update({ title, slug }).eq('id', quizId)
  }
  revalidatePath(`/admin/quiz/${quizId}`)
  revalidatePath('/admin')
}

export async function saveQuestions(quizId: string, formData: FormData) {
  const supabase = db()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updates: PromiseLike<any>[] = []

  for (let i = 1; i <= 20; i++) {
    const id = formData.get(`qid_${i}`) as string
    const qt = (formData.get(`qt_${i}`) as string) ?? ''
    const a  = (formData.get(`qa_${i}`) as string) ?? ''
    const b  = (formData.get(`qb_${i}`) as string) ?? ''
    if (id) {
      updates.push(
        supabase
          .from('questions')
          .update({ question_text: qt, text_option_a: a, text_option_b: b })
          .eq('id', id)
      )
    }
  }

  await Promise.all(updates)
  revalidatePath(`/admin/quiz/${quizId}/questions`)
  return { success: true }
}

// ── Autofill ──────────────────────────────────────────────────────────────────

type QuestionPreset = { question_text: string; text_option_a: string; text_option_b: string }

const PRESETS: Record<'easy' | 'medium' | 'hard', QuestionPreset[]> = {
  easy: [
    { question_text: '¿Playa o montaña?',              text_option_a: 'Playa 🏖️',           text_option_b: 'Montaña 🏔️' },
    { question_text: '¿Pizza o hamburguesa?',           text_option_a: 'Pizza 🍕',             text_option_b: 'Hamburguesa 🍔' },
    { question_text: '¿Perros o gatos?',                text_option_a: 'Perros 🐶',            text_option_b: 'Gatos 🐱' },
    { question_text: '¿Verano o invierno?',             text_option_a: 'Verano ☀️',            text_option_b: 'Invierno ❄️' },
    { question_text: '¿Café o té?',                     text_option_a: 'Café ☕',              text_option_b: 'Té 🍵' },
    { question_text: '¿Netflix en casa o cine?',        text_option_a: 'Netflix en casa 🛋️',  text_option_b: 'Cine 🎬' },
    { question_text: '¿Madrugador o noctámbulo?',       text_option_a: 'Madrugador 🌅',        text_option_b: 'Noctámbulo 🌙' },
    { question_text: '¿Dulce o salado?',                text_option_a: 'Dulce 🍫',             text_option_b: 'Salado 🍟' },
    { question_text: '¿Ciudad o naturaleza?',           text_option_a: 'Ciudad 🏙️',           text_option_b: 'Naturaleza 🌿' },
    { question_text: '¿Libro o serie?',                 text_option_a: 'Libro 📚',             text_option_b: 'Serie 📺' },
    { question_text: '¿Música o silencio al trabajar?', text_option_a: 'Música 🎵',            text_option_b: 'Silencio 🤫' },
    { question_text: '¿WhatsApp o llamada?',            text_option_a: 'WhatsApp ✉️',          text_option_b: 'Llamada 📞' },
    { question_text: '¿Coche o transporte público?',    text_option_a: 'Coche 🚗',             text_option_b: 'Transporte público 🚇' },
    { question_text: '¿Cocinar o pedir comida?',        text_option_a: 'Cocinar 🍳',           text_option_b: 'Pedir comida 📦' },
    { question_text: '¿Ropa cómoda o elegante?',        text_option_a: 'Cómoda 👕',            text_option_b: 'Elegante 👔' },
    { question_text: '¿Quedarse en casa o salir?',      text_option_a: 'Quedarse en casa 🏠',  text_option_b: 'Salir 🎉' },
    { question_text: '¿Instagram o TikTok?',            text_option_a: 'Instagram 📸',         text_option_b: 'TikTok 🎵' },
    { question_text: '¿Hotel o apartamento?',           text_option_a: 'Hotel 🏨',             text_option_b: 'Apartamento 🏡' },
    { question_text: '¿Gym o deporte al aire libre?',   text_option_a: 'Gym 🏋️',              text_option_b: 'Aire libre 🌳' },
    { question_text: '¿Ahorrar o vivir el momento?',    text_option_a: 'Ahorrar 💰',           text_option_b: 'Vivir el momento 🎯' },
  ],
  medium: [
    { question_text: '¿Cuál sería tu superpoder?',            text_option_a: 'Volar ✈️',                       text_option_b: 'Ser invisible 👻' },
    { question_text: '¿Qué valoras más en una pareja?',       text_option_a: 'Pasión ❤️‍🔥',                      text_option_b: 'Estabilidad 🏡' },
    { question_text: '¿Cómo resuelves los conflictos?',       text_option_a: 'Hablo directo 💬',               text_option_b: 'Dejo pasar el tiempo ⏳' },
    { question_text: '¿Qué haces si te quedas sin batería?',  text_option_a: 'Busco cargador urgente 🔋',      text_option_b: 'Me desconecto y disfruto 🧘' },
    { question_text: '¿Qué tipo de viaje prefieres?',         text_option_a: 'Todo organizado 🗺️',             text_option_b: 'Totalmente improvisado 🎲' },
    { question_text: '¿Cómo te relajas de verdad?',           text_option_a: 'Solo/a en calma 😌',             text_option_b: 'Con gente y movimiento 🥳' },
    { question_text: '¿A qué miras más?',                     text_option_a: 'Al pasado con nostalgia 🕰️',    text_option_b: 'Al futuro con ilusión 🚀' },
    { question_text: 'Si ganas la lotería, ¿qué haces?',      text_option_a: 'Invierto y ahorro 📈',           text_option_b: 'Me doy un capricho 🛍️' },
    { question_text: '¿Qué rol tienes en un grupo?',          text_option_a: 'Propongo planes 💡',             text_option_b: 'Sigo la corriente 🌊' },
    { question_text: '¿Cómo afrontas los cambios?',           text_option_a: 'Me adapto fácil 🌀',             text_option_b: 'Prefiero la rutina 🔄' },
    { question_text: '¿Cuál es tu prioridad vital?',          text_option_a: 'Éxito profesional 💼',           text_option_b: 'Vida personal plena 🌸' },
    { question_text: 'En una conversación, ¿eres más...?',    text_option_a: 'El que escucha 👂',              text_option_b: 'El que habla 🗣️' },
    { question_text: '¿Qué te importa más de una ciudad?',    text_option_a: 'Oferta cultural 🎭',             text_option_b: 'Calidad de vida 🌿' },
    { question_text: '¿Qué prefieres tener?',                 text_option_a: 'Muchos conocidos 👥',            text_option_b: 'Pocos amigos íntimos 💞' },
    { question_text: '¿Cómo tomas decisiones importantes?',   text_option_a: 'Con la razón 🧠',               text_option_b: 'Con el corazón ❤️' },
    { question_text: '¿Qué prefieres en el trabajo?',         text_option_a: 'Autonomía total 🕊️',            text_option_b: 'Buen equipo 🤝' },
    { question_text: 'Si vivieras en otro siglo, ¿cuándo?',   text_option_a: 'En el pasado 🏰',               text_option_b: 'En el futuro 🤖' },
    { question_text: '¿Cómo aprendes algo nuevo?',            text_option_a: 'Leyendo e investigando 📖',      text_option_b: 'Probando y equivocándome 🔧' },
    { question_text: '¿Qué te genera más estrés?',            text_option_a: 'El caos y el desorden 🌪️',      text_option_b: 'La monotonía y el aburrimiento 😴' },
    { question_text: '¿Con qué frase te identificas?',        text_option_a: '«Menos es más» 🤍',              text_option_b: '«Más es más» 🎨' },
  ],
  hard: [
    { question_text: 'Si te dieran 1M€, ¿qué harías primero?',              text_option_a: 'Mataría a alguien y pagaría la multa 🔫',  text_option_b: 'Compraría un piso en Madrid 🏠' },
    { question_text: 'Si supieras que no te pillan, ¿qué harías?',          text_option_a: 'Robar en un banco 🏦',                     text_option_b: 'Hacer trampa en los impuestos 📊' },
    { question_text: '¿Qué preferirías saber?',                             text_option_a: 'La fecha exacta de tu muerte 💀',          text_option_b: 'La forma en que vas a morir ⚰️' },
    { question_text: '¿Qué poder escogerías aunque tenga consecuencias?',   text_option_a: 'Leer la mente de todos 🧠',                text_option_b: 'Ver el futuro sin poder cambiarlo 🔮' },
    { question_text: 'Si reseteas tu vida, ¿qué cambiarías?',               text_option_a: 'Tu personalidad entera 🎭',               text_option_b: 'Todas tus relaciones actuales 💔' },
    { question_text: '¿Qué dilema escogerías?',                             text_option_a: 'Ser famoso pero odiado 📺',               text_option_b: 'Ser anónimo pero muy querido 🤗' },
    { question_text: '¿A qué renunciarías por el éxito?',                   text_option_a: 'A tus amistades actuales 👋',             text_option_b: 'A diez años de tu vida ⏰' },
    { question_text: '¿Qué prefieres que digan de ti al morir?',            text_option_a: '«Era muy bueno pero aburrido» 😴',        text_option_b: '«Era un caos pero apasionante» 🔥' },
    { question_text: 'Si pudieras borrar un recuerdo, ¿cuál?',              text_option_a: 'El más doloroso 😭',                      text_option_b: 'El más feliz, para revivirlo 😊' },
    { question_text: '¿Cuál sería tu mayor traición posible?',              text_option_a: 'Traicionar a un amigo por dinero 💰',     text_option_b: 'Mentir a tu pareja para protegerla 🤥' },
    { question_text: 'Si vivieras solo 200 años o mueres a los 60...',      text_option_a: 'Vivir 200 años completamente solo 👴',    text_option_b: 'Morir a los 60 muy acompañado 🫂' },
    { question_text: 'Para tener poder, ¿a qué precio?',                    text_option_a: 'Perder tu memoria de infancia 👶',        text_option_b: 'Perder la capacidad de amar ❤️' },
    { question_text: '¿Cuál es el mayor tabú que romperías?',               text_option_a: 'Hablar de dinero en público 💵',          text_option_b: 'Decir tu opinión real sobre todo 🗣️' },
    { question_text: 'Si solo puedes salvar a uno, ¿a quién?',              text_option_a: 'A tu mejor amigo 👫',                     text_option_b: 'A un extraño que salvará 100 vidas 🦸' },
    { question_text: '¿Qué descubrirías si pudieras?',                      text_option_a: 'Si tu pareja te ha sido infiel alguna vez 👀', text_option_b: 'Lo que piensan de ti tus amigos de verdad 💭' },
    { question_text: 'Si el mundo acaba mañana, ¿qué haces?',               text_option_a: 'Se lo cuento a todo el mundo 📢',         text_option_b: 'Disfruto el último día en secreto 🎉' },
    { question_text: '¿Qué preferirías mientras duermes?',                  text_option_a: 'Ver tu futuro en sueños 🌙',              text_option_b: 'Revivir tus mejores momentos 💭' },
    { question_text: '¿Qué harías si descubres que eres adoptado?',         text_option_a: 'Buscar a mis padres biológicos 🔍',       text_option_b: 'No cambiaría nada, es mi familia 🏡' },
    { question_text: '¿Cuál es el peor final posible para ti?',             text_option_a: 'Morir sin haber amado de verdad 💔',      text_option_b: 'Haber amado y perderlo todo ❤️‍🩹' },
    { question_text: 'Si pudieras vivir solo una experiencia más, ¿cuál?',  text_option_a: 'El mejor momento ya vivido 🌟',           text_option_b: 'Un futuro que aún no has vivido 🌈' },
  ],
}

export async function autofillQuestions(quizId: string, level: 'easy' | 'medium' | 'hard') {
  const supabase = db()
  const presets = PRESETS[level]

  const { data: existing } = await supabase
    .from('questions')
    .select('id, order_num')
    .eq('quiz_id', quizId)
    .order('order_num')

  if (!existing?.length) return

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updates: PromiseLike<any>[] = existing.map((q, i) => {
    const p = presets[i]
    if (!p) return Promise.resolve()
    return supabase
      .from('questions')
      .update({ question_text: p.question_text, text_option_a: p.text_option_a, text_option_b: p.text_option_b })
      .eq('id', q.id)
  })

  await Promise.all(updates)
  revalidatePath(`/admin/quiz/${quizId}/questions`)
}

export async function toggleFinalized(quizId: string, current: boolean) {
  await db().from('quizzes').update({ is_finalized: !current }).eq('id', quizId)
  revalidatePath('/admin')
  revalidatePath(`/admin/quiz/${quizId}`)
}

export async function deleteQuiz(quizId: string) {
  await db().from('quizzes').delete().eq('id', quizId)
  revalidatePath('/admin')
  redirect('/admin')
}

// ── Participants ──────────────────────────────────────────────────────────────

export async function clearParticipants(quizId: string) {
  const supabase = db()

  const { data: questions } = await supabase
    .from('questions')
    .select('id')
    .eq('quiz_id', quizId)

  if (!questions?.length) {
    revalidatePath(`/admin/quiz/${quizId}/participants`)
    return
  }

  const qIds = questions.map((q) => q.id)

  const { data: responses } = await supabase
    .from('responses')
    .select('user_id')
    .in('question_id', qIds)

  const userIds = [...new Set(responses?.map((r) => r.user_id) ?? [])]

  if (userIds.length) {
    await supabase.from('users').delete().in('id', userIds)
  }

  revalidatePath(`/admin/quiz/${quizId}/participants`)
  revalidatePath(`/admin/quiz/${quizId}`)
  redirect(`/admin/quiz/${quizId}/participants`)
}

export async function deleteParticipant(userId: string, quizId: string) {
  await db().from('users').delete().eq('id', userId)
  revalidatePath(`/admin/quiz/${quizId}/participants`)
}
