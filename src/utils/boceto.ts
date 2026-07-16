import { Punto } from '../types/ficha';

export function construirPathSvg(puntos: Punto[], ancho: number, alto: number): string {
  if (puntos.length === 0) return '';
  const [primero, ...resto] = puntos;
  let d = `M ${primero.x * ancho} ${primero.y * alto}`;
  for (const punto of resto) {
    d += ` L ${punto.x * ancho} ${punto.y * alto}`;
  }
  return d;
}
