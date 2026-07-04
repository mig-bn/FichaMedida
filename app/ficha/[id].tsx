import { useEffect, useState } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { obtenerFicha } from '../../src/services/storage';
import { Ficha } from '../../src/types/ficha';
import { FichaForm } from '../../src/components/FichaForm';

export default function VerFicha() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [ficha, setFicha] = useState<Ficha | null | undefined>(undefined);

  useEffect(() => {
    obtenerFicha(id).then(setFicha);
  }, [id]);

  if (ficha === undefined) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  if (ficha === null) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Text style={{ fontSize: 16, color: '#888', textAlign: 'center' }}>
          Ficha no encontrada. Es posible que haya sido eliminada.
        </Text>
      </View>
    );
  }

  return <FichaForm ficha={ficha} onGuardado={() => router.back()} />;
}
