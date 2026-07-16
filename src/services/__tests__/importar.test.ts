jest.mock('expo-document-picker', () => ({
  getDocumentAsync: jest.fn(),
}));
jest.mock('expo-file-system/legacy', () => ({
  readAsStringAsync: jest.fn(),
}));
jest.mock('../storage', () => ({
  crearFicha: jest.fn(),
  normalizarFicha: jest.fn(),
}));

import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { crearFicha, normalizarFicha } from '../storage';
import { crearMedidasVacias, crearBocetoVacio, Ficha } from '../../types/ficha';
import {
  validarPayloadImportado,
  importarFichasDesdePayload,
  importarFichasDesdeArchivo,
} from '../importar';

const fichaEjemplo: Ficha = {
  id: 'id-original',
  schemaVersion: 2,
  nombre: 'Ana Pérez',
  cliente: 'Ana Pérez',
  referencia: 'Vestido de gala',
  fecha: '2026-07-01',
  medidas: crearMedidasVacias(),
  tiro: null,
  telas: [],
  colores: [],
  notas: '',
  valorTotal: null,
  contextura: 'femenina',
  boceto: crearBocetoVacio(),
  creadoEn: '2026-07-01T00:00:00.000Z',
  actualizadoEn: '2026-07-01T00:00:00.000Z',
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('validarPayloadImportado', () => {
  it('acepta un objeto con la propiedad fichas como arreglo', () => {
    expect(() => validarPayloadImportado({ schemaVersion: 2, fichas: [] })).not.toThrow();
  });

  it('rechaza null, objetos sin "fichas" o con "fichas" que no es arreglo', () => {
    expect(() => validarPayloadImportado(null)).toThrow();
    expect(() => validarPayloadImportado({})).toThrow();
    expect(() => validarPayloadImportado({ fichas: 'no es un arreglo' })).toThrow();
    expect(() => validarPayloadImportado('texto cualquiera')).toThrow();
  });
});

describe('importarFichasDesdePayload', () => {
  it('normaliza cada ficha y la crea de nuevo (sin reusar id/fechas originales)', async () => {
    jest.mocked(normalizarFicha).mockImplementation((raw) => raw as Ficha);
    jest.mocked(crearFicha).mockResolvedValue({ ...fichaEjemplo, id: 'id-nuevo' });

    const resultado = await importarFichasDesdePayload({
      schemaVersion: 2,
      exportadoEn: '2026-07-01T00:00:00.000Z',
      fichas: [fichaEjemplo],
    });

    expect(normalizarFicha).toHaveBeenCalledWith(fichaEjemplo);
    expect(crearFicha).toHaveBeenCalledTimes(1);
    const datosCreados = jest.mocked(crearFicha).mock.calls[0][0];
    expect(datosCreados).not.toHaveProperty('id');
    expect(datosCreados).not.toHaveProperty('schemaVersion');
    expect(datosCreados).not.toHaveProperty('creadoEn');
    expect(datosCreados).not.toHaveProperty('actualizadoEn');
    expect(datosCreados.nombre).toBe('Ana Pérez');
    expect(resultado).toEqual([{ ...fichaEjemplo, id: 'id-nuevo' }]);
  });

  it('retorna un arreglo vacío si el payload no trae fichas', async () => {
    const resultado = await importarFichasDesdePayload({
      schemaVersion: 2,
      exportadoEn: '2026-07-01T00:00:00.000Z',
      fichas: [],
    });
    expect(resultado).toEqual([]);
    expect(crearFicha).not.toHaveBeenCalled();
  });

  it('importa varias fichas del mismo payload', async () => {
    jest.mocked(normalizarFicha).mockImplementation((raw) => raw as Ficha);
    jest
      .mocked(crearFicha)
      .mockResolvedValueOnce({ ...fichaEjemplo, id: 'id-1' })
      .mockResolvedValueOnce({ ...fichaEjemplo, id: 'id-2' });

    const resultado = await importarFichasDesdePayload({
      schemaVersion: 2,
      exportadoEn: '2026-07-01T00:00:00.000Z',
      fichas: [fichaEjemplo, { ...fichaEjemplo, nombre: 'Bea Ruiz' }],
    });

    expect(crearFicha).toHaveBeenCalledTimes(2);
    expect(resultado.map((f) => f.id)).toEqual(['id-1', 'id-2']);
  });
});

describe('importarFichasDesdeArchivo', () => {
  it('retorna un arreglo vacío si el usuario cancela la selección de archivo', async () => {
    jest.mocked(DocumentPicker.getDocumentAsync).mockResolvedValue({ canceled: true, assets: null } as any);

    const resultado = await importarFichasDesdeArchivo();

    expect(resultado).toEqual([]);
    expect(FileSystem.readAsStringAsync).not.toHaveBeenCalled();
  });

  it('lee el archivo elegido, valida el JSON e importa las fichas', async () => {
    jest.mocked(DocumentPicker.getDocumentAsync).mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file:///cache/import.json', name: 'import.json' }],
    } as any);
    jest.mocked(FileSystem.readAsStringAsync).mockResolvedValue(
      JSON.stringify({ schemaVersion: 2, exportadoEn: '2026-07-01T00:00:00.000Z', fichas: [fichaEjemplo] })
    );
    jest.mocked(normalizarFicha).mockImplementation((raw) => raw as Ficha);
    jest.mocked(crearFicha).mockResolvedValue({ ...fichaEjemplo, id: 'id-nuevo' });

    const resultado = await importarFichasDesdeArchivo();

    expect(FileSystem.readAsStringAsync).toHaveBeenCalledWith('file:///cache/import.json');
    expect(resultado).toEqual([{ ...fichaEjemplo, id: 'id-nuevo' }]);
  });

  it('lanza error si el archivo elegido no es JSON válido', async () => {
    jest.mocked(DocumentPicker.getDocumentAsync).mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file:///cache/roto.json', name: 'roto.json' }],
    } as any);
    jest.mocked(FileSystem.readAsStringAsync).mockResolvedValue('esto no es json {');

    await expect(importarFichasDesdeArchivo()).rejects.toThrow();
  });

  it('lanza error si el JSON no tiene el formato esperado (sin "fichas")', async () => {
    jest.mocked(DocumentPicker.getDocumentAsync).mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file:///cache/otro.json', name: 'otro.json' }],
    } as any);
    jest.mocked(FileSystem.readAsStringAsync).mockResolvedValue(JSON.stringify({ hola: 'mundo' }));

    await expect(importarFichasDesdeArchivo()).rejects.toThrow();
  });
});
