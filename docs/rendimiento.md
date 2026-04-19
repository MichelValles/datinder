# Optimizaciones de rendimiento

## Consultas en paralelo (Promise.all)

Cambios aplicados para evitar waterfalls de DB innecesarios:

### `app/admin/quiz/[quizId]/page.tsx`
```ts
// Antes: quiz → (espera) → questions (secuencial, 2 round-trips)
// Ahora: ambas en paralelo
const [{ data: quiz }, { data: questions }] = await Promise.all([
  supabase.from('quizzes').select(...).eq('id', quizId).single(),
  supabase.from('questions').select('id').eq('quiz_id', quizId),
])
```

### `app/admin/quiz/[quizId]/participants/[userId]/page.tsx`
```ts
// myResponses y othersRaw no dependen entre sí → paralelo
const [{ data: myResponses }, { data: othersRaw }] = await Promise.all([
  supabase.from('responses').select(...).eq('user_id', userId).in('question_id', qIds),
  supabase.from('responses').select(...).in('question_id', qIds).neq('user_id', userId).limit(4000),
])
```

### `app/quiz/[quizId]/page.tsx`
```ts
// quiz y questions en paralelo (quizId disponible en ambas)
const [{ data: quiz }, { data: questions, error }] = await Promise.all([
  supabase.from('quizzes').select('title').eq('id', quizId).single(),
  supabase.from('questions').select(...).eq('quiz_id', quizId).order('order_num'),
])
```

---

## Límite en queries sin cota

### `othersRaw` en páginas de matches
Antes: sin límite → podía fetchear miles de filas con muchos participantes.

```ts
// Añadido .limit(4000) para evitar table scans ilimitados
supabase.from('responses')
  .select('user_id, question_id, answer, users(name, linkedin_url)')
  .in('question_id', qIds)
  .neq('user_id', userId)
  .limit(4000)
```

Afecta a:
- `app/results/[userId]/page.tsx`
- `app/admin/quiz/[quizId]/participants/[userId]/page.tsx`

---

## Singleton del cliente Supabase en Server Actions

```ts
// En lugar de llamar createClient() en cada función, se usa un helper:
function db() {
  return createClient(url, key)
}
```

Esto crea un cliente nuevo por llamada (correcto en contexto de servidor, evita compartir estado entre requests).

---

## Logo SVG — sin fondo

El logo `public/images/logo-yellow.svg` fue limpiado para eliminar el `<path>` de fondo blanco (`fill="rgb(254,254,251)"`). Ahora el SVG tiene fondo transparente y se adapta a cualquier color de fondo.

---

## Assets estáticos

- El logo está en `/public/images/` → servido directamente por Next.js/Vercel como archivo estático con cache headers óptimos
- No se usa `next/image` para el logo (es un SVG pequeño, no hay beneficio en optimización)

---

## Lo que NO se optimizó (y por qué)

| Aspecto | Motivo |
|---|---|
| `useCallback` en `handleAnswer` | Solo se pasa a `onClick` de botones nativos, no a componentes hijo. No hay beneficio. |
| `useMemo` en `progress` | Cálculo trivial (`current / length * 100`), el coste de memoizar supera el beneficio. |
| `next/dynamic` para QuestionsEditor | El componente es ~175 líneas. La ganancia de code-splitting sería mínima para uso admin. |
| `next/image` para el logo | SVG de ~2KB. No hay imágenes que optimizar (no JPEG/PNG grandes en la UI). |
| Paginación en lista de participantes | El admin sabe cuántos participantes tiene. Con < 500 es manejable sin paginación. |
