# Infraestructura

## Servicios externos

### Supabase
- **Proyecto:** `xvvqpdvakyptsjnoehrs`
- **Región:** (EU West por defecto en el tier free)
- **URL del proyecto:** `https://xvvqpdvakyptsjnoehrs.supabase.co`
- **Panel:** https://supabase.com/dashboard/project/xvvqpdvakyptsjnoehrs
- **Plan:** Free tier

Supabase provee:
- PostgreSQL como base de datos principal
- Auth (OAuth con LinkedIn OIDC)
- REST API auto-generada sobre las tablas (PostgREST)
- Realtime (no usado — la app usa polling vía Server Actions)

**Configuración Auth:**
- `site_url`: `https://datinder.fun`
- `uri_allow_list`: `http://localhost:3000/auth/callback`, `https://datinder.vercel.app/auth/callback`, `https://datinder.fun/auth/callback`

### Vercel
- **Proyecto:** `datinder`
- **Owner:** `michelvalles-projects`
- **Project ID:** `prj_MVHrh3X8KOVJEKLYmI6zJnTMvt7m`
- **Dominio:** `datinder.fun` (comprado en Vercel, expira Apr 2027)
- **Panel:** https://vercel.com/michelvalles-projects/datinder

### LinkedIn Developer App
*(Pendiente de configurar — ver [linkedin-sso-setup.md](./linkedin-sso-setup.md))*
- Necesaria para el login SSO con LinkedIn
- El Client ID y Secret van en Supabase Auth → Providers → LinkedIn OIDC

---

## Variables de entorno

Fichero local: `.env.local` (no se sube a git)

```env
NEXT_PUBLIC_SUPABASE_URL=https://xvvqpdvakyptsjnoehrs.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_C7xHz-FhTP5H2T6dwtxkIA_1S6wpzuf
ADMIN_PASSWORD=datinder2024
VERCEL_OIDC_TOKEN=<jwt generado por Vercel para el entorno dev>
```

### Descripción de cada variable

| Variable | Visibilidad | Descripción |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Pública (cliente + servidor) | Endpoint REST de Supabase. Expuesta al navegador, sin riesgo. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Pública (cliente + servidor) | Clave anónima de Supabase. Permite leer/escribir según las RLS policies. |
| `ADMIN_PASSWORD` | Solo servidor | Contraseña del panel de administración. En producción cambiarla por una segura. |
| `VERCEL_OIDC_TOKEN` | Auto-inyectado por Vercel | JWT OIDC de Vercel para operaciones de CI/CD. No se usa en la app directamente. |

> **Nota:** No existe `SUPABASE_SERVICE_ROLE_KEY`. Toda la app usa la clave anónima con RLS. Para operaciones admin de DB (migraciones, datos privados) habría que añadir la service role key como variable solo-servidor (sin `NEXT_PUBLIC_`).

---

## Tokens y claves de gestión

### Supabase Personal Access Token (PAT)
- **Uso:** Llamadas a la Supabase Management API (migraciones de schema, configuración de providers)
- **Endpoint API:** `https://api.supabase.com/v1/projects/xvvqpdvakyptsjnoehrs/...`
- **Obtener el token:** https://supabase.com/dashboard/account/tokens
- **No va en el código fuente ni en `.env`** — es una clave personal del portal de Supabase

### Cómo se usó el PAT
Se usó para ejecutar la migración SQL de adición de columna `linkedin_url`:
```bash
curl -X POST "https://api.supabase.com/v1/projects/xvvqpdvakyptsjnoehrs/database/query" \
  -H "Authorization: Bearer sbp_..." \
  -H "Content-Type: application/json" \
  -d '{"query": "ALTER TABLE users ADD COLUMN IF NOT EXISTS linkedin_url TEXT;"}'
```

---

## Supabase Auth — Callback URL

Para el login con LinkedIn, Supabase necesita recibir el callback OAuth. La URL de redirect que hay que configurar en el Developer App de LinkedIn es:

```
https://xvvqpdvakyptsjnoehrs.supabase.co/auth/v1/callback
```

Después de autenticar, Supabase redirige al `redirectTo` que especifica la app:
```
https://datinder.fun/auth/callback?quiz=<slug>
```
(o `http://localhost:3000/auth/callback?quiz=<slug>` en desarrollo)

---

## Seguridad del cliente Supabase

La app **no usa** `SUPABASE_SERVICE_ROLE_KEY`. Todas las operaciones pasan por la clave anónima y la Row Level Security de Supabase.

> **Riesgo potencial:** Las tablas `users`, `responses`, `questions` y `quizzes` son accesibles desde el cliente sin autenticación de usuario. Esto es intencional para el flujo actual (quiz público sin login requerido para responder). Si se quiere proteger en el futuro, habría que activar RLS policies más estrictas.

---

## Red y puertos

- **Desarrollo:** `http://localhost:3000` (Next.js dev server con Turbopack)
- **Producción:** HTTPS, CDN global de Vercel
- **Supabase:** HTTPS en el puerto 443 siempre (no hay conexión directa a PostgreSQL)
