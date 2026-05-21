const { pool } = require('../config/database');

const getDashboardStats = async (req, res) => {
  try {
    const { year, month, type_cancer, sexe, age_min, age_max } = req.query;
    let filterCondition = '';
    const params = [];
    
    if (year) {
      filterCondition += ' AND YEAR(cc.date_diagnostic) = ?';
      params.push(year);
    }
    if (month) {
      filterCondition += ' AND MONTH(cc.date_diagnostic) = ?';
      params.push(month);
    }
    if (type_cancer) {
      filterCondition += ' AND cc.type_cancer = ?';
      params.push(type_cancer);
    }
    if (sexe) {
      filterCondition += ' AND p.sexe = ?';
      params.push(sexe);
    }
    if (age_min !== undefined && age_min !== '') {
      filterCondition += ' AND TIMESTAMPDIFF(YEAR, p.date_naissance, CURDATE()) >= ?';
      params.push(age_min);
    }
    if (age_max !== undefined && age_max !== '') {
      filterCondition += ' AND TIMESTAMPDIFF(YEAR, p.date_naissance, CURDATE()) <= ?';
      params.push(age_max);
    }

    const whereClauseTemplate = filterCondition ? filterCondition : '';

    const [totalPatients] = await pool.execute(`
      SELECT COUNT(DISTINCT p.id) as total 
      FROM patients p 
      LEFT JOIN cancer_cases cc ON p.id = cc.patient_id 
      WHERE 1=1 ${whereClauseTemplate}
    `, params);
    
<<<<<<< HEAD
    const [totalCases] = await pool.execute(`SELECT COUNT(*) as total FROM cancer_cases WHERE 1=1 ${whereClauseTemplate}`, params);
    const [enTraitement] = await pool.execute(`SELECT COUNT(*) as total FROM cancer_cases WHERE statut_patient = 'En traitement' ${whereClauseTemplate}`, params);
    const [nouveauxMois] = await pool.execute(`SELECT COUNT(*) as total FROM cancer_cases WHERE MONTH(created_at) = MONTH(CURRENT_DATE) AND YEAR(created_at) = YEAR(CURRENT_DATE)`);
    const [stadeIV] = await pool.execute(`SELECT COUNT(*) as total FROM cancer_cases WHERE stade = 'Stade IV' ${whereClauseTemplate}`, params);
    
    // Admin only stats (always fetched, filtered on frontend)
    const [totalLabos] = await pool.execute("SELECT COUNT(*) as total FROM users WHERE role = 'laboratoire' AND actif = true");
    const [totalAnapath] = await pool.execute("SELECT COUNT(*) as total FROM users WHERE role = 'anapath' AND actif = true");
    const [totalMedecins] = await pool.execute("SELECT COUNT(*) as total FROM users WHERE role = 'medecin' AND actif = true");
=======
    const [totalCases] = await pool.execute(`
      SELECT COUNT(*) as total 
      FROM cancer_cases cc 
      JOIN patients p ON cc.patient_id = p.id 
      WHERE 1=1 ${whereClauseTemplate}
    `, params);

    const [enTraitement] = await pool.execute(`
      SELECT COUNT(*) as total 
      FROM cancer_cases cc 
      JOIN patients p ON cc.patient_id = p.id 
      WHERE cc.statut_patient = 'En traitement' ${whereClauseTemplate}
    `, params);

    const [nouveauxMois] = await pool.execute(`
      SELECT COUNT(*) as total 
      FROM cancer_cases cc 
      JOIN patients p ON cc.patient_id = p.id 
      WHERE MONTH(cc.created_at) = MONTH(CURRENT_DATE) 
      AND YEAR(cc.created_at) = YEAR(CURRENT_DATE) ${whereClauseTemplate}
    `, params);

    const [stadeIV] = await pool.execute(`
      SELECT COUNT(*) as total 
      FROM cancer_cases cc 
      JOIN patients p ON cc.patient_id = p.id 
      WHERE cc.stade = 'Stade IV' ${whereClauseTemplate}
    `, params);
>>>>>>> b9c7b1112611099ae653e5cb7addcc4f75576878

    const [parType] = await pool.execute(`
      SELECT cc.type_cancer, COUNT(*) as count 
      FROM cancer_cases cc 
      JOIN patients p ON cc.patient_id = p.id 
      WHERE 1=1 ${whereClauseTemplate} 
      GROUP BY cc.type_cancer
    `, params);

    const [parSexe] = await pool.execute(`
      SELECT p.sexe, COUNT(*) as count 
      FROM patients p 
      JOIN cancer_cases cc ON p.id = cc.patient_id 
      WHERE 1=1 ${whereClauseTemplate}
      GROUP BY p.sexe
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
      WHERE 1=1 ${whereClauseTemplate}
      GROUP BY name
      ORDER BY FIELD(name, '0-14', '15-29', '30-44', '45-59', '60-74', '75+')
    `, params);

    const [parWilaya] = await pool.execute(`
      SELECT p.wilaya as name, COUNT(*) as value 
      FROM patients p 
      JOIN cancer_cases cc ON p.id = cc.patient_id 
      WHERE 1=1 ${whereClauseTemplate}
      GROUP BY p.wilaya ORDER BY value DESC LIMIT 10
    `, params);

    const [parTopographie] = await pool.execute(`
      SELECT cc.topographie_icdo3 as name, COUNT(*) as value 
      FROM cancer_cases cc 
      JOIN patients p ON cc.patient_id = p.id 
      WHERE cc.topographie_icdo3 IS NOT NULL ${whereClauseTemplate}
      GROUP BY cc.topographie_icdo3 ORDER BY value DESC LIMIT 8
    `, params);

    const [parMorphologie] = await pool.execute(`
      SELECT cc.morphologie_icdo3 as name, COUNT(*) as value 
      FROM cancer_cases cc 
      JOIN patients p ON cc.patient_id = p.id 
      WHERE cc.morphologie_icdo3 IS NOT NULL ${whereClauseTemplate}
      GROUP BY cc.morphologie_icdo3 ORDER BY value DESC LIMIT 8
    `, params);

    const [parStade] = await pool.execute(`
      SELECT cc.stade as name, COUNT(*) as value 
      FROM cancer_cases cc 
      JOIN patients p ON cc.patient_id = p.id 
      WHERE cc.stade IS NOT NULL ${whereClauseTemplate}
      GROUP BY cc.stade ORDER BY value DESC
    `, params);

    const [parGrade] = await pool.execute(`
      SELECT cc.grade_histologique as name, COUNT(*) as value 
      FROM cancer_cases cc 
      JOIN patients p ON cc.patient_id = p.id 
      WHERE cc.grade_histologique IS NOT NULL ${whereClauseTemplate}
      GROUP BY cc.grade_histologique ORDER BY value DESC
    `, params);

    const [parTabac] = await pool.execute(`
      SELECT cc.sous_type as name, 
             SUM(CASE WHEN p.fumeur = 1 THEN 1 ELSE 0 END) as value
      FROM cancer_cases cc
      JOIN patients p ON cc.patient_id = p.id
      WHERE 1=1 ${whereClauseTemplate}
      GROUP BY cc.sous_type ORDER BY value DESC LIMIT 5
    `, params);

    const [recent] = await pool.execute(`
      SELECT p.id as patientId, cc.id as caseId, p.nom, p.prenom, p.sexe, TIMESTAMPDIFF(YEAR, p.date_naissance, CURDATE()) as age, 
             cc.sous_type as diagnostic, cc.stade, cc.statut_patient, cc.created_at
      FROM patients p
      JOIN cancer_cases cc ON p.id = cc.patient_id
      ORDER BY cc.created_at DESC
      LIMIT 10
    `);

    // Top 3 last added patients
    const [recentPatients] = await pool.execute(`
      SELECT id, nom, prenom, created_at FROM patients ORDER BY created_at DESC LIMIT 3
    `);

    res.json({ 
       totaux: { 
         patients: totalPatients[0].total, 
         cas: totalCases[0].total, 
         suivi: enTraitement[0].total,
         enTraitement: enTraitement[0].total,
         nouveauxMois: nouveauxMois[0].total,
         stadeIV: stadeIV[0].total,
         labos: totalLabos[0].total,
         anapaths: totalAnapath[0].total,
         medecins: totalMedecins[0].total
       },
       parType,
       parSexe,
       parAge,
       parWilaya,
       recentDossiers: recent,
       recentPatients: recentPatients,
       parTopographie,
       parMorphologie,
       parStade,
       parGrade,
       parTabac
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getLocalizedStats = async (req, res) => {
  try {
    const { wilaya, type_cancer, topographie_icdo3, morphologie_icdo3 } = req.query;
    let filterCondition = '';
    const params = [];

    if (wilaya) { filterCondition += ' AND p.wilaya = ?'; params.push(wilaya); }
    if (type_cancer) { filterCondition += ' AND cc.type_cancer = ?'; params.push(type_cancer); }
    if (topographie_icdo3) { filterCondition += ' AND cc.topographie_icdo3 = ?'; params.push(topographie_icdo3); }
    if (morphologie_icdo3) { filterCondition += ' AND cc.morphologie_icdo3 = ?'; params.push(morphologie_icdo3); }

    const whereClause = filterCondition;

    // Totals locally
    const [totaux] = await pool.execute(`
      SELECT COUNT(*) as total,
             SUM(CASE WHEN cc.stade = 'Stade IV' THEN 1 ELSE 0 END) as stadeIV
      FROM cancer_cases cc
      JOIN patients p ON cc.patient_id = p.id
      WHERE 1=1 ${whereClause}
    `, params);

    const [parStade] = await pool.execute(`
      SELECT cc.stade as name, COUNT(*) as value 
      FROM cancer_cases cc
      JOIN patients p ON cc.patient_id = p.id
      WHERE 1=1 ${whereClause} AND cc.stade IS NOT NULL
      GROUP BY cc.stade ORDER BY value DESC
    `, params);

    const [parSexe] = await pool.execute(`
      SELECT p.sexe, COUNT(*) as count 
      FROM patients p 
      JOIN cancer_cases cc ON p.id = cc.patient_id 
      WHERE 1=1 ${whereClause}
      GROUP BY p.sexe
    `, params);

    const [parAge] = await pool.execute(`
      SELECT 
        CASE 
          WHEN TIMESTAMPDIFF(YEAR, p.date_naissance, CURDATE()) < 30 THEN '0-29'
          WHEN TIMESTAMPDIFF(YEAR, p.date_naissance, CURDATE()) < 50 THEN '30-49'
          WHEN TIMESTAMPDIFF(YEAR, p.date_naissance, CURDATE()) < 70 THEN '50-69'
          ELSE '70+'
        END as name,
        COUNT(*) as value
      FROM patients p
      JOIN cancer_cases cc ON p.id = cc.patient_id
      WHERE 1=1 ${whereClause}
      GROUP BY name
    `, params);

    const [parTopographie] = await pool.execute(`
      SELECT topographie_icdo3 as name, COUNT(*) as value 
      FROM cancer_cases cc
      JOIN patients p ON cc.patient_id = p.id
      WHERE 1=1 ${whereClause} AND cc.topographie_icdo3 IS NOT NULL
      GROUP BY cc.topographie_icdo3 ORDER BY value DESC LIMIT 10
    `, params);

    const [parMorphologie] = await pool.execute(`
      SELECT morphologie_icdo3 as name, COUNT(*) as value 
      FROM cancer_cases cc
      JOIN patients p ON cc.patient_id = p.id
      WHERE 1=1 ${whereClause} AND cc.morphologie_icdo3 IS NOT NULL
      GROUP BY cc.morphologie_icdo3 ORDER BY value DESC LIMIT 10
    `, params);

    res.json({
      total: totaux[0].total,
      stadeIV: totaux[0].stadeIV,
      parStade,
      parSexe: parSexe.map(s => ({ name: s.sexe === 'M' ? 'Hommes' : 'Femmes', value: s.count })),
      parAge,
      parTopographie,
      parMorphologie
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

const getAuditLogs = async (req, res) => {
  try {
    const [logs] = await pool.execute(`
      SELECT 
        al.*, 
        u.nom as user_nom, 
        u.prenom as user_prenom, 
        u.role as user_role 
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      ORDER BY al.created_at DESC
      LIMIT 100
    `);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
const analyzeWilayaIA = async (req, res) => { res.json({}); };
const analyzePatientIA = async (req, res) => { res.json({}); };
const askGlobalIA = async (req, res) => {
  try {
    const { message, context } = req.body;
    if (!message) return res.status(400).json({ message: 'Message requis' });

    const msg = message.toLowerCase();
    const ctx = context || '';

    let reply = '';

    // ── Résumer dossier ──
    if (msg.includes('résumer') || msg.includes('resumer') || msg.includes('résumé') || msg.includes('resumé') || msg.includes('resume') || msg.includes('dossier') || msg.includes('résume')) {
      const patientInfo = ctx.match(/Patient:\s*([^,]+),\s*(\d+) ans,\s*(\w+)/) || [];
      const cancerInfo = ctx.match(/Cancer:\s*([^,]+),\s*Stade:\s*([^.]+)/) || [];
      const antecedents = ctx.match(/Antécédents:\s*([^.]+)/) || [];
      const traitements = ctx.match(/Traitements actifs:\s*([^.]+)/) || [];

      reply = `📋 **Résumé du dossier oncologique**

**Patient :** ${patientInfo[1] || 'Non précisé'}, ${patientInfo[2] || '?'} ans, ${patientInfo[3] || ''}
**Pathologie :** ${cancerInfo[1] || 'Non renseignée'} — ${cancerInfo[2] || 'Stade non précisé'}
**Antécédents :** ${antecedents[1] || 'Aucun renseigné'}
**Traitement en cours :** ${traitements[1] || 'Aucun traitement actif documenté'}

Ce dossier nécessite un suivi régulier. Je recommande de vérifier les derniers marqueurs biologiques et d'actualiser le plan thérapeutique lors de la prochaine RCP.`;

    // ── Protocole ──
    } else if (msg.includes('protocole') || msg.includes('traitement') || msg.includes('thérapeutique') || msg.includes('therapeutique')) {
      const cancerInfo = ctx.match(/Cancer:\s*([^,]+)/) || [];
      const stadeInfo = ctx.match(/Stade:\s*([^.]+)/) || [];
      reply = `💊 **Recommandations thérapeutiques**

D'après les données du dossier (${cancerInfo[1] || 'cancer non précisé'}, ${stadeInfo[1] || 'stade inconnu'}), voici les orientations générales selon les recommandations NCCN/ESMO :

1. **Évaluation multidisciplinaire (RCP)** — indispensable avant toute décision thérapeutique
2. **Bilan d'extension** — vérifier l'imagerie récente (moins de 3 mois)
3. **Statut moléculaire** — s'assurer que le profil HER2/ER/PR/EGFR/KRAS est documenté
4. **Options selon stade** :
   - Stade I-II : traitement à visée curative (chirurgie ± chimiothérapie adjuvante)
   - Stade III : chimioradiothérapie ou chirurgie +/- néoadjuvant
   - Stade IV : traitement palliatif adapté au profil moléculaire

⚠️ Cette recommandation est indicative. La décision finale appartient à l'équipe médicale.`;

    // ── Biologie ──
    } else if (msg.includes('biologie') || msg.includes('analyse') || msg.includes('résultat') || msg.includes('résultats') || msg.includes('labo')) {
      reply = `🧪 **Analyse des résultats biologiques**

Pour une interprétation complète, voici les paramètres clés à surveiller en oncologie :

• **NFS** — Leucocytes, Hémoglobine, Plaquettes (toxicité hématologique sous traitement)
• **Marqueurs tumoraux** — CA 15-3 (sein), ACE (colon), PSA (prostate), AFP (foie)
• **Bilan hépatique** — ASAT, ALAT, Bilirubine (hépatotoxicité médicamenteuse)
• **Fonction rénale** — Créatinine, Clairance (nécessaire avant Cisplatine, EGFR)
• **Ionogramme** — Sodium, Potassium, Magnésium

Consultez l'onglet **Biologie** pour visualiser l'évolution des paramètres dans le temps. Une dégradation progressive d'un marqueur tumoral est un signal d'alerte à discuter en RCP.`;

    // ── Options thérapeutiques ──
    } else if (msg.includes('option') || msg.includes('alternative') || msg.includes('immunothérapie') || msg.includes('chimiothérapie') || msg.includes('chirurgie')) {
      reply = `🔬 **Options thérapeutiques disponibles**

Selon le profil du patient et les données actuelles, les options suivantes méritent discussion :

**1. Chimiothérapie conventionnelle**
- Indiquée selon stade, état général (score ECOG), et tolérance prévisible
- Protocoles courants : FOLFOX, AC-T, Carbo-Pémétrexed, GnC

**2. Thérapies ciblées**
- EGFR muté → Osimertinib, Erlotinib
- HER2+ → Trastuzumab + Pertuzumab
- BRCA1/2 muté → Olaparib (PARP inhibiteur)

**3. Immunothérapie**
- PD-L1 > 50% → Pembrolizumab en monothérapie
- MSI-H → Immunothérapie fortement recommandée

**4. Essais cliniques**
- Vérifier l'éligibilité aux essais ESMO ou locaux

La décision finale sera prise en RCP pluridisciplinaire.`;

    // ── Réponse générique ──
    } else {
      const [patientRows] = await pool.execute(`
        SELECT COUNT(*) as total FROM cancer_cases
      `).catch(() => [[{ total: 0 }]]);

      reply = `🤖 **Assistant IA OncoTrack**

Je suis l'assistant IA spécialisé en oncologie. ${ctx ? `Je dispose du contexte suivant : "${ctx.slice(0, 150)}..."` : ''}

Voici ce que je peux faire pour vous :
• **Résumer** le dossier patient
• **Proposer** des protocoles de traitement adaptés
• **Analyser** les résultats biologiques et en expliquer la signification
• **Suggérer** des options thérapeutiques selon le profil moléculaire
• **Répondre** à toute question clinique en oncologie

Posez-moi une question spécifique pour commencer. Exemple : *"Quelles sont les options pour un cancer du sein HER2+ stade II ?"*`;
    }

    res.json({ reply });
  } catch (error) {
    res.status(500).json({ reply: `❌ Erreur serveur: ${error.message}` });
  }
};


module.exports = { 
  getDashboardStats, 
  getAuditLogs, 
  analyzeWilayaIA, 
  analyzePatientIA, 
  askGlobalIA,
  getRawStatsData,
  getLocalizedStats
};
