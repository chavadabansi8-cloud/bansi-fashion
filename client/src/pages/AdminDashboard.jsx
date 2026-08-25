import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import WorkEntryCard from '../components/WorkEntryCard';
import CommissionReport from '../components/CommissionReport';
import PayslipGenerator from '../components/PayslipGenerator';
import AnalyticsCharts from '../components/AnalyticsCharts';
import AdvancePaymentModal from '../components/AdvancePaymentModal';
import MachineStatusTracker from '../components/MachineStatusTracker';
import InventoryManager from '../components/InventoryManager';
import {
  Calendar,
  Users,
  Clock,
  Zap,
  AlertCircle,
  Download,
  Printer,
  Search,
  DollarSign,
  PlusCircle,
  CheckCircle2,
  Filter,
  RefreshCw,
  Edit,
  Trash2,
  Phone,
  Cpu,
  FileText,
  X,
  Award,
  TrendingUp,
  UserCheck,
  Menu,
  ChevronDown,
  ChevronUp,
  Package,
  Layers,
  Megaphone
} from 'lucide-react';
import { calculateDesignBonus } from '../utils/bonusCalculator';
import { API } from '../config/api';

const AdminDashboard = () => {
  const { token } = useAuth();
  const [entries, setEntries] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [activeTab, setActiveTab] = useState('today');
  const [searchTerm, setSearchTerm] = useState('');
  const [showSalaryModal, setShowSalaryModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedWorkerReport, setSelectedWorkerReport] = useState(null);
  const [workerForm, setWorkerForm] = useState({
    name: '',
    workerId: '',
    phone: '',
    aadhaarNumber: '',
    machineNumber: '',
    salary: '',
    bonus: '',
    password: ''
  });

  const entriesCache = useMemo(() => new Map(), []);

  const fetchByDate = async (date, isSilent = false) => {
    if (entriesCache.has(`date_${date}`)) {
      setEntries(entriesCache.get(`date_${date}`));
      if (isSilent) return;
    } else {
      setLoading(true);
    }
    try {
      const res = await axios.get(`${API}/work/admin/date/${date}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = res.data || [];
      entriesCache.set(`date_${date}`, data);
      setEntries(data);
    } catch {
      toast.error('Failed to load entries');
    } finally {
      setLoading(false);
    }
  };

  const fetchAll = async (isSilent = false) => {
    if (entriesCache.has('all')) {
      setEntries(entriesCache.get('all'));
      if (isSilent) return;
    } else {
      setLoading(true);
    }
    try {
      const res = await axios.get(`${API}/work/admin/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = res.data || [];
      entriesCache.set('all', data);
      setEntries(data);
    } catch {
      toast.error('Failed to load all entries');
    } finally {
      setLoading(false);
    }
  };

  const fetchRange = async (fromDate, toDate) => {
    const from = fromDate || startDate;
    const to = toDate || endDate;
    const cacheKey = `range_${from}_${to}`;

    if (entriesCache.has(cacheKey)) {
      setEntries(entriesCache.get(cacheKey));
      setActiveTab('range');
      return;
    }
    setLoading(true);
    try {
      const res = await axios.get(`${API}/work/admin/all?from=${from}&to=${to}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = res.data || [];
      entriesCache.set(cacheKey, data);
      setEntries(data);
      setActiveTab('range');
    } catch {
      toast.error('Failed to load date range');
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkers = async () => {
    try {
      const res = await axios.get(`${API}/auth/workers`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setWorkers(res.data || []);
    } catch {
      toast.error('Failed to load worker details');
    }
  };

  useEffect(() => {
    fetchByDate(selectedDate);
    fetchWorkers();

    // Auto-refresh entries every 10 seconds so worker submissions pop up live
    const timer = setInterval(() => {
      if (activeTab === 'all' || activeTab === 'pending') {
        fetchAll();
      } else if (activeTab === 'today') {
        fetchByDate(selectedDate);
      }
    }, 10000);

    return () => clearInterval(timer);
  }, [selectedDate, activeTab]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'all' || tab === 'pending' || tab === 'workers' || tab === 'reports' || tab === 'analytics' || tab === 'payslips' || tab === 'upad' || tab === 'machines') {
      fetchAll();
    } else if (tab === 'range') {
      fetchRange(startDate, endDate);
    } else {
      fetchByDate(selectedDate);
    }
  };

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
    fetchByDate(e.target.value);
    setActiveTab('today');
  };

  const handleStatusUpdate = async (entryId, status) => {
    try {
      await axios.put(`${API}/work/admin/status/${entryId}`, { status }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEntries(prev =>
        prev.map(e => e._id === entryId ? { ...e, status } : e)
      );
      toast.success(`Entry ${status === 'approved' ? 'Approved' : 'Rejected'}!`);
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleWorkerFormChange = (e) => {
    const { name, value } = e.target;
    let val = value;
    if (name === 'phone') val = value.replace(/\D/g, '').slice(0, 10);
    if (name === 'aadhaarNumber') val = value.replace(/\D/g, '').slice(0, 12);
    setWorkerForm(prev => ({
      ...prev,
      [name]: val
    }));
  };

  const handleWorkerSubmit = async (e) => {
    e.preventDefault();

    try {
      const payload = {
        ...workerForm,
        salary: Number(workerForm.salary) || 0,
        bonus: Number(workerForm.bonus) || 0
      };

      if (!payload.workerId) {
        toast.error('Worker ID is required.');
        return;
      }

      if (payload.phone && !/^\d{10}$/.test(payload.phone)) {
        toast.error('Phone number must be exactly 10 digits.');
        return;
      }

      if (payload.aadhaarNumber && !/^\d{12}$/.test(payload.aadhaarNumber)) {
        toast.error('Aadhaar Card number must be exactly 12 digits.');
        return;
      }

      await axios.post(`${API}/auth/workers`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('Worker details saved successfully!');
      setWorkerForm({
        name: '',
        workerId: '',
        phone: '',
        aadhaarNumber: '',
        machineNumber: '',
        salary: '',
        bonus: '',
        password: ''
      });
      setShowSalaryModal(false);
      fetchWorkers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save worker details');
    }
  };

  const handleEditWorkerClick = (worker) => {
    setWorkerForm({
      name: worker.name || '',
      workerId: worker.workerId || '',
      phone: worker.phone || '',
      aadhaarNumber: worker.aadhaarNumber || '',
      machineNumber: worker.machineNumber || '',
      salary: worker.salary !== undefined ? worker.salary : '',
      bonus: worker.bonus !== undefined ? worker.bonus : '',
      password: ''
    });
    setShowSalaryModal(true);
  };

  const handleDeleteWorker = async (worker) => {
    if (!worker) return;
    const wId = worker._id || worker.workerId;
    const wName = worker.name || worker.workerId;

    if (!window.confirm(`Are you sure you want to delete worker "${wName}" (${worker.workerId}) permanently? This action cannot be undone.`)) {
      return;
    }

    try {
      await axios.delete(`${API}/auth/workers/${wId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success(`Worker "${wName}" deleted successfully!`);
      setSelectedWorkerReport(null);
      fetchWorkers();
    } catch (err) {
      console.error('Delete worker error:', err);
      toast.error(err.response?.data?.message || 'Failed to delete worker');
    }
  };

  // Group entries by worker
  const workerMap = useMemo(() => new Map(workers.map(w => [w.workerId, w])), [workers]);

  const activeEntries = useMemo(() => {
    if (activeTab === 'pending') {
      return entries.filter(e => e.status === 'pending');
    }
    return entries;
  }, [entries, activeTab]);

  const groupedByWorker = useMemo(() => {
    return activeEntries.reduce((acc, entry) => {
      const key = entry.workerId || 'UNKNOWN';
      if (!acc[key]) {
        const workerInfo = workerMap.get(key) || {};
        acc[key] = {
          workerName: entry.workerName || workerInfo.name || 'Worker',
          workerId: entry.workerId || key,
          salary: Number(workerInfo.salary) || 0,
          bonus: Number(workerInfo.bonus) || 0,
          phone: workerInfo.phone || '',
          machineNumber: workerInfo.machineNumber || '',
          entries: []
        };
      }
      acc[key].entries.push(entry);
      return acc;
    }, {});
  }, [activeEntries, workerMap]);

  const filteredWorkerGroups = useMemo(() => {
    return Object.values(groupedByWorker)
      .map(group => {
        const extraWorkers = group.entries.reduce((sum, entry) => sum + Math.max((Number(entry.workerCount) || 1) - 1, 0), 0);
        const totalCalculated = group.entries.reduce((sum, entry) => sum + (Number(entry.calculatedTotal) || 0), 0);
        const bonus = group.entries.reduce((sum, entry) => {
          const designBonus = calculateDesignBonus({
            designStitch: entry.designStitch,
            machineStitch: entry.machineStitch,
            frame: entry.frame,
            workerCount: entry.workerCount
          });

          return sum + (Number(entry.extraPay) || 0) + designBonus;
        }, 0) + (Number(group.bonus) || 0);
        const machineNumbers = [...new Set(group.entries.filter(e => e.machineNumber).map(e => e.machineNumber))].join(', ') || '-';
        const designNumbers = [...new Set(group.entries.filter(e => e.designNumber).map(e => e.designNumber))].join(', ') || '-';

        return {
          ...group,
          extraWorkers,
          totalCalculated,
          bonus,
          machineNumbers,
          designNumbers
        };
      })
      .filter(group => {
        const term = searchTerm.trim().toLowerCase();
        if (!term) return true;
        return (
          group.workerName?.toLowerCase().includes(term) ||
          group.workerId?.toLowerCase().includes(term) ||
          String(group.machineNumber || '').toLowerCase().includes(term) ||
          String(group.machineNumbers || '').toLowerCase().includes(term) ||
          String(group.designNumbers || '').toLowerCase().includes(term)
        );
      });
  }, [groupedByWorker, searchTerm]);

  // Registered Workers Directory list with performance stats
  const registeredWorkersList = useMemo(() => {
    return workers
      .map(w => {
        const workerEntries = entries.filter(e => e.workerId === w.workerId);
        const totalEntries = workerEntries.length;
        const totalHours = workerEntries.reduce((sum, e) => sum + (e.hoursWorked || 0), 0);
        const totalExtraPay = workerEntries.reduce((sum, e) => sum + (e.extraPay || 0), 0);
        const totalDesignBonus = workerEntries.reduce((sum, e) => {
          return sum + calculateDesignBonus({
            designStitch: e.designStitch,
            machineStitch: e.machineStitch,
            frame: e.frame,
            workerCount: e.workerCount
          });
        }, 0);
        const netSalary = (w.salary || 0) + (w.bonus || 0) + totalExtraPay + totalDesignBonus;

        return {
          ...w,
          totalEntries,
          totalHours,
          totalExtraPay,
          totalDesignBonus,
          netSalary,
          entries: workerEntries
        };
      })
      .filter(w => {
        const term = searchTerm.trim().toLowerCase();
        if (!term) return true;
        return (
          w.name?.toLowerCase().includes(term) ||
          w.workerId?.toLowerCase().includes(term) ||
          w.phone?.toLowerCase().includes(term) ||
          String(w.machineNumber || '').toLowerCase().includes(term)
        );
      });
  }, [workers, entries, searchTerm]);

  // Overall Statistics
  const totalWorkersWorking = entries.reduce((sum, e) => sum + (Number(e.workerCount) || 1), 0);
  const totalHours = entries.reduce((sum, e) => sum + (e.hoursWorked || 0), 0);
  const totalExtraWork = entries.filter(e => e.isExtraWork).length;
  const pendingCount = entries.filter(e => e.status === 'pending').length;
  const totalBonusEarned = entries.reduce((sum, e) => {
    return sum + (Number(e.extraPay) || 0) + calculateDesignBonus({
      designStitch: e.designStitch,
      machineStitch: e.machineStitch,
      frame: e.frame,
      workerCount: e.workerCount
    });
  }, 0) + workers.reduce((sum, w) => sum + (Number(w.bonus) || 0), 0);

  // Export Entries CSV
  const handleExportCSV = () => {
    if (entries.length === 0) {
      toast.error('No data available to export');
      return;
    }

    const headers = ['Date', 'Worker Name', 'Worker ID', 'Machine #', 'Design #', 'Design Stitch', 'Machine Stitch', 'Frame', 'Workers', 'Calculated Total', 'Overtime', 'Extra Pay', 'Status'];
    const rows = entries.map(e => [
      e.date || '',
      `"${e.workerName || ''}"`,
      `"${e.workerId || ''}"`,
      `"${e.machineNumber || ''}"`,
      `"${e.designNumber || ''}"`,
      e.designStitch || 0,
      e.machineStitch || 0,
      e.frame || 1,
      e.workerCount || 1,
      e.calculatedTotal || 0,
      e.isExtraWork ? 'Yes' : 'No',
      e.extraPay || 0,
      e.status || 'pending'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Bansi_Fashion_Work_Entries_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Work entries report downloaded!');
  };

  // Export Registered Workers Summary CSV
  const handleExportWorkersCSV = () => {
    if (workers.length === 0) {
      toast.error('No registered workers to export');
      return;
    }

    const headers = ['Worker ID', 'Name', 'Phone', 'Machine #', 'Base Salary (₹)', 'Bonus / Upad (₹)', 'Net Est. Pay (₹)'];
    const rows = registeredWorkersList.map(w => [
      `"${w.workerId || ''}"`,
      `"${w.name || ''}"`,
      `"${w.phone || ''}"`,
      `"${w.machineNumber || ''}"`,
      w.salary || 0,
      w.bonus || 0,
      w.netSalary || 0
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Bansi_Fashion_Workers_Directory.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Workers Directory CSV downloaded!');
  };

  const handleExportJSONBackup = () => {
    const backupData = {
      appName: 'Bansi Fashion Industrial ERP',
      exportedAt: new Date().toISOString(),
      workersCount: workers.length,
      entriesCount: entries.length,
      workers,
      entries
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const link = document.createElement('a');
    link.setAttribute('href', dataStr);
    link.setAttribute('download', `Bansi_Fashion_Full_Backup_${selectedDate}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Complete Database JSON Backup downloaded successfully!');
  };

  const handlePrint = () => {
    window.print();
  };

  const todayFormatted = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  return (
    <>
      <Navbar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        entriesCount={entries.length}
        pendingCount={pendingCount}
        workersCount={workers.length}
      />
      <div className="dashboard mobile-app-container">
        {/* Header with Title and Actions */}
        <div className="page-header">
          <div>
            <h1 className="page-title">
              <span>Bansi Fashion</span> &nbsp;Admin Portal
            </h1>
            <p className="page-subtitle">
              <Calendar size={15} /> {todayFormatted}
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="stats-grid">
          <div
            className="stat-card stat-card-1"
            style={{ cursor: 'pointer' }}
            onClick={() => handleTabChange('workers')}
            title="Click to view all registered workers details"
          >
            <div className="stat-icon"><Users size={24} /></div>
            <div className="stat-content">
              <div className="stat-value">{workers.length}</div>
              <div className="stat-label">Registered Workers</div>
            </div>
          </div>

          <div className="stat-card stat-card-2">
            <div className="stat-icon"><Clock size={24} /></div>
            <div className="stat-content">
              <div className="stat-value">{totalHours.toFixed(1)}</div>
              <div className="stat-label">Total Hours</div>
            </div>
          </div>

          <div className="stat-card stat-card-3">
            <div className="stat-icon"><Zap size={24} /></div>
            <div className="stat-content">
              <div className="stat-value">{totalExtraWork}</div>
              <div className="stat-label">Overtime Entries</div>
            </div>
          </div>

          <div className="stat-card stat-card-4" style={{ cursor: 'pointer' }} onClick={() => handleTabChange('reports')} title="Total Auto-Calculated Bonus">
            <div className="stat-icon"><DollarSign size={24} /></div>
            <div className="stat-content">
              <div className="stat-value">₹{totalBonusEarned.toFixed(0)}</div>
              <div className="stat-label">Total Bonus Earned</div>
            </div>
          </div>
        </div>

        {/* Date Filter Toolbar (Shown for entries tabs) */}
        {['today', 'range', 'all', 'pending'].includes(activeTab) && (
          <div className="admin-toolbar">
            <div className="toolbar-header">
              <div className="toolbar-left">
                <Filter size={17} color="var(--primary)" />
                <span>Production & Date Filters</span>
              </div>
            </div>

            <div className="toolbar-grid">
              <div className="date-range-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', flexWrap: 'wrap' }}>
                <span className="range-separator">Date Range:</span>
                <input
                  type="date"
                  className="form-control range-input"
                  style={{ minWidth: '130px', flex: 1 }}
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  aria-label="Start date"
                />
                <span className="range-separator">to</span>
                <input
                  type="date"
                  className="form-control range-input"
                  style={{ minWidth: '130px', flex: 1 }}
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  aria-label="End date"
                />
                <button
                  className="btn btn-accent btn-sm apply-range-btn"
                  onClick={() => fetchRange(startDate, endDate)}
                >
                  Apply Range
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Search Bar */}
        {['today', 'range', 'all', 'pending', 'workers'].includes(activeTab) && (
          <div className="search-wrapper">
            <Search size={18} className="search-icon-pos" />
            <input
              type="text"
              className="form-control search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={activeTab === 'workers' ? "Search workers by name, worker ID, phone, machine #..." : "Search by worker name, worker ID, machine # or design #..."}
            />
          </div>
        )}

        {/* Desktop Navigation Tabs */}
        <div className="tabs desktop-tabs">
          <button
            id="tab-admin-today"
            className={`tab ${activeTab === 'today' ? 'active' : ''}`}
            onClick={() => handleTabChange('today')}
          >
            <Calendar size={15} /> By Date ({entries.length})
          </button>
          <button
            id="tab-admin-pending"
            className={`tab ${activeTab === 'pending' ? 'active' : ''}`}
            onClick={() => handleTabChange('pending')}
            style={{ color: pendingCount > 0 ? 'var(--danger)' : 'inherit', fontWeight: pendingCount > 0 ? 700 : 500 }}
          >
            <AlertCircle size={15} color={pendingCount > 0 ? "var(--danger)" : "currentColor"} /> Pending Reviews ({pendingCount})
          </button>
          <button
            id="tab-admin-reports"
            className={`tab ${activeTab === 'reports' ? 'active' : ''}`}
            onClick={() => handleTabChange('reports')}
          >
            <FileText size={15} /> Commission & Reports
          </button>
          <button
            id="tab-admin-analytics"
            className={`tab ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => handleTabChange('analytics')}
          >
            <TrendingUp size={15} /> Analytics Dashboard
          </button>
          <button
            id="tab-admin-payslips"
            className={`tab ${activeTab === 'payslips' ? 'active' : ''}`}
            onClick={() => handleTabChange('payslips')}
          >
            <FileText size={15} /> Salary Slips (PDF)
          </button>
          <button
            id="tab-admin-upad"
            className={`tab ${activeTab === 'upad' ? 'active' : ''}`}
            onClick={() => handleTabChange('upad')}
          >
            <DollarSign size={15} /> Upad / Advance Tracker
          </button>
          <button
            id="tab-admin-machines"
            className={`tab ${activeTab === 'machines' ? 'active' : ''}`}
            onClick={() => handleTabChange('machines')}
          >
            <Cpu size={15} /> Machine Maintenance
          </button>
          <button
            id="tab-admin-inventory"
            className={`tab ${activeTab === 'inventory' ? 'active' : ''}`}
            onClick={() => handleTabChange('inventory')}
          >
            <Package size={15} /> Designs & Stock Inventory
          </button>
          <button
            id="tab-admin-workers"
            className={`tab ${activeTab === 'workers' ? 'active' : ''}`}
            onClick={() => handleTabChange('workers')}
          >
            <Users size={15} /> Registered Workers ({workers.length})
          </button>
          <button
            id="tab-admin-all"
            className={`tab ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => handleTabChange('all')}
          >
            <CheckCircle2 size={15} /> All Entries
          </button>
        </div>

        {/* ENTERPRISE VIEWS */}
        {activeTab === 'reports' ? (
          <CommissionReport entries={entries} workers={workers} />
        ) : activeTab === 'analytics' ? (
          <AnalyticsCharts entries={entries} workers={workers} />
        ) : activeTab === 'payslips' ? (
          <PayslipGenerator workers={workers} entries={entries} />
        ) : activeTab === 'upad' ? (
          <AdvancePaymentModal workers={workers} />
        ) : activeTab === 'machines' ? (
          <MachineStatusTracker />
        ) : activeTab === 'inventory' ? (
          <InventoryManager />
        ) : activeTab === 'workers' ? (
          registeredWorkersList.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">👷</div>
              <div className="empty-state-text">No registered workers found</div>
              <div className="empty-state-sub">Click "Add / Update Worker" above to register a new worker.</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
              {registeredWorkersList.map(worker => (
                <div key={worker.workerId} className="worker-group-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                      <div className="worker-info-block">
                        <div className="entry-avatar">
                          {worker.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'W'}
                        </div>
                        <div>
                          <div className="worker-name">{worker.name}</div>
                          <div className="worker-id-tag">ID: {worker.workerId}</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => handleEditWorkerClick(worker)}
                          title="Edit Worker Details"
                        >
                          <Edit size={14} /> Edit
                        </button>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => handleDeleteWorker(worker)}
                          title="Delete Worker Permanently"
                          style={{ color: 'var(--danger)' }}
                        >
                          <Trash2 size={14} /> Delete
                        </button>
                      </div>
                    </div>

                    <div className="worker-summary-strip" style={{ gridTemplateColumns: '1fr 1fr', gap: '0.65rem', overflow: 'hidden' }}>
                      <div className="summary-item" style={{ minWidth: 0 }}>
                        <span className="summary-label"><Phone size={11} /> Phone</span>
                        <span className="summary-value" style={{ fontSize: '0.85rem', wordBreak: 'break-word' }}>
                          {worker.phone ? (
                            <a href={`tel:${worker.phone}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                              📞 {worker.phone}
                            </a>
                          ) : 'Not Provided'}
                        </span>
                      </div>
                      <div className="summary-item" style={{ minWidth: 0 }}>
                        <span className="summary-label">🪪 Aadhaar No.</span>
                        <span className="summary-value" style={{ fontSize: '0.85rem', wordBreak: 'break-word' }}>{worker.aadhaarNumber || 'Not Provided'}</span>
                      </div>
                      <div className="summary-item" style={{ minWidth: 0 }}>
                        <span className="summary-label">🔑 Password</span>
                        <span className="summary-value" style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 700, wordBreak: 'break-all' }}>
                          {worker.plainPassword ? worker.plainPassword : (worker.password ? '••••••••' : 'N/A')}
                        </span>
                      </div>
                      <div className="summary-item" style={{ minWidth: 0 }}>
                        <span className="summary-label"><Cpu size={11} /> Machine #</span>
                        <span className="summary-value" style={{ fontSize: '0.85rem', wordBreak: 'break-word' }}>{worker.machineNumber || 'Unassigned'}</span>
                      </div>
                      <div className="summary-item" style={{ minWidth: 0 }}>
                        <span className="summary-label">Base Salary</span>
                        <span className="summary-value">₹{worker.salary || 0}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ paddingTop: '0.75rem', borderTop: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                      <FileText size={13} style={{ verticalAlign: 'middle' }} /> {worker.totalEntries} Work Entries
                    </span>
                    <button
                      className="btn btn-accent btn-sm"
                      onClick={() => setSelectedWorkerReport(worker)}
                    >
                      <TrendingUp size={14} /> View Report
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          /* WORK ENTRIES LIST VIEW */
          loading ? (
            <div className="loading"><div className="spinner" /></div>
          ) : filteredWorkerGroups.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📭</div>
              <div className="empty-state-text">No work entries found</div>
              <div className="empty-state-sub">No entries match your selected date or search filter.</div>
            </div>
          ) : (
            <div className="entries-list">
              {filteredWorkerGroups.map((group) => (
                <div key={group.workerId} className="worker-group-card">
                  {/* Worker Group Header */}
                  <div className="worker-group-header">
                    <div className="worker-info-block">
                      <div className="entry-avatar">
                        {group.workerName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'W'}
                      </div>
                      <div>
                        <div className="worker-name">{group.workerName}</div>
                        <div className="worker-id-tag">ID: {group.workerId}</div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                        {group.entries.reduce((s, e) => s + (Number(e.workerCount) || 1), 0)} workers &nbsp;•&nbsp;
                        {group.entries.length} {group.entries.length === 1 ? 'entry' : 'entries'} &nbsp;•&nbsp;
                        {group.entries.reduce((s, e) => s + (e.hoursWorked || 0), 0).toFixed(1)} hrs
                      </span>
                      {group.entries.some(e => e.isExtraWork) && (
                        <span className="extra-work-badge">⚡ Overtime</span>
                      )}
                    </div>
                  </div>

                  {/* Worker Metrics Summary Strip */}
                  <div className="worker-summary-strip">
                    <div className="summary-item">
                      <span className="summary-label">Salary</span>
                      <span className="summary-value">₹{group.salary}</span>
                    </div>
                    <div className="summary-item">
                      <span className="summary-label">Bonus / Upad</span>
                      <span className="summary-value" style={{ color: 'var(--primary)' }}>₹{group.bonus}</span>
                    </div>
                    <div className="summary-item">
                      <span className="summary-label">Total Pay</span>
                      <span className="summary-value" style={{ color: 'var(--success)' }}>₹{(group.salary + group.bonus).toFixed(0)}</span>
                    </div>
                    <div className="summary-item">
                      <span className="summary-label">Extra Workers</span>
                      <span className="summary-value">{group.extraWorkers}</span>
                    </div>
                    <div className="summary-item">
                      <span className="summary-label">Total Output</span>
                      <span className="summary-value">{group.totalCalculated.toFixed(1)}</span>
                    </div>
                    <div className="summary-item">
                      <span className="summary-label">Machine</span>
                      <span className="summary-value">{group.machineNumbers}</span>
                    </div>
                    <div className="summary-item">
                      <span className="summary-label">Design</span>
                      <span className="summary-value">{group.designNumbers}</span>
                    </div>
                  </div>

                  {/* Worker's Individual Entries */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {group.entries.map(entry => (
                      <WorkEntryCard
                        key={entry._id}
                        entry={entry}
                        isAdmin={true}
                        onStatusUpdate={handleStatusUpdate}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* DETAILED WORKER PERFORMANCE MODAL */}
        {selectedWorkerReport && (
          <div className="modal-overlay" onClick={() => setSelectedWorkerReport(null)}>
            <div className="modal-content" style={{ maxWidth: '680px' }} onClick={(e) => e.stopPropagation()}>
              <div className="modal-header" style={{ alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', flex: 1, minWidth: 0 }}>
                  <div className="entry-avatar" style={{ flexShrink: 0, marginTop: '2px', width: '42px', height: '42px', fontSize: '1rem' }}>
                    {selectedWorkerReport.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'W'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h2 className="modal-title" style={{ fontSize: '1.2rem', margin: 0, fontWeight: 800, lineHeight: 1.3 }}>
                      {selectedWorkerReport.name}
                    </h2>
                    <div className="worker-meta-row">
                      <span className="meta-badge-item">ID: <strong>{selectedWorkerReport.workerId}</strong></span>
                      <span className="meta-badge-item">Phone: <strong>{selectedWorkerReport.phone || 'N/A'}</strong></span>
                      <span className="meta-badge-item">Aadhaar: <strong>{selectedWorkerReport.aadhaarNumber || 'N/A'}</strong></span>
                      <span className="meta-badge-item">Pass: <strong style={{ color: 'var(--primary)' }}>{selectedWorkerReport.plainPassword || (selectedWorkerReport.password ? '••••••••' : 'N/A')}</strong></span>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDeleteWorker(selectedWorkerReport)}
                    title="Delete Worker Permanently"
                    style={{ fontSize: '0.8rem', padding: '0.35rem 0.65rem' }}
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                  <button
                    className="modal-close"
                    onClick={() => setSelectedWorkerReport(null)}
                    aria-label="Close modal"
                    style={{ marginTop: '-2px' }}
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Performance Metrics Cards */}
              <div className="perf-metrics-grid">
                <div className="perf-metric-card card-salary">
                  <span className="perf-metric-label" style={{ color: 'var(--text-muted)' }}>Base Salary</span>
                  <div className="perf-metric-value" style={{ color: 'var(--text-primary)' }}>₹{(selectedWorkerReport.salary || 0).toLocaleString('en-IN')}</div>
                </div>
                <div className="perf-metric-card card-bonus">
                  <span className="perf-metric-label" style={{ color: '#4338ca' }}>Bonus / Upad</span>
                  <div className="perf-metric-value" style={{ color: '#4f46e5' }}>₹{(selectedWorkerReport.bonus || 0).toLocaleString('en-IN')}</div>
                </div>
                <div className="perf-metric-card card-net">
                  <span className="perf-metric-label" style={{ color: '#047857' }}>Net Pay Est.</span>
                  <div className="perf-metric-value" style={{ color: '#059669' }}>₹{Math.round(selectedWorkerReport.netSalary).toLocaleString('en-IN')}</div>
                </div>
              </div>

              {/* Work Entries Record List */}
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileText size={16} /> Work Entries History ({selectedWorkerReport.entries.length})
              </h3>

              {selectedWorkerReport.entries.length === 0 ? (
                <div className="empty-state" style={{ padding: '1.5rem 0' }}>
                  <div className="empty-state-text">No work entries found for this date range</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', maxHeight: '350px', overflowY: 'auto', paddingRight: '4px' }}>
                  {selectedWorkerReport.entries.map(entry => (
                    <WorkEntryCard key={entry._id} entry={entry} isAdmin={true} onStatusUpdate={handleStatusUpdate} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ADD / EDIT WORKER MODAL */}
        {showSalaryModal && (
          <div className="modal-overlay" onClick={() => setShowSalaryModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2 className="modal-title">💰 Add / Update Worker Details</h2>
                <button
                  className="modal-close"
                  onClick={() => setShowSalaryModal(false)}
                  aria-label="Close modal"
                >
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleWorkerSubmit} className="worker-form-grid">
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">👤 Worker Full Name</label>
                  <input
                    type="text"
                    name="name"
                    className="form-control"
                    value={workerForm.name}
                    onChange={handleWorkerFormChange}
                    placeholder="Worker full name"
                    required
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">🪪 Worker ID</label>
                  <input
                    type="text"
                    name="workerId"
                    className="form-control"
                    value={workerForm.workerId}
                    onChange={handleWorkerFormChange}
                    placeholder="e.g. WORKER001"
                    autoCapitalize="characters"
                    required
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">📞 Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    className="form-control"
                    value={workerForm.phone}
                    onChange={handleWorkerFormChange}
                    placeholder="10-digit phone number"
                    maxLength={10}
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">🪪 Aadhaar Card Number</label>
                  <input
                    type="text"
                    name="aadhaarNumber"
                    className="form-control"
                    value={workerForm.aadhaarNumber}
                    onChange={handleWorkerFormChange}
                    placeholder="12-digit Aadhaar Card number"
                    maxLength={12}
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">🤖 Machine Number (Default)</label>
                  <input
                    type="text"
                    name="machineNumber"
                    className="form-control"
                    value={workerForm.machineNumber}
                    onChange={handleWorkerFormChange}
                    placeholder="e.g. M-12"
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">💵 Base Salary (₹)</label>
                  <input
                    type="number"
                    name="salary"
                    className="form-control"
                    value={workerForm.salary}
                    onChange={handleWorkerFormChange}
                    placeholder="0"
                    min="0"
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">🎁 Bonus / Upad (₹)</label>
                  <input
                    type="number"
                    name="bonus"
                    className="form-control"
                    value={workerForm.bonus}
                    onChange={handleWorkerFormChange}
                    placeholder="0"
                    min="0"
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">🔒 Set / Reset Password</label>
                  <input
                    type="password"
                    name="password"
                    className="form-control"
                    value={workerForm.password}
                    onChange={handleWorkerFormChange}
                    placeholder="Leave empty to keep existing password"
                  />
                </div>
                <div className="worker-form-actions">
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => setShowSalaryModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary btn-sm">
                    <PlusCircle size={15} /> Save Details
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default AdminDashboard;
