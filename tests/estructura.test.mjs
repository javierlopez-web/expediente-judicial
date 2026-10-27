/**
 * Pruebas de la versión simplificada (4 etapas). Ejecutar desde la raíz del proyecto:
 *   node --test tests/
 * No necesitan navegador ni Firebase: prueban contenido, avance, migración, respaldo y Word.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  ETAPAS, ETAPA_REVISION, LISTA_PERSONAJES, PERSONAJES, estructuraParticipacion, camposParticipacion, camposVigentes,
  migrarRespuestas, respuestasVigentes, respuestasHeredadas, CLASIFICACION, MARCA_MIGRACION, detectarDecisionAnticipada,
} from '../js/contenido.js';
import { calcularProgreso, estadoDe, decisionesAnticipadas } from '../js/progreso.js';
import { armarContenido, generarWord } from '../js/document-export.js';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');

/** Respuestas completas (texto de relleno neutro, no son respuestas de ningún caso) para un personaje. */
function completar(clave, extra = {}) {
  const r = {};
  for (const c of camposVigentes(clave)) r[c.id] = c.tipo === 'eleccion' ? c.opciones[0].valor : `Texto de prueba (${c.id})`;
  return { ...r, ...extra };
}

test('hay cuatro etapas y la última es la revisión', () => {
  assert.equal(ETAPAS.length, 4);
  assert.equal(ETAPA_REVISION, 4);
  assert.deepEqual(ETAPAS.map((e) => e.titulo), ['Conozco mi personaje', 'Analizo mi caso', 'Preparo mi participación', 'Reviso y descargo']);
});

test('cada personaje tiene entre 8 y 12 respuestas obligatorias', () => {
  for (const p of LISTA_PERSONAJES) {
    const pr = calcularProgreso({ personaje: p.clave }, { respuestas: {} });
    assert.ok(pr.total >= 8 && pr.total <= 12, `${p.nombre}: ${pr.total}`);
    assert.equal(pr.etapas[1].total, 2, p.nombre);
    assert.equal(pr.etapas[2].total, 3, p.nombre); // dos tarjetas + duda
  }
});

test('cada personaje recibe solo sus preguntas', () => {
  const titulos = (k) => estructuraParticipacion(k).apartados.map((a) => a.titulo).join(' | ');
  assert.match(titulos('fiscal'), /Debilidad de la acusación/);
  assert.doesNotMatch(titulos('defensor'), /Debilidad de la acusación/);
  assert.match(titulos('defensor'), /Derecho del acusado/);
  assert.match(titulos('acusado'), /Su decisión/);
  assert.doesNotMatch(titulos('victima'), /Su decisión/);
  assert.match(titulos('victima'), /Lo que sabe por terceros/);
  assert.match(titulos('perito'), /Lo que no permiten concluir/);
  assert.match(titulos('juez_presidente'), /Secuencia de intervenciones/);
  assert.doesNotMatch(titulos('juez_preguntas'), /Secuencia de intervenciones/);
  assert.match(titulos('juez_preguntas'), /Preguntas neutrales/);
  assert.match(titulos('juez_decision'), /Estructura de la explicación/);
  assert.deepEqual(titulos('testigo1'), titulos('testigo2'));
  // Ningún id se repite dentro de un personaje.
  for (const p of LISTA_PERSONAJES) {
    const ids = camposVigentes(p.clave).map((c) => c.id);
    assert.equal(new Set(ids).size, ids.length, p.nombre);
  }
});

test('el avance llega a 100 % y los opcionales no lo impiden', () => {
  for (const p of LISTA_PERSONAJES) {
    const resp = completar(p.clave);
    for (const c of camposParticipacion(p.clave)) if (c.opcional) delete resp[c.id];
    const pr = calcularProgreso({ personaje: p.clave }, { respuestas: resp });
    assert.equal(pr.pct, 100, p.nombre);
    assert.equal(pr.pendientes.length, 0, p.nombre);
  }
});

test('la práctica de límites y las comprobaciones no cuentan para el avance', () => {
  const resp = {};
  CLASIFICACION.forEach((c) => { resp[`clasif_${c.id}`] = 'permitido'; });
  resp.chk_funcion = 'si';
  const pr = calcularProgreso({ personaje: 'fiscal' }, { respuestas: resp });
  assert.equal(pr.hechos, 0);
});

test('el acusado puede guardar silencio sin penalización', () => {
  const base = completar('acusado');
  for (const id of ['e4_preg_1', 'e4_resp_1', 'e4_preg_2', 'e4_resp_2']) delete base[id];
  const silencio = calcularProgreso({ personaje: 'acusado' }, { respuestas: { ...base, e4_decision: 'silencio' } });
  assert.equal(silencio.pct, 100);
  assert.equal(silencio.total, 11);
  const declara = calcularProgreso({ personaje: 'acusado' }, { respuestas: { ...base, e4_decision: 'declarar' } });
  assert.equal(declara.total, 12);
  assert.equal(declara.pendientes.length, 1);
  const indeciso = calcularProgreso({ personaje: 'acusado' }, { respuestas: { ...base, e4_decision: 'indeciso' } });
  assert.equal(indeciso.pendientes.length, 1);
  // En el Word del silencio no aparecen preguntas vacías ni una declaración obligatoria.
  const c = armarContenido({ perfil: { personaje: 'acusado', caso: 1 }, respuestas: { ...base, e4_decision: 'silencio' } });
  const textoC = JSON.stringify(c.secciones[2]);
  assert.doesNotMatch(textoC, /Pregunta posible 1 \(sin escribir\)/);
  assert.match(textoC, /Guardará silencio/);
});

test('las ayudas de declarantes piden no inventar', () => {
  for (const k of ['victima', 'testigo1', 'perito', 'acusado']) {
    const est = estructuraParticipacion(k);
    const todo = JSON.stringify(est);
    assert.match(todo, /(no lo s[eé]|no inventes|no lo recuerda|consta en tu ficha|no escribas respuestas que supongan)/i, k);
  }
});

test('los jueces: aviso contra decisiones anticipadas', () => {
  for (const k of ['juez_presidente', 'juez_preguntas', 'juez_decision']) {
    assert.match(estructuraParticipacion(k).avisos.join(' '), /No redactes una decisión/);
  }
  assert.ok(detectarDecisionAnticipada('El tribunal resuelve condenar al acusado'));
  const r = completar('juez_decision', { e4_estructura: 'Fallo: se condena al acusado' });
  assert.deepEqual(decisionesAnticipadas({ personaje: 'juez_decision' }, r), ['e4_estructura']);
});

test('el Word tiene secciones A, B y C y no inventa contenido', () => {
  for (const p of LISTA_PERSONAJES) {
    const resp = completar(p.clave);
    const c = armarContenido({ perfil: { personaje: p.clave, caso: 2, nombreMostrar: 'Prueba Uno', curso: '3° A' }, respuestas: resp });
    assert.deepEqual(c.secciones.map((s) => s.titulo.slice(0, 2)), ['A.', 'B.', 'C.'], p.nombre);
    assert.equal(c.datos[0][0], 'Establecimiento');
    // Todo texto de respuesta proviene de lo escrito por el estudiante.
    const respuestas = c.secciones.flatMap((s) => s.bloques.flatMap((b) => b.campos.map((x) => x.respuesta))).filter(Boolean);
    for (const r of respuestas) {
      const lineas = r.split('\n').map((l) => l.replace(/^\d+\.\s/, '').replace(/^(Permite afirmar|No permite concluir): /, ''));
      for (const l of lineas) assert.ok(l === '(sin responder)' || Object.values(resp).includes(l) || l.startsWith('Texto de prueba') || ['Declarará', 'Guardará silencio', 'Aún no lo decide'].includes(l), `${p.nombre}: «${l}»`);
    }
  }
  // Con respuestas vacías, las obligatorias se marcan y las opcionales se omiten.
  const vacio = armarContenido({ perfil: { personaje: 'fiscal', caso: 1 }, respuestas: {} });
  const json = JSON.stringify(vacio.secciones);
  assert.doesNotMatch(json, /Preguntas al acusado/);
  assert.match(json, /Preguntas a la víctima/);
});

test('el respaldo se arma con las respuestas existentes (sección C por grupo)', () => {
  const fiscal = armarContenido({ perfil: { personaje: 'fiscal' }, respuestas: completar('fiscal') });
  const c = JSON.stringify(fiscal.secciones[2]);
  for (const t of ['¿Qué sostiene la acusación?', '¿Qué antecedentes utilizarás', 'Preguntas a la víctima', 'Preguntas a los testigos', 'conclusión provisional']) assert.ok(c.includes(t), t);
  const testigo = JSON.stringify(armarContenido({ perfil: { personaje: 'testigo2' }, respuestas: completar('testigo2') }).secciones[2]);
  for (const t of ['Pregunta posible: «Texto de prueba (e4_qa1_p)»', 'declaración inicial', '¿Qué no presenció']) assert.ok(testigo.includes(t), t);
  const perito = JSON.stringify(armarContenido({ perfil: { personaje: 'perito' }, respuestas: completar('perito') }).secciones[2]);
  for (const t of ['¿Qué resultados obtuvo?', '¿Qué no permiten concluir?', 'Pregunta posible']) assert.ok(perito.includes(t), t);
  const juez = JSON.stringify(armarContenido({ perfil: { personaje: 'juez_presidente' }, respuestas: completar('juez_presidente') }).secciones[2]);
  for (const t of ['responsabilidad', 'Preguntas aclaratorias', 'criterios']) assert.ok(juez.includes(t), t);
});

test('migración: las respuestas antiguas se trasladan sin perder nada', () => {
  const antiguas = {
    e1_funcion: 'Acuso.', e1_tareas: 'Preguntar a testigos.', e1_importancia: 'Importa.',
    e3_limite1: 'No invento.', e3_limite2: 'No exagero.',
    e2_a3_antecedente: 'Tercer antecedente.',
    e4_ant_1: 'Informe A', e4_ant_3: 'Informe C',
    e4_t1_2: '¿Qué vio?', e4_t2_1: '¿Dónde estaba?', e4_t2_2: '¿A qué hora?',
    resp_postura: 'Respaldo antiguo',
  };
  const { cambios } = migrarRespuestas('fiscal', antiguas);
  assert.equal(cambios.e1_funcion, 'Mi función: Acuso.\n\nMis tareas en el juicio: Preguntar a testigos.');
  assert.equal(cambios.e1_limites, 'Límite 1: No invento.\n\nLímite 2: No exagero.');
  assert.equal(cambios.e4_antecedentes, 'Antecedente 1: Informe A\n\nAntecedente 3: Informe C');
  assert.equal(cambios.e4_tes_1, 'Al testigo 1: ¿Qué vio?');
  assert.equal(cambios.e4_tes_2, 'Al testigo 2: ¿Dónde estaba?');
  assert.equal(cambios[MARCA_MIGRACION], 'v2:fiscal');
  // Idempotente: aplicada una vez, no vuelve a cambiar.
  const migradas = { ...antiguas, ...cambios };
  assert.deepEqual(migrarRespuestas('fiscal', migradas).cambios, {});
  // Lo que no se trasladó se conserva y se muestra.
  const heredadas = respuestasHeredadas('fiscal', migradas).map((x) => x.id).sort();
  assert.deepEqual(heredadas, ['e1_importancia', 'e2_a3_antecedente', 'e4_t2_2', 'resp_postura'].sort());
  // Nunca pisa una respuesta nueva escrita por el estudiante.
  const conNueva = { ...antiguas, e1_limites: 'Mi texto nuevo' };
  assert.equal(migrarRespuestas('fiscal', conNueva).cambios.e1_limites, undefined);
  // El avance usa la vista migrada aunque el expediente no se haya vuelto a guardar.
  assert.equal(calcularProgreso({ personaje: 'fiscal' }, { respuestas: antiguas }).etapas[1].hechos, 2);
  assert.equal(respuestasVigentes('fiscal', antiguas).e1_limites, cambios.e1_limites);
});

test('migración: estudiante nuevo no recibe marcas ni cambios', () => {
  for (const p of LISTA_PERSONAJES) assert.deepEqual(migrarRespuestas(p.clave, {}).cambios, {});
  assert.equal(estadoDe({ respuestas: { [MARCA_MIGRACION]: 'v2:fiscal' } }), 'sin_iniciar');
});

test('genera un .docx real para cada personaje', async () => {
  const vm = await import('node:vm');
  vm.runInThisContext(`${readFileSync(join(raiz, 'vendor/docx.min.js'), 'utf8')}\n;globalThis.docx = docx;`);
  const docx = globalThis.docx;
  assert.ok(docx?.Packer, 'docx cargado');
  for (const p of LISTA_PERSONAJES) {
    const { blob, nombre } = await generarWord({ perfil: { personaje: p.clave, caso: 3, nombre: 'PRUEBA', apellido: 'UNO', nombreMostrar: 'Prueba Uno', curso: '3° A' }, respuestas: completar(p.clave), expediente: null }, docx);
    const bytes = new Uint8Array(await blob.arrayBuffer());
    assert.equal(String.fromCharCode(bytes[0], bytes[1]), 'PK', p.nombre);
    assert.match(nombre, /^Preparacion_Juicio_Caso-3_Uno_Prueba\.docx$/);
  }
});

test('ningún archivo publicado contiene la verdad narrativa de los casos', () => {
  // La aplicación no incluye expedientes ni fichas: solo estructura. Buscamos señales de contenido de casos.
  const archivos = [];
  const recorrer = (d) => readdirSync(d).forEach((n) => {
    const r = join(d, n);
    if (['vendor', 'assets', 'node_modules', '.git', 'tests'].includes(n)) return;
    if (statSync(r).isDirectory()) recorrer(r); else if (/\.(js|html|md|css)$/.test(n) && !n.endsWith('.bundle.js')) archivos.push(r);
  });
  recorrer(raiz);
  for (const a of archivos) {
    const t = readFileSync(a, 'utf8');
    assert.doesNotMatch(t, /(verdad narrativa|el culpable es|soluci[oó]n del caso|desenlace del caso [123])/i, a);
  }
});

test('personajes conocidos', () => {
  assert.equal(Object.keys(PERSONAJES).length, 10);
});
