require('dotenv').config();
const { pool } = require('./config/database');

async function checkUsers() {
    try {
        const [users] = await pool.execute('SELECT id, nom, prenom, email, role, actif FROM users');
        console.log('--- USERS LIST ---');
        users.forEach(u => {
            console.log(`[${u.role.toUpperCase()}] ${u.email} - ${u.nom} ${u.prenom} (Actif: ${u.actif})`);
        });
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

checkUsers();
