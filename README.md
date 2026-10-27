# MI EXPEDIENTE JUDICIAL

Aplicación web de **preparación individual para un juicio simulado** (Educación Ciudadana, 3° medio).
Liceo Luis Urbina Flores · Departamento de Historia · Profesor Javier López.

HTML + CSS + JavaScript sin framework ni paso de compilación. Funciona en **GitHub Pages** (rutas relativas).
Usa **Firebase Authentication + Cloud Firestore** con el **plan gratuito (Spark)**: no hay Cloud Functions ni nada que se pague. Mientras Firebase no esté configurado, la aplicación se abre en un **modo local de prueba**
(los datos quedan solo en el navegador) con un aviso permanente en pantalla.

> **Estado honesto de esta entrega**: la interfaz, la lógica, el guardado automático, el Word, el panel del profesor y el
> modo local están probados en un navegador real (ver «Pruebas»). La conexión con Firebase real
> (`js/firebase-service.js`), las reglas (`firestore.rules`) están **escritas pero NO
> probadas contra un proyecto Firebase**. Léete `PENDIENTES.md` antes de poner a estudiantes reales.

---

## 1. Probar en tu computador (modo local, sin Firebase)

**Doble clic en `index.html`** funciona (usa el paquete único `js/app.bundle.js`). Si prefieres servirlo por HTTP
(usa los módulos de `js/` directamente, mejor para desarrollar):

```bash
cd expediente-judicial
python3 -m http.server 8765        # o:  npx serve .
# abre http://127.0.0.1:8765/
```

1. En el ingreso, haz clic en el sobre y abre «Modo de prueba: cuentas de ejemplo» → «Crear cuentas de prueba».
   Elige una cuenta (en modo local no hay contraseñas).
2. Panel del profesor: `http://127.0.0.1:8765/#/profesor` (en modo local sirve cualquier correo/contraseña del profesor).
   Ahí puedes importar un CSV, asignar personajes, ver el seguimiento, evaluar y descargar.

## 2. Estructura

```
index.html                  Aplicación (estudiante y profesor, enrutador por #)
profesor/index.html         Atajo: redirige a ../#/profesor
assets/img/                 Las 10 imágenes (WebP con transparencia, recortadas)  ← las que usa la app
assets/originales/          Los 10 PNG entregados, sin tocar (la app no los carga)
css/base.css                Variables, botones, formularios, diálogos, avisos
css/estudiante.css          Escritorio de archivo: hojas, sobres, corcho, etiquetas
css/profesor.css            Panel de administración
js/config.js                ← AQUÍ se pega la configuración de Firebase
js/app.js                   Arranque + enrutador
js/app.bundle.js            Paquete único de todo js/ (lo usa index.html al abrirse con doble clic).
                            ⚠ Si editas algo en js/, regénéralo:  cd tools && npm install && npm run app
js/ui-estudiante.js         Ingreso, bienvenida, tablero, marco de etapas, conflictos
js/ui-etapas.js             Las cuatro etapas (versión 2, simplificada)
js/ui-comun.js              Diálogos, avisos, barras
js/contenido.js             TODO el texto y la estructura (etapas, personajes, preguntas) y la migración de respuestas antiguas: editable
js/heredado.js              Etiquetas de las preguntas de la versión anterior (para mostrar respuestas antiguas)
js/progreso.js              Cálculo de avance y estado
js/guardado.js              Autoguardado con cola, reintentos y detección de conflictos
js/servicios.js             Fachada que usa la interfaz (las 10 funciones del encargo)
js/auth-service.js          iniciarSesion / cerrarSesion / ...
js/firebase-service.js      Backend real (Firebase)            ← sin probar contra Firebase real
js/local-backend.js         Backend de prueba (localStorage)
js/document-export.js       Word (.docx) con docx.js + correo mailto
js/teacher-dashboard.js     Panel del profesor
js/teacher-nomina.js        Nómina, importación CSV, cuentas
js/evaluacion.js            Rúbrica de 100 puntos y escala de notas (configurable)
js/audio.js, util.js
vendor/                     firebase.bundle.js, docx.min.js, jszip.min.js (ya construidos; ver tools/)
firestore.rules             Reglas de seguridad
firestore.indexes.json      (no se necesitan índices)
firebase.json, .firebaserc.example
tests/                      Pruebas (Node) y prueba de punta a punta (navegador)
tools/                      Reconstruir vendor/ y optimizar imágenes
PENDIENTES.md               Lo que falta conectar/probar
```

## 3. Puesta en marcha con Firebase (plan gratuito, sin tarjeta)

1. **Crear el proyecto** en https://console.firebase.google.com (sin Analytics está bien). Déjalo en el plan **Spark** (gratuito):
   nunca se cobra; si algún día se superara una cuota, el servicio se detiene hasta el día siguiente.
2. **Authentication → Método de acceso → Correo electrónico/contraseña**: activar (solo esa opción).
3. **Firestore Database → Crear base de datos** (modo producción), ubicación `southamerica-west1` (Santiago) si está disponible.
4. **Configuración del proyecto → Tus apps → Web (</>)**: copia el objeto de configuración y pégalo en `js/config.js`
   (`FIREBASE_CONFIG`). Esos valores **no son secretos**; la seguridad la dan las reglas y Authentication.
5. **Reglas**: Firestore → Reglas → pega el contenido de `firestore.rules` → Publicar. (O con la CLI: `firebase deploy --only firestore:rules`.)
6. **Tu cuenta de profesor** (dos pasos manuales, ninguna página puede hacerlos por ti):
   a. Authentication → Usuarios → «Agregar usuario»: tu correo y una contraseña fuerte. Copia el **UID** del usuario.
   b. Firestore → «Iniciar colección» → ID de colección `profesores` → ID del documento = ese **UID** → un campo cualquiera (`activo` = true).
7. **Publicar en GitHub Pages**: sube el contenido de esta carpeta (sin `node_modules`) a un repositorio,
   Settings → Pages → Deploy from a branch → `main` / raíz. La aplicación queda en
   `https://TU_USUARIO.github.io/NOMBRE_REPO/` y el panel en `…/#/profesor`.
8. **Authentication → Configuración → Dominios autorizados**: agrega `TU_USUARIO.github.io`.
9. En el panel: **Ajustes → Guardar** (crea el documento de configuración), **Nómina → Importar CSV / Agregar estudiante**.

Cuotas del plan gratuito (referencia, verifícalas en la consola): Firestore ≈ 50 000 lecturas y 20 000 escrituras al día.
Con 30 estudiantes que escriben un par de horas sobra, pero no lo uses para otra cosa grande en el mismo proyecto.

### Cómo ingresan los estudiantes
Con **nombre + primer apellido**, escritos en MAYÚSCULAS y sin tildes (la aplicación también acepta minúsculas y tildes).
**No hay contraseña**: la clave de cada cuenta se deriva del propio nombre y apellido (`claveDeIngreso` en `js/util.js`).
Internamente cada cuenta usa un identificador técnico (`<huella>@expedientes.liceoluf.com`; nadie lo ve ni recibe correos).
- Del nombre cuenta solo la primera palabra; del apellido, todo lo que escribas (sin espacios): si en la nómina figura
  «Pérez González» como apellido, el estudiante debe escribir PEREZGONZALEZ. Por eso, al crear cuentas, **pon solo el primer apellido**
  y revisa el diálogo «cómo ingresa cada estudiante», que muestra exactamente qué debe escribir cada uno.
- Dos estudiantes con el mismo nombre y primer apellido necesitan un **código de cuenta** distinto (campo en la nómina; el estudiante lo escribe en «Tengo un código de cuenta»).
- **Limitación consciente (decisión del profesor para uso escolar):** quien conozca el nombre y apellido de un compañero puede ingresar a su expediente y leerlo o editarlo. Las reglas protegen a los estudiantes de personas sin cuenta y las evaluaciones y el panel de los estudiantes, pero no entre compañeros. Si más adelante quieres evitarlo, hay que volver a una contraseña por estudiante (que en el plan gratuito sólo se puede cambiar desde la consola de Firebase).
- Suspender una cuenta (Nómina → Suspender) impide ingresar y editar; el avance se conserva.

## 5. Importar nómina y sorteo
`Nómina → Importar CSV`: acepta `;` `,` o tab. Asigna columnas (nombre y apellido separados, o «nombre completo»,
curso, caso, personaje, código). El personaje se reconoce por sinónimos (`Fiscal`, `Juez presidente`, `Testigo 1`…).
Se muestra una vista previa editable antes de aplicar. Si el estudiante ya existe, solo se actualiza su asignación,
salvo que esté bloqueada. Como para ingresar se usa el **primer apellido**, revisa en la vista previa que se haya
separado bien.

## 6. Contenido editable
Todos los textos, preguntas y campos están en `js/contenido.js`. **Los tres casos y sus antecedentes no están incluidos**
(se entregan aparte, como pide el encargo). Las imágenes no contienen texto: todo el texto es HTML.

## 7. Imágenes (equivalencias)
| Original entregado | Archivo usado | Uso |
|---|---|---|
| Papel_antiguo_doblado_sobre_transparencia | `papel-doblado` (y sus 3 cortes `papel-sup/med/inf`) | Hojas de trabajo |
| Sobre_de_pergamino_abierto_con_sello_roto | `sobre-abierto` | Sobre abierto (ingreso, bienvenida, desbloqueo) |
| Sobre_antiguo_con_sello_de_cera_roja | `sobre-cerrado` | Sobre cerrado (ingreso; etapas bloqueadas) |
| nota | `etiqueta` | Etiquetas del tablero |
| scoch | `cinta` | Cinta sobre hojas y avisos |
| clip | `clip` | Clip de las hojas |
| foto_vintage | `polaroid` | Marco de la ficha |
| pincho | `chinche` | Chinches |
| Tablero_de_corcho_vacío_con_marco_de_madera | `tablero-corcho` | Fondo del tablero |
| Fondo_de_papel_vintage_texturizado | `fondo-papel` | Fondo de toda la aplicación |

Se recortaron al contenido visible y se convirtieron a WebP con transparencia (`tools/preparar-imagenes.py`).
Los PNG originales están en `assets/originales/`.

## 8. Pruebas
```bash
node --test tests/estructura.test.mjs   # versión 2: preguntas por personaje, avance, acusado en silencio,
                                        # migración de respuestas antiguas, respaldo y Word de los 10 personajes
node tests/logica.test.mjs        # progreso, notas, estructura de contenido
node tests/guardado.test.mjs      # autoguardado, conflictos, sin conexión
node tests/documento.test.mjs     # genera un Word por personaje y verifica su contenido
node tests/huella.test.mjs        # identidad y clave de ingreso estables (valores fijos)
node tests/firebase-falso.test.mjs  # lógica de firebase-service.js contra un Firebase FALSO en memoria
```
Prueba de punta a punta en navegador (opcional): `tests/e2e/e2e.mjs` (Playwright; ver comentarios en el archivo).

## 9. Sonidos
Web Audio sintetizado (sin archivos). Empiezan **desactivados**; el estudiante usa «ACTIVAR SONIDOS».
El profesor puede desactivarlos para todos o bajar el volumen (Ajustes). Respeta `prefers-reduced-motion` en animaciones.

## 10. Limitaciones conocidas
- La detección de «decisión ya redactada» en los jueces es una **heurística por palabras** (advierte, no bloquea):
  no reemplaza la lectura del profesor.
- El correo de entrega usa `mailto:`: **no puede adjuntar** el Word; la propia aplicación lo advierte.
- El Word se genera en el navegador; no se guarda copia del .docx en el servidor (se guarda el contenido, y se puede regenerar).


## Archivo único para el teléfono (`expediente-judicial.html`)

Un solo `.html` con estilos, código, imágenes y generadores de Word/ZIP incrustados: se abre directo (teléfono o doble clic), sin carpetas ni ZIP.
Funciona en **modo local de prueba** (no incluye Firebase). Si el navegador no permite guardar (p. ej. archivo abierto desde el teléfono), la app usa memoria y avisa en la franja superior: lo escrito se pierde al cerrar la página.
Se regenera con `cd tools && npm run unico` cada vez que cambies algo en `js/`, `css/` o `assets/`.
Para estudiantes reales usa la versión publicada en GitHub Pages con Firebase.


## Ilustraciones de personajes

`assets/img/personajes/<clave>.webp` (fiscal, defensor, acusado, testigo1, testigo2, perito, juez_presidente, juez_preguntas, juez_decision) se muestran en la Polaroid de la bienvenida. La **víctima** y los estudiantes sin personaje usan la silueta genérica (no hay ilustración de víctima). La lista está en `PERSONAJES_CON_IMAGEN` (`js/contenido.js`). Los originales están en `assets/originales/ilustraciones/`.
Guardadas sin usar en pantalla: `assets/img/sala-audiencia.webp` y `assets/img/pruebas/` (huella dactilar, cámara de seguridad), porque las pruebas pertenecen a un caso concreto.
