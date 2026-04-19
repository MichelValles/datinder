'use server'

import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { QUESTION_BANK, pickRandom } from '@/lib/question-bank'

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

export async function autofillQuestions(quizId: string, level: 'easy' | 'medium' | 'hard') {
  const supabase = db()
  const presets = pickRandom(QUESTION_BANK[level], 20)

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
