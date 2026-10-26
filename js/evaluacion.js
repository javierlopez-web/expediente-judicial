/* Rúbrica de 100 puntos y cálculo de nota chilena. Lógica pura y configurable. */

export const RUBRICA = [
  { id: 'preparacion', titulo: 'Preparación', max: 30, criterios: [
    { id: 'prep_tareas', texto: 'Comprende y prepara las tareas de su personaje', max: 10 },
    { id: 'prep_antecedentes', texto: 'Selecciona antecedentes pertinentes', max: 10 },
    { id: 'prep_intervenciones', texto: 'Prepara intervenciones fundamentadas', max: 10 },
  ] },
  { id: 'participacion', titulo: 'Participación en el juicio', max: 40, criterios: [
    { id: 'part_funcion', texto: 'Cumple su función', max: 10 },
    { id: 'part_antecedentes', texto: 'Utiliza antecedentes', max: 10 },
    { id: 'part_limites', texto: 'Respeta límites y reglas', max: 10 },
    { id: 'part_fundamenta', texto: 'Fundamenta', max: 10 },
  ] },
  { id: 'reflexion', titulo: 'Reflexión individual', max: 20, criterios: [
    { id: 'ref_funcion', texto: 'Explica cómo cumplió su función', max: 5 },
    { id: 'ref_antecedente', texto: 'Analiza un antecedente y sus límites', max: 10 },
    { id: 'ref_conclusion', texto: 'Fundamenta una conclusión', max: 5 },
  ] },
  { id: 'observacion', titulo: 'Observación de otro juicio', max: 10, criterios: [
    { id: 'obs_funciones', texto: 'Identifica funciones', max: 5 },
    { id: 'obs_pruebas', texto: 'Reconoce el uso de pruebas y principios de justicia', max: 5 },
  ] },
];

export const CRITERIOS = RUBRICA.flatMap((d) => d.criterios);
export const PUNTAJE_TOTAL = RUBRICA.reduce((s, d) => s + d.max, 0); // 100

export const ESCALA_PREDETERMINADA = {
  puntajeMax: 100,
  exigencia: 60,
  notaMin: 1.0,
  notaAprobacion: 4.0,
  notaMax: 7.0,
};

/** Normaliza y valida un puntaje ingresado: vacío = sin evaluar; se acota entre 0 y el máximo. */
export function acotarPuntaje(valor, max) {
  if (valor === '' || valor === null || valor === undefined) return null;
  const n = Number(String(valor).replace(',', '.'));
  if (!Number.isFinite(n)) return null;
  return Math.min(max, Math.max(0, Math.round(n * 2) / 2)); // pasos de 0,5
}

export function totalPuntos(puntajes) {
  if (!puntajes) return 0;
  return CRITERIOS.reduce((s, c) => s + (Number(puntajes[c.id]) || 0), 0);
}

export function criteriosPendientes(puntajes) {
  return CRITERIOS.filter((c) => puntajes?.[c.id] === undefined || puntajes?.[c.id] === null || puntajes?.[c.id] === '').length;
}

/** Redondeo habitual de notas: a un decimal, la centésima 5 sube. */
export function redondearNota(n) {
  return Math.round((n + Number.EPSILON) * 10) / 10;
}

/**
 * Nota 1,0–7,0 con escala lineal por tramos y exigencia configurable.
 *  - bajo la exigencia:   notaMin + (notaAprobacion − notaMin) · puntos / (exigencia · máx)
 *  - desde la exigencia:  notaAprobacion + (notaMax − notaAprobacion) · (puntos − exigencia·máx) / (máx − exigencia·máx)
 * La escala queda sujeta al reglamento del establecimiento (por eso es editable).
 */
export function calcularNota(puntos, escala = ESCALA_PREDETERMINADA) {
  const e = { ...ESCALA_PREDETERMINADA, ...(escala || {}) };
  const max = Number(e.puntajeMax) || 100;
  const exig = Math.min(99, Math.max(1, Number(e.exigencia) || 60)) / 100;
  const p = Math.min(max, Math.max(0, Number(puntos) || 0));
  const corte = exig * max;
  let nota;
  if (p < corte) nota = e.notaMin + (e.notaAprobacion - e.notaMin) * (p / corte);
  else nota = e.notaAprobacion + (e.notaMax - e.notaAprobacion) * ((p - corte) / (max - corte));
  return redondearNota(Math.min(e.notaMax, Math.max(e.notaMin, nota)));
}

export function formatearNota(n) {
  return n === null || n === undefined || Number.isNaN(n) ? '—' : Number(n).toFixed(1).replace('.', ',');
}
