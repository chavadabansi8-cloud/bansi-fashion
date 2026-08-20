import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LogOut,
  Menu,
  X,
  Calendar,
  AlertCircle,
  FileText,
  TrendingUp,
  DollarSign,
  Cpu,
  Users,
  CheckCircle2,
  Package
} from 'lucide-react';
import bansiLogo from '../assets/bansi fasion logo.png';

const Navbar = ({
  activeTab,
  onTabChange,
  entriesCount = 0,
  pendingCount = 0,
  workersCount = 0
}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleSelectTab = (tab) => {
    if (onTabChange) {
      onTabChange(tab);
    }
    setMobileMenuOpen(false);
  };

  return (
    <>
      <nav className="navbar">
        {/* Brand with Logo */}
        <div className="navbar-brand">
          <img
            src={bansiLogo}
            alt="Bansi Fashion Logo"
            className="navbar-logo"
          />
          <div className="navbar-brand-block">
            <span className="navbar-brand-text">Bansi Fashion</span>
            <span className="app-subtitle-tag">Industrial Work Portal</span>
          </div>
        </div>

        {/* Right Action Block (Desktop info + Mobile Hamburger Icon ≡) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Desktop User Info */}
          <div className="navbar-user">
            <div className="navbar-user-avatar">
              {getInitials(user?.name)}
            </div>
            <div className="navbar-user-info desktop-only-info">
              <div className="navbar-user-name">{user?.name}</div>
              <div className="navbar-user-role">
                {user?.role === 'admin' ? 'Administrator' : `ID: ${user?.workerId}`}
              </div>
            </div>
            <span className={`badge ${user?.role === 'admin' ? 'badge-admin' : 'badge-worker'} desktop-only-badge`}>
              {user?.role === 'admin' ? '👑 Admin' : '👷 Worker'}
            </span>
            <button id="logout-btn" className="btn btn-ghost btn-sm desktop-only-logout" onClick={handleLogout}>
              <LogOut size={15} />
              <span>Logout</span>
            </button>
          </div>

          {/* Mobile Hamburger Menu Icon Button (≡) */}
          <button
            type="button"
            className="mobile-hamburger-btn"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={24} color="#0f172a" />
          </button>
        </div>
      </nav>

      {/* FULL-SCREEN / OVERLAY MOBILE MENU DRAWER (Natural Look Minimal Aesthetic) */}
      {mobileMenuOpen && (
        <div className="mobile-overlay-menu">
          {/* Top Close Button (✕) */}
          <div className="mobile-overlay-header">
            <button
              type="button"
              className="mobile-close-btn"
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Close menu"
            >
              <X size={26} color="#0f172a" />
            </button>
          </div>

          {/* Centered Navigation Links List */}
          <div className="mobile-overlay-content">
            {onTabChange && (
              <div className="mobile-menu-links">
                <button
                  className={`overlay-link-btn ${activeTab === 'today' ? 'active' : ''}`}
                  onClick={() => handleSelectTab('today')}
                >
                  <Calendar size={20} /> By Date ({entriesCount})
                </button>

                <button
                  className={`overlay-link-btn ${activeTab === 'pending' ? 'active' : ''}`}
                  onClick={() => handleSelectTab('pending')}
                  style={{ color: pendingCount > 0 ? 'var(--danger)' : 'inherit' }}
                >
                  <AlertCircle size={20} color={pendingCount > 0 ? "var(--danger)" : "currentColor"} /> Pending Reviews ({pendingCount})
                </button>

                <button
                  className={`overlay-link-btn ${activeTab === 'reports' ? 'active' : ''}`}
                  onClick={() => handleSelectTab('reports')}
                >
                  <FileText size={20} /> Commission & Reports
                </button>

                <button
                  className={`overlay-link-btn ${activeTab === 'analytics' ? 'active' : ''}`}
                  onClick={() => handleSelectTab('analytics')}
                >
                  <TrendingUp size={20} /> Analytics Dashboard
                </button>

                <button
                  className={`overlay-link-btn ${activeTab === 'payslips' ? 'active' : ''}`}
                  onClick={() => handleSelectTab('payslips')}
                >
                  <FileText size={20} /> Salary Slips (PDF)
                </button>

                <button
                  className={`overlay-link-btn ${activeTab === 'upad' ? 'active' : ''}`}
                  onClick={() => handleSelectTab('upad')}
                >
                  <DollarSign size={20} /> Upad / Advance Tracker
                </button>

                <button
                  className={`overlay-link-btn ${activeTab === 'machines' ? 'active' : ''}`}
                  onClick={() => handleSelectTab('machines')}
                >
                  <Cpu size={20} /> Machine Maintenance
                </button>

                <button
                  className={`overlay-link-btn ${activeTab === 'inventory' ? 'active' : ''}`}
                  onClick={() => handleSelectTab('inventory')}
                >
                  <Package size={20} /> Designs & Stock Inventory
                </button>

                <button
                  className={`overlay-link-btn ${activeTab === 'workers' ? 'active' : ''}`}
                  onClick={() => handleSelectTab('workers')}
                >
                  <Users size={20} /> Registered Workers ({workersCount})
                </button>

                <button
                  className={`overlay-link-btn ${activeTab === 'all' ? 'active' : ''}`}
                  onClick={() => handleSelectTab('all')}
                >
                  <CheckCircle2 size={20} /> All Entries
                </button>
              </div>
            )}

            {/* Logout Footer Option */}
            <div className="mobile-menu-footer">
              <button
                className="overlay-link-btn logout-link-btn"
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
              >
                <LogOut size={20} /> Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
