# Banco de preguntas

## Fichero

`lib/question-bank.ts`

Contiene 50 preguntas por cada una de las 3 categorías (150 preguntas en total) y la función de selección aleatoria.

---

## Estructura de una pregunta

```ts
type QuestionPreset = {
  question_text: string   // ej: "¿Playa o montaña?"
  text_option_a: string   // ej: "Playa 🏖️"
  text_option_b: string   // ej: "Montaña 🏔️"
}
```

---

## Categorías

### 😊 Easy (fácil)
Preferencias de estilo de vida sin carga emocional. Ejemplos:
- ¿Playa o montaña? / ¿Café o té? / ¿Perros o gatos?
- ¿Madrugador o noctámbulo? / ¿Gym o deporte al aire libre?

**Objetivo:** Alta participación, preguntas ligeras para grupos de empresa o eventos.

### 🤔 Medium (medio)
Valores personales y forma de ser. Ejemplos:
- ¿Qué valoras más en una pareja? Pasión / Estabilidad
- ¿Cómo tomas decisiones importantes? Con la razón / Con el corazón
- ¿Qué te motiva más? Reconocimiento externo / Satisfacción personal

**Objetivo:** Matching más revelador, conocer cómo piensa la gente de verdad.

### 🔥 Hard (difícil)
Dilemas éticos y preguntas provocadoras. Ejemplos:
- Si supieras que no te pillan, ¿qué harías?
- ¿A qué renunciarías por el éxito?
- ¿Cuál sería tu mayor traición posible?

**Objetivo:** Debates profundos, grupos que se conocen bien o quieren romperse el hielo de verdad.

---

## Función `pickRandom`

```ts
export function pickRandom(bank: QuestionPreset[], n: number): QuestionPreset[]
```

Implementa el algoritmo **Fisher-Yates shuffle** sobre una copia del array y devuelve los primeros `n` elementos. Esto garantiza:
- Distribución uniforme (cada pregunta tiene la misma probabilidad de ser seleccionada)
- Sin repeticiones en la misma sesión de autofill
- El banco original no se modifica

```ts
function pickRandom<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled.slice(0, n)
}
```

---

## Cómo se usa

En `app/admin/actions.ts`, la función `autofillQuestions`:
```ts
import { QUESTION_BANK, pickRandom } from '@/lib/question-bank'

const presets = pickRandom(QUESTION_BANK[level], 20)
// Actualiza las 20 preguntas del quiz con estas 20 seleccionadas aleatoriamente
```

Cada vez que el admin pulsa "😊 Fácil", "🤔 Medio" o "🔥 Difícil", obtiene una combinación diferente de 20 preguntas del banco de 50. Esto evita que todos los quizzes del mismo nivel sean idénticos.

---

## Por qué un fichero separado

Antes, los `PRESETS` estaban hardcodeados directamente en `app/admin/actions.ts`. Se movieron a `lib/question-bank.ts` por:

1. **Sin tokens:** No hay llamada a ninguna IA. Las preguntas están pre-generadas.
2. **Fácil de editar:** Un solo fichero con todas las preguntas, bien organizado.
3. **Variedad:** 50 preguntas por nivel permiten seleccionar 20 aleatorias en cada autofill.
4. **Reutilizable:** El banco puede importarse desde cualquier parte de la app.

---

## Cómo añadir preguntas

Edita `lib/question-bank.ts` y añade objetos al array de la categoría correspondiente:

```ts
// En QUESTION_BANK.easy, por ejemplo:
{ question_text: '¿Tu nueva pregunta?', text_option_a: 'Opción A 🎯', text_option_b: 'Opción B 🌀' },
```

No hay límite de preguntas por categoría. La función `pickRandom` siempre seleccionará 20 independientemente del tamaño del banco.
