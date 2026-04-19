# Base de datos

Motor: **PostgreSQL** gestionado por Supabase.
Proyecto: `xvvqpdvakyptsjnoehrs`

---

## Tablas

### `quizzes`

Almacena los quizzes creados desde el panel de admin.

| Columna | Tipo | Nullable | Default | Descripción |
|---|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` | PK |
| `title` | `text` | NO | — | Nombre del quiz |
| `slug` | `text` | YES | — | Identificador URL amigable (ej: `mi-empresa-ab3f`). Generado automáticamente al crear/renombrar. |
| `is_finalized` | `boolean` | NO | `false` | `true` = publicado y accesible por participantes |
| `created_at` | `timestamptz` | NO | `now()` | Fecha de creación |

**Índices relevantes:** `slug` debería tener un índice único para evitar colisiones.

---

### `questions`

20 preguntas por quiz, formato A/B.

| Columna | Tipo | Nullable | Default | Descripción |
|---|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` | PK |
| `quiz_id` | `uuid` | NO | — | FK → `quizzes.id` |
| `order_num` | `integer` | NO | — | Posición (1–20) |
| `question_text` | `text` | YES | `''` | Texto de la pregunta (ej: "¿Playa o montaña?") |
| `text_option_a` | `text` | YES | `''` | Texto opción A |
| `text_option_b` | `text` | YES | `''` | Texto opción B |

---

### `users`

Participantes del quiz. Un usuario nuevo se crea cada vez que alguien entra a responder (no hay login persistente para usuarios normales, excepto con LinkedIn SSO).

| Columna | Tipo | Nullable | Default | Descripción |
|---|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` | PK |
| `name` | `text` | NO | — | Nombre introducido por el participante |
| `empresa` | `text` | YES | `null` | Empresa (opcional) |
| `linkedin_url` | `text` | YES | `null` | URL del perfil de LinkedIn (ej: `https://www.linkedin.com/in/michelvalles`). Añadida en migración manual. |
| `created_at` | `timestamptz` | NO | `now()` | Fecha de participación |

> La columna `linkedin_url` se añadió mediante:
> ```sql
> ALTER TABLE users ADD COLUMN IF NOT EXISTS linkedin_url TEXT;
> ```

---

### `responses`

Respuestas de cada participante a cada pregunta. `answer` es `0` (opción A) o `1` (opción B).

| Columna | Tipo | Nullable | Default | Descripción |
|---|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` | PK |
| `user_id` | `uuid` | NO | — | FK → `users.id` |
| `question_id` | `uuid` | NO | — | FK → `questions.id` |
| `answer` | `integer` | NO | — | `0` = opción A, `1` = opción B |

**Nota:** Al volver a una pregunta anterior en el quiz, la app hace un `UPDATE` en lugar de un `INSERT` si ya existía la respuesta para ese `(user_id, question_id)`.

---

## Relaciones

```
quizzes
  └── questions (quiz_id → quizzes.id)
        └── responses (question_id → questions.id)
              └── users (user_id → users.id)
```

---

## Migraciones aplicadas

| Fecha | SQL | Descripción |
|---|---|---|
| 2026-04-19 | `ALTER TABLE users ADD COLUMN IF NOT EXISTS linkedin_url TEXT` | Añade campo para perfil de LinkedIn |

---

## Cómo ejecutar migraciones

Opción 1 — Supabase Management API (con PAT):
```bash
curl -X POST "https://api.supabase.com/v1/projects/xvvqpdvakyptsjnoehrs/database/query" \
  -H "Authorization: Bearer sbp_..." \
  -H "Content-Type: application/json" \
  -d '{"query": "TU SQL AQUÍ"}'
```

Opción 2 — Supabase Studio:
1. Ir a https://supabase.com/dashboard/project/xvvqpdvakyptsjnoehrs
2. SQL Editor → New query → pegar el SQL → Run

---

## Row Level Security (RLS)

Actualmente la app usa la clave anónima (`NEXT_PUBLIC_SUPABASE_ANON_KEY`) para todas las operaciones. Las tablas son accesibles sin restricciones de usuario autenticado.

Si en el futuro se quiere proteger la escritura (ej: que solo el dueño de un quiz pueda editarlo), habría que:
1. Activar RLS en cada tabla
2. Definir policies según `auth.uid()`
3. Usar `SUPABASE_SERVICE_ROLE_KEY` (solo servidor) para las operaciones de admin

---

## Datos de escala estimada

| Tabla | Filas típicas por quiz | Límite práctico |
|---|---|---|
| `quizzes` | — | Ilimitado |
| `questions` | 20 por quiz | — |
| `users` | Variable (participantes) | Sin límite definido |
| `responses` | 20 × nº participantes | Query de matches limitada a 4.000 filas |

> La query de "otros" en la página de participante detail está limitada a `.limit(4000)` para evitar table scans ilimitados con muchos participantes.
