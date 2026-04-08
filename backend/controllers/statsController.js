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
    const whereClauseWithAlias = filterCondition ? filterCondition.replace(/(YEAR|MONTH)\(date_diagnostic\)/g, '$1(cc.date_diagnostic)') : '';

    const [totalPatients] = await pool.execute(`
      SELECT COUNT(DISTINCT p.id) as total FROM patients p LEFT JOIN cancer_cases c ON p.id = c.patient_id WHERE 1=1 ${whereClauseTemplate.replace(/created_at/g, 'c.created_at')}
    `, params);
    const [totalCases] = await pool.execute(`SELECT COUNT(*) as total FROM cancer_cases WHERE 1=1 ${whereClauseTemplate}`, params);
    const [enTraitement] = await pool.execute(`SELECT COUNT(*) as total FROM cancer_cases WHERE statut_patient = 'En traitement' ${whereClauseTemplate}`, params);
    const [parType] = await pool.execute(`
      SELECT type_cancer, COUNT(*) as count FROM cancer_cases WHERE 1=1 ${whereClauseTemplate} GROUP BY type_cancer
    `, params);

    res.json({ 
       totaux: { patients: totalPatients[0].total, cas: totalCases[0].total, suivi: enTraitement[0].total },
       parType
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
