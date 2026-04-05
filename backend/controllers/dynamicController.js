const { v4: uuidv4 } = require('uuid');
const { pool } = require('../config/database');

// ===== CHAMPS DYNAMIQUES UNIFIES =====
const getChampsDynamiques = async (req, res) => {
  try {
    const { entite } = req.query;
    let query = 'SELECT * FROM champs_dynamiques WHERE actif = true';
    let params = [];
    if (entite) {
      query += ' AND entite = ?';
      params.push(entite);
    }
    query += ' ORDER BY entite, nom';
    const [rows] = await pool.execute(query, params);
    res.json(rows);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

const createChampDynamique = async (req, res) => {
  try {
    const id = uuidv4();
    const { entite, nom, type_champ, options_liste, obligatoire } = req.body;
    await pool.execute(
      'INSERT INTO champs_dynamiques (id, entite, nom, type_champ, options_liste, obligatoire) VALUES (?,?,?,?,?,?)',
      [id, entite, nom, type_champ || 'texte', options_liste || null, obligatoire || false]
    );
    res.status(201).json({ message: 'Champ dynamique créé', id });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

const updateChampDynamique = async (req, res) => {
  try {
    const { id } = req.params;
    const { entite, nom, type_champ, options_liste, obligatoire, actif } = req.body;
    await pool.execute(
      'UPDATE champs_dynamiques SET entite=?, nom=?, type_champ=?, options_liste=?, obligatoire=?, actif=? WHERE id=?',
      [entite, nom, type_champ, options_liste || null, obligatoire || false, actif !== undefined ? actif : true, id]
    );
    res.json({ message: 'Champ dynamique modifié' });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

const deleteChampDynamique = async (req, res) => {
  try {
    await pool.execute('UPDATE champs_dynamiques SET actif = false WHERE id = ?', [req.params.id]);
    res.json({ message: 'Champ dynamique supprimé' });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// Values per record (patient or cancer case)
const posValeursDynamiques = async (req, res) => {
  try {
    res.status(400).json({ message: 'Please use GET endpoint with param recordId instead' });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

const getValeursDynamiques = async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT vd.*, cd.entite, cd.nom, cd.type_champ, cd.options_liste
      FROM valeurs_dynamiques vd
      JOIN champs_dynamiques cd ON vd.champ_id = cd.id
      WHERE vd.record_id = ?
    `, [req.params.recordId]);
    res.json(rows);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

const saveValeursDynamiques = async (req, res) => {
  try {
    const { record_id, valeurs } = req.body;
    // valeurs = [{ champ_id, valeur }]
    for (const v of valeurs) {
      const [existing] = await pool.execute(
        'SELECT id FROM valeurs_dynamiques WHERE record_id = ? AND champ_id = ?',
        [record_id, v.champ_id]
      );
      if (existing.length > 0) {
        await pool.execute('UPDATE valeurs_dynamiques SET valeur = ? WHERE record_id = ? AND champ_id = ?',
          [v.valeur, record_id, v.champ_id]);
      } else {
        await pool.execute('INSERT INTO valeurs_dynamiques (id, record_id, champ_id, valeur) VALUES (?,?,?,?)',
          [uuidv4(), record_id, v.champ_id, v.valeur]);
      }
    }
    res.json({ message: 'Valeurs dynamiques sauvegardées' });
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
  getChampsDynamiques, createChampDynamique, updateChampDynamique, deleteChampDynamique,
  getValeursDynamiques, saveValeursDynamiques,
  getParametresGlobaux, createParametreGlobal, updateParametreGlobal, deleteParametreGlobal,
  detectDoublons
};
