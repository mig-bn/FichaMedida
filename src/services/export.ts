import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Ficha, ExportPayload } from '../types/ficha';
import { listarFichas } from './storage';

export function construirExportPayload(fichas: Ficha[]): ExportPayload {
  return {
    schemaVersion: 1,
    exportadoEn: new Date().toISOString(),
    fichas,
  };
}

export async function exportarTodasLasFichas(): Promise<void> {
  const fichas = await listarFichas();
  const payload = construirExportPayload(fichas);
  const nombreArchivo = `fichamedidam_export_${Date.now()}.json`;
  const uri = `${FileSystem.cacheDirectory}${nombreArchivo}`;

  await FileSystem.writeAsStringAsync(uri, JSON.stringify(payload, null, 2));

  const disponible = await Sharing.isAvailableAsync();
  if (!disponible) {
    throw new Error('Compartir archivos no está disponible en este dispositivo');
  }
  await Sharing.shareAsync(uri, {
    mimeType: 'application/json',
    dialogTitle: 'Exportar fichas',
  });
}
