const bcrypt = require('bcrypt');
const { USE_ENCRYPTION } = require('../config');

const saltRounds = 10; // Cost factor for hashing

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

module.exports = {
  hashPassword,
  comparePassword
};