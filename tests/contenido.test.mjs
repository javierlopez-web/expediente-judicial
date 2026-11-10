// node --test tests/contenido.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { LISTA_PERSONAJES, secciones, avance, idsDe, camposTrabajo, rubrica, entregaVigente } from '../js/contenido.js';

test('cada personaje tiene su trabajo escrito, ids únicos y rúbrica de 40 puntos', () => {
  for (const p of LISTA_PERSONAJES) {
    assert.ok(camposTrabajo(p.clave).length >= 5, p.clave);
    const ids = secciones(p.clave).flatMap((s) => s.campos.flatMap(idsDe));
    assert.equal(new Set(ids).size, ids.length, p.clave);
    assert.ok(ids.every((id) => id.startsWith('te')), p.clave);
    assert.equal(rubrica(p.clave).reduce((s, r) => s + r[3], 0), 40, p.clave);
  }
});

test('víctima y testigos comparten las mismas preguntas', () => {
  assert.equal(camposTrabajo('victima'), camposTrabajo('testigo1'));
  assert.equal(camposTrabajo('victima'), camposTrabajo('testigo2'));
  assert.equal(camposTrabajo('victima').length, 7);
});

test('el avance sube al responder y no cuenta respuestas antiguas', () => {
  assert.equal(avance('fiscal', {}).preparacion, 0);
  assert.equal(avance('fiscal', { a1: 'antigua', a3: 'antigua' }).preparacion, 0);
  assert.ok(avance('fiscal', { te1: 'Teoría' }).preparacion > 0);
});

test('una entrega anterior al 9-11-2026 no cuenta como entrega del trabajo escrito', () => {
  assert.equal(entregaVigente({ entregadoEn: new Date('2026-11-05T12:00:00Z') }), false);
  assert.equal(entregaVigente({ entregadoEn: new Date('2026-11-10T12:00:00Z') }), true);
  assert.equal(entregaVigente({}), false);
});
