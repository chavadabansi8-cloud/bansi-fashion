import { useState, useEffect } from 'react';
import axios from 'axios';
import { DollarSign, PlusCircle, Trash2, MessageCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { API } from '../config/api';

const AdvancePaymentModal = ({ workers = [], onAdvancesChange = null }) => {
  const { token } = useAuth();
  const [selectedWorkerId, setSelectedWorkerId] = useState(workers[0]?.workerId || '');
  const [advances, setAdvances] = useState([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    amount: '',
    note: '',
    date: new Date().toISOString().split('T')[0]
  });

  const fetchAdvances = async () => {
    try {
      const res = await axios.get(`${API}/advance/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAdvances(res.data || []);
      if (onAdvancesChange) onAdvancesChange();
    } catch {
      // fallback local data if offline
    }
  };

  useEffect(() => {
    fetchAdvances();
  }, []);

  useEffect(() => {
    if (workers.length > 0 && !selectedWorkerId) {
      setSelectedWorkerId(workers[0].workerId);
    }
  }, [workers]);

  const handleAddAdvance = async (e) => {
    e.preventDefault();
    const amountNum = Number(form.amount);
    if (!selectedWorkerId || amountNum <= 0) {
      toast.error('Please select worker and enter a valid amount.');
      return;
    }

    const workerObj = workers.find(w => w.workerId === selectedWorkerId);
    setLoading(true);

    try {
      const payload = {
        workerId: selectedWorkerId,
        workerName: workerObj?.name || selectedWorkerId,
        date: form.date,
        amount: amountNum,
        note: form.note || 'Advance Upad'
      };

      const res = await axios.post(`${API}/advance/add`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setAdvances(prev => [res.data.advance, ...prev]);
      setForm({ amount: '', note: '', date: new Date().toISOString().split('T')[0] });
      if (onAdvancesChange) onAdvancesChange();
      toast.success(`₹${amountNum} Advance (Upad) recorded for ${workerObj?.name || selectedWorkerId}!`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record advance');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAdvance = async (id) => {
    try {
      await axios.delete(`${API}/advance/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAdvances(prev => prev.filter(item => item._id !== id && item.id !== id));
      if (onAdvancesChange) onAdvancesChange();
      toast.success('Advance record removed.');
    } catch {
      toast.error('Failed to delete advance record');
    }
  };

  const selectedWorkerObj = workers.find(w => w.workerId === selectedWorkerId);
  const currentWorkerAdvances = advances.filter(a => a.workerId === selectedWorkerId);
  const totalWorkerUpad = currentWorkerAdvances.reduce((sum, a) => sum + (Number(a.amount) || 0), 0);

  const handleSendWhatsAppUpad = () => {
    if (!selectedWorkerObj) return;
    const phone = selectedWorkerObj.phone?.replace(/\D/g, '');
    const text = `*BANSI FASHION - Advance (Upad) Statement*\n\n` +
      `👤 Worker: ${selectedWorkerObj.name} (ID: ${selectedWorkerObj.workerId})\n` +
      `💵 Base Salary: ₹${selectedWorkerObj.salary || 0}\n` +
      `🛑 Total Advance Balance: ₹${totalWorkerUpad.toLocaleString()}\n` +
      `📅 Date: ${new Date().toLocaleDateString('en-IN')}\n\n` +
      `Support: +91 7574049710`;

    const encodedText = encodeURIComponent(text);
    const targetUrl = phone && phone.length === 10
      ? `https://wa.me/91${phone}?text=${encodedText}`
      : `https://wa.me/?text=${encodedText}`;

    window.open(targetUrl, '_blank');
    toast.success('Opening WhatsApp with Advance statement...');
  };

  return (
    <div className="upad-container">
      <div className="admin-toolbar" style={{ marginBottom: '1.5rem' }}>
        <div className="toolbar-header">
          <div className="toolbar-left">
            <DollarSign size={20} color="var(--primary)" />
            <span>Worker Advance (Upad) & Loan Tracker</span>
          </div>
          <span className="badge badge-admin">Financial Module</span>
        </div>

        <form onSubmit={handleAddAdvance} style={{ marginTop: '1rem' }}>
          <div className="form-row" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Worker :</label>
              <select
                className="form-control"
                value={selectedWorkerId}
                onChange={(e) => setSelectedWorkerId(e.target.value)}
                required
              >
                {workers.map(w => (
                  <option key={w.workerId} value={w.workerId}>
                    {w.name} (ID: {w.workerId})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Advance Amount (₹) :</label>
              <input
                type="number"
                className="form-control"
                value={form.amount}
                onChange={(e) => setForm(prev => ({ ...prev, amount: e.target.value }))}
                placeholder="e.g. 2000"
                min="1"
                required
              />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Date :</label>
              <input
                type="date"
                className="form-control"
                value={form.date}
                onChange={(e) => setForm(prev => ({ ...prev, date: e.target.value }))}
                required
              />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Note / Remark :</label>
              <input
                type="text"
                className="form-control"
                value={form.note}
                onChange={(e) => setForm(prev => ({ ...prev, note: e.target.value }))}
                placeholder="e.g. Festival Advance"
              />
            </div>
          </div>

          <button type="submit" className="btn btn-accent btn-sm" style={{ marginTop: '1rem' }} disabled={loading}>
            <PlusCircle size={15} /> Record Advance
          </button>
        </form>
      </div>

      {/* Upad Summary Header */}
      <div className="upad-summary-box">
        <div>
          <h4 style={{ fontSize: '1rem', fontWeight: 800 }}>Total Advance (Upad) Outstanding</h4>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Selected Worker: <strong>{selectedWorkerObj?.name || 'N/A'}</strong> (Phone: {selectedWorkerObj?.phone || 'N/A'})
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            className="btn btn-success btn-sm"
            onClick={handleSendWhatsAppUpad}
            title="Send Advance Statement to Worker's WhatsApp"
          >
            <MessageCircle size={15} /> WhatsApp Statement
          </button>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--danger)' }}>
            ₹{totalWorkerUpad.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Upad History Table */}
      <div className="report-table-card">
        <h3 className="report-title" style={{ fontSize: '1.1rem', textAlign: 'left', marginBottom: '1rem' }}>
          Advance (Upad) History Records
        </h3>

        <div className="table-responsive">
          <table className="report-data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Worker Name</th>
                <th>Worker ID</th>
                <th>Note / Remark</th>
                <th>Amount (₹)</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {currentWorkerAdvances.length === 0 ? (
                <tr>
                  <td colSpan="6" className="empty-table-cell">No advance records found for this worker.</td>
                </tr>
              ) : (
                currentWorkerAdvances.map(item => (
                  <tr key={item._id || item.id}>
                    <td>{item.date}</td>
                    <td><strong>{item.workerName}</strong></td>
                    <td><span className="worker-id-tag">{item.workerId}</span></td>
                    <td>{item.note}</td>
                    <td style={{ color: 'var(--danger)', fontWeight: 800 }}>₹{item.amount.toLocaleString()}</td>
                    <td>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => handleDeleteAdvance(item._id || item.id)}
                        style={{ color: 'var(--danger)', borderColor: '#fecaca' }}
                        title="Delete Record"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdvancePaymentModal;
