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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ficha, Tela, Contextura, Boceto, crearMedidasVacias, crearBocetoVacio } from '../types/ficha';
import { esNombreValido, parsearMedida } from '../utils/validation';
import {
  crearFicha,
  actualizarFicha,
  duplicarFicha,
  eliminarFicha,
  NuevaFichaInput,
} from '../services/storage';
import { MedidasTable } from './MedidasTable';
import { BocetoCanvas } from './BocetoCanvas';

type Props = {
  ficha: Ficha | null;
  onGuardado: (ficha: Ficha) => void;
  onEliminado?: () => void;
  inicial?: { nombre?: string; referencia?: string; fecha?: string; contextura?: Contextura };
};

export function FichaForm({ ficha, onGuardado, onEliminado, inicial }: Props) {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<'ficha' | 'boceto'>('ficha');
  const [nombre, setNombre] = useState(ficha?.nombre ?? inicial?.nombre ?? '');
  const [cliente, setCliente] = useState(ficha?.cliente ?? '');
  const [referencia, setReferencia] = useState(ficha?.referencia ?? inicial?.referencia ?? '');
  const [fecha, setFecha] = useState(
    ficha?.fecha ?? inicial?.fecha ?? new Date().toISOString().slice(0, 10)
  );
  const [mostrarFecha, setMostrarFecha] = useState(false);
  const [medidas, setMedidas] = useState(ficha?.medidas ?? crearMedidasVacias());
  const [telas, setTelas] = useState<Tela[]>(ficha?.telas ?? []);
  const [colores, setColores] = useState<string[]>(ficha?.colores ?? []);
  const [tiroTexto, setTiroTexto] = useState(ficha?.tiro != null ? String(ficha.tiro) : '');
  const [valorTotalTexto, setValorTotalTexto] = useState(
    ficha?.valorTotal != null ? String(ficha.valorTotal) : ''
  );
  const [contextura, setContextura] = useState<Contextura>(
    ficha?.contextura ?? inicial?.contextura ?? 'femenina'
  );
  const [boceto, setBoceto] = useState<Boceto>(ficha?.boceto ?? crearBocetoVacio());
  const [errorNombre, setErrorNombre] = useState(false);
  const [guardando, setGuardando] = useState(false);

  async function guardar() {
    if (!esNombreValido(nombre)) {
      setErrorNombre(true);
      return;
    }
    setErrorNombre(false);

    if (guardando) return;

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
      contextura,
      boceto,
    };

    setGuardando(true);
    try {
      const guardada = ficha ? await actualizarFicha(ficha.id, datos) : await crearFicha(datos);
      onGuardado(guardada);
    } catch (e) {
      console.error(e);
      Alert.alert('Error al guardar', 'No se pudo guardar la ficha. Intenta de nuevo.');
    } finally {
      setGuardando(false);
    }
  }

  async function duplicar() {
    if (!ficha) return;
    try {
      const copia = await duplicarFicha(ficha.id);
      onGuardado(copia);
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'No se pudo duplicar la ficha.');
    }
  }

  function confirmarEliminar() {
    if (!ficha) return;
    Alert.alert(
      'Eliminar ficha',
      '¿Seguro que quieres eliminar esta ficha? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await eliminarFicha(ficha.id);
              onEliminado?.();
            } catch (e) {
              console.error(e);
              Alert.alert('Error', 'No se pudo eliminar la ficha.');
            }
          },
        },
      ]
    );
  }

  const botonGuardar = (
    <Pressable
      style={[styles.botonGuardar, guardando && styles.botonGuardarDeshabilitado]}
      onPress={guardar}
      disabled={guardando}
    >
      <Text style={styles.botonGuardarTexto}>{guardando ? 'Guardando...' : 'Guardar'}</Text>
    </Pressable>
  );

  return (
    <View style={styles.raiz}>
      <View style={styles.segmentado}>
        <Pressable
          style={[styles.segmento, tab === 'ficha' && styles.segmentoActivo]}
          onPress={() => setTab('ficha')}
        >
          <Text style={[styles.segmentoTexto, tab === 'ficha' && styles.segmentoTextoActivo]}>
            Ficha
          </Text>
        </Pressable>
        <Pressable
          style={[styles.segmento, tab === 'boceto' && styles.segmentoActivo]}
          onPress={() => setTab('boceto')}
        >
          <Text style={[styles.segmentoTexto, tab === 'boceto' && styles.segmentoTextoActivo]}>
            Boceto
          </Text>
        </Pressable>
      </View>

      {tab === 'ficha' ? (
        <ScrollView
          contentContainerStyle={[styles.contenedor, { paddingBottom: insets.bottom + 28 }]}
        >
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
                style={[
                  styles.segmentoTexto,
                  contextura === 'femenina' && styles.segmentoTextoActivo,
                ]}
              >
                Femenina
              </Text>
            </Pressable>
            <Pressable
              style={[styles.segmento, contextura === 'masculina' && styles.segmentoActivo]}
              onPress={() => setContextura('masculina')}
            >
              <Text
                style={[
                  styles.segmentoTexto,
                  contextura === 'masculina' && styles.segmentoTextoActivo,
                ]}
              >
                Masculina
              </Text>
            </Pressable>
          </View>

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
          <View style={styles.grupoInput}>
            <TextInput
              style={[styles.input, styles.inputTiro]}
              keyboardType="decimal-pad"
              value={tiroTexto}
              onChangeText={setTiroTexto}
            />
            <Text style={styles.unidad}>cm</Text>
          </View>

          <Text style={styles.etiqueta}>Valor Total</Text>
          <TextInput
            style={styles.input}
            keyboardType="decimal-pad"
            value={valorTotalTexto}
            onChangeText={setValorTotalTexto}
          />

          {botonGuardar}

          {ficha && (
            <View style={styles.filaAcciones}>
              <Pressable style={styles.botonSecundario} onPress={duplicar}>
                <Text style={styles.botonSecundarioTexto}>Duplicar ficha</Text>
              </Pressable>
              <Pressable style={styles.botonEliminar} onPress={confirmarEliminar}>
                <Text style={styles.botonEliminarTexto}>Eliminar ficha</Text>
              </Pressable>
            </View>
          )}
        </ScrollView>
      ) : (
        <View style={[styles.contenedorBoceto, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.canvasBoceto}>
            <BocetoCanvas boceto={boceto} onChange={setBoceto} contextura={contextura} />
          </View>
          {botonGuardar}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  raiz: { flex: 1 },
  segmentado: {
    flexDirection: 'row',
    backgroundColor: '#eee',
    borderRadius: 10,
    padding: 4,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
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
  contenedorBoceto: { flex: 1, padding: 16 },
  canvasBoceto: { flex: 1 },
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
  grupoInput: { flexDirection: 'row', alignItems: 'center' },
  inputTiro: { flex: 1 },
  unidad: { fontSize: 15, color: '#666', marginLeft: 6 },
  textoError: { color: '#d33', fontSize: 13, marginTop: 4 },
  filaLista: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  inputLista: { flex: 1 },
  quitar: { color: '#d33', fontSize: 14 },
  agregar: { color: '#2f6fed', fontSize: 15, marginBottom: 16 },
  botonGuardar: {
    marginTop: 24,
    backgroundColor: '#2f6fed',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  botonGuardarDeshabilitado: { opacity: 0.6 },
  botonGuardarTexto: { color: '#fff', fontSize: 17, fontWeight: '700' },
  filaAcciones: { flexDirection: 'row', gap: 12, marginTop: 16 },
  botonSecundario: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2f6fed',
    alignItems: 'center',
  },
  botonSecundarioTexto: { color: '#2f6fed', fontWeight: '700' },
  botonEliminar: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#d33',
    alignItems: 'center',
  },
  botonEliminarTexto: { color: '#fff', fontWeight: '700' },
});
