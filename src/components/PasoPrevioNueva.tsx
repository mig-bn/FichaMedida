import { useState } from 'react';
import { View, Text, TextInput, ScrollView, Pressable, StyleSheet } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Contextura } from '../types/ficha';

const NOMBRE_GENERICO = 'Ficha sin nombre';

type Inicial = { nombre: string; referencia: string; fecha: string; contextura: Contextura };

type Props = {
  onContinuar: (inicial: Inicial) => void;
};

export function PasoPrevioNueva({ onContinuar }: Props) {
  const insets = useSafeAreaInsets();
  const [nombre, setNombre] = useState('');
  const [referencia, setReferencia] = useState('');
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [mostrarFecha, setMostrarFecha] = useState(false);
  const [contextura, setContextura] = useState<Contextura>('femenina');

  function continuar() {
    onContinuar({
      nombre: nombre.trim() === '' ? NOMBRE_GENERICO : nombre.trim(),
      referencia: referencia.trim(),
      fecha,
      contextura,
    });
  }

  return (
    <View style={styles.raiz}>
      <ScrollView contentContainerStyle={styles.contenedor}>
        <Text style={styles.titulo}>Nueva ficha</Text>

        <Text style={styles.etiqueta}>Nombre</Text>
        <TextInput
          style={styles.input}
          value={nombre}
          onChangeText={setNombre}
          placeholder="Nombre de la ficha"
        />

        <Text style={styles.etiqueta}>Referencia</Text>
        <TextInput style={styles.input} value={referencia} onChangeText={setReferencia} />

        <Text style={styles.etiqueta}>Fecha</Text>
        <Pressable style={styles.input} onPress={() => setMostrarFecha(true)}>
          <Text>{fecha}</Text>
        </Pressable>
        {mostrarFecha && (
          <DateTimePicker
            value={new Date(fecha + 'T00:00:00')}
            mode="date"
            onChange={(_evento, seleccionada) => {
              setMostrarFecha(false);
              if (seleccionada) setFecha(seleccionada.toISOString().slice(0, 10));
            }}
          />
        )}

        <Text style={styles.etiqueta}>Contextura</Text>
        <View style={styles.segmentado}>
          <Pressable
            style={[styles.segmento, contextura === 'femenina' && styles.segmentoActivo]}
            onPress={() => setContextura('femenina')}
          >
            <Text
              style={[styles.segmentoTexto, contextura === 'femenina' && styles.segmentoTextoActivo]}
            >
              Femenina
            </Text>
          </Pressable>
          <Pressable
            style={[styles.segmento, contextura === 'masculina' && styles.segmentoActivo]}
            onPress={() => setContextura('masculina')}
          >
            <Text
              style={[styles.segmentoTexto, contextura === 'masculina' && styles.segmentoTextoActivo]}
            >
              Masculina
            </Text>
          </Pressable>
        </View>
      </ScrollView>

      <View style={[styles.piePagina, { paddingBottom: insets.bottom + 16 }]}>
        <Pressable style={styles.botonContinuar} onPress={continuar}>
          <Text style={styles.botonContinuarTexto}>Continuar</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  raiz: { flex: 1 },
  contenedor: { padding: 16 },
  titulo: { fontSize: 22, fontWeight: '700', marginBottom: 16 },
  etiqueta: { fontSize: 15, fontWeight: '600', marginTop: 12, marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
  },
  segmentado: {
    flexDirection: 'row',
    backgroundColor: '#eee',
    borderRadius: 10,
    padding: 4,
  },
  segmento: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  segmentoActivo: { backgroundColor: '#fff' },
  segmentoTexto: { fontSize: 15, fontWeight: '600', color: '#666' },
  segmentoTextoActivo: { color: '#2f6fed' },
  piePagina: {
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  botonContinuar: {
    backgroundColor: '#2f6fed',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  botonContinuarTexto: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
