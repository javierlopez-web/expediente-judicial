/**
 * SERVICIO FIREBASE (Authentication + Cloud Firestore) · plan GRATUITO (Spark), sin Cloud Functions.
 * ---------------------------------------------------------------
 * Implementa el mismo contrato que js/local-backend.js.
 *  · Ingreso del estudiante (v3): NOMBRE + APELLIDO + CÓDIGO de 4 dígitos que entrega el profesor.
 *    Internamente: identificador técnico <huella(nombre, apellido, variante)>@dominio y contraseña
 *    claveConCodigo(nombre, apellido, código). `variante` ('' o '2', '3') solo distingue homónimos.
 *  · El profesor crea, cambia el código y elimina cuentas desde el panel usando una SEGUNDA instancia de
 *    Firebase (inicia sesión como el estudiante, con datos que el profesor conoce, y cambia la contraseña).
 *  · Cuentas antiguas (sin código): su contraseña era claveDeIngreso(nombre, apellido, codigoCuenta).
 *    «Asignar código» las convierte al nuevo sistema sin perder lo escrito.
 *  · «Profesor» = existe el documento profesores/<uid> (se crea a mano en la consola).
 * Los permisos reales los imponen firestore.rules.
 */

import { FIREBASE_CONFIG, DOMINIO_AUTENTICACION, AJUSTES_PREDETERMINADOS } from './config.js';
import { huellaIdentidad, claveDeIngreso, claveConCodigo, capitalizar, clon, soloDigitos } from './util.js';

const VARIANTES = ['', '2', '3'];
const errorApp = (code, message) => Object.assign(new Error(message || code), { code });

export function crearBackendFirebase() {
  let fb, app, auth, db, authCreador;

  const esProf = async (uid) => {
    try { return (await fb.getDoc(fb.doc(db, 'profesores', uid))).exists(); } catch { return false; }
  };
  const correoDe = async (nombre, apellido, variante = '') => `${await huellaIdentidad(nombre, apellido, variante)}@${DOMINIO_AUTENTICACION}`;
  /** Contraseña vigente de una cuenta según su perfil (con código = v3; sin código = cuenta antigua). */
  const claveActual = (p) => (p.codigo ? claveConCodigo(p.nombre, p.apellido, p.codigo) : claveDeIngreso(p.nombre, p.apellido, p.codigoCuenta || ''));
  /** Inicia sesión como el estudiante en la instancia secundaria (prueba la clave vigente y, por si quedó a medias, la alternativa). */
  const entrarComo = async (p, alternativa) => {
    const sec = await authSecundaria();
    const correo = await correoDe(p.nombre, p.apellido, p.codigoCuenta || '');
    const claves = [claveActual(p), alternativa].filter(Boolean);
    let ultimo;
    for (const c of claves) {
      try { await fb.signInWithEmailAndPassword(sec, correo, c); return sec; } catch (e) { ultimo = e; }
    }
    throw ultimo;
  };

  /** Segunda instancia de Firebase, solo para crear cuentas sin cerrar la sesión del profesor. */
  const authSecundaria = async () => {
    if (!authCreador) {
      const apCreador = fb.initializeApp(FIREBASE_CONFIG, 'creador-de-cuentas');
      authCreador = fb.getAuth(apCreador);
      await fb.setPersistence(authCreador, fb.inMemoryPersistence);
    }
    return authCreador;
  };

  const docAObjeto = (d) => ({ uid: d.id, ...d.data() });

  return {
    modo: 'firebase',

    async init() {
      fb = globalThis.__FIREBASE_FALSO || await import('../vendor/firebase.bundle.js'); // el primero solo lo usan las pruebas (tests/firebase-falso.test.mjs)
      app = fb.initializeApp(FIREBASE_CONFIG);
      auth = fb.getAuth(app);
      db = fb.getFirestore(app);
    },

    /* ---------- Sesión ---------- */

    observarSesion(cb) {
      return fb.onAuthStateChanged(auth, async (usuario) => {
        if (!usuario) return cb(null);
        cb({ uid: usuario.uid, esProfesor: await esProf(usuario.uid), correo: usuario.email || '' });
      });
    },

    async iniciarSesionEstudiante({ nombre, apellido, codigo }) {
      const cod = soloDigitos(codigo);
      if (cod.length !== 4) throw errorApp('app/codigo');
      await fb.setPersistence(auth, fb.browserSessionPersistence); // se cierra al cerrar la pestaña (equipos compartidos)
      let cred = null, ultimo = null;
      for (const v of VARIANTES) {
        try { cred = await fb.signInWithEmailAndPassword(auth, await correoDe(nombre, apellido, v), claveConCodigo(nombre, apellido, cod)); break; }
        catch (e) { ultimo = e; if (!/invalid-credential|wrong-password|user-not-found|invalid-email|invalid-login/.test(e.code || '')) throw e; }
      }
      if (!cred) throw ultimo;
      const perfil = await fb.getDoc(fb.doc(db, 'estudiantes', cred.user.uid)).then((d) => (d.exists() ? d.data() : null)).catch(() => null);
      if (!perfil) { await fb.signOut(auth); throw errorApp('app/sin-perfil'); }
      if (perfil.activo === false) { await fb.signOut(auth); throw errorApp('auth/user-disabled'); }
      return { uid: cred.user.uid };
    },

    async iniciarSesionProfesor({ correo, password, recordar }) {
      if (!correo || !password) throw errorApp('auth/missing-password');
      await fb.setPersistence(auth, recordar ? fb.browserLocalPersistence : fb.browserSessionPersistence);
      const cred = await fb.signInWithEmailAndPassword(auth, correo.trim(), password);
      if (!(await esProf(cred.user.uid))) {
        await fb.signOut(auth);
        throw errorApp('app/no-profesor');
      }
      return { uid: cred.user.uid };
    },

    async cerrarSesion() { await fb.signOut(auth); },

    /* ---------- Lectura del estudiante ---------- */

    async cargarConfig() {
      try {
        const s = await fb.getDoc(fb.doc(db, 'config', 'proyecto'));
        const c = s.exists() ? s.data() : {};
        return { ...clon(AJUSTES_PREDETERMINADOS), ...c, escala: { ...AJUSTES_PREDETERMINADOS.escala, ...(c.escala || {}) } };
      } catch (e) {
        if (/permission-denied/.test(e.code || '')) return clon(AJUSTES_PREDETERMINADOS);
        throw e;
      }
    },

    async cargarPerfil(uid) {
      const s = await fb.getDoc(fb.doc(db, 'estudiantes', uid));
      return s.exists() ? docAObjeto(s) : null;
    },

    async cargarExpediente(uid) {
      const ref = fb.doc(db, 'expedientes', uid);
      const s = await fb.getDoc(ref);
      if (s.exists()) return docAObjeto(s);
      const base = {
        uid, respuestas: {}, estado: 'sin_iniciar', progreso: 0, etapaActual: 1, etapasVisitadas: [],
        entregadoEn: null, editadoDespuesDeEntrega: false, version: 0,
      };
      try {
        await fb.setDoc(ref, { ...base, creadoEn: fb.serverTimestamp(), ultimoGuardado: null });
      } catch (e) {
        if (!/permission-denied/.test(e.code || '')) throw e; // p. ej. edición cerrada: se muestra vacío, sin crear
      }
      return { ...base, ultimoGuardado: null };
    },

    /* ---------- Escritura del estudiante ---------- */

    /**
     * Guarda campos con detección de conflictos. Todo o nada: si algún campo cambió en el servidor
     * desde que se cargó (bases) y es distinto del valor local, no escribe nada y devuelve los conflictos.
     * La promesa se resuelve SOLO cuando el servidor confirmó la transacción.
     */
    async guardarCambios(uid, { cambios = {}, bases = {}, meta = {} }) {
      const ref = fb.doc(db, 'expedientes', uid);
      const resultado = await fb.runTransaction(db, async (tx) => {
        const snap = await tx.get(ref);
        const actual = snap.exists() ? (snap.data().respuestas || {}) : {};
        const conflictos = [];
        for (const [id, valor] of Object.entries(cambios)) {
          const srv = actual[id] ?? '';
          if (srv !== (bases[id] ?? '') && srv !== valor) conflictos.push({ id, servidor: srv, local: valor });
        }
        if (conflictos.length) return { conflictos };

        const extra = {};
        if (meta.etapaActual) extra.etapaActual = meta.etapaActual;
        if (Array.isArray(meta.etapasVisitadas)) extra.etapasVisitadas = meta.etapasVisitadas;
        if (typeof meta.progreso === 'number') extra.progreso = meta.progreso;
        const entregada = snap.exists() && snap.data().entregadoEn;
        if (!entregada && meta.estado) extra.estado = meta.estado;
        if (entregada && Object.keys(cambios).length) {
          extra.editadoDespuesDeEntrega = true;
          extra.ultimaEdicionPosterior = fb.serverTimestamp();
        }

        if (snap.exists()) {
          const upd = { ...extra, ultimoGuardado: fb.serverTimestamp() };
          for (const [id, valor] of Object.entries(cambios)) upd[`respuestas.${id}`] = valor;
          tx.update(ref, upd);
        } else {
          tx.set(ref, {
            uid, respuestas: { ...cambios }, estado: 'en_desarrollo', progreso: 0, etapaActual: 1, etapasVisitadas: [],
            entregadoEn: null, editadoDespuesDeEntrega: false, version: 0,
            ...extra, creadoEn: fb.serverTimestamp(), ultimoGuardado: fb.serverTimestamp(),
          });
        }
        return { ok: true };
      });
      return resultado.conflictos ? resultado : { ok: true, guardadoEn: new Date() };
    },

    async actualizarMeta(uid, meta) {
      return this.guardarCambios(uid, { cambios: {}, bases: {}, meta });
    },

    /** Registra la entrega y conserva una copia inmutable de lo entregado (subcolección versiones). */
    async entregar(uid, { meta = {} } = {}) {
      const ref = fb.doc(db, 'expedientes', uid);
      const version = await fb.runTransaction(db, async (tx) => {
        const snap = await tx.get(ref);
        if (!snap.exists()) throw errorApp('not-found', 'No hay nada que entregar todavía.');
        const d = snap.data();
        const numero = (d.version || 0) + 1;
        const verRef = fb.doc(db, 'expedientes', uid, 'versiones', String(numero).padStart(3, '0'));
        tx.set(verRef, { uid, numero, respuestas: d.respuestas || {}, entregadoEn: fb.serverTimestamp() });
        tx.update(ref, {
          entregadoEn: fb.serverTimestamp(), estado: 'entregada', version: numero, editadoDespuesDeEntrega: false,
          ultimoGuardado: fb.serverTimestamp(), ...(typeof meta.progreso === 'number' ? { progreso: meta.progreso } : {}),
        });
        return numero;
      });
      const s = await fb.getDoc(ref);
      return { entregadoEn: s.data().entregadoEn?.toDate?.() || new Date(), version };
    },

    /* ---------- Docente (lectura/escritura permitida solo por reglas a quien tiene el permiso) ---------- */

    async guardarConfig(parcial) {
      await fb.setDoc(fb.doc(db, 'config', 'proyecto'), { ...parcial, actualizadoEn: fb.serverTimestamp() }, { merge: true });
      return this.cargarConfig();
    },

    async listarEstudiantes() { return (await fb.getDocs(fb.collection(db, 'estudiantes'))).docs.map(docAObjeto); },
    async listarExpedientes() { return (await fb.getDocs(fb.collection(db, 'expedientes'))).docs.map(docAObjeto); },

    async cargarExpedienteDe(uid) {
      const s = await fb.getDoc(fb.doc(db, 'expedientes', uid));
      return s.exists() ? docAObjeto(s) : null;
    },

    async listarVersiones(uid) {
      const q = fb.query(fb.collection(db, 'expedientes', uid, 'versiones'), fb.orderBy('numero'));
      return (await fb.getDocs(q)).docs.map((d) => d.data());
    },

    async actualizarEstudiante(uid, datos) {
      const permitido = ['caso', 'personaje', 'asignacionBloqueada', 'curso', 'cerrado', 'activo'];
      const upd = { actualizadoEn: fb.serverTimestamp() };
      for (const k of permitido) if (k in datos) upd[k] = datos[k];
      await fb.updateDoc(fb.doc(db, 'estudiantes', uid), upd);
      return this.cargarPerfil(uid);
    },

    /**
     * Crea cuentas: { nombre, apellido, codigo (4 dígitos), caso, personaje, curso }.
     * Si ya existe una cuenta con ese nombre y apellido, se usa la variante siguiente (homónimos).
     * Si la cuenta existía sin perfil (algo falló a medias) y la clave coincide, se recupera.
     */
    async crearEstudiantes(lista) {
      const sec = await authSecundaria();
      const resultados = [];
      for (const it of lista) {
        const nombre = capitalizar(String(it.nombre ?? '').trim().slice(0, 80));
        const apellido = capitalizar(String(it.apellido ?? '').trim().slice(0, 80));
        const codigo = soloDigitos(it.codigo);
        const curso = String(it.curso ?? '').trim().slice(0, 40);
        const base = { nombre, apellido, codigo };
        if (!nombre || !apellido) { resultados.push({ ...base, estado: 'error', mensaje: 'Falta el nombre o el apellido.' }); continue; }
        if (codigo.length !== 4) { resultados.push({ ...base, estado: 'error', mensaje: 'El código debe tener 4 dígitos.' }); continue; }
        const clave = claveConCodigo(nombre, apellido, codigo);
        let uid = null, variante = '', estado = 'creado', mensaje = '';
        for (const v of VARIANTES) {
          const correo = await correoDe(nombre, apellido, v);
          try {
            uid = (await fb.createUserWithEmailAndPassword(sec, correo, clave)).user.uid; variante = v; break;
          } catch (e) {
            if (!/email-already-in-use/.test(e.code || '')) {
              console.error('crearEstudiantes', e.code, e.message);
              mensaje = /operation-not-allowed/.test(e.code || '') ? 'En Firebase falta activar el ingreso con correo y contraseña.'
                : /too-many-requests/.test(e.code || '') ? 'Firebase pidió esperar unos minutos. Vuelve a intentarlo luego.' : 'No se pudo crear la cuenta.';
              break;
            }
            // ¿Es una cuenta huérfana (sin perfil) con esta misma clave? Entonces se recupera.
            try {
              const u = (await fb.signInWithEmailAndPassword(sec, correo, clave)).user.uid;
              const ya = await fb.getDoc(fb.doc(db, 'estudiantes', u));
              if (!ya.exists()) { uid = u; variante = v; estado = 'recuperada'; break; }
              mensaje = 'Ya existe un estudiante con ese nombre, apellido y código. Usa otro código.';
              break;
            } catch { /* clave distinta: es otra persona (homónimo) → probar la variante siguiente */ }
          } finally {
            try { await fb.signOut(sec); } catch { /* sin sesión */ }
          }
        }
        if (!uid) { resultados.push({ ...base, estado: 'error', mensaje: mensaje || 'Ya existen tres cuentas con ese nombre y apellido.' }); continue; }
        try {
          await fb.setDoc(fb.doc(db, 'estudiantes', uid), {
            uid, nombre, apellido, nombreMostrar: `${nombre} ${apellido}`, curso,
            caso: [1, 2, 3].includes(Number(it.caso)) ? Number(it.caso) : null,
            personaje: it.personaje || null,
            asignacionBloqueada: false, activo: true, cerrado: false, codigoCuenta: variante, codigo, creadoEn: fb.serverTimestamp(),
          });
          resultados.push({ uid, ...base, estado, homonimo: Boolean(variante) });
        } catch (e) {
          console.error('perfil', e.code, e.message);
          resultados.push({ ...base, estado: 'error', mensaje: 'La cuenta se creó, pero no se pudo guardar su perfil (¿publicaste las reglas nuevas?). Vuelve a intentarlo: se recuperará.' });
        }
      }
      return resultados;
    },

    /**
     * Cambia (o asigna por primera vez) el código de 4 dígitos de un estudiante.
     * Entra como el estudiante en la instancia secundaria y cambia su contraseña técnica.
     */
    async cambiarCodigo(uid, nuevo) {
      const codigo = soloDigitos(nuevo);
      if (codigo.length !== 4) throw errorApp('app/codigo', 'El código debe tener 4 dígitos.');
      const p = await this.cargarPerfil(uid);
      if (!p) throw errorApp('not-found', 'No existe ese estudiante.');
      const nueva = claveConCodigo(p.nombre, p.apellido, codigo);
      const sec = await entrarComo(p, nueva);
      try { await fb.updatePassword(sec.currentUser, nueva); } finally { try { await fb.signOut(sec); } catch { /* */ } }
      await fb.updateDoc(fb.doc(db, 'estudiantes', uid), { codigo, actualizadoEn: fb.serverTimestamp() });
      return this.cargarPerfil(uid);
    },

    /** Elimina la cuenta (Authentication) y el perfil. Lo escrito queda guardado en Firestore, sin dueño. */
    async eliminarEstudiante(uid) {
      const p = await this.cargarPerfil(uid);
      if (!p) return;
      try {
        const sec = await entrarComo(p);
        try { await fb.deleteUser(sec.currentUser); } finally { try { await fb.signOut(sec); } catch { /* */ } }
      } catch (e) { console.warn('No se pudo borrar la cuenta de acceso; se borra el perfil igual.', e.code); }
      await fb.deleteDoc(fb.doc(db, 'estudiantes', uid));
    },

    async suspenderEstudiante(uid, suspendido) {
      await fb.updateDoc(fb.doc(db, 'estudiantes', uid), { activo: !suspendido, actualizadoEn: fb.serverTimestamp() });
    },

    async listarEvaluaciones() { return (await fb.getDocs(fb.collection(db, 'evaluaciones'))).docs.map(docAObjeto); },
    async cargarEvaluacion(uid) {
      const s = await fb.getDoc(fb.doc(db, 'evaluaciones', uid));
      return s.exists() ? s.data() : null;
    },
    async guardarEvaluacion(uid, datos) {
      await fb.setDoc(fb.doc(db, 'evaluaciones', uid), { ...datos, actualizadoEn: fb.serverTimestamp() });
    },

    async exportarTodo() {
      const [config, estudiantes, expedientes, evaluaciones] = await Promise.all([
        this.cargarConfig(), this.listarEstudiantes(), this.listarExpedientes(), this.listarEvaluaciones(),
      ]);
      const versiones = {};
      for (const e of expedientes) {
        const v = await this.listarVersiones(e.uid).catch(() => []);
        if (v.length) versiones[e.uid] = v;
      }
      return { config, estudiantes, expedientes, evaluaciones, versiones };
    },
  };
}
