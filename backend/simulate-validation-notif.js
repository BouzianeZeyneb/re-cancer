require('dotenv').config({ path: '../.env' });
const { pool } = require('./config/database');

async function simulate() {
  const conn = await pool.getConnection();
  try {
    const crId = '0215bb1b-4516-4337-aeab-fd19af0fe8e6';
    const [crData] = await conn.execute(
      `SELECT cc.medecin_traitant, cc.created_by AS case_creator, a.created_by AS anapath_creator, p.nom, p.prenom 
       FROM comptes_rendus_anapath cr
       JOIN anapath a ON cr.anapath_id = a.id
       JOIN cancer_cases cc ON cr.case_id = cc.id
       JOIN patients p ON cr.patient_id = p.id
       WHERE cr.id = ?`,
      [crId]
    );
    console.log('--- CR DATA ---');
    console.log(crData);
    
    if (crData.length > 0) {
      const recipientId = crData[0].medecin_traitant || crData[0].case_creator || crData[0].anapath_creator;
      console.log('Recipient ID:', recipientId);
      
      const [user] = await conn.execute("SELECT id, email, role FROM users WHERE id = ?", [recipientId]);
      console.log('User found:', user);
    }
  } catch (e) {
    console.error(e);
  } finally {
    conn.release();
    process.exit(0);
  }
}

simulate();
