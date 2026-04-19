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

export async function createQuiz(formData: FormData) {
  const title = (formData.get('title') as string)?.trim()
  if (!title) return

  const supabase = db()
  const { data: quiz, error } = await supabase
    .from('quizzes')
    .insert({ title })
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
    await db().from('quizzes').update({ title }).eq('id', quizId)
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
    const a = (formData.get(`qa_${i}`) as string) ?? ''
    const b = (formData.get(`qb_${i}`) as string) ?? ''
    if (id) {
      updates.push(
        supabase
          .from('questions')
          .update({ text_option_a: a, text_option_b: b })
          .eq('id', id)
      )
    }
  }

  await Promise.all(updates)
  revalidatePath(`/admin/quiz/${quizId}/questions`)
  return { success: true }
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
