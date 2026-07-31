/**
 * utils/asyncHandler.js
 * Envolve funções assíncronas de rota para encaminhar erros ao
 * middleware de tratamento de erros, sem precisar repetir try/catch.
 */

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
