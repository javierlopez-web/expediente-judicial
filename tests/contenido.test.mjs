// node --test tests/contenido.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { LISTA_PERSONAJES, secciones, avance, idsDe, camposA } from '../js/contenido.js';

test('cada personaje tiene preguntas y los ids no se repiten', () => {
  for (const p of LISTA_PERSONAJES) {
    assert.ok(camposA(p.clave).length >= 4, p.clave);
    const ids = secciones(p.clave).flatMap((s) => s.campos.flatMap(idsDe));
    assert.equal(new Set(ids).size, ids.length, p.clave);
  }
});

test('el avance sube al responder y el acusado en silencio no necesita relato', () => {
  assert.equal(avance('fiscal', {}).preparacion, 0);
  assert.ok(avance('fiscal', { a1: 'Teoría' }).preparacion > 0);
  const sinSilencio = avance('acusado', {}).totalP;
  const conSilencio = avance('acusado', { a1: 'silencio' }).totalP;
  assert.equal(conSilencio, sinSilencio - 1);
});
