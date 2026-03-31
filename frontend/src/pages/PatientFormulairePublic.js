import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getPublicPatient, submitPublicHabitudes } from '../utils/api';
import toast, { Toaster } from 'react-hot-toast';

export default function PatientFormulairePublic() {
  const { id } = useParams();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [formData, setFormData] = useState({
    fumeur: false,
    alcool: false,
    activite_sportive: false,
    alimentation: '',
    antecedents_familiaux: ''
  });

  useEffect(() => {
    getPublicPatient(id)
      .then(res => setPatient(res.data))
      .catch(() => toast.error("Patient introuvable ou lien invalide"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await submitPublicHabitudes(id, formData);
      setSubmitted(true);
    } catch (error) {
      toast.error("Erreur lors de l'envoi des données");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div style={styles.center}><div className="spinner"></div></div>;
  if (!patient && !loading) return <div style={styles.center}><h3>Ce lien est invalide ou expiré.</h3></div>;

  if (submitted) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={{ fontSize: 50, textAlign: 'center', marginBottom: 20 }}>✅</div>
          <h2 style={{ textAlign: 'center', color: '#16a34a' }}>Merci {patient.prenom} !</h2>
          <p style={{ textAlign: 'center', color: '#475569', marginTop: 10 }}>Vos informations ont été enregistrées avec succès dans votre dossier médical. Vous pouvez fermer cette page.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <Toaster position="top-center" />
      <div style={styles.card}>
        <div style={styles.header}>
          <h2>Dossier Médical</h2>
          <p style={styles.subtitle}>Formulaire sécurisé pour <strong>{patient.prenom} {patient.nom}</strong></p>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          
          <div style={styles.sectionTitle}>Habitudes de vie</div>
          
          <label style={styles.toggleRow}>
            <span>🚬 Êtes-vous fumeur(se) ?</span>
            <input type="checkbox" checked={formData.fumeur} onChange={e => setFormData({ ...formData, fumeur: e.target.checked })} style={styles.checkbox} />
          </label>

          <label style={styles.toggleRow}>
            <span>🍷 Consommez-vous de l'alcool ?</span>
            <input type="checkbox" checked={formData.alcool} onChange={e => setFormData({ ...formData, alcool: e.target.checked })} style={styles.checkbox} />
          </label>

          <label style={styles.toggleRow}>
            <span>🏃 Pratiquez-vous une activité sportive régulière ?</span>
            <input type="checkbox" checked={formData.activite_sportive} onChange={e => setFormData({ ...formData, activite_sportive: e.target.checked })} style={styles.checkbox} />
          </label>

          <div style={styles.inputGroup}>
            <label style={styles.label}>🍽️ Décrivez vos habitudes alimentaires</label>
            <textarea 
              style={styles.textarea} 
              rows="3" 
              placeholder="Ex: Régime équilibré, riche en sucre, végétarien, végétalien..."
              value={formData.alimentation}
              onChange={e => setFormData({ ...formData, alimentation: e.target.value })}
            />
          </div>

          <div style={styles.sectionTitle}>Antécédents</div>
          
          <div style={styles.inputGroup}>
            <label style={styles.label}>👨‍👩‍👧‍👦 Antécédents médicaux familiaux</label>
            <textarea 
              style={styles.textarea} 
              rows="4" 
              placeholder="Ex: Mère cancer du sein à 50 ans, père diabétique..."
              value={formData.antecedents_familiaux}
              onChange={e => setFormData({ ...formData, antecedents_familiaux: e.target.value })}
            />
            <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>Détaillez si des membres de votre famille (parents, frères, sœurs) ont eu des cancers ou d'autres maladies importantes.</p>
          </div>

          <button type="submit" style={styles.button} disabled={submitting}>
            {submitting ? 'Envoi...' : 'Enregistrer mes informations'}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  center: {
    display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', fontFamily: 'sans-serif', background: '#f8fafc'
  },
  container: {
    minHeight: '100vh',
    background: '#f1f5f9',
    padding: '20px 15px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start',
    fontFamily: "'Inter', 'Segoe UI', sans-serif"
  },
  card: {
    background: 'white',
    width: '100%',
    maxWidth: 500,
    borderRadius: 16,
    boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
    padding: 24,
    marginTop: 20
  },
  header: {
    borderBottom: '1px solid #e2e8f0',
    paddingBottom: 16,
    marginBottom: 20,
    textAlign: 'center'
  },
  subtitle: {
    color: '#64748b',
    fontSize: 14,
    marginTop: 8
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: '#0f4c81',
    marginTop: 10,
    borderBottom: '2px solid #e2e8f0',
    paddingBottom: 8
  },
  toggleRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    background: '#f8fafc',
    borderRadius: 10,
    border: '1px solid #e2e8f0',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: 14,
    color: '#334155'
  },
  checkbox: {
    width: 20,
    height: 20,
    accentColor: '#0f4c81',
    cursor: 'pointer'
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6
  },
  label: {
    fontWeight: 600,
    fontSize: 14,
    color: '#334155'
  },
  textarea: {
    width: '100%',
    padding: 12,
    borderRadius: 10,
    border: '1px solid #cbd5e1',
    fontSize: 14,
    fontFamily: 'inherit',
    resize: 'vertical',
    outline: 'none',
    boxSizing: 'border-box'
  },
  button: {
    background: '#0f4c81',
    color: 'white',
    border: 'none',
    padding: 16,
    borderRadius: 10,
    fontSize: 16,
    fontWeight: 700,
    cursor: 'pointer',
    marginTop: 10,
    boxShadow: '0 2px 10px rgba(15,76,129,0.2)'
  }
};
