# FichaMedidam — Verificación final (Fase 7)

Estado del código al cerrar la construcción automatizada:
- `npx tsc --noEmit` → **0 errores**
- `npx jest` → **21/21 tests pasando** (uuid, validación, storage, export)
- Revisión final de rama completa (Opus): **v1-ready, sin hallazgos Critical ni Important**

Las tareas de código (Fases 0–5) están completas y revisadas. Lo que queda es
la **verificación manual en dispositivo**, que solo puedes hacer tú con tu
teléfono, porque en el entorno de construcción no hay simulador ni Expo Go.

---

## Cómo ejecutar la app en tu teléfono

1. En la carpeta del proyecto, instala Expo Go en tu celular (App Store / Play Store).
2. En la PC, dentro de `D:\Users\User W10\Documents\Proyecto\FichaMedida`, ejecuta:
   ```
   npx expo start
   ```
3. Escanea el QR con Expo Go (Android) o la cámara (iOS). La app abre como
   **FichaMedidam**.

> Nota: si algún `npm install` futuro falla con un error `ERESOLVE`, ya está
> configurado `.npmrc` con `legacy-peer-deps=true` para evitarlo (conflicto
> de peer-deps solo de las devtools web de expo-router, no afecta el runtime).

---

## Checklist de aceptación (Fase 7 del roadmap)

### Datos y almacenamiento
- [ ] Crear una ficha completa con todos los campos llenos (los 29 de medidas,
      telas, colores, tiro, valor total).
- [ ] Cerrar la app por completo (no minimizar) y reabrirla: la ficha sigue ahí.
- [ ] Editar una ficha y confirmar que `actualizadoEn` cambia mientras
      `creadoEn` se mantiene igual.
- [ ] Eliminar una ficha: debe pedir **confirmación** antes de borrar.
- [ ] Duplicar una ficha: debe generar un `id` (UUID) nuevo y distinto.

### Funcionamiento offline
- [ ] Activar modo avión y repetir: crear, editar, listar, eliminar, duplicar.
      Todo debe funcionar igual que con internet.

### Formulario
- [ ] Guardar una ficha **sin nombre** → debe mostrar error y no guardar.
- [ ] Escribir texto en un campo de medida (numérico) → debe rechazarlo
      (el campo queda vacío), nunca guarda datos corruptos.
- [ ] Confirmar visualmente que los **31 campos de medidas** están presentes y
      editables, agrupados (Torso / Blusa y Mangas / Pantalón, Short y Falda).

### Exportación
- [ ] Con al menos 3 fichas guardadas, tocar **"Exportar todo"**.
- [ ] Confirmar que el `.json` generado abre en un editor de texto y contiene
      `schemaVersion`, `exportadoEn` y el arreglo completo `fichas`.
- [ ] Confirmar que aparece el menú de compartir nativo y permite guardar el
      archivo en Google Drive / correo / WhatsApp.
- [ ] (Extra) Con **cero fichas**, "Exportar todo" debe avisar "No hay fichas
      para exportar" y no abrir el menú de compartir.

### Multiplataforma
- [ ] Repetir las pruebas anteriores en Android y en iOS (o simuladores).

### Costo y dependencias
- [ ] `package.json`: ninguna dependencia requiere cuenta, API key ni servicio
      de pago (verificado en la revisión final — todas son offline/gratis).
- [ ] La app nunca pide permisos de red obligatorios (solo compartir archivos,
      opcional y bajo demanda).

---

## Verificación v2 (boceto, contextura, cm)

Checklist manual en dispositivo para lo agregado en la v2: `contextura`,
`boceto` (silueta + dibujo a mano alzada) y el sufijo fijo "cm" en Medidas/Tiro.

- [ ] Tocar **+** (nueva ficha): el paso previo pide **Nombre**, **Referencia**,
      **Fecha** y **Contextura** (segmentado Femenina/Masculina, con
      **Femenina** seleccionada por defecto).
- [ ] Dejar el **Nombre vacío** y continuar: la ficha se crea con el nombre
      genérico **"Ficha sin nombre"**.
- [ ] Dejar la **Fecha** sin tocar: se usa la fecha de **hoy** por defecto.
- [ ] En el formulario, los campos de **Medidas** (los 31) y el campo **Tiro**
      muestran un sufijo fijo **"cm"** junto al input, que **no desaparece**
      al escribir un valor (es un texto aparte, no un placeholder).
- [ ] Cambiar entre las pestañas **Ficha** y **Boceto** dentro del formulario:
      ambas conservan sus datos al alternar.
- [ ] En la pestaña **Boceto**: la silueta de fondo corresponde a la
      **contextura** elegida (femenina o masculina).
- [ ] Dibujar con el dedo sobre la silueta: el trazo sigue el dedo en tiempo
      real.
- [ ] **Deshacer**: quita el último trazo dibujado (uno por uno).
- [ ] **Borrar todo**: pide **confirmación** antes de vaciar el boceto
      completo.
- [ ] Guardar desde la pestaña **Ficha** o desde **Boceto** indistintamente:
      ambas usan el mismo botón "Guardar" y persisten los mismos datos.
- [ ] Cerrar la app por completo (no minimizar) y reabrir la ficha: el
      **boceto** (los trazos dibujados) y la **contextura** siguen ahí.
- [ ] Cambiar la **Contextura** de Femenina a Masculina en una ficha existente:
      la silueta de fondo del boceto cambia de inmediato.
- [ ] **Exportar todo**: el `.json` generado incluye `"schemaVersion": 2`, y
      cada ficha del arreglo `fichas` trae `contextura` y `boceto.trazos`.
- [ ] Abrir una ficha creada **antes de la v2** (formato v1, sin `contextura`
      ni `boceto` guardados): abre sin errores, se muestra como
      **Femenina** y con el boceto **vacío** (migración transparente vía
      `normalizarFicha`).

---

## Pendientes de diseño (no de código)

- [ ] **Ícono y splash**: reemplazar `assets/icon.png` (1024×1024) y la imagen
      de splash por el arte final de FichaMedidam cuando lo tengas. No hace
      falta tocar `app.json` salvo que cambien los nombres de archivo.

---

## Notas de la revisión final (Minor, no bloqueantes)

Ninguna impide usar la v1; se dejan documentadas por si en el futuro quieres endurecer:

1. **Escrituras no atómicas en storage** (`src/services/storage.ts`): al crear
   o eliminar, el blob de la ficha y el índice se escriben en dos pasos. Si el
   proceso muriera justo entre ambos, podría quedar una clave huérfana. En una
   app de un solo usuario y sin escrituras concurrentes esto es prácticamente
   inalcanzable, y `listarFichas` ya tolera ids colgantes filtrando `null`.
2. **Medidas inválidas se descartan en silencio**: escribir letras o números
   negativos en un campo de medida lo deja vacío sin aviso. Es un diseño
   deliberado y testeado (las medidas son opcionales); un extra futuro sería
   un hint visual.
3. **`.npmrc` con `legacy-peer-deps=true`**: presente por un conflicto de
   peer-deps de las devtools web de expo-router; cosmético, revisable cuando
   el ecosistema (Expo 57 / RN 0.86 / React 19.2) se asiente.

### Recomendaciones antes de dar por cerrada la v1
- Probar en dispositivo real el ciclo **exportar → abrir el `.json`** (los tests
  mockean el sistema de archivos, así que el round-trip real de escritura+compartir
  conviene verlo una vez de verdad).
- Probar el **DateTimePicker en iOS y Android** (el parseo de fecha en hora local
  ya evita el off-by-one de UTC, pero el comportamiento de cierre del picker
  difiere entre plataformas).
