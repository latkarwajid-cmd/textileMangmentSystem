import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  ArrowDownLeft, 
  ShoppingBag,
  Building2,
  Info,
  Calendar,
  Layers,
  Ticket,
  FileText,
  Eye,
  DollarSign
} from 'lucide-react';
import { Modal } from '../components/Modal';

// Normalize date from backend: handles both "2024-09-18" string and [2024,9,18] array
const formatDate = (date) => {
 if (!date || date === '-') return '';
  if (Array.isArray(date)) {
    const [y, m, d] = date;
    return `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
  }
  return String(date).substring(0, 10);
};

export const YarnInwardView = () => {
  const { parties, fabricOrders, tickits, yarnCounts, addToast } = useApp();
  const [inwardList, setInwardList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [orderFilter, setOrderFilter] = useState('ALL');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    orderId: '',
    inwardDate: new Date().toISOString().split('T')[0],
    countId: '',
    tickitId: '',
    supplierId: '',
    bags: '',
    weightKg: '',
    rate: '',
    gstPercent: '5.0',
    calculatedAmount: '',
    actualAmount: '',
    billNo: '',
    billAmount: '',
    days: '',
    receivable: '',
    tcs: '',
    addAmount: '',
    gst: '',
    tds: '',
    interest: '',
    paymentStatus: 'UNPAID',
    paidDate: '',
    paidAmount: '0',
    receivedPayment: '0',
    remark: '',
    remark2: '',
  });

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const [viewDetailItem, setViewDetailItem] = useState(null);

  const fetchInwardList = async () => {
    setLoading(true);
    try {
      const data = await api.yarnInward.getAll();
      setInwardList(Array.isArray(data) ? data : []);
    } catch (err) {
      addToast(err.message || 'Failed to fetch yarn inward entries', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInwardList();
  }, []);

  // Real-time calculation effect
  useEffect(() => {
    const weight = parseFloat(formData.weightKg) || 0;
    const rate = parseFloat(formData.rate) || 0;
    const gst = parseFloat(formData.gstPercent) || 0;

    if (weight > 0 && rate > 0) {
      const base = weight * rate;
      const total = gst > 0 ? base * (1 + gst / 100) : base;
      const rounded = total.toFixed(2);
      setFormData(prev => ({
        ...prev,
        calculatedAmount: rounded,
        actualAmount: prev.actualAmount === '' || prev.actualAmount === prev.calculatedAmount ? rounded : prev.actualAmount,
        billAmount: prev.billAmount === '' || prev.billAmount === prev.calculatedAmount ? rounded : prev.billAmount,
      }));
    }
  }, [formData.weightKg, formData.rate, formData.gstPercent]);

  const selectedOrder = fabricOrders.find(o => String(o.orderId) === String(formData.orderId));

  const openCreateModal = () => {
    setEditingItem(null);
    setFormData({
      orderId: '',
      inwardDate: new Date().toISOString().split('T')[0],
      countId: '',
      tickitId: '',
      supplierId: '',
      bags: '',
      weightKg: '',
      rate: '',
      gstPercent: '5.0',
      calculatedAmount: '',
      actualAmount: '',
      billNo: '',
      billAmount: '',
      days: '',
      receivable: '',
      tcs: '',
      addAmount: '',
      gst: '',
      tds: '',
      interest: '',
      paymentStatus: 'UNPAID',
      paidDate: '',
      paidAmount: '0',
      receivedPayment: '0',
      remark: '',
      remark2: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      orderId: item.order?.orderId || '',
      inwardDate: formatDate(item.inwardDate),
      countId: item.count?.countId || '',
      tickitId: item.tickit?.tickitId || '',
      supplierId: item.supplier?.partyId || '',
      bags: item.bags || '',
      weightKg: item.weightKg || '',
      rate: item.rate || '',
      gstPercent: item.gstPercent || '5.0',
      calculatedAmount: item.calculatedAmount || '',
      actualAmount: item.actualAmount || '',
      billNo: item.billNo || '',
      billAmount: item.billAmount || '',
      days: item.days ?? '',
      receivable: item.receivable ?? '',
      tcs: item.tcs ?? '',
      addAmount: item.addAmount ?? '',
      gst: item.gst ?? '',
      tds: item.tds ?? '',
      interest: item.interest ?? '',
      paymentStatus: item.paymentStatus || 'UNPAID',
      paidDate: formatDate(item.paidDate),
      paidAmount: item.paidAmount || '0',
      receivedPayment: item.receivedPayment || '0',
      remark: item.remark || '',
      remark2: item.remark2 || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        orderId: formData.orderId ? Number(formData.orderId) : null,
        inwardDate: formData.inwardDate || null,
        countId: formData.countId ? Number(formData.countId) : null,
        tickitId: formData.tickitId ? Number(formData.tickitId) : null,
        supplierId: formData.supplierId ? Number(formData.supplierId) : null,
        bags: formData.bags ? Number(formData.bags) : null,
        weightKg: formData.weightKg ? Number(formData.weightKg) : null,
        rate: formData.rate ? Number(formData.rate) : null,
        gstPercent: formData.gstPercent ? Number(formData.gstPercent) : null,
        calculatedAmount: formData.calculatedAmount ? Number(formData.calculatedAmount) : null,
        actualAmount: formData.actualAmount ? Number(formData.actualAmount) : null,
        billNo: formData.billNo,
        billAmount: formData.billAmount ? Number(formData.billAmount) : null,

        days: formData.days ? Number(formData.days) : null,
        receivable: formData.receivable ? Number(formData.receivable) : null,
        tcs: formData.tcs ? Number(formData.tcs) : null,
        addAmount: formData.addAmount ? Number(formData.addAmount) : null,
        gst: formData.gst ? Number(formData.gst) : null,
        tds: formData.tds ? Number(formData.tds) : null,
        interest: formData.interest ? Number(formData.interest) : null,

        paymentStatus: formData.paymentStatus,
        paidDate: formData.paidDate || null,
        paidAmount: formData.paidAmount ? Number(formData.paidAmount) : 0,
        receivedPayment: formData.receivedPayment ? Number(formData.receivedPayment) : 0,
        remark: formData.remark,
        remark2: formData.remark2,
      };

      if (editingItem) {
        await api.yarnInward.update(editingItem.yarnInwardId, payload);
        addToast('Yarn Inward updated successfully', 'success');
      } else {
        await api.yarnInward.create(payload);
        addToast('Yarn Inward created successfully', 'success');
      }
      setIsModalOpen(false);
      fetchInwardList();
    } catch (err) {
      addToast(err.message || 'Error saving inward record', 'error');
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    try {
      await api.yarnInward.delete(itemToDelete.yarnInwardId);
      addToast('Yarn Inward entry deleted successfully', 'success');
      setIsDeleteModalOpen(false);
      setItemToDelete(null);
      fetchInwardList();
    } catch (err) {
      addToast(err.message || 'Failed to delete record', 'error');
    }
  };

  const filteredList = inwardList.filter(item => {
    const matchesSearch = 
      item.billNo?.toLowerCase().includes(search.toLowerCase()) ||
      item.order?.orderNo?.toLowerCase().includes(search.toLowerCase()) ||
      item.supplier?.partyName?.toLowerCase().includes(search.toLowerCase()) ||
      item.count?.countName?.toLowerCase().includes(search.toLowerCase()) ||
      item.tickit?.tickitName?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || item.paymentStatus?.toUpperCase() === statusFilter;
    const matchesOrder = orderFilter === 'ALL' || String(item.order?.orderId) === String(orderFilter);
    return matchesSearch && matchesStatus && matchesOrder;
  });

  return (
    <div className="content-area">
      <div className="section-card">
        <div className="section-card-header">
          <div className="section-card-title">
            <ArrowDownLeft size={20} color="var(--primary-blue)" />
            <h3>Yarn Inward Register</h3>
            <span className="badge badge-info">{filteredList.length} Lots</span>
          </div>

          <div className="section-card-actions">
            <div className="search-box">
              <Search size={16} />
              <input
                type="text"
                placeholder="Search by Order No, Bill No, Supplier..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <select
              className="form-control"
              style={{ width: '170px' }}
              value={orderFilter}
              onChange={(e) => setOrderFilter(e.target.value)}
            >
              <option value="ALL">All Fabric Orders</option>
              {fabricOrders.map(o => (
                <option key={o.orderId} value={o.orderId}>
                  {o.orderNo} ({o.party?.partyName || 'Order'})
                </option>
              ))}
            </select>

            <select
              className="form-control"
              style={{ width: '130px' }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All Statuses</option>
              <option value="UNPAID">Unpaid</option>
              <option value="PAID">Paid</option>
              <option value="PARTIAL">Partial</option>
            </select>

            <button className="btn btn-primary" onClick={openCreateModal}>
              <Plus size={18} />
              <span>New Yarn Inward</span>
            </button>
          </div>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Order No</th>
                <th>Inward Date</th>
                <th>Supplier Party</th>
                <th>Yarn Count</th>
                <th>Tickit</th>
                <th>Bags</th>
                <th>Weight (Kg)</th>
                <th>Rate (₹)</th>
                <th>Amount (₹)</th>
                <th>Bill No</th>
                <th>Days</th>
                <th>Receivable (₹)</th>
                <th>TCS (₹)</th>
                <th>Add (₹)</th>
                <th>GST (₹)</th>
                <th>TDS (₹)</th>
                <th>Interest (₹)</th>
                <th>Payment</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="19" style={{ textAlign: 'center', padding: '32px' }}>
                    <div className="spinner" style={{ margin: '0 auto' }}></div>
                  </td>
                </tr>
              ) : filteredList.length === 0 ? (
                <tr>
                  <td colSpan="19" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                    No inward records found. Click 'New Yarn Inward' to record a shipment.
                  </td>
                </tr>
              ) : (
                filteredList.map((item) => (
                  <tr key={item.yarnInwardId}>
                    <td>
                      {item.order?.orderNo ? (
                        <span className="badge badge-info" style={{ fontWeight: 700 }}>
                          {item.order.orderNo}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-light)', fontSize: '0.8rem' }}>Direct / None</span>
                      )}
                    </td>
                    <td>{formatDate(item.inwardDate)}</td>
                    <td style={{ fontWeight: 600 }}>{item.supplier?.partyName || '-'}</td>
                    <td>{item.count?.countName || '-'}</td>
                    <td>{item.tickit?.tickitName || '-'}</td>
                    <td>{item.bags || '-'}</td>
                    <td style={{ fontWeight: 600 }}>{item.weightKg ? `${item.weightKg} kg` : '-'}</td>
                    <td>{item.rate ? `₹${item.rate}` : '-'}</td>
                    <td style={{ color: 'var(--primary-blue-dark)', fontWeight: 700 }}>
                      ₹{item.actualAmount || item.calculatedAmount || '-'}
                    </td>
                    <td>{item.billNo || '-'}</td>
                    <td>{item.days ?? '-'}</td>
                    <td>{item.receivable != null ? `₹${item.receivable}` : '-'}</td>
                    <td>{item.tcs != null ? `₹${item.tcs}` : '-'}</td>
                    <td>{item.addAmount != null ? `₹${item.addAmount}` : '-'}</td>
                    <td>{item.gst != null ? `₹${item.gst}` : '-'}</td>
                    <td>{item.tds != null ? `₹${item.tds}` : '-'}</td>
                    <td>{item.interest != null ? `₹${item.interest}` : '-'}</td>
                    <td>
                      <span className={`badge ${item.paymentStatus === 'PAID' ? 'badge-success' : (item.paymentStatus === 'PARTIAL' ? 'badge-info' : 'badge-warning')}`}>
                        {item.paymentStatus || 'UNPAID'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                        <button className="btn-icon" onClick={() => setViewDetailItem(item)} title="View All Details">
                          <Eye size={15} />
                        </button>
                        <button className="btn-icon" onClick={() => openEditModal(item)} title="Edit Entry">
                          <Edit2 size={15} />
                        </button>
                        <button
                          className="btn-icon"
                          style={{ color: 'var(--color-danger)' }}
                          onClick={() => { setItemToDelete(item); setIsDeleteModalOpen(true); }}
                          title="Delete Entry"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? `Edit Yarn Inward Lot #${editingItem.yarnInwardId}` : 'Record New Yarn Inward'}
        size="lg"
      >
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            {/* Order Selection at Top */}
            <div className="form-group col-span-2">
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ShoppingBag size={16} color="var(--primary-blue)" />
                <strong>Reference Fabric Order (Select Order No)</strong>
              </label>
              <select
                className="form-control"
                value={formData.orderId}
                onChange={(e) => setFormData({ ...formData, orderId: e.target.value })}
                style={{ borderColor: 'var(--primary-blue)' }}
              >
                <option value="">-- No Order / General Inward Lot --</option>
                {fabricOrders.map(o => (
                  <option key={o.orderId} value={o.orderId}>
                    {o.orderNo} | Customer: {o.party?.partyName} | Quality: {o.quality || 'N/A'} | Ordered: {o.orderedMeters}m | Status: {o.status}
                  </option>
                ))}
              </select>
            </div>

            {/* Instant Order Summary Info Box */}
            {selectedOrder && (
              <div className="form-group col-span-2" style={{
                backgroundColor: 'var(--primary-blue-light)',
                border: '1px solid #bae6fd',
                borderRadius: '6px',
                padding: '12px 16px',
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '10px'
              }}>
                <div>
                  <div style={{ fontSize: '0.7rem', color: '#0369a1', fontWeight: 600, textTransform: 'uppercase' }}>Customer Party</div>
                  <div style={{ fontWeight: 700, color: '#0f172a' }}>{selectedOrder.party?.partyName || '-'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', color: '#0369a1', fontWeight: 600, textTransform: 'uppercase' }}>Fabric Quality</div>
                  <div style={{ fontWeight: 600, color: '#0f172a' }}>{selectedOrder.quality || '-'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', color: '#0369a1', fontWeight: 600, textTransform: 'uppercase' }}>Ordered Meters</div>
                  <div style={{ fontWeight: 600, color: '#0f172a' }}>{selectedOrder.orderedMeters} m</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', color: '#0369a1', fontWeight: 600, textTransform: 'uppercase' }}>Order Status</div>
                  <div style={{ fontWeight: 700, color: '#0369a1' }}>{selectedOrder.status}</div>
                </div>
              </div>
            )}

            <div className="form-group">
              <label>Inward Date *</label>
              <input
                type="date"
                className="form-control"
                value={formData.inwardDate}
                onChange={(e) => setFormData({ ...formData, inwardDate: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Supplier Party *</label>
              <select
                className="form-control"
                value={formData.supplierId}
                onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
                required
              >
                <option value="">-- Select Yarn Supplier --</option>
                {parties.map(p => (
                  <option key={p.partyId} value={p.partyId}>
                    {p.partyName} ({p.partyType || 'Supplier'})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Yarn Count</label>
              <select
                className="form-control"
                value={formData.countId}
                onChange={(e) => setFormData({ ...formData, countId: e.target.value })}
              >
                <option value="">-- Select Count --</option>
                {yarnCounts.map(c => (
                  <option key={c.countId} value={c.countId}>
                    {c.countName} ({c.countType || 'Standard'})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Tickit</label>
              <select
                className="form-control"
                value={formData.tickitId}
                onChange={(e) => setFormData({ ...formData, tickitId: e.target.value })}
              >
                <option value="">-- Select Tickit --</option>
                {tickits.map(t => (
                  <option key={t.tickitId} value={t.tickitId}>
                    {t.tickitName} ({t.party?.partyName || 'Party'})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Bags Count</label>
              <input
                type="number"
                step="0.001"
                className="form-control"
                value={formData.bags}
                onChange={(e) => setFormData({ ...formData, bags: e.target.value })}
                placeholder="e.g. 10"
              />
            </div>

            <div className="form-group">
              <label>Net Weight (Kg) *</label>
              <input
                type="number"
                step="0.001"
                className="form-control"
                value={formData.weightKg}
                onChange={(e) => setFormData({ ...formData, weightKg: e.target.value })}
                placeholder="e.g. 500.000"
                required
              />
            </div>

            <div className="form-group">
              <label>Rate per Kg (₹) *</label>
              <input
                type="number"
                step="0.01"
                className="form-control"
                value={formData.rate}
                onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                placeholder="e.g. 265.00"
                required
              />
            </div>

            <div className="form-group">
              <label>GST %</label>
              <input
                type="number"
                step="0.01"
                className="form-control"
                value={formData.gstPercent}
                onChange={(e) => setFormData({ ...formData, gstPercent: e.target.value })}
                placeholder="5.0"
              />
            </div>

            <div className="form-group">
              <label>Calculated Amount (₹) (Auto)</label>
              <input
                type="number"
                step="0.01"
                className="form-control"
                value={formData.calculatedAmount}
                onChange={(e) => setFormData({ ...formData, calculatedAmount: e.target.value })}
                placeholder="Auto computed"
                style={{ color: '#0369a1', fontWeight: 700, backgroundColor: '#f0f9ff' }}
              />
            </div>

            <div className="form-group">
              <label>Actual Invoiced Amount (₹)</label>
              <input
                type="number"
                step="0.01"
                className="form-control"
                value={formData.actualAmount}
                onChange={(e) => setFormData({ ...formData, actualAmount: e.target.value })}
                placeholder="Amount on bill"
              />
            </div>

            <div className="form-group">
              <label>Supplier Bill / Invoice No</label>
              <input
                type="text"
                className="form-control"
                value={formData.billNo}
                onChange={(e) => setFormData({ ...formData, billNo: e.target.value })}
                placeholder="e.g. INV-9021"
              />
            </div>

            <div className="form-group">
              <label>Bill Total Amount (₹)</label>
              <input
                type="number"
                step="0.01"
                className="form-control"
                value={formData.billAmount}
                onChange={(e) => setFormData({ ...formData, billAmount: e.target.value })}
                placeholder="e.g. 139125.00"
              />
            </div>

            <div className="form-group">
              <label>Days</label>
              <input
                type="number"
                className="form-control"
                value={formData.days}
                onChange={(e) => setFormData({ ...formData, days: e.target.value })}
                placeholder="e.g. 30"
              />
            </div>

            <div className="form-group">
              <label>Receivable (₹)</label>
              <input
                type="number"
                step="0.01"
                className="form-control"
                value={formData.receivable}
                onChange={(e) => setFormData({ ...formData, receivable: e.target.value })}
                placeholder="0.00"
              />
            </div>

            <div className="form-group">
              <label>TCS (₹)</label>
              <input
                type="number"
                step="0.01"
                className="form-control"
                value={formData.tcs}
                onChange={(e) => setFormData({ ...formData, tcs: e.target.value })}
                placeholder="0.00"
              />
            </div>

            <div className="form-group">
              <label>Add Amount (₹)</label>
              <input
                type="number"
                step="0.01"
                className="form-control"
                value={formData.addAmount}
                onChange={(e) => setFormData({ ...formData, addAmount: e.target.value })}
                placeholder="0.00"
              />
            </div>

            <div className="form-group">
              <label>GST (₹)</label>
              <input
                type="number"
                step="0.01"
                className="form-control"
                value={formData.gst}
                onChange={(e) => setFormData({ ...formData, gst: e.target.value })}
                placeholder="0.00"
              />
            </div>

            <div className="form-group">
              <label>TDS (₹)</label>
              <input
                type="number"
                step="0.01"
                className="form-control"
                value={formData.tds}
                onChange={(e) => setFormData({ ...formData, tds: e.target.value })}
                placeholder="0.00"
              />
            </div>

            <div className="form-group">
              <label>Interest (₹)</label>
              <input
                type="number"
                step="0.01"
                className="form-control"
                value={formData.interest}
                onChange={(e) => setFormData({ ...formData, interest: e.target.value })}
                placeholder="0.00"
              />
            </div>

            <div className="form-group">
              <label>Payment Status</label>
              <select
                className="form-control"
                value={formData.paymentStatus}
                onChange={(e) => setFormData({ ...formData, paymentStatus: e.target.value })}
              >
                <option value="UNPAID">Unpaid</option>
                <option value="PAID">Paid</option>
                <option value="PARTIAL">Partial</option>
              </select>
            </div>

            <div className="form-group">
              <label>Paid Amount (₹)</label>
              <input
                type="number"
                step="0.01"
                className="form-control"
                value={formData.paidAmount}
                onChange={(e) => setFormData({ ...formData, paidAmount: e.target.value })}
                placeholder="0.00"
              />
            </div>

            <div className="form-group">
              <label>Payment Date</label>
              <input
                type="date"
                className="form-control"
                value={formData.paidDate}
                onChange={(e) => setFormData({ ...formData, paidDate: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Received Payment Amount (₹)</label>
              <input
                type="number"
                step="0.01"
                className="form-control"
                value={formData.receivedPayment}
                onChange={(e) => setFormData({ ...formData, receivedPayment: e.target.value })}
                placeholder="0.00"
              />
            </div>

            <div className="form-group">
              <label>Primary Remarks</label>
              <input
                type="text"
                className="form-control"
                value={formData.remark}
                onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
                placeholder="Vehicle no, lot number, batch..."
              />
            </div>

            <div className="form-group">
              <label>Secondary Remarks (Remark 2)</label>
              <input
                type="text"
                className="form-control"
                value={formData.remark2}
                onChange={(e) => setFormData({ ...formData, remark2: e.target.value })}
                placeholder="Additional notes, quality report..."
              />
            </div>
          </div>

          <div className="modal-footer" style={{ padding: '20px 0 0', marginTop: '20px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {editingItem ? 'Update Inward Lot' : 'Save Inward Record'}
            </button>
          </div>
        </form>
      </Modal>

      {/* View Full Details Modal */}
      <Modal
        isOpen={Boolean(viewDetailItem)}
        onClose={() => setViewDetailItem(null)}
        title={`Yarn Inward Lot Details #${viewDetailItem?.yarnInwardId}`}
        size="lg"
      >
        {viewDetailItem && (
          <div>
            <div style={{
              backgroundColor: '#f8fafc',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              padding: '16px',
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '14px',
              marginBottom: '16px'
            }}>
              <div>
                <strong style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>FABRIC ORDER NO</strong>
                <div style={{ fontWeight: 700, color: 'var(--primary-blue-dark)' }}>
                  {viewDetailItem.order?.orderNo || 'None / General Inward'}
                </div>
              </div>
              <div>
                <strong style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ORDER CUSTOMER</strong>
                <div style={{ fontWeight: 600 }}>{viewDetailItem.order?.party?.partyName || '-'}</div>
              </div>
              <div>
                <strong style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ORDER QUALITY</strong>
                <div>{viewDetailItem.order?.quality || '-'}</div>
              </div>
              <div>
                <strong style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>INWARD DATE</strong>
                <div>{formatDate(viewDetailItem.inwardDate)}</div>
              </div>
              <div>
                <strong style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>SUPPLIER PARTY</strong>
                <div style={{ fontWeight: 600 }}>{viewDetailItem.supplier?.partyName || '-'}</div>
              </div>
              <div>
                <strong style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>BILL NO</strong>
                <div>{viewDetailItem.billNo || '-'}</div>
              </div>
              <div>
                <strong style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>YARN COUNT</strong>
                <div>{viewDetailItem.count?.countName || '-'}</div>
              </div>
              <div>
                <strong style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>TICKIT</strong>
                <div>{viewDetailItem.tickit?.tickitName || '-'}</div>
              </div>
              <div>
                <strong style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>BAGS / WEIGHT</strong>
                <div>{viewDetailItem.bags || 0} Bags | {viewDetailItem.weightKg || 0} kg</div>
              </div>
              <div>
                <strong style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>RATE (₹) & GST %</strong>
                <div>₹{viewDetailItem.rate || 0} / kg ({viewDetailItem.gstPercent || 0}% GST)</div>
              </div>
              <div>
                <strong style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>CALCULATED AMOUNT</strong>
                <div style={{ color: 'var(--primary-blue-dark)', fontWeight: 700 }}>₹{viewDetailItem.calculatedAmount || '-'}</div>
              </div>
              <div>
                <strong style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ACTUAL BILL AMOUNT</strong>
                <div style={{ fontWeight: 700 }}>₹{viewDetailItem.actualAmount || viewDetailItem.billAmount || '-'}</div>
              </div>

              <div>
                <strong style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>DAYS</strong>
                <div>{viewDetailItem.days ?? '-'}</div>
              </div>

              <div>
                <strong style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>RECEIVABLE</strong>
                <div>₹{viewDetailItem.receivable ?? 0}</div>
              </div>

              <div>
                <strong style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>TCS</strong>
                <div>₹{viewDetailItem.tcs ?? 0}</div>
              </div>

              <div>
                <strong style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ADD AMOUNT</strong>
                <div>₹{viewDetailItem.addAmount ?? 0}</div>
              </div>

              <div>
                <strong style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>GST</strong>
                <div>₹{viewDetailItem.gst ?? 0}</div>
              </div>

              <div>
                <strong style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>TDS</strong>
                <div>₹{viewDetailItem.tds ?? 0}</div>
              </div>

              <div>
                <strong style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>INTEREST</strong>
                <div>₹{viewDetailItem.interest ?? 0}</div>
              </div>
              <div>
                <strong style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>PAYMENT STATUS</strong>
                <div>
                  <span className={`badge ${viewDetailItem.paymentStatus === 'PAID' ? 'badge-success' : 'badge-warning'}`}>
                    {viewDetailItem.paymentStatus || 'UNPAID'}
                  </span>
                </div>
              </div>
              <div>
                <strong style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>PAID AMOUNT / DATE</strong>
                <div>₹{viewDetailItem.paidAmount || 0} ({formatDate(viewDetailItem.paidDate) || 'N/A'})</div>
              </div>
              <div>
                <strong style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>RECEIVED PAYMENT</strong>
                <div>₹{viewDetailItem.receivedPayment || 0}</div>
              </div>
              <div style={{ gridColumn: 'span 3' }}>
                <strong style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>REMARKS:</strong>
                <div>{viewDetailItem.remark || 'None'}</div>
              </div>
              {viewDetailItem.remark2 && (
                <div style={{ gridColumn: 'span 3' }}>
                  <strong style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>REMARK 2:</strong>
                  <div>{viewDetailItem.remark2}</div>
                </div>
              )}
            </div>

            <div className="modal-footer" style={{ padding: '0', border: 'none', background: 'transparent' }}>
              <button className="btn btn-secondary" onClick={() => setViewDetailItem(null)}>
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Lot Deletion"
      >
        <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>
          Are you sure you want to delete Yarn Inward record <strong style={{ color: 'var(--text-main)' }}>#{itemToDelete?.yarnInwardId} ({itemToDelete?.billNo || 'No Bill No'})</strong>?
        </p>
        <div className="modal-footer" style={{ padding: '0', border: 'none', background: 'transparent' }}>
          <button className="btn btn-secondary" onClick={() => setIsDeleteModalOpen(false)}>
            Cancel
          </button>
          <button className="btn btn-danger" onClick={handleDelete}>
            Delete Record
          </button>
        </div>
      </Modal>
    </div>
  );
};
