require('dotenv').config({ path: './.env' });
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
  if (USE_ENCRYPTION) {
    return await bcrypt.compare(password, hash);
  } else {
    return password === hash; // Compare plain passwords if encryption is off
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
      // Not an encrypted string or invalid format, return as is
      return text;
    }
    const decipher = crypto.createDecipheriv(algorithm, Buffer.from(secretKey, 'hex'), Buffer.from(textParts[0], 'hex'));
    let decrypted = decipher.update(Buffer.from(textParts[1], 'hex'));
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch (error) {
    console.error('Decryption failed:', error);
    return text; // Return original text on error
  }
}

module.exports = {
  hashPassword,
  comparePassword,
  encrypt,
  decrypt
};