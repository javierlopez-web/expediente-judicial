// Regenera vendor/firebase.bundle.js (módulo ES minificado) con las funciones listadas en firebase-entrada.mjs.
import { build } from 'esbuild';
import { readFileSync, writeFileSync } from 'node:fs';
await build({ entryPoints: ['firebase-entrada.mjs'], bundle: true, format: 'esm', minify: true, outfile: '../vendor/firebase.bundle.js', target: 'es2020', legalComments: 'none' });
const v = JSON.parse(readFileSync('node_modules/firebase/package.json', 'utf8')).version;
const txt = readFileSync('../vendor/VERSIONES.txt', 'utf8').replace(/firebase [\d.]+/, `firebase ${v}`).replace(/Generado con .*/, 'Generado con tools/construir-vendor.mjs (firebase) · docx y jszip sin cambios');
writeFileSync('../vendor/VERSIONES.txt', txt);
console.log('vendor/firebase.bundle.js listo · firebase', v);
