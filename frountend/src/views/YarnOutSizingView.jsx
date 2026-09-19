import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { Plus, Search, Edit2, Trash2, ArrowUpRight, Calculator } from 'lucide-react';
import { Modal } from '../components/Modal';

export const YarnOutSizingView = () => {
  const { addToast } = useApp();
  const [outList, setOutList] = useState([]);
  const [sizingSets, setSizingSets] = useState([]);
  const [tickits, setTickits] = useState([]);
  const [orders, setOrders] = useState([]);
  const [yarnCounts, setYarnCounts] = useState([]);
  const [parties, setParties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    sizingSetId: '1',
    tickitId: '',
    orderId: '',
    countId: '',
    partyId: '',
    outDate: new Date().toISOString().split('T')[0],
    bags: '',
    cone: '',
    weightKg: '',
    rate: '',
    billNo: '',
    amount: '',
    totalEnd: '',
    sizingMtr: '',
    sizingReceivedKhart: '',
    sizingFreshYarnReceived: '',
    balanceInSizing: '',
    sizingConsumption: '',
    sizingCount: '',
    status: '',
  });

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const fetchOutList = async () => {
    setLoading(true);
    try {
      const data = await api.yarnOutSizing.getAll();
      setOutList(Array.isArray(data) ? data : []);
    } catch (err) {
      addToast(err.message || 'Failed to fetch yarn out entries', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchSizingSets = async () => {
    try {
      const data = await api.sizingSets.getAll();
      setSizingSets(Array.isArray(data) ? data : []);
    } catch (err) {
      addToast(err.message || 'Failed to fetch sizing sets', 'error');
    }
  };

  const fetchTickits = async () => {
    try {
      const data = await api.tickits.getAll();
      setTickits(Array.isArray(data) ? data : []);
    } catch (err) {
      addToast(err.message || 'Failed to fetch tickits', 'error');
    }
  };

  const fetchOrders = async () => {
    try {
      const data = await api.fabricOrders.getAll();
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      addToast(err.message || 'Failed to fetch orders', 'error');
    }
  };

  const fetchYarnCounts = async () => {
    try {
      const data = await api.yarnCounts.getAll();
      setYarnCounts(Array.isArray(data) ? data : []);
    } catch (err) {
      addToast(err.message || 'Failed to fetch yarn counts', 'error');
    }
  };

  const fetchParties = async () => {
    try {
      const data = await api.parties.getAll();
      setParties(Array.isArray(data) ? data : []);
    } catch (err) {
      addToast(err.message || 'Failed to fetch parties', 'error');
    }
  };

  useEffect(() => {
    fetchOutList();
    fetchSizingSets();
    fetchTickits();
    fetchOrders();
    fetchYarnCounts();
    fetchParties();
  }, []);

  // Real-time calculation effect
  useEffect(() => {
    const weight = parseFloat(formData.weightKg) || 0;
    const rate = parseFloat(formData.rate) || 0;

    if (weight > 0 && rate > 0) {
      const total = (weight * rate).toFixed(2);
      setFormData(prev => ({
        ...prev,
        amount: total,
      }));
    }
  }, [formData.weightKg, formData.rate]);

  const openCreateModal = () => {
    setEditingItem(null);
    setFormData({
      sizingSetId: '',
      sizingSetId: '1',
      tickitId: '',
      orderId: '',
      countId: '',
      partyId: '',
      outDate: new Date().toISOString().split('T')[0],
      bags: '',
      cone: '',
      weightKg: '',
      rate: '',
      billNo: '',
      amount: '',
      totalEnd: '',
      sizingMtr: '',
      sizingReceivedKhart: '',
      sizingFreshYarnReceived: '',
      balanceInSizing: '',
      sizingConsumption: '',
      sizingCount: '',
      status: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      sizingSetId: item.sizingSet?.sizingSetId || '',
      sizingSetId: item.sizingSet?.sizingSetId || '1',
      tickitId: item.tickit?.tickitId || '',
      orderId: item.order?.orderId || '',
      countId: item.yarnCount?.countId || '',
      partyId: item.party?.partyId || '',
      outDate: item.outDate || '',
      bags: item.bags ?? '',
      cone: item.cone ?? '',
      weightKg: item.weightKg ?? '',
      rate: item.rate ?? '',
      billNo: item.billNo ?? '',
      amount: item.amount ?? '',
      totalEnd: item.totalEnd ?? '',
      sizingMtr: item.sizingMtr ?? '',
      sizingReceivedKhart: item.sizingReceivedKhart ?? '',
      sizingFreshYarnReceived: item.sizingFreshYarnReceived ?? '',
      balanceInSizing: item.balanceInSizing ?? '',
      sizingConsumption: item.sizingConsumption ?? '',
      sizingCount: item.sizingCount ?? '',
      status: item.status ?? '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        sizingSetId: Number(formData.sizingSetId),
        tickitId: formData.tickitId ? Number(formData.tickitId) : null,
        orderId: formData.orderId ? Number(formData.orderId) : null,
        countId: formData.countId ? Number(formData.countId) : null,
        partyId: formData.partyId ? Number(formData.partyId) : null,
        outDate: formData.outDate,
        bags: formData.bags ? Number(formData.bags) : null,
        cone: formData.cone ? Number(formData.cone) : null,
        weightKg: formData.weightKg ? Number(formData.weightKg) : null,
        rate: formData.rate ? Number(formData.rate) : null,
        billNo: formData.billNo,
        amount: formData.amount ? Number(formData.amount) : null,
        totalEnd: formData.totalEnd ? Number(formData.totalEnd) : null,
        sizingMtr: formData.sizingMtr ? Number(formData.sizingMtr) : null,
        sizingReceivedKhart: formData.sizingReceivedKhart ? Number(formData.sizingReceivedKhart) : null,
        sizingFreshYarnReceived: formData.sizingFreshYarnReceived ? Number(formData.sizingFreshYarnReceived) : null,
        balanceInSizing: formData.balanceInSizing ? Number(formData.balanceInSizing) : null,
        sizingConsumption: formData.sizingConsumption ? Number(formData.sizingConsumption) : null,
        sizingCount: formData.sizingCount ? Number(formData.sizingCount) : null,
        status: formData.status || null,
      };

      if (editingItem) {
        await api.yarnOutSizing.update(editingItem.yarnOutSizingId, payload);
        addToast('Yarn Out Sizing updated successfully', 'success');
      } else {
        await api.yarnOutSizing.create(payload);
        addToast('Yarn Out Sizing created successfully', 'success');
      }
      setIsModalOpen(false);
      fetchOutList();
    } catch (err) {
      addToast(err.message || 'Error saving transaction', 'error');
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    try {
      await api.yarnOutSizing.delete(itemToDelete.yarnOutSizingId);
      addToast('Entry deleted successfully', 'success');
      setIsDeleteModalOpen(false);
      setItemToDelete(null);
      fetchOutList();
    } catch (err) {
      addToast(err.message || 'Failed to delete entry', 'error');
    }
  };

  const filteredList = outList.filter(item => {
    const query = search.toLowerCase();

    return (
      item.billNo?.toLowerCase().includes(query) ||
      item.sizingSet?.setNo?.toLowerCase().includes(query) ||
      item.tickit?.tickitName?.toLowerCase().includes(query) ||
      item.order?.orderNo?.toString().toLowerCase().includes(query) ||
      item.yarnCount?.countName?.toLowerCase().includes(query) ||
      item.party?.partyName?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="content-area">
      <div className="section-card">
        <div className="section-card-header">
          <div className="section-card-title">
            <ArrowUpRight size={20} color="var(--accent-cyan)" />
            <h3>Yarn Out for Sizing</h3>
            <span className="badge badge-info">{filteredList.length} Records</span>
          </div>

          <div className="section-card-actions">
            <div className="search-box">
              <Search size={16} />
              <input
                type="text"
                placeholder="Search by Bill No or Sizing Set..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <button className="btn btn-primary" onClick={openCreateModal}>
              <Plus size={18} />
              <span>Record Yarn Out</span>
            </button>
          </div>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Sizing Set</th>
                <th>Order No</th>
                <th>Count</th>
                <th>Tickit</th>
                <th>Party</th>
                <th>Out Date</th>
                <th>Bags</th>
                <th>Cone</th>
                <th>Weight (Kg)</th>
                <th>Rate (₹)</th>
                <th>Bill No</th>
                <th>Total Amount (₹)</th>
                <th>Total End</th>
                <th>Sizing Mtr</th>
                <th>Received Khart</th>
                <th>Fresh Yarn Received</th>
                <th>Balance in Sizing</th>
                <th>Sizing Consumption</th>
                <th>Sizing Count</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="22" style={{ textAlign: 'center', padding: '32px' }}>
                    <div className="spinner" style={{ margin: '0 auto' }}></div>
                  </td>
                </tr>
              ) : filteredList.length === 0 ? (
                <tr>
                  <td colSpan="22" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-dim)' }}>
                    No sizing out records found. Record your first movement above.
                  </td>
                </tr>
              ) : (
                filteredList.map((item) => (
                  <tr key={item.yarnOutSizingId}>
                    <td>#{item.yarnOutSizingId}</td>
                    <td style={{ fontWeight: 600, color: 'var(--accent-cyan)' }}>
                      {item.sizingSet?.setNo || `Set #${item.sizingSet?.sizingSetId || '-'}`}
                    </td>
                    <td>{item.order?.orderNo ?? '-'}</td>
                    <td>{item.yarnCount?.countName ?? '-'}</td>
                    <td>{item.tickit?.tickitName ?? '-'}</td>
                    <td>{item.party?.partyName ?? '-'}</td>
                    <td>{item.outDate || '-'}</td>
                    <td>{item.bags || '-'}</td>
                    <td>{item.cone || '-'}</td>
                    <td style={{ fontWeight: 600 }}>{item.weightKg ? `${item.weightKg} kg` : '-'}</td>
                    <td>{item.rate ? `₹${item.rate}` : '-'}</td>
                    <td>{item.billNo || '-'}</td>
                    <td style={{ fontWeight: 600, color: 'var(--accent-emerald)' }}>
                      {item.amount != null ? `₹${item.amount}` : '-'}
                    </td>
                    <td>{item.totalEnd ?? '-'}</td>
                    <td>{item.sizingMtr ?? '-'}</td>
                    <td>{item.sizingReceivedKhart ?? '-'}</td>
                    <td>{item.sizingFreshYarnReceived ?? '-'}</td>
                    <td>{item.balanceInSizing ?? '-'}</td>
                    <td>{item.sizingConsumption ?? '-'}</td>
                    <td>{item.sizingCount ?? '-'}</td>
                    <td>{item.status || '-'}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                        <button className="btn-icon" onClick={() => openEditModal(item)} title="Edit Entry">
                          <Edit2 size={16} />
                        </button>
                        <button
                          className="btn-icon"
                          style={{ color: 'var(--accent-rose)' }}
                          onClick={() => { setItemToDelete(item); setIsDeleteModalOpen(true); }}
                          title="Delete Entry"
                        >
                          <Trash2 size={16} />
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
        title={editingItem ? `Edit Yarn Out Entry #${editingItem.yarnOutSizingId}` : 'New Yarn Out for Sizing'}
      >
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label>Sizing Set ID *</label>
              <select
                className="form-control"
                value={formData.sizingSetId}
                onChange={(e) => setFormData({ ...formData, sizingSetId: e.target.value })}
                required
              >
                <option value="">-- Select Sizing Set --</option>
                {sizingSets.map(sizingSet => (
                  <option key={sizingSet.sizingSetId} value={sizingSet.sizingSetId}>
                    {sizingSet.setNo} (ID: {sizingSet.sizingSetId})
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
                  <option key={t.tickitId} value={t.tickitId}>{t.tickitName} (ID: {t.tickitId})</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Order No</label>
              <select
                className="form-control"
                value={formData.orderId}
                onChange={(e) => setFormData({ ...formData, orderId: e.target.value })}
              >
                <option value="">-- Select Order --</option>
                {orders.map(o => (
                  <option key={o.orderId} value={o.orderId}>{o.orderNo} (ID: {o.orderId})</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Count</label>
              <select
                className="form-control"
                value={formData.countId}
                onChange={(e) => setFormData({ ...formData, countId: e.target.value })}
              >
                <option value="">-- Select Count --</option>
                {yarnCounts.map(c => (
                  <option key={c.countId} value={c.countId}>{c.countName} (ID: {c.countId})</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Party</label>
              <select
                className="form-control"
                value={formData.partyId}
                onChange={(e) => setFormData({ ...formData, partyId: e.target.value })}
              >
                <option value="">-- Select Party --</option>
                {parties.map(p => (
                  <option key={p.partyId} value={p.partyId}>{p.partyName} (ID: {p.partyId})</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Out Date *</label>
              <input
                type="date"
                className="form-control"
                value={formData.outDate}
                onChange={(e) => setFormData({ ...formData, outDate: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Bags Count</label>
              <input
                type="number"
                step="0.001"
                className="form-control"
                value={formData.bags}
                onChange={(e) => setFormData({ ...formData, bags: e.target.value })}
                placeholder="e.g. 5"
              />
            </div>

            <div className="form-group">
              <label>Cone Count</label>
              <input
                type="number"
                step="0.001"
                className="form-control"
                value={formData.cone}
                onChange={(e) => setFormData({ ...formData, cone: e.target.value })}
                placeholder="e.g. 24"
              />
            </div>

            <div className="form-group">
              <label>Weight (Kg) *</label>
              <input
                type="number"
                step="0.001"
                className="form-control"
                value={formData.weightKg}
                onChange={(e) => setFormData({ ...formData, weightKg: e.target.value })}
                placeholder="e.g. 250.00"
                required
              />
            </div>

            <div className="form-group">
              <label>Rate (₹) *</label>
              <input
                type="number"
                step="0.01"
                className="form-control"
                value={formData.rate}
                onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                placeholder="e.g. 260.00"
                required
              />
            </div>

            <div className="form-group">
              <label>Bill / Challan No</label>
              <input
                type="text"
                className="form-control"
                value={formData.billNo}
                onChange={(e) => setFormData({ ...formData, billNo: e.target.value })}
                placeholder="e.g. CH-9011"
              />
            </div>

            <div className="form-group">
              <label>Total Amount (₹) (Auto)</label>
              <input
                type="number"
                step="0.01"
                className="form-control"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="Auto computed"
                style={{ color: 'var(--accent-emerald)', fontWeight: 600 }}
              />
            </div>

            <div className="form-group">
              <label>Total End</label>
              <input type="number" step="0.001" className="form-control"
                value={formData.totalEnd}
                onChange={(e) => setFormData({ ...formData, totalEnd: e.target.value })}
                placeholder="0.000"
              />
            </div>

            <div className="form-group">
              <label>Sizing Mtr</label>
              <input type="number" step="0.001" className="form-control"
                value={formData.sizingMtr}
                onChange={(e) => setFormData({ ...formData, sizingMtr: e.target.value })}
                placeholder="0.000"
              />
            </div>

            <div className="form-group">
              <label>Sizing Received Khart</label>
              <input type="number" step="0.001" className="form-control"
                value={formData.sizingReceivedKhart}
                onChange={(e) => setFormData({ ...formData, sizingReceivedKhart: e.target.value })}
                placeholder="0.000"
              />
            </div>

            <div className="form-group">
              <label>Fresh Yarn Received</label>
              <input type="number" step="0.001" className="form-control"
                value={formData.sizingFreshYarnReceived}
                onChange={(e) => setFormData({ ...formData, sizingFreshYarnReceived: e.target.value })}
                placeholder="0.000"
              />
            </div>

            <div className="form-group">
              <label>Balance in Sizing</label>
              <input type="number" step="0.001" className="form-control"
                value={formData.balanceInSizing}
                onChange={(e) => setFormData({ ...formData, balanceInSizing: e.target.value })}
                placeholder="0.000"
              />
            </div>

            <div className="form-group">
              <label>Sizing Consumption</label>
              <input type="number" step="0.001" className="form-control"
                value={formData.sizingConsumption}
                onChange={(e) => setFormData({ ...formData, sizingConsumption: e.target.value })}
                placeholder="0.000"
              />
            </div>

            <div className="form-group">
              <label>Sizing Count</label>
              <input type="number" step="0.001" className="form-control"
                value={formData.sizingCount}
                onChange={(e) => setFormData({ ...formData, sizingCount: e.target.value })}
                placeholder="0.000"
              />
            </div>

            <div className="form-group">
              <label>Status</label>
              <input
                type="text"
                className="form-control"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                placeholder="e.g. PENDING"
              />
            </div>
          </div>

          <div className="modal-footer" style={{ padding: '20px 0 0', marginTop: '20px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {editingItem ? 'Update Entry' : 'Record Yarn Out'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Entry Deletion"
      >
        <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>
          Are you sure you want to delete Yarn Out record <strong style={{ color: 'var(--text-main)' }}>#{itemToDelete?.yarnOutSizingId}</strong>?
        </p>
        <div className="modal-footer" style={{ padding: '0', border: 'none' }}>
          <button className="btn btn-secondary" onClick={() => setIsDeleteModalOpen(false)}>
            Cancel
          </button>
          <button className="btn btn-danger" onClick={handleDelete}>
            Delete Entry
          </button>
        </div>
      </Modal>
    </div>
  );
};
