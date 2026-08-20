import { useState, useEffect } from 'react';
import axios from 'axios';
import { Cpu, CheckCircle2, Wrench, RefreshCw, Download, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import html2pdf from 'html2pdf.js';
import { useAuth } from '../context/AuthContext';
import { API } from '../config/api';

const MachineStatusTracker = () => {
  const { token } = useAuth();
  const [machines, setMachines] = useState([
    { machineId: '1', name: 'Machine 1 (Suba 12-Head)', status: 'active', speed: 850, operator: 'LAKHA', lastOiling: 'Today 08:00 AM', maintenanceNote: 'Operational', logs: [] },
    { machineId: '2', name: 'Machine 2 (Suba 15-Head)', status: 'active', speed: 900, operator: 'WORKER001', lastOiling: 'Today 09:30 AM', maintenanceNote: 'Operational', logs: [] }
  ]);

  const fetchMachines = async () => {
    try {
      const res = await axios.get(`${API}/machine/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data && res.data.length > 0) {
        setMachines(res.data);
      }
    } catch {
      // keep default if offline
    }
  };

  useEffect(() => {
    fetchMachines();
  }, []);

  const handleStatusChange = async (machineId, newStatus) => {
    try {
      await axios.put(`${API}/machine/status/${machineId}`, { status: newStatus }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMachines(prev => prev.map(m => m.machineId === machineId ? { ...m, status: newStatus } : m));
      toast.success(`Machine ${machineId} status updated to ${newStatus.toUpperCase()}!`);
    } catch {
      toast.error('Failed to update machine status');
    }
  };

  const handleAddLog = async (machineId, type) => {
    try {
      const res = await axios.post(`${API}/machine/log/${machineId}`, {
        type,
        note: `Routine ${type}`
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setMachines(prev => prev.map(m => m.machineId === machineId ? res.data.machine : m));
      toast.success(`Log added for Machine ${machineId}!`);
    } catch {
      toast.error('Failed to add machine log');
    }
  };

  const handleExportPDF = async () => {
    const element = document.querySelector('.machine-tracker-container');
    if (!element) return;

    const toastId = toast.loading('Generating Machine Status PDF Report...');
    try {
      const filename = `Machine_Status_Report_${new Date().toISOString().split('T')[0]}.pdf`;
      const opt = {
        margin:       [0.25, 0.25, 0.25, 0.25],
        filename:     filename,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true, logging: false, backgroundColor: '#ffffff' },
        jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' }
      };
      await html2pdf().set(opt).from(element).save();
      toast.success('Machine Status PDF downloaded successfully!', { id: toastId });
    } catch (err) {
      console.error('PDF error:', err);
      window.print();
      toast.dismiss(toastId);
    }
  };

  const allLogs = machines.flatMap(m =>
    (m.logs || []).map(l => ({
      ...l,
      machineName: m.name,
      machineId: m.machineId
    }))
  ).sort((a, b) => (b.date > a.date ? 1 : -1));

  return (
    <div className="machine-tracker-container">
      {/* HEADER WITH PDF DOWNLOAD BUTTON */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>⚙️ Machine Production & Maintenance Status</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>Live monitoring of factory embroidery machines</p>
        </div>
        <button className="btn btn-accent btn-sm" onClick={handleExportPDF} title="Download Machine Status PDF">
          <Download size={15} /> Download Machine PDF
        </button>
      </div>

      {/* MACHINE STATUS CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
        {machines.map(m => (
          <div key={m.machineId || m.id} className="worker-group-card" style={{ position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <Cpu size={22} color="var(--primary)" />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>{m.name}</h3>
              </div>
              <span className={`badge ${m.status === 'active' ? 'badge-approved' : m.status === 'maintenance' ? 'badge-pending' : 'badge-rejected'}`}>
                {m.status === 'active' ? '● Running' : m.status === 'maintenance' ? '⚠️ Maintenance' : '🛑 Repair'}
              </span>
            </div>

            <div className="worker-summary-strip" style={{ gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1rem' }}>
              <div className="summary-item">
                <span className="summary-label">Speed RPM</span>
                <span className="summary-value" style={{ color: 'var(--primary)' }}>{m.speed} RPM</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Current Operator</span>
                <span className="summary-value">{m.operator || 'Unassigned'}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Last Oiling</span>
                <span className="summary-value" style={{ fontSize: '0.8rem' }}>{m.lastOiling || 'Today 08:00 AM'}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Health</span>
                <span className="summary-value" style={{ color: 'var(--success)' }}>100% OK</span>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                className={`btn btn-sm ${m.status === 'active' ? 'btn-success' : 'btn-ghost'}`}
                onClick={() => handleStatusChange(m.machineId, 'active')}
              >
                <CheckCircle2 size={14} /> Active
              </button>
              <button
                className={`btn btn-sm ${m.status === 'maintenance' ? 'btn-accent' : 'btn-ghost'}`}
                onClick={() => handleStatusChange(m.machineId, 'maintenance')}
              >
                <Wrench size={14} /> Maintenance
              </button>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => handleAddLog(m.machineId, 'Oiling Completed')}
              >
                <RefreshCw size={14} /> Log Oiling
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* LOGS TABLE */}
      <div className="report-table-card">
        <h3 className="report-title" style={{ fontSize: '1.1rem', textAlign: 'left', marginBottom: '1rem' }}>
          Recent Machine Maintenance & Breakdown History
        </h3>

        <div className="table-responsive">
          <table className="report-data-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Machine</th>
                <th>Action Type</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              {allLogs.length === 0 ? (
                <tr>
                  <td colSpan="4" className="empty-table-cell">No machine logs recorded yet.</td>
                </tr>
              ) : (
                allLogs.slice(0, 15).map((log, idx) => (
                  <tr key={log._id || idx}>
                    <td>{log.date}</td>
                    <td><strong>{log.machineName || `Machine ${log.machineId}`}</strong></td>
                    <td><span className="badge badge-worker">{log.type}</span></td>
                    <td>{log.note}</td>
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

export default MachineStatusTracker;
