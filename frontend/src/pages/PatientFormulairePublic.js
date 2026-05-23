import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getPublicPatient, submitPublicHabitudes } from '../utils/api';
import toast, { Toaster } from 'react-hot-toast';
import { ShieldCheck, Heart, User, Activity, AlertCircle, CheckCircle2 } from 'lucide-react';

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
    antecedents_familiaux: '',
    allergies: ''
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

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f8fafc' }}>
      <div className="spinner" style={{ width: 40, height: 40, border: '4px solid #e2e8f0', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (!patient && !loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f8fafc', padding: 20, textAlign: 'center' }}>
      <AlertCircle size={64} color="#ef4444" style={{ marginBottom: 20 }} />
      <h3 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', fontFamily: 'Outfit' }}>Lien Invalide</h3>
      <p style={{ color: '#64748b', marginTop: 10 }}>Ce lien est invalide ou a expiré. Veuillez contacter votre établissement de santé.</p>
    </div>
  );

  if (submitted) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div style={{ background: 'white', width: '100%', maxWidth: 500, borderRadius: 32, padding: 48, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.1)', textAlign: 'center' }}>
          <div style={{ width: 80, height: 80, borderRadius: 24, background: '#f0fdf4', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 32px' }}>
            <CheckCircle2 size={48} />
          </div>
          <h2 style={{ fontSize: 32, fontWeight: 900, color: '#0f172a', margin: '0 0 16px 0', fontFamily: 'Outfit' }}>Merci {patient.prenom} !</h2>
          <p style={{ fontSize: 16, color: '#64748b', lineHeight: 1.6 }}>Vos informations ont été enregistrées avec succès dans votre dossier médical sécurisé. Vous pouvez maintenant fermer cette page.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', padding: '40px 16px' }}>
      <Toaster position="top-center" />

      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        {/* Header Section */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: 'white', padding: '12px 24px', borderRadius: 100, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)', marginBottom: 24 }}>
            <ShieldCheck size={20} color="#3b82f6" />
            <span style={{ fontSize: 13, fontWeight: 800, color: '#3b82f6', letterSpacing: 0.5, textTransform: 'uppercase' }}>Portail Patient Sécurisé</span>
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 900, color: '#0f172a', margin: '0 0 12px 0', fontFamily: 'Outfit' }}>Dossier Médical</h1>
          <p style={{ fontSize: 16, color: '#64748b', margin: 0 }}>Bienvenue, <strong style={{ color: '#0f172a' }}>{patient.prenom} {patient.nom}</strong></p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* Card: Habitudes de vie */}
          <div style={{ background: 'white', borderRadius: 28, padding: 32, border: '1.5px solid #f1f5f9', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}>
                <Activity size={22} />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 900, color: '#0f172a', margin: 0 }}>Habitudes de Vie</h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <ToggleRow
                icon="🚬"
                label="Êtes-vous fumeur(se) ?"
                checked={formData.fumeur}
                onChange={v => setFormData({ ...formData, fumeur: v })}
              />
              <ToggleRow
                icon="🍷"
                label="Consommez-vous de l'alcool ?"
                checked={formData.alcool}
                onChange={v => setFormData({ ...formData, alcool: v })}
              />
              <ToggleRow
                icon="🏃"
                label="Activité sportive régulière ?"
                checked={formData.activite_sportive}
                onChange={v => setFormData({ ...formData, activite_sportive: v })}
              />
            </div>

            <div style={{ marginTop: 20 }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: '#475569', marginBottom: 8, display: 'block' }}>🥗 Régime alimentaire</label>
              <textarea
                style={styles.premiumTextarea}
                rows="3"
                placeholder="Ex: Équilibré, végétarien, riche en sel..."
                value={formData.alimentation}
                onChange={e => setFormData({ ...formData, alimentation: e.target.value })}
              />
            </div>
          </div>

          {/* Card: Antécédents & Allergies */}
          <div style={{ background: 'white', borderRadius: 28, padding: 32, border: '1.5px solid #f1f5f9', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>
                <Heart size={22} />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 900, color: '#0f172a', margin: 0 }}>Antécédents & Santé</h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 700, color: '#475569', marginBottom: 8, display: 'block' }}>👨‍👩‍👧‍👦 Antécédents familiaux</label>
                <textarea
                  style={styles.premiumTextarea}
                  rows="4"
                  placeholder="Ex: Parents diabétiques, cas de cancer dans la famille..."
                  value={formData.antecedents_familiaux}
                  onChange={e => setFormData({ ...formData, antecedents_familiaux: e.target.value })}
                />
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 700, color: '#475569', marginBottom: 8, display: 'block' }}>⚠️ Allergies connues</label>
                <textarea
                  style={styles.premiumTextarea}
                  rows="3"
                  placeholder="Médicaments, aliments, pollen..."
                  value={formData.allergies}
                  onChange={e => setFormData({ ...formData, allergies: e.target.value })}
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            style={{
              height: 64, borderRadius: 20, background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
              color: 'white', border: 'none', fontSize: 18, fontWeight: 900, cursor: 'pointer',
              boxShadow: '0 20px 25px -5px rgba(15,23,42,0.2)', transition: 'all 0.2s',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12
            }}
            disabled={submitting}
          >
            {submitting ? (
              <div className="spinner" style={{ width: 24, height: 24, border: '3px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            ) : (
              <>ENREGISTRER MON DOSSIER <CheckCircle2 size={24} /></>
            )}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 32, fontSize: 13, color: '#94a3b8' }}>
          Vos données sont chiffrées et protégées conformément au secret médical.
        </p>
      </div>
    </div>
  );
}

function ToggleRow({ icon, label, checked, onChange }) {
  return (
    <div
      onClick={() => onChange(!checked)}
      style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px',
        background: checked ? '#eff6ff' : '#f8fafc', borderRadius: 16, border: '1.5px solid',
        borderColor: checked ? '#3b82f6' : '#f1f5f9', cursor: 'pointer', transition: 'all 0.2s'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 20 }}>{icon}</span>
        <span style={{ fontSize: 14, fontWeight: 700, color: checked ? '#1e40af' : '#475569' }}>{label}</span>
      </div>
      <div style={{
        width: 44, height: 24, borderRadius: 100, background: checked ? '#3b82f6' : '#e2e8f0',
        position: 'relative', transition: 'all 0.2s'
      }}>
        <div style={{
          position: 'absolute', top: 3, left: checked ? 23 : 3, width: 18, height: 18,
          borderRadius: '50%', background: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', transition: 'all 0.2s'
        }} />
      </div>
    </div>
  );
}

const styles = {
  premiumTextarea: {
    width: '100%',
    padding: '16px',
    borderRadius: '16px',
    border: '1.5px solid #f1f5f9',
    background: '#f8fafc',
    fontSize: '15px',
    fontWeight: '500',
    fontFamily: 'inherit',
    color: '#0f172a',
    outline: 'none',
    transition: 'all 0.2s',
    resize: 'vertical',
    ':focus': {
      background: 'white',
      borderColor: '#3b82f6',
      boxShadow: '0 0 0 4px rgba(59, 130, 246, 0.1)'
    }
  }
};
