jest.mock('expo-crypto', () => ({
  randomUUID: () => '11111111-1111-1111-1111-111111111111',
}));

import { generarUUID } from '../uuid';

describe('generarUUID', () => {
  it('devuelve el UUID generado por expo-crypto', () => {
    expect(generarUUID()).toBe('11111111-1111-1111-1111-111111111111');
  });
});
