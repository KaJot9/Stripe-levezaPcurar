/**
 * utils/validators.js
 * Pequenas funções de validação de entrada usadas pelos controllers.
 */

const isValidEmail = (email) =>
  typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const isNonEmptyString = (value) =>
  typeof value === 'string' && value.trim().length > 0;

const isValidUrl = (value) => {
  try {
    // eslint-disable-next-line no-new
    new URL(value);
    return true;
  } catch {
    return false;
  }
};

const isValidPriceId = (value) =>
  isNonEmptyString(value) && value.startsWith('price_');

const isPositiveNumber = (value) => {
  const n = Number(value);
  return !Number.isNaN(n) && n > 0;
};

module.exports = {
  isValidEmail,
  isNonEmptyString,
  isValidUrl,
  isValidPriceId,
  isPositiveNumber
};
