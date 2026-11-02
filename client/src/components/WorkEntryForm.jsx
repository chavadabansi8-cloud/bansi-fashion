import { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { PlusCircle, Calendar, Cpu, Tag, Hash, Layers, Users, Zap, DollarSign, Calculator, X, Camera } from 'lucide-react';
import { calculateDesignBonus, getDesignBonusPolicy } from '../utils/bonusCalculator';
import { API } from '../config/api';
import ImageModal from './ImageModal';

const getIstDateValue = (value = new Date()) => {
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(value);
  } catch {
    return value.toISOString().split('T')[0];
  }
};

const WorkEntryForm = ({ onEntryAdded, isModal = false, onCloseModal }) => {
  const { token, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [form, setForm] = useState({
    date: getIstDateValue(),
    shift: 'day',
    machineNumber: user?.machineNumber || '1',
    designNumber: '',
    designStitch: '',
    frame: '',    machineStitch: '',
    workerCount: '1',
    isExtraWork: false,
    extraPay: '',
    proofImage: '',
    proofImage2: ''
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const processImageFile = (file, callback) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload a valid image file (JPEG / PNG)!');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 550;
        const MAX_HEIGHT = 550;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = Math.round(width);
        canvas.height = Math.round(height);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // 0.55 quality provides crisp text reading with 70% smaller file size
        const dataUrl = canvas.toDataURL('image/jpeg', 0.55);
        callback(dataUrl);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleImage1Upload = (e) => {
    processImageFile(e.target.files[0], (dataUrl) => {
      setForm(prev => ({ ...prev, proofImage: dataUrl }));
      toast.success('📸 Photo 1 (Design Stitch Proof) attached!');
    });
  };

  const handleImage2Upload = (e) => {
    processImageFile(e.target.files[0], (dataUrl) => {
      setForm(prev => ({ ...prev, proofImage2: dataUrl }));
      toast.success('📸 Photo 2 (Frame / Reading Proof) attached!');
    });
  };

  const calculateTotal = () => {
    const designStitch = Number(form.designStitch) || 0;
    const machineStitch = Number(form.machineStitch) || 0;
    const frame = Number(form.frame) || 1;
    const workerCount = Number(form.workerCount) || 1;

    if (designStitch <= 0) {
      return 0;
    }

    return calculateDesignBonus({
      designStitch,
      machineStitch,
      frame,
      workerCount
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.proofImage || !form.proofImage2) {
      toast.error('⚠️ Please upload BOTH photos (Photo 1 for Design Stitch and Photo 2 for Frame / Reading proof)!');
      return;
    }

    setLoading(true);
    try {
      const calculatedTotal = calculateTotal();
      const hoursWorked = 0;

      const res = await axios.post(`${API}/work/add`, {
        ...form,
        hoursWorked,
        calculatedTotal,
        extraPay: form.isExtraWork ? (parseFloat(form.extraPay) || 0) : 0
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('Work entry submitted successfully!');
      setForm(prev => ({
        ...prev,
        shift: 'day',
        machineNumber: user?.machineNumber || '1',
        designNumber: '',
        designStitch: '',
        frame: '',
        machineStitch: '',
        workerCount: '1',
        isExtraWork: false,
        extraPay: '',
        proofImage: '',
        proofImage2: ''
      }));
      if (onEntryAdded) onEntryAdded(res.data.entry);
      if (isModal && onCloseModal) onCloseModal();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add work entry');
    } finally {
      setLoading(false);
    }
  };

  const designStitchNum = Number(form.designStitch) || 0;
  const totalOutput = calculateTotal();

  const formContent = (
    <div className={`work-form-section ${isModal ? 'modal-form-content' : ''}`}>

      {/* ── Premium Card: Top gradient bar + header ── */}
      <div className="premium-form-card">
        <div className="premium-form-top-bar" />
        <div className="section-title-premium">
          <div className="section-title-premium-inner">
            <PlusCircle size={22} color="#4338ca" />
            <span>New Daily Work &amp; Stitch Entry</span>
          </div>
          {isModal && (
            <button
              type="button"
              className="modal-close"
              onClick={onCloseModal}
              aria-label="Close modal"
            >
              <X size={20} />
            </button>
          )}
        </div>

        <form id="work-entry-form" onSubmit={handleSubmit} style={{ padding: '0 1.1rem 1.1rem' }}>

          {/* Row 1: Date + Shift */}
          <div className="form-row" style={{ marginBottom: '1rem' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label"><Calendar size={15} /> Entry Date</label>
              <input
                id="work-date"
                type="date"
                name="date"
                className="form-control touch-input"
                value={form.date}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">☀️ Shift Type</label>
              <select
                name="shift"
                className="form-control touch-input"
                value={form.shift}
                onChange={handleChange}
              >
                <option value="day">☀️ Day Shift</option>
                <option value="night">🌙 Night Shift</option>
              </select>
            </div>
          </div>

          {/* Row 2: Machine + Design */}
          <div className="form-row" style={{ marginBottom: '1rem' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label"><Cpu size={15} /> Machine Number</label>
              <select
                name="machineNumber"
                className="form-control touch-input"
                value={form.machineNumber || '1'}
                onChange={handleChange}
              >
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                {form.machineNumber && !['1', '2', '3', '4'].includes(String(form.machineNumber)) && (
                  <option value={form.machineNumber}>Machine {form.machineNumber}</option>
                )}
              </select>
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label"><Tag size={15} /> Design Number</label>
              <input
                type="text"
                name="designNumber"
                className="form-control touch-input"
                value={form.designNumber}
                onChange={handleChange}
                placeholder="e.g. D-504"
              />
            </div>
          </div>

          {/* Row 3: Design Stitch + Frame */}
          <div className="form-row" style={{ marginBottom: '1rem' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label"><Hash size={15} /> Design Stitch</label>
              <input
                type="number"
                name="designStitch"
                className="form-control touch-input"
                value={form.designStitch}
                onChange={handleChange}
                placeholder="e.g. 6000 (Min 5000)"
                min="0"
              />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label"><Layers size={15} /> Frame Count</label>
              <input
                type="number"
                name="frame"
                className="form-control touch-input"
                value={form.frame}
                onChange={handleChange}
                min="1"
                placeholder="e.g. 1"
              />
            </div>
          </div>

          {/* Row 4: Machine Stitch + Workers */}
          <div className="form-row" style={{ marginBottom: '1rem' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label"><Hash size={15} /> Machine Stitch (Reading)</label>
              <input
                type="number"
                name="machineStitch"
                className="form-control touch-input"
                value={form.machineStitch}
                onChange={handleChange}
                placeholder="e.g. 180000"
                min="0"
              />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label"><Users size={15} /> Workers</label>
              <select
                name="workerCount"
                className="form-control touch-input"
                value={form.workerCount}
                onChange={handleChange}
              >
                <option value="1">1 Workers</option>
                <option value="2">2 Workers</option>
              </select>
            </div>
          </div>

          {/* ── Premium Bonus Preview Card ── */}
          {designStitchNum > 0 && (
            <div className="bonus-preview-premium">
              <div className="bonus-preview-premium-label">
                <Calculator size={16} color="#059669" />
                <span>Calculated Bonus Pay</span>
              </div>
              <div className="bonus-preview-premium-amount">
                ₹{totalOutput.toLocaleString('en-IN')}
              </div>
              {designStitchNum < 5000 && (
                <small style={{ color: '#ef4444', fontSize: '0.82rem', marginTop: '0.35rem', display: 'block', fontWeight: 600 }}>
                  ⚠️ 5000 થી ઓછી ડિઝાઇન સ્ટીચ પર બોનસ મળવાપાત્ર નથી (નિયમ મુજબ)
                </small>
              )}
            </div>
          )}

          {/* ── Premium Photo Upload Section ── */}
          <div className="photo-upload-zone-wrapper">
            <div className="photo-upload-zone-header">
              <Camera size={18} color="#4338ca" />
              <span>📸 Verification Photos</span>
              <span style={{ fontWeight: 600, color: '#64748b', fontSize: '0.78rem' }}>(2 Proof Photos Required)</span>
              <span style={{ color: '#ef4444', marginLeft: '2px' }}>*</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>

              {/* Photo 1: Design Stitch Proof */}
              <div className={`photo-upload-zone ${form.proofImage ? 'has-photo' : ''}`}>
                <div className="photo-zone-label">
                  🖼️ Photo 1: Design Stitch
                  <span style={{ color: '#ef4444' }}>*</span>
                </div>
                <input
                  id="proof-image-1-input"
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleImage1Upload}
                  className="form-control touch-input"
                  style={{ padding: '0.35rem 0.5rem', fontSize: '0.8rem' }}
                />
                {form.proofImage ? (
                  <div className="photo-preview-container">
                    <img
                      src={form.proofImage}
                      alt="Design Stitch Proof"
                      onClick={() => setPreviewImage({
                        src: form.proofImage,
                        title: 'Photo 1: Design Stitch Proof Preview',
                        subtitle: 'Uploaded work proof photo 1'
                      })}
                      title="Click to preview full size"
                    />
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.4rem', marginTop: '0.35rem' }}>
                      <span className="photo-attached-badge">✅ Photo 1 attached</span>
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        onClick={() => setForm(prev => ({ ...prev, proofImage: '' }))}
                        style={{ fontSize: '0.68rem', padding: '0.1rem 0.4rem' }}
                      >
                        🗑️ Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <small style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
                    * Upload Design Stitch photo proof
                  </small>
                )}
              </div>

              {/* Photo 2: Frame / Reading Proof */}
              <div className={`photo-upload-zone ${form.proofImage2 ? 'has-photo' : ''}`}>
                <div className="photo-zone-label">
                  🖼️ Photo 2: Frame / Reading
                  <span style={{ color: '#ef4444' }}>*</span>
                </div>
                <input
                  id="proof-image-2-input"
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleImage2Upload}
                  className="form-control touch-input"
                  style={{ padding: '0.35rem 0.5rem', fontSize: '0.8rem' }}
                />
                {form.proofImage2 ? (
                  <div className="photo-preview-container">
                    <img
                      src={form.proofImage2}
                      alt="Frame Reading Proof"
                      onClick={() => setPreviewImage({
                        src: form.proofImage2,
                        title: 'Photo 2: Frame / Reading Proof Preview',
                        subtitle: 'Uploaded work proof photo 2'
                      })}
                      title="Click to preview full size"
                    />
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.4rem', marginTop: '0.35rem' }}>
                      <span className="photo-attached-badge">✅ Photo 2 attached</span>
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        onClick={() => setForm(prev => ({ ...prev, proofImage2: '' }))}
                        style={{ fontSize: '0.68rem', padding: '0.1rem 0.4rem' }}
                      >
                        🗑️ Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <small style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
                    * Upload Frame count / Machine reading proof
                  </small>
                )}
              </div>

            </div>
          </div>

          {/* ── Premium Submit Button ── */}
          <button
            id="submit-work-btn"
            type="submit"
            className="btn-submit-premium"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner" style={{ width: '18px', height: '18px', borderWidth: '2.5px' }} />
                Submitting…
              </>
            ) : (
              <>
                <PlusCircle size={20} />
                Submit Work Record
              </>
            )}
          </button>

        </form>
      </div>

      {previewImage && (
        <ImageModal
          isOpen={!!previewImage}
          onClose={() => setPreviewImage(null)}
          imageSrc={previewImage.src}
          title={previewImage.title}
          subtitle={previewImage.subtitle}
        />
      )}
    </div>
  );

  if (isModal) {
    return (
      <div className="modal-overlay mobile-sheet-overlay" onClick={onCloseModal}>
        <div className="modal-content mobile-sheet-content" onClick={(e) => e.stopPropagation()}>
          {formContent}
        </div>
      </div>
    );
  }

  return formContent;
};

export default WorkEntryForm;
