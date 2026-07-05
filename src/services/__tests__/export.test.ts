jest.mock('expo-file-system/legacy', () => ({
  cacheDirectory: 'file:///cache/',
  writeAsStringAsync: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn().mockResolvedValue(true),
  shareAsync: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('../storage', () => ({
  listarFichas: jest.fn(),
}));

import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { listarFichas } from '../storage';
import { crearMedidasVacias, crearBocetoVacio } from '../../types/ficha';
import { construirExportPayload, exportarTodasLasFichas } from '../export';

const fichaDeEjemplo = {
  id: 'uuid-1',
  schemaVersion: 2 as const,
  nombre: 'Ana Pérez',
  cliente: 'Ana Pérez',
  referencia: 'Vestido',
  fecha: '2026-07-01',
  medidas: crearMedidasVacias(),
  tiro: null,
  telas: [],
  colores: [],
  valorTotal: null,
  contextura: 'femenina' as const,
  boceto: crearBocetoVacio(),
  creadoEn: '2026-07-01T00:00:00.000Z',
  actualizadoEn: '2026-07-01T00:00:00.000Z',
};

describe('construirExportPayload', () => {
  it('arma el payload con schemaVersion, timestamp y las fichas dadas', () => {
    const payload = construirExportPayload([fichaDeEjemplo]);
    expect(payload.schemaVersion).toBe(2);
    expect(typeof payload.exportadoEn).toBe('string');
    expect(payload.fichas).toEqual([fichaDeEjemplo]);
  });
});

describe('exportarTodasLasFichas', () => {
  it('escribe el archivo y abre el menú de compartir', async () => {
    jest.mocked(listarFichas).mockResolvedValue([fichaDeEjemplo]);

    await exportarTodasLasFichas();

    expect(FileSystem.writeAsStringAsync).toHaveBeenCalledWith(
      expect.stringContaining('file:///cache/'),
      expect.stringContaining('"schemaVersion": 2')
    );
    expect(Sharing.shareAsync).toHaveBeenCalled();
  });

  it('lanza error si no hay forma de compartir en el dispositivo', async () => {
    jest.mocked(listarFichas).mockResolvedValue([fichaDeEjemplo]);
    jest.mocked(Sharing.isAvailableAsync).mockResolvedValueOnce(false);

    await expect(exportarTodasLasFichas()).rejects.toThrow();
  });
});
