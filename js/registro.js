/* Registro del backend activo (Firebase o local). Evita dependencias circulares entre módulos de servicio. */

let _backend = null;

export function fijarBackend(b) { _backend = b; }

export function backend() {
  if (!_backend) throw new Error('Los servicios aún no se han iniciado (llama a iniciarServicios()).');
  return _backend;
}

export const modoServicios = () => (_backend ? _backend.modo : null);
