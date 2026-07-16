jest.mock('expo-print', () => ({
  printToFileAsync: jest
    .fn()
    .mockResolvedValue({ uri: 'file:///cache/ficha.pdf', base64: 'cGRmLWJhc2U2NA==' }),
  printAsync: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn().mockResolvedValue(true),
  shareAsync: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
jest.mock('../guiaCarpetaBridge', () => ({
  solicitarPermisoConGuia: jest.fn(),
}));
jest.mock('expo-file-system/legacy', () => ({
  EncodingType: { Base64: 'base64' },
  documentDirectory: 'file:///documents/',
  writeAsStringAsync: jest.fn().mockResolvedValue(undefined),
  StorageAccessFramework: {
    getUriForDirectoryInRoot: jest.fn().mockReturnValue('content://com.android.externalstorage/Download'),
    requestDirectoryPermissionsAsync: jest
      .fn()
      .mockResolvedValue({ granted: true, directoryUri: 'content://tree/carpeta-descargas' }),
    readDirectoryAsync: jest.fn().mockResolvedValue([]),
    makeDirectoryAsync: jest
      .fn()
      .mockResolvedValue('content://tree/carpeta-descargas/FichasApp'),
    createFileAsync: jest.fn().mockResolvedValue('content://tree/carpeta-descargas/FichasApp/Ficha_Ana_Perez.pdf'),
  },
}));
jest.mock('expo-image-manipulator', () => ({
  SaveFormat: { JPEG: 'jpeg', PNG: 'png', WEBP: 'webp' },
  ImageManipulator: {
    manipulate: jest.fn().mockReturnValue({
      resize: jest.fn().mockReturnThis(),
      renderAsync: jest.fn().mockResolvedValue({
        saveAsync: jest.fn().mockResolvedValue({ base64: 'ZmFrZS1qcGVn' }),
      }),
    }),
  },
}));
jest.mock('expo-asset', () => ({
  Asset: {
    fromModule: jest.fn().mockReturnValue({
      downloadAsync: jest.fn().mockResolvedValue(undefined),
      localUri: 'file:///cache/silueta.png',
    }),
  },
}));
jest.mock('../../components/siluetas/Silueta', () => ({
  aspectoDe: jest.fn().mockReturnValue(1),
  imagenDe: jest.fn().mockReturnValue(1),
}));

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { solicitarPermisoConGuia } from '../guiaCarpetaBridge';
import { crearMedidasVacias, crearBocetoVacio, Ficha } from '../../types/ficha';
import {
  datosGeneralesHtml,
  medidasATablaHtml,
  telasColoresValorHtml,
  bocetoTrazosSvg,
  generarHtmlFicha,
  generarPdfFicha,
  configurarCarpetaGuardado,
  guardarPdfFicha,
  imprimirFicha,
} from '../pdf';

const CLAVE_CARPETA = 'pdfStorageDirectoryUri';

const fichaDeEjemplo: Ficha = {
  id: 'uuid-1',
  schemaVersion: 2,
  nombre: 'Ana Pérez',
  cliente: 'María López',
  referencia: 'Vestido de gala',
  fecha: '2026-07-01',
  medidas: { ...crearMedidasVacias(), busto: 90, cintura: 70 },
  tiro: 28,
  telas: [{ tipo: 'Seda', color: 'Rojo' }],
  colores: ['Rojo', 'Dorado'],
  notas: 'Hombros anchos, prefiere manga larga',
  valorTotal: 1500,
  contextura: 'femenina',
  boceto: {
    trazos: [{ puntos: [{ x: 0, y: 0 }, { x: 1, y: 1 }], color: '#111', ancho: 3 }],
  },
  creadoEn: '2026-07-01T00:00:00.000Z',
  actualizadoEn: '2026-07-01T00:00:00.000Z',
};

describe('datosGeneralesHtml', () => {
  it('incluye los datos del encabezado (nombre, cliente, referencia, fecha, contextura, tiro)', () => {
    const html = datosGeneralesHtml(fichaDeEjemplo);
    expect(html).toContain('Ana Pérez');
    expect(html).toContain('María López');
    expect(html).toContain('Vestido de gala');
    expect(html).toContain('2026-07-01');
    expect(html).toContain('Femenina');
    expect(html).toContain('28 cm');
  });

  it('NO incluye telas, colores ni valor total (esos van en la página 2)', () => {
    const html = datosGeneralesHtml(fichaDeEjemplo);
    expect(html).not.toContain('1500');
    expect(html).not.toContain('Seda');
    expect(html).not.toContain('Dorado');
  });

  it('usa "-" para campos vacíos', () => {
    const sinDatos: Ficha = { ...fichaDeEjemplo, cliente: '', tiro: null };
    const html = datosGeneralesHtml(sinDatos);
    expect(html).toContain('<td>-</td>');
  });
});

describe('telasColoresValorHtml (página 2)', () => {
  it('incluye telas, colores y valor total', () => {
    const html = telasColoresValorHtml(fichaDeEjemplo);
    expect(html).toContain('Seda');
    expect(html).toContain('Rojo');
    expect(html).toContain('Dorado');
    expect(html).toContain('1500');
    expect(html).toContain('class="pagina2"'); // el CSS aplica el salto de página a .pagina2
  });

  it('muestra "Sin telas" / "Sin colores" cuando están vacíos', () => {
    const html = telasColoresValorHtml({ ...fichaDeEjemplo, telas: [], colores: [] });
    expect(html).toContain('Sin telas');
    expect(html).toContain('Sin colores');
  });
});

describe('medidasATablaHtml', () => {
  it('incluye cada grupo y campo con su valor', () => {
    const html = medidasATablaHtml(fichaDeEjemplo.medidas);
    expect(html).toContain('Torso');
    expect(html).toContain('Busto');
    expect(html).toContain('90 cm');
    expect(html).toContain('Cintura');
    expect(html).toContain('70 cm');
  });

  it('muestra "-" cuando la medida es null', () => {
    const html = medidasATablaHtml(crearMedidasVacias());
    expect(html).toContain('-');
    expect(html).not.toContain('null cm');
  });
});

describe('bocetoTrazosSvg', () => {
  it('genera un <svg> con un <path> por trazo', () => {
    const svg = bocetoTrazosSvg(fichaDeEjemplo.boceto, 200, 200);
    expect(svg).toContain('<svg');
    expect(svg).toContain('<path');
    expect(svg).toContain('stroke="#111"');
    expect(svg).toContain('stroke-width="3"');
  });

  it('no genera <path> si no hay trazos', () => {
    const svg = bocetoTrazosSvg(crearBocetoVacio(), 200, 200);
    expect(svg).not.toContain('<path');
  });
});

describe('generarHtmlFicha', () => {
  it('arma un HTML completo con silueta embebida, datos, notas y la página 2', async () => {
    const html = await generarHtmlFicha(fichaDeEjemplo);
    expect(html).toContain('data:image/jpeg;base64,ZmFrZS1qcGVn');
    expect(html).toContain('Ana Pérez');
    expect(html).toContain('<svg');
    // Notas en la página 1
    expect(html).toContain('Notas');
    expect(html).toContain('Hombros anchos, prefiere manga larga');
    // Página 2 con telas / colores / valor
    expect(html).toContain('class="pagina2"');
    expect(html).toContain('Seda');
    expect(html).toContain('1500');
  });
});

describe('generarPdfFicha', () => {
  it('genera el HTML y llama a Print.printToFileAsync pidiendo base64', async () => {
    const { uri, base64 } = await generarPdfFicha(fichaDeEjemplo);
    expect(Print.printToFileAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        html: expect.stringContaining('Ana Pérez'),
        width: 612,
        height: 792,
        base64: true,
      })
    );
    expect(uri).toBe('file:///cache/ficha.pdf');
    expect(base64).toBe('cGRmLWJhc2U2NA==');
  });
});

describe('configurarCarpetaGuardado', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
    jest
      .mocked(FileSystem.StorageAccessFramework.getUriForDirectoryInRoot)
      .mockReturnValue('content://com.android.externalstorage/Download');
    jest
      .mocked(FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync)
      .mockResolvedValue({ granted: true, directoryUri: 'content://tree/carpeta-descargas' });
    jest.mocked(FileSystem.StorageAccessFramework.readDirectoryAsync).mockResolvedValue([]);
    jest
      .mocked(FileSystem.StorageAccessFramework.makeDirectoryAsync)
      .mockResolvedValue('content://tree/carpeta-descargas/FichasApp');
  });

  it('pide permiso apuntando a "Download", crea la subcarpeta FichasApp y la guarda en AsyncStorage', async () => {
    const uri = await configurarCarpetaGuardado();

    expect(FileSystem.StorageAccessFramework.getUriForDirectoryInRoot).toHaveBeenCalledWith('Download');
    expect(FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync).toHaveBeenCalledWith(
      'content://com.android.externalstorage/Download'
    );
    expect(FileSystem.StorageAccessFramework.makeDirectoryAsync).toHaveBeenCalledWith(
      'content://tree/carpeta-descargas',
      'FichasApp'
    );
    expect(uri).toBe('content://tree/carpeta-descargas/FichasApp');
    expect(await AsyncStorage.getItem(CLAVE_CARPETA)).toBe('content://tree/carpeta-descargas/FichasApp');
  });

  it('reutiliza la subcarpeta FichasApp si ya existe, sin crearla de nuevo', async () => {
    jest
      .mocked(FileSystem.StorageAccessFramework.readDirectoryAsync)
      .mockResolvedValue(['content://tree/carpeta-descargas/FichasApp']);

    const uri = await configurarCarpetaGuardado();

    expect(FileSystem.StorageAccessFramework.makeDirectoryAsync).not.toHaveBeenCalled();
    expect(uri).toBe('content://tree/carpeta-descargas/FichasApp');
  });

  it('lanza error si el usuario no otorga permiso de carpeta', async () => {
    jest
      .mocked(FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync)
      .mockResolvedValueOnce({ granted: false });

    await expect(configurarCarpetaGuardado()).rejects.toThrow();
  });
});

describe('guardarPdfFicha', () => {
  const osOriginal = Platform.OS;

  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
    jest
      .mocked(FileSystem.StorageAccessFramework.createFileAsync)
      .mockResolvedValue('content://tree/carpeta-descargas/FichasApp/Ficha_Ana_Perez.pdf');
  });

  afterEach(() => {
    Platform.OS = osOriginal;
  });

  it('en Android: si ya hay una carpeta configurada, guarda directo sin mostrar la guía', async () => {
    Platform.OS = 'android';
    await AsyncStorage.setItem(CLAVE_CARPETA, 'content://tree/carpeta-descargas/FichasApp');

    const { uri } = await guardarPdfFicha(fichaDeEjemplo);

    expect(solicitarPermisoConGuia).not.toHaveBeenCalled();
    expect(FileSystem.StorageAccessFramework.createFileAsync).toHaveBeenCalledWith(
      'content://tree/carpeta-descargas/FichasApp',
      expect.stringContaining('Ana'),
      'application/pdf'
    );
    expect(uri).toBe('content://tree/carpeta-descargas/FichasApp/Ficha_Ana_Perez.pdf');
  });

  it('en Android: si no hay carpeta configurada, muestra la guía y guarda una vez concedido el permiso', async () => {
    Platform.OS = 'android';
    jest.mocked(solicitarPermisoConGuia).mockImplementation(async () => {
      await AsyncStorage.setItem(CLAVE_CARPETA, 'content://tree/carpeta-nueva/FichasApp');
      return true;
    });

    const { uri } = await guardarPdfFicha(fichaDeEjemplo);

    expect(solicitarPermisoConGuia).toHaveBeenCalled();
    expect(FileSystem.StorageAccessFramework.createFileAsync).toHaveBeenCalledWith(
      'content://tree/carpeta-nueva/FichasApp',
      expect.any(String),
      'application/pdf'
    );
    expect(uri).toBe('content://tree/carpeta-descargas/FichasApp/Ficha_Ana_Perez.pdf');
  });

  it('en Android: lanza error si el usuario cancela la guía', async () => {
    Platform.OS = 'android';
    jest.mocked(solicitarPermisoConGuia).mockResolvedValue(false);

    await expect(guardarPdfFicha(fichaDeEjemplo)).rejects.toThrow();
  });

  it('en Android: si falla escribir con la carpeta guardada, la descarta y vuelve a mostrar la guía', async () => {
    Platform.OS = 'android';
    await AsyncStorage.setItem(CLAVE_CARPETA, 'content://tree/carpeta-invalida/FichasApp');
    jest
      .mocked(FileSystem.StorageAccessFramework.createFileAsync)
      .mockRejectedValueOnce(new Error('carpeta inválida'))
      .mockResolvedValueOnce('content://tree/carpeta-nueva/FichasApp/Ficha_Ana_Perez.pdf');
    jest.mocked(solicitarPermisoConGuia).mockImplementation(async () => {
      await AsyncStorage.setItem(CLAVE_CARPETA, 'content://tree/carpeta-nueva/FichasApp');
      return true;
    });

    const { uri } = await guardarPdfFicha(fichaDeEjemplo);

    expect(solicitarPermisoConGuia).toHaveBeenCalled();
    expect(uri).toBe('content://tree/carpeta-nueva/FichasApp/Ficha_Ana_Perez.pdf');
  });

  it('en iOS: usa el share sheet nativo (expo-sharing)', async () => {
    Platform.OS = 'ios';

    const { uri } = await guardarPdfFicha(fichaDeEjemplo);

    expect(Sharing.shareAsync).toHaveBeenCalledWith(
      'file:///cache/ficha.pdf',
      expect.objectContaining({ mimeType: 'application/pdf' })
    );
    expect(uri).toBe('file:///cache/ficha.pdf');
  });

  it('en iOS: lanza error si no hay forma de compartir en el dispositivo', async () => {
    Platform.OS = 'ios';
    jest.mocked(Sharing.isAvailableAsync).mockResolvedValueOnce(false);

    await expect(guardarPdfFicha(fichaDeEjemplo)).rejects.toThrow();
  });
});

describe('imprimirFicha', () => {
  it('genera el HTML y llama a Print.printAsync', async () => {
    await imprimirFicha(fichaDeEjemplo);
    expect(Print.printAsync).toHaveBeenCalledWith(
      expect.objectContaining({ html: expect.stringContaining('Ana Pérez') })
    );
  });
});
