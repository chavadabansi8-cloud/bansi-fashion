import { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { PlusCircle, Calendar, Cpu, Tag, Hash, Layers, Users, Zap, DollarSign, Calculator, X } from 'lucide-react';
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
    extraPay: ''
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
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
        extraPay: ''
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
