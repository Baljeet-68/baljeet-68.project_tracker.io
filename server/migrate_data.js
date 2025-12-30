const { pool } = require('./db');
const { decrypt } = require('./utils/encryption');

async function decryptExistingData() {
  console.log('Starting data decryption to restore plain text...');

  try {
    // Decrypt Users
    console.log('Decrypting users...');
    const [users] = await pool.query('SELECT * FROM users');
    for (const user of users) {
      const decryptedName = decrypt(user.name);
      const decryptedEmail = decrypt(user.email);
      await pool.execute('UPDATE users SET name = ?, email = ? WHERE id = ?', [decryptedName, decryptedEmail, user.id]);
    }
    console.log(`Decrypted ${users.length} users.`);

    // Decrypt Projects
    console.log('Decrypting projects...');
    const [projects] = await pool.query('SELECT * FROM projects');
    for (const project of projects) {
      const decryptedName = decrypt(project.name);
      const decryptedClient = decrypt(project.client);
      const decryptedDescription = decrypt(project.description);
      await pool.execute('UPDATE projects SET name = ?, client = ?, description = ? WHERE id = ?', [decryptedName, decryptedClient, decryptedDescription, project.id]);
    }
    console.log(`Decrypted ${projects.length} projects.`);

    // Decrypt Bugs
    console.log('Decrypting bugs...');
    const [bugs] = await pool.query('SELECT * FROM bugs');
    for (const bug of bugs) {
      const decryptedDescription = decrypt(bug.description);
      const decryptedModule = decrypt(bug.module);
      await pool.execute('UPDATE bugs SET description = ?, module = ? WHERE id = ?', [decryptedDescription, decryptedModule, bug.id]);
    }
    console.log(`Decrypted ${bugs.length} bugs.`);

    // Decrypt Screens
    console.log('Decrypting screens...');
    const [screens] = await pool.query('SELECT * FROM screens');
    for (const screen of screens) {
      const decryptedTitle = decrypt(screen.title);
      const decryptedModule = decrypt(screen.module);
      const decryptedNotes = decrypt(screen.notes);
      await pool.execute('UPDATE screens SET title = ?, module = ?, notes = ? WHERE id = ?', [decryptedTitle, decryptedModule, decryptedNotes, screen.id]);
    }
    console.log(`Decrypted ${screens.length} screens.`);

    console.log('Data decryption completed successfully!');
  } catch (error) {
    console.error('Data decryption failed:', error);
  } finally {
    pool.end();
  }
}

// NOTE: This script is only useful if you have ALREADY encrypted data in your DB.
// Since we've disabled encryption in code, the decrypt() function now just returns the string as-is.
// To actually decrypt, you'd need the OLD version of decrypt() with the key.
// If you've already wiped or haven't encrypted yet, you can ignore this.
// decryptExistingData();