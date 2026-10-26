/**
 * CONFIGURACIÓN DEL PROYECTO
 * ---------------------------------------------------------------
 * 1) Pega aquí la configuración web de tu proyecto Firebase
 *    (Consola Firebase → Configuración del proyecto → Tus apps → App web).
 *    Esos valores NO son secretos: identifican el proyecto, la seguridad la dan
 *    las reglas de Firestore (firestore.rules) y Firebase Authentication.
 * 2) Mientras `apiKey` y `projectId` estén vacíos, la aplicación se abre en
 *    MODO LOCAL DE PRUEBA: nada se guarda en Firebase, se usa el almacenamiento
 *    del navegador y se muestra un aviso permanente. Sirve para probar la interfaz.
 *
 * NUNCA pongas aquí claves de administrador, cuentas de servicio ni contraseñas.
 */
export const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyBZlENZYDqTRz3QTKpzbiZGgbrcuJ0n9Wo',
  authDomain: 'expediente-judicial-luf.firebaseapp.com',
  projectId: 'expediente-judicial-luf',
  storageBucket: 'expediente-judicial-luf.firebasestorage.app',
  messagingSenderId: '886606045190',
  appId: '1:886606045190:web:aefbd31c3f7acb8f522387',
};

/**
 * Dominio técnico para los identificadores internos de Firebase Authentication.
 * El estudiante nunca lo ve. Si lo cambias, las cuentas ya creadas dejan de coincidir.
 */
export const DOMINIO_AUTENTICACION = 'expedientes.liceoluf.com';

export const DATOS_INSTITUCIONALES = {
  establecimiento: 'Liceo Luis Urbina Flores',
  departamento: 'Departamento de Historia',
  profesor: 'Javier López',
  correoProfesor: 'javier.lopez@liceoluf.com',
  asignatura: 'Educación Ciudadana',
  unidad: 'Justicia y derechos humanos',
};

/** Valores iniciales de la configuración; el profesor los puede cambiar en el panel (se guardan en Firestore: config/proyecto). */
export const AJUSTES_PREDETERMINADOS = {
  nombreProyecto: 'Mi expediente judicial',
  curso: '3° medio',
  fechaLimite: '',
  edicionHabilitada: true,
  mensajeGeneral: '',
  reglasEntrega:
    'Puedes seguir corrigiendo tu preparación después de entregarla, mientras el profesor no active el cierre. ' +
    'Si editas después de entregar, quedará registrado que existe una versión posterior.',
  calificacionesVisibles: false,
  sonidosPermitidos: true,
  sonidoVolumen: 0.5,
  asignacionesBloqueadas: false,
  escala: {
    puntajeMax: 100,
    exigencia: 60,
    notaMin: 1.0,
    notaAprobacion: 4.0,
    notaMax: 7.0,
  },
};

export function firebaseConfigurado() {
  const c = FIREBASE_CONFIG;
  return Boolean(c.apiKey && c.projectId && c.appId);
}
