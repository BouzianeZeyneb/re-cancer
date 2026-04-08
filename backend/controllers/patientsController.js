const { v4: uuidv4 } = require('uuid');
const { pool } = require('../config/database');
const { auditLog } = require('../middleware/auth');

const getAllPatients = async (req, res) => {
  try {
    const { search, sexe, wilaya, page = 1, limit = 20 } = req.query;
    let query = `
      SELECT p.*, 
        (SELECT COUNT(*) FROM cancer_cases WHERE patient_id = p.id) as nb_cancers,
        (SELECT statut_patient FROM cancer_cases WHERE patient_id = p.id ORDER BY created_at DESC LIMIT 1) as derniere_statut
      FROM patients p WHERE 1=1
    `;
    const params = [];

    if (search) {
      query += ' AND (p.nom LIKE ? OR p.prenom LIKE ? OR p.num_carte_nationale LIKE ? OR p.telephone LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (sexe) { query += ' AND p.sexe = ?'; params.push(sexe); }
    if (wilaya) { query += ' AND p.wilaya LIKE ?'; params.push(`%${wilaya}%`); }

    const offset = (page - 1) * limit;
    const [countResult] = await pool.execute(query.replace('SELECT p.*,', 'SELECT COUNT(*) as total,').split('FROM patients')[0] + ' FROM patients p WHERE 1=1' + query.split('WHERE 1=1')[1], params);

    query += ' ORDER BY p.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const [patients] = await pool.execute(query, params);
    res.json({ patients, total: patients.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getPatientById = async (req, res) => {
  try {
    const { id } = req.params;
    const [patients] = await pool.execute('SELECT * FROM patients WHERE id = ?', [id]);
    if (!patients.length) return res.status(404).json({ message: 'Patient non trouvé' });

    const [cases] = await pool.execute(`
      SELECT cc.*, u.nom as medecin_nom, u.prenom as medecin_prenom 
      FROM cancer_cases cc 
      LEFT JOIN users u ON cc.medecin_traitant = u.id 
      WHERE cc.patient_id = ? ORDER BY cc.date_diagnostic DESC
    `, [id]);

    const [rdv] = await pool.execute('SELECT * FROM rendez_vous WHERE patient_id = ? ORDER BY date_rdv DESC LIMIT 10', [id]);

    res.json({ ...patients[0], cancer_cases: cases, rendez_vous: rdv });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Helper functions for duplicate check
const getLevenshteinDistance = (a, b) => {
  if (!a || !b) return 0;
  a = a.toLowerCase(); b = b.toLowerCase();
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const matrix = [];
  for (let i = 0; i <= b.length; i++) { matrix[i] = [i]; }
  for (let j = 0; j <= a.length; j++) { matrix[0][j] = j; }
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1));
      }
    }
  }
  return matrix[b.length][a.length];
};

const getSimilarityScore = (str1, str2) => {
  if (!str1 && !str2) return 100;
  if (!str1 || !str2) return 0;
  const maxLen = Math.max(str1.length, str2.length);
  if (maxLen === 0) return 100;
  const dist = getLevenshteinDistance(str1, str2);
  return Math.round((1 - dist / maxLen) * 100);
};

const calculateDetailedSimilarity = (newP, oldP) => {
  const simNom1 = getSimilarityScore(newP.nom, oldP.nom);
  const simPrenom1 = getSimilarityScore(newP.prenom, oldP.prenom);
  const simNom2 = getSimilarityScore(newP.nom, oldP.prenom);
  const simPrenom2 = getSimilarityScore(newP.prenom, oldP.nom);
  
  let simNom = simNom1;
  let simPrenom = simPrenom1;
  if ((simNom2 + simPrenom2) > (simNom1 + simPrenom1)) {
    simNom = simNom2;
    simPrenom = simPrenom2;
  }
  
  let simDate = 0;
  if (newP.date_naissance && oldP.date_naissance) {
    try {
      const d1 = new Date(newP.date_naissance).toISOString().substring(0, 10);
      const d2 = new Date(oldP.date_naissance).toISOString().substring(0, 10);
      if (d1 === d2) simDate = 100;
    } catch(e) {}
  } else if (!newP.date_naissance && !oldP.date_naissance) {
    simDate = 100;
  }
  
  const simSexe = (newP.sexe === oldP.sexe) ? 100 : 0;
  
  let simCNI = 0;
  if (newP.num_carte_nationale && oldP.num_carte_nationale) {
    simCNI = getSimilarityScore(newP.num_carte_nationale, oldP.num_carte_nationale);
  } else if (!newP.num_carte_nationale && !oldP.num_carte_nationale) {
    simCNI = 100;
  }
  
  const simWilaya = getSimilarityScore(newP.wilaya, oldP.wilaya);

  let totalScore = 0;
  let weightSum = 0;
  const addScore = (score, weight) => { totalScore += score * weight; weightSum += weight; };
  
  if (newP.num_carte_nationale || oldP.num_carte_nationale) addScore(simCNI, 3);
  addScore(simNom, 2.5);
  addScore(simPrenom, 2.5);
  addScore(simDate, 2.5);
  addScore(simSexe, 0.5);
  if (newP.wilaya || oldP.wilaya) addScore(simWilaya, 1);
  
  const global = Math.round(totalScore / weightSum);
  const identifier = oldP.id ? oldP.id.split('-')[0].toUpperCase() : 'UNKNOWN';
  
  return {
    global,
    details: [
      { field: 'N° Carte Nationale', value: simCNI },
      { field: 'Nom', value: simNom },
      { field: 'Prénom', value: simPrenom },
      { field: 'Date de naissance', value: simDate },
      { field: 'Sexe', value: simSexe },
      { field: 'Wilaya', value: simWilaya }
    ],
    existingPatient: `${oldP.nom} ${oldP.prenom} - ${oldP.sexe === 'M' ? 'Masculin' : (oldP.sexe === 'F' ? 'Féminin' : 'Inconnu')}`,
    existingRef: `REG-${identifier}`,
    existingData: oldP
  };
};

const checkForDuplicate = async (patient, reqId = null) => {
  if (patient.forceSave) return null;
  
  // To avoid missing any soft match (like swapped letters, completely wrong first letter, etc),
  // we retrieve the lightweight fields for ALL patients. In a JS backend this takes ~5ms for 10k patients.
  const query = `SELECT id, nom, prenom, date_naissance, sexe, num_carte_nationale, wilaya FROM patients WHERE id != ?`;
  const [candidates] = await pool.execute(query, [reqId || 'noop']);
  
  let bestMatch = null;
  let highestScore = 0;
  
  for (const cand of candidates) {
    // Règle d'exclusion absolue : si les deux ont un CNI ET qu'ils sont différents → pas un doublon
    const newCNI = (patient.num_carte_nationale || '').trim();
    const oldCNI = (cand.num_carte_nationale || '').trim();
    if (newCNI && oldCNI && newCNI.toLowerCase() !== oldCNI.toLowerCase()) {
      continue; // Personnes différentes avec certitude
    }

    const similarity = calculateDetailedSimilarity(patient, cand);
    
    // Règle positive : Nom + Prénom identiques = doublon probable (si pas de CNI pour départager)
    const nomScore = getSimilarityScore(patient.nom, cand.nom);
    const prenomScore = getSimilarityScore(patient.prenom, cand.prenom);
    const isExactNameMatch = nomScore >= 95 && prenomScore >= 95;
    
    // Règle positive : CNI identique = doublon certain
    const isCNIMatch = newCNI && oldCNI &&
      getSimilarityScore(newCNI, oldCNI) >= 95;
    
    // Forcer le score à 85% minimum si correspondance de nom (sans CNI contradictoire) ou CNI
    const effectiveScore = (isExactNameMatch || isCNIMatch)
      ? Math.max(similarity.global, 85)
      : similarity.global;
    
    if (effectiveScore > highestScore) {
      highestScore = effectiveScore;
      bestMatch = { ...similarity, global: effectiveScore };
    }
  }
  
  if (highestScore >= 60) {
    return bestMatch;
  }
  return null;
};


const createPatient = async (req, res) => {
  try {
    const duplicateMatch = await checkForDuplicate(req.body);
    if (duplicateMatch) {
      return res.status(409).json({ code: 'DUPLICATE_SUSPECTED', similarityInfo: duplicateMatch });
    }

    const id = uuidv4();
    const { nom, prenom, date_naissance, sexe, telephone, num_carte_nationale, num_carte_chifa, adresse, commune, wilaya, latitude, longitude, fumeur, alcool, activite_sportive, autres_medicaments, autres_facteurs_risque, assurance, groupe_sanguin, email } = req.body;
    
    await pool.execute(
      `INSERT INTO patients (id, nom, prenom, date_naissance, sexe, telephone, num_carte_nationale, num_carte_chifa, adresse, commune, wilaya, latitude, longitude, fumeur, alcool, activite_sportive, autres_medicaments, autres_facteurs_risque, assurance, groupe_sanguin, email, created_by) 
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [id, nom, prenom, date_naissance, sexe, telephone, num_carte_nationale || null, num_carte_chifa || null, adresse, commune, wilaya, latitude || null, longitude || null, fumeur||false, alcool||false, activite_sportive||false, autres_medicaments, autres_facteurs_risque, assurance || null, groupe_sanguin || null, email || null, req.user.id]
    );

    await auditLog(req.user.id, 'CREATE_PATIENT', 'patients', id, { nom, prenom }, req.ip);
    res.status(201).json({ message: 'Patient créé avec succès', id });
  } catch (error) {
    console.error('CREATE PATIENT ERROR:', error);
    res.status(500).json({ message: error.message });
  }
};

const updatePatient = async (req, res) => {
  try {
    const { id } = req.params;
    
    const duplicateMatch = await checkForDuplicate(req.body, id);
    if (duplicateMatch) {
      return res.status(409).json({ code: 'DUPLICATE_SUSPECTED', similarityInfo: duplicateMatch });
    }
    
    const { nom, prenom, date_naissance, sexe, telephone, num_carte_nationale, num_carte_chifa, adresse, commune, wilaya, fumeur, alcool, activite_sportive, autres_medicaments, autres_facteurs_risque, assurance, groupe_sanguin, email } = req.body;
    
    await pool.execute(
      `UPDATE patients SET nom=?, prenom=?, date_naissance=?, sexe=?, telephone=?, num_carte_nationale=?, num_carte_chifa=?, adresse=?, commune=?, wilaya=?, fumeur=?, alcool=?, activite_sportive=?, autres_medicaments=?, autres_facteurs_risque=?, assurance=?, groupe_sanguin=?, email=? WHERE id=?`,
      [nom, prenom, date_naissance, sexe, telephone, num_carte_nationale || null, num_carte_chifa || null, adresse, commune, wilaya, fumeur||false, alcool||false, activite_sportive||false, autres_medicaments, autres_facteurs_risque, assurance || null, groupe_sanguin || null, email || null, id]
    );

    await auditLog(req.user.id, 'UPDATE_PATIENT', 'patients', id, req.body, req.ip);
    res.json({ message: 'Patient modifié avec succès' });
  } catch (error) {
    console.error('UPDATE PATIENT ERROR:', error);
    res.status(500).json({ message: error.message });
  }
};

const deletePatient = async (req, res) => {
  try {
    const { id } = req.params;
    const [cases] = await pool.execute('SELECT id FROM cancer_cases WHERE patient_id = ?', [id]);
    if (cases.length > 0) {
      return res.status(400).json({ message: `Ce patient a ${cases.length} dossier(s) de cancer associé(s). Suppression impossible.` });
    }
    await pool.execute('DELETE FROM patients WHERE id = ?', [id]);
    await auditLog(req.user.id, 'DELETE_PATIENT', 'patients', id, {}, req.ip);
    res.json({ message: 'Patient supprimé avec succès' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const mergePatients = async (req, res) => {
  try {
    const { sourceId, targetId } = req.body;
    // Move all cases from source to target
    await pool.execute('UPDATE cancer_cases SET patient_id = ? WHERE patient_id = ?', [targetId, sourceId]);
    await pool.execute('UPDATE rendez_vous SET patient_id = ? WHERE patient_id = ?', [targetId, sourceId]);
    // Ignore duplicates if they already exist in target
    await pool.execute('UPDATE IGNORE styles_vie_valeurs SET patient_id = ? WHERE patient_id = ?', [targetId, sourceId]);
    // Delete remaining that were ignored
    await pool.execute('DELETE FROM styles_vie_valeurs WHERE patient_id = ?', [sourceId]);

    await pool.execute('DELETE FROM patients WHERE id = ?', [sourceId]);
    await auditLog(req.user.id, 'MERGE_PATIENTS', 'patients', targetId, { sourceId, targetId }, req.ip);
    res.json({ message: 'Patients fusionnés avec succès' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const checkDuplicateRealtime = async (req, res) => {
  try {
    const { nom, prenom, date_naissance, num_carte_nationale, num_carte_chifa } = req.body;
    
    if (num_carte_nationale) {
      const [existing] = await pool.execute('SELECT * FROM patients WHERE num_carte_nationale = ? LIMIT 1', [num_carte_nationale]);
      if (existing.length) return res.json({ duplicate: existing[0], reason: 'Même carte nationale' });
    }
    if (num_carte_chifa) {
      const [existing] = await pool.execute('SELECT * FROM patients WHERE num_carte_chifa = ? LIMIT 1', [num_carte_chifa]);
      if (existing.length) return res.json({ duplicate: existing[0], reason: 'Même carte chifa' });
    }

    if (nom && prenom && date_naissance) {
      const [existing] = await pool.execute(
        'SELECT * FROM patients WHERE LOWER(TRIM(nom)) = LOWER(TRIM(?)) AND LOWER(TRIM(prenom)) = LOWER(TRIM(?)) AND date_naissance = ? LIMIT 1',
        [nom, prenom, date_naissance]
      );
      if (existing.length) return res.json({ duplicate: existing[0], reason: 'Identité similaire' });
    }

    res.json({ duplicate: null });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getPublicPatientInfo = async (req, res) => {
  try {
    const { id } = req.params;
    const [patients] = await pool.execute('SELECT id, nom, prenom FROM patients WHERE id = ?', [id]);
    if (!patients.length) return res.status(404).json({ message: 'Patient non trouvé' });
    res.json(patients[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updatePublicHabitudes = async (req, res) => {
  try {
    const { id } = req.params;
    const { fumeur, alcool, activite_sportive, alimentation, antecedents_familiaux } = req.body;
    
    // Concaténer l'alimentation dans autres_facteurs_risque si renseigné
    let queryAppendAlimentation = '';
    const params = [fumeur, alcool, activite_sportive, antecedents_familiaux];
    
    if (alimentation) {
      queryAppendAlimentation = `autres_facteurs_risque = CONCAT(IFNULL(autres_facteurs_risque, ''), ?),`;
      params.push(`\nAlimentation étudiée: ${alimentation}\n`);
    }
    params.push(id);

    await pool.execute(
      `UPDATE patients SET 
        fumeur = ?, alcool = ?, activite_sportive = ?, antecedents_familiaux = ?,
        ${queryAppendAlimentation}
        updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      params
    );

    res.json({ message: 'Habitudes enregistrées avec succès' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getAllPatients, getPatientById, createPatient, updatePatient, deletePatient, mergePatients, checkDuplicateRealtime, getPublicPatientInfo, updatePublicHabitudes };
