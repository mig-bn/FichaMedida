import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Tela } from '../types/ficha';

type Props = {
  visible: boolean;
  telaInicial?: Tela | null;
  onAceptar: (tela: Tela) => void;
  onCancelar: () => void;
};

export function ModalTela({ visible, telaInicial, onAceptar, onCancelar }: Props) {
  const [tipo, setTipo] = useState('');
  const [color, setColor] = useState('');

  // Al abrir el modal, precarga los datos (edición) o limpia (agregar).
  useEffect(() => {
    if (visible) {
      setTipo(telaInicial?.tipo ?? '');
      setColor(telaInicial?.color ?? '');
    }
  }, [visible, telaInicial]);

  const tipoValido = tipo.trim() !== '';

  function aceptar() {
    if (!tipoValido) return;
    onAceptar({ tipo: tipo.trim(), color: color.trim() });
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancelar}>
      <View style={styles.fondo}>
        <View style={styles.tarjeta}>
          <Text style={styles.titulo}>{telaInicial ? 'Editar tela' : 'Agregar tela'}</Text>

          <Text style={styles.etiqueta}>Tipo de tela</Text>
          <TextInput
            style={styles.input}
            value={tipo}
            onChangeText={setTipo}
            placeholder="Ej: Seda, Algodón..."
            autoFocus
          />

          <Text style={styles.etiqueta}>Color (opcional)</Text>
          <TextInput
            style={styles.input}
            value={color}
            onChangeText={setColor}
            placeholder="Ej: Rojo"
          />

          <View style={styles.acciones}>
            <Pressable style={styles.botonCancelar} onPress={onCancelar}>
              <Text style={styles.botonCancelarTexto}>Cancelar</Text>
            </Pressable>
            <Pressable
              style={[styles.botonAceptar, !tipoValido && styles.botonDeshabilitado]}
              onPress={aceptar}
              disabled={!tipoValido}
            >
              <Text style={styles.botonAceptarTexto}>Aceptar</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fondo: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  tarjeta: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
  },
  titulo: { fontSize: 19, fontWeight: '700', marginBottom: 16 },
  etiqueta: { fontSize: 15, fontWeight: '600', marginTop: 12, marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
  },
  acciones: { flexDirection: 'row', gap: 12, marginTop: 24 },
  botonCancelar: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#999',
    alignItems: 'center',
  },
  botonCancelarTexto: { color: '#666', fontWeight: '700', fontSize: 15 },
  botonAceptar: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#2f6fed',
    alignItems: 'center',
  },
  botonDeshabilitado: { opacity: 0.5 },
  botonAceptarTexto: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
