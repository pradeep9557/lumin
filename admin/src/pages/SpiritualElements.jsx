import { useState, useEffect, useCallback } from 'react';
import { getSpiritualElements, createSpiritualElement, updateSpiritualElement, deleteSpiritualElement } from '../api';

const EMPTY = { name: '', type: 'herb', description: '', tag: '', iconUrl: '', order: 0 };

export default function SpiritualElements() {
  const [items, setItems] = useState([]);
  const [typeFilter, setTypeFilter] = useState('');
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ ...EMPTY });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const fetchItems = useCallback(() => {
    const params = {};
    if (typeFilter) params.type = typeFilter;
    if (search) params.search = search;
    getSpiritualElements(params).then(setItems).catch(console.error);
  }, [typeFilter, search]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const resetForm = () => { setEditing(null); setForm({ ...EMPTY }); setMsg(''); };

  const startEdit = (item) => {
    setEditing(item);
    setForm({
      name: item.name || '',
      type: item.type || 'herb',
      description: item.description || '',
      tag: item.tag || '',
      iconUrl: item.iconUrl || '',
      order: item.order ?? 0,
    });
    setMsg('');
  };

  const handleSave = async () => {
    setSaving(true);
    setMsg('');
    try {
      if (editing?._id) {
        await updateSpiritualElement(editing._id, form);
      } else {
        await createSpiritualElement(form);
      }
      resetForm();
      fetchItems();
    } catch (e) {
      setMsg(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this element?')) return;
    try {
      await deleteSpiritualElement(id);
      if (editing?._id === id) resetForm();
      fetchItems();
    } catch (e) {
      setMsg(e.message);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Spiritual Elements ({items.length})</h1>
        <button className="btn btn-primary" onClick={resetForm}>+ New Element</button>
      </div>

      <div className="toolbar">
        <input
          className="input"
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1 }}
        />
        <select className="input" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} style={{ width: 150 }}>
          <option value="">All Types</option>
          <option value="herb">Herbs</option>
          <option value="crystal">Crystals</option>
        </select>
      </div>

      <div className="two-col">
        <div className="card-list">
          {items.map((item) => (
            <div key={item._id} className={`card ${editing?._id === item._id ? 'active' : ''}`}>
              <div className="card-body" onClick={() => startEdit(item)}>
                <div className="card-header-row">
                  <strong>{item.name}</strong>
                  <span className={`badge ${item.type === 'herb' ? 'badge-green' : 'badge-purple'}`}>{item.type}</span>
                </div>
                <p className="card-text">{item.description?.substring(0, 80)}...</p>
                {item.tag && <small className="card-meta">Tag: {item.tag}</small>}
              </div>
              <div className="card-actions">
                <button className="btn btn-sm" onClick={() => startEdit(item)}>Edit</button>
                <button className="btn btn-sm btn-danger" onClick={() => handleDelete(item._id)}>Delete</button>
              </div>
            </div>
          ))}
          {items.length === 0 && <p style={{ color: '#888', padding: '1rem' }}>No elements found</p>}
        </div>

        <div className="form-panel">
          <h3>{editing?._id ? 'Edit Element' : 'New Element'}</h3>
          {msg && <div className="alert alert-error">{msg}</div>}

          <label className="field-label">Name</label>
          <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />

          <label className="field-label">Type</label>
          <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            <option value="herb">Herb</option>
            <option value="crystal">Crystal</option>
          </select>

          <label className="field-label">Description</label>
          <textarea className="input textarea" rows={5} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />

          <label className="field-label">Tag</label>
          <input className="input" value={form.tag} onChange={(e) => setForm({ ...form, tag: e.target.value })} />

          <label className="field-label">Icon URL</label>
          <input className="input" value={form.iconUrl} onChange={(e) => setForm({ ...form, iconUrl: e.target.value })} />

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
