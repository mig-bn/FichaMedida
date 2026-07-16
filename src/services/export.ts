import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Ficha, ExportPayload } from '../types/ficha';
import { listarFichas } from './storage';

export function construirExportPayload(fichas: Ficha[]): ExportPayload {
  return {
    schemaVersion: 2,
    exportadoEn: new Date().toISOString(),
    fichas,
  };
}

async function escribirYCompartirPayload(payload: ExportPayload, nombreArchivo: string, dialogTitle: string): Promise<void> {
  const uri = `${FileSystem.cacheDirectory}${nombreArchivo}`;

  await FileSystem.writeAsStringAsync(uri, JSON.stringify(payload, null, 2));

  const disponible = await Sharing.isAvailableAsync();
  if (!disponible) {
    throw new Error('Compartir archivos no está disponible en este dispositivo');
  }
  await Sharing.shareAsync(uri, {
    mimeType: 'application/json',
    dialogTitle,
  });
}

export async function exportarTodasLasFichas(): Promise<void> {
  const fichas = await listarFichas();
  const payload = construirExportPayload(fichas);
  await escribirYCompartirPayload(payload, `fichamedidam_export_${Date.now()}.json`, 'Exportar fichas');
}

export async function exportarFichas(fichas: Ficha[]): Promise<void> {
  const payload = construirExportPayload(fichas);
  let nombreArchivo: string;
  if (fichas.length === 1) {
    const nombre = fichas[0].nombre.trim().replace(/\s+/g, '_') || 'sin_nombre';
    nombreArchivo = `fichamedidam_${nombre}_${Date.now()}.json`;
  } else {
    nombreArchivo = `fichamedidam_export_${fichas.length}fichas_${Date.now()}.json`;
  }
  const dialogTitle = fichas.length === 1 ? 'Exportar ficha' : 'Exportar fichas';
  await escribirYCompartirPayload(payload, nombreArchivo, dialogTitle);
}
