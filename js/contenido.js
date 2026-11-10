/**
 * CONTENIDO · versión 4 (9 de noviembre de 2026): trabajo escrito con rúbrica de 40 puntos.
 * (Más abajo quedan, sin usarse, los bloques A, B y C de la versión 3.)
 * ---------------------------------------------------------------
 * Todo lo que el estudiante escribe y lee vive aquí. No contiene los casos: las preguntas sirven
 * para los tres casos (el mismo formulario para los tres fiscales, los seis testigos, etc.).
 *
 * Tres bloques, alineados con la pauta de 100 puntos:
 *   A · Mi preparación          (antes de la audiencia · 30 puntos)
 *   B · Para mi reemplazo       (no se evalúa; lo lee quien te reemplace si faltas)
 *   C · Después de la audiencia (reflexión · 20 puntos · y observación de otro caso · 10 puntos)
 * La participación en la audiencia (40 puntos) la observa el profesor en la sala.
 *
 * Tipos de campo:
 *   texto      → un párrafo (limite: palabras máximas)
 *   lista      → n renglones (`items`); ids: <id>_1 … <id>_n
 *   tabla      → filas × columnas; ids: <id>_r<fila>_c<columna>; `minFilas` filas completas para contar
 *   tablaFija  → filas con etiqueta fija (`filasFijas`) y columnas libres
 *   opciones   → una opción entre varias
 */

/* ============================== PERSONAJES ============================== */

export const PERSONAJES = {
  fiscal:          { clave: 'fiscal',          nombre: 'Fiscal',                         grupo: 'parte',     orden: 1 },
  defensor:        { clave: 'defensor',        nombre: 'Defensor/a',                     grupo: 'parte',     orden: 2 },
  acusado:         { clave: 'acusado',         nombre: 'Acusado/a',                      grupo: 'acusado',   orden: 3 },
  victima:         { clave: 'victima',         nombre: 'Víctima',                        grupo: 'declarante', orden: 4 },
  testigo1:        { clave: 'testigo1',        nombre: 'Testigo 1',                      grupo: 'declarante', orden: 5 },
  testigo2:        { clave: 'testigo2',        nombre: 'Testigo 2',                      grupo: 'declarante', orden: 6 },
  perito:          { clave: 'perito',          nombre: 'Perito',                         grupo: 'perito',    orden: 7 },
  juez_presidente: { clave: 'juez_presidente', nombre: 'Juez/a presidente',              grupo: 'juez',      orden: 8 },
  juez_preguntas:  { clave: 'juez_preguntas',  nombre: 'Juez/a de preguntas aclaratorias', grupo: 'juez',    orden: 9 },
  juez_decision:   { clave: 'juez_decision',   nombre: 'Juez/a de decisión',             grupo: 'juez',      orden: 10 },
};

export const LISTA_PERSONAJES = Object.values(PERSONAJES).sort((a, b) => a.orden - b.orden);
export const CASOS = [1, 2, 3];
export const NOMBRE_CASOS = { 1: 'El portátil del Taller Digital', 2: 'El parlante del centro vecinal', 3: 'La billetera del camarín' };

/** Personajes con ilustración en assets/img/personajes/<clave>.webp (la víctima usa silueta). */
export const PERSONAJES_CON_IMAGEN = new Set(['fiscal', 'defensor', 'acusado', 'testigo1', 'testigo2', 'perito', 'juez_presidente', 'juez_preguntas', 'juez_decision']);

/** Palabras con las que se puede escribir cada personaje al importar una lista. */
export const SINONIMOS_PERSONAJE = {
  fiscal: ['fiscal', 'fiscalia', 'ministerio publico'],
  defensor: ['defensor', 'defensora', 'defensa', 'defensoria', 'abogado defensor'],
  acusado: ['acusado', 'acusada', 'imputado', 'imputada'],
  victima: ['victima'],
  testigo1: ['testigo 1', 'testigo1', 'testigo uno', 'testigo'],
  testigo2: ['testigo 2', 'testigo2', 'testigo dos'],
  perito: ['perito', 'perita'],
  juez_presidente: ['juez presidente', 'jueza presidenta', 'presidente', 'presidenta', 'juez 1', 'juez'],
  juez_preguntas: ['juez de preguntas', 'jueza de preguntas', 'juez preguntas', 'preguntas aclaratorias', 'juez 2'],
  juez_decision: ['juez de decision', 'jueza de decision', 'juez decision', 'decision', 'juez 3'],
};

export const TEXTOS = {
  tituloApp: 'MI EXPEDIENTE JUDICIAL',
  subtituloApp: 'Preparación individual para el juicio simulado',
};

/** Qué hace cada personaje (una línea) y qué debe cuidar. */
export const FUNCION = {
  fiscal: ['Acusas y debes probar la acusación más allá de toda duda razonable.', 'Presentas a tus declarantes, contraexaminas a los de la Defensa y haces los alegatos de apertura y clausura.'],
  defensor: ['Defiendes al acusado: muestras las dudas y los vacíos de la acusación y proteges sus derechos.', 'No tienes que probar su inocencia. Decides con tu defendido si declara.'],
  acusado: ['Te presumes inocente. Puedes declarar o guardar silencio, y tu silencio no se usa en tu contra.', 'Si declaras, usas solo los hechos de tu ficha. Decides con tu defensa.'],
  victima: ['Declaras por la Fiscalía: cuentas lo que viviste y cómo descubriste lo ocurrido.', 'Respondes solo lo que te consta; lo que no sabes, lo dices.'],
  testigo1: ['Declaras lo que viste u oíste.', 'No opinas sobre la culpa ni completas lo que no sabes con suposiciones.'],
  testigo2: ['Declaras lo que viste u oíste.', 'No opinas sobre la culpa ni completas lo que no sabes con suposiciones.'],
  perito: ['Explicas un examen técnico: qué examinaste, qué concluyes y qué no puedes concluir.', 'No dices quién es culpable.'],
  juez_presidente: ['Diriges la audiencia: das la palabra, controlas los tiempos y resuelves objeciones.', 'Al final votas con los otros dos jueces.'],
  juez_preguntas: ['Haces preguntas aclaratorias, neutras y breves, después de que las partes interrogan.', 'Al final votas con los otros dos jueces.'],
  juez_decision: ['Conduces la deliberación del tribunal y lees el veredicto con sus fundamentos.', 'Tu voto vale lo mismo que el de los otros dos jueces.'],
};

/* ============================== PREGUNTAS ============================== */

const PROB = (id, titulo, ayuda) => ({ id, tipo: 'tabla', titulo, ayuda, columnas: ['Quién pregunta', 'Pregunta', 'Mi respuesta breve'], filas: 4, minFilas: 4, anchos: ['18%', '38%', '44%'] });
const CRITERIOS = (id) => ({ id, tipo: 'lista', titulo: 'Tres criterios que usaré para valorar la prueba y votar', ayuda: 'Por ejemplo: distinguir lo que alguien vio de lo que se deduce; la credibilidad del testigo; la duda razonable.', items: 3 });

const A_PARTE = (lado) => {
  const otra = lado === 'fiscal' ? 'la Defensa' : 'la Fiscalía';
  const pide = lado === 'fiscal' ? 'condenar' : 'absolver';
  return [
    { id: 'a1', tipo: 'texto', titulo: 'Mi teoría del caso', ayuda: `Qué ocurrió según tu parte y por qué el tribunal debería ${pide}. En 2 o 3 oraciones.`, limite: 70, filas: 3 },
    { id: 'a2', tipo: 'tabla', titulo: 'Tres antecedentes que usaré', ayuda: 'Un anexo o un declarante por fila. El límite es lo que esa prueba no permite demostrar.', columnas: ['Antecedente', 'Qué permite afirmar', 'Su límite'], filas: 3, minFilas: 3 },
    { id: 'a3', tipo: 'texto', titulo: 'Alegato de apertura', ayuda: lado === 'fiscal' ? 'Qué ocurrió, con qué pruebas lo demostrarás y qué pedirás. Máximo 2 minutos al leerlo.' : 'Presunción de inocencia, qué debe probar la Fiscalía y qué dudas mostrarás. Máximo 2 minutos al leerlo.', limite: 120, filas: 6 },
    { id: 'a4', tipo: 'tabla', titulo: 'Examen directo: preguntas abiertas a mis declarantes', ayuda: lado === 'fiscal' ? 'Una fila por declarante tuyo (víctima, testigos, perito). Escribe 3 preguntas abiertas, una por línea.' : 'Tu testigo y, si decidieron que declare, el acusado. 3 preguntas abiertas por declarante, una por línea.', columnas: ['Declarante', 'Mis preguntas (una por línea)'], filas: 4, minFilas: 1, anchos: ['26%', '74%'], multilinea: true },
    { id: 'a5', tipo: 'tabla', titulo: `Contraexamen: preguntas cerradas a los declarantes de ${otra}`, ayuda: 'Preguntas cortas, de sí o no, sobre lo que no vieron o no examinaron. 2 o 3 por declarante.', columnas: ['Declarante', 'Mis preguntas (una por línea)'], filas: 4, minFilas: 1, anchos: ['26%', '74%'], multilinea: true },
    { id: 'a6', tipo: 'tabla', titulo: 'Dos imprevistos u objeciones que anticipo', columnas: ['Qué podría pasar', 'Cómo respondo'], filas: 2, minFilas: 2 },
    { id: 'a7', tipo: 'texto', titulo: 'Borrador del alegato de clausura', ayuda: 'Lo ajustarás en la audiencia según lo que se pruebe. Máximo 2 minutos.', limite: 120, filas: 6 },
  ];
};

const A = {
  fiscal: A_PARTE('fiscal'),
  defensor: A_PARTE('defensor'),
  acusado: [
    { id: 'a1', tipo: 'opciones', titulo: 'Decisión acordada con mi defensa', opciones: [['declarar', 'Declararé'], ['silencio', 'Guardaré silencio'], ['audiencia', 'Lo decidiremos en la audiencia']] },
    { id: 'a1b', tipo: 'texto', titulo: '¿Por qué tomamos esa decisión?', limite: 50, filas: 2 },
    { id: 'a2', tipo: 'texto', titulo: 'Mi relato, si declaro', ayuda: 'Entre 3 y 5 oraciones, solo con hechos de tu ficha. No acuses a nadie.', limite: 100, filas: 4, noRequeridoSi: { a1: 'silencio' } },
    PROB('a3', 'Preguntas probables y mis respuestas', 'Dos de tu defensa y dos de la Fiscalía.'),
    { id: 'a4', tipo: 'lista', titulo: 'Lo que no sé y no debo inventar', items: 3 },
    { id: 'a5', tipo: 'texto', titulo: 'Mis últimas palabras', ayuda: 'Una o dos oraciones, al cierre de la audiencia.', limite: 40, filas: 2 },
  ],
  declarante: [
    { id: 'a1', tipo: 'texto', titulo: 'Quién me presenta y para qué sirve mi declaración', ayuda: 'Fiscalía o Defensa, y qué aporta tu relato al caso. 1 o 2 oraciones.', limite: 45, filas: 2 },
    { id: 'a2', tipo: 'texto', titulo: 'Mi relato inicial', ayuda: 'Entre 3 y 5 oraciones: quién soy, dónde estaba, qué percibí y qué hice después. Solo lo que percibiste.', limite: 100, filas: 4 },
    { id: 'a3', tipo: 'lista', titulo: 'Tres cosas que vi u oí', items: 3 },
    { id: 'a4', tipo: 'lista', titulo: 'Dos cosas que no sé o no vi', items: 2 },
    PROB('a5', 'Preguntas probables y mis respuestas', 'Dos de cada parte. Al menos una sobre los datos de «Solo tú lo sabes».'),
    { id: 'a6', tipo: 'texto', titulo: 'Qué haré si me preguntan algo que no sé o si me presionan', limite: 45, filas: 2 },
  ],
  perito: [
    { id: 'a1', tipo: 'texto', titulo: 'Qué me encargaron y qué examiné', limite: 45, filas: 2 },
    { id: 'a2', tipo: 'texto', titulo: 'Mi conclusión en palabras simples', ayuda: 'Con un ejemplo cotidiano que la haga comprensible.', limite: 80, filas: 4 },
    { id: 'a3', tipo: 'lista', titulo: 'Tres límites de mi examen', ayuda: 'Lo que tu examen no permite afirmar.', items: 3 },
    PROB('a4', 'Preguntas probables y mis respuestas', 'Dos de la Fiscalía y dos de la Defensa.'),
  ],
  juez_presidente: [
    { id: 'a1', tipo: 'texto', titulo: 'Mi apertura de la audiencia', ayuda: 'Identifica el caso, el delito, las partes y recuerda los derechos del acusado.', limite: 80, filas: 4 },
    { id: 'a2', tipo: 'texto', titulo: 'Orden de intervención de mi caso', ayuda: 'Las etapas y quién habla en cada una, incluidos los nombres de los declarantes en su turno.', limite: 120, filas: 5 },
    { id: 'a3', tipo: 'tabla', titulo: 'Cómo resolveré dos objeciones de ejemplo', columnas: ['Objeción', 'Mi resolución y por qué'], filas: 2, minFilas: 2 },
    CRITERIOS('a4'),
  ],
  juez_preguntas: [
    { id: 'a1', tipo: 'tabla', titulo: 'Tres puntos que probablemente habrá que aclarar', columnas: ['Punto', 'Por qué'], filas: 3, minFilas: 3 },
    { id: 'a2', tipo: 'tabla', titulo: 'Dos preguntas aclaratorias neutras por declarante', columnas: ['Declarante', 'Mis dos preguntas (una por línea)'], filas: 5, minFilas: 3, anchos: ['30%', '70%'], multilinea: true },
    { id: 'a3', tipo: 'texto', titulo: 'Aclarar o abrir un tema nuevo', ayuda: 'Explica la diferencia con un ejemplo de cada una.', limite: 60, filas: 3 },
    CRITERIOS('a4'),
  ],
  juez_decision: [
    { id: 'a1', tipo: 'tabla', titulo: 'Qué debe probar la Fiscalía y con qué prueba lo intentará', columnas: ['Hecho por probar', 'Prueba anunciada'], filas: 3, minFilas: 3 },
    { id: 'a2', tipo: 'lista', titulo: 'Tres preguntas para guiar la deliberación', items: 3 },
    { id: 'a3', tipo: 'texto', titulo: 'Mi plantilla de veredicto', ayuda: 'Con espacios en blanco para completar en la audiencia. No escribas la decisión: se toma después de escuchar la prueba.', limite: 120, filas: 6 },
    { id: 'a4', tipo: 'texto', titulo: 'Pena posible y remisión condicional', ayuda: 'Según la hoja «Qué dice la ley» de tu expediente.', limite: 50, filas: 2 },
  ],
};

export const BLOQUE_B = [
  { id: 'b1', tipo: 'lista', titulo: 'Acuerdos con mi equipo que mi reemplazo debe respetar', ayuda: 'Por ejemplo: «el acusado guardará silencio» o «la Fiscalía no me preguntará por la distancia».', items: 3, minItems: 1 },
  { id: 'b2', tipo: 'lista', titulo: 'Lo indispensable que debe decir o preguntar quien me reemplace', items: 3, minItems: 1 },
];

export const BLOQUE_C_REFLEXION = [
  { id: 'c1', tipo: 'texto', titulo: '¿Cómo cumplí mi función?', limite: 80, filas: 3, puntos: 5 },
  { id: 'c2', tipo: 'texto', titulo: '¿Qué antecedente utilicé y qué límite tenía?', limite: 80, filas: 3, puntos: 10 },
  { id: 'c3', tipo: 'texto', titulo: '¿Qué conclusión puedo fundamentar con lo que se presentó?', limite: 80, filas: 3, puntos: 5 },
];

export const BLOQUE_C_OBSERVACION = [
  { id: 'o1', tipo: 'opciones', titulo: 'Caso que observé', opciones: [['1', 'Caso 1'], ['2', 'Caso 2'], ['3', 'Caso 3']] },
  { id: 'o2', tipo: 'tablaFija', titulo: 'Funciones: un ejemplo concreto de lo que hizo cada uno', puntos: 5,
    filasFijas: ['Fiscalía', 'Defensa', 'Acusado/a', 'Víctima, testigos y perito', 'Tribunal'], columnas: ['Ejemplo observado'], anchos: ['30%', '70%'] },
  { id: 'o3', tipo: 'tablaFija', titulo: 'Pruebas y proceso justo', puntos: 5,
    filasFijas: ['Una prueba bien usada (cuál y quién)', 'Un límite que alguien señaló', 'Una garantía respetada o no respetada'], columnas: ['Lo que observé'], anchos: ['30%', '70%'] },
];

/* ============================== TRABAJO ESCRITO (v4) ============================== */
/*
 * Desde el 9 de noviembre de 2026 el estudiante responde SOLO el trabajo escrito (40 puntos), según
 * el PDF «Juicio_trabajo_escrito_y_rubricas». Los bloques A, B y C de la v3 quedan arriba como referencia:
 * sus respuestas (ids a*, b*, c*, o*) siguen guardadas en Firestore, pero ya no se muestran.
 * Ids nuevos: te1 … te7 (tablas: te2_r1_c1, listas: te3_1 …), para no mezclarse con lo anterior.
 *
 * Campos extra de cada pregunta:
 *   formato  → extensión o forma esperada (se muestra junto al título)
 *   ayuda    → «Cómo hacerlo»
 *   ejemplo  → «Puedes empezar así» (opcional)
 *   puntos   → puntaje máximo
 *   criterio → descripción del puntaje máximo en la rúbrica
 *   limite   → máximo de palabras (solo cuando el PDF lo indica)
 */

/** Fecha desde la que rige el trabajo escrito: una entrega anterior corresponde a la preparación antigua. */
export const INICIO_TRABAJO_ESCRITO = new Date('2026-11-09T03:00:00Z'); // 9 nov 2026, 00:00 hora de Chile

const aFechaLocal = (v) => {
  if (!v) return null;
  if (v instanceof Date) return v;
  if (typeof v.toDate === 'function') return v.toDate();
  if (typeof v === 'object' && typeof v.seconds === 'number') return new Date(v.seconds * 1000);
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
};

/** ¿La entrega guardada corresponde al trabajo escrito (y no a la preparación antigua)? */
export function entregaVigente(exp) {
  const d = aFechaLocal(exp?.entregadoEn);
  return Boolean(d && d >= INICIO_TRABAJO_ESCRITO);
}

export const INSTRUCCIONES_TRABAJO = {
  principal: 'Deja por escrito todo lo que tu personaje haría en el juicio. Trabaja con tu ficha (incluida la sección «Solo tú lo sabes») y con el expediente común (hojas C02 a C07 y anexos E1 a E6).',
  pasos: 'Pasos: 1) Lee el expediente común. 2) Lee y subraya tu ficha. 3) Responde en orden, con el número de cada pregunta. 4) Antes de entregar, revisa tu trabajo con la rúbrica.',
  noInventes: 'No inventes hechos: si algo no aparece, escribe «no lo sé» o «no consta». La evaluación no depende de acertar el desenlace, sino de fundamentar con las pruebas.',
};

export const CRITERIO_TRANSVERSAL = {
  titulo: 'Criterio transversal',
  criterio: 'Usa solo información del expediente común y de su ficha, sin inventar hechos; respeta las extensiones indicadas; redacta con claridad y numera sus respuestas.',
  puntos: 4,
};

export const NIVELES_RUBRICA = [
  ['Destacado (D) · 100 %', 'Cumple todo lo indicado, con precisión y fundamento.'],
  ['Logrado (L) · 75 %', 'Cumple lo indicado, con omisiones o imprecisiones menores.'],
  ['En desarrollo (ED) · 50 %', 'Cumple parcialmente: falta un elemento clave o hay errores.'],
  ['Inicial (I) · 25 %', 'Respuesta muy incompleta o con datos que no están en el caso.'],
];

/** Puntajes por nivel (D, L, ED, I) según el máximo del criterio. */
export const puntajesNivel = (max) => [max, max * 0.75, max * 0.5, max * 0.25].map((x) => String(x).replace('.', ','));

const ANTECEDENTES = (lado) => ({
  id: 'te2', tipo: 'tabla', puntos: 8,
  titulo: 'Tres antecedentes que usaré: qué prueba cada uno y cuál es su límite',
  formato: 'Tabla de 3 filas: antecedente · qué prueba · límite',
  ayuda: lado === 'fiscal'
    ? 'Elige anexos (E1–E6), registros de la cronología (C04) o declaraciones. En cada anexo lee «Qué no permite demostrar»: ese es su límite.'
    : 'Elige anexos (E1–E6), registros de la cronología (C04) o declaraciones que generen duda. Lee «Qué no permite demostrar» en cada anexo.',
  ejemplo: lado === 'fiscal' ? 'Límite: «El registro indica la hora, pero no quién hizo la anotación».' : '«Este registro muestra…, pero no demuestra…»',
  columnas: ['Antecedente', 'Qué prueba', 'Límite'], filas: 3, minFilas: 3,
  criterio: 'Tres antecedentes reales del expediente; para cada uno indica correctamente qué prueba y un límite verdadero.',
});

const CRITERIOS_JUEZ = {
  id: 'te4', tipo: 'lista', items: 3, puntos: 8,
  titulo: 'Tres criterios que usaré para valorar la prueba', formato: '3 puntos',
  ayuda: 'Por ejemplo: distinguir lo que alguien vio de lo que supone, ver si una prueba está corroborada por otra o considerar los límites de cada registro. Aplica cada criterio a un antecedente de tu caso.',
  criterio: 'Tres criterios pertinentes, cada uno aplicado a un antecedente del caso.',
};

const VOTO_JUEZ = {
  id: 'te5', tipo: 'texto', limite: 120, filas: 6, puntos: 8,
  titulo: 'Mi voto fundamentado', formato: 'Máximo 120 palabras',
  ayuda: 'Con lo que consta en el expediente común y tus criterios, decide si condenas o absuelves. Incluye qué hechos se acreditaron y con qué prueba, qué dudas quedan y si se supera la duda razonable (art. 340). No se evalúa acertar el desenlace.',
  criterio: 'Decisión clara, hechos acreditados con su prueba, dudas que quedan y aplicación correcta del estándar de duda razonable.',
};

export const TRABAJO = {
  fiscal: [
    { id: 'te1', tipo: 'texto', filas: 3, puntos: 4, titulo: 'Mi teoría del caso', formato: '2 o 3 oraciones',
      ayuda: 'Cuenta qué ocurrió según la Fiscalía respondiendo quién, qué, cuándo, dónde y cómo. Parte del «Punto de partida» de tu ficha y escríbelo con tus palabras.',
      ejemplo: '«La Fiscalía sostiene que…»',
      criterio: 'Responde quién, qué, cuándo, dónde y cómo; es coherente con la acusación (C02) y no agrega hechos.' },
    ANTECEDENTES('fiscal'),
    { id: 'te3', tipo: 'texto', limite: 120, filas: 6, puntos: 4, titulo: 'Alegato de apertura', formato: 'Máximo 120 palabras',
      ayuda: 'Di qué ocurrió, con qué declarantes y anexos lo demostrarás y qué pedirás (delito y pena en C02). Todavía no argumentes.',
      ejemplo: '«Con la venia del tribunal. Esta Fiscalía demostrará que…»',
      criterio: 'Anuncia qué ocurrió, qué prueba lo demostrará y qué pena pedirá, sin argumentar todavía.' },
    { id: 'te4', tipo: 'tabla', puntos: 4, titulo: 'Examen directo: tres preguntas abiertas para cada declarante propio y la respuesta que espero', formato: 'Una lista por declarante',
      ayuda: 'Revisa «Tus declarantes» en tu ficha. Usa preguntas que empiecen con qué, dónde, cuándo o cómo. Junto a cada una, anota la respuesta que esperas según lo que declaró en la investigación.',
      columnas: ['Declarante', 'Mis 3 preguntas abiertas y la respuesta que espero (una por línea)'], filas: 4, minFilas: 1, anchos: ['24%', '76%'], multilinea: true,
      criterio: 'Tres preguntas abiertas y no sugestivas por declarante, con respuestas esperadas coherentes con lo declarado.' },
    { id: 'te5', tipo: 'tabla', puntos: 4, titulo: 'Contraexamen: dos o tres preguntas cerradas para cada declarante de la Defensa y qué busco mostrar', formato: 'Una lista por declarante (incluye al acusado)',
      ayuda: 'Preguntas cortas, de sí o no, con un tema por pregunta, sobre los límites de lo que percibió (distancia, hora, qué no vio). No preguntes «¿por qué?».',
      columnas: ['Declarante', 'Mis preguntas cerradas (una por línea)', 'Qué busco mostrar'], filas: 4, minFilas: 1, anchos: ['20%', '50%', '30%'], multilinea: true,
      criterio: 'Preguntas cerradas y breves, con un tema cada una, dirigidas a los límites de cada declarante de la Defensa.' },
    { id: 'te6', tipo: 'tabla', puntos: 4, titulo: 'Dos argumentos u objeciones de la Defensa que anticipo y cómo los responderé', formato: '2 filas: lo que dirá la Defensa · mi respuesta',
      ayuda: 'Usa «Puntos débiles que debes anticipar» de tu ficha. Responde cada uno con un antecedente concreto.',
      columnas: ['Lo que dirá la Defensa', 'Mi respuesta'], filas: 2, minFilas: 2,
      criterio: 'Identifica dos argumentos plausibles de la Defensa y responde cada uno con un antecedente.' },
    { id: 'te7', tipo: 'texto', limite: 150, filas: 7, puntos: 8, titulo: 'Alegato de clausura', formato: 'Máximo 150 palabras',
      ayuda: 'Escríbelo suponiendo que los declarantes respondieron como anticipaste en la pregunta 4. Orden: lo que prometiste probar → «Quedó acreditado que…, según…» → «La Defensa dirá que…, pero…» → la pena que pides.',
      criterio: 'Relaciona cada hecho con una prueba específica, responde la duda que plantea la Defensa y pide una pena dentro del rango legal; es coherente con 1 y 2.' },
  ],

  defensor: [
    { id: 'te1', tipo: 'texto', filas: 3, puntos: 4, titulo: 'Mi teoría del caso', formato: '2 o 3 oraciones',
      ayuda: 'No tienes que probar la inocencia: muestra qué duda razonable queda o qué otra explicación no se descartó. No acuses a otra persona sin prueba.',
      ejemplo: '«La Defensa sostiene que la Fiscalía no puede probar que…»',
      criterio: 'Plantea una duda razonable o una explicación alternativa concreta, coherente con el expediente y sin acusar a nadie sin prueba.' },
    ANTECEDENTES('defensor'),
    { id: 'te3', tipo: 'texto', limite: 120, filas: 6, puntos: 4, titulo: 'Alegato de apertura', formato: 'Máximo 120 palabras',
      ayuda: 'Di qué no podrá probar la Fiscalía, con qué prueba lo mostrarás y qué pedirás. Recuerda la presunción de inocencia. Todavía no argumentes.',
      ejemplo: '«Con la venia del tribunal. Esta Defensa demostrará que…»',
      criterio: 'Anuncia qué no podrá probar la Fiscalía, con qué prueba lo mostrará y pide la absolución.' },
    { id: 'te4', tipo: 'tabla', puntos: 4, titulo: 'Examen directo: tres preguntas abiertas para cada declarante propio y la respuesta que espero', formato: 'Una lista por declarante (incluye al acusado)',
      ayuda: 'Revisa tu ficha. Usa preguntas que empiecen con qué, dónde, cuándo o cómo. Junto a cada una, anota la respuesta que esperas según lo que declaró en la investigación.',
      columnas: ['Declarante', 'Mis 3 preguntas abiertas y la respuesta que espero (una por línea)'], filas: 4, minFilas: 1, anchos: ['24%', '76%'], multilinea: true,
      criterio: 'Tres preguntas abiertas y no sugestivas por declarante, con respuestas esperadas coherentes con lo declarado.' },
    { id: 'te5', tipo: 'tabla', puntos: 4, titulo: 'Contraexamen: dos o tres preguntas cerradas para cada declarante de la Fiscalía y qué busco mostrar', formato: 'Una lista por declarante (incluye al perito)',
      ayuda: 'Preguntas cortas, de sí o no, con un tema por pregunta, sobre los límites de lo percibido o examinado (distancia, hora, qué no vio, qué no analizó). No preguntes «¿por qué?».',
      columnas: ['Declarante', 'Mis preguntas cerradas (una por línea)', 'Qué busco mostrar'], filas: 4, minFilas: 1, anchos: ['20%', '50%', '30%'], multilinea: true,
      criterio: 'Preguntas cerradas y breves, con un tema cada una, dirigidas a los límites de cada declarante de la Fiscalía.' },
    { id: 'te6', tipo: 'tabla', puntos: 4, titulo: 'Dos argumentos u objeciones de la Fiscalía que anticipo y cómo los responderé', formato: '2 filas: lo que dirá la Fiscalía · mi respuesta',
      ayuda: 'Piensa en la prueba más fuerte de la Fiscalía. Responde cada argumento con un antecedente o con un límite de esa prueba.',
      columnas: ['Lo que dirá la Fiscalía', 'Mi respuesta'], filas: 2, minFilas: 2,
      criterio: 'Identifica dos argumentos plausibles de la Fiscalía y responde cada uno con un antecedente o un límite.' },
    { id: 'te7', tipo: 'texto', limite: 150, filas: 7, puntos: 8, titulo: 'Alegato de clausura', formato: 'Máximo 150 palabras',
      ayuda: 'Escríbelo suponiendo que los declarantes respondieron como anticipaste en las preguntas 4 y 5. Orden: qué no se probó → por qué queda una duda razonable, con los antecedentes → presunción de inocencia → petición de absolución.',
      criterio: 'Señala qué no se probó y por qué queda una duda razonable, con antecedentes concretos; pide la absolución; es coherente con 1 y 2.' },
  ],

  acusado: [
    { id: 'te1', tipo: 'texto', filas: 2, puntos: 4, titulo: 'Qué quiero lograr con mi declaración', formato: '2 oraciones',
      ayuda: 'Vas a declarar ante el tribunal. Indica qué punto de la acusación quieres aclarar o poner en duda y con qué fin lo haces.',
      ejemplo: '«Declaro para que el tribunal sepa que…, porque…»',
      criterio: 'Identifica un punto concreto de la acusación y explica con qué fin declara sobre él.' },
    { id: 'te2', tipo: 'texto', filas: 5, puntos: 8, titulo: 'Mi declaración ante el tribunal, solo con hechos de mi ficha', formato: '3 a 5 oraciones',
      ayuda: 'Usa primera persona y este orden: dónde estaba, qué hice, qué vi y qué hice después. No acuses a nadie.',
      ejemplo: '«Ese día yo estaba en…»',
      criterio: 'Declaración en primera persona, ordenada, solo con hechos de su ficha y sin acusar a otros.' },
    { id: 'te3', tipo: 'tabla', puntos: 8, titulo: 'Cuatro preguntas probables (dos de la Defensa y dos de la Fiscalía), mis respuestas y con qué fin respondo así', formato: 'Tabla de 4 filas: quién pregunta · pregunta · mi respuesta · con qué fin',
      ayuda: 'La Defensa hace preguntas abiertas; la Fiscalía, cerradas e incómodas. Al menos una pregunta debe tocar un dato de «Solo tú lo sabes»: respóndela con la verdad de tu ficha. En la última columna explica qué buscas que el tribunal entienda con esa respuesta.',
      columnas: ['Quién pregunta', 'Pregunta', 'Mi respuesta', 'Con qué fin'], filas: 4, minFilas: 4, anchos: ['15%', '28%', '30%', '27%'],
      criterio: 'Cuatro preguntas pertinentes (2 + 2), con respuestas fieles a la ficha y su finalidad explicada; al menos una revela un dato exclusivo cuando corresponde.' },
    { id: 'te4', tipo: 'texto', filas: 2, puntos: 4, titulo: 'Un riesgo de declarar y cómo lo enfrentaré', formato: '2 oraciones',
      ayuda: 'Piensa en la pregunta de la Fiscalía que más te perjudicaría. Explica cómo la responderías sin mentir ni inventar.',
      criterio: 'Identifica un riesgo real del contraexamen y una forma veraz de enfrentarlo.' },
    { id: 'te5', tipo: 'lista', items: 3, puntos: 4, titulo: 'Lo que no sé y no debo inventar', formato: '3 puntos',
      ayuda: 'Revisa «Lo que no sabes» en tu ficha.', ejemplo: '«No sé…, porque…»',
      criterio: 'Tres límites reales de su conocimiento, sin inventar.' },
    { id: 'te6', tipo: 'texto', filas: 2, puntos: 4, titulo: 'Mis últimas palabras y con qué fin las digo', formato: '2 oraciones',
      ayuda: 'Habla con serenidad y respeto, sin atacar a nadie. Explica qué quieres que el tribunal considere antes de decidir.',
      criterio: 'Breves, respetuosas, coherentes con su versión y con una finalidad clara.' },
    { id: 'te7', tipo: 'texto', limite: 80, filas: 4, puntos: 4, titulo: 'Fuera del personaje: ¿alcanza la prueba para condenar?', formato: 'Máximo 80 palabras',
      ayuda: 'Responde ahora como estudiante. Con lo que consta en el expediente común, ¿podría la Fiscalía probar la acusación más allá de toda duda razonable? Menciona un antecedente y su límite.',
      criterio: 'Concluye sobre la duda razonable y la fundamenta con un antecedente y su límite.' },
  ],

  /* Víctima, Testigo 1 y Testigo 2: las mismas preguntas. */
  declarante: [
    { id: 'te1', tipo: 'texto', filas: 2, puntos: 4, titulo: 'Quién me presenta y para qué sirve mi declaración', formato: '1 o 2 oraciones',
      ayuda: 'En «Quiénes participan» (C03) dice si declaras por la Fiscalía o por la Defensa. Explica qué parte de la acusación ayuda a probar o a poner en duda tu declaración.',
      criterio: 'Identifica correctamente la parte que lo presenta y qué hecho apoya o pone en duda su declaración.' },
    { id: 'te2', tipo: 'texto', filas: 5, puntos: 8, titulo: 'Mi relato inicial, solo con lo que percibí', formato: '3 a 5 oraciones',
      ayuda: 'Usa primera persona y este orden: quién soy, dónde estaba, qué vi u oí y qué hice después. Usa solo «Lo que sabes». Los datos de «Solo tú lo sabes» no van aquí: se responden en la pregunta 5.',
      ejemplo: '«Soy…, ese día estaba en…»',
      criterio: 'Relato en primera persona, solo con lo percibido, sin adelantar datos exclusivos.' },
    { id: 'te3', tipo: 'lista', items: 3, puntos: 4, titulo: 'Tres cosas que vi u oí', formato: '3 puntos',
      ayuda: 'Hechos concretos, con hora o lugar si los conoces. Empieza con «Vi…» o «Escuché…», nunca con «Creo que…».',
      criterio: 'Tres percepciones concretas (vi, escuché), sin suposiciones.' },
    { id: 'te4', tipo: 'lista', items: 2, puntos: 4, titulo: 'Dos cosas que no sé o no vi', formato: '2 puntos',
      ayuda: 'Revisa «Lo que no sabes». Un buen testigo reconoce sus límites.',
      criterio: 'Dos límites reales de lo que sabe o vio.' },
    { id: 'te5', tipo: 'tabla', puntos: 8, titulo: 'Cuatro preguntas probables y mis respuestas', formato: 'Tabla de 4 filas: quién pregunta · pregunta · mi respuesta',
      ayuda: 'Escribe dos preguntas de la parte que te presenta (abiertas) y dos de la contraparte (cerradas). Al menos una debe tocar un tema de «Solo tú lo sabes»: ahí revelas ese dato.',
      columnas: ['Quién pregunta', 'Pregunta', 'Mi respuesta'], filas: 4, minFilas: 4, anchos: ['18%', '38%', '44%'],
      criterio: 'Cuatro preguntas pertinentes (abiertas de su parte, cerradas de la contraparte) con respuestas fieles a la ficha; revela un dato exclusivo cuando corresponde.' },
    { id: 'te6', tipo: 'texto', filas: 2, puntos: 4, titulo: 'Qué haré si me preguntan algo que no sé o si me presionan', formato: '2 oraciones',
      ayuda: 'Piensa en frases concretas: «No lo sé», «No lo vi», «¿Puede repetir la pregunta?».',
      criterio: 'Reconoce que no sabe sin inventar y mantiene la calma (pide que repitan, no discute).' },
    { id: 'te7', tipo: 'texto', limite: 80, filas: 4, puntos: 4, titulo: 'Fuera del personaje: ¿qué valor tiene mi declaración?', formato: 'Máximo 80 palabras',
      ayuda: 'Responde ahora como estudiante: ¿qué puede probar tu declaración y qué no? ¿Basta por sí sola para condenar o absolver? Fundamenta.',
      criterio: 'Distingue qué prueba y qué no su declaración, y explica si basta por sí sola.' },
  ],

  perito: [
    { id: 'te1', tipo: 'texto', filas: 2, puntos: 4, titulo: 'Qué me encargaron y qué examiné', formato: '2 oraciones',
      ayuda: 'Lee el informe pericial en los anexos y tu ficha. Indica quién pidió el peritaje y sobre qué objeto o registro trabajaste.',
      criterio: 'Indica correctamente el encargo y lo examinado, según el informe.' },
    { id: 'te2', tipo: 'texto', limite: 80, filas: 4, puntos: 8, titulo: 'Mi conclusión con palabras simples y un ejemplo cotidiano', formato: 'Máximo 80 palabras',
      ayuda: 'Traduce los términos técnicos (por ejemplo, «compatible» o «no concluyente»). El perito explica resultados; no dice quién es culpable.',
      ejemplo: '«En palabras simples, encontré que…; es como cuando…»',
      criterio: 'Conclusión correcta, explicada con palabras simples y un ejemplo adecuado, sin pronunciarse sobre la culpabilidad.' },
    { id: 'te3', tipo: 'lista', items: 3, puntos: 8, titulo: 'Tres límites de mi examen', formato: '3 puntos',
      ayuda: 'Piensa en qué no examinaste, qué no puede concluir el informe y qué otra explicación no descarta.',
      criterio: 'Tres límites reales del examen.' },
    { id: 'te4', tipo: 'tabla', puntos: 8, titulo: 'Cuatro preguntas probables y mis respuestas', formato: 'Tabla de 4 filas: quién pregunta · pregunta · mi respuesta',
      ayuda: 'Escribe dos preguntas de la parte que te presenta y dos de la contraparte. Al menos una debe tocar un tema de «Solo tú lo sabes».',
      columnas: ['Quién pregunta', 'Pregunta', 'Mi respuesta'], filas: 4, minFilas: 4, anchos: ['18%', '38%', '44%'],
      criterio: 'Cuatro preguntas pertinentes (2 + 2) con respuestas técnicas fieles a la ficha; revela un dato exclusivo cuando corresponde.' },
    { id: 'te5', tipo: 'texto', limite: 80, filas: 4, puntos: 8, titulo: 'Fuera del personaje: ¿cuánto aporta el informe pericial?', formato: 'Máximo 80 palabras',
      ayuda: 'Responde ahora como estudiante: ¿qué peso debería darle el tribunal al informe? ¿Qué otra prueba haría falta para llegar a una conclusión?',
      criterio: 'Valora con fundamento el peso del informe y señala qué otra prueba haría falta.' },
  ],

  juez_presidente: [
    { id: 'te1', tipo: 'texto', limite: 80, filas: 4, puntos: 8, titulo: 'Mi apertura de la audiencia', formato: 'Máximo 80 palabras',
      ayuda: 'Individualiza el caso (C02) y a las partes (C03), y recuérdale al acusado sus derechos: presunción de inocencia, guardar silencio, hablar con su defensa y decir unas últimas palabras. Apóyate en el guion de tu ficha.',
      ejemplo: '«Se abre la audiencia del juicio oral en contra de…»',
      criterio: 'Individualiza el caso y a las partes, y recuerda correctamente los derechos del acusado.' },
    { id: 'te2', tipo: 'texto', filas: 7, puntos: 4, titulo: 'Orden de intervención de mi caso', formato: 'Lista numerada',
      ayuda: 'Usa las etapas de C05 y los turnos de C03. Escribe los nombres de los declarantes en su orden.',
      ejemplo: '1. … 2. … 3. …',
      criterio: 'Orden completo y correcto de las etapas y de los declarantes de su caso.' },
    { id: 'te3', tipo: 'tabla', puntos: 8, titulo: 'Cómo resolveré dos objeciones de ejemplo', formato: '2 filas: objeción · mi resolución y por qué',
      ayuda: 'Imagina dos objeciones posibles con declarantes de tu caso (por ejemplo, una pregunta sugestiva en el examen directo o un testigo que especula). Resuelve «Ha lugar» o «No ha lugar» y explica por qué, según C06.',
      columnas: ['Objeción', 'Mi resolución y por qué'], filas: 2, minFilas: 2,
      criterio: 'Dos objeciones plausibles, resueltas con «ha lugar» o «no ha lugar» y un fundamento procesal correcto.' },
    CRITERIOS_JUEZ,
    VOTO_JUEZ,
  ],

  juez_preguntas: [
    { id: 'te1', tipo: 'tabla', puntos: 8, titulo: 'Tres puntos del caso que habría que aclarar, y por qué', formato: 'Tabla de 3 filas: punto · por qué genera duda',
      ayuda: 'Busca horas que no calzan, registros confusos, quién tenía acceso o a qué distancia estaba alguien (C04 y anexos).',
      columnas: ['Punto', 'Por qué genera duda'], filas: 3, minFilas: 3,
      criterio: 'Tres puntos que generan una duda real, con su razón y la referencia al expediente.' },
    { id: 'te2', tipo: 'tabla', puntos: 8, titulo: 'Dos preguntas aclaratorias neutras para cada declarante', formato: 'Una lista por declarante',
      ayuda: 'Que sean breves, neutras y sobre lo que el declarante ya dijo en la investigación. Bien: «¿A qué distancia estaba?». Mal: «¿No le parece raro que…?».',
      columnas: ['Declarante', 'Mis dos preguntas (una por línea)'], filas: 6, minFilas: 3, anchos: ['28%', '72%'], multilinea: true,
      criterio: 'Dos preguntas por declarante, breves y neutras, que aclaran sin abrir temas nuevos.' },
    { id: 'te3', tipo: 'texto', filas: 3, puntos: 4, titulo: 'Diferencia entre aclarar y abrir un tema nuevo, con un ejemplo de cada uno', formato: '2 oraciones',
      ayuda: 'Recuerda que el juez solo pregunta para aclarar lo ya declarado, después de las partes (art. 329).',
      criterio: 'Distingue correctamente ambos casos, con un ejemplo adecuado de cada uno.' },
    CRITERIOS_JUEZ,
    VOTO_JUEZ,
  ],

  juez_decision: [
    { id: 'te1', tipo: 'tabla', puntos: 8, titulo: 'Qué debe probar la Fiscalía y con qué prueba lo intentará', formato: 'Tabla: hecho por probar · prueba anunciada',
      ayuda: 'Separa los hechos de la acusación (C02), como qué ocurrió con el objeto y quién lo hizo, y asocia a cada uno los declarantes (C03) y los anexos que la Fiscalía usará.',
      columnas: ['Hecho por probar', 'Prueba anunciada'], filas: 4, minFilas: 2,
      criterio: 'Distingue los hechos por probar y asocia a cada uno la prueba anunciada que corresponde.' },
    { id: 'te2', tipo: 'lista', items: 3, puntos: 4, titulo: 'Tres preguntas para guiar la deliberación', formato: '3 puntos',
      ayuda: 'Que sean propias de tu caso, no generales. Piensa en lo que el tribunal tendría que resolver para decidir.',
      criterio: 'Tres preguntas específicas del caso que ordenan la deliberación.' },
    { id: 'te3', tipo: 'texto', limite: 150, filas: 7, puntos: 12, titulo: 'Mi veredicto fundamentado', formato: 'Máximo 150 palabras',
      ayuda: 'Redáctalo completo con lo que consta en el expediente común: decisión, hechos acreditados y su prueba, lo que no se acreditó y si se supera la duda razonable (art. 340).',
      ejemplo: '«El tribunal resuelve…; se acreditó que…, según…; en cambio, no se acreditó…; por lo tanto…»',
      criterio: 'Decisión clara; hechos acreditados con su prueba y hechos no acreditados; aplica bien el estándar de duda razonable; es coherente.' },
    { id: 'te4', tipo: 'texto', filas: 2, puntos: 4, titulo: 'Pena posible y remisión condicional', formato: '2 oraciones',
      ayuda: 'Usa C02 y «Qué dice la ley» (C07). Si absuelves, explica igual qué pena correspondería en caso de condena.',
      criterio: 'Indica una pena dentro del rango legal y analiza correctamente la remisión condicional.' },
    { id: 'te5', tipo: 'texto', limite: 80, filas: 4, puntos: 8, titulo: 'El voto disidente', formato: 'Máximo 80 palabras',
      ayuda: '¿Qué argumento usaría una jueza o un juez que votara distinto a ti? Fundaméntalo con un antecedente. Así muestras que consideraste la otra lectura de la prueba.',
      criterio: 'Argumento contrario plausible, fundado en un antecedente del expediente.' },
  ],
};

/** Nombre del trabajo escrito (como en el PDF) según el personaje. */
export const NOMBRE_TRABAJO = {
  fiscal: 'Fiscal', defensor: 'Defensor o defensora', acusado: 'Acusado o acusada',
  declarante: 'Víctima o testigo', perito: 'Perito', juez_presidente: 'Jueza o juez presidente',
  juez_preguntas: 'Jueza o juez de preguntas aclaratorias', juez_decision: 'Jueza o juez de decisión',
};

const claveTrabajo = (clave) => {
  const p = PERSONAJES[clave];
  if (!p) return null;
  if (TRABAJO[clave]) return clave;
  return p.grupo === 'declarante' ? 'declarante' : null;
};

/** Preguntas del trabajo escrito según el personaje. */
export function camposTrabajo(clave) {
  const k = claveTrabajo(clave);
  return k ? TRABAJO[k] : [];
}

export function nombreTrabajo(clave) {
  const k = claveTrabajo(clave);
  return k ? NOMBRE_TRABAJO[k] : '';
}

/** Filas de la rúbrica del personaje: [n, título, criterio, máximo] y al final la fila T. Total 40. */
export function rubrica(clave) {
  const filas = camposTrabajo(clave).map((c, i) => [String(i + 1), c.titulo, c.criterio, c.puntos]);
  if (filas.length) filas.push(['T', CRITERIO_TRANSVERSAL.titulo, CRITERIO_TRANSVERSAL.criterio, CRITERIO_TRANSVERSAL.puntos]);
  return filas;
}

/* ============================== SECCIONES ============================== */

/** Preguntas del bloque A de la v3 (ya no se muestran; se conserva por referencia). */
export function camposA(clave) {
  const p = PERSONAJES[clave];
  if (!p) return [];
  if (A[clave]) return A[clave];
  return A[p.grupo] || [];
}

/** Secciones que ve el estudiante, en orden. `campos` vacío = sección de lectura. */
export function secciones(clave) {
  return [
    { id: 'inicio', titulo: 'Mi personaje', corto: 'Inicio', campos: [] },
    { id: 't', titulo: 'Trabajo escrito', corto: 'Trabajo escrito', puntos: 40, campos: camposTrabajo(clave) },
    { id: 'rubrica', titulo: 'Rúbrica de evaluación', corto: 'Rúbrica', campos: [] },
    { id: 'entrega', titulo: 'Revisar, descargar y entregar', corto: 'Entregar', campos: [] },
  ];
}

/* ============================== VALIDACIÓN ============================== */

const lleno = (v) => String(v ?? '').trim().length > 0;
export const contarPalabras = (t) => (String(t ?? '').trim().match(/\S+/g) || []).length;

/** Ids de las celdas o renglones de un campo compuesto. */
export function idsDe(campo) {
  if (campo.tipo === 'lista') return Array.from({ length: campo.items }, (_, i) => `${campo.id}_${i + 1}`);
  if (campo.tipo === 'tabla') return Array.from({ length: campo.filas }, (_, f) => campo.columnas.map((_, c) => `${campo.id}_r${f + 1}_c${c + 1}`)).flat();
  if (campo.tipo === 'tablaFija') return campo.filasFijas.map((_, f) => campo.columnas.map((_, c) => `${campo.id}_r${f + 1}_c${c + 1}`)).flat();
  return [campo.id];
}

export function requerido(campo, resp = {}) {
  if (!campo.noRequeridoSi) return true;
  return !Object.entries(campo.noRequeridoSi).some(([k, v]) => resp[k] === v);
}

/** ¿El campo cuenta como respondido? */
export function completo(campo, resp = {}) {
  if (campo.tipo === 'texto' || campo.tipo === 'opciones') return lleno(resp[campo.id]);
  if (campo.tipo === 'lista') {
    const n = idsDe(campo).filter((id) => lleno(resp[id])).length;
    return n >= (campo.minItems || campo.items);
  }
  const filas = campo.tipo === 'tabla' ? campo.filas : campo.filasFijas.length;
  let completas = 0;
  for (let f = 1; f <= filas; f++) {
    if (campo.columnas.every((_, c) => lleno(resp[`${campo.id}_r${f}_c${c + 1}`]))) completas++;
  }
  return completas >= (campo.tipo === 'tabla' ? campo.minFilas : filas);
}

/** ¿El campo tiene algo escrito? (para mostrar «en curso»). */
export function tieneAlgo(campo, resp = {}) {
  return idsDe(campo).some((id) => lleno(resp[id]));
}

/** Avance del trabajo escrito. Se mantienen los nombres de la v3 (preparacion, hechosP…) que usan el panel y el guardado. */
export function avance(clave, resp = {}) {
  const campos = camposTrabajo(clave).filter((c) => requerido(c, resp));
  const hechos = campos.filter((c) => completo(c, resp)).length;
  const pct = campos.length ? Math.round((hechos / campos.length) * 100) : 0;
  const porSeccion = {};
  for (const s of secciones(clave)) {
    if (!s.campos.length) continue;
    const cs = s.campos.filter((c) => requerido(c, resp));
    porSeccion[s.id] = { hechos: cs.filter((c) => completo(c, resp)).length, total: cs.length };
  }
  return { preparacion: pct, despues: 0, total: pct, hechosP: hechos, totalP: campos.length, hechosD: 0, totalD: 0, porSeccion };
}

/* ============================== PAUTA ============================== */

export const PAUTA = [
  ['Preparación individual', 'Comprende y prepara las tareas específicas de su rol', 10, 'Bloque A'],
  ['', 'Selecciona antecedentes pertinentes sin alterar los hechos', 10, 'Bloque A'],
  ['', 'Prepara preguntas, declaración o argumentos coherentes', 10, 'Bloque A'],
  ['Participación', 'Cumple las funciones de su personaje', 10, 'Audiencia'],
  ['', 'Usa adecuadamente los antecedentes disponibles', 10, 'Audiencia'],
  ['', 'Respeta turnos, límites del rol y garantías del proceso', 10, 'Audiencia'],
  ['', 'Fundamenta lo que afirma según su función', 10, 'Audiencia'],
  ['Reflexión', 'Explica cómo cumplió su función', 5, 'Bloque C · pregunta 1'],
  ['', 'Analiza un antecedente y sus limitaciones', 10, 'Bloque C · pregunta 2'],
  ['', 'Fundamenta una conclusión sobre el juicio', 5, 'Bloque C · pregunta 3'],
  ['Observación', 'Identifica correctamente funciones de participantes', 5, 'Observación · funciones'],
  ['', 'Reconoce uso de pruebas y respeto del proceso justo', 5, 'Observación · pruebas'],
];

export const NIVELES = [
  ['10', '5', 'Destacado: cumple de manera precisa y autónoma'],
  ['8', '4', 'Logrado: cumple adecuadamente'],
  ['5', '2', 'En desarrollo: cumple parcialmente'],
  ['2', '1', 'Inicial: presenta dificultades importantes'],
  ['0', '0', 'Sin evidencia evaluable'],
];
