import { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { configurarCarpetaGuardado } from '../services/pdf';

type Props = {
  visible: boolean;
  onResultado: (concedido: boolean) => void;
};

export function GuiaCarpetaPdf({ visible, onResultado }: Props) {
  const [cargando, setCargando] = useState(false);

  async function elegirCarpeta() {
    setCargando(true);
    try {
      await configurarCarpetaGuardado();
      onResultado(true);
    } catch (e) {
      onResultado(false);
    } finally {
      setCargando(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={() => onResultado(false)}>
      <View style={styles.fondo}>
        <View style={styles.tarjeta}>
          <Text style={styles.icono}>📁</Text>
          <Text style={styles.titulo}>Guarda tus fichas en PDF</Text>
          <Text style={styles.paso}>1. Toca "Elegir carpeta" abajo.</Text>
          <Text style={styles.paso}>2. En la pantalla que se abre, toca "Download" o "Descargas".</Text>
          <Text style={styles.paso}>3. Toca "Usar esta carpeta" para confirmar.</Text>
          <Text style={styles.nota}>Esto solo se pide una vez.</Text>
          {cargando ? (
            <ActivityIndicator size="large" color="#2f6fed" style={styles.cargando} />
          ) : (
            <>
              <Pressable style={styles.botonPrincipal} onPress={elegirCarpeta}>
                <Text style={styles.botonPrincipalTexto}>Elegir carpeta</Text>
              </Pressable>
              <Pressable style={styles.botonCancelar} onPress={() => onResultado(false)}>
                <Text style={styles.botonCancelarTexto}>Cancelar</Text>
              </Pressable>
            </>
          )}
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
    alignItems: 'center',
  },
  icono: { fontSize: 48, marginBottom: 12 },
  titulo: { fontSize: 20, fontWeight: '700', textAlign: 'center', marginBottom: 16 },
  paso: { fontSize: 17, alignSelf: 'stretch', marginBottom: 10, lineHeight: 24 },
  nota: { fontSize: 14, color: '#888', marginBottom: 20, textAlign: 'center' },
  cargando: { marginTop: 8, marginBottom: 8 },
  botonPrincipal: {
    backgroundColor: '#2f6fed',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 10,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  botonPrincipalTexto: { color: '#fff', fontSize: 17, fontWeight: '700' },
  botonCancelar: { marginTop: 12, paddingVertical: 8 },
  botonCancelarTexto: { color: '#888', fontSize: 15 },
});
