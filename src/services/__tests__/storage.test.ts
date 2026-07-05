jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
jest.mock('../../utils/uuid', () => ({
  generarUUID: jest.fn(),
}));

import AsyncStorage from '@react-native-async-storage/async-storage';
import { generarUUID } from '../../utils/uuid';
import { crearMedidasVacias, crearBocetoVacio } from '../../types/ficha';
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
  contextura: 'femenina',
  boceto: crearBocetoVacio(),
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
    expect(ficha.schemaVersion).toBe(2);
    expect(ficha.creadoEn).toBe(ficha.actualizadoEn);

    const leida = await obtenerFicha('uuid-1');
    expect(leida).toEqual(ficha);

    const indiceRaw = await AsyncStorage.getItem('indice_fichas');
    expect(JSON.parse(indiceRaw as string)).toEqual(['uuid-1']);
  });

  it('guarda schemaVersion 2 y conserva contextura y boceto al leer', async () => {
    jest.mocked(generarUUID).mockReturnValue('uuid-1');
    const boceto = {
      trazos: [
        {
          puntos: [
            { x: 0.1, y: 0.2 },
            { x: 0.3, y: 0.4 },
          ],
          color: '#000000',
          ancho: 2,
        },
      ],
    };

    const ficha = await crearFicha({ ...datosBase, contextura: 'masculina', boceto });

    expect(ficha.schemaVersion).toBe(2);
    expect(ficha.contextura).toBe('masculina');
    expect(ficha.boceto).toEqual(boceto);

    const leida = await obtenerFicha('uuid-1');
    expect(leida?.contextura).toBe('masculina');
    expect(leida?.boceto).toEqual(boceto);
    expect(leida?.schemaVersion).toBe(2);
  });
});

describe('migración v1 -> v2', () => {
  it('normaliza una ficha v1 sin contextura/boceto al leerla con obtenerFicha', async () => {
    const fichaV1 = {
      id: 'legacy-1',
      schemaVersion: 1,
      nombre: 'Carla Ruiz',
      cliente: 'Carla Ruiz',
      referencia: 'Falda',
      fecha: '2025-01-01',
      medidas: crearMedidasVacias(),
      tiro: null,
      telas: [],
      colores: [],
      valorTotal: null,
      creadoEn: '2025-01-01T00:00:00.000Z',
      actualizadoEn: '2025-01-01T00:00:00.000Z',
    };
    await AsyncStorage.setItem('ficha:legacy-1', JSON.stringify(fichaV1));
    await AsyncStorage.setItem('indice_fichas', JSON.stringify(['legacy-1']));

    const leida = await obtenerFicha('legacy-1');

    expect(leida).not.toBeNull();
    expect(leida?.contextura).toBe('femenina');
    expect(leida?.boceto).toEqual({ trazos: [] });
    expect(leida?.schemaVersion).toBe(2);
    expect(leida?.nombre).toBe('Carla Ruiz');
    expect(leida?.medidas).toEqual(fichaV1.medidas);
  });

  it('normaliza fichas v1 dentro de listarFichas', async () => {
    const fichaV1 = {
      id: 'legacy-2',
      schemaVersion: 1,
      nombre: 'Diego Soto',
      cliente: 'Diego Soto',
      referencia: 'Pantalón',
      fecha: '2025-02-01',
      medidas: crearMedidasVacias(),
      tiro: null,
      telas: [],
      colores: [],
      valorTotal: null,
      creadoEn: '2025-02-01T00:00:00.000Z',
      actualizadoEn: '2025-02-01T00:00:00.000Z',
    };
    await AsyncStorage.setItem('ficha:legacy-2', JSON.stringify(fichaV1));
    await AsyncStorage.setItem('indice_fichas', JSON.stringify(['legacy-2']));

    const fichas = await listarFichas();

    expect(fichas).toHaveLength(1);
    expect(fichas[0].contextura).toBe('femenina');
    expect(fichas[0].boceto).toEqual({ trazos: [] });
    expect(fichas[0].schemaVersion).toBe(2);
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

  it('lanza error si la ficha no existe', async () => {
    await expect(duplicarFicha('no-existe')).rejects.toThrow();
  });
});
