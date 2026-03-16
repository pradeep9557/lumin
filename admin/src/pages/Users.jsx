import { useState, useEffect, useCallback } from 'react';
import { getUsers, toggleUserStatus, updateUser } from '../api';

function EditModal({ user, onClose, onSaved }) {
  const [form, setForm] = useState({
    fullName: user.fullName || '',
    email: user.email || '',
    phone: user.phone || '',
    role: user.role || 'user',
    birthDate: user.birthDate || '',
    birthTime: user.birthTime || '',
    birthPlace: user.birthPlace || '',
    birthCountry: user.birthCountry || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      await updateUser(user._id, form);
      onSaved();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Edit User</h2>
        {error && <div className="alert alert-error">{error}</div>}

        <div className="form-grid">
          <div>
            <label className="field-label">Full Name</label>
            <input className="input" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
          </div>
          <div>
            <label className="field-label">Email</label>
            <input className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <label className="field-label">Phone</label>
            <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div>
            <label className="field-label">Role</label>
            <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div>
            <label className="field-label">Birth Date</label>
            <input className="input" value={form.birthDate} onChange={(e) => setForm({ ...form, birthDate: e.target.value })} />
          </div>
          <div>
            <label className="field-label">Birth Time</label>
            <input className="input" value={form.birthTime} onChange={(e) => setForm({ ...form, birthTime: e.target.value })} />
          </div>
          <div>
            <label className="field-label">Birth Place</label>
            <input className="input" value={form.birthPlace} onChange={(e) => setForm({ ...form, birthPlace: e.target.value })} />
          </div>
          <div>
            <label className="field-label">Birth Country</label>
            <input className="input" value={form.birthCountry} onChange={(e) => setForm({ ...form, birthCountry: e.target.value })} />
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Users() {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [editUser, setEditUser] = useState(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (search) params.search = search;
      if (status) params.status = status;
      const data = await getUsers(params);
      setUsers(data.users);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page, search, status]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleToggle = async (id) => {
    await toggleUserStatus(id);
    fetchUsers();
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  return (
    <div>
      <h1 className="page-title">Users ({total})</h1>

      <form className="toolbar" onSubmit={handleSearch}>
        <input
          className="input"
          placeholder="Search name, email, phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1 }}
        />
        <select className="input" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} style={{ width: 150 }}>
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="disabled">Disabled</option>
        </select>
        <button className="btn btn-primary" type="submit">Search</button>
      </form>

      {loading ? (
        <div className="loading">Loading...</div>
      ) : (
        <>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id}>
                    <td>{u.fullName}</td>
                    <td>{u.email}</td>
                    <td>{u.phone || '—'}</td>
                    <td><span className={`badge ${u.role === 'admin' ? 'badge-purple' : 'badge-gray'}`}>{u.role}</span></td>
                    <td><span className={`badge ${u.isActive ? 'badge-green' : 'badge-red'}`}>{u.isActive ? 'Active' : 'Disabled'}</span></td>
                    <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td className="actions">
                      <button className="btn btn-sm" onClick={() => setEditUser(u)}>Edit</button>
                      <button className={`btn btn-sm ${u.isActive ? 'btn-danger' : 'btn-success'}`} onClick={() => handleToggle(u._id)}>
                        {u.isActive ? 'Disable' : 'Enable'}
                      </button>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>No users found</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button className="btn btn-sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Prev</button>
              <span>Page {page} of {totalPages}</span>
              <button className="btn btn-sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</button>
            </div>
          )}
        </>
      )}

      {editUser && (
        <EditModal
          user={editUser}
          onClose={() => setEditUser(null)}
          onSaved={() => { setEditUser(null); fetchUsers(); }}
        />
      )}
    </div>
  );
}
