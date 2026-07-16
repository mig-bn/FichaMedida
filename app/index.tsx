import { useCallback, useState } from 'react';
import { View, TextInput, FlatList, Text, Pressable, StyleSheet, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { listarFichas, eliminarFichas } from '../src/services/storage';
import { exportarFichas } from '../src/services/export';
import { Ficha } from '../src/types/ficha';
import { FichaListItem } from '../src/components/FichaListItem';

export default function Index() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [fichas, setFichas] = useState<Ficha[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [modoSeleccion, setModoSeleccion] = useState(false);
  const [seleccionadas, setSeleccionadas] = useState<Set<string>>(new Set());

  const refrescar = useCallback(() => {
    listarFichas().then(setFichas);
  }, []);

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

  function alternarModoSeleccion() {
    setModoSeleccion((m) => !m);
    setSeleccionadas(new Set());
  }

  function iniciarSeleccionCon(id: string) {
    setModoSeleccion(true);
    setSeleccionadas(new Set([id]));
  }

  function alternarSeleccion(id: string) {
    setSeleccionadas((previas) => {
      const siguientes = new Set(previas);
      if (siguientes.has(id)) {
        siguientes.delete(id);
      } else {
        siguientes.add(id);
      }
      return siguientes;
    });
  }

  function eliminarSeleccionadas() {
    const cantidad = seleccionadas.size;
    if (cantidad === 0) return;
    Alert.alert(
      'Eliminar fichas',
      `¿Estás seguro de eliminar ${cantidad} ficha${cantidad > 1 ? 's' : ''}? Una vez eliminadas no se podrán recuperar.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await eliminarFichas([...seleccionadas]);
              setModoSeleccion(false);
              setSeleccionadas(new Set());
              refrescar();
            } catch (e) {
              Alert.alert('Error', 'No se pudieron eliminar las fichas.');
            }
          },
        },
      ]
    );
  }

  async function exportarSeleccionadas() {
    if (seleccionadas.size === 0) return;
    const aExportar = fichas.filter((f) => seleccionadas.has(f.id));
    try {
      await exportarFichas(aExportar);
      setModoSeleccion(false);
      setSeleccionadas(new Set());
    } catch (e) {
      Alert.alert('Error al exportar', 'No se pudo generar o compartir el archivo.');
    }
  }

  return (
    <View style={styles.contenedor}>
      <View style={styles.filaBusqueda}>
        <TextInput
          placeholder="Buscar por nombre o cliente"
          value={busqueda}
          onChangeText={setBusqueda}
          style={styles.buscador}
        />
        {fichas.length > 0 && (
          <Pressable onPress={alternarModoSeleccion} style={styles.botonSeleccionar}>
            <Text style={styles.botonSeleccionarTexto}>
              {modoSeleccion ? 'Cancelar' : 'Seleccionar'}
            </Text>
          </Pressable>
        )}
      </View>
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
          contentContainerStyle={{ paddingBottom: insets.bottom + 96 }}
          renderItem={({ item }) => (
            <FichaListItem
              ficha={item}
              onPress={() => router.push(`/ficha/${item.id}`)}
              onEliminada={refrescar}
              modoSeleccion={modoSeleccion}
              seleccionada={seleccionadas.has(item.id)}
              onToggleSeleccion={() => alternarSeleccion(item.id)}
              onIniciarSeleccion={() => iniciarSeleccionCon(item.id)}
            />
          )}
        />
      )}
      {modoSeleccion ? (
        <View style={[styles.barraSeleccion, { paddingBottom: insets.bottom + 12 }]}>
          <Text style={styles.textoSeleccion}>{seleccionadas.size} seleccionada(s)</Text>
          <View style={styles.accionesSeleccion}>
            <Pressable
              style={[styles.botonExportarMasivo, seleccionadas.size === 0 && styles.botonDeshabilitado]}
              onPress={exportarSeleccionadas}
              disabled={seleccionadas.size === 0}
            >
              <Text style={styles.botonExportarMasivoTexto}>Exportar</Text>
            </Pressable>
            <Pressable
              style={[styles.botonEliminarMasivo, seleccionadas.size === 0 && styles.botonDeshabilitado]}
              onPress={eliminarSeleccionadas}
              disabled={seleccionadas.size === 0}
            >
              <Text style={styles.botonEliminarMasivoTexto}>Eliminar</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <Pressable
          style={[styles.fab, { bottom: insets.bottom + 20 }]}
          onPress={() => router.push('/ficha/nueva')}
        >
          <Text style={styles.fabTexto}>+</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: '#fff' },
  filaBusqueda: { flexDirection: 'row', alignItems: 'center', paddingRight: 12 },
  buscador: {
    flex: 1,
    margin: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    fontSize: 16,
  },
  botonSeleccionar: { paddingHorizontal: 4, paddingVertical: 8 },
  botonSeleccionarTexto: { color: '#2f6fed', fontSize: 15, fontWeight: '600' },
  vacio: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  vacioTexto: { fontSize: 16, color: '#888' },
  fab: {
    position: 'absolute',
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2f6fed',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
  fabTexto: { color: '#fff', fontSize: 30, lineHeight: 32 },
  barraSeleccion: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e2e2e2',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  textoSeleccion: { fontSize: 15, color: '#444', fontWeight: '600' },
  accionesSeleccion: { flexDirection: 'row', gap: 10 },
  botonExportarMasivo: {
    backgroundColor: '#2f6fed',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  botonExportarMasivoTexto: { color: '#fff', fontWeight: '700', fontSize: 15 },
  botonEliminarMasivo: {
    backgroundColor: '#d33',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  botonDeshabilitado: { opacity: 0.4 },
  botonEliminarMasivoTexto: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
