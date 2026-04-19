# Autenticación

La app tiene dos sistemas de autenticación completamente independientes, más un sistema de identidad persistente para participantes.

---

## 1. Auth de administrador (cookie httpOnly)

### Cómo funciona

No usa Supabase Auth. Es un sistema propio mínimo basado en una cookie de sesión:

1. El admin va a `/admin/login` y envía el formulario con la contraseña
2. La server action `loginAdmin()` compara con `process.env.ADMIN_PASSWORD`
3. Si es correcta, establece una cookie `admin_session=authenticated` (httpOnly, secure en prod)
4. El middleware o la page de admin comprueba si existe esa cookie antes de renderizar
5. `logoutAdmin()` borra la cookie y redirige a `/admin/login`

### Código relevante

```ts
// app/admin/actions.ts

export async function loginAdmin(_: unknown, formData: FormData) {
  const password = formData.get('password') as string
  if (password !== ADMIN_PASSWORD) return { error: 'Contraseña incorrecta' }

  const cookieStore = await cookies()
  cookieStore.set('admin_session', 'authenticated', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7,  // 7 días
    path: '/',
  })
  redirect('/admin')
}
```

### Seguridad

| Aspecto | Estado |
|---|---|
| Contraseña en claro en `.env` | ⚠️ Aceptable para uso interno |
| Cookie httpOnly | ✅ No accesible desde JS del navegador |
| Cookie secure | ✅ Solo HTTPS en producción |
| Sin rate limiting | ⚠️ Sin protección ante fuerza bruta |

### Contraseña actual
```
datinder2024
```
Definida en `.env.local` como `ADMIN_PASSWORD`.

---

## 2. Identidad persistente de participantes (localStorage)

Los participantes no tienen "login" en el sentido tradicional. Su identidad se guarda en `localStorage` del navegador para no tener que rellenar el formulario cada vez.

### Estructura

```ts
// Clave: 'datinder_identity'
type Identity = {
  name: string
  empresa: string | null
  linkedin_url: string | null
  isLinkedIn: boolean   // true si entró vía LinkedIn SSO
}
```

### Flujo

```
Primera vez:
  1. Usuario rellena formulario o hace login con LinkedIn
  2. Client guarda en localStorage
  3. Próximas visitas: QuizEntryForm muestra quick start

Quick start:
  └── Avatar con inicial + nombre + empresa + icono LinkedIn (si aplica)
  └── Botón "Empezar el quiz →" — un solo clic, sin formulario
  └── "No soy yo" → muestra formulario completo (no borra localStorage)
  └── "Cambiar identidad" → borra localStorage y muestra formulario vacío
```

### Gestión

```ts
// components/QuizEntryForm.tsx

const IDENTITY_KEY = 'datinder_identity'

export function saveIdentity(id: Identity) {
  localStorage.setItem(IDENTITY_KEY, JSON.stringify(id))
}

export function clearIdentity() {
  localStorage.removeItem(IDENTITY_KEY)
}
```

La identidad **no tiene expiración automática** — es adecuado para uso en eventos donde el usuario repetirá el quiz en el mismo día/semana desde el mismo dispositivo.

---

## 3. Auth de participantes — LinkedIn SSO (OAuth 2.0 PKCE)

### Flujo completo

```
1. Usuario hace clic en "Entrar con LinkedIn"
   └── LinkedInLoginButton.tsx [client]
       └── supabase.auth.signInWithOAuth({
             provider: 'linkedin_oidc',
             options: { redirectTo: 'https://datinder.fun/auth/callback?quiz=<slug>' }
           })
       └── Supabase genera code_verifier → guarda en localStorage
       └── Redirige al endpoint OAuth de LinkedIn

2. LinkedIn muestra pantalla de autorización
   └── Usuario acepta
   └── LinkedIn redirige a:
       https://xvvqpdvakyptsjnoehrs.supabase.co/auth/v1/callback

3. Supabase recibe el code → redirige a la app con code o tokens

4. app/auth/callback/page.tsx [client]
   └── Detecta el tipo de respuesta de Supabase:
       ├── CASO A: ?code= en query params → exchangeCodeForSession(window.location.href)
       ├── CASO B: #access_token= en hash → getSession() (Supabase lo detecta automáticamente)
       └── CASO C: ninguno → espera onAuthStateChange(SIGNED_IN)
   └── Obtiene sesión → name de user_metadata.full_name
   └── Llama a createLinkedInUser(name, quiz, provider_token) [server action]
       ├── Intenta LinkedIn API /v2/me?projection=(id,vanityName)
       ├── Si tiene vanityName → linkedin_url = 'https://linkedin.com/in/{vanityName}'
       ├── Si no → linkedin_url = búsqueda por nombre ('https://linkedin.com/search/...')
       ├── INSERT en users { name, linkedin_url }
       └── Devuelve { url: '/quiz/<quizId>?userId=<userId>', linkedin_url }
   └── Guarda en localStorage { name, empresa: null, linkedin_url, isLinkedIn: true }
   └── router.push(url)
```

### Datos obtenidos de LinkedIn OIDC

| Campo | Origen | Disponibilidad |
|---|---|---|
| `full_name` | `user_metadata.full_name` | Siempre |
| `email` | `user.email` | Si el scope `email` está activo |
| `avatar_url` | `user_metadata.avatar_url` | Siempre |
| `vanityName` (URL pública) | LinkedIn API `/v2/me` con `provider_token` | Solo si LinkedIn lo devuelve (requiere scope `r_liteprofile` o similar) |

### URL de perfil LinkedIn

La URL pública (`linkedin.com/in/vanityname`) **no viene directamente en el token OIDC**. Se intenta obtener así:

```ts
const res = await fetch(
  'https://api.linkedin.com/v2/me?projection=(id,vanityName)',
  { headers: { Authorization: `Bearer ${providerToken}` } }
)
// Si funciona: linkedin_url = 'https://linkedin.com/in/{vanityName}'
// Si falla:    linkedin_url = 'https://linkedin.com/search/results/people/?keywords={name}'
```

Con los scopes OIDC estándar (`openid profile email`), LinkedIn puede no devolver `vanityName`. En ese caso el icono LinkedIn sigue apareciendo en los resultados pero lleva a una búsqueda por nombre.

### Icono LinkedIn en resultados

El icono azul de LinkedIn solo se muestra para usuarios que tienen `linkedin_url` en la base de datos (es decir, los que hicieron login con LinkedIn o rellenaron el campo manualmente). Los usuarios sin `linkedin_url` no muestran el icono.

---

## Comparativa

| Característica | Admin (cookie) | Participante (localStorage) | Participante (LinkedIn SSO) |
|---|---|---|---|
| Protocolo | Cookie httpOnly propia | localStorage del navegador | OAuth 2.0 PKCE vía Supabase Auth |
| Persistencia | 7 días | Indefinida (hasta que el usuario borra) | localStorage indefinido |
| Identidad | Contraseña compartida | Nombre introducido manualmente | Identidad real de LinkedIn |
| Logout | Borra cookie (`logoutAdmin`) | "Cambiar identidad" borra localStorage | "Cambiar identidad" borra localStorage |
| Scope | Solo panel admin | Entrada rápida a cualquier quiz | Entrada rápida + perfil LinkedIn |
