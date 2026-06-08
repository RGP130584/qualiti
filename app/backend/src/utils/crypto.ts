import crypto from 'crypto';

/**
 * Gera um hash seguro PBKDF2 com salt para a senha fornecida.
 * Formato do retorno: salt:hash
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

/**
 * Verifica se a senha corresponde ao hash gerado anteriormente.
 * Possui suporte a fallback de texto puro caso o hash armazenado não contenha ':'
 */
export function verifyPassword(password: string, hashWithSalt: string): boolean {
  if (!hashWithSalt || typeof hashWithSalt !== 'string') {
    return false;
  }
  if (!hashWithSalt.includes(':')) {
    // Fallback de texto puro para retrocompatibilidade
    return password === hashWithSalt;
  }
  const [salt, originalHash] = hashWithSalt.split(':');
  const verifyHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return verifyHash === originalHash;
}
