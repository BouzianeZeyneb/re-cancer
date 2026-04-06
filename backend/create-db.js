require('dotenv').config();
const mysql = require('mysql2/promise');

async function createDb() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      port: process.env.DB_PORT || 3306
    });
    
    await connection.query('CREATE DATABASE IF NOT EXISTS cancer_registry CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;');
    console.log('Database cancer_registry ensured.');
    await connection.end();
  } catch (e) {
    console.error('Failed to create DB:', e.message);
  }
}

createDb();
