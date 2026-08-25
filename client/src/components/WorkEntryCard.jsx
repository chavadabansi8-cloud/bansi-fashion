import { Clock, Calendar, CheckCircle2, Tag, Layers, Cpu, Hash, Users, Award, DollarSign } from 'lucide-react';
import { calculateDesignBonus } from '../utils/bonusCalculator';

const WorkEntryCard = ({ entry }) => {
  const initials = entry.workerName
    ? entry.workerName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'WK';

  const entryBonus = calculateDesignBonus({
    designStitch: entry.designStitch,
    machineStitch: entry.machineStitch,
    frame: entry.frame,
    workerCount: entry.workerCount
  }) + (Number(entry.extraPay) || 0);

  const formatTime = (time) => {
    if (!time) return '--';
    const [h, m] = time.split(':');
    const hour = parseInt(h);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${m} ${ampm}`;
  };

  return (
    <div className="entry-card">
      <div className="entry-card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div className="entry-avatar" style={{ width: '38px', height: '38px', fontSize: '0.9rem' }}>{initials}</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{entry.workerName}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Worker ID: <strong>{entry.workerId}</strong></div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          {entry.isExtraWork && (
            <span className="extra-work-badge">⚡ Overtime</span>
          )}
          {entryBonus > 0 && (
            <span className="badge badge-approved" style={{ background: '#ecfdf5', color: '#047857', borderColor: '#a7f3d0', fontWeight: 800 }}>
              🎁 Bonus: ₹{entryBonus}
            </span>
          )}
          <span className="badge badge-approved">
            <CheckCircle2 size={13} color="#047857" />
            &nbsp;Saved
          </span>
        </div>
      </div>

      {entry.description && (
        <div style={{ background: '#f8fafc', padding: '0.5rem 0.75rem', borderRadius: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', borderLeft: '3px solid var(--primary)' }}>
          💬 <strong>Note:</strong> {entry.description}
        </div>
      )}

      {/* Structured Specification Chips */}
      <div className="entry-meta-grid">
        <span className="meta-chip" style={{ background: '#eef2ff', borderColor: '#c7d2fe', color: '#4338ca', fontWeight: 700 }}>
          <Calendar size={13} /> Date: {entry.date}
        </span>

        {entry.shift && (
          <span className="meta-chip">
            {entry.shift === 'night' ? '🌙 Night Shift' : '☀️ Day Shift'}
          </span>
        )}

        <span className="meta-chip">
          <Cpu size={13} /> Machine: <strong>{entry.machineNumber || '1'}</strong>
        </span>

        {entry.designNumber && (
          <span className="meta-chip">
            <Tag size={13} /> Design: <strong>{entry.designNumber}</strong>
          </span>
        )}

        {entry.designStitch !== undefined && entry.designStitch !== '' && (
          <span className="meta-chip">
            <Hash size={13} /> Design Stitch: <strong>{Number(entry.designStitch).toLocaleString()}</strong>
          </span>
        )}

        {entry.machineStitch !== undefined && entry.machineStitch !== '' && (
          <span className="meta-chip">
            <Hash size={13} /> Meter Reading: <strong>{Number(entry.machineStitch).toLocaleString()}</strong>
          </span>
        )}

        <span className="meta-chip">
          <Layers size={13} /> Frame: <strong>{entry.frame || 1}</strong>
        </span>

        <span className="meta-chip">
          <Users size={13} /> Workers: <strong>{entry.workerCount || 1}</strong>
        </span>

        {Number(entry.calculatedTotal) > 0 && (
          <span className="meta-chip meta-chip-highlight" style={{ fontSize: '0.85rem', fontWeight: 800 }}>
            📊 Output Pay: ₹{Number(entry.calculatedTotal).toLocaleString()}
          </span>
        )}
      </div>

      {/* Date, Time and Overtime Pay Meta */}
      <div className="entry-meta-grid" style={{ marginBottom: 0 }}>
        {(entry.startTime || entry.endTime) && (
          <span className="meta-chip" style={{ background: '#ffffff' }}>
            <Clock size={13} /> Time: {formatTime(entry.startTime)} – {formatTime(entry.endTime)}
          </span>
        )}
        {entry.hoursWorked > 0 && (
          <span className="meta-chip" style={{ background: '#ffffff' }}>
            ⏱️ Hours: {entry.hoursWorked} hrs
          </span>
        )}
        {entry.isExtraWork && Number(entry.extraPay) > 0 && (
          <span className="meta-chip" style={{ background: '#fffbeb', color: '#b45309', borderColor: '#fde68a', fontWeight: 800 }}>
            💰 Overtime Extra Pay: ₹{entry.extraPay}
          </span>
        )}
      </div>

      {/* Proof Photo Verification (2 Photos) */}
      {(entry.proofImage || entry.proofImage2) && (
        <div style={{ marginTop: '0.75rem', padding: '0.65rem 0.75rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#334155', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            📸 Verification Proof Photos (Click image to view full size):
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {entry.proofImage && (
              <div style={{ flex: '1', minWidth: '130px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569', marginBottom: '0.2rem' }}>
                  🖼️ Photo 1: Design Stitch Proof
                </div>
                <a href={entry.proofImage} target="_blank" rel="noopener noreferrer">
                  <img
                    src={entry.proofImage}
                    alt="Photo 1: Design Stitch Proof"
                    style={{ maxHeight: '150px', maxWidth: '100%', borderRadius: '6px', cursor: 'pointer', objectFit: 'contain', border: '1px solid #cbd5e1', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}
                    title="Click to view full size photo"
                  />
                </a>
              </div>
            )}

            {entry.proofImage2 && (
              <div style={{ flex: '1', minWidth: '130px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569', marginBottom: '0.2rem' }}>
                  🖼️ Photo 2: Frame / Reading Proof
                </div>
                <a href={entry.proofImage2} target="_blank" rel="noopener noreferrer">
                  <img
                    src={entry.proofImage2}
                    alt="Photo 2: Frame Reading Proof"
                    style={{ maxHeight: '150px', maxWidth: '100%', borderRadius: '6px', cursor: 'pointer', objectFit: 'contain', border: '1px solid #cbd5e1', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}
                    title="Click to view full size photo"
                  />
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkEntryCard;
