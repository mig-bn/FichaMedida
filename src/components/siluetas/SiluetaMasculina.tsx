import Svg, { Ellipse, Line, Path } from 'react-native-svg';
import { VIEWBOX } from './Silueta';

const COLOR = '#bbb';
const GROSOR = 1;

// Silueta masculina: figura de frente (izquierda) y de espalda (derecha),
// trazo simple de contorno. Hombros anchos, torso recto (sin curva de cintura marcada).
export function SiluetaMasculina() {
  return (
    <Svg
      viewBox={VIEWBOX}
      width="100%"
      height="100%"
      preserveAspectRatio="xMidYMid meet"
    >
      {/* --- Figura de frente (izquierda) --- */}
      <Ellipse cx="23" cy="9" rx="6.5" ry="7.5" stroke={COLOR} strokeWidth={GROSOR} fill="none" />
      <Line x1="23" y1="16.5" x2="23" y2="20" stroke={COLOR} strokeWidth={GROSOR} />
      <Path
        d="M 9 30
           C 11 24, 35 24, 37 30
           C 38 40, 37 50, 35 58
           C 36 66, 36 76, 33 85
           L 19 85
           C 16 76, 16 66, 17 58
           C 15 50, 14 40, 9 30
           Z"
        stroke={COLOR}
        strokeWidth={GROSOR}
        fill="none"
      />
      {/* Brazos */}
      <Path d="M 9 30 C 5 42, 4 54, 7 64 L 11 64" stroke={COLOR} strokeWidth={GROSOR} fill="none" />
      <Path d="M 37 30 C 41 42, 42 54, 39 64 L 35 64" stroke={COLOR} strokeWidth={GROSOR} fill="none" />
      {/* Piernas */}
      <Path d="M 19 85 L 17 122 L 23 122 L 24 90" stroke={COLOR} strokeWidth={GROSOR} fill="none" />
      <Path d="M 33 85 L 35 122 L 29 122 L 24 90" stroke={COLOR} strokeWidth={GROSOR} fill="none" />

      {/* --- Figura de espalda (derecha) --- */}
      <Ellipse cx="77" cy="9" rx="6.5" ry="7.5" stroke={COLOR} strokeWidth={GROSOR} fill="none" />
      <Line x1="77" y1="16.5" x2="77" y2="20" stroke={COLOR} strokeWidth={GROSOR} />
      <Path
        d="M 63 30
           C 65 24, 89 24, 91 30
           C 92 40, 91 50, 89 58
           C 90 66, 90 76, 87 85
           L 73 85
           C 70 76, 70 66, 71 58
           C 69 50, 68 40, 63 30
           Z"
        stroke={COLOR}
        strokeWidth={GROSOR}
        fill="none"
      />
      {/* Línea central de espalda (columna) */}
      <Line x1="77" y1="24" x2="77" y2="83" stroke={COLOR} strokeWidth={GROSOR} />
      {/* Brazos */}
      <Path d="M 63 30 C 59 42, 58 54, 61 64 L 65 64" stroke={COLOR} strokeWidth={GROSOR} fill="none" />
      <Path d="M 91 30 C 95 42, 96 54, 93 64 L 89 64" stroke={COLOR} strokeWidth={GROSOR} fill="none" />
      {/* Piernas */}
      <Path d="M 73 85 L 71 122 L 77 122 L 78 90" stroke={COLOR} strokeWidth={GROSOR} fill="none" />
      <Path d="M 87 85 L 89 122 L 83 122 L 78 90" stroke={COLOR} strokeWidth={GROSOR} fill="none" />
    </Svg>
  );
}
