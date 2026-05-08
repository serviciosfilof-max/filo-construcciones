import { pbkdf2Sync, randomBytes, timingSafeEqual } from 'node:crypto';

const ITERATIONS = 120000;
const KEY_LENGTH = 32;
const DIGEST = 'sha256';

export function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const hash = pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, DIGEST).toString('hex');
  return `pbkdf2:${ITERATIONS}:${salt}:${hash}`;
}

export function verifyPassword(password, storedHash) {
  const parts = String(storedHash || '').split(':');
  if (parts.length !== 4 || parts[0] !== 'pbkdf2') return false;

  const iterations = Number(parts[1]);
  const salt = parts[2];
  const expectedHash = Buffer.from(parts[3], 'hex');
  const actualHash = pbkdf2Sync(password, salt, iterations, expectedHash.length, DIGEST);

  return expectedHash.length === actualHash.length && timingSafeEqual(expectedHash, actualHash);
}

