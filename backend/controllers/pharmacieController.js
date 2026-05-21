const { v4: uuidv4 } = require('uuid');
const { pool } = require('../config/database');

/**
 * Emit real-time update event to all users
 */
const emitPharmacyUpdate = (req) => {
  const io = req.app.get('io');
  if (io) {
    io.emit('pharmacy_update', { timestamp: new Date(), type: 'all' });
  }
};

// GET all stocks with filters
const getStocks = async (req, res) => {
  try {
    const { search, category, status, sort = 'nom_dci', order = 'ASC' } = req.query;

    let query = 'SELECT * FROM medicaments_stock WHERE 1=1';
    const params = [];

    if (search) {
      query += ' AND (nom_dci LIKE ? OR dosage LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    if (category) {
      query += ' AND categorie = ?';
      params.push(category);
    }

    const [rows] = await pool.execute(query + ` ORDER BY ${sort} ${order}`, params);

    let processed = rows.map(r => ({
      ...r,
      statut: r.stock_actuel <= r.seuil_rupture ? 'RUPTURE' : (r.stock_actuel <= r.seuil_alerte ? 'ALERTE' : 'OK')
    }));

    if (status) {
      processed = processed.filter(p => p.statut === status);
    }

    res.json(processed);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// GET Dashboard Stats
const getPharmacyStats = async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM medicaments_stock');
    const [pending] = await pool.execute("SELECT COUNT(*) as count FROM prescriptions_validations WHERE statut = 'En attente'");

    const stats = {
      total: rows.length,
      alertes: rows.filter(r => r.stock_actuel <= r.seuil_alerte && r.stock_actuel > r.seuil_rupture).length,
      ruptures: rows.filter(r => r.stock_actuel <= r.seuil_rupture).length,
      pending_validations: pending[0].count,
      by_category: {
        Chimio: rows.filter(r => r.categorie === 'Chimio').length,
        'Therapie Ciblee': rows.filter(r => r.categorie === 'Therapie Ciblee').length,
        Support: rows.filter(r => r.categorie === 'Support').length,
        Adjuvant: rows.filter(r => r.categorie === 'Adjuvant').length
      }
    };

    res.json(stats);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// POST add medication
const createMedicament = async (req, res) => {
  try {
    const id = uuidv4();
    const { nom_dci, dosage, forme, stock_actuel, seuil_alerte, seuil_rupture, categorie, prix, date_expiration } = req.body;

    const [existing] = await pool.execute('SELECT id FROM medicaments_stock WHERE nom_dci = ?', [nom_dci]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Ce médicament existe déjà dans le stock (Doublon DCI)' });
    }

    await pool.execute(
      'INSERT INTO medicaments_stock (id, nom_dci, dosage, forme, stock_actuel, seuil_alerte, seuil_rupture, categorie, prix, date_expiration) VALUES (?,?,?,?,?,?,?,?,?,?)',
      [
        id,
        nom_dci,
        dosage || null,
        forme || null,
        parseInt(stock_actuel) || 0,
        parseInt(seuil_alerte) || 10,
        parseInt(seuil_rupture) || 0,
        categorie,
        parseFloat(prix) || 0.00,
        date_expiration || null
      ]
    );

    emitPharmacyUpdate(req);
    res.status(201).json({ id, message: 'Médicament ajouté avec succès' });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// PUT update medication
const updateMedicament = async (req, res) => {
  try {
    const { id } = req.params;
    const { nom_dci, dosage, forme, stock_actuel, seuil_alerte, seuil_rupture, categorie, prix, date_expiration } = req.body;

    await pool.execute(
      'UPDATE medicaments_stock SET nom_dci=?, dosage=?, forme=?, stock_actuel=?, seuil_alerte=?, seuil_rupture=?, categorie=?, prix=?, date_expiration=? WHERE id=?',
      [
        nom_dci,
        dosage,
        forme,
        parseInt(stock_actuel),
        parseInt(seuil_alerte),
        parseInt(seuil_rupture),
        categorie,
        parseFloat(prix) || 0.00,
        date_expiration || null,
        id
      ]
    );

    emitPharmacyUpdate(req);
    res.json({ message: 'Médicament mis à jour' });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// DELETE medication
const deleteMedicament = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.execute('DELETE FROM medicaments_stock WHERE id = ?', [id]);

    emitPharmacyUpdate(req);
    res.json({ message: 'Médicament supprimé du stock' });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// GET alternatives
const getAlternatives = async (req, res) => {
  try {
    const { drugId } = req.params;
    const [drug] = await pool.execute('SELECT nom_dci, categorie FROM medicaments_stock WHERE id = ?', [drugId]);
    if (drug.length === 0) return res.status(404).json({ message: 'Non trouvé' });

    const [fixed] = await pool.execute('SELECT * FROM alternatives_medicaments WHERE drug_id = ?', [drugId]);

    if (fixed.length === 0) {
      return res.json([
        {
          id: 'ia-suggestion-1',
          alternative_nom: `Substitution générique pour ${drug[0].nom_dci}`,
          justification: `Basé sur la classe ${drug[0].categorie}, molécule biologiquement équivalente.`,
          is_ia: true
        }
      ]);
    }
    res.json(fixed);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// GET pending prescriptions
const getPendingValidations = async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT pv.*, t.protocole, t.medicaments, p.nom, p.prenom, cc.type_cancer, cc.stade
      FROM prescriptions_validations pv
      JOIN traitements t ON pv.traitement_id = t.id
      JOIN cancer_cases cc ON t.case_id = cc.id
      JOIN patients p ON cc.patient_id = p.id
      WHERE pv.statut = 'En attente'
      ORDER BY pv.created_at DESC
    `);

    const [stocks] = await pool.execute('SELECT nom_dci, stock_actuel FROM medicaments_stock');
    const enriched = rows.map(v => {
      const warnings = v.medicaments.split(',').map(m => m.trim().toLowerCase()).filter(m => {
        const stock = stocks.find(s => m.includes(s.nom_dci.toLowerCase()));
        return !stock || stock.stock_actuel <= 0;
      }).map(m => `Pénurie: ${m}`);
      return { ...v, stock_warnings: warnings };
    });

    res.json(enriched);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

const validatePrescription = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const { id } = req.params;
    const { statut, commentaire, dose_ajustee } = req.body;

    await conn.execute(
      'UPDATE prescriptions_validations SET statut=?, commentaire=?, dose_ajustee=?, pharmacien_id=? WHERE id=?',
      [statut, commentaire, dose_ajustee, req.user.id, id]
    );

    if (statut === 'Validé') {
      const [rows] = await conn.execute(`
        SELECT t.medicaments 
        FROM prescriptions_validations pv 
        JOIN traitements t ON pv.traitement_id = t.id 
        WHERE pv.id = ?
      `, [id]);

      if (rows.length > 0) {
        const [stocks] = await conn.execute('SELECT id, nom_dci FROM medicaments_stock');
        for (const s of stocks) {
          if (rows[0].medicaments.toLowerCase().includes(s.nom_dci.toLowerCase())) {
            await conn.execute('UPDATE medicaments_stock SET stock_actuel = GREATEST(0, stock_actuel - 1) WHERE id = ?', [s.id]);
          }
        }
      }
    }

    await conn.commit();
    emitPharmacyUpdate(req);
    res.json({ message: 'Validé avec succès' });
  } catch (e) {
    await conn.rollback();
    res.status(500).json({ message: e.message });
  } finally {
    conn.release();
  }
};

const getExpiryAlerts = async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT * FROM medicaments_stock
      WHERE date_expiration IS NOT NULL
      AND date_expiration <= DATE_ADD(CURDATE(), INTERVAL 30 DAY)
      ORDER BY date_expiration ASC
    `);
    res.json(rows);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

const getLowStockAlerts = async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT * FROM medicaments_stock
      WHERE stock_actuel <= seuil_alerte
      ORDER BY stock_actuel ASC
    `);
    res.json(rows);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

const getAdvancedStats = async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM medicaments_stock');
    const totalValue = rows.reduce((sum, r) => sum + (r.stock_actuel * (r.prix || 0)), 0);
    const expired = rows.filter(r => r.date_expiration && new Date(r.date_expiration) < new Date()).length;
    const expiringSoon = rows.filter(r => r.date_expiration && new Date(r.date_expiration) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)).length;

    res.json({
      totalMedicaments: rows.length,
      totalStockValue: totalValue,
      expiredCount: expired,
      expiringSoon
    });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

const getMedicamentById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.execute('SELECT * FROM medicaments_stock WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Introuvable' });
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

module.exports = {
  getStocks,
  getPharmacyStats,
  createMedicament,
  updateMedicament,
  deleteMedicament,
  getAlternatives,
  getPendingValidations,
  validatePrescription,
  getExpiryAlerts,
  getLowStockAlerts,
  getAdvancedStats,
  getMedicamentById
};