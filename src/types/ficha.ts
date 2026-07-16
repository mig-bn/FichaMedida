export type Medidas = {
  talleDelantero: number | null;
  talleTrasero: number | null;
  espalda: number | null;
  busto: number | null;
  cadera: number | null;
  cintura: number | null;
  alturaBusto: number | null;
  separacionBusto: number | null;
  anchoPecho: number | null;
  anchoEspalda: number | null;
  contornoImperio: number | null;
  alturaImperio: number | null;
  alturaCadera: number | null;
  alturaRodilla: number | null;
  largoBlusa: number | null;
  largoPantalon: number | null;
  largoShort: number | null;
  largoPescador: number | null;
  largoTorero: number | null;
  largoFalda: number | null;
  largoMangaLarga: number | null;
  largoMangaCorta: number | null;
  largoManga34: number | null;
  puno: number | null;
  puno34: number | null;
  contornoBrazo: number | null;
  contornoStrapple: number | null;
  hombro: number | null;
  costado: number | null;
  anchoBota: number | null;
  contornoCuello: number | null;
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
  notas: string;
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
    cadera: null,
    cintura: null,
    alturaBusto: null,
    separacionBusto: null,
    anchoPecho: null,
    anchoEspalda: null,
    contornoImperio: null,
    alturaImperio: null,
    alturaCadera: null,
    alturaRodilla: null,
    largoBlusa: null,
    largoPantalon: null,
    largoShort: null,
    largoPescador: null,
    largoTorero: null,
    largoFalda: null,
    largoMangaLarga: null,
    largoMangaCorta: null,
    largoManga34: null,
    puno: null,
    puno34: null,
    contornoBrazo: null,
    contornoStrapple: null,
    hombro: null,
    costado: null,
    anchoBota: null,
    contornoCuello: null,
  };
}

export const GRUPOS_MEDIDAS: { titulo: string; campos: { key: keyof Medidas; label: string }[] }[] = [
  {
    titulo: 'Torso',
    campos: [
      { key: 'talleDelantero', label: 'Talle Delantero' },
      { key: 'talleTrasero', label: 'Talle Posterior' },
      { key: 'espalda', label: 'Espalda' },
      { key: 'busto', label: 'Busto' },
      { key: 'cadera', label: 'Cadera' },
      { key: 'cintura', label: 'Cintura' },
      { key: 'alturaBusto', label: 'Altura Busto' },
      { key: 'separacionBusto', label: 'Separación Busto' },
      { key: 'anchoPecho', label: 'Ancho Pecho' },
      { key: 'anchoEspalda', label: 'Ancho Espalda' },
      { key: 'contornoImperio', label: 'Contorno Imperio' },
      { key: 'alturaImperio', label: 'Altura Imperio' },
      { key: 'alturaCadera', label: 'Altura Cadera' },
      { key: 'contornoStrapple', label: 'Contorno Strapple' },
      { key: 'hombro', label: 'Hombro' },
      { key: 'costado', label: 'Costado' },
      { key: 'contornoCuello', label: 'Contorno de Cuello' },
    ],
  },
  {
    titulo: 'Blusa y Mangas',
    campos: [
      { key: 'largoBlusa', label: 'Largo Blusa' },
      { key: 'largoMangaLarga', label: 'Manga Larga' },
      { key: 'largoMangaCorta', label: 'Manga Corta' },
      { key: 'largoManga34', label: 'Manga 3/4' },
      { key: 'puno', label: 'Puño' },
      { key: 'puno34', label: 'Puño 3/4' },
      { key: 'contornoBrazo', label: 'Contorno Brazo' },
    ],
  },
  {
    titulo: 'Pantalón, Short y Falda',
    campos: [
      { key: 'largoPantalon', label: 'Largo Pantalón' },
      { key: 'largoShort', label: 'Largo Short' },
      { key: 'largoPescador', label: 'Largo Pescador' },
      { key: 'largoTorero', label: 'Largo Torero' },
      { key: 'largoFalda', label: 'Largo Falda' },
      { key: 'alturaRodilla', label: 'Altura Rodilla' },
      { key: 'anchoBota', label: 'Ancho Bota' },
    ],
  },
];
