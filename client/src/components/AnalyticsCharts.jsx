import { useMemo } from 'react';
import { TrendingUp, Cpu, Award, Zap, Users, BarChart3, PieChart, Activity, DollarSign } from 'lucide-react';
import { calculateDesignBonus } from '../utils/bonusCalculator';

const AnalyticsCharts = ({ entries = [], workers = [] }) => {
  // Machine Stitch Production Breakdown
  const machineOutputMap = useMemo(() => {
    const map = {};
    entries.forEach(e => {
      const m = e.machineNumber ? String(e.machineNumber).trim().toUpperCase() : '1';
      const stitches = Number(e.machineStitch) || Number(e.calculatedTotal) || 0;
      map[m] = (map[m] || 0) + stitches;
    });
    return map;
  }, [entries]);

  const maxMachineOutput = useMemo(() => {
    const vals = Object.values(machineOutputMap);
    return vals.length > 0 ? Math.max(...vals) : 1;
  }, [machineOutputMap]);

  // Top Karigars / Workers Leaderboard (Stitches & Bonus)
  const workerLeaderboard = useMemo(() => {
    const map = {};
    entries.forEach(e => {
      const wId = e.workerId || 'UNKNOWN';
      if (!map[wId]) {
        map[wId] = {
          workerId: wId,
          name: e.workerName || wId,
          totalStitches: 0,
          totalBonus: 0,
          entriesCount: 0,
          overtimeCount: 0
        };
      }
      const st = Number(e.machineStitch) || Number(e.calculatedTotal) || 0;
      const designBonus = calculateDesignBonus({
        designStitch: e.designStitch,
        machineStitch: e.machineStitch,
        frame: e.frame,
        workerCount: e.workerCount
      });
      const extraPay = Number(e.extraPay) || 0;

      map[wId].totalStitches += st;
      map[wId].totalBonus += (designBonus + extraPay);
      map[wId].entriesCount += 1;
      if (e.isExtraWork) map[wId].overtimeCount += 1;
    });

    return Object.values(map)
      .sort((a, b) => b.totalStitches - a.totalStitches)
      .slice(0, 5);
  }, [entries]);

  // Shift Comparison (Day vs Night)
  const shiftMetrics = useMemo(() => {
    let dayTotal = 0;
    let nightTotal = 0;
    entries.forEach(e => {
      const shift = (e.shift || 'day').toLowerCase();
      const st = Number(e.machineStitch) || Number(e.calculatedTotal) || 0;
      if (shift === 'night') nightTotal += st;
      else dayTotal += st;
    });
    const grandTotal = dayTotal + nightTotal || 1;
    const dayPct = Math.round((dayTotal / grandTotal) * 100);
    const nightPct = Math.round((nightTotal / grandTotal) * 100);
    return { dayTotal, nightTotal, dayPct, nightPct };
  }, [entries]);

  return (
    <div className="analytics-container">
      {/* KPI Cards Row */}
      <div className="analytics-kpi-grid">
        <div className="kpi-card kpi-card-1">
          <div className="kpi-icon"><Activity size={22} /></div>
          <div>
            <div className="kpi-val">{(shiftMetrics.dayTotal + shiftMetrics.nightTotal).toLocaleString()}</div>
            <div className="kpi-label">Total Industrial Stitch Production</div>
          </div>
        </div>

        <div className="kpi-card kpi-card-2">
          <div className="kpi-icon"><Cpu size={22} /></div>
          <div>
            <div className="kpi-val">{Object.keys(machineOutputMap).length} Active</div>
            <div className="kpi-label">Embroidery Machines Running</div>
          </div>
        </div>

        <div className="kpi-card kpi-card-3">
          <div className="kpi-icon"><Award size={22} /></div>
          <div>
            <div className="kpi-val">{workerLeaderboard[0]?.name || 'N/A'}</div>
            <div className="kpi-label">Top Performing Karigar</div>
          </div>
        </div>
      </div>

      {/* Main Charts & Leaderboard Grid */}
      <div className="analytics-charts-grid">
        {/* Machine Output Bar Visualizer */}
        <div className="analytics-card">
          <div style={{ marginBottom: '1.25rem' }}>
            <h3 className="analytics-card-title" style={{ margin: 0, marginBottom: '0.4rem', fontSize: '1.1rem' }}>
              <Cpu size={18} color="var(--primary)" /> Machine Production Output
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
              <span className="badge badge-admin" style={{ fontSize: '0.7rem', padding: '0.2rem 0.55rem' }}>Live Stats</span>
              <span className="analytics-card-sub" style={{ margin: 0 }}>Total stitch output breakdown per machine</span>
            </div>
          </div>

          <div className="machine-bars-list">
            {Object.keys(machineOutputMap).length === 0 ? (
              <div className="empty-state-sub" style={{ padding: '2rem', textAlign: 'center' }}>No production entries recorded yet.</div>
            ) : (
              Object.entries(machineOutputMap).map(([mNum, stitches]) => {
                const pct = Math.round((stitches / maxMachineOutput) * 100);
                return (
                  <div key={mNum} className="bar-row-item">
                    <div className="bar-label-flex">
                      <span className="bar-name">Machine {mNum}</span>
                      <span className="bar-value">{stitches.toLocaleString()} Stitches</span>
                    </div>
                    <div className="bar-track">
                      <div className="bar-fill" style={{ width: `${pct}%` }}></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Top Karigars Leaderboard */}
        <div className="analytics-card">
          <div style={{ marginBottom: '1.25rem' }}>
            <h3 className="analytics-card-title" style={{ margin: 0, marginBottom: '0.4rem', fontSize: '1.1rem' }}>
              <Award size={18} color="#eab308" /> Karigar Efficiency Leaderboard
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
              <span className="badge badge-approved" style={{ fontSize: '0.7rem', padding: '0.2rem 0.55rem' }}>Top Performers</span>
              <span className="analytics-card-sub" style={{ margin: 0 }}>Highest production ranking for current period</span>
            </div>
          </div>

          <div className="leaderboard-list">
            {workerLeaderboard.length === 0 ? (
              <div className="empty-state-sub" style={{ padding: '2rem', textAlign: 'center' }}>No worker performance data available.</div>
            ) : (
              workerLeaderboard.map((worker, idx) => (
                <div key={worker.workerId} className="leaderboard-item">
                  <div className={`rank-badge rank-${idx + 1}`}>{idx + 1}</div>
                  <div className="leaderboard-info">
                    <div className="lb-name">{worker.name}</div>
                    <div className="lb-sub">ID: {worker.workerId} • {worker.entriesCount} Entries</div>
                  </div>
                  <div className="lb-score">
                    <div>
                      <span className="lb-score-val">{worker.totalStitches.toLocaleString()}</span>
                      <span className="lb-score-lbl">Stitches</span>
                    </div>
                    <div className="lb-bonus-badge">
                      <span className="lb-bonus-val">+₹{worker.totalBonus.toLocaleString()}</span>
                      <span className="lb-bonus-lbl">Bonus</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Shift Comparison Bar */}
      <div className="analytics-card" style={{ marginTop: '1.25rem' }}>
        <h3 className="analytics-card-title"><TrendingUp size={18} color="var(--primary)" /> Day vs Night Shift Output Ratio</h3>
        <div style={{ margin: '1rem 0 0.5rem' }}>
          <div className="bar-label-flex">
            <span>☀️ Day Shift ({shiftMetrics.dayPct}%)</span>
            <span>🌙 Night Shift ({shiftMetrics.nightPct}%)</span>
          </div>
          <div className="shift-ratio-track">
            <div className="shift-day-fill" style={{ width: `${shiftMetrics.dayPct}%` }}></div>
            <div className="shift-night-fill" style={{ width: `${shiftMetrics.nightPct}%` }}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsCharts;
