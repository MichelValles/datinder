# Guía de configuración — LinkedIn SSO

El error `Unsupported provider: provider is not enabled` significa que el provider de LinkedIn no está activado en Supabase. Sigue estos pasos.

---

## Paso 1 — Crear la LinkedIn Developer App

1. Ve a https://www.linkedin.com/developers/apps
2. Haz clic en **"Create app"**
3. Rellena:
   - **App name:** `Datinder` (o el que quieras)
   - **LinkedIn Page:** selecciona o crea una página de empresa asociada
   - **App logo:** opcional
4. Acepta los términos y crea la app

---

## Paso 2 — Añadir el producto "Sign In with LinkedIn using OpenID Connect"

1. Dentro de la app, ve a la pestaña **"Products"**
2. Busca **"Sign In with LinkedIn using OpenID Connect"**
3. Haz clic en **"Request access"** → se aprueba instantáneamente

Esto habilita los scopes `openid`, `profile` y `email`.

---

## Paso 3 — Configurar la URL de redirect

1. Ve a la pestaña **"Auth"** de tu LinkedIn App
2. En la sección **"OAuth 2.0 settings"** → **"Authorized redirect URLs for your app"**
3. Añade exactamente esta URL:
   ```
   https://xvvqpdvakyptsjnoehrs.supabase.co/auth/v1/callback
   ```
4. Guarda los cambios

---

## Paso 4 — Copiar Client ID y Client Secret

En la pestaña **"Auth"** verás:
- **Client ID** (ej: `77abc123def456...`)
- **Client Secret** → haz clic en "Generate" si no existe

Guárdalos, los necesitas en el paso siguiente.

---

## Paso 5 — Activar LinkedIn OIDC en Supabase

1. Ve a https://supabase.com/dashboard/project/xvvqpdvakyptsjnoehrs/auth/providers
2. Busca **"LinkedIn (OIDC)"** en la lista
3. Activa el toggle **"Enable LinkedIn provider"**
4. Pega tu **Client ID** y **Client Secret**
5. Haz clic en **"Save"**

---

## Paso 6 — (Desarrollo local) Añadir localhost como redirect

Supabase solo redirige a URLs que estén en la lista blanca. Para desarrollo local:

1. En Supabase Dashboard → **Authentication → URL Configuration**
2. En **"Redirect URLs"** añade:
   ```
   http://localhost:3000/auth/callback
   ```

---

## Verificación

Abre http://localhost:3000/?quiz=\<cualquier-slug\> y pulsa **"Entrar con LinkedIn"**. Debería:
1. Redirigirte a la pantalla de login de LinkedIn
2. Tras autorizar, volver a `/auth/callback?code=...`
3. Redirigirte al quiz con tu nombre de LinkedIn pre-relleno

---

## Scopes que se solicitan

| Scope | Datos obtenidos |
|---|---|
| `openid` | Token OIDC |
| `profile` | Nombre completo, foto |
| `email` | Email |

La URL pública del perfil (`linkedin.com/in/vanityname`) se intenta obtener mediante una llamada adicional a `https://api.linkedin.com/v2/me?projection=(id,vanityName)` usando el `provider_token`. Si LinkedIn no lo devuelve, el campo `linkedin_url` queda vacío y el usuario puede introducirlo manualmente.

---

## Troubleshooting

| Error | Causa | Solución |
|---|---|---|
| `Unsupported provider: provider is not enabled` | LinkedIn no activado en Supabase | Seguir pasos 4–5 |
| `redirect_uri_mismatch` | URL de redirect no configurada en LinkedIn App | Seguir paso 3 |
| `invalid_client` | Client ID o Secret incorrectos | Verificar paso 4 en Supabase |
| Pantalla en blanco en `/auth/callback` | `localhost:3000` no en la whitelist de Supabase | Seguir paso 6 |
