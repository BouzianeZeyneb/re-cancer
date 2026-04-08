const { pool } = require('../config/database');

const getDashboardStats = async (req, res) => {
  try {
    const { year, month } = req.query;
    let filterCondition = '';
    const params = [];
    
    if (year) {
      filterCondition += ' AND YEAR(date_diagnostic) = ?';
      params.push(year);
    }
    if (month) {
      filterCondition += ' AND MONTH(date_diagnostic) = ?';
      params.push(month);
    }

    const whereClauseTemplate = filterCondition ? filterCondition : '';

    const [totalPatients] = await pool.execute(`
      SELECT COUNT(DISTINCT p.id) as total FROM patients p LEFT JOIN cancer_cases c ON p.id = c.patient_id WHERE 1=1 ${whereClauseTemplate}
    `, params);
    
    const [totalCases] = await pool.execute(`SELECT COUNT(*) as total FROM cancer_cases WHERE 1=1 ${whereClauseTemplate}`, params);
    const [enTraitement] = await pool.execute(`SELECT COUNT(*) as total FROM cancer_cases WHERE statut_patient = 'En traitement' ${whereClauseTemplate}`, params);
    const [nouveauxMois] = await pool.execute(`SELECT COUNT(*) as total FROM cancer_cases WHERE MONTH(created_at) = MONTH(CURRENT_DATE) AND YEAR(created_at) = YEAR(CURRENT_DATE)`);
    const [stadeIV] = await pool.execute(`SELECT COUNT(*) as total FROM cancer_cases WHERE stade = 'Stade IV' ${whereClauseTemplate}`, params);

    const [parType] = await pool.execute(`
      SELECT type_cancer, COUNT(*) as count FROM cancer_cases WHERE 1=1 ${whereClauseTemplate} GROUP BY type_cancer
    `, params);

    const [parSexe] = await pool.execute(`
      SELECT sexe, COUNT(*) as count 
      FROM patients p 
      JOIN cancer_cases cc ON p.id = cc.patient_id 
      WHERE 1=1 ${whereClauseTemplate.replace(/date_diagnostic/g, 'cc.date_diagnostic')}
      GROUP BY sexe
    `, params);

    const [parAge] = await pool.execute(`
      SELECT 
        CASE 
          WHEN TIMESTAMPDIFF(YEAR, p.date_naissance, CURDATE()) < 15 THEN '0-14'
          WHEN TIMESTAMPDIFF(YEAR, p.date_naissance, CURDATE()) < 30 THEN '15-29'
          WHEN TIMESTAMPDIFF(YEAR, p.date_naissance, CURDATE()) < 45 THEN '30-44'
          WHEN TIMESTAMPDIFF(YEAR, p.date_naissance, CURDATE()) < 60 THEN '45-59'
          WHEN TIMESTAMPDIFF(YEAR, p.date_naissance, CURDATE()) < 75 THEN '60-74'
          ELSE '75+'
        END as name,
        COUNT(*) as value
      FROM patients p
      JOIN cancer_cases cc ON p.id = cc.patient_id
      WHERE 1=1 ${whereClauseTemplate.replace(/date_diagnostic/g, 'cc.date_diagnostic')}
      GROUP BY name
      ORDER BY FIELD(name, '0-14', '15-29', '30-44', '45-59', '60-74', '75+')
    `, params);

    const [parWilaya] = await pool.execute(`
      SELECT p.wilaya as name, COUNT(*) as value 
      FROM patients p 
      JOIN cancer_cases cc ON p.id = cc.patient_id 
      WHERE 1=1 ${whereClauseTemplate.replace(/date_diagnostic/g, 'cc.date_diagnostic')}
      GROUP BY p.wilaya ORDER BY value DESC LIMIT 10
    `, params);

    const [recent] = await pool.execute(`
      SELECT p.nom, p.prenom, p.sexe, TIMESTAMPDIFF(YEAR, p.date_naissance, CURDATE()) as age, 
             cc.sous_type as diagnostic, cc.stade, cc.statut_patient, cc.created_at
      FROM patients p
      JOIN cancer_cases cc ON p.id = cc.patient_id
      ORDER BY cc.created_at DESC
      LIMIT 10
    `);

    res.json({ 
       totaux: { 
         patients: totalPatients[0].total, 
         cas: totalCases[0].total, 
         suivi: enTraitement[0].total,
         enTraitement: enTraitement[0].total,
         nouveauxMois: nouveauxMois[0].total,
         stadeIV: stadeIV[0].total
       },
       parType,
       parSexe,
       parAge,
       parWilaya,
       recentDossiers: recent
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getRawStatsData = async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT 
        cc.id as case_id, 
        cc.type_cancer, 
        cc.sous_type, 
        cc.localisation, 
        cc.stade, 
        cc.grade_histologique, 
        cc.statut_patient, 
        cc.date_diagnostic,
        p.sexe, 
        p.wilaya, 
        p.commune,
        p.fumeur,
        p.alcool,
        p.date_naissance,
        TIMESTAMPDIFF(YEAR, p.date_naissance, CURDATE()) as age
      FROM cancer_cases cc
      JOIN patients p ON cc.patient_id = p.id
      ORDER BY cc.date_diagnostic DESC
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAuditLogs = async (req, res) => { /* simplified */ res.json([]); };
const analyzeWilayaIA = async (req, res) => { res.json({}); };
const analyzePatientIA = async (req, res) => { res.json({}); };
const askGlobalIA = async (req, res) => { res.json({}); };

module.exports = { 
  getDashboardStats, 
  getAuditLogs, 
  analyzeWilayaIA, 
  analyzePatientIA, 
  askGlobalIA,
  getRawStatsData
};
