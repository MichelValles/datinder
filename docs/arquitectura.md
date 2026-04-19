# Arquitectura de la aplicación

## Estructura de directorios

```
datinder/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout (html, body, fuentes)
│   ├── page.tsx                  # Directorio de quizzes o entrada a uno (server)
│   ├── actions.ts                # Server actions públicas (startQuiz, startQuizDirect, createLinkedInUser)
│   ├── actions-public.ts         # Server actions de consulta en tiempo real (getParticipantCount, getTopPairs)
│   │
│   ├── quiz/[quizId]/
│   │   ├── page.tsx              # Carga preguntas + título del quiz (server)
│   │   ├── QuizClient.tsx        # Componente interactivo de preguntas (client)
│   │   ├── waiting/
│   │   │   └── page.tsx          # Sala de espera tras terminar el quiz (client, polling participantes)
│   │   └── live/
│   │       ├── page.tsx          # Modo evento — carga quiz data (server)
│   │       └── LiveScreen.tsx    # Pantalla proyectable: QR + contador + top matches (client, polling)
│   │
│   ├── results/[userId]/
│   │   ├── page.tsx              # Ranking de matches (server + LiveRefresher)
│   │   └── ShareButton.tsx       # Botón compartir resultados (client, Web Share API)
│   │
│   ├── auth/
│   │   └── callback/
│   │       └── page.tsx          # Callback OAuth LinkedIn (client, guarda identity en localStorage)
│   │
│   └── admin/
│       ├── layout.tsx            # Layout admin: header con logo + "Ver sitio público"
│       ├── page.tsx              # Dashboard: lista de quizzes + crear nuevo
│       ├── actions.ts            # Server actions de admin (CRUD quizzes, autofill, auth)
│       ├── login/
│       │   └── page.tsx          # Login admin (formulario contraseña)
│       ├── components/
│       │   └── ConfirmForm.tsx   # Wrapper de formulario con confirm dialog
│       └── quiz/[quizId]/
│           ├── layout.tsx        # Layout de quiz: breadcrumb + TabNav
│           ├── page.tsx          # Pestaña "Configuración": stats, URL, QR, modo evento
│           ├── TabNav.tsx        # Navegación entre pestañas
│           ├── QuizUrlBar.tsx    # Barra con URL del quiz + botón copiar
│           ├── questions/
│           │   ├── page.tsx      # Carga preguntas del quiz (server)
│           │   └── QuestionsEditor.tsx  # Editor de preguntas + autofill (client)
│           └── participants/
│               ├── page.tsx      # Lista de participantes
│               └── [userId]/
│                   └── page.tsx  # Detalle de participante: respuestas + ranking + LinkedIn
│
├── components/
│   ├── LinkedInLoginButton.tsx   # Botón OAuth LinkedIn (client)
│   ├── QuizEntryForm.tsx         # Formulario de entrada con identidad persistente (client)
│   ├── QRCode.tsx                # Wrapper de qrcode.react (client)
│   ├── LiveRefresher.tsx         # Llama router.refresh() en intervalo (client, invisible)
│   └── LocalDate.tsx             # Formatea fecha en timezone del navegador (client)
│
├── lib/
│   └── question-bank.ts          # Banco de 50 preguntas por categoría + pickRandom()
│
├── public/
│   └── images/
│       └── logo-yellow.svg       # Logo de datinder (llama amarilla, fondo transparente)
│
├── docs/                         # Esta documentación
├── .env.local                    # Variables de entorno locales (no en git)
├── next.config.ts                # Configuración de Next.js
└── package.json
```

---

## Rutas públicas

| Ruta | Tipo | Descripción |
|---|---|---|
| `/` | Server + Client | Sin `?quiz=`: directorio de quizzes publicados. Con `?quiz=<slug>`: formulario de entrada con identidad persistente. |
| `/quiz/[quizId]?userId=<id>` | Server + Client | Flujo de preguntas. Al terminar redirige a `/waiting`. |
| `/quiz/[quizId]/waiting?userId=<id>` | Client | Sala de espera post-quiz: contador de participantes en vivo. |
| `/quiz/[quizId]/live` | Server + Client | Modo evento proyectable: QR, contador, top matches en tiempo real. |
| `/results/[userId]` | Server + Client | Ranking de matches. Se refresca automáticamente cada 15s. |
| `/auth/callback?quiz=<slug>&code=<code>` | Client | Callback OAuth LinkedIn. Guarda identidad en localStorage. |

---

## Rutas de admin

| Ruta | Tipo | Descripción |
|---|---|---|
| `/admin/login` | Server Component | Formulario de login con contraseña. |
| `/admin` | Server Component | Dashboard: lista de quizzes + formulario de creación. |
| `/admin/quiz/[quizId]` | Server Component | Configuración: título, publicación, QR del quiz, botón modo evento. |
| `/admin/quiz/[quizId]/questions` | Server + Client | Editor de preguntas: edición manual + autofill. |
| `/admin/quiz/[quizId]/participants` | Server Component | Lista de participantes con fechas en timezone local. |
| `/admin/quiz/[quizId]/participants/[userId]` | Server Component | Detalle: respuestas + ranking + enlace LinkedIn si disponible. |

---

## Patrón Server / Client

La app sigue el patrón estándar del App Router de Next.js:

- **Server Components** (por defecto): fetching de datos, render inicial, sin interactividad
- **Client Components** (`'use client'`): formularios con estado, OAuth, polling, interacciones

```
page.tsx (server) → fetcha datos → pasa como props a → Component.tsx (client)
```

---

## Supabase client — patrón usado

No se usa `@supabase/ssr`. Se usa `@supabase/supabase-js` directamente con la `anon key`.

**En Server Components y Server Actions:** se crea el cliente dentro de la función:
```ts
function db() {
  return createClient(url, key)
}
```

**En Client Components:** singleton a nivel de módulo (correcto en el navegador):
```ts
const supabase = createClient(url, key)
```

---

## Tiempo real — estrategia de polling

No se usa Supabase Realtime WebSocket. En su lugar, se usa **polling vía Server Actions** cada N segundos:

| Componente | Intervalo | Acción |
|---|---|---|
| `LiveScreen` (modo evento) | 8s | `getParticipantCount` + `getTopPairs` |
| `WaitingPage` (sala de espera) | 5s | `getParticipantCount` |
| `LiveRefresher` (resultados) | 15s | `router.refresh()` (re-render server component) |

---

## Identidad persistente de participantes

La identidad del participante (nombre, empresa, linkedin_url, flag isLinkedIn) se guarda en `localStorage` bajo la clave `datinder_identity` al identificarse por primera vez. Las siguientes visitas muestran un "quick start" sin necesidad de rellenar el formulario.

```ts
type Identity = {
  name: string
  empresa: string | null
  linkedin_url: string | null
  isLinkedIn: boolean
}
```

---

## Flujo de datos — quiz público

```
1. Usuario abre /?quiz=<slug>
   └── QuizEntryForm verifica localStorage
       ├── Sin identidad: muestra LinkedIn SSO + formulario manual
       └── Con identidad: muestra quick start ("Empezar el quiz →")

2. Usuario se identifica → startQuizDirect() [server action]
   ├── Crea registro en users { name, empresa, linkedin_url }
   └── Devuelve URL: /quiz/<quizId>?userId=<userId>
   └── Client guarda identidad en localStorage + router.push()

3. /quiz/[quizId] carga preguntas (server)
   └── QuizClient recibe preguntas + quizTitle + quizId + userId

4. Usuario responde pregunta por pregunta
   └── handleAnswer() → supabase INSERT/UPDATE en responses
   └── Al finalizar → router.push(/quiz/<quizId>/waiting?userId=<userId>)

5. Sala de espera
   └── Muestra contador de participantes (polling 5s)
   └── Botón "Ver mis matches →" → /results/<userId>

6. /results/[userId] calcula matches (server)
   └── LiveRefresher refresca cada 15s automáticamente
   └── ShareButton permite compartir resultados
```

---

## Colores de la marca

| Token | Hex | Uso |
|---|---|---|
| Azul oscuro profundo | `#021f35` | Texto principal |
| Azul marino | `#163b4f` | Fondo oscuro, elementos secundarios |
| Azul medio | `#1e4d67` | Hover de elementos oscuros |
| Amarillo marca | `#edbe00` | Acción principal, CTA |
| Amarillo hover | `#c9a100` | Hover del amarillo |
| Gris claro bg | `#e8edf1` | Bordes y separadores |
| Gris fondo | `#f0f4f7` | Fondo de la página del quiz |
| LinkedIn azul | `#0A66C2` | Botones y elementos de LinkedIn |
