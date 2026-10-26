/**
 * BACKEND LOCAL DE PRUEBA
 * ---------------------------------------------------------------
 * Sustituye a Firebase SOLO mientras js/config.js no tenga la configuración del proyecto.
 * Guarda todo en el almacenamiento del navegador (localStorage). No hay autenticación real:
 * NO sirve para uso con estudiantes y la interfaz lo avisa de forma permanente.
 * Implementa exactamente el mismo contrato que js/firebase-service.js.
 */

import { AJUSTES_PREDETERMINADOS, DATOS_INSTITUCIONALES } from './config.js';
import { LISTA_PERSONAJES } from './contenido.js';
import { huellaIdentidad, capitalizar, clon, uuidCorto } from './util.js';

const CLAVE_DB = 'expjud:local:db';
const CLAVE_SESION = 'expjud:local:sesion';
const LATENCIA_MS = 220;

const pausa = (ms = LATENCIA_MS) => new Promise((r) => setTimeout(r, ms));
const ahora = () => new Date().toISOString();
const error = (code, message) => Object.assign(new Error(message || code), { code });

function dbVacia() {
  return { config: clon(AJUSTES_PREDETERMINADOS), estudiantes: {}, expedientes: {}, evaluaciones: {}, versiones: {} };
}

function leer() {
  try {
    const raw = localStorage.getItem(CLAVE_DB);
    if (raw) {
      const db = { ...dbVacia(), ...JSON.parse(raw) };
      db.config = { ...clon(AJUSTES_PREDETERMINADOS), ...db.config, escala: { ...AJUSTES_PREDETERMINADOS.escala, ...(db.config?.escala || {}) } };
      return db;
    }
  } catch { /* datos corruptos: se reinicia */ }
  return dbVacia();
}

function escribir(db) {
  localStorage.setItem(CLAVE_DB, JSON.stringify(db));
}

function nuevoExpediente(uid) {
  return {
    uid, respuestas: {}, estado: 'sin_iniciar', progreso: 0, etapaActual: 1, etapasVisitadas: [],
    ultimoGuardado: null, entregadoEn: null, editadoDespuesDeEntrega: false, version: 0, creadoEn: ahora(),
  };
}

export function crearBackendLocal() {
  const oyentes = new Set();
  const sesionActual = () => {
    try { return JSON.parse(sessionStorage.getItem(CLAVE_SESION) || 'null'); } catch { return null; }
  };
  const avisar = () => { const s = sesionActual(); oyentes.forEach((cb) => cb(s)); };

  const exigirProfesor = () => {
    if (!sesionActual()?.esProfesor) throw error('permission-denied', 'Solo el profesor puede hacer esto.');
  };

  const aplicarMeta = (exp, meta = {}) => {
    if (meta.etapaActual) exp.etapaActual = meta.etapaActual;
    if (Array.isArray(meta.etapasVisitadas)) exp.etapasVisitadas = meta.etapasVisitadas;
    if (typeof meta.progreso === 'number') exp.progreso = meta.progreso;
    if (!exp.entregadoEn && meta.estado) exp.estado = meta.estado;
  };

  return {
    modo: 'local',

    async init() { escribir(leer()); },

    observarSesion(cb) {
      oyentes.add(cb);
      queueMicrotask(() => cb(sesionActual()));
      return () => oyentes.delete(cb);
    },

    async iniciarSesionEstudiante({ nombre, apellido, codigo }) {
      await pausa();
      const huella = await huellaIdentidad(nombre, apellido, codigo);
      const db = leer();
      const est = Object.values(db.estudiantes).find((e) => e.huella === huella);
      if (!est) throw error('auth/invalid-credential');
      if (est.activo === false) throw error('auth/user-disabled');
      sessionStorage.setItem(CLAVE_SESION, JSON.stringify({ uid: est.uid, esProfesor: false }));
      avisar();
      return { uid: est.uid };
    },

    async iniciarSesionProfesor({ correo, password }) {
      await pausa();
      if (!correo || !password) throw error('auth/missing-password', 'Faltan datos.');
      sessionStorage.setItem(CLAVE_SESION, JSON.stringify({ uid: 'profesor-local', esProfesor: true, correo }));
      avisar();
      return { uid: 'profesor-local' };
    },

    async cerrarSesion() {
      sessionStorage.removeItem(CLAVE_SESION);
      avisar();
    },

    async cargarConfig() { await pausa(60); return clon(leer().config); },

    async cargarPerfil(uid) {
      await pausa(80);
      const e = leer().estudiantes[uid];
      return e ? clon(e) : null;
    },

    async cargarExpediente(uid) {
      await pausa(80);
      const db = leer();
      if (!db.expedientes[uid]) { db.expedientes[uid] = nuevoExpediente(uid); escribir(db); }
      return clon(db.expedientes[uid]);
    },

    async guardarCambios(uid, { cambios = {}, bases = {}, meta = {} }) {
      await pausa();
      const db = leer();
      const perfil = db.estudiantes[uid];
      if (!perfil || perfil.activo === false) throw error('permission-denied');
      if (db.config.edicionHabilitada === false || perfil.cerrado) throw error('permission-denied');
      const exp = db.expedientes[uid] || (db.expedientes[uid] = nuevoExpediente(uid));
      const conflictos = [];
      for (const [id, valor] of Object.entries(cambios)) {
        const srv = exp.respuestas[id] ?? '';
        if (srv !== (bases[id] ?? '') && srv !== valor) conflictos.push({ id, servidor: srv, local: valor });
      }
      if (conflictos.length) return { conflictos };
      Object.assign(exp.respuestas, cambios);
      aplicarMeta(exp, meta);
      exp.ultimoGuardado = ahora();
      if (exp.entregadoEn && Object.keys(cambios).length) {
        exp.editadoDespuesDeEntrega = true;
        exp.ultimaEdicionPosterior = ahora();
      }
      escribir(db);
      return { ok: true, guardadoEn: new Date(exp.ultimoGuardado) };
    },

    async actualizarMeta(uid, meta) {
      return this.guardarCambios(uid, { cambios: {}, bases: {}, meta });
    },

    async entregar(uid, { meta = {} } = {}) {
      await pausa();
      const db = leer();
      const perfil = db.estudiantes[uid];
      if (!perfil || perfil.activo === false) throw error('permission-denied');
      if (db.config.edicionHabilitada === false || perfil.cerrado) throw error('permission-denied');
      const exp = db.expedientes[uid] || (db.expedientes[uid] = nuevoExpediente(uid));
      exp.version = (exp.version || 0) + 1;
      exp.entregadoEn = ahora();
      exp.estado = 'entregada';
      exp.editadoDespuesDeEntrega = false;
      if (typeof meta.progreso === 'number') exp.progreso = meta.progreso;
      exp.ultimoGuardado = exp.entregadoEn;
      (db.versiones[uid] ||= []).push({ numero: exp.version, entregadoEn: exp.entregadoEn, respuestas: clon(exp.respuestas) });
      escribir(db);
      return { entregadoEn: new Date(exp.entregadoEn), version: exp.version };
    },

    /* ---------- Docente ---------- */

    async guardarConfig(parcial) {
      exigirProfesor(); await pausa();
      const db = leer();
      db.config = { ...db.config, ...parcial, escala: { ...db.config.escala, ...(parcial.escala || {}) } };
      escribir(db);
      return clon(db.config);
    },

    async listarEstudiantes() { exigirProfesor(); await pausa(100); return Object.values(leer().estudiantes).map(clon); },
    async listarExpedientes() { exigirProfesor(); await pausa(100); return Object.values(leer().expedientes).map(clon); },
    async cargarExpedienteDe(uid) { exigirProfesor(); const e = leer().expedientes[uid]; return e ? clon(e) : null; },
    async listarVersiones(uid) { exigirProfesor(); return clon(leer().versiones[uid] || []); },

    async actualizarEstudiante(uid, datos) {
      exigirProfesor(); await pausa(100);
      const db = leer();
      if (!db.estudiantes[uid]) throw error('not-found');
      const permitido = ['caso', 'personaje', 'asignacionBloqueada', 'curso', 'cerrado'];
      for (const k of permitido) if (k in datos) db.estudiantes[uid][k] = datos[k];
      escribir(db);
      return clon(db.estudiantes[uid]);
    },

    async crearEstudiantes(lista) {
      exigirProfesor(); await pausa(300);
      const db = leer();
      const resultados = [];
      for (const it of lista) {
        const nombre = capitalizar(it.nombre);
        const apellido = capitalizar(it.apellido);
        if (!nombre || !apellido) { resultados.push({ ...it, estado: 'error', mensaje: 'Falta el nombre o el apellido.' }); continue; }
        const huella = await huellaIdentidad(nombre, apellido, it.codigoCuenta || '');
        if (Object.values(db.estudiantes).some((e) => e.huella === huella)) {
          resultados.push({ ...it, nombre, apellido, estado: 'duplicado', mensaje: 'Ya existe una cuenta con ese nombre y apellido. Usa un código de cuenta para diferenciarlos.' });
          continue;
        }
        const uid = 'local-' + uuidCorto();
        db.estudiantes[uid] = {
          uid, huella, nombre, apellido, nombreMostrar: `${nombre} ${apellido}`, curso: it.curso || db.config.curso,
          caso: it.caso || null, personaje: it.personaje || null, asignacionBloqueada: false, activo: true, cerrado: false,
          codigoCuenta: it.codigoCuenta || '', creadoEn: ahora(),
        };
        resultados.push({ uid, nombre, apellido, curso: db.estudiantes[uid].curso, estado: 'creado', soloPrueba: true });
      }
      escribir(db);
      return resultados;
    },

    async suspenderEstudiante(uid, suspendido) {
      exigirProfesor(); await pausa(150);
      const db = leer();
      if (!db.estudiantes[uid]) throw error('not-found');
      db.estudiantes[uid].activo = !suspendido;
      escribir(db);
    },

    async listarEvaluaciones() { exigirProfesor(); await pausa(100); return Object.entries(leer().evaluaciones).map(([uid, e]) => ({ uid, ...clon(e) })); },
    async cargarEvaluacion(uid) {
      const s = sesionActual();
      const db = leer();
      if (!s?.esProfesor && !(s?.uid === uid && db.config.calificacionesVisibles)) throw error('permission-denied');
      return db.evaluaciones[uid] ? clon(db.evaluaciones[uid]) : null;
    },
    async guardarEvaluacion(uid, datos) {
      exigirProfesor(); await pausa(100);
      const db = leer();
      db.evaluaciones[uid] = { ...datos, actualizadoEn: ahora() };
      escribir(db);
    },

    async exportarTodo() {
      exigirProfesor();
      return clon(leer());
    },

    /* ---------- Solo modo local ---------- */

    async cargarDatosDePrueba() {
      const db = leer();
      for (const p of LISTA_PERSONAJES) {
        const nombre = 'Prueba';
        const apellido = { fiscal: 'Fiscal', defensor: 'Defensor', acusado: 'Acusado', victima: 'Victima', testigo1: 'Testigouno', testigo2: 'Testigodos', perito: 'Perito', juez_presidente: 'Presidente', juez_preguntas: 'Preguntas', juez_decision: 'Decision' }[p.clave];
        const huella = await huellaIdentidad(nombre, apellido, '');
        if (Object.values(db.estudiantes).some((e) => e.huella === huella)) continue;
        const uid = 'local-' + uuidCorto();
        db.estudiantes[uid] = {
          uid, huella, nombre, apellido, nombreMostrar: `${nombre} ${apellido}`, curso: db.config.curso, caso: 1, personaje: p.clave,
          asignacionBloqueada: false, activo: true, cerrado: false, codigoCuenta: '', creadoEn: ahora(),
        };
      }
      // Un estudiante más, sin asignación, para probar ese estado.
      const huella = await huellaIdentidad('Prueba', 'Sinrol', '');
      if (!Object.values(db.estudiantes).some((e) => e.huella === huella)) {
        const uid = 'local-' + uuidCorto();
        db.estudiantes[uid] = { uid, huella, nombre: 'Prueba', apellido: 'Sinrol', nombreMostrar: 'Prueba Sinrol', curso: db.config.curso, caso: null, personaje: null, asignacionBloqueada: false, activo: true, cerrado: false, codigoCuenta: '', creadoEn: ahora() };
      }
      escribir(db);
    },

    /** Solo para la pantalla de ingreso en modo local: qué cuentas de prueba existen (sin contraseñas, que aquí no se verifican). */
    async nombresDePrueba() {
      return Object.values(leer().estudiantes).map((e) => ({ nombre: e.nombre, apellido: e.apellido, personaje: e.personaje, caso: e.caso }));
    },

    async borrarDatosLocales() {
      localStorage.removeItem(CLAVE_DB);
      Object.keys(localStorage).filter((k) => k.startsWith('expjud:pend:')).forEach((k) => localStorage.removeItem(k));
      escribir(dbVacia());
    },

    infoInstitucional: DATOS_INSTITUCIONALES,
  };
}
