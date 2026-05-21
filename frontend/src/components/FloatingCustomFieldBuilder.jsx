import React, { useState } from 'react';
import api from '../utils/api';
import './FloatingCustomFieldBuilder.css';

const targetPages = [
  { value: 'patient', label: 'Patient' },
  { value: 'diagnostic', label: 'Diagnostic' },
  { value: 'traitement', label: 'Traitement' },
  { value: 'consultation', label: 'Consultation' },
  { value: 'laboratoire', label: 'Laboratoire' },
];

const fieldTypes = [
  { value: 'text', label: 'Texte' },
  { value: 'textarea', label: 'Zone de texte' },
  { value: 'number', label: 'Nombre' },
  { value: 'date', label: 'Date' },
  { value: 'dropdown', label: 'Liste déroulante' },
  { value: 'checkbox', label: 'Case à cocher' },
  { value: 'file', label: 'Téléversement' },
];

export default function FloatingCustomFieldBuilder() {
  const [minimized, setMinimized] = useState(false);
  const [form, setForm] = useState({
    target_page: 'patient',
    position: '',
    field_name: '',
    field_type: 'text',
    required: false,
    options: ''
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.post('/custom-fields', form);
      setMsg('Champ enregistré');
    } catch (e) {
      console.error(e);
      setMsg('Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
      setTimeout(() => setMsg(null), 3000);
    }
  };

  if (minimized) {
    return (
      <button className="floating-minimized" onClick={() => setMinimized(false)} title="Créer un champ personnalisé">
        ⚙️
      </button>
    );
  }

  return (
    <div className="floating-builder">
      <header>
        <span>Créer un champ personnalisé</span>
        <button className="close-btn" onClick={() => setMinimized(true)}>✕</button>
      </header>
      <div className="body">
        <div className="form-group">
          <label>Page cible</label>
          <select name="target_page" value={form.target_page} onChange={handleChange} className="form-control">
            {targetPages.map(p => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Position (section ou identifiant)</label>
          <input name="position" value={form.position} onChange={handleChange} className="form-control" placeholder="ex: informations_générales" />
        </div>
        <div className="form-group">
          <label>Nom du champ</label>
          <input name="field_name" value={form.field_name} onChange={handleChange} className="form-control" placeholder="Libellé affiché" />
        </div>
        <div className="form-group">
          <label>Type de champ</label>
          <select name="field_type" value={form.field_type} onChange={handleChange} className="form-control">
            {fieldTypes.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
        {form.field_type === 'dropdown' && (
          <div className="form-group">
            <label>Options (une par ligne)</label>
            <textarea name="options" value={form.options} onChange={handleChange} className="form-control" rows={3} placeholder="Option 1\nOption 2" />
          </div>
        )}
        <div className="form-group checkbox-group">
          <label>
            <input type="checkbox" name="required" checked={form.required} onChange={handleChange} />
            Champ obligatoire
          </label>
        </div>
        <button className="save-btn" onClick={handleSave} disabled={saving}>
          {saving ? 'Enregistrement...' : 'Enregistrer'}
        </button>
        {msg && <div className="msg">{msg}</div>}
      </div>
    </div>
  );
}
