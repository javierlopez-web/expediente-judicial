/* Piezas de interfaz compartidas por el espacio del estudiante y el del profesor. */

import { h, vaciar, idUnico } from './util.js';
import { alCambiar, alternar, sonidoActivo, sonidoPermitido } from './audio.js';
import { ETIQUETA_ESTADO } from './progreso.js';

/** Estado de la sesión del estudiante, compartido entre pantallas. */
export const S = {
  sesion: null,
  config: null,
  perfil: null,
  expediente: null,
  resp: {},
  progreso: null,
  barra: null,
  ultimoGuardado: null,
  guardado: { codigo: 'guardado', pendientes: 0 },
  modo: 'local',
  yaMostroBienvenida: false,
};

/* ---------- Avisos breves ---------- */

export function avisar(texto, tipo = 'info', ms = 4500) {
  const cont = document.getElementById('avisos');
  if (!cont) return;
  const t = h('div', { class: `toast${tipo === 'error' ? ' toast--error' : tipo === 'ok' ? ' toast--ok' : ''}`, role: tipo === 'error' ? 'alert' : 'status' }, texto);
  cont.append(t);
  setTimeout(() => t.remove(), ms);
}

/* ---------- Diálogos accesibles (<dialog> nativo: atrapa el foco y se cierra con Esc) ---------- */

/**
 * @param {{titulo:string, cuerpo:Node|string|Array, acciones?:Array<{texto:string, valor?:any, clase?:string, alClick?:(dlg:HTMLDialogElement)=>any}>, ancho?:string}} cfg
 * @returns {Promise<any>} el valor de la acción elegida, o undefined si se cerró con Esc
 */
export function abrirDialogo({ titulo, cuerpo, acciones, ancho }) {
  return new Promise((resolve) => {
    const idT = idUnico('dlg-t');
    const dlg = h('dialog', { 'aria-labelledby': idT, style: ancho ? { width: ancho } : null });
    const botones = (acciones || [{ texto: 'Cerrar', valor: true, clase: 'btn--secundario' }]).map((a) =>
      h('button', {
        type: 'button', class: `btn ${a.clase || ''}`,
        onclick: async (ev) => {
          // `alClick(dlg)` puede validar o trabajar de forma asíncrona; si devuelve false, el diálogo sigue abierto.
          if (a.alClick) {
            const b = ev.currentTarget;
            b.disabled = true;
            let r;
            try { r = await a.alClick(dlg); } finally { b.disabled = false; }
            if (r === false) return;
          }
          dlg.dataset.valor = '1'; dlg._valor = a.valor; dlg.close();
        },
      }, a.texto));
    dlg.append(
      h('div', { class: 'dialogo__cuerpo' }, h('h2', { id: idT, class: 'dialogo__titulo' }, titulo), cuerpo),
      h('div', { class: 'dialogo__pie' }, botones),
    );
    dlg.addEventListener('close', () => { const v = dlg.dataset.valor ? dlg._valor : undefined; dlg.remove(); resolve(v); });
    document.body.append(dlg);
    dlg.showModal();
  });
}

export async function confirmar({ titulo, mensaje, ok = 'Aceptar', cancelar = 'Cancelar', peligro = false }) {
  const r = await abrirDialogo({
    titulo,
    cuerpo: typeof mensaje === 'string' ? h('p', null, mensaje) : mensaje,
    acciones: [
      { texto: cancelar, valor: false, clase: 'btn--secundario' },
      { texto: ok, valor: true, clase: peligro ? 'btn--peligro' : '' },
    ],
  });
  return r === true;
}

/* ---------- Botón de sonidos ---------- */

export function botonSonido() {
  const b = h('button', { type: 'button', class: 'btn btn--chico', 'aria-pressed': 'false' });
  const pintar = () => {
    b.hidden = !sonidoPermitido();
    b.textContent = sonidoActivo() ? 'SILENCIAR SONIDOS' : 'ACTIVAR SONIDOS';
    b.setAttribute('aria-pressed', String(sonidoActivo()));
  };
  b.addEventListener('click', async () => { await alternar(); });
  alCambiar(pintar);
  pintar();
  return b;
}

/* ---------- Chips de estado ---------- */

export function chipEstado(estado, conCambios = false) {
  const clase = { sin_iniciar: 'chip--gris', en_desarrollo: 'chip--azul', entregada: 'chip--verde' }[estado] || 'chip--gris';
  return h('span', { class: `chip ${clase}` }, ETIQUETA_ESTADO[estado] || estado, conCambios ? ' · con cambios' : '');
}

export function barraProgreso(pct, etiqueta) {
  return h('div', { class: 'progreso', role: 'progressbar', 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-valuenow': String(pct), 'aria-label': etiqueta || 'Progreso' },
    h('span', { style: { width: `${pct}%` } }));
}

export function actualizarBarraProgreso(el, pct) {
  if (!el) return;
  el.setAttribute('aria-valuenow', String(pct));
  const s = el.firstElementChild;
  if (s) s.style.width = `${pct}%`;
}

/** Siluetas genéricas (SVG): nunca retratos de estudiantes. */
export function siluetaSVG() {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', '0 0 120 140');
  svg.setAttribute('aria-hidden', 'true');
  svg.innerHTML =
    '<circle cx="60" cy="48" r="26" fill="#5b4731" opacity=".85"/>' +
    '<path d="M8 140c0-34 22-56 52-56s52 22 52 56z" fill="#5b4731" opacity=".85"/>';
  return svg;
}

export function limpiarVista(el) { return vaciar(el); }
