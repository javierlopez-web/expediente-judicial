/**
 * ESPACIO DEL ESTUDIANTE: ingreso, bienvenida, tablero de corcho, instrucciones y marco de las etapas.
 * Las seis etapas se dibujan en ui-etapas.js.
 */

import { h, montar, qs, esperar, movimientoReducido, fechaHora, rutaImg } from './util.js';
import {
  ETAPAS, PERSONAJES, TEXTOS, INSTRUCCIONES, CASOS, etiquetaDeCampo,
  PERSONAJES_CON_IMAGEN,
} from './contenido.js';
import { DATOS_INSTITUCIONALES } from './config.js';
import { calcularProgreso, estadoDe, etapaBloqueada, ETIQUETA_ESTADO, decisionesAnticipadas } from './progreso.js';
import * as sv from './servicios.js';
import { TEXTO_ESTADO } from './guardado.js';
import * as audio from './audio.js';
import { sonar } from './audio.js';
import {
  S, avisar, abrirDialogo, confirmar, botonSonido, chipEstado, barraProgreso, actualizarBarraProgreso, siluetaSVG,
} from './ui-comun.js';
import { renderEtapa } from './ui-etapas.js';
import { totalPuntos, calcularNota, formatearNota, PUNTAJE_TOTAL } from './evaluacion.js';

const img = rutaImg;
const PRUEBA_LOCAL = () => sv.modoServicios() === 'local';

/* ============================== Estado de la vista ============================== */

let oyentesVista = [];          // funciones que se llaman cuando cambian las respuestas
let rutaActual = null;          // { tipo, n }
let marcoRaf = 0;
let irAId = null;               // campo al que saltar tras abrir una etapa
let previoGuardado = 'guardado';

const editable = () => Boolean(S.config?.edicionHabilitada !== false && S.perfil?.activo !== false && !S.perfil?.cerrado);
const ultimoGuardado = () => S.ultimoGuardado || S.expediente?.ultimoGuardado || null;

function recalcular() {
  S.progreso = calcularProgreso(S.perfil, { respuestas: S.resp });
  return S.progreso;
}

function notificar() {
  recalcular();
  for (const fn of oyentesVista) { try { fn(); } catch (e) { console.error(e); } }
  if (S.barra) {
    actualizarBarraProgreso(S.barra.progreso, S.progreso.pct);
  }
}

function cambiar(id, valor) {
  S.resp[id] = valor;
  if (S.expediente?.entregadoEn) S.expediente.editadoDespuesDeEntrega = true;
  try { sv.guardarRespuesta(id, valor); } catch (e) { avisar(e.message, 'error'); }
  cancelAnimationFrame(marcoRaf);
  marcoRaf = requestAnimationFrame(notificar);
}

/* ============================== Estado de guardado ============================== */

function pintarEstado(est) {
  const b = S.barra?.estado;
  S.guardado = est;
  if (est.ultimo) S.ultimoGuardado = est.ultimo;
  if (est.codigo === 'guardado' && (previoGuardado === 'guardando' || previoGuardado === 'pendiente')) sonar.guardado();
  previoGuardado = est.codigo;
  if (!b) return;
  let texto = TEXTO_ESTADO[est.codigo] || est.codigo;
  if (est.codigo === 'guardado' && ultimoGuardado() && est.ultimo) {
    texto += ` · ${new Intl.DateTimeFormat('es-CL', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Santiago' }).format(new Date(est.ultimo))}`;
  }
  if (est.codigo === 'sin_conexion' && est.pendientes) texto += ` (${est.pendientes})`;
  b.textContent = texto;
  b.dataset.estado = est.codigo;
  b.title = est.mensaje || (est.codigo === 'conflicto' ? 'Haz clic para elegir qué versión conservar' : 'Haz clic para guardar ahora');
  if (est.codigo === 'error' && est.mensaje) avisar(est.mensaje, 'error', 8000);
}

/* ============================== Conflictos entre dispositivos ============================== */

let dialogoConflictoAbierto = false;
async function abrirConflictos(conflictos) {
  if (dialogoConflictoAbierto || !conflictos?.length) return;
  dialogoConflictoAbierto = true;
  const decisiones = {};
  const bloques = conflictos.map((c) => {
    decisiones[c.id] = 'mia';
    const nombre = `conf-${c.id}`;
    const opcion = (valor, titulo, texto, marcado) => {
      const r = h('input', { type: 'radio', name: nombre, value: valor, checked: marcado });
      r.addEventListener('change', () => { decisiones[c.id] = valor; });
      return h('label', { class: 'conflicto__version' },
        h('span', { style: { display: 'flex', gap: '.5rem', alignItems: 'center' } }, r, h('strong', null, titulo)),
        h('pre', null, texto || '(vacío)'));
    };
    return h('fieldset', { class: 'conflicto' },
      h('legend', { class: 'rotulo' }, etiquetaDeCampo(c.id, S.perfil?.personaje)),
      h('div', { class: 'conflicto__versiones' },
        opcion('mia', 'Mi versión (este dispositivo)', c.local, true),
        opcion('nube', 'Versión guardada desde otro dispositivo', c.servidor, false)));
  });
  const r = await abrirDialogo({
    titulo: 'Este texto cambió desde otro dispositivo',
    ancho: 'min(46rem, 94vw)',
    cuerpo: h('div', null,
      h('p', null, 'Para no perder nada, no sobrescribimos ninguna versión. Elige cuál conservar en cada campo.'),
      bloques),
    acciones: [{ texto: 'Conservar mi elección', valor: 'ok' }],
  });
  dialogoConflictoAbierto = false;
  if (r !== 'ok') { avisar('El conflicto sigue pendiente: haz clic en el estado de guardado para resolverlo.', 'info', 7000); return; }
  try {
    const aplicados = await sv.resolverConflictos(decisiones);
    Object.assign(S.resp, aplicados);
    for (const [id, valor] of Object.entries(aplicados)) {
      const el = document.getElementById(id);
      if (el && 'value' in el) { el.value = valor; el.dispatchEvent(new Event('autoajuste')); }
    }
    notificar();
    avisar('Listo, conservaste tu elección.', 'ok');
    repintar();
  } catch (e) { avisar(e.message || 'No se pudo resolver el conflicto.', 'error'); }
}

/* ============================== Marco con barra superior ============================== */

function asegurarMarco(app) {
  if (S.barra && app.contains(S.barra.raiz)) return S.barra.vista;
  const estado = h('button', { type: 'button', class: 'estado-guardado', 'data-estado': 'guardado', 'aria-live': 'polite', role: 'status' }, TEXTO_ESTADO.guardado);
  estado.addEventListener('click', () => {
    if (S.guardado?.codigo === 'conflicto') abrirConflictosPendientes();
    else sv.guardarAhora();
  });
  const barraProg = barraProgreso(0, 'Progreso general de mi preparación');
  barraProg.className = 'barra__progreso';
  barraProg.removeAttribute('role');
  barraProg.setAttribute('aria-hidden', 'true');

  const menu = h('details', { class: 'menu-cuenta' },
    h('summary', { class: 'btn', 'aria-label': 'Menú de mi cuenta' }, 'Mi cuenta'),
    h('div', { class: 'menu-cuenta__lista' },
      h('p', { style: { margin: '.2rem .5rem', fontWeight: 700 } }, S.perfil?.nombreMostrar || ''),
      h('a', { class: 'btn', href: '#/instrucciones' }, 'Instrucciones'),
      h('button', { type: 'button', class: 'btn', onclick: () => { menu.open = false; cerrarSesionUI(); } }, 'Cerrar sesión')));
  menu.addEventListener('toggle', () => {});
  document.addEventListener('click', (e) => { if (menu.open && !menu.contains(e.target)) menu.open = false; });

  const raiz = h('header', { class: 'barra' },
    h('div', { class: 'barra__interior' },
      h('a', { class: 'barra__marca', href: '#/tablero' }, h('img', { src: img('chinche'), alt: '' }), h('strong', null, TEXTOS.tituloApp)),
      h('div', { class: 'barra__acciones' },
        estado,
        botonSonido(),
        h('a', { class: 'btn', href: '#/tablero' }, 'Tablero'),
        menu)),
    barraProg);
  const vista = h('main', { class: 'vista', id: 'vista', tabindex: '-1' });
  montar(app, raiz, vista);
  S.barra = { raiz, estado, progreso: barraProg, vista, menu };
  actualizarBarraProgreso(barraProg, S.progreso?.pct || 0);
  pintarEstado(sv.consultarEstadoGuardado());
  return vista;
}

let conflictosPendientes = [];
function abrirConflictosPendientes() { abrirConflictos(conflictosPendientes); }

function enfocarTitulo(vista) {
  const t = qs('#titulo-etapa, h1', vista);
  if (t) { if (!t.hasAttribute('tabindex')) t.setAttribute('tabindex', '-1'); t.focus({ preventScroll: true }); }
  else vista.focus({ preventScroll: true });
}

/* ============================== Cierre de sesión ============================== */

export async function cerrarSesionUI() {
  try {
    await sv.guardarAhora();
    if (sv.consultarEstadoGuardado().pendientes > 0) {
      const ok = await confirmar({
        titulo: 'Hay cambios sin enviar',
        mensaje: 'No pudimos guardar tus últimos cambios en el servidor. Siguen en este dispositivo y se enviarán cuando vuelvas a ingresar aquí. ¿Cerrar la sesión igual?',
        ok: 'Cerrar sesión', cancelar: 'Seguir editando', peligro: true,
      });
      if (!ok) return;
    }
  } catch { /* se decide con el estado */ }
  limpiarSesion();
  await sv.cerrarSesion();
  location.hash = '#/';
}

export function limpiarSesion() {
  sv.liberarSesion();
  Object.assign(S, { sesion: null, config: null, perfil: null, expediente: null, resp: {}, progreso: null, barra: null, ultimoGuardado: null, yaMostroBienvenida: false });
  oyentesVista = [];
  rutaActual = null;
}

/* ============================== INGRESO ============================== */

function dialogoAyudaIngreso() {
  abrirDialogo({
    titulo: 'Ayuda para ingresar',
    cuerpo: h('div', null,
      h('ul', null,
        h('li', null, 'Escribe tu nombre y tu primer apellido, tal como aparecen en la lista del curso, en MAYÚSCULAS y sin tildes (por ejemplo: JUAN y PEREZ). No necesitas contraseña ni correo.'),
        h('li', null, 'Si tu nombre tiene más de una palabra, escribe solo la primera (Juan Pablo → JUAN).'),
        h('li', null, 'Si tienes un homónimo en el curso (mismo nombre y apellido), el profesor te dará además un «código de cuenta». Escríbelo en el campo que aparece al abrir «Tengo un código de cuenta».'),
        h('li', null, 'Si nada funciona, pídele ayuda al profesor: no necesitas correo electrónico para ingresar.'))),
  });
}

export async function mostrarIngreso(app, { mensaje = '' } = {}) {
  limpiarSesion();
  const estadoEscena = { v: 'cerrado' };
  const campo = (id, etiqueta, extra = {}) => h('div', { class: 'campo' }, h('label', { for: id }, etiqueta), h('input', { id, name: id, type: 'text', required: true, autocapitalize: 'characters', spellcheck: 'false', ...extra }));
  const inNombre = campo('f-nombre', 'Nombre', { autocomplete: 'off' });
  const inApellido = campo('f-apellido', 'Primer apellido', { autocomplete: 'off' });
  const inCodigo = h('input', { id: 'f-codigo', name: 'codigo', type: 'text', autocomplete: 'off', spellcheck: 'false' });
  const error = h('p', { class: 'form-ingreso__error', role: 'alert', style: { color: 'var(--error)', fontWeight: 700 } }, mensaje);
  const enviar = h('button', { type: 'submit', class: 'btn' }, 'Ingresar a mi expediente');

  const form = h('form', { class: 'form-ingreso', novalidate: true },
    h('p', { class: 'etiqueta-juridica' }, 'Acceso al expediente'),
    inNombre, inApellido,
    h('p', { class: 'campo__ayuda' }, 'Escríbelos como aparecen en la lista del curso: MAYÚSCULAS y sin tildes. No necesitas contraseña.'),
    h('details', { class: 'ayuda' }, h('summary', null, 'Tengo un código de cuenta'),
      h('div', null, h('div', { class: 'campo' }, h('label', { for: 'f-codigo' }, 'Código de cuenta (solo si el profesor te lo dio)'), inCodigo))),
    error,
    h('div', { class: 'grupo-botones' }, enviar),
    h('div', { class: 'form-ingreso__enlaces' },
      h('button', { type: 'button', class: 'btn btn--enlace', onclick: dialogoAyudaIngreso }, 'Ayuda para ingresar')));

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    error.textContent = '';
    if (!inNombre.querySelector('input').value.trim() || !inApellido.querySelector('input').value.trim()) { error.textContent = 'Escribe tu nombre y tu primer apellido.'; return; }
    enviar.disabled = true;
    enviar.textContent = 'Verificando…';
    try {
      await sv.iniciarSesion({
        nombre: inNombre.querySelector('input').value, apellido: inApellido.querySelector('input').value,
        codigo: inCodigo.value,
      });
      // La navegación la dispara el observador de sesión (app.js).
    } catch (err) {
      error.textContent = sv.textoErrorAuth(err);
      enviar.disabled = false;
      enviar.textContent = 'Ingresar a mi expediente';
    }
  });

  const hoja = h('div', { class: 'hoja' },
    h('img', { class: 'hoja__cinta', src: img('cinta'), alt: '', 'aria-hidden': 'true' }),
    form);
  const contHoja = h('div', { class: 'escena__hoja' }, h('div', null, hoja));
  contHoja.inert = true;
  const leyenda = h('span', { class: 'sobre-boton__leyenda' }, 'Abrir mi expediente');
  const sobre = h('button', { type: 'button', class: 'sobre-boton', 'aria-expanded': 'false', 'aria-label': 'Abrir el sobre para ingresar a mi expediente' },
    h('img', { class: 'sobre--cerrado', src: img('sobre-cerrado'), alt: '', width: 900, height: 535 }),
    h('img', { class: 'sobre--abierto', src: img('sobre-abierto'), alt: '', width: 900, height: 725 }),
    leyenda);
  const escena = h('div', { class: 'escena', 'data-estado': 'cerrado' }, contHoja, sobre);

  async function abrir() {
    if (estadoEscena.v !== 'cerrado') return;
    estadoEscena.v = 'abriendo';
    sobre.setAttribute('aria-expanded', 'true');
    sobre.disabled = true;
    sonar.sobre();
    escena.dataset.estado = 'abriendo';
    await esperar(350);
    escena.dataset.estado = 'abierto';
    contHoja.inert = false;
    estadoEscena.v = 'abierto';
    await esperar(500);
    sonar.papel();
    inNombre.querySelector('input').focus();
  }
  sobre.addEventListener('click', abrir);

  const panelPrueba = h('div', { class: 'panel-prueba' });
  const pie = h('footer', { class: 'ingreso__pie' },
    h('p', null, TEXTOS.evaluacionIndividual),
    h('p', null, h('a', { href: '#/profesor' }, 'Acceso del profesor')));

  const cont = h('main', { class: 'vista', id: 'vista', tabindex: '-1' },
    h('section', { class: 'ingreso' },
      h('h1', { class: 'ingreso__titulo' }, TEXTOS.tituloApp),
      h('p', { class: 'ingreso__subtitulo' }, TEXTOS.subtituloApp),
      escena,
      panelPrueba,
      pie));
  montar(app, h('div', { class: 'herramientas-flotantes' }, botonSonido()), cont);
  document.title = `${TEXTO_TITULO()} · Ingreso`;
  if (mensaje) await abrir();

  if (PRUEBA_LOCAL()) pintarPanelPrueba(panelPrueba, form, inNombre, inApellido, abrir);
}

/** Ilustración del personaje (nunca un retrato de estudiante); sin imagen o si falla la carga, silueta genérica. */
function fotoPersonaje(personaje) {
  if (!personaje || !PERSONAJES_CON_IMAGEN.has(personaje.clave)) return siluetaSVG();
  const el = h('img', { class: 'polaroid__ilustracion', src: img(`personajes/${personaje.clave}`), alt: `Ilustración del personaje: ${personaje.nombre}`, loading: 'lazy' });
  el.addEventListener('error', () => el.replaceWith(siluetaSVG()), { once: true });
  return el;
}

const TEXTO_TITULO = () => TEXTOS.tituloApp;

async function pintarPanelPrueba(panel, form, inNombre, inApellido, abrir) {
  const dibujar = async () => {
    const lista = await sv.nombresDePrueba();
    const abierto = Boolean(panel.querySelector('details[open]'));
    montar(panel,
      h('details', { class: 'ayuda', open: abierto },
        h('summary', null, 'Modo de prueba: cuentas de ejemplo'),
        h('div', null,
          lista.length
            ? [h('p', null, 'Elige una cuenta de prueba (en este modo solo se guarda en este navegador):'),
              h('ul', null, lista.map((c) => h('li', null, h('button', {
                type: 'button', class: 'btn btn--chico btn--secundario',
                onclick: async () => {
                  await abrir();
                  inNombre.querySelector('input').value = c.nombre;
                  inApellido.querySelector('input').value = c.apellido;
                },
              }, `${c.nombre} ${c.apellido}${c.personaje ? ` · ${PERSONAJES[c.personaje]?.nombre}` : ' · sin personaje'}`))))]
            : h('p', null, 'Aún no hay cuentas de prueba en este navegador.'),
          h('button', { type: 'button', class: 'btn btn--chico btn--azul', onclick: async () => { await sv.cargarDatosDePrueba(); dibujar(); } },
            lista.length ? 'Agregar las cuentas de prueba que falten' : 'Crear cuentas de prueba'))));
  };
  await dibujar();
}

/* ============================== CARGA DE SESIÓN ============================== */

export async function prepararSesion(sesion) {
  const uid = sesion.uid;
  const [config, perfil] = await Promise.all([sv.cargarConfig(), sv.cargarPerfil(uid)]);
  if (!perfil) {
    const e = new Error('Tu cuenta existe, pero todavía no tiene un expediente.'); e.code = 'app/sin-perfil'; throw e;
  }
  audio.configurar({ sonidosPermitidos: config.sonidosPermitidos !== false, sonidoVolumen: config.sonidoVolumen });
  S.config = config; S.perfil = perfil; S.sesion = sesion;
  const exp = await sv.cargarExpediente(uid, {
    onEstado: pintarEstado,
    onConflicto: (c) => { conflictosPendientes = c; abrirConflictos(c); },
    metaProvider: () => ({ progreso: S.progreso?.pct ?? 0, estado: estadoDe({ respuestas: S.resp, entregadoEn: S.expediente?.entregadoEn }) }),
  });
  S.expediente = exp;
  S.resp = { ...(exp.respuestas || {}) };
  recalcular();
  if (exp.hayCambiosRecuperados) {
    setTimeout(() => avisar('Recuperamos cambios que no alcanzaron a enviarse la última vez. Se están guardando.', 'info', 7000), 600);
  }
  return true;
}

async function refrescarPerfil() {
  if (!S.sesion) return;
  try {
    const [config, perfil] = await Promise.all([sv.cargarConfig(), sv.cargarPerfil(S.sesion.uid)]);
    if (perfil) { S.perfil = perfil; }
    if (config) { S.config = config; audio.configurar({ sonidosPermitidos: config.sonidosPermitidos !== false, sonidoVolumen: config.sonidoVolumen }); }
    recalcular();
  } catch { /* sin red: se sigue con lo que hay */ }
}

/* ============================== Acciones de entrega ============================== */

function opcionesDocumento() {
  return { perfil: S.perfil, config: S.config, respuestas: S.resp, expediente: S.expediente };
}

async function descargar() {
  try {
    await sv.guardarAhora();
    const borrador = !S.expediente?.entregadoEn;
    if (borrador) {
      const ok = await confirmar({
        titulo: 'Se descargará un borrador',
        mensaje: 'Todavía no marcaste tu preparación como entregada, así que el Word saldrá con la marca «BORRADOR». Puedes descargarlo igual para revisarlo.',
        ok: 'Descargar borrador', cancelar: 'Cancelar',
      });
      if (!ok) return;
    }
    avisar('Preparando tu documento Word…');
    const nombre = await sv.descargarDocumento(opcionesDocumento());
    avisar(`Descargado: ${nombre}`, 'ok');
  } catch (e) {
    console.error(e);
    avisar(`No se pudo generar el Word: ${e.message || e}`, 'error', 8000);
  }
}

async function correo() {
  const m = await import('./document-export.js');
  const { href, asunto } = m.construirCorreo(opcionesDocumento());
  await abrirDialogo({
    titulo: 'Preparar correo de entrega',
    cuerpo: h('div', null,
      h('p', null, h('strong', null, 'Importante: '), 'el correo se abre con el asunto y el mensaje listos, pero ', h('strong', null, 'el archivo Word no se adjunta solo'), '. Debes adjuntarlo tú.'),
      h('ol', null,
        h('li', null, 'Descarga el Word con el botón «Descargar Word».'),
        h('li', null, 'Abre el correo preparado (botón de abajo).'),
        h('li', null, `Adjunta manualmente el archivo y envíalo a ${DATOS_INSTITUCIONALES.correoProfesor}.`)),
      h('p', { class: 'campo__ayuda' }, `Asunto: ${asunto}`),
      h('p', { class: 'campo__ayuda' }, 'El correo es un respaldo adicional. Marcar la preparación como entregada es lo que la registra en el sistema.')),
    acciones: [
      { texto: 'Cerrar', clase: 'btn--secundario' },
      { texto: 'Descargar Word', valor: 'word', clase: 'btn--azul' },
      { texto: 'Abrir mi correo', valor: 'correo' },
    ],
  }).then((v) => {
    if (v === 'word') descargar();
    if (v === 'correo') { window.location.href = href; }
  });
}

async function entregar() {
  if (!editable()) { avisar('La entrega está cerrada. Habla con tu profesor.', 'error'); return; }
  const pr = recalcular();
  const anticipadas = decisionesAnticipadas(S.perfil, S.resp);
  const avisos = [];
  if (pr.pendientes.length) avisos.push(`Te faltan ${pr.pendientes.length} respuesta(s) por completar.`);
  if (anticipadas.length) avisos.push(`${anticipadas.length} texto(s) parecen una decisión ya redactada, y todavía no corresponde.`);
  const ok = await confirmar({
    titulo: S.expediente?.entregadoEn ? '¿Entregar esta nueva versión?' : '¿Marcar tu preparación como entregada?',
    mensaje: h('div', null,
      avisos.length ? h('div', { class: 'aviso aviso--alerta' }, h('span', null, '!'), h('div', null, avisos.map((a) => h('p', null, a)))) : null,
      h('p', null, 'Se guardará una copia de esta versión con la fecha y hora. Después podrás seguir editando si el profesor no cierra la edición, y quedará registrado.')),
    ok: 'Sí, entregar', cancelar: 'Todavía no',
  });
  if (!ok) return;
  try {
    const r = await sv.enviarPreparacion({ progreso: pr.pct });
    S.expediente.entregadoEn = r.entregadoEn; S.expediente.version = r.version; S.expediente.editadoDespuesDeEntrega = false;
    S.expediente.estado = 'entregada';
    sonar.sello();
    avisar('Entrega registrada correctamente.', 'ok', 6000);
    notificar();
  } catch (e) {
    avisar(/permission-denied/.test(e.code || '') ? 'No se pudo entregar: la edición está cerrada.' : (e.message || 'No se pudo registrar la entrega.'), 'error', 9000);
  }
}

const acciones = {
  entregar,
  descargar,
  correo,
  guardarAhora: async () => {
    const ok = await sv.guardarAhora();
    const est = sv.consultarEstadoGuardado();
    if (ok && est.pendientes === 0) avisar('Avance guardado.', 'ok');
    else avisar('Todavía hay cambios sin guardar. Mira el estado en la parte superior.', 'error');
  },
};

/* ============================== BIENVENIDA ============================== */

async function pantallaBienvenida(vista) {
  const p = S.perfil;
  const personaje = PERSONAJES[p.personaje];
  const estado = estadoDe({ respuestas: S.resp, entregadoEn: S.expediente?.entregadoEn });
  const primera = !S.yaMostroBienvenida;
  S.yaMostroBienvenida = true;

  const datos = [
    ['Estudiante', p.nombreMostrar],
    ['Curso', p.curso || S.config.curso],
    ['Caso', p.caso ? `Caso ${p.caso}` : null],
    ['Personaje', personaje?.nombre || null],
    ['Estado', null],
    ['Último guardado', ultimoGuardado() ? fechaHora(ultimoGuardado()) : 'Aún sin guardados'],
  ];
  const ficha = h('dl', { class: 'ficha__datos' },
    datos.map(([t, d]) => h('div', null, h('dt', null, t),
      t === 'Estado'
        ? h('dd', null, h('span', { class: `sello-estado sello-estado--${estado}` }, ETIQUETA_ESTADO[estado]))
        : d ? h('dd', null, d) : h('dd', { class: 'pendiente' }, TEXTOS.pendienteAsignacion))));

  const polaroid = h('div', { class: 'polaroid' },
    h('div', { class: 'polaroid__foto' }, fotoPersonaje(personaje)),
    h('img', { class: 'polaroid__marco', src: img('polaroid'), alt: '', width: 520, height: 675 }),
    h('div', { class: 'polaroid__pie' }, personaje ? personaje.nombre : 'Sin asignar'),
    h('img', { class: 'polaroid__chinche', src: img('chinche'), alt: '', 'aria-hidden': 'true' }));

  const destino = !personaje ? '#/tablero' : `#/etapa/${S.expediente?.etapaActual && !etapaBloqueada(S.expediente.etapaActual, p) ? S.expediente.etapaActual : 1}`;
  const hoja = h('article', { class: 'hoja hoja--lectura', 'aria-labelledby': 'titulo-bienvenida', style: { animation: 'none' } },
    h('img', { class: 'hoja__cinta', src: img('cinta'), alt: '', 'aria-hidden': 'true' }),
    h('p', { class: 'etiqueta-juridica' }, `${DATOS_INSTITUCIONALES.establecimiento} · ${DATOS_INSTITUCIONALES.asignatura}`),
    h('h1', { id: 'titulo-bienvenida', tabindex: '-1' }, 'EXPEDIENTE DE PREPARACIÓN'),
    S.config.mensajeGeneral ? h('div', { class: 'nota-profesor' }, h('p', { class: 'etiqueta-juridica' }, 'Mensaje del profesor'), h('p', { style: { margin: 0, whiteSpace: 'pre-wrap' } }, S.config.mensajeGeneral)) : null,
    !editable() ? h('div', { class: 'aviso aviso--alerta' }, h('span', null, '!'), h('p', null, 'La edición está cerrada por ahora. Puedes revisar tu expediente.')) : null,
    h('div', { class: 'ficha' }, polaroid, ficha),
    !personaje ? h('div', { class: 'aviso aviso--info' }, h('span', null, 'i'), h('p', null, 'Tu caso y tu personaje aún no están asignados. Mientras tanto puedes avanzar en las etapas generales (los antecedentes y la actividad de límites).')) : null,
    h('div', { class: 'grupo-botones', style: { marginTop: '1.4rem' } },
      h('a', { class: 'btn', href: destino }, 'CONTINUAR MI PREPARACIÓN'),
      h('a', { class: 'btn btn--secundario', href: '#/instrucciones' }, 'VER INSTRUCCIONES')),
    h('p', { class: 'campo__ayuda', style: { marginTop: '1.2rem', fontWeight: 700 } }, TEXTOS.evaluacionIndividual));

  const contHoja = h('div', { class: 'escena__hoja' }, h('div', null, hoja));
  const sobre = h('div', { class: 'sobre-boton', 'aria-hidden': 'true' },
    h('img', { class: 'sobre--cerrado', src: img('sobre-cerrado'), alt: '' }),
    h('img', { class: 'sobre--abierto', src: img('sobre-abierto'), alt: '' }));
  const escena = h('div', { class: 'escena', 'data-estado': primera && !movimientoReducido() ? 'cerrado' : 'abierto' }, contHoja, sobre);
  montar(vista, h('section', { class: 'bienvenida', style: { maxWidth: '56rem', margin: '0 auto', width: '100%' } }, escena));
  document.title = `${TEXTOS.tituloApp} · Bienvenida`;
  if (primera && !movimientoReducido()) {
    await esperar(450);
    sonar.sobre();
    escena.dataset.estado = 'abriendo';
    await esperar(350);
    escena.dataset.estado = 'abierto';
    await esperar(550);
    sonar.papel();
  }
  qs('#titulo-bienvenida', vista)?.focus({ preventScroll: true });
}

/* ============================== INSTRUCCIONES ============================== */

function pantallaInstrucciones(vista) {
  montar(vista, h('article', { class: 'hoja hoja--lectura', 'aria-labelledby': 'titulo-etapa' },
    h('img', { class: 'hoja__clip', src: img('clip'), alt: '', 'aria-hidden': 'true' }),
    h('p', { class: 'etiqueta-juridica' }, 'Cómo trabajar este expediente'),
    h('h1', { id: 'titulo-etapa', tabindex: '-1' }, 'INSTRUCCIONES'),
    h('ol', null, INSTRUCCIONES.map((t) => h('li', { style: { marginBottom: '.7rem' } }, t))),
    h('div', { class: 'aviso aviso--info' }, h('span', null, 'i'), h('p', null, TEXTOS.aviso_aprendizaje)),
    h('p', { style: { fontWeight: 700 } }, TEXTOS.evaluacionIndividual),
    h('div', { class: 'grupo-botones' },
      h('a', { class: 'btn', href: '#/tablero' }, 'Ir al tablero'),
      h('button', { type: 'button', class: 'btn btn--secundario', onclick: () => history.back() }, 'Volver'))));
  document.title = `${TEXTOS.tituloApp} · Instrucciones`;
  enfocarTitulo(vista);
}

/* ============================== TABLERO DE CORCHO ============================== */

function pantallaTablero(vista) {
  const p = S.perfil;
  const pr = recalcular();
  const personaje = PERSONAJES[p.personaje];
  const estado = estadoDe({ respuestas: S.resp, entregadoEn: S.expediente?.entregadoEn });
  const barra = barraProgreso(pr.pct, 'Avance de mi preparación');
  const texto = h('span');
  const notas = ETAPAS.map((e) => {
    const bloqueada = etapaBloqueada(e.n, p);
    const x = pr.etapas[e.n];
    let detalle;
    if (e.n === 6) detalle = S.expediente?.entregadoEn ? `Entregada el ${fechaHora(S.expediente.entregadoEn)}` : 'Revisa y entrega';
    else if (bloqueada) detalle = TEXTOS.pendienteAsignacion;
    else if (x.completa) detalle = 'Completa';
    else if (x.total) detalle = `${x.hechos} de ${x.total} respuestas`;
    else detalle = 'Por comenzar';
    const completa = e.n === 6 ? Boolean(S.expediente?.entregadoEn) : x.completa;
    const hijos = [
      h('img', { class: 'nota__chinche', src: img('chinche'), alt: '', 'aria-hidden': 'true' }),
      h('span', { class: 'nota__num' }, `Etapa ${e.n}`),
      h('span', { class: 'nota__titulo' }, e.titulo),
      h('span', { class: 'nota__estado' }, detalle),
      h('span', { class: 'nota__desc' }, e.descripcion),
      e.n < 6 && !bloqueada ? barraProgreso(x.pct, `Avance de la etapa ${e.n}`) : null,
      completa ? h('span', { class: 'nota__sello' }, e.n === 6 ? 'Entregada' : 'Completa') : null,
      bloqueada ? h('img', { class: 'nota__sobre', src: img('sobre-cerrado'), alt: '', 'aria-hidden': 'true' }) : null,
    ];
    if (bloqueada) {
      const b = h('button', { type: 'button', class: 'nota nota--bloqueada', 'aria-disabled': 'true' }, hijos);
      b.addEventListener('click', () => avisar('Esta etapa se habilita cuando el profesor te asigne tu caso y tu personaje.', 'info', 6000));
      return b;
    }
    return h('a', { class: 'nota', href: `#/etapa/${e.n}` }, hijos);
  });
  texto.textContent = `${pr.hechos} de ${pr.total || '—'}`;
  const zonaNota = h('div');
  if (S.config.calificacionesVisibles) {
    sv.cargarMiEvaluacion(p.uid || S.sesion.uid).then((ev) => {
      if (!ev || !ev.puntajes) return;
      const total = totalPuntos(ev.puntajes);
      zonaNota.replaceChildren(h('div', { class: 'nota-profesor' },
        h('p', { class: 'etiqueta-juridica' }, 'Mi evaluación'),
        h('p', { style: { margin: 0, fontWeight: 700 } }, `${total} de ${PUNTAJE_TOTAL} puntos · nota ${formatearNota(calcularNota(total, S.config.escala))}`),
        ev.observaciones ? h('p', { style: { margin: '.4rem 0 0', whiteSpace: 'pre-wrap' } }, ev.observaciones) : null));
    });
  }

  montar(vista, h('section', { class: 'tablero-vista', 'aria-labelledby': 'titulo-etapa' },
    h('header', { class: 'tablero-cabecera' },
      h('div', null,
        h('p', { class: 'etiqueta-juridica' }, p.caso ? `Caso ${p.caso}${personaje ? ` · ${personaje.nombre}` : ''}` : TEXTOS.pendienteAsignacion),
        h('h1', { id: 'titulo-etapa', tabindex: '-1' }, 'MI TABLERO DE PREPARACIÓN'),
        h('p', { style: { margin: 0 } }, chipEstado(estado, Boolean(S.expediente?.editadoDespuesDeEntrega)), ' ', p.nombreMostrar)),
      h('div', { class: 'progreso-global' },
        h('div', { class: 'progreso-global__texto' }, h('span', null, 'Avance de las etapas 1 a 5'), h('span', null, `${pr.pct} %`)),
        barra)),
    S.config.mensajeGeneral ? h('div', { class: 'nota-profesor' }, h('p', { class: 'etiqueta-juridica' }, 'Mensaje del profesor'), h('p', { style: { margin: 0, whiteSpace: 'pre-wrap' } }, S.config.mensajeGeneral)) : null,
    !editable() ? h('div', { class: 'aviso aviso--alerta' }, h('span', null, '!'), h('p', null, 'La edición está cerrada. Puedes leer y descargar tu expediente.')) : null,
    zonaNota,
    h('div', { class: 'corcho' }, h('div', { class: 'corcho__rejilla' }, notas)),
    h('div', { class: 'tablero__acciones' },
      h('a', { class: 'btn btn--secundario', href: '#/instrucciones' }, 'Ver instrucciones'),
      h('button', { type: 'button', class: 'btn btn--azul', onclick: descargar }, 'Descargar Word'))));
  document.title = `${TEXTOS.tituloApp} · Tablero`;
  enfocarTitulo(vista);
}

/* ============================== MARCO DE ETAPA ============================== */

function riel(n) {
  const pr = recalcular();
  return h('nav', { class: 'riel', 'aria-label': 'Etapas del expediente' },
    h('h2', null, 'Mis etapas'),
    h('ol', null, ETAPAS.map((e) => {
      const bloqueada = etapaBloqueada(e.n, S.perfil);
      const x = pr.etapas[e.n];
      const estado = bloqueada ? 'bloqueada' : (e.n === 6 ? (S.expediente?.entregadoEn ? 'completa' : '') : x.completa ? 'completa' : x.iniciada ? 'iniciada' : '');
      const contenido = [h('span', { class: 'riel__pin' }, estado === 'completa' ? '✓' : String(e.n)), h('span', null, e.titulo,
        h('span', { class: 'riel__sub' }, bloqueada ? TEXTOS.pendienteAsignacion : e.n < 6 ? (x.total ? `${x.hechos} de ${x.total}` : '') : ''))];
      const li = h('li', { 'data-estado': estado });
      if (bloqueada) {
        const b = h('button', { type: 'button', 'aria-disabled': 'true' }, contenido);
        b.addEventListener('click', () => avisar('Disponible cuando te asignen un personaje.', 'info'));
        li.append(b);
      } else {
        li.append(h('a', { href: `#/etapa/${e.n}`, 'aria-current': e.n === n ? 'step' : null }, contenido));
      }
      return li;
    })),
    h('a', { class: 'btn btn--secundario btn--chico', href: '#/tablero' }, 'Volver al tablero'));
}

async function mostrarDesbloqueo() {
  if (movimientoReducido()) return;
  const capa = h('div', { class: 'desbloqueo', 'aria-hidden': 'true' }, h('img', { src: img('sobre-abierto'), alt: '' }));
  document.body.append(capa);
  sonar.sobre();
  await esperar(1100);
  capa.remove();
}

function pantallaEtapa(vista, n) {
  const etapa = ETAPAS.find((e) => e.n === n);
  if (!etapa) { location.hash = '#/tablero'; return; }
  const bloqueada = etapaBloqueada(n, S.perfil);
  if (bloqueada) {
    montar(vista, h('div', { class: 'hoja hoja--lectura' },
      h('h1', { id: 'titulo-etapa', tabindex: '-1' }, etapa.titulo),
      h('div', { class: 'aviso aviso--info' }, h('span', null, 'i'), h('p', null, 'Esta etapa se habilita cuando el profesor te asigne tu caso y tu personaje. Mientras tanto puedes trabajar en las etapas 2 y 3.')),
      h('a', { class: 'btn', href: '#/tablero' }, 'Volver al tablero')));
    enfocarTitulo(vista);
    return;
  }
  const ctx = {
    perfil: S.perfil, config: S.config, resp: S.resp, editable: editable(),
    cambiar, alActualizar: (fn) => oyentesVista.push(fn),
    progreso: () => S.progreso || recalcular(), expediente: () => S.expediente, ultimoGuardado,
    irACampo: (et, id) => { irAId = id; },
    acciones,
  };
  const primeraVez = !(S.expediente?.etapasVisitadas || []).includes(n);
  const articulo = renderEtapa(n, ctx);
  montar(vista, h('div', { class: 'etapa-layout' }, riel(n), articulo));
  oyentesVista.push(() => { /* el riel se redibuja al cambiar de etapa; el avance se ve en cada etapa */ });
  document.title = `${TEXTOS.tituloApp} · Etapa ${n}: ${etapa.titulo}`;
  if (n === 5) sonar.clip(); else sonar.chinche();
  if (primeraVez) mostrarDesbloqueo();

  // Guardar el avance de navegación.
  const visitadas = [...new Set([...(S.expediente?.etapasVisitadas || []), n])];
  S.expediente.etapaActual = n;
  S.expediente.etapasVisitadas = visitadas;
  if (editable()) sv.guardarProgreso({ etapaActual: n, etapasVisitadas: visitadas, progreso: S.progreso?.pct ?? 0 });

  if (irAId) {
    const id = irAId; irAId = null;
    const el = document.getElementById(id) || qs('.clasificacion input, .clasificacion fieldset', vista);
    if (el) { el.scrollIntoView({ block: 'center' }); el.focus?.({ preventScroll: true }); return; }
  }
  window.scrollTo(0, 0);
  enfocarTitulo(vista);
}

/* ============================== Rutas ============================== */

function repintar() {
  if (rutaActual && S.barra) rutaEstudiante(S.barra.raiz.parentElement, rutaActual.tipo, rutaActual.n, { forzar: true });
}

export async function rutaEstudiante(app, tipo, n = 0, { forzar = false } = {}) {
  if (!S.perfil) return;
  const vista = asegurarMarco(app);
  const mismaRuta = rutaActual && rutaActual.tipo === tipo && rutaActual.n === n;
  oyentesVista = [];
  rutaActual = { tipo, n };
  if (tipo === 'tablero' || tipo === 'bienvenida') { if (!forzar) await refrescarPerfil(); }
  if (S.barra) actualizarBarraProgreso(S.barra.progreso, recalcular().pct);
  if (tipo === 'bienvenida') await pantallaBienvenida(vista);
  else if (tipo === 'instrucciones') pantallaInstrucciones(vista);
  else if (tipo === 'etapa') pantallaEtapa(vista, n);
  else pantallaTablero(vista);
  void mismaRuta;
}
