const bcrypt = require('bcryptjs');

const BCRYPT_ROUNDS = 12;

async function hashPassword(password) {
  if (typeof password !== 'string' || password.length < 8) {
    throw new Error('Password must be a string with at least 8 characters');
  }
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

async function comparePassword(password, hash) {
  if (typeof password !== 'string' || typeof hash !== 'string' || hash.length === 0) return false;
  try {
    return await bcrypt.compare(password, hash);
  } catch (_) {
    // hash is not a valid bcrypt string (e.g. legacy plain-text) — return false
    // so the caller's plain-text upgrade path can handle it
    return false;
  }
}

module.exports = {
  hashPassword,
  comparePassword
};