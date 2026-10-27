/* Cálculo de avance y estado de un expediente. Lógica pura (se usa en el navegador y en pruebas de Node).
 *
 * Versión 2: el avance cuenta RESPUESTAS SIGNIFICATIVAS, no cuadros de texto.
 *   · Etapa 1: dos respuestas.
 *   · Etapa 2: cada tarjeta de antecedente es una respuesta (sus tres partes) + la duda.
 *   · Etapa 3: cada apartado del personaje es una respuesta (p. ej., «dos preguntas a la víctima»).
 * La práctica de límites, las comprobaciones y la revisión final no cuentan.
 */

import {
  ETAPAS, ETAPA_REVISION, ETAPA1_CAMPOS, ETAPA2_TARJETAS, ETAPA2_DUDAS,
  estructuraParticipacion, camposParticipacion, esRequerido, personajePorClave, etiquetaDeCampo,
  detectarDecisionAnticipada, respuestasVigentes,
} from './contenido.js';

const lleno = (v) => v !== undefined && v !== null && String(v).trim() !== '';

export function respuestasDe(expediente) {
  return (expediente && expediente.respuestas) || {};
}

/** ¿La etapa necesita personaje para poder trabajarse? 'parcial' = una parte sí. */
export function etapaBloqueada(n, perfil) {
  const e = ETAPAS.find((x) => x.n === n);
  if (!e) return true;
  if (perfil && perfil.personaje) return false;
  return e.requierePersonaje === true;
}

/**
 * Un ítem de avance agrupa uno o más campos. Es obligatorio si alguno de sus campos lo es,
 * y está hecho cuando todos sus campos obligatorios tienen texto. `id` apunta al primer campo pendiente.
 */
function itemDe(clave, etiqueta, campos, resp) {
  const req = campos.filter((c) => esRequerido(c, resp));
  const requerido = req.length > 0;
  const pendiente = req.find((c) => !lleno(resp[c.id]));
  const hecho = requerido ? !pendiente : campos.some((c) => lleno(resp[c.id]));
  return { clave, id: (pendiente || campos[0]).id, etiqueta, requerido, hecho, campos: campos.map((c) => c.id) };
}

export function itemsDeEtapa(n, perfil, resp) {
  const personaje = perfil?.personaje || null;
  switch (n) {
    case 1:
      if (!personaje) return [];
      return ETAPA1_CAMPOS.map((c) => itemDe(c.id, c.etiqueta, [c], resp));
    case 2:
      return [
        ...ETAPA2_TARJETAS.map((t) => itemDe(`antecedente${t.n}`, `Antecedente ${t.n} (qué es, qué permite afirmar y qué no)`, t.campos, resp)),
        itemDe(ETAPA2_DUDAS.id, ETAPA2_DUDAS.etiqueta, [ETAPA2_DUDAS], resp),
      ];
    case 3: {
      if (!personaje) return [];
      const est = estructuraParticipacion(personaje);
      return est.apartados.map((a) => itemDe(a.id, `${a.numero}. ${a.titulo}`, a.campos, resp));
    }
    default:
      return [];
  }
}

export function calcularProgreso(perfil, expediente) {
  const resp = respuestasVigentes(perfil?.personaje, respuestasDe(expediente));
  const etapas = {};
  let total = 0;
  let hechos = 0;
  const pendientes = [];
  for (const e of ETAPAS) {
    if (e.n === ETAPA_REVISION) {
      etapas[e.n] = { n: e.n, total: 0, hechos: 0, pct: 0, completa: false, bloqueada: etapaBloqueada(e.n, perfil), items: [] };
      continue;
    }
    const items = itemsDeEtapa(e.n, perfil, resp);
    const req = items.filter((i) => i.requerido);
    const h = req.filter((i) => i.hecho).length;
    etapas[e.n] = {
      n: e.n,
      total: req.length,
      hechos: h,
      pct: req.length ? Math.round((h / req.length) * 100) : 0,
      completa: req.length > 0 && h === req.length,
      iniciada: items.some((i) => i.hecho),
      bloqueada: etapaBloqueada(e.n, perfil),
      items,
    };
    total += req.length;
    hechos += h;
    req.filter((i) => !i.hecho).forEach((i) => pendientes.push({ etapa: e.n, id: i.id, etiqueta: i.etiqueta }));
  }
  return { etapas, total, hechos, pct: total ? Math.round((hechos / total) * 100) : 0, pendientes };
}

/** sin_iniciar · en_desarrollo · entregada */
export function estadoDe(expediente) {
  if (!expediente) return 'sin_iniciar';
  if (expediente.entregadoEn) return 'entregada';
  const resp = respuestasDe(expediente);
  return Object.entries(resp).some(([k, v]) => !k.startsWith('_') && lleno(v)) ? 'en_desarrollo' : 'sin_iniciar';
}

export const ETIQUETA_ESTADO = {
  sin_iniciar: 'Sin iniciar',
  en_desarrollo: 'En desarrollo',
  entregada: 'Entregada',
};

export function etiquetaCorta(id, personaje) {
  return etiquetaDeCampo(id, personaje);
}

export function nombrePersonaje(clave) {
  return personajePorClave(clave)?.nombre || null;
}

/** Campos de jueces donde el texto parece una decisión ya redactada (advertencia pedagógica, no bloqueo). */
export function decisionesAnticipadas(perfil, resp) {
  if (!perfil?.personaje || personajePorClave(perfil.personaje)?.base !== 'juez') return [];
  const ids = [...ETAPA1_CAMPOS.map((c) => c.id), ...camposParticipacion(perfil.personaje).map((c) => c.id)];
  return ids.filter((id) => detectarDecisionAnticipada(resp?.[id]));
}
