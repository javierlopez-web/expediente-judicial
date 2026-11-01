/**
 * EXPORTACIÓN A WORD (.docx real, generado en el navegador con docx.js).
 * El mismo documento lo descarga el estudiante y el profesor (uno por uno o todos en un ZIP).
 * Contiene solo lo que el estudiante escribió, en el orden de su índice: A, B y C.
 */

import { PERSONAJES, NOMBRE_CASOS, secciones, idsDe } from './contenido.js';
import { nombreArchivoSeguro, fechaHora, descargarBlob, capitalizar } from './util.js';

const BURDEOS = '853D37';
const TINTA = '30271F';
const GRIS = '7A6F63';
const CREMA = 'F3ECDD';

let promesaDocx = null;
export function cargarDocx() {
  if (globalThis.docx) return Promise.resolve(globalThis.docx);
  if (!promesaDocx) {
    promesaDocx = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = new URL('vendor/docx.min.js', document.baseURI).href;
      s.onload = () => (globalThis.docx ? resolve(globalThis.docx) : reject(new Error('El generador de Word no se inicializó.')));
      s.onerror = () => { promesaDocx = null; reject(new Error('No se pudo cargar el generador de Word (vendor/docx.min.js).')); };
      document.head.append(s);
    });
  }
  return promesaDocx;
}

export function nombreArchivo(perfil) {
  const caso = perfil?.caso ? `Caso${perfil.caso}` : 'SinCaso';
  const per = nombreArchivoSeguro(PERSONAJES[perfil?.personaje]?.nombre || 'SinPersonaje');
  const ape = nombreArchivoSeguro(capitalizar(perfil?.apellido || '')) || 'Apellido';
  const nom = nombreArchivoSeguro(capitalizar(perfil?.nombre || '')) || 'Nombre';
  return `${caso}_${per}_${ape}_${nom}.docx`;
}

const t = (v) => String(v ?? '').trim();

/** Estructura neutra (sin docx) del documento: también la usa el panel para «Ver». */
export function estructuraDocumento(perfil, resp = {}) {
  const clave = perfil?.personaje;
  const out = [];
  for (const s of secciones(clave)) {
    if (!s.campos.length) continue;
    const algo = s.campos.some((c) => idsDe(c).some((id) => t(resp[id])));
    if (s.despues && !algo) continue; // el bloque C solo aparece si tiene algo escrito
    out.push({
      titulo: s.titulo,
      campos: s.campos.map((c) => {
        if (c.tipo === 'texto') return { titulo: c.titulo, tipo: 'texto', valor: t(resp[c.id]) };
        if (c.tipo === 'opciones') return { titulo: c.titulo, tipo: 'texto', valor: (c.opciones.find(([v]) => v === resp[c.id]) || [])[1] || '' };
        if (c.tipo === 'lista') return { titulo: c.titulo, tipo: 'lista', items: idsDe(c).map((id) => t(resp[id])).filter(Boolean) };
        const etiquetas = c.tipo === 'tablaFija' ? c.filasFijas : null;
        const nf = etiquetas ? etiquetas.length : c.filas;
        const filas = [];
        for (let f = 1; f <= nf; f++) {
          const celdas = c.columnas.map((_, k) => t(resp[`${c.id}_r${f}_c${k + 1}`]));
          if (etiquetas) filas.push([etiquetas[f - 1], ...celdas]);
          else if (celdas.some(Boolean)) filas.push(celdas);
        }
        return { titulo: c.titulo, tipo: 'tabla', columnas: etiquetas ? ['', ...c.columnas] : c.columnas, filas, vacia: !filas.some((r) => r.slice(etiquetas ? 1 : 0).some(Boolean)) };
      }),
    });
  }
  return out;
}

function construir(docx, perfil, resp, meta = {}) {
  const { Document, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, BorderStyle, ShadingType, AlignmentType } = docx;
  const p = (texto, o = {}) => new Paragraph({ spacing: { after: o.after ?? 80 }, ...o.par, children: [new TextRun({ text: texto, font: 'Calibri', size: o.size || 22, color: o.color || TINTA, bold: o.bold, italics: o.italics })] });
  const vacio = () => p('(sin responder)', { italics: true, color: GRIS });
  const borde = { style: BorderStyle.SINGLE, size: 4, color: 'C9B99A' };
  const bordes = { top: borde, bottom: borde, left: borde, right: borde };
  const celda = (texto, o = {}) => new TableCell({
    borders: bordes, shading: o.fondo ? { type: ShadingType.CLEAR, color: 'auto', fill: o.fondo } : undefined,
    margins: { top: 60, bottom: 60, left: 90, right: 90 },
    children: String(texto || '').split('\n').map((linea) => p(linea, { after: 20, bold: o.bold, size: 20, color: o.color })),
  });
  const tabla = (columnas, filas) => new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      ...(columnas.some(Boolean) ? [new TableRow({ tableHeader: true, children: columnas.map((c) => celda(c, { bold: true, fondo: CREMA })) })] : []),
      ...filas.map((r) => new TableRow({ children: r.map((c, i) => celda(c, { bold: !columnas[0] && i === 0 })) })),
    ],
  });

  const caso = perfil?.caso ? `Caso ${perfil.caso} · ${NOMBRE_CASOS[perfil.caso]}` : 'Sin asignar';
  const hijos = [
    p('MI EXPEDIENTE JUDICIAL', { bold: true, size: 30, color: TINTA, after: 40 }),
    p('Preparación individual para el juicio simulado', { color: BURDEOS, size: 22, after: 200 }),
    tabla(['', ''], [
      ['Estudiante', `${perfil?.nombre || ''} ${perfil?.apellido || ''}`.trim()],
      ['Caso', caso],
      ['Personaje', PERSONAJES[perfil?.personaje]?.nombre || 'Sin asignar'],
      ['Estado', meta.entregadoEn ? `Entregada el ${fechaHora(meta.entregadoEn)}` : 'Borrador (no entregada)'],
    ]),
  ];
  for (const s of estructuraDocumento(perfil, resp)) {
    hijos.push(p(s.titulo.toUpperCase(), { bold: true, size: 26, color: BURDEOS, after: 120, par: { spacing: { before: 360, after: 120 } } }));
    s.campos.forEach((c, i) => {
      hijos.push(p(`${i + 1}. ${c.titulo}`, { bold: true, size: 22, par: { spacing: { before: 180, after: 60 }, keepNext: true } }));
      if (c.tipo === 'texto') { if (c.valor) c.valor.split('\n').forEach((l) => hijos.push(p(l))); else hijos.push(vacio()); }
      else if (c.tipo === 'lista') { if (c.items.length) c.items.forEach((it) => hijos.push(p(`•  ${it}`))); else hijos.push(vacio()); }
      else if (c.vacia) hijos.push(vacio());
      else hijos.push(tabla(c.columnas, c.filas));
    });
  }
  hijos.push(p(`Descargado el ${fechaHora(new Date())}`, { italics: true, color: GRIS, size: 18, par: { spacing: { before: 360 }, alignment: AlignmentType.RIGHT } }));
  return new Document({
    creator: 'Mi expediente judicial', title: nombreArchivo(perfil).replace('.docx', ''),
    sections: [{ properties: { page: { margin: { top: 1000, bottom: 1000, left: 1100, right: 1100 } } }, children: hijos }],
  });
}

export async function generarBlob(perfil, resp, meta) {
  const docx = await cargarDocx();
  return docx.Packer.toBlob(construir(docx, perfil, resp, meta));
}

export async function descargarWord({ perfil, respuestas, expediente }) {
  const blob = await generarBlob(perfil, respuestas || expediente?.respuestas || {}, { entregadoEn: expediente?.entregadoEn });
  descargarBlob(blob, nombreArchivo(perfil));
}
