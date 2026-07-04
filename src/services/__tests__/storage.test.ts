jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
jest.mock('../../utils/uuid', () => ({
  generarUUID: jest.fn(),
}));

import AsyncStorage from '@react-native-async-storage/async-storage';
import { generarUUID } from '../../utils/uuid';
import { crearMedidasVacias } from '../../types/ficha';
import {
  crearFicha,
  obtenerFicha,
  listarFichas,
  actualizarFicha,
  eliminarFicha,
  duplicarFicha,
  NuevaFichaInput,
} from '../storage';

const datosBase: NuevaFichaInput = {
  nombre: 'Ana Pérez',
  cliente: 'Ana Pérez',
  referencia: 'Vestido de gala',
  fecha: '2026-07-01',
  medidas: crearMedidasVacias(),
  tiro: null,
  telas: [],
  colores: [],
  valorTotal: null,
};

beforeEach(async () => {
  await AsyncStorage.clear();
  jest.mocked(generarUUID).mockReset();
});

describe('crearFicha', () => {
  it('genera un id, guarda la ficha y la agrega al índice', async () => {
    jest.mocked(generarUUID).mockReturnValue('uuid-1');

    const ficha = await crearFicha(datosBase);

    expect(ficha.id).toBe('uuid-1');
    expect(ficha.schemaVersion).toBe(1);
    expect(ficha.creadoEn).toBe(ficha.actualizadoEn);

    const leida = await obtenerFicha('uuid-1');
    expect(leida).toEqual(ficha);

    const indiceRaw = await AsyncStorage.getItem('indice_fichas');
    expect(JSON.parse(indiceRaw as string)).toEqual(['uuid-1']);
  });
});

describe('listarFichas', () => {
  it('devuelve todas las fichas del índice', async () => {
    jest.mocked(generarUUID).mockReturnValueOnce('uuid-1').mockReturnValueOnce('uuid-2');
    await crearFicha(datosBase);
    await crearFicha({ ...datosBase, nombre: 'Bea Ruiz' });

    const fichas = await listarFichas();
    expect(fichas.map((f) => f.id).sort()).toEqual(['uuid-1', 'uuid-2']);
  });

  it('devuelve arreglo vacío cuando no hay fichas', async () => {
    expect(await listarFichas()).toEqual([]);
  });
});

describe('actualizarFicha', () => {
  it('actualiza campos, cambia actualizadoEn y conserva creadoEn e id', async () => {
    jest.mocked(generarUUID).mockReturnValue('uuid-1');
    const original = await crearFicha(datosBase);

    const actualizada = await actualizarFicha('uuid-1', { nombre: 'Ana P. Editada' });

    expect(actualizada.id).toBe(original.id);
    expect(actualizada.creadoEn).toBe(original.creadoEn);
    expect(actualizada.nombre).toBe('Ana P. Editada');
    expect(actualizada.actualizadoEn).not.toBe(original.actualizadoEn);
  });

  it('lanza error si la ficha no existe', async () => {
    await expect(actualizarFicha('no-existe', { nombre: 'X' })).rejects.toThrow();
  });
});

describe('eliminarFicha', () => {
  it('borra la ficha y la quita del índice', async () => {
    jest.mocked(generarUUID).mockReturnValue('uuid-1');
    await crearFicha(datosBase);

    await eliminarFicha('uuid-1');

    expect(await obtenerFicha('uuid-1')).toBeNull();
    expect(await listarFichas()).toEqual([]);
  });
});

describe('duplicarFicha', () => {
  it('crea una copia con un id distinto y mismos datos', async () => {
    jest.mocked(generarUUID).mockReturnValueOnce('uuid-1').mockReturnValueOnce('uuid-2');
    const original = await crearFicha(datosBase);

    const copia = await duplicarFicha('uuid-1');

    expect(copia.id).toBe('uuid-2');
    expect(copia.id).not.toBe(original.id);
    expect(copia.nombre).toBe(original.nombre);
    expect(copia.medidas).toEqual(original.medidas);
  });
});
