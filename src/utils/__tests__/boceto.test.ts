import { construirPathSvg } from '../boceto';

describe('construirPathSvg', () => {
  it('retorna cadena vacía si no hay puntos', () => {
    expect(construirPathSvg([], 100, 100)).toBe('');
  });

  it('escala los puntos normalizados (0..1) al ancho y alto dados', () => {
    const puntos = [
      { x: 0, y: 0 },
      { x: 0.5, y: 1 },
      { x: 1, y: 0.25 },
    ];
    expect(construirPathSvg(puntos, 200, 100)).toBe('M 0 0 L 100 100 L 200 25');
  });

  it('usa M solo para el primer punto y L para el resto', () => {
    const puntos = [
      { x: 0.1, y: 0.1 },
      { x: 0.2, y: 0.2 },
    ];
    const resultado = construirPathSvg(puntos, 10, 10);
    expect(resultado.startsWith('M ')).toBe(true);
    expect(resultado).toContain(' L ');
    expect(resultado.match(/M /g)?.length).toBe(1);
  });
});
