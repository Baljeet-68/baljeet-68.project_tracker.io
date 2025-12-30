
const { pool } = require('./db');
const { decrypt } = require('./utils/encryption');

async function debugUsers() {
  try {
    const [rows] = await pool.query('SELECT * FROM users');
    console.log(`Found ${rows.length} users in DB.`);
    
    rows.forEach(r => {
      const decryptedEmail = decrypt(r.email);
      console.log(`- ID: ${r.id}, Role: ${r.role}`);
      console.log(`  Email (Decrypted): ${decryptedEmail}`);
      console.log(`  Email (Raw): ${r.email}`);
      console.log(`  Password (Raw): ${r.password.substring(0, 10)}... (Length: ${r.password.length})`);
      console.log('---');
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Debug failed:', error);
    process.exit(1);
  }
}

debugUsers();
