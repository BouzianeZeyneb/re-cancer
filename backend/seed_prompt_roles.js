require('dotenv').config();
const { pool } = require('./config/database');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

async function seed() {
  try {
    console.log('Altering users ENUM to add new roles...');
    await pool.execute("ALTER TABLE users MODIFY COLUMN role ENUM('admin','medecin','laboratoire','anapath','pharmacien','pharmacie','epidemiologiste','statisticien','epidemio') NOT NULL DEFAULT 'medecin'");

    const users = [
      { email: 'epidemio@registre-cancer.dz', pw: 'Epidemio2024!', role: 'epidemiologiste', nom: 'Épidémio', prenom: 'Dr.' },
      { email: 'stats@registre-cancer.dz', pw: 'Stats2024!', role: 'statisticien', nom: 'Stats', prenom: 'Data' },
      { email: 'pharmacie@hospital.dz', pw: 'Pharmacie2024!', role: 'pharmacien', nom: 'Pharmacie', prenom: 'Centrale' }
    ];

    for (const u of users) {
      const hashed = await bcrypt.hash(u.pw, 10);
      const [ex] = await pool.execute('SELECT id FROM users WHERE email = ?', [u.email]);
      if (ex.length > 0) {
        await pool.execute('UPDATE users SET password=?, role=? WHERE email=?', [hashed, u.role, u.email]);
        console.log(`Updated ${u.email}`);
      } else {
        await pool.execute('INSERT INTO users (id, nom, prenom, email, password, role, actif) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [uuidv4(), u.nom, u.prenom, u.email, hashed, u.role, true]);
        console.log(`Inserted ${u.email}`);
      }
    }
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
seed();
