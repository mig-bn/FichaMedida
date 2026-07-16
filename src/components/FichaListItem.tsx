import { Alert, Platform, Pressable, Text, StyleSheet, View } from 'react-native';
import { Ficha } from '../types/ficha';
import { imprimirFicha, guardarPdfFicha } from '../services/pdf';
import { eliminarFicha } from '../services/storage';
import { mensajeDeError } from '../utils/errores';

type Props = {
  ficha: Ficha;
  onPress: () => void;
  onEliminada?: () => void;
  modoSeleccion?: boolean;
  seleccionada?: boolean;
  onToggleSeleccion?: () => void;
  onIniciarSeleccion?: () => void;
};

const MENSAJE_IRREVERSIBLE = 'Una vez eliminada no se podrá recuperar.';

function menuPdf(ficha: Ficha) {
  Alert.alert('Generar PDF', ficha.nombre, [
    { text: 'Cancelar', style: 'cancel' },
    {
      text: 'Imprimir',
      onPress: async () => {
        try {
          await imprimirFicha(ficha);
        } catch (e) {
          Alert.alert('Error', `No se pudo generar el PDF para imprimir.\n${mensajeDeError(e)}`);
        }
      },
    },
    {
      text: 'Guardar',
      onPress: async () => {
        try {
          await guardarPdfFicha(ficha);
          if (Platform.OS === 'android') {
            Alert.alert('PDF guardado', 'Búscalo en la carpeta "FichasApp" dentro de la carpeta que elegiste.');
          }
        } catch (e) {
          Alert.alert('Error', `No se pudo generar o guardar el PDF.\n${mensajeDeError(e)}`);
        }
      },
    },
  ]);
}

function confirmarEliminar(ficha: Ficha, onEliminada?: () => void) {
  Alert.alert('Eliminar ficha', `¿Estás seguro de eliminar "${ficha.nombre}"? ${MENSAJE_IRREVERSIBLE}`, [
    { text: 'Cancelar', style: 'cancel' },
    {
      text: 'Eliminar',
      style: 'destructive',
      onPress: async () => {
        try {
          await eliminarFicha(ficha.id);
          onEliminada?.();
        } catch (e) {
          Alert.alert('Error', 'No se pudo eliminar la ficha.');
        }
      },
    },
  ]);
}

function abrirMenu(ficha: Ficha, onActualizar: () => void, onEliminada?: () => void) {
  Alert.alert(ficha.nombre, undefined, [
    { text: 'Cancelar', style: 'cancel' },
    { text: 'Actualizar', onPress: onActualizar },
    { text: 'PDF', onPress: () => menuPdf(ficha) },
    { text: 'Eliminar', style: 'destructive', onPress: () => confirmarEliminar(ficha, onEliminada) },
  ]);
}

export function FichaListItem({
  ficha,
  onPress,
  onEliminada,
  modoSeleccion,
  seleccionada,
  onToggleSeleccion,
  onIniciarSeleccion,
}: Props) {
  return (
    <View style={styles.fila}>
      <Pressable
        onPress={modoSeleccion ? onToggleSeleccion : onPress}
        onLongPress={modoSeleccion ? undefined : onIniciarSeleccion}
        delayLongPress={3000}
        style={styles.contenedor}
      >
        <View style={styles.filaTitulo}>
          {modoSeleccion && (
            <View style={[styles.checkbox, seleccionada && styles.checkboxMarcado]}>
              {seleccionada && <Text style={styles.checkboxTexto}>✓</Text>}
            </View>
          )}
          <View style={styles.textos}>
            <Text style={styles.nombre}>{ficha.nombre}</Text>
            <Text style={styles.detalle}>{ficha.cliente}</Text>
            <Text style={styles.fecha}>{ficha.fecha}</Text>
          </View>
        </View>
      </Pressable>
      {!modoSeleccion && (
        <Pressable
          onPress={() => abrirMenu(ficha, onPress, onEliminada)}
          style={styles.botonMenu}
          hitSlop={12}
        >
          <Text style={styles.botonMenuTexto}>⋮</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e2e2',
  },
  contenedor: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  filaTitulo: { flexDirection: 'row', alignItems: 'center' },
  textos: { flex: 1 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#999',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxMarcado: { backgroundColor: '#2f6fed', borderColor: '#2f6fed' },
  checkboxTexto: { color: '#fff', fontSize: 13, fontWeight: '700' },
  nombre: { fontSize: 18, fontWeight: '600' },
  detalle: { fontSize: 15, color: '#444', marginTop: 2 },
  fecha: { fontSize: 13, color: '#888', marginTop: 2 },
  botonMenu: { paddingHorizontal: 16, paddingVertical: 14 },
  botonMenuTexto: { fontSize: 22, color: '#666', fontWeight: '700' },
});
