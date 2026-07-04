import * as Crypto from 'expo-crypto';

export function generarUUID(): string {
  return Crypto.randomUUID();
}
