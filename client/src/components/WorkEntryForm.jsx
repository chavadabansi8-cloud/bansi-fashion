import { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { PlusCircle, Calendar, Cpu, Tag, Hash, Layers, Users, Zap, DollarSign, Calculator, X, Camera } from 'lucide-react';
import { calculateDesignBonus, getDesignBonusPolicy } from '../utils/bonusCalculator';
import { API } from '../config/api';

const WorkEntryForm = ({ onEntryAdded, isModal = false, onCloseModal }) => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    shift: 'day',
    machineNumber: '1',
    designNumber: '',
    designStitch: '',
    frame: '1',
    machineStitch: '',
    workerCount: '1',
    isExtraWork: false,
    extraPay: '',
    proofImage: ''
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('કૃપા કરીને ફક્ત ઈમેજ (ફોટો) ફાઇલ જ અપલોડ કરો!');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
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

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.75);
        setForm(prev => ({ ...prev, proofImage: dataUrl }));
        toast.success('📸 સ્ટીચ અને ફ્રેમ સબૂતો નો ફોટો સિલેક્ટ થઈ ગયો છે!');
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
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

    if (!form.proofImage) {
      toast.error('⚠️ કૃપા કરીને ડિઝાઇન સ્ટીચ અને ફ્રેમ ચકાસણી માટે ફોટો (Image) અપલોડ કરો!');
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
        machineNumber: '1',
        designNumber: '',
        designStitch: '',
        frame: '1',
        machineStitch: '',
        workerCount: '1',
        isExtraWork: false,
        extraPay: '',
        proofImage: ''
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
      <div className="section-title">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <PlusCircle size={22} color="var(--primary)" />
          <span>New Daily Work & Stitch Entry</span>
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

      <form id="work-entry-form" onSubmit={handleSubmit}>
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

        <div className="form-row" style={{ marginBottom: '1rem' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label"><Cpu size={15} /> Machine Number</label>
            <select
              name="machineNumber"
              className="form-control touch-input"
              value={form.machineNumber || '1'}
              onChange={handleChange}
            >
              <option value="1"> 1</option>
              <option value="2"> 2</option>
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
              placeholder="1"
            />
          </div>
        </div>

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

        {/* Bonus Preview Card */}
        {designStitchNum > 0 && (
          <div className="hours-preview bonus-preview-card" style={{ flexDirection: 'column', gap: '0.4rem', margin: '1.1rem 0', padding: '0.85rem 1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Calculator size={18} />
                <span>Calculated Bonus Pay:</span>
              </div>
              <span style={{ fontSize: '1.35rem', fontWeight: 800 }}>
                ₹{totalOutput}
              </span>
            </div>
            {designStitchNum < 5000 && (
              <small style={{ color: '#ef4444', fontSize: '0.82rem', marginTop: '0.2rem' }}>
                ⚠️ 5000 થી ઓછી ડિઝાઇન સ્ટીચ પર બોનસ મળવાપાત્ર નથી (નિયમ મુજબ)
              </small>
            )}
          </div>
        )}
        {/* Verification Proof Image Upload */}
        <div className="form-group" style={{ marginBottom: '1.25rem', background: '#f8fafc', padding: '0.85rem', borderRadius: '10px', border: '1.5px dashed #cbd5e1' }}>
          <label className="form-label" style={{ fontWeight: 800, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.88rem' }}>
            <Camera size={18} color="var(--primary)" /> 📸 ડિઝાઇન સ્ટીચ અને ફ્રેમ પુરાવો (Proof Photo) <span style={{ color: '#ef4444' }}>*</span>
          </label>

          <input
            id="proof-image-input"
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleImageUpload}
            className="form-control touch-input"
            style={{ padding: '0.4rem 0.6rem', fontSize: '0.85rem', background: '#ffffff' }}
          />

          {form.proofImage ? (
            <div style={{ marginTop: '0.65rem', textAlign: 'center', background: '#ffffff', padding: '0.5rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
              <img
                src={form.proofImage}
                alt="Proof Preview"
                style={{ maxHeight: '150px', maxWidth: '100%', borderRadius: '6px', objectFit: 'contain', border: '1px solid #e2e8f0' }}
              />
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', marginTop: '0.4rem' }}>
                <span style={{ fontSize: '0.78rem', color: '#16a34a', fontWeight: 700 }}>✅ ફોટો સબમિટ કરવા તૈયાર છે</span>
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  onClick={() => setForm(prev => ({ ...prev, proofImage: '' }))}
                  style={{ fontSize: '0.72rem', padding: '0.15rem 0.5rem' }}
                >
                  🗑️ કાઢી નાખો
                </button>
              </div>
            </div>
          ) : (
            <small style={{ color: '#64748b', fontSize: '0.78rem', marginTop: '0.35rem', display: 'block' }}>
              ⚠️ મશીન સ્ટીચ અને ફ્રેમ ગણતરી નો ફોટો પાડીને અપલોડ કરવો ફરજિયાત છે.
            </small>
          )}
        </div>

        <button id="submit-work-btn" type="submit" className="btn btn-primary btn-block touch-btn" disabled={loading}>
          {loading ? (
            <><span className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }} /> Submitting...</>
          ) : (
            <><PlusCircle size={18} /> Submit Work Record</>
          )}
        </button>
      </form>
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
