
const { createUserInDb } = require('./api');
const { pool } = require('./db');

async function createAdmin() {
  try {
    const adminUser = {
      id: 'u1',
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'admin123',
      role: 'admin'
    };
    
    console.log('Attempting to create admin user...');
    await createUserInDb(adminUser);
    console.log('✓ Admin user created successfully!');
    process.exit(0);
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      console.log('! Admin user (u1) already exists in database.');
    } else {
      console.error('✗ Failed to create admin user:', error);
    }
    process.exit(1);
  }
}

createAdmin();
