import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { ExportPayload, Ficha } from '../types/ficha';
import { crearFicha, normalizarFicha, NuevaFichaInput } from './storage';

export function validarPayloadImportado(json: unknown): ExportPayload {
  if (
    typeof json !== 'object' ||
    json === null ||
    !Array.isArray((json as { fichas?: unknown }).fichas)
  ) {
    throw new Error('El archivo no tiene el formato esperado (debe ser un JSON exportado desde esta app).');
  }
  return json as ExportPayload;
}

export async function importarFichasDesdePayload(payload: ExportPayload): Promise<Ficha[]> {
  const importadas: Ficha[] = [];
  for (const raw of payload.fichas) {
    const normalizada = normalizarFicha(raw);
    const {
      id: _id,
      schemaVersion: _schemaVersion,
      creadoEn: _creadoEn,
      actualizadoEn: _actualizadoEn,
      ...datos
    } = normalizada;
    const nueva = await crearFicha(datos as NuevaFichaInput);
    importadas.push(nueva);
  }
  return importadas;
}

export async function importarFichasDesdeArchivo(): Promise<Ficha[]> {
  const resultado = await DocumentPicker.getDocumentAsync({
    type: '*/*',
    copyToCacheDirectory: true,
  });
  if (resultado.canceled || !resultado.assets || resultado.assets.length === 0) {
    return [];
  }

  const contenido = await FileSystem.readAsStringAsync(resultado.assets[0].uri);
  let json: unknown;
  try {
    json = JSON.parse(contenido);
  } catch {
    throw new Error('El archivo elegido no es un JSON válido.');
  }

  const payload = validarPayloadImportado(json);
  return importarFichasDesdePayload(payload);
}
