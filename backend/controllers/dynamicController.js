const { v4: uuidv4 } = require('uuid');
const { pool } = require('../config/database');

// ===== DESCRIPTEURS CANCER =====
const getDescripteurs = async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM descripteurs_cancer WHERE actif = true ORDER BY nom');
    res.json(rows);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

const createDescripteur = async (req, res) => {
  try {
    const id = uuidv4();
    const { nom, type_champ, options_liste, obligatoire } = req.body;
    await pool.execute(
      'INSERT INTO descripteurs_cancer (id, nom, type_champ, options_liste, obligatoire) VALUES (?,?,?,?,?)',
      [id, nom, type_champ || 'texte', options_liste || null, obligatoire || false]
    );
    res.status(201).json({ message: 'Descripteur créé', id });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

const updateDescripteur = async (req, res) => {
  try {
    const { id } = req.params;
    const { nom, type_champ, options_liste, obligatoire, actif } = req.body;
    await pool.execute(
      'UPDATE descripteurs_cancer SET nom=?, type_champ=?, options_liste=?, obligatoire=?, actif=? WHERE id=?',
      [nom, type_champ, options_liste || null, obligatoire || false, actif !== undefined ? actif : true, id]
    );
    res.json({ message: 'Descripteur modifié' });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

const deleteDescripteur = async (req, res) => {
  try {
    await pool.execute('UPDATE descripteurs_cancer SET actif = false WHERE id = ?', [req.params.id]);
    res.json({ message: 'Descripteur supprimé' });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// Values per case
const getValeursDescripteurs = async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT vd.*, dc.nom, dc.type_champ, dc.options_liste
      FROM valeurs_descripteurs vd
      JOIN descripteurs_cancer dc ON vd.descripteur_id = dc.id
      WHERE vd.case_id = ?
    `, [req.params.caseId]);
    res.json(rows);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

const saveValeursDescripteurs = async (req, res) => {
  try {
    const { case_id, valeurs } = req.body;
    // valeurs = [{ descripteur_id, valeur }]
    for (const v of valeurs) {
      const [existing] = await pool.execute(
        'SELECT id FROM valeurs_descripteurs WHERE case_id = ? AND descripteur_id = ?',
        [case_id, v.descripteur_id]
      );
      if (existing.length) {
        await pool.execute('UPDATE valeurs_descripteurs SET valeur = ? WHERE case_id = ? AND descripteur_id = ?',
          [v.valeur, case_id, v.descripteur_id]);
      } else {
        await pool.execute('INSERT INTO valeurs_descripteurs (id, case_id, descripteur_id, valeur) VALUES (?,?,?,?)',
          [uuidv4(), case_id, v.descripteur_id, v.valeur]);
      }
    }
    res.json({ message: 'Valeurs sauvegardées' });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// ===== STYLES DE VIE DYNAMIQUES =====
const getStylesVieTypes = async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM styles_vie_types WHERE actif = true ORDER BY nom');
    res.json(rows);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

const createStyleVieType = async (req, res) => {
  try {
    const id = uuidv4();
    const { nom, type_champ } = req.body;
    await pool.execute('INSERT INTO styles_vie_types (id, nom, type_champ) VALUES (?,?,?)',
      [id, nom, type_champ || 'booleen']);
    res.status(201).json({ message: 'Style de vie créé', id });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

const deleteStyleVieType = async (req, res) => {
  try {
    await pool.execute('UPDATE styles_vie_types SET actif = false WHERE id = ?', [req.params.id]);
    res.json({ message: 'Style de vie supprimé' });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

const getStylesViePatient = async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT svv.*, svt.nom, svt.type_champ
      FROM styles_vie_valeurs svv
      JOIN styles_vie_types svt ON svv.style_vie_id = svt.id
      WHERE svv.patient_id = ?
    `, [req.params.patientId]);
    res.json(rows);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

const saveStylesViePatient = async (req, res) => {
  try {
    const { patient_id, valeurs } = req.body;
    for (const v of valeurs) {
      const [existing] = await pool.execute(
        'SELECT id FROM styles_vie_valeurs WHERE patient_id = ? AND style_vie_id = ?',
        [patient_id, v.style_vie_id]
      );
      if (existing.length) {
        await pool.execute('UPDATE styles_vie_valeurs SET valeur = ? WHERE patient_id = ? AND style_vie_id = ?',
          [v.valeur, patient_id, v.style_vie_id]);
      } else {
        await pool.execute('INSERT INTO styles_vie_valeurs (id, patient_id, style_vie_id, valeur) VALUES (?,?,?,?)',
          [uuidv4(), patient_id, v.style_vie_id, v.valeur]);
      }
    }
    res.json({ message: 'Styles de vie sauvegardés' });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// ===== PARAMETRES GLOBAUX =====
const getParametresGlobaux = async (req, res) => {
  try {
    const { categorie } = req.query;
    let query = 'SELECT * FROM parametres_globaux WHERE actif = true';
    let params = [];
    if (categorie) {
      query += ' AND categorie = ?';
      params.push(categorie);
    }
    query += ' ORDER BY categorie, valeur';
    const [rows] = await pool.execute(query, params);
    res.json(rows);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

const createParametreGlobal = async (req, res) => {
  try {
    const id = uuidv4();
    const { categorie, valeur, code } = req.body;
    await pool.execute(
      'INSERT INTO parametres_globaux (id, categorie, valeur, code) VALUES (?,?,?,?)',
      [id, categorie, valeur, code || null]
    );
    res.status(201).json({ message: 'Paramètre créé', id });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

const updateParametreGlobal = async (req, res) => {
  try {
    const { id } = req.params;
    const { valeur, code, actif } = req.body;
    await pool.execute(
      'UPDATE parametres_globaux SET valeur=?, code=?, actif=? WHERE id=?',
      [valeur, code || null, actif !== undefined ? actif : true, id]
    );
    res.json({ message: 'Paramètre modifié' });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

const deleteParametreGlobal = async (req, res) => {
  try {
    await pool.execute('UPDATE parametres_globaux SET actif = false WHERE id = ?', [req.params.id]);
    res.json({ message: 'Paramètre supprimé' });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// ===== DOUBLONS =====
const detectDoublons = async (req, res) => {
  try {
    const [doublons] = await pool.execute(`
      SELECT p1.id as id1, p1.nom as nom1, p1.prenom as prenom1, p1.date_naissance as dob1,
             p2.id as id2, p2.nom as nom2, p2.prenom as prenom2, p2.date_naissance as dob2,
             p1.num_carte_nationale as cn1, p2.num_carte_nationale as cn2
      FROM patients p1
      JOIN patients p2 ON p1.id != p2.id AND p1.id < p2.id
      WHERE (
        (LOWER(TRIM(p1.nom)) = LOWER(TRIM(p2.nom)) AND LOWER(TRIM(p1.prenom)) = LOWER(TRIM(p2.prenom)))
        OR (p1.num_carte_nationale IS NOT NULL AND p1.num_carte_nationale != '' AND p1.num_carte_nationale = p2.num_carte_nationale)
        OR (LOWER(TRIM(p1.nom)) = LOWER(TRIM(p2.nom)) AND LOWER(TRIM(p1.prenom)) = LOWER(TRIM(p2.prenom)) AND p1.date_naissance = p2.date_naissance)
      )
      LIMIT 50
    `);
    res.json(doublons);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

module.exports = {
  getDescripteurs, createDescripteur, updateDescripteur, deleteDescripteur,
  getValeursDescripteurs, saveValeursDescripteurs,
  getStylesVieTypes, createStyleVieType, deleteStyleVieType,
  getStylesViePatient, saveStylesViePatient,
  getParametresGlobaux, createParametreGlobal, updateParametreGlobal, deleteParametreGlobal,
  detectDoublons
};
