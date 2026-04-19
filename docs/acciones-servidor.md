# Server Actions y rutas API

Next.js App Router usa Server Actions para mutaciones. No hay API REST propia — todo pasa por estas funciones marcadas con `'use server'`.

---

## `app/actions.ts` — Acciones públicas

### `startQuiz(formData: FormData)`

Versión legacy con FormData y redirect server-side. Mantiene compatibilidad con formularios HTML nativos.

| Campo FormData | Tipo | Requerido | Descripción |
|---|---|---|---|
| `name` | string | Sí | Nombre del participante |
| `empresa` | string | No | Empresa |
| `linkedin_url` | string (URL) | No | URL del perfil de LinkedIn |
| `quizId` | string | No | Slug del quiz |

**Lógica:** Busca quiz → crea `users` → `redirect()` al quiz.

---

### `startQuizDirect(name, empresa, linkedin_url, quizSlug): Promise<string>`

Versión usada por `QuizEntryForm` (client component). Devuelve la URL en vez de redirigir, para que el cliente pueda guardar la identidad en localStorage antes de navegar.

| Parámetro | Tipo | Descripción |
|---|---|---|
| `name` | string | Nombre del participante |
| `empresa` | string \| null | Empresa |
| `linkedin_url` | string \| null | URL de LinkedIn |
| `quizSlug` | string \| null | Slug del quiz |

**Devuelve:** `/quiz/<quizId>?userId=<userId>` o `/` si no hay quiz disponible.

---

### `createLinkedInUser(name, quizSlug, providerToken): Promise<{ url: string; linkedin_url: string | null }>`

Crea un participante tras el login con LinkedIn SSO. Devuelve la URL de redirect **y** la linkedin_url obtenida, para que el callback page pueda guardar ambas en localStorage.

| Parámetro | Tipo | Descripción |
|---|---|---|
| `name` | string | Nombre extraído de `user_metadata.full_name` |
| `quizSlug` | string \| null | Slug del quiz |
| `providerToken` | string \| null | Access token de LinkedIn |

**Lógica:**
1. Intenta `GET https://api.linkedin.com/v2/me?projection=(id,vanityName)` con el token
2. Si tiene `vanityName` → `linkedin_url = 'https://linkedin.com/in/{vanityName}'`
3. Si falla → `linkedin_url = 'https://linkedin.com/search/results/people/?keywords={name}'`
4. Busca quiz por slug; si no existe devuelve `{ url: '/?quiz=<slug>', linkedin_url }`
5. Inserta en `users { name, linkedin_url }`
6. Devuelve `{ url: '/quiz/<quizId>?userId=<userId>', linkedin_url }`

---

## `app/actions-public.ts` — Acciones de consulta en tiempo real

Usadas por los componentes de polling (modo evento, sala de espera).

### `getParticipantCount(quizId): Promise<number>`

Devuelve el número de participantes únicos que han respondido al menos una pregunta del quiz.

### `getTopPairs(quizId): Promise<Array<{ nameA, nameB, similarity }>>`

Calcula las parejas más compatibles del quiz:
1. Obtiene todas las respuestas del quiz (máx. 8000 filas)
2. Construye un mapa de respuestas por usuario
3. Compara cada par de usuarios (máx. 50 usuarios para eficiencia)
4. Filtra pares con menos de 5 preguntas en común
5. Devuelve el top 5 ordenado por similitud descendente

---

## `app/admin/actions.ts` — Acciones de admin

### `loginAdmin(_, formData)`

Compara contraseña con `ADMIN_PASSWORD`. Si es correcta, establece cookie `admin_session` y redirige a `/admin`.

### `logoutAdmin()`

Borra la cookie `admin_session` y redirige a `/admin/login`.

### `createQuiz(formData)`

Crea un quiz nuevo con 20 filas vacías en `questions`.

| Campo FormData | Descripción |
|---|---|
| `title` | Nombre del quiz |

Genera un slug automático: `<titulo-normalizado>-<4-chars-random>`.

### `updateQuizSettings(quizId, formData)`

Actualiza título y slug de un quiz.

### `saveQuestions(quizId, formData)`

Guarda las ediciones del editor de preguntas. Procesa los campos `qt_N`, `qa_N`, `qb_N`, `qid_N` (N = 1 a 20) y hace `UPDATE` en paralelo con `Promise.all`.

### `autofillQuestions(quizId, level)`

Reemplaza las 20 preguntas del quiz con 20 elegidas aleatoriamente del banco de preguntas.

| Parámetro | Valores |
|---|---|
| `level` | `'easy'` \| `'medium'` \| `'hard'` |

Usa `pickRandom(QUESTION_BANK[level], 20)` — Fisher-Yates shuffle sobre el banco de 50 preguntas de esa categoría.

### `toggleFinalized(quizId, current)`

Cambia `is_finalized` al valor opuesto. Publica o despublica el quiz.

### `deleteQuiz(quizId)`

Elimina el quiz y en cascada sus preguntas y (dependiendo de FK constraints) sus respuestas.

### `clearParticipants(quizId)`

1. Obtiene los `question_id` del quiz
2. Obtiene todos los `user_id` que han respondido esas preguntas
3. Elimina esos usuarios de la tabla `users` (las respuestas se eliminan en cascada si hay FK con `ON DELETE CASCADE`, si no, quedan huérfanas)

### `deleteParticipant(userId, quizId)`

Elimina un usuario individual de `users`.

---

## Rutas de API

No hay rutas API propias (`app/api/`). Todo usa Server Actions.

La única excepción es el callback OAuth que es un **Page** (no una Route Handler):
- `app/auth/callback/page.tsx` — Client Component que maneja el intercambio PKCE en el navegador

---

## Convención de generación de slugs

```ts
function toSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')   // elimina acentos
    .replace(/[^a-z0-9]+/g, '-')       // caracteres especiales → guión
    .replace(/^-+|-+$/g, '')           // quita guiones al inicio/fin
}
// Resultado final: `${slug}-${random4chars}` para evitar colisiones
```

---

## Revalidación de caché

Todas las acciones que modifican datos llaman a `revalidatePath()` para que Next.js invalide el caché del Server Component correspondiente y la página se actualice:

| Acción | Paths revalidados |
|---|---|
| `createQuiz` | — (hace redirect directo) |
| `updateQuizSettings` | `/admin/quiz/[quizId]`, `/admin` |
| `saveQuestions` | `/admin/quiz/[quizId]/questions` |
| `autofillQuestions` | `/admin/quiz/[quizId]/questions` |
| `toggleFinalized` | `/admin`, `/admin/quiz/[quizId]` |
| `clearParticipants` | `/admin/quiz/[quizId]/participants`, `/admin/quiz/[quizId]` |
