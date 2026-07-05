import Svg, { Ellipse, Line, Path } from 'react-native-svg';
import { VIEWBOX } from './Silueta';

const COLOR = '#bbb';
const GROSOR = 1;

// Silueta femenina: figura de frente (izquierda) y de espalda (derecha),
// trazo simple de contorno. Cintura y cadera marcadas con curva.
export function SiluetaFemenina() {
  return (
    <Svg
      viewBox={VIEWBOX}
      width="100%"
      height="100%"
      preserveAspectRatio="xMidYMid meet"
    >
      {/* --- Figura de frente (izquierda) --- */}
      <Ellipse cx="23" cy="10" rx="6" ry="7" stroke={COLOR} strokeWidth={GROSOR} fill="none" />
      <Line x1="23" y1="17" x2="23" y2="21" stroke={COLOR} strokeWidth={GROSOR} />
      <Path
        d="M 12 28
           C 15 23, 31 23, 34 28
           C 36 34, 33 42, 30 48
           C 33 54, 33 60, 30 66
           C 33 72, 32 80, 27 85
           L 19 85
           C 14 80, 13 72, 16 66
           C 13 60, 13 54, 16 48
           C 13 42, 10 34, 12 28
           Z"
        stroke={COLOR}
        strokeWidth={GROSOR}
        fill="none"
      />
      {/* Brazos */}
      <Path d="M 12 28 C 8 38, 7 50, 9 62 L 12 62" stroke={COLOR} strokeWidth={GROSOR} fill="none" />
      <Path d="M 34 28 C 38 38, 39 50, 37 62 L 34 62" stroke={COLOR} strokeWidth={GROSOR} fill="none" />
      {/* Piernas */}
      <Path d="M 19 85 L 16 122 L 22 122 L 23 90" stroke={COLOR} strokeWidth={GROSOR} fill="none" />
      <Path d="M 27 85 L 30 122 L 24 122 L 23 90" stroke={COLOR} strokeWidth={GROSOR} fill="none" />

      {/* --- Figura de espalda (derecha) --- */}
      <Ellipse cx="77" cy="10" rx="6" ry="7" stroke={COLOR} strokeWidth={GROSOR} fill="none" />
      <Line x1="77" y1="17" x2="77" y2="21" stroke={COLOR} strokeWidth={GROSOR} />
      <Path
        d="M 66 28
           C 69 23, 85 23, 88 28
           C 90 34, 87 42, 84 48
           C 87 54, 87 60, 84 66
           C 87 72, 86 80, 81 85
           L 73 85
           C 68 80, 67 72, 70 66
           C 67 60, 67 54, 70 48
           C 67 42, 64 34, 66 28
           Z"
        stroke={COLOR}
        strokeWidth={GROSOR}
        fill="none"
      />
      {/* Línea central de espalda */}
      <Line x1="77" y1="24" x2="77" y2="83" stroke={COLOR} strokeWidth={GROSOR} />
      {/* Brazos */}
      <Path d="M 66 28 C 62 38, 61 50, 63 62 L 66 62" stroke={COLOR} strokeWidth={GROSOR} fill="none" />
      <Path d="M 88 28 C 92 38, 93 50, 91 62 L 88 62" stroke={COLOR} strokeWidth={GROSOR} fill="none" />
      {/* Piernas */}
      <Path d="M 73 85 L 70 122 L 76 122 L 77 90" stroke={COLOR} strokeWidth={GROSOR} fill="none" />
      <Path d="M 81 85 L 84 122 L 78 122 L 77 90" stroke={COLOR} strokeWidth={GROSOR} fill="none" />
    </Svg>
  );
}
