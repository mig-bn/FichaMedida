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

export type Contextura = 'femenina' | 'masculina';

export type Punto = { x: number; y: number };

export type Trazo = { puntos: Punto[]; color: string; ancho: number };

export type Boceto = { trazos: Trazo[] };

export type Ficha = {
  id: string;
  schemaVersion: 2;
  nombre: string;
  cliente: string;
  referencia: string;
  fecha: string;
  medidas: Medidas;
  tiro: number | null;
  telas: Tela[];
  colores: string[];
  valorTotal: number | null;
  contextura: Contextura;
  boceto: Boceto;
  creadoEn: string;
  actualizadoEn: string;
};

export type ExportPayload = {
  schemaVersion: 2;
  exportadoEn: string;
  fichas: Ficha[];
};

export function crearBocetoVacio(): Boceto {
  return { trazos: [] };
}

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
