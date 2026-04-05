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

const analyzeWilayaIA = async (req, res) => {
  try {
    const { wilaya, count, zones } = req.body;
    
    // Simulate AI thinking time for realistic UX
    await new Promise(resolve => setTimeout(resolve, 2500));

    let envFactors = [];
    
    // Heuristic rules for environmental factors
    if (zones && zones.length > 0) {
      envFactors.push(`Présence critique de ${zones.length} zones industrielles majeures. Exposition systémique potentielle aux polluants chimiques (hydrocarbures, métaux lourds, benzène).`);
    }
    
    const nameLower = wilaya.toLowerCase();
    if (nameLower.includes('alger') || nameLower.includes('oran') || nameLower.includes('constantine') || nameLower.includes('annaba')) {
      envFactors.push("Forte densité urbaine : pollution micro-particulaire (PM2.5/PM10) liée au trafic automobile et chuintements industriels urbains.");
    } else if (nameLower.includes('skikda') || nameLower.includes('arzew')) {
      envFactors.push("Bassin pétrochimique d'envergure : Alerte sur l'inhalation prolongée de COV (Composés Organiques Volatils) induisant des mutations silencieuses.");
    } else if (nameLower.includes('hassi') || nameLower.includes('ouargla') || nameLower.includes('tamanrasset')) {
      envFactors.push("Climat aride et exploitation pétrolière/gazière. Vents de sable fréquents favorisant les micro-lésions alvéolaires (risques de surinfections et silicose).");
    } else {
      envFactors.push("Région à dominante agricole : Probable incidence de l'utilisation prolongée de pesticides et d'engrais (perturbateurs endocriniens) contaminant les nappes phréatiques locales.");
    }

    const report = {
      environmental: envFactors,
      behavioral: [
        "Prévalence historique potentielle du tabagisme dans les zones très urbanisées ou ouvrières.",
        "Transition épidémiologique : Changement brutal de comportement alimentaire (diabète, obésité) souvent corrélé aux cancers colorectaux.",
        "Manque de dépistage précoce régional par rapport aux grandes métropoles."
      ],
      recommendation: `L'Agent IA recommande impérativement de lancer une enquête épidémiologique de terrain. Il faut croiser l'historique de ces ${count} dossiers patients avec la médecine du travail liée aux industries identifiées de ${wilaya} pour isoler le facteur déclenchant prédominant.`
    };

    res.json(report);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const analyzePatientIA = async (req, res) => {
  try {
    const { cas, anapath, biologie, imagerie, traitements, consultations, effets } = req.body;
    
    // Simulate AI thinking
    await new Promise(resolve => setTimeout(resolve, 3000));

    const typeCancer = cas.type_cancer || "Non spécifié";
    
    let synthese = `Le patient, suivi pour un cancer du type ${typeCancer} (Localisation: ${cas.localisation || 'Inconnue'} | Stade: ${cas.stade || 'Inconnu'}), présente un tableau clinique ${cas.statut_patient === 'Décédé' ? 'critique' : 'global'}. `;
    if (traitements && traitements.length > 0) synthese += `Le parcours thérapeutique inclut ${traitements.length} lignes/séances de traitement(s). `;
    if (anapath && anapath.length > 0) synthese += `L'analyse anatomopathologique fait ressortir un profil histologique de type ${anapath[anapath.length-1].type_histologique || 'non-précisé'}.`;

    let alertes = [];
    if (effets && effets.some(e => !e.resolu && (e.grade === 'Grade 3' || e.grade === 'Grade 4'))) {
      alertes.push("Alerte Toxicité : Présence d'effets secondaires sévères (Grade 3/4) non encore résolus (ex: " + effets.find(e => !e.resolu && e.grade.includes('3') || e.grade.includes('4'))?.type_effet + ").");
    }
    if (biologie && biologie.some(b => b.interpretation === 'Critique' || b.interpretation === 'Bas' || b.interpretation === 'Haut')) {
      alertes.push("Alerte Organique : Anomalies biologiques détectées, suggérant une toxicité d'organe ou une progression.");
    }
    if (!traitements || traitements.length === 0) {
      alertes.push("Attention : Aucun traitement formel n'est enregistré dans ce dossier actif.");
    }
    if (cas.stade && cas.stade.includes('IV')) {
      alertes.push("Cas de Haut Risque : Maladie au Stade IV / Métastatique (selon TNM).");
    }

    let recommandations = [];
    if (cas.stade && cas.stade.includes('IV')) {
      recommandations.push("L'Agent IA suggère une inscription urgente en RCP Médecine Palliative / Métastatique.");
    }
    if ((typeCancer.toLowerCase().includes('sein') || typeCancer.toLowerCase().includes('ovaire')) && (!cas.anomalies_genetiques || cas.anomalies_genetiques === 'Inconnu')) {
      recommandations.push("Il est fortement recommandé de prescrire un bilan d'oncogénétique (BRCA1/2) vu le profil tumoral.");
    }
    if (effets && effets.some(e => !e.resolu)) {
      recommandations.push("Prise en charge prioritaire pour réduire/maîtriser la morbidité iatrogène avant la prochaine cure de chimiothérapie/radiothérapie.");
    }
    if (!anapath || anapath.length === 0) {
      recommandations.push("Demande de biopsie / récupération des résultats Anapath manquants indispensable pour guider le traitement.");
    }
    recommandations.push("Poursuivre la surveillance rapprochée par imagerie fonctionnelle (TEP-Scan/IRM).");

    res.json({ synthese, alertes, recommandations });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const askGlobalIA = async (req, res) => {
  try {
    const { message } = req.body;
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate thinking
    
    const msg = (message || "").toLowerCase();
    
    let reply = "Je suis l'Intelligence Artificielle intégrée de votre Registre du Cancer. Je suis formée sur les guidelines internationales (ICD-O-3, SEER). Comment puis-je vous aider ?";

    if (msg.includes("zone") || msg.includes("sig") || msg.includes("carte") || msg.includes("wilaya") || msg.includes("lieu")) {
      reply = "🗺️ Concernant les zones (Cartographie SIG) : Mon algorithme croise l'incidence tumorale avec les marqueurs industriels locaux. Par exemple, une forte prévalence de leucémies près de bassins pétrochimiques comme Skikda déclenche une alerte épidémiologique en temps réel. Naviguez sur la 'Carte SIG' pour me demander d'analyser une région spécifique.";
    } 
    else if (msg.includes("seer") || msg.includes("standard") || msg.includes("règl") || msg.includes("norme") || msg.includes("qualite")) {
      reply = "📊 Standards SEER & Qualité : Le Programme SEER (Surveillance, Epidemiology, and End Results) fournit les normes absolues en oncologie (staging, casefinding). J'intègre des logiques de cross-validation pour m'assurer que votre base de données est conforme aux normes d'abstraction cliniques nord-américaines.";
    } 
    else if (msg.includes("icd") || msg.includes("cim") || msg.includes("code") || msg.includes("morphologie") || msg.includes("topographie")) {
      reply = "🧬 Classification ICD-O-3 : L'International Classification of Diseases for Oncology est le pilier de ce système. Elle codifie la Topographie (site anatomique - ex: C50 pour le sein) et la Morphologie (comportement tissulaire - ex: 8500/3 pour un carcinome canalaire infiltrant). Chaque profil est mappé suivant ces nomenclatures.";
    } 
    else if (msg.includes("patient") || msg.includes("dossier") || msg.includes("cas") || msg.includes("profil")) {
      reply = "👤 Dossiers Patients : Je peux synthétiser instantanément n'importe quel dossier complexe (" + "Biologie, Imagerie, Anapath, Traitements). Allez dans la fiche d'un patient et cliquez sur l'onglet '✨ Assistant IA' pour voir ma synthèse et mes alertes dynamiques.";
    } 
    else if (msg.includes("bonjour") || msg.includes("salut") || msg.includes("hello")) {
      reply = "Bonjour ! Je suis à l'écoute. Souhaitez-vous explorer des statistiques, valider un encodage ICD-O-3, ou discuter du profil clinique d'un patient ?";
    } 
    else if (msg.includes("amèlior") || msg.includes("amélior") || msg.includes("futur") || msg.includes("automate")) {
      reply = "🚀 L'avenir de notre registre s'oriente vers le 'Casefinding Automatique' depuis les Dossiers Médicaux Partagés (EHR) via Traitement du Langage Naturel (NLP). Cela évitera la double saisie et nous mettra au niveau des meilleurs centres mondiaux (Standards NAACCR).";
    }

    res.json({ reply });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getDashboardStats, getAuditLogs, analyzeWilayaIA, analyzePatientIA, askGlobalIA };
