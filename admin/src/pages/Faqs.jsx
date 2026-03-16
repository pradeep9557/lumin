import { useState, useEffect } from 'react';
import { getFaqs, createFaq, updateFaq, deleteFaq } from '../api';

export default function Faqs() {
  const [faqs, setFaqs] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ question: '', answer: '', order: 0 });
  const [msg, setMsg] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchFaqs = () => getFaqs().then(setFaqs).catch(console.error);
  useEffect(() => { fetchFaqs(); }, []);

  const resetForm = () => {
    setEditing(null);
    setForm({ question: '', answer: '', order: 0 });
    setMsg('');
  };

  const startEdit = (faq) => {
    setEditing(faq);
    setForm({ question: faq.question, answer: faq.answer, order: faq.order ?? 0 });
    setMsg('');
  };

  const handleSave = async () => {
    setSaving(true);
    setMsg('');
    try {
      if (editing?._id) {
        await updateFaq(editing._id, form);
      } else {
        await createFaq(form);
      }
      resetForm();
      fetchFaqs();
    } catch (e) {
      setMsg(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this FAQ?')) return;
    try {
      await deleteFaq(id);
      if (editing?._id === id) resetForm();
      fetchFaqs();
    } catch (e) {
      setMsg(e.message);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">FAQs ({faqs.length})</h1>
        <button className="btn btn-primary" onClick={resetForm}>+ New FAQ</button>
      </div>

      <div className="two-col">
        <div className="card-list">
          {faqs.map((f) => (
            <div key={f._id} className={`card ${editing?._id === f._id ? 'active' : ''}`}>
              <div className="card-body" onClick={() => startEdit(f)}>
                <strong>{f.question}</strong>
                <p className="card-text">{f.answer?.substring(0, 100)}...</p>
                <small className="card-meta">Order: {f.order ?? 0}</small>
              </div>
              <div className="card-actions">
                <button className="btn btn-sm" onClick={() => startEdit(f)}>Edit</button>
                <button className="btn btn-sm btn-danger" onClick={() => handleDelete(f._id)}>Delete</button>
              </div>
            </div>
          ))}
          {faqs.length === 0 && <p style={{ color: '#888', padding: '1rem' }}>No FAQs yet</p>}
        </div>

        <div className="form-panel">
          <h3>{editing?._id ? 'Edit FAQ' : 'New FAQ'}</h3>
          {msg && <div className="alert alert-error">{msg}</div>}

          <label className="field-label">Question</label>
          <input className="input" value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} />

          <label className="field-label">Answer</label>
          <textarea className="input textarea" rows={6} value={form.answer} onChange={(e) => setForm({ ...form, answer: e.target.value })} />

          <label className="field-label">Order</label>
          <input className="input" type="number" value={form.order} onChange={(e) => setForm({ ...form, order: Number(e.target.value) })} />

          <div className="modal-actions">
            {editing?._id && <button className="btn" onClick={resetForm}>Cancel</button>}
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : editing?._id ? 'Update' : 'Create'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
