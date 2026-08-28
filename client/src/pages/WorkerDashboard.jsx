import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import WorkEntryForm from '../components/WorkEntryForm';
import WorkEntryCard from '../components/WorkEntryCard';
import ImageModal from '../components/ImageModal';
import { calculateDesignBonus } from '../utils/bonusCalculator';
import { Calendar, History, Megaphone } from 'lucide-react';
import { API } from '../config/api';

const WorkerDashboard = () => {
  const { token, user } = useAuth();
  const [todayEntries, setTodayEntries] = useState(() => {
    try {
      const cached = localStorage.getItem('bf_worker_today');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [historyEntries, setHistoryEntries] = useState(() => {
    try {
      const cached = localStorage.getItem('bf_worker_history');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(() => {
    try {
      const hasToday = localStorage.getItem('bf_worker_today');
      const hasHistory = localStorage.getItem('bf_worker_history');
      return !hasToday && !hasHistory;
    } catch {
      return true;
    }
  });
  const [activeTab, setActiveTab] = useState('today');
  const [entriesViewMode, setEntriesViewMode] = useState('table');
  const [reportMonth, setReportMonth] = useState(new Date().toISOString().slice(0, 7));
  const [previewImage, setPreviewImage] = useState(null);

  const fetchTodayEntries = async () => {
    try {
      const res = await axios.get(`${API}/work/my/today`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = res.data || [];
      setTodayEntries(data);
      try { localStorage.setItem('bf_worker_today', JSON.stringify(data)); } catch {}
    } catch {
      if (todayEntries.length === 0) toast.error('Failed to load today\'s entries');
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await axios.get(`${API}/work/my/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = res.data || [];
      setHistoryEntries(data);
      try { localStorage.setItem('bf_worker_history', JSON.stringify(data)); } catch {}
    } catch {
      if (historyEntries.length === 0) toast.error('Failed to load history');
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

  // Filter history entries by selected month
  const filteredHistory = useMemo(() => {
    if (!reportMonth) return historyEntries;
    return historyEntries.filter(e => e.date && e.date.startsWith(reportMonth));
  }, [historyEntries, reportMonth]);

  // Calculate total bonus for filtered history entries
  const totalHistoryBonus = useMemo(() => {
    return filteredHistory.reduce((sum, e) => {
      return sum + calculateDesignBonus({
        designStitch: e.designStitch,
        machineStitch: e.machineStitch,
        frame: e.frame,
        workerCount: e.workerCount
      }) + (Number(e.extraPay) || 0);
    }, 0);
  }, [filteredHistory]);

  return (
    <>
      <Navbar />
      <div className="dashboard mobile-app-container">
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

        {/* Entries Content */}
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
                  <WorkEntryCard key={entry._id || entry.id} entry={entry} />
                ))
              )
            ) : (
              /* WORK HISTORY TAB (WITH TABLE / CARD TOGGLE & NO EDIT BUTTON) */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingBottom: '2.5rem' }}>
                {/* Month Selector Bar */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc', padding: '0.5rem 0.75rem', borderRadius: '10px', border: '1px solid var(--border)', flexWrap: 'wrap', gap: '0.4rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-primary)' }}>
                    <Calendar size={15} color="var(--primary)" />
                    <span>Report Month :</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                    <input
                      type="month"
                      className="form-control"
                      value={reportMonth}
                      onChange={(e) => setReportMonth(e.target.value)}
                      style={{ width: '140px', padding: '0.25rem 0.5rem', fontWeight: 700, background: '#ffffff', borderColor: '#cbd5e1', fontSize: '0.82rem' }}
                    />
                    {reportMonth && (
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => setReportMonth('')}
                        style={{ fontSize: '0.72rem', padding: '0.25rem 0.45rem' }}
                        title="Show all months history"
                      >
                        All Months
                      </button>
                    )}
                  </div>
                </div>

                {/* View Mode & Count Toolbar */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                    📋 Showing {filteredHistory.length} Shift Entries
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', background: '#f1f5f9', padding: '3px', borderRadius: '8px', gap: '2px' }}>
                    <button
                      type="button"
                      onClick={() => setEntriesViewMode('table')}
                      style={{
                        border: 'none',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        background: entriesViewMode === 'table' ? '#ffffff' : 'transparent',
                        color: entriesViewMode === 'table' ? 'var(--primary)' : 'var(--text-muted)',
                        boxShadow: entriesViewMode === 'table' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none'
                      }}
                    >
                      📊 Table View
                    </button>
                    <button
                      type="button"
                      onClick={() => setEntriesViewMode('cards')}
                      style={{
                        border: 'none',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        background: entriesViewMode === 'cards' ? '#ffffff' : 'transparent',
                        color: entriesViewMode === 'cards' ? 'var(--primary)' : 'var(--text-muted)',
                        boxShadow: entriesViewMode === 'cards' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none'
                      }}
                    >
                      🗂️ Cards View
                    </button>
                  </div>
                </div>

                {filteredHistory.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-state-icon">📚</div>
                    <div className="empty-state-text">No work entries found for this period</div>
                    <div className="empty-state-sub">Your shift records will automatically appear here.</div>
                  </div>
                ) : entriesViewMode === 'table' ? (
                  /* WORKER READ-ONLY LEDGER TABLE (NO EDIT BUTTON) */
                  <div className="modal-entries-table-wrapper">
                    <table className="modal-entries-table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Shift</th>
                          <th>Machine</th>
                          <th>Design #</th>
                          <th>Workers</th>
                          <th>Design Stitch</th>
                          <th>Machine Stitch</th>
                          <th>Bonus</th>
                          <th>Proof Photo</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredHistory.map(entry => {
                          const entryBonus = calculateDesignBonus({
                            designStitch: entry.designStitch,
                            machineStitch: entry.machineStitch,
                            frame: entry.frame,
                            workerCount: entry.workerCount
                          }) + (Number(entry.extraPay) || 0);
                          const photo1 = entry.proofImage || entry.photo || entry.image || '';
                          const photo2 = entry.proofImage2 || '';

                          return (
                            <tr key={entry._id || entry.id}>
                              <td style={{ fontWeight: 700 }}>{entry.date || 'N/A'}</td>
                              <td>
                                <span
                                  className="badge"
                                  style={{
                                    background: entry.shift === 'night' ? '#eef2ff' : '#fef3c7',
                                    color: entry.shift === 'night' ? '#4338ca' : '#b45309',
                                    fontSize: '0.72rem',
                                    fontWeight: 700,
                                    padding: '2px 6px'
                                  }}
                                >
                                  {entry.shift === 'night' ? '🌙 Night' : '☀️ Day'}
                                </span>
                              </td>
                              <td style={{ fontWeight: 700 }}>
                                M-{entry.machineNumber || '1'}
                              </td>
                              <td style={{ fontWeight: 800, color: 'var(--primary)' }}>
                                #{entry.designNumber || '-'}
                              </td>
                              <td style={{ textAlign: 'center' }}>
                                <span
                                  className="badge"
                                  style={{
                                    background: (entry.workerCount || 1) > 1 ? '#e0e7ff' : '#f1f5f9',
                                    color: (entry.workerCount || 1) > 1 ? '#4338ca' : '#475569',
                                    fontSize: '0.72rem',
                                    fontWeight: 800,
                                    padding: '2px 6px'
                                  }}
                                  title={(entry.workerCount || 1) > 1 ? '2 Workers (Shared Shift)' : '1 Worker (Single)'}
                                >
                                  {(entry.workerCount || 1) > 1 ? '👥 2' : '👤 1'}
                                </span>
                              </td>
                              <td style={{ fontWeight: 700 }}>
                                {(Number(entry.designStitch) || 0).toLocaleString('en-IN')}
                              </td>
                              <td style={{ fontWeight: 700 }}>
                                {(Number(entry.machineStitch) || 0).toLocaleString('en-IN')}
                              </td>
                              <td>
                                {entryBonus > 0 ? (
                                  <span style={{ color: '#059669', fontWeight: 800 }}>
                                    +₹{entryBonus.toLocaleString('en-IN')}
                                  </span>
                                ) : (
                                  <span style={{ color: 'var(--text-muted)' }}>₹0</span>
                                )}
                              </td>
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'nowrap' }}>
                                  {photo1 ? (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setPreviewImage({
                                          src: photo1,
                                          title: `Photo 1 - Design #${entry.designNumber || 'N/A'} Proof`,
                                          subtitle: `Date: ${entry.date || 'N/A'} • Machine #${entry.machineNumber || '1'}`
                                        })
                                      }
                                      style={{
                                        border: '1px solid #c7d2fe',
                                        background: '#eef2ff',
                                        color: '#4338ca',
                                        borderRadius: '6px',
                                        padding: '2px 6px',
                                        fontSize: '0.72rem',
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '2px',
                                        whiteSpace: 'nowrap'
                                      }}
                                      title="View Photo 1 (Design Proof)"
                                    >
                                      📸 Photo 1
                                    </button>
                                  ) : null}

                                  {photo2 ? (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setPreviewImage({
                                          src: photo2,
                                          title: `Photo 2 - Machine Reading Proof`,
                                          subtitle: `Date: ${entry.date || 'N/A'} • Machine #${entry.machineNumber || '1'}`
                                        })
                                      }
                                      style={{
                                        border: '1px solid #a7f3d0',
                                        background: '#ecfdf5',
                                        color: '#047857',
                                        borderRadius: '6px',
                                        padding: '2px 6px',
                                        fontSize: '0.72rem',
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '2px',
                                        whiteSpace: 'nowrap'
                                      }}
                                      title="View Photo 2 (Meter Reading Proof)"
                                    >
                                      📸 Photo 2
                                    </button>
                                  ) : null}

                                  {!photo1 && !photo2 && (
                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>No photo</span>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot>
                        <tr style={{ background: '#f8fafc', borderTop: '2px solid var(--border)', fontWeight: 800 }}>
                          <td colSpan={7} style={{ padding: '0.75rem 0.85rem', fontWeight: 800, color: 'var(--text-primary)', textAlign: 'right' }}>
                            🎁 TOTAL BONUS :
                          </td>
                          <td style={{ padding: '0.75rem 0.85rem', color: '#059669', fontSize: '1.05rem', fontWeight: 800 }}>
                            +₹{totalHistoryBonus.toLocaleString('en-IN')}
                          </td>
                          <td style={{ padding: '0.75rem 0.85rem' }}></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                ) : (
                  /* WORKER CARDS VIEW */
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                    {filteredHistory.map(entry => (
                      <WorkEntryCard key={entry._id || entry.id} entry={entry} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* IMAGE PREVIEW MODAL FOR WORKER */}
        {previewImage && (
          <ImageModal
            isOpen={!!previewImage}
            onClose={() => setPreviewImage(null)}
            imageSrc={previewImage.src}
            title={previewImage.title}
            subtitle={previewImage.subtitle}
          />
        )}
      </div>
    </>
  );
};

export default WorkerDashboard;
