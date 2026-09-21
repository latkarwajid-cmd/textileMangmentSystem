import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  ShoppingBag, 
  Building2, 
  CheckCircle2, 
  Clock,
  TrendingUp,
  PackageCheck,
  AlertCircle,
  FileText
} from 'lucide-react';
import { Modal } from '../components/Modal';

// Normalize date from backend: handles both "2024-09-18" string and [2024,9,18] array
const formatDate = (date) => {
  if (!date) return '-';
  if (Array.isArray(date)) {
    const [y, m, d] = date;
    return `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
  }
  return String(date).substring(0, 10);
};

export const FabricOrdersView = () => {
  const { parties, tickits, yarnCounts, addToast, refreshMasters } = useApp();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [formData, setFormData] = useState({
    orderNo: '',
    orderDate: new Date().toISOString().split('T')[0],
    partyId: '',
    // countId: '',
    // tickitId: '',
    supplierId: '',
    quality: '',
    rate: '',
    orderedMeters: '',
    dispatchedMeters: '0',
    status: 'OPEN',
    complete: false,
  });

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await api.fabricOrders.getAll();
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      addToast(err.message || 'Failed to fetch fabric orders', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const openCreateModal = () => {
    setEditingOrder(null);
    setFormData({
      orderNo: `FO-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`,
      orderDate: new Date().toISOString().split('T')[0],
      partyId: parties.length > 0 ? parties[0].partyId : '',
      // countId: '',
      // tickitId: '',
      supplierId: '',
      quality: '',
      rate: '',
      orderedMeters: '',
      dispatchedMeters: '0',
      status: 'OPEN',
      complete: false,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (order) => {
    setEditingOrder(order);
    setFormData({
      orderNo: order.orderNo || '',
      orderDate: formatDate(order.orderDate),
      partyId: order.party?.partyId || '',
      // countId: order.count?.countId || '',
      // tickitId: order.tickit?.tickitId || '',
      supplierId: order.supplier?.partyId || '',
      quality: order.quality || '',
      rate: order.rate || '',
      orderedMeters: order.orderedMeters || '',
      dispatchedMeters: order.dispatchedMeters || '0',
      status: order.status || 'OPEN',
      complete: order.complete || false,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        orderNo: formData.orderNo,
        orderDate: formData.orderDate,
        partyId: Number(formData.partyId),
        // countId: formData.countId ? Number(formData.countId) : null,
        // tickitId: formData.tickitId ? Number(formData.tickitId) : null,
        supplierId: formData.supplierId ? Number(formData.supplierId) : null,
        quality: formData.quality,
        rate: formData.rate ? Number(formData.rate) : null,
        orderedMeters: formData.orderedMeters ? Number(formData.orderedMeters) : null,
        dispatchedMeters: formData.dispatchedMeters ? Number(formData.dispatchedMeters) : 0,
        status: formData.status,
        complete: formData.complete,
      };

      if (editingOrder) {
        await api.fabricOrders.update(editingOrder.orderId, payload);
        addToast('Fabric order updated successfully', 'success');
      } else {
        await api.fabricOrders.create(payload);
        addToast('Fabric order created successfully', 'success');
      }
      setIsModalOpen(false);
      fetchOrders();
      refreshMasters();
    } catch (err) {
      addToast(err.message || 'Error saving fabric order', 'error');
    }
  };

  const handleDelete = async () => {
    if (!orderToDelete) return;
    try {
      await api.fabricOrders.delete(orderToDelete.orderId);
      addToast('Fabric order deleted successfully', 'success');
      setIsDeleteModalOpen(false);
      setOrderToDelete(null);
      fetchOrders();
      refreshMasters();
    } catch (err) {
      addToast(err.message || 'Failed to delete order', 'error');
    }
  };

  const totalOrdered = orders.reduce((sum, o) => sum + (Number(o.orderedMeters) || 0), 0);
  const totalDispatched = orders.reduce((sum, o) => sum + (Number(o.dispatchedMeters) || 0), 0);
  const totalValue = orders.reduce((sum, o) => sum + ((Number(o.orderedMeters) || 0) * (Number(o.rate) || 0)), 0);

  const filteredOrders = orders.filter(o => {
    const matchesSearch = 
      o.orderNo?.toLowerCase().includes(search.toLowerCase()) ||
      o.party?.partyName?.toLowerCase().includes(search.toLowerCase()) ||
      o.quality?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || o.status?.toUpperCase() === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="content-area">
      {/* Quick Summary Cards */}
      <div className="stats-grid" style={{ marginBottom: '20px' }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#37c0fb' }}>
            <ShoppingBag size={22} />
          </div>
          <div className="stat-info">
            <h3>Total Orders</h3>
            <div className="stat-value">{orders.length}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#0284c7' }}>
            <TrendingUp size={22} />
          </div>
          <div className="stat-info">
            <h3>Ordered Meters</h3>
            <div className="stat-value">{totalOrdered.toLocaleString()} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>m</span></div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#10b981' }}>
            <PackageCheck size={22} />
          </div>
          <div className="stat-info">
            <h3>Dispatched Meters</h3>
            <div className="stat-value">{totalDispatched.toLocaleString()} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>m</span></div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#f59e0b' }}>
            <FileText size={22} />
          </div>
          <div className="stat-info">
            <h3>Total Order Value</h3>
            <div className="stat-value">₹{totalValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
          </div>
        </div>
      </div>

      <div className="section-card">
        <div className="section-card-header">
          <div className="section-card-title">
            <ShoppingBag size={20} color="var(--primary-blue)" />
            <h3>Fabric Orders Directory</h3>
            <span className="badge badge-info">{filteredOrders.length} Records</span>
          </div>

          <div className="section-card-actions">
            <div className="search-box">
              <Search size={16} />
              <input
                type="text"
                placeholder="Search order no, customer, quality..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <select
              className="form-control"
              style={{ width: '150px' }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All Statuses</option>
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>

          </div>
        </div>

        <div style={{ margin: '16px 0', display: 'flex', justifyContent: 'flex-start' }}>
          <button className="btn btn-primary" onClick={openCreateModal}>
            <Plus size={18} />
            <span>New Fabric Order</span>
          </button>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Order No</th>
                <th>Order Date</th>
                <th>Customer Party</th>
                <th>Quality / Spec</th>
                <th>Rate (₹)</th>
                <th>Ordered Meters</th>
                <th>Dispatched</th>
                <th>Balance (m)</th>
                <th>Order Value</th>
                <th>Status</th>
                <th>Complete</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="12" style={{ textAlign: 'center', padding: '32px' }}>
                    <div className="spinner" style={{ margin: '0 auto' }}></div>
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan="12" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                    No fabric orders found. Click 'New Fabric Order' to create one.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const ordered = Number(order.orderedMeters) || 0;
                  const dispatched = Number(order.dispatchedMeters) || 0;
                  const balance = Math.max(0, ordered - dispatched);
                  const val = ordered * (Number(order.rate) || 0);

                  return (
                    <tr key={order.orderId}>
                      <td style={{ fontWeight: 700, color: 'var(--primary-blue-dark)' }}>
                        {order.orderNo}
                      </td>
                      <td>{formatDate(order.orderDate)}</td>
                      <td style={{ fontWeight: 600 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Building2 size={15} color="var(--text-muted)" />
                          {order.party?.partyName || '-'}
                        </span>
                      </td>
                      <td>{order.quality || '-'}</td>
                      <td>{order.rate ? `₹${order.rate}` : '-'}</td>
                      <td style={{ fontWeight: 600 }}>{ordered ? `${ordered.toLocaleString()} m` : '-'}</td>
                      <td style={{ color: dispatched > 0 ? 'var(--color-success)' : 'inherit' }}>
                        {dispatched ? `${dispatched.toLocaleString()} m` : '0 m'}
                      </td>
                      <td style={{ fontWeight: 600, color: balance > 0 ? 'var(--color-warning)' : 'var(--text-muted)' }}>
                        {balance.toLocaleString()} m
                      </td>
                      <td style={{ fontWeight: 600, color: 'var(--primary-blue-dark)' }}>
                        {val ? `₹${val.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : '-'}
                      </td>
                      <td>
                        <span className={`badge ${order.status === 'COMPLETED' ? 'badge-success' : (order.status === 'OPEN' ? 'badge-info' : 'badge-warning')}`}>
                          {order.status || 'OPEN'}
                        </span>
                      </td>
                      <td>
                        {order.complete ? (
                          <span className="badge badge-success">Completed</span>
                        ) : (
                          <span className="badge badge-warning">Pending</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                          <button className="btn-icon" onClick={() => openEditModal(order)} title="Edit Order">
                            <Edit2 size={16} />
                          </button>
                          <button
                            className="btn-icon"
                            style={{ color: 'var(--color-danger)' }}
                            onClick={() => { setOrderToDelete(order); setIsDeleteModalOpen(true); }}
                            title="Delete Order"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingOrder ? `Edit Fabric Order #${editingOrder.orderNo}` : 'Create New Fabric Order'}
        size="lg"
      >
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label>Order Number *</label>
              <input
                type="text"
                className="form-control"
                value={formData.orderNo}
                onChange={(e) => setFormData({ ...formData, orderNo: e.target.value })}
                placeholder="e.g. FO-2026-001"
                required
              />
            </div>

            <div className="form-group">
              <label>Order Date *</label>
              <input
                type="date"
                className="form-control"
                value={formData.orderDate}
                onChange={(e) => setFormData({ ...formData, orderDate: e.target.value })}
                required
              />
            </div>

            <div className="form-group col-span-2">
              <label>Customer / Client Party *</label>
              <select
                className="form-control"
                value={formData.partyId}
                onChange={(e) => setFormData({ ...formData, partyId: e.target.value })}
                required
              >
                <option value="">-- Select Customer Party --</option>
                {parties.map(p => (
                  <option key={p.partyId} value={p.partyId}>
                    {p.partyName} ({p.partyType || 'Customer'} - GST: {p.gstNo || 'N/A'})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Fabric Quality / Construction</label>
              <input
                type="text"
                className="form-control"
                value={formData.quality}
                onChange={(e) => setFormData({ ...formData, quality: e.target.value })}
                placeholder="e.g. 60x60/92x88 Cambric 58 inch"
              />
            </div>

            <div className="form-group">
              <label>Supplier Party</label>
              <select className="form-control" value={formData.supplierId} onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}>
                <option value="">-- Select Supplier --</option>
                {parties.map(party => <option key={party.partyId} value={party.partyId}>{party.partyName}</option>)}
              </select>
            </div>

            {/* <div className="form-group">
              <label>Yarn Count</label>
              <select className="form-control" value={formData.countId} onChange={(e) => setFormData({ ...formData, countId: e.target.value })}>
                <option value="">-- Select Yarn Count --</option>
                {yarnCounts.map(count => <option key={count.countId} value={count.countId}>{count.countName}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label>Tickit</label>
              <select className="form-control" value={formData.tickitId} onChange={(e) => setFormData({ ...formData, tickitId: e.target.value })}>
                <option value="">-- Select Tickit --</option>
                {tickits.map(tickit => <option key={tickit.tickitId} value={tickit.tickitId}>{tickit.tickitName}</option>)}
              </select>
            </div> */}



            <div className="form-group">
              <label>Rate per Meter (₹)</label>
              <input
                type="number"
                step="0.01"
                className="form-control"
                value={formData.rate}
                onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                placeholder="e.g. 85.50"
              />
            </div>

            <div className="form-group">
              <label>Total Ordered Meters (m) *</label>
              <input
                type="number"
                step="0.001"
                className="form-control"
                value={formData.orderedMeters}
                onChange={(e) => setFormData({ ...formData, orderedMeters: e.target.value })}
                placeholder="e.g. 10000.000"
                required
              />
            </div>

            <div className="form-group">
              <label>Dispatched Meters (m)</label>
              <input
                type="number"
                step="0.001"
                className="form-control"
                value={formData.dispatchedMeters}
                onChange={(e) => setFormData({ ...formData, dispatchedMeters: e.target.value })}
                placeholder="0.000"
              />
            </div>

            <div className="form-group">
              <label>Order Lifecycle Status</label>
              <select
                className="form-control"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="OPEN">Open</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            <div className="form-group" style={{ justifyContent: 'center' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginTop: '16px' }}>
                <input
                  type="checkbox"
                  checked={formData.complete}
                  onChange={(e) => setFormData({ ...formData, complete: e.target.checked })}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--primary-blue)' }}
                />
                <span style={{ fontWeight: 600 }}>Mark Order as Complete</span>
              </label>
            </div>

            {formData.orderedMeters && formData.rate && (
              <div className="form-group col-span-2" style={{ 
                background: 'var(--primary-blue-light)', 
                padding: '12px 16px', 
                borderRadius: '6px', 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center' 
              }}>
                <span style={{ color: '#0369a1', fontWeight: 600, fontSize: '0.875rem' }}>
                  Estimated Total Order Value:
                </span>
                <span style={{ color: '#0369a1', fontWeight: 700, fontSize: '1.1rem' }}>
                  ₹{(Number(formData.orderedMeters) * Number(formData.rate)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            )}
          </div>

          <div className="modal-footer" style={{ padding: '20px 0 0', marginTop: '20px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {editingOrder ? 'Update Order' : 'Create Fabric Order'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Order Deletion"
      >
        <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>
          Are you sure you want to delete Fabric Order <strong style={{ color: 'var(--text-main)' }}>{orderToDelete?.orderNo}</strong>?
        </p>
        <div className="modal-footer" style={{ padding: '0', border: 'none', background: 'transparent' }}>
          <button className="btn btn-secondary" onClick={() => setIsDeleteModalOpen(false)}>
            Cancel
          </button>
          <button className="btn btn-danger" onClick={handleDelete}>
            Delete Order
          </button>
        </div>
      </Modal>
    </div>
  );
};
