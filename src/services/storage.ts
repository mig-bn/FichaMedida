import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ficha } from '../types/ficha';
import { generarUUID } from '../utils/uuid';

const INDICE_KEY = 'indice_fichas';
const fichaKey = (id: string) => `ficha:${id}`;

export type NuevaFichaInput = Omit<Ficha, 'id' | 'schemaVersion' | 'creadoEn' | 'actualizadoEn'>;

async function obtenerIndice(): Promise<string[]> {
  const raw = await AsyncStorage.getItem(INDICE_KEY);
  return raw ? JSON.parse(raw) : [];
}

async function guardarIndice(indice: string[]): Promise<void> {
  await AsyncStorage.setItem(INDICE_KEY, JSON.stringify(indice));
}

export async function crearFicha(datos: NuevaFichaInput): Promise<Ficha> {
  const ahora = new Date().toISOString();
  const ficha: Ficha = {
    ...datos,
    id: generarUUID(),
    schemaVersion: 1,
    creadoEn: ahora,
    actualizadoEn: ahora,
  };
  await AsyncStorage.setItem(fichaKey(ficha.id), JSON.stringify(ficha));
  const indice = await obtenerIndice();
  await guardarIndice([...indice, ficha.id]);
  return ficha;
}

export async function obtenerFicha(id: string): Promise<Ficha | null> {
  const raw = await AsyncStorage.getItem(fichaKey(id));
  return raw ? JSON.parse(raw) : null;
}

export async function listarFichas(): Promise<Ficha[]> {
  const indice = await obtenerIndice();
  const fichas = await Promise.all(indice.map((id) => obtenerFicha(id)));
  return fichas.filter((f): f is Ficha => f !== null);
}

export async function actualizarFicha(
  id: string,
  datos: Partial<NuevaFichaInput>
): Promise<Ficha> {
  const existente = await obtenerFicha(id);
  if (!existente) {
    throw new Error(`Ficha ${id} no existe`);
  }
  let actualizadoEn = new Date().toISOString();
  if (actualizadoEn === existente.actualizadoEn) {
    // Garantiza que actualizadoEn cambie incluso si la actualización ocurre
    // dentro del mismo milisegundo que la creación/actualización previa.
    actualizadoEn = new Date(Date.parse(actualizadoEn) + 1).toISOString();
  }
  const actualizada: Ficha = {
    ...existente,
    ...datos,
    id: existente.id,
    schemaVersion: existente.schemaVersion,
    creadoEn: existente.creadoEn,
    actualizadoEn,
  };
  await AsyncStorage.setItem(fichaKey(id), JSON.stringify(actualizada));
  return actualizada;
}

export async function eliminarFicha(id: string): Promise<void> {
  await AsyncStorage.removeItem(fichaKey(id));
  const indice = await obtenerIndice();
  await guardarIndice(indice.filter((existente) => existente !== id));
}

export async function duplicarFicha(id: string): Promise<Ficha> {
  const original = await obtenerFicha(id);
  if (!original) {
    throw new Error(`Ficha ${id} no existe`);
  }
  const { id: _id, creadoEn: _creadoEn, actualizadoEn: _actualizadoEn, ...resto } = original;
  return crearFicha(resto);
}
