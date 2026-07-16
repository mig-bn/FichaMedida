import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Boceto, Contextura, Ficha, GRUPOS_MEDIDAS, Medidas } from '../types/ficha';
import { construirPathSvg } from '../utils/boceto';
import { aspectoDe, imagenDe } from '../components/siluetas/Silueta';
import { solicitarPermisoConGuia } from './guiaCarpetaBridge';

// Carpeta (dentro de la elegida por el usuario) donde se guardan todos los PDFs.
const NOMBRE_SUBCARPETA = 'FichasApp';
// Clave en AsyncStorage con la URI de esa subcarpeta, para pedir el permiso
// una sola vez y guardar automáticamente las siguientes veces.
const CLAVE_CARPETA_GUARDADO = 'pdfStorageDirectoryUri';

// Ancho al que se redimensiona la silueta antes de incrustarla en el PDF.
// Las imágenes de origen pesan ~1.1-1.2MB: incrustarlas completas como base64
// en el HTML supera límites de transferencia nativos (p. ej. el límite de
// transacción Binder de ~1MB en Android) e impide generar el PDF. Redimensionar
// aquí reduce el payload a unos pocos KB.
const BOCETO_ANCHO_PX = 220;

function altoBocetoPx(contextura: Contextura): number {
  return Math.round(BOCETO_ANCHO_PX / aspectoDe(contextura));
}

async function obtenerSiluetaBase64(contextura: Contextura): Promise<string> {
  const asset = Asset.fromModule(imagenDe(contextura));
  await asset.downloadAsync();
  const contexto = ImageManipulator.manipulate(asset.localUri ?? asset.uri).resize({
    width: BOCETO_ANCHO_PX,
  });
  const imagenRenderizada = await contexto.renderAsync();
  const { base64 } = await imagenRenderizada.saveAsync({
    format: SaveFormat.JPEG,
    compress: 0.7,
    base64: true,
  });
  return `data:image/jpeg;base64,${base64}`;
}

function escaparHtml(texto: string): string {
  return texto.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Orden de los grupos de medidas SOLO en el PDF (la plantilla de referencia va
// Torso → Pantalón/Short/Falda → Blusa y Mangas). El formulario sigue su propio orden.
const ORDEN_GRUPOS_PDF = ['Torso', 'Pantalón, Short y Falda', 'Blusa y Mangas'];

export function datosGeneralesHtml(ficha: Ficha): string {
  const contextura = ficha.contextura === 'femenina' ? 'Femenina' : 'Masculina';
  const tiro = ficha.tiro != null ? `${ficha.tiro} cm` : '-';
  const filas: [string, string, string, string][] = [
    ['Nombre', ficha.nombre || '-', 'Fecha', ficha.fecha],
    ['Cliente', ficha.cliente || '-', 'Contextura', contextura],
    ['Referencia', ficha.referencia || '-', 'Tiro', tiro],
  ];
  return `<table class="datos">${filas
    .map(
      ([l1, v1, l2, v2]) =>
        `<tr><td class="lbl">${l1}</td><td>${escaparHtml(v1)}</td><td class="lbl">${l2}</td><td>${escaparHtml(v2)}</td></tr>`
    )
    .join('')}</table>`;
}

export function medidasATablaHtml(medidas: Medidas): string {
  const gruposOrdenados = ORDEN_GRUPOS_PDF.map((titulo) =>
    GRUPOS_MEDIDAS.find((g) => g.titulo === titulo)
  ).filter((g): g is (typeof GRUPOS_MEDIDAS)[number] => g !== undefined);

  return gruposOrdenados
    .map(
      (grupo) => `
      <table class="medidas">
        <tr><th colspan="2">${grupo.titulo}</th></tr>
        ${grupo.campos
          .map((campo) => {
            const valor = medidas[campo.key];
            return `<tr><td>${campo.label}</td><td>${valor != null ? `${valor} cm` : '-'}</td></tr>`;
          })
          .join('')}
      </table>`
    )
    .join('');
}

export function telasColoresValorHtml(ficha: Ficha): string {
  const filasTelas = ficha.telas.length
    ? ficha.telas
        .map(
          (t) =>
            `<tr><td>${escaparHtml(t.tipo)}</td><td>${escaparHtml(t.color?.trim() || '-')}</td></tr>`
        )
        .join('')
    : `<tr><td colspan="2">Sin telas</td></tr>`;
  const filasColores = ficha.colores.length
    ? ficha.colores.map((c) => `<tr><td>${escaparHtml(c)}</td></tr>`).join('')
    : `<tr><td>Sin colores</td></tr>`;
  const valor = ficha.valorTotal != null ? String(ficha.valorTotal) : '-';

  return `
    <div class="pagina2">
      <h1>Telas, colores y valor</h1>
      <div class="seccion-titulo">Telas</div>
      <table class="lista">
        <tr><th>Tipo</th><th>Color</th></tr>
        ${filasTelas}
      </table>
      <div class="seccion-titulo">Colores</div>
      <table class="lista">${filasColores}</table>
      <div class="seccion-titulo">Valor total</div>
      <table class="lista"><tr><td>${escaparHtml(valor)}</td></tr></table>
    </div>`;
}

export function bocetoTrazosSvg(boceto: Boceto, ancho: number, alto: number): string {
  const paths = boceto.trazos
    .map(
      (trazo) =>
        `<path d="${construirPathSvg(trazo.puntos, ancho, alto)}" stroke="${trazo.color}" stroke-width="${trazo.ancho}" fill="none" stroke-linecap="round" stroke-linejoin="round" />`
    )
    .join('');
  return `<svg width="${ancho}" height="${alto}" viewBox="0 0 ${ancho} ${alto}" xmlns="http://www.w3.org/2000/svg">${paths}</svg>`;
}

const ESTILOS = `
  body { font-family: Helvetica, Arial, sans-serif; padding: 20px; color: #111; }
  h1 { font-size: 18px; text-align: center; border: 1px solid #111; padding: 6px; margin: 0 0 12px; }
  table { border-collapse: collapse; width: 100%; }
  table.datos { margin-bottom: 12px; }
  table.datos td { border: 1px solid #111; padding: 3px 6px; font-size: 11px; }
  table.datos td.lbl { font-weight: 700; width: 16%; }
  .hoja { display: flex; gap: 12px; align-items: stretch; }
  .col-medidas { width: 44%; }
  .col-derecha { width: 56%; display: flex; flex-direction: column; }
  .seccion-titulo {
    text-align: center; font-weight: 700; font-size: 13px;
    border: 1px solid #111; padding: 3px; margin-bottom: 0;
  }
  table.medidas { margin-bottom: 10px; }
  table.medidas td, table.medidas th { border: 1px solid #111; padding: 2px 6px; font-size: 11px; }
  table.medidas td:first-child { width: 62%; }
  table.medidas th { text-align: center; font-size: 12px; background: #f0f0f0; }
  .boceto { position: relative; margin: 8px auto; }
  .boceto img, .boceto svg { position: absolute; top: 0; left: 0; }
  .notas-caja {
    border: 1px solid #111; border-top: none; flex: 1;
    min-height: 200px; padding: 6px; font-size: 12px; white-space: pre-wrap;
  }
  .pagina2 { page-break-before: always; padding-top: 8px; }
  table.lista { margin-bottom: 14px; }
  table.lista td, table.lista th { border: 1px solid #111; padding: 4px 8px; font-size: 12px; }
  table.lista th { background: #f0f0f0; text-align: left; }
`;

export async function generarHtmlFicha(ficha: Ficha): Promise<string> {
  const alto = altoBocetoPx(ficha.contextura);
  const siluetaBase64 = await obtenerSiluetaBase64(ficha.contextura);
  const svgTrazos = bocetoTrazosSvg(ficha.boceto, BOCETO_ANCHO_PX, alto);

  return `<!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <style>${ESTILOS}</style>
      </head>
      <body>
        <h1>Ficha de Medidas</h1>
        ${datosGeneralesHtml(ficha)}
        <div class="hoja">
          <div class="col-medidas">
            <div class="seccion-titulo">Medidas</div>
            ${medidasATablaHtml(ficha.medidas)}
          </div>
          <div class="col-derecha">
            <div class="boceto" style="width:${BOCETO_ANCHO_PX}px;height:${alto}px;">
              <img src="${siluetaBase64}" width="${BOCETO_ANCHO_PX}" height="${alto}" />
              ${svgTrazos}
            </div>
            <div class="seccion-titulo">Notas</div>
            <div class="notas-caja">${escaparHtml(ficha.notas || '')}</div>
          </div>
        </div>
        ${telasColoresValorHtml(ficha)}
      </body>
    </html>`;
}

export async function generarPdfFicha(ficha: Ficha): Promise<{ uri: string; base64: string }> {
  const html = await generarHtmlFicha(ficha);
  // Se pide el base64 en la misma llamada: el archivo que deja printToFileAsync
  // en cache/Print/ en Android queda con permisos del framework de impresión y
  // la propia app no puede releerlo después (java.io.IOException: isn't readable).
  const { uri, base64 } = await Print.printToFileAsync({
    html,
    width: 612,
    height: 792,
    base64: true,
  });
  if (!base64) {
    throw new Error('No se pudo obtener el contenido del PDF generado.');
  }
  return { uri, base64 };
}

async function obtenerOCrearSubcarpeta(directorioBaseUri: string): Promise<string> {
  const hijos = await FileSystem.StorageAccessFramework.readDirectoryAsync(directorioBaseUri);
  const existente = hijos.find((uri) => decodeURIComponent(uri).endsWith(`/${NOMBRE_SUBCARPETA}`));
  if (existente) return existente;
  return FileSystem.StorageAccessFramework.makeDirectoryAsync(directorioBaseUri, NOMBRE_SUBCARPETA);
}

/**
 * Pide permiso de carpeta UNA vez (el selector abre directo en "Download"),
 * crea/reutiliza la subcarpeta "FichasApp" dentro de ella y guarda su URI en
 * AsyncStorage para que las siguientes veces no se vuelva a pedir permiso.
 */
export async function configurarCarpetaGuardado(): Promise<string> {
  const carpetaDescargas = FileSystem.StorageAccessFramework.getUriForDirectoryInRoot('Download');
  const permisos = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync(carpetaDescargas);
  if (!permisos.granted) {
    throw new Error('No se otorgó permiso para elegir la carpeta de guardado.');
  }
  const carpetaFichasApp = await obtenerOCrearSubcarpeta(permisos.directoryUri);
  await AsyncStorage.setItem(CLAVE_CARPETA_GUARDADO, carpetaFichasApp);
  return carpetaFichasApp;
}

async function crearYEscribirPdf(carpetaUri: string, nombreArchivo: string, base64: string): Promise<string> {
  const uriDestino = await FileSystem.StorageAccessFramework.createFileAsync(
    carpetaUri,
    nombreArchivo,
    'application/pdf'
  );
  await FileSystem.writeAsStringAsync(uriDestino, base64, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return uriDestino;
}

export async function guardarPdfFicha(ficha: Ficha): Promise<{ uri: string }> {
  const { uri, base64 } = await generarPdfFicha(ficha);
  const nombreArchivo = `Ficha_${ficha.nombre.trim().replace(/\s+/g, '_') || 'sin_nombre'}`;

  if (Platform.OS !== 'android') {
    const disponible = await Sharing.isAvailableAsync();
    if (!disponible) {
      throw new Error('Compartir archivos no está disponible en este dispositivo');
    }
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: 'Compartir ficha en PDF',
    });
    return { uri };
  }

  let carpeta = await AsyncStorage.getItem(CLAVE_CARPETA_GUARDADO);

  if (carpeta) {
    try {
      const uriDestino = await crearYEscribirPdf(carpeta, nombreArchivo, base64);
      return { uri: uriDestino };
    } catch {
      // Permiso revocado o carpeta eliminada: hay que volver a configurarla.
      await AsyncStorage.removeItem(CLAVE_CARPETA_GUARDADO);
      carpeta = null;
    }
  }

  const concedido = await solicitarPermisoConGuia();
  if (!concedido) {
    throw new Error('No se configuró una carpeta para guardar el PDF.');
  }
  const carpetaConfigurada = await AsyncStorage.getItem(CLAVE_CARPETA_GUARDADO);
  if (!carpetaConfigurada) {
    throw new Error('No se configuró una carpeta para guardar el PDF.');
  }
  const uriDestino = await crearYEscribirPdf(carpetaConfigurada, nombreArchivo, base64);
  return { uri: uriDestino };
}

export async function imprimirFicha(ficha: Ficha): Promise<void> {
  const html = await generarHtmlFicha(ficha);
  await Print.printAsync({ html });
}
