import { useCallback, useState } from 'react';
import { View, TextInput, FlatList, Text, Pressable, StyleSheet, Alert } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { listarFichas } from '../src/services/storage';
import { exportarTodasLasFichas } from '../src/services/export';
import { Ficha } from '../src/types/ficha';
import { FichaListItem } from '../src/components/FichaListItem';

export default function Index() {
  const router = useRouter();
  const [fichas, setFichas] = useState<Ficha[]>([]);
  const [busqueda, setBusqueda] = useState('');

  useFocusEffect(
    useCallback(() => {
      let activo = true;
      listarFichas().then((todas) => {
        if (activo) setFichas(todas);
      });
      return () => {
        activo = false;
      };
    }, [])
  );

  const filtradas = fichas.filter((f) => {
    const texto = busqueda.trim().toLowerCase();
    if (texto === '') return true;
    return f.nombre.toLowerCase().includes(texto) || f.cliente.toLowerCase().includes(texto);
  });

  return (
    <View style={styles.contenedor}>
      <Pressable
        style={styles.botonExportar}
        onPress={async () => {
          if (fichas.length === 0) {
            Alert.alert('No hay fichas para exportar');
            return;
          }
          try {
            await exportarTodasLasFichas();
          } catch (e) {
            Alert.alert('Error al exportar', 'No se pudo generar o compartir el archivo.');
          }
        }}
      >
        <Text style={styles.botonExportarTexto}>Exportar todo</Text>
      </Pressable>
      <TextInput
        placeholder="Buscar por nombre o cliente"
        value={busqueda}
        onChangeText={setBusqueda}
        style={styles.buscador}
      />
      {filtradas.length === 0 ? (
        <View style={styles.vacio}>
          <Text style={styles.vacioTexto}>
            {busqueda.trim() !== ''
              ? 'Sin resultados para tu búsqueda'
              : 'Aún no tienes fichas guardadas'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtradas}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <FichaListItem ficha={item} onPress={() => router.push(`/ficha/${item.id}`)} />
          )}
        />
      )}
      <Pressable style={styles.fab} onPress={() => router.push('/ficha/nueva')}>
        <Text style={styles.fabTexto}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: '#fff' },
  buscador: {
    margin: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    fontSize: 16,
  },
  vacio: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  vacioTexto: { fontSize: 16, color: '#888' },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 30,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2f6fed',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
  fabTexto: { color: '#fff', fontSize: 30, lineHeight: 32 },
  botonExportar: {
    margin: 12,
    marginBottom: 0,
    backgroundColor: '#2f6fed',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  botonExportarTexto: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
