import { Pressable, Text, StyleSheet } from 'react-native';
import { Ficha } from '../types/ficha';

type Props = {
  ficha: Ficha;
  onPress: () => void;
};

export function FichaListItem({ ficha, onPress }: Props) {
  return (
    <Pressable onPress={onPress} style={styles.contenedor}>
      <Text style={styles.nombre}>{ficha.nombre}</Text>
      <Text style={styles.detalle}>{ficha.cliente}</Text>
      <Text style={styles.fecha}>{ficha.fecha}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e2e2',
  },
  nombre: { fontSize: 18, fontWeight: '600' },
  detalle: { fontSize: 15, color: '#444', marginTop: 2 },
  fecha: { fontSize: 13, color: '#888', marginTop: 2 },
});
