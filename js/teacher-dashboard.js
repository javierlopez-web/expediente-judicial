/**
 * ADMINISTRACIÓN DE EXPEDIENTES (panel del profesor)
 * Ruta: #/profesor/<sección>   (resumen · nomina · seguimiento[/uid] · evaluacion · descargas · ajustes)
 *
 * La separación real entre estudiante y profesor NO está aquí: la dan Firebase Authentication (claim `profesor`)
 * y las reglas de Firestore. Este archivo solo dibuja la interfaz.
 */

import {
  h, montar, normalizar, aCSV, rutaImg, descargarTexto, descargarBlob, fechaHora, fechaCorta, hace,
} from './util.js';
import { ETAPAS, PERSONAJES, LISTA_PERSONAJES, CASOS } from './contenido.js';
import { ETIQUETA_ESTADO } from './progreso.js';
import {
  RUBRICA, PUNTAJE_TOTAL, ESCALA_PREDETERMINADA, acotarPuntaje, totalPuntos, criteriosPendientes, calcularNota, formatearNota,
} from './evaluacion.js';
import { docente, obtenerResumenDocente, modoServicios, iniciarSesionProfesor, cerrarSesion, textoErrorAuth } from './servicios.js';
import { S, avisar, confirmar, chipEstado, barraProgreso } from './ui-comun.js';
import { vistaNomina } from './teacher-nomina.js';
import { armarContenido, generarWord } from './document-export.js';

const SECCIONES = [
  ['resumen', 'Resumen'], ['nomina', 'Nómina'], ['seguimiento', 'Seguimiento'],
  ['evaluacion', 'Evaluación'], ['descargas', 'Descargas'], ['ajustes', 'Ajustes'],
];

let raiz = null;          // contenedor de la sección actual
let datos = null;         // { config, filas, totales }
let ruta = ['resumen'];
let filtros = { caso: '', personaje: '', estado: '', texto: '' };

const api = {
  datos: () => datos,
  recargar: async () => { await cargar(); pintar(); },
  pintar: () => pintar(),
};

async function cargar() {
  datos = await obtenerResumenDocente();
  S.config = datos.config;
}

/* ============================== Entrada ============================== */

export async function montarProfesor(app, partes, sesion) {
  if (!sesion || !sesion.esProfesor) { mostrarLogin(app, sesion); return; }
  ruta = partes.length ? partes : ['resumen'];
  if (!datos || !app.querySelector('.adm')) {
    montar(app, h('main', { class: 'vista adm', id: 'vista', tabindex: '-1' }, h('p', { class: 'cargando', role: 'status' }, 'Cargando expedientes…')));
    try { await cargar(); } catch (e) {
      console.error(e);
      montar(app, h('main', { class: 'vista adm', id: 'vista' }, h('div', { class: 'aviso aviso--error', role: 'alert' }, h('span', null, '!'), h('p', null, `No se pudieron cargar los datos: ${e.message || e}`)),
        h('button', { type: 'button', class: 'btn', onclick: () => location.reload() }, 'Reintentar')));
      return;
    }
    construirMarco(app, sesion);
  }
  pintar();
}

/* ============================== Ingreso del profesor ============================== */

function mostrarLogin(app, sesion) {
  datos = null;
  const correo = h('input', { id: 'p-correo', type: 'email', autocomplete: 'username', required: true });
  const pass = h('input', { id: 'p-pass', type: 'password', autocomplete: 'current-password', required: true });
  const recordar = h('input', { id: 'p-rec', type: 'checkbox' });
  const error = h('p', { role: 'alert', style: { color: 'var(--error)', fontWeight: 700, minHeight: '1.4rem' } });
  const enviar = h('button', { type: 'submit', class: 'btn' }, 'Ingresar a la administración');
  const form = h('form', { novalidate: true },
    h('div', { class: 'campo' }, h('label', { for: 'p-correo' }, 'Correo del profesor'), correo),
    h('div', { class: 'campo' }, h('label', { for: 'p-pass' }, 'Contraseña'), pass),
    h('label', { class: 'opcion' }, recordar, h('span', null, 'Mantener la sesión en este computador (no lo uses en equipos compartidos)')),
    error, enviar);
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    error.textContent = '';
    if (!correo.value || !pass.value) { error.textContent = 'Escribe tu correo y tu contraseña.'; return; }
    enviar.disabled = true;
    try { await iniciarSesionProfesor({ correo: correo.value, password: pass.value, recordar: recordar.checked }); pass.value = ''; } catch (err) {
      error.textContent = textoErrorAuth(err);
      enviar.disabled = false;
    }
  });
  montar(app, h('main', { class: 'vista', id: 'vista', tabindex: '-1' },
    h('section', { class: 'ingreso' },
      h('h1', { class: 'ingreso__titulo' }, 'ADMINISTRACIÓN DE EXPEDIENTES'),
      h('p', { class: 'ingreso__subtitulo' }, 'Acceso del profesor'),
      h('div', { class: 'hoja', style: { textAlign: 'left', animation: 'none' } },
        h('img', { class: 'hoja__cinta', src: rutaImg('cinta'), alt: '', 'aria-hidden': 'true' }),
        sesion && !sesion.esProfesor
          ? h('div', null,
            h('div', { class: 'aviso aviso--alerta', role: 'alert' }, h('span', null, '!'), h('p', null, 'Hay una sesión de estudiante abierta. Ciérrala para entrar como profesor.')),
            h('button', { type: 'button', class: 'btn', onclick: () => cerrarSesion() }, 'Cerrar la sesión de estudiante'))
          : form,
        modoServicios() === 'local' ? h('p', { class: 'campo__ayuda' }, 'Modo local de prueba: cualquier correo y contraseña sirven. Con Firebase conectado, solo ingresan cuentas con permiso de profesor.') : null),
      h('p', { class: 'ingreso__pie' }, h('a', { href: '#/' }, '← Volver al ingreso de estudiantes')))));
  document.title = 'Administración de expedientes · Ingreso';
}

/* ============================== Marco ============================== */

function construirMarco(app, sesion) {
  const nav = h('nav', { class: 'adm-nav', 'aria-label': 'Secciones de administración' },
    SECCIONES.map(([id, et]) => h('a', { href: `#/profesor/${id}`, 'data-sec': id }, et)));
  raiz = h('div', { class: 'adm-contenido', id: 'adm-contenido' });
  montar(app, h('main', { class: 'vista adm', id: 'vista', tabindex: '-1' },
    h('header', { class: 'adm-cabecera' },
      h('div', null,
        h('p', { class: 'etiqueta-juridica' }, `${S.config.nombreProyecto || 'Mi expediente judicial'} · ${S.config.curso || ''}`),
        h('h1', { id: 'titulo-adm', tabindex: '-1' }, 'ADMINISTRACIÓN DE EXPEDIENTES')),
      h('div', { class: 'adm-cabecera__acciones' },
        h('span', { class: 'campo__ayuda' }, sesion.correo || 'Profesor'),
        h('button', { type: 'button', class: 'btn btn--chico btn--secundario', onclick: async () => { await api.recargar(); avisar('Datos actualizados.', 'ok', 2000); } }, 'Actualizar datos'),
        h('button', { type: 'button', class: 'btn btn--chico btn--secundario', onclick: async () => {
          datos = null; await cerrarSesion(); location.hash = '#/';
        } }, 'Cerrar sesión'))),
    nav,
    h('div', { class: 'adm-aviso-modo' }),
    raiz));
}

function pintar() {
  if (!raiz || !datos) return;
  const sec = ruta[0] || 'resumen';
  document.querySelectorAll('.adm-nav a').forEach((a) => a.toggleAttribute('aria-current', a.dataset.sec === sec));
  document.querySelectorAll('.adm-nav a').forEach((a) => { if (a.dataset.sec === sec) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
  const vistas = {
    resumen: vistaResumen, nomina: () => vistaNomina(api), seguimiento: vistaSeguimiento,
    evaluacion: vistaEvaluacion, descargas: vistaDescargas, ajustes: vistaAjustes,
  };
  const f = vistas[sec] || vistaResumen;
  const scroll = window.scrollY;
  montar(raiz, f());
  document.title = `Administración · ${SECCIONES.find((s) => s[0] === sec)?.[1] || ''}`;
  if (ruta.length > 1 || sec !== 'nomina') window.scrollTo(0, ruta.length > 1 ? 0 : scroll);
}

/* ============================== Utilidades de vista ============================== */

const nombreFila = (f) => f.perfil.nombreMostrar || `${f.perfil.nombre} ${f.perfil.apellido}`;

function tarjeta(valor, etiqueta, extra) {
  return h('div', { class: 'adm-tarjeta' }, h('strong', null, String(valor)), h('span', null, etiqueta), extra || null);
}

function filasFiltradas() {
  const q = normalizar(filtros.texto);
  return datos.filas.filter((f) =>
    (!filtros.caso || String(f.perfil.caso) === filtros.caso)
    && (!filtros.personaje || (filtros.personaje === '_sin' ? !f.perfil.personaje : f.perfil.personaje === filtros.personaje))
    && (!filtros.estado || f.estado === filtros.estado)
    && (!q || normalizar(nombreFila(f)).includes(q)));
}

function controlesFiltro(alCambiar) {
  const sel = (clave, etiqueta, opciones) => h('label', { class: 'adm-filtro' }, h('span', null, etiqueta),
    h('select', { onchange: (e) => { filtros[clave] = e.target.value; alCambiar(); } },
      h('option', { value: '' }, 'Todos'),
      opciones.map(([v, t]) => h('option', { value: v, selected: filtros[clave] === v }, t))));
  return h('div', { class: 'adm-filtros' },
    sel('caso', 'Caso', CASOS.map((c) => [String(c), `Caso ${c}`])),
    sel('personaje', 'Personaje', [['_sin', 'Sin asignar'], ...LISTA_PERSONAJES.map((p) => [p.clave, p.nombre])]),
    sel('estado', 'Estado', Object.entries(ETIQUETA_ESTADO)),
    h('label', { class: 'adm-filtro' }, h('span', null, 'Buscar nombre'),
      h('input', { type: 'search', value: filtros.texto, oninput: (e) => { filtros.texto = e.target.value; alCambiar(true); } })));
}

function tablaProgreso(lista, { completa = false } = {}) {
  if (!lista.length) return h('p', { class: 'aviso aviso--info' }, 'Ningún estudiante coincide con los filtros.');
  return h('div', { class: 'adm-tabla-cont' }, h('table', { class: 'adm-tabla' },
    h('thead', null, h('tr', null,
      ['Estudiante', 'Caso', 'Personaje', 'Estado', 'Avance', 'Último guardado', 'Entrega', ...(completa ? ['Etapas pendientes'] : []), ''].map((x) => h('th', { scope: 'col' }, x)))),
    h('tbody', null, lista.map((f) => {
      const pend = ETAPAS.filter((e) => e.n < 6).filter((e) => { const x = f.progreso.etapas[e.n]; return !x.bloqueada && x.total && !x.completa; }).map((e) => e.n);
      return h('tr', null,
        h('td', null, h('strong', null, nombreFila(f)), f.perfil.activo === false ? h('span', { class: 'chip chip--rojo' }, 'suspendida') : null),
        h('td', null, f.perfil.caso ? `Caso ${f.perfil.caso}` : '—'),
        h('td', null, PERSONAJES[f.perfil.personaje]?.nombre || '—'),
        h('td', null, chipEstado(f.estado, f.conCambiosPosteriores)),
        h('td', { style: { minWidth: '8rem' } }, barraProgreso(f.progreso.pct, `Avance de ${nombreFila(f)}`), h('small', null, `${f.progreso.pct} %`)),
        h('td', null, f.ultimoGuardado ? h('span', { title: fechaHora(f.ultimoGuardado) }, hace(f.ultimoGuardado)) : '—'),
        h('td', null, f.entregadoEn ? fechaCorta(f.entregadoEn) : '—'),
        completa ? h('td', null, pend.length ? pend.join(', ') : '—') : null,
        h('td', null, h('a', { class: 'btn btn--chico btn--secundario', href: `#/profesor/seguimiento/${f.uid}` }, 'Ver')));
    }))));
}

/* ============================== RESUMEN ============================== */

function vistaResumen() {
  const t = datos.totales;
  const cont = h('div');
  const pintarTabla = (soloTabla) => {
    const lista = filasFiltradas();
    const tabla = h('div', null, h('p', { class: 'campo__ayuda' }, `${lista.length} de ${datos.filas.length} estudiantes`), tablaProgreso(lista));
    const viejo = cont.querySelector('.adm-zona-tabla');
    if (soloTabla && viejo) { viejo.replaceChildren(tabla); return; }
    cont.querySelector('.adm-zona-tabla')?.replaceChildren(tabla);
  };
  const zona = h('div', { class: 'adm-zona-tabla' });
  cont.append(...[
    h('h2', { id: 'adm-titulo' }, 'Resumen del curso'),
    S.config.edicionHabilitada === false ? h('div', { class: 'aviso aviso--alerta' }, h('span', null, '!'), h('p', null, 'La edición está cerrada para todos los estudiantes (Ajustes).')) : null,
    h('div', { class: 'adm-tarjetas' },
      tarjeta(t.estudiantes, 'estudiantes'), tarjeta(t.conRol, 'con caso y personaje'),
      tarjeta(t.sinIniciar, 'sin iniciar'), tarjeta(t.enDesarrollo, 'en desarrollo'), tarjeta(t.entregadas, 'entregadas'),
      tarjeta(t.ultimaActividad ? hace(t.ultimaActividad) : '—', 'última actividad')),
    h('h3', null, 'Por caso'),
    h('div', { class: 'adm-tarjetas' }, t.porCaso.map((c) => h('div', { class: 'adm-tarjeta' },
      h('strong', null, `Caso ${c.caso}`), h('span', null, `${c.total} estudiantes · ${c.entregadas} entregadas · ${c.enDesarrollo} en desarrollo`),
      barraProgreso(c.total ? Math.round((c.entregadas / c.total) * 100) : 0, `Entregas del caso ${c.caso}`)))),
    t.estudiantes === 0 ? h('div', { class: 'aviso aviso--info' }, h('span', null, 'i'), h('p', null, 'Aún no hay estudiantes. Parte en «Nómina» para crear las cuentas.')) : null,
    h('h3', null, 'Estudiantes'),
    controlesFiltro(pintarTabla),
    zona].filter(Boolean));
  zona.replaceChildren();
  pintarTabla();
  return cont;
}

/* ============================== SEGUIMIENTO ============================== */

function vistaSeguimiento() {
  if (ruta[1]) return vistaDetalle(ruta[1]);
  const zona = h('div');
  const pintarTabla = () => zona.replaceChildren(h('p', { class: 'campo__ayuda' }, `${filasFiltradas().length} de ${datos.filas.length} estudiantes`), tablaProgreso(filasFiltradas(), { completa: true }));
  pintarTabla();
  return h('section', { 'aria-labelledby': 'adm-titulo' },
    h('h2', { id: 'adm-titulo' }, 'Seguimiento de preparaciones'),
    h('p', null, 'El avance se recalcula aquí a partir de las respuestas guardadas, no del número que informa el estudiante.'),
    controlesFiltro(pintarTabla), zona);
}

async function descargarWordDe(f, version) {
  try {
    const exp = version ? { ...f.expediente, entregadoEn: version.entregadoEn, version: version.numero, editadoDespuesDeEntrega: false } : f.expediente;
    const respuestas = version ? version.respuestas : (f.expediente?.respuestas || {});
    const { blob, nombre } = await generarWord({ perfil: f.perfil, respuestas, expediente: exp });
    descargarBlob(blob, version ? nombre.replace('.docx', `_v${version.numero}.docx`) : nombre);
  } catch (e) { avisar(`No se pudo generar el Word: ${e.message}`, 'error'); }
}

function vistaDetalle(uid) {
  const f = datos.filas.find((x) => x.uid === uid);
  if (!f) return h('div', null, h('p', { class: 'aviso aviso--error' }, 'No se encontró al estudiante.'), h('a', { class: 'btn', href: '#/profesor/seguimiento' }, 'Volver'));
  const resp = f.expediente?.respuestas || {};
  const contenido = armarContenido({ perfil: f.perfil, respuestas: resp, expediente: f.expediente });
  const zonaVersiones = h('div');
  docente.listarVersiones(uid).then((vs) => {
    zonaVersiones.replaceChildren(vs.length
      ? h('ul', null, vs.map((v) => h('li', null, `Versión ${v.numero} · ${fechaHora(v.entregadoEn)} `, h('button', { type: 'button', class: 'btn btn--chico btn--secundario', onclick: () => descargarWordDe(f, v) }, 'Word de esta versión'))))
      : h('p', { class: 'campo__ayuda' }, 'Todavía no hay versiones entregadas.'));
  }).catch(() => zonaVersiones.replaceChildren(h('p', { class: 'campo__ayuda' }, 'No se pudieron leer las versiones.')));

  const pendientes = f.progreso.pendientes;
  return h('section', { 'aria-labelledby': 'adm-titulo' },
    h('p', null, h('a', { href: '#/profesor/seguimiento' }, '← Volver al seguimiento')),
    h('h2', { id: 'adm-titulo' }, nombreFila(f)),
    h('p', null, chipEstado(f.estado, f.conCambiosPosteriores), ' ',
      f.perfil.caso ? `Caso ${f.perfil.caso}` : 'Sin caso', ' · ', PERSONAJES[f.perfil.personaje]?.nombre || 'sin personaje', ' · ', f.perfil.curso || ''),
    f.conCambiosPosteriores ? h('div', { class: 'aviso aviso--alerta' }, h('span', null, '!'), h('p', null, `El estudiante editó después de entregar${f.expediente?.ultimaEdicionPosterior ? ` (${fechaHora(f.expediente.ultimaEdicionPosterior)})` : ''}. La versión entregada se conserva abajo.`)) : null,
    h('div', { class: 'adm-tarjetas' },
      tarjeta(`${f.progreso.pct} %`, 'avance (etapas 1 a 5)'),
      tarjeta(f.entregadoEn ? fechaHora(f.entregadoEn) : '—', 'fecha de entrega'),
      tarjeta(f.ultimoGuardado ? fechaHora(f.ultimoGuardado) : '—', 'último guardado')),
    h('div', { class: 'adm-barra-herramientas' },
      h('button', { type: 'button', class: 'btn btn--azul', onclick: () => descargarWordDe(f) }, 'Descargar Word (versión actual)'),
      h('a', { class: 'btn btn--secundario', href: '#/profesor/evaluacion/' + uid }, 'Evaluar'),
      h('button', { type: 'button', class: 'btn btn--secundario', onclick: async () => {
        const cerrar = !f.perfil.cerrado;
        if (!(await confirmar({ titulo: cerrar ? 'Cerrar edición' : 'Reabrir edición', mensaje: cerrar ? `${nombreFila(f)} ya no podrá editar su preparación.` : `${nombreFila(f)} podrá volver a editar.`, ok: cerrar ? 'Cerrar edición' : 'Reabrir' }))) return;
        try { await docente.actualizarEstudiante(uid, { cerrado: cerrar }); await api.recargar(); } catch (e) { avisar(e.message, 'error'); }
      } }, f.perfil.cerrado ? 'Reabrir edición de este estudiante' : 'Cerrar edición de este estudiante')),
    h('h3', null, 'Avance por etapa'),
    h('ul', { class: 'resumen-etapas' }, ETAPAS.filter((e) => e.n < 6).map((e) => {
      const x = f.progreso.etapas[e.n];
      return h('li', null, h('span', null, h('strong', null, `${e.n}. ${e.titulo}`)),
        h('span', { class: `chip ${x.completa ? 'chip--verde' : x.bloqueada ? 'chip--gris' : x.iniciada ? 'chip--ambar' : 'chip--gris'}` }, x.bloqueada ? 'Sin personaje' : x.total ? `${x.hechos} de ${x.total}` : '—'));
    })),
    pendientes.length ? h('details', { class: 'ayuda' }, h('summary', null, `Secciones incompletas (${pendientes.length})`),
      h('div', null, h('ul', null, pendientes.map((p) => h('li', null, `Etapa ${p.etapa}: ${p.etiqueta}`))))) : h('p', { class: 'aviso aviso--ok' }, 'No quedan respuestas pendientes.'),
    h('h3', null, 'Versiones entregadas'), zonaVersiones,
    h('h3', null, 'Respuestas del estudiante'),
    contenido.secciones.map((s) => h('article', { class: 'adm-seccion-resp' },
      h('h4', null, s.titulo),
      s.bloques.map((b) => [
        b.subtitulo ? h('h5', null, b.subtitulo) : null,
        b.campos.map((c) => h('div', { class: 'adm-qa' }, h('p', { class: 'adm-qa__p' }, c.etiqueta), c.respuesta ? h('p', { class: 'adm-qa__r' }, c.respuesta) : h('p', { class: 'adm-qa__vacio' }, '(sin responder)'))),
      ]))));
}

/* ============================== EVALUACIÓN ============================== */

function vistaEvaluacion() {
  const escala = { ...ESCALA_PREDETERMINADA, ...(S.config.escala || {}) };
  const evPorUid = new Map(datos.filas.map((f) => [f.uid, f.evaluacion]));
  const uidSel = ruta[1] || '';
  const filaSel = datos.filas.find((f) => f.uid === uidSel);

  const lista = h('ul', { class: 'adm-lista-eval' }, datos.filas
    .slice().sort((a, b) => `${a.perfil.apellido}${a.perfil.nombre}`.localeCompare(`${b.perfil.apellido}${b.perfil.nombre}`, 'es'))
    .map((f) => {
      const ev = evPorUid.get(f.uid);
      const total = ev ? totalPuntos(ev.puntajes) : null;
      return h('li', null, h('a', { href: `#/profesor/evaluacion/${f.uid}`, 'aria-current': f.uid === uidSel ? 'true' : null },
        h('span', null, nombreFila(f)), h('small', null, ev ? `${total} pts · ${formatearNota(calcularNota(total, escala))}` : 'sin evaluar')));
    }));

  const panelEscala = vistaEscala(escala);
  return h('section', { 'aria-labelledby': 'adm-titulo' },
    h('h2', { id: 'adm-titulo' }, 'Evaluación'),
    h('p', null, 'Los puntajes los asignas tú. La aplicación solo suma y convierte a nota; no califica por sí sola. Las actividades de práctica de los estudiantes no se consideran.'),
    h('div', { class: 'adm-eval' },
      h('div', null, h('h3', null, 'Estudiantes'), lista),
      h('div', null, filaSel ? formularioEvaluacion(filaSel, escala) : h('p', { class: 'aviso aviso--info' }, 'Elige un estudiante de la lista.'), panelEscala)));
}

function formularioEvaluacion(f, escala) {
  const ev = f.evaluacion || {};
  const puntajes = { ...(ev.puntajes || {}) };
  const salida = h('div', { class: 'adm-total', 'aria-live': 'polite' });
  const subtotales = {};
  const actualizar = () => {
    const total = totalPuntos(puntajes);
    const pend = criteriosPendientes(puntajes);
    for (const d of RUBRICA) subtotales[d.id].textContent = `${d.criterios.reduce((s, c) => s + (Number(puntajes[c.id]) || 0), 0)} / ${d.max}`;
    salida.replaceChildren(h('strong', null, `${total} / ${PUNTAJE_TOTAL} puntos`), ' → nota ', h('strong', null, formatearNota(calcularNota(total, escala))),
      pend ? h('span', { class: 'chip chip--ambar' }, `${pend} criterios sin evaluar`) : h('span', { class: 'chip chip--verde' }, 'completa'));
  };
  const obs = h('textarea', { rows: 4, 'aria-label': 'Observaciones' }); obs.value = ev.observaciones || '';
  const bloques = RUBRICA.map((d) => {
    subtotales[d.id] = h('span');
    return h('fieldset', { class: 'adm-dimension' },
      h('legend', null, `${d.titulo} (${d.max} pts) `, subtotales[d.id]),
      d.criterios.map((c) => {
        const inp = h('input', { type: 'number', min: 0, max: c.max, step: 0.5, inputmode: 'decimal', value: puntajes[c.id] ?? '', 'aria-label': `${c.texto} (máx. ${c.max})` });
        inp.addEventListener('input', () => {
          const v = acotarPuntaje(inp.value, c.max);
          if (v === null) delete puntajes[c.id]; else puntajes[c.id] = v;
          actualizar();
        });
        inp.addEventListener('change', () => { if (puntajes[c.id] !== undefined) inp.value = puntajes[c.id]; });
        return h('label', { class: 'adm-criterio' }, h('span', null, c.texto), h('span', { class: 'adm-criterio__pts' }, inp, ` / ${c.max}`));
      }));
  });
  actualizar();
  return h('div', { class: 'adm-form-eval' },
    h('h3', null, nombreFila(f)),
    h('p', null, chipEstado(f.estado), ' ', f.entregadoEn ? `Entregó el ${fechaCorta(f.entregadoEn)}` : 'Sin entrega', ' · ', h('a', { href: `#/profesor/seguimiento/${f.uid}` }, 'Ver su expediente')),
    bloques, salida,
    h('div', { class: 'campo' }, h('label', null, 'Observaciones para el estudiante (opcional)'), obs),
    h('button', { type: 'button', class: 'btn', onclick: async () => {
      const total = totalPuntos(puntajes);
      try {
        await docente.guardarEvaluacion(f.uid, { puntajes, observaciones: obs.value.trim(), total, nota: calcularNota(total, escala), evaluadoPor: 'profesor' });
        await api.recargar();
        avisar('Evaluación guardada.', 'ok');
      } catch (e) { avisar(e.message || 'No se pudo guardar.', 'error'); }
    } }, 'Guardar evaluación'));
}

function vistaEscala(escala) {
  const campo = (clave, et, extra = {}) => h('div', { class: 'campo' }, h('label', { for: `esc-${clave}` }, et),
    h('input', { id: `esc-${clave}`, type: 'number', step: 'any', value: escala[clave], ...extra }));
  const tablaPrev = h('div');
  const leer = () => ({
    puntajeMax: PUNTAJE_TOTAL,
    exigencia: Number(document.getElementById('esc-exigencia').value),
    notaMin: Number(document.getElementById('esc-notaMin').value),
    notaAprobacion: Number(document.getElementById('esc-notaAprobacion').value),
    notaMax: Number(document.getElementById('esc-notaMax').value),
  });
  const previa = () => {
    const e = leer();
    tablaPrev.replaceChildren(h('p', { class: 'campo__ayuda' }, [0, 25, 40, 50, 60, 70, 80, 90, 100].map((p) => `${p} pts → ${formatearNota(calcularNota(p, e))}`).join(' · ')));
  };
  const cont = h('details', { class: 'ayuda adm-escala', open: false },
    h('summary', null, `Escala de notas (exigencia ${escala.exigencia} %)`),
    h('div', null,
      h('p', null, 'La escala depende del reglamento de evaluación del establecimiento. Se parte con 60 % de exigencia para la nota 4,0; ajústala si tu reglamento es distinto.'),
      h('div', { class: 'adm-form-2' }, campo('exigencia', 'Exigencia (% para el 4,0)', { min: 1, max: 99 }), campo('notaMin', 'Nota mínima', { step: 0.1 }), campo('notaAprobacion', 'Nota de aprobación', { step: 0.1 }), campo('notaMax', 'Nota máxima', { step: 0.1 })),
      tablaPrev,
      h('button', { type: 'button', class: 'btn btn--secundario', onclick: async () => {
        const e = leer();
        if (!(e.exigencia >= 1 && e.exigencia <= 99) || !(e.notaMin < e.notaAprobacion && e.notaAprobacion < e.notaMax)) { avisar('Revisa la escala: la nota mínima < aprobación < máxima y la exigencia entre 1 y 99.', 'error', 7000); return; }
        try { await docente.guardarConfig({ escala: e }); await api.recargar(); avisar('Escala guardada. Las notas se recalculan con ella.', 'ok'); } catch (err) { avisar(err.message, 'error'); }
      } }, 'Guardar escala')));
  cont.addEventListener('input', previa);
  setTimeout(previa, 0);
  return cont;
}

/* ============================== DESCARGAS ============================== */

let promesaZip = null;
function cargarJSZip() {
  if (globalThis.JSZip) return Promise.resolve(globalThis.JSZip);
  if (globalThis.__cargarIncrustado) { const v = globalThis.__cargarIncrustado('JSZip'); if (v) return Promise.resolve(v); }
  promesaZip ||= new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = new URL('vendor/jszip.min.js', document.baseURI).href;
    s.onload = () => res(globalThis.JSZip);
    s.onerror = () => { promesaZip = null; rej(new Error('No se pudo cargar JSZip.')); };
    document.head.append(s);
  });
  return promesaZip;
}

function filasCSVProgreso() {
  return datos.filas.map((f) => [
    f.perfil.apellido, f.perfil.nombre, f.perfil.curso || '', f.perfil.caso || '', PERSONAJES[f.perfil.personaje]?.nombre || '',
    ETIQUETA_ESTADO[f.estado], f.progreso.pct, f.progreso.hechos, f.progreso.total,
    ...ETAPAS.filter((e) => e.n < 6).map((e) => { const x = f.progreso.etapas[e.n]; return x.bloqueada ? 'sin personaje' : `${x.hechos}/${x.total}`; }),
    f.ultimoGuardado ? fechaHora(f.ultimoGuardado) : '', f.entregadoEn ? fechaHora(f.entregadoEn) : '', f.conCambiosPosteriores ? 'sí' : '',
  ]);
}

function vistaDescargas() {
  const estado = h('p', { role: 'status', class: 'campo__ayuda' });
  const hoy = new Date().toISOString().slice(0, 10);
  const escala = { ...ESCALA_PREDETERMINADA, ...(S.config.escala || {}) };
  const sel = h('select', { 'aria-label': 'Estudiante' }, datos.filas.map((f) => h('option', { value: f.uid }, nombreFila(f))));
  return h('section', { 'aria-labelledby': 'adm-titulo' },
    h('h2', { id: 'adm-titulo' }, 'Descargas'),
    h('div', { class: 'adm-descargas' },
      h('div', { class: 'adm-descarga' }, h('h3', null, 'Word de un estudiante'), sel,
        h('button', { type: 'button', class: 'btn btn--azul', onclick: () => { const f = datos.filas.find((x) => x.uid === sel.value); if (f) descargarWordDe(f); } }, 'Descargar Word')),
      h('div', { class: 'adm-descarga' }, h('h3', null, 'Todos los Word'), h('p', null, 'Un archivo ZIP con el Word de cada estudiante que tenga personaje.'),
        h('button', { type: 'button', class: 'btn btn--azul', onclick: async (ev) => {
          const b = ev.currentTarget; b.disabled = true;
          try {
            const JSZip = await cargarJSZip();
            const zip = new JSZip();
            const lista = datos.filas.filter((f) => f.perfil.personaje);
            let n = 0;
            for (const f of lista) {
              estado.textContent = `Generando ${++n} de ${lista.length}…`;
              const { blob, nombre } = await generarWord({ perfil: f.perfil, respuestas: f.expediente?.respuestas || {}, expediente: f.expediente });
              zip.file(nombre, blob);
            }
            const blob = await zip.generateAsync({ type: 'blob' });
            descargarBlob(blob, `Preparaciones_${hoy}.zip`);
            estado.textContent = `Listo: ${lista.length} documentos.`;
          } catch (e) { estado.textContent = ''; avisar(`No se pudo generar el ZIP: ${e.message}`, 'error'); } finally { b.disabled = false; }
        } }, 'Descargar todos (ZIP)')),
      h('div', { class: 'adm-descarga' }, h('h3', null, 'CSV de progreso'),
        h('button', { type: 'button', class: 'btn btn--azul', onclick: () => descargarTexto(aCSV(
          ['Apellido', 'Nombre', 'Curso', 'Caso', 'Personaje', 'Estado', 'Avance %', 'Respondidas', 'Requeridas', ...ETAPAS.filter((e) => e.n < 6).map((e) => `Etapa ${e.n}`), 'Último guardado', 'Entregada', 'Edición posterior'],
          filasCSVProgreso()), `progreso_${hoy}.csv`) }, 'Descargar CSV')),
      h('div', { class: 'adm-descarga' }, h('h3', null, 'CSV de calificaciones'),
        h('button', { type: 'button', class: 'btn btn--azul', onclick: () => descargarTexto(aCSV(
          ['Apellido', 'Nombre', 'Curso', 'Caso', 'Personaje', ...RUBRICA.map((d) => `${d.titulo} (${d.max})`), 'Total (100)', 'Nota'],
          datos.filas.map((f) => {
            const ev = f.evaluacion;
            const p = ev?.puntajes || {};
            const total = ev ? totalPuntos(p) : '';
            return [f.perfil.apellido, f.perfil.nombre, f.perfil.curso || '', f.perfil.caso || '', PERSONAJES[f.perfil.personaje]?.nombre || '',
              ...RUBRICA.map((d) => (ev ? d.criterios.reduce((s, c) => s + (Number(p[c.id]) || 0), 0) : '')), total, ev ? formatearNota(calcularNota(total, escala)) : ''];
          })), `calificaciones_${hoy}.csv`) }, 'Descargar CSV')),
      h('div', { class: 'adm-descarga' }, h('h3', null, 'Respaldo general'), h('p', null, 'Todo el contenido (ajustes, estudiantes, expedientes, versiones y evaluaciones) en un JSON. Contiene datos personales: guárdalo en un lugar privado.'),
        h('button', { type: 'button', class: 'btn btn--azul', onclick: async () => {
          try { const todo = await docente.exportarTodo(); descargarTexto(JSON.stringify(todo, replacerFechas, 2), `respaldo_expedientes_${hoy}.json`, 'application/json'); } catch (e) { avisar(e.message, 'error'); }
        } }, 'Descargar respaldo (JSON)'))),
    estado);
}

function replacerFechas(k, v) {
  if (v && typeof v === 'object' && typeof v.toDate === 'function') return v.toDate().toISOString();
  return v;
}

/* ============================== AJUSTES ============================== */

function vistaAjustes() {
  const c = S.config;
  const campo = (id, et, ctrl) => h('div', { class: 'campo' }, h('label', { for: id }, et), ctrl);
  const nombre = h('input', { id: 'a-nombre', type: 'text', value: c.nombreProyecto || '' });
  const curso = h('input', { id: 'a-curso', type: 'text', value: c.curso || '' });
  const fecha = h('input', { id: 'a-fecha', type: 'date', value: c.fechaLimite ? String(c.fechaLimite).slice(0, 10) : '' });
  const mensaje = h('textarea', { id: 'a-mensaje', rows: 3 }); mensaje.value = c.mensajeGeneral || '';
  const reglas = h('textarea', { id: 'a-reglas', rows: 4 }); reglas.value = c.reglasEntrega || '';
  const editar = h('input', { id: 'a-editar', type: 'checkbox', checked: c.edicionHabilitada !== false });
  const notas = h('input', { id: 'a-notas', type: 'checkbox', checked: Boolean(c.calificacionesVisibles) });
  const sonidos = h('input', { id: 'a-sonidos', type: 'checkbox', checked: c.sonidosPermitidos !== false });
  const volumen = h('input', { id: 'a-vol', type: 'range', min: 0, max: 1, step: 0.05, value: c.sonidoVolumen ?? 0.5, 'aria-label': 'Volumen de los sonidos' });
  const opcion = (input, id, texto) => h('div', null, h('label', { class: 'opcion', for: id }, input, h('span', null, texto)));

  return h('section', { 'aria-labelledby': 'adm-titulo' },
    h('h2', { id: 'adm-titulo' }, 'Ajustes del proyecto'),
    h('form', { class: 'adm-ajustes', onsubmit: async (e) => {
      e.preventDefault();
      const nuevo = {
        nombreProyecto: nombre.value.trim() || 'Mi expediente judicial', curso: curso.value.trim(), fechaLimite: fecha.value || '',
        mensajeGeneral: mensaje.value.trim(), reglasEntrega: reglas.value.trim(),
        edicionHabilitada: editar.checked, calificacionesVisibles: notas.checked, sonidosPermitidos: sonidos.checked, sonidoVolumen: Number(volumen.value),
      };
      try { await docente.guardarConfig(nuevo); await api.recargar(); avisar('Ajustes guardados.', 'ok'); } catch (err) { avisar(err.message || 'No se pudieron guardar.', 'error'); }
    } },
      h('div', { class: 'adm-form-2' }, campo('a-nombre', 'Nombre del proyecto', nombre), campo('a-curso', 'Curso', curso)),
      campo('a-fecha', 'Fecha límite de la preparación (informativa)', fecha),
      campo('a-mensaje', 'Mensaje general para los estudiantes (aparece en la bienvenida y el tablero)', mensaje),
      campo('a-reglas', 'Reglas de entrega (se muestran en la revisión final)', reglas),
      opcion(editar, 'a-editar', 'Edición habilitada (desmárcala para cerrar la edición de todos los estudiantes)'),
      opcion(notas, 'a-notas', 'Mostrar calificaciones a los estudiantes'),
      opcion(sonidos, 'a-sonidos', 'Permitir la ambientación sonora (siempre parte desactivada; cada estudiante la activa)'),
      campo('a-vol', 'Volumen de los sonidos', volumen),
      h('button', { type: 'submit', class: 'btn' }, 'Guardar ajustes')),
    modoServicios() === 'local' ? h('div', { class: 'adm-peligro' },
      h('h3', null, 'Modo local de prueba'),
      h('p', null, 'Estos datos viven solo en este navegador.'),
      h('button', { type: 'button', class: 'btn btn--peligro', onclick: async () => {
        if (!(await confirmar({ titulo: 'Borrar los datos de prueba', mensaje: 'Se borrarán estudiantes, expedientes y evaluaciones de este navegador.', ok: 'Borrar todo', peligro: true }))) return;
        await docente.borrarDatosLocales(); await api.recargar();
      } }, 'Borrar todos los datos de prueba')) : null);
}
