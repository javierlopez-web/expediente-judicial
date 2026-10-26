/**
 * CAPA DE SERVICIOS (fachada)
 * ---------------------------------------------------------------
 * La interfaz solo habla con este módulo. Detrás hay dos implementaciones intercambiables:
 *   · js/firebase-service.js  → Firebase real (cuando js/config.js está completo)
 *   · js/local-backend.js     → modo local de prueba (aviso permanente en pantalla)
 *
 * Funciones del encargo: iniciarSesion, cerrarSesion, cargarPerfil, cargarExpediente, guardarRespuesta,
 * guardarProgreso, enviarPreparacion, consultarEstadoGuardado, descargarDocumento, obtenerResumenDocente.
 */

import { firebaseConfigurado } from './config.js';
import { fijarBackend, backend, modoServicios } from './registro.js';
import { crearBackendFirebase } from './firebase-service.js';
import { crearBackendLocal } from './local-backend.js';
import { GestorGuardado } from './guardado.js';
import { calcularProgreso, estadoDe } from './progreso.js';
import { aFecha } from './util.js';

export { iniciarSesion, iniciarSesionProfesor, cerrarSesion, observarSesion, textoErrorAuth } from './auth-service.js';
export { modoServicios };

/** Elige el backend según la configuración y lo inicia. Devuelve 'firebase' o 'local'. */
export async function iniciarServicios() {
  const b = firebaseConfigurado() ? crearBackendFirebase() : crearBackendLocal();
  await b.init();
  fijarBackend(b);
  return b.modo;
}

/* ============================== Estudiante ============================== */

let gestor = null;
let metaActual = {};
let uidActual = null;

/** Solo modo local: cuentas de prueba disponibles (en Firebase devuelve lista vacía). */
export const nombresDePrueba = () => (backend().nombresDePrueba ? backend().nombresDePrueba() : Promise.resolve([]));
export const cargarDatosDePrueba = () => (backend().cargarDatosDePrueba ? backend().cargarDatosDePrueba() : Promise.resolve());

/** El estudiante lee su propia evaluación solo si el profesor activó «mostrar calificaciones» (lo exigen también las reglas). */
export const cargarMiEvaluacion = (uid) => backend().cargarEvaluacion(uid).catch(() => null);

export const cargarConfig = () => backend().cargarConfig();
export const cargarPerfil = (uid) => backend().cargarPerfil(uid);

/**
 * Carga el expediente y deja listo el guardado automático.
 * opciones: { onEstado, onConflicto, metaProvider }
 */
export async function cargarExpediente(uid, opciones = {}) {
  if (gestor) { gestor.destruir(); gestor = null; }
  const exp = await backend().cargarExpediente(uid);
  uidActual = uid;
  metaActual = { etapaActual: exp.etapaActual || 1, etapasVisitadas: exp.etapasVisitadas || [] };
  gestor = new GestorGuardado(backend(), uid, {
    respuestasIniciales: exp.respuestas || {},
    onEstado: opciones.onEstado,
    onConflicto: opciones.onConflicto,
    metaProvider: () => ({ ...metaActual, ...(opciones.metaProvider ? opciones.metaProvider() : {}) }),
  });
  // Si quedaron cambios locales sin enviar de una sesión anterior, se reflejan sobre lo cargado.
  const resp = { ...(exp.respuestas || {}) };
  for (const id of Object.keys(gestor.pendientes)) resp[id] = gestor.pendientes[id].valor;
  return { ...exp, respuestas: resp, hayCambiosRecuperados: gestor.tienePendientes() };
}

/** Registra el valor de un campo (se guarda con debounce; no afirma "guardado" hasta recibir confirmación). */
export function guardarRespuesta(idCampo, valor) {
  if (!gestor) throw new Error('El expediente aún no está cargado.');
  gestor.registrar(idCampo, valor);
}

/** Guarda ahora mismo todo lo pendiente (botón "GUARDAR AVANCE"). */
export function guardarAhora() {
  return gestor ? gestor.forzar() : Promise.resolve(true);
}

/** Guarda el avance de navegación: etapa actual, etapas visitadas, % de progreso y estado. */
export async function guardarProgreso(meta) {
  metaActual = { ...metaActual, ...meta };
  if (!gestor) return;
  if (gestor.tienePendientes()) return gestor.forzar();
  return backend().actualizarMeta(uidActual, metaActual).catch(() => { /* se reintentará con el próximo guardado */ });
}

export const consultarEstadoGuardado = () => (gestor ? gestor.consultarEstado() : { codigo: 'guardado', pendientes: 0 });
export const resolverConflictos = (decisiones) => gestor.resolverConflictos(decisiones);
export const valorLocal = (id) => (gestor ? gestor.valorLocal(id) : undefined);

/** Primero asegura que todo esté guardado en el servidor; solo entonces registra la entrega. */
export async function enviarPreparacion({ progreso } = {}) {
  if (gestor) {
    await gestor.forzar();
    if (gestor.tienePendientes()) {
      throw Object.assign(new Error('No pudimos guardar tus últimos cambios. Revisa tu conexión e inténtalo de nuevo; la entrega no se registró.'), { code: 'app/pendientes' });
    }
  }
  return backend().entregar(uidActual, { meta: { progreso, ...metaActual } });
}

/** Genera y descarga el Word (carga el generador solo cuando hace falta). */
export async function descargarDocumento(opciones) {
  const m = await import('./document-export.js');
  return m.descargarWord(opciones);
}

export function liberarSesion() {
  if (gestor) { gestor.destruir(); gestor = null; }
  uidActual = null;
}

/* ============================== Docente ============================== */

export const docente = {
  guardarConfig: (c) => backend().guardarConfig(c),
  listarEstudiantes: () => backend().listarEstudiantes(),
  listarExpedientes: () => backend().listarExpedientes(),
  cargarExpedienteDe: (uid) => backend().cargarExpedienteDe(uid),
  listarVersiones: (uid) => backend().listarVersiones(uid),
  actualizarEstudiante: (uid, d) => backend().actualizarEstudiante(uid, d),
  crearEstudiantes: (l) => backend().crearEstudiantes(l),
  suspenderEstudiante: (uid, s) => backend().suspenderEstudiante(uid, s),
  listarEvaluaciones: () => backend().listarEvaluaciones(),
  cargarEvaluacion: (uid) => backend().cargarEvaluacion(uid),
  guardarEvaluacion: (uid, d) => backend().guardarEvaluacion(uid, d),
  exportarTodo: () => backend().exportarTodo(),
  cargarDatosDePrueba: () => backend().cargarDatosDePrueba?.(),
  borrarDatosLocales: () => backend().borrarDatosLocales?.(),
};

/**
 * Resumen para el tablero y el seguimiento. El progreso se RECALCULA aquí a partir de las respuestas
 * (no se confía en el número que guarda el estudiante).
 */
export async function obtenerResumenDocente() {
  const [config, estudiantes, expedientes, evaluaciones] = await Promise.all([
    backend().cargarConfig(), backend().listarEstudiantes(), backend().listarExpedientes(), backend().listarEvaluaciones(),
  ]);
  const expPorUid = new Map(expedientes.map((e) => [e.uid, e]));
  const evPorUid = new Map(evaluaciones.map((e) => [e.uid, e]));

  const filas = estudiantes.map((perfil) => {
    const expediente = expPorUid.get(perfil.uid) || null;
    const progreso = calcularProgreso(perfil, expediente);
    const ultimo = aFecha(expediente?.ultimoGuardado);
    return {
      uid: perfil.uid,
      perfil,
      expediente,
      evaluacion: evPorUid.get(perfil.uid) || null,
      progreso,
      estado: estadoDe(expediente),
      ultimoGuardado: ultimo,
      entregadoEn: aFecha(expediente?.entregadoEn),
      conCambiosPosteriores: Boolean(expediente?.editadoDespuesDeEntrega),
    };
  });

  const conActividad = filas.map((f) => f.ultimoGuardado).filter(Boolean).sort((a, b) => b - a);
  const totales = {
    estudiantes: filas.length,
    conCuenta: filas.filter((f) => f.perfil.activo !== false).length,
    conRol: filas.filter((f) => f.perfil.caso && f.perfil.personaje).length,
    sinIniciar: filas.filter((f) => f.estado === 'sin_iniciar').length,
    enDesarrollo: filas.filter((f) => f.estado === 'en_desarrollo').length,
    entregadas: filas.filter((f) => f.estado === 'entregada').length,
    ultimaActividad: conActividad[0] || null,
    porCaso: [1, 2, 3].map((n) => {
      const del = filas.filter((f) => f.perfil.caso === n);
      return { caso: n, total: del.length, entregadas: del.filter((f) => f.estado === 'entregada').length, enDesarrollo: del.filter((f) => f.estado === 'en_desarrollo').length };
    }),
  };
  return { config, filas, totales };
}
