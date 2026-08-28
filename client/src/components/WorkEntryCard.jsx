import { useState } from 'react';
import { Clock, Calendar, CheckCircle2, Tag, Layers, Cpu, Hash, Users, Maximize2 } from 'lucide-react';
import { calculateDesignBonus } from '../utils/bonusCalculator';
import ImageModal from './ImageModal';

const WorkEntryCard = ({ entry, isAdmin = false, onStatusUpdate = null }) => {
  const [activeImage, setActiveImage] = useState(null);

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

  const handleOpenPhoto = (imageSrc, title, e) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    if (!imageSrc) return;
    setActiveImage({
      src: imageSrc,
      title: `${title} - ${entry.workerName || 'Worker'}`,
      subtitle: `Date: ${entry.date || 'N/A'} • Design #${entry.designNumber || 'N/A'} • Machine #${entry.machineNumber || '1'} • Frame: ${entry.frame || 1}`
    });
  };

  const photo1 = entry.proofImage || entry.photo || entry.image || '';
  const photo2 = entry.proofImage2 || '';

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
      </div>

      {/* Proof Photo Verification (2 Photos) */}
      {(photo1 || photo2) && (
        <div style={{ marginTop: '0.75rem', padding: '0.65rem 0.75rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#334155', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            📸 Verification Proof Photos <span style={{ color: '#6366f1', fontSize: '0.75rem', fontWeight: 600 }}>(Click photo to open full view)</span>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {photo1 && (
              <div style={{ flex: '1', minWidth: '130px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem' }}>
                  🖼️ Photo 1: Design Stitch Proof
                </div>
                <div
                  onClick={(e) => handleOpenPhoto(photo1, 'Photo 1: Design Stitch Proof', e)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && handleOpenPhoto(photo1, 'Photo 1: Design Stitch Proof', e)}
                  style={{
                    position: 'relative',
                    display: 'inline-block',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    border: '1.5px solid #cbd5e1',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
                    transition: 'all 0.2s ease',
                    background: '#fff',
                    maxWidth: '100%'
                  }}
                  title="Click to view / zoom full photo"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.03)';
                    e.currentTarget.style.borderColor = 'var(--primary)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.borderColor = '#cbd5e1';
                  }}
                >
                  <img
                    src={photo1}
                    alt="Photo 1: Design Stitch Proof"
                    style={{ maxHeight: '150px', maxWidth: '100%', display: 'block', objectFit: 'contain' }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '4px',
                      right: '4px',
                      background: 'rgba(15, 23, 42, 0.8)',
                      color: '#ffffff',
                      borderRadius: '4px',
                      padding: '2px 6px',
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '3px'
                    }}
                  >
                    <Maximize2 size={11} /> Open
                  </div>
                </div>
              </div>
            )}

            {photo2 && (
              <div style={{ flex: '1', minWidth: '130px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem' }}>
                  🖼️ Photo 2: Frame / Reading Proof
                </div>
                <div
                  onClick={(e) => handleOpenPhoto(photo2, 'Photo 2: Frame / Reading Proof', e)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && handleOpenPhoto(photo2, 'Photo 2: Frame / Reading Proof', e)}
                  style={{
                    position: 'relative',
                    display: 'inline-block',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    border: '1.5px solid #cbd5e1',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
                    transition: 'all 0.2s ease',
                    background: '#fff',
                    maxWidth: '100%'
                  }}
                  title="Click to view / zoom full photo"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.03)';
                    e.currentTarget.style.borderColor = 'var(--primary)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.borderColor = '#cbd5e1';
                  }}
                >
                  <img
                    src={photo2}
                    alt="Photo 2: Frame Reading Proof"
                    style={{ maxHeight: '150px', maxWidth: '100%', display: 'block', objectFit: 'contain' }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '4px',
                      right: '4px',
                      background: 'rgba(15, 23, 42, 0.8)',
                      color: '#ffffff',
                      borderRadius: '4px',
                      padding: '2px 6px',
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '3px'
                    }}
                  >
                    <Maximize2 size={11} /> Open
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Fullscreen Photo Lightbox Modal */}
      {activeImage && (
        <ImageModal
          isOpen={!!activeImage}
          onClose={() => setActiveImage(null)}
          imageSrc={activeImage.src}
          title={activeImage.title}
          subtitle={activeImage.subtitle}
        />
      )}
    </div>
  );
};

export default WorkEntryCard;
