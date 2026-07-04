import { esNombreValido, parsearMedida } from '../validation';

describe('esNombreValido', () => {
  it('rechaza vacío y solo espacios', () => {
    expect(esNombreValido('')).toBe(false);
    expect(esNombreValido('   ')).toBe(false);
  });

  it('acepta un nombre con contenido', () => {
    expect(esNombreValido('Ana Pérez')).toBe(true);
  });
});

describe('parsearMedida', () => {
  it('permite vacío como null (campo opcional)', () => {
    expect(parsearMedida('')).toBeNull();
    expect(parsearMedida('   ')).toBeNull();
  });

  it('rechaza texto no numérico', () => {
    expect(parsearMedida('abc')).toBeNull();
    expect(parsearMedida('12abc')).toBeNull();
  });

  it('acepta enteros y decimales con punto o coma', () => {
    expect(parsearMedida('90')).toBe(90);
    expect(parsearMedida('90.5')).toBe(90.5);
    expect(parsearMedida('90,5')).toBe(90.5);
  });

  it('rechaza números negativos', () => {
    expect(parsearMedida('-5')).toBeNull();
  });
});
