import { randomBytes } from 'crypto';

export function generateToken(length: number = 32): string {
  return randomBytes(length).toString('hex');
}

export function generateShortToken(length: number = 8): string {
  return randomBytes(length).toString('hex').slice(0, length);
}
