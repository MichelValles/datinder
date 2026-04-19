# Flujos de usuario

## Flujo 1 — Participante entra al quiz (manual)

```
/ (sin quiz)
  └── Ve directorio de quizzes publicados
  └── Hace clic en un quiz → /?quiz=<slug>

/?quiz=<slug>
  └── QuizEntryForm verifica localStorage (datinder_identity)

  ── CASO A: Sin identidad guardada ──
  └── Ve el título del quiz
  └── Introduce nombre + empresa (opcionales) + URL de LinkedIn (opcional)
  └── Pulsa "Empezar el quiz →"
      └── startQuizDirect() [server action]
          ├── Busca quiz por slug
          ├── INSERT en users
          └── Devuelve /quiz/<quizId>?userId=<userId>
      └── Client guarda identidad en localStorage
      └── router.push → /quiz/<quizId>?userId=<userId>

  ── CASO B: Con identidad guardada (quick start) ──
  └── Ve su nombre + empresa + icono LinkedIn (si aplica)
  └── Pulsa "Empezar el quiz →" (sin rellenar nada)
      └── startQuizDirect() con datos de localStorage
      └── router.push → /quiz/<quizId>?userId=<userId>
  └── Opciones: "No soy yo" (muestra formulario completo) | "Cambiar identidad" (borra localStorage)

/quiz/<quizId>?userId=<userId>
  └── Ve 20 preguntas una a una
  └── En cada pregunta: pulsa Opción A u Opción B
      └── INSERT en responses (o UPDATE si vuelve atrás y cambia)
  └── Puede pulsar "← Anterior" para volver a pregunta previa
  └── Al responder la última → redirect → /quiz/<quizId>/waiting?userId=<userId>

/quiz/<quizId>/waiting?userId=<userId>
  └── Ve contador de participantes (actualiza cada 5s)
  └── Botón "Ver mis matches →" → /results/<userId>

/results/<userId>
  └── Ve su ranking de matches (se refresca automáticamente cada 15s)
  └── Cada match muestra: nombre, % similitud, nº preguntas en común
  └── Si el match tiene linkedin_url → icono LinkedIn azul que lleva a su perfil
  └── Botón "Compartir mis matches" (Web Share API en móvil, copia enlace en escritorio)
  └── Botón "Repetir quiz →" para volver a la home (identidad sigue guardada)
```

---

## Flujo 2 — Participante entra al quiz (LinkedIn SSO)

```
/?quiz=<slug>
  └── QuizEntryForm no tiene identidad guardada
  └── Pulsa "Entrar con LinkedIn"
      └── LinkedInLoginButton [client]
          └── supabase.auth.signInWithOAuth({
                provider: 'linkedin_oidc',
                redirectTo: '/auth/callback?quiz=<slug>'
              })
          └── Redirige → LinkedIn OAuth

LinkedIn
  └── Usuario autoriza la app
  └── Redirige → https://xvvqpdvakyptsjnoehrs.supabase.co/auth/v1/callback
      └── Supabase redirige → /auth/callback?code=<code>&quiz=<slug>

/auth/callback [client]
  └── Detecta si hay code (PKCE), access_token en hash (implicit), o espera onAuthStateChange
  └── Obtiene sesión de Supabase
  └── Extrae name de user_metadata.full_name
  └── Llama a createLinkedInUser(name, quiz, provider_token) [server action]
      ├── Intenta LinkedIn API → obtiene vanityName → linkedin_url real
      ├── Si falla: linkedin_url = búsqueda por nombre en LinkedIn
      ├── Busca quiz por slug
      ├── INSERT en users { name, linkedin_url }
      └── Devuelve { url: /quiz/<quizId>?userId=<userId>, linkedin_url }
  └── Guarda identidad en localStorage { name, linkedin_url, isLinkedIn: true }
  └── router.push(url)

/quiz/<quizId>?userId=<userId>
  └── Mismo flujo que el manual desde aquí
```

---

## Flujo 3 — Admin gestiona un quiz

```
/admin/login
  └── Introduce contraseña (ADMIN_PASSWORD)
  └── loginAdmin() → cookie admin_session → redirect /admin

/admin
  └── Ve lista de quizzes con estado (Activo / Borrador)
  └── Puede crear nuevo quiz con título
  └── Puede abrir quiz existente → /admin/quiz/<quizId>
  └── Enlace "Ver sitio público ↗" en el header

/admin/quiz/<quizId>  [Pestaña: Configuración]
  └── Ve estadísticas: nº preguntas, nº participantes, fecha
  └── Edita el título
  └── Publica / despublica el quiz (toggleFinalized)
  └── Si publicado:
      ├── URL del quiz con botón copiar
      ├── QR code del quiz (para proyectar en eventos)
      └── Botón "📺 Abrir modo evento" → /quiz/<quizId>/live (nueva pestaña)

/admin/quiz/<quizId>/questions  [Pestaña: Preguntas]
  └── Botones de autofill: 😊 Fácil / 🤔 Medio / 🔥 Difícil
  └── Editor manual: 20 filas con pregunta + opción A + opción B
  └── Botón "Guardar cambios" sticky en el footer

/admin/quiz/<quizId>/participants  [Pestaña: Participantes]
  └── Lista de participantes con empresa, nº respuestas, fecha (timezone del navegador)
  └── Puede ver detalle de cada participante → /participants/<userId>
  └── Puede eliminar participante individual
  └── Puede vaciar todos los participantes

/admin/quiz/<quizId>/participants/<userId>
  └── Ve las respuestas del participante (A o B por pregunta)
  └── Si tiene linkedin_url: enlace "LinkedIn" en el header
  └── Ve su ranking de matches respecto al resto de participantes
```

---

## Flujo 4 — Modo evento (pantalla proyectable)

```
/quiz/<quizId>/live
  └── Pantalla de fondo oscuro, diseñada para proyector

  ── Columna izquierda ──
  └── QR code grande del quiz (para que asistentes escaneen)
  └── URL "datinder.fun"
  └── Contador de participantes (número grande, actualiza cada 8s)

  ── Columna derecha ──
  └── Top 5 parejas más compatibles del quiz
      └── Formato: "🥇 Michel & Sara — 95%"
      └── Actualiza cada 8s automáticamente
  └── Botón "↻ Actualizar ahora" para forzar refresco
  └── Timestamp de última actualización

Nota: Solo muestra parejas con al menos 5 preguntas respondidas en común
```

---

## Estados de un quiz

```
Borrador (is_finalized = false)
  └── Solo visible en /admin
  └── No aparece en el directorio público
  └── No se puede acceder por URL pública

Activo / Publicado (is_finalized = true)
  └── Aparece en el directorio público (/)
  └── Accesible por URL: /?quiz=<slug>
  └── QR y botón "Modo evento" disponibles en el admin
```

---

## Flujo de respuesta con "volver atrás"

El estado de respuestas se guarda en un `Map<questionIndex, 0|1>` en el cliente:

```
Pregunta 1 → Usuario elige A → INSERT en responses
Pregunta 2 → Usuario elige B → INSERT en responses
Pregunta 3 → Usuario pulsa "← Anterior"
  └── current = 2, selected = respuesta previa (B)
  └── Usuario cambia a A → UPDATE en responses (ya existe la fila)
Pregunta 3 de nuevo → avanza normalmente
```

---

## Identidad persistente entre quizzes

```
Primera visita
  └── Formulario completo (LinkedIn SSO o manual)
  └── Al identificarse → localStorage.setItem('datinder_identity', {...})

Visitas siguientes (mismo navegador)
  └── QuizEntryForm lee localStorage en useEffect
  └── Muestra quick start: avatar + nombre + "Empezar el quiz →"
  └── "No soy yo" → muestra formulario completo sin borrar localStorage
  └── "Cambiar identidad" → localStorage.removeItem() + formulario vacío

La identidad persiste indefinidamente en el navegador hasta que el usuario la borra.
No hay expiración automática (el quiz se usa en eventos, no requiere caducidad).
```
