type Resolver = (concedido: boolean) => void;
type MostrarGuia = (resolver: Resolver) => void;

let mostrarGuia: MostrarGuia | null = null;

export function registrarGuiaCarpeta(fn: MostrarGuia): void {
  mostrarGuia = fn;
}

export function solicitarPermisoConGuia(): Promise<boolean> {
  return new Promise((resolve) => {
    if (!mostrarGuia) {
      resolve(false);
      return;
    }
    mostrarGuia(resolve);
  });
}
