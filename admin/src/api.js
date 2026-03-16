const BASE = '/api';

function getToken() {
  return localStorage.getItem('admin_token');
}

export function setToken(token) {
  localStorage.setItem('admin_token', token);
}

export function clearToken() {
  localStorage.removeItem('admin_token');
}

export function isLoggedIn() {
  return !!getToken();
}

async function request(path, opts = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...opts.headers };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, { ...opts, headers });

  if (res.status === 401 || res.status === 403) {
    clearToken();
    window.location.href = '/login';
    throw new Error('Session expired');
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}

// Auth
export const login = (email, password) =>
  fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  }).then(async (r) => {
    const data = await r.json();
    if (!r.ok) throw new Error(data.message || 'Login failed');
    return data;
  });

// Dashboard
export const getStats = () => request('/admin/stats');

// Users
export const getUsers = (params) => {
  const q = new URLSearchParams(params).toString();
  return request(`/admin/users?${q}`);
};
export const getUser = (id) => request(`/admin/users/${id}`);
export const updateUser = (id, data) =>
  request(`/admin/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const toggleUserStatus = (id) =>
  request(`/admin/users/${id}/toggle-status`, { method: 'PATCH' });

// Pages
export const getPages = () => request('/admin/pages');
export const updatePage = (slug, data) =>
  request(`/admin/pages/${slug}`, { method: 'PUT', body: JSON.stringify(data) });

// FAQs
export const getFaqs = () => request('/admin/faqs');
export const createFaq = (data) =>
  request('/admin/faqs', { method: 'POST', body: JSON.stringify(data) });
export const updateFaq = (id, data) =>
  request(`/admin/faqs/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deleteFaq = (id) =>
  request(`/admin/faqs/${id}`, { method: 'DELETE' });

// Spiritual Elements
export const getSpiritualElements = (params) => {
  const q = new URLSearchParams(params).toString();
  return request(`/admin/spiritual-elements?${q}`);
};
export const getSpiritualElement = (id) => request(`/admin/spiritual-elements/${id}`);
export const createSpiritualElement = (data) =>
  request('/admin/spiritual-elements', { method: 'POST', body: JSON.stringify(data) });
export const updateSpiritualElement = (id, data) =>
  request(`/admin/spiritual-elements/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deleteSpiritualElement = (id) =>
  request(`/admin/spiritual-elements/${id}`, { method: 'DELETE' });
