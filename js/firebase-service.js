/**
 * SERVICIO FIREBASE (Authentication + Cloud Firestore) · funciona con el plan GRATUITO (Spark), sin Cloud Functions.
 * ---------------------------------------------------------------
 * Implementa el mismo contrato que js/local-backend.js.
 *  · Los estudiantes ingresan con nombre + primer apellido: la contraseña de su cuenta se deriva de esos mismos datos
 *    (ver claveDeIngreso en util.js). No hay claves que repartir ni restablecer.
 *  · El profesor crea las cuentas desde el panel, usando una segunda instancia de Firebase para no perder su propia sesión.
 *  · «Profesor» = existe el documento profesores/<uid> (se crea a mano en la consola de Firebase; ninguna página puede crearlo).
 *
 * Los permisos reales los imponen firestore.rules; ocultar botones no basta.
 *
 * ESTADO: escrito siguiendo la documentación del SDK modular, pero NO probado contra un proyecto
 * Firebase real (no hay acceso a uno desde donde se construyó). Ver PENDIENTES.md.
 */

import { FIREBASE_CONFIG, DOMINIO_AUTENTICACION, AJUSTES_PREDETERMINADOS } from './config.js';
import { huellaIdentidad, claveDeIngreso, capitalizar, clon } from './util.js';

const errorApp = (code, message) => Object.assign(new Error(message || code), { code });

export function crearBackendFirebase() {
  let fb, app, auth, db, authCreador;

  const esProf = async (uid) => {
    try { return (await fb.getDoc(fb.doc(db, 'profesores', uid))).exists(); } catch { return false; }
  };
  const correoDe = async (nombre, apellido, codigo) => `${await huellaIdentidad(nombre, apellido, codigo)}@${DOMINIO_AUTENTICACION}`;

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
      await fb.setPersistence(auth, fb.browserSessionPersistence); // se cierra al cerrar la pestaña (equipos compartidos)
      const cred = await fb.signInWithEmailAndPassword(auth, await correoDe(nombre, apellido, codigo), claveDeIngreso(nombre, apellido, codigo));
      // La cuenta debe tener su perfil de estudiante y no estar suspendida.
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
      const permitido = ['caso', 'personaje', 'asignacionBloqueada', 'curso', 'cerrado'];
      const upd = { actualizadoEn: fb.serverTimestamp() };
      for (const k of permitido) if (k in datos) upd[k] = datos[k];
      await fb.updateDoc(fb.doc(db, 'estudiantes', uid), upd);
      return this.cargarPerfil(uid);
    },

    /**
     * Crea la cuenta (Authentication, con la segunda instancia) y el perfil (Firestore, con la sesión del profesor).
     * Si la cuenta ya existía pero sin perfil (p. ej. falló a medias), se recupera en lugar de dar error.
     */
    async crearEstudiantes(lista) {
      const sec = await authSecundaria();
      const resultados = [];
      for (const it of lista) {
        const nombre = capitalizar(String(it.nombre ?? '').trim().slice(0, 80));
        const apellido = capitalizar(String(it.apellido ?? '').trim().slice(0, 80));
        const codigoCuenta = String(it.codigoCuenta ?? '').trim().slice(0, 20);
        const curso = String(it.curso ?? '').trim().slice(0, 40);
        const base = { nombre, apellido, curso };
        if (!nombre || !apellido) { resultados.push({ ...base, estado: 'error', mensaje: 'Falta el nombre o el apellido.' }); continue; }
        const correo = await correoDe(nombre, apellido, codigoCuenta);
        const clave = claveDeIngreso(nombre, apellido, codigoCuenta);
        let uid = null, estado = 'creado';
        try {
          try {
            uid = (await fb.createUserWithEmailAndPassword(sec, correo, clave)).user.uid;
          } catch (e) {
            if (!/email-already-in-use/.test(e.code || '')) throw e;
            uid = (await fb.signInWithEmailAndPassword(sec, correo, clave)).user.uid;
            const ya = await fb.getDoc(fb.doc(db, 'estudiantes', uid));
            if (ya.exists()) {
              resultados.push({ uid, ...base, estado: 'duplicado', mensaje: 'Ya existe una cuenta con ese nombre y apellido. Usa un código de cuenta para diferenciarlos.' });
              uid = null;
            } else estado = 'recuperada';
          }
        } catch (e) {
          console.error('crearEstudiantes', e.code, e.message);
          const msg = /operation-not-allowed/.test(e.code || '') ? 'En Firebase falta activar el ingreso con correo y contraseña.'
            : /too-many-requests/.test(e.code || '') ? 'Firebase pidió esperar unos minutos antes de crear más cuentas. Vuelve a intentarlo luego.'
            : /weak-password/.test(e.code || '') ? 'El nombre y el apellido son demasiado cortos para crear la cuenta.' : 'No se pudo crear la cuenta.';
          resultados.push({ ...base, estado: 'error', mensaje: msg });
          uid = null;
        } finally {
          try { await fb.signOut(sec); } catch { /* sin sesión que cerrar */ }
        }
        if (!uid) continue;
        try {
          await fb.setDoc(fb.doc(db, 'estudiantes', uid), {
            uid, nombre, apellido, nombreMostrar: `${nombre} ${apellido}`, curso,
            caso: [1, 2, 3].includes(Number(it.caso)) ? Number(it.caso) : null,
            personaje: it.personaje || null,
            asignacionBloqueada: false, activo: true, cerrado: false, codigoCuenta, creadoEn: fb.serverTimestamp(),
          });
          resultados.push({ uid, ...base, estado });
        } catch (e) {
          console.error('perfil', e.code, e.message);
          resultados.push({ ...base, estado: 'error', mensaje: 'La cuenta se creó, pero no se pudo guardar su perfil. Vuelve a intentar con el mismo nombre: se recuperará.' });
        }
      }
      return resultados;
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
