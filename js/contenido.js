/**
 * CONTENIDO · versión 3 (noviembre 2026)
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

/* ============================== SECCIONES ============================== */

/** Preguntas del bloque A según el personaje. */
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
    { id: 'a', titulo: 'A · Mi preparación', corto: 'Preparación', bloque: 'A', puntos: 30, campos: camposA(clave),
      intro: 'Antes de la audiencia. Se evalúa con 30 puntos: comprender tus tareas, elegir antecedentes sin alterar los hechos y preparar preguntas, declaración o argumentos coherentes.' },
    { id: 'b', titulo: 'B · Para mi reemplazo', corto: 'Reemplazo', bloque: 'B', campos: BLOQUE_B,
      intro: 'No se evalúa. Si faltas a la audiencia, quien te reemplace leerá tu ficha, tu bloque A y esto. Sé breve.' },
    { id: 'c', titulo: 'C · Reflexión', corto: 'Reflexión', bloque: 'C', puntos: 20, campos: BLOQUE_C_REFLEXION, despues: true,
      intro: 'Después de tu audiencia. Se evalúa con 20 puntos.' },
    { id: 'o', titulo: 'C · Observación de otro caso', corto: 'Observación', bloque: 'C', puntos: 10, campos: BLOQUE_C_OBSERVACION, despues: true,
      intro: 'Mientras observas la audiencia de otro caso. Anota hechos concretos, no opiniones generales. Se evalúa con 10 puntos.' },
    { id: 'pauta', titulo: 'Pauta de evaluación', corto: 'Pauta', campos: [] },
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

/** Avance: preparación (A + B) y después (C). Porcentajes enteros. */
export function avance(clave, resp = {}) {
  const prep = [...camposA(clave), ...BLOQUE_B].filter((c) => requerido(c, resp));
  const desp = [...BLOQUE_C_REFLEXION, ...BLOQUE_C_OBSERVACION];
  const hechosP = prep.filter((c) => completo(c, resp)).length;
  const hechosD = desp.filter((c) => completo(c, resp)).length;
  const porSeccion = {};
  for (const s of secciones(clave)) {
    if (!s.campos.length) continue;
    const cs = s.campos.filter((c) => requerido(c, resp));
    porSeccion[s.id] = { hechos: cs.filter((c) => completo(c, resp)).length, total: cs.length };
  }
  return {
    preparacion: prep.length ? Math.round((hechosP / prep.length) * 100) : 0,
    despues: Math.round((hechosD / desp.length) * 100),
    total: Math.round(((hechosP + hechosD) / (prep.length + desp.length)) * 100),
    hechosP, totalP: prep.length, hechosD, totalD: desp.length, porSeccion,
  };
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
