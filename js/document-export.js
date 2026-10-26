/**
 * EXPORTACIÓN A WORD (.docx real, generado en el navegador con docx.js).
 * La biblioteca (vendor/docx.min.js) se carga solo cuando se descarga el primer documento.
 *
 * El documento contiene: encabezado institucional, datos del estudiante, y las secciones 1 a 5
 * (no incluye la actividad de práctica de la etapa 3 ni las ayudas desplegables).
 */

import {
  PERSONAJES, ETAPA1_CAMPOS, ETAPA2_TARJETAS, ETAPA2_DUDAS, ETAPA3_CAMPOS,
  estructuraEtapa4, seccionesRespaldo, esRequerido, RESPALDO_ADVERTENCIA,
} from './contenido.js';
import { DATOS_INSTITUCIONALES } from './config.js';
import { nombreArchivoSeguro, fechaHora, descargarBlob, capitalizar } from './util.js';

const BURDEOS = '853D37';
const TINTA = '30271F';
const GRIS = '6B6258';
const PAPEL = 'EFE6D2';
const FUENTE_TITULO = 'Georgia';
const FUENTE = 'Calibri';

/* ---------- Carga perezosa de docx ---------- */

let promesaDocx = null;
export function cargarDocx() {
  if (globalThis.docx) return Promise.resolve(globalThis.docx);
  if (globalThis.__cargarIncrustado) { const v = globalThis.__cargarIncrustado('docx'); if (v) return Promise.resolve(v); }
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

/* ---------- Nombres ---------- */

export function nombreArchivo(perfil) {
  const caso = perfil?.caso ? `Caso-${perfil.caso}` : 'Caso-SinAsignar';
  const ape = nombreArchivoSeguro(capitalizar(perfil?.apellido || '')) || 'Apellido';
  const nom = nombreArchivoSeguro(capitalizar(perfil?.nombre || '')) || 'Nombre';
  return `Preparacion_Juicio_${caso}_${ape}_${nom}.docx`;
}

/* ---------- Correo (mailto:; el archivo NO se puede adjuntar automáticamente) ---------- */

export function construirCorreo({ perfil }) {
  const nombre = perfil?.nombreMostrar || `${perfil?.nombre || ''} ${perfil?.apellido || ''}`.trim();
  const asunto = `Preparación juicio simulado – ${perfil?.caso ? `Caso ${perfil.caso}` : 'Caso sin asignar'} – ${perfil?.apellido || ''} ${perfil?.nombre || ''}`.replace(/\s+/g, ' ').trim();
  const cuerpo = [
    `Estimado profesor ${DATOS_INSTITUCIONALES.profesor}:`,
    '',
    `Le envío mi preparación individual para el juicio simulado.`,
    `Estudiante: ${nombre}`,
    `Curso: ${perfil?.curso || ''}`,
    `Caso: ${perfil?.caso || 'sin asignar'}`,
    `Personaje: ${PERSONAJES[perfil?.personaje]?.nombre || 'sin asignar'}`,
    '',
    `Archivo adjunto: ${nombreArchivo(perfil)}`,
    '(Recuerda adjuntar el archivo Word manualmente antes de enviar.)',
    '',
    'Saludos cordiales,',
    nombre,
  ].join('\r\n');
  const href = `mailto:${DATOS_INSTITUCIONALES.correoProfesor}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`;
  return { href, asunto, cuerpo };
}

/* ---------- Contenido ---------- */

const t = (v) => String(v ?? '').trim();

/** Estructura neutra del contenido (sin dependencias de docx) para poder probarla. */
export function armarContenido({ perfil, respuestas = {}, expediente }) {
  const resp = respuestas;
  const p = PERSONAJES[perfil?.personaje] || null;
  const secciones = [];

  const campo = (def, extra = {}) => {
    let respuesta = t(resp[def.id]);
    if (def.tipo === 'eleccion') respuesta = def.opciones.find((o) => o.valor === resp[def.id])?.texto || '';
    let etiqueta = def.etiqueta;
    if (def.refPregunta && t(resp[def.refPregunta])) etiqueta += ` (a tu pregunta: «${t(resp[def.refPregunta])}»)`;
    return { etiqueta, respuesta, opcional: def.opcional === true || (def.condicional && !esRequerido(def, resp)), ...extra };
  };

  if (p) secciones.push({ titulo: '1. Mi función', bloques: [{ campos: ETAPA1_CAMPOS.map((c) => campo(c)) }] });
  secciones.push({
    titulo: p ? '2. Los antecedentes' : '1. Los antecedentes',
    bloques: [
      ...ETAPA2_TARJETAS.map((tj) => ({ subtitulo: `Antecedente ${tj.n}`, campos: tj.campos.map((c) => campo(c)) })),
      { campos: [campo(ETAPA2_DUDAS)] },
    ],
  });
  secciones.push({
    titulo: p ? '3. Los límites de mi personaje' : '2. Los límites de mi personaje',
    bloques: [{ campos: p ? ETAPA3_CAMPOS.map((c) => campo(c)) : [] }],
    vacio: p ? null : 'Pendiente de asignación de personaje.',
  });
  if (p) {
    const est = estructuraEtapa4(perfil.personaje);
    secciones.push({
      titulo: `4. Mi preparación — ${est.titulo}`,
      bloques: est.apartados
        .filter((a) => typeof a.condicion !== 'function' || a.condicion(resp))
        .map((a) => ({ subtitulo: `${a.numero}. ${a.titulo}`, campos: a.campos.map((c) => campo(c)) })),
    });
    secciones.push({
      titulo: '5. Mi respaldo de continuidad',
      bloques: [{ campos: seccionesRespaldo(perfil.personaje).map((s) => campo({ id: s.campo, etiqueta: s.titulo })) }],
      nota: RESPALDO_ADVERTENCIA,
    });
  }

  const entregada = Boolean(expediente?.entregadoEn);
  const datos = [
    ['Estudiante', perfil?.nombreMostrar || `${perfil?.nombre || ''} ${perfil?.apellido || ''}`.trim()],
    ['Curso', perfil?.curso || ''],
    ['Caso', perfil?.caso ? `Caso ${perfil.caso}` : 'Pendiente de asignación'],
    ['Personaje', p ? p.nombre : 'Pendiente de asignación'],
    ['Estado', entregada ? `Entregada el ${fechaHora(expediente.entregadoEn)}${expediente.version > 1 ? ` (versión ${expediente.version})` : ''}` : 'En desarrollo (borrador)'],
    ['Documento generado', fechaHora(new Date())],
  ];
  if (entregada && expediente.editadoDespuesDeEntrega) datos.push(['Aviso', 'Existen ediciones posteriores a la fecha de entrega.']);
  return { datos, secciones, entregada, p };
}

/* ---------- Construcción del documento ---------- */

export function construirDocumento(docx, opciones) {
  const {
    Document, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, ShadingType, BorderStyle,
    AlignmentType, Header, Footer, PageNumber, HeadingLevel,
  } = docx;
  const { datos, secciones, entregada } = armarContenido(opciones);

  const run = (text, o = {}) => new TextRun({ text, font: FUENTE, size: 22, color: TINTA, ...o });
  const parrafosDeTexto = (texto, o = {}) =>
    String(texto).split(/\r?\n/).map((linea) => new Paragraph({ spacing: { after: 80, line: 276 }, children: [run(linea, o)] }));

  const bordeFino = { style: BorderStyle.SINGLE, size: 4, color: 'B9A57F' };
  const bordes = { top: bordeFino, bottom: bordeFino, left: bordeFino, right: bordeFino };

  const tablaDatos = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: datos.map(([k, v]) => new TableRow({
      children: [
        new TableCell({ width: { size: 28, type: WidthType.PERCENTAGE }, borders: bordes, shading: { type: ShadingType.CLEAR, fill: PAPEL, color: 'auto' },
          margins: { top: 60, bottom: 60, left: 120, right: 120 },
          children: [new Paragraph({ children: [run(k.toUpperCase(), { bold: true, size: 18, color: BURDEOS, font: 'Courier New' })] })] }),
        new TableCell({ width: { size: 72, type: WidthType.PERCENTAGE }, borders: bordes, margins: { top: 60, bottom: 60, left: 120, right: 120 },
          children: [new Paragraph({ children: [run(v)] })] }),
      ],
    })),
  });

  // Pregunta y respuesta en una tabla de dos filas: se distinguen a simple vista.
  const preguntaRespuesta = ({ etiqueta, respuesta, opcional }) => new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({ cantSplit: true, children: [new TableCell({
        borders: bordes, shading: { type: ShadingType.CLEAR, fill: PAPEL, color: 'auto' }, margins: { top: 60, bottom: 60, left: 140, right: 140 },
        children: [new Paragraph({ keepNext: true, children: [run(etiqueta, { bold: true }), opcional ? run('  (opcional)', { size: 18, color: GRIS }) : run('')] })],
      })] }),
      new TableRow({ children: [new TableCell({
        borders: bordes, margins: { top: 80, bottom: 80, left: 140, right: 140 },
        children: respuesta ? parrafosDeTexto(respuesta) : [new Paragraph({ children: [run('(sin responder)', { italics: true, color: GRIS })] })],
      })] }),
    ],
  });
  const separador = () => new Paragraph({ spacing: { after: 120 }, children: [] });

  const hijos = [];
  hijos.push(new Paragraph({
    alignment: AlignmentType.CENTER, spacing: { before: 120, after: 160 },
    children: [new TextRun({ text: 'PREPARACIÓN INDIVIDUAL — JUICIO SIMULADO', font: FUENTE_TITULO, bold: true, size: 34, color: TINTA })],
  }));
  if (!entregada) {
    hijos.push(new Paragraph({
      alignment: AlignmentType.CENTER, spacing: { after: 200 },
      border: { top: { style: BorderStyle.SINGLE, size: 12, color: BURDEOS }, bottom: { style: BorderStyle.SINGLE, size: 12, color: BURDEOS } },
      children: [new TextRun({ text: 'BORRADOR — aún no entregado', font: 'Courier New', bold: true, size: 24, color: BURDEOS })],
    }));
  }
  hijos.push(tablaDatos, separador());

  for (const s of secciones) {
    hijos.push(new Paragraph({
      heading: HeadingLevel.HEADING_1, spacing: { before: 320, after: 140 }, keepNext: true,
      border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: BURDEOS, space: 2 } },
      children: [new TextRun({ text: s.titulo, font: FUENTE_TITULO, bold: true, size: 28, color: BURDEOS })],
    }));
    if (s.vacio) hijos.push(new Paragraph({ children: [run(s.vacio, { italics: true, color: GRIS })] }));
    for (const b of s.bloques) {
      if (b.subtitulo) {
        hijos.push(new Paragraph({
          heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 100 }, keepNext: true,
          children: [new TextRun({ text: b.subtitulo, font: FUENTE_TITULO, bold: true, size: 24, color: TINTA })],
        }));
      }
      for (const c of b.campos) hijos.push(preguntaRespuesta(c), separador());
    }
    if (s.nota) hijos.push(new Paragraph({ spacing: { before: 60 }, children: [run(s.nota, { italics: true, size: 19, color: GRIS })] }));
  }

  const encabezado = new Header({
    children: [
      ...['LICEO LUIS URBINA FLORES', 'DEPARTAMENTO DE HISTORIA', `PROFESOR ${DATOS_INSTITUCIONALES.profesor.toUpperCase()}`].map((linea, i) =>
        new Paragraph({ alignment: AlignmentType.LEFT, spacing: { after: 0 }, children: [new TextRun({ text: linea, font: 'Courier New', bold: i === 0, size: 18, color: i === 0 ? BURDEOS : GRIS })] })),
      new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: 'B9A57F', space: 4 } }, children: [] }),
    ],
  });
  const pie = new Footer({
    children: [new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ children: ['Página ', PageNumber.CURRENT, ' de ', PageNumber.TOTAL_PAGES], font: FUENTE, size: 18, color: GRIS })],
    })],
  });

  return new Document({
    creator: DATOS_INSTITUCIONALES.profesor,
    title: 'Preparación individual — Juicio simulado',
    description: 'Documento generado desde Mi expediente judicial',
    styles: { default: { document: { run: { font: FUENTE, size: 22 } } } },
    sections: [{
      properties: { page: { margin: { top: 1500, bottom: 1200, left: 1300, right: 1300 } } },
      headers: { default: encabezado },
      footers: { default: pie },
      children: hijos,
    }],
  });
}

/* ---------- API pública ---------- */

/** Genera el .docx y devuelve { blob, nombre }. `docxLib` solo se usa en pruebas de Node. */
export async function generarWord(opciones, docxLib) {
  const docx = docxLib || await cargarDocx();
  const doc = construirDocumento(docx, opciones);
  const blob = await docx.Packer.toBlob(doc);
  return { blob, nombre: nombreArchivo(opciones.perfil) };
}

/** Genera y descarga el Word del estudiante. Devuelve el nombre del archivo. */
export async function descargarWord(opciones) {
  const { blob, nombre } = await generarWord(opciones);
  descargarBlob(blob, nombre);
  return nombre;
}
