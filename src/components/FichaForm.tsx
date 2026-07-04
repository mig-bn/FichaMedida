import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  StyleSheet,
  Alert,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ficha, Tela, crearMedidasVacias } from '../types/ficha';
import { esNombreValido, parsearMedida } from '../utils/validation';
import { crearFicha, actualizarFicha, NuevaFichaInput } from '../services/storage';
import { MedidasTable } from './MedidasTable';

type Props = {
  ficha: Ficha | null;
  onGuardado: (ficha: Ficha) => void;
};

export function FichaForm({ ficha, onGuardado }: Props) {
  const [nombre, setNombre] = useState(ficha?.nombre ?? '');
  const [cliente, setCliente] = useState(ficha?.cliente ?? '');
  const [referencia, setReferencia] = useState(ficha?.referencia ?? '');
  const [fecha, setFecha] = useState(ficha?.fecha ?? new Date().toISOString().slice(0, 10));
  const [mostrarFecha, setMostrarFecha] = useState(false);
  const [medidas, setMedidas] = useState(ficha?.medidas ?? crearMedidasVacias());
  const [telas, setTelas] = useState<Tela[]>(ficha?.telas ?? []);
  const [colores, setColores] = useState<string[]>(ficha?.colores ?? []);
  const [tiroTexto, setTiroTexto] = useState(ficha?.tiro != null ? String(ficha.tiro) : '');
  const [valorTotalTexto, setValorTotalTexto] = useState(
    ficha?.valorTotal != null ? String(ficha.valorTotal) : ''
  );
  const [errorNombre, setErrorNombre] = useState(false);

  async function guardar() {
    if (!esNombreValido(nombre)) {
      setErrorNombre(true);
      return;
    }
    setErrorNombre(false);

    const datos: NuevaFichaInput = {
      nombre: nombre.trim(),
      cliente: cliente.trim(),
      referencia: referencia.trim(),
      fecha,
      medidas,
      tiro: parsearMedida(tiroTexto),
      telas: telas.filter((t) => t.tipo.trim() !== ''),
      colores: colores.filter((c) => c.trim() !== ''),
      valorTotal: parsearMedida(valorTotalTexto),
    };

    try {
      const guardada = ficha ? await actualizarFicha(ficha.id, datos) : await crearFicha(datos);
      onGuardado(guardada);
    } catch (e) {
      Alert.alert('Error al guardar', 'No se pudo guardar la ficha. Intenta de nuevo.');
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.contenedor}>
      <Text style={styles.etiqueta}>Nombre *</Text>
      <TextInput
        style={[styles.input, errorNombre && styles.inputError]}
        value={nombre}
        onChangeText={(t) => {
          setNombre(t);
          if (errorNombre) setErrorNombre(false);
        }}
        placeholder="Nombre de la ficha"
      />
      {errorNombre && <Text style={styles.textoError}>El nombre es obligatorio</Text>}

      <Text style={styles.etiqueta}>Cliente</Text>
      <TextInput style={styles.input} value={cliente} onChangeText={setCliente} />

      <Text style={styles.etiqueta}>Referencia</Text>
      <TextInput style={styles.input} value={referencia} onChangeText={setReferencia} />

      <Text style={styles.etiqueta}>Fecha</Text>
      <Pressable style={styles.input} onPress={() => setMostrarFecha(true)}>
        <Text>{fecha}</Text>
      </Pressable>
      {mostrarFecha && (
        <DateTimePicker
          value={new Date(fecha)}
          mode="date"
          onChange={(_evento, seleccionada) => {
            setMostrarFecha(false);
            if (seleccionada) setFecha(seleccionada.toISOString().slice(0, 10));
          }}
        />
      )}

      <Text style={styles.tituloSeccion}>Medidas</Text>
      <MedidasTable medidas={medidas} onChange={setMedidas} />

      <Text style={styles.tituloSeccion}>Telas</Text>
      {telas.map((tela, indice) => (
        <View key={indice} style={styles.filaLista}>
          <TextInput
            style={[styles.input, styles.inputLista]}
            placeholder="Tipo de tela"
            value={tela.tipo}
            onChangeText={(t) => {
              const copia = [...telas];
              copia[indice] = { ...copia[indice], tipo: t };
              setTelas(copia);
            }}
          />
          <TextInput
            style={[styles.input, styles.inputLista]}
            placeholder="Color (opcional)"
            value={tela.color ?? ''}
            onChangeText={(t) => {
              const copia = [...telas];
              copia[indice] = { ...copia[indice], color: t };
              setTelas(copia);
            }}
          />
          <Pressable onPress={() => setTelas(telas.filter((_, i) => i !== indice))}>
            <Text style={styles.quitar}>Quitar</Text>
          </Pressable>
        </View>
      ))}
      <Pressable onPress={() => setTelas([...telas, { tipo: '', color: '' }])}>
        <Text style={styles.agregar}>+ Agregar tela</Text>
      </Pressable>

      <Text style={styles.tituloSeccion}>Colores</Text>
      {colores.map((color, indice) => (
        <View key={indice} style={styles.filaLista}>
          <TextInput
            style={[styles.input, styles.inputLista]}
            placeholder="Color"
            value={color}
            onChangeText={(t) => {
              const copia = [...colores];
              copia[indice] = t;
              setColores(copia);
            }}
          />
          <Pressable onPress={() => setColores(colores.filter((_, i) => i !== indice))}>
            <Text style={styles.quitar}>Quitar</Text>
          </Pressable>
        </View>
      ))}
      <Pressable onPress={() => setColores([...colores, ''])}>
        <Text style={styles.agregar}>+ Agregar color</Text>
      </Pressable>

      <Text style={styles.etiqueta}>Tiro</Text>
      <TextInput
        style={styles.input}
        keyboardType="decimal-pad"
        value={tiroTexto}
        onChangeText={setTiroTexto}
      />

      <Text style={styles.etiqueta}>Valor Total</Text>
      <TextInput
        style={styles.input}
        keyboardType="decimal-pad"
        value={valorTotalTexto}
        onChangeText={setValorTotalTexto}
      />

      <Pressable style={styles.botonGuardar} onPress={guardar}>
        <Text style={styles.botonGuardarTexto}>Guardar</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  contenedor: { padding: 16 },
  etiqueta: { fontSize: 15, fontWeight: '600', marginTop: 12, marginBottom: 4 },
  tituloSeccion: { fontSize: 19, fontWeight: '700', marginTop: 20, marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
  },
  inputError: { borderColor: '#d33' },
  textoError: { color: '#d33', fontSize: 13, marginTop: 4 },
  filaLista: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  inputLista: { flex: 1 },
  quitar: { color: '#d33', fontSize: 14 },
  agregar: { color: '#2f6fed', fontSize: 15, marginBottom: 16 },
  botonGuardar: {
    marginTop: 24,
    marginBottom: 60,
    backgroundColor: '#2f6fed',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  botonGuardarTexto: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
