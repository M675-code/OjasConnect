import { Link, useLocation } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { FiHome, FiSearch, FiUsers, FiLogOut, FiCalendar, FiShield } from 'react-icons/fi'; // Added FiShield
import './Sidebar.css';

export default function Sidebar() {
  const { user, logout } = useContext(AuthContext); // Brought in `user` from context
  const location = useLocation(); 

  const navItems = [
    { path: '/', label: 'Home', icon: <FiHome /> },
    { path: '/directory', label: 'Directory', icon: <FiSearch /> },
    { path: '/events', label: 'Events', icon: <FiCalendar /> },
    { path: '/profile', label: 'My Space', icon: <FiUsers /> },
  ];

  // Conditionally push the Admin tab into the array if role is admin
  if (user && user.role === 'admin') {
      navItems.push({ path: '/admin', label: 'Admin Panel', icon: <FiShield /> });
  }

  return (
    <nav className="sidebar">
      <div className="brand-section">
        <img src="/logo.png" alt="Ojas Connect Logo" className="brand-logo" />
        <span className="brand-name">Ojas</span>
      </div>

      <div className="nav-links">
        {navItems.map((item) => (
          <Link 
            key={item.path} 
            to={item.path} 
            className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </Link>
        ))}
      </div>

      <div className="nav-links" style={{ marginTop: 'auto', marginBottom: '20px' }}>
         <div className="nav-item" onClick={logout} style={{ cursor: 'pointer' }}>
            <span className="nav-icon" style={{ color: 'var(--alert-red)' }}><FiLogOut /></span>
            <span className="nav-label" style={{ color: 'var(--alert-red)' }}>Logout</span>
         </div>
      </div>
    </nav>
  );
}