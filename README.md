# 🏥 Registre du Cancer — Plateforme de Gestion Épidémiologique

Application web complète pour la gestion du registre des cancers, développée avec **React** (frontend), **Node.js/Express** (backend) et **MySQL** (base de données).

---

## 📋 Fonctionnalités

### Gestion des Patients
- ✅ Créer / Modifier / Supprimer des patients
- ✅ Informations personnelles complètes (Carte Nationale, Carte Chifa, etc.)
- ✅ Habitudes de vie (tabac, alcool, sport)
- ✅ Détection automatique des doublons (par carte nationale + nom/prénom/date)
- ✅ Recherche multi-critères
- ✅ Fusion de dossiers

### Gestion Médicale du Cancer
- ✅ Enregistrement des diagnostics (Type Solide/Liquide, sous-type, stade)
- ✅ Rapport anatomopathologique
- ✅ Anomalies génétiques (cancer liquide)
- ✅ Historique des cancers par patient
- ✅ Décisions RCP

### Traitement & Suivi
- ✅ Ajout de traitements (chirurgie, chimio, radio, immuno...)
- ✅ Mise à jour du statut (En traitement / Guéri / Décédé)
- ✅ Planification des rendez-vous
- ✅ Date de décès

### Tableau de Bord & Statistiques
- ✅ Dashboard interactif avec KPIs
- ✅ Évolution mensuelle des cas (12 mois)
- ✅ Répartition par type, sexe, âge, stade, wilaya
- ✅ Taux de guérison et mortalité
- ✅ Top sous-types de cancer

### SIG Géographique
- ✅ Visualisation par wilaya
- ✅ Classement des zones à forte incidence
- ✅ Prêt pour l'intégration Leaflet.js

### Sécurité & Administration
- ✅ Authentification JWT
- ✅ Gestion des rôles (Admin, Médecin, Laboratoire, Épidémiologie)
- ✅ Journal d'audit de toutes les actions
- ✅ Gestion des utilisateurs

---

## 🚀 Installation

### Prérequis
- Node.js >= 18
- MySQL >= 8.0
- npm >= 9

### 1. Cloner le projet
```bash
git clone <repo>
cd cancer-registry
```

### 2. Configuration Base de Données MySQL
```sql
CREATE DATABASE cancer_registry CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 3. Backend
```bash
cd backend
npm install

# Copier et configurer l'environnement
cp .env.example .env
# Éditer .env avec vos paramètres MySQL

npm run dev
# Le serveur démarre sur http://localhost:5000
# La base de données est initialisée automatiquement
```

### 4. Frontend
```bash
cd frontend
npm install
npm start
# L'application démarre sur http://localhost:3000
```

---

## 🔐 Compte par Défaut

| Rôle | Email | Mot de passe |
|------|-------|-------------|
| Administrateur | admin@registre-cancer.dz | Admin@2024 |

---

## 📁 Structure du Projet

```
cancer-registry/
├── backend/
│   ├── config/
│   │   └── database.js          # Connexion MySQL + initialisation
│   ├── controllers/
│   │   ├── authController.js    # Authentification
│   │   ├── usersController.js   # Gestion utilisateurs
│   │   ├── patientsController.js # Gestion patients
│   │   ├── casesController.js   # Cas de cancer
│   │   └── statsController.js   # Statistiques
│   ├── middleware/
│   │   └── auth.js              # JWT + audit log
│   ├── routes/
│   │   └── index.js             # Toutes les routes API
│   ├── server.js                # Point d'entrée
│   └── .env.example
│
└── frontend/
    └── src/
        ├── context/
        │   └── AuthContext.js   # Contexte auth global
        ├── pages/
        │   ├── Dashboard.js     # Tableau de bord
        │   ├── Patients.js      # Liste patients
        │   ├── PatientForm.js   # Formulaire patient
        │   ├── PatientDetail.js # Fiche patient
        │   ├── CasCancer.js     # Liste cas
        │   ├── CasForm.js       # Nouveau cas
        │   ├── CasDetail.js     # Détail dossier
        │   ├── Statistiques.js  # Graphiques épidémio
        │   ├── CarteSIG.js      # Carte géographique
        │   ├── Utilisateurs.js  # Admin utilisateurs
        │   ├── AuditLogs.js     # Journal audit
        │   └── RendezVous.js    # Rendez-vous
        ├── components/
        │   └── Layout.js        # Sidebar + topbar
        └── utils/
            └── api.js           # Client API Axios
```

---

## 🌐 API Endpoints

### Auth
- `POST /api/auth/login` — Connexion
- `GET /api/auth/profile` — Profil utilisateur
- `PUT /api/auth/password` — Changer mot de passe

### Patients
- `GET /api/patients` — Liste (search, sexe, wilaya)
- `GET /api/patients/:id` — Détail complet
- `POST /api/patients` — Créer (avec détection doublons)
- `PUT /api/patients/:id` — Modifier
- `DELETE /api/patients/:id` — Supprimer
- `POST /api/patients/merge` — Fusionner deux dossiers

### Cas de Cancer
- `GET /api/cases` — Liste (filtres type, état, statut, wilaya)
- `GET /api/cases/:id` — Détail + traitements + RDV
- `GET /api/cases/patient/:id` — Cas par patient
- `POST /api/cases` — Nouveau diagnostic
- `PUT /api/cases/:id` — Mettre à jour
- `POST /api/traitements` — Ajouter traitement
- `POST /api/rendez-vous` — Planifier RDV

### Statistiques
- `GET /api/stats/dashboard` — Tous les KPIs et graphiques
- `GET /api/stats/audit` — Journal d'audit (admin)

### Utilisateurs (admin)
- `GET /api/users` — Liste utilisateurs
- `POST /api/users` — Créer
- `PUT /api/users/:id` — Modifier
- `DELETE /api/users/:id` — Désactiver

---

## 🔧 Variables d'Environnement (.env)

```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=votre_password
DB_NAME=cancer_registry
JWT_SECRET=clé_secrète_complexe
FRONTEND_URL=http://localhost:3000
```

---

## 🗃️ Schéma Base de Données

### Tables
- **users** — Utilisateurs du système
- **patients** — Données patients + habitudes de vie
- **cancer_cases** — Dossiers oncologiques
- **traitements** — Traitements associés aux cas
- **rendez_vous** — Planification des RDV
- **audit_logs** — Journal de toutes les actions

---

## 📈 Évolutions Futures

- [ ] Intégration Leaflet.js pour carte interactive
- [ ] OCR pour scan de rapports biologiques
- [ ] Reconnaissance vocale
- [ ] Import CSV/Excel bulk
- [ ] Application mobile patient
- [ ] Module IA détection anomalies
- [ ] Export PDF rapports
- [ ] Notifications email/SMS

---

*Développé pour la gestion du registre du cancer en Algérie.*
