require('dotenv').config();
const { pool } = require('./config/database');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const seedUsers = async () => {
  const users = [
    { email: 'admin@registre-cancer.dz', pw: 'admin123', role: 'admin', nom: 'Admin', prenom: 'Système' },
    { email: 'medecin@registre-cancer.dz', pw: 'medecin123', role: 'medecin', nom: 'Médecin', prenom: 'Test' },
    { email: 'anapath@registre-cancer.dz', pw: 'anapath123', role: 'anapath', nom: 'Anapath', prenom: 'Test' },
    { email: 'laboratoire@registre-cancer.dz', pw: 'labo123', role: 'laboratoire', nom: 'Labo', prenom: 'Test' },
  ];

  try {
    for (const u of users) {
      const hashed = await bcrypt.hash(u.pw, 10);
      const [existing] = await pool.execute('SELECT id FROM users WHERE email = ?', [u.email]);
      
      if (existing.length === 0) {
        await pool.execute(
          'INSERT INTO users (id, nom, prenom, email, password, role) VALUES (?, ?, ?, ?, ?, ?)',
          [uuidv4(), u.nom, u.prenom, u.email, hashed, u.role]
        );
        console.log(`✅ Créé ${u.role}: ${u.email} / ${u.pw}`);
      } else {
        await pool.execute('UPDATE users SET password = ? WHERE email = ?', [hashed, u.email]);
        console.log(`✅ Mot de passe mis à jour pour ${u.role}: ${u.email} / ${u.pw}`);
      }
    }
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
};

seedUsers();
