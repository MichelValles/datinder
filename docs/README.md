# Datinder — Documentación técnica

Datinder es una aplicación de matching de personalidad estilo Tinder. Los usuarios responden 20 preguntas de opción doble (A o B) y al finalizar ven qué otros participantes piensan más como ellos, ordenados por porcentaje de coincidencia.

---

## Índice

| Documento | Contenido |
|---|---|
| [infraestructura.md](./infraestructura.md) | Servicios externos, variables de entorno, tokens, credenciales |
| [base-de-datos.md](./base-de-datos.md) | Esquema completo de Supabase: tablas, columnas, relaciones, RLS |
| [arquitectura.md](./arquitectura.md) | Estructura de ficheros, rutas Next.js, components, data flow |
| [flujos.md](./flujos.md) | Flujos completos de usuario: público, admin, LinkedIn SSO |
| [autenticacion.md](./autenticacion.md) | Sistema de auth de admin (cookie) y LinkedIn SSO (OAuth PKCE) |
| [linkedin-sso-setup.md](./linkedin-sso-setup.md) | Guía paso a paso para activar el login con LinkedIn |
| [acciones-servidor.md](./acciones-servidor.md) | Referencia de todas las Server Actions y rutas API |
| [banco-preguntas.md](./banco-preguntas.md) | Sistema de banco de preguntas: estructura, categorías, lógica |
| [rendimiento.md](./rendimiento.md) | Optimizaciones de rendimiento aplicadas |

---

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Framework | Next.js 16.2.4 (App Router, Turbopack) |
| UI | React 19, Tailwind CSS v4 |
| Base de datos | Supabase (PostgreSQL) |
| Auth (usuarios) | Supabase Auth — LinkedIn OIDC (OAuth 2.0 PKCE) |
| Auth (admin) | Cookie httpOnly con contraseña |
| Hosting | Vercel |
| Lenguaje | TypeScript 5 |

---

## URLs clave

| Entorno | URL |
|---|---|
| Desarrollo | http://localhost:3000 |
| Producción | https://datinder.fun *(Vercel)* |
| Supabase Studio | https://supabase.com/dashboard/project/xvvqpdvakyptsjnoehrs |
| Vercel Dashboard | https://vercel.com/michelvalles-projects/datinder |
