import { Image, StyleSheet } from 'react-native';
import { Contextura } from '../../types/ficha';

// Relación de aspecto (ancho / alto) real de cada imagen de silueta.
// El canvas de boceto usa este aspecto (según la contextura) para dimensionar
// la caja de dibujo, de modo que las coordenadas normalizadas 0..1 calcen sobre
// el cuerpo. Valores tomados de las dimensiones reales de los PNG:
//   femenina.png = 1254 x 1254   ->  1.0000
//   masculina.png = 1313 x 1198  ->  1.0960
const ASPECTOS: Record<Contextura, number> = {
  femenina: 1254 / 1254,
  masculina: 1313 / 1198,
};

export function aspectoDe(contextura: Contextura): number {
  return ASPECTOS[contextura];
}

const IMAGENES: Record<Contextura, number> = {
  femenina: require('../../../assets/siluetas/femenina.png'),
  masculina: require('../../../assets/siluetas/masculina.png'),
};

export function imagenDe(contextura: Contextura): number {
  return IMAGENES[contextura];
}

type Props = {
  contextura: Contextura;
};

export function Silueta({ contextura }: Props) {
  return <Image source={IMAGENES[contextura]} resizeMode="contain" style={styles.imagen} />;
}

const styles = StyleSheet.create({
  imagen: { width: '100%', height: '100%' },
});
