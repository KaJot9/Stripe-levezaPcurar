/**
 * utils/logger.js
 * Logger simples e centralizado. Pode ser trocado por Winston/Pino
 * futuramente sem alterar o restante do código (mesma interface).
 */

const timestamp = () => new Date().toISOString();

module.exports = {
  info: (...args) => console.log(`[INFO] ${timestamp()} -`, ...args),
  warn: (...args) => console.warn(`[WARN] ${timestamp()} -`, ...args),
  error: (...args) => console.error(`[ERROR] ${timestamp()} -`, ...args)
};
