import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import api from '../utils/api';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
}

function formatDateTime(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function AnapathCompteRendu() {
  const { anapathId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAnapath = user?.role?.toLowerCase() === 'anapath';

  const [info, setInfo] = useState(null);
  const [cr, setCr] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const [form, setForm] = useState({
    observation: '',
    diagnostic: '',
    conclusion: '',
    statut: 'brouillon',
  });

  // Load prélèvement info + existing CR
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const infoRes = await api.get(`/anapath/${anapathId}/info`);
      setInfo(infoRes.data);

      try {
        const crRes = await api.get(`/anapath/${anapathId}/compte-rendu`);
        setCr(crRes.data);
        setForm({
          observation: crRes.data.observation || '',
          diagnostic: crRes.data.diagnostic || '',
          conclusion: crRes.data.conclusion || '',
          statut: crRes.data.statut || 'brouillon',
        });
      } catch (e) {
        // 404 = no CR yet, that's fine
        setCr(null);
      }
    } catch (e) {
      toast.error('Erreur de chargement du prélèvement');
      navigate('/anapath/prelevements');
    } finally {
      setLoading(false);
    }
  }, [anapathId, navigate]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setDirty(true);
  };

  // Save as draft
  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      if (cr) {
        await api.put(`/anapath/compte-rendu/${cr.id}`, { ...form, statut: 'brouillon' });
        toast.success('Brouillon enregistré');
      } else {
        const res = await api.post('/anapath/compte-rendu', {
          anapath_id: anapathId,
          patient_id: info.patient_id,
          case_id: info.case_id,
          ...form,
          statut: 'brouillon',
        });
        setCr({ id: res.data.id, statut: 'brouillon' });
        toast.success('Compte rendu créé (brouillon)');
      }
      setDirty(false);
      setForm(prev => ({ ...prev, statut: 'brouillon' }));
    } catch (e) {
      toast.error('Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  // Validate
  const handleValidate = async () => {
    if (!form.observation?.trim() && !form.diagnostic?.trim() && !form.conclusion?.trim()) {
      toast.error('Veuillez remplir au moins un champ avant de valider.');
      return;
    }
    if (!window.confirm('Voulez-vous valider définitivement ce compte rendu ?\n\nUne fois validé, le statut passera à « Validé ».')) return;

    setSaving(true);
    try {
      if (!cr) {
        // Create first, then validate
        const res = await api.post('/anapath/compte-rendu', {
          anapath_id: anapathId,
          patient_id: info.patient_id,
          case_id: info.case_id,
          ...form,
          statut: 'brouillon',
        });
        await api.put(`/anapath/compte-rendu/${res.data.id}/valider`, form);
        setCr({ id: res.data.id, statut: 'validé' });
      } else {
        await api.put(`/anapath/compte-rendu/${cr.id}/valider`, form);
      }
      setForm(prev => ({ ...prev, statut: 'validé' }));
      setDirty(false);
      toast.success('✅ Compte rendu validé avec succès !');
      await loadData();
    } catch (e) {
      const msg = e.response?.data?.message || 'Erreur lors de la validation';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  // Generate PDF
  const generatePDF = () => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 20;

    // Helper for adding text with word wrap
    const addText = (text, x, yPos, fontSize, fontStyle, color = [0,0,0]) => {
      doc.setFontSize(fontSize);
      doc.setFont('helvetica', fontStyle);
      doc.setTextColor(color[0], color[1], color[2]);
      const lines = doc.splitTextToSize(text || '', pageWidth - 2 * x);
      doc.text(lines, x, yPos);
      return lines.length * (fontSize * 0.3527) + 2; // return approx height
    };

    // Header
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 76, 129); // #0f4c81
    doc.text('REGISTRE DU CANCER', pageWidth / 2, y, { align: 'center' });
    y += 10;
    
    doc.setFontSize(16);
    doc.setTextColor(50, 50, 50);
    doc.text('COMPTE RENDU ANATOMOPATHOLOGIQUE', pageWidth / 2, y, { align: 'center' });
    y += 15;

    // Patient Info box
    doc.setDrawColor(200, 200, 200);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(15, y, pageWidth - 30, 45, 3, 3, 'FD');
    
    y += 8;
    addText(`Patient: ${info.nom} ${info.prenom}`, 20, y, 11, 'bold');
    addText(`Matricule: ${info.matricule || '—'}`, 120, y, 10, 'normal');
    y += 8;
    addText(`Sexe: ${info.sexe === 'M' ? 'Masculin' : 'Féminin'}`, 20, y, 10, 'normal');
    addText(`Né(e) le: ${formatDate(info.date_naissance)}`, 120, y, 10, 'normal');
    y += 8;
    addText(`Date du prélèvement: ${formatDate(info.date_prelevement)}`, 20, y, 10, 'normal');
    y += 8;
    addText(`Type: ${info.type_prelevement || '—'}`, 20, y, 10, 'normal');
    addText(`Localisation: ${info.localisation || '—'}`, 120, y, 10, 'normal');
    y += 18;

    // Medical Info
    y += addText('1. OBSERVATION', 15, y, 12, 'bold', [15, 76, 129]);
    y += addText(form.observation || 'Aucune observation saisie.', 15, y, 10, 'normal', [50, 50, 50]) + 10;

    if (y > 250) { doc.addPage(); y = 20; }
    y += addText('2. DIAGNOSTIC', 15, y, 12, 'bold', [15, 76, 129]);
    y += addText(form.diagnostic || 'Aucun diagnostic saisi.', 15, y, 10, 'normal', [50, 50, 50]) + 10;

    if (y > 250) { doc.addPage(); y = 20; }
    y += addText('3. CONCLUSION', 15, y, 12, 'bold', [15, 76, 129]);
    y += addText(form.conclusion || 'Aucune conclusion saisie.', 15, y, 10, 'normal', [50, 50, 50]) + 15;

    // Footer signature
    if (form.statut === 'validé' && cr?.validated_at) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Fait le ${formatDate(cr.validated_at)}`, pageWidth - 20, y, { align: 'right' });
      y += 6;
      doc.setFont('helvetica', 'bold');
      const validator = cr.validated_by_nom ? `Dr. ${cr.validated_by_prenom} ${cr.validated_by_nom}` : 'Pathologiste';
      doc.text(validator, pageWidth - 20, y, { align: 'right' });
      y += 6;
      doc.setFont('helvetica', 'italic');
      doc.text('Document validé électroniquement', pageWidth - 20, y, { align: 'right' });
    } else {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(200, 0, 0);
      doc.text('DOCUMENT NON VALIDÉ (Brouillon)', pageWidth / 2, y, { align: 'center' });
    }

    doc.save(`CR_Anapath_${info.matricule || 'Patient'}_${info.date_prelevement ? info.date_prelevement.split('T')[0] : 'Doc'}.pdf`);
  };

  const isValidated = form.statut === 'validé';

  if (loading) {
    return (
      <Layout title="Compte Rendu Anapath">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400, gap: 12 }}>
          <div className="spinner" />
          <span style={{ color: '#64748b', fontWeight: 600 }}>Chargement...</span>
        </div>
      </Layout>
    );
  }

  if (!info) return null;

  return (
    <Layout title="Compte Rendu Anatomopathologique">
      <div style={{ padding: '0 0 40px', maxWidth: 960, margin: '0 auto' }}>

        {/* ── Top Bar ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          {/* ── Back Button ── */}
          <button
            onClick={() => {
              if (dirty && !window.confirm('Des modifications non enregistrées seront perdues. Continuer ?')) return;
              navigate('/anapath/prelevements');
            }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '8px 16px', borderRadius: 8, border: '1.5px solid #e2e8f0',
              background: 'white', color: '#475569', cursor: 'pointer', fontSize: 13,
              fontWeight: 600, fontFamily: 'Sora, sans-serif',
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#94a3b8'; e.currentTarget.style.background = '#f8fafc'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = 'white'; }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Retour à la liste
          </button>

          {/* ── Download PDF Button ── */}
          <button
            onClick={generatePDF}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '8px 16px', borderRadius: 8, border: 'none',
              background: '#0f4c81', color: 'white', cursor: 'pointer', fontSize: 13,
              fontWeight: 600, fontFamily: 'Sora, sans-serif',
              boxShadow: '0 2px 8px rgba(15,76,129,0.25)', transition: 'all 0.2s'
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(15,76,129,0.35)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(15,76,129,0.25)'; }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Télécharger PDF
          </button>
        </div>

        {/* ── Header ── */}
        <div style={{
          background: 'linear-gradient(135deg, #1e293b 0%, #0f4c81 100%)',
          borderRadius: 16, padding: '28px 32px', marginBottom: 24,
          boxShadow: '0 8px 32px rgba(15,76,129,0.25)',
          position: 'relative', overflow: 'hidden'
        }}>
          {/* Decorative circle */}
          <div style={{
            position: 'absolute', right: -30, top: -30,
            width: 140, height: 140, borderRadius: '50%',
            background: 'rgba(255,255,255,0.04)'
          }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 1 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: 'rgba(255,255,255,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10 9 9 9 8 9" />
                  </svg>
                </div>
                <div>
                  <h1 style={{ color: 'white', fontSize: 20, fontWeight: 800, margin: 0, fontFamily: 'Outfit, sans-serif' }}>
                    Compte Rendu Anatomopathologique
                  </h1>
                  <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12.5, margin: 0, marginTop: 2 }}>
                    Prélèvement du {formatDate(info.date_prelevement)}
                  </p>
                </div>
              </div>

              {/* Patient info row */}
              <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                <InfoChip label="Patient" value={`${info.nom} ${info.prenom}`} />
                <InfoChip label="Matricule" value={info.matricule || '—'} mono />
                <InfoChip label="Type" value={info.type_prelevement || '—'} />
                <InfoChip label="Localisation" value={info.localisation || '—'} />
                <InfoChip label="Histologie" value={info.type_histologique || '—'} />
              </div>
            </div>

            {/* Status badge */}
            <div style={{
              padding: '10px 18px', borderRadius: 12,
              background: isValidated ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)',
              border: `1px solid ${isValidated ? 'rgba(16,185,129,0.4)' : 'rgba(245,158,11,0.4)'}`,
              textAlign: 'center', minWidth: 100
            }}>
              <div style={{
                fontSize: 13, fontWeight: 800,
                color: isValidated ? '#34d399' : '#fbbf24',
                textTransform: 'uppercase', letterSpacing: 0.5
              }}>
                {isValidated ? '✓ Validé' : '⏳ Brouillon'}
              </div>
              {isValidated && cr?.validated_at && (
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10.5, marginTop: 4 }}>
                  {formatDateTime(cr.validated_at)}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Prélèvement Details Card ── */}
        <div style={{
          background: 'white', borderRadius: 14, border: '1px solid #e2e8f0',
          padding: '20px 24px', marginBottom: 24,
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
        }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 700, color: '#475569', display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2">
              <path d="M9 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8" />
              <polyline points="8 3 8 8 3 8" />
            </svg>
            Informations du prélèvement
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            <DetailItem label="Sexe" value={info.sexe === 'M' ? 'Masculin' : 'Féminin'} />
            <DetailItem label="Date de naissance" value={formatDate(info.date_naissance)} />
            <DetailItem label="Type de cancer" value={info.sous_type || info.type_cancer} />
            <DetailItem label="Stade" value={info.stade || '—'} />
            <DetailItem label="Pathologiste" value={info.pathologiste || '—'} />
            <DetailItem label="HER2 / ER / PR" value={`${info.her2 || '—'} / ${info.er || '—'} / ${info.pr || '—'}`} />
            <DetailItem label="Grade SBR" value={info.grade_sbr || '—'} />
            <DetailItem label="Ki-67" value={info.ki67 || '—'} />
          </div>
        </div>

        {/* ── Form ── */}
        <div style={{
          background: 'white', borderRadius: 14, border: '1px solid #e2e8f0',
          padding: '28px 28px 20px', marginBottom: 24,
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
        }}>
          <h3 style={{ margin: '0 0 24px', fontSize: 15, fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0f4c81" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            Rédaction du Compte Rendu
            {dirty && <span style={{ fontSize: 11, color: '#f59e0b', fontWeight: 600, marginLeft: 8 }}>● Modifications non enregistrées</span>}
          </h3>

          <TextAreaField
            id="cr-observation"
            label="Observation macroscopique & microscopique"
            placeholder="Décrivez l'aspect macroscopique de la pièce, les dimensions, la consistance, puis l'analyse microscopique (architecture, type cellulaire, nécrose, index mitotique...)."
            value={form.observation}
            onChange={v => handleChange('observation', v)}
            rows={6}
            disabled={isValidated}
          />

          <TextAreaField
            id="cr-diagnostic"
            label="Diagnostic anatomopathologique"
            placeholder="Formulez le diagnostic histopathologique final : type histologique, grade, stade pTNM, marges, envahissements, biomarqueurs..."
            value={form.diagnostic}
            onChange={v => handleChange('diagnostic', v)}
            rows={5}
            disabled={isValidated}
          />

          <TextAreaField
            id="cr-conclusion"
            label="Conclusion"
            placeholder="Résumez les conclusions principales, les recommandations et les examens complémentaires éventuels à prévoir."
            value={form.conclusion}
            onChange={v => handleChange('conclusion', v)}
            rows={4}
            disabled={isValidated}
          />
        </div>

        {/* ── Actions ── */}
        {!isValidated && (
          <div style={{
            display: 'flex', justifyContent: 'flex-end', gap: 12,
            padding: '16px 0'
          }}>
            <button
              onClick={handleSaveDraft}
              disabled={saving}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '12px 24px', borderRadius: 10, border: '1.5px solid #e2e8f0',
                background: 'white', color: '#475569', cursor: saving ? 'not-allowed' : 'pointer',
                fontSize: 13.5, fontWeight: 700, fontFamily: 'Sora, sans-serif',
                transition: 'all 0.2s', opacity: saving ? 0.6 : 1
              }}
              onMouseEnter={e => { if (!saving) { e.currentTarget.style.borderColor = '#94a3b8'; e.currentTarget.style.background = '#f8fafc'; } }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = 'white'; }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                <polyline points="17 21 17 13 7 13 7 21" />
                <polyline points="7 3 7 8 15 8" />
              </svg>
              {saving ? 'Enregistrement...' : '💾 Enregistrer brouillon'}
            </button>

            {isAnapath && (
              <button
                onClick={handleValidate}
                disabled={saving}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '12px 24px', borderRadius: 10, border: 'none',
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  color: 'white', cursor: saving ? 'not-allowed' : 'pointer',
                  fontSize: 13.5, fontWeight: 700, fontFamily: 'Sora, sans-serif',
                  boxShadow: '0 4px 14px rgba(16,185,129,0.35)',
                  transition: 'all 0.2s', opacity: saving ? 0.6 : 1
                }}
                onMouseEnter={e => { if (!saving) e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                {saving ? 'Validation...' : '✅ Valider le rapport'}
              </button>
            )}
          </div>
        )}

        {isValidated && (
          <div style={{
            background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12,
            padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 14
          }}>
            <div style={{
              width: 42, height: 42, borderRadius: '50%',
              background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div>
              <div style={{ fontWeight: 700, color: '#15803d', fontSize: 14 }}>
                Compte rendu validé
              </div>
              <div style={{ color: '#166534', fontSize: 12.5, marginTop: 2 }}>
                Validé le {formatDateTime(cr?.validated_at)}
                {cr?.validated_by_nom && ` par ${cr.validated_by_prenom} ${cr.validated_by_nom}`}
              </div>
            </div>
          </div>
        )}

      </div>
    </Layout>
  );
}

// ── Sub-components ──

function InfoChip({ label, value, mono }) {
  return (
    <div>
      <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
        {label}
      </div>
      <div style={{
        color: 'white', fontSize: 13, fontWeight: 600, marginTop: 2,
        fontFamily: mono ? 'monospace' : 'inherit'
      }}>
        {value}
      </div>
    </div>
  );
}

function DetailItem({ label, value }) {
  return (
    <div>
      <div style={{ color: '#94a3b8', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
        {label}
      </div>
      <div style={{ color: '#1e293b', fontSize: 13.5, fontWeight: 600, marginTop: 4 }}>
        {value}
      </div>
    </div>
  );
}

function TextAreaField({ id, label, placeholder, value, onChange, rows, disabled }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom: 20 }}>
      <label htmlFor={id} style={{
        display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 700,
        color: '#334155'
      }}>
        {label}
      </label>
      <textarea
        id={id}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        disabled={disabled}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: '100%', padding: '12px 16px',
          border: `1.5px solid ${focused ? '#3b82f6' : '#e2e8f0'}`,
          borderRadius: 10, fontSize: 13.5, fontFamily: 'Sora, sans-serif',
          lineHeight: 1.7, resize: 'vertical', outline: 'none',
          background: disabled ? '#f8fafc' : 'white',
          color: disabled ? '#64748b' : '#1e293b',
          transition: 'border-color 0.2s',
          boxSizing: 'border-box',
          cursor: disabled ? 'not-allowed' : 'text'
        }}
      />
    </div>
  );
}
