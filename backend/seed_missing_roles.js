require('dotenv').config();
const { pool } = require('./config/database');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

async function seed() {
  try {
    const pwd = await bcrypt.hash('password123', 10);
    
    // Check Epidemio
    const [e] = await pool.execute('SELECT * FROM users WHERE email = ?', ['epidemio@registre-cancer.dz']);
    if (e.length === 0) {
      await pool.execute('INSERT INTO users (id, nom, prenom, email, password, role, actif) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [uuidv4(), 'Dr.', 'Epidémio', 'epidemio@registre-cancer.dz', pwd, 'epidemio', true]);
      console.log('Epidemio added.');
    } else {
      await pool.execute('UPDATE users SET role="epidemio" WHERE email=?', ['epidemio@registre-cancer.dz']);
    }

    // Check Statisticien
    const [s] = await pool.execute('SELECT * FROM users WHERE email = ?', ['stats@registre-cancer.dz']);
    if (s.length === 0) {
      await pool.execute('INSERT INTO users (id, nom, prenom, email, password, role, actif) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [uuidv4(), 'Data', 'Stats', 'stats@registre-cancer.dz', pwd, 'statisticien', true]);
      console.log('Statisticien added.');
    } else {
      await pool.execute('UPDATE users SET role="statisticien" WHERE email=?', ['stats@registre-cancer.dz']);
    }

    // Check Pharmacie
    const [p] = await pool.execute('SELECT * FROM users WHERE email = ?', ['pharmacie@hospital.dz']);
    if (p.length === 0) {
      await pool.execute('INSERT INTO users (id, nom, prenom, email, password, role, actif) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [uuidv4(), 'Pharmacie', 'Centrale', 'pharmacie@hospital.dz', pwd, 'pharmacie', true]);
      console.log('Pharmacie added.');
    } else {
      await pool.execute('UPDATE users SET password=?, role="pharmacie" WHERE email=?', [pwd, 'pharmacie@hospital.dz']);
    }

    console.log('Done.');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
seed();
