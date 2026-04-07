const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'cancer_registry',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const initDatabase = async () => {
  const conn = await pool.getConnection();
  try {
    // Users table
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(36) PRIMARY KEY,
        nom VARCHAR(100) NOT NULL,
        prenom VARCHAR(100) NOT NULL,
        email VARCHAR(150) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role ENUM('admin','medecin','laboratoire','anapath') NOT NULL DEFAULT 'medecin',
        actif BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Patients table
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS patients (
        id VARCHAR(36) PRIMARY KEY,
        nom VARCHAR(100) NOT NULL,
        prenom VARCHAR(100) NOT NULL,
        date_naissance DATE NOT NULL,
        sexe ENUM('M','F') NOT NULL,
        telephone VARCHAR(20),
        num_carte_nationale VARCHAR(50) UNIQUE,
        num_carte_chifa VARCHAR(50),
        adresse TEXT,
        commune VARCHAR(100),
        wilaya VARCHAR(100),
        latitude DECIMAL(10,8),
        longitude DECIMAL(11,8),
        fumeur BOOLEAN DEFAULT false,
        alcool BOOLEAN DEFAULT false,
        activite_sportive BOOLEAN DEFAULT false,
        autres_medicaments TEXT,
        autres_facteurs_risque TEXT,
        created_by VARCHAR(36),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    // Cancer cases table
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS cancer_cases (
        id VARCHAR(36) PRIMARY KEY,
        patient_id VARCHAR(36) NOT NULL,
        type_cancer ENUM('Solide','Liquide') NOT NULL,
        sous_type VARCHAR(200),
        anomalies_genetiques TEXT,
        etat ENUM('Localisé','Métastase') NOT NULL,
        stade VARCHAR(50),
        taille_cancer DECIMAL(10,2),
        rapport_anatomopathologique TEXT,
        medecin_traitant VARCHAR(36),
        medecin_inapte VARCHAR(36),
        numero_lecteur VARCHAR(100),
        date_diagnostic DATE NOT NULL,
        statut_patient ENUM('En traitement','Guéri','Décédé') DEFAULT 'En traitement',
        date_deces DATE,
        decision_rcp TEXT,
        created_by VARCHAR(36),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
        FOREIGN KEY (medecin_traitant) REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    // Treatments table with specialized sub-modules
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS traitements (
        id VARCHAR(36) PRIMARY KEY,
        case_id VARCHAR(36) NOT NULL,
        type_traitement VARCHAR(200) NOT NULL,
        date_debut DATE,
        date_fin DATE,
        description TEXT,
        resultat TEXT,
        
        -- Sub-module Chirurgie
        chirurgie_type VARCHAR(200),
        chirurgie_complications TEXT,
        chirurgie_compte_rendu TEXT,

        -- Specialized fields from screenshots
        intention_therapeutique VARCHAR(100),
        ligne_traitement VARCHAR(50),
        voie_administration VARCHAR(100),
        jours_administration VARCHAR(100),
        cycles_realises INT,

        -- Sub-module Chimiothérapie (Global plan)
        chimio_protocole VARCHAR(200),
        chimio_nombre_cycles INT,
        chimio_dose VARCHAR(100),
        chimio_date_fin_prevue DATE,

        -- Sub-module Radiothérapie
        radio_dose_totale VARCHAR(100),
        radio_fractionnement VARCHAR(100),
        radio_nb_seances INT,

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (case_id) REFERENCES cancer_cases(id) ON DELETE CASCADE
      )
    `);

    // Ensure columns exist for existing databases
    const colsToAdd = [
      ['chirurgie_type', 'VARCHAR(200)'],
      ['chirurgie_complications', 'TEXT'],
      ['chirurgie_compte_rendu', 'TEXT'],
      ['chimio_protocole', 'VARCHAR(200)'],
      ['chimio_nombre_cycles', 'INT'],
      ['chimio_dose', 'VARCHAR(100)'],
      ['chimio_date_fin_prevue', 'DATE'],
      ['radio_dose_totale', 'VARCHAR(100)'],
      ['radio_fractionnement', 'VARCHAR(100)'],
      ['radio_nb_seances', 'INT'],
      ['intention_therapeutique', 'VARCHAR(100)'],
      ['ligne_traitement', 'VARCHAR(50)'],
      ['voie_administration', 'VARCHAR(100)'],
      ['jours_administration', 'VARCHAR(100)'],
      ['cycles_realises', 'INT']
    ];

    for (const [col, type] of colsToAdd) {
      try {
        await conn.execute(`ALTER TABLE traitements ADD COLUMN ${col} ${type}`);
      } catch (err) {
        if (err.code !== 'ER_DUP_FIELDNAME') console.warn(`Error adding ${col}:`, err.message);
      }
    }

    // Appointments table
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS rendez_vous (
        id VARCHAR(36) PRIMARY KEY,
        case_id VARCHAR(36) NOT NULL,
        patient_id VARCHAR(36) NOT NULL,
        medecin_id VARCHAR(36),
        date_rdv DATETIME NOT NULL,
        motif VARCHAR(200),
        notes TEXT,
        statut ENUM('Planifié','Effectué','Annulé') DEFAULT 'Planifié',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (case_id) REFERENCES cancer_cases(id) ON DELETE CASCADE,
        FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
      )
    `);

    // Audit log table
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36),
        action VARCHAR(100) NOT NULL,
        table_name VARCHAR(100),
        record_id VARCHAR(36),
        details TEXT,
        ip_address VARCHAR(45),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create default admin user
    const bcrypt = require('bcryptjs');
    const { v4: uuidv4 } = require('uuid');
    const [existing] = await conn.execute('SELECT id FROM users WHERE email = ?', ['admin@registre-cancer.dz']);
    if (existing.length === 0) {
      const hashedPassword = await bcrypt.hash('Admin@2024', 10);
      await conn.execute(
        'INSERT INTO users (id, nom, prenom, email, password, role) VALUES (?, ?, ?, ?, ?, ?)',
        [uuidv4(), 'Administrateur', 'Système', 'admin@registre-cancer.dz', hashedPassword, 'admin']
      );
      console.log('✅ Admin user created: admin@registre-cancer.dz / Admin@2024');
    }

    console.log('✅ Database initialized successfully');
  } catch (error) {
    console.error('❌ Database initialization error:', error);
    throw error;
  } finally {
    conn.release();
  }
};


const initDynamicTables = async () => {
  const conn = await pool.getConnection();
  try {
    // Universal Dynamic Fields Table (Entity-Attribute-Value)
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS champs_dynamiques (
        id VARCHAR(36) PRIMARY KEY,
        entite ENUM('patient', 'cancer', 'habitudes_vie') NOT NULL,
        nom VARCHAR(200) NOT NULL,
        type_champ ENUM('texte', 'nombre', 'date', 'booleen', 'liste') DEFAULT 'texte',
        options_liste TEXT,
        obligatoire BOOLEAN DEFAULT false,
        actif BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Values for those dynamic fields
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS valeurs_dynamiques (
        id VARCHAR(36) PRIMARY KEY,
        record_id VARCHAR(36) NOT NULL,
        champ_id VARCHAR(36) NOT NULL,
        valeur TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_record (record_id),
        FOREIGN KEY (champ_id) REFERENCES champs_dynamiques(id) ON DELETE CASCADE
      )
    `);

    // Paramètres globaux (cancers, localités, antécédents, comorbidités, effets indésirables)
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS parametres_globaux (
        id VARCHAR(36) PRIMARY KEY,
        categorie ENUM('cancer', 'localite', 'antecedent', 'comorbidite', 'effet_indesirable') NOT NULL,
        valeur VARCHAR(200) NOT NULL,
        code VARCHAR(50),
        obligatoire BOOLEAN DEFAULT false,
        actif BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    try { await conn.execute(`ALTER TABLE parametres_globaux ADD COLUMN obligatoire BOOLEAN DEFAULT false`); } catch(e) {}

    console.log('✅ Dynamic tables initialized');
  } catch(e) {
    console.error('Dynamic tables error:', e.message);
  } finally {
    conn.release();
  }
};

const initMedicalTables = async () => {
  const conn = await pool.getConnection();
  try {
    await conn.execute(`ALTER TABLE cancer_cases ADD COLUMN IF NOT EXISTS localisation VARCHAR(200)`);
    await conn.execute(`ALTER TABLE cancer_cases ADD COLUMN IF NOT EXISTS tnm_t VARCHAR(20)`);
    await conn.execute(`ALTER TABLE cancer_cases ADD COLUMN IF NOT EXISTS tnm_n VARCHAR(20)`);
    await conn.execute(`ALTER TABLE cancer_cases ADD COLUMN IF NOT EXISTS tnm_m VARCHAR(20)`);
    // Diagnostic Form Update
    await conn.execute(`ALTER TABLE cancer_cases ADD COLUMN IF NOT EXISTS date_premiers_symptomes DATE`);
    await conn.execute(`ALTER TABLE cancer_cases ADD COLUMN IF NOT EXISTS base_diagnostic VARCHAR(200)`);
    await conn.execute(`ALTER TABLE cancer_cases ADD COLUMN IF NOT EXISTS lateralite VARCHAR(50)`);
    await conn.execute(`ALTER TABLE cancer_cases ADD COLUMN IF NOT EXISTS code_cim10 VARCHAR(50)`);
    await conn.execute(`ALTER TABLE cancer_cases ADD COLUMN IF NOT EXISTS type_histologique VARCHAR(200)`);
    await conn.execute(`ALTER TABLE cancer_cases ADD COLUMN IF NOT EXISTS grade_histologique VARCHAR(50)`);
    await conn.execute(`ALTER TABLE cancer_cases ADD COLUMN IF NOT EXISTS numero_bloc VARCHAR(100)`);
    try { await conn.execute(`ALTER TABLE cancer_cases ADD COLUMN IF NOT EXISTS recepteur_er ENUM('Positif','Négatif','Inconnu') DEFAULT 'Inconnu'`); } catch(e){}
    try { await conn.execute(`ALTER TABLE cancer_cases ADD COLUMN IF NOT EXISTS recepteur_pr ENUM('Positif','Négatif','Inconnu') DEFAULT 'Inconnu'`); } catch(e){}
    try { await conn.execute(`ALTER TABLE cancer_cases ADD COLUMN IF NOT EXISTS her2 ENUM('Positif','Equivoque','Négatif','Inconnu') DEFAULT 'Inconnu'`); } catch(e){}
    await conn.execute(`ALTER TABLE cancer_cases ADD COLUMN IF NOT EXISTS nb_ganglions_envahis INT`);
    await conn.execute(`ALTER TABLE cancer_cases ADD COLUMN IF NOT EXISTS sites_metastatiques TEXT`);
    await conn.execute(`ALTER TABLE cancer_cases ADD COLUMN IF NOT EXISTS etablissement_diagnostiqueur VARCHAR(200)`);
    await conn.execute(`ALTER TABLE cancer_cases ADD COLUMN IF NOT EXISTS medecin_diagnostiqueur VARCHAR(200)`);

    // Traitements Form Update
    try { await conn.execute(`ALTER TABLE traitements ADD COLUMN IF NOT EXISTS intention_therapeutique ENUM('Curatif','Adjuvant','Néo-adjuvant','Palliatif','Prophylactique')`); } catch(e){}
    try { await conn.execute(`ALTER TABLE traitements ADD COLUMN IF NOT EXISTS statut ENUM('Planifié','En cours','Terminé','Pause','Suspendu','Abandonné') DEFAULT 'Planifié'`); } catch(e){}
    await conn.execute(`ALTER TABLE traitements ADD COLUMN IF NOT EXISTS protocole VARCHAR(200)`);
    await conn.execute(`ALTER TABLE traitements ADD COLUMN IF NOT EXISTS ligne_traitement INT`);
    await conn.execute(`ALTER TABLE traitements ADD COLUMN IF NOT EXISTS nb_cycles_prevus INT`);
    await conn.execute(`ALTER TABLE traitements ADD COLUMN IF NOT EXISTS cycles_realises INT DEFAULT 0`);
    await conn.execute(`ALTER TABLE traitements ADD COLUMN IF NOT EXISTS jours VARCHAR(100)`);
    await conn.execute(`ALTER TABLE traitements ADD COLUMN IF NOT EXISTS voie_administration VARCHAR(100)`);
    await conn.execute(`ALTER TABLE traitements ADD COLUMN IF NOT EXISTS medicaments TEXT`);
    await conn.execute(`ALTER TABLE traitements ADD COLUMN IF NOT EXISTS reponse_tumorale VARCHAR(200)`);
    await conn.execute(`ALTER TABLE traitements ADD COLUMN IF NOT EXISTS date_evaluation DATE`);
    await conn.execute(`ALTER TABLE traitements ADD COLUMN IF NOT EXISTS grade_toxicite VARCHAR(50)`);
    await conn.execute(`ALTER TABLE traitements ADD COLUMN IF NOT EXISTS description_toxicite TEXT`);

    // Lignes déplacées après la création de la table

    // Update patients table with new fields
    await conn.execute(`ALTER TABLE patients ADD COLUMN IF NOT EXISTS groupe_sanguin VARCHAR(10)`);
    await conn.execute(`ALTER TABLE patients ADD COLUMN IF NOT EXISTS antecedents_medicaux TEXT`);
    await conn.execute(`ALTER TABLE patients ADD COLUMN IF NOT EXISTS antecedents_familiaux TEXT`);
    await conn.execute(`ALTER TABLE patients ADD COLUMN IF NOT EXISTS num_dossier_hospitalier VARCHAR(50)`);

    // Anapath table
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS anapath (
        id VARCHAR(36) PRIMARY KEY,
        case_id VARCHAR(36) NOT NULL,
        date_prelevement DATE,
        type_histologique VARCHAR(200),
        resultat_biopsie TEXT,
        her2 ENUM('Positif','Négatif','Equivoque','Non testé') DEFAULT 'Non testé',
        er ENUM('Positif','Négatif','Non testé') DEFAULT 'Non testé',
        pr ENUM('Positif','Négatif','Non testé') DEFAULT 'Non testé',
        grade_sbr VARCHAR(10),
        ki67 VARCHAR(20),
        autres_marqueurs TEXT,
        compte_rendu TEXT,
        fichier_pdf VARCHAR(500),
        created_by VARCHAR(36),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (case_id) REFERENCES cancer_cases(id) ON DELETE CASCADE
      )
    `);

    await conn.execute(`ALTER TABLE anapath ADD COLUMN IF NOT EXISTS type_prelevement VARCHAR(100)`);
    await conn.execute(`ALTER TABLE anapath ADD COLUMN IF NOT EXISTS pathologiste VARCHAR(100)`);
    await conn.execute(`ALTER TABLE anapath ADD COLUMN IF NOT EXISTS marges_chirurgicales VARCHAR(50)`);
    await conn.execute(`ALTER TABLE anapath ADD COLUMN IF NOT EXISTS grade_tumoral VARCHAR(50)`);
    await conn.execute(`ALTER TABLE anapath ADD COLUMN IF NOT EXISTS pd_l1 VARCHAR(50)`);
    await conn.execute(`ALTER TABLE anapath ADD COLUMN IF NOT EXISTS mmr_msi VARCHAR(50)`);
    await conn.execute(`ALTER TABLE anapath ADD COLUMN IF NOT EXISTS autres_marqueurs_custom TEXT`);

    // Biology/Lab results table
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS biologie (
        id VARCHAR(36) PRIMARY KEY,
        case_id VARCHAR(36),
        patient_id VARCHAR(36),
        date_examen DATE NOT NULL,
        type_examen VARCHAR(100) NOT NULL,
        parametre VARCHAR(100) NOT NULL,
        valeur VARCHAR(100),
        unite VARCHAR(50),
        valeur_normale VARCHAR(100),
        interpretation ENUM('Normal','Bas','Haut','Critique') DEFAULT 'Normal',
        notes TEXT,
        created_by VARCHAR(36),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (case_id) REFERENCES cancer_cases(id) ON DELETE CASCADE,
        FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
      )
    `);

    try { await conn.execute(`ALTER TABLE biologie ADD COLUMN patient_id VARCHAR(36)`); } catch(e) {}
    try { await conn.execute(`ALTER TABLE biologie ADD CONSTRAINT fk_bio_patient FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE`); } catch(e) {}
    try { await conn.execute(`ALTER TABLE biologie MODIFY COLUMN case_id VARCHAR(36) NULL`); } catch(e) {}

    // Imagerie table
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS imagerie (
        id VARCHAR(36) PRIMARY KEY,
        case_id VARCHAR(36) NOT NULL,
        date_examen DATE NOT NULL,
        type_examen ENUM('Scanner','IRM','Radiographie','PET Scan','Échographie','Mammographie','Autre') NOT NULL,
        region VARCHAR(200),
        resultat_resume TEXT,
        conclusion TEXT,
        fichier VARCHAR(500),
        created_by VARCHAR(36),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (case_id) REFERENCES cancer_cases(id) ON DELETE CASCADE
      )
    `);

    // Consultations table
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS consultations (
        id VARCHAR(36) PRIMARY KEY,
        case_id VARCHAR(36) NOT NULL,
        date_consultation DATE NOT NULL,
        poids DECIMAL(5,2),
        taille DECIMAL(5,2),
        tension_arterielle VARCHAR(20),
        temperature DECIMAL(4,1),
        symptomes TEXT,
        examen_clinique TEXT,
        decision_medicale TEXT,
        prochain_rdv DATE,
        medecin_id VARCHAR(36),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (case_id) REFERENCES cancer_cases(id) ON DELETE CASCADE,
        FOREIGN KEY (medecin_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    // Effets secondaires table
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS effets_secondaires (
        id VARCHAR(36) PRIMARY KEY,
        case_id VARCHAR(36) NOT NULL,
        date_apparition DATE NOT NULL,
        type_effet VARCHAR(200) NOT NULL,
        grade ENUM('Grade 1','Grade 2','Grade 3','Grade 4') DEFAULT 'Grade 1',
        description TEXT,
        traitement_pris TEXT,
        resolu BOOLEAN DEFAULT false,
        date_resolution DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (case_id) REFERENCES cancer_cases(id) ON DELETE CASCADE
      )
    `);

    // Chemo sessions table
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS chimio_seances (
        id VARCHAR(36) PRIMARY KEY,
        case_id VARCHAR(36) NOT NULL,
        protocole VARCHAR(200),
        numero_cycle INT,
        date_seance DATE NOT NULL,
        dose_administree VARCHAR(100),
        effets_observes TEXT,
        tolerance ENUM('Bonne','Moyenne','Mauvaise') DEFAULT 'Bonne',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (case_id) REFERENCES cancer_cases(id) ON DELETE CASCADE
      )
    `);

    // RCP (Réunion de Concertation Pluridisciplinaire) tables
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS reunions_rcp (
        id VARCHAR(36) PRIMARY KEY,
        titre VARCHAR(200) NOT NULL,
        date_reunion DATE NOT NULL,
        statut ENUM('Planifiée','En cours','Terminée') DEFAULT 'Planifiée',
        notes_globales TEXT,
        decision_finale TEXT,
        invite_code VARCHAR(20) UNIQUE,
        created_by VARCHAR(36),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    // Add decision_finale column if it doesn't exist (for existing databases)
    try {
      await conn.execute(`ALTER TABLE reunions_rcp ADD COLUMN decision_finale TEXT`);
    } catch (err) {
      if (err.code !== 'ER_DUP_FIELDNAME') {
        console.warn('Could not add decision_finale to reunions_rcp:', err.message);
      }
    }

    // Add invite_code column if it doesn't exist
    try {
      await conn.execute(`ALTER TABLE reunions_rcp ADD COLUMN invite_code VARCHAR(20) UNIQUE`);
    } catch (err) {
      if (err.code !== 'ER_DUP_FIELDNAME') {
        console.warn('Could not add invite_code to reunions_rcp:', err.message);
      }
    }

    await conn.execute(`
      CREATE TABLE IF NOT EXISTS rcp_participants (
        id VARCHAR(36) PRIMARY KEY,
        rcp_id VARCHAR(36) NOT NULL,
        user_id VARCHAR(36) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (rcp_id) REFERENCES reunions_rcp(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    await conn.execute(`
      CREATE TABLE IF NOT EXISTS rcp_messages (
        id VARCHAR(36) PRIMARY KEY,
        rcp_id VARCHAR(36) NOT NULL,
        sender_id VARCHAR(36) NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (rcp_id) REFERENCES reunions_rcp(id) ON DELETE CASCADE,
        FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    await conn.execute(`
      CREATE TABLE IF NOT EXISTS notifications (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        titre VARCHAR(200) NOT NULL,
        message TEXT,
        lien VARCHAR(500),
        lu BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    await conn.execute(`
      CREATE TABLE IF NOT EXISTS rcp_cases (
        id VARCHAR(36) PRIMARY KEY,
        rcp_id VARCHAR(36) NOT NULL,
        case_id VARCHAR(36) NOT NULL,
        medecin_presentateur VARCHAR(36),
        decision_retenue TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (rcp_id) REFERENCES reunions_rcp(id) ON DELETE CASCADE,
        FOREIGN KEY (case_id) REFERENCES cancer_cases(id) ON DELETE CASCADE,
        FOREIGN KEY (medecin_presentateur) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    // Lab Requests
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS lab_requests (
        id VARCHAR(36) PRIMARY KEY,
        case_id VARCHAR(36) NOT NULL,
        medecin_id VARCHAR(36) NOT NULL,
        labo_id VARCHAR(36) NOT NULL,
        analyses_demandees TEXT NOT NULL,
        statut ENUM('En attente', 'Terminée') DEFAULT 'En attente',
        fichier_pdf VARCHAR(500),
        notes_labo TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (case_id) REFERENCES cancer_cases(id) ON DELETE CASCADE,
        FOREIGN KEY (medecin_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (labo_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    console.log('✅ Medical modules tables initialized');
  } catch(e) {
    console.error('Medical tables error:', e.message);
  } finally {
    conn.release();
  }
};

module.exports = { pool, initDatabase, initDynamicTables, initMedicalTables };
