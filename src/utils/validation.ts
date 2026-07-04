export function esNombreValido(nombre: string): boolean {
  return nombre.trim().length > 0;
}

export function parsearMedida(texto: string): number | null {
  const limpio = texto.trim();
  if (limpio === '') return null;
  const normalizado = limpio.replace(',', '.');
  if (!/^\d+(\.\d+)?$/.test(normalizado)) return null;
  const valor = Number(normalizado);
  return Number.isFinite(valor) ? valor : null;
}
