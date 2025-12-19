const { pool } = require('./db');
const { encrypt } = require('./utils/encryption');
const { USE_ENCRYPTION } = require('./config');

async function migrateData() {
  if (!USE_ENCRYPTION) {
    console.log('USE_ENCRYPTION is false in config.js. No migration needed.');
    return;
  }

  console.log('Starting data migration to encrypt existing data...');

  try {
    // Migrate Users
    console.log('Migrating users...');
    const [users] = await pool.query('SELECT * FROM users');
    for (const user of users) {
      const encryptedName = encrypt(user.name);
      const encryptedEmail = encrypt(user.email);
      // Password is already hashed, no need to re-encrypt
      await pool.execute('UPDATE users SET name = ?, email = ? WHERE id = ?', [encryptedName, encryptedEmail, user.id]);
    }
    console.log(`Migrated ${users.length} users.`);

    // Migrate Projects
    console.log('Migrating projects...');
    const [projects] = await pool.query('SELECT * FROM projects');
    for (const project of projects) {
      const encryptedName = encrypt(project.name);
      const encryptedClient = encrypt(project.client);
      const encryptedDescription = encrypt(project.description);
      // developerIds is JSON, handle separately
      await pool.execute('UPDATE projects SET name = ?, client = ?, description = ? WHERE id = ?', [encryptedName, encryptedClient, encryptedDescription, project.id]);
    }
    console.log(`Migrated ${projects.length} projects.`);

    // Migrate Bugs
    console.log('Migrating bugs...');
    const [bugs] = await pool.query('SELECT * FROM bugs');
    for (const bug of bugs) {
      const encryptedDescription = encrypt(bug.description);
      const encryptedModule = encrypt(bug.module);
      // attachments is JSON, handle separately
      await pool.execute('UPDATE bugs SET description = ?, module = ? WHERE id = ?', [encryptedDescription, encryptedModule, bug.id]);
    }
    console.log(`Migrated ${bugs.length} bugs.`);

    // Migrate Screens
    console.log('Migrating screens...');
    const [screens] = await pool.query('SELECT * FROM screens');
    for (const screen of screens) {
      const encryptedTitle = encrypt(screen.title);
      const encryptedModule = encrypt(screen.module);
      const encryptedNotes = encrypt(screen.notes);
      await pool.execute('UPDATE screens SET title = ?, module = ?, notes = ? WHERE id = ?', [encryptedTitle, encryptedModule, encryptedNotes, screen.id]);
    }
    console.log(`Migrated ${screens.length} screens.`);

    console.log('Data migration completed successfully!');
  } catch (error) {
    console.error('Data migration failed:', error);
  } finally {
    pool.end(); // Close the database connection
  }
}

migrateData();