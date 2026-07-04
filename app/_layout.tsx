import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Fichas' }} />
      <Stack.Screen name="ficha/nueva" options={{ title: 'Nueva ficha' }} />
      <Stack.Screen name="ficha/[id]" options={{ title: 'Ficha' }} />
    </Stack>
  );
}
