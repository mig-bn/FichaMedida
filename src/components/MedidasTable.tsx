import { View, Text, TextInput, StyleSheet } from 'react-native';
import { Medidas, GRUPOS_MEDIDAS } from '../types/ficha';
import { parsearMedida } from '../utils/validation';

type Props = {
  medidas: Medidas;
  onChange: (medidas: Medidas) => void;
};

export function MedidasTable({ medidas, onChange }: Props) {
  return (
    <View>
      {GRUPOS_MEDIDAS.map((grupo) => (
        <View key={grupo.titulo} style={styles.grupo}>
          <Text style={styles.tituloGrupo}>{grupo.titulo}</Text>
          {grupo.campos.map((campo) => (
            <View key={campo.key} style={styles.fila}>
              <Text style={styles.etiqueta}>{campo.label}</Text>
              <View style={styles.grupoInput}>
                <TextInput
                  style={styles.input}
                  keyboardType="decimal-pad"
                  value={medidas[campo.key] === null ? '' : String(medidas[campo.key])}
                  onChangeText={(texto) => {
                    onChange({ ...medidas, [campo.key]: parsearMedida(texto) });
                  }}
                />
                <Text style={styles.unidad}>cm</Text>
              </View>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grupo: { marginBottom: 20 },
  tituloGrupo: { fontSize: 17, fontWeight: '700', marginBottom: 8 },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  etiqueta: { fontSize: 15, flex: 1, paddingRight: 8 },
  grupoInput: { flexDirection: 'row', alignItems: 'center' },
  input: {
    width: 90,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 8,
    fontSize: 16,
    textAlign: 'right',
  },
  unidad: { fontSize: 15, color: '#666', marginLeft: 6 },
});
