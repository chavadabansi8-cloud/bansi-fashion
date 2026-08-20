import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import BottomNav from '../components/BottomNav';
import WorkEntryForm from '../components/WorkEntryForm';
import WorkEntryCard from '../components/WorkEntryCard';
import { Calendar, History, Megaphone, Bell } from 'lucide-react';
import { API } from '../config/api';

const WorkerDashboard = () => {
  const { token, user } = useAuth();
  const [todayEntries, setTodayEntries] = useState([]);
  const [historyEntries, setHistoryEntries] = useState([]);
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('today');

  const fetchTodayEntries = async () => {
    try {
      const res = await axios.get(`${API}/work/my/today`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTodayEntries(res.data || []);
    } catch {
      toast.error('Failed to load today\'s entries');
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await axios.get(`${API}/work/my/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHistoryEntries(res.data || []);
    } catch {
      toast.error('Failed to load history');
    }
  };

  const fetchNotices = async () => {
    try {
      const res = await axios.get(`${API}/inventory/notices`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotices(res.data || []);
    } catch {
      // offline fallback
    }
  };

  useEffect(() => {
    const init = async () => {
      await Promise.all([fetchTodayEntries(), fetchHistory(), fetchNotices()]);
      setLoading(false);
    };
    init();
  }, []);

  const handleEntryAdded = (newEntry) => {
    setTodayEntries(prev => [newEntry, ...prev]);
    setHistoryEntries(prev => [newEntry, ...prev]);
  };

  const scrollToForm = () => {
    const el = document.getElementById('work-entry-form');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <>
      <Navbar />
      <div className="dashboard mobile-app-container" style={{ paddingTop: '1.25rem' }}>
        {/* FACTORY NOTICE ANNOUNCEMENT BANNER */}
        {notices.length > 0 && (
          <div
            className="alert"
            style={{
              background: notices[0].priority === 'urgent' ? 'var(--danger-bg)' : 'var(--primary-soft)',
              border: `1.5px solid ${notices[0].priority === 'urgent' ? '#fecaca' : '#c7d2fe'}`,
              borderRadius: 'var(--radius-lg)',
              padding: '1rem 1.25rem',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.75rem'
            }}
          >
            <Megaphone size={20} color={notices[0].priority === 'urgent' ? 'var(--danger)' : 'var(--primary)'} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.95rem', color: notices[0].priority === 'urgent' ? 'var(--danger)' : 'var(--primary-dark)' }}>
                📢 {notices[0].title}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                {notices[0].message}
              </div>
            </div>
          </div>
        )}

        {/* Work Entry Form — Primary view */}
        <WorkEntryForm onEntryAdded={handleEntryAdded} />

        {/* Tabs */}
        <div className="tabs">
          <button
            id="tab-today"
            className={`tab ${activeTab === 'today' ? 'active' : ''}`}
            onClick={() => setActiveTab('today')}
          >
            <Calendar size={15} /> Today's Work ({todayEntries.length})
          </button>
          <button
            id="tab-history"
            className={`tab ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            <History size={15} /> Work History ({historyEntries.length})
          </button>
        </div>

        {/* Entries List */}
        {loading ? (
          <div className="loading"><div className="spinner" /></div>
        ) : (
          <div className="entries-list">
            {activeTab === 'today' ? (
              todayEntries.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">📭</div>
                  <div className="empty-state-text">No entries recorded for today</div>
                  <div className="empty-state-sub">Use the form above to add your daily work entry.</div>
                </div>
              ) : (
                todayEntries.map(entry => (
                  <WorkEntryCard key={entry._id} entry={entry} />
                ))
              )
            ) : (
              historyEntries.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">📚</div>
                  <div className="empty-state-text">No past work history found</div>
                  <div className="empty-state-sub">Your previous work records will show up here.</div>
                </div>
              ) : (
                historyEntries.map(entry => (
                  <WorkEntryCard key={entry._id} entry={entry} />
                ))
              )
            )}
          </div>
        )}
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        onOpenForm={scrollToForm}
        isAdmin={false}
      />
    </>
  );
};

export default WorkerDashboard;
