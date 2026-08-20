import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Printer, Download, MessageCircle, CheckCircle2, Calendar, Database, Trash2, Phone, FileText } from 'lucide-react';
import html2pdf from 'html2pdf.js';
import bansiLogo from '../assets/bansi fasion logo.png';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { API } from '../config/api';

const PayslipGenerator = ({ workers = [], entries = [] }) => {
  const { token } = useAuth();
  const [selectedWorkerId, setSelectedWorkerId] = useState(workers[0]?.workerId || '');
  const [filterMode, setFilterMode] = useState('month'); // 'month' or 'date'
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]); // YYYY-MM-DD
  const [upadDeduction, setUpadDeduction] = useState(0);
  const [workerPhone, setWorkerPhone] = useState('');
  const [savedPayslips, setSavedPayslips] = useState([]);

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

  useEffect(() => {
    fetchSavedPayslips();
  }, []);

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

  const monthlyStats = useMemo(() => {
    if (!selectedWorker.workerId) return { entriesCount: 0, totalStitches: 0, overtimePay: 0, bonusPay: 0, baseSalary: 0, grossSalary: 0, netSalary: 0 };

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
    const grossSalary = baseSalary + bonusPay + overtimePay;
    const netSalary = Math.max(0, grossSalary - Number(upadDeduction));

    return {
      workerEntries,
      entriesCount,
      totalStitches,
      overtimePay,
      bonusPay,
      baseSalary,
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

  const generatePDFDocument = async () => {
    const element = document.querySelector('.payslip-paper-card');
    if (!element) {
      window.print();
      return true;
    }

    try {
      const filename = `Salary_Bill_${(selectedWorker.name || 'Worker').replace(/\s+/g, '_')}_${filterMode === 'date' ? selectedDate : selectedMonth}.pdf`;
      const opt = {
        margin:       [0.25, 0.25, 0.25, 0.25],
        filename:     filename,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true, logging: false, backgroundColor: '#ffffff' },
        jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' }
      };
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
    await handleSavePayslipToDB(true);

    const toastId = toast.loading('Generating PDF for WhatsApp...');
    await generatePDFDocument();
    toast.success('Salary Bill PDF saved to Downloads!', { id: toastId });

    const targetPhone = (workerPhone || selectedWorker.phone || '').replace(/\D/g, '');
    const text = `*BANSI FASHION - SALARY PAYSLIP / પગાર બિલ (${dateFormatted.toUpperCase()})*\n\n` +
      `👤 *Worker Name:* ${selectedWorker.name || 'N/A'} (ID: ${selectedWorker.workerId})\n` +
      `📱 *Mobile Number:* ${workerPhone || selectedWorker.phone || 'N/A'}\n` +
      `🗓️ *Period:* ${dateFormatted}\n\n` +
      `💵 Base Salary: ₹${monthlyStats.baseSalary.toLocaleString('en-IN')}\n` +
      `➕ Production Bonus: ₹${monthlyStats.bonusPay.toLocaleString('en-IN')}\n` +
      `⚡ Overtime Pay: ₹${monthlyStats.overtimePay.toLocaleString('en-IN')}\n` +
      `-----------------------------\n` +
      `💰 *Gross Earnings:* ₹${monthlyStats.grossSalary.toLocaleString('en-IN')}\n` +
      `➖ *Upad (Advance) Deduction:* ₹${upadDeduction.toLocaleString('en-IN')}\n` +
      `-----------------------------\n` +
      `✅ *NET PAYABLE SALARY: ₹${monthlyStats.netSalary.toLocaleString('en-IN')}*\n` +
      `-----------------------------\n\n` +
      `📄 *PDF Salary Bill file is downloaded to your device. Please attach and send the PDF file in WhatsApp!* 📎\n\n` +
      `🏢 Bansi Fashion • Surat • Support: +91 9737369993`;

    const encodedText = encodeURIComponent(text);
    const targetUrl = targetPhone.length === 10
      ? `https://wa.me/91${targetPhone}?text=${encodedText}`
      : targetPhone.length > 10
        ? `https://wa.me/${targetPhone}?text=${encodedText}`
        : `https://wa.me/?text=${encodedText}`;

    window.open(targetUrl, '_blank');
    toast.success(`Opening WhatsApp for ${targetPhone ? '+91 ' + targetPhone : selectedWorker.name}...`);
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

          <div className="filter-field">
            <label className="filter-label">Upad / Advance Deduction (₹) :</label>
            <input
              type="number"
              className="form-control"
              value={upadDeduction}
              onChange={(e) => setUpadDeduction(Number(e.target.value) || 0)}
              placeholder="0"
              min="0"
              style={{ width: '130px', fontWeight: 600, color: 'var(--danger)' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-ghost btn-sm" onClick={() => handleSavePayslipToDB(false)}>
              <Database size={15} /> Save Bill to DB
            </button>
            <button className="btn btn-success btn-sm" onClick={handleSendWhatsAppPayslip} title="Send PDF & Summary to Worker WhatsApp">
              <MessageCircle size={15} /> Send WhatsApp PDF
            </button>
            <button className="btn btn-primary btn-sm" onClick={handlePrint}>
              <Printer size={15} /> Print Slip
            </button>
            <button className="btn btn-accent btn-sm" onClick={handleDownloadPDF} title="Download PDF File">
              <Download size={15} /> PDF Download
            </button>
          </div>
        </div>
      </div>

      {/* PAYSLIP CARD (PRINTABLE) */}
      <div className="payslip-paper-card">
        {/* Company Header */}
        <div className="payslip-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <img src={bansiLogo} alt="Bansi Fashion Logo" className="payslip-logo" />
            <div>
              <h1 className="payslip-company-title">BANSI FASHION</h1>
              <p className="payslip-company-sub">Industrial Embroidery & Textile Production Unit</p>
              <p className="payslip-company-contact">Surat, Gujarat, India • Support: +91 9737369993</p>
            </div>
          </div>
          <div className="payslip-badge-block">
            <div className="payslip-doc-type">SALARY PAYSLIP</div>
            <div className="payslip-month-tag">🗓️ {dateFormatted}</div>
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
            <span className="info-lbl">Work Entries Recorded</span>
            <span className="info-val">{monthlyStats.entriesCount} Entries</span>
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
                <td>Base Monthly Salary</td>
                <td style={{ textAlign: 'right' }}>₹{monthlyStats.baseSalary.toLocaleString()}</td>
              </tr>
              <tr>
                <td>Production Bonus & Output Pay</td>
                <td style={{ textAlign: 'right', color: 'var(--primary)' }}>+ ₹{monthlyStats.bonusPay.toLocaleString()}</td>
              </tr>
              <tr>
                <td>Overtime & Extra Work Allowance</td>
                <td style={{ textAlign: 'right', color: 'var(--primary)' }}>+ ₹{monthlyStats.overtimePay.toLocaleString()}</td>
              </tr>
              <tr className="subtotal-row">
                <td><strong>Gross Salary Earnings</strong></td>
                <td style={{ textAlign: 'right' }}><strong>₹{monthlyStats.grossSalary.toLocaleString()}</strong></td>
              </tr>
              <tr>
                <td style={{ color: 'var(--danger)' }}>Advance (Upad) Deduction</td>
                <td style={{ textAlign: 'right', color: 'var(--danger)' }}>- ₹{upadDeduction.toLocaleString()}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr className="net-pay-row">
                <td style={{ fontSize: '1.1rem', fontWeight: 800 }}>NET SALARY PAYABLE</td>
                <td style={{ textAlign: 'right', fontSize: '1.25rem', fontWeight: 800, color: 'var(--success)' }}>
                  ₹{monthlyStats.netSalary.toLocaleString()}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Footer Signatures */}
        <div className="payslip-signatures">
          <div className="sig-block">
            <div className="sig-line"></div>
            <span>Worker Signature</span>
          </div>
          <div className="sig-block">
            <div className="sig-stamp">
              <CheckCircle2 size={16} color="var(--primary)" /> VERIFIED & APPROVED
            </div>
            <div className="sig-line"></div>
            <span>Authorized Manager Signature</span>
          </div>
        </div>
      </div>

      {/* SAVED SALARY BILLS HISTORY TABLE IN MONGO DB */}
      <div className="report-table-card" style={{ marginTop: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 className="report-title" style={{ fontSize: '1.1rem', margin: 0, textAlign: 'left' }}>
            💾 Stored Salary Bills & Payslips History (MongoDB All-Time Records)
          </h3>
          <span className="badge badge-admin">{savedPayslips.length} Permanent Records Saved</span>
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
