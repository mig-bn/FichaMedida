import { useEffect, useRef, useState } from 'react';
import { Pressable, Text } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GuiaCarpetaPdf } from '../src/components/GuiaCarpetaPdf';
import { registrarGuiaCarpeta } from '../src/services/guiaCarpetaBridge';

function BotonAjustes() {
  const router = useRouter();
  return (
    <Pressable onPress={() => router.push('/ajustes')} hitSlop={12}>
      <Text style={{ fontSize: 20 }}>⚙️</Text>
    </Pressable>
  );
}

function GuiaCarpetaPdfHost() {
  const [visible, setVisible] = useState(false);
  const resolverRef = useRef<((concedido: boolean) => void) | null>(null);

  useEffect(() => {
    registrarGuiaCarpeta((resolver) => {
      resolverRef.current = resolver;
      setVisible(true);
    });
  }, []);

  function manejarResultado(concedido: boolean) {
    setVisible(false);
    resolverRef.current?.(concedido);
    resolverRef.current = null;
  }

  return <GuiaCarpetaPdf visible={visible} onResultado={manejarResultado} />;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <Stack>
        <Stack.Screen
          name="index"
          options={{ title: 'Fichas', headerRight: () => <BotonAjustes /> }}
        />
        <Stack.Screen name="ficha/nueva" options={{ title: 'Nueva ficha' }} />
        <Stack.Screen name="ficha/[id]" options={{ title: 'Ficha' }} />
        <Stack.Screen name="ajustes" options={{ title: 'Ajustes' }} />
      </Stack>
      <GuiaCarpetaPdfHost />
    </SafeAreaProvider>
  );
}
