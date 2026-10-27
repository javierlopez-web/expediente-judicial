/**
 * LAS CUATRO ETAPAS DEL ESTUDIANTE
 *   1. Conozco mi personaje · 2. Analizo mi caso · 3. Preparo mi participación · 4. Reviso y descargo
 * Cada función devuelve el <article> de la etapa. `ctx` lo arma ui-estudiante.js:
 *   perfil, config, resp (respuestas vivas), editable, cambiar(id, valor), alActualizar(fn),
 *   ir(hash), irACampo(etapa, id), progreso(), acciones{...}
 */

import { h, rutaImg } from './util.js';
import {
  ETAPAS, ETAPA_REVISION, PERSONAJES, FUNCIONES, FUNCION_JUEZ_ESPECIFICA, NOTA_JUECES, ORIENTACION_PERSONAJE, ETAPA1_CAMPOS,
  PRACTICA_INTRO, CLASIFICACION, OPCIONES_CLASIFICACION,
  ETAPA2_INTRO, ETAPA2_MATERIAL, ETAPA2_DECLARANTES, ETAPA2_EJEMPLO, ETAPA2_TARJETAS, ETAPA2_DUDAS,
  estructuraParticipacion, esRequerido, esDeclarante, respuestasHeredadas,
  COMPROBACIONES, detectarDecisionAnticipada, TEXTOS,
} from './contenido.js';
import { etapaBloqueada, decisionesAnticipadas } from './progreso.js';
import { armarContenido } from './document-export.js';
import { barraProgreso, actualizarBarraProgreso } from './ui-comun.js';
import { fechaHora, soloFecha } from './util.js';
import { sonar } from './audio.js';

const img = rutaImg;

/* ============================== Piezas comunes ============================== */

function decoracion() {
  return [
    h('img', { class: 'hoja__clip', src: img('clip'), alt: '', 'aria-hidden': 'true', width: 60, height: 62 }),
  ];
}

function cabecera(n, ctx, titulo) {
  const e = ETAPAS.find((x) => x.n === n);
  const barra = barraProgreso(0, `Avance de la etapa ${n}`);
  const texto = h('span');
  const refrescar = () => {
    const p = ctx.progreso().etapas[n];
    texto.textContent = p.total ? `${p.hechos} de ${p.total}` : '—';
    actualizarBarraProgreso(barra, p.pct);
  };
  ctx.alActualizar(refrescar);
  refrescar();
  return h('header', { class: 'etapa__cabecera' },
    h('p', { class: 'etiqueta-juridica' }, `Etapa ${n} de ${ETAPAS.length} · ${e.titulo}`),
    h('h1', { id: 'titulo-etapa', tabindex: '-1' }, titulo || e.titulo),
    n < ETAPA_REVISION ? h('div', { class: 'etapa__resumen' }, barra, texto) : null);
}

function pie(n, ctx) {
  let sig = null;
  for (let i = n + 1; i <= ETAPAS.length; i++) { if (!etapaBloqueada(i, ctx.perfil)) { sig = i; break; } }
  let ant = null;
  for (let i = n - 1; i >= 1; i--) { if (!etapaBloqueada(i, ctx.perfil)) { ant = i; break; } }
  return h('footer', { class: 'etapa__pie' },
    h('div', { class: 'grupo-botones' },
      ant ? h('a', { class: 'btn btn--secundario', href: `#/etapa/${ant}` }, '← Anterior') : null,
      h('a', { class: 'btn btn--secundario', href: '#/tablero' }, 'Volver al tablero')),
    h('div', { class: 'grupo-botones' },
      sig ? h('a', { class: 'btn', href: `#/etapa/${sig}` }, sig === ETAPA_REVISION ? 'Ir a la revisión →' : 'Siguiente →') : null));
}

function avisoEdicionCerrada(ctx) {
  return ctx.editable ? null : h('div', { class: 'aviso aviso--alerta', role: 'status' }, h('span', null, '!'),
    h('p', null, 'La edición está cerrada. Puedes leer tu preparación y descargarla, pero no modificarla.'));
}

export function autoajustar(ta) {
  ta.style.height = 'auto';
  const min = parseFloat(getComputedStyle(ta).minHeight) || 0;
  ta.style.height = `${Math.max(min, ta.scrollHeight + 2)}px`;
}

function ayudaDesplegable(texto) {
  if (!texto) return null;
  return h('details', { class: 'ayuda' }, h('summary', null, 'Ayuda'), h('div', null, h('p', null, texto)));
}

/** Campo de respuesta amplio, editable y con autoguardado (vía ctx.cambiar). */
export function crearCampo(def, ctx) {
  if (def.tipo === 'eleccion') return crearEleccion(def, ctx);
  const id = def.id;
  const idAlerta = `${id}-alerta`;
  const esJuez = PERSONAJES[ctx.perfil.personaje]?.base === 'juez';
  const sufijo = h('span', { class: 'opcional' });
  const ref = def.refPregunta ? h('p', { class: 'campo-resp__ref' }) : null;
  const alerta = esJuez
    ? h('p', { class: 'campo-resp__alerta', id: idAlerta, role: 'status', hidden: true },
      'Parece que estás redactando una decisión. Todavía no corresponde: el tribunal decide después de escuchar toda la prueba y deliberar. Reformula este texto como preparación.')
    : null;
  const ta = h('textarea', {
    id, name: id, rows: def.filas || 4, maxlength: '8000', lang: 'es', spellcheck: 'true',
    readonly: !ctx.editable, 'aria-describedby': alerta ? idAlerta : null,
  });
  ta.value = ctx.resp[id] ?? '';
  const wrap = h('div', { class: 'campo-resp' },
    h('label', { for: id }, def.etiqueta, sufijo),
    ayudaDesplegable(def.ayuda),
    ref, ta, alerta);

  const evaluar = () => {
    if (!alerta) return;
    const hay = detectarDecisionAnticipada(ta.value);
    alerta.hidden = !hay;
    wrap.classList.toggle('campo-resp--advertencia', hay);
  };
  ta.addEventListener('input', () => { autoajustar(ta); ctx.cambiar(id, ta.value); evaluar(); });
  const actualizar = () => {
    sufijo.textContent = esRequerido(def, ctx.resp) ? '' : ' (opcional)';
    if (ref) { const q = String(ctx.resp[def.refPregunta] || '').trim(); ref.textContent = q ? `Tu pregunta: «${q}»` : ''; }
  };
  ctx.alActualizar(actualizar);
  actualizar();
  evaluar();
  requestAnimationFrame(() => autoajustar(ta));
  return wrap;
}

function crearEleccion(def, ctx) {
  const actual = ctx.resp[def.id] || '';
  const fs = h('fieldset', { class: 'campo-resp', style: { border: 0, padding: 0, margin: '0 0 1.5rem' } },
    h('legend', { class: 'rotulo' }, def.etiqueta),
    def.opciones.map((o) => {
      const r = h('input', { type: 'radio', name: def.id, value: o.valor, checked: actual === o.valor, disabled: !ctx.editable });
      r.addEventListener('change', () => ctx.cambiar(def.id, o.valor));
      return h('label', { class: 'opcion' }, r, h('span', null, o.texto));
    }));
  return fs;
}

/** Campos consecutivos con el mismo `agrupar` se muestran juntos (pregunta + respuesta). */
function camposAgrupados(campos, ctx) {
  const salida = [];
  let grupo = null;
  let clave = null;
  for (const c of campos) {
    if (c.agrupar) {
      if (c.agrupar !== clave) {
        grupo = h('div', { class: 'par', role: 'group', 'aria-label': c.agrupar }, h('p', { class: 'etiqueta-juridica' }, c.agrupar));
        salida.push(grupo);
        clave = c.agrupar;
      }
      grupo.append(crearCampo(c, ctx));
    } else {
      clave = null;
      salida.push(crearCampo(c, ctx));
    }
  }
  return salida;
}

/* ============================== Práctica de límites (en la etapa 1) ============================== */

function crearAfirmacion(item, ctx) {
  const id = `clasif_${item.id}`;
  const retro = h('div', { class: 'afirmacion__retro', role: 'status', 'aria-live': 'polite', hidden: true });
  const etiquetaDe = (v) => OPCIONES_CLASIFICACION.find((o) => o.valor === v)?.texto || '';
  const pintar = () => {
    const v = ctx.resp[id];
    retro.hidden = !v;
    if (!v) return;
    const coincide = v === item.correcta;
    retro.className = `afirmacion__retro ${coincide ? 'afirmacion__retro--coincide' : 'afirmacion__retro--difiere'}`;
    retro.replaceChildren(
      h('p', null, h('strong', null, `Tu respuesta: ${etiquetaDe(v)}. `),
        coincide ? 'Coincide con la respuesta sugerida.' : `Respuesta sugerida: ${etiquetaDe(item.correcta)}. Revisa la explicación y piensa por qué.`),
      h('p', null, item.retro));
  };
  const fs = h('fieldset', { class: 'afirmacion' },
    h('legend', { class: 'afirmacion__texto', style: { font: "700 1.05rem/1.35 var(--f-titulo)", marginBottom: '.6rem' } }, item.texto),
    h('div', { style: { display: 'flex', flexWrap: 'wrap', gap: '.5rem' } },
      OPCIONES_CLASIFICACION.map((o) => {
        const r = h('input', { type: 'radio', name: id, value: o.valor, checked: ctx.resp[id] === o.valor, disabled: !ctx.editable });
        r.addEventListener('change', () => { ctx.cambiar(id, o.valor); pintar(); });
        return h('label', { class: 'opcion', style: { margin: 0, flex: '1 1 10rem' } }, r, h('span', null, o.texto));
      })),
    retro);
  pintar();
  return fs;
}

function practicaLimites(ctx, abierta) {
  const avance = h('p', { class: 'clasificacion__avance', role: 'status' });
  const refrescar = () => {
    const n = CLASIFICACION.filter((c) => String(ctx.resp[`clasif_${c.id}`] || '').trim()).length;
    avance.textContent = `Afirmaciones respondidas: ${n} de ${CLASIFICACION.length} (práctica opcional)`;
  };
  ctx.alActualizar(refrescar);
  refrescar();
  return h('details', { class: 'practica', open: abierta },
    h('summary', null, 'Práctica rápida: ¿qué está permitido durante el juicio?'),
    h('div', null,
      h('p', { class: 'campo__ayuda' }, PRACTICA_INTRO),
      avance,
      h('div', { class: 'clasificacion' }, CLASIFICACION.map((c) => crearAfirmacion(c, ctx)))));
}

/* ============================== ETAPA 1 · CONOZCO MI PERSONAJE ============================== */

function etapa1(ctx) {
  const p = PERSONAJES[ctx.perfil.personaje];
  if (!p) {
    return h('article', { class: 'hoja hoja--lectura', 'aria-labelledby': 'titulo-etapa' },
      decoracion(),
      cabecera(1, ctx),
      h('div', { class: 'aviso aviso--alerta' }, h('span', null, '!'),
        h('p', null, 'Las preguntas de esta etapa se habilitan cuando el profesor te asigne un personaje. Mientras tanto puedes hacer la práctica de abajo y avanzar en la etapa 2.')),
      practicaLimites(ctx, true),
      pie(1, ctx));
  }
  const juez = p.base === 'juez';
  return h('article', { class: 'hoja hoja--lectura', 'aria-labelledby': 'titulo-etapa' },
    decoracion(),
    cabecera(1, ctx),
    avisoEdicionCerrada(ctx),
    h('h2', null, '¿Quién soy en el juicio?'),
    h('div', { class: 'recuadro-funcion' },
      h('p', { class: 'etiqueta-juridica' }, `Mi personaje: ${p.nombre}`),
      h('p', { class: 'funcion' }, FUNCIONES[p.base]),
      juez ? h('p', null, FUNCION_JUEZ_ESPECIFICA[p.subrol]) : null),
    h('div', { class: `aviso-nota${juez ? ' aviso-nota--juez' : ''}` },
      h('p', null, h('strong', null, 'Orientación: '), ORIENTACION_PERSONAJE[p.clave]),
      juez ? h('p', null, NOTA_JUECES) : null),
    ETAPA1_CAMPOS.map((c) => crearCampo(c, ctx)),
    practicaLimites(ctx, false),
    pie(1, ctx));
}

/* ============================== ETAPA 2 · ANALIZO MI CASO ============================== */

function etapa2(ctx) {
  const ej = ETAPA2_EJEMPLO;
  const declarante = esDeclarante(ctx.perfil.personaje);
  return h('article', { class: 'hoja hoja--lectura', 'aria-labelledby': 'titulo-etapa' },
    decoracion(),
    cabecera(2, ctx, 'ANALIZO MI CASO'),
    avisoEdicionCerrada(ctx),
    h('p', { class: 'intro' }, ETAPA2_INTRO),
    h('div', { class: 'aviso aviso--info' }, h('span', null, 'i'), h('p', null, ETAPA2_MATERIAL)),
    declarante ? h('div', { class: 'aviso-nota' }, h('p', null, ETAPA2_DECLARANTES)) : null,
    h('details', { class: 'ayuda ejemplo-metodologico' },
      h('summary', null, 'Ver un ejemplo metodológico (no es de ningún caso real)'),
      h('div', null,
        h('dl', null,
          h('dt', null, 'Antecedente'), h('dd', null, ej.antecedente),
          h('dt', null, 'Qué permite afirmar'), h('dd', null, ej.permite),
          h('dt', null, 'Qué no permite concluir'), h('dd', null, ej.limitacion)),
        h('p', null, h('strong', null, ej.moraleja)))),
    h('h2', null, 'Dos antecedentes relevantes'),
    h('div', { class: 'tarjetas-antecedentes tarjetas-antecedentes--dos' },
      ETAPA2_TARJETAS.map((t) => h('section', { class: 'tarjeta tarjeta--compacta', 'aria-label': `Antecedente ${t.n}` },
        h('img', { class: 'tarjeta__chinche', src: img('chinche'), alt: '', 'aria-hidden': 'true' }),
        h('h3', null, `Antecedente ${t.n}`),
        t.campos.map((c) => crearCampo(c, ctx))))),
    crearCampo(ETAPA2_DUDAS, ctx),
    pie(2, ctx));
}

/* ============================== ETAPA 3 · PREPARO MI PARTICIPACIÓN ============================== */

function etapa3(ctx) {
  const est = estructuraParticipacion(ctx.perfil.personaje);
  const p = PERSONAJES[ctx.perfil.personaje];
  const nodoAvisos = est.avisos.map((t) => h('div', { class: `aviso-nota${est.avisoJuez ? ' aviso-nota--juez' : ''}` }, h('p', null, t)));

  const secciones = est.apartados.map((a) => {
    const avance = h('span', { class: 'apartado__avance' });
    const cuerpo = a.presentacion === 'lista'
      ? h('div', { class: 'lista-preguntas' }, a.campos.map((c) => crearCampo(c, ctx)))
      : camposAgrupados(a.campos, ctx);
    const sec = h('section', { class: 'apartado', id: `ap-${a.id}`, 'aria-labelledby': `ap-${a.id}-t` },
      h('div', { class: 'apartado__cabecera' },
        h('span', { class: 'apartado__num', 'aria-hidden': 'true' }, String(a.numero).padStart(2, '0')),
        h('h2', { id: `ap-${a.id}-t` }, a.titulo),
        avance),
      a.nota ? h('p', { class: 'apartado__nota' }, a.nota) : null,
      cuerpo);
    return { a, sec, avance };
  });

  const indice = h('ul', { class: 'indice-apartados', 'aria-label': 'Apartados de esta etapa' },
    secciones.map(({ a }) => h('li', null,
      h('button', {
        type: 'button', dataset: { ap: a.id }, class: 'chip-indice',
        onclick: () => document.getElementById(`ap-${a.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
      }, `${a.numero}. ${a.titulo}`))));

  const refrescar = () => {
    for (const { a, avance } of secciones) {
      const req = a.campos.filter((c) => esRequerido(c, ctx.resp));
      const hechos = req.filter((c) => String(ctx.resp[c.id] || '').trim()).length;
      const completo = req.length > 0 ? hechos === req.length : a.campos.some((c) => String(ctx.resp[c.id] || '').trim());
      avance.textContent = req.length ? (completo ? 'listo' : `${hechos}/${req.length}`) : 'opcional';
      const btn = indice.querySelector(`[data-ap="${a.id}"]`);
      if (btn) btn.dataset.estado = completo ? 'completa' : '';
    }
  };
  ctx.alActualizar(refrescar);
  refrescar();

  return h('article', { class: 'hoja hoja--ancha', 'aria-labelledby': 'titulo-etapa' },
    decoracion(),
    cabecera(3, ctx, est.titulo),
    avisoEdicionCerrada(ctx),
    h('p', { class: 'etiqueta-juridica' }, `Preparación específica · ${p.nombre}`),
    nodoAvisos,
    indice,
    secciones.map((s) => s.sec),
    pie(3, ctx));
}

/* ============================== ETAPA 4 · REVISO Y DESCARGO ============================== */

/** Vista previa del documento (es el mismo contenido del Word y sirve de respaldo de continuidad). */
function vistaPreviaDocumento(ctx) {
  const c = armarContenido({ perfil: ctx.perfil, respuestas: ctx.resp, expediente: ctx.expediente() });
  return h('div', { class: 'documento-previo' },
    h('div', { class: 'documento-previo__encabezado' },
      h('strong', null, 'LICEO LUIS URBINA FLORES'), h('br'),
      `${ctx.perfil.nombreMostrar || ''} · ${c.p?.nombre || TEXTOS.pendienteAsignacion}`, h('br'),
      `Caso ${ctx.perfil.caso ?? '—'}`),
    c.secciones.map((s) => [
      h('h3', null, s.titulo),
      s.vacio ? h('p', { class: 'vacio' }, s.vacio) : null,
      s.bloques.map((b) => [
        b.subtitulo ? h('p', null, h('strong', null, b.subtitulo)) : null,
        b.campos.map((x) => [
          h('p', null, h('strong', null, x.etiqueta)),
          x.respuesta ? h('p', null, x.respuesta) : h('p', { class: 'vacio' }, '(sin responder)'),
        ]),
      ]),
      s.nota ? h('p', { class: 'vacio' }, s.nota) : null,
    ]));
}

function respuestasAnteriores(ctx) {
  const lista = respuestasHeredadas(ctx.perfil.personaje, ctx.resp);
  if (!lista.length) return null;
  return h('details', { class: 'ayuda', style: { marginBottom: '1.6rem' } },
    h('summary', null, `Respuestas de la versión anterior de la plataforma (${lista.length})`),
    h('div', null,
      h('p', null, 'La plataforma se simplificó. Estas respuestas tuyas ya no se piden y no aparecen en el Word, pero se conservan: puedes copiar lo que te sirva en las preguntas actuales.'),
      lista.map((x) => h('div', { class: 'adm-qa' }, h('p', null, h('strong', null, x.etiqueta)), h('p', { style: { whiteSpace: 'pre-wrap' } }, x.texto)))));
}

function etapa4(ctx) {
  const { acciones } = ctx;
  const listaEtapas = h('ul', { class: 'resumen-etapas' });
  const listaPend = h('ul', { class: 'pendientes' });
  const bloquePend = h('div');
  const alertaDecision = h('div');
  const fichaDatos = h('dl', { class: 'ficha__datos' });
  const bloqueEntrega = h('div');

  const previa = h('div', { hidden: true, id: 'previa-documento', 'aria-live': 'polite' });
  const btnPrevia = h('button', { type: 'button', class: 'btn btn--secundario', 'aria-expanded': 'false', 'aria-controls': 'previa-documento' }, 'Ver mi documento');
  btnPrevia.addEventListener('click', () => {
    const abrir = previa.hidden;
    previa.hidden = !abrir;
    btnPrevia.setAttribute('aria-expanded', String(abrir));
    btnPrevia.textContent = abrir ? 'Ocultar mi documento' : 'Ver mi documento';
    if (abrir) { previa.replaceChildren(vistaPreviaDocumento(ctx)); sonar.papel(); }
  });

  const pintar = () => {
    const pr = ctx.progreso();
    const exp = ctx.expediente();
    const p = PERSONAJES[ctx.perfil.personaje];
    fichaDatos.replaceChildren(
      ...[
        ['Estudiante', ctx.perfil.nombreMostrar],
        ['Curso', ctx.perfil.curso || ctx.config.curso],
        ['Caso', ctx.perfil.caso ? `Caso ${ctx.perfil.caso}` : TEXTOS.pendienteAsignacion],
        ['Personaje', p?.nombre || TEXTOS.pendienteAsignacion],
        ['Último guardado', ctx.ultimoGuardado() ? fechaHora(ctx.ultimoGuardado()) : 'Aún no hay guardados en esta sesión'],
      ].map(([t, d]) => h('div', null, h('dt', null, t), h('dd', null, d))));

    listaEtapas.replaceChildren(...ETAPAS.filter((e) => e.n < ETAPA_REVISION).map((e) => {
      const x = pr.etapas[e.n];
      const estado = x.bloqueada ? 'Pendiente de asignación' : x.completa ? 'Completa' : x.total ? `${x.hechos} de ${x.total}` : '—';
      const clase = x.completa ? 'chip--verde' : x.bloqueada ? 'chip--gris' : x.iniciada ? 'chip--ambar' : 'chip--gris';
      return h('li', null,
        h('span', null, h('strong', null, `${e.n}. ${e.titulo}`)),
        h('span', { class: `chip ${clase}` }, estado));
    }));

    listaPend.replaceChildren(...pr.pendientes.map((x) => h('li', null,
      h('a', { href: `#/etapa/${x.etapa}`, onclick: () => ctx.irACampo(x.etapa, x.id) }, `Etapa ${x.etapa}: ${x.etiqueta}`))));
    bloquePend.replaceChildren(pr.pendientes.length
      ? h('div', null, h('h2', null, `Respuestas pendientes (${pr.pendientes.length})`), listaPend)
      : h('div', { class: 'aviso aviso--ok' }, h('span', null, '✓'), h('p', null, 'No quedan respuestas pendientes. Puedes revisar una última vez y entregar.')));

    const anticipadas = decisionesAnticipadas(ctx.perfil, ctx.resp);
    alertaDecision.replaceChildren(...(anticipadas.length
      ? [h('div', { class: 'aviso aviso--error', role: 'alert' }, h('span', null, '!'),
        h('p', null, `Hay ${anticipadas.length} texto(s) que parecen una decisión ya redactada. Todavía no corresponde decidir: reformúlalos como preparación antes de entregar.`))]
      : []));

    const entregada = Boolean(exp?.entregadoEn);
    bloqueEntrega.replaceChildren(...(entregada
      ? [
        h('div', { class: 'sello-entregada', role: 'img', 'aria-label': 'Sello: preparación entregada' }, 'PREPARACIÓN ENTREGADA'),
        h('p', null, h('strong', null, 'Entregada el '), fechaHora(exp.entregadoEn), exp.version > 1 ? ` (versión ${exp.version})` : ''),
        exp.editadoDespuesDeEntrega
          ? h('div', { class: 'aviso aviso--alerta', role: 'status' }, h('span', null, '!'),
            h('p', null, 'Editaste después de entregar: existe una versión posterior a la entregada. Si quieres que cuente como tu entrega, vuelve a marcarla como entregada.'))
          : null,
      ].filter(Boolean)
      : []));
    btnEntregar.textContent = entregada ? 'ENTREGAR NUEVAMENTE ESTA VERSIÓN' : 'MARCAR PREPARACIÓN COMO ENTREGADA';
    if (!previa.hidden) previa.replaceChildren(vistaPreviaDocumento(ctx));
  };

  const btn = (texto, fn, clase = '', extra = {}) => {
    const b = h('button', { type: 'button', class: `btn ${clase}`, ...extra }, texto);
    b.addEventListener('click', async () => { b.disabled = true; try { await fn(); } finally { b.disabled = Boolean(extra.disabled); } });
    return b;
  };
  const btnEntregar = btn('MARCAR PREPARACIÓN COMO ENTREGADA', async () => { await acciones.entregar(); pintar(); }, '', { disabled: !ctx.editable });

  const checks = h('fieldset', { class: 'comprobaciones', style: { border: 0, padding: 0, margin: '0 0 1.6rem' } },
    h('legend', { class: 'rotulo' }, 'Comprobación final (orientadora: no es nota)'),
    COMPROBACIONES.map((c) => {
      const i = h('input', { type: 'checkbox', checked: ctx.resp[c.id] === 'si', disabled: !ctx.editable, id: c.id });
      i.addEventListener('change', () => ctx.cambiar(c.id, i.checked ? 'si' : 'no'));
      return h('label', { class: 'opcion', for: c.id }, i, h('span', null, c.texto));
    }));

  ctx.alActualizar(pintar);
  pintar();

  return h('article', { class: 'hoja hoja--lectura', 'aria-labelledby': 'titulo-etapa' },
    decoracion(),
    cabecera(ETAPA_REVISION, ctx, 'REVISO Y DESCARGO'),
    avisoEdicionCerrada(ctx),
    h('h2', null, 'Resumen de tu expediente'),
    fichaDatos,
    h('h2', { style: { marginTop: '1.4rem' } }, 'Etapas'),
    listaEtapas,
    alertaDecision,
    bloquePend,
    h('h2', null, 'Mi documento'),
    h('p', null, 'El Word reúne tus respuestas en tres secciones: A. Mi personaje, B. Antecedentes del caso y C. Preparación para la audiencia. Es tu preparación individual y tu apoyo durante el juicio; si no pudieras asistir, también sirve de respaldo. Se arma solo con lo que escribiste.'),
    h('div', { class: 'grupo-botones', style: { marginBottom: '1rem' } }, btnPrevia),
    previa,
    respuestasAnteriores(ctx),
    checks,
    bloqueEntrega,
    h('div', { class: 'acciones-entrega' },
      h('div', { class: 'grupo-botones' },
        h('a', { class: 'btn btn--secundario', href: '#/etapa/1' }, 'VOLVER A EDITAR'),
        btn('GUARDAR AVANCE', acciones.guardarAhora, 'btn--azul'),
        btn('DESCARGAR WORD', acciones.descargar, 'btn--azul')),
      h('div', { class: 'grupo-botones' },
        btn('PREPARAR CORREO DE ENTREGA', acciones.correo, 'btn--secundario'),
        btnEntregar),
      h('p', { class: 'campo__ayuda' }, ctx.config.reglasEntrega || ''),
      ctx.config.fechaLimite ? h('p', { class: 'campo__ayuda' }, `Fecha límite de preparación: ${soloFecha(ctx.config.fechaLimite)}.`) : null),
    pie(ETAPA_REVISION, ctx));
}

/* ============================== Despachador ============================== */

export function renderEtapa(n, ctx) {
  switch (n) {
    case 1: return etapa1(ctx);
    case 2: return etapa2(ctx);
    case 3: return etapa3(ctx);
    case 4: return etapa4(ctx);
    default: return h('p', null, 'Etapa no encontrada.');
  }
}
