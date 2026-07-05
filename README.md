# FichaMedidam

App móvil (iOS + Android) para reemplazar la ficha física de medidas de costura.
Un sastre o modista crea una ficha por clienta, con sus datos de contacto y todas
las medidas corporales necesarias para confeccionar un traje.

## Principios de diseño

- **Costo $0, para siempre.** Ninguna dependencia requiere cuenta, API key ni
  servicio de pago.
- **100% offline.** Funciona sin conexión a internet, siempre.
- **Datos locales.** Todo se guarda en el celular (AsyncStorage), sin backend.
- **Exportación en bloque.** Toda la información se puede exportar a un archivo
  JSON para importarla, en el futuro, a un software de escritorio o web. La app
  y ese software futuro se comunican *solo* a través de ese archivo — sin
  acoplamiento directo.
- **Boceto de silueta.** Cada ficha incluye una pestaña "Boceto" con un dibujo
  a mano alzada sobre una silueta (femenina o masculina, según la
  `contextura` elegida) para anotar detalles visuales del diseño.

## Stack

| Capa | Tecnología |
|---|---|
| App | React Native + Expo (managed, SDK 57) |
| Lenguaje | TypeScript |
| Navegación | Expo Router |
| Almacenamiento | `@react-native-async-storage/async-storage` |
| Exportación | `expo-file-system` + `expo-sharing` |
| IDs únicos | `expo-crypto` (UUID v4) |
| Tests | `jest` + `jest-expo` |

Sin Firebase, sin backend, sin cuentas de terceros.

## Requisitos

- Node.js 18+ (probado con v22)
- App **Expo Go** instalada en tu teléfono (App Store / Play Store)

## Instalación y ejecución

```bash
git clone https://github.com/mig-bn/FichaMedida.git
cd FichaMedida
npm install
npx expo start
```

Luego escanea el QR con **Expo Go** (Android) o la cámara (iOS).

> Si algún `npm install` falla con un error `ERESOLVE`, ya está configurado
> `.npmrc` con `legacy-peer-deps=true` para evitarlo.

## Tests y verificación de tipos

```bash
npm test          # jest — lógica pura y capa de almacenamiento
npx tsc --noEmit  # verificación de tipos (0 errores esperados)
```

## Estructura

```
FichaMedida/
├── app/                      # pantallas (Expo Router)
│   ├── index.tsx             # listado de fichas + buscador + exportar
│   ├── ficha/nueva.tsx       # crear ficha
│   └── ficha/[id].tsx        # ver / editar ficha
├── src/
│   ├── types/ficha.ts        # tipos Ficha, Medidas (29 campos), Contextura, Boceto, ExportPayload
│   ├── services/
│   │   ├── storage.ts        # CRUD sobre AsyncStorage
│   │   └── export.ts         # generar y compartir el JSON
│   ├── components/
│   │   ├── FichaForm.tsx     # pestañas Ficha / Boceto
│   │   ├── MedidasTable.tsx
│   │   ├── BocetoCanvas.tsx  # lienzo táctil (dibujar, deshacer, borrar todo)
│   │   ├── PasoPrevioNueva.tsx  # paso previo: nombre/referencia/fecha/contextura
│   │   ├── siluetas/         # silueta femenina/masculina de fondo del boceto
│   │   └── FichaListItem.tsx
│   └── utils/                # uuid, validación
└── docs/
    ├── VERIFICACION_FASE7.md            # checklist de pruebas en dispositivo
    └── superpowers/plans/               # plan de implementación
```

## Modelo de datos

Cada ficha es un documento independiente bajo la llave `ficha:<uuid>` en
AsyncStorage; un arreglo `indice_fichas` mantiene la lista de todas las fichas.

Desde la v2 cada `Ficha` incluye además:

- `contextura: 'femenina' | 'masculina'` — se elige en el paso previo al crear
  la ficha (por defecto `'femenina'`) y puede cambiarse luego desde el
  formulario; determina qué silueta de fondo se muestra en el boceto.
- `boceto: { trazos: Trazo[] }` — el dibujo a mano alzada de la pestaña
  "Boceto", donde cada `Trazo` es:

  ```ts
  type Punto = { x: number; y: number }; // normalizados 0..1 (independientes del tamaño de pantalla)
  type Trazo = { puntos: Punto[]; color: string; ancho: number };
  type Boceto = { trazos: Trazo[] };
  ```

  Los puntos se guardan normalizados (0 a 1, relativos al ancho/alto del
  lienzo) para que el trazo se dibuje igual sin importar el tamaño de
  pantalla del dispositivo.

Formato de exportación:

```ts
type ExportPayload = {
  schemaVersion: 2;
  exportadoEn: string;   // ISO 8601
  fichas: Ficha[];
};
```

### Migración v1 → v2

Las fichas creadas con la v1 (sin `contextura` ni `boceto`) se siguen leyendo
sin problema: `src/services/storage.ts` normaliza cada ficha al leerla
(`normalizarFicha`), asignándole `contextura: 'femenina'` y un `boceto` vacío
(`{ trazos: [] }`) por defecto, y fijando `schemaVersion: 2`. La migración es
transparente — no hace falta ninguna acción manual, y al guardar esa ficha
vuelve a escribirse ya en formato v2.

## Estado

Versión 1 — código completo y revisado. La verificación final en dispositivo
(persistencia, modo avión, exportación real, Android + iOS) está documentada en
[docs/VERIFICACION_FASE7.md](docs/VERIFICACION_FASE7.md).

Pendiente de diseño: reemplazar `assets/icon.png` y el splash por el arte final.
