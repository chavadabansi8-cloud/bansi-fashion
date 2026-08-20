import React from 'react';
import { Calendar, History, PlusCircle, User, LayoutDashboard, DollarSign, ListFilter, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const BottomNav = ({ activeTab, onTabChange, onOpenForm, isAdmin = false }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <div className="mobile-bottom-nav">
      {!isAdmin ? (
        <>
          <button
            className={`bottom-nav-item ${activeTab === 'today' ? 'active' : ''}`}
            onClick={() => onTabChange && onTabChange('today')}
          >
            <Calendar size={20} />
            <span>Today</span>
          </button>

          <button
            className="bottom-nav-fab"
            onClick={() => onOpenForm && onOpenForm()}
            aria-label="Add new work entry"
          >
            <div className="fab-circle">
              <PlusCircle size={26} color="#ffffff" />
            </div>
            <span className="fab-label">Add Entry</span>
          </button>

          <button
            className={`bottom-nav-item ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => onTabChange && onTabChange('history')}
          >
            <History size={20} />
            <span>History</span>
          </button>

          <button
            className="bottom-nav-item"
            onClick={handleLogout}
          >
            <LogOut size={20} color="var(--danger)" />
            <span style={{ color: 'var(--danger)' }}>Logout</span>
          </button>
        </>
      ) : (
        <>
          <button
            className={`bottom-nav-item ${activeTab === 'today' ? 'active' : ''}`}
            onClick={() => onTabChange && onTabChange('today')}
          >
            <LayoutDashboard size={20} />
            <span>Overview</span>
          </button>

          <button
            className={`bottom-nav-item ${activeTab === 'range' ? 'active' : ''}`}
            onClick={() => onTabChange && onTabChange('range')}
          >
            <ListFilter size={20} />
            <span>Range</span>
          </button>

          <button
            className="bottom-nav-item"
            onClick={() => onOpenForm && onOpenForm()}
          >
            <DollarSign size={20} color="var(--primary)" />
            <span style={{ color: 'var(--primary)' }}>Salary</span>
          </button>

          <button
            className="bottom-nav-item"
            onClick={handleLogout}
          >
            <LogOut size={20} color="var(--danger)" />
            <span style={{ color: 'var(--danger)' }}>Logout</span>
          </button>
        </>
      )}
    </div>
  );
};

export default BottomNav;
