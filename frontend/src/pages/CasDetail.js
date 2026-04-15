import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../utils/api';
import toast from 'react-hot-toast';

export default function CasDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [cas, setCas] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/cases/${id}`);
      setCas(res.data);
    } catch (e) {
      toast.error('Erreur lors du chargement du diagnostic');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/cas-cancer');
  };

  if (loading) {
    return (
      <Layout title="Dossier Patient">
        <div className="loading-center"><div className="spinner" /></div>
      </Layout>
    );
  }

  if (!cas) {
    return (
      <Layout title="Dossier Patient">
        <div className="alert alert-error">Diagnostic introuvable.</div>
      </Layout>
    );
  }

  const diagnosticFields = [
    { label: 'Date Diagnostic', value: cas.date_diagnostic?.slice(0, 10) },
    { label: 'Type Cancer', value: `${cas.type_cancer || 'Solide'} (${cas.sous_type || 'N/A'})` },
    { label: 'Organe / Localisation', value: cas.localisation },
    { label: 'Stade Global', value: cas.stade },
    { label: 'Classification TNM', value: cas.tnm_t || cas.tnm_n || cas.tnm_m ? `T${cas.tnm_t || 'X'} N${cas.tnm_n || 'X'} M${cas.tnm_m || 'X'}` : '—' },
    { label: 'État', value: cas.etat },
    { label: 'Latéralité', value: cas.lateralite },
    { label: 'Code CIM-10', value: cas.code_cim10 },
    { label: 'Type Histologique', value: cas.type_histologique },
    { label: 'Grade Histologique', value: cas.grade_histologique },
    { label: 'Taille Tumeur', value: cas.taille_cancer ? `${cas.taille_cancer} cm` : '—' },
    { label: 'Médecin Traitant', value: cas.medecin_nom ? `Dr. ${cas.medecin_nom}` : '—' },
    { label: 'Statut Patient', value: cas.statut_patient },
  ];

  return (
    <Layout title="Diagnostic">
      {/* Header style consistent with Screenshot */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <button className="btn btn-outline" onClick={handleBack}>← Retour</button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#0f4c81', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, flexShrink: 0 }}>
            {`${cas.patient_prenom?.[0] || ''}${cas.patient_nom?.[0] || ''}`.toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#0f172a' }}>{cas.patient_prenom} {cas.patient_nom}</div>
            <div style={{ fontSize: 12, color: '#94a3b8' }}>{cas.patient_wilaya || 'Algérie'} · Diagnostic du {cas.date_diagnostic?.slice(0, 10)}</div>
          </div>
        </div>
        <button className="btn btn-outline btn-sm" onClick={() => navigate(`/patients/${cas.patient_id}`)}>
          Voir la fiche patient →
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Diagnostic Information Card style from Screenshot */}
        <div className="card" style={{ border: '2px solid #bae6fd' }}>
          <div className="card-header" style={{ background: '#f0f9ff' }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              📋 Détails du Diagnostic
            </h2>
          </div>
          <div className="card-body">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ background: '#f1f5f9' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', width: '30%' }}>Champ</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Information</th>
                </tr>
              </thead>
              <tbody>
                {diagnosticFields.map((field, i) => (
                  <tr key={i} style={{ borderTop: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: '#64748b' }}>{field.label}</td>
                    <td style={{ padding: '12px 16px', fontWeight: 700, color: '#0f172a' }}>
                      {field.label === 'Statut Patient' ? (
                        <span className={cas.statut_patient === 'En traitement' ? 'badge badge-blue' : cas.statut_patient === 'Guéri' ? 'badge badge-green' : 'badge badge-red'}>
                          {field.value}
                        </span>
                      ) : (
                        field.value || '—'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Optional: Add a section for description or decision if it exists */}
        {cas.decision_rcp && (
          <div className="card">
            <div className="card-header">
              <h2>⚖️ Décision RCP</h2>
            </div>
            <div className="card-body">
              <p style={{ color: '#334155', lineHeight: 1.6 }}>{cas.decision_rcp}</p>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
