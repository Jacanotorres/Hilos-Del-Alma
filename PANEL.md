# Panel de Hilos del Alma

La clienta entra a `/login.html`, y desde `/panel.html` agrega y edita:

- **Piezas**: nombre, categoría, precio (opcional), descripción, qué significa, línea, fotos (varias, con portada), mostrar/ocultar, destacar y marcar agotado.
- **Categorías**: nombre, frase corta y orden.
- **Medallas**: nombre, significado y foto. Se muestran en Inicio y en Nosotras.

Todo vive en Supabase (proyecto propio de este cliente). Si `assets/js/config.js` está vacío, el sitio usa las piezas de respaldo de `assets/js/data.js` y el panel avisa que falta conectar.

## Puesta en marcha (una sola vez)

1. Crear el proyecto en Supabase (nombre: Hilos del Alma).
2. SQL Editor → pegar `supabase-setup.sql` → Run. Crea tablas, permisos, buckets de fotos, las 8 categorías y las 9 piezas que ya estaban en el sitio.
3. Authentication → Users → Add user (correo y contraseña de la clienta, con "Auto Confirm User").
4. Copiar el User UID, pegarlo en `supabase-crear-admin.sql` y correrlo.
5. Project Settings → API: copiar la URL y la llave pública (anon/publishable) en `assets/js/config.js`.
6. Commit y push.
