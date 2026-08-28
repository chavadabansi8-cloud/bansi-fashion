import React, { useState, useMemo, useRef } from 'react';
import { Calendar, Download, Printer, FileSpreadsheet, FileText, FileCode } from 'lucide-react';
import toast from 'react-hot-toast';
import { calculateDesignBonus } from '../utils/bonusCalculator';

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

  // Time formatters
  const formatHHMM = (totalMins) => {
    if (!totalMins || totalMins <= 0) return '00:00';
    const h = Math.floor(totalMins / 60);
    const m = Math.floor(totalMins % 60);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  const formatHHMMSS = (totalMins) => {
    if (!totalMins || totalMins <= 0) return '00:00:00';
    const h = Math.floor(totalMins / 60);
    const m = Math.floor(totalMins % 60);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`;
  };

  // Process Daily Commission Report Data matching exact screenshot structure
  const dailyReportData = useMemo(() => {
    const datesSet = new Set();

    if (fromDate && toDate) {
      let curr = new Date(fromDate + 'T00:00:00');
      const end = new Date(toDate + 'T00:00:00');
      let safety = 0;
      while (curr <= end && safety < 62) {
        const y = curr.getFullYear();
        const m = String(curr.getMonth() + 1).padStart(2, '0');
        const d = String(curr.getDate()).padStart(2, '0');
        datesSet.add(`${y}-${m}-${d}`);
        curr.setDate(curr.getDate() + 1);
        safety++;
      }
    }

    filteredEntries.forEach(e => {
      if (e.date) datesSet.add(e.date);
    });

    const sortedDates = Array.from(datesSet).sort();
    const activeMachines = selectedMachines.length > 0 ? selectedMachines : availableMachines;

    let overallGrandProd = 0;
    let overallGrandRunMins = 0;
    let overallGrandStopMins = 0;
    let overallGrandCommission = 0;

    const datesList = sortedDates.map(dateKey => {
      const machinesList = activeMachines.map(mName => {
        const getShiftMetrics = (shiftType) => {
          const shiftEntries = filteredEntries.filter(e => {
            const dMatch = e.date === dateKey;
            const mMatch = normalizeMachine(e.machineNumber) === mName;
            const sMatch = (e.shift || 'day').toLowerCase() === shiftType;
            return dMatch && mMatch && sMatch;
          });

          const production = shiftEntries.reduce((sum, e) => sum + (Number(e.machineStitch) || Number(e.calculatedTotal) || 0), 0);

          // Calculate bonus + extra pay for shift entries
          let commission = shiftEntries.reduce((sum, e) => {
            const bonus = Number(e.calculatedTotal) || calculateDesignBonus({
              designStitch: e.designStitch,
              machineStitch: e.machineStitch,
              frame: e.frame,
              workerCount: e.workerCount
            });
            const extra = Number(e.extraPay) || 0;
            return sum + bonus + extra;
          }, 0);

          // If no specific entries recorded but production >= 150000, estimate production bonus
          if (commission === 0 && production >= 150000) {
            commission = calculateDesignBonus({
              designStitch: Math.round(production / 60),
              machineStitch: production,
              frame: 60,
              workerCount: 1
            });
          }

          let dayRunMins = 0;
          const reportedHours = shiftEntries.reduce((sum, e) => sum + (Number(e.hoursWorked) || 0), 0);

          if (reportedHours > 0) {
            dayRunMins = Math.round(reportedHours * 60);
          } else if (production > 0) {
            const ratio = production / 488000;
            dayRunMins = Math.min(11 * 60 + 50, Math.max(3 * 60, Math.round(ratio * 10 * 60)));
          } else {
            dayRunMins = 0;
          }

          const dayStopMins = Math.max(0, (12 * 60) - dayRunMins);
          const eff = production > 0 ? Math.min(99, Math.max(10, Math.round((dayRunMins / (12 * 60)) * 100))) : 0;

          return {
            production,
            dayRunMins,
            dayStopMins,
            eff,
            commission
          };
        };

        const dayData = getShiftMetrics('day');
        const nightData = getShiftMetrics('night');

        const totalProd = dayData.production + nightData.production;
        const totalRunMins = dayData.dayRunMins + nightData.dayRunMins;
        const totalStopMins = dayData.dayStopMins + nightData.dayStopMins;
        const totalCommission = dayData.commission + nightData.commission;
        const totalEff = totalRunMins > 0 ? Math.min(99, Math.round((totalRunMins / (24 * 60)) * 100)) : 0;

        overallGrandProd += totalProd;
        overallGrandRunMins += totalRunMins;
        overallGrandStopMins += totalStopMins;
        overallGrandCommission += totalCommission;

        return {
          machine: mName,
          day: dayData,
          night: nightData,
          total: {
            production: totalProd,
            dayRunMins: totalRunMins,
            dayStopMins: totalStopMins,
            eff: totalEff,
            commission: totalCommission
          }
        };
      });

      return {
        dateStr: dateKey,
        dateFormatted: formatDateDisplay(dateKey),
        machines: machinesList
      };
    });

    const totalPossibleShiftMins = datesList.length * activeMachines.length * 24 * 60;
    const overallGrandEff = totalPossibleShiftMins > 0 ? Math.min(99, Math.round((overallGrandRunMins / totalPossibleShiftMins) * 100)) : 0;

    return {
      dates: datesList,
      grandTotal: {
        production: overallGrandProd,
        dayRunMins: overallGrandRunMins,
        dayStopMins: overallGrandStopMins,
        eff: overallGrandEff,
        commission: overallGrandCommission
      }
    };
  }, [filteredEntries, fromDate, toDate, selectedMachines, availableMachines]);

  // Process Commission Summary Report Data (Synchronized with Daily Commission Report)
  const commissionSummaryData = useMemo(() => {
    const dayMap = {};
    const nightMap = {};
    let dayTotal = 0;
    let nightTotal = 0;

    const activeMachines = selectedMachines.length > 0 ? selectedMachines : availableMachines;
    activeMachines.forEach(m => {
      dayMap[m] = 0;
      nightMap[m] = 0;
    });

    dailyReportData.dates.forEach(dItem => {
      dItem.machines.forEach(mItem => {
        dayMap[mItem.machine] = (dayMap[mItem.machine] || 0) + mItem.day.commission;
        nightMap[mItem.machine] = (nightMap[mItem.machine] || 0) + mItem.night.commission;
      });
    });

    Object.values(dayMap).forEach(v => { dayTotal += v; });
    Object.values(nightMap).forEach(v => { nightTotal += v; });

    return {
      dayMap,
      nightMap,
      dayTotal,
      nightTotal,
      grandTotal: dayTotal + nightTotal
    };
  }, [dailyReportData, selectedMachines, availableMachines]);

  // Exports
  const handleExportExcel = () => {
    if (dailyReportData.dates.length === 0) {
      toast.error('No data available to export');
      return;
    }

    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += `Daily Commission Report (From ${formatDateDisplay(fromDate)} To ${formatDateDisplay(toDate)})\n\n`;
    csvContent += 'Report Date,Machine,Shift,Production,Day Run,Day Stop,Eff.,Commission Rs.\n';

    dailyReportData.dates.forEach(dItem => {
      dItem.machines.forEach(mItem => {
        csvContent += `"${dItem.dateFormatted}","M${mItem.machine}","Day",${mItem.day.production},"${formatHHMM(mItem.day.dayRunMins)}","${formatHHMM(mItem.day.dayStopMins)}",${mItem.day.eff},${mItem.day.commission}\n`;
        csvContent += `,"","Night",${mItem.night.production},"${formatHHMM(mItem.night.dayRunMins)}","${formatHHMM(mItem.night.dayStopMins)}",${mItem.night.eff},${mItem.night.commission}\n`;
        csvContent += `,"","Total",${mItem.total.production},"${formatHHMMSS(mItem.total.dayRunMins)}","${formatHHMMSS(mItem.total.dayStopMins)}",${mItem.total.eff},${mItem.total.commission}\n`;
      });
    });
    csvContent += `\nGrand Total,,,${dailyReportData.grandTotal.production},"${formatHHMMSS(dailyReportData.grandTotal.dayRunMins)}","${formatHHMMSS(dailyReportData.grandTotal.dayStopMins)}",${dailyReportData.grandTotal.eff},${dailyReportData.grandTotal.commission}\n\n`;

    csvContent += `Commission Summary Report\n`;
    csvContent += `Shift,Machine,Commission Rs.\n`;
    Object.keys(commissionSummaryData.dayMap).forEach(m => {
      csvContent += `"Day","M${m}",${commissionSummaryData.dayMap[m]}\n`;
    });
    csvContent += `"Day Total",,${commissionSummaryData.dayTotal}\n`;
    Object.keys(commissionSummaryData.nightMap).forEach(m => {
      csvContent += `"Night","M${m}",${commissionSummaryData.nightMap[m]}\n`;
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
        th, td { border: 1px solid #1a2a47; padding: 8px; text-align: center; }
        th { background-color: #3b5998; color: white; font-weight: bold; }
        .total-row { background-color: #415b9b; color: white; font-weight: bold; }
        .grand-total { background-color: #344a7e; color: white; font-weight: bold; font-size: 1.1em; }
      </style>
      </head>
      <body>
        <h2>Bansi Fashion - Daily Commission Report</h2>
        <p style="text-align:center;">Period: ${formatDateDisplay(fromDate)} to ${formatDateDisplay(toDate)}</p>
        
        <table>
          <thead>
            <tr>
              <th>Report Date</th>
              <th>Machine</th>
              <th>Shift</th>
              <th>Production</th>
              <th>Day Run</th>
              <th>Day Stop</th>
              <th>Eff.</th>
              <th>Commission Rs.</th>
            </tr>
          </thead>
          <tbody>
            ${dailyReportData.dates.map(dItem => 
              dItem.machines.map((mItem, mIdx) => `
                <tr>
                  ${mIdx === 0 ? `<td rowspan="${dItem.machines.length * 3}">${dItem.dateFormatted}</td>` : ''}
                  <td rowspan="3">M${mItem.machine}</td>
                  <td>Day</td>
                  <td>${mItem.day.production.toLocaleString()}</td>
                  <td>${formatHHMM(mItem.day.dayRunMins)}</td>
                  <td>${formatHHMM(mItem.day.dayStopMins)}</td>
                  <td>${mItem.day.eff}</td>
                  <td>${mItem.day.commission}</td>
                </tr>
                <tr>
                  <td>Night</td>
                  <td>${mItem.night.production.toLocaleString()}</td>
                  <td>${formatHHMM(mItem.night.dayRunMins)}</td>
                  <td>${formatHHMM(mItem.night.dayStopMins)}</td>
                  <td>${mItem.night.eff}</td>
                  <td>${mItem.night.commission}</td>
                </tr>
                <tr class="total-row">
                  <td>Total</td>
                  <td>${mItem.total.production.toLocaleString()}</td>
                  <td>${formatHHMMSS(mItem.total.dayRunMins)}</td>
                  <td>${formatHHMMSS(mItem.total.dayStopMins)}</td>
                  <td>${mItem.total.eff}</td>
                  <td>${mItem.total.commission}</td>
                </tr>
              `).join('')
            ).join('')}
            <tr class="grand-total">
              <td colspan="3">Grand Total</td>
              <td>${dailyReportData.grandTotal.production.toLocaleString()}</td>
              <td>${formatHHMMSS(dailyReportData.grandTotal.dayRunMins)}</td>
              <td>${formatHHMMSS(dailyReportData.grandTotal.dayStopMins)}</td>
              <td>${dailyReportData.grandTotal.eff}</td>
              <td>${dailyReportData.grandTotal.commission}</td>
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
      const html2pdf = (await import('html2pdf.js')).default;
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
        
        {/* TABLE 1: DAILY COMMISSION REPORT (EXACT SCREENSHOT MATCH) */}
        <div className="commission-report-card-container">
          <div className="daily-commission-banner-title">
            Daily Commission Report
          </div>

          <div className="table-responsive">
            <table className="daily-commission-table-exact">
              <thead>
                <tr>
                  <th>Report Date</th>
                  <th>Machine</th>
                  <th>Shift</th>
                  <th>Production</th>
                  <th>Day Run</th>
                  <th>Day Stop</th>
                  <th>Eff.</th>
                  <th>Commission Rs.</th>
                </tr>
              </thead>
              <tbody>
                {dailyReportData.dates.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="empty-table-cell">
                      No production entries found for the selected date range and machines.
                    </td>
                  </tr>
                ) : (
                  dailyReportData.dates.map((dateItem) => {
                    const rowCountForDate = dateItem.machines.length * 3;
                    return dateItem.machines.map((mItem, mIdx) => (
                      <React.Fragment key={`${dateItem.dateStr}-${mItem.machine}`}>
                        {/* Day Shift Row */}
                        <tr>
                          {mIdx === 0 && (
                            <td rowSpan={rowCountForDate} className="date-col-cell">
                              {dateItem.dateFormatted}
                            </td>
                          )}
                          <td rowSpan={3} className="machine-col-cell">
                            M{mItem.machine}
                          </td>
                          <td>Day</td>
                          <td>{mItem.day.production.toLocaleString('en-IN')}</td>
                          <td>{formatHHMM(mItem.day.dayRunMins)}</td>
                          <td>{formatHHMM(mItem.day.dayStopMins)}</td>
                          <td>{mItem.day.eff}</td>
                          <td>{mItem.day.commission.toLocaleString('en-IN')}</td>
                        </tr>

                        {/* Night Shift Row */}
                        <tr>
                          <td>Night</td>
                          <td>{mItem.night.production.toLocaleString('en-IN')}</td>
                          <td>{formatHHMM(mItem.night.dayRunMins)}</td>
                          <td>{formatHHMM(mItem.night.dayStopMins)}</td>
                          <td>{mItem.night.eff}</td>
                          <td>{mItem.night.commission.toLocaleString('en-IN')}</td>
                        </tr>

                        {/* Total Machine Row */}
                        <tr className="shift-total-row">
                          <td style={{ fontWeight: 700 }}>Total</td>
                          <td style={{ fontWeight: 700 }}>{mItem.total.production.toLocaleString('en-IN')}</td>
                          <td style={{ fontWeight: 700 }}>{formatHHMMSS(mItem.total.dayRunMins)}</td>
                          <td style={{ fontWeight: 700 }}>{formatHHMMSS(mItem.total.dayStopMins)}</td>
                          <td style={{ fontWeight: 700 }}>{mItem.total.eff}</td>
                          <td style={{ fontWeight: 700 }}>{mItem.total.commission.toLocaleString('en-IN')}</td>
                        </tr>
                      </React.Fragment>
                    ));
                  })
                )}

                {/* Grand Total Row */}
                {dailyReportData.dates.length > 0 && (
                  <tr className="grand-total-exact-row">
                    <td colSpan={3} style={{ textAlign: 'center', fontWeight: 800 }}>
                      Grand Total
                    </td>
                    <td style={{ fontWeight: 800 }}>{dailyReportData.grandTotal.production.toLocaleString('en-IN')}</td>
                    <td style={{ fontWeight: 800 }}>{formatHHMMSS(dailyReportData.grandTotal.dayRunMins)}</td>
                    <td style={{ fontWeight: 800 }}>{formatHHMMSS(dailyReportData.grandTotal.dayStopMins)}</td>
                    <td style={{ fontWeight: 800 }}>{dailyReportData.grandTotal.eff}</td>
                    <td style={{ fontWeight: 800 }}>{dailyReportData.grandTotal.commission.toLocaleString('en-IN')}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* TABLE 2: COMMISSION SUMMARY REPORT (MATCHING BLUE BANNER THEME) */}
        <div className="commission-report-card-container">
          <div className="daily-commission-banner-title">
            Commission Summary Report ({formatDateDisplay(fromDate)} to {formatDateDisplay(toDate)})
          </div>

          <div className="table-responsive">
            <table className="daily-commission-table-exact">
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
                    <td>M{m}</td>
                    <td>{commissionSummaryData.dayMap[m].toLocaleString('en-IN')}</td>
                  </tr>
                ))}
                <tr className="shift-total-row">
                  <td colSpan="2" style={{ fontWeight: 700 }}>Day Total</td>
                  <td style={{ fontWeight: 700 }}>{commissionSummaryData.dayTotal.toLocaleString('en-IN')}</td>
                </tr>

                {/* Night Shift Rows */}
                {Object.keys(commissionSummaryData.nightMap).map(m => (
                  <tr key={`sum-night-${m}`}>
                    <td>Night</td>
                    <td>M{m}</td>
                    <td>{commissionSummaryData.nightMap[m].toLocaleString('en-IN')}</td>
                  </tr>
                ))}
                <tr className="shift-total-row">
                  <td colSpan="2" style={{ fontWeight: 700 }}>Night Total</td>
                  <td style={{ fontWeight: 700 }}>{commissionSummaryData.nightTotal.toLocaleString('en-IN')}</td>
                </tr>

                {/* Grand Total Row */}
                <tr className="grand-total-exact-row">
                  <td colSpan="2" style={{ textAlign: 'center', fontWeight: 800 }}>Grand Total</td>
                  <td style={{ fontWeight: 800 }}>{commissionSummaryData.grandTotal.toLocaleString('en-IN')}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Support Info */}
        <div className="report-footer-support">
          <span>Support: 💬 +91 7574049710</span>
          <span>CID: 1579</span>
        </div>
      </div>
    </div>
  );
};

export default CommissionReport;
