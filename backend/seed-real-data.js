/* eslint-disable quotes */
require('dotenv').config();
const { pool } = require('./config/database');
const { v4: uuidv4 } = require('uuid');

// ─── Données de Référence ─────────────────────────────────────────────────────

const WILAYAS = [
  { wilaya: 'Alger', lat: 36.7372, lng: 3.0867 },
  { wilaya: 'Oran', lat: 35.6911, lng: -0.6417 },
  { wilaya: 'Constantine', lat: 36.3650, lng: 6.6147 },
  { wilaya: 'Annaba', lat: 36.9000, lng: 7.7667 },
  { wilaya: 'Skikda', lat: 36.8761, lng: 6.9078 },
  { wilaya: 'Tizi-Ouzou', lat: 36.7169, lng: 4.0497 },
  { wilaya: 'Sétif', lat: 36.1898, lng: 5.4097 },
  { wilaya: 'Batna', lat: 35.5559, lng: 6.1742 },
  { wilaya: 'Blida', lat: 36.4700, lng: 2.8300 },
  { wilaya: 'Béjaïa', lat: 36.7500, lng: 5.0667 },
];

const PATIENTS_DATA = [
  { nom: 'Boudiaf', prenom: 'Fatiha', dob: '1968-04-12', sexe: 'F', wilaya: 'Alger', tel: '0551234567', antecedents: 'HTA traitée, diabète type 2', groupe_sanguin: 'A+' },
  { nom: 'Bensalem', prenom: 'Karim', dob: '1955-11-03', sexe: 'M', wilaya: 'Oran', tel: '0661245678', antecedents: 'Tabagisme chronique (40 PA), BPCO', groupe_sanguin: 'O+' },
  { nom: 'Hamidi', prenom: 'Nadia', dob: '1972-08-21', sexe: 'F', wilaya: 'Constantine', tel: '0771234567', antecedents: 'Antécédents familiaux de cancer du sein (mère)', groupe_sanguin: 'B+' },
  { nom: 'Meziane', prenom: 'Yacine', dob: '1963-02-15', sexe: 'M', wilaya: 'Annaba', tel: '0551234000', antecedents: 'Colite ulcéreuse depuis 15 ans, alcool', groupe_sanguin: 'AB+' },
  { nom: 'Cherif', prenom: 'Samia', dob: '1978-06-30', sexe: 'F', wilaya: 'Skikda', tel: '0663214567', antecedents: 'Exposition professionnelle (pétrochimie 18 ans)', groupe_sanguin: 'A-' },
  { nom: 'Boucherit', prenom: 'Rachid', dob: '1948-01-09', sexe: 'M', wilaya: 'Tizi-Ouzou', tel: '0557654321', antecedents: 'HBP, HTA, ancienne rectorragie non investiguée', groupe_sanguin: 'O-' },
  { nom: 'Aissaoui', prenom: 'Leila', dob: '1985-03-25', sexe: 'F', wilaya: 'Sétif', tel: '0669876543', antecedents: 'Obésité (IMC 31), anovulation chronique', groupe_sanguin: 'A+' },
  { nom: 'Belarbi', prenom: 'Mourad', dob: '1960-09-11', sexe: 'M', wilaya: 'Batna', tel: '0551122334', antecedents: 'Tabagisme (25 PA), exposition amiante', groupe_sanguin: 'B-' },
  { nom: 'Tadjine', prenom: 'Amina', dob: '1975-12-05', sexe: 'F', wilaya: 'Blida', tel: '0661122334', antecedents: 'Mastopathie bénigne fibrokystique, nullipare', groupe_sanguin: 'O+' },
  { nom: 'Khedim', prenom: 'Hassan', dob: '1952-07-18', sexe: 'M', wilaya: 'Béjaïa', tel: '0557788990', antecedents: 'Hépatite B chronique, cirrhose compensée', groupe_sanguin: 'B+' },
  { nom: 'Benali', prenom: 'Souad', dob: '1961-10-22', sexe: 'F', wilaya: 'Alger', tel: '0659876543', antecedents: 'Diabète type 2, obésité, SOPK', groupe_sanguin: 'A+' },
  { nom: 'Hadj', prenom: 'Omar', dob: '1942-05-30', sexe: 'M', wilaya: 'Oran', tel: '0550011223', antecedents: 'Tabagisme sévère (50 PA), insuffisance rénale légère', groupe_sanguin: 'O+' },
];

// ─── Cas Cliniques (Cancer) ──────────────────────────────────────────────────

const CASES_DATA = [
  {
    patientIdx: 0,
    type_cancer: 'Solide', sous_type: 'Cancer du Sein', localisation: 'Sein droit', stade: 'Stade IIB',
    tnm_t: 'T2', tnm_n: 'N1', tnm_m: 'M0', code_cim10: 'C50.1', etat: 'Localisé',
    date_diagnostic: '2024-03-15', date_premiers_symptomes: '2024-01-10',
    base_diagnostic: 'Histologique (Biopsie)', lateralite: 'Droit',
    type_histologique: 'Carcinome canalaire infiltrant', grade_histologique: 'Grade SBR II',
    statut_patient: 'En traitement',
    anapath: {
      date_prelevement: '2024-03-20', type_histologique: 'Carcinome canalaire infiltrant (CCI)',
      type_prelevement: 'Core-biopsie guidée échographie', her2: 'Positif', er: 'Positif', pr: 'Positif',
      grade_sbr: 'SBR II', ki67: '25%', marges_chirurgicales: 'Saines (>2mm)',
      pathologiste: 'Dr. Benali Fatima - CHU Mustapha',
      compte_rendu: "Carcinome canalaire infiltrant de grade SBR II. Récepteurs hormonaux positifs (ER 90%, PR 70%). HER2 surexprimé (IHC 3+). Ki-67 à 25%. Marges d'exérèse saines à plus de 2mm. 2 ganglions axillaires envahis sur 14 prélevés.",
      pd_l1: 'Non testé', mmr_msi: 'pMMR (proficient)'
    },
    traitements: [
      { type_traitement: 'Chimiothérapie', protocole: 'FEC 100', ligne_traitement: 1, nb_cycles_prevus: 3, cycles_realises: 3, date_debut: '2024-04-10', date_fin: '2024-06-20', statut: 'Terminé', intention_therapeutique: 'Néo-adjuvant', medicaments: 'Fluorouracil 500mg/m², Epirubicine 100mg/m², Cyclophosphamide 500mg/m²', resultat: 'Bonne reponse clinique, reduction tumorale de 40%' },
      { type_traitement: 'Chimiothérapie', protocole: 'Taxol hebdo', ligne_traitement: 2, nb_cycles_prevus: 12, cycles_realises: 8, date_debut: '2024-07-05', date_fin: null, statut: 'En cours', intention_therapeutique: 'Neo-adjuvant', medicaments: 'Paclitaxel 80mg/m2 J1-J8-J15', resultat: 'En cours evaluation' },
    ],
    biologie: [
      { date_examen: '2024-03-18', type_examen: 'NFS', parametre: 'Leucocytes', valeur: '8.2', unite: 'G/L', valeur_normale: '4-10', interpretation: 'Normal' },
      { date_examen: '2024-03-18', type_examen: 'Marqueur tumoral', parametre: 'CA 15-3', valeur: '68', unite: 'U/mL', valeur_normale: '<35', interpretation: 'Haut' },
      { date_examen: '2024-03-18', type_examen: 'NFS', parametre: 'Hémoglobine', valeur: '11.8', unite: 'g/dL', valeur_normale: '12-16', interpretation: 'Bas' },
      { date_examen: '2024-06-25', type_examen: 'Marqueur tumoral', parametre: 'CA 15-3', valeur: '32', unite: 'U/mL', valeur_normale: '<35', interpretation: 'Normal', notes: 'Normalisation après FEC 100 ✓' },
    ],
    imagerie: [
      { date_examen: '2024-01-20', type_examen: 'Mammographie', region: 'Sein droit', resultat_resume: 'Masse spiculée de 28mm à 10h, ACR 5. Adénopathies axillaires suspectes.', conclusion: 'Masse maligne très probable – indication biopsie urgente' },
      { date_examen: '2024-03-25', type_examen: 'Scanner', region: 'Thorax-Abdomen-Pelvis', resultat_resume: 'Pas de localisation secondaire à distance. Bilan d\'extension négatif.', conclusion: 'Maladie locorégionale sans métastase à distance' },
    ],
    effets: [
      { date_apparition: '2024-05-01', type_effet: 'Nausées', grade: 'Grade 2', description: 'Nausées persistantes J2-J5 post FEC', traitement_pris: 'Ondansétron 8mg x3/j + Métoclopramide', resolu: true, date_resolution: '2024-05-08' },
      { date_apparition: '2024-05-15', type_effet: 'Chute de cheveux', grade: 'Grade 2', description: 'Alopécie totale attendue sous FEC', traitement_pris: 'Casque réfrigérant (scalp cooling)', resolu: false },
      { date_apparition: '2024-07-20', type_effet: 'Neuropathie', grade: 'Grade 1', description: 'Paresthésies des extrémités du G1 liéés au Taxol', traitement_pris: 'Surveillance, vitamines B1/B6', resolu: false },
    ],
  },
  {
    patientIdx: 1,
    type_cancer: 'Solide', sous_type: 'Cancer du Poumon non à petites cellules', localisation: 'Poumon droit (Lobe supérieur)', stade: 'Stade IIIB',
    tnm_t: 'T3', tnm_n: 'N2', tnm_m: 'M0', code_cim10: 'C34.1', etat: 'Localisé',
    date_diagnostic: '2023-09-08', date_premiers_symptomes: '2023-06-15',
    base_diagnostic: 'Histologique + Imagerie', lateralite: 'Droit',
    type_histologique: 'Adénocarcinome pulmonaire', grade_histologique: 'Grade 3',
    statut_patient: 'En traitement',
    anapath: {
      date_prelevement: '2023-09-12', type_histologique: 'Adénocarcinome pulmonaire avec composante acinaire',
      type_prelevement: 'Biopsie bronchique sous fibroscopie', her2: 'Non testé', er: 'Non testé', pr: 'Non testé',
      grade_sbr: 'G3', ki67: '45%', pathologiste: 'Dr. Ferrahi Yacine - CHU Oran',
      compte_rendu: "Adénocarcinome pulmonaire de grade élevé (G3). EGFR muté (Exon 21 L858R). ALK négatif. PD-L1 TPS > 50%. Mutation KRAS absente.",
      pd_l1: 'TPS 55% (Haut)', mmr_msi: 'Non testé'
    },
    traitements: [
      { type_traitement: 'Chimiothérapie', protocole: 'Carboplatine-Pemetrexed', ligne_traitement: 1, nb_cycles_prevus: 4, cycles_realises: 4, date_debut: '2023-10-15', date_fin: '2024-01-20', statut: 'Terminé', intention_therapeutique: 'Curatif', medicaments: 'Carboplatine AUC5 + Pemetrexed 500mg/m2', resultat: 'Stabilisation tumorale - SD selon RECIST' },
      { type_traitement: 'Radiothérapie', protocole: 'Radiothérapie conformationnelle 3D', ligne_traitement: 1, nb_cycles_prevus: 30, cycles_realises: 30, date_debut: '2024-02-05', date_fin: '2024-03-22', statut: 'Terminé', intention_therapeutique: 'Curatif', medicaments: '60 Gy en 30 fractions', resultat: 'Bonne tolerance, controle local atteint' },
      { type_traitement: 'Thérapie ciblée', protocole: 'Osimertinib', ligne_traitement: 2, nb_cycles_prevus: null, cycles_realises: 5, date_debut: '2024-04-10', date_fin: null, statut: 'En cours', intention_therapeutique: 'Palliatif', medicaments: 'Osimertinib (Tagrisso) 80mg/j per os', resultat: 'Reponse partielle sous Tagrisso' },
    ],
    biologie: [
      { date_examen: '2023-09-10', type_examen: 'Marqueur tumoral', parametre: 'ACE (CEA)', valeur: '42.5', unite: 'ng/mL', valeur_normale: '<5', interpretation: 'Haut' },
      { date_examen: '2023-09-10', type_examen: 'NFS', parametre: 'Leucocytes', valeur: '12.4', unite: 'G/L', valeur_normale: '4-10', interpretation: 'Haut' },
      { date_examen: '2024-01-25', type_examen: 'Marqueur tumoral', parametre: 'ACE (CEA)', valeur: '18.2', unite: 'ng/mL', valeur_normale: '<5', interpretation: 'Haut', notes: 'Amélioration partielle après chimio' },
    ],
    imagerie: [
      { date_examen: '2023-09-05', type_examen: 'Scanner', region: 'Thorax', resultat_resume: 'Masse hilaire droite de 52mm avec extension médiastinale. Adénopathies 4R et 7 envahies. Pas d\'épanchement.', conclusion: 'CBNPC localement avancé (Stade IIIB) – résécabilité douteuse' },
      { date_examen: '2023-09-06', type_examen: 'PET Scan', region: 'Corps entier', resultat_resume: 'Hypermétabolisme de la masse hilaire droite (SUVmax 12.4). Fixation ganglionnaire médiastinale. Pas de foyer secondaire à distance.', conclusion: 'Maladie locorégionale confirmée, extension M0' },
    ],
    effets: [
      { date_apparition: '2023-11-10', type_effet: 'Fatigue', grade: 'Grade 2', description: 'Asthénie sévère post-chimio, limitant les activités quotidiennes', traitement_pris: 'Repos, supplémentation en fer et vitamines', resolu: true, date_resolution: '2024-02-01' },
      { date_apparition: '2024-02-20', type_effet: 'Mucite', grade: 'Grade 2', description: 'Mucite buccale modérée sous radiothérapie médiastinale', traitement_pris: 'Bains de bouche, alimentation molle', resolu: true, date_resolution: '2024-04-01' },
    ],
  },
  {
    patientIdx: 2,
    type_cancer: 'Solide', sous_type: 'Cancer du Sein Triple Négatif', localisation: 'Sein gauche', stade: 'Stade IIIA',
    tnm_t: 'T3', tnm_n: 'N2', tnm_m: 'M0', code_cim10: 'C50.2', etat: 'Localisé',
    date_diagnostic: '2024-01-20', date_premiers_symptomes: '2023-10-05',
    base_diagnostic: 'Histologique (Biopsie + TEP)', lateralite: 'Gauche',
    type_histologique: 'Carcinome canalaire infiltrant Triple Négatif', grade_histologique: 'Grade SBR III',
    statut_patient: 'En traitement',
    anapath: {
      date_prelevement: '2024-01-25', type_histologique: 'Carcinome canalaire infiltrant de grade SBR III',
      type_prelevement: 'Core-biopsie', her2: 'Négatif', er: 'Négatif', pr: 'Négatif',
      grade_sbr: 'SBR III', ki67: '75%', pathologiste: 'Dr. Maouche Sihem - CHU Constantine',
      compte_rendu: "CCI de grade SBR III. Phénotype triple négatif (ER-, PR-, HER2-). Ki-67 très élevé à 75%. PD-L1 CPS = 12. BRCA1 muté (mutation germinale à confirmer). Nécrose tumorale > 30%.",
      pd_l1: 'CPS 12 (Positif)', mmr_msi: 'pMMR'
    },
    traitements: [
      { type_traitement: 'Chimiothérapie', protocole: 'Carboplatine + Paclitaxel (hebdo)', ligne_traitement: 1, nb_cycles_prevus: 12, cycles_realises: 12, date_debut: '2024-02-15', date_fin: '2024-05-10', statut: 'Terminé', intention_therapeutique: 'Néo-adjuvant', medicaments: 'Paclitaxel 80mg/m2 + Carboplatine AUC2 J1-J8-J15/21j', resultat: 'Reponse pathologique complete (pCR) a la chirurgie !' },
      { type_traitement: 'Immunothérapie', protocole: 'Pembrolizumab', ligne_traitement: 1, nb_cycles_prevus: 8, cycles_realises: 8, date_debut: '2024-02-15', date_fin: '2024-05-10', statut: 'Terminé', intention_therapeutique: 'Néo-adjuvant', medicaments: 'Pembrolizumab 200mg IV/21j (avec chimio)', resultat: 'Contribue a la pCR' },
    ],
    biologie: [
      { date_examen: '2024-01-22', type_examen: 'NFS', parametre: 'Polynucléaires neutrophiles', valeur: '5.8', unite: 'G/L', valeur_normale: '1.8-7', interpretation: 'Normal' },
      { date_examen: '2024-01-22', type_examen: 'Marqueur tumoral', parametre: 'CA 15-3', valeur: '156', unite: 'U/mL', valeur_normale: '<35', interpretation: 'Critique' },
      { date_examen: '2024-05-15', type_examen: 'Marqueur tumoral', parametre: 'CA 15-3', valeur: '18', unite: 'U/mL', valeur_normale: '<35', interpretation: 'Normal', notes: 'Normalisation complète post-traitement – pCR confirmée' },
    ],
    imagerie: [
      { date_examen: '2024-01-28', type_examen: 'IRM', region: 'Sein bilatéral', resultat_resume: 'Masse sein gauche de 58mm multifocale. Enhancement suspect axillaire (5 ganglions). Sein droit sain.', conclusion: 'Cancer du sein gauche T3N2 – bilan IRM diagnostique' },
    ],
    effets: [
      { date_apparition: '2024-03-10', type_effet: 'Neutropénie', grade: 'Grade 3', description: 'Neutropénie fébrile grade 3, patient hospitalisée 5 jours', traitement_pris: 'G-CSF (Neupogen), antibiotiques IV Augmentin, report de cure 1 semaine', resolu: true, date_resolution: '2024-03-20' },
      { date_apparition: '2024-04-05', type_effet: 'Anémie', grade: 'Grade 2', description: 'Anémie normochrome normocytaire, Hb 8.9 g/dL', traitement_pris: 'Transfusion 2 CGR, Fer IV Ferinject', resolu: true, date_resolution: '2024-04-15' },
    ],
  },
  {
    patientIdx: 3,
    type_cancer: 'Solide', sous_type: 'Cancer du Côlon', localisation: 'Côlon sigmoïde', stade: 'Stade IV',
    tnm_t: 'T4', tnm_n: 'N2', tnm_m: 'M1', code_cim10: 'C18.7', etat: 'Métastase',
    date_diagnostic: '2023-05-12', date_premiers_symptomes: '2023-02-01',
    base_diagnostic: 'Histologique (Résection + Biopsie hépatique)', lateralite: 'Sans objet',
    type_histologique: 'Adénocarcinome lieberkühnien', grade_histologique: 'Grade 2',
    statut_patient: 'Décédé',
    anapath: {
      date_prelevement: '2023-05-15', type_histologique: 'Adénocarcinome colique modérément différencié',
      type_prelevement: 'Pièce opératoire (résection sigmoïde) + Biopsie hépatique', her2: 'Non testé', er: 'Non testé', pr: 'Non testé',
      grade_sbr: 'G2', ki67: '55%', pathologiste: 'Dr. Ghribi Slimane - CHU Annaba',
      compte_rendu: "Adénocarcinome lieberkuhnien modérément différencié du sigmoïde. KRAS muté (Codon 12). MSS (Microsatellite Stable). 14 ganglions envahis / 18 prélevés. Métastases hépatiques synchrones (3 nodules segment VI et VII).",
      pd_l1: 'Non exprimé', mmr_msi: 'MSS (Microsatellite Stable)'
    },
    traitements: [
      { type_traitement: 'Chirurgie', protocole: 'Résection antérieure du rectum', ligne_traitement: 1, nb_cycles_prevus: 1, cycles_realises: 1, date_debut: '2023-05-20', date_fin: '2023-05-20', statut: 'Terminé', intention_therapeutique: 'Palliatif', medicaments: 'Colostomie de derivation + Résection sigmoïde', resultat: 'Anastomose non faisable - colostomie definitive' },
      { type_traitement: 'Chimiothérapie', protocole: 'FOLFOX 6', ligne_traitement: 2, nb_cycles_prevus: 12, cycles_realises: 10, date_debut: '2023-07-01', date_fin: '2023-12-10', statut: 'Abandonné', intention_therapeutique: 'Palliatif', medicaments: 'Oxaliplatine 85mg/m2 + LV 200mg/m2 + 5FU 400mg/m2 bolus + 5FU 2400mg/m2 46h', resultat: 'Progression hepatique, arret pour alteration etat general' },
    ],
    biologie: [
      { date_examen: '2023-05-10', type_examen: 'Marqueur tumoral', parametre: 'ACE (CEA)', valeur: '285', unite: 'ng/mL', valeur_normale: '<5', interpretation: 'Critique' },
      { date_examen: '2023-05-10', type_examen: 'Bilan hépatique', parametre: 'ASAT', valeur: '89', unite: 'UI/L', valeur_normale: '<40', interpretation: 'Haut' },
      { date_examen: '2023-05-10', type_examen: 'Bilan hépatique', parametre: 'Bilirubine totale', valeur: '32', unite: 'µmol/L', valeur_normale: '<17', interpretation: 'Haut' },
    ],
    imagerie: [
      { date_examen: '2023-04-25', type_examen: 'Scanner', region: 'Thorax-Abdomen-Pelvis', resultat_resume: 'Masse sigmoïdienne de 65mm sténosante. Carcinose péritonéale localisée. 3 métastases hépatiques (max 45mm). Épanchement ascitique minime.', conclusion: 'Cancer colique métastatique (Stade IV) – résécabilité hépatique à discuter en RCP' },
    ],
    effets: [
      { date_apparition: '2023-09-15', type_effet: 'Neuropathie', grade: 'Grade 3', description: 'Neuropathie périphérique douleureuse invalidante à l\'Oxaliplatine', traitement_pris: 'Arrêt Oxaliplatine, maintien 5FU seul, Pregabaline 75mg x2/j', resolu: false },
    ],
  },
  {
    patientIdx: 4,
    type_cancer: 'Solide', sous_type: 'Cancer de la Vessie', localisation: 'Paroi vésicale postérieure', stade: 'Stade IIA',
    tnm_t: 'T2a', tnm_n: 'N0', tnm_m: 'M0', code_cim10: 'C67.5', etat: 'Localisé',
    date_diagnostic: '2024-06-10', date_premiers_symptomes: '2024-04-01',
    base_diagnostic: 'Résection endoscopique (RTUV)', lateralite: 'Sans objet',
    type_histologique: 'Carcinome urothélial infiltrant', grade_histologique: 'Grade Élevé (High Grade)',
    statut_patient: 'En traitement',
    anapath: {
      date_prelevement: '2024-06-12', type_histologique: 'Carcinome urothélial de haut grade',
      type_prelevement: 'Résection transurétrale de la vessie (RTUV)', her2: 'Non testé', er: 'Non testé', pr: 'Non testé',
      grade_sbr: 'HG', ki67: '60%', pathologiste: 'Dr. Boudaoud Malika - CHU Skikda',
      compte_rendu: "Carcinome urothélial de haut grade infiltrant la musculeuse (pT2a). Marges de résection envahies en profondeur. Présence d'invasion vasculaire. FGFR3 non muté.",
      pd_l1: 'CPS 8', mmr_msi: 'Non testé'
    },
    traitements: [
      { type_traitement: 'Chimiothérapie', protocole: 'Gemcitabine-Cisplatine', ligne_traitement: 1, nb_cycles_prevus: 4, cycles_realises: 2, date_debut: '2024-07-01', date_fin: null, statut: 'En cours', intention_therapeutique: 'Néo-adjuvant', medicaments: 'Gemcitabine 1000mg/m² J1-J8 + Cisplatine 70mg/m² J1 / 21j', resultat: 'En cours, bonne tolérance initiale' },
    ],
    biologie: [
      { date_examen: '2024-06-08', type_examen: 'NFS', parametre: 'Leucocytes', valeur: '9.8', unite: 'G/L', valeur_normale: '4-10', interpretation: 'Normal' },
      { date_examen: '2024-06-08', type_examen: 'Bilan rénal', parametre: 'Créatinine', valeur: '78', unite: 'µmol/L', valeur_normale: '62-115', interpretation: 'Normal' },
    ],
    imagerie: [
      { date_examen: '2024-06-05', type_examen: 'Scanner', region: 'Abdomen-Pelvis', resultat_resume: 'Épaississement pariétal vésical postérieur de 18mm. Pas d\'envahissement du tissu pré-vésical. Pas d\'adénopathie pelvienne.', conclusion: 'Tumeur vésicale T2 – bilan pré-RTUV' },
      { date_examen: '2024-06-15', type_examen: 'IRM', region: 'Pelvis', resultat_resume: 'Lésion infiltrante de la paroi postérieure de la vessie 18x14mm, franchissement de la musculeuse sans envahissement de la graisse pelvienne.', conclusion: 'Confirmation T2a – indication cystectomie totale après chimiothérapie néo-adjuvante' },
    ],
    effets: [
      { date_apparition: '2024-07-20', type_effet: 'Nausées', grade: 'Grade 1', description: 'Nausées légères post-Cisplatine J1-J2', traitement_pris: 'Ondansétron prophylactique + Dexaméthasone', resolu: true, date_resolution: '2024-07-22' },
    ],
  },
  {
    patientIdx: 5,
    type_cancer: 'Solide', sous_type: 'Cancer de la Prostate', localisation: 'Prostate, Zone périphérique', stade: 'Stade IVA',
    tnm_t: 'T3b', tnm_n: 'N1', tnm_m: 'M0', code_cim10: 'C61', etat: 'Localisé',
    date_diagnostic: '2023-11-08', date_premiers_symptomes: '2023-08-01',
    base_diagnostic: 'Histologique (Biopsie prostatique)', lateralite: 'Bilatéral',
    type_histologique: 'Adénocarcinome prostatique', grade_histologique: 'Gleason 4+4=8 (Grade Group 4)',
    statut_patient: 'En traitement',
    anapath: {
      date_prelevement: '2023-11-10', type_histologique: 'Adénocarcinome prostatique de haut grade',
      type_prelevement: 'Biopsie prostatique systématique 12 carottes', her2: 'Non testé', er: 'Non testé', pr: 'Non testé',
      grade_sbr: 'Gleason 8', ki67: '35%', pathologiste: 'Dr. Hamani Lyazid - CHU Tizi-Ouzou',
      compte_rendu: "Adénocarcinome prostatique Gleason 4+4 = 8 (ISUP Grade Group 4). 10/12 carottes positives, bilatéral. Extension extra-capsulaire probable. Invasion vésicules séminales (T3b).",
      pd_l1: 'Non testé', mmr_msi: 'Non testé'
    },
    traitements: [
      { type_traitement: 'Hormonothérapie', protocole: 'Castration chimique + Abiratérone', ligne_traitement: 1, nb_cycles_prevus: null, cycles_realises: 7, date_debut: '2023-12-01', date_fin: null, statut: 'En cours', intention_therapeutique: 'Curatif', medicaments: 'Leuproreline 22.5mg/3mois + Abiratérone 1000mg/j + Prednisone 5mg/j', resultat: 'PSA en decroissance rapide (1200 -> 4.2 ng/mL)' },
    ],
    biologie: [
      { date_examen: '2023-11-05', type_examen: 'Marqueur tumoral', parametre: 'PSA total', valeur: '1240', unite: 'ng/mL', valeur_normale: '<4', interpretation: 'Critique' },
      { date_examen: '2024-06-10', type_examen: 'Marqueur tumoral', parametre: 'PSA total', valeur: '4.2', unite: 'ng/mL', valeur_normale: '<4', interpretation: 'Haut', notes: 'Excellente réponse hormonale' },
      { date_examen: '2023-11-05', type_examen: 'Bilan hépatique', parametre: 'Phosphatases alcalines', valeur: '320', unite: 'UI/L', valeur_normale: '<120', interpretation: 'Critique' },
    ],
    imagerie: [
      { date_examen: '2023-11-12', type_examen: 'IRM', region: 'Pelvis / Prostate', resultat_resume: 'Prostate 45cc. Lésion PI-RADS 5 en zone périphérique bilatérale. Envahissement extra-capsulaire et vésicules séminales droites. Adénopathie iliaque interne droite 15mm.', conclusion: 'Cancer prostatique T3b N1 – castration + Abiratérone indiqués' },
      { date_examen: '2023-11-14', type_examen: 'Scanner', region: 'Thorax-Abdomen-Pelvis', resultat_resume: 'Adénopathie pelvienne droite. Absence de métastase osseuse ou viscérale.', conclusion: 'Extension locorégionale N1 confirmée, M0' },
    ],
    effets: [
      { date_apparition: '2024-01-10', type_effet: 'Fatigue', grade: 'Grade 2', description: 'Asthénie progressive sous hormonothérapie, prise de poids 8 kg', traitement_pris: 'Réhabilitation physique, programme d\'exercice encadré', resolu: false },
    ],
  },
  {
    patientIdx: 6,
    type_cancer: 'Solide', sous_type: 'Cancer de l\'Endomètre', localisation: 'Utérus (corps)', stade: 'Stade IA',
    tnm_t: 'T1a', tnm_n: 'N0', tnm_m: 'M0', code_cim10: 'C54.1', etat: 'Localisé',
    date_diagnostic: '2024-05-05', date_premiers_symptomes: '2024-03-20',
    base_diagnostic: 'Curetage biopsique', lateralite: 'Sans objet',
    type_histologique: 'Adénocarcinome endométrioïde', grade_histologique: 'Grade 1',
    statut_patient: 'Guéri',
    anapath: {
      date_prelevement: '2024-05-08', type_histologique: 'Adénocarcinome endométrioïde de type 1',
      type_prelevement: 'Curetage biopsique', her2: 'Non testé', er: 'Positif', pr: 'Positif',
      grade_sbr: 'G1', ki67: '10%', pathologiste: 'Dr. Tir Malika - CHU Sétif',
      compte_rendu: "Adénocarcinome endométrioïde bien différencié (grade 1). Invasion myométriale < 50% (T1a). Récepteurs hormonaux positifs (ER 80%, PR 60%). MSI-H.",
      pd_l1: 'Non testé', mmr_msi: 'MSI-H (Instabilité microsatellitaire haute)'
    },
    traitements: [
      { type_traitement: 'Chirurgie', protocole: 'Hystérectomie totale + Annexectomie bilatérale + Curage ganglionnaire', ligne_traitement: 1, nb_cycles_prevus: 1, cycles_realises: 1, date_debut: '2024-05-25', date_fin: '2024-05-25', statut: 'Terminé', intention_therapeutique: 'Curatif', medicaments: 'Coelioscopie – Hystérectomie cœlioscopique', resultat: 'Exérèse complète R0. Ganglions négatifs (0/18). Guérison attendue.' },
    ],
    biologie: [
      { date_examen: '2024-05-03', type_examen: 'NFS', parametre: 'Hémoglobine', valeur: '10.2', unite: 'g/dL', valeur_normale: '12-16', interpretation: 'Bas', notes: 'Anémie par saignement utérin' },
    ],
    imagerie: [
      { date_examen: '2024-05-06', type_examen: 'IRM', region: 'Pelvis', resultat_resume: 'Épaississement endométrial hétérogène 22mm. Envahissement myométrial < 50%. Col utérin libre. Pas d\'adénopathie pelvienne.', conclusion: 'Cancer de l\'endomètre T1a – chirurgie curative indiquée' },
    ],
    effets: [],
  },
  {
    patientIdx: 7,
    type_cancer: 'Solide', sous_type: 'Mésothéliome Pleural', localisation: 'Plèvre gauche', stade: 'Stade III',
    tnm_t: 'T3', tnm_n: 'N1', tnm_m: 'M0', code_cim10: 'C45.0', etat: 'Localisé',
    date_diagnostic: '2023-07-20', date_premiers_symptomes: '2023-04-10',
    base_diagnostic: 'Thoracoscopie + Biopsie pleurale', lateralite: 'Gauche',
    type_histologique: 'Mésothéliome épithélioïde', grade_histologique: 'Grade 2',
    statut_patient: 'Décédé',
    anapath: {
      date_prelevement: '2023-07-22', type_histologique: 'Mésothéliome épithélioïde',
      type_prelevement: 'Biopsie pleurale sous thoracoscopie', her2: 'Non testé', er: 'Non testé', pr: 'Non testé',
      grade_sbr: 'G2', ki67: '40%', pathologiste: 'Dr. Khaldi Abdelmounaïm - CHU Batna',
      compte_rendu: "Mésothéliome malin épithélioïde. BAP1 perdu (IHC). Expression de Calrétinine +++, CK5/6 +++. TTF1 négatif. CD141 positif. Exposition amiante professionnelle confirmée a l'anamnése.",
      pd_l1: 'TPS 10%', mmr_msi: 'Non pertinent'
    },
    traitements: [
      { type_traitement: 'Chimiothérapie', protocole: 'Cisplatine + Pémétrexed', ligne_traitement: 1, nb_cycles_prevus: 6, cycles_realises: 6, date_debut: '2023-09-01', date_fin: '2023-12-15', statut: 'Terminé', intention_therapeutique: 'Palliatif', medicaments: 'Cisplatine 75mg/m2 + Pémétrexed 500mg/m2 / 21j', resultat: 'Stabilisation (4 mois). Progression pulmonaire a J5.' },
    ],
    biologie: [
      { date_examen: '2023-07-18', type_examen: 'Marqueur tumoral', parametre: 'Mésothéline sérique', valeur: '52', unite: 'pM', valeur_normale: '<1.5', interpretation: 'Critique' },
    ],
    imagerie: [
      { date_examen: '2023-07-15', type_examen: 'Scanner', region: 'Thorax', resultat_resume: 'Épaississement pleural lobulaire gauche circonférentiel. Épanchement pleural gauche liquidien abondant. Pas d\'envahissement médiastinal. Réduction volume hémi-thorax gauche.', conclusion: 'Aspect typique de mésothéliome pleural malin gauche' },
    ],
    effets: [
      { date_apparition: '2023-10-05', type_effet: 'Toxicité cardiaque', grade: 'Grade 2', description: 'Allongement QT sous Cisplatine, surveillance ECG renforcée', traitement_pris: 'Réduction dose Cisplatine 25%, substitution Magnésium IV', resolu: true, date_resolution: '2023-11-01' },
    ],
  },
];

// ─── Script Principal ─────────────────────────────────────────────────────────

async function seedRealData() {
  console.log('\n🌱 Démarrage du Seeder de Données Cliniques Réelles...\n');
  const conn = await pool.getConnection();

  try {
    // Get admin user ID
    const [admins] = await conn.execute("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
    const [medecins] = await conn.execute("SELECT id FROM users WHERE role = 'medecin' LIMIT 1");
    if (admins.length === 0) { console.error("❌ Aucun utilisateur admin trouvé. Lancez seed-users.js d'abord."); return; }
    const adminId = admins[0].id;
    const medecinId = medecins.length > 0 ? medecins[0].id : adminId;

    // ── Clear existing clinical data (not users) ──
    console.log('🗑️  Suppression des anciennes données cliniques...');
    await conn.execute('SET FOREIGN_KEY_CHECKS=0');
    await conn.execute('DELETE FROM effets_secondaires');
    await conn.execute('DELETE FROM imagerie');
    await conn.execute('DELETE FROM biologie');
    await conn.execute('DELETE FROM anapath');
    await conn.execute('DELETE FROM chimio_seances');
    await conn.execute('DELETE FROM traitements');
    await conn.execute('DELETE FROM consultations');
    await conn.execute('DELETE FROM cancer_cases');
    await conn.execute('DELETE FROM patients');
    await conn.execute('SET FOREIGN_KEY_CHECKS=1');
    console.log('✅ Tables vidées.\n');

    // ── Insert Patients ──
    const patientIds = {};
    for (const p of PATIENTS_DATA) {
      const pid = uuidv4();
      const wData = WILAYAS.find(w => w.wilaya === p.wilaya) || WILAYAS[0];
      // slight randomness to coordinates
      const lat = wData.lat + (Math.random() - 0.5) * 0.3;
      const lng = wData.lng + (Math.random() - 0.5) * 0.3;
      await conn.execute(
        `INSERT INTO patients (id, nom, prenom, date_naissance, sexe, telephone, wilaya, commune, 
         latitude, longitude, antecedents_medicaux, groupe_sanguin, fumeur, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [pid, p.nom, p.prenom, p.dob, p.sexe, p.tel, p.wilaya, p.wilaya + ' Centre',
         lat.toFixed(6), lng.toFixed(6), p.antecedents, p.groupe_sanguin,
         p.antecedents.toLowerCase().includes('tabag') ? 1 : 0, adminId]
      );
      patientIds[PATIENTS_DATA.indexOf(p)] = pid;
      console.log(`  ✅ Patient: ${p.prenom} ${p.nom} (${p.wilaya})`);
    }

    console.log(`\n🏥 Insertion des ${CASES_DATA.length} dossiers oncologiques...\n`);

    for (const c of CASES_DATA) {
      const pid = patientIds[c.patientIdx];
      const cid = uuidv4();

      // Cancer case
      await conn.execute(
        `INSERT INTO cancer_cases (id, patient_id, type_cancer, sous_type, localisation, stade, etat,
         tnm_t, tnm_n, tnm_m, code_cim10, type_histologique, grade_histologique,
         date_diagnostic, date_premiers_symptomes, base_diagnostic, lateralite,
         statut_patient, medecin_traitant, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [cid, pid, c.type_cancer, c.sous_type, c.localisation, c.stade, c.etat,
         c.tnm_t, c.tnm_n, c.tnm_m, c.code_cim10, c.type_histologique, c.grade_histologique,
         c.date_diagnostic, c.date_premiers_symptomes, c.base_diagnostic, c.lateralite,
         c.statut_patient, medecinId, adminId]
      );

      // Anapath
      const ap = c.anapath;
      await conn.execute(
        `INSERT INTO anapath (id, case_id, date_prelevement, type_histologique, type_prelevement,
         her2, er, pr, grade_sbr, ki67, marges_chirurgicales, pathologiste, compte_rendu, pd_l1, mmr_msi, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [uuidv4(), cid, ap.date_prelevement, ap.type_histologique, ap.type_prelevement,
         ap.her2, ap.er, ap.pr, ap.grade_sbr, ap.ki67, ap.marges_chirurgicales || null,
         ap.pathologiste, ap.compte_rendu, ap.pd_l1, ap.mmr_msi, adminId]
      );

      // Traitements
      for (const t of c.traitements) {
        await conn.execute(
          `INSERT INTO traitements (id, case_id, type_traitement, protocole, ligne_traitement,
           nb_cycles_prevus, cycles_realises, date_debut, date_fin, statut, intention_therapeutique,
           medicaments, resultat)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [uuidv4(), cid, t.type_traitement, t.protocole, t.ligne_traitement,
           t.nb_cycles_prevus, t.cycles_realises, t.date_debut, t.date_fin || null,
           t.statut, t.intention_therapeutique, t.medicaments, t.resultat]
        );
      }

      // Biologie
      for (const b of c.biologie) {
        await conn.execute(
          `INSERT INTO biologie (id, case_id, date_examen, type_examen, parametre, valeur,
           unite, valeur_normale, interpretation, notes, created_by)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [uuidv4(), cid, b.date_examen, b.type_examen, b.parametre, b.valeur,
           b.unite, b.valeur_normale, b.interpretation, b.notes || null, adminId]
        );
      }

      // Imagerie
      for (const img of c.imagerie) {
        await conn.execute(
          `INSERT INTO imagerie (id, case_id, date_examen, type_examen, region,
           resultat_resume, conclusion, created_by)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [uuidv4(), cid, img.date_examen, img.type_examen, img.region,
           img.resultat_resume, img.conclusion, adminId]
        );
      }

      // Effets secondaires
      for (const e of c.effets) {
        await conn.execute(
          `INSERT INTO effets_secondaires (id, case_id, date_apparition, type_effet,
           grade, description, traitement_pris, resolu, date_resolution)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [uuidv4(), cid, e.date_apparition, e.type_effet, e.grade,
           e.description, e.traitement_pris, e.resolu ? 1 : 0, e.date_resolution || null]
        );
      }

      const p = PATIENTS_DATA[c.patientIdx];
      console.log(`  🏥 Dossier: ${p.prenom} ${p.nom} – ${c.sous_type} (${c.stade})`);
      console.log(`     📋 Anapath ✅ | 💊 ${c.traitements.length} Traitement(s) ✅ | 🔬 ${c.biologie.length} Biologie ✅ | 🖼️  ${c.imagerie.length} Imagerie ✅ | ⚠️  ${c.effets.length} Effet(s) ✅`);
    }

    console.log('\n✅ ════════════════════════════════════════════════════════');
    console.log('   Base de Données peuplée avec succès !');
    console.log(`   📊 ${PATIENTS_DATA.length} Patients | 🏥 ${CASES_DATA.length} Dossiers Complets`);
    console.log('   Les données SIG/Wilaya sont désormais actives sur la Carte.');
    console.log('   L\'IA peut maintenant analyser des dossiers concrets !');
    console.log('✅ ════════════════════════════════════════════════════════\n');

  } catch (err) {
    console.error('❌ Erreur durant le seeder:', err.message);
    console.error(err);
  } finally {
    conn.release();
    process.exit(0);
  }
}

seedRealData();
