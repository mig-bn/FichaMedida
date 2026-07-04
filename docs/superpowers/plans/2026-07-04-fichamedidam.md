# FichaMedidam Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build FichaMedidam, an offline-first React Native (Expo) app that replaces the physical seamstress measurement card: create/edit/list/delete/duplicate client measurement sheets stored locally, and bulk-export them to JSON for a future receiving system.

**Architecture:** Expo (managed workflow) + TypeScript + Expo Router for file-based navigation. All persistence is local via `@react-native-async-storage/async-storage`, keyed as `ficha:<uuid>` documents plus an `indice_fichas` array of ids. A pure `services/storage.ts` module wraps all CRUD so screens never touch AsyncStorage directly. Export is a two-part module: a pure function that builds the `ExportPayload` (unit-tested) and an I/O function that writes a temp file with `expo-file-system` and opens the native share sheet with `expo-sharing`.

**Tech Stack:** Expo SDK (managed), TypeScript, expo-router, @react-native-async-storage/async-storage, expo-file-system, expo-sharing, expo-crypto (UUIDs), @react-native-community/datetimepicker, jest + jest-expo for unit tests of pure/service logic.

## Global Constraints

- Costo total: $0 para siempre. Ninguna dependencia debe requerir cuenta, API key, o servicio de nube de pago.
- La app debe funcionar 100% sin conexión a internet, siempre.
- Todos los datos se guardan localmente en el dispositivo (AsyncStorage). No hay backend.
- Debe existir una función de exportación en bloque a JSON (`ExportPayload`) compartida vía el menú nativo del sistema — es el único canal de comunicación con el futuro software receptor.
- Todos los 29 campos de `Medidas` de la sección 3 del roadmap deben implementarse tal cual están nombrados — no simplificar ni fusionar campos sin confirmar con el usuario primero (incluye los pares duplicados "Ancho Bota", "Ancho Puño", "Contorno de Muslo").
- No introducir dependencias de red, autenticación, ni SDKs de nube en ningún punto.
- Trabajar fase por fase, en el orden del roadmap; no avanzar de fase sin cumplir el criterio de aceptación de la anterior.

## Adaptación de TDD a este proyecto

El roadmap original ya define fases con criterios de aceptación mayormente manuales (UI táctil, modo avión, multiplataforma). Este plan mantiene TDD estricto (test primero, código después) para toda la lógica pura y de servicios (`types`, `utils`, `storage.ts`, `export.ts`) usando `jest` + `jest-expo`, mockeando AsyncStorage/FileSystem/Sharing. Para las pantallas (UI de React Native), no hay entorno de dispositivo/simulador disponible en esta sesión de trabajo: cada tarea de UI se implementa y luego se deja un checklist de verificación manual (idéntico o derivado de los criterios de aceptación del roadmap) para que el usuario la ejecute en su teléfono con Expo Go. La Fase 7 completa del roadmap queda como checklist final a cargo del usuario.

---

### Task 1: Fase 0 — Setup del proyecto

**Files:**
- Create: proyecto Expo completo en la raíz `D:\Users\User W10\Documents\Proyecto\FichaMedida` (package.json, app.json, tsconfig.json, app/, assets/, etc.)
- Modify: `app.json` (nombre, slug, scheme, plugin expo-router)
- Modify: `package.json` (`main: "expo-router/entry"`, script `test`, config `jest`)

**Interfaces:**
- Produces: estructura de carpetas `app/`, `src/types`, `src/services`, `src/components`, `src/utils` que las tareas siguientes usarán.

- [ ] **Step 1: Inicializar git**

```bash
cd "D:/Users/User W10/Documents/Proyecto/FichaMedida"
git init
```

- [ ] **Step 2: Scaffold del proyecto Expo (blank TypeScript) en el directorio actual**

```bash
npx create-expo-app@latest . --template blank-typescript
```

Expected: se crean `package.json`, `app.json`, `App.tsx`, `tsconfig.json`, `assets/` sin errores.

- [ ] **Step 3: Instalar dependencias de navegación (Expo Router) y utilidades**

```bash
npx expo install expo-router react-native-safe-area-context react-native-screens expo-constants expo-linking expo-status-bar react-native-gesture-handler
npx expo install @react-native-async-storage/async-storage expo-file-system expo-sharing expo-crypto @react-native-community/datetimepicker
```

Expected: todas las versiones instaladas son las compatibles con el SDK de Expo (npx expo install resuelve versiones, no hay warnings de "unmet peer").

- [ ] **Step 4: Instalar dependencias de testing (dev)**

```bash
npm install --save-dev jest jest-expo @types/jest
```

- [ ] **Step 5: Configurar `package.json`**

Editar `package.json` para:
1. Cambiar `"main"` a `"expo-router/entry"`.
2. Agregar script `"test": "jest"`.
3. Agregar bloque de configuración de jest:

```json
{
  "jest": {
    "preset": "jest-expo"
  }
}
```

- [ ] **Step 6: Configurar `app.json`**

Editar `app.json` (dentro de `"expo"`):
```json
{
  "expo": {
    "name": "FichaMedidam",
    "slug": "fichamedidam",
    "scheme": "fichamedidam",
    "plugins": ["expo-router"]
  }
}
```
(mantener el resto de las claves generadas por el scaffold: version, icon, splash, ios, android, etc.)

- [ ] **Step 7: Eliminar el `App.tsx` del template blank (Expo Router no lo usa) y crear el layout raíz**

```bash
rm App.tsx
```

Crear carpetas:
```bash
mkdir -p app/ficha src/types src/services src/components src/utils
```

Crear `app/_layout.tsx`:

```tsx
import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Fichas' }} />
      <Stack.Screen name="ficha/nueva" options={{ title: 'Nueva ficha' }} />
      <Stack.Screen name="ficha/[id]" options={{ title: 'Ficha' }} />
    </Stack>
  );
}
```

Crear `app/index.tsx` temporal (se reemplaza en la Task 3):

```tsx
import { View, Text } from 'react-native';

export default function Index() {
  return (
    <View>
      <Text>FichaMedidam</Text>
    </View>
  );
}
```

- [ ] **Step 8: Correr la app y verificar que abre sin errores**

```bash
npx expo start
```

Expected (criterio de aceptación de la Fase 0): al escanear el QR con Expo Go (o abrir en emulador), la app abre y muestra la pantalla en blanco con el texto "FichaMedidam", sin errores en la consola de Metro.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "chore: scaffold FichaMedidam Expo project with router and storage deps"
```

---

### Task 2: Fase 1 — Modelo de datos y capa de almacenamiento

**Files:**
- Create: `src/types/ficha.ts`
- Create: `src/utils/uuid.ts`
- Create: `src/utils/validation.ts`
- Create: `src/utils/__tests__/uuid.test.ts`
- Create: `src/utils/__tests__/validation.test.ts`
- Create: `src/services/storage.ts`
- Create: `src/services/__tests__/storage.test.ts`

**Interfaces:**
- Consumes: nada (primera capa de lógica).
- Produces:
  - `Medidas`, `Tela`, `Ficha`, `ExportPayload`, `GRUPOS_MEDIDAS`, `crearMedidasVacias()` desde `src/types/ficha.ts`.
  - `generarUUID(): string` desde `src/utils/uuid.ts`.
  - `esNombreValido(nombre: string): boolean`, `parsearMedida(texto: string): number | null` desde `src/utils/validation.ts`.
  - `crearFicha`, `obtenerFicha`, `listarFichas`, `actualizarFicha`, `eliminarFicha`, `duplicarFicha`, tipo `NuevaFichaInput` desde `src/services/storage.ts`.

- [ ] **Step 1: Crear los tipos (`src/types/ficha.ts`)**

```ts
export type Medidas = {
  talleDelantero: number | null;
  talleTrasero: number | null;
  espalda: number | null;
  busto: number | null;
  cintura: number | null;
  cadera: number | null;
  alturaBusto: number | null;
  separacionBusto: number | null;
  contornoImperio: number | null;
  altoImperio: number | null;
  contornoStrapple: number | null;
  contornoHombro: number | null;
  hombro: number | null;
  costado: number | null;
  centroEspalda: number | null;
  largoBlusa: number | null;
  largoMangaCorta: number | null;
  largoMangaLarga: number | null;
  largoManga34: number | null;
  largoShort: number | null;
  largoPantalon: number | null;
  alturaRodilla: number | null;
  anchoRodilla: number | null;
  anchoBotaSuperior: number | null;
  anchoPunoSuperior: number | null;
  contornoMusloSuperior: number | null;
  anchoBotaInferior: number | null;
  anchoPunoInferior: number | null;
  contornoMusloInferior: number | null;
};

export type Tela = { tipo: string; color?: string };

export type Ficha = {
  id: string;
  schemaVersion: 1;
  nombre: string;
  cliente: string;
  referencia: string;
  fecha: string;
  medidas: Medidas;
  tiro: number | null;
  telas: Tela[];
  colores: string[];
  valorTotal: number | null;
  creadoEn: string;
  actualizadoEn: string;
};

export type ExportPayload = {
  schemaVersion: 1;
  exportadoEn: string;
  fichas: Ficha[];
};

export function crearMedidasVacias(): Medidas {
  return {
    talleDelantero: null,
    talleTrasero: null,
    espalda: null,
    busto: null,
    cintura: null,
    cadera: null,
    alturaBusto: null,
    separacionBusto: null,
    contornoImperio: null,
    altoImperio: null,
    contornoStrapple: null,
    contornoHombro: null,
    hombro: null,
    costado: null,
    centroEspalda: null,
    largoBlusa: null,
    largoMangaCorta: null,
    largoMangaLarga: null,
    largoManga34: null,
    largoShort: null,
    largoPantalon: null,
    alturaRodilla: null,
    anchoRodilla: null,
    anchoBotaSuperior: null,
    anchoPunoSuperior: null,
    contornoMusloSuperior: null,
    anchoBotaInferior: null,
    anchoPunoInferior: null,
    contornoMusloInferior: null,
  };
}

export const GRUPOS_MEDIDAS: { titulo: string; campos: { key: keyof Medidas; label: string }[] }[] = [
  {
    titulo: 'Torso',
    campos: [
      { key: 'talleDelantero', label: 'Talle Delantero' },
      { key: 'talleTrasero', label: 'Talle Trasero' },
      { key: 'espalda', label: 'Espalda' },
      { key: 'busto', label: 'Busto' },
      { key: 'cintura', label: 'Cintura' },
      { key: 'cadera', label: 'Cadera' },
      { key: 'alturaBusto', label: 'Altura Busto' },
      { key: 'separacionBusto', label: 'Separación Busto' },
      { key: 'contornoImperio', label: 'Contorno Imperio' },
      { key: 'altoImperio', label: 'Alto Imperio' },
      { key: 'contornoStrapple', label: 'Contorno Strapple' },
      { key: 'contornoHombro', label: 'Contorno Hombro' },
      { key: 'hombro', label: 'Hombro' },
      { key: 'costado', label: 'Costado' },
      { key: 'centroEspalda', label: 'Centro Espalda' },
    ],
  },
  {
    titulo: 'Blusa y Mangas',
    campos: [
      { key: 'largoBlusa', label: 'Largo Blusa' },
      { key: 'largoMangaCorta', label: 'Largo Manga Corta' },
      { key: 'largoMangaLarga', label: 'Largo Manga Larga' },
      { key: 'largoManga34', label: 'Largo Manga 3/4' },
    ],
  },
  {
    titulo: 'Pantalón / Short',
    campos: [
      { key: 'largoShort', label: 'Largo Short' },
      { key: 'largoPantalon', label: 'Largo Pantalón' },
      { key: 'alturaRodilla', label: 'Altura Rodilla' },
      { key: 'anchoRodilla', label: 'Ancho Rodilla' },
      { key: 'anchoBotaSuperior', label: 'Ancho Bota (1)' },
      { key: 'anchoPunoSuperior', label: 'Ancho Puño (1)' },
      { key: 'contornoMusloSuperior', label: 'Contorno de Muslo (1)' },
      { key: 'anchoBotaInferior', label: 'Ancho Bota (2)' },
      { key: 'anchoPunoInferior', label: 'Ancho Puño (2)' },
      { key: 'contornoMusloInferior', label: 'Contorno de Muslo (2)' },
    ],
  },
];
```

- [ ] **Step 2: Escribir el test de UUID (falla primero)**

`src/utils/__tests__/uuid.test.ts`:
```ts
jest.mock('expo-crypto', () => ({
  randomUUID: () => '11111111-1111-1111-1111-111111111111',
}));

import { generarUUID } from '../uuid';

describe('generarUUID', () => {
  it('devuelve el UUID generado por expo-crypto', () => {
    expect(generarUUID()).toBe('11111111-1111-1111-1111-111111111111');
  });
});
```

Run: `npx jest src/utils/__tests__/uuid.test.ts`
Expected: FAIL con "Cannot find module '../uuid'".

- [ ] **Step 3: Implementar `src/utils/uuid.ts`**

```ts
import * as Crypto from 'expo-crypto';

export function generarUUID(): string {
  return Crypto.randomUUID();
}
```

Run: `npx jest src/utils/__tests__/uuid.test.ts`
Expected: PASS.

- [ ] **Step 4: Escribir los tests de validación (fallan primero)**

`src/utils/__tests__/validation.test.ts`:
```ts
import { esNombreValido, parsearMedida } from '../validation';

describe('esNombreValido', () => {
  it('rechaza vacío y solo espacios', () => {
    expect(esNombreValido('')).toBe(false);
    expect(esNombreValido('   ')).toBe(false);
  });

  it('acepta un nombre con contenido', () => {
    expect(esNombreValido('Ana Pérez')).toBe(true);
  });
});

describe('parsearMedida', () => {
  it('permite vacío como null (campo opcional)', () => {
    expect(parsearMedida('')).toBeNull();
    expect(parsearMedida('   ')).toBeNull();
  });

  it('rechaza texto no numérico', () => {
    expect(parsearMedida('abc')).toBeNull();
    expect(parsearMedida('12abc')).toBeNull();
  });

  it('acepta enteros y decimales con punto o coma', () => {
    expect(parsearMedida('90')).toBe(90);
    expect(parsearMedida('90.5')).toBe(90.5);
    expect(parsearMedida('90,5')).toBe(90.5);
  });

  it('rechaza números negativos', () => {
    expect(parsearMedida('-5')).toBeNull();
  });
});
```

Run: `npx jest src/utils/__tests__/validation.test.ts`
Expected: FAIL con "Cannot find module '../validation'".

- [ ] **Step 5: Implementar `src/utils/validation.ts`**

```ts
export function esNombreValido(nombre: string): boolean {
  return nombre.trim().length > 0;
}

export function parsearMedida(texto: string): number | null {
  const limpio = texto.trim();
  if (limpio === '') return null;
  const normalizado = limpio.replace(',', '.');
  if (!/^\d+(\.\d+)?$/.test(normalizado)) return null;
  const valor = Number(normalizado);
  return Number.isFinite(valor) ? valor : null;
}
```

Run: `npx jest src/utils/__tests__/validation.test.ts`
Expected: PASS (7 tests).

- [ ] **Step 6: Escribir los tests de `storage.ts` (fallan primero)**

`src/services/__tests__/storage.test.ts`:
```ts
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
```

Run: `npx jest src/services/__tests__/storage.test.ts`
Expected: FAIL con "Cannot find module '../storage'".

- [ ] **Step 7: Implementar `src/services/storage.ts`**

```ts
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
  const actualizada: Ficha = {
    ...existente,
    ...datos,
    id: existente.id,
    schemaVersion: existente.schemaVersion,
    creadoEn: existente.creadoEn,
    actualizadoEn: new Date().toISOString(),
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
```

Run: `npx jest src/services/__tests__/storage.test.ts`
Expected: PASS (7 tests).

- [ ] **Step 8: Correr toda la suite de tests**

```bash
npx jest
```

Expected: todas las suites (uuid, validation, storage) en verde.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: add ficha types, uuid/validation utils and AsyncStorage-backed storage service with tests"
```

---

### Task 3: Fase 2 — Pantalla de listado

**Files:**
- Create: `src/components/FichaListItem.tsx`
- Modify: `app/index.tsx`

**Interfaces:**
- Consumes: `listarFichas()` desde `src/services/storage.ts` (Task 2), `Ficha` desde `src/types/ficha.ts` (Task 2).
- Produces: ruta `app/index.tsx` como pantalla inicial; `app/ficha/nueva.tsx` (Task 4) es el destino del botón "+".

- [ ] **Step 1: Crear `src/components/FichaListItem.tsx`**

```tsx
import { Pressable, Text, View, StyleSheet } from 'react-native';
import { Ficha } from '../types/ficha';

type Props = {
  ficha: Ficha;
  onPress: () => void;
};

export function FichaListItem({ ficha, onPress }: Props) {
  return (
    <Pressable onPress={onPress} style={styles.contenedor}>
      <Text style={styles.nombre}>{ficha.nombre}</Text>
      <Text style={styles.detalle}>{ficha.cliente}</Text>
      <Text style={styles.fecha}>{ficha.fecha}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e2e2',
  },
  nombre: { fontSize: 18, fontWeight: '600' },
  detalle: { fontSize: 15, color: '#444', marginTop: 2 },
  fecha: { fontSize: 13, color: '#888', marginTop: 2 },
});
```

- [ ] **Step 2: Reescribir `app/index.tsx`**

```tsx
import { useCallback, useState } from 'react';
import { View, TextInput, FlatList, Text, Pressable, StyleSheet } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { listarFichas } from '../src/services/storage';
import { Ficha } from '../src/types/ficha';
import { FichaListItem } from '../src/components/FichaListItem';

export default function Index() {
  const router = useRouter();
  const [fichas, setFichas] = useState<Ficha[]>([]);
  const [busqueda, setBusqueda] = useState('');

  useFocusEffect(
    useCallback(() => {
      let activo = true;
      listarFichas().then((todas) => {
        if (activo) setFichas(todas);
      });
      return () => {
        activo = false;
      };
    }, [])
  );

  const filtradas = fichas.filter((f) => {
    const texto = busqueda.trim().toLowerCase();
    if (texto === '') return true;
    return f.nombre.toLowerCase().includes(texto) || f.cliente.toLowerCase().includes(texto);
  });

  return (
    <View style={styles.contenedor}>
      <TextInput
        placeholder="Buscar por nombre o cliente"
        value={busqueda}
        onChangeText={setBusqueda}
        style={styles.buscador}
      />
      {filtradas.length === 0 ? (
        <View style={styles.vacio}>
          <Text style={styles.vacioTexto}>Aún no tienes fichas guardadas</Text>
        </View>
      ) : (
        <FlatList
          data={filtradas}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <FichaListItem ficha={item} onPress={() => router.push(`/ficha/${item.id}`)} />
          )}
        />
      )}
      <Pressable style={styles.fab} onPress={() => router.push('/ficha/nueva')}>
        <Text style={styles.fabTexto}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: '#fff' },
  buscador: {
    margin: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    fontSize: 16,
  },
  vacio: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  vacioTexto: { fontSize: 16, color: '#888' },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 30,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2f6fed',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
  fabTexto: { color: '#fff', fontSize: 30, lineHeight: 32 },
});
```

- [ ] **Step 3: Verificación manual (no hay simulador en esta sesión — el usuario la ejecuta con Expo Go)**

Checklist a marcar por el usuario:
1. Crear manualmente (temporalmente, vía consola de Metro o un botón de prueba) un par de fichas usando `crearFicha` para tener datos que listar (esto se vuelve natural en la Task 4 cuando exista el formulario).
2. Abrir la app: la lista muestra nombre, cliente y fecha de cada ficha.
3. Sin fichas guardadas, se muestra "Aún no tienes fichas guardadas".
4. El botón flotante "+" navega a la pantalla de nueva ficha (placeholder hasta Task 4).
5. Escribir en el buscador filtra por nombre o cliente en tiempo real.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add fichas list screen with search, empty state and FAB"
```

---

### Task 4: Fase 3 — Formulario de ficha (crear/editar)

**Files:**
- Create: `src/components/MedidasTable.tsx`
- Create: `src/components/FichaForm.tsx`
- Create: `app/ficha/nueva.tsx`
- Create: `app/ficha/[id].tsx`

**Interfaces:**
- Consumes: `GRUPOS_MEDIDAS`, `crearMedidasVacias`, `Ficha`, `Medidas`, `Tela` (Task 2); `esNombreValido`, `parsearMedida` (Task 2); `crearFicha`, `actualizarFicha`, `obtenerFicha` (Task 2).
- Produces: rutas `app/ficha/nueva.tsx` y `app/ficha/[id].tsx` que Task 3 ya referencia (`router.push('/ficha/nueva')`, `router.push(/ficha/${id})`).

- [ ] **Step 1: Crear `src/components/MedidasTable.tsx`**

```tsx
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { Medidas, GRUPOS_MEDIDAS } from '../types/ficha';
import { parsearMedida } from '../utils/validation';

type Props = {
  medidas: Medidas;
  onChange: (medidas: Medidas) => void;
};

export function MedidasTable({ medidas, onChange }: Props) {
  return (
    <View>
      {GRUPOS_MEDIDAS.map((grupo) => (
        <View key={grupo.titulo} style={styles.grupo}>
          <Text style={styles.tituloGrupo}>{grupo.titulo}</Text>
          {grupo.campos.map((campo) => (
            <View key={campo.key} style={styles.fila}>
              <Text style={styles.etiqueta}>{campo.label}</Text>
              <TextInput
                style={styles.input}
                keyboardType="decimal-pad"
                value={medidas[campo.key] === null ? '' : String(medidas[campo.key])}
                onChangeText={(texto) => {
                  onChange({ ...medidas, [campo.key]: parsearMedida(texto) });
                }}
                placeholder="cm"
              />
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grupo: { marginBottom: 20 },
  tituloGrupo: { fontSize: 17, fontWeight: '700', marginBottom: 8 },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  etiqueta: { fontSize: 15, flex: 1, paddingRight: 8 },
  input: {
    width: 90,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 8,
    fontSize: 16,
    textAlign: 'right',
  },
});
```

- [ ] **Step 2: Crear `src/components/FichaForm.tsx`**

```tsx
import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  StyleSheet,
  Alert,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ficha, Tela, crearMedidasVacias } from '../types/ficha';
import { esNombreValido, parsearMedida } from '../utils/validation';
import { crearFicha, actualizarFicha, NuevaFichaInput } from '../services/storage';
import { MedidasTable } from './MedidasTable';

type Props = {
  ficha: Ficha | null;
  onGuardado: (ficha: Ficha) => void;
};

export function FichaForm({ ficha, onGuardado }: Props) {
  const [nombre, setNombre] = useState(ficha?.nombre ?? '');
  const [cliente, setCliente] = useState(ficha?.cliente ?? '');
  const [referencia, setReferencia] = useState(ficha?.referencia ?? '');
  const [fecha, setFecha] = useState(ficha?.fecha ?? new Date().toISOString().slice(0, 10));
  const [mostrarFecha, setMostrarFecha] = useState(false);
  const [medidas, setMedidas] = useState(ficha?.medidas ?? crearMedidasVacias());
  const [telas, setTelas] = useState<Tela[]>(ficha?.telas ?? []);
  const [colores, setColores] = useState<string[]>(ficha?.colores ?? []);
  const [tiroTexto, setTiroTexto] = useState(ficha?.tiro != null ? String(ficha.tiro) : '');
  const [valorTotalTexto, setValorTotalTexto] = useState(
    ficha?.valorTotal != null ? String(ficha.valorTotal) : ''
  );
  const [errorNombre, setErrorNombre] = useState(false);

  async function guardar() {
    if (!esNombreValido(nombre)) {
      setErrorNombre(true);
      return;
    }
    setErrorNombre(false);

    const datos: NuevaFichaInput = {
      nombre: nombre.trim(),
      cliente: cliente.trim(),
      referencia: referencia.trim(),
      fecha,
      medidas,
      tiro: parsearMedida(tiroTexto),
      telas: telas.filter((t) => t.tipo.trim() !== ''),
      colores: colores.filter((c) => c.trim() !== ''),
      valorTotal: parsearMedida(valorTotalTexto),
    };

    try {
      const guardada = ficha ? await actualizarFicha(ficha.id, datos) : await crearFicha(datos);
      onGuardado(guardada);
    } catch (e) {
      Alert.alert('Error al guardar', 'No se pudo guardar la ficha. Intenta de nuevo.');
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.contenedor}>
      <Text style={styles.etiqueta}>Nombre *</Text>
      <TextInput
        style={[styles.input, errorNombre && styles.inputError]}
        value={nombre}
        onChangeText={(t) => {
          setNombre(t);
          if (errorNombre) setErrorNombre(false);
        }}
        placeholder="Nombre de la ficha"
      />
      {errorNombre && <Text style={styles.textoError}>El nombre es obligatorio</Text>}

      <Text style={styles.etiqueta}>Cliente</Text>
      <TextInput style={styles.input} value={cliente} onChangeText={setCliente} />

      <Text style={styles.etiqueta}>Referencia</Text>
      <TextInput style={styles.input} value={referencia} onChangeText={setReferencia} />

      <Text style={styles.etiqueta}>Fecha</Text>
      <Pressable style={styles.input} onPress={() => setMostrarFecha(true)}>
        <Text>{fecha}</Text>
      </Pressable>
      {mostrarFecha && (
        <DateTimePicker
          value={new Date(fecha)}
          mode="date"
          onChange={(_evento, seleccionada) => {
            setMostrarFecha(false);
            if (seleccionada) setFecha(seleccionada.toISOString().slice(0, 10));
          }}
        />
      )}

      <Text style={styles.tituloSeccion}>Medidas</Text>
      <MedidasTable medidas={medidas} onChange={setMedidas} />

      <Text style={styles.tituloSeccion}>Telas</Text>
      {telas.map((tela, indice) => (
        <View key={indice} style={styles.filaLista}>
          <TextInput
            style={[styles.input, styles.inputLista]}
            placeholder="Tipo de tela"
            value={tela.tipo}
            onChangeText={(t) => {
              const copia = [...telas];
              copia[indice] = { ...copia[indice], tipo: t };
              setTelas(copia);
            }}
          />
          <TextInput
            style={[styles.input, styles.inputLista]}
            placeholder="Color (opcional)"
            value={tela.color ?? ''}
            onChangeText={(t) => {
              const copia = [...telas];
              copia[indice] = { ...copia[indice], color: t };
              setTelas(copia);
            }}
          />
          <Pressable onPress={() => setTelas(telas.filter((_, i) => i !== indice))}>
            <Text style={styles.quitar}>Quitar</Text>
          </Pressable>
        </View>
      ))}
      <Pressable onPress={() => setTelas([...telas, { tipo: '', color: '' }])}>
        <Text style={styles.agregar}>+ Agregar tela</Text>
      </Pressable>

      <Text style={styles.tituloSeccion}>Colores</Text>
      {colores.map((color, indice) => (
        <View key={indice} style={styles.filaLista}>
          <TextInput
            style={[styles.input, styles.inputLista]}
            placeholder="Color"
            value={color}
            onChangeText={(t) => {
              const copia = [...colores];
              copia[indice] = t;
              setColores(copia);
            }}
          />
          <Pressable onPress={() => setColores(colores.filter((_, i) => i !== indice))}>
            <Text style={styles.quitar}>Quitar</Text>
          </Pressable>
        </View>
      ))}
      <Pressable onPress={() => setColores([...colores, ''])}>
        <Text style={styles.agregar}>+ Agregar color</Text>
      </Pressable>

      <Text style={styles.etiqueta}>Tiro</Text>
      <TextInput
        style={styles.input}
        keyboardType="decimal-pad"
        value={tiroTexto}
        onChangeText={setTiroTexto}
      />

      <Text style={styles.etiqueta}>Valor Total</Text>
      <TextInput
        style={styles.input}
        keyboardType="decimal-pad"
        value={valorTotalTexto}
        onChangeText={setValorTotalTexto}
      />

      <Pressable style={styles.botonGuardar} onPress={guardar}>
        <Text style={styles.botonGuardarTexto}>Guardar</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  contenedor: { padding: 16 },
  etiqueta: { fontSize: 15, fontWeight: '600', marginTop: 12, marginBottom: 4 },
  tituloSeccion: { fontSize: 19, fontWeight: '700', marginTop: 20, marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
  },
  inputError: { borderColor: '#d33' },
  textoError: { color: '#d33', fontSize: 13, marginTop: 4 },
  filaLista: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  inputLista: { flex: 1 },
  quitar: { color: '#d33', fontSize: 14 },
  agregar: { color: '#2f6fed', fontSize: 15, marginBottom: 16 },
  botonGuardar: {
    marginTop: 24,
    marginBottom: 60,
    backgroundColor: '#2f6fed',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  botonGuardarTexto: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
```

- [ ] **Step 3: Crear `app/ficha/nueva.tsx`**

```tsx
import { useRouter } from 'expo-router';
import { FichaForm } from '../../src/components/FichaForm';

export default function NuevaFicha() {
  const router = useRouter();
  return (
    <FichaForm
      ficha={null}
      onGuardado={() => router.back()}
    />
  );
}
```

- [ ] **Step 4: Crear `app/ficha/[id].tsx`**

```tsx
import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { obtenerFicha } from '../../src/services/storage';
import { Ficha } from '../../src/types/ficha';
import { FichaForm } from '../../src/components/FichaForm';

export default function VerFicha() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [ficha, setFicha] = useState<Ficha | null | undefined>(undefined);

  useEffect(() => {
    obtenerFicha(id).then(setFicha);
  }, [id]);

  if (ficha === undefined) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  return <FichaForm ficha={ficha} onGuardado={() => router.back()} />;
}
```

- [ ] **Step 5: Verificación manual (Expo Go en el celular del usuario)**

Checklist:
1. Tocar "+" en el listado → se abre el formulario vacío.
2. Llenar nombre, cliente, referencia, fecha (selector nativo), todos los grupos de medidas, agregar 2 telas y 2 colores, tiro y valor total.
3. Guardar sin nombre → aparece "El nombre es obligatorio" y no navega ni guarda.
4. Completar el nombre y guardar → vuelve al listado y la ficha aparece.
5. Abrir la ficha creada, confirmar que todos los campos siguen los valores ingresados.
6. Editar un campo y guardar → al reabrir, el cambio persiste.
7. Escribir letras en un campo de medida → el campo no acepta el texto no numérico (se descarta o queda vacío), nunca guarda un valor corrupto.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add ficha create/edit form with medidas, telas and colores sections"
```

---

### Task 5: Fase 4 — Exportación en bloque

**Files:**
- Create: `src/services/export.ts`
- Create: `src/services/__tests__/export.test.ts`
- Modify: `app/index.tsx` (botón "Exportar todo")

**Interfaces:**
- Consumes: `listarFichas()` (Task 2), `Ficha`, `ExportPayload` (Task 2).
- Produces: `construirExportPayload(fichas: Ficha[]): ExportPayload`, `exportarTodasLasFichas(): Promise<void>`.

- [ ] **Step 1: Escribir los tests de export (fallan primero)**

`src/services/__tests__/export.test.ts`:
```ts
jest.mock('expo-file-system', () => ({
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

import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { listarFichas } from '../storage';
import { crearMedidasVacias } from '../../types/ficha';
import { construirExportPayload, exportarTodasLasFichas } from '../export';

const fichaDeEjemplo = {
  id: 'uuid-1',
  schemaVersion: 1 as const,
  nombre: 'Ana Pérez',
  cliente: 'Ana Pérez',
  referencia: 'Vestido',
  fecha: '2026-07-01',
  medidas: crearMedidasVacias(),
  tiro: null,
  telas: [],
  colores: [],
  valorTotal: null,
  creadoEn: '2026-07-01T00:00:00.000Z',
  actualizadoEn: '2026-07-01T00:00:00.000Z',
};

describe('construirExportPayload', () => {
  it('arma el payload con schemaVersion, timestamp y las fichas dadas', () => {
    const payload = construirExportPayload([fichaDeEjemplo]);
    expect(payload.schemaVersion).toBe(1);
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
      expect.stringContaining('"schemaVersion": 1')
    );
    expect(Sharing.shareAsync).toHaveBeenCalled();
  });

  it('lanza error si no hay forma de compartir en el dispositivo', async () => {
    jest.mocked(listarFichas).mockResolvedValue([fichaDeEjemplo]);
    jest.mocked(Sharing.isAvailableAsync).mockResolvedValueOnce(false);

    await expect(exportarTodasLasFichas()).rejects.toThrow();
  });
});
```

Run: `npx jest src/services/__tests__/export.test.ts`
Expected: FAIL con "Cannot find module '../export'".

- [ ] **Step 2: Implementar `src/services/export.ts`**

```ts
import * as FileSystem from 'expo-file-system';
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
```

Run: `npx jest src/services/__tests__/export.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 3: Agregar el botón "Exportar todo" en `app/index.tsx`**

En `app/index.tsx`, importar `exportarTodasLasFichas` y `Alert`, y agregar un botón visible en la parte superior de la pantalla:

```tsx
import { Alert } from 'react-native';
import { exportarTodasLasFichas } from '../src/services/export';
```

Agregar dentro del `View` raíz, antes del buscador:
```tsx
<Pressable
  style={styles.botonExportar}
  onPress={async () => {
    try {
      await exportarTodasLasFichas();
    } catch (e) {
      Alert.alert('Error al exportar', 'No se pudo generar o compartir el archivo.');
    }
  }}
>
  <Text style={styles.botonExportarTexto}>Exportar todo</Text>
</Pressable>
```

Agregar a `styles`:
```ts
botonExportar: {
  margin: 12,
  marginBottom: 0,
  backgroundColor: '#2f6fed',
  padding: 10,
  borderRadius: 8,
  alignItems: 'center',
},
botonExportarTexto: { color: '#fff', fontWeight: '700', fontSize: 15 },
```

- [ ] **Step 4: Verificación manual (Expo Go)**

Checklist:
1. Con al menos 3 fichas guardadas, tocar "Exportar todo".
2. Confirmar que aparece el menú nativo de compartir.
3. Guardar el archivo (o enviarlo) y abrirlo en un editor de texto: debe tener `schemaVersion`, `exportadoEn` y el arreglo `fichas` con las 3 fichas completas.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add bulk JSON export via expo-file-system and expo-sharing"
```

---

### Task 6: Fase 5 — Pulido

**Files:**
- Modify: `src/components/FichaForm.tsx` (botones Duplicar / Eliminar con confirmación)
- Modify: `src/services/storage.ts` (ya expone `duplicarFicha`/`eliminarFicha` desde Task 2 — sin cambios de código, solo se conecta a la UI)
- Modify: `app/ficha/[id].tsx` (pasar `onEliminado`/manejar duplicar)
- Modify: `app.json` (revisión de icon/splash — nota de asset pendiente)

**Interfaces:**
- Consumes: `duplicarFicha(id)`, `eliminarFicha(id)` desde `src/services/storage.ts` (Task 2, ya implementadas y testeadas).

- [ ] **Step 1: Agregar acciones de Duplicar y Eliminar al formulario cuando se edita una ficha existente**

En `src/components/FichaForm.tsx`, extender `Props` y agregar botones:

```tsx
import { duplicarFicha, eliminarFicha, crearFicha, actualizarFicha, NuevaFichaInput } from '../services/storage';

type Props = {
  ficha: Ficha | null;
  onGuardado: (ficha: Ficha) => void;
  onEliminado?: () => void;
};

export function FichaForm({ ficha, onGuardado, onEliminado }: Props) {
  // ...(estado existente de la Task 4 sin cambios)

  async function duplicar() {
    if (!ficha) return;
    try {
      const copia = await duplicarFicha(ficha.id);
      onGuardado(copia);
    } catch (e) {
      Alert.alert('Error', 'No se pudo duplicar la ficha.');
    }
  }

  function confirmarEliminar() {
    if (!ficha) return;
    Alert.alert('Eliminar ficha', '¿Seguro que quieres eliminar esta ficha? Esta acción no se puede deshacer.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await eliminarFicha(ficha.id);
            onEliminado?.();
          } catch (e) {
            Alert.alert('Error', 'No se pudo eliminar la ficha.');
          }
        },
      },
    ]);
  }

  // dentro del ScrollView, después del botón "Guardar":
  // {ficha && (
  //   <View style={styles.filaAcciones}>
  //     <Pressable style={styles.botonSecundario} onPress={duplicar}>
  //       <Text style={styles.botonSecundarioTexto}>Duplicar ficha</Text>
  //     </Pressable>
  //     <Pressable style={styles.botonEliminar} onPress={confirmarEliminar}>
  //       <Text style={styles.botonEliminarTexto}>Eliminar ficha</Text>
  //     </Pressable>
  //   </View>
  // )}
```

Agregar el bloque JSX real (no comentado) inmediatamente después del `Pressable` de "Guardar" dentro del `return`:
```tsx
{ficha && (
  <View style={styles.filaAcciones}>
    <Pressable style={styles.botonSecundario} onPress={duplicar}>
      <Text style={styles.botonSecundarioTexto}>Duplicar ficha</Text>
    </Pressable>
    <Pressable style={styles.botonEliminar} onPress={confirmarEliminar}>
      <Text style={styles.botonEliminarTexto}>Eliminar ficha</Text>
    </Pressable>
  </View>
)}
```

Agregar a `styles`:
```ts
filaAcciones: { flexDirection: 'row', gap: 12, marginBottom: 60 },
botonSecundario: {
  flex: 1,
  padding: 12,
  borderRadius: 10,
  borderWidth: 1,
  borderColor: '#2f6fed',
  alignItems: 'center',
},
botonSecundarioTexto: { color: '#2f6fed', fontWeight: '700' },
botonEliminar: {
  flex: 1,
  padding: 12,
  borderRadius: 10,
  backgroundColor: '#d33',
  alignItems: 'center',
},
botonEliminarTexto: { color: '#fff', fontWeight: '700' },
```

- [ ] **Step 2: Conectar `onEliminado` en `app/ficha/[id].tsx`**

```tsx
return <FichaForm ficha={ficha} onGuardado={() => router.back()} onEliminado={() => router.back()} />;
```

- [ ] **Step 3: Manejo de errores de AsyncStorage ya cubierto**

Los `try/catch` con `Alert.alert` agregados en Task 4 (`guardar`) y en este Task (`duplicar`, `confirmarEliminar`) ya cumplen "mostrar aviso si falla el guardado". No se requiere código adicional; verificar leyendo `FichaForm.tsx` que los tres flujos (guardar, duplicar, eliminar) tienen `try/catch`.

- [ ] **Step 4: Ajustes visuales de legibilidad**

En `MedidasTable.tsx` y `FichaForm.tsx`, confirmar que los tamaños de fuente usados son >= 15 (ya lo son en el código de las tasks anteriores) para uso cómodo en el taller. No se requiere cambio si se siguió el código tal cual.

- [ ] **Step 5: Ícono y splash screen**

`app.json` ya apunta (por defecto del scaffold `blank-typescript`) a `./assets/icon.png` y `./assets/splash.png`. Reemplazar esos archivos por el arte final de FichaMedidam es una tarea de diseño gráfico fuera del alcance de este plan de código — dejar nota para el usuario: reemplazar `assets/icon.png` (1024x1024) y `assets/splash.png` cuando tenga el arte final, sin tocar `app.json` salvo que cambien los nombres de archivo.

- [ ] **Step 6: Verificación manual (Expo Go)**

Checklist:
1. Abrir una ficha existente → aparecen los botones "Duplicar ficha" y "Eliminar ficha".
2. Duplicar: se crea una copia y se navega a ella (o al listado); confirmar en el listado que hay una ficha nueva con los mismos datos y un `id` distinto.
3. Eliminar: aparece diálogo de confirmación; cancelar no borra nada; confirmar sí borra y vuelve al listado.
4. Poner el teléfono en modo avión y repetir: crear, editar, listar, eliminar, duplicar — todo debe funcionar igual.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: add duplicate/delete actions with confirmation to ficha form"
```

---

### Task 7: Fase 7 — Verificación final (checklist manual, a cargo del usuario)

**Files:** ninguno (no es una tarea de código; es la ejecución del checklist de aceptación del roadmap).

- [ ] **Step 1: Ejecutar en el celular (Android y/o iOS, con Expo Go) el checklist completo de la sección "Fase 7" del roadmap original**, punto por punto:
  - Datos y almacenamiento (crear ficha completa, cerrar/reabrir app, editar y confirmar `actualizadoEn` cambia y `creadoEn` no, eliminar con confirmación, duplicar con nuevo `id`).
  - Funcionamiento offline (modo avión: crear, editar, listar, eliminar).
  - Formulario (guardar sin nombre falla, texto en campo numérico se rechaza, los 29 campos de medidas están presentes y agrupados).
  - Exportación (3+ fichas, exportar, abrir el `.json` y verificar `schemaVersion`/`exportadoEn`/`fichas`, compartir por Drive/correo/WhatsApp).
  - Multiplataforma (repetir en Android e iOS o simuladores).
  - Costo y dependencias (revisar `package.json`: ninguna dependencia requiere cuenta/API key/pago; la app nunca pide permisos de red obligatorios, solo compartir bajo demanda).

- [ ] **Step 2: Solo cuando todo el checklist anterior esté marcado, dar la v1 de FichaMedidam por completa.**

---

## Self-Review

**Cobertura del spec:**
- Sección 2 (stack): cubierto en Task 1 (expo-router, async-storage, file-system, sharing, expo-crypto en vez de `uuid` — permitido explícitamente por el roadmap).
- Sección 3 (modelo de datos, 29 campos de `Medidas`, `ExportPayload`): cubierto íntegro en Task 2, Step 1 — ningún campo fue fusionado ni renombrado.
- Sección 4 (estructura de carpetas): respetada (`app/`, `src/types`, `src/services`, `src/components`, `src/utils`), con la única adaptación de que `src/utils/uuid.ts` usa `expo-crypto` en vez de la librería `uuid` — opción explícitamente permitida por el roadmap.
- Fase 0–5 y 7 del roadmap: cada una mapea 1:1 a una Task de este plan (Task 1–7); Fase 6 (software receptor futuro) queda fuera de alcance, tal como indica el roadmap.
- Criterios de aceptación de cada fase están incluidos como checklist de verificación manual dentro de la task correspondiente.

**Placeholders:** no hay TODOs ni "similar a la task N"; todo el código de cada step está completo.

**Consistencia de tipos:** `NuevaFichaInput` (Task 2) se reutiliza igual en `storage.ts`, `FichaForm.tsx` (Task 4) y `export.ts` no lo necesita (usa `Ficha` completo). `Ficha`, `Medidas`, `Tela`, `ExportPayload` se usan con los mismos nombres de campo en todos los tasks.
