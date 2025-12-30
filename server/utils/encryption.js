const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { USE_ENCRYPTION } = require('../config');

const saltRounds = 10; // Cost factor for hashing
const algorithm = 'aes-256-cbc';
const secretKey = process.env.ENCRYPTION_KEY;
const iv = crypto.randomBytes(16); // Initialization vector

if (!secretKey && USE_ENCRYPTION) {
  console.error('ENCRYPTION_KEY is not defined in .env file. Encryption will not work.');
}

async function hashPassword(password) {
  if (USE_ENCRYPTION) {
    return await bcrypt.hash(password, saltRounds);
  } else {
    return password; // Return plain password if encryption is off
  }
}

async function comparePassword(password, hash) {
  if (!USE_ENCRYPTION) {
    return password === hash;
  }
  
  try {
    // If it looks like a bcrypt hash, compare it
    if (hash && (hash.startsWith('$2a$') || hash.startsWith('$2b$') || hash.startsWith('$2y$'))) {
      return await bcrypt.compare(password, hash);
    }
    // Fallback: if not a hash, compare as plain text (useful for initial migration)
    return password === hash;
  } catch (error) {
    console.error('Password comparison error:', error);
    return password === hash;
  }
}

function encrypt(text) {
  if (!USE_ENCRYPTION || !secretKey) {
    return text;
  }
  try {
    const cipher = crypto.createCipheriv(algorithm, Buffer.from(secretKey, 'hex'), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
  } catch (error) {
    console.error('Encryption failed:', error);
    return text; // Return original text on error
  }
}

function decrypt(text) {
  if (!USE_ENCRYPTION || !secretKey) {
    return text;
  }
  try {
    const textParts = text.split(':');
    if (textParts.length !== 2) {
      return text; // Returns original if not in iv:encrypted format
    }
    const iv = Buffer.from(textParts.shift(), 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv(algorithm, Buffer.from(secretKey, 'hex'), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch (error) {
    console.error('[ENCRYPTION] Decryption failed. This usually means the ENCRYPTION_KEY is incorrect or the data is not encrypted correctly.');
    return text; // Return original as fallback
  }
}

module.exports = {
  hashPassword,
  comparePassword,
  encrypt,
  decrypt
};