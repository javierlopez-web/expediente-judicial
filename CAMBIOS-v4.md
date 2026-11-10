# Versión 4 — 9 de noviembre de 2026

## Qué cambió

- El estudiante responde **solo el trabajo escrito** de su rol (PDF «Juicio_trabajo_escrito_y_rubricas»), 40 puntos:
  Fiscal, Defensa y Acusado (7 preguntas), Víctima o testigo (7, las mismas para Víctima, Testigo 1 y Testigo 2),
  Perito y los tres jueces (5 preguntas), más el criterio transversal (4 pts).
- Índice: Mi personaje · Trabajo escrito · Rúbrica de evaluación · Revisar, descargar y entregar.
- Cada pregunta muestra extensión, puntaje, «Cómo hacerlo» y «Puedes empezar así»; contador de palabras con aviso
  si se pasa del máximo (no bloquea).
- Rúbrica visible para el estudiante y en blanco al final del Word (columnas Máx., D, L, ED, I, Obt.; nota y comentario).
- Avance y estado «entregada» se calculan solo con el trabajo escrito. Una entrega anterior al 9-11-2026 corresponde a
  la preparación antigua: queda guardada, pero el estudiante debe entregar el trabajo nuevo.
- El ajuste «Habilitar el bloque C» se retiró del panel (los bloques B y C ya no se muestran).

## Datos

- Las respuestas nuevas usan ids `te1`…`te7` dentro del mismo mapa `respuestas` del expediente.
  Las respuestas antiguas (`a*`, `b*`, `c*`, `o*`) **no se borran**; quedan en Firestore.
- Usuarios, códigos, casos y personajes no cambian.

## Firebase

- **No hay que cambiar las reglas**: se usa el mismo documento `expedientes/<uid>` y los mismos campos.
- Todo sigue en el plan gratuito Spark.
