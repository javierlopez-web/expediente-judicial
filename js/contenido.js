/**
 * CONTENIDO PEDAGÓGICO
 * ---------------------------------------------------------------
 * Todo el texto que ve el estudiante vive aquí, separado de la interfaz.
 * IMPORTANTE: no contiene los casos ni los desenlaces. Los expedientes se
 * entregan por separado; aquí solo hay estructura, preguntas guía y ayudas breves.
 *
 * Versión 2 (simplificada): cuatro etapas y entre 10 y 12 respuestas por estudiante.
 * Los identificadores de campo de la versión anterior se reutilizan cuando la pregunta es
 * equivalente; las respuestas antiguas que cambiaron de lugar se trasladan con `migrarRespuestas`
 * y las que ya no se piden se conservan (ver `respuestasHeredadas`). Nada se borra.
 */

import { ETIQUETAS_ANTERIORES } from './heredado.js';

/* ============================== ETAPAS ============================== */

export const ETAPAS = [
  { n: 1, clave: 'personaje', titulo: 'Conozco mi personaje', descripcion: 'Mi función y los límites que debo respetar.', requierePersonaje: 'parcial' },
  { n: 2, clave: 'caso', titulo: 'Analizo mi caso', descripcion: 'Dos antecedentes y una duda importante.', requierePersonaje: false },
  { n: 3, clave: 'participacion', titulo: 'Preparo mi participación', descripcion: 'Preguntas, declaración o argumentos de mi personaje.', requierePersonaje: true },
  { n: 4, clave: 'revision', titulo: 'Reviso y descargo', descripcion: 'Reviso, descargo el Word y entrego.', requierePersonaje: true },
];

/** Número de la etapa final (revisión y entrega). Las demás son etapas con respuestas. */
export const ETAPA_REVISION = ETAPAS.length;

/* ============================== PERSONAJES ============================== */

/** Las diez plazas de cada caso. `base` agrupa la preparación; `grupo` agrupa el documento de respaldo. */
export const PERSONAJES = {
  fiscal:          { clave: 'fiscal',          nombre: 'Fiscal',                         base: 'fiscal',   grupo: 'parte',      orden: 1 },
  defensor:        { clave: 'defensor',        nombre: 'Defensor',                       base: 'defensor', grupo: 'parte',      orden: 2 },
  acusado:         { clave: 'acusado',         nombre: 'Acusado',                        base: 'acusado',  grupo: 'declarante', orden: 3 },
  victima:         { clave: 'victima',         nombre: 'Víctima',                        base: 'victima',  grupo: 'declarante', orden: 4 },
  testigo1:        { clave: 'testigo1',        nombre: 'Testigo 1',                      base: 'testigo',  grupo: 'declarante', orden: 5 },
  testigo2:        { clave: 'testigo2',        nombre: 'Testigo 2',                      base: 'testigo',  grupo: 'declarante', orden: 6 },
  perito:          { clave: 'perito',          nombre: 'Perito',                         base: 'perito',   grupo: 'declarante', orden: 7 },
  juez_presidente: { clave: 'juez_presidente', nombre: 'Juez presidente',                base: 'juez',     grupo: 'juez',       orden: 8, subrol: 'presidente' },
  juez_preguntas:  { clave: 'juez_preguntas',  nombre: 'Juez de preguntas aclaratorias', base: 'juez',     grupo: 'juez',       orden: 9, subrol: 'preguntas' },
  juez_decision:   { clave: 'juez_decision',   nombre: 'Juez de decisión',               base: 'juez',     grupo: 'juez',       orden: 10, subrol: 'decision' },
};

/** Personajes que tienen ilustración en assets/img/personajes/<clave>.webp (los demás muestran una silueta genérica). */
export const PERSONAJES_CON_IMAGEN = new Set(['fiscal', 'defensor', 'acusado', 'testigo1', 'testigo2', 'perito', 'juez_presidente', 'juez_preguntas', 'juez_decision']);

export const LISTA_PERSONAJES = Object.values(PERSONAJES).sort((a, b) => a.orden - b.orden);
export const CASOS = [1, 2, 3];

export function personajePorClave(clave) {
  return PERSONAJES[clave] || null;
}

/** ¿El personaje declara sobre los hechos (acusado, víctima, testigos, perito)? */
export function esDeclarante(clave) {
  return PERSONAJES[clave]?.grupo === 'declarante';
}

/** Palabras con las que el profesor (o el programa de sorteo) puede escribir cada personaje al importar un CSV. */
export const SINONIMOS_PERSONAJE = {
  fiscal: ['fiscal', 'fiscalia', 'ministerio publico'],
  defensor: ['defensor', 'defensora', 'defensa', 'defensoria', 'abogado defensor'],
  acusado: ['acusado', 'acusada', 'imputado', 'imputada'],
  victima: ['victima'],
  testigo1: ['testigo 1', 'testigo1', 'testigo uno', 'testigo a', 'testigo'],
  testigo2: ['testigo 2', 'testigo2', 'testigo dos', 'testigo b'],
  perito: ['perito', 'perita'],
  juez_presidente: ['juez presidente', 'jueza presidenta', 'presidente', 'presidenta', 'juez 1', 'juez1', 'juez'],
  juez_preguntas: ['juez de preguntas', 'juez preguntas', 'juez de preguntas aclaratorias', 'juez 2', 'juez2', 'preguntas aclaratorias'],
  juez_decision: ['juez de decision', 'juez decision', 'juez encargado de comunicar la decision', 'juez 3', 'juez3', 'decision'],
};

/* ============================== PORTADA / INSTRUCCIONES ============================== */

export const TEXTOS = {
  tituloApp: 'MI EXPEDIENTE JUDICIAL',
  subtituloApp: 'Preparación individual para el juicio simulado',
  evaluacionIndividual: 'Tu preparación será evaluada individualmente.',
  pendienteAsignacion: 'Pendiente de asignación',
  aviso_aprendizaje: 'Es una evaluación del aprendizaje, no una competencia de actuación.',
};

export const INSTRUCCIONES = [
  'Este expediente te ayuda a preparar, por tu cuenta, tu participación en el juicio simulado. No resuelve nada por ti: tus respuestas son tuyas.',
  'Son cuatro etapas breves: conozco mi personaje, analizo mi caso, preparo mi participación y reviso. Puedes volver a cualquiera cuando quieras. Lo que escribes se guarda solo; mira el estado de guardado en la parte superior.',
  'Los casos y sus antecedentes se entregan aparte. Esta aplicación no los contiene: consulta el expediente común y la ficha reservada de tu personaje mientras respondes.',
  'Escribe respuestas breves y precisas. Lo que importa es que fundamentes con los antecedentes y respetes los límites de tu función.',
  'El Word que descargas es tu preparación individual (se evalúa) y también tu documento de apoyo durante el juicio. Será un borrador hasta que marques tu preparación como entregada.',
  'Si no puedes ingresar, pídele ayuda al profesor.',
];

/* ============================== ETAPA 1 · CONOZCO MI PERSONAJE ============================== */

export const FUNCIONES = {
  fiscal: 'Presenta y sostiene la acusación, apoyándose en pruebas.',
  defensor: 'Protege los derechos del acusado y cuestiona la suficiencia de la acusación.',
  acusado: 'Conoce la acusación, puede ejercer su defensa y conserva el derecho a guardar silencio.',
  victima: 'Declara sobre lo que vivió, percibió o conoce directamente.',
  testigo: 'Relata aquello que observó o escuchó, sin convertir suposiciones en hechos.',
  perito: 'Explica un examen técnico, sus hallazgos y sus limitaciones.',
  juez: 'Dirige y desarrolla la audiencia según las funciones asignadas, escucha y valora las pruebas presentadas.',
};

export const FUNCION_JUEZ_ESPECIFICA = {
  presidente: 'Juez presidente: dirige el orden de la audiencia, presenta las etapas y organiza los turnos.',
  preguntas: 'Juez encargado de preguntas aclaratorias: formula preguntas pertinentes y neutrales.',
  decision: 'Juez encargado de comunicar la decisión: da a conocer la decisión del tribunal con sus fundamentos, después de la deliberación.',
};

export const NOTA_JUECES =
  'Las tres funciones de juez (presidente, preguntas aclaratorias y comunicación de la decisión) son funciones organizativas de la simulación. ' +
  'Los tres integran el tribunal, escuchan toda la prueba y participan en la deliberación.';

/** Orientación breve que acompaña a cada personaje en la etapa 1. */
export const ORIENTACION_PERSONAJE = {
  fiscal: 'Tu tarea es probar la acusación con los antecedentes del expediente. Si una prueba no alcanza, no la exageres: la carga de la prueba es de la Fiscalía.',
  defensor: 'No necesitas demostrar la inocencia: revisas si la acusación está probada y proteges los derechos del acusado, sin inventar versiones alternativas.',
  acusado: 'Trabaja solo con tu ficha reservada. Puedes declarar o guardar silencio: ninguna de las dos opciones se penaliza ni significa culpabilidad.',
  victima: 'Declara lo que tu personaje vivió o percibió según su ficha. Si algo no lo sabe o no lo recuerda, lo correcto es decirlo.',
  testigo1: 'Distingue lo que tu personaje vio u oyó de lo que supone o le contaron. Tu ficha reservada es el límite de lo que sabes.',
  testigo2: 'Distingue lo que tu personaje vio u oyó de lo que supone o le contaron. Tu ficha reservada es el límite de lo que sabes.',
  perito: 'Explica tu examen técnico con lo que dice tu ficha: qué hiciste, qué encontraste y qué no se puede concluir. El perito no decide la culpabilidad.',
  juez_presidente: 'Diriges la audiencia con imparcialidad: ordenas las intervenciones y cuidas el debido proceso. No adelantas ninguna decisión.',
  juez_preguntas: 'Tus preguntas sirven para aclarar, no para ayudar a una de las partes. Deben ser pertinentes y neutrales.',
  juez_decision: 'Preparas cómo comunicar y fundamentar la decisión del tribunal, pero la decisión se toma solo después de escuchar las pruebas y deliberar.',
};

export const ETAPA1_CAMPOS = [
  {
    id: 'e1_funcion',
    etiqueta: '¿Cuál es tu función y qué tendrás que hacer durante el juicio?',
    ayuda: 'Con tus palabras, sin copiar la definición de arriba. Di en qué momento de la audiencia intervienes y qué harás: preguntar, declarar, argumentar, dirigir o decidir.',
    filas: 4,
  },
  {
    id: 'e1_limites',
    etiqueta: '¿Qué información o límites debes respetar al intervenir?',
    ayuda: 'Piensa en lo que tu función no te permite hacer o decir, y en qué información puedes usar (el expediente y tu ficha) sin inventar nada.',
    filas: 4,
  },
];

/* ============================== PRÁCTICA DE LÍMITES (etapa 1) ============================== */

export const PRACTICA_INTRO =
  'Práctica rápida y opcional: marca una opción en cada afirmación y lee la retroalimentación. No se califica, no aparece en el Word y no es necesaria para entregar.';

export const OPCIONES_CLASIFICACION = [
  { valor: 'permitido', texto: 'Permitido' },
  { valor: 'no_permitido', texto: 'No permitido' },
  { valor: 'depende', texto: 'Depende de las circunstancias' },
];

/** Actividad de práctica: no se califica, no se incluye en el Word y no cuenta para el avance. */
export const CLASIFICACION = [
  { id: 'c1', texto: 'Un testigo puede reconocer que no vio un acontecimiento.', correcta: 'permitido',
    retro: 'Reconocer lo que no se presenció es parte de un testimonio honesto. Un testigo no debe llenar los vacíos con suposiciones.' },
  { id: 'c2', texto: 'Un perito puede declarar que una persona es culpable.', correcta: 'no_permitido',
    retro: 'El perito explica un examen técnico, sus resultados y sus límites. Decidir si alguien es culpable corresponde al tribunal, después de valorar toda la prueba.' },
  { id: 'c3', texto: 'La defensa puede cuestionar una prueba.', correcta: 'permitido',
    retro: 'Cuestionar la suficiencia, la pertinencia o la forma de obtener una prueba es parte de ejercer la defensa.' },
  { id: 'c4', texto: 'Un juez puede decidir antes de escuchar los antecedentes.', correcta: 'no_permitido',
    retro: 'El tribunal debe ser imparcial y decidir solo después de escuchar y valorar la prueba presentada. Adelantar una decisión vulnera el debido proceso.' },
  { id: 'c5', texto: 'La Fiscalía debe fundamentar la acusación.', correcta: 'permitido',
    retro: 'Más que permitido, es una obligación: la carga de la prueba recae en quien acusa.' },
  { id: 'c6', texto: 'El acusado puede guardar silencio.', correcta: 'permitido',
    retro: 'Es un derecho. Su silencio no es una confesión ni puede interpretarse en su contra.' },
  { id: 'c7', texto: 'Un testigo puede contar lo que otra persona le dijo que ocurrió.', correcta: 'depende',
    retro: 'Puede mencionarlo, pero debe aclarar que lo sabe por otra persona y no porque lo vio u oyó directamente. Esa información suele valer menos y debe tratarse con cuidado.' },
  { id: 'c8', texto: 'Una víctima puede completar con suposiciones lo que no recuerda.', correcta: 'no_permitido',
    retro: 'Declarar es relatar lo que se vivió o percibió. Si no recuerda algo, lo correcto es decirlo.' },
  { id: 'c9', texto: 'La defensa puede inventar una versión alternativa de los hechos.', correcta: 'no_permitido',
    retro: 'Defender no es inventar. La defensa trabaja con los antecedentes disponibles y puede mostrar sus dudas y limitaciones, sin crear información.' },
  { id: 'c10', texto: 'Un juez puede hacer preguntas a quien declara.', correcta: 'depende',
    retro: 'Puede hacerlo para aclarar puntos, con preguntas pertinentes y neutrales. No debe hacerlo para reemplazar el trabajo de una de las partes ni para mostrar una opinión.' },
];

/* ============================== ETAPA 2 · ANALIZO MI CASO ============================== */

export const ETAPA2_INTRO =
  'Elige los dos antecedentes del expediente que más importan para tu personaje. No toda información demuestra lo mismo: anota qué permite afirmar cada uno y qué no.';

export const ETAPA2_MATERIAL =
  'Los casos se entregan por separado. Esta aplicación no los incluye: consulta el expediente común y tu ficha reservada.';

export const ETAPA2_DECLARANTES =
  'Como declarante, distingue lo que tu personaje conoce personalmente (según su ficha reservada) de lo que solo aparece en otros documentos del expediente. Si eliges un antecedente que tu personaje no presenció, indícalo.';

export const ETAPA2_EJEMPLO = {
  antecedente: 'Una cámara muestra a una persona con un polerón gris, pero no permite identificar su rostro.',
  permite: 'Permite afirmar que alguien con un polerón gris pasó por el lugar que registra la cámara (si la hora y el lugar están confirmados).',
  limitacion: 'No permite establecer quién es esa persona: muchas personas pueden vestir igual. No se puede concluir que fue el acusado.',
  moraleja: 'Un antecedente puede ser pertinente (tiene relación con los hechos) y, aun así, tener limitaciones. Por eso importa distinguir qué demuestra y qué no.',
};

/** Dos tarjetas compactas: cada una es UNA respuesta (identificación + qué permite + qué no permite). */
export const ETAPA2_TARJETAS = [1, 2].map((n) => ({
  n,
  campos: [
    { id: `e2_a${n}_antecedente`, etiqueta: 'Antecedente', ayuda: '¿Qué documento, declaración o evidencia del expediente es?', filas: 2 },
    { id: `e2_a${n}_permite`, etiqueta: 'Qué permite afirmar', ayuda: '¿Qué hecho queda respaldado? Sé específico.', filas: 2 },
    { id: `e2_a${n}_limitacion`, etiqueta: 'Qué no permite concluir', ayuda: '¿Qué no puede demostrar por sí solo? ¿Qué faltaría para concluir más?', filas: 2 },
  ],
}));

export const ETAPA2_DUDAS = {
  id: 'e2_dudas',
  etiqueta: '¿Qué duda importante permanece sobre el caso?',
  ayuda: 'Una sola duda, en una o dos oraciones: un dato que falta, una contradicción o algo que ningún antecedente aclara.',
  filas: 3,
};

/* ============================== ETAPA 3 · PREPARO MI PARTICIPACIÓN ============================== */

const f = (id, etiqueta, extra = {}) => ({ id, etiqueta, ...extra });

/** Apartado (= una respuesta significativa para el avance). `presentacion`: 'lista' (preguntas) o 'pares' (pregunta + respuesta). */
const ap = (id, titulo, campos, extra = {}) => ({ id, titulo, campos, ...extra });

/** Pares de pregunta + respuesta para declarantes. */
const pares = (n, idP, idR, extra = {}) =>
  Array.from({ length: n }, (_, i) => [
    f(idP(i + 1), `Pregunta posible ${i + 1}`, { agrupar: `Pregunta posible ${i + 1}`, filas: 2, rol: 'pregunta', ...extra }),
    f(idR(i + 1), `Respuesta a la pregunta posible ${i + 1}`, {
      agrupar: `Pregunta posible ${i + 1}`, refPregunta: idP(i + 1), filas: 3, rol: 'respuesta',
      ayuda: 'Responde solo con lo que sabe tu personaje según su ficha. Si la ficha no lo dice, la respuesta correcta es «no lo sé».', ...extra,
    }),
  ]).flat();

const AYUDA_PREGUNTA = 'Una buena pregunta aclara hechos del expediente; no introduce información que no existe. Prepáralas breves: las leerás durante la audiencia.';
const AYUDA_TESTIGOS = 'Comienza indicando a quién va dirigida: «Al testigo 1:» o «Al testigo 2:».';
const NOTA_PROVISIONAL = 'Es provisional: podrás ajustarla después de escuchar las pruebas.';

const preguntasPartes = () => [
  ap('victima', 'Preguntas a la víctima', [
    f('e4_vic_1', 'Pregunta 1 a la víctima', { filas: 2 }),
    f('e4_vic_2', 'Pregunta 2 a la víctima', { filas: 2 })], { presentacion: 'lista' }),
  ap('testigos', 'Preguntas a los testigos', [
    f('e4_tes_1', 'Pregunta 1 a un testigo', { filas: 2, ayuda: AYUDA_TESTIGOS }),
    f('e4_tes_2', 'Pregunta 2 a un testigo', { filas: 2, ayuda: AYUDA_TESTIGOS })], { presentacion: 'lista' }),
  ap('perito', 'Pregunta al perito', [f('e4_per_1', 'Pregunta al perito', { filas: 2 })], { presentacion: 'lista' }),
];

const FISCAL = {
  titulo: 'PREPARA LA ACUSACIÓN',
  avisos: [AYUDA_PREGUNTA],
  apartados: [
    ap('postura', 'Lo que sostiene la acusación', [
      f('e4_postura', '¿Qué sostiene la acusación?', { ayuda: 'En pocas líneas: qué hecho se atribuye al acusado según el expediente. La carga de la prueba es de la Fiscalía.' })]),
    ap('antecedentes', 'Antecedentes que la respaldan', [
      f('e4_antecedentes', '¿Qué antecedentes utilizarás para respaldarla?', { ayuda: 'Puedes usar los dos que analizaste en la etapa 2: di para qué te sirve cada uno en la audiencia. No repitas el análisis completo.' })]),
    ...preguntasPartes(),
    ap('debilidad', 'Debilidad de la acusación', [
      f('e4_debilidad', '¿Qué debilidad de la acusación podría cuestionar la Defensa?', { ayuda: 'Reconocerla te permite prepararte con rigor.' })]),
    ap('conclusion', 'Conclusión provisional', [
      f('e4_conclusion', '¿Cuál sería tu conclusión provisional y por qué?')], { nota: NOTA_PROVISIONAL }),
    ap('acusado', 'Preguntas al acusado (opcional)', [
      f('e4_acu_1', 'Pregunta 1 al acusado', { filas: 2, opcional: true }),
      f('e4_acu_2', 'Pregunta 2 al acusado', { filas: 2, opcional: true })],
    { presentacion: 'lista', nota: 'El acusado puede guardar silencio: no asumas que responderá. Este apartado es opcional.' }),
  ],
};

const DEFENSOR = {
  titulo: 'PREPARA LA DEFENSA',
  avisos: [
    'La defensa no tiene la obligación de demostrar la inocencia. La acusación debe probar la culpabilidad.',
    'Defender no es inventar una explicación alternativa: se trabaja con los antecedentes disponibles.',
  ],
  apartados: [
    ap('postura', 'Postura de la defensa', [
      f('e4_postura', '¿Cuál será la postura de la Defensa?')]),
    ap('cuestiona', 'Lo que cuestiona la acusación', [
      f('e4_cuestiona', '¿Qué antecedentes o limitaciones cuestionan la acusación?', { ayuda: 'Un dato que falta, una contradicción o algo que la prueba no logra demostrar. Puedes apoyarte en lo que analizaste en la etapa 2.' })]),
    ...preguntasPartes(),
    ap('derechos', 'Derecho del acusado a declarar o guardar silencio', [
      f('e4_acu_derechos', '¿Cómo protegerás el derecho del acusado a declarar o guardar silencio?', { ayuda: 'Tu rol es protegerlo, no guiarlo para que declare.' })]),
    ap('conclusion', 'Conclusión provisional', [
      f('e4_conclusion', '¿Cuál sería tu conclusión provisional y por qué?')], { nota: NOTA_PROVISIONAL }),
    ap('acusado', 'Pregunta al acusado (opcional)', [
      f('e4_acu_preguntas', 'Si el acusado decide declarar, ¿qué le preguntarías para aclarar los hechos de su ficha?', { filas: 2, opcional: true })],
    { presentacion: 'lista', nota: 'Solo si decide declarar. Este apartado es opcional.' }),
  ],
};

const condDeclara = (resp) => (resp?.e4_decision || '') !== 'silencio';

const ACUSADO = {
  titulo: 'PREPARA TU PARTICIPACIÓN',
  avisos: [
    'Guardar silencio es un derecho y no se penaliza. No debes elaborar una confesión.',
    'Responde solo con lo que aparece en tu ficha. No escribas respuestas que supongan culpabilidad o inocencia: eso lo decide el tribunal.',
  ],
  apartados: [
    ap('acusacion', 'La acusación', [f('e4_acusacion', '¿De qué se acusa a tu personaje?')]),
    ap('version', 'Su versión', [f('e4_version', '¿Cuál es su versión según la ficha reservada?')]),
    ap('sabe', 'Lo que conoce directamente', [f('e4_sabe', '¿Qué hechos conoce directamente?')]),
    ap('desconoce', 'Lo que no sabe', [f('e4_desconoce', '¿Qué no sabe o no puede afirmar?')]),
    ap('decision', 'Su decisión', [
      f('e4_decision', '¿Decidirá declarar, guardar silencio o aún no lo ha decidido?', { tipo: 'eleccion', opciones: [
        { valor: 'declarar', texto: 'Declarará' },
        { valor: 'silencio', texto: 'Guardará silencio' },
        { valor: 'indeciso', texto: 'Aún no lo decide' }] })],
    { nota: 'Ninguna opción se penaliza. Si eliges guardar silencio, las preguntas posibles dejan de ser obligatorias.' }),
    ap('silencio', 'El derecho a guardar silencio', [
      f('e4_silencio', 'Explica brevemente qué significa ejercer el derecho a guardar silencio.')]),
    ap('preguntas', 'Si declara: preguntas posibles y respuestas', pares(2, (i) => `e4_preg_${i}`, (i) => `e4_resp_${i}`, { condicional: condDeclara }),
      { presentacion: 'pares', condicion: condDeclara, nota: 'Solo si decide declarar o aún no lo decide. Si guarda silencio, este apartado es opcional.' }),
  ],
};

const VICTIMA = {
  titulo: 'ORGANIZA TU DECLARACIÓN',
  avisos: ['Relata lo que tu personaje vivió o percibió según su ficha. Si no lo sabe o no lo recuerda, dilo: no inventes.'],
  apartados: [
    ap('ocurrio', 'Lo que ocurrió', [f('e4_ocurrio', '¿Qué ocurrió según la experiencia de tu personaje?')]),
    ap('observe', 'Lo que conoce directamente', [f('e4_observe', '¿Qué observó o conoció directamente?', { ayuda: 'Solo lo que vio, oyó o vivió personalmente.' })]),
    ap('terceros', 'Lo que sabe por terceros', [f('e4_terceros', '¿Qué información conoce por terceros?', { ayuda: 'Lo que sabe porque otra persona se lo contó. Indica quién.' })]),
    ap('noasegurar', 'Lo que no puede asegurar', [f('e4_noasegurar', '¿Qué no puede asegurar?')]),
    ap('preguntas', 'Preguntas posibles y respuestas', pares(3, (i) => `e4_preg_${i}`, (i) => `e4_resp_${i}`), { presentacion: 'pares' }),
    ap('declaracion', 'Declaración inicial', [
      f('e4_declaracion', 'Prepara una declaración inicial breve basada en su ficha.', { filas: 6, ayuda: 'Unas pocas oraciones, en primera persona, con lo que tu personaje sabe. Sin agregar detalles que la ficha no contiene.' })]),
  ],
};

const TESTIGO = {
  titulo: 'PREPARA TU TESTIMONIO',
  avisos: [
    'Relata lo que sabes, no lo que crees que debería haber ocurrido.',
    'HECHO es lo que tu personaje vio u oyó. INTERPRETACIÓN es lo que supone o concluye. Declara hechos y aclara cuando algo es solo una impresión.',
  ],
  apartados: [
    ap('donde', 'Dónde estaba y qué observó', [f('e4_donde', '¿Dónde estaba tu personaje y qué observó?', { ayuda: 'Lugar, momento y lo que vio directamente, según su ficha. Solo hechos, no interpretaciones.' })]),
    ap('escucho', 'Lo que escuchó o conoció', [f('e4_escucho', '¿Qué escuchó o conoció directamente?')]),
    ap('terceros', 'Lo que sabe por otros', [f('e4_terceros', '¿Qué sabe solo porque otros se lo contaron?', { ayuda: 'Indica quién se lo contó. En el juicio debe aclarar que no lo presenció.' })]),
    ap('nopresencio', 'Lo que no presenció', [f('e4_nopresencio', '¿Qué no presenció o no puede asegurar?', { ayuda: 'Incluye lo que podría estar suponiendo o interpretando sin haberlo comprobado.' })]),
    ap('preguntas', 'Preguntas posibles y respuestas', pares(3, (i) => `e4_qa${i}_p`, (i) => `e4_qa${i}_r`), { presentacion: 'pares' }),
    ap('declaracion', 'Declaración inicial', [
      f('e4_declaracion', 'Prepara una declaración inicial breve.', { filas: 6, ayuda: 'Unas pocas oraciones, en primera persona, con lo que tu personaje observó. Sin agregar detalles que la ficha no contiene.' })]),
  ],
};

const PERITO = {
  titulo: 'PREPARA TU INFORME TÉCNICO',
  avisos: [
    'Explica solo lo que consta en tu ficha. No se espera que sepas más ciencia que la que ella contiene.',
    'El perito no determina la culpabilidad: aporta información técnica para que el tribunal decida.',
  ],
  apartados: [
    ap('examen', 'Examen y procedimiento', [f('e4_examino', '¿Qué examinó y qué procedimiento realizó según su ficha?')]),
    ap('resultados', 'Resultados', [f('e4_resultados', '¿Qué resultados obtuvo?')]),
    ap('permite', 'Lo que permiten concluir', [f('e4_permite', '¿Qué permiten concluir los resultados?')]),
    ap('nopermite', 'Lo que no permiten concluir', [f('e4_nopermite', '¿Qué no permiten concluir?', { ayuda: 'Incluye las limitaciones del examen. Un examen técnico no declara culpables.' })]),
    ap('preguntas', 'Preguntas posibles y respuestas', pares(3, (i) => `e4_qa${i}_p`, (i) => `e4_qa${i}_r`), { presentacion: 'pares' }),
    ap('oral', 'Explicación oral', [f('e4_oral', 'Prepara una explicación oral breve para el tribunal.', { filas: 6 })]),
  ],
};

const AVISO_JUECES =
  'No redactes una decisión ni una sentencia: el tribunal decide después de escuchar toda la prueba y deliberar. Aquí solo preparas cómo vas a dirigir, preguntar y valorar.';

const AYUDA_CRITERIOS = 'Considera la presunción de inocencia, la carga de la prueba y la duda razonable.';

const JUECES = {
  presidente: [
    ap('responsabilidad', 'Mi responsabilidad', [f('e4_responsabilidad', '¿Cuál es tu responsabilidad al dirigir la audiencia?')]),
    ap('orden', 'Secuencia de intervenciones', [f('e4_rol_orden', '¿Qué secuencia de intervenciones deberás organizar?', { ayuda: 'Ordena las etapas y los turnos: quién interviene y en qué momento.' })]),
    ap('turnos', 'Participación de ambas partes', [f('e4_rol_turnos', '¿Cómo asegurarás que ambas partes puedan participar?')]),
    ap('pruebas', 'Pruebas que requieren atención', [f('e4_pruebas_atencion', '¿Qué pruebas requieren especial atención y por qué?', { ayuda: 'Qué podría demostrar cada una y qué no permite concluir por sí sola.' })]),
    ap('aclaratorias', 'Preguntas aclaratorias', [
      f('e4_acl_1', 'Pregunta aclaratoria 1', { filas: 2 }),
      f('e4_acl_2', 'Pregunta aclaratoria 2', { filas: 2 })], { presentacion: 'lista' }),
    ap('criterios', 'Criterios de valoración', [f('e4_criterios', '¿Qué criterios utilizarás para valorar las pruebas?', { ayuda: AYUDA_CRITERIOS })]),
    ap('deliberacion', 'Deliberación', [f('e4_delib', '¿Cómo participarás en la deliberación con los otros jueces?')]),
  ],
  preguntas: [
    ap('responsabilidad', 'Mi función específica', [f('e4_responsabilidad', '¿Cuál es tu función específica?')]),
    ap('cuestiones', 'Cuestiones que necesitan aclaración', [f('e4_cuestiones', '¿Qué cuestiones del expediente necesitan aclaración?')]),
    ap('neutrales', 'Preguntas neutrales', [
      f('e4_rol_vic', 'Pregunta neutral para la víctima', { filas: 2 }),
      f('e4_rol_test', 'Pregunta neutral para un testigo', { filas: 2, ayuda: 'Indica a cuál testigo va dirigida.' }),
      f('e4_rol_per', 'Pregunta neutral para el perito', { filas: 2 })], { presentacion: 'lista' }),
    ap('neutralidad', 'Por qué son neutrales', [f('e4_rol_neutral', '¿Por qué esas preguntas no deben favorecer a ninguna parte?')]),
    ap('criterios', 'Criterios y deliberación', [f('e4_criterios', '¿Qué criterios utilizarás para valorar las pruebas y participar en la deliberación?', { ayuda: AYUDA_CRITERIOS })]),
  ],
  decision: [
    ap('responsabilidad', 'Mi función específica', [f('e4_responsabilidad', '¿Cuál es tu función específica?')]),
    ap('importantes', 'Antecedentes para la valoración', [f('e4_pruebas_importantes', '¿Qué antecedentes serán importantes para la valoración?')]),
    ap('limitaciones', 'Limitaciones de esos antecedentes', [f('e4_limitaciones', '¿Qué limitaciones tienen esos antecedentes?')]),
    ap('estructura', 'Estructura de la explicación', [
      f('e4_estructura', '¿Cómo organizarás la explicación de la decisión del tribunal?', { ayuda: 'Solo la estructura: cómo comenzarás, en qué orden explicarás las pruebas valoradas y cómo cerrarás. No escribas la decisión.' })],
    { nota: 'Prepara solo la estructura de la fundamentación. La decisión final se redacta después de escuchar las pruebas y deliberar.' }),
    ap('presuncion', 'Presunción de inocencia y duda razonable', [f('e4_rol_presuncion', '¿Cómo se aplican la presunción de inocencia y la duda razonable?')]),
    ap('deliberacion', 'Deliberación', [f('e4_delib', '¿Cómo participarás en la deliberación conjunta?')]),
  ],
};

function estructuraJuez(subrol) {
  return { titulo: 'PREPARA LA AUDIENCIA', avisos: [AVISO_JUECES], avisoJuez: true, apartados: JUECES[subrol] };
}

const BASES = { fiscal: FISCAL, defensor: DEFENSOR, acusado: ACUSADO, victima: VICTIMA, testigo: TESTIGO, perito: PERITO };

/** Estructura de la etapa 3 para un personaje (o null si no hay personaje). */
export function estructuraParticipacion(clavePersonaje) {
  const p = PERSONAJES[clavePersonaje];
  if (!p) return null;
  const base = p.base === 'juez' ? estructuraJuez(p.subrol) : BASES[p.base];
  return { ...base, apartados: base.apartados.map((a, i) => ({ ...a, numero: i + 1 })) };
}

/** Lista plana de los campos de la etapa 3 de un personaje. */
export function camposParticipacion(clavePersonaje) {
  const est = estructuraParticipacion(clavePersonaje);
  if (!est) return [];
  return est.apartados.flatMap((a) => a.campos.map((c) => ({ ...c, apartadoId: a.id, apartadoTitulo: a.titulo, apartadoNumero: a.numero })));
}

/* ============================== ETAPA 4 · REVISO Y DESCARGO ============================== */

export const COMPROBACIONES = [
  { id: 'chk_funcion', texto: 'Comprendo mi función.' },
  { id: 'chk_saber', texto: 'Reconozco qué sé y qué no puedo afirmar.' },
  { id: 'chk_antecedentes', texto: 'Identifiqué antecedentes relevantes.' },
  { id: 'chk_intervencion', texto: 'Preparé las intervenciones propias de mi personaje.' },
  { id: 'chk_descarga', texto: 'Revisé y descargué mi documento.' },
];

/** Respaldo de continuidad: ya no es un formulario. Se arma solo con las respuestas existentes (ver document-export.js). */
export const RESPALDO_ADVERTENCIA =
  'Este documento también sirve de respaldo si no puedes participar: se arma solo con tus respuestas, sin agregar nada. Leído por otra persona, es un recurso de continuidad y no equivale a un testimonio presencial sometido a interrogatorio.';

/* ============================== UTILIDADES DE ESTRUCTURA ============================== */

/** ¿El campo es obligatorio? true salvo opcional o condicional no vigente. */
export function esRequerido(campo, respuestas) {
  if (campo.opcional) return false;
  if (typeof campo.condicional === 'function') return Boolean(campo.condicional(respuestas));
  return true;
}

/** Todos los campos vigentes (etapas 1 a 3) de un personaje, con su etapa. */
export function camposVigentes(clavePersonaje) {
  const p = PERSONAJES[clavePersonaje];
  return [
    ...(p ? ETAPA1_CAMPOS.map((c) => ({ ...c, etapa: 1 })) : []),
    ...ETAPA2_TARJETAS.flatMap((t) => t.campos.map((c) => ({ ...c, etapa: 2, etiqueta: `Antecedente ${t.n} · ${c.etiqueta}` }))),
    { ...ETAPA2_DUDAS, etapa: 2 },
    ...camposParticipacion(clavePersonaje).map((c) => ({ ...c, etapa: 3, etiqueta: `${c.apartadoTitulo} — ${c.etiqueta}` })),
  ];
}

/** Busca la etiqueta legible de cualquier id de campo (pendientes, conflictos y exportación). */
export function etiquetaDeCampo(id, clavePersonaje) {
  const vigente = camposVigentes(clavePersonaje).find((c) => c.id === id);
  if (vigente) return vigente.etiqueta;
  const anterior = ETIQUETAS_ANTERIORES.porPersonaje[clavePersonaje]?.[id] || ETIQUETAS_ANTERIORES.comun[id];
  if (anterior) return `${anterior} (versión anterior)`;
  if (id.startsWith('clasif_')) return 'Práctica de límites';
  return COMPROBACIONES.find((c) => c.id === id)?.texto || id;
}

/* ============================== MIGRACIÓN DESDE LA VERSIÓN ANTERIOR ============================== */

/**
 * Traslados de respuestas antiguas a las preguntas nuevas. Cada destino reúne sus fuentes
 * (en orden; si hay más de una con texto, se rotulan). Solo se usa lo que el estudiante escribió.
 */
const TRASLADOS_COMUNES = {
  e1_funcion: [['e1_funcion', 'Mi función'], ['e1_tareas', 'Mis tareas en el juicio']],
  e1_limites: [['e3_limite1', 'Límite 1'], ['e3_limite2', 'Límite 2']],
};

const TRASLADOS = {
  fiscal: { e4_antecedentes: [['e4_ant_1', 'Antecedente 1'], ['e4_ant_2', 'Antecedente 2'], ['e4_ant_3', 'Antecedente 3']] },
  defensor: { e4_cuestiona: [['e4_exp_1', 'Antecedente que requiere explicación 1'], ['e4_exp_2', 'Antecedente que requiere explicación 2'],
    ['e4_lim_1', 'Limitación o duda 1'], ['e4_lim_2', 'Limitación o duda 2'], ['e4_lim_3', 'Limitación o duda 3']] },
  acusado: {},
  victima: { e4_observe: [['e4_observe', 'Lo que observé'], ['e4_escuche', 'Lo que escuché']] },
  testigo: {
    e4_donde: [['e4_donde', 'Dónde estaba'], ['e4_vio', 'Lo que vio']],
    e4_nopresencio: [['e4_nopresencio', 'Lo que no presenció'], ['e4_interpretando', 'Lo que podría estar interpretando']],
  },
  perito: {
    e4_examino: [['e4_examino', 'Lo que examinó'], ['e4_procedimiento', 'Procedimiento']],
    e4_nopermite: [['e4_nopermite', 'Lo que no permite concluir'], ['e4_limitaciones', 'Limitaciones del examen']],
  },
  presidente: {
    e4_responsabilidad: [['e4_funcion', 'Función del tribunal']],
    e4_rol_orden: [['e4_rol_orden', 'Orden de la audiencia'], ['e4_rol_etapas', 'Cómo presentaré las etapas']],
    e4_pruebas_atencion: [['e4_pruebas', 'Pruebas disponibles'], ['e4_demostrar', 'Qué puede demostrar cada una'], ['e4_limitaciones', 'Limitaciones']],
    e4_criterios: [['e4_criterios', 'Criterios'], ['e4_escuchar', 'Lo que debo escuchar antes de decidir']],
  },
  preguntas: {
    e4_responsabilidad: [['e4_funcion', 'Función del tribunal']],
    e4_cuestiones: [['e4_acl_1', 'Pregunta aclaratoria 1'], ['e4_acl_2', 'Pregunta aclaratoria 2']],
    e4_criterios: [['e4_criterios', 'Criterios'], ['e4_delib', 'Deliberación']],
  },
  decision: {
    e4_responsabilidad: [['e4_funcion', 'Función del tribunal']],
    e4_pruebas_importantes: [['e4_pruebas', 'Pruebas disponibles'], ['e4_demostrar', 'Qué puede demostrar cada una']],
    e4_estructura: [['e4_rol_inicio', 'Cómo comenzaré'], ['e4_rol_pruebas', 'Cómo explicaré las pruebas valoradas'], ['e4_rol_cierre', 'Cómo comunicaré la decisión']],
  },
};

/** Fiscal y Defensa: las cuatro preguntas antiguas a los testigos pasan a las dos nuevas (identificando al destinatario). */
const TESTIGOS_ANTIGUOS = [['e4_t1_1', 'Al testigo 1'], ['e4_t1_2', 'Al testigo 1'], ['e4_t2_1', 'Al testigo 2'], ['e4_t2_2', 'Al testigo 2']];

export const MARCA_MIGRACION = '_migracion';
const VERSION_MIGRACION = 'v2';

const txt = (v) => String(v ?? '').trim();

function trasladosDe(clavePersonaje) {
  const p = PERSONAJES[clavePersonaje];
  if (!p) return { ...TRASLADOS_COMUNES };
  return { ...TRASLADOS_COMUNES, ...(p.base === 'juez' ? TRASLADOS[p.subrol] : TRASLADOS[p.base]) };
}

/**
 * Devuelve { cambios, fuentes }: los valores que deben escribirse en las preguntas nuevas a partir de respuestas
 * de la versión anterior, y los ids antiguos ya trasladados. Es pura e idempotente: si el expediente ya fue
 * migrado para este personaje, o si la pregunta nueva ya tiene texto propio, no cambia nada.
 */
export function migrarRespuestas(clavePersonaje, resp = {}) {
  const cambios = {};
  const fuentes = new Set();
  const marca = `${VERSION_MIGRACION}:${clavePersonaje || '-'}`;
  for (const [destino, lista] of Object.entries(trasladosDe(clavePersonaje))) {
    lista.forEach(([id]) => { if (id !== destino) fuentes.add(id); });
  }
  const p = PERSONAJES[clavePersonaje];
  const esParte = p && (p.base === 'fiscal' || p.base === 'defensor');
  // Solo las dos primeras preguntas antiguas a testigos con texto pasan a las nuevas; las demás quedan como heredadas.
  const testigosUsados = esParte ? TESTIGOS_ANTIGUOS.filter(([id]) => txt(resp[id])).slice(0, 2) : [];
  testigosUsados.forEach(([id]) => fuentes.add(id));
  if (resp[MARCA_MIGRACION] === marca) return { cambios, fuentes };

  for (const [destino, lista] of Object.entries(trasladosDe(clavePersonaje))) {
    const conTexto = lista.filter(([id]) => txt(resp[id]));
    const hayFuenteExterna = conTexto.some(([id]) => id !== destino);
    if (!hayFuenteExterna) continue;
    const actual = txt(resp[destino]);
    const soloPropio = conTexto.length === 1 && conTexto[0][0] === destino;
    if (soloPropio) continue;
    if (actual && !lista.some(([id]) => id === destino)) continue; // ya tiene texto nuevo: no se toca
    if (actual && conTexto.every(([id]) => id === destino || actual.includes(txt(resp[id])))) continue; // ya reunido antes
    const valor = conTexto.length === 1 ? txt(resp[conTexto[0][0]]) : conTexto.map(([id, rotulo]) => `${rotulo}: ${txt(resp[id])}`).join('\n\n');
    if (valor !== actual) cambios[destino] = valor;
  }
  if (esParte && !txt(resp.e4_tes_1) && !txt(resp.e4_tes_2)) {
    const antiguas = testigosUsados.map(([id, a]) => `${a}: ${txt(resp[id])}`);
    if (antiguas[0]) cambios.e4_tes_1 = antiguas[0];
    if (antiguas[1]) cambios.e4_tes_2 = antiguas[1];
  }
  if (Object.keys(cambios).length) cambios[MARCA_MIGRACION] = marca;
  return { cambios, fuentes };
}

/** Respuestas con la migración aplicada (sin modificar el original). Para mostrar y calcular. */
export function respuestasVigentes(clavePersonaje, resp = {}) {
  const { cambios } = migrarRespuestas(clavePersonaje, resp);
  return Object.keys(cambios).length ? { ...resp, ...cambios } : resp;
}

/**
 * Respuestas escritas en la versión anterior que ya no se piden y no se trasladaron.
 * Se conservan y se muestran (estudiante y profesor) para que nada se pierda en silencio.
 */
export function respuestasHeredadas(clavePersonaje, resp = {}) {
  const vigentes = new Set(camposVigentes(clavePersonaje).map((c) => c.id));
  const { fuentes } = migrarRespuestas(clavePersonaje, resp);
  return Object.entries(resp)
    .filter(([id, v]) => txt(v) && !vigentes.has(id) && !fuentes.has(id)
      && !id.startsWith('_') && !id.startsWith('clasif_') && !id.startsWith('chk_'))
    .map(([id, v]) => ({ id, etiqueta: (ETIQUETAS_ANTERIORES.porPersonaje[clavePersonaje]?.[id] || ETIQUETAS_ANTERIORES.comun[id] || id), texto: txt(v) }));
}

/* ============================== DECISIONES ANTICIPADAS (jueces) ============================== */

/**
 * Detecta redacción de una decisión anticipada en los campos de los jueces.
 * Es una advertencia pedagógica (heurística), no una prohibición automática.
 */
const PATRON_DECISION = /(\b(declaro|declaramos)\s+(a\s+\S+\s+)?(culpable|inocente)\b)|(\b(condeno|condenamos|absuelvo|absolvemos)\b)|(\bse\s+(condena|absuelve)\b)|(\bel\s+tribunal\s+(resuelve|decide|falla)\s+(condenar|absolver)\b)|(\bfallo\s*:)/i;

export function detectarDecisionAnticipada(texto) {
  return PATRON_DECISION.test(String(texto || ''));
}
