/**
 * PANEL DEL PROFESOR · NÓMINA DEL CURSO
 * Cuentas, asignación de caso y personaje, importación de CSV (nómina y resultados del sorteo),
 * y revisión de duplicados. Los estudiantes ingresan con nombre + primer apellido (no hay contraseñas que repartir).
 */

import { h, montar, normalizar, capitalizar, huellaIdentidad, parsearCSV, aCSV, descargarTexto, fechaCorta } from './util.js';
import { LISTA_PERSONAJES, PERSONAJES, CASOS, SINONIMOS_PERSONAJE } from './contenido.js';
import { docente, modoServicios } from './servicios.js';
import { avisar, abrirDialogo, confirmar, chipEstado } from './ui-comun.js';

/* ---------- Utilidades ---------- */

const fmtPersonaje = (c) => PERSONAJES[c]?.nombre || '—';
const GENERICOS = new Set(['testigo', 'juez']);

/** Interpreta lo que venga escrito para un personaje (CSV del sorteo). */
export function interpretarPersonaje(texto) {
  const n = normalizar(texto);
  if (!n) return { clave: null, ambiguo: false };
  for (const [clave, sins] of Object.entries(SINONIMOS_PERSONAJE)) {
    if (clave === n || sins.includes(n)) return { clave, ambiguo: GENERICOS.has(n) };
  }
  for (const p of LISTA_PERSONAJES) if (normalizar(p.nombre) === n) return { clave: p.clave, ambiguo: false };
  return { clave: null, ambiguo: true, texto };
}

export function interpretarCaso(texto) {
  const m = String(texto ?? '').match(/[123]/);
  return m ? Number(m[0]) : null;
}

function separarNombreCompleto(texto, orden) {
  const t = String(texto ?? '').trim();
  if (!t) return { nombre: '', apellido: '' };
  if (t.includes(',')) { const [a, n] = t.split(',').map((x) => x.trim()); return { nombre: n || '', apellido: a || '' }; }
  const p = t.split(/\s+/);
  if (p.length === 1) return { nombre: p[0], apellido: '' };
  if (orden === 'apellidos_primero') return { apellido: p[0], nombre: p[p.length >= 3 ? 2 : 1] };
  return { nombre: p[0], apellido: p.length >= 4 ? p[p.length - 2] : p[1] };
}

const adivinar = (cabeceras, ...patrones) => {
  const i = cabeceras.findIndex((c) => patrones.some((r) => r.test(normalizar(c))));
  return i;
};

/* ---------- Resumen de cuentas creadas ---------- */

/** Muestra cómo ingresará cada estudiante (no hay contraseñas: escribe su nombre y su primer apellido). */
export async function mostrarCreadas(resultados, titulo = 'Cuentas creadas') {
  const lista = resultados.filter((r) => r.estado === 'creado' || r.estado === 'recuperada');
  if (!lista.length) return;
  const mayus = (t) => normalizar(t).toUpperCase();
  await abrirDialogo({
    titulo,
    ancho: 'min(48rem, 95vw)',
    cuerpo: h('div', null,
      h('div', { class: 'aviso aviso--info', role: 'status' }, h('span', null, 'i'),
        h('div', null,
          h('p', null, h('strong', null, 'No hay contraseñas que entregar.'), ' Cada estudiante ingresa escribiendo su nombre (la primera palabra) y su primer apellido, en MAYÚSCULAS y sin tildes.'),
          lista.some((r) => r.soloPrueba) ? h('p', null, 'Modo local de prueba: las cuentas viven solo en este navegador.') : null)),
      h('div', { class: 'adm-tabla-cont', style: { maxHeight: '45vh' } },
        h('table', { class: 'adm-tabla' },
          h('thead', null, h('tr', null, ['Estudiante', 'Escribe en «Nombre»', 'Escribe en «Primer apellido»'].map((x) => h('th', null, x)))),
          h('tbody', null, lista.map((r) => h('tr', null,
            h('td', null, `${r.nombre} ${r.apellido}`, r.estado === 'recuperada' ? h('small', null, ' (cuenta recuperada)') : null),
            h('td', { class: 'adm-clave' }, mayus(r.nombre).split(' ')[0]),
            h('td', { class: 'adm-clave' }, mayus(r.apellido).replace(/ /g, '')))))))),
    acciones: [{ texto: 'Cerrar', valor: true }],
  });
}

/* ---------- Formularios ---------- */

function selectCaso(valor, extra = {}) {
  return h('select', extra, h('option', { value: '' }, '— caso —'), CASOS.map((c) => h('option', { value: String(c), selected: valor === c }, `Caso ${c}`)));
}
function selectPersonaje(valor, extra = {}) {
  return h('select', extra, h('option', { value: '' }, '— personaje —'), LISTA_PERSONAJES.map((p) => h('option', { value: p.clave, selected: valor === p.clave }, p.nombre)));
}

async function dialogoAgregar(api) {
  const campo = (id, et, extra = {}) => h('div', { class: 'campo' }, h('label', { for: id }, et), h('input', { id, type: 'text', autocomplete: 'off', ...extra }));
  const cuerpo = h('div', null,
    h('div', { class: 'adm-form-2' },
      campo('n-nombre', 'Nombre (el primero basta)'), campo('n-apellido', 'Primer apellido')),
    h('div', { class: 'adm-form-2' },
      campo('n-curso', 'Curso', { value: api.datos().config.curso || '' }),
      campo('n-codigo', 'Código de cuenta (solo si hay homónimos)')),
    h('div', { class: 'adm-form-2' },
      h('div', { class: 'campo' }, h('label', { for: 'n-caso' }, 'Caso'), selectCaso(null, { id: 'n-caso' })),
      h('div', { class: 'campo' }, h('label', { for: 'n-pers' }, 'Personaje'), selectPersonaje(null, { id: 'n-pers' }))),
    h('p', { class: 'campo__ayuda' }, 'Los estudiantes ingresan solo con nombre + primer apellido (en mayúsculas y sin tildes). Si dos estudiantes tienen el mismo nombre y apellido, dale a cada uno un código distinto.'),
    h('p', { class: 'campo__ayuda', id: 'n-error', role: 'alert', style: { color: 'var(--error)', fontWeight: 700 } }));
  let resultado = null;
  await abrirDialogo({
    titulo: 'Agregar estudiante', cuerpo,
    acciones: [
      { texto: 'Cancelar', clase: 'btn--secundario' },
      {
        texto: 'Crear cuenta', valor: true,
        alClick: async (dlg) => {
          const v = (id) => dlg.querySelector(id).value.trim();
          const err = dlg.querySelector('#n-error');
          err.textContent = '';
          if (!v('#n-nombre') || !v('#n-apellido')) { err.textContent = 'Escribe el nombre y el primer apellido.'; return false; }
          try {
            const r = await docente.crearEstudiantes([{
              nombre: v('#n-nombre'), apellido: v('#n-apellido'), curso: v('#n-curso'), codigoCuenta: v('#n-codigo'),
              caso: Number(v('#n-caso')) || null, personaje: v('#n-pers') || null,
            }]);
            if (!['creado', 'recuperada'].includes(r[0].estado)) { err.textContent = r[0].mensaje || 'No se pudo crear la cuenta.'; return false; }
            resultado = r;
          } catch (e) { err.textContent = e.message || 'No se pudo crear la cuenta.'; return false; }
          return true;
        },
      },
    ],
  });
  if (resultado) { await api.recargar(); await mostrarCreadas(resultado, 'Cuenta creada'); }
}

/* ---------- Importación de CSV ---------- */

async function dialogoImportar(api) {
  const estado = { csv: null, filas: [] };
  const zonaMapa = h('div');
  const zonaPrevia = h('div');
  const texto = h('textarea', { rows: 5, placeholder: 'O pega aquí el contenido del CSV (nombre;apellido;curso;caso;personaje)…', 'aria-label': 'Contenido del CSV' });
  const archivo = h('input', { type: 'file', accept: '.csv,.txt,text/csv', 'aria-label': 'Archivo CSV' });
  const sel = (id, opciones, valor) => h('select', { id }, h('option', { value: '-1' }, '— no usar —'), opciones.map((o, i) => h('option', { value: String(i), selected: i === valor }, o)));
  let mapa = {};
  let ordenNombre = 'nombre_primero';

  async function construirPrevia() {
    const { cabeceras, filas } = estado.csv;
    const g = (clave) => Number(mapa[clave]?.value ?? -1);
    const existentes = await Promise.all(api.datos().filas.map(async (f) => ({ f, huella: await huellaIdentidad(f.perfil.nombre, f.perfil.apellido, f.perfil.codigoCuenta || '') })));
    const porHuella = new Map(existentes.map((e) => [e.huella, e.f]));
    const vistos = new Set();
    const items = [];
    for (const fila of filas) {
      const val = (i) => (i >= 0 ? fila[i] ?? '' : '');
      let nombre = val(g('nombre')), apellido = val(g('apellido'));
      if (g('completo') >= 0 && (!nombre || !apellido)) ({ nombre, apellido } = separarNombreCompleto(val(g('completo')), ordenNombre));
      nombre = capitalizar(nombre); apellido = capitalizar(apellido);
      const pers = g('personaje') >= 0 ? interpretarPersonaje(val(g('personaje'))) : { clave: null, ambiguo: false };
      items.push({
        nombre, apellido, curso: val(g('curso')) || api.datos().config.curso, codigoCuenta: val(g('codigo')),
        caso: g('caso') >= 0 ? interpretarCaso(val(g('caso'))) : null, personaje: pers.clave, personajeTexto: g('personaje') >= 0 ? val(g('personaje')) : '', ambiguo: pers.ambiguo,
      });
    }
    for (const it of items) {
      if (!it.nombre || !it.apellido) { it.estado = 'error'; it.mensaje = 'Falta nombre o apellido'; continue; }
      const hu = await huellaIdentidad(it.nombre, it.apellido, it.codigoCuenta);
      if (vistos.has(hu)) { it.estado = 'error'; it.mensaje = 'Repetido en el archivo (usa un código de cuenta)'; continue; }
      vistos.add(hu);
      const ex = porHuella.get(hu);
      if (ex) {
        it.uid = ex.uid;
        if (ex.perfil.asignacionBloqueada || api.datos().config.asignacionesBloqueadas) { it.estado = 'bloqueada'; it.mensaje = 'Asignación bloqueada: no se cambiará'; }
        else if (!it.caso && !it.personaje) { it.estado = 'sin_cambios'; it.mensaje = 'Ya existe; el archivo no trae asignación'; }
        else { it.estado = 'actualizar'; it.mensaje = 'Ya existe: se actualizará su asignación'; }
      } else { it.estado = 'nueva'; it.mensaje = 'Cuenta nueva'; }
      if (it.personajeTexto && !it.personaje) it.mensaje += ' · personaje no reconocido';
      else if (it.ambiguo) it.mensaje += ' · revisa el personaje (texto ambiguo)';
    }
    estado.filas = items;
    pintarPrevia();
  }

  function pintarPrevia() {
    const cuentas = (e) => estado.filas.filter((f) => f.estado === e).length;
    montar(zonaPrevia,
      h('h3', null, 'Vista previa'),
      h('p', null, `${cuentas('nueva')} cuentas nuevas · ${cuentas('actualizar')} asignaciones a actualizar · ${cuentas('bloqueada') + cuentas('sin_cambios')} sin cambios · ${cuentas('error')} con errores. Puedes corregir nombre y apellido en la tabla.`),
      h('div', { class: 'adm-tabla-cont', style: { maxHeight: '38vh' } },
        h('table', { class: 'adm-tabla' },
          h('thead', null, h('tr', null, ['Nombre', 'Apellido', 'Caso', 'Personaje', 'Resultado'].map((x) => h('th', null, x)))),
          h('tbody', null, estado.filas.map((it) => h('tr', { 'data-estado': it.estado },
            h('td', null, h('input', { type: 'text', value: it.nombre, 'aria-label': 'Nombre', onchange: (e) => { it.nombre = capitalizar(e.target.value); construirPrevia(); } })),
            h('td', null, h('input', { type: 'text', value: it.apellido, 'aria-label': 'Apellido', onchange: (e) => { it.apellido = capitalizar(e.target.value); construirPrevia(); } })),
            h('td', null, it.caso ? `Caso ${it.caso}` : '—'),
            h('td', null, it.personaje ? fmtPersonaje(it.personaje) : (it.personajeTexto ? h('em', null, `“${it.personajeTexto}”`) : '—')),
            h('td', null, h('span', { class: `chip ${{ nueva: 'chip--verde', actualizar: 'chip--azul', error: 'chip--rojo' }[it.estado] || 'chip--gris'}` }, it.mensaje))))))));
    // Los cambios hechos a mano en nombre/apellido se vuelven a evaluar al reconstruir; se guardan en it.* directamente.
  }

  async function leer(contenido) {
    const csv = parsearCSV(contenido);
    if (!csv.cabeceras.length || !csv.filas.length) { montar(zonaMapa, h('p', { class: 'aviso aviso--error' }, 'No se encontraron filas. El archivo debe tener una fila de títulos y luego un estudiante por fila.')); return; }
    estado.csv = csv;
    const c = csv.cabeceras;
    const sugerido = {
      nombre: adivinar(c, /^(nombres?|primer nombre|name)$/),
      apellido: adivinar(c, /^(primer apellido|apellido|apellido paterno|apellidos?)$/),
      completo: adivinar(c, /(nombre completo|alumn|estudiante)/),
      curso: adivinar(c, /^curso$/), caso: adivinar(c, /caso/), personaje: adivinar(c, /(personaje|rol|papel|funcion)/), codigo: adivinar(c, /(codigo|cuenta)/),
    };
    mapa = {
      nombre: sel('m-nombre', c, sugerido.nombre), apellido: sel('m-apellido', c, sugerido.apellido), completo: sel('m-completo', c, sugerido.nombre >= 0 && sugerido.apellido >= 0 ? -1 : sugerido.completo),
      curso: sel('m-curso', c, sugerido.curso), caso: sel('m-caso', c, sugerido.caso), personaje: sel('m-personaje', c, sugerido.personaje), codigo: sel('m-codigo', c, sugerido.codigo),
    };
    const orden = h('select', { id: 'm-orden', onchange: (e) => { ordenNombre = e.target.value; construirPrevia(); } },
      h('option', { value: 'nombre_primero' }, 'Nombre Apellido1 Apellido2'), h('option', { value: 'apellidos_primero' }, 'Apellido1 Apellido2 Nombre'));
    for (const s of Object.values(mapa)) s.addEventListener('change', construirPrevia);
    const f = (et, s) => h('div', { class: 'campo' }, h('label', null, et), s);
    montar(zonaMapa,
      h('h3', null, `Asigna las columnas (${csv.filas.length} filas)`),
      h('p', { class: 'campo__ayuda' }, 'Usa «Nombre» y «Primer apellido» separados, o una sola columna con el nombre completo. Para ingresar, el estudiante escribe su primer nombre y su primer apellido.'),
      h('div', { class: 'adm-form-3' },
        f('Nombre', mapa.nombre), f('Primer apellido', mapa.apellido), f('o Nombre completo', mapa.completo), f('Orden del nombre completo', orden),
        f('Curso', mapa.curso), f('Caso', mapa.caso), f('Personaje (p. ej. del sorteo)', mapa.personaje), f('Código de cuenta', mapa.codigo)));
    await construirPrevia();
  }

  archivo.addEventListener('change', async () => { const f = archivo.files[0]; if (f) { texto.value = ''; await leer(await f.text()); } });
  texto.addEventListener('change', () => leer(texto.value));

  const cuerpo = h('div', null,
    h('p', null, 'Importa la nómina y, si quieres, los resultados del sorteo (caso y personaje) en un mismo CSV. Las cuentas que ya existen solo actualizan su asignación; nunca se cambia una asignación bloqueada.'),
    h('div', { class: 'campo' }, h('label', null, 'Archivo CSV'), archivo), texto, zonaMapa, zonaPrevia);

  let resultados = null;
  await abrirDialogo({
    titulo: 'Importar CSV', cuerpo, ancho: 'min(60rem, 96vw)',
    acciones: [
      { texto: 'Cancelar', clase: 'btn--secundario' },
      {
        texto: 'Aplicar importación', valor: true,
        alClick: async () => {
          const nuevas = estado.filas.filter((f) => f.estado === 'nueva');
          const actualizar = estado.filas.filter((f) => f.estado === 'actualizar');
          if (!nuevas.length && !actualizar.length) { avisar('No hay nada que aplicar.', 'info'); return false; }
          try {
            const creadas = [];
            for (let i = 0; i < nuevas.length; i += 25) {
              const lote = nuevas.slice(i, i + 25).map((n) => ({ nombre: n.nombre, apellido: n.apellido, curso: n.curso, codigoCuenta: n.codigoCuenta, caso: n.caso, personaje: n.personaje }));
              creadas.push(...await docente.crearEstudiantes(lote));
            }
            for (const a of actualizar) await docente.actualizarEstudiante(a.uid, { ...(a.caso ? { caso: a.caso } : {}), ...(a.personaje ? { personaje: a.personaje } : {}) });
            resultados = { creadas, actualizadas: actualizar.length };
          } catch (e) { avisar(e.message || 'No se pudo aplicar la importación.', 'error', 8000); return false; }
          return true;
        },
      },
    ],
  });
  if (resultados) {
    await api.recargar();
    const ok = resultados.creadas.filter((r) => r.estado === 'creado' || r.estado === 'recuperada');
    const falla = resultados.creadas.filter((r) => r.estado !== 'creado');
    avisar(`Importación lista: ${ok.length} cuentas nuevas, ${resultados.actualizadas} asignaciones actualizadas${falla.length ? `, ${falla.length} con problemas` : ''}.`, falla.length ? 'info' : 'ok', 7000);
    await mostrarCreadas(ok, 'Cuentas nuevas: cómo ingresa cada estudiante');
  }
}

/* ---------- Duplicados ---------- */

function buscarDuplicados(filas) {
  const porNombre = new Map();
  const porRol = new Map();
  for (const f of filas) {
    const clave = `${normalizar(f.perfil.nombre).split(' ')[0]}|${normalizar(f.perfil.apellido).replace(/ /g, '')}`;
    porNombre.set(clave, [...(porNombre.get(clave) || []), f]);
    if (f.perfil.caso && f.perfil.personaje) {
      const k = `${f.perfil.caso}|${f.perfil.personaje}`;
      porRol.set(k, [...(porRol.get(k) || []), f]);
    }
  }
  return {
    nombres: [...porNombre.values()].filter((g) => g.length > 1),
    roles: [...porRol.entries()].filter(([, g]) => g.length > 1).map(([k, g]) => ({ caso: Number(k.split('|')[0]), personaje: k.split('|')[1], grupo: g })),
  };
}

function dialogoDuplicados(api) {
  const { nombres, roles } = buscarDuplicados(api.datos().filas);
  abrirDialogo({
    titulo: 'Revisión de duplicados',
    ancho: 'min(44rem, 95vw)',
    cuerpo: h('div', null,
      h('h3', null, 'Mismo nombre y primer apellido'),
      nombres.length
        ? [h('p', { class: 'campo__ayuda' }, 'Estos estudiantes no pueden ingresar con los mismos datos. Asigna a cada uno un código de cuenta distinto (hay que recrear la cuenta con el código).'),
          h('ul', null, nombres.map((g) => h('li', null, g.map((f) => `${f.perfil.nombreMostrar}${f.perfil.codigoCuenta ? ` [${f.perfil.codigoCuenta}]` : ''}`).join(' · '))))]
        : h('p', { class: 'aviso aviso--ok' }, 'No hay homónimos.'),
      h('h3', null, 'Personaje repetido dentro de un caso'),
      roles.length
        ? h('ul', null, roles.map((r) => h('li', null, `Caso ${r.caso} · ${fmtPersonaje(r.personaje)}: ${r.grupo.map((f) => f.perfil.nombreMostrar).join(', ')}`)))
        : h('p', { class: 'aviso aviso--ok' }, 'Cada personaje está asignado una sola vez por caso.')),
  });
}

/* ---------- Vista ---------- */

export function vistaNomina(api) {
  const D = api.datos();
  const filas = [...D.filas].sort((a, b) => `${a.perfil.apellido} ${a.perfil.nombre}`.localeCompare(`${b.perfil.apellido} ${b.perfil.nombre}`, 'es'));
  const { roles } = buscarDuplicados(filas);
  const repetidos = new Set(roles.flatMap((r) => r.grupo.map((f) => f.uid)));
  const bloqueoGlobal = Boolean(D.config.asignacionesBloqueadas);
  const buscador = h('input', { type: 'search', placeholder: 'Buscar por nombre…', 'aria-label': 'Buscar estudiante' });
  const tbody = h('tbody');

  const cambiarAsignacion = async (f, datos, selects) => {
    const nuevo = { caso: f.perfil.caso, personaje: f.perfil.personaje, ...datos };
    if (nuevo.caso && nuevo.personaje) {
      const choque = filas.find((o) => o.uid !== f.uid && o.perfil.caso === nuevo.caso && o.perfil.personaje === nuevo.personaje);
      if (choque && !(await confirmar({ titulo: 'Personaje ya asignado', mensaje: `${choque.perfil.nombreMostrar} ya tiene «${fmtPersonaje(nuevo.personaje)}» en el caso ${nuevo.caso}. ¿Asignarlo de todos modos?`, ok: 'Asignar igual' }))) {
        selects.caso.value = f.perfil.caso ? String(f.perfil.caso) : ''; selects.pers.value = f.perfil.personaje || ''; return;
      }
    }
    try { await docente.actualizarEstudiante(f.uid, datos); await api.recargar(); avisar('Asignación guardada.', 'ok', 2500); } catch (e) { avisar(e.message || 'No se pudo guardar.', 'error'); }
  };

  const pintarFilas = () => {
    const q = normalizar(buscador.value);
    montar(tbody, filas.filter((f) => !q || normalizar(f.perfil.nombreMostrar).includes(q)).map((f) => {
      const p = f.perfil;
      const bloqueada = bloqueoGlobal || p.asignacionBloqueada;
      const caso = selectCaso(p.caso, { disabled: bloqueada, 'aria-label': `Caso de ${p.nombreMostrar}` });
      const pers = selectPersonaje(p.personaje, { disabled: bloqueada, 'aria-label': `Personaje de ${p.nombreMostrar}` });
      const selects = { caso, pers };
      caso.addEventListener('change', () => cambiarAsignacion(f, { caso: Number(caso.value) || null }, selects));
      pers.addEventListener('change', () => cambiarAsignacion(f, { personaje: pers.value || null }, selects));
      const lock = h('input', { type: 'checkbox', checked: Boolean(p.asignacionBloqueada), disabled: bloqueoGlobal, 'aria-label': `Bloquear asignación de ${p.nombreMostrar}` });
      lock.addEventListener('change', async () => { try { await docente.actualizarEstudiante(f.uid, { asignacionBloqueada: lock.checked }); await api.recargar(); } catch (e) { avisar(e.message, 'error'); } });
      return h('tr', { class: p.activo === false ? 'adm-fila-suspendida' : null },
        h('td', null, h('strong', null, p.nombreMostrar), p.codigoCuenta ? h('small', null, ` [${p.codigoCuenta}]`) : null, repetidos.has(f.uid) ? h('span', { class: 'chip chip--ambar' }, 'personaje repetido') : null),
        h('td', null, p.curso || '—'), h('td', null, caso), h('td', null, pers),
        h('td', { class: 'adm-centro' }, lock),
        h('td', null, p.activo === false ? h('span', { class: 'chip chip--rojo' }, 'Suspendida') : chipEstado(f.estado)),
        h('td', { class: 'adm-acciones' },
          h('button', { type: 'button', class: 'btn btn--chico btn--secundario', onclick: async () => {
            const suspender = p.activo !== false;
            if (suspender && !(await confirmar({ titulo: 'Suspender cuenta', mensaje: `${p.nombreMostrar} no podrá ingresar hasta que la reactives. Su avance se conserva.`, ok: 'Suspender', peligro: true }))) return;
            try { await docente.suspenderEstudiante(f.uid, suspender); await api.recargar(); } catch (e) { avisar(e.message || 'No se pudo cambiar el estado.', 'error'); }
          } }, p.activo === false ? 'Reactivar' : 'Suspender'),
          h('a', { class: 'btn btn--chico btn--secundario', href: `#/profesor/seguimiento/${f.uid}` }, 'Ver')));
    }));
  };
  buscador.addEventListener('input', pintarFilas);
  pintarFilas();

  const bloqueoBtn = h('button', { type: 'button', class: 'btn btn--secundario', onclick: async () => {
    try { await docente.guardarConfig({ asignacionesBloqueadas: !bloqueoGlobal }); await api.recargar(); } catch (e) { avisar(e.message, 'error'); }
  } }, bloqueoGlobal ? 'Desbloquear todas las asignaciones' : 'Bloquear todas las asignaciones');

  return h('section', { 'aria-labelledby': 'adm-titulo' },
    h('h2', { id: 'adm-titulo' }, 'Nómina del curso'),
    h('p', null, `${filas.length} estudiantes · ${filas.filter((f) => f.perfil.caso && f.perfil.personaje).length} con caso y personaje asignados.`),
    bloqueoGlobal ? h('div', { class: 'aviso aviso--alerta' }, h('span', null, '!'), h('p', null, 'Las asignaciones están bloqueadas para todos. Desbloquéalas para cambiarlas.')) : null,
    h('div', { class: 'adm-barra-herramientas' },
      h('button', { type: 'button', class: 'btn', onclick: () => dialogoAgregar(api) }, 'Agregar estudiante'),
      h('button', { type: 'button', class: 'btn btn--azul', onclick: () => dialogoImportar(api) }, 'Importar CSV'),
      h('button', { type: 'button', class: 'btn btn--secundario', onclick: () => dialogoDuplicados(api) }, 'Revisar duplicados'),
      bloqueoBtn,
      modoServicios() === 'local' ? h('button', { type: 'button', class: 'btn btn--secundario', onclick: async () => { await docente.cargarDatosDePrueba(); await api.recargar(); } }, 'Cargar cuentas de prueba') : null,
      buscador),
    filas.length
      ? h('div', { class: 'adm-tabla-cont' }, h('table', { class: 'adm-tabla' },
        h('thead', null, h('tr', null, ['Estudiante', 'Curso', 'Caso', 'Personaje', 'Bloq.', 'Estado', 'Acciones'].map((x) => h('th', { scope: 'col' }, x)))),
        tbody))
      : h('div', { class: 'aviso aviso--info' }, h('span', null, 'i'), h('p', null, 'Todavía no hay estudiantes. Agrega uno o importa un CSV para crear las cuentas.')));
}
