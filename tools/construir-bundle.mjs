// Regenera js/app.bundle.js: un solo archivo clásico (IIFE) para abrir index.html con doble clic (file://),
// donde el navegador bloquea los módulos ES. En http(s) se usan los módulos de js/ directamente.
import { build } from 'esbuild';
await build({ entryPoints: ['../js/app.js'], bundle: true, format: 'iife', outfile: '../js/app.bundle.js', target: 'es2020', legalComments: 'none' });
console.log('js/app.bundle.js listo');
