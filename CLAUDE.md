@AGENTS.md

# Documentación del proyecto

La carpeta `docs/` contiene documentación técnica detallada y actualizada. **Antes de hacer cambios significativos, leer los documentos relevantes. Tras hacerlos, actualizar el documento correspondiente.**

| Documento | Cuándo leerlo | Cuándo actualizarlo |
|---|---|---|
| `docs/infraestructura.md` | Al tocar servicios, variables de entorno, tokens | Si cambia algún servicio, URL, token o variable |
| `docs/base-de-datos.md` | Al hacer consultas o cambios de schema | Tras cualquier migración o cambio de tabla |
| `docs/arquitectura.md` | Al añadir rutas, componentes o cambiar la estructura | Al crear/mover/eliminar ficheros relevantes |
| `docs/flujos.md` | Al entender cómo navega el usuario | Si cambia algún flujo de navegación o lógica |
| `docs/autenticacion.md` | Al tocar auth de admin o LinkedIn SSO | Si cambia el sistema de autenticación |
| `docs/linkedin-sso-setup.md` | Al configurar o depurar LinkedIn SSO | Si cambian URLs, scopes o pasos de configuración |
| `docs/acciones-servidor.md` | Al añadir o modificar server actions | Tras añadir, cambiar o eliminar una server action |
| `docs/banco-preguntas.md` | Al tocar el banco de preguntas o autofill | Si se añaden preguntas o cambia la lógica de selección |
| `docs/rendimiento.md` | Al hacer optimizaciones | Tras aplicar o revertir una optimización |
