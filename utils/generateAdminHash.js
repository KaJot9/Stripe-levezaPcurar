/**
 * utils/generateAdminHash.js
 * Script de linha de comando para gerar o hash bcrypt da senha do admin,
 * usado na variável de ambiente ADMIN_PASSWORD_HASH.
 *
 * Uso:
 *   node utils/generateAdminHash.js "minhaSenhaForte123"
 */

const bcrypt = require('bcryptjs');

const senha = process.argv[2];

if (!senha) {
  console.error('Uso: node utils/generateAdminHash.js "suaSenha"');
  process.exit(1);
}

const hash = bcrypt.hashSync(senha, 10);
console.log('\nAdicione isto ao seu .env:\n');
console.log(`ADMIN_PASSWORD_HASH=${hash}\n`);
