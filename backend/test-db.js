require('dotenv').config();
const mysql = require('mysql2/promise');

async function test() {
  const config = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    port: parseInt(process.env.DB_PORT) || 3306
  };
  console.log('Testing connection with:', config);
  try {
    const conn = await mysql.createConnection(config);
    console.log('✅ Connection successful!');
    const [rows] = await conn.query('SHOW DATABASES');
    console.log('Databases:', rows.map(r => r.Database));
    await conn.end();
  } catch (err) {
    console.error('❌ Connection failed:', err.message);
  }
}
test();
