/**
 * Migration : Ajoute le rôle 'pharmacie' à l'ENUM users.role
 * et crée un utilisateur de test avec ce rôle.
 *
 * Utilisation : node add-pharmacie-role.js
 */

require('dotenv').config();
const { pool } = require('./config/database');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

async function migrate() {
  try {
    // ─── 1. Modifier l'ENUM pour inclure 'pharmacie' ───────────────────────
    console.log('🔧 Mise à jour de l\'ENUM role...');
    await pool.execute(
      `ALTER TABLE users MODIFY COLUMN role 
       ENUM('admin','medecin','laboratoire','anapath','pharmacien','pharmacie') 
       NOT NULL DEFAULT 'medecin'`
    );
    console.log('✅ ENUM role mis à jour (pharmacie ajouté)');

    // ─── 2. Créer un utilisateur pharmacie de test ─────────────────────────
    const email = 'pharmacie@registre-cancer.dz';
    const password = 'Pharmacie@2024';

    const [existing] = await pool.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existing.length === 0) {
      const hashed = await bcrypt.hash(password, 10);
      await pool.execute(
        'INSERT INTO users (id, nom, prenom, email, password, role, actif) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [uuidv4(), 'Pharmacie', 'Test', email, hashed, 'pharmacie', true]
      );
      console.log(`✅ Utilisateur créé :`);
      console.log(`   Email    : ${email}`);
      console.log(`   Password : ${password}`);
      console.log(`   Rôle     : pharmacie`);
    } else {
      // Mettre à jour le mot de passe et s'assurer que le rôle est bon
      const hashed = await bcrypt.hash(password, 10);
      await pool.execute(
        'UPDATE users SET password = ?, role = ? WHERE email = ?',
        [hashed, 'pharmacie', email]
      );
      console.log(`✅ Utilisateur existant mis à jour (${email}) — rôle → pharmacie`);
    }

    // ─── 3. Lister tous les utilisateurs pharmacie ─────────────────────────
    const [users] = await pool.execute(
      "SELECT id, nom, prenom, email, role, actif FROM users WHERE role IN ('pharmacien', 'pharmacie')"
    );
    console.log('\n📋 Utilisateurs pharmacie/pharmacien :');
    users.forEach(u =>
      console.log(`   [${u.role}] ${u.prenom} ${u.nom} <${u.email}> — actif: ${u.actif}`)
    );

    process.exit(0);
  } catch (err) {
    console.error('❌ Erreur :', err.message);
    process.exit(1);
  }
}

migrate();
