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
import ImageModal from '../components/ImageModal';
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
  const [workerModalTab, setWorkerModalTab] = useState('overview');
  const [entriesViewMode, setEntriesViewMode] = useState('table');
  const [previewImage, setPreviewImage] = useState(null);
  const [editingEntry, setEditingEntry] = useState(null);
  const [editEntryForm, setEditEntryForm] = useState({
    date: '',
    shift: 'day',
    machineNumber: '',
    designNumber: '',
    designStitch: '',
    machineStitch: '',
    frame: '',
    workerCount: 1,
    extraPay: '',
    proofImage: '',
    proofImage2: ''
  });
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

  useEffect(() => {
    if (selectedWorkerReport || showSalaryModal || editingEntry || previewImage) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [selectedWorkerReport, showSalaryModal, editingEntry, previewImage]);

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

  // Prevent background scroll when modals are open (ensures smooth modal touch scroll)
  useEffect(() => {
    if (selectedWorkerReport || showSalaryModal) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevOverflow || '';
      };
    }
  }, [selectedWorkerReport, showSalaryModal]);

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

  const handleOpenEditEntry = (entry) => {
    setEditingEntry(entry);
    setEditEntryForm({
      date: entry.date || '',
      shift: entry.shift || 'day',
      machineNumber: entry.machineNumber || '',
      designNumber: entry.designNumber || '',
      designStitch: entry.designStitch !== undefined ? entry.designStitch : '',
      machineStitch: entry.machineStitch !== undefined ? entry.machineStitch : '',
      frame: entry.frame || 1,
      workerCount: entry.workerCount || 1,
      extraPay: entry.extraPay || '',
      proofImage: entry.proofImage || entry.photo || entry.image || '',
      proofImage2: entry.proofImage2 || ''
    });
  };

  const handleEditEntryPhotoChange = (e, field = 'proofImage') => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditEntryForm(prev => ({ ...prev, [field]: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveEditEntry = async (e) => {
    e.preventDefault();
    if (!editingEntry) return;

    const toastId = toast.loading('Saving entry changes...');
    try {
      const payload = {
        date: editEntryForm.date,
        shift: editEntryForm.shift,
        machineNumber: editEntryForm.machineNumber,
        designNumber: editEntryForm.designNumber,
        designStitch: Number(editEntryForm.designStitch) || 0,
        machineStitch: Number(editEntryForm.machineStitch) || 0,
        frame: Number(editEntryForm.frame) || 1,
        workerCount: Number(editEntryForm.workerCount) || 1,
        extraPay: Number(editEntryForm.extraPay) || 0,
        proofImage: editEntryForm.proofImage,
        proofImage2: editEntryForm.proofImage2
      };

      const res = await axios.put(`${API}/work/admin/update/${editingEntry._id || editingEntry.id}`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const updated = res.data.entry || { ...editingEntry, ...payload };

      setEntries(prev => prev.map(item => ((item._id || item.id) === (editingEntry._id || editingEntry.id) ? updated : item)));
      toast.success('Work entry updated successfully!', { id: toastId });
      setEditingEntry(null);
    } catch (err) {
      console.error('Update entry error:', err);
      toast.error(err.response?.data?.message || 'Failed to update entry', { id: toastId });
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
        const netSalary = grossPay - totalUpad;

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
    const netSalary = grossPay - totalUpad;

    const dayShifts = filteredByMonth.filter(e => e.shift === 'day' || !e.shift).length;
    const nightShifts = filteredByMonth.filter(e => e.shift === 'night').length;
    const totalStitches = filteredByMonth.reduce((sum, e) => sum + (Number(e.designStitch || e.machineStitch || 0)), 0);

    return {
      entries: filteredByMonth,
      advances: workerAdvances,
      totalEntriesCount,
      totalHours,
      totalDesignBonus,
      totalExtraPay,
      bonusTotal,
      totalUpad,
      grossPay,
      netSalary,
      dayShifts,
      nightShifts,
      totalStitches
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
                        <span className="summary-value" style={{ color: worker.netSalary < 0 ? 'var(--danger, #dc2626)' : 'var(--success)', fontWeight: 800 }}>
                          {worker.netSalary < 0
                            ? `-₹${Math.abs(Math.round(worker.netSalary)).toLocaleString('en-IN')}`
                            : `₹${Math.round(worker.netSalary).toLocaleString('en-IN')}`}
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
          (entries.length === 0 && loading) ? (
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
        </div>

        {/* DETAILED WORKER PERFORMANCE MODAL / ENTERPRISE SUITE */}
        {selectedWorkerReport && workerReportData && (
          <div className="modal-overlay" onClick={() => setSelectedWorkerReport(null)}>
            <div className="modal-content" style={{ maxWidth: '700px' }} onClick={(e) => e.stopPropagation()}>
              {/* Header */}
              <div className="modal-header" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '0.45rem', marginBottom: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0, flex: 1 }}>
                    <div className="entry-avatar" style={{ flexShrink: 0, width: '42px', height: '42px', fontSize: '1rem', background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)', color: '#fff', fontWeight: 800 }}>
                      {selectedWorkerReport.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'W'}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <h2 className="modal-title" style={{ fontSize: '1.15rem', margin: 0, fontWeight: 800, lineHeight: 1.25, wordBreak: 'break-word' }}>
                        {selectedWorkerReport.name}
                      </h2>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, marginTop: '2px' }}>
                        Machine: <strong style={{ color: 'var(--text-primary)' }}>{selectedWorkerReport.machineNumber || 'Unassigned'}</strong>
                      </div>
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

                {/* Worker Quick Chips */}
                <div className="worker-meta-row" style={{ marginTop: '0.1rem' }}>
                  <span className="meta-badge-item">ID: <strong>{selectedWorkerReport.workerId}</strong></span>
                  <span className="meta-badge-item">Phone: <strong>{selectedWorkerReport.phone || 'N/A'}</strong></span>
                  <span className="meta-badge-item">Aadhaar: <strong>{selectedWorkerReport.aadhaarNumber || 'N/A'}</strong></span>
                  <span className="meta-badge-item">Pass: <strong style={{ color: 'var(--primary)' }}>{selectedWorkerReport.plainPassword || (selectedWorkerReport.password ? '••••••••' : 'N/A')}</strong></span>
                </div>
              </div>

              {/* Enterprise Tab Navigation */}
              <div className="modal-tabs">
                <button
                  type="button"
                  className={`modal-tab-btn ${workerModalTab === 'overview' ? 'active' : ''}`}
                  onClick={() => setWorkerModalTab('overview')}
                >
                  <TrendingUp size={14} /> Overview
                </button>
                <button
                  type="button"
                  className={`modal-tab-btn ${workerModalTab === 'entries' ? 'active' : ''}`}
                  onClick={() => setWorkerModalTab('entries')}
                >
                  <FileText size={14} /> Entries ({workerReportData.entries.length})
                </button>
              </div>

              {/* Month Selector Bar */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc', padding: '0.5rem 0.75rem', borderRadius: '10px', marginBottom: '0.85rem', border: '1px solid var(--border)', flexWrap: 'wrap', gap: '0.4rem' }}>
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

              {/* TAB 1: OVERVIEW */}
              {workerModalTab === 'overview' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingBottom: '2.5rem' }}>
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
                    <div
                      className="perf-metric-card"
                      style={{
                        background: workerReportData.netSalary < 0 ? '#fef2f2' : '#ecfdf5',
                        border: `1.5px solid ${workerReportData.netSalary < 0 ? '#fecaca' : '#a7f3d0'}`,
                        borderRadius: '10px',
                        padding: '0.75rem 0.5rem'
                      }}
                    >
                      <span className="perf-metric-label" style={{ color: workerReportData.netSalary < 0 ? '#dc2626' : '#047857', fontWeight: 700 }}>
                        Net Pay Est.
                      </span>
                      <div className="perf-metric-value" style={{ color: workerReportData.netSalary < 0 ? '#b91c1c' : '#059669', fontWeight: 800 }}>
                        {workerReportData.netSalary < 0
                          ? `-₹${Math.abs(Math.round(workerReportData.netSalary)).toLocaleString('en-IN')}`
                          : `₹${Math.round(workerReportData.netSalary).toLocaleString('en-IN')}`}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.65rem' }}>
                    <div className="enterprise-quick-metric">
                      <div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Shifts Completed</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
                          {workerReportData.entries.length} <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>({workerReportData.totalHours.toFixed(1)} Hrs)</span>
                        </div>
                      </div>
                      <span className="badge" style={{ background: '#eef2ff', color: '#4338ca', fontSize: '0.72rem', padding: '3px 7px' }}>
                        ☀️ {workerReportData.dayShifts}D / 🌙 {workerReportData.nightShifts}N
                      </span>
                    </div>

                    <div className="enterprise-quick-metric">
                      <div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Design Bonus Earned</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#059669', marginTop: '2px' }}>
                          ₹{workerReportData.totalDesignBonus.toLocaleString('en-IN')}
                        </div>
                      </div>
                      <span className="badge" style={{ background: '#ecfdf5', color: '#059669', fontSize: '0.72rem', padding: '3px 7px' }}>
                        🎁 Design Incentives
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: ENTRIES (TABLE & CARD VIEW) */}
              {workerModalTab === 'entries' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', paddingBottom: '2.5rem' }}>
                  {/* View Mode & Count Toolbar */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.2rem' }}>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                      📋 Showing {workerReportData.entries.length} Shift Entries
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

                  {workerReportData.entries.length === 0 ? (
                    <div className="empty-state" style={{ padding: '1.5rem 0' }}>
                      <div className="empty-state-text">No work entries found for this period</div>
                      <div className="empty-state-sub" style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                        Work entries will appear here automatically when submitted.
                      </div>
                    </div>
                  ) : entriesViewMode === 'table' ? (
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
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {workerReportData.entries.map(entry => {
                            const entryBonus = calculateDesignBonus({
                              designStitch: entry.designStitch,
                              machineStitch: entry.machineStitch,
                              frame: entry.frame,
                              workerCount: entry.workerCount
                            }) + (Number(entry.extraPay) || 0);
                            const photo = entry.proofImage || entry.photo || entry.image || '';

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
                                  M-{entry.machineNumber || selectedWorkerReport.machineNumber || '1'}
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
                                    {photo ? (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setPreviewImage({
                                            src: photo,
                                            title: `Photo 1 - Design #${entry.designNumber || 'N/A'} Proof`,
                                            subtitle: `Worker: ${entry.workerName || selectedWorkerReport.name} • Date: ${entry.date || 'N/A'}`
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

                                    {entry.proofImage2 ? (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setPreviewImage({
                                            src: entry.proofImage2,
                                            title: `Photo 2 - Machine Reading Proof`,
                                            subtitle: `Worker: ${entry.workerName || selectedWorkerReport.name} • Date: ${entry.date || 'N/A'}`
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

                                    {!photo && !entry.proofImage2 && (
                                      <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>No photo</span>
                                    )}
                                  </div>
                                </td>
                                <td>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEditEntry(entry)}
                                    style={{
                                      border: '1px solid #c7d2fe',
                                      background: '#f8fafc',
                                      color: 'var(--primary)',
                                      borderRadius: '6px',
                                      padding: '2px 8px',
                                      fontSize: '0.72rem',
                                      fontWeight: 700,
                                      cursor: 'pointer',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '3px'
                                    }}
                                    title="Edit Entry Details"
                                  >
                                    <Edit size={12} /> Edit
                                  </button>
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
                              +₹{workerReportData.totalDesignBonus.toLocaleString('en-IN')}
                            </td>
                            <td style={{ padding: '0.75rem 0.85rem' }}></td>
                            <td style={{ padding: '0.75rem 0.85rem' }}></td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                      {workerReportData.entries.map(entry => (
                        <WorkEntryCard key={entry._id || entry.id} entry={entry} isAdmin={true} onStatusUpdate={handleStatusUpdate} />
                      ))}
                    </div>
                  )}
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

        {/* EDIT WORK ENTRY MODAL FOR ADMIN */}
        {editingEntry && (
          <div className="modal-overlay" onClick={() => setEditingEntry(null)}>
            <div className="modal-content" style={{ maxWidth: '620px' }} onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <div>
                  <h2 className="modal-title" style={{ fontSize: '1.2rem', fontWeight: 800 }}>
                    ✏️ Edit Shift Entry
                  </h2>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Worker: <strong>{editingEntry.workerName || selectedWorkerReport?.name}</strong> • ID: <strong>{editingEntry.workerId}</strong>
                  </div>
                </div>
                <button className="modal-close" onClick={() => setEditingEntry(null)} aria-label="Close">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveEditEntry} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem', marginTop: '0.5rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
                  {/* Date */}
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontWeight: 700, fontSize: '0.82rem' }}>📅 Date </label>
                    <input
                      type="date"
                      className="form-control"
                      value={editEntryForm.date}
                      onChange={(e) => setEditEntryForm(prev => ({ ...prev, date: e.target.value }))}
                      required
                    />
                  </div>

                  {/* Shift */}
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontWeight: 700, fontSize: '0.82rem' }}>☀️ Shift </label>
                    <select
                      className="form-control"
                      value={editEntryForm.shift}
                      onChange={(e) => setEditEntryForm(prev => ({ ...prev, shift: e.target.value }))}
                    >
                      <option value="day">☀️ Day Shift</option>
                      <option value="night">🌙 Night Shift</option>
                    </select>
                  </div>

                  {/* Machine */}
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontWeight: 700, fontSize: '0.82rem' }}>🤖 Machine Number</label>
                    <input
                      type="text"
                      className="form-control"
                      value={editEntryForm.machineNumber}
                      onChange={(e) => setEditEntryForm(prev => ({ ...prev, machineNumber: e.target.value }))}
                      placeholder="e.g. 1"
                    />
                  </div>

                  {/* Design # */}
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontWeight: 700, fontSize: '0.82rem' }}>🏷️ Design Number</label>
                    <input
                      type="text"
                      className="form-control"
                      value={editEntryForm.designNumber}
                      onChange={(e) => setEditEntryForm(prev => ({ ...prev, designNumber: e.target.value }))}
                      placeholder="e.g. 1024"
                    />
                  </div>

                  {/* Design Stitch */}
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontWeight: 700, fontSize: '0.82rem' }}>🧵 Design Stitch</label>
                    <input
                      type="number"
                      className="form-control"
                      value={editEntryForm.designStitch}
                      onChange={(e) => setEditEntryForm(prev => ({ ...prev, designStitch: e.target.value }))}
                      placeholder="0"
                    />
                  </div>

                  {/* Machine Stitch */}
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontWeight: 700, fontSize: '0.82rem' }}>⚙️ Machine Stitch / Meter</label>
                    <input
                      type="number"
                      className="form-control"
                      value={editEntryForm.machineStitch}
                      onChange={(e) => setEditEntryForm(prev => ({ ...prev, machineStitch: e.target.value }))}
                      placeholder="0"
                    />
                  </div>

                  {/* Frame */}
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontWeight: 700, fontSize: '0.82rem' }}>🖼️ Frame Count</label>
                    <input
                      type="number"
                      className="form-control"
                      value={editEntryForm.frame}
                      onChange={(e) => setEditEntryForm(prev => ({ ...prev, frame: e.target.value }))}
                      min="1"
                    />
                  </div>

                  {/* Workers on Machine (1 or 2) */}
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontWeight: 700, fontSize: '0.82rem' }}>👥 Workers on Machine</label>
                    <select
                      className="form-control"
                      value={editEntryForm.workerCount || 1}
                      onChange={(e) => setEditEntryForm(prev => ({ ...prev, workerCount: Number(e.target.value) || 1 }))}
                    >
                      <option value="1">👤 1 Worker</option>
                      <option value="2">👥 2 Workers </option>
                    </select>
                  </div>

                  {/* Extra Bonus / Pay */}
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontWeight: 700, fontSize: '0.82rem' }}>🎁 Extra Bonus / Pay (₹)</label>
                    <input
                      type="number"
                      className="form-control"
                      value={editEntryForm.extraPay}
                      onChange={(e) => setEditEntryForm(prev => ({ ...prev, extraPay: e.target.value }))}
                      placeholder="0"
                    />
                  </div>
                </div>

                {/* Photo 1: Design Proof */}
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontWeight: 700, fontSize: '0.82rem' }}>📸 Photo 1: Design / Stitch Proof</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <input
                      type="file"
                      accept="image/*"
                      className="form-control"
                      onChange={(e) => handleEditEntryPhotoChange(e, 'proofImage')}
                      style={{ flex: 1, minWidth: '200px', fontSize: '0.8rem' }}
                    />
                    {editEntryForm.proofImage && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <img
                          src={editEntryForm.proofImage}
                          alt="Photo 1 preview"
                          style={{ width: '42px', height: '42px', objectFit: 'cover', borderRadius: '6px', border: '1px solid var(--border)' }}
                        />
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={() => setEditEntryForm(prev => ({ ...prev, proofImage: '' }))}
                          style={{ fontSize: '0.75rem', color: '#dc2626' }}
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Photo 2: Machine Meter / Stitch Proof */}
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontWeight: 700, fontSize: '0.82rem' }}>📸 Photo 2: Machine Meter / Reading Proof</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <input
                      type="file"
                      accept="image/*"
                      className="form-control"
                      onChange={(e) => handleEditEntryPhotoChange(e, 'proofImage2')}
                      style={{ flex: 1, minWidth: '200px', fontSize: '0.8rem' }}
                    />
                    {editEntryForm.proofImage2 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <img
                          src={editEntryForm.proofImage2}
                          alt="Photo 2 preview"
                          style={{ width: '42px', height: '42px', objectFit: 'cover', borderRadius: '6px', border: '1px solid var(--border)' }}
                        />
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={() => setEditEntryForm(prev => ({ ...prev, proofImage2: '' }))}
                          style={{ fontSize: '0.75rem', color: '#dc2626' }}
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border)' }}>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => setEditingEntry(null)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary btn-sm">
                    <CheckCircle2 size={14} /> Update Entry
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* IMAGE PREVIEW MODAL */}
        {previewImage && (
          <ImageModal
            isOpen={!!previewImage}
            onClose={() => setPreviewImage(null)}
            imageSrc={previewImage.src}
            title={previewImage.title}
            subtitle={previewImage.subtitle}
          />
        )}
    </>
  );
};

export default AdminDashboard;
