import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <Stack>
        <Stack.Screen name="index" options={{ title: 'Fichas' }} />
        <Stack.Screen name="ficha/nueva" options={{ title: 'Nueva ficha' }} />
        <Stack.Screen name="ficha/[id]" options={{ title: 'Ficha' }} />
      </Stack>
    </SafeAreaProvider>
  );
}
