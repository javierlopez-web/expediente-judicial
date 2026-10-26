/* Cálculo de avance y estado de un expediente. Lógica pura (se usa en el navegador y en pruebas de Node). */

import {
  ETAPAS, ETAPA1_CAMPOS, ETAPA2_TARJETAS, ETAPA2_DUDAS, ETAPA3_CAMPOS, CLASIFICACION,
  camposEtapa4, seccionesRespaldo, esRequerido, personajePorClave, etiquetaDeCampo, detectarDecisionAnticipada,
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

export function itemsDeEtapa(n, perfil, resp) {
  const personaje = perfil?.personaje || null;
  const item = (id, etiqueta, requerido, hecho) => ({ id, etiqueta, requerido, hecho });
  switch (n) {
    case 1:
      if (!personaje) return [];
      return ETAPA1_CAMPOS.map((c) => item(c.id, c.etiqueta, true, lleno(resp[c.id])));
    case 2:
      return [
        ...ETAPA2_TARJETAS.flatMap((t) => t.campos.map((c) =>
          item(c.id, `Antecedente ${t.n} · ${c.etiqueta}`, true, lleno(resp[c.id])))),
        item(ETAPA2_DUDAS.id, ETAPA2_DUDAS.etiqueta, true, lleno(resp[ETAPA2_DUDAS.id])),
      ];
    case 3: {
      const respondidas = CLASIFICACION.filter((c) => lleno(resp[`clasif_${c.id}`])).length;
      const items = [item('clasif', `Actividad de clasificación (${respondidas}/${CLASIFICACION.length})`, true, respondidas === CLASIFICACION.length)];
      if (personaje) ETAPA3_CAMPOS.forEach((c) => items.push(item(c.id, c.etiqueta, true, lleno(resp[c.id]))));
      return items;
    }
    case 4:
      if (!personaje) return [];
      return camposEtapa4(personaje).map((c) =>
        item(c.id, `${c.apartadoNumero}. ${c.apartadoTitulo} — ${c.etiqueta}`, esRequerido(c, resp), lleno(resp[c.id])));
    case 5:
      if (!personaje) return [];
      return seccionesRespaldo(personaje).map((s) => item(s.campo, `Respaldo · ${s.titulo}`, true, lleno(resp[s.campo])));
    default:
      return [];
  }
}

export function calcularProgreso(perfil, expediente) {
  const resp = respuestasDe(expediente);
  const etapas = {};
  let total = 0;
  let hechos = 0;
  const pendientes = [];
  for (const e of ETAPAS) {
    if (e.n === 6) { etapas[6] = { n: 6, total: 0, hechos: 0, pct: 0, completa: false, bloqueada: etapaBloqueada(6, perfil), items: [] }; continue; }
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
  return Object.values(resp).some(lleno) ? 'en_desarrollo' : 'sin_iniciar';
}

export const ETIQUETA_ESTADO = {
  sin_iniciar: 'Sin iniciar',
  en_desarrollo: 'En desarrollo',
  entregada: 'Entregada',
};

/** Texto de apoyo para jueces: ids de campos con decisión anticipada (ver detectarDecisionAnticipada). */
export function etiquetaCorta(id, personaje) {
  return etiquetaDeCampo(id, personaje);
}

export function nombrePersonaje(clave) {
  return personajePorClave(clave)?.nombre || null;
}

/** Campos de jueces donde el texto parece una decisión ya redactada (advertencia pedagógica, no bloqueo). */
export function decisionesAnticipadas(perfil, resp) {
  if (!perfil?.personaje || personajePorClave(perfil.personaje)?.base !== 'juez') return [];
  const ids = [...camposEtapa4(perfil.personaje).map((c) => c.id), ...seccionesRespaldo(perfil.personaje).map((s) => s.campo)];
  return ids.filter((id) => detectarDecisionAnticipada(resp?.[id]));
}
