import { useRouter } from 'expo-router';
import { FichaForm } from '../../src/components/FichaForm';

export default function NuevaFicha() {
  const router = useRouter();
  return (
    <FichaForm
      ficha={null}
      onGuardado={() => router.back()}
    />
  );
}
