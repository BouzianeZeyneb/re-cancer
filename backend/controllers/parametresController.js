const pool = require('../config/database').pool;
const { v4: uuidv4 } = require('uuid');

// Récupérer les paramètres par catégorie
exports.getParametres = async (req, res) => {
  const { categorie } = req.query;
  try {
    let sql = 'SELECT * FROM parametres_globaux WHERE 1=1';
    const params = [];

    if (categorie) {
      sql += ' AND categorie = ?';
      params.push(categorie);
    }

    sql += ' ORDER BY valeur ASC';
    const [rows] = await pool.query(sql, params);
    
    res.json(rows);
  } catch (error) {
    console.error('Erreur getParametres:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des paramètres' });
  }
};

// Ajouter un paramètre
exports.createParametre = async (req, res) => {
  const { categorie, valeur, code, actif, obligatoire } = req.body;
  if (!categorie || !valeur) {
    return res.status(400).json({ error: 'La catégorie et la valeur sont obligatoires' });
  }

  try {
    const id = uuidv4();
    const isActive = actif !== undefined ? actif : true;
    const isObligatoire = obligatoire !== undefined ? obligatoire : false;
    
    const [result] = await pool.query(
      'INSERT INTO parametres_globaux (id, categorie, valeur, code, actif, obligatoire) VALUES (?, ?, ?, ?, ?, ?)',
      [id, categorie, valeur, code || null, isActive, isObligatoire]
    );

    res.status(201).json({ 
      id, categorie, valeur, code, actif: isActive, obligatoire: isObligatoire, message: 'Paramètre créé avec succès' 
    });
  } catch (error) {
    console.error('Erreur createParametre:', error);
    res.status(500).json({ error: 'Erreur lors de la création du paramètre' });
  }
};

// Modifier un paramètre
exports.updateParametre = async (req, res) => {
  const { id } = req.params;
  const { categorie, valeur, code, actif, obligatoire } = req.body;

  try {
    const [result] = await pool.query(
      'UPDATE parametres_globaux SET categorie = ?, valeur = ?, code = ?, actif = ?, obligatoire = ? WHERE id = ?',
      [categorie, valeur, code || null, actif, obligatoire || false, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Paramètre non trouvé' });
    }

    res.json({ id, categorie, valeur, code, actif, obligatoire: obligatoire || false, message: 'Paramètre mis à jour avec succès' });
  } catch (error) {
    console.error('Erreur updateParametre:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour du paramètre' });
  }
};

// Supprimer un paramètre
exports.deleteParametre = async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await pool.query('DELETE FROM parametres_globaux WHERE id = ?', [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Paramètre non trouvé' });
    }

    res.json({ message: 'Paramètre supprimé avec succès' });
  } catch (error) {
    console.error('Erreur deleteParametre:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression du paramètre' });
  }
};
