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

  // Instant Stale-While-Revalidate initialization from cache
  const [entries, setEntries] = useState(() => {
    try {
      const cached = localStorage.getItem('bf_admin_entries');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });

  const [workers, setWorkers] = useState(() => {
    try {
      const cached = localStorage.getItem('bf_admin_workers');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });

  const [advances, setAdvances] = useState(() => {
    try {
      const cached = localStorage.getItem('bf_admin_advances');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });

  // Only set loading to true if there is NO cached data at all
  const [loading, setLoading] = useState(() => {
    try {
      const hasCachedWorkers = localStorage.getItem('bf_admin_workers');
      const hasCachedEntries = localStorage.getItem('bf_admin_entries');
      return !(hasCachedWorkers || hasCachedEntries);
    } catch {
      return true;
    }
  });

  const [isSyncing, setIsSyncing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [activeTab, setActiveTab] = useState('today');
  const [searchTerm, setSearchTerm] = useState('');
  const [showSalaryModal, setShowSalaryModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedWorkerReport, setSelectedWorkerReport] = useState(null);
  const [reportMonth, setReportMonth] = useState(new Date().toISOString().slice(0, 7));
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
      const cachedData = entriesCache.get(`date_${date}`);
      setEntries(cachedData);
      if (isSilent) return;
    } else if (!isSilent && entries.length === 0) {
      setLoading(true);
    }
    
    setIsSyncing(true);
    try {
      const res = await axios.get(`${API}/work/admin/date/${date}`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 25000
      });
      const data = res.data || [];
      entriesCache.set(`date_${date}`, data);
      setEntries(data);
      if (date === new Date().toISOString().split('T')[0]) {
        try { localStorage.setItem('bf_admin_entries', JSON.stringify(data)); } catch {}
      }
    } catch (err) {
      if (!isSilent) {
        toast.error('Failed to load entries. Server may be connecting...');
      }
    } finally {
      setLoading(false);
      setIsSyncing(false);
    }
  };

  const fetchAll = async (isSilent = false) => {
    if (entriesCache.has('all')) {
      const cachedData = entriesCache.get('all');
      setEntries(cachedData);
      if (isSilent) return;
    } else if (!isSilent && entries.length === 0) {
      setLoading(true);
    }

    setIsSyncing(true);
    try {
      const res = await axios.get(`${API}/work/admin/all`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 30000
      });
      const data = res.data || [];
      entriesCache.set('all', data);
      setEntries(data);
    } catch (err) {
      if (!isSilent) {
        toast.error('Failed to load all entries');
      }
    } finally {
      setLoading(false);
      setIsSyncing(false);
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
    setIsSyncing(true);
    try {
      const res = await axios.get(`${API}/work/admin/all?from=${from}&to=${to}`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 30000
      });
      const data = res.data || [];
      entriesCache.set(cacheKey, data);
      setEntries(data);
      setActiveTab('range');
    } catch {
      toast.error('Failed to load date range');
    } finally {
      setLoading(false);
      setIsSyncing(false);
    }
  };

  const fetchWorkers = async (isSilent = false) => {
    try {
      const res = await axios.get(`${API}/auth/workers`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 25000
      });
      const data = res.data || [];
      setWorkers(data);
      try { localStorage.setItem('bf_admin_workers', JSON.stringify(data)); } catch {}
    } catch (err) {
      if (!isSilent) {
        toast.error('Failed to load worker details');
      }
    }
  };

  const fetchAdvances = async () => {
    try {
      const res = await axios.get(`${API}/advance/all`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 25000
      });
      const data = res.data || [];
      setAdvances(data);
      try { localStorage.setItem('bf_admin_advances', JSON.stringify(data)); } catch {}
    } catch {
      // silent fallback
    }
  };

  // Initial mount load: parallel requests without blocking UI if cache exists
  useEffect(() => {
    let isMounted = true;

    const loadAllInitial = async () => {
      setIsSyncing(true);
      try {
        await Promise.allSettled([
          fetchByDate(selectedDate, true),
          fetchWorkers(true),
          fetchAdvances()
        ]);
      } finally {
        if (isMounted) {
          setLoading(false);
          setIsSyncing(false);
        }
      }
    };

    loadAllInitial();

    return () => {
      isMounted = false;
    };
  }, []);

  // Safe background auto-refresh every 15 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      if (activeTab === 'all' || activeTab === 'pending') {
        fetchAll(true);
      } else if (activeTab === 'today') {
        fetchByDate(selectedDate, true);
      }
      fetchWorkers(true);
      fetchAdvances();
    }, 15000);

    return () => clearInterval(timer);
  }, [activeTab, selectedDate]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (['all', 'pending', 'workers', 'reports', 'analytics', 'payslips', 'upad'].includes(tab)) {
      if (!entriesCache.has('all')) {
        fetchAll(entries.length > 0);
      }
    } else if (tab === 'range') {
      fetchRange(startDate, endDate);
    } else if (tab === 'today') {
      fetchByDate(selectedDate);
    }
  };

  const handleDateChange = (e) => {
    const newDate = e.target.value;
    setSelectedDate(newDate);
    fetchByDate(newDate);
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

  const filteredEntries = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return activeEntries;
    return activeEntries.filter(e =>
      e.workerName?.toLowerCase().includes(term) ||
      e.workerId?.toLowerCase().includes(term) ||
      String(e.machineNumber || '').toLowerCase().includes(term) ||
      String(e.designNumber || '').toLowerCase().includes(term) ||
      String(e.description || '').toLowerCase().includes(term)
    );
  }, [activeEntries, searchTerm]);

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
        const workerAdvances = advances.filter(a => a.workerId === w.workerId);
        const totalUpad = workerAdvances.reduce((sum, a) => sum + (Number(a.amount) || 0), 0);
        const grossPay = (w.salary || 0) + (w.bonus || 0) + totalExtraPay + totalDesignBonus;
        const netSalary = Math.max(0, grossPay - totalUpad);

        return {
          ...w,
          totalEntries,
          totalHours,
          totalExtraPay,
          totalDesignBonus,
          totalUpad,
          grossPay,
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
  }, [workers, entries, advances, searchTerm]);

  // Calculate month-wise stats for selected worker report
  const workerReportData = useMemo(() => {
    if (!selectedWorkerReport) return null;

    const workerEntries = entries.filter(e => e.workerId === selectedWorkerReport.workerId);
    const filteredByMonth = reportMonth
      ? workerEntries.filter(e => e.date && e.date.startsWith(reportMonth))
      : workerEntries;

    const totalEntriesCount = filteredByMonth.length;
    const totalHours = filteredByMonth.reduce((sum, e) => sum + (e.hoursWorked || 0), 0);
    const totalExtraPay = filteredByMonth.reduce((sum, e) => sum + (Number(e.extraPay) || 0), 0);
    const totalDesignBonus = filteredByMonth.reduce((sum, e) => {
      return sum + calculateDesignBonus({
        designStitch: e.designStitch,
        machineStitch: e.machineStitch,
        frame: e.frame,
        workerCount: e.workerCount
      });
    }, 0);

    const workerAdvances = advances.filter(a =>
      a.workerId === selectedWorkerReport.workerId &&
      (!reportMonth || (a.date && a.date.startsWith(reportMonth)))
    );
    const totalUpad = workerAdvances.reduce((sum, a) => sum + (Number(a.amount) || 0), 0);

    const bonusTotal = (Number(selectedWorkerReport.bonus) || 0) + totalDesignBonus + totalExtraPay;
    const grossPay = (Number(selectedWorkerReport.salary) || 0) + bonusTotal;
    const netSalary = Math.max(0, grossPay - totalUpad);

    return {
      entries: filteredByMonth,
      totalEntriesCount,
      totalHours,
      totalDesignBonus,
      totalExtraPay,
      bonusTotal,
      totalUpad,
      grossPay,
      netSalary
    };
  }, [selectedWorkerReport, entries, advances, reportMonth]);

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
        <div className="page-header" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.25rem', paddingBottom: '0.5rem', width: '100%' }}>
          <div>
            <h1 className="page-title" style={{ margin: 0, fontSize: '1.65rem', fontWeight: 800, lineHeight: 1.25 }}>
              <span>Bansi Fashion</span> &nbsp;Admin Portal
            </h1>
            <p className="page-subtitle" style={{ margin: 0, marginTop: '0.2rem', color: 'var(--text-muted)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 500 }}>
              <Calendar size={14} /> {todayFormatted}
            </p>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {isSyncing && (
              <span className="badge" style={{ background: '#e0e7ff', color: '#4338ca', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', padding: '4px 8px', borderRadius: '20px' }}>
                <RefreshCw size={12} className="spinning-icon" /> Syncing...
              </span>
            )}
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => {
                fetchByDate(selectedDate);
                fetchWorkers();
                fetchAdvances();
                if (['all', 'reports', 'analytics', 'payslips'].includes(activeTab)) {
                  fetchAll();
                }
                toast.success('Refreshing data...');
              }}
              title="Refresh all data"
              style={{ fontSize: '0.8rem', padding: '0.35rem 0.65rem' }}
            >
              <RefreshCw size={14} className={isSyncing ? 'spinning-icon' : ''} /> Refresh
            </button>
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

          <div className="stat-card stat-card-3" title="Total Work Entries">
            <div className="stat-icon"><FileText size={24} /></div>
            <div className="stat-content">
              <div className="stat-value">{entries.length}</div>
              <div className="stat-label">Total Work Entries</div>
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
          <PayslipGenerator workers={workers} entries={entries} advances={advances} />
        ) : activeTab === 'upad' ? (
          <AdvancePaymentModal workers={workers} onAdvancesChange={fetchAdvances} />
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
                    {/* Worker Header: Name on top, Edit/Delete below */}
                    <div style={{ marginBottom: '1rem' }}>
                      <div className="worker-info-block" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.65rem' }}>
                        <div className="entry-avatar">
                          {worker.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'W'}
                        </div>
                        <div>
                          <div className="worker-name" style={{ fontSize: '1.05rem', fontWeight: 800 }}>
                            {worker.name}
                          </div>
                          <div className="worker-id-tag">
                            ID: {worker.workerId}
                          </div>
                        </div>
                      </div>

                      {/* Edit and Delete Buttons underneath Name */}
                      <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => handleEditWorkerClick(worker)}
                          title="Edit Worker Details"
                          style={{ flex: 1, justifyContent: 'center', fontSize: '0.82rem', padding: '0.4rem 0.75rem' }}
                        >
                          <Edit size={14} /> Edit
                        </button>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => handleDeleteWorker(worker)}
                          title="Delete Worker Permanently"
                          style={{ flex: 1, justifyContent: 'center', color: 'var(--danger)', borderColor: '#fecaca', fontSize: '0.82rem', padding: '0.4rem 0.75rem' }}
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
                      <div className="summary-item" style={{ minWidth: 0 }}>
                        <span className="summary-label">Total Upad</span>
                        <span className="summary-value" style={{ color: (worker.totalUpad || 0) > 0 ? 'var(--danger)' : 'var(--text-secondary)', fontWeight: 700 }}>
                          {(worker.totalUpad || 0) > 0 ? `-₹${worker.totalUpad.toLocaleString()}` : '₹0'}
                        </span>
                      </div>
                      <div className="summary-item" style={{ minWidth: 0 }}>
                        <span className="summary-label">Net Est. Pay</span>
                        <span className="summary-value" style={{ color: 'var(--success)', fontWeight: 800 }}>
                          ₹{Math.round(worker.netSalary).toLocaleString()}
                        </span>
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
            <div className="loading" style={{ minHeight: '220px' }}>
              <div className="spinner" />
              <div style={{ color: 'var(--text-muted)', fontSize: '0.88rem', fontWeight: 600, marginTop: '0.5rem' }}>
                ⚡ Loading live entries...
              </div>
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📭</div>
              <div className="empty-state-text">No work entries found</div>
              <div className="empty-state-sub">No entries match your selected date or search filter.</div>
            </div>
          ) : (
            <div className="entries-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {filteredEntries.map(entry => (
                <WorkEntryCard
                  key={entry._id || entry.id}
                  entry={entry}
                  isAdmin={true}
                  onStatusUpdate={handleStatusUpdate}
                />
              ))}
            </div>
          )
        )}

        {/* DETAILED WORKER PERFORMANCE MODAL */}
        {selectedWorkerReport && workerReportData && (
          <div className="modal-overlay" onClick={() => setSelectedWorkerReport(null)}>
            <div className="modal-content" style={{ maxWidth: '680px' }} onClick={(e) => e.stopPropagation()}>
              <div className="modal-header" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '0.45rem', marginBottom: '0.65rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0, flex: 1 }}>
                    <div className="entry-avatar" style={{ flexShrink: 0, width: '40px', height: '40px', fontSize: '0.95rem' }}>
                      {selectedWorkerReport.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'W'}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <h2 className="modal-title" style={{ fontSize: '1.15rem', margin: 0, fontWeight: 800, lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {selectedWorkerReport.name}
                      </h2>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDeleteWorker(selectedWorkerReport)}
                      title="Delete Worker Permanently"
                      style={{ fontSize: '0.75rem', padding: '0.3rem 0.55rem' }}
                    >
                      <Trash2 size={13} /> Delete
                    </button>
                    <button
                      className="modal-close"
                      onClick={() => setSelectedWorkerReport(null)}
                      aria-label="Close modal"
                      style={{ width: '32px', height: '32px' }}
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>

                <div className="worker-meta-row" style={{ marginTop: '0.1rem' }}>
                  <span className="meta-badge-item">ID: <strong>{selectedWorkerReport.workerId}</strong></span>
                  <span className="meta-badge-item">Phone: <strong>{selectedWorkerReport.phone || 'N/A'}</strong></span>
                  <span className="meta-badge-item">Aadhaar: <strong>{selectedWorkerReport.aadhaarNumber || 'N/A'}</strong></span>
                  <span className="meta-badge-item">Pass: <strong style={{ color: 'var(--primary)' }}>{selectedWorkerReport.plainPassword || (selectedWorkerReport.password ? '••••••••' : 'N/A')}</strong></span>
                </div>
              </div>

              {/* Month Selector Strip */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc', padding: '0.55rem 0.75rem', borderRadius: '10px', margin: '0.65rem 0', border: '1px solid var(--border)', flexWrap: 'wrap', gap: '0.4rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-primary)' }}>
                  <Calendar size={15} color="var(--primary)" />
                  <span>Report Month (મહિનો) :</span>
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

              {/* Performance Metrics Cards */}
              <div className="perf-metrics-grid">
                <div className="perf-metric-card card-salary">
                  <span className="perf-metric-label" style={{ color: 'var(--text-muted)' }}>Base Salary</span>
                  <div className="perf-metric-value" style={{ color: 'var(--text-primary)' }}>₹{(selectedWorkerReport.salary || 0).toLocaleString('en-IN')}</div>
                </div>
                <div className="perf-metric-card card-bonus">
                  <span className="perf-metric-label" style={{ color: '#4338ca' }}>Bonus / Overtime</span>
                  <div className="perf-metric-value" style={{ color: '#4f46e5' }}>+₹{workerReportData.bonusTotal.toLocaleString('en-IN')}</div>
                </div>
                <div className="perf-metric-card" style={{ background: '#fef2f2', border: '1.5px solid #fecaca', borderRadius: '10px', padding: '0.75rem 0.5rem' }}>
                  <span className="perf-metric-label" style={{ color: '#dc2626', fontWeight: 700 }}>Month Upad</span>
                  <div className="perf-metric-value" style={{ color: '#b91c1c', fontWeight: 800 }}>-₹{workerReportData.totalUpad.toLocaleString('en-IN')}</div>
                </div>
                <div className="perf-metric-card card-net">
                  <span className="perf-metric-label" style={{ color: '#047857' }}>Net Pay Est.</span>
                  <div className="perf-metric-value" style={{ color: '#059669', fontWeight: 800 }}>₹{Math.round(workerReportData.netSalary).toLocaleString('en-IN')}</div>
                </div>
              </div>

              {/* Work Entries Record List */}
              <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '1rem 0 0.5rem 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.4rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FileText size={16} /> {reportMonth ? `${new Date(reportMonth + '-01').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })} Entries` : 'All Entries History'} ({workerReportData.entries.length})
                </span>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                  {workerReportData.totalHours.toFixed(1)} Total Hrs
                </span>
              </h3>

              {workerReportData.entries.length === 0 ? (
                <div className="empty-state" style={{ padding: '1.5rem 0' }}>
                  <div className="empty-state-text">No work entries found for {reportMonth ? new Date(reportMonth + '-01').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) : 'selected period'}</div>
                  <div className="empty-state-sub" style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    New month entries start at 00. Entries will appear automatically as they are submitted.
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  {workerReportData.entries.map(entry => (
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
