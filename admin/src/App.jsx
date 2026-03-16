import { Routes, Route, Navigate, NavLink, useNavigate } from 'react-router-dom';
import { isLoggedIn, clearToken } from './api';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Pages from './pages/Pages';
import Faqs from './pages/Faqs';
import SpiritualElements from './pages/SpiritualElements';

function ProtectedRoute({ children }) {
  return isLoggedIn() ? children : <Navigate to="/login" replace />;
}

function Sidebar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    clearToken();
    navigate('/login');
  };

  const links = [
    { to: '/', label: 'Dashboard', icon: '\u2302' },
    { to: '/users', label: 'Users', icon: '\u263A' },
    { to: '/pages', label: 'Pages', icon: '\u2630' },
    { to: '/faqs', label: 'FAQs', icon: '?' },
    { to: '/spiritual', label: 'Spiritual Elements', icon: '\u2726' },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">Lumin Admin</div>
      <nav className="sidebar-nav">
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.to === '/'}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <span className="sidebar-icon">{l.icon}</span>
            {l.label}
          </NavLink>
        ))}
      </nav>
      <button className="btn sidebar-logout" onClick={handleLogout}>Logout</button>
    </aside>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <div className="layout">
              <Sidebar />
              <main className="main-content">
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/users" element={<Users />} />
                  <Route path="/pages" element={<Pages />} />
                  <Route path="/faqs" element={<Faqs />} />
                  <Route path="/spiritual" element={<SpiritualElements />} />
                </Routes>
              </main>
            </div>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
