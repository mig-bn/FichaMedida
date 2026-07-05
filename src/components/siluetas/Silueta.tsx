import { Contextura } from '../../types/ficha';
import { SiluetaFemenina } from './SiluetaFemenina';
import { SiluetaMasculina } from './SiluetaMasculina';

// Aspecto (ancho x alto) compartido por ambas siluetas. El canvas de boceto
// (tarea siguiente) debe usar este mismo viewBox para que las coordenadas
// normalizadas 0..1 se alineen con el dibujo de fondo.
export const VIEWBOX = '0 0 100 130';
export const ANCHO_VIEWBOX = 100;
export const ALTO_VIEWBOX = 130;
export const ASPECTO = ANCHO_VIEWBOX / ALTO_VIEWBOX;

type Props = {
  contextura: Contextura;
};

export function Silueta({ contextura }: Props) {
  return contextura === 'masculina' ? <SiluetaMasculina /> : <SiluetaFemenina />;
}
