/**
 * ESPACIO DEL ESTUDIANTE (v4): ingreso, índice simple y secciones.
 *   Mi personaje · Trabajo escrito · Rúbrica de evaluación · Revisar, descargar y entregar
 * Todo se guarda solo. El Word sigue el mismo orden del índice.
 */

import { h, montar, esperar, fechaHora, rutaImg, soloDigitos } from './util.js';
import {
  PERSONAJES, NOMBRE_CASOS, TEXTOS, FUNCION, PERSONAJES_CON_IMAGEN,
  secciones, avance, completo, tieneAlgo, requerido, contarPalabras, idsDe,
  INSTRUCCIONES_TRABAJO, NIVELES_RUBRICA, rubrica, puntajesNivel, nombreTrabajo, entregaVigente,
} from './contenido.js';
import * as sv from './servicios.js';
import { TEXTO_ESTADO } from './guardado.js';
import * as audio from './audio.js';
import { sonar } from './audio.js';
import { S, avisar, abrirDialogo, confirmar, botonSonido, barraProgreso, actualizarBarraProgreso, siluetaSVG } from './ui-comun.js';

const img = rutaImg;
const PRUEBA_LOCAL = () => sv.modoServicios() === 'local';

let oyentes = [];
let raf = 0;

const editable = () => Boolean(S.config?.edicionHabilitada !== false && S.perfil?.activo !== false && !S.perfil?.cerrado);
const bloqueCAbierto = () => Boolean(S.config?.bloqueCHabilitado);
const clave = () => S.perfil?.personaje;

function notificar() {
  S.avance = avance(clave(), S.resp);
  for (const fn of oyentes) { try { fn(); } catch (e) { console.error(e); } }
}

function cambiar(id, valor) {
  S.resp[id] = valor;
  try { sv.guardarRespuesta(id, valor); } catch (e) { avisar(e.message, 'error'); }
  cancelAnimationFrame(raf);
  raf = requestAnimationFrame(notificar);
}

/* ============================== Guardado ============================== */

function pintarEstado(est) {
  S.guardado = est;
  const b = S.barra?.estado;
  if (est.codigo === 'guardado' && est.ultimo) S.ultimoGuardado = est.ultimo;
  if (!b) return;
  let texto = TEXTO_ESTADO[est.codigo] || est.codigo;
  if (est.codigo === 'guardado' && est.ultimo) texto = `Guardado · ${new Intl.DateTimeFormat('es-CL', { hour: '2-digit', minute: '2-digit' }).format(new Date(est.ultimo))}`;
  b.textContent = texto;
  b.dataset.estado = est.codigo;
  if (est.codigo === 'error' && est.mensaje) avisar(est.mensaje, 'error', 8000);
}

async function abrirConflictos(conflictos) {
  const decisiones = Object.fromEntries(conflictos.map((c) => [c.id, 'mia']));
  await abrirDialogo({
    titulo: 'Este texto cambió desde otro dispositivo',
    cuerpo: h('div', null, h('p', null, 'Escribiste en dos dispositivos a la vez. Se conservará lo que escribiste aquí; lo del otro dispositivo se muestra abajo por si quieres copiarlo.'),
      conflictos.map((c) => h('details', { class: 'ayuda' }, h('summary', null, 'Ver lo guardado desde el otro dispositivo'), h('pre', { class: 'pre-conflicto' }, c.servidor || '(vacío)')))),
    acciones: [{ texto: 'Entendido', valor: true }],
  });
  const aplicados = await sv.resolverConflictos(decisiones);
  Object.assign(S.resp, aplicados);
  notificar();
}

/* ============================== Sesión ============================== */

export async function prepararSesion(sesion) {
  const uid = sesion.uid;
  const [config, perfil] = await Promise.all([sv.cargarConfig(), sv.cargarPerfil(uid)]);
  if (!perfil) throw Object.assign(new Error('sin perfil'), { code: 'app/sin-perfil' });
  if (perfil.activo === false) throw Object.assign(new Error('suspendida'), { code: 'auth/user-disabled' });
  audio.configurar({ sonidosPermitidos: config.sonidosPermitidos !== false, sonidoVolumen: config.sonidoVolumen });
  const exp = await sv.cargarExpediente(uid, {
    onEstado: pintarEstado,
    onConflicto: abrirConflictos,
    metaProvider: () => ({ progreso: S.avance?.preparacion ?? 0, estado: S.expediente?.entregadoEn ? undefined : 'en_desarrollo' }),
  });
  Object.assign(S, { sesion, config, perfil, expediente: exp, resp: { ...(exp.respuestas || {}) } });
  S.avance = avance(perfil.personaje, S.resp);
}

export function limpiarSesion() {
  sv.liberarSesion();
  Object.assign(S, { sesion: null, config: null, perfil: null, expediente: null, resp: {}, avance: null, barra: null, ultimoGuardado: null });
  oyentes = [];
}

export async function cerrarSesionUI() {
  try {
    await sv.guardarAhora();
    if (sv.consultarEstadoGuardado().pendientes > 0) {
      const ok = await confirmar({ titulo: 'Hay cambios sin enviar', mensaje: 'No pudimos guardar tus últimos cambios. Quedan en este dispositivo y se enviarán cuando vuelvas a ingresar aquí. ¿Salir igual?', ok: 'Salir', cancelar: 'Seguir', peligro: true });
      if (!ok) return;
    }
  } catch { /* se decide con el estado */ }
  S.salidaVoluntaria = true;
  limpiarSesion();
  await sv.cerrarSesion();
  S.salidaVoluntaria = false;
  location.hash = '#/';
}

/* ============================== INGRESO ============================== */

export async function mostrarIngreso(app, { mensaje = '' } = {}) {
  limpiarSesion();
  const campo = (id, etiqueta, extra = {}) => {
    const input = h('input', { id, name: id, type: 'text', required: true, autocomplete: 'off', spellcheck: 'false', ...extra });
    return [h('div', { class: 'campo' }, h('label', { for: id }, etiqueta), input), input];
  };
  const [cNombre, inNombre] = campo('f-nombre', 'Nombre', { autocapitalize: 'characters', placeholder: 'JUAN' });
  const [cApellido, inApellido] = campo('f-apellido', 'Primer apellido', { autocapitalize: 'characters', placeholder: 'PEREZ' });
  const [cCodigo, inCodigo] = campo('f-codigo', 'Código (4 números)', { inputmode: 'numeric', maxlength: '4', pattern: '[0-9]{4}', placeholder: '••••', class: 'input-codigo' });
  inCodigo.addEventListener('input', () => { inCodigo.value = soloDigitos(inCodigo.value).slice(0, 4); });
  for (const i of [inNombre, inApellido]) i.addEventListener('input', () => { const p = i.selectionStart; i.value = i.value.toUpperCase(); i.setSelectionRange(p, p); });
  const error = h('p', { class: 'form-ingreso__error', role: 'alert' }, mensaje);
  const enviar = h('button', { type: 'submit', class: 'btn' }, 'Ingresar');

  const form = h('form', { class: 'form-ingreso', novalidate: true },
    h('p', { class: 'etiqueta-juridica' }, 'Acceso al expediente'),
    cNombre, cApellido, cCodigo,
    h('p', { class: 'campo__ayuda' }, 'Nombre y primer apellido en MAYÚSCULAS y sin tildes. El código de 4 números te lo entrega el profesor.'),
    error, h('div', { class: 'grupo-botones' }, enviar));

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    error.textContent = '';
    if (!inNombre.value.trim() || !inApellido.value.trim()) { error.textContent = 'Escribe tu nombre y tu primer apellido.'; return; }
    if (soloDigitos(inCodigo.value).length !== 4) { error.textContent = 'El código tiene 4 números.'; return; }
    enviar.disabled = true; enviar.textContent = 'Verificando…';
    try {
      await sv.iniciarSesion({ nombre: inNombre.value, apellido: inApellido.value, codigo: inCodigo.value });
    } catch (err) {
      error.textContent = sv.textoErrorAuth(err);
      enviar.disabled = false; enviar.textContent = 'Ingresar';
    }
  });

  const hoja = h('div', { class: 'hoja' }, h('img', { class: 'hoja__cinta', src: img('cinta'), alt: '', 'aria-hidden': 'true' }), form);
  const contHoja = h('div', { class: 'escena__hoja' }, h('div', null, hoja));
  contHoja.inert = true;
  const sobre = h('button', { type: 'button', class: 'sobre-boton', 'aria-expanded': 'false', 'aria-label': 'Abrir el sobre para ingresar' },
    h('img', { class: 'sobre--cerrado', src: img('sobre-cerrado'), alt: '', width: 900, height: 535 }),
    h('img', { class: 'sobre--abierto', src: img('sobre-abierto'), alt: '', width: 900, height: 725 }),
    h('span', { class: 'sobre-boton__leyenda' }, 'Abrir mi expediente'));
  const escena = h('div', { class: 'escena', 'data-estado': 'cerrado' }, contHoja, sobre);
  let abierto = false;
  async function abrir() {
    if (abierto) return; abierto = true;
    sobre.setAttribute('aria-expanded', 'true'); sobre.disabled = true; sonar.sobre();
    escena.dataset.estado = 'abriendo'; await esperar(350);
    escena.dataset.estado = 'abierto'; contHoja.inert = false;
    await esperar(400); inNombre.focus();
  }
  sobre.addEventListener('click', abrir);

  const panelPrueba = h('div', { class: 'panel-prueba' });
  montar(app, h('div', { class: 'herramientas-flotantes' }, botonSonido()),
    h('main', { class: 'vista', id: 'vista', tabindex: '-1' },
      h('section', { class: 'ingreso' },
        h('h1', { class: 'ingreso__titulo' }, TEXTOS.tituloApp),
        h('p', { class: 'ingreso__subtitulo' }, TEXTOS.subtituloApp),
        escena, panelPrueba,
        h('footer', { class: 'ingreso__pie' }, h('p', null, h('a', { href: '#/profesor' }, 'Acceso del profesor'))))));
  document.title = `${TEXTOS.tituloApp} · Ingreso`;
  if (mensaje) await abrir();
  if (PRUEBA_LOCAL()) {
    const dibujar = async () => {
      const lista = await sv.nombresDePrueba();
      montar(panelPrueba, h('details', { class: 'ayuda' }, h('summary', null, 'Modo de prueba: cuentas de ejemplo'),
        h('div', null,
          lista.length ? h('ul', { class: 'lista-prueba' }, lista.map((c) => h('li', null, h('button', {
            type: 'button', class: 'btn btn--chico btn--secundario',
            onclick: async () => { await abrir(); inNombre.value = c.nombre.toUpperCase(); inApellido.value = c.apellido.toUpperCase(); inCodigo.value = c.codigo || ''; },
          }, `${c.nombre} ${c.apellido} · ${c.codigo || 'sin código'} · ${PERSONAJES[c.personaje]?.nombre || 'sin personaje'}`)))) : h('p', null, 'Aún no hay cuentas de prueba.'),
          h('button', { type: 'button', class: 'btn btn--chico btn--azul', onclick: async () => { await sv.cargarDatosDePrueba(); dibujar(); } }, 'Crear cuentas de prueba'))));
    };
    dibujar();
  }
}

/* ============================== MARCO ============================== */

function iconoEstado(sec) {
  const a = S.avance?.porSeccion?.[sec.id];
  if (!a) return h('span', { class: 'idx__ico idx__ico--info', 'aria-hidden': 'true' }, '·');
  if (a.hechos >= a.total) return h('span', { class: 'idx__ico idx__ico--ok', title: 'Completo' }, '✓');
  if (sec.campos.some((c) => tieneAlgo(c, S.resp))) return h('span', { class: 'idx__ico idx__ico--curso', title: 'En curso' }, '●');
  return h('span', { class: 'idx__ico', title: 'Sin empezar' }, '○');
}

function marco(app, actual, contenido) {
  const lista = secciones(clave());
  const estado = h('button', { type: 'button', class: 'estado-guardado', 'data-estado': S.guardado?.codigo || 'guardado', onclick: () => sv.guardarAhora() }, 'Guardado');
  const barraP = barraProgreso(S.avance?.preparacion || 0, 'Avance del trabajo escrito');
  const pctP = h('span', { class: 'cab__pct' }, `${S.avance?.preparacion || 0}%`);
  S.barra = { estado, progreso: barraP };
  pintarEstado(S.guardado || { codigo: 'guardado' });

  const idx = h('nav', { class: 'idx', 'aria-label': 'Índice' },
    h('p', { class: 'idx__tit' }, 'Índice'),
    h('ol', null, lista.map((s) => {
      const a = S.avance?.porSeccion?.[s.id];
      const li = h('li', null, h('a', { href: `#/s/${s.id}`, class: s.id === actual ? 'activo' : '', 'aria-current': s.id === actual ? 'page' : null },
        iconoEstado(s), h('span', { class: 'idx__txt' }, s.titulo),
        a ? h('span', { class: 'idx__n' }, `${a.hechos}/${a.total}`) : null));
      return li;
    })));
  oyentes.push(() => {
    lista.forEach((s, i) => {
      const a = idx.querySelectorAll('li a')[i];
      const ico = iconoEstado(s); a.firstChild.replaceWith(ico);
      const n = a.querySelector('.idx__n'); const av = S.avance?.porSeccion?.[s.id];
      if (n && av) n.textContent = `${av.hechos}/${av.total}`;
    });
    actualizarBarraProgreso(barraP, S.avance.preparacion); pctP.textContent = `${S.avance.preparacion}%`;
  });

  const p = S.perfil;
  const cab = h('header', { class: 'cab' },
    h('div', { class: 'cab__id' },
      h('strong', null, `${p.nombre} ${p.apellido}`),
      h('span', null, `${p.caso ? `Caso ${p.caso}` : 'Sin caso'} · ${PERSONAJES[p.personaje]?.nombre || 'Sin personaje'}`)),
    h('div', { class: 'cab__avance' }, h('span', { class: 'cab__lbl' }, 'Trabajo escrito'), barraP, pctP),
    h('div', { class: 'cab__acc' }, estado, h('button', { type: 'button', class: 'btn btn--chico btn--secundario', onclick: cerrarSesionUI }, 'Salir')));

  const i = lista.findIndex((s) => s.id === actual);
  const pie = h('div', { class: 'sec-pie' },
    i > 0 ? h('a', { class: 'btn btn--secundario', href: `#/s/${lista[i - 1].id}` }, `← ${lista[i - 1].corto}`) : h('span'),
    i < lista.length - 1 ? h('a', { class: 'btn', href: `#/s/${lista[i + 1].id}` }, `${lista[i + 1].corto} →`) : h('span'));

  const main = h('main', { class: 'vista vista--exp', id: 'vista', tabindex: '-1' }, cab,
    h('div', { class: 'exp' }, idx, h('div', { class: 'exp__cont' }, contenido, pie)));
  montar(app, main);
  window.scrollTo(0, 0);
}

/* ============================== CAMPOS ============================== */

function areaTexto(id, { filas = 3, lectura, placeholder } = {}) {
  const ta = h('textarea', { id: `f-${id}`, rows: String(filas), value: S.resp[id] || '', readonly: lectura || null, placeholder: placeholder || null });
  ta.value = S.resp[id] || '';
  ta.addEventListener('input', () => cambiar(id, ta.value));
  return ta;
}

function campoUI(c, n, lectura) {
  const cabeza = h('div', { class: 'pr__cab' },
    h('span', { class: 'pr__num' }, n),
    h('div', null, h('h3', { class: 'pr__tit' }, c.titulo, c.formato ? h('span', { class: 'pr__formato' }, ` · ${c.formato}`) : null),
      c.ayuda ? h('p', { class: 'pr__ayuda' }, h('strong', null, 'Cómo hacerlo: '), c.ayuda) : null,
      c.ejemplo ? h('p', { class: 'pr__ayuda pr__ejemplo' }, h('strong', null, 'Puedes empezar así: '), h('em', null, c.ejemplo)) : null),
    c.puntos ? h('span', { class: 'chip chip--gris' }, `${c.puntos} pts`) : null);
  const marca = h('span', { class: 'pr__estado' });
  const pintar = () => {
    const req = requerido(c, S.resp);
    const ok = completo(c, S.resp);
    marca.textContent = !req ? 'No aplica' : ok ? '✓ Respondida' : '';
    marca.className = `pr__estado${ok ? ' ok' : ''}`;
  };
  let cuerpo;
  if (c.tipo === 'texto') {
    const ta = areaTexto(c.id, { filas: c.filas, lectura });
    const cont = h('span', { class: 'contador' });
    const pc = () => {
      const w = contarPalabras(ta.value);
      cont.textContent = c.limite ? `${w} / ${c.limite} palabras${w > c.limite ? ' · te pasaste del máximo' : ''}` : `${w} palabras`;
      cont.classList.toggle('excede', Boolean(c.limite) && w > c.limite);
    };
    ta.addEventListener('input', pc); pc();
    cuerpo = h('div', null, ta, cont);
  } else if (c.tipo === 'opciones') {
    cuerpo = h('div', { class: 'opciones' }, c.opciones.map(([v, t]) => {
      const r = h('input', { type: 'radio', name: `f-${c.id}`, value: v, checked: S.resp[c.id] === v, disabled: lectura || null });
      r.addEventListener('change', () => { cambiar(c.id, v); });
      return h('label', { class: 'opcion' }, r, h('span', null, t));
    }));
  } else if (c.tipo === 'lista') {
    cuerpo = h('ol', { class: 'renglones' }, idsDe(c).map((id) => {
      const inp = h('input', { type: 'text', id: `f-${id}`, value: S.resp[id] || '', readonly: lectura || null });
      inp.value = S.resp[id] || '';
      inp.addEventListener('input', () => cambiar(id, inp.value));
      return h('li', null, inp);
    }));
  } else {
    const fija = c.tipo === 'tablaFija';
    const nf = fija ? c.filasFijas.length : c.filas;
    const cols = fija ? ['', ...c.columnas] : c.columnas;
    const anchos = c.anchos || cols.map(() => `${Math.floor(100 / cols.length)}%`);
    cuerpo = h('div', { class: 'tabla-resp' }, h('table', null,
      h('colgroup', null, anchos.map((w) => h('col', { style: { width: w } }))),
      h('thead', null, h('tr', null, cols.map((t) => h('th', null, t)))),
      h('tbody', null, Array.from({ length: nf }, (_, f) => h('tr', null,
        fija ? h('th', { scope: 'row' }, c.filasFijas[f]) : null,
        c.columnas.map((col, k) => h('td', { 'data-col': col }, areaTexto(`${c.id}_r${f + 1}_c${k + 1}`, { filas: c.multilinea && k === c.columnas.length - 1 ? 3 : 2, lectura }))))))));
  }
  const div = h('section', { class: 'pr', id: `p-${c.id}` }, cabeza, cuerpo, marca);
  oyentes.push(pintar); pintar();
  return div;
}

/* ============================== SECCIONES ============================== */

function vistaInicio() {
  const p = S.perfil; const per = PERSONAJES[p.personaje];
  const foto = per && PERSONAJES_CON_IMAGEN.has(per.clave) ? h('img', { class: 'polaroid__ilustracion', src: img(`personajes/${per.clave}`), alt: '' }) : siluetaSVG();
  const lista = secciones(p.personaje).filter((s) => s.campos.length);
  const filaBloque = (s) => {
    const a = S.avance?.porSeccion?.[s.id] || { hechos: 0, total: 0 };
    return h('tr', null, h('td', null, h('a', { href: `#/s/${s.id}` }, `${s.titulo} · ${nombreTrabajo(p.personaje)}`)), h('td', null, s.puntos ? `${s.puntos} pts` : 'No se evalúa'),
      h('td', null, `${a.hechos} de ${a.total} preguntas`));
  };
  return h('div', { class: 'sec' },
    h('h1', null, 'Mi personaje'),
    S.config?.mensajeGeneral ? h('div', { class: 'aviso aviso--info' }, h('span', null, 'i'), h('p', null, S.config.mensajeGeneral)) : null,
    !per ? h('div', { class: 'aviso aviso--alerta' }, h('span', null, '!'), h('p', null, 'Todavía no tienes personaje asignado. El profesor lo asignará pronto.')) : null,
    h('div', { class: 'ficha-ini' },
      h('figure', { class: 'polaroid' }, h('div', { class: 'polaroid__foto' }, foto), h('figcaption', { class: 'polaroid__pie' }, per?.nombre || 'Sin asignar')),
      h('div', null,
        h('p', { class: 'etiqueta-juridica' }, p.caso ? `Caso ${p.caso} · ${NOMBRE_CASOS[p.caso]}` : 'Caso sin asignar'),
        h('h2', null, per?.nombre || 'Personaje sin asignar'),
        per ? h('ul', { class: 'funcion' }, FUNCION[per.clave].map((t) => h('li', null, t))) : null,
        h('p', { class: 'nota-chica' }, 'Trabaja con tu ficha reservada y el expediente común de tu caso: son tu única fuente. No inventes hechos.'))),
    per ? h('div', null,
      h('h2', { class: 'h-sec' }, 'Qué debes entregar'),
      h('table', { class: 'tabla-simple' }, h('thead', null, h('tr', null, h('th', null, 'Sección'), h('th', null, 'Puntaje'), h('th', null, 'Avance'))),
        h('tbody', null, lista.map(filaBloque))),
      h('h2', { class: 'h-sec' }, 'Cómo funciona'),
      h('ul', null,
        h('li', null, 'Usa el índice para moverte. ✓ = completa, ● = en curso, ○ = sin empezar.'),
        h('li', null, 'Todo se guarda solo. Revisa el estado arriba a la derecha.'),
        h('li', null, 'Cada pregunta indica su extensión (oraciones, palabras o filas) y su puntaje.'),
        h('li', null, 'Antes de entregar, revisa tu trabajo con la «Rúbrica de evaluación».'),
        h('li', null, 'Al terminar, ve a «Revisar, descargar y entregar».')),
      h('a', { class: 'btn', href: '#/s/t' }, 'Empezar mi trabajo escrito →')) : null);
}

function vistaCampos(sec) {
  const cerrado = sec.despues && !bloqueCAbierto();
  const lectura = !editable() || cerrado;
  return h('div', { class: 'sec' },
    h('h1', null, `${sec.titulo} · ${nombreTrabajo(clave())}`),
    sec.intro ? h('p', { class: 'sec__intro' }, sec.intro) : null,
    sec.id === 't' ? h('div', { class: 'aviso aviso--info instrucciones-trabajo' }, h('span', null, 'i'), h('div', null,
      h('p', null, h('strong', null, INSTRUCCIONES_TRABAJO.principal)),
      h('p', null, INSTRUCCIONES_TRABAJO.pasos),
      h('p', null, INSTRUCCIONES_TRABAJO.noInventes),
      h('p', null, `Puntaje total: 40 puntos (incluye 4 puntos del criterio transversal). `, h('a', { href: '#/s/rubrica' }, 'Ver rúbrica')))) : null,
    cerrado ? h('div', { class: 'aviso aviso--alerta' }, h('span', null, '!'), h('p', null, 'Esta sección se habilita después de la audiencia. El profesor la abrirá.')) : null,
    !editable() ? h('div', { class: 'aviso aviso--alerta' }, h('span', null, '!'), h('p', null, 'La edición está cerrada. Puedes leer y descargar tu Word.')) : null,
    sec.campos.map((c, i) => campoUI(c, i + 1, lectura)));
}

function vistaRubrica() {
  const filas = rubrica(clave());
  if (!filas.length) return h('div', { class: 'sec' }, h('h1', null, 'Rúbrica de evaluación'), h('p', null, 'La rúbrica aparece cuando el profesor te asigne un personaje.'));
  return h('div', { class: 'sec' },
    h('h1', null, `Rúbrica de evaluación · ${nombreTrabajo(clave())}`),
    h('p', { class: 'sec__intro' }, 'Puntaje total: 40 puntos. Exigencia 60 %: 24 puntos = nota 4,0. La evaluación no depende de acertar el desenlace, sino de fundamentar con las pruebas.'),
    h('table', { class: 'tabla-simple' },
      h('thead', null, h('tr', null, NIVELES_RUBRICA.map(([n]) => h('th', null, n)))),
      h('tbody', null, h('tr', null, NIVELES_RUBRICA.map(([, d]) => h('td', null, d))))),
    h('p', { class: 'nota-chica' }, 'Sin evidencia: 0 puntos.'),
    h('h2', { class: 'h-sec' }, 'Para obtener el puntaje máximo, la respuesta…'),
    h('div', { class: 'tabla-resp' }, h('table', { class: 'tabla-simple tabla-rubrica' },
      h('thead', null, h('tr', null, ['N°', 'Criterio', 'Máx.', 'D', 'L', 'ED', 'I'].map((x) => h('th', null, x)))),
      h('tbody', null, filas.map(([n, t, d, max]) => h('tr', null,
        h('td', null, h('strong', null, n)), h('td', null, h('strong', null, t), h('br'), d), h('td', null, h('strong', null, String(max))),
        puntajesNivel(max).map((x) => h('td', { class: 'gris' }, x)))),
        h('tr', null, h('td', null, ''), h('td', null, h('strong', null, 'Puntaje total')), h('td', null, h('strong', null, '40')), h('td', { colspan: '4' }, '')))))) ;
}

function vistaEntrega() {
  const lista = secciones(clave()).filter((s) => s.campos.length);
  const faltan = [];
  for (const s of lista) {
    if (s.despues) continue;
    s.campos.forEach((c, i) => { if (requerido(c, S.resp) && !completo(c, S.resp)) faltan.push({ s, c, n: i + 1 }); });
  }
  const exp = S.expediente;
  const vigente = entregaVigente(exp);
  const estado = vigente
    ? h('div', { class: 'aviso aviso--ok' }, h('span', null, '✓'), h('p', null, `Entregado el ${fechaHora(exp.entregadoEn)}.${exp.editadoDespuesDeEntrega ? ' Hiciste cambios después: vuelve a entregar para que el profesor vea la última versión.' : ''}`))
    : exp?.entregadoEn
      ? h('div', { class: 'aviso aviso--alerta' }, h('span', null, '!'), h('p', null, `Tu entrega anterior (${fechaHora(exp.entregadoEn)}) era de la preparación antigua y quedó guardada. Ahora debes responder y entregar el trabajo escrito.`))
      : h('div', { class: 'aviso aviso--info' }, h('span', null, 'i'), h('p', null, 'Aún no entregas. El profesor puede ver tu avance, pero la entrega marca que terminaste tu trabajo escrito.'));
  const bWord = h('button', { type: 'button', class: 'btn btn--azul', onclick: async () => {
    bWord.disabled = true;
    try { await sv.guardarAhora(); await sv.descargarDocumento({ perfil: S.perfil, respuestas: S.resp, expediente: S.expediente }); } catch (e) { avisar(e.message, 'error'); }
    bWord.disabled = false;
  } }, 'Descargar mi Word');
  const bEntregar = h('button', { type: 'button', class: 'btn', disabled: !editable() || null, onclick: async () => {
    const ok = await confirmar({ titulo: 'Entregar mi trabajo escrito', mensaje: faltan.length ? `Te faltan ${faltan.length} preguntas por completar. ¿Entregar igual? Podrás seguir editando mientras el profesor no cierre la edición.` : 'Podrás seguir editando mientras el profesor no cierre la edición. ¿Entregar?', ok: 'Entregar' });
    if (!ok) return;
    try {
      const r = await sv.enviarPreparacion({ progreso: S.avance.preparacion });
      S.expediente = { ...S.expediente, entregadoEn: r.entregadoEn, editadoDespuesDeEntrega: false, estado: 'entregada' };
      sonar.sello?.(); avisar('Trabajo escrito entregado.', 'ok'); rutaEstudiante(document.getElementById('app'), 'entrega');
    } catch (e) { avisar(e.message || 'No se pudo entregar.', 'error', 8000); }
  } }, vigente ? 'Volver a entregar' : 'Entregar mi trabajo escrito');
  return h('div', { class: 'sec' },
    h('h1', null, 'Revisar, descargar y entregar'),
    estado,
    h('table', { class: 'tabla-simple' }, h('thead', null, h('tr', null, h('th', null, 'Sección'), h('th', null, 'Respondidas'))),
      h('tbody', null, lista.map((s) => { const a = S.avance.porSeccion[s.id]; return h('tr', null, h('td', null, h('a', { href: `#/s/${s.id}` }, s.titulo)), h('td', null, `${a.hechos} de ${a.total}`)); }))),
    faltan.length ? h('div', null, h('h2', { class: 'h-sec' }, 'Te falta completar'),
      h('ul', null, faltan.map((f) => h('li', null, h('a', { href: `#/s/${f.s.id}`, onclick: () => setTimeout(() => document.getElementById(`p-${f.c.id}`)?.scrollIntoView({ block: 'center' }), 120) }, `${f.s.corto} · ${f.n}. ${f.c.titulo}`))))) :
      h('p', { class: 'ok-txt' }, '✓ Tu trabajo escrito está completo. Revísalo con la rúbrica antes de entregar.'),
    h('div', { class: 'grupo-botones' }, bWord, bEntregar),
    h('p', { class: 'nota-chica' }, 'El Word incluye tus respuestas y la rúbrica. Te sirve de apoyo durante el juicio.'));
}

/* ============================== RUTA ============================== */

export async function rutaEstudiante(app, id = 'inicio') {
  oyentes = [];
  const lista = secciones(clave());
  const sec = lista.find((s) => s.id === id) || lista[0];
  let cont;
  if (sec.id === 'inicio') cont = vistaInicio();
  else if (sec.id === 'rubrica') cont = vistaRubrica();
  else if (sec.id === 'entrega') cont = vistaEntrega();
  else if (!S.perfil?.personaje) cont = h('div', { class: 'sec' }, h('h1', null, sec.titulo), h('div', { class: 'aviso aviso--alerta' }, h('span', null, '!'), h('p', null, 'Esta sección aparece cuando el profesor te asigne un personaje.')));
  else cont = vistaCampos(sec);
  marco(app, sec.id, cont);
  document.title = `${sec.corto} · ${TEXTOS.tituloApp}`;
}
