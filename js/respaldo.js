/* Reúne las respuestas de la etapa 4 en las secciones del documento de respaldo (etapa 5). Lógica pura. */

import { PERSONAJES, FUNCION_JUEZ_ESPECIFICA, seccionesRespaldo } from './contenido.js';

const t = (v) => String(v ?? '').trim();

const bloque = (titulo, texto) => (t(texto) ? `${titulo}\n${t(texto)}` : '');
const unir = (...partes) => partes.filter(Boolean).join('\n\n');

function pares(resp, pId, rId, etiquetaP = 'Pregunta', etiquetaR = 'Respuesta', n = 5) {
  const out = [];
  for (let i = 1; i <= n; i++) {
    const p = t(resp[pId(i)]);
    const r = t(resp[rId(i)]);
    if (p || r) out.push(`${etiquetaP} ${i}: ${p || '(sin escribir)'}\n${etiquetaR}: ${r || '(sin escribir)'}`);
  }
  return out.join('\n\n');
}

function lista(resp, ids, etiqueta) {
  return ids.map((id, i) => (t(resp[id]) ? `${etiqueta} ${i + 1}: ${t(resp[id])}` : '')).filter(Boolean).join('\n');
}

function preguntasDeLasPartes(resp) {
  const g = (titulo, ids) => {
    const l = ids.map((id, i) => (t(resp[id]) ? `  ${i + 1}. ${t(resp[id])}` : '')).filter(Boolean).join('\n');
    return l ? `${titulo}\n${l}` : '';
  };
  return unir(
    g('A la víctima:', ['e4_vic_1', 'e4_vic_2']),
    g('Al testigo 1:', ['e4_t1_1', 'e4_t1_2']),
    g('Al testigo 2:', ['e4_t2_1', 'e4_t2_2']),
    g('Al perito:', ['e4_per_1', 'e4_per_2']),
    g('Al acusado (si decide declarar):', ['e4_acu_1', 'e4_acu_2']),
  );
}

/** Devuelve { resp_<seccion>: texto } según el personaje. Solo usa lo que el estudiante ya escribió. */
export function reunirRespaldo(clavePersonaje, resp = {}) {
  const p = PERSONAJES[clavePersonaje];
  if (!p) return {};
  const salida = {};
  const poner = (id, texto) => { salida[`resp_${id}`] = texto; };

  switch (p.base) {
    case 'victima':
      poner('declaracion', t(resp.e4_declaracion));
      poner('respuestas', pares(resp, (i) => `e4_preg_${i}`, (i) => `e4_resp_${i}`));
      poner('limites', bloque('Lo que no puedo asegurar:', resp.e4_noasegurar));
      poner('noinventar', '');
      break;
    case 'testigo':
      poner('declaracion', t(resp.e4_declaracion));
      poner('respuestas', pares(resp, (i) => `e4_qa${i}_p`, (i) => `e4_qa${i}_r`));
      poner('limites', unir(bloque('Lo que no presenció:', resp.e4_nopresencio), bloque('Lo que podría estar interpretando:', resp.e4_interpretando)));
      poner('noinventar', '');
      break;
    case 'perito':
      poner('declaracion', t(resp.e4_oral));
      poner('respuestas', pares(resp, (i) => `e4_qa${i}_p`, (i) => `e4_qa${i}_r`));
      poner('limites', unir(bloque('Lo que el informe no permite concluir:', resp.e4_nopermite), bloque('Limitaciones del examen:', resp.e4_limitaciones)));
      poner('noinventar', '');
      break;
    case 'acusado': {
      const silencio = resp.e4_decision === 'silencio';
      poner('declaracion', silencio
        ? 'Mi personaje ejercerá su derecho a guardar silencio en esta simulación. Es un derecho y no se interpreta en su contra.'
        : bloque('Versión que aparece en la ficha de mi personaje:', resp.e4_version));
      poner('respuestas', silencio ? '' : pares(resp, (i) => `e4_preg_${i}`, (i) => `e4_resp_${i}`, 'Pregunta', 'Respuesta', 3));
      poner('limites', bloque('Lo que mi personaje desconoce:', resp.e4_desconoce));
      poner('noinventar', '');
      break;
    }
    case 'fiscal':
      poner('postura', t(resp.e4_postura));
      poner('antecedentes', lista(resp, ['e4_ant_1', 'e4_ant_2', 'e4_ant_3'], 'Antecedente'));
      poner('preguntas', preguntasDeLasPartes(resp));
      poner('argumentos', bloque('Posible debilidad de la acusación que reconozco:', resp.e4_debilidad));
      poner('conclusion', t(resp.e4_conclusion));
      break;
    case 'defensor':
      poner('postura', t(resp.e4_postura));
      poner('antecedentes', lista(resp, ['e4_exp_1', 'e4_exp_2'], 'Antecedente que requiere explicación'));
      poner('preguntas', unir(preguntasDeLasPartes(resp), bloque('Para el acusado, si decide declarar:', resp.e4_acu_preguntas)));
      poner('argumentos', unir(lista(resp, ['e4_lim_1', 'e4_lim_2', 'e4_lim_3'], 'Limitación o duda'), bloque('Derechos del acusado que debo recordarle:', resp.e4_acu_derechos)));
      poner('conclusion', t(resp.e4_conclusion));
      break;
    case 'juez': {
      const sub = p.subrol;
      poner('funcion', unir(FUNCION_JUEZ_ESPECIFICA[sub], bloque('Función del tribunal, con mis palabras:', resp.e4_funcion)));
      if (sub === 'presidente') {
        poner('orden', unir(bloque('Orden de la audiencia:', resp.e4_rol_orden), bloque('Cómo presentaré las etapas:', resp.e4_rol_etapas), bloque('Organización de los turnos:', resp.e4_rol_turnos)));
      } else {
        poner('orden', '');
      }
      const previstas = lista(resp, ['e4_acl_1', 'e4_acl_2'], 'Pregunta aclaratoria');
      const propias = sub === 'preguntas'
        ? unir(bloque('A la víctima:', resp.e4_rol_vic), bloque('A un testigo:', resp.e4_rol_test), bloque('Al perito:', resp.e4_rol_per), bloque('Por qué son pertinentes y neutrales:', resp.e4_rol_neutral))
        : '';
      poner('preguntas', unir(previstas, propias));
      const estructura = sub === 'decision'
        ? unir(bloque('Cómo comenzaré la comunicación:', resp.e4_rol_inicio), bloque('Cómo explicaré las pruebas valoradas:', resp.e4_rol_pruebas), bloque('Presunción de inocencia y carga de la prueba:', resp.e4_rol_presuncion), bloque('Cómo comunicaré la decisión (estructura, sin anticiparla):', resp.e4_rol_cierre))
        : '';
      poner('criterios', unir(bloque('Criterios para valorar las pruebas:', resp.e4_criterios), bloque('Lo que debo escuchar antes de decidir:', resp.e4_escuchar), estructura));
      break;
    }
    default: break;
  }
  return salida;
}

/** Texto actual de cada sección del respaldo (lo que el estudiante editó). */
export function respaldoActual(clavePersonaje, resp = {}) {
  return seccionesRespaldo(clavePersonaje).map((s) => ({ ...s, texto: t(resp[s.campo]) }));
}
