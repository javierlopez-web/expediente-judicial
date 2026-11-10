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
import { avance, entregaVigente } from './contenido.js';
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
  cargarExpedienteDe: (uid) => backend().cargarExpedienteDe(uid),
  actualizarEstudiante: (uid, d) => backend().actualizarEstudiante(uid, d),
  crearEstudiantes: (l) => backend().crearEstudiantes(l),
  cambiarCodigo: (uid, c) => backend().cambiarCodigo(uid, c),
  eliminarEstudiante: (uid) => backend().eliminarEstudiante(uid),
  /** Corregir nombre o apellido = crear la cuenta nueva (mismo código y asignación) y eliminar la anterior. */
  async corregirNombre(perfil, { nombre, apellido }) {
    const [r] = await backend().crearEstudiantes([{ nombre, apellido, codigo: perfil.codigo, caso: perfil.caso, personaje: perfil.personaje, curso: perfil.curso }]);
    if (!r || r.estado === 'error') throw Object.assign(new Error(r?.mensaje || 'No se pudo crear la cuenta nueva.'), { code: 'app/crear' });
    await backend().eliminarEstudiante(perfil.uid);
    return r;
  },
  cargarDatosDePrueba: () => backend().cargarDatosDePrueba?.(),
  borrarDatosLocales: () => backend().borrarDatosLocales?.(),
};

export function estadoDe(exp, av) {
  // Solo cuenta como entregada si se entregó el trabajo escrito (desde el 9-11-2026); lo anterior queda guardado.
  if (entregaVigente(exp)) return 'entregada';
  if (!av || av.hechosP + av.hechosD === 0) return 'sin_iniciar';
  return 'en_desarrollo';
}

/** Resumen para el panel. El avance se recalcula a partir de las respuestas. */
export async function obtenerResumenDocente() {
  const [config, estudiantes, expedientes] = await Promise.all([
    backend().cargarConfig(), backend().listarEstudiantes(), backend().listarExpedientes(),
  ]);
  const expPorUid = new Map(expedientes.map((e) => [e.uid, e]));
  const filas = estudiantes.map((perfil) => {
    const expediente = expPorUid.get(perfil.uid) || null;
    const av = perfil.personaje ? avance(perfil.personaje, expediente?.respuestas || {}) : null;
    return {
      uid: perfil.uid, perfil, expediente, avance: av,
      estado: estadoDe(expediente, av),
      ultimoGuardado: aFecha(expediente?.ultimoGuardado),
      entregadoEn: aFecha(expediente?.entregadoEn),
      conCambiosPosteriores: entregaVigente(expediente) && Boolean(expediente?.editadoDespuesDeEntrega),
    };
  }).sort((a, b) => `${a.perfil.apellido} ${a.perfil.nombre}`.localeCompare(`${b.perfil.apellido} ${b.perfil.nombre}`, 'es'));
  return { config, filas };
}
