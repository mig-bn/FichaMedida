import { useMemo, useRef, useState } from 'react';
import { Alert, LayoutChangeEvent, PanResponder, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Boceto, Contextura, Punto, Trazo } from '../types/ficha';
import { aspectoDe, Silueta } from './siluetas/Silueta';

// Únicos valores stateful a futuro (selector de color/grosor). Por ahora fijos.
const COLOR_ACTUAL = '#111';
const ANCHO_ACTUAL = 3;

type Props = {
  boceto: Boceto;
  onChange: (boceto: Boceto) => void;
  contextura: Contextura;
};

function clamp(valor: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, valor));
}

function construirPath(puntos: Punto[], ancho: number, alto: number): string {
  if (puntos.length === 0) return '';
  const [primero, ...resto] = puntos;
  let d = `M ${primero.x * ancho} ${primero.y * alto}`;
  for (const punto of resto) {
    d += ` L ${punto.x * ancho} ${punto.y * alto}`;
  }
  return d;
}

export function BocetoCanvas({ boceto, onChange, contextura }: Props) {
  const [contW, setContW] = useState(0);
  const [contH, setContH] = useState(0);

  // Caja de dibujo: el rectángulo más grande con el aspecto de la silueta de la
  // contextura actual que cabe dentro del contenedor. Cada silueta (imagen)
  // tiene su propio aspecto, así que se toma según la contextura.
  const aspecto = aspectoDe(contextura);
  const boxAncho = contW > 0 && contH > 0 ? Math.min(contW, contH * aspecto) : 0;
  const boxAlto = boxAncho > 0 ? boxAncho / aspecto : 0;

  const [trazoEnCurso, setTrazoEnCurso] = useState<Punto[]>([]);

  // Refs para evitar closures obsoletos dentro del PanResponder (creado una sola vez).
  const trazoEnCursoRef = useRef<Punto[]>([]);
  const anchoRef = useRef(0);
  const altoRef = useRef(0);
  const bocetoRef = useRef(boceto);
  const onChangeRef = useRef(onChange);

  anchoRef.current = boxAncho;
  altoRef.current = boxAlto;
  bocetoRef.current = boceto;
  onChangeRef.current = onChange;

  const onLayout = (evt: LayoutChangeEvent) => {
    setContW(evt.nativeEvent.layout.width);
    setContH(evt.nativeEvent.layout.height);
  };

  function agregarPunto(locationX: number, locationY: number) {
    const anchoActual = anchoRef.current;
    const altoActual = altoRef.current;
    if (anchoActual <= 0 || altoActual <= 0) return;

    const x = clamp(locationX / anchoActual, 0, 1);
    const y = clamp(locationY / altoActual, 0, 1);

    const nuevosPuntos = [...trazoEnCursoRef.current, { x, y }];
    trazoEnCursoRef.current = nuevosPuntos;
    setTrazoEnCurso(nuevosPuntos);
  }

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (evt) => {
          trazoEnCursoRef.current = [];
          agregarPunto(evt.nativeEvent.locationX, evt.nativeEvent.locationY);
        },
        onPanResponderMove: (evt) => {
          agregarPunto(evt.nativeEvent.locationX, evt.nativeEvent.locationY);
        },
        onPanResponderRelease: () => {
          const puntos = trazoEnCursoRef.current;
          if (puntos.length >= 2) {
            const nuevoTrazo: Trazo = { puntos, color: COLOR_ACTUAL, ancho: ANCHO_ACTUAL };
            const bocetoActual = bocetoRef.current;
            onChangeRef.current({ trazos: [...bocetoActual.trazos, nuevoTrazo] });
          }
          trazoEnCursoRef.current = [];
          setTrazoEnCurso([]);
        },
        onPanResponderTerminate: () => {
          trazoEnCursoRef.current = [];
          setTrazoEnCurso([]);
        },
      }),
    [],
  );

  const deshacer = () => {
    if (boceto.trazos.length === 0) return;
    onChange({ trazos: boceto.trazos.slice(0, -1) });
  };

  const borrarTodo = () => {
    if (boceto.trazos.length === 0) return;
    Alert.alert('Borrar todo', '¿Seguro que deseas borrar todo el boceto?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Borrar', style: 'destructive', onPress: () => onChange({ trazos: [] }) },
    ]);
  };

  return (
    <View style={styles.raiz}>
      <View style={styles.contenedor} onLayout={onLayout}>
        {boxAncho > 0 && boxAlto > 0 && (
          <View style={{ width: boxAncho, height: boxAlto }} {...panResponder.panHandlers}>
            <View style={StyleSheet.absoluteFill} pointerEvents="none">
              <Silueta contextura={contextura} />
            </View>
            <Svg
              width={boxAncho}
              height={boxAlto}
              viewBox={`0 0 ${boxAncho} ${boxAlto}`}
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            >
              {boceto.trazos.map((trazo, indice) => (
                <Path
                  key={indice}
                  d={construirPath(trazo.puntos, boxAncho, boxAlto)}
                  stroke={trazo.color}
                  strokeWidth={trazo.ancho}
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ))}
              {trazoEnCurso.length > 0 && (
                <Path
                  d={construirPath(trazoEnCurso, boxAncho, boxAlto)}
                  stroke={COLOR_ACTUAL}
                  strokeWidth={ANCHO_ACTUAL}
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}
            </Svg>
          </View>
        )}
      </View>
      <View style={styles.barraHerramientas}>
        <TouchableOpacity style={styles.boton} onPress={deshacer}>
          <Text style={styles.botonTexto}>Deshacer</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.boton} onPress={borrarTodo}>
          <Text style={styles.botonTexto}>Borrar todo</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  raiz: {
    flex: 1,
  },
  contenedor: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  barraHerramientas: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginTop: 12,
  },
  boton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    backgroundColor: '#eee',
  },
  botonTexto: {
    fontSize: 15,
    fontWeight: '600',
  },
});
