import { useState, useEffect } from 'react';
import axios from 'axios';
import { Layers, Package, Megaphone, Plus, Trash2, Download, AlertTriangle, CheckCircle2, RefreshCw, Scissors, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import html2pdf from 'html2pdf.js';
import { useAuth } from '../context/AuthContext';
import { API } from '../config/api';

const InventoryManager = () => {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState('designs'); // 'designs' | 'stock' | 'notices'
  const [designs, setDesigns] = useState([]);
  const [stockItems, setStockItems] = useState([]);
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Design Modal Form
  const [showDesignModal, setShowDesignModal] = useState(false);
  const [designForm, setDesignForm] = useState({
    designNumber: '',
    category: 'Saree Border',
    totalStitches: 40000,
    ratePerThousand: 0.35,
    threadColors: 'Golden Jari, Resham Red',
    description: ''
  });

  // Stock update form
  const [editingStockId, setEditingStockId] = useState(null);
  const [stockForm, setStockForm] = useState({ materialName: '', category: 'Thread Cones', quantity: 10, unit: 'Cones', minimumThreshold: 5 });

  // New Notice form
  const [showNoticeModal, setShowNoticeModal] = useState(false);
  const [noticeForm, setNoticeForm] = useState({ title: '', message: '', priority: 'normal' });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resD, resS, resN] = await Promise.all([
        axios.get(`${API}/inventory/designs`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/inventory/stock`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/inventory/notices`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setDesigns(resD.data || []);
      setStockItems(resS.data || []);
      setNotices(resN.data || []);
    } catch {
      toast.error('Failed to load inventory data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Save / Add Design
  const handleSaveDesign = async (e) => {
    e.preventDefault();
    if (!designForm.designNumber) {
      toast.error('Please enter a Design Number');
      return;
    }
    try {
      const payload = {
        ...designForm,
        threadColors: typeof designForm.threadColors === 'string' ? designForm.threadColors.split(',').map(s => s.trim()) : designForm.threadColors
      };
      await axios.post(`${API}/inventory/designs/save`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(`Design ${designForm.designNumber} saved successfully!`);
      setShowDesignModal(false);
      setDesignForm({ designNumber: '', category: 'Saree Border', totalStitches: 40000, ratePerThousand: 0.35, threadColors: 'Golden Jari, Resham Red', description: '' });
      fetchData();
    } catch {
      toast.error('Failed to save design');
    }
  };

  const handleDeleteDesign = async (id) => {
    try {
      await axios.delete(`${API}/inventory/designs/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDesigns(prev => prev.filter(d => d._id !== id));
      toast.success('Design deleted');
    } catch {
      toast.error('Failed to delete design');
    }
  };

  // Stock quantity quick increment / decrement
  const handleUpdateStockQty = async (item, delta) => {
    try {
      const newQty = Math.max(0, item.quantity + delta);
      const res = await axios.post(`${API}/inventory/stock/update`, {
        id: item._id,
        materialName: item.materialName,
        category: item.category,
        quantity: newQty,
        unit: item.unit,
        minimumThreshold: item.minimumThreshold
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStockItems(prev => prev.map(s => s._id === item._id ? res.data : s));
      toast.success(`Updated ${item.materialName} stock to ${newQty} ${item.unit}`);
    } catch {
      toast.error('Failed to update stock');
    }
  };

  // Create Notice
  const handleCreateNotice = async (e) => {
    e.preventDefault();
    if (!noticeForm.title || !noticeForm.message) {
      toast.error('Please fill title and message');
      return;
    }
    try {
      await axios.post(`${API}/inventory/notices/create`, noticeForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Factory Notice published successfully!');
      setShowNoticeModal(false);
      setNoticeForm({ title: '', message: '', priority: 'normal' });
      fetchData();
    } catch {
      toast.error('Failed to publish notice');
    }
  };

  const handleDeleteNotice = async (id) => {
    try {
      await axios.delete(`${API}/inventory/notices/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotices(prev => prev.filter(n => n._id !== id));
      toast.success('Notice removed');
    } catch {
      toast.error('Failed to remove notice');
    }
  };

  // Export PDF
  const handleExportPDF = async () => {
    const element = document.querySelector('.inventory-pdf-export-area');
    if (!element) return;

    const toastId = toast.loading('Generating Inventory PDF Report...');
    try {
      const filename = `Bansi_Fashion_Inventory_${new Date().toISOString().split('T')[0]}.pdf`;
      const opt = {
        margin:       [0.25, 0.25, 0.25, 0.25],
        filename:     filename,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true, logging: false, backgroundColor: '#ffffff' },
        jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' }
      };
      await html2pdf().set(opt).from(element).save();
      toast.success('Inventory PDF downloaded successfully!', { id: toastId });
    } catch (err) {
      console.error('PDF error:', err);
      window.print();
      toast.dismiss(toastId);
    }
  };

  return (
    <div className="inventory-manager-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* MODULE NAVIGATION TABS */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div className="tabs" style={{ margin: 0 }}>
          <button
            className={`tab ${activeTab === 'designs' ? 'active' : ''}`}
            onClick={() => setActiveTab('designs')}
          >
            <Layers size={16} /> Design Catalog ({designs.length})
          </button>
          <button
            className={`tab ${activeTab === 'stock' ? 'active' : ''}`}
            onClick={() => setActiveTab('stock')}
          >
            <Package size={16} /> Thread & Raw Materials ({stockItems.length})
          </button>
          <button
            className={`tab ${activeTab === 'notices' ? 'active' : ''}`}
            onClick={() => setActiveTab('notices')}
          >
            <Megaphone size={16} /> Factory Notice Board ({notices.length})
          </button>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {activeTab === 'designs' && (
            <button className="btn btn-primary btn-sm" onClick={() => setShowDesignModal(true)}>
              <Plus size={15} /> Add New Design
            </button>
          )}
          {activeTab === 'notices' && (
            <button className="btn btn-primary btn-sm" onClick={() => setShowNoticeModal(true)}>
              <Plus size={15} /> Post Factory Notice
            </button>
          )}
          <button className="btn btn-accent btn-sm" onClick={handleExportPDF} title="Download Inventory PDF">
            <Download size={15} /> Export PDF
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading"><div className="spinner" /></div>
      ) : (
        <div className="inventory-pdf-export-area" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', background: '#ffffff', padding: '1rem', borderRadius: 'var(--radius-lg)' }}>
          {/* TAB 1: DESIGN CATALOG */}
          {activeTab === 'designs' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>🧵 Embroidery Designs Catalog</h2>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>Factory embroidery patterns, stitch counts, and rates per 1,000 stitches</p>
                </div>
                <span className="badge badge-admin">{designs.length} Embroidery Designs Active</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
                {designs.map(d => {
                  const estValue = (d.totalStitches / 1000) * d.ratePerThousand;
                  return (
                    <div key={d._id} className="worker-group-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div className="entry-avatar" style={{ background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)', width: '38px', height: '38px', fontSize: '0.85rem' }}>
                              <Sparkles size={18} />
                            </div>
                            <div>
                              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>{d.designNumber}</h3>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Category: {d.category}</span>
                            </div>
                          </div>
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => handleDeleteDesign(d._id)}
                            style={{ color: 'var(--danger)', borderColor: '#fecaca', padding: '4px 8px' }}
                            title="Delete Design"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>

                        <div className="worker-summary-strip" style={{ gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.85rem' }}>
                          <div className="summary-item">
                            <span className="summary-label">Total Stitches</span>
                            <span className="summary-value" style={{ color: 'var(--primary)' }}>{Number(d.totalStitches).toLocaleString()}</span>
                          </div>
                          <div className="summary-item">
                            <span className="summary-label">Rate / 1K Stitches</span>
                            <span className="summary-value" style={{ color: 'var(--success)' }}>₹{d.ratePerThousand}</span>
                          </div>
                          <div className="summary-item" style={{ gridColumn: '1 / -1' }}>
                            <span className="summary-label">Est. Piece Production Rate</span>
                            <span className="summary-value" style={{ fontSize: '1rem', color: '#8b5cf6' }}>₹{estValue.toFixed(2)} / Piece</span>
                          </div>
                        </div>

                        {d.threadColors && d.threadColors.length > 0 && (
                          <div style={{ marginBottom: '0.5rem' }}>
                            <span className="summary-label" style={{ display: 'block', marginBottom: '4px' }}>🧵 Required Thread Colors:</span>
                            <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                              {d.threadColors.map((color, idx) => (
                                <span key={idx} className="meta-chip meta-chip-highlight" style={{ fontSize: '0.75rem' }}>
                                  {color}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {d.description && (
                          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.5rem 0 0' }}>
                            {d.description}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: THREAD & RAW MATERIAL STOCK */}
          {activeTab === 'stock' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>📦 Raw Material & Thread Stock Monitor</h2>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>Real-time inventory tracking for Jari cones, Resham threads, needles, & machine bobbins</p>
                </div>
                <span className="badge badge-worker">{stockItems.length} Stock Items Tracked</span>
              </div>

              <div className="table-responsive">
                <table className="report-data-table">
                  <thead>
                    <tr>
                      <th>Material Name</th>
                      <th>Category</th>
                      <th>Current Quantity</th>
                      <th>Status Alert</th>
                      <th>Stock Quick Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stockItems.map(item => (
                      <tr key={item._id}>
                        <td style={{ fontWeight: 700, textAlign: 'left' }}>
                          <Scissors size={14} style={{ verticalAlign: 'middle', marginRight: '6px', color: 'var(--primary)' }} />
                          {item.materialName}
                        </td>
                        <td><span className="worker-id-tag">{item.category}</span></td>
                        <td style={{ fontSize: '1.1rem', fontWeight: 800 }}>
                          {item.quantity} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{item.unit}</span>
                        </td>
                        <td>
                          {item.status === 'in_stock' ? (
                            <span className="badge badge-approved">
                              <CheckCircle2 size={13} /> In Stock
                            </span>
                          ) : item.status === 'low_stock' ? (
                            <span className="badge badge-pending">
                              <AlertTriangle size={13} /> Low Stock (&le; {item.minimumThreshold})
                            </span>
                          ) : (
                            <span className="badge badge-rejected">
                              🛑 Out of Stock
                            </span>
                          )}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'center' }}>
                            <button
                              className="btn btn-ghost btn-sm"
                              onClick={() => handleUpdateStockQty(item, 5)}
                              style={{ padding: '2px 8px', fontSize: '0.8rem', color: 'var(--success)' }}
                              title="Add 5 units"
                            >
                              +5 {item.unit}
                            </button>
                            <button
                              className="btn btn-ghost btn-sm"
                              onClick={() => handleUpdateStockQty(item, -1)}
                              style={{ padding: '2px 8px', fontSize: '0.8rem', color: 'var(--danger)' }}
                              title="Deduct 1 unit"
                            >
                              -1 {item.unit}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: FACTORY NOTICES */}
          {activeTab === 'notices' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>📢 Factory Announcements & Worker Notice Board</h2>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>Live notices visible to all embroidery workers on their dashboard</p>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {notices.map(n => (
                  <div
                    key={n._id}
                    className="worker-group-card"
                    style={{
                      borderLeft: `4px solid ${n.priority === 'urgent' ? 'var(--danger)' : n.priority === 'important' ? 'var(--warning)' : 'var(--primary)'}`
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Megaphone size={18} color={n.priority === 'urgent' ? 'var(--danger)' : 'var(--primary)'} />
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>{n.title}</h3>
                        <span className={`badge ${n.priority === 'urgent' ? 'badge-rejected' : n.priority === 'important' ? 'badge-pending' : 'badge-worker'}`}>
                          {n.priority.toUpperCase()}
                        </span>
                      </div>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => handleDeleteNotice(n._id)}
                        style={{ color: 'var(--danger)', borderColor: '#fecaca', padding: '4px 8px' }}
                      >
                        <Trash2 size={14} /> Remove
                      </button>
                    </div>
                    <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', margin: '0.5rem 0' }}>{n.message}</p>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Posted by {n.postedBy || 'Admin'} &bull; {new Date(n.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: ADD DESIGN */}
      {showDesignModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">🧵 Add New Embroidery Design</h2>
              <button className="modal-close" onClick={() => setShowDesignModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleSaveDesign}>
              <div className="form-group">
                <label className="form-label">Design Number / Code :</label>
                <input
                  type="text"
                  className="form-control"
                  value={designForm.designNumber}
                  onChange={(e) => setDesignForm({ ...designForm, designNumber: e.target.value })}
                  placeholder="e.g. D-901"
                  required
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Category :</label>
                  <select
                    className="form-control"
                    value={designForm.category}
                    onChange={(e) => setDesignForm({ ...designForm, category: e.target.value })}
                  >
                    <option value="Saree Border">Saree Border</option>
                    <option value="Chaniya Choli">Chaniya Choli / Lehenga</option>
                    <option value="Suit Neckline">Suit / Kurti Neckline</option>
                    <option value="Blouse Pattern">Blouse Embroidery</option>
                    <option value="All-Over Dress">All-Over Fabric</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Total Stitch Count :</label>
                  <input
                    type="number"
                    className="form-control"
                    value={designForm.totalStitches}
                    onChange={(e) => setDesignForm({ ...designForm, totalStitches: Number(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Rate / 1000 Stitches (₹) :</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control"
                    value={designForm.ratePerThousand}
                    onChange={(e) => setDesignForm({ ...designForm, ratePerThousand: Number(e.target.value) || 0 })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Required Thread Colors :</label>
                  <input
                    type="text"
                    className="form-control"
                    value={designForm.threadColors}
                    onChange={(e) => setDesignForm({ ...designForm, threadColors: e.target.value })}
                    placeholder="Golden Jari, Royal Blue"
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Design Remarks / Specs :</label>
                <textarea
                  className="form-control"
                  rows="2"
                  value={designForm.description}
                  onChange={(e) => setDesignForm({ ...designForm, description: e.target.value })}
                  placeholder="Special instructions for machine operator..."
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowDesignModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Design</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: POST NOTICE */}
      {showNoticeModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">📢 Post Factory Notice</h2>
              <button className="modal-close" onClick={() => setShowNoticeModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleCreateNotice}>
              <div className="form-group">
                <label className="form-label">Notice Title :</label>
                <input
                  type="text"
                  className="form-control"
                  value={noticeForm.title}
                  onChange={(e) => setNoticeForm({ ...noticeForm, title: e.target.value })}
                  placeholder="e.g. Factory Holiday / Bonus Announcement"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Priority Level :</label>
                <select
                  className="form-control"
                  value={noticeForm.priority}
                  onChange={(e) => setNoticeForm({ ...noticeForm, priority: e.target.value })}
                >
                  <option value="normal">Normal Information</option>
                  <option value="important">Important Notice</option>
                  <option value="urgent">🔴 Urgent Alert</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Message / Details :</label>
                <textarea
                  className="form-control"
                  rows="3"
                  value={noticeForm.message}
                  onChange={(e) => setNoticeForm({ ...noticeForm, message: e.target.value })}
                  placeholder="Enter detailed notice message for all factory workers..."
                  required
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowNoticeModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Publish Notice</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryManager;
