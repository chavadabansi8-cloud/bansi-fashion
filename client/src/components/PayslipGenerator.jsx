import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Printer, Download, MessageCircle, CheckCircle2, Calendar, Database, Trash2, Phone, FileText } from 'lucide-react';
import bansiLogo from '../assets/bansi fasion logo.png';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { API } from '../config/api';

const PayslipGenerator = ({ workers = [], entries = [], advances: propAdvances = null }) => {
  const { token } = useAuth();
  const [selectedWorkerId, setSelectedWorkerId] = useState(workers[0]?.workerId || '');
  const [filterMode, setFilterMode] = useState('month'); // 'month' or 'date'
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]); // YYYY-MM-DD
  const [upadDeduction, setUpadDeduction] = useState(0);
  const [workerPhone, setWorkerPhone] = useState('');
  const [savedPayslips, setSavedPayslips] = useState([]);
  const [advances, setAdvances] = useState(propAdvances || []);

  const fetchSavedPayslips = async () => {
    try {
      const res = await axios.get(`${API}/payslip/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSavedPayslips(res.data || []);
    } catch {
      // offline fallback
    }
  };

  const fetchAdvances = async () => {
    try {
      const res = await axios.get(`${API}/advance/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAdvances(res.data || []);
    } catch {
      // fallback
    }
  };

  useEffect(() => {
    fetchSavedPayslips();
    if (!propAdvances) {
      fetchAdvances();
    }
  }, []);

  useEffect(() => {
    if (propAdvances) {
      setAdvances(propAdvances);
    }
  }, [propAdvances]);

  const selectedWorker = useMemo(() => {
    return workers.find(w => w.workerId === selectedWorkerId) || workers[0] || {};
  }, [workers, selectedWorkerId]);

  useEffect(() => {
    if (selectedWorker && selectedWorker.phone) {
      setWorkerPhone(selectedWorker.phone);
    } else {
      setWorkerPhone('');
    }
  }, [selectedWorker]);

  // Worker Upad (Advance) Calculations
  const workerAllAdvances = useMemo(() => {
    if (!selectedWorker.workerId) return [];
    return advances.filter(a => a.workerId === selectedWorker.workerId);
  }, [advances, selectedWorker]);

  const workerPeriodAdvances = useMemo(() => {
    return workerAllAdvances.filter(a => {
      if (filterMode === 'date') {
        return a.date === selectedDate;
      }
      return a.date && a.date.startsWith(selectedMonth);
    });
  }, [workerAllAdvances, filterMode, selectedMonth, selectedDate]);

  const periodUpadTotal = useMemo(() => {
    return workerPeriodAdvances.reduce((sum, a) => sum + (Number(a.amount) || 0), 0);
  }, [workerPeriodAdvances]);

  const allTimeUpadTotal = useMemo(() => {
    return workerAllAdvances.reduce((sum, a) => sum + (Number(a.amount) || 0), 0);
  }, [workerAllAdvances]);

  // Auto-sync upad deduction when worker or period changes
  useEffect(() => {
    setUpadDeduction(periodUpadTotal);
  }, [periodUpadTotal, selectedWorkerId, selectedMonth, selectedDate, filterMode]);

  const monthlyStats = useMemo(() => {
    if (!selectedWorker.workerId) return { entriesCount: 0, totalStitches: 0, overtimePay: 0, bonusPay: 0, baseSalary: 0, grossSalary: 0, netSalary: 0, workedDays: 0, absentDays: 0, absentDeduction: 0, earnedBaseSalary: 0, daysInMonth: 30 };

    const workerEntries = entries.filter(e => {
      const matchWorker = e.workerId === selectedWorker.workerId;
      if (!matchWorker) return false;
      if (filterMode === 'date') {
        return e.date === selectedDate;
      }
      return e.date && e.date.startsWith(selectedMonth);
    });

    const entriesCount = workerEntries.length;
    const totalStitches = workerEntries.reduce((sum, e) => sum + (Number(e.machineStitch) || Number(e.calculatedTotal) || 0), 0);
    const overtimePay = workerEntries.reduce((sum, e) => sum + (Number(e.extraPay) || 0), 0);
    const bonusPay = workerEntries.reduce((sum, e) => sum + (Number(e.calculatedTotal) || 0), 0);

    const baseSalary = Number(selectedWorker.salary) || 0;

    // Monthly Attendance & Absent Days Deduction
    let daysInMonth = 30;
    let workedDays = 0;
    let absentDays = 0;
    let absentDeduction = 0;
    let earnedBaseSalary = baseSalary;

    if (filterMode === 'month') {
      const [yearStr, monthStr] = (selectedMonth || '2026-08').split('-');
      const year = Number(yearStr) || 2026;
      const month = Number(monthStr) || 8;
      daysInMonth = new Date(year, month, 0).getDate();

      const workedDaysSet = new Set(workerEntries.map(e => e.date).filter(Boolean));
      workedDays = workedDaysSet.size;
      absentDays = Math.max(0, daysInMonth - workedDays);

      const dailyRate = baseSalary > 0 ? baseSalary / daysInMonth : 0;
      absentDeduction = Math.round(absentDays * dailyRate);
      earnedBaseSalary = Math.max(0, Math.round(baseSalary - absentDeduction));
    } else {
      // Date filter mode
      workedDays = workerEntries.length > 0 ? 1 : 0;
      absentDays = workedDays > 0 ? 0 : 1;
      daysInMonth = 1;
      absentDeduction = absentDays === 1 ? Math.round(baseSalary / 30) : 0;
      earnedBaseSalary = Math.max(0, baseSalary - absentDeduction);
    }

    const grossSalary = earnedBaseSalary + bonusPay + overtimePay;
    const netSalary = grossSalary - Number(upadDeduction);

    return {
      workerEntries,
      entriesCount,
      totalStitches,
      overtimePay,
      bonusPay,
      baseSalary,
      earnedBaseSalary,
      absentDeduction,
      workedDays,
      absentDays,
      daysInMonth,
      grossSalary,
      netSalary
    };
  }, [entries, selectedWorker, selectedMonth, selectedDate, filterMode, upadDeduction]);

  const dateFormatted = useMemo(() => {
    try {
      if (filterMode === 'date') {
        const [y, m, d] = selectedDate.split('-');
        return new Date(y, m - 1, d).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
      }
      const [year, month] = selectedMonth.split('-');
      return new Date(year, month - 1, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
    } catch {
      return filterMode === 'date' ? selectedDate : selectedMonth;
    }
  }, [selectedMonth, selectedDate, filterMode]);

  const handleSavePayslipToDB = async (quiet = false) => {
    if (!selectedWorker.workerId) return;

    try {
      const payload = {
        workerId: selectedWorker.workerId,
        workerName: selectedWorker.name || selectedWorker.workerId,
        phone: workerPhone || selectedWorker.phone || '',
        period: filterMode === 'date' ? selectedDate : selectedMonth,
        filterMode,
        baseSalary: monthlyStats.baseSalary,
        bonusPay: monthlyStats.bonusPay,
        overtimePay: monthlyStats.overtimePay,
        grossSalary: monthlyStats.grossSalary,
        upadDeduction: Number(upadDeduction) || 0,
        netSalary: monthlyStats.netSalary,
        entriesCount: monthlyStats.entriesCount,
        totalStitches: monthlyStats.totalStitches
      };

      const res = await axios.post(`${API}/payslip/save`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!quiet) {
        toast.success(`Salary Bill stored permanently in MongoDB for ${selectedWorker.name}!`);
      }
      fetchSavedPayslips();
      return res.data;
    } catch {
      if (!quiet) toast.error('Failed to store salary bill in DB');
    }
  };

  const handleDeletePayslip = async (id) => {
    try {
      await axios.delete(`${API}/payslip/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSavedPayslips(prev => prev.filter(item => item._id !== id));
      toast.success('Salary Bill record removed from DB');
    } catch {
      toast.error('Failed to remove record');
    }
  };

  const generatePDFBlob = async () => {
    const element = document.querySelector('.payslip-paper-card');
    if (!element) return null;

    const cleanWorkerName = (selectedWorker.name || 'Worker').replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `Salary_Bill_${cleanWorkerName}_${filterMode === 'date' ? selectedDate : selectedMonth}.pdf`;
    const opt = {
      margin:       [0.25, 0.25, 0.25, 0.25],
      filename:     filename,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, logging: false, backgroundColor: '#ffffff' },
      jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' }
    };

    try {
      const html2pdf = (await import('html2pdf.js')).default;
      const pdfBlob = await html2pdf().set(opt).from(element).output('blob');
      return { pdfBlob, filename, opt };
    } catch (err) {
      console.error('PDF Blob generation error:', err);
      return null;
    }
  };

  const generatePDFDocument = async () => {
    const element = document.querySelector('.payslip-paper-card');
    if (!element) {
      window.print();
      return true;
    }

    try {
      const cleanWorkerName = (selectedWorker.name || 'Worker').replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `Salary_Bill_${cleanWorkerName}_${filterMode === 'date' ? selectedDate : selectedMonth}.pdf`;
      const opt = {
        margin:       [0.25, 0.25, 0.25, 0.25],
        filename:     filename,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true, logging: false, backgroundColor: '#ffffff' },
        jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' }
      };
      const html2pdf = (await import('html2pdf.js')).default;
      await html2pdf().set(opt).from(element).save();
      return true;
    } catch (err) {
      console.error('PDF export error:', err);
      window.print();
      return true;
    }
  };

  const handlePrint = () => {
    handleSavePayslipToDB(true);
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (!selectedWorker.workerId) return;
    await handleSavePayslipToDB(true);
    const toastId = toast.loading('Generating PDF Salary Bill...');
    await generatePDFDocument();
    toast.success(`PDF Salary Bill downloaded for ${selectedWorker.name}!`, { id: toastId });
  };

  const handleSendWhatsAppPayslip = async () => {
    if (!selectedWorker.workerId) return;

    const targetPhone = (workerPhone || selectedWorker.phone || '').replace(/\D/g, '');
    
    // Auto-update worker profile if phone was updated in payslip form
    if (targetPhone && targetPhone.length === 10 && targetPhone !== selectedWorker.phone) {
      try {
        await axios.post(`${API}/auth/workers`, {
          workerId: selectedWorker.workerId,
          phone: targetPhone
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch {
        // silent update fallback
      }
    }

    await handleSavePayslipToDB(true);

    const toastId = toast.loading('Generating Salary Bill PDF for WhatsApp...');

    const text = `*BANSI FASHION - SALARY PAYSLIP / પગાર બિલ (${dateFormatted.toUpperCase()})*\n\n` +
      `👤 *Worker Name:* ${selectedWorker.name || 'N/A'} (ID: ${selectedWorker.workerId})\n` +
      `📱 *Mobile Number:* ${targetPhone || 'N/A'}\n` +
      `🗓️ *Period:* ${dateFormatted}\n\n` +
      `💵 Base Salary: ₹${monthlyStats.baseSalary.toLocaleString('en-IN')}\n` +
      `➕ Production Bonus: ₹${monthlyStats.bonusPay.toLocaleString('en-IN')}\n` +
      `⚡ Overtime Pay: ₹${monthlyStats.overtimePay.toLocaleString('en-IN')}\n` +
      `-----------------------------\n` +
      `💰 *Gross Earnings:* ₹${monthlyStats.grossSalary.toLocaleString('en-IN')}\n` +
      `➖ *Upad (Advance) Deduction:* ₹${Number(upadDeduction).toLocaleString('en-IN')}\n` +
      `-----------------------------\n` +
      `✅ *NET PAYABLE SALARY: ${monthlyStats.netSalary < 0 ? `-₹${Math.abs(Math.round(monthlyStats.netSalary)).toLocaleString('en-IN')}` : `₹${Math.round(monthlyStats.netSalary).toLocaleString('en-IN')}`}*\n` +
      `-----------------------------\n\n` +
      `📄 *Attached is your official Bansi Fashion Salary Bill PDF.* 📎\n\n` +
      `🏢 Bansi Fashion • Surat • Support: +91 7574049710`;

    try {
      const pdfData = await generatePDFBlob();

      // Check if Web Share API with Files is supported (Android Chrome, Mobile Browsers, Safari)
      if (pdfData && pdfData.pdfBlob && navigator.canShare) {
        const pdfFile = new File([pdfData.pdfBlob], pdfData.filename, { type: 'application/pdf' });
        
        if (navigator.canShare({ files: [pdfFile] })) {
          toast.dismiss(toastId);
          await navigator.share({
            title: `Salary Bill - ${selectedWorker.name || 'Worker'}`,
            text: text,
            files: [pdfFile]
          });
          toast.success('Salary Bill PDF shared to WhatsApp!');
          return;
        }
      }

      // Fallback for Desktop browsers or browsers without Web Share File support
      if (pdfData) {
        const element = document.querySelector('.payslip-paper-card');
        if (element) {
          const html2pdf = (await import('html2pdf.js')).default;
          await html2pdf().set(pdfData.opt).from(element).save();
        }
      }
      toast.success('PDF Salary Bill downloaded! Opening WhatsApp...', { id: toastId });

      const encodedText = encodeURIComponent(text);
      const targetUrl = targetPhone.length === 10
        ? `https://wa.me/91${targetPhone}?text=${encodedText}`
        : targetPhone.length > 10
          ? `https://wa.me/${targetPhone}?text=${encodedText}`
          : `https://wa.me/?text=${encodedText}`;

      window.open(targetUrl, '_blank');
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('WhatsApp share error:', err);
        // Fallback standard URL open
        const encodedText = encodeURIComponent(text);
        const targetUrl = targetPhone.length === 10
          ? `https://wa.me/91${targetPhone}?text=${encodedText}`
          : `https://wa.me/?text=${encodedText}`;
        window.open(targetUrl, '_blank');
      }
      toast.dismiss(toastId);
    }
  };

  return (
    <div className="payslip-container">
      {/* FILTER & SELECTOR HEADER WITH CALENDAR DATE PICKER */}
      <div className="report-filter-card">
        <div className="filter-form-grid" style={{ justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div className="filter-field">
            <label className="filter-label">Select Worker :</label>
            <select
              className="form-control"
              value={selectedWorkerId}
              onChange={(e) => setSelectedWorkerId(e.target.value)}
              style={{ fontWeight: 600 }}
            >
              {workers.map(w => (
                <option key={w.workerId} value={w.workerId}>
                  {w.name} (ID: {w.workerId})
                </option>
              ))}
            </select>
          </div>

          {/* Calendar Picker Mode Switcher */}
          <div className="filter-field">
            <label className="filter-label">Filter Type :</label>
            <select
              className="form-control"
              value={filterMode}
              onChange={(e) => setFilterMode(e.target.value)}
              style={{ fontWeight: 600 }}
            >
              <option value="month">🗓️ Month Calendar</option>
              <option value="date">📅 Exact Date Calendar</option>
            </select>
          </div>

          {/* Date / Month Input Calendar Picker */}
          <div className="filter-field">
            <label className="filter-label">
              <Calendar size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
              {filterMode === 'date' ? 'Select Date Calendar :' : 'Salary Month Calendar :'}
            </label>
            {filterMode === 'date' ? (
              <input
                type="date"
                className="form-control"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                style={{ fontWeight: 600 }}
              />
            ) : (
              <input
                type="month"
                className="form-control"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                style={{ fontWeight: 600 }}
              />
            )}
          </div>

          <div className="filter-field">
            <label className="filter-label">
              <Phone size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
              Worker WhatsApp / Phone No :
            </label>
            <input
              type="text"
              className="form-control"
              value={workerPhone}
              onChange={(e) => setWorkerPhone(e.target.value)}
              placeholder="e.g. 9876543210"
              style={{ fontWeight: 600, width: '160px' }}
            />
          </div>

          <div className="filter-field" style={{ minWidth: '220px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
              <label className="filter-label" style={{ margin: 0 }}>Upad / Advance Deduction (₹):</label>
              {periodUpadTotal > 0 && (
                <span style={{ fontSize: '0.72rem', color: '#dc2626', fontWeight: 700 }}>
                  Recorded: ₹{periodUpadTotal.toLocaleString()}
                </span>
              )}
            </div>
            <input
              type="number"
              className="form-control"
              value={upadDeduction}
              onChange={(e) => setUpadDeduction(Number(e.target.value) || 0)}
              placeholder="0"
              min="0"
              style={{ fontWeight: 700, color: 'var(--danger)', background: '#fff1f2', borderColor: '#fecaca' }}
            />
            {/* Quick Helper Badges */}
            <div style={{ display: 'flex', gap: '0.3rem', marginTop: '0.3rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="badge"
                onClick={() => setUpadDeduction(periodUpadTotal)}
                style={{
                  background: upadDeduction === periodUpadTotal ? '#fee2e2' : '#f1f5f9',
                  color: upadDeduction === periodUpadTotal ? '#991b1b' : '#475569',
                  border: '1px solid #cbd5e1',
                  cursor: 'pointer',
                  fontSize: '0.68rem',
                  padding: '2px 6px'
                }}
                title="Deduct recorded Upad for this period"
              >
                🔄 Period Upad (₹{periodUpadTotal})
              </button>
              {allTimeUpadTotal > periodUpadTotal && (
                <button
                  type="button"
                  className="badge"
                  onClick={() => setUpadDeduction(allTimeUpadTotal)}
                  style={{
                    background: upadDeduction === allTimeUpadTotal ? '#fee2e2' : '#f1f5f9',
                    color: upadDeduction === allTimeUpadTotal ? '#991b1b' : '#475569',
                    border: '1px solid #cbd5e1',
                    cursor: 'pointer',
                    fontSize: '0.68rem',
                    padding: '2px 6px'
                  }}
                  title="Deduct Total All-Time Outstanding Upad"
                >
                  💰 Total Upad (₹{allTimeUpadTotal})
                </button>
              )}
              {upadDeduction > 0 && (
                <button
                  type="button"
                  className="badge"
                  onClick={() => setUpadDeduction(0)}
                  style={{
                    background: '#f8fafc',
                    color: '#64748b',
                    border: '1px solid #cbd5e1',
                    cursor: 'pointer',
                    fontSize: '0.68rem',
                    padding: '2px 6px'
                  }}
                  title="Clear deduction"
                >
                  ✖️ ₹0
                </button>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button
              id="send-whatsapp-payslip-btn"
              type="button"
              className="btn btn-success touch-btn"
              onClick={handleSendWhatsAppPayslip}
              title="Generate PDF and Send to Worker WhatsApp"
              style={{
                padding: '0.6rem 1.25rem',
                fontSize: '0.9rem',
                fontWeight: 700,
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: '0 4px 12px rgba(22, 163, 74, 0.25)'
              }}
            >
              <MessageCircle size={18} /> Send WhatsApp PDF
            </button>
          </div>
        </div>
      </div>

      {/* PAYSLIP CARD (PRINTABLE) */}
      <div className="payslip-paper-card">
        {/* Company Header */}
        <div className="payslip-header" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: '0.6rem' }}>
          <img src={bansiLogo} alt="Bansi Fashion Logo" className="payslip-logo" style={{ width: '65px', height: '65px', borderRadius: '12px' }} />
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <h1 className="payslip-company-title" style={{ margin: 0, fontSize: '1.75rem', letterSpacing: '0.02em' }}>BANSI FASHION</h1>
            <p className="payslip-company-sub" style={{ margin: '0.2rem 0 0 0' }}>Industrial Embroidery & Textile Production Unit</p>
            <p className="payslip-company-contact" style={{ margin: '0.2rem 0 0 0' }}>Surat, Gujarat, India • Support: +91 7574049710</p>
          </div>
          <div className="payslip-badge-block" style={{ textAlign: 'center', marginTop: '0.25rem' }}>
            <div className="payslip-doc-type" style={{ fontSize: '1.15rem', fontWeight: 800 }}>SALARY PAYSLIP</div>
            <div className="payslip-month-tag" style={{ marginTop: '0.35rem' }}>🗓️ {dateFormatted}</div>
          </div>
        </div>

        <hr className="payslip-divider" />

        {/* Worker Info Grid */}
        <div className="payslip-info-grid">
          <div className="info-cell">
            <span className="info-lbl">Worker Name</span>
            <span className="info-val"><strong>{selectedWorker.name || 'N/A'}</strong></span>
          </div>
          <div className="info-cell">
            <span className="info-lbl">Worker ID</span>
            <span className="info-val">{selectedWorker.workerId || 'N/A'}</span>
          </div>
          <div className="info-cell">
            <span className="info-lbl">Phone Number</span>
            <span className="info-val">{workerPhone || selectedWorker.phone || 'N/A'}</span>
          </div>
          <div className="info-cell">
            <span className="info-lbl">Assigned Machine</span>
            <span className="info-val">Machine {selectedWorker.machineNumber || '1'}</span>
          </div>
          <div className="info-cell">
            <span className="info-lbl">Attendance Stats</span>
            <span className="info-val" style={{ color: monthlyStats.absentDays > 0 ? '#dc2626' : '#16a34a', fontWeight: 700 }}>
              {monthlyStats.workedDays} Worked / {monthlyStats.absentDays} Absent
            </span>
          </div>
          <div className="info-cell">
            <span className="info-lbl">Total Stitch Output</span>
            <span className="info-val">{monthlyStats.totalStitches.toLocaleString()} Stitches</span>
          </div>
        </div>

        {/* Breakdown Table */}
        <div className="payslip-table-wrapper">
          <table className="payslip-table">
            <thead>
              <tr>
                <th>Earnings & Allowance Description</th>
                <th style={{ textAlign: 'right' }}>Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Base Monthly Salary ({monthlyStats.daysInMonth} Days)</td>
                <td style={{ textAlign: 'right' }}>₹{monthlyStats.baseSalary.toLocaleString('en-IN')}</td>
              </tr>
              {monthlyStats.absentDays > 0 && (
                <tr style={{ color: 'var(--danger)' }}>
                  <td>
                    Absent Days Deduction ({monthlyStats.absentDays} Days Absent @ ₹{Math.round(monthlyStats.baseSalary / monthlyStats.daysInMonth)}/day)
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>
                    - ₹{monthlyStats.absentDeduction.toLocaleString('en-IN')}
                  </td>
                </tr>
              )}
              <tr>
                <td>Earned Basic Pay ({monthlyStats.workedDays} Days Worked)</td>
                <td style={{ textAlign: 'right', fontWeight: 600 }}>₹{monthlyStats.earnedBaseSalary.toLocaleString('en-IN')}</td>
              </tr>
              <tr>
                <td>Production Bonus & Output Pay</td>
                <td style={{ textAlign: 'right', color: 'var(--primary)' }}>+ ₹{monthlyStats.bonusPay.toLocaleString('en-IN')}</td>
              </tr>
              <tr>
                <td>Overtime & Extra Work Allowance</td>
                <td style={{ textAlign: 'right', color: 'var(--primary)' }}>+ ₹{monthlyStats.overtimePay.toLocaleString('en-IN')}</td>
              </tr>
              <tr className="subtotal-row">
                <td><strong>Gross Salary Earnings</strong></td>
                <td style={{ textAlign: 'right' }}><strong>₹{monthlyStats.grossSalary.toLocaleString('en-IN')}</strong></td>
              </tr>
              <tr style={{ color: Number(upadDeduction) > 0 ? '#b91c1c' : '#64748b', background: Number(upadDeduction) > 0 ? '#fef2f2' : 'transparent' }}>
                <td>
                  <div style={{ fontWeight: Number(upadDeduction) > 0 ? 700 : 500 }}>
                    Advance Deduction
                  </div>
                  {workerPeriodAdvances.length > 0 && (
                    <div style={{ fontSize: '0.72rem', color: '#991b1b', marginTop: '2px', fontWeight: 500 }}>
                      📌 Details: {workerPeriodAdvances.map(a => `${a.date}: ₹${a.amount} (${a.note || 'Upad'})`).join(' • ')}
                    </div>
                  )}
                </td>
                <td style={{ textAlign: 'right', fontWeight: 700, color: Number(upadDeduction) > 0 ? '#dc2626' : '#64748b' }}>
                  {Number(upadDeduction) > 0 ? `- ₹${Number(upadDeduction).toLocaleString('en-IN')}` : '₹0'}
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr className="net-pay-row">
                <td style={{ fontSize: '1.1rem', fontWeight: 800 }}>NET SALARY PAYABLE </td>
                <td style={{ textAlign: 'right', fontSize: '1.25rem', fontWeight: 800, color: monthlyStats.netSalary < 0 ? '#dc2626' : 'var(--success)' }}>
                  {monthlyStats.netSalary < 0
                    ? `- ₹${Math.abs(Math.round(monthlyStats.netSalary)).toLocaleString('en-IN')}`
                    : `₹${Math.round(monthlyStats.netSalary).toLocaleString('en-IN')}`}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Footer Signatures (Left: Worker Signature, Right: Authorized Manager Signature) */}
        <div
          className="payslip-signatures"
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            alignItems: 'end',
            width: '100%',
            marginTop: '2.5rem',
            paddingTop: '1.25rem',
            borderTop: '1px dashed var(--border)',
            boxSizing: 'border-box'
          }}
        >
          {/* LEFT: Worker Signature */}
          <div
            className="sig-block-left"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              textAlign: 'left',
              justifyContent: 'flex-end'
            }}
          >
            <div
              style={{
                width: '100%',
                maxWidth: '135px',
                borderBottom: '1.5px solid #94a3b8',
                marginBottom: '0.4rem'
              }}
            />
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>
              Worker Signature
            </span>
          </div>

          {/* RIGHT: Authorized Manager Signature */}
          <div
            className="sig-block-right"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              textAlign: 'right',
              justifyContent: 'flex-end'
            }}
          >
            <div
              style={{
                marginBottom: '0.4rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.72rem',
                fontWeight: 800,
                color: 'var(--primary)',
                background: 'var(--primary-soft)',
                padding: '3px 8px',
                borderRadius: '4px',
                border: '1px solid #c7d2fe'
              }}
            >
              <CheckCircle2 size={13} color="var(--primary)" /> VERIFIED & APPROVED
            </div>
            <div
              style={{
                width: '100%',
                maxWidth: '150px',
                borderBottom: '1.5px solid #94a3b8',
                marginBottom: '0.4rem'
              }}
            />
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>
              Authorized Manager Signature
            </span>
          </div>
        </div>
      </div>

      {/* SAVED SALARY BILLS HISTORY TABLE IN MONGO DB */}
      <div className="report-table-card" style={{ marginTop: '2rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '0.4rem', marginBottom: '1.25rem' }}>
          <h3 className="report-title" style={{ fontSize: '1.15rem', margin: 0, textAlign: 'center', fontWeight: 800 }}>
            💾 Stored Salary Bills & Payslips History
          </h3>
          <span className="badge badge-admin" style={{ fontSize: '0.78rem' }}>
            {savedPayslips.length} Permanent Records Saved
          </span>
        </div>

        <div className="table-responsive">
          <table className="report-data-table">
            <thead>
              <tr>
                <th>Period / Date</th>
                <th>Worker Name</th>
                <th>Worker ID</th>
                <th>Base Salary</th>
                <th>Bonus & OT</th>
                <th>Upad Deduction</th>
                <th>Net Payable (₹)</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {savedPayslips.length === 0 ? (
                <tr>
                  <td colSpan="8" className="empty-table-cell">No stored salary bills found in database yet.</td>
                </tr>
              ) : (
                savedPayslips.map(item => (
                  <tr key={item._id}>
                    <td><strong>{item.period}</strong></td>
                    <td>{item.workerName}</td>
                    <td><span className="worker-id-tag">{item.workerId}</span></td>
                    <td>₹{item.baseSalary.toLocaleString()}</td>
                    <td style={{ color: 'var(--primary)', fontWeight: 600 }}>+ ₹{(item.bonusPay + item.overtimePay).toLocaleString()}</td>
                    <td style={{ color: 'var(--danger)' }}>- ₹{item.upadDeduction.toLocaleString()}</td>
                    <td style={{ color: 'var(--success)', fontWeight: 800, fontSize: '1rem' }}>₹{item.netSalary.toLocaleString()}</td>
                    <td>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => handleDeletePayslip(item._id)}
                        style={{ color: 'var(--danger)', borderColor: '#fecaca' }}
                        title="Remove Record"
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

export default PayslipGenerator;
