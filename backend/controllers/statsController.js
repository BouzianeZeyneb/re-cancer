const { pool } = require('../config/database');

const getDashboardStats = async (req, res) => {
  try {
    const { year, month } = req.query;
    
    // Build WHERE clause based on filters
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
    // For joining with patients where prefix is needed:
    const whereClauseWithAlias = filterCondition ? filterCondition.replace(/(YEAR|MONTH)\(date_diagnostic\)/g, '$1(cc.date_diagnostic)') : '';

    const [totalPatients] = await pool.execute(`
      SELECT COUNT(DISTINCT p.id) as total 
      FROM patients p 
      LEFT JOIN cancer_cases c ON p.id = c.patient_id 
      WHERE 1=1 ${whereClauseTemplate.replace(/created_at/g, 'c.created_at')}
    `, params);
    const [totalCases] = await pool.execute(`SELECT COUNT(*) as total FROM cancer_cases WHERE 1=1 ${whereClauseTemplate}`, params);
    const [enTraitement] = await pool.execute(`SELECT COUNT(*) as total FROM cancer_cases WHERE statut_patient = 'En traitement' ${whereClauseTemplate}`, params);
    const [gueris] = await pool.execute(`SELECT COUNT(*) as total FROM cancer_cases WHERE statut_patient = 'Guéri' ${whereClauseTemplate}`, params);
    const [decedes] = await pool.execute(`SELECT COUNT(*) as total FROM cancer_cases WHERE statut_patient = 'Décédé' ${whereClauseTemplate}`, params);
    const [nouveauxMois] = await pool.execute(`SELECT COUNT(*) as total FROM cancer_cases WHERE MONTH(created_at) = MONTH(NOW()) AND YEAR(created_at) = YEAR(NOW()) ${whereClauseTemplate}`, params);

    const [sousChimio] = await pool.execute(`SELECT COUNT(DISTINCT case_id) as total FROM traitements WHERE type_traitement = 'Chimiothérapie' AND (date_fin IS NULL OR date_fin >= CURDATE())`);
    const [stadeIV] = await pool.execute(`SELECT COUNT(*) as total FROM cancer_cases WHERE stade LIKE '%IV%' ${whereClauseTemplate}`, params);
    const [enSuivi] = await pool.execute(`SELECT COUNT(*) as total FROM cancer_cases WHERE statut_patient = 'En traitement' ${whereClauseTemplate}`, params); // equivalent to enTraitement for now

    // Alerts
    const [alertWBC] = await pool.execute(`
      SELECT b.valeur, p.prenom, p.nom, cc.id as case_id, b.date_examen 
      FROM biologie b 
      JOIN cancer_cases cc ON b.case_id = cc.id 
      JOIN patients p ON cc.patient_id = p.id 
      WHERE b.parametre IN ('Globules blancs', 'WBC', 'Leucocytes') 
        AND b.interpretation IN ('Bas', 'Critique') 
        AND b.date_examen >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
      ORDER BY b.date_examen DESC LIMIT 5
    `);

    const [alertRDVTODAY] = await pool.execute(`
      SELECT rv.date_rdv, p.prenom, p.nom, cc.id as case_id, rv.motif
      FROM rendez_vous rv
      JOIN patients p ON rv.patient_id = p.id
      JOIN cancer_cases cc ON rv.case_id = cc.id
      WHERE DATE(rv.date_rdv) = CURDATE() AND rv.statut = 'Planifié'
    `);

    const [alertRetardTraitement] = await pool.execute(`
      SELECT t.type_traitement, t.date_debut, p.prenom, p.nom, cc.id as case_id
      FROM traitements t
      JOIN cancer_cases cc ON t.case_id = cc.id
      JOIN patients p ON cc.patient_id = p.id
      WHERE t.date_fin IS NULL AND t.date_debut < DATE_SUB(CURDATE(), INTERVAL 90 DAY)
      LIMIT 5
    `);

    const [parType] = await pool.execute(`
      SELECT type_cancer, COUNT(*) as count FROM cancer_cases WHERE 1=1 ${whereClauseTemplate} GROUP BY type_cancer
    `, params);

    const [parSousType] = await pool.execute(`
      SELECT COALESCE(sous_type, 'Non spécifié') as label, COUNT(*) as count 
      FROM cancer_cases WHERE 1=1 ${whereClauseTemplate} GROUP BY sous_type ORDER BY count DESC LIMIT 10
    `, params);

    const [parAge] = await pool.execute(`
      SELECT 
        CASE 
          WHEN TIMESTAMPDIFF(YEAR, p.date_naissance, CURDATE()) < 20 THEN '< 20'
          WHEN TIMESTAMPDIFF(YEAR, p.date_naissance, CURDATE()) BETWEEN 20 AND 39 THEN '20-39'
          WHEN TIMESTAMPDIFF(YEAR, p.date_naissance, CURDATE()) BETWEEN 40 AND 59 THEN '40-59'
          WHEN TIMESTAMPDIFF(YEAR, p.date_naissance, CURDATE()) BETWEEN 60 AND 79 THEN '60-79'
          ELSE '80+'
        END as tranche_age,
        COUNT(*) as count
      FROM cancer_cases cc JOIN patients p ON cc.patient_id = p.id
      WHERE 1=1 ${whereClauseWithAlias}
      GROUP BY tranche_age ORDER BY tranche_age
    `, params);

    const [parSexe] = await pool.execute(`
      SELECT p.sexe, COUNT(*) as count FROM cancer_cases cc JOIN patients p ON cc.patient_id = p.id 
      WHERE 1=1 ${whereClauseWithAlias} GROUP BY p.sexe
    `, params);

    const [parMois] = await pool.execute(`
      SELECT DATE_FORMAT(date_diagnostic, '%Y-%m') as mois, COUNT(*) as count
      FROM cancer_cases WHERE date_diagnostic >= DATE_SUB(NOW(), INTERVAL 12 MONTH) ${whereClauseTemplate}
      GROUP BY mois ORDER BY mois
    `, params);

    const [parWilaya] = await pool.execute(`
      SELECT p.wilaya, COUNT(*) as count FROM cancer_cases cc JOIN patients p ON cc.patient_id = p.id
      WHERE p.wilaya IS NOT NULL AND p.wilaya != '' ${whereClauseWithAlias}
      GROUP BY p.wilaya ORDER BY count DESC LIMIT 20
    `, params);

    const [parEtat] = await pool.execute(`
      SELECT etat, COUNT(*) as count FROM cancer_cases WHERE 1=1 ${whereClauseTemplate} GROUP BY etat
    `, params);

    res.json({
      totaux: {
        patients: totalPatients[0].total,
        cas: totalCases[0].total,
        enTraitement: enTraitement[0].total,
        gueris: gueris[0].total,
        decedes: decedes[0].total,
        nouveauxMois: nouveauxMois[0].total,
        sousChimio: sousChimio[0].total,
        stadeIV: stadeIV[0].total,
        enSuivi: enSuivi[0].total
      },
      alertes: {
        wbc: alertWBC,
        rdvToday: alertRDVTODAY,
        retards: alertRetardTraitement
      },
      parType,
      parSousType,
      parAge,
      parSexe,
      parMois,
      parWilaya,
      parEtat
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAuditLogs = async (req, res) => {
  try {
    const [logs] = await pool.execute(`
      SELECT al.*, u.nom, u.prenom, u.email 
      FROM audit_logs al LEFT JOIN users u ON al.user_id = u.id
      ORDER BY al.created_at DESC LIMIT 100
    `);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getDashboardStats, getAuditLogs };
