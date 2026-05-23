require('dotenv').config({ path: '../.env' });
const { pool } = require('./config/database');
const { v4: uuidv4 } = require('uuid');

async function createTestNotification() {
  console.log('\n🔔 Création d\'une notification de test pour ANAPATH...\n');
  const conn = await pool.getConnection();

  try {
    // 1. Rechercher un utilisateur ANAPATH
    let [users] = await conn.execute("SELECT id, email, nom, role FROM users WHERE role = 'anapath' OR email LIKE '%anapath%' LIMIT 1");
    
    let userId;
    let userEmail;
    
    if (users.length === 0) {
      console.log('⚠️ Aucun utilisateur ANAPATH trouvé. Création d\'un utilisateur temporaire pour le test...');
      userId = uuidv4();
      userEmail = 'anapath@registre-cancer.dz';
      
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('Anapath@2024', 10);
      
      await conn.execute(
        "INSERT INTO users (id, nom, prenom, email, password, role) VALUES (?, ?, ?, ?, ?, ?)",
        [userId, 'Test', 'Anapath', userEmail, hashedPassword, 'anapath']
      );
      console.log(`✅ Utilisateur ANAPATH créé : ${userEmail} / Anapath@2024`);
    } else {
      userId = users[0].id;
      userEmail = users[0].email;
      console.log(`✅ Utilisateur ANAPATH trouvé : ${userEmail} (ID: ${userId})`);
    }

    // 2. Insérer une notification pour cet utilisateur
    const notifId = uuidv4();
    const titre = 'Prélèvement urgent à analyser';
    const message = 'Un nouveau prélèvement urgent (Biopsie - Patient: Test Patient) a été assigné et est en attente d\'analyse.';
    const lien = '/anapath/prelevements';

    await conn.execute(
      "INSERT INTO notifications (id, user_id, titre, message, lien, lu) VALUES (?, ?, ?, ?, ?, ?)",
      [notifId, userId, titre, message, lien, false]
    );

    console.log(`\n✅ Notification insérée avec succès pour ${userEmail} !`);
    console.log(`   - ID : ${notifId}`);
    console.log(`   - Titre : ${titre}`);
    console.log(`   - Message : ${message}`);
    console.log(`   - Lien : ${lien}`);

    // Optionnel: Compter le nombre de notifications non lues
    const [countRes] = await conn.execute("SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND lu = false", [userId]);
    console.log(`   - Total des notifications non lues pour cet utilisateur : ${countRes[0].count}`);

  } catch (err) {
    console.error('❌ Erreur lors de la création de la notification :', err.message);
  } finally {
    conn.release();
    process.exit(0);
  }
}

createTestNotification();
