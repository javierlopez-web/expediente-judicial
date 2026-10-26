/**
 * CONTENIDO PEDAGÓGICO
 * ---------------------------------------------------------------
 * Todo el texto que ve el estudiante vive aquí, separado de la interfaz.
 * IMPORTANTE: no contiene los casos ni los desenlaces. Los expedientes se
 * entregan por separado; aquí solo hay estructura, preguntas guía y ayudas breves.
 */

/* ============================== ETAPAS ============================== */

export const ETAPAS = [
  { n: 1, clave: 'funcion', titulo: 'Mi función', descripcion: 'Qué hace mi personaje y por qué importa.', requierePersonaje: true },
  { n: 2, clave: 'antecedentes', titulo: 'Los antecedentes', descripcion: 'Qué permite afirmar cada antecedente… y qué no.', requierePersonaje: false },
  { n: 3, clave: 'limites', titulo: 'Los límites del personaje', descripcion: 'Lo que puedo y no puedo hacer.', requierePersonaje: 'parcial' },
  { n: 4, clave: 'preparacion', titulo: 'Mi preparación', descripcion: 'El trabajo propio de mi personaje.', requierePersonaje: true },
  { n: 5, clave: 'respaldo', titulo: 'Mi respaldo', descripcion: 'Documento de continuidad de mi audiencia.', requierePersonaje: true },
  { n: 6, clave: 'entrega', titulo: 'Revisión y entrega', descripcion: 'Reviso, descargo y entrego.', requierePersonaje: true },
];

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
  'Recorre las seis etapas en orden, aunque puedes volver a cualquiera cuando quieras. Lo que escribes se guarda solo; mira el estado de guardado en la parte superior.',
  'Los casos y sus antecedentes se entregan aparte. Esta aplicación no los contiene: consulta el material que te dio el profesor mientras respondes.',
  'No hay puntos, premios por rapidez ni penalizaciones por demorarte. Lo que importa es que fundamentes con los antecedentes y respetes los límites de tu función.',
  'Puedes descargar un Word en cualquier momento (será un borrador hasta que marques tu preparación como entregada).',
  'Si no puedes ingresar o olvidaste tu contraseña, pídele al profesor que genere una nueva.',
];

/* ============================== ETAPA 1 ============================== */

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

export const ETAPA1_CAMPOS = [
  {
    id: 'e1_funcion',
    etiqueta: 'Explica con tus palabras cuál será tu función.',
    ayuda: 'Piensa: ¿quién eres en el juicio? ¿Qué hace tu personaje y qué no hace? Evita copiar la definición de arriba.',
  },
  {
    id: 'e1_tareas',
    etiqueta: '¿Qué tareas concretas deberás cumplir durante el juicio?',
    ayuda: 'Ordénalas según el momento de la audiencia: ¿cuándo intervienes? ¿Preguntas, declaras, argumentas, diriges?',
  },
  {
    id: 'e1_importancia',
    etiqueta: '¿Por qué tu participación es importante para que el proceso sea justo?',
    ayuda: 'Relaciona tu función con el debido proceso, la presunción de inocencia o la carga de la prueba.',
  },
];

/* ============================== ETAPA 2 ============================== */

export const ETAPA2_INTRO =
  'Los antecedentes permiten construir preguntas, declaraciones o argumentos. No toda información demuestra lo mismo.';

export const ETAPA2_MATERIAL =
  'Los casos se entregan por separado. Esta aplicación no los incluye: consulta el material que te dio el profesor.';

export const ETAPA2_EJEMPLO = {
  antecedente: 'Una cámara muestra a una persona con un polerón gris, pero no permite identificar su rostro.',
  permite: 'Permite afirmar que alguien con un polerón gris pasó por el lugar que registra la cámara (si la hora y el lugar están confirmados).',
  limitacion: 'No permite establecer quién es esa persona: muchas personas pueden vestir igual. No se puede concluir que fue el acusado.',
  moraleja: 'Un antecedente puede ser pertinente (tiene relación con los hechos) y, aun así, tener limitaciones. Por eso importa distinguir qué demuestra y qué no.',
};

export const ETAPA2_TARJETAS = [1, 2, 3].map((n) => ({
  n,
  campos: [
    { id: `e2_a${n}_antecedente`, etiqueta: 'Antecedente', ayuda: 'Anótalo con precisión: ¿qué documento, declaración o evidencia es?' },
    { id: `e2_a${n}_permite`, etiqueta: 'Qué permite afirmar', ayuda: '¿Qué hecho queda respaldado? Sé específico.' },
    { id: `e2_a${n}_limitacion`, etiqueta: 'Qué limitación presenta (qué no permite concluir)', ayuda: '¿Qué no puede demostrar por sí solo? ¿Qué falta para concluir más?' },
  ],
}));

export const ETAPA2_DUDAS = {
  id: 'e2_dudas',
  etiqueta: '¿Qué dudas o contradicciones encuentras?',
  ayuda: 'Compara los antecedentes entre sí: ¿hay datos que no coinciden o que faltan?',
};

/* ============================== ETAPA 3 ============================== */

export const ETAPA3_INTRO =
  'Cada función tiene límites. Respetarlos no es un detalle: es lo que permite que el juicio sea justo para todos.';

export const OPCIONES_CLASIFICACION = [
  { valor: 'permitido', texto: 'Permitido' },
  { valor: 'no_permitido', texto: 'No permitido' },
  { valor: 'depende', texto: 'Depende de las circunstancias' },
];

/** Actividad de práctica: no se califica, no se incluye en el Word. */
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

export const ETAPA3_CAMPOS = [
  { id: 'e3_limite1', etiqueta: 'Límite 1 que debes respetar en tu propio personaje', ayuda: 'Piensa en algo que tu función NO te permite hacer o decir.' },
  { id: 'e3_limite2', etiqueta: 'Límite 2 que debes respetar en tu propio personaje', ayuda: '¿Qué podría pasar si no lo respetaras? Relaciónalo con la justicia del proceso.' },
];

/* ============================== ETAPA 4 ============================== */

const f = (id, etiqueta, extra = {}) => ({ id, etiqueta, ...extra });

const preguntasA = (prefijo, n, destinatario, extra = {}) =>
  Array.from({ length: n }, (_, i) =>
    f(`${prefijo}_${i + 1}`, `Pregunta ${i + 1} ${destinatario}`, extra));

/** Pares de pregunta + respuesta (testigos y perito). */
const pares = (n) =>
  Array.from({ length: n }, (_, i) => [
    f(`e4_qa${i + 1}_p`, `Pregunta posible ${i + 1}`, { agrupar: `Pregunta posible ${i + 1}`, filas: 2 }),
    f(`e4_qa${i + 1}_r`, `Respuesta a la pregunta posible ${i + 1}`, { agrupar: `Pregunta posible ${i + 1}`, ayuda: 'Responde solo con lo que sabe tu personaje según su ficha.' }),
  ]).flat();

const AYUDA_PREGUNTA = 'Una buena pregunta permite aclarar hechos; no debe inventar información.';

const FISCAL = {
  titulo: 'CONSTRUYE TU ACUSACIÓN',
  avisos: [AYUDA_PREGUNTA],
  apartados: [
    { id: 'postura', titulo: 'Mi postura inicial', campos: [
      f('e4_postura', '¿Qué sostendrá la Fiscalía y en qué se apoya, según los antecedentes de tu expediente?', { ayuda: 'Indica qué acusas y con qué pruebas cuentas. Recuerda que la carga de la prueba recae en la Fiscalía.' })] },
    { id: 'antecedentes', titulo: 'Tres antecedentes que utilizaré', campos: [1, 2, 3].map((n) =>
      f(`e4_ant_${n}`, `Antecedente ${n} y para qué lo utilizaré`, { ayuda: 'Di cuál es, qué permite afirmar y qué no permite concluir.' })) },
    { id: 'victima', titulo: 'Preguntas a la víctima', campos: preguntasA('e4_vic', 2, 'a la víctima') },
    { id: 'testigos', titulo: 'Preguntas a los testigos', campos: [
      ...preguntasA('e4_t1', 2, 'al testigo 1'), ...preguntasA('e4_t2', 2, 'al testigo 2')] },
    { id: 'perito', titulo: 'Preguntas al perito', campos: preguntasA('e4_per', 2, 'al perito') },
    { id: 'acusado', titulo: 'Preguntas al acusado, si decide declarar', nota: 'El acusado puede guardar silencio: no asumas que responderá. Este apartado es opcional.',
      campos: preguntasA('e4_acu', 2, 'al acusado', { opcional: true }) },
    { id: 'debilidad', titulo: 'Una posible debilidad de la acusación', campos: [
      f('e4_debilidad', '¿Qué punto de tu acusación podría ser cuestionado y por qué?', { ayuda: 'Reconocer una debilidad también es preparar tu participación con rigor.' })] },
    { id: 'conclusion', titulo: 'Mi conclusión provisional', nota: 'Es provisional: podrás revisarla después de escuchar las pruebas.', campos: [
      f('e4_conclusion', 'Con lo que sé hasta ahora, ¿qué concluiría la Fiscalía y con qué fundamento?')] },
  ],
};

const DEFENSOR = {
  titulo: 'PREPARA LA DEFENSA',
  avisos: [
    'La defensa no tiene la obligación de demostrar la inocencia. La acusación debe probar la culpabilidad.',
    'Defender no es inventar una versión alternativa: se trabaja con los antecedentes disponibles.',
  ],
  apartados: [
    { id: 'postura', titulo: 'Postura de la defensa', campos: [
      f('e4_postura', '¿Cuál es la postura de la defensa frente a la acusación, según los antecedentes de tu expediente?')] },
    { id: 'explicar', titulo: 'Antecedentes que requieren explicación', campos: [1, 2].map((n) =>
      f(`e4_exp_${n}`, `Antecedente ${n} que requiere explicación`, { ayuda: '¿Qué dice el antecedente y qué explicación posible hay, sin inventar información?' })) },
    { id: 'limitaciones', titulo: 'Tres limitaciones o dudas de la acusación', campos: [1, 2, 3].map((n) =>
      f(`e4_lim_${n}`, `Limitación o duda ${n}`, { ayuda: 'Puede ser un dato que falta, una contradicción o algo que la prueba no logra demostrar.' })) },
    { id: 'victima', titulo: 'Preguntas a la víctima', campos: preguntasA('e4_vic', 2, 'a la víctima') },
    { id: 'testigos', titulo: 'Preguntas a los testigos', campos: [
      ...preguntasA('e4_t1', 2, 'al testigo 1'), ...preguntasA('e4_t2', 2, 'al testigo 2')] },
    { id: 'perito', titulo: 'Preguntas al perito', campos: preguntasA('e4_per', 2, 'al perito') },
    { id: 'acusado', titulo: 'Preparación de la participación del acusado',
      nota: 'El acusado tiene derecho a guardar silencio. Tu rol es protegerlo, no guiarlo para que declare.',
      campos: [
        f('e4_acu_derechos', '¿Qué debe saber el acusado sobre su derecho a declarar o a guardar silencio?'),
        f('e4_acu_preguntas', 'Si el acusado decide declarar: ¿qué preguntas le harías para aclarar los hechos de su ficha?', { opcional: true }),
      ] },
    { id: 'conclusion', titulo: 'Conclusión provisional', nota: 'Es provisional: podrás revisarla después de escuchar las pruebas.', campos: [
      f('e4_conclusion', 'Con lo que sé hasta ahora, ¿qué plantearía la defensa y con qué fundamento?')] },
  ],
};

const condDeclara = (resp) => (resp?.e4_decision || '') !== 'silencio';

const ACUSADO = {
  titulo: 'PREPARA TU PARTICIPACIÓN',
  avisos: [
    'Guardar silencio es un derecho y no se penaliza. No debes elaborar una confesión.',
    'Responde solo con lo que aparece en la ficha de tu personaje: no inventes información.',
  ],
  apartados: [
    { id: 'acusacion', titulo: '¿De qué se acusa a mi personaje?', campos: [
      f('e4_acusacion', 'Explica de qué se acusa a tu personaje, con tus palabras.')] },
    { id: 'version', titulo: '¿Cuál es la versión que aparece en mi ficha?', campos: [
      f('e4_version', 'Resume la versión de los hechos que aparece en la ficha de tu personaje.')] },
    { id: 'sabe', titulo: '¿Qué sabe mi personaje?', campos: [
      f('e4_sabe', 'Anota lo que tu personaje sabe o vivió directamente, según su ficha.')] },
    { id: 'desconoce', titulo: '¿Qué desconoce?', campos: [
      f('e4_desconoce', 'Anota lo que tu personaje no sabe o no presenció.')] },
    { id: 'aclarar', titulo: '¿Qué antecedentes de su ficha podría aclarar?', campos: [1, 2, 3].map((n) =>
      f(`e4_aclarar_${n}`, `Antecedente ${n} de la ficha y qué podría aclarar`, { ayuda: 'Solo aclara lo que la ficha permite aclarar.' })) },
    { id: 'decision', titulo: '¿Ejercerá su derecho a declarar en esta simulación?',
      nota: 'Elegir guardar silencio no se penaliza. Si eliges guardar silencio, los apartados 7 y 8 pasan a ser opcionales.',
      campos: [
        f('e4_decision', 'Decisión de tu personaje', { tipo: 'eleccion', opciones: [
          { valor: 'declarar', texto: 'Sí, declarará' },
          { valor: 'silencio', texto: 'No, ejercerá su derecho a guardar silencio' },
          { valor: 'indeciso', texto: 'Todavía no lo decide' }] }),
        f('e4_silencio', 'Explica con tus palabras qué significa el derecho a guardar silencio y por qué existe.'),
      ] },
    { id: 'preguntas', titulo: 'Si decide declarar, ¿qué preguntas podría recibir?', condicion: condDeclara, campos: [1, 2, 3].map((n) =>
      f(`e4_preg_${n}`, `Pregunta posible ${n}`, { condicional: condDeclara })) },
    { id: 'respuestas', titulo: '¿Cómo respondería sin inventar información?', condicion: condDeclara, campos: [1, 2, 3].map((n) =>
      f(`e4_resp_${n}`, `Respuesta a la pregunta posible ${n}`, { condicional: condDeclara, refPregunta: `e4_preg_${n}`,
        ayuda: 'Si tu ficha no lo dice, tu personaje puede responder que no lo sabe.' })) },
  ],
};

const VICTIMA = {
  titulo: 'ORGANIZA TU DECLARACIÓN',
  avisos: ['Relata lo que viviste o percibiste, según tu ficha; no lo que crees que debería haber ocurrido.'],
  apartados: [
    { id: 'ocurrio', titulo: 'Qué ocurrió según mi experiencia', campos: [f('e4_ocurrio', 'Cuenta lo que ocurrió según la ficha de tu personaje.')] },
    { id: 'observe', titulo: 'Qué observé directamente', campos: [f('e4_observe', 'Anota lo que tu personaje vio por sí mismo.')] },
    { id: 'escuche', titulo: 'Qué escuché', campos: [f('e4_escuche', 'Anota lo que tu personaje oyó directamente.')] },
    { id: 'terceros', titulo: 'Qué información conozco por terceros', campos: [f('e4_terceros', 'Anota lo que tu personaje sabe porque otra persona se lo contó. Indica quién.')] },
    { id: 'noasegurar', titulo: 'Qué no puedo asegurar', campos: [f('e4_noasegurar', 'Anota lo que tu personaje no recuerda, no vio o no puede confirmar.')] },
    { id: 'preguntas', titulo: 'Cinco preguntas posibles', campos: [1, 2, 3, 4, 5].map((n) => f(`e4_preg_${n}`, `Pregunta posible ${n}`)) },
    { id: 'respuestas', titulo: 'Respuestas basadas en mi ficha', campos: [1, 2, 3, 4, 5].map((n) =>
      f(`e4_resp_${n}`, `Respuesta a la pregunta posible ${n}`, { refPregunta: `e4_preg_${n}`, ayuda: 'Si tu ficha no lo dice, responde que no lo sabes.' })) },
    { id: 'declaracion', titulo: 'Declaración principal', campos: [f('e4_declaracion', 'Escribe la declaración principal que presentarás ante el tribunal.', { filas: 8 })] },
  ],
};

const TESTIGO = {
  titulo: 'PREPARA TU TESTIMONIO',
  avisos: ['Relata lo que sabes, no lo que crees que debería haber ocurrido.'],
  fijo: true,
  apartados: [
    { id: 'donde', titulo: 'Dónde estaba mi personaje', campos: [f('e4_donde', '¿Dónde estaba tu personaje y en qué momento, según su ficha?')] },
    { id: 'vio', titulo: 'Qué vio', campos: [f('e4_vio', 'Anota lo que tu personaje vio directamente.')] },
    { id: 'escucho', titulo: 'Qué escuchó', campos: [f('e4_escucho', 'Anota lo que tu personaje oyó directamente.')] },
    { id: 'antesdespues', titulo: 'Qué ocurrió antes o después', campos: [f('e4_antesdespues', 'Anota lo que tu personaje sabe de lo ocurrido antes o después de los hechos.')] },
    { id: 'nopresencio', titulo: 'Qué no presenció', campos: [f('e4_nopresencio', 'Anota lo que tu personaje no vio ni oyó, aunque se lo hayan contado.')] },
    { id: 'interpretando', titulo: 'Qué podría estar interpretando', campos: [f('e4_interpretando', '¿Qué cosas podría estar suponiendo o interpretando tu personaje sin haberlas comprobado?', { ayuda: 'Distingue hechos (lo que percibió) de interpretaciones (lo que concluye).' })] },
    { id: 'preguntas', titulo: 'Cinco preguntas posibles con sus respuestas', campos: pares(5) },
    { id: 'declaracion', titulo: 'Declaración principal', campos: [f('e4_declaracion', 'Escribe la declaración principal que presentarás ante el tribunal.', { filas: 8 })] },
  ],
};

const PERITO = {
  titulo: 'PREPARA TU INFORME TÉCNICO',
  avisos: ['Explica solo lo que consta en tu ficha. No se espera que sepas más ciencia que la que ella contiene.'],
  apartados: [
    { id: 'examino', titulo: 'Qué examinó', campos: [f('e4_examino', '¿Qué examinó tu personaje, según su ficha?')] },
    { id: 'procedimiento', titulo: 'Qué procedimiento realizó', campos: [f('e4_procedimiento', 'Describe el procedimiento tal como aparece en la ficha.')] },
    { id: 'resultados', titulo: 'Qué resultados obtuvo', campos: [f('e4_resultados', 'Anota los resultados del examen.')] },
    { id: 'permite', titulo: 'Qué permite concluir el informe', campos: [f('e4_permite', '¿Qué se puede afirmar a partir de estos resultados?')] },
    { id: 'nopermite', titulo: 'Qué no permite concluir', campos: [f('e4_nopermite', '¿Qué NO se puede afirmar a partir de estos resultados?', { ayuda: 'Un examen técnico no declara culpables: aporta información para que otros decidan.' })] },
    { id: 'limitaciones', titulo: 'Qué limitaciones presenta el examen', campos: [f('e4_limitaciones', 'Anota las limitaciones del examen.')] },
    { id: 'preguntas', titulo: 'Cinco preguntas posibles con sus respuestas', campos: pares(5) },
    { id: 'oral', titulo: 'Explicación oral breve de los resultados', campos: [f('e4_oral', 'Redacta una explicación breve y clara, como si se la contaras al tribunal.', { filas: 6 })] },
  ],
};

const AVISO_JUECES =
  'No redactes una decisión: el tribunal decide después de escuchar toda la prueba y deliberar. Aquí solo preparas cómo vas a escuchar, preguntar y fundamentar.';

const JUEZ_COMUN = [
  { id: 'funcion', titulo: 'Función del tribunal', campos: [f('e4_funcion', 'Explica con tus palabras qué hace el tribunal y por qué debe ser imparcial.')] },
  { id: 'pruebas', titulo: 'Pruebas disponibles', campos: [f('e4_pruebas', 'Lista las pruebas que aparecen en tu expediente.')] },
  { id: 'demostrar', titulo: 'Qué puede demostrar cada una', campos: [f('e4_demostrar', 'Para cada prueba, indica qué podría demostrar.')] },
  { id: 'limitaciones', titulo: 'Qué limitaciones presenta', campos: [f('e4_limitaciones', 'Para cada prueba, indica qué no permite concluir por sí sola.')] },
  { id: 'aclaratorias', titulo: 'Preguntas aclaratorias', campos: preguntasA('e4_acl', 2, 'aclaratoria posible') },
  { id: 'debido', titulo: 'Reglas del debido proceso', campos: [f('e4_debido', '¿Qué reglas del debido proceso debes cuidar durante la audiencia?')] },
  { id: 'criterios', titulo: 'Criterios para valorar las pruebas', campos: [f('e4_criterios', '¿Con qué criterios vas a valorar cada prueba? Considera la presunción de inocencia y la carga de la prueba.')] },
  { id: 'escuchar', titulo: 'Aspectos que deben escuchar antes de decidir', campos: [f('e4_escuchar', '¿Qué necesitas escuchar antes de que el tribunal pueda decidir?')] },
];

const JUEZ_ESPECIFICO = {
  presidente: { id: 'rol', titulo: 'Tarea del juez presidente: dirigir la audiencia', campos: [
    f('e4_rol_orden', 'Orden de la audiencia: ¿en qué orden se desarrollarán las etapas?'),
    f('e4_rol_etapas', '¿Cómo presentarás cada etapa al comenzar la audiencia?'),
    f('e4_rol_turnos', '¿Cómo organizarás los turnos de intervención para que todos sean escuchados?'),
  ] },
  preguntas: { id: 'rol', titulo: 'Tarea del juez de preguntas: preguntas pertinentes y neutrales', campos: [
    f('e4_rol_vic', 'Pregunta neutral para la víctima'),
    f('e4_rol_test', 'Pregunta neutral para un testigo'),
    f('e4_rol_per', 'Pregunta neutral para el perito'),
    f('e4_rol_neutral', '¿Por qué tus preguntas son pertinentes y neutrales (no favorecen a ninguna parte)?'),
  ] },
  decision: { id: 'rol', titulo: 'Tarea del juez de decisión: estructura para comunicar la decisión', nota: 'Prepara solo la estructura. La decisión se redacta después de escuchar la prueba y deliberar.', campos: [
    f('e4_rol_inicio', '¿Cómo comenzarás la comunicación (identificar el caso, a quienes intervinieron y la etapa)?'),
    f('e4_rol_pruebas', '¿Cómo explicarás qué pruebas se valoraron y con qué razones?'),
    f('e4_rol_presuncion', '¿Cómo incorporarás la presunción de inocencia y la carga de la prueba en tu fundamentación?'),
    f('e4_rol_cierre', '¿Cómo comunicarás la decisión de forma clara, sin anticiparla ahora?'),
  ] },
};

const JUEZ_DELIBERACION = {
  id: 'deliberacion', titulo: 'Mi participación en la deliberación', campos: [
    f('e4_delib', '¿Qué aportarás a la deliberación conjunta y cómo escucharás a los otros dos jueces?'),
  ],
};

function estructuraJuez(subrol) {
  return {
    titulo: 'PREPARA LA AUDIENCIA',
    avisos: [AVISO_JUECES],
    avisoJuez: true,
    apartados: [...JUEZ_COMUN, JUEZ_ESPECIFICO[subrol], JUEZ_DELIBERACION],
  };
}

const BASES = { fiscal: FISCAL, defensor: DEFENSOR, acusado: ACUSADO, victima: VICTIMA, testigo: TESTIGO, perito: PERITO };

/** Estructura de la etapa 4 para un personaje (o null si no hay personaje). */
export function estructuraEtapa4(clavePersonaje) {
  const p = PERSONAJES[clavePersonaje];
  if (!p) return null;
  const base = p.base === 'juez' ? estructuraJuez(p.subrol) : BASES[p.base];
  return {
    ...base,
    apartados: base.apartados.map((a, i) => ({ ...a, numero: i + 1 })),
  };
}

/* ============================== ETAPA 5 · RESPALDO ============================== */

export const RESPALDO_ADVERTENCIA =
  'Una declaración escrita leída por otra persona es un recurso pedagógico de continuidad y no equivale automáticamente a un testimonio presencial sometido a interrogatorio.';

export const RESPALDO_INTRO =
  'Este documento permitirá utilizar tu preparación si no puedes participar. No reemplaza automáticamente tu evaluación de desempeño.';

const SEC = (id, titulo, ayuda) => ({ id, campo: `resp_${id}`, titulo, ayuda });

export const RESPALDO_SECCIONES = {
  declarante: [
    SEC('declaracion', 'Declaración principal', 'Lo que tu personaje declararía, con sus propias palabras.'),
    SEC('respuestas', 'Respuestas previstas', 'Preguntas posibles y sus respuestas, tal como las preparaste.'),
    SEC('limites', 'Límites de conocimiento', 'Lo que tu personaje no sabe, no vio o no puede asegurar.'),
    SEC('noinventar', 'Información que no deben inventar los reemplazantes', 'Indica qué no se debe agregar ni suponer si otra persona lee este documento.'),
  ],
  parte: [
    SEC('postura', 'Postura', 'Tu postura frente al caso.'),
    SEC('antecedentes', 'Antecedentes', 'Los antecedentes que utilizarías y para qué.'),
    SEC('preguntas', 'Preguntas', 'Las preguntas que harías a cada declarante.'),
    SEC('argumentos', 'Argumentos', 'Los argumentos principales que sostendrías.'),
    SEC('conclusion', 'Conclusión provisional', 'Tu conclusión hasta ahora (provisional).'),
  ],
  juez: [
    SEC('funcion', 'Función específica', 'Tu función dentro del tribunal.'),
    SEC('orden', 'Orden de intervención', 'En qué momento y en qué orden intervienes.'),
    SEC('preguntas', 'Preguntas previstas', 'Las preguntas aclaratorias que tienes previstas.'),
    SEC('criterios', 'Criterios de decisión', 'Los criterios con que valorarás la prueba (sin anticipar ninguna decisión).'),
  ],
};

export function seccionesRespaldo(clavePersonaje) {
  const p = PERSONAJES[clavePersonaje];
  return p ? RESPALDO_SECCIONES[p.grupo] : [];
}

/* ============================== ETAPA 6 ============================== */

export const COMPROBACIONES = [
  { id: 'chk_funcion', texto: '¿Comprendo mi función?' },
  { id: 'chk_antecedentes', texto: '¿Identifiqué antecedentes?' },
  { id: 'chk_limites', texto: '¿Reconocí límites?' },
  { id: 'chk_intervencion', texto: '¿Preparé mi intervención?' },
  { id: 'chk_respaldo', texto: '¿Tengo documento de respaldo?' },
];

/* ============================== UTILIDADES DE ESTRUCTURA ============================== */

/** Valor de un campo "requerido": true salvo opcional o condicional no vigente. */
export function esRequerido(campo, respuestas) {
  if (campo.opcional) return false;
  if (typeof campo.condicional === 'function') return Boolean(campo.condicional(respuestas));
  return true;
}

/** Lista plana de todos los campos de la etapa 4 de un personaje. */
export function camposEtapa4(clavePersonaje) {
  const est = estructuraEtapa4(clavePersonaje);
  if (!est) return [];
  return est.apartados.flatMap((a) => a.campos.map((c) => ({ ...c, apartadoId: a.id, apartadoTitulo: a.titulo, apartadoNumero: a.numero })));
}

/** Busca la etiqueta legible de cualquier id de campo (para listas de pendientes y exportación). */
export function etiquetaDeCampo(id, clavePersonaje) {
  const todos = [
    ...ETAPA1_CAMPOS,
    ...ETAPA2_TARJETAS.flatMap((t) => t.campos.map((c) => ({ ...c, etiqueta: `Antecedente ${t.n} · ${c.etiqueta}` }))),
    ETAPA2_DUDAS,
    ...ETAPA3_CAMPOS,
    ...camposEtapa4(clavePersonaje).map((c) => ({ ...c, etiqueta: `${c.apartadoNumero}. ${c.apartadoTitulo} — ${c.etiqueta}` })),
    ...seccionesRespaldo(clavePersonaje).map((s) => ({ id: s.campo, etiqueta: `Respaldo · ${s.titulo}` })),
  ];
  return todos.find((c) => c.id === id)?.etiqueta || id;
}

/**
 * Detecta redacción de una decisión anticipada en los campos de los jueces.
 * Es una advertencia pedagógica (heurística), no una prohibición automática.
 */
const PATRON_DECISION = /(\b(declaro|declaramos)\s+(a\s+\S+\s+)?(culpable|inocente)\b)|(\b(condeno|condenamos|absuelvo|absolvemos)\b)|(\bse\s+(condena|absuelve)\b)|(\bel\s+tribunal\s+(resuelve|decide|falla)\s+(condenar|absolver)\b)|(\bfallo\s*:)/i;

export function detectarDecisionAnticipada(texto) {
  return PATRON_DECISION.test(String(texto || ''));
}
