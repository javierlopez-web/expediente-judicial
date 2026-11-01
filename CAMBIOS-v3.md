# Versión 3 — noviembre 2026

## Qué cambió

**Estudiante**
- Ingreso con **nombre + primer apellido + código de 4 números** (lo entrega el profesor).
- Índice simple en vez de etapas: Mi personaje · A Mi preparación · B Para mi reemplazo · C Reflexión ·
  C Observación de otro caso · Pauta de evaluación · Revisar, descargar y entregar.
- Preguntas nuevas, solo las que se evalúan o las que necesita un reemplazo, alineadas con la pauta de 100 puntos
  y con el archivo de audiencias (fichas, expediente común y sección docente):
  - **A · Preparación (30 pts)**: 4 a 7 preguntas según el rol, con límites de palabras.
  - **B · Para mi reemplazo**: acuerdos con el equipo y lo indispensable (no se evalúa).
  - **C · Reflexión (20 pts)**: las tres preguntas de la pauta.
  - **C · Observación (10 pts)**: caso observado, funciones y uso de pruebas o garantías.
- El bloque C se habilita desde el panel después de las audiencias.
- Word con el mismo orden del índice.

**Profesor**
- Dos pestañas: **Resumen** y **Usuarios**.
- Usuarios: ver y cambiar el código, asignar caso y personaje, ver el avance, ver el archivo y descargar el Word,
  agregar, importar lista, corregir nombre, suspender y eliminar.
- Resumen: cifras, los tres casos con su elenco y avance, ajustes y descargas (ZIP de todos los Word y lista de accesos en CSV).
- Se quitaron: evaluación con rúbrica en el panel, seguimiento por etapas, práctica de límites, sonidos de etapas y
  versiones antiguas de preguntas. Las respuestas antiguas no se borran de Firestore, pero ya no se muestran.

**Técnico**
- `vendor/firebase.bundle.js` se reconstruyó (misma versión, 13.1.0) para incluir `updatePassword`, `deleteUser` y `deleteDoc`.
- `firestore.rules`: se agregó el campo `codigo` al perfil del estudiante (crear y actualizar).
- Nuevos `tools/` para regenerar los paquetes con esbuild.

## Lo que debes hacer en Firebase (una vez)

1. **Publicar las reglas nuevas.** Firebase → Firestore Database → Reglas → reemplaza todo por el contenido de
   `firestore.rules` → **Publicar**. Sin esto, el panel no puede crear estudiantes ni cambiar códigos.
2. **Publicar la aplicación.** Al unir esta rama con `main`, GitHub Pages se actualiza solo en uno o dos minutos.
3. **Dar códigos a las cuentas que ya existían.** Panel → Usuarios → **Asignar códigos faltantes**. Convierte cada
   cuenta antigua al ingreso con código, sin perder lo escrito.
4. **Entregar los códigos.** Panel → Resumen o Usuarios → **Lista de accesos (CSV)**: muestra qué debe escribir cada estudiante.
5. **Probar.** Ingresa como un estudiante con su código, escribe algo y revisa que aparezca en el panel.

Tu ingreso de profesor no cambia: el mismo correo y la misma contraseña.
