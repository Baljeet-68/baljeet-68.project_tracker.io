const { USE_ENCRYPTION } = require('../config');

async function hashPassword(password) {
  return password; // Return plain password
}

async function comparePassword(password, hash) {
  return password === hash; // Direct comparison
}

function encrypt(text) {
  return text; // Return plain text
}

function decrypt(text) {
  return text; // Return plain text
}

module.exports = {
  hashPassword,
  comparePassword,
  encrypt,
  decrypt
};