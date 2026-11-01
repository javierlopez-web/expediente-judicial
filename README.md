# MI EXPEDIENTE JUDICIAL

Aplicación web de **preparación individual para el juicio simulado** (Educación Ciudadana, 3° medio).
Liceo Luis Urbina Flores · Profesor Javier López.

HTML + CSS + JavaScript sin framework. Se publica en **GitHub Pages** y guarda en **Firebase** (plan gratuito Spark:
Authentication + Cloud Firestore, sin Cloud Functions). Si `js/config.js` no tiene la configuración de Firebase,
se abre en **modo local de prueba** (se guarda solo en el navegador, con un aviso permanente).

Versión actual: **v3** (noviembre 2026). Qué cambió y qué hay que hacer en Firebase: **`CAMBIOS-v3.md`**.

## 1. Cómo funciona

**Estudiante** (`https://<usuario>.github.io/expediente-judicial/`)
- Ingresa con **NOMBRE + PRIMER APELLIDO** (mayúsculas, sin tildes) y un **código de 4 números** que entrega el profesor.
- Ve un índice simple: *Mi personaje* · *A Mi preparación* (30 pts) · *B Para mi reemplazo* · *C Reflexión* (20 pts) ·
  *C Observación de otro caso* (10 pts) · *Pauta de evaluación* · *Revisar, descargar y entregar*.
- Las preguntas dependen del **rol** (iguales para los tres casos): partes (fiscal y defensa), acusado, víctima y testigos,
  perito y cada uno de los tres jueces. Están en `js/contenido.js`.
- Todo se guarda solo. Descarga su preparación en Word y la entrega.

**Profesor** (`…/#/profesor`, mismo correo y contraseña de siempre)
- **Resumen**: cifras, los tres casos con sus 10 personajes y el avance de cada uno, ajustes (permitir edición,
  habilitar el bloque C, mensaje general), descargar todos los Word (ZIP) y la lista de accesos (CSV).
- **Usuarios**: nombre, apellido, cómo ingresa, **código** (cambiar o asignar), caso y personaje, avance, estado,
  **Ver** el archivo, descargar su **Word**; agregar, importar lista, corregir nombre, suspender y eliminar.

## 2. Probar en tu computador (modo local)

Deja vacíos `apiKey` y `projectId` en una copia de `js/config.js` y sirve la carpeta:
```bash
python3 -m http.server 8765      # http://127.0.0.1:8765/   y   http://127.0.0.1:8765/#/profesor
```
En el ingreso, «Modo de prueba: cuentas de ejemplo» crea diez cuentas (códigos 1001 a 1010). En modo local el panel
del profesor acepta cualquier correo y contraseña.

## 3. Estructura

```
index.html                  Aplicación (estudiante y profesor; enrutador por #)
profesor/index.html         Atajo a ../#/profesor
css/base.css, estudiante.css, profesor.css   Estilos de la ambientación (papel, sobre, polaroid…)
css/expediente.css          Estilos v3: índice, preguntas y panel del profesor
js/config.js                Configuración de Firebase y ajustes predeterminados
js/app.js                   Arranque y enrutador (#/, #/s/<sección>, #/profesor/…)
js/app.bundle.js            Paquete único para abrir index.html con doble clic. Regenerar: cd tools && npm i && npm run bundle
js/contenido.js             Personajes, preguntas por rol, cálculo de avance y pauta  ← para editar textos
js/ui-estudiante.js         Ingreso, índice y secciones del estudiante
js/teacher-dashboard.js     Panel del profesor (Resumen y Usuarios)
js/document-export.js       Word (.docx) con docx.js
js/servicios.js             Fachada que usa la interfaz
js/firebase-service.js      Backend real (Firebase)
js/local-backend.js         Backend de prueba (localStorage)
js/guardado.js              Autoguardado con cola, reintentos y conflictos
js/auth-service.js, ui-comun.js, util.js, audio.js, registro.js
vendor/                     firebase.bundle.js, docx.min.js, jszip.min.js (ya construidos)
tools/                      Reconstruir vendor/firebase.bundle.js y js/app.bundle.js (esbuild)
firestore.rules             Reglas de seguridad (pegarlas en la consola de Firebase)
```

## 4. Cuentas y códigos (cómo funciona por dentro)

- Cada estudiante es una cuenta de Firebase Authentication con un identificador técnico
  `<huella(nombre, apellido)>@expedientes.liceoluf.com` y una contraseña técnica que depende del nombre, el apellido
  y el código (`claveConCodigo` en `js/util.js`). El estudiante nunca ve ni escribe esos datos.
- El panel crea, cambia el código y elimina cuentas con una **segunda instancia** de Firebase: inicia sesión como
  el estudiante (con datos que el profesor conoce) y cambia su contraseña. Así funciona sin Cloud Functions.
- Homónimos (mismo nombre y primer apellido): se crean automáticamente como variante; ingresan igual, con su propio código.
- Corregir el nombre crea una cuenta nueva (mismo código y asignación) y elimina la anterior. Si el estudiante ya
  había escrito, eso queda en la cuenta anterior: corrige los nombres antes de que empiecen.
- El perfil (`estudiantes/<uid>`) guarda el campo `codigo`; solo lo leen el propio estudiante y el profesor.

## 5. Puesta en marcha con Firebase (si empiezas de cero)

1. Consola de Firebase → crear proyecto → agregar app web → copiar la configuración en `js/config.js`.
2. Authentication → Método de acceso → activar **Correo electrónico/contraseña**.
3. Firestore Database → crear (modo producción) → **Reglas** → pegar `firestore.rules` → Publicar.
4. Tu cuenta de profesor: Authentication → Agregar usuario (correo y contraseña) → copiar su UID →
   Firestore → colección `profesores` → documento con ese UID (campo `activo` = true).
5. Authentication → Configuración → Dominios autorizados → agregar `<usuario>.github.io`.
6. GitHub Pages: Settings → Pages → Deploy from a branch → `main` / raíz.

## 6. Limitaciones conocidas

- Un código de 4 números es una protección escolar: evita entrar con solo saber el nombre de un compañero, pero no
  es una contraseña fuerte.
- La conexión real con Firebase de esta versión no se pudo probar desde donde se construyó: la lógica se probó en modo
  local. Sigue los pasos de `CAMBIOS-v3.md` y prueba con una cuenta antes de entregar códigos al curso.
- El Word se genera en el navegador; no se guarda una copia del .docx en el servidor (se guarda el contenido).
