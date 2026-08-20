import { useState, useMemo, useRef } from 'react';
import { Calendar, Download, Printer, FileSpreadsheet, FileText, FileCode } from 'lucide-react';
import toast from 'react-hot-toast';
import html2pdf from 'html2pdf.js';

const CommissionReport = ({ entries = [], workers = [] }) => {
  // Date State - Default to August 2026 or current month range matching screenshots
  const todayStr = new Date().toISOString().split('T')[0];
  const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

  const [fromDate, setFromDate] = useState('2026-08-01');
  const [toDate, setToDate] = useState('2026-08-15');
  const [groupWiseMachine, setGroupWiseMachine] = useState(false);
  const [selectAllMachines, setSelectAllMachines] = useState(true);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Helper to normalize machine name (e.g. M1 -> 1, M2 -> 2)
  const normalizeMachine = (m) => {
    if (!m) return '1';
    const cleaned = String(m).trim().toUpperCase();
    if (/^M\d+$/i.test(cleaned)) return cleaned.replace(/^M/i, '');
    if (/^M-\d+$/i.test(cleaned)) return cleaned.replace(/^M-/i, '');
    return cleaned;
  };

  // Extract all available machines from entries & workers (default 1, 2)
  const availableMachines = useMemo(() => {
    const machinesSet = new Set(['1', '2']);
    entries.forEach(e => {
      if (e.machineNumber) machinesSet.add(normalizeMachine(e.machineNumber));
    });
    workers.forEach(w => {
      if (w.machineNumber) machinesSet.add(normalizeMachine(w.machineNumber));
    });
    return Array.from(machinesSet).sort();
  }, [entries, workers]);

  const [selectedMachines, setSelectedMachines] = useState(availableMachines);

  // Handle machine selection
  const handleSelectAllToggle = () => {
    if (selectAllMachines) {
      setSelectedMachines([]);
      setSelectAllMachines(false);
    } else {
      setSelectedMachines(availableMachines);
      setSelectAllMachines(true);
    }
  };

  const handleMachineToggle = (machine) => {
    if (selectedMachines.includes(machine)) {
      const updated = selectedMachines.filter(m => m !== machine);
      setSelectedMachines(updated);
      setSelectAllMachines(updated.length === availableMachines.length);
    } else {
      const updated = [...selectedMachines, machine];
      setSelectedMachines(updated);
      setSelectAllMachines(updated.length === availableMachines.length);
    }
  };

  // Helper date formatter: YYYY-MM-DD -> 01-Aug-2026
  const formatDateDisplay = (dateString) => {
    if (!dateString) return '-';
    try {
      const d = new Date(dateString + 'T00:00:00');
      const day = String(d.getDate()).padStart(2, '0');
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = monthNames[d.getMonth()];
      const year = d.getFullYear();
      return `${day}-${month}-${year}`;
    } catch {
      return dateString;
    }
  };

  // Filtered entries according to date range and selected machines
  const filteredEntries = useMemo(() => {
    return entries.filter(entry => {
      const entryDate = entry.date;
      const isDateValid = (!fromDate || entryDate >= fromDate) && (!toDate || entryDate <= toDate);
      const machineName = normalizeMachine(entry.machineNumber);
      const isMachineValid = selectedMachines.includes(machineName) || selectedMachines.length === 0;
      return isDateValid && isMachineValid;
    });
  }, [entries, fromDate, toDate, selectedMachines]);

  // Process Daily Commission Report Data
  const dailyReportData = useMemo(() => {
    const datesMap = {};
    let overallGrandTotal = 0;

    filteredEntries.forEach(entry => {
      const dateKey = entry.date || 'Unknown';
      const mName = normalizeMachine(entry.machineNumber);
      const shift = (entry.shift || 'day').toLowerCase();
      const production = Number(entry.machineStitch) || Number(entry.calculatedTotal) || 0;

      if (!datesMap[dateKey]) {
        datesMap[dateKey] = {};
      }
      if (!datesMap[dateKey][mName]) {
        datesMap[dateKey][mName] = { day: 0, night: 0 };
      }

      if (shift === 'night') {
        datesMap[dateKey][mName].night += production;
      } else {
        datesMap[dateKey][mName].day += production;
      }
    });

    const sortedDates = Object.keys(datesMap).sort();
    const resultDates = sortedDates.map(dateKey => {
      const machinesObj = datesMap[dateKey];
      const sortedMachines = Object.keys(machinesObj).sort();
      let dateTotal = 0;

      const machinesList = sortedMachines.map(mName => {
        const dayProd = machinesObj[mName].day;
        const nightProd = machinesObj[mName].night;
        const totalProd = dayProd + nightProd;
        dateTotal += totalProd;
        return {
          machine: mName,
          dayProd,
          nightProd,
          totalProd
        };
      });

      overallGrandTotal += dateTotal;

      return {
        dateStr: dateKey,
        dateFormatted: formatDateDisplay(dateKey),
        machines: machinesList,
        dateTotal
      };
    });

    return {
      dates: resultDates,
      grandTotal: overallGrandTotal
    };
  }, [filteredEntries]);

  // Process Commission Summary Report Data
  const commissionSummaryData = useMemo(() => {
    const dayMap = {};
    const nightMap = {};
    let dayTotal = 0;
    let nightTotal = 0;

    selectedMachines.forEach(m => {
      dayMap[m] = 0;
      nightMap[m] = 0;
    });

    filteredEntries.forEach(entry => {
      const mName = normalizeMachine(entry.machineNumber);
      const shift = (entry.shift || 'day').toLowerCase();
      const commissionRs = Number(entry.extraPay) || 0;

      if (shift === 'night') {
        nightMap[mName] = (nightMap[mName] || 0) + commissionRs;
        nightTotal += commissionRs;
      } else {
        dayMap[mName] = (dayMap[mName] || 0) + commissionRs;
        dayTotal += commissionRs;
      }
    });

    return {
      dayMap,
      nightMap,
      dayTotal,
      nightTotal,
      grandTotal: dayTotal + nightTotal
    };
  }, [filteredEntries, selectedMachines]);

  // Exports
  const handleExportExcel = () => {
    if (dailyReportData.dates.length === 0) {
      toast.error('No data available to export');
      return;
    }

    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += `Daily Commission Report (From ${formatDateDisplay(fromDate)} To ${formatDateDisplay(toDate)})\n\n`;
    csvContent += 'Report Date,Machine,Shift,Production\n';

    dailyReportData.dates.forEach(dItem => {
      dItem.machines.forEach(mItem => {
        csvContent += `"${dItem.dateFormatted}","${mItem.machine}","Day",${mItem.dayProd}\n`;
        csvContent += `,"","Night",${mItem.nightProd}\n`;
        csvContent += `,"","Total",${mItem.totalProd}\n`;
      });
    });
    csvContent += `\nGrand Total,,,${dailyReportData.grandTotal}\n\n`;

    csvContent += `Commission Summary Report\n`;
    csvContent += `Shift,Machine,Commission Rs.\n`;
    Object.keys(commissionSummaryData.dayMap).forEach(m => {
      csvContent += `"Day","${m}",${commissionSummaryData.dayMap[m]}\n`;
    });
    csvContent += `"Day Total",,${commissionSummaryData.dayTotal}\n`;
    Object.keys(commissionSummaryData.nightMap).forEach(m => {
      csvContent += `"Night","${m}",${commissionSummaryData.nightMap[m]}\n`;
    });
    csvContent += `"Night Total",,${commissionSummaryData.nightTotal}\n`;
    csvContent += `"Grand Total",,${commissionSummaryData.grandTotal}\n`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Daily_Commission_Report_${fromDate}_to_${toDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExportDropdown(false);
    toast.success('Excel Report downloaded successfully!');
  };

  const handleExportWord = () => {
    if (dailyReportData.dates.length === 0) {
      toast.error('No data available to export');
      return;
    }

    const htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><title>Daily Commission Report</title>
      <style>
        body { font-family: Arial, sans-serif; }
        h2, h3 { color: #1e293b; text-align: center; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: center; }
        th { background-color: #f1f5f9; font-weight: bold; }
        .total-row { background-color: #f8fafc; font-weight: bold; }
        .grand-total { background-color: #e2e8f0; font-weight: bold; font-size: 1.1em; }
      </style>
      </head>
      <body>
        <h2>Bansi Fashion - Daily Commission Report</h2>
        <p style="text-align:center;">Shift: All Shift | Period: ${formatDateDisplay(fromDate)} to ${formatDateDisplay(toDate)}</p>
        
        <table>
          <thead>
            <tr>
              <th>Report Date</th>
              <th>Machine</th>
              <th>Shift</th>
              <th>Production</th>
            </tr>
          </thead>
          <tbody>
            ${dailyReportData.dates.map(dItem => 
              dItem.machines.map((mItem, mIdx) => `
                <tr>
                  ${mIdx === 0 ? `<td rowspan="${dItem.machines.length * 3}">${dItem.dateFormatted}</td>` : ''}
                  <td rowspan="3">${mItem.machine}</td>
                  <td>Day</td>
                  <td>${mItem.dayProd}</td>
                </tr>
                <tr>
                  <td>Night</td>
                  <td>${mItem.nightProd}</td>
                </tr>
                <tr class="total-row">
                  <td>Total</td>
                  <td>${mItem.totalProd}</td>
                </tr>
              `).join('')
            ).join('')}
            <tr class="grand-total">
              <td colspan="3" style="text-align:right;">Grand Total</td>
              <td>${dailyReportData.grandTotal}</td>
            </tr>
          </tbody>
        </table>

        <h3>Commission Summary Report</h3>
        <table>
          <thead>
            <tr>
              <th>Shift</th>
              <th>Machine</th>
              <th>Commission Rs.</th>
            </tr>
          </thead>
          <tbody>
            ${Object.keys(commissionSummaryData.dayMap).map(m => `
              <tr>
                <td>Day</td>
                <td>${m}</td>
                <td>${commissionSummaryData.dayMap[m]}</td>
              </tr>
            `).join('')}
            <tr class="total-row">
              <td colspan="2">Day Total</td>
              <td>${commissionSummaryData.dayTotal}</td>
            </tr>
            ${Object.keys(commissionSummaryData.nightMap).map(m => `
              <tr>
                <td>Night</td>
                <td>${m}</td>
                <td>${commissionSummaryData.nightMap[m]}</td>
              </tr>
            `).join('')}
            <tr class="total-row">
              <td colspan="2">Night Total</td>
              <td>${commissionSummaryData.nightTotal}</td>
            </tr>
            <tr class="grand-total">
              <td colspan="2">Grand Total</td>
              <td>${commissionSummaryData.grandTotal}</td>
            </tr>
          </tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff', htmlContent], {
      type: 'application/msword'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Commission_Report_${fromDate}_to_${toDate}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setShowExportDropdown(false);
    toast.success('Word Document downloaded!');
  };

  const handleExportPDF = async () => {
    if (dailyReportData.dates.length === 0) {
      toast.error('No data available to export');
      return;
    }

    setShowExportDropdown(false);
    const toastId = toast.loading('Generating Machine Production PDF Report...');
    const element = document.querySelector('.report-tables-wrapper');

    if (!element) {
      window.print();
      toast.dismiss(toastId);
      return;
    }

    try {
      const filename = `Machine_Production_Report_${fromDate}_to_${toDate}.pdf`;
      const opt = {
        margin:       [0.25, 0.25, 0.25, 0.25],
        filename:     filename,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true, logging: false, backgroundColor: '#ffffff' },
        jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' }
      };
      await html2pdf().set(opt).from(element).save();
      toast.success('Machine Production PDF downloaded successfully!', { id: toastId });
    } catch (err) {
      console.error('PDF export error:', err);
      window.print();
      toast.dismiss(toastId);
    }
  };

  const handlePrintPDF = () => {
    window.print();
    setShowExportDropdown(false);
  };

  return (
    <div className="commission-report-container">
      {/* FILTER CONTROLS CARD */}
      <div className="report-filter-card">
        <div className="filter-form-grid">
          {/* From Date */}
          <div className="filter-field">
            <label className="filter-label">From Date :</label>
            <div className="date-input-wrapper">
              <input
                type="date"
                className="form-control report-date-picker"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
              <Calendar size={18} className="calendar-icon" />
            </div>
          </div>

          {/* End Date */}
          <div className="filter-field">
            <label className="filter-label">End Date :</label>
            <div className="date-input-wrapper">
              <input
                type="date"
                className="form-control report-date-picker"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
              <Calendar size={18} className="calendar-icon" />
            </div>
          </div>
        </div>

        {/* Machine Checkboxes */}
        <div className="machine-filter-row">
          <label className="filter-label">Machine :</label>

          <label className="custom-checkbox-label" style={{ fontWeight: 600 }}>
            <input
              type="checkbox"
              checked={groupWiseMachine}
              onChange={(e) => setGroupWiseMachine(e.target.checked)}
            />
            <span>Group Wise Machine</span>
          </label>

          <div className="machine-checkboxes-group">
            <label className="custom-checkbox-label">
              <input
                type="checkbox"
                checked={selectAllMachines}
                onChange={handleSelectAllToggle}
              />
              <span>Select All</span>
            </label>

            {availableMachines.map(m => (
              <label key={m} className="custom-checkbox-label">
                <input
                  type="checkbox"
                  checked={selectedMachines.includes(m)}
                  onChange={() => handleMachineToggle(m)}
                />
                <span>{m}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="report-action-buttons">
          <button
            className="btn btn-report-show"
            onClick={() => toast.success('Report updated!')}
          >
            Show Report
          </button>

          {/* Download Dropdown */}
          <div className="download-dropdown-wrapper" ref={dropdownRef}>
            <button
              className="btn btn-report-download"
              onClick={() => setShowExportDropdown(!showExportDropdown)}
            >
              <Download size={16} /> Download <span className="dropdown-arrow">▼</span>
            </button>

            {showExportDropdown && (
              <div className="download-menu-popover">
                <button className="menu-item" onClick={handleExportPDF} title="Download PDF File">
                  <FileText size={18} color="#dc2626" /> Download PDF
                </button>
                <button className="menu-item" onClick={handleExportExcel} title="Export to CSV / Excel">
                  <FileSpreadsheet size={18} color="#16a34a" /> Excel (CSV)
                </button>
                <button className="menu-item" onClick={handleExportWord} title="Export to Word Document">
                  <FileCode size={18} color="#2563eb" /> Word (.doc)
                </button>
                <button className="menu-item" onClick={handlePrintPDF} title="Print Report">
                  <Printer size={18} color="#475569" /> Print Report
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* REPORT PRINT AREA */}
      <div className="report-tables-wrapper">
        
        {/* TABLE 1: DAILY COMMISSION REPORT */}
        <div className="report-table-card">
          <div className="report-card-header">
            <h2 className="report-title">Daily Commission Report</h2>
            <span className="report-shift-badge">Shift : All Shift</span>
          </div>

          <div className="table-responsive">
            <table className="report-data-table">
              <thead>
                <tr>
                  <th>Report Date</th>
                  <th>Machine</th>
                  <th>Shift</th>
                  <th>Production</th>
                </tr>
              </thead>
              <tbody>
                {dailyReportData.dates.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="empty-table-cell">
                      No production entries found for the selected date range and machines.
                    </td>
                  </tr>
                ) : (
                  dailyReportData.dates.map((dateItem) => {
                    const rowCount = dateItem.machines.length * 3;
                    return dateItem.machines.map((mItem, mIdx) => (
                      <tbody key={`${dateItem.dateStr}-${mItem.machine}`}>
                        {/* Day Shift Row */}
                        <tr>
                          {mIdx === 0 && (
                            <td rowSpan={rowCount} className="date-cell">
                              {dateItem.dateFormatted}
                            </td>
                          )}
                          <td rowSpan={3} className="machine-cell">
                            {mItem.machine}
                          </td>
                          <td className="shift-cell">Day</td>
                          <td className="prod-cell">{mItem.dayProd.toLocaleString()}</td>
                        </tr>

                        {/* Night Shift Row */}
                        <tr>
                          <td className="shift-cell">Night</td>
                          <td className="prod-cell">{mItem.nightProd.toLocaleString()}</td>
                        </tr>

                        {/* Total Machine Row */}
                        <tr className="machine-subtotal-row">
                          <td className="shift-cell bold">Total</td>
                          <td className="prod-cell bold">{mItem.totalProd.toLocaleString()}</td>
                        </tr>
                      </tbody>
                    ));
                  })
                )}
              </tbody>
              {dailyReportData.dates.length > 0 && (
                <tfoot>
                  <tr className="grand-total-row">
                    <td colSpan="3" className="grand-total-label">Grand Total</td>
                    <td className="grand-total-val">{dailyReportData.grandTotal.toLocaleString()}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>

        {/* TABLE 2: COMMISSION SUMMARY REPORT */}
        <div className="report-table-card">
          <div className="report-card-header flex-column-mobile">
            <span className="summary-date-sub">
              From: {formatDateDisplay(fromDate)}
            </span>
            <h2 className="report-title center-title">Commission Summary Report</h2>
            <span className="summary-date-sub">
              To: {formatDateDisplay(toDate)}
            </span>
          </div>

          <div className="table-responsive">
            <table className="report-data-table summary-table">
              <thead>
                <tr>
                  <th>Shift</th>
                  <th>Machine</th>
                  <th>Commission Rs.</th>
                </tr>
              </thead>
              <tbody>
                {/* Day Shift Rows */}
                {Object.keys(commissionSummaryData.dayMap).map(m => (
                  <tr key={`sum-day-${m}`}>
                    <td>Day</td>
                    <td>{m}</td>
                    <td className="amount-cell">{commissionSummaryData.dayMap[m]}</td>
                  </tr>
                ))}
                <tr className="subtotal-summary-row">
                  <td colSpan="2" className="subtotal-label">Day Total</td>
                  <td className="amount-cell bold">{commissionSummaryData.dayTotal}</td>
                </tr>

                {/* Night Shift Rows */}
                {Object.keys(commissionSummaryData.nightMap).map(m => (
                  <tr key={`sum-night-${m}`}>
                    <td>Night</td>
                    <td>{m}</td>
                    <td className="amount-cell">{commissionSummaryData.nightMap[m]}</td>
                  </tr>
                ))}
                <tr className="subtotal-summary-row">
                  <td colSpan="2" className="subtotal-label">Night Total</td>
                  <td className="amount-cell bold">{commissionSummaryData.nightTotal}</td>
                </tr>
              </tbody>
              <tfoot>
                <tr className="grand-total-row">
                  <td colSpan="2" className="grand-total-label">Grand Total</td>
                  <td className="amount-cell grand-total-val">{commissionSummaryData.grandTotal}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Footer Support Info */}
        <div className="report-footer-support">
          <span>Support: 💬 +919737369993</span>
          <span>CID: 1579</span>
        </div>
      </div>
    </div>
  );
};

export default CommissionReport;
