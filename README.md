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
│   ├── types/ficha.ts        # tipos Ficha, Medidas (29 campos), ExportPayload
│   ├── services/
│   │   ├── storage.ts        # CRUD sobre AsyncStorage
│   │   └── export.ts         # generar y compartir el JSON
│   ├── components/
│   │   ├── FichaForm.tsx
│   │   ├── MedidasTable.tsx
│   │   └── FichaListItem.tsx
│   └── utils/                # uuid, validación
└── docs/
    ├── VERIFICACION_FASE7.md            # checklist de pruebas en dispositivo
    └── superpowers/plans/               # plan de implementación
```

## Modelo de datos

Cada ficha es un documento independiente bajo la llave `ficha:<uuid>` en
AsyncStorage; un arreglo `indice_fichas` mantiene la lista de todas las fichas.

Formato de exportación:

```ts
type ExportPayload = {
  schemaVersion: 1;
  exportadoEn: string;   // ISO 8601
  fichas: Ficha[];
};
```

## Estado

Versión 1 — código completo y revisado. La verificación final en dispositivo
(persistencia, modo avión, exportación real, Android + iOS) está documentada en
[docs/VERIFICACION_FASE7.md](docs/VERIFICACION_FASE7.md).

Pendiente de diseño: reemplazar `assets/icon.png` y el splash por el arte final.
