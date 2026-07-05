import { useState } from 'react';
import { useRouter } from 'expo-router';
import { FichaForm } from '../../src/components/FichaForm';
import { PasoPrevioNueva } from '../../src/components/PasoPrevioNueva';
import { Contextura } from '../../src/types/ficha';

type Inicial = { nombre: string; referencia: string; fecha: string; contextura: Contextura };

export default function NuevaFicha() {
  const router = useRouter();
  const [inicial, setInicial] = useState<Inicial | null>(null);

  if (inicial === null) {
    return <PasoPrevioNueva onContinuar={setInicial} />;
  }

  return (
    <FichaForm
      ficha={null}
      inicial={inicial}
      onGuardado={() => router.back()}
    />
  );
}
