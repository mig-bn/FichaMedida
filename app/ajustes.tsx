import { useCallback, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Alert } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { listarFichas } from '../src/services/storage';
import { exportarTodasLasFichas } from '../src/services/export';
import { importarFichasDesdeArchivo } from '../src/services/importar';
import { mensajeDeError } from '../src/utils/errores';

export default function Ajustes() {
  const [cantidadFichas, setCantidadFichas] = useState(0);
  const [importando, setImportando] = useState(false);

  const refrescarCantidad = useCallback(() => {
    listarFichas().then((todas) => setCantidadFichas(todas.length));
  }, []);

  useFocusEffect(
    useCallback(() => {
      let activo = true;
      listarFichas().then((todas) => {
        if (activo) setCantidadFichas(todas.length);
      });
      return () => {
        activo = false;
      };
    }, [])
  );

  async function exportarTodo() {
    if (cantidadFichas === 0) {
      Alert.alert('No hay fichas para exportar');
      return;
    }
    try {
      await exportarTodasLasFichas();
    } catch (e) {
      Alert.alert('Error al exportar', 'No se pudo generar o compartir el archivo.');
    }
  }

  async function importar() {
    if (importando) return;
    setImportando(true);
    try {
      const importadas = await importarFichasDesdeArchivo();
      if (importadas.length > 0) {
        refrescarCantidad();
        Alert.alert(
          'Importación completa',
          `Se ${importadas.length === 1 ? 'importó 1 ficha' : `importaron ${importadas.length} fichas`}.`
        );
      }
    } catch (e) {
      Alert.alert('Error al importar', mensajeDeError(e));
    } finally {
      setImportando(false);
    }
  }

  return (
    <View style={styles.contenedor}>
      <Text style={styles.tituloSeccion}>Datos</Text>
      <Pressable style={styles.boton} onPress={exportarTodo}>
        <Text style={styles.botonTexto}>Exportar todo</Text>
      </Pressable>
      <Text style={styles.ayuda}>
        Genera un archivo JSON con todas tus fichas ({cantidadFichas}) y abre el menú para
        compartirlo o guardarlo.
      </Text>

      <Pressable style={[styles.boton, styles.botonSecundario]} onPress={importar} disabled={importando}>
        <Text style={[styles.botonTexto, styles.botonSecundarioTexto]}>
          {importando ? 'Importando...' : 'Importar fichas'}
        </Text>
      </Pressable>
      <Text style={styles.ayuda}>
        Elige un archivo JSON exportado desde esta app (por otra persona o desde otro celular) y
        agrega esas fichas a tu lista.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: '#fff', padding: 16 },
  tituloSeccion: { fontSize: 15, fontWeight: '700', color: '#666', marginBottom: 8 },
  boton: {
    backgroundColor: '#2f6fed',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  botonTexto: { color: '#fff', fontWeight: '700', fontSize: 15 },
  ayuda: { marginTop: 10, fontSize: 13, color: '#888' },
  botonSecundario: {
    marginTop: 24,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#2f6fed',
  },
  botonSecundarioTexto: { color: '#2f6fed' },
});
