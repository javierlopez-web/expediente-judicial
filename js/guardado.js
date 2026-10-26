/**
 * GESTOR DE GUARDADO AUTOMÁTICO
 * ---------------------------------------------------------------
 * - Agrupa los cambios con "debounce" (no escribe por cada tecla).
 * - Solo declara "guardado" cuando el servicio CONFIRMA la escritura.
 * - Si no hay conexión o falla, los cambios quedan pendientes (también en el
 *   almacenamiento local del navegador, SOLO respuestas; jamás contraseñas) y se reintentan.
 * - Detecta conflictos por campo: si otro dispositivo cambió el mismo campo desde que
 *   lo cargamos, NO lo sobrescribe en silencio; pide decidir.
 *
 * Estados: 'guardado' · 'pendiente' · 'guardando' · 'sin_conexion' · 'conflicto' · 'error'
 */

const PREFIJO = 'expjud:pend:';
const ESPERA_MS = 1200;
const REINTENTOS_MS = [4000, 10000, 20000, 45000];

export class GestorGuardado {
  /**
   * @param {object} backend  servicio con guardarCambios(uid, {cambios, bases, meta})
   * @param {string} uid
   * @param {object} opciones { respuestasIniciales, onEstado(estado), onConflicto(lista), metaProvider():object }
   */
  constructor(backend, uid, opciones = {}) {
    this.backend = backend;
    this.uid = uid;
    this.onEstado = opciones.onEstado || (() => {});
    this.onConflicto = opciones.onConflicto || (() => {});
    this.metaProvider = opciones.metaProvider || (() => ({}));
    this.conocidos = { ...(opciones.respuestasIniciales || {}) }; // últimos valores confirmados por el servidor
    this.pendientes = {}; // id -> { valor, base }
    this.estado = { codigo: 'guardado', mensaje: '', ultimo: null, pendientes: 0 };
    this.enVuelo = false;
    this.timer = null;
    this.reintento = 0;
    this.conflictos = [];
    this._restaurar();
    this._enlazar();
    if (Object.keys(this.pendientes).length) {
      this._poner('pendiente', 'Hay cambios sin guardar de la última sesión');
      this._programar(300);
    }
  }

  /* ---------- API ---------- */

  /** Registra un cambio de un campo. */
  registrar(id, valor) {
    const previo = this.pendientes[id];
    const base = previo ? previo.base : (this.conocidos[id] ?? '');
    if (!previo && valor === (this.conocidos[id] ?? '')) return; // nada cambió realmente
    this.pendientes[id] = { valor, base };
    this._persistir();
    this._poner('pendiente');
    this._programar(ESPERA_MS);
  }

  valorLocal(id) {
    return this.pendientes[id] ? this.pendientes[id].valor : this.conocidos[id];
  }

  tienePendientes() {
    return Object.keys(this.pendientes).length > 0;
  }

  /** Guarda ahora (botón "GUARDAR AVANCE", cambio de etapa, antes de entregar). */
  async forzar() {
    clearTimeout(this.timer);
    this.timer = null;
    return this._volcar();
  }

  consultarEstado() {
    return { ...this.estado, pendientes: Object.keys(this.pendientes).length };
  }

  /** Resuelve conflictos: decisiones = { id: 'mia' | 'nube' }. Devuelve los valores finales de los campos afectados. */
  async resolverConflictos(decisiones) {
    const aplicados = {};
    for (const c of this.conflictos) {
      const d = decisiones[c.id] || 'nube';
      if (d === 'mia') {
        // Aceptamos el valor del servidor como "base" y volvemos a intentar con el texto propio.
        this.pendientes[c.id] = { valor: c.local, base: c.servidor };
        this.conocidos[c.id] = c.servidor;
        aplicados[c.id] = c.local;
      } else {
        delete this.pendientes[c.id];
        this.conocidos[c.id] = c.servidor;
        aplicados[c.id] = c.servidor;
      }
    }
    this.conflictos = [];
    this._persistir();
    this._poner(this.tienePendientes() ? 'pendiente' : 'guardado');
    if (this.tienePendientes()) await this.forzar();
    return aplicados;
  }

  destruir() {
    clearTimeout(this.timer);
    window.removeEventListener('online', this._alVolver);
    window.removeEventListener('offline', this._alPerder);
    window.removeEventListener('beforeunload', this._alSalir);
    document.removeEventListener('visibilitychange', this._alOcultar);
  }

  /* ---------- Internos ---------- */

  _poner(codigo, mensaje = '', extra = {}) {
    this.estado = { ...this.estado, codigo, mensaje, pendientes: Object.keys(this.pendientes).length, ...extra };
    this.onEstado(this.consultarEstado());
  }

  _programar(ms) {
    clearTimeout(this.timer);
    this.timer = setTimeout(() => { this.timer = null; this._volcar(); }, ms);
  }

  async _volcar() {
    if (this.enVuelo) { this._reintentarLuego = true; return false; }
    const ids = Object.keys(this.pendientes);
    if (!ids.length) {
      if (this.estado.codigo !== 'conflicto' && this.estado.codigo !== 'guardado') this._poner('guardado');
      return true;
    }
    if (this.conflictos.length) return false;
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      this._poner('sin_conexion', 'Sin conexión: cambios pendientes');
      return false;
    }
    this.enVuelo = true;
    this._poner('guardando');
    const enviados = {};
    const bases = {};
    ids.forEach((id) => { enviados[id] = this.pendientes[id].valor; bases[id] = this.pendientes[id].base; });
    try {
      const res = await this.backend.guardarCambios(this.uid, { cambios: enviados, bases, meta: this.metaProvider() });
      if (res && res.conflictos && res.conflictos.length) {
        this.conflictos = res.conflictos;
        this._poner('conflicto', 'Hay cambios hechos desde otro dispositivo');
        this.onConflicto(res.conflictos);
        return false;
      }
      for (const id of ids) {
        this.conocidos[id] = enviados[id];
        if (this.pendientes[id] && this.pendientes[id].valor === enviados[id]) delete this.pendientes[id];
        else if (this.pendientes[id]) this.pendientes[id].base = enviados[id]; // se siguió escribiendo durante el envío
      }
      this._persistir();
      this.reintento = 0;
      const quedan = this.tienePendientes();
      this._poner(quedan ? 'pendiente' : 'guardado', '', { ultimo: res?.guardadoEn || new Date() });
      if (quedan) this._programar(ESPERA_MS);
      return true;
    } catch (err) {
      const cod = String(err?.code || '');
      const sinRed = /unavailable|network|offline|deadline|failed-precondition/i.test(cod + ' ' + (err?.message || '')) ||
        (typeof navigator !== 'undefined' && navigator.onLine === false);
      if (sinRed) {
        this._poner('sin_conexion', 'Sin conexión: cambios pendientes');
        this._reintentarConEspera();
      } else {
        this._poner('error', mensajeError(err));
        this._reintentarConEspera();
      }
      return false;
    } finally {
      this.enVuelo = false;
      if (this._reintentarLuego) { this._reintentarLuego = false; this._programar(500); }
    }
  }

  _reintentarConEspera() {
    const ms = REINTENTOS_MS[Math.min(this.reintento, REINTENTOS_MS.length - 1)];
    this.reintento++;
    this._programar(ms);
  }

  _clave() { return PREFIJO + this.uid; }

  _persistir() {
    try {
      if (this.tienePendientes()) localStorage.setItem(this._clave(), JSON.stringify(this.pendientes));
      else localStorage.removeItem(this._clave());
    } catch { /* almacenamiento lleno o bloqueado: seguimos solo en memoria */ }
  }

  _restaurar() {
    try {
      const raw = localStorage.getItem(this._clave());
      if (!raw) return;
      const datos = JSON.parse(raw);
      for (const [id, p] of Object.entries(datos)) {
        if (p && typeof p.valor === 'string') {
          this.pendientes[id] = p;
          // Si el valor ya coincide con el servidor, no hay nada que volver a enviar.
          if (p.valor === (this.conocidos[id] ?? '')) delete this.pendientes[id];
        }
      }
    } catch { /* ignorar datos corruptos */ }
  }

  _enlazar() {
    this._alVolver = () => { if (this.tienePendientes()) { this._poner('pendiente'); this._programar(300); } };
    this._alPerder = () => { if (this.tienePendientes()) this._poner('sin_conexion', 'Sin conexión: cambios pendientes'); };
    this._alSalir = (e) => {
      if (this.tienePendientes()) { e.preventDefault(); e.returnValue = ''; }
    };
    this._alOcultar = () => { if (document.visibilityState === 'hidden' && this.tienePendientes()) this.forzar(); };
    window.addEventListener('online', this._alVolver);
    window.addEventListener('offline', this._alPerder);
    window.addEventListener('beforeunload', this._alSalir);
    document.addEventListener('visibilitychange', this._alOcultar);
  }
}

export function mensajeError(err) {
  const cod = String(err?.code || '');
  if (/permission-denied/.test(cod)) return 'Error al guardar: no tienes permiso para editar ahora (la edición puede estar cerrada).';
  if (/unauthenticated/.test(cod)) return 'Error al guardar: tu sesión se cerró. Vuelve a ingresar; tus cambios siguen en este dispositivo.';
  return 'Error al guardar. Tus cambios siguen en este dispositivo y se reintentará.';
}

export const TEXTO_ESTADO = {
  guardado: 'Guardado correctamente',
  pendiente: 'Cambios sin guardar…',
  guardando: 'Guardando...',
  sin_conexion: 'Sin conexión: cambios pendientes',
  conflicto: 'Conflicto: elige qué versión conservar',
  error: 'Error al guardar',
};
