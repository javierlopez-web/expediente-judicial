/**
 * AMBIENTACIÓN SONORA (Web Audio API: sonidos breves generados en el momento, sin archivos).
 * - Empieza SIEMPRE desactivada; solo se activa con el botón "ACTIVAR SONIDOS".
 * - Nunca hay sonido continuo: cada efecto dura una fracción de segundo.
 * - El profesor puede desactivarla para todos (config.sonidosPermitidos) y fijar el volumen.
 */

let ctx = null;
let activo = false;
let permitido = true;
let volumen = 0.5;
const oyentes = new Set();

export const sonidoActivo = () => activo && permitido;
export const sonidoPermitido = () => permitido;
export function alCambiar(cb) { oyentes.add(cb); return () => oyentes.delete(cb); }
const avisar = () => oyentes.forEach((cb) => cb({ activo, permitido }));

export function configurar({ sonidosPermitidos, sonidoVolumen } = {}) {
  if (typeof sonidosPermitidos === 'boolean') permitido = sonidosPermitidos;
  if (typeof sonidoVolumen === 'number') volumen = Math.min(1, Math.max(0, sonidoVolumen));
  if (!permitido) activo = false;
  avisar();
}

export async function activar() {
  if (!permitido) return false;
  try {
    ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') await ctx.resume();
    activo = true;
    avisar();
    sonar.guardado();
    return true;
  } catch {
    activo = false;
    avisar();
    return false;
  }
}

export function silenciar() { activo = false; avisar(); }
export async function alternar() { return activo ? (silenciar(), false) : activar(); }

/* ---------- Bloques de construcción ---------- */

function ruido(duracion) {
  const largo = Math.max(1, Math.floor(ctx.sampleRate * duracion));
  const buf = ctx.createBuffer(1, largo, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < largo; i++) d[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  return src;
}

function ganancia(pico, inicio, duracion, ataque = 0.005) {
  const g = ctx.createGain();
  const v = pico * volumen;
  g.gain.setValueAtTime(0.0001, inicio);
  g.gain.exponentialRampToValueAtTime(Math.max(v, 0.0002), inicio + ataque);
  g.gain.exponentialRampToValueAtTime(0.0001, inicio + duracion);
  return g;
}

function rafaga({ t = 0, dur = 0.2, tipo = 'bandpass', f0 = 2000, f1 = f0, q = 1, pico = 0.3 }) {
  const t0 = ctx.currentTime + t;
  const src = ruido(dur);
  const filtro = ctx.createBiquadFilter();
  filtro.type = tipo;
  filtro.Q.value = q;
  filtro.frequency.setValueAtTime(f0, t0);
  filtro.frequency.exponentialRampToValueAtTime(f1, t0 + dur);
  const g = ganancia(pico, t0, dur, Math.min(0.03, dur / 4));
  src.connect(filtro).connect(g).connect(ctx.destination);
  src.start(t0);
  src.stop(t0 + dur + 0.02);
}

function tono({ t = 0, dur = 0.15, tipo = 'sine', f0 = 440, f1 = f0, pico = 0.2 }) {
  const t0 = ctx.currentTime + t;
  const o = ctx.createOscillator();
  o.type = tipo;
  o.frequency.setValueAtTime(f0, t0);
  if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t0 + dur);
  const g = ganancia(pico, t0, dur);
  o.connect(g).connect(ctx.destination);
  o.start(t0);
  o.stop(t0 + dur + 0.02);
}

const si = (fn) => (...a) => { if (sonidoActivo() && ctx) { try { fn(...a); } catch { /* sin audio */ } } };

export const sonar = {
  /** Sobre: crujido de la cera + papel que roza. */
  sobre: si(() => {
    rafaga({ dur: 0.04, tipo: 'highpass', f0: 3000, pico: 0.5 });
    rafaga({ t: 0.05, dur: 0.5, f0: 1500, f1: 4200, q: 0.8, pico: 0.28 });
    tono({ t: 0.02, dur: 0.1, f0: 150, f1: 70, pico: 0.25 });
  }),
  /** Papel que se despliega o se desliza. */
  papel: si(() => {
    rafaga({ dur: 0.38, tipo: 'bandpass', f0: 700, f1: 2600, q: 0.7, pico: 0.22 });
  }),
  /** Máquina de escribir: una ráfaga corta de golpes (máx. 10). */
  maquina: si((n = 8) => {
    let t = 0;
    for (let i = 0; i < Math.min(10, n); i++) {
      rafaga({ t, dur: 0.025, tipo: 'bandpass', f0: 2600, q: 2, pico: 0.3 });
      tono({ t, dur: 0.04, f0: 130, f1: 80, pico: 0.15 });
      t += 0.07 + Math.random() * 0.05;
    }
    tono({ t: t + 0.05, dur: 0.12, tipo: 'triangle', f0: 2800, pico: 0.07 });
  }),
  /** Sello de tinta sobre el documento. */
  sello: si(() => {
    tono({ dur: 0.22, f0: 95, f1: 45, pico: 0.55 });
    rafaga({ dur: 0.14, tipo: 'lowpass', f0: 600, f1: 200, pico: 0.4 });
  }),
  /** Chinche al cambiar de etapa. */
  chinche: si(() => {
    tono({ dur: 0.03, tipo: 'square', f0: 1900, pico: 0.12 });
    tono({ t: 0.025, dur: 0.05, tipo: 'triangle', f0: 800, f1: 500, pico: 0.15 });
  }),
  /** Clip metálico. */
  clip: si(() => {
    tono({ dur: 0.14, tipo: 'triangle', f0: 2300, pico: 0.09 });
    tono({ t: 0.01, dur: 0.1, tipo: 'sine', f0: 3400, pico: 0.05 });
  }),
  /** Confirmación de guardado: dos notas suaves. */
  guardado: si(() => {
    tono({ dur: 0.1, f0: 660, pico: 0.1 });
    tono({ t: 0.09, dur: 0.16, f0: 880, pico: 0.1 });
  }),
};
