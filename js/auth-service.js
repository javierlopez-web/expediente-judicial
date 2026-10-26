/* Autenticación: ingreso de estudiantes y profesor, cierre de sesión y mensajes de error claros. */

import { backend } from './registro.js';

/**
 * Ingreso del estudiante con nombre + primer apellido (+ código de cuenta solo si el profesor lo entregó).
 * Internamente se traduce a una cuenta de Firebase Authentication; el estudiante no usa correo ni contraseña propia.
 */
export function iniciarSesion({ nombre, apellido, codigo = '' }) {
  return backend().iniciarSesionEstudiante({ nombre, apellido, codigo });
}

export function iniciarSesionProfesor({ correo, password, recordar = false }) {
  return backend().iniciarSesionProfesor({ correo, password, recordar });
}

export function cerrarSesion() {
  return backend().cerrarSesion();
}

export function observarSesion(cb) {
  return backend().observarSesion(cb);
}

export function textoErrorAuth(err) {
  const c = String(err?.code || '');
  if (/invalid-credential|wrong-password|user-not-found|invalid-email|invalid-login/.test(c)) {
    return 'No encontramos tu expediente. Revisa que tu nombre y tu primer apellido estén escritos como en la lista del curso (mayúsculas, sin tildes). Si tu profesor te dio un código de cuenta, escríbelo en «Tengo un código de cuenta».';
  }
  if (/user-disabled/.test(c)) return 'Tu acceso está suspendido. Habla con tu profesor.';
  if (/too-many-requests/.test(c)) return 'Se hicieron demasiados intentos. Espera unos minutos e inténtalo de nuevo.';
  if (/network/.test(c)) return 'No hay conexión con el servidor. Revisa tu internet e inténtalo otra vez.';
  if (/missing-password/.test(c)) return 'Escribe tu correo y tu contraseña.';
  if (/no-profesor/.test(c)) return 'Esta cuenta no tiene permisos de profesor.';
  if (/sin-perfil/.test(c)) return 'Tu cuenta existe, pero todavía no tiene un expediente. Avísale al profesor.';
  if (/no-disponible/.test(c)) return err.message;
  return 'No se pudo ingresar. Inténtalo de nuevo.';
}
