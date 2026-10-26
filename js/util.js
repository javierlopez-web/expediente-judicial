/* Utilidades compartidas: DOM seguro, normalización de nombres, CSV, fechas, debounce. */

/* ---------- DOM ---------- */

/**
 * Crea un elemento. Los textos se insertan siempre como texto (nunca como HTML),
 * así las respuestas de los estudiantes no pueden inyectar código en el panel docente.
 */
export function h(tag, attrs, ...hijos) {
  const el = document.createElement(tag);
  if (attrs) {
    for (const [k, v] of Object.entries(attrs)) {
      if (v === null || v === undefined || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'dataset') Object.assign(el.dataset, v);
      else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
      else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
      else if (k === 'value') el.value = v;
      else if (k === 'checked' || k === 'disabled' || k === 'selected' || k === 'hidden' || k === 'open') {
        if (v) el.setAttribute(k, '');
        el[k] = Boolean(v);
      } else el.setAttribute(k, v === true ? '' : String(v));
    }
  }
  agregarHijos(el, hijos);
  return el;
}

function agregarHijos(el, hijos) {
  for (const hijo of hijos.flat(Infinity)) {
    if (hijo === null || hijo === undefined || hijo === false) continue;
    el.append(hijo instanceof Node ? hijo : document.createTextNode(String(hijo)));
  }
}

export function vaciar(el) {
  while (el.firstChild) el.removeChild(el.firstChild);
  return el;
}

export function montar(el, ...hijos) {
  vaciar(el);
  agregarHijos(el, hijos);
  return el;
}

export const qs = (sel, raiz = document) => raiz.querySelector(sel);
export const qsa = (sel, raiz = document) => [...raiz.querySelectorAll(sel)];

let _idContador = 0;
export const idUnico = (pref = 'id') => `${pref}-${++_idContador}`;

/* ---------- Preferencias de movimiento ---------- */

export function movimientoReducido() {
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export const esperar = (ms) => new Promise((r) => setTimeout(r, movimientoReducido() ? 0 : ms));

/* ---------- Texto y nombres ---------- */

/** minúsculas, sin tildes, sin signos, espacios simples. "  José  Núñez " → "jose nunez" */
export function normalizar(texto) {
  return String(texto ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9ñ\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Capitaliza cada palabra para mostrar nombres. */
export function capitalizar(texto) {
  return String(texto ?? '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .replace(/(^|\s|-)([a-záéíóúüñ])/g, (m, a, b) => a + b.toUpperCase());
}

/**
 * Huella de identidad: SHA-256 de "nombre|apellido|codigo" normalizados (primeros 32 hex).
 * La usa el navegador tanto al crear la cuenta (panel del profesor) como al ingresar (estudiante).
 * No es un secreto. Sirve para no pedir un correo al estudiante.
 */
export async function huellaIdentidad(nombre, apellido, codigo = '') {
  // Del nombre se usa solo la primera palabra ("Juan Pablo" y "Juan" ingresan igual); el apellido se usa completo, sin espacios.
  const primerNombre = normalizar(nombre).split(' ')[0] || '';
  const base = `${primerNombre}|${normalizar(apellido).replace(/ /g, '')}|${normalizar(codigo).replace(/ /g, '')}`;
  const datos = new TextEncoder().encode(base);
  const hash = (typeof crypto !== 'undefined' && crypto.subtle) ? new Uint8Array(await crypto.subtle.digest('SHA-256', datos)) : sha256(datos);
  return [...hash].map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 32);
}

/**
 * Contraseña interna de la cuenta: se deriva del propio nombre y primer apellido (en mayúsculas y sin tildes).
 * El estudiante NO la escribe: al ingresar solo da nombre y primer apellido.
 * Decisión de diseño para un uso escolar (plan gratuito de Firebase, sin Cloud Functions para crear/restablecer claves):
 * cualquiera que conozca el nombre y apellido de un compañero puede ingresar como él. Es el costo de no usar contraseñas.
 */
export function claveDeIngreso(nombre, apellido, codigo = '') {
  const n = normalizar(nombre).split(' ')[0] || '';
  const a = normalizar(apellido).replace(/ /g, '');
  const c = normalizar(codigo).replace(/ /g, '');
  return `EXPEDIENTE.${n}.${a}${c ? `.${c}` : ''}`.toUpperCase();
}

export function nombreArchivoSeguro(texto) {
  return String(texto ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Za-z0-9]+/g, '')
    .slice(0, 40);
}

export function distanciaEdicion(a, b) {
  const m = a.length, n = b.length;
  if (!m) return n;
  if (!n) return m;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[n];
}

/* ---------- Fechas (hora de Chile) ---------- */

const ZONA = 'America/Santiago';

/** Acepta Date, ms, ISO string o Timestamp de Firestore ({toDate()}). */
export function aFecha(v) {
  if (!v) return null;
  if (v instanceof Date) return v;
  if (typeof v.toDate === 'function') return v.toDate();
  if (typeof v === 'object' && typeof v.seconds === 'number') return new Date(v.seconds * 1000);
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function fechaHora(v) {
  const d = aFecha(v);
  if (!d) return '—';
  return new Intl.DateTimeFormat('es-CL', { dateStyle: 'medium', timeStyle: 'short', timeZone: ZONA }).format(d);
}

export function soloFecha(v) {
  const d = aFecha(v);
  if (!d) return '—';
  return new Intl.DateTimeFormat('es-CL', { dateStyle: 'long', timeZone: ZONA }).format(d);
}

export function fechaCorta(v) {
  const d = aFecha(v);
  if (!d) return '—';
  return new Intl.DateTimeFormat('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: ZONA }).format(d);
}

export function hace(v) {
  const d = aFecha(v);
  if (!d) return 'sin actividad';
  const s = Math.round((Date.now() - d.getTime()) / 1000);
  if (s < 60) return 'hace instantes';
  if (s < 3600) return `hace ${Math.floor(s / 60)} min`;
  if (s < 86400) return `hace ${Math.floor(s / 3600)} h`;
  return `hace ${Math.floor(s / 86400)} d`;
}

/* ---------- Funciones de control ---------- */

export function debounce(fn, ms) {
  let t = null;
  const f = (...args) => {
    clearTimeout(t);
    t = setTimeout(() => { t = null; fn(...args); }, ms);
  };
  f.flush = (...args) => { if (t) { clearTimeout(t); t = null; fn(...args); } };
  f.cancel = () => { clearTimeout(t); t = null; };
  f.pendiente = () => t !== null;
  return f;
}

export const sinTildes = (s) => normalizar(s);

/* ---------- CSV ---------- */

export function parsearCSV(texto) {
  let t = String(texto ?? '').replace(/^﻿/, '');
  if (!t.trim()) return { cabeceras: [], filas: [] };
  const primera = t.split(/\r?\n/, 1)[0];
  const delim = (primera.match(/;/g) || []).length > (primera.match(/,/g) || []).length
    ? ';'
    : ((primera.match(/\t/g) || []).length > (primera.match(/,/g) || []).length ? '\t' : ',');
  const filas = [];
  let fila = [], campo = '', comillas = false;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (comillas) {
      if (c === '"') {
        if (t[i + 1] === '"') { campo += '"'; i++; } else comillas = false;
      } else campo += c;
    } else if (c === '"') comillas = true;
    else if (c === delim) { fila.push(campo); campo = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && t[i + 1] === '\n') i++;
      fila.push(campo); campo = '';
      if (fila.some((x) => x.trim() !== '')) filas.push(fila);
      fila = [];
    } else campo += c;
  }
  fila.push(campo);
  if (fila.some((x) => x.trim() !== '')) filas.push(fila);
  const cabeceras = (filas.shift() || []).map((x) => x.trim());
  return { cabeceras, filas: filas.map((f) => f.map((x) => x.trim())) };
}

/** Protege contra "inyección de fórmulas" al abrir el CSV en Excel/Sheets. */
function celdaCSV(v) {
  let s = v === null || v === undefined ? '' : String(v);
  if (/^[=+\-@\t\r]/.test(s) && !/^-?\d+([.,]\d+)?$/.test(s)) s = `'${s}`;
  return /[",;\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function aCSV(cabeceras, filas, separador = ';') {
  const lineas = [cabeceras, ...filas].map((f) => f.map(celdaCSV).join(separador));
  return '﻿' + lineas.join('\r\n');
}

/* ---------- Descargas ---------- */

export function descargarBlob(blob, nombre) {
  const url = URL.createObjectURL(blob);
  const a = h('a', { href: url, download: nombre, style: { display: 'none' } });
  document.body.append(a);
  a.click();
  setTimeout(() => { a.remove(); URL.revokeObjectURL(url); }, 4000);
}

export function descargarTexto(texto, nombre, tipo = 'text/csv;charset=utf-8') {
  descargarBlob(new Blob([texto], { type: tipo }), nombre);
}

/* ---------- Varios ---------- */

export const clon = (o) => (typeof structuredClone === 'function' ? structuredClone(o) : JSON.parse(JSON.stringify(o)));
export const vacio = (v) => v === undefined || v === null || String(v).trim() === '';

/* ---------- Respaldos para contextos sin crypto.subtle (p. ej. un archivo abierto desde el teléfono) ---------- */

/** SHA-256 en JavaScript puro (solo se usa si el navegador no ofrece crypto.subtle). Devuelve Uint8Array(32). */
export function sha256(bytes) {
  const K = new Uint32Array([
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da, 0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2]);
  const H = new Uint32Array([0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19]);
  const largo = bytes.length;
  const total = ((largo + 9 + 63) >> 6) << 6;
  const m = new Uint8Array(total);
  m.set(bytes);
  m[largo] = 0x80;
  const dv = new DataView(m.buffer);
  dv.setUint32(total - 8, Math.floor((largo * 8) / 0x100000000));
  dv.setUint32(total - 4, (largo * 8) >>> 0);
  const w = new Uint32Array(64);
  const rotr = (x, n) => (x >>> n) | (x << (32 - n));
  for (let off = 0; off < total; off += 64) {
    for (let i = 0; i < 16; i++) w[i] = dv.getUint32(off + i * 4);
    for (let i = 16; i < 64; i++) {
      const s0 = rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ (w[i - 15] >>> 3);
      const s1 = rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ (w[i - 2] >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
    }
    let [a, b, c, d, e, f, g, hh] = H;
    for (let i = 0; i < 64; i++) {
      const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
      const ch = (e & f) ^ (~e & g);
      const t1 = (hh + S1 + ch + K[i] + w[i]) >>> 0;
      const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
      const mj = (a & b) ^ (a & c) ^ (b & c);
      const t2 = (S0 + mj) >>> 0;
      hh = g; g = f; f = e; e = (d + t1) >>> 0; d = c; c = b; b = a; a = (t1 + t2) >>> 0;
    }
    H[0] += a; H[1] += b; H[2] += c; H[3] += d; H[4] += e; H[5] += f; H[6] += g; H[7] += hh;
  }
  const out = new Uint8Array(32);
  const o = new DataView(out.buffer);
  H.forEach((v, i) => o.setUint32(i * 4, v >>> 0));
  return out;
}

/** Identificador corto aleatorio (crypto.randomUUID solo existe en contextos seguros). */
export function uuidCorto() {
  const b = new Uint8Array(8);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) crypto.getRandomValues(b); else b.forEach((_, i) => { b[i] = Math.floor(Math.random() * 256); });
  return [...b].map((x) => x.toString(16).padStart(2, '0')).join('').slice(0, 12);
}

/** Ruta de una imagen del proyecto. En el archivo único (expediente-judicial.html) las imágenes viajan incrustadas. */
export function rutaImg(nombre) {
  const incrustadas = globalThis.__IMAGENES;
  return (incrustadas && incrustadas[nombre]) || `assets/img/${nombre}.webp`;
}
