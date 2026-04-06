import React, { useState } from 'react';

const DICTIONARY_DATA = {
  "État du Dossier": [
    { code: "0", label: "En cours" },
    { code: "1", label: "Validé" },
    { code: "2", label: "Supprimé" }
  ],
  "Contrôles": [
    { code: "0", label: "Non fait" },
    { code: "1", label: "Fait: OK" },
    { code: "2", label: "Fait: Rare" },
    { code: "3", label: "Fait: Non valide" }
  ],
  "Doublons": [
    { code: "0", label: "Non fait" },
    { code: "1", label: "Fait: OK" },
    { code: "2", label: "Fait: Prim. Mult." },
    { code: "3", label: "Fait: Doublon" }
  ],
  "Localisation (CIM-10)": [
    { code: "00", label: "LEVRE" },
    { code: "01", label: "BASE DE LA LANGUE" },
    { code: "02", label: "LANGUE" },
    { code: "03", label: "GENCIVE" },
    { code: "04", label: "BOUCHE - PLANCHER" },
    { code: "05", label: "BOUCHE - PALAIS" },
    { code: "06", label: "BOUCHE - AUTRES" },
    { code: "07", label: "BOUCHE - PAROTID" },
    { code: "08", label: "BOUCHE - GLANDE" },
    { code: "09", label: "AMYGDALES" },
    { code: "10", label: "OROPHARYNX" },
    { code: "11", label: "NASOPHARYNX" },
    { code: "12", label: "SINUS PIRIFORME" },
    { code: "13", label: "HYPOPHARYNX" },
    { code: "14", label: "PHARYNX" },
    { code: "15", label: "OESOPHAGE" },
    { code: "16", label: "ESTOMAC" },
    { code: "17", label: "INTESTIN GRELE" },
    { code: "18", label: "COLON" },
    { code: "19", label: "RECTO-SIGMOIDE" },
    { code: "20", label: "RECTUM" },
    { code: "21", label: "ANUS" },
    { code: "22", label: "FOIE" },
    { code: "23", label: "VES. BILIAIRE" },
    { code: "24", label: "VOIES BILIAIRES" },
    { code: "25", label: "PANCREAS" },
    { code: "26", label: "APP. DIGESTIF" },
    { code: "30", label: "OREILLE/NEZ" },
    { code: "31", label: "SINUS" },
    { code: "32", label: "GLOTTE" },
    { code: "33", label: "TRACHEE" },
    { code: "34", label: "BRONCHES" },
    { code: "37", label: "THYMUS" },
    { code: "38", label: "COEUR" },
    { code: "39", label: "APP. RESPIRAT." },
    { code: "40", label: "OS membres" },
    { code: "41", label: "OS crâne,tronc" },
    { code: "42", label: "SANG" },
    { code: "44", label: "PEAU" },
    { code: "47", label: "NERFS" },
    { code: "48", label: "PERITOINE" },
    { code: "49", label: "TISSUS MOUS" },
    { code: "50", label: "SEIN" },
    { code: "51", label: "VULVE" },
    { code: "52", label: "VAGIN" },
    { code: "53", label: "COL UTERIN" },
    { code: "54", label: "CORPS UTERIN" },
    { code: "55", label: "UTERUS" },
    { code: "56", label: "OVAIRE" },
    { code: "57", label: "ORG.GEN.FEM." },
    { code: "58", label: "PLACENTA" },
    { code: "60", label: "PENIS" },
    { code: "61", label: "PROSTATE" },
    { code: "62", label: "TESTICULE" },
    { code: "63", label: "ORG.GEN.MASC." },
    { code: "64", label: "REIN" },
    { code: "65", label: "BASSINET" },
    { code: "66", label: "URETERE" },
    { code: "67", label: "VESSIE" },
    { code: "68", label: "URETRE" },
    { code: "69", label: "OEIL" },
    { code: "70", label: "MENINGES" },
    { code: "71", label: "CERVEAU" },
    { code: "72", label: "SYST.NERVEUX" },
    { code: "73", label: "THYROIDE" },
    { code: "74", label: "SURRENALE" },
    { code: "75", label: "GL.ENDOCRINES" },
    { code: "76", label: "SITES GENERAUX" },
    { code: "77", label: "GGL LYMPHATIQUE" },
    { code: "80", label: "SITE INCONNU" },
    { code: "000", label: "C00.0 Lèvre supérieure, bord libre" },
    { code: "001", label: "C00.1 Lèvre inférieure, bord libre" },
    { code: "002", label: "C00.2 Lèvre, bord libre" },
    { code: "003", label: "C00.3 Lèvre supérieure, face interne" },
    { code: "004", label: "C00.4 Lèvre inférieure, face interne" },
    { code: "005", label: "C00.5 Lèvre, face interne" },
    { code: "006", label: "C00.6 Commissure des lèvres" },
    { code: "008", label: "C00.8 Loc. contiguës de la lèvre" },
    { code: "009", label: "C00.9 Lèvre SAI" },
    { code: "019", label: "C01.9 Base de la langue" },
    { code: "020", label: "C02.0 Face dorsale de la langue" },
    { code: "021", label: "C02.1 Bord latéral de la langue" },
    { code: "022", label: "C02.2 Face inférieure de la langue" },
    { code: "023", label: "C02.3 2/3 antérieurs de la langue SAI" },
    { code: "024", label: "C02.4 Amygdale linguale" },
    { code: "189", label: "C18.9 Côlon SAI" },
    { code: "509", label: "C50.9 Sein SAI" },
    { code: "809", label: "C80.9 Site primitif inconnu" }
  ],
  "Morphologie (ICD-O)": [
    { code: "8000", label: "Neoplasm, malignant" },
    { code: "8010", label: "Carcinoma, NOS" },
    { code: "8041", label: "Small cell carcinoma, NOS" },
    { code: "8070", label: "Squamous cell carcinoma, NOS" },
    { code: "8140", label: "Adenocarcinoma, NOS" },
    { code: "8170", label: "Hepatocellular carcinoma, NOS" },
    { code: "8200", label: "Adenoid cystic carcinoma" },
    { code: "8240", label: "Carcinoid tumor, NOS" },
    { code: "8440", label: "Cystadenocarcinoma, NOS" },
    { code: "8500", label: "Infiltrating duct carcinoma, NOS" },
    { code: "8520", label: "Lobular carcinoma, NOS" },
    { code: "8800", label: "Sarcoma, NOS" },
    { code: "8720", label: "Malignant melanoma, NOS" },
    { code: "9140", label: "Kaposi sarcoma" },
    { code: "9590", label: "Malignant lymphoma, NOS" },
    { code: "9800", label: "Leukemia, NOS" }
  ],
  "Comportement": [
    { code: "0", label: "Tm Bénigne" },
    { code: "1", label: "Tm de bénignité ou de malignité non assurée" },
    { code: "2", label: "Carcinome In situ" },
    { code: "3", label: "Tm maligne primitive" },
    { code: "6", label: "Métastase" },
    { code: "9", label: "Tm maligne de nature primitive ou secondaire non assurée" }
  ],
  "Sexe": [
    { code: "1", label: "Masculin" },
    { code: "2", label: "Féminin" },
    { code: "9", label: "Inconnu" }
  ],
  "Stade": [
    { code: "1", label: "Local" },
    { code: "2", label: "Locorégional" },
    { code: "3", label: "Métastases" },
    { code: "9", label: "Indéterminé" }
  ],
  "Base de diagnostic": [
    { code: "0", label: "Cert Décès seulement" },
    { code: "1", label: "Clinique seulement" },
    { code: "2", label: "Clinique et Imagerie" },
    { code: "3", label: "Chirurgie/Autopsie exploratrice" },
    { code: "4", label: "Marqueurs Tumoraux spécifiques" },
    { code: "5", label: "Cytologie" },
    { code: "6", label: "Histopathologie métastase" },
    { code: "7", label: "Histopathologie primitive" },
    { code: "8", label: "Autopsie/histologie" },
    { code: "9", label: "Inconnue" }
  ]
};

export default function MedicalDictionary({ isOpen, onClose }) {
  const [activeCategory, setActiveCategory] = useState(Object.keys(DICTIONARY_DATA)[0]);
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  const filteredData = DICTIONARY_DATA[activeCategory].filter(item => 
    item.label.toLowerCase().includes(search.toLowerCase()) || 
    item.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 9999 }}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '900px', height: '80vh' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ background: 'var(--primary)', color: 'white', padding: 8, borderRadius: 10 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
            </div>
            <div>
              <h3 style={{ margin: 0 }}>Dictionnaire Médical</h3>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)' }}>Référentiel des codes et localisations</p>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose}>×</button>
        </div>

        <div style={{ display: 'flex', height: 'calc(100% - 150px)' }}>
          {/* Sidebar categories */}
          <div style={{ width: '240px', background: '#f8fafc', borderRight: '1px solid #e2e8f0', padding: '16px', overflowY: 'auto' }}>
            {Object.keys(DICTIONARY_DATA).map(cat => (
              <button 
                key={cat} 
                onClick={() => { setActiveCategory(cat); setSearch(''); }}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: 'none',
                  background: activeCategory === cat ? 'var(--primary)' : 'transparent',
                  color: activeCategory === cat ? 'white' : 'var(--text-secondary)',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                  marginBottom: '4px',
                  transition: 'all 0.2s'
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Content area */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid #e2e8f0' }}>
              <div className="search-bar" style={{ width: '100%' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <input 
                  type="text" 
                  placeholder={`Rechercher dans ${activeCategory}...`} 
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '12px' }}>
                {filteredData.map((item, i) => (
                  <div key={i} style={{ 
                    padding: '12px 16px', 
                    background: 'white', 
                    border: '1px solid #e2e8f0', 
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                  }}>
                    <span style={{ 
                      minWidth: '40px', 
                      height: '24px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      background: '#f1f5f9',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: 800,
                      color: 'var(--primary)'
                    }}>{item.code}</span>
                    <span style={{ fontSize: '13px', color: 'var(--text)', fontWeight: 500 }}>{item.label}</span>
                  </div>
                ))}
              </div>
              {filteredData.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  Aucun résultat trouvé pour "{search}"
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-outline" onClick={onClose}>Fermer</button>
        </div>
      </div>
    </div>
  );
}
