/**
 * ARRANQUE Y ENRUTADOR (hash): #/bienvenida · #/tablero · #/etapa/N · #/instrucciones · #/profesor/...
 */

import { h, montar } from './util.js';
import { iniciarServicios, observarSesion, cerrarSesion, textoErrorAuth } from './servicios.js';
import { S } from './ui-comun.js';
import * as ui from './ui-estudiante.js';

const app = document.getElementById('app');
let sesion = null;
let listo = false;
let ficha = 0;                 // evita que un render lento pise a uno más nuevo
let cargaEnCurso = null;
let mensajeSalida = '';

/**
 * Envío de formularios sin depender del envío nativo. Cuando la página se muestra dentro de un marco aislado
 * (vista previa de un chat, por ejemplo) el navegador bloquea los formularios y el botón "no hace nada".
 * Aquí el clic en un botón de envío (y Enter, que genera ese mismo clic) dispara el evento "submit" directamente.
 */
document.addEventListener('click', (ev) => {
  const btn = ev.target instanceof Element ? ev.target.closest('button, input[type=submit]') : null;
  if (!btn || btn.disabled || !btn.form) return;
  if ((btn.getAttribute('type') || 'submit') !== 'submit') return;
  const form = btn.form;
  if (form.method === 'dialog') return; // los diálogos se cierran con sus propios botones
  ev.preventDefault();
  if (!form.checkValidity()) { form.reportValidity(); return; }
  let envio;
  try { envio = new SubmitEvent('submit', { bubbles: true, cancelable: true, submitter: btn }); } catch { envio = new Event('submit', { bubbles: true, cancelable: true }); }
  form.dispatchEvent(envio);
}, true);

/**
 * Enlaces internos (#/ruta) sin navegación nativa: dentro de un marco "srcdoc" (vista previa de un chat) un enlace
 * "#/algo" lleva a about:blank y la página queda en blanco. Se cambia solo el hash y el enrutador hace el resto.
 */
document.addEventListener('click', (ev) => {
  if (ev.defaultPrevented || ev.button !== 0 || ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey) return;
  const a = ev.target instanceof Element ? ev.target.closest('a[href^="#/"]') : null;
  if (!a || (a.target && a.target !== '_self')) return;
  ev.preventDefault();
  const destino = a.getAttribute('href');
  if (location.hash === destino) window.dispatchEvent(new HashChangeEvent('hashchange')); else location.hash = destino;
});

function avisoModo(modo) {
  const el = document.getElementById('aviso-modo');
  if (!el) return;
  if (modo === 'local') {
    el.hidden = false;
    el.textContent = globalThis.__SIN_ALMACEN
      ? 'Modo local de prueba · este navegador no permite guardar: lo que escribas se pierde al cerrar la página · no uses datos reales'
      : 'Modo local de prueba · se guarda solo en este navegador · no uses datos reales';
  } else el.hidden = true;
}

function pantallaCarga(texto = 'Abriendo tu expediente…') {
  montar(app, h('main', { class: 'vista', id: 'vista', tabindex: '-1' }, h('p', { class: 'cargando', role: 'status' }, texto)));
}

function pantallaError(titulo, detalle) {
  montar(app, h('main', { class: 'vista', id: 'vista', tabindex: '-1' },
    h('div', { class: 'hoja hoja--lectura' },
      h('h1', null, titulo),
      h('div', { class: 'aviso aviso--error', role: 'alert' }, h('span', null, '!'), h('p', null, detalle)),
      h('button', { type: 'button', class: 'btn', onclick: () => location.reload() }, 'Reintentar'))));
}

function asegurarCarga(s) {
  if (S.sesion?.uid === s.uid && S.perfil) return Promise.resolve();
  if (cargaEnCurso && cargaEnCurso.uid === s.uid) return cargaEnCurso.promesa;
  const promesa = ui.prepararSesion(s).finally(() => { cargaEnCurso = null; });
  cargaEnCurso = { uid: s.uid, promesa };
  return promesa;
}

async function render() {
  if (!listo) return;
  const mi = ++ficha;
  const partes = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);

  if (partes[0] === 'profesor') {
    if (S.perfil) ui.limpiarSesion();
    if (!app.querySelector('.adm')) pantallaCarga('Abriendo la administración…');
    try {
      const m = await import('./teacher-dashboard.js');
      if (mi !== ficha) return;
      await m.montarProfesor(app, partes.slice(1), sesion);
    } catch (e) {
      console.error(e);
      if (mi === ficha) pantallaError('No se pudo abrir la administración', e.message || String(e));
    }
    return;
  }

  if (!sesion) { await ui.mostrarIngreso(app, { mensaje: mensajeSalida }); mensajeSalida = ''; return; }
  if (sesion.esProfesor) { location.hash = '#/profesor'; return; }

  if (!(S.sesion?.uid === sesion.uid && S.perfil)) {
    pantallaCarga();
    try { await asegurarCarga(sesion); } catch (e) {
      if (mi !== ficha) return;
      mensajeSalida = textoErrorAuth(e);
      if (!/sin-perfil/.test(e.code || '')) console.error(e);
      sesion = null;
      await cerrarSesion().catch(() => {});
      await ui.mostrarIngreso(app, { mensaje: mensajeSalida });
      mensajeSalida = '';
      return;
    }
    if (mi !== ficha) return;
  }

  const [a, b] = partes;
  if (a === 'etapa') await ui.rutaEstudiante(app, 'etapa', Number.parseInt(b, 10) || 1);
  else if (a === 'tablero') await ui.rutaEstudiante(app, 'tablero');
  else if (a === 'instrucciones') await ui.rutaEstudiante(app, 'instrucciones');
  else if (a === 'bienvenida' || !S.yaMostroBienvenida) await ui.rutaEstudiante(app, 'bienvenida');
  else await ui.rutaEstudiante(app, 'tablero');
}

async function iniciar() {
  try {
    const modo = await iniciarServicios();
    avisoModo(modo);
    listo = true;
    globalThis.__arrancado = true;
    observarSesion((s) => {
      const habia = sesion;
      sesion = s;
      if (habia && !s && S.perfil && !S.salidaVoluntaria) mensajeSalida = 'Tu sesión se cerró. Vuelve a ingresar; tus cambios pendientes siguen guardados en este dispositivo.';
      if (!s && S.perfil) ui.limpiarSesion();
      render();
    });
    window.addEventListener('hashchange', render);
  } catch (e) {
    console.error(e);
    pantallaError('No se pudo iniciar la aplicación', `${e.message || e}. Revisa js/config.js y tu conexión.`);
  }
}

iniciar();
