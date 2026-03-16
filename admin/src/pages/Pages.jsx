import { useState, useEffect } from 'react';
import { getPages, updatePage } from '../api';

const SLUG_LABELS = {
  help_support: 'Help & Support',
  privacy_policy: 'Privacy Policy',
  terms_of_service: 'Terms of Service',
};

function toUrlSlug(dbSlug) {
  return dbSlug?.replace(/_/g, '-');
}

export default function Pages() {
  const [pages, setPages] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: '', content: '' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const fetchPages = () => getPages().then(setPages).catch(console.error);
  useEffect(() => { fetchPages(); }, []);

  const startEdit = (page) => {
    setEditing(page);
    setForm({ title: page.title || '', content: page.content || '' });
    setMsg('');
  };

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true);
    setMsg('');
    try {
      await updatePage(toUrlSlug(editing.slug), form);
      setMsg('Saved successfully!');
      fetchPages();
      setTimeout(() => setMsg(''), 2000);
    } catch (e) {
      setMsg(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h1 className="page-title">Page Content</h1>

      <div className="pages-layout">
        <div className="pages-list">
          {pages.map((p) => (
            <div
              key={p._id}
              className={`page-item ${editing?._id === p._id ? 'active' : ''}`}
              onClick={() => startEdit(p)}
            >
              <strong>{SLUG_LABELS[p.slug] || p.slug}</strong>
              <small>Last updated: {new Date(p.updatedAt).toLocaleDateString()}</small>
            </div>
          ))}
          {pages.length === 0 && <p style={{ padding: '1rem', color: '#888' }}>No pages found. They will be created when you save content.</p>}

          {/* Quick-create buttons for missing pages */}
          {['help_support', 'privacy_policy', 'terms_of_service']
            .filter((s) => !pages.find((p) => p.slug === s))
            .map((slug) => (
              <div
                key={slug}
                className="page-item"
                onClick={() => { setEditing({ slug }); setForm({ title: SLUG_LABELS[slug], content: '' }); setMsg(''); }}
              >
                <strong>{SLUG_LABELS[slug]}</strong>
                <small style={{ color: '#f59e0b' }}>Not created yet — click to create</small>
              </div>
            ))}
        </div>

        <div className="pages-editor">
          {editing ? (
            <>
              <label className="field-label">Title</label>
              <input
                className="input"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
              <label className="field-label" style={{ marginTop: '1rem' }}>Content</label>
              <textarea
                className="input textarea"
                rows={18}
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
              />
              {msg && <div className={`alert ${msg.includes('success') ? 'alert-success' : 'alert-error'}`}>{msg}</div>}
              <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save Page'}
              </button>
            </>
          ) : (
            <p style={{ color: '#888', textAlign: 'center', padding: '3rem' }}>Select a page to edit</p>
          )}
        </div>
      </div>
    </div>
  );
}
