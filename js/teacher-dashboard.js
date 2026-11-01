/**
 * PANEL DEL PROFESOR (v3) · #/profesor/resumen · #/profesor/usuarios
 *   Resumen  → cifras, los tres casos con sus 10 personajes y avance, ajustes mínimos y descargas.
 *   Usuarios → nombre, apellido, código de ingreso (editable), caso y personaje, avance, ver y descargar.
 * La seguridad real la dan Firebase Authentication y firestore.rules; aquí solo se dibuja.
 */

import { h, montar, normalizar, aCSV, rutaImg, descargarTexto, descargarBlob, fechaHora, hace, parsearCSV, codigoAleatorio, soloDigitos } from './util.js';
import { PERSONAJES, LISTA_PERSONAJES, CASOS, NOMBRE_CASOS, SINONIMOS_PERSONAJE } from './contenido.js';
import { docente, obtenerResumenDocente, modoServicios, iniciarSesionProfesor, cerrarSesion, textoErrorAuth } from './servicios.js';
import { S, avisar, abrirDialogo, confirmar, barraProgreso } from './ui-comun.js';
import { estructuraDocumento, generarBlob, nombreArchivo, descargarWord } from './document-export.js';

let raiz = null;
let datos = null;
let ruta = ['resumen'];
let filtro = { texto: '', caso: '' };

const ETQ_ESTADO = { sin_iniciar: 'Sin iniciar', en_desarrollo: 'En desarrollo', entregada: 'Entregada' };
const CHIP_ESTADO = { sin_iniciar: 'chip--gris', en_desarrollo: 'chip--azul', entregada: 'chip--verde' };
const comoIngresa = (p) => `${(normalizar(p.nombre).split(' ')[0] || '').toUpperCase()} · ${normalizar(p.apellido).replace(/ /g, '').toUpperCase()}`;

async function cargar() { datos = await obtenerResumenDocente(); S.config = datos.config; }
async function recargar() { await cargar(); pintar(); }

/* ============================== Entrada ============================== */

export async function montarProfesor(app, partes, sesion) {
  if (!sesion || !sesion.esProfesor) { mostrarLogin(app, sesion); return; }
  ruta = partes.length ? partes : ['resumen'];
  if (!datos || !app.querySelector('.adm')) {
    montar(app, h('main', { class: 'vista adm', id: 'vista' }, h('p', { class: 'cargando', role: 'status' }, 'Cargando…')));
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

function mostrarLogin(app, sesion) {
  datos = null;
  const correo = h('input', { id: 'p-correo', type: 'email', autocomplete: 'username', required: true });
  const pass = h('input', { id: 'p-pass', type: 'password', autocomplete: 'current-password', required: true });
  const recordar = h('input', { id: 'p-rec', type: 'checkbox' });
  const error = h('p', { role: 'alert', class: 'form-ingreso__error' });
  const enviar = h('button', { type: 'submit', class: 'btn' }, 'Ingresar');
  const form = h('form', { novalidate: true },
    h('div', { class: 'campo' }, h('label', { for: 'p-correo' }, 'Correo'), correo),
    h('div', { class: 'campo' }, h('label', { for: 'p-pass' }, 'Contraseña'), pass),
    h('label', { class: 'opcion' }, recordar, h('span', null, 'Mantener la sesión en este computador')),
    error, enviar);
  form.addEventListener('submit', async (e) => {
    e.preventDefault(); error.textContent = '';
    if (!correo.value || !pass.value) { error.textContent = 'Escribe tu correo y tu contraseña.'; return; }
    enviar.disabled = true;
    try { await iniciarSesionProfesor({ correo: correo.value, password: pass.value, recordar: recordar.checked }); pass.value = ''; }
    catch (err) { error.textContent = textoErrorAuth(err); enviar.disabled = false; }
  });
  montar(app, h('main', { class: 'vista', id: 'vista' },
    h('section', { class: 'ingreso' },
      h('h1', { class: 'ingreso__titulo' }, 'PANEL DEL PROFESOR'),
      h('p', { class: 'ingreso__subtitulo' }, 'Mi expediente judicial'),
      h('div', { class: 'hoja', style: { textAlign: 'left', animation: 'none' } },
        h('img', { class: 'hoja__cinta', src: rutaImg('cinta'), alt: '', 'aria-hidden': 'true' }),
        sesion && !sesion.esProfesor
          ? h('div', null, h('div', { class: 'aviso aviso--alerta' }, h('span', null, '!'), h('p', null, 'Hay una sesión de estudiante abierta. Ciérrala para entrar como profesor.')),
            h('button', { type: 'button', class: 'btn', onclick: () => cerrarSesion() }, 'Cerrar la sesión de estudiante'))
          : form,
        modoServicios() === 'local' ? h('p', { class: 'campo__ayuda' }, 'Modo local de prueba: cualquier correo y contraseña sirven.') : null),
      h('p', { class: 'ingreso__pie' }, h('a', { href: '#/' }, '← Ingreso de estudiantes')))));
  document.title = 'Panel del profesor · Ingreso';
}

function construirMarco(app, sesion) {
  raiz = h('div', { class: 'adm-contenido' });
  montar(app, h('main', { class: 'vista adm', id: 'vista' },
    h('header', { class: 'adm-cab' },
      h('div', null, h('p', { class: 'etiqueta-juridica' }, 'Mi expediente judicial'), h('h1', null, 'Panel del profesor')),
      h('nav', { class: 'adm-tabs' }, h('a', { href: '#/profesor/resumen', 'data-sec': 'resumen' }, 'Resumen'), h('a', { href: '#/profesor/usuarios', 'data-sec': 'usuarios' }, 'Usuarios')),
      h('div', { class: 'adm-cab__acc' },
        h('span', { class: 'gris' }, sesion.correo || ''),
        h('button', { type: 'button', class: 'btn btn--chico btn--secundario', onclick: async () => { await recargar(); avisar('Datos actualizados.', 'ok', 1800); } }, 'Actualizar'),
        h('button', { type: 'button', class: 'btn btn--chico btn--secundario', onclick: async () => { datos = null; await cerrarSesion(); location.hash = '#/'; } }, 'Salir'))),
    raiz));
}

function pintar() {
  if (!raiz || !datos) return;
  const sec = ruta[0] === 'usuarios' ? 'usuarios' : 'resumen';
  document.querySelectorAll('.adm-tabs a').forEach((a) => (a.dataset.sec === sec ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current')));
  const y = window.scrollY;
  montar(raiz, sec === 'usuarios' ? vistaUsuarios() : vistaResumen());
  window.scrollTo(0, y);
  document.title = `Panel · ${sec === 'usuarios' ? 'Usuarios' : 'Resumen'}`;
}

/* ============================== Piezas ============================== */

const pct = (f) => f.avance?.preparacion ?? 0;
function celdaAvance(f) {
  if (!f.perfil.personaje) return h('span', { class: 'gris' }, 'Sin personaje');
  return h('div', { class: 'av' }, barraProgreso(pct(f), 'Avance'), h('span', { class: 'av__n' }, `${pct(f)}%`),
    f.avance?.hechosD ? h('span', { class: 'av__c', title: 'Bloque C (reflexión y observación)' }, `C ${f.avance.despues}%`) : null);
}
const chip = (f) => h('span', { class: `chip ${CHIP_ESTADO[f.estado]}` }, ETQ_ESTADO[f.estado], f.conCambiosPosteriores ? ' · con cambios' : '');

async function verArchivo(f) {
  const exp = await docente.cargarExpedienteDe(f.uid).catch(() => f.expediente);
  const resp = exp?.respuestas || {};
  const est = estructuraDocumento(f.perfil, resp);
  const sinResp = () => h('p', { class: 'gris' }, '(sin responder)');
  const valor = (c) => {
    if (c.tipo === 'texto') return c.valor ? h('p', { class: 'ver__txt' }, c.valor) : sinResp();
    if (c.tipo === 'lista') return c.items.length ? h('ul', null, c.items.map((x) => h('li', null, x))) : sinResp();
    if (c.vacia) return sinResp();
    return h('table', { class: 'tabla-simple' },
      h('thead', null, h('tr', null, c.columnas.map((x) => h('th', null, x)))),
      h('tbody', null, c.filas.map((r) => h('tr', null, r.map((x) => h('td', { class: 'pre' }, x))))));
  };
  const cuerpo = h('div', { class: 'ver' },
    h('p', { class: 'gris' }, `${f.perfil.caso ? `Caso ${f.perfil.caso}` : 'Sin caso'} · ${PERSONAJES[f.perfil.personaje]?.nombre || 'Sin personaje'} · último guardado: ${f.ultimoGuardado ? hace(f.ultimoGuardado) : 'nunca'}`),
    est.length
      ? est.map((s) => h('section', null, h('h3', { class: 'ver__sec' }, s.titulo),
        s.campos.map((c, i) => h('div', { class: 'ver__campo' }, h('p', { class: 'ver__tit' }, `${i + 1}. ${c.titulo}`), valor(c)))))
      : h('p', { class: 'gris' }, 'Sin personaje asignado.'));
  await abrirDialogo({
    titulo: `${f.perfil.nombre} ${f.perfil.apellido}`, ancho: 'min(60rem, 96vw)', cuerpo,
    acciones: [{ texto: 'Descargar Word', clase: 'btn--azul', alClick: async () => { await descargarWord({ perfil: f.perfil, respuestas: resp, expediente: exp }); return false; } }, { texto: 'Cerrar', clase: 'btn--secundario' }],
  });
}

async function cargarJSZip() {
  if (globalThis.JSZip) return globalThis.JSZip;
  await new Promise((ok, mal) => { const s = document.createElement('script'); s.src = new URL('vendor/jszip.min.js', document.baseURI).href; s.onload = ok; s.onerror = () => mal(new Error('No se pudo cargar jszip.')); document.head.append(s); });
  return globalThis.JSZip;
}

async function descargarTodos(boton) {
  const filas = datos.filas.filter((f) => f.perfil.personaje);
  if (!filas.length) { avisar('No hay estudiantes con personaje.', 'error'); return; }
  boton.disabled = true; const txt = boton.textContent;
  try {
    const JSZip = await cargarJSZip(); const zip = new JSZip();
    let i = 0;
    for (const f of filas) {
      boton.textContent = `Generando ${++i}/${filas.length}…`;
      const exp = await docente.cargarExpedienteDe(f.uid).catch(() => f.expediente);
      const blob = await generarBlob(f.perfil, exp?.respuestas || {}, { entregadoEn: exp?.entregadoEn });
      zip.file(`Caso${f.perfil.caso || 'X'}/${nombreArchivo(f.perfil)}`, blob);
    }
    descargarBlob(await zip.generateAsync({ type: 'blob' }), `Preparaciones_juicio_${new Date().toISOString().slice(0, 10)}.zip`);
  } catch (e) { avisar(e.message || String(e), 'error', 8000); }
  boton.disabled = false; boton.textContent = txt;
}

function descargarAccesos() {
  const filas = datos.filas.map((f) => [f.perfil.apellido, f.perfil.nombre, comoIngresa(f.perfil).split(' · ')[0], comoIngresa(f.perfil).split(' · ')[1], f.perfil.codigo || 'SIN CÓDIGO', f.perfil.caso || '', PERSONAJES[f.perfil.personaje]?.nombre || '']);
  descargarTexto(aCSV(['Apellido', 'Nombre', 'Escribe como nombre', 'Escribe como apellido', 'Código', 'Caso', 'Personaje'], filas), 'accesos_estudiantes.csv');
}

/* ============================== RESUMEN ============================== */

function vistaResumen() {
  const F = datos.filas;
  const conRol = F.filter((f) => f.perfil.personaje);
  const prom = conRol.length ? Math.round(conRol.reduce((s, f) => s + pct(f), 0) / conRol.length) : 0;
  const tarjeta = (n, t) => h('div', { class: 'cifra' }, h('strong', null, String(n)), h('span', null, t));
  const sinCodigo = F.filter((f) => !f.perfil.codigo).length;

  const casos = CASOS.map((c) => {
    const delCaso = F.filter((f) => f.perfil.caso === c);
    return h('div', { class: 'caso-col' },
      h('h3', null, `Caso ${c}`, h('small', null, NOMBRE_CASOS[c])),
      h('table', { class: 'tabla-simple tabla-caso' }, h('tbody', null, LISTA_PERSONAJES.map((p) => {
        const quien = delCaso.filter((f) => f.perfil.personaje === p.clave);
        return h('tr', { class: quien.length > 1 ? 'duplicado' : '' },
          h('td', { class: 'rol' }, p.nombre),
          h('td', null, quien.length ? quien.map((f) => h('div', { class: 'quien' }, h('a', { href: '#', onclick: (e) => { e.preventDefault(); verArchivo(f); } }, `${f.perfil.nombre} ${f.perfil.apellido}`), celdaAvance(f))) : h('span', { class: 'gris' }, '— sin asignar')));
      }))));
  });
  const sinAsignar = F.filter((f) => !f.perfil.caso || !f.perfil.personaje);

  const edic = h('input', { type: 'checkbox', checked: datos.config.edicionHabilitada !== false });
  const bloqC = h('input', { type: 'checkbox', checked: Boolean(datos.config.bloqueCHabilitado) });
  const msg = h('textarea', { rows: '2', placeholder: 'Mensaje que verán todos los estudiantes en su inicio (opcional)' }); msg.value = datos.config.mensajeGeneral || '';
  const guardar = h('button', { type: 'button', class: 'btn btn--chico', onclick: async () => {
    guardar.disabled = true;
    try { datos.config = await docente.guardarConfig({ edicionHabilitada: edic.checked, bloqueCHabilitado: bloqC.checked, mensajeGeneral: msg.value.trim() }); avisar('Ajustes guardados.', 'ok'); }
    catch (e) { avisar(`No se pudo guardar: ${e.message}`, 'error'); }
    guardar.disabled = false;
  } }, 'Guardar ajustes');
  const bZip = h('button', { type: 'button', class: 'btn btn--azul', onclick: () => descargarTodos(bZip) }, 'Descargar todos los Word (ZIP)');

  return h('div', null,
    sinCodigo ? h('div', { class: 'aviso aviso--alerta' }, h('span', null, '!'), h('p', null, `${sinCodigo} estudiante(s) todavía no tienen código de ingreso: no podrán entrar. Ve a `, h('a', { href: '#/profesor/usuarios' }, 'Usuarios'), ' → «Asignar códigos faltantes».')) : null,
    h('div', { class: 'cifras' }, tarjeta(F.length, 'estudiantes'), tarjeta(conRol.length, 'con personaje'), tarjeta(`${prom}%`, 'avance promedio'),
      tarjeta(F.filter((f) => f.estado === 'entregada').length, 'entregadas'), tarjeta(F.filter((f) => f.estado === 'sin_iniciar').length, 'sin iniciar')),
    h('div', { class: 'grupo-botones' }, bZip, h('button', { type: 'button', class: 'btn btn--secundario', onclick: descargarAccesos }, 'Descargar lista de accesos (CSV)')),
    h('h2', { class: 'h-sec' }, 'Los tres casos'),
    h('div', { class: 'casos' }, casos),
    sinAsignar.length ? h('p', { class: 'gris' }, `Sin caso o personaje: ${sinAsignar.map((f) => `${f.perfil.nombre} ${f.perfil.apellido}`).join(', ')}.`) : null,
    h('h2', { class: 'h-sec' }, 'Ajustes'),
    h('div', { class: 'ajustes' },
      h('label', { class: 'opcion' }, edic, h('span', null, h('strong', null, 'Permitir edición. '), 'Si lo desactivas, nadie puede escribir (solo leer y descargar).')),
      h('label', { class: 'opcion' }, bloqC, h('span', null, h('strong', null, 'Habilitar el bloque C. '), 'Reflexión y observación: actívalo después de las audiencias.')),
      msg, guardar));
}

/* ============================== USUARIOS ============================== */

function selCaso(f) {
  const s = h('select', { 'aria-label': 'Caso' }, h('option', { value: '' }, '—'), CASOS.map((c) => h('option', { value: String(c), selected: f.perfil.caso === c }, `Caso ${c}`)));
  s.addEventListener('change', () => guardarAsignacion(f, { caso: s.value ? Number(s.value) : null }));
  return s;
}
function selPersonaje(f) {
  const s = h('select', { 'aria-label': 'Personaje' }, h('option', { value: '' }, '—'), LISTA_PERSONAJES.map((p) => h('option', { value: p.clave, selected: f.perfil.personaje === p.clave }, p.nombre)));
  s.addEventListener('change', () => guardarAsignacion(f, { personaje: s.value || null }));
  return s;
}
async function guardarAsignacion(f, cambios) {
  try { const p = await docente.actualizarEstudiante(f.uid, cambios); Object.assign(f.perfil, p); avisar('Asignación guardada.', 'ok', 1500); await recargar(); }
  catch (e) { avisar(`No se pudo guardar: ${e.message}`, 'error'); pintar(); }
}

async function dialogoCodigo(f) {
  const inp = h('input', { type: 'text', inputmode: 'numeric', maxlength: '4', class: 'input-codigo', value: f.perfil.codigo || codigoAleatorio(new Set(datos.filas.map((x) => x.perfil.codigo))) });
  inp.addEventListener('input', () => { inp.value = soloDigitos(inp.value).slice(0, 4); });
  const err = h('p', { class: 'form-ingreso__error' });
  await abrirDialogo({
    titulo: f.perfil.codigo ? 'Cambiar código de ingreso' : 'Asignar código de ingreso',
    cuerpo: h('div', null, h('p', null, `${f.perfil.nombre} ${f.perfil.apellido} ingresa con: `, h('strong', null, comoIngresa(f.perfil)), ' y este código:'),
      h('div', { class: 'campo' }, inp), h('p', { class: 'gris' }, 'El código anterior deja de funcionar. Lo escrito por el estudiante no se pierde.'), err),
    acciones: [{ texto: 'Cancelar', clase: 'btn--secundario' }, { texto: 'Guardar código', alClick: async () => {
      if (inp.value.length !== 4) { err.textContent = 'Deben ser 4 números.'; return false; }
      try { await docente.cambiarCodigo(f.uid, inp.value); avisar('Código actualizado.', 'ok'); } catch (e) { console.error(e); err.textContent = `No se pudo cambiar: ${e.code || ''} ${e.message || ''}`; return false; }
      await recargar(); return true;
    } }],
  });
}

async function asignarFaltantes(boton) {
  const faltan = datos.filas.filter((f) => !f.perfil.codigo);
  if (!faltan.length) return;
  if (!(await confirmar({ titulo: 'Asignar códigos faltantes', mensaje: `Se asignará un código aleatorio de 4 números a ${faltan.length} estudiante(s). Después descarga la lista de accesos para entregárselos.`, ok: 'Asignar' }))) return;
  boton.disabled = true;
  const usados = new Set(datos.filas.map((f) => f.perfil.codigo).filter(Boolean));
  let ok = 0; const errores = [];
  for (const f of faltan) {
    const c = codigoAleatorio(usados); usados.add(c);
    boton.textContent = `Asignando ${ok + errores.length + 1}/${faltan.length}…`;
    try { await docente.cambiarCodigo(f.uid, c); ok++; } catch (e) { console.error(e); errores.push(`${f.perfil.nombre} ${f.perfil.apellido} (${e.code || e.message})`); }
  }
  await recargar();
  avisar(`Códigos asignados: ${ok}.${errores.length ? ` Con error: ${errores.join(', ')}.` : ''}`, errores.length ? 'error' : 'ok', 9000);
}

async function dialogoAgregar() {
  const n = h('input', { type: 'text', autocapitalize: 'characters' });
  const a = h('input', { type: 'text', autocapitalize: 'characters' });
  const c = h('input', { type: 'text', inputmode: 'numeric', maxlength: '4', class: 'input-codigo', value: codigoAleatorio(new Set(datos.filas.map((x) => x.perfil.codigo))) });
  c.addEventListener('input', () => { c.value = soloDigitos(c.value).slice(0, 4); });
  const caso = h('select', null, h('option', { value: '' }, '—'), CASOS.map((x) => h('option', { value: String(x) }, `Caso ${x}`)));
  const per = h('select', null, h('option', { value: '' }, '—'), LISTA_PERSONAJES.map((p) => h('option', { value: p.clave }, p.nombre)));
  const err = h('p', { class: 'form-ingreso__error' });
  const fila = (t, el) => h('div', { class: 'campo' }, h('label', null, t), el);
  await abrirDialogo({
    titulo: 'Agregar estudiante',
    cuerpo: h('div', { class: 'form-2col' }, fila('Nombre', n), fila('Primer apellido', a), fila('Código (4 números)', c), fila('Caso', caso), fila('Personaje', per), err),
    acciones: [{ texto: 'Cancelar', clase: 'btn--secundario' }, { texto: 'Crear', alClick: async () => {
      if (!n.value.trim() || !a.value.trim()) { err.textContent = 'Falta el nombre o el apellido.'; return false; }
      if (c.value.length !== 4) { err.textContent = 'El código debe tener 4 números.'; return false; }
      const [r] = await docente.crearEstudiantes([{ nombre: n.value, apellido: a.value, codigo: c.value, caso: caso.value, personaje: per.value }]);
      if (r.estado === 'error') { err.textContent = r.mensaje; return false; }
      avisar(`Creado: ${r.nombre} ${r.apellido}${r.homonimo ? ' (homónimo: ya había otra cuenta con ese nombre)' : ''}.`, 'ok', 6000);
      await recargar(); return true;
    } }],
  });
}

const interpretarPersonaje = (t) => {
  const n = normalizar(t);
  if (!n) return null;
  for (const [k, lista] of Object.entries(SINONIMOS_PERSONAJE)) if (lista.includes(n)) return k;
  return LISTA_PERSONAJES.find((p) => normalizar(p.nombre) === n)?.clave || null;
};

async function dialogoImportar() {
  const ta = h('textarea', { rows: '8', placeholder: 'JUAN;PEREZ;1;Fiscal;\nMARIA;GONZALEZ;1;Defensor;4821' });
  const archivo = h('input', { type: 'file', accept: '.csv,.txt' });
  archivo.addEventListener('change', async () => { const f = archivo.files[0]; if (f) ta.value = await f.text(); });
  const vista = h('div', { class: 'tabla-contenedor' });
  let lista = [];
  const previsualizar = () => {
    const usados = new Set(datos.filas.map((x) => x.perfil.codigo));
    const csv = parsearCSV(ta.value);
    lista = [csv.cabeceras, ...csv.filas].filter((r) => r.some((x) => String(x).trim()))
      .filter((r) => !/^nombre$/i.test(String(r[0]).trim()))
      .map((r) => {
        const cod = soloDigitos(r[4]).slice(0, 4);
        const codigo = cod.length === 4 ? cod : codigoAleatorio(usados); usados.add(codigo);
        return { nombre: String(r[0] || '').trim(), apellido: String(r[1] || '').trim(), caso: [1, 2, 3].includes(Number(r[2])) ? Number(r[2]) : null, personaje: interpretarPersonaje(r[3]), codigo };
      });
    montar(vista, lista.length ? h('table', { class: 'tabla-simple' }, h('thead', null, h('tr', null, ['Nombre', 'Apellido', 'Caso', 'Personaje', 'Código'].map((x) => h('th', null, x)))),
      h('tbody', null, lista.map((e) => h('tr', null, h('td', null, e.nombre), h('td', null, e.apellido), h('td', null, e.caso || '—'), h('td', null, PERSONAJES[e.personaje]?.nombre || '—'), h('td', { class: 'mono' }, e.codigo))))) : h('p', { class: 'gris' }, 'Pega la lista para ver la vista previa.'));
  };
  ta.addEventListener('input', previsualizar); archivo.addEventListener('change', () => setTimeout(previsualizar, 50));
  previsualizar();
  await abrirDialogo({
    titulo: 'Importar lista', ancho: 'min(52rem, 96vw)',
    cuerpo: h('div', null,
      h('p', null, 'Una línea por estudiante, separada por punto y coma: ', h('code', null, 'nombre;apellido;caso;personaje;código'), '. Caso, personaje y código son opcionales (si falta el código se genera uno). Usa solo el primer apellido.'),
      archivo, ta, vista),
    acciones: [{ texto: 'Cancelar', clase: 'btn--secundario' }, { texto: 'Crear cuentas', alClick: async (dlg) => {
      if (!lista.length) return false;
      const res = await docente.crearEstudiantes(lista);
      const malos = res.filter((r) => r.estado === 'error');
      avisar(`Creadas: ${res.length - malos.length}.${malos.length ? ` Con error: ${malos.map((m) => `${m.nombre} ${m.apellido} (${m.mensaje})`).join('; ')}` : ''}`, malos.length ? 'error' : 'ok', 10000);
      await recargar(); return true;
    } }],
  });
}

async function dialogoNombre(f) {
  const n = h('input', { type: 'text', value: f.perfil.nombre }); n.value = f.perfil.nombre;
  const a = h('input', { type: 'text', value: f.perfil.apellido }); a.value = f.perfil.apellido;
  const err = h('p', { class: 'form-ingreso__error' });
  const tieneAlgo = (f.avance?.hechosP || 0) + (f.avance?.hechosD || 0) > 0;
  await abrirDialogo({
    titulo: 'Corregir nombre o apellido',
    cuerpo: h('div', null, h('div', { class: 'form-2col' }, h('div', { class: 'campo' }, h('label', null, 'Nombre'), n), h('div', { class: 'campo' }, h('label', null, 'Primer apellido'), a)),
      h('p', { class: tieneAlgo ? 'aviso aviso--alerta' : 'gris' }, tieneAlgo ? '⚠ Se crea una cuenta nueva con el mismo código y la misma asignación. Lo que ya escribió este estudiante quedará en la cuenta anterior y no se verá en la nueva.' : 'Se crea una cuenta nueva con el mismo código y la misma asignación, y se elimina la anterior.'), err),
    acciones: [{ texto: 'Cancelar', clase: 'btn--secundario' }, { texto: 'Corregir', clase: tieneAlgo ? 'btn--peligro' : '', alClick: async () => {
      try { await docente.corregirNombre(f.perfil, { nombre: n.value, apellido: a.value }); } catch (e) { err.textContent = e.message; return false; }
      avisar('Nombre corregido.', 'ok'); await recargar(); return true;
    } }],
  });
}

async function menuMas(f) {
  const r = await abrirDialogo({
    titulo: `${f.perfil.nombre} ${f.perfil.apellido}`,
    cuerpo: h('p', { class: 'gris' }, `Ingresa con ${comoIngresa(f.perfil)} · código ${f.perfil.codigo || 'sin código'}`),
    acciones: [
      { texto: 'Corregir nombre', valor: 'nombre', clase: 'btn--secundario' },
      { texto: f.perfil.activo === false ? 'Reactivar acceso' : 'Suspender acceso', valor: 'suspender', clase: 'btn--secundario' },
      { texto: 'Eliminar', valor: 'eliminar', clase: 'btn--peligro' },
      { texto: 'Cerrar', clase: 'btn--secundario' },
    ],
  });
  if (r === 'nombre') return dialogoNombre(f);
  if (r === 'suspender') { await guardarAsignacion(f, { activo: f.perfil.activo === false }); return; }
  if (r === 'eliminar') {
    if (!(await confirmar({ titulo: 'Eliminar estudiante', mensaje: `Se eliminará la cuenta de ${f.perfil.nombre} ${f.perfil.apellido}. No podrá volver a ingresar. ¿Continuar?`, ok: 'Eliminar', peligro: true }))) return;
    try { await docente.eliminarEstudiante(f.uid); avisar('Estudiante eliminado.', 'ok'); } catch (e) { avisar(`No se pudo eliminar: ${e.message}`, 'error'); }
    await recargar();
  }
}

function vistaUsuarios() {
  const q = normalizar(filtro.texto);
  const filas = datos.filas.filter((f) => (!filtro.caso || String(f.perfil.caso || '') === filtro.caso)
    && (!q || normalizar(`${f.perfil.nombre} ${f.perfil.apellido}`).includes(q)));
  const buscar = h('input', { type: 'search', placeholder: 'Buscar estudiante', value: filtro.texto });
  buscar.value = filtro.texto;
  buscar.addEventListener('input', () => { filtro.texto = buscar.value; const p = buscar.selectionStart; pintar(); const nb = raiz.querySelector('input[type=search]'); nb.focus(); nb.setSelectionRange(p, p); });
  const fc = h('select', null, h('option', { value: '' }, 'Todos los casos'), CASOS.map((c) => h('option', { value: String(c), selected: filtro.caso === String(c) }, `Caso ${c}`)));
  fc.addEventListener('change', () => { filtro.caso = fc.value; pintar(); });
  const faltan = datos.filas.filter((f) => !f.perfil.codigo).length;
  const bFalt = h('button', { type: 'button', class: 'btn btn--chico btn--azul', onclick: () => asignarFaltantes(bFalt) }, `Asignar códigos faltantes (${faltan})`);

  return h('div', null,
    h('div', { class: 'barra-adm' },
      h('div', { class: 'grupo-botones' },
        h('button', { type: 'button', class: 'btn btn--chico', onclick: dialogoAgregar }, '+ Agregar estudiante'),
        h('button', { type: 'button', class: 'btn btn--chico btn--secundario', onclick: dialogoImportar }, 'Importar lista'),
        faltan ? bFalt : null,
        h('button', { type: 'button', class: 'btn btn--chico btn--secundario', onclick: descargarAccesos }, 'Lista de accesos (CSV)')),
      h('div', { class: 'grupo-botones' }, fc, buscar)),
    h('div', { class: 'tabla-contenedor' }, h('table', { class: 'tabla-simple tabla-usuarios' },
      h('thead', null, h('tr', null, ['Estudiante', 'Código', 'Caso', 'Personaje', 'Avance', 'Estado', ''].map((x) => h('th', null, x)))),
      h('tbody', null, filas.length ? filas.map((f) => h('tr', { class: f.perfil.activo === false ? 'suspendido' : '' },
        h('td', null, h('strong', null, `${f.perfil.apellido}, ${f.perfil.nombre}`), h('br'), h('span', { class: 'gris mono' }, comoIngresa(f.perfil)), f.perfil.activo === false ? h('span', { class: 'chip chip--rojo' }, 'Suspendido') : null),
        h('td', null, f.perfil.codigo ? h('span', { class: 'codigo' }, f.perfil.codigo) : h('span', { class: 'chip chip--ambar' }, 'Sin código'),
          h('button', { type: 'button', class: 'btn btn--enlace', onclick: () => dialogoCodigo(f) }, f.perfil.codigo ? 'Cambiar' : 'Asignar')),
        h('td', null, selCaso(f)), h('td', null, selPersonaje(f)),
        h('td', { class: 'td-av' }, celdaAvance(f), f.ultimoGuardado ? h('span', { class: 'gris chico' }, hace(f.ultimoGuardado)) : null),
        h('td', null, chip(f)),
        h('td', { class: 'acc' },
          h('button', { type: 'button', class: 'btn btn--chico btn--secundario', onclick: () => verArchivo(f) }, 'Ver'),
          h('button', { type: 'button', class: 'btn btn--chico btn--secundario', disabled: !f.perfil.personaje || null, onclick: async () => { const exp = await docente.cargarExpedienteDe(f.uid).catch(() => f.expediente); await descargarWord({ perfil: f.perfil, respuestas: exp?.respuestas || {}, expediente: exp }); } }, 'Word'),
          h('button', { type: 'button', class: 'btn btn--chico btn--secundario', 'aria-label': 'Más acciones', onclick: () => menuMas(f) }, '⋯'))))
        : h('tr', null, h('td', { colspan: '7', class: 'gris' }, datos.filas.length ? 'Ningún estudiante coincide con el filtro.' : 'Aún no hay estudiantes. Usa «Agregar estudiante» o «Importar lista».'))))));
}
