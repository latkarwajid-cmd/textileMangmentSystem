import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { Plus, Search, Edit2, Trash2, RotateCcw, Factory, Building2 } from 'lucide-react';
import { Modal } from '../components/Modal';
import { OrderNumberField } from '../components/OrderNumberField';

export const SizingYarnInwardView = () => {
  const { parties, fabricOrders, tickits, yarnCounts, sizingUnits, addToast } = useApp();
  const [inwardList, setInwardList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    sizingSetId: '1',
    orderNo: '',
    orderId: '',
    sizingId: '',
    inwardDate: new Date().toISOString().split('T')[0],
    countId: '',
    tickitId: '',
    partyId: '',
    bags: '',
    weightKg: '',
    remark: '',
  });

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const fetchInwardList = async () => {
    setLoading(true);
    try {
      const data = await api.sizingYarnInward.getAll();
      setInwardList(Array.isArray(data) ? data : []);
    } catch (err) {
      addToast(err.message || 'Failed to fetch sizing yarn inward entries', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInwardList();
  }, []);

  const openCreateModal = () => {
    setEditingItem(null);
    setFormData({
      sizingSetId: '1',
      orderNo: '',
      orderId: '',
      sizingId: sizingUnits.length > 0 ? sizingUnits[0].sizingId : '',
      inwardDate: new Date().toISOString().split('T')[0],
      countId: yarnCounts.length > 0 ? yarnCounts[0].countId : '',
      tickitId: tickits.length > 0 ? tickits[0].tickitId : '',
      partyId: parties.length > 0 ? parties[0].partyId : '',
      bags: '',
      weightKg: '',
      remark: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      sizingSetId: item.sizingSet?.sizingSetId || '1',
      orderNo: item.order?.orderNo || '',
      orderId: item.order?.orderId || '',
      sizingId: item.sizingUnit?.sizingId || '',
      inwardDate: item.inwardDate || '',
      countId: item.count?.countId || '',
      tickitId: item.tickit?.tickitId || '',
      partyId: item.party?.partyId || '',
      bags: item.bags || '',
      weightKg: item.weightKg || '',
      remark: item.remark || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        sizingSetId: formData.sizingSetId ? Number(formData.sizingSetId) : null,
        orderNo: formData.orderNo || null,
        orderId: formData.orderId ? Number(formData.orderId) : null,
        sizingId: formData.sizingId ? Number(formData.sizingId) : null,
        inwardDate: formData.inwardDate,
        countId: formData.countId ? Number(formData.countId) : null,
        tickitId: formData.tickitId ? Number(formData.tickitId) : null,
        partyId: formData.partyId ? Number(formData.partyId) : null,
        bags: formData.bags ? Number(formData.bags) : null,
        weightKg: formData.weightKg ? Number(formData.weightKg) : null,
        remark: formData.remark,
      };

      if (editingItem) {
        await api.sizingYarnInward.update(editingItem.sizingInwardId, payload);
        addToast('Sizing Yarn Inward updated successfully', 'success');
      } else {
        await api.sizingYarnInward.create(payload);
        addToast('Sizing Yarn Inward recorded successfully', 'success');
      }
      setIsModalOpen(false);
      fetchInwardList();
    } catch (err) {
      addToast(err.message || 'Error saving transaction', 'error');
    }
  };

  const handleOrderChange = orderNo => {
    const order = fabricOrders.find(item => item.orderNo?.trim().toLowerCase() === orderNo.trim().toLowerCase());
    setFormData(prev => ({
      ...prev,
      orderNo,
      orderId: order?.orderId || '',
      countId: order?.count?.countId || '',
      tickitId: order?.tickit?.tickitId || '',
      partyId: order?.party?.partyId || '',
    }));
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    try {
      await api.sizingYarnInward.delete(itemToDelete.sizingInwardId);
      addToast('Entry deleted successfully', 'success');
      setIsDeleteModalOpen(false);
      setItemToDelete(null);
      fetchInwardList();
    } catch (err) {
      addToast(err.message || 'Failed to delete entry', 'error');
    }
  };

  const filteredList = inwardList.filter(item => 
    item.party?.partyName?.toLowerCase().includes(search.toLowerCase()) ||
    item.order?.orderNo?.toLowerCase().includes(search.toLowerCase()) ||
    item.sizingUnit?.sizingName?.toLowerCase().includes(search.toLowerCase()) ||
    item.count?.countName?.toLowerCase().includes(search.toLowerCase()) ||
    item.tickit?.tickitName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="content-area">
      <div className="section-card">
        <div className="section-card-header">
          <div className="section-card-title">
            <RotateCcw size={20} color="var(--accent-emerald)" />
            <h3>Sizing Yarn Inward</h3>
            <span className="badge badge-info">{filteredList.length} Records</span>
          </div>

          <div className="section-card-actions">
            <div className="search-box">
              <Search size={16} />
              <input
                type="text"
                placeholder="Search by party, sizing unit, count..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <button className="btn btn-primary" onClick={openCreateModal}>
              <Plus size={18} />
              <span>Record Inward</span>
            </button>
          </div>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Order No</th>
                <th>Inward Date</th>
                <th>Sizing Unit</th>
                <th>Party</th>
                <th>Yarn Count</th>
                <th>Tickit</th>
                <th>Bags</th>
                <th>Weight (Kg)</th>
                <th>Remark</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="11" style={{ textAlign: 'center', padding: '32px' }}>
                    <div className="spinner" style={{ margin: '0 auto' }}></div>
                  </td>
                </tr>
              ) : filteredList.length === 0 ? (
                <tr>
                  <td colSpan="11" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-dim)' }}>
                    No sizing yarn inward records found. Record your first shipment above.
                  </td>
                </tr>
              ) : (
                filteredList.map((item) => (
                  <tr key={item.sizingInwardId}>
                    <td>#{item.sizingInwardId}</td>
                    <td style={{ fontWeight: 600, color: 'var(--accent-cyan)' }}>
                      {item.order?.orderNo || '-'}
                    </td>
                    <td>{item.inwardDate || '-'}</td>
                    <td style={{ fontWeight: 600, color: 'var(--accent-amber)' }}>
                      {item.sizingUnit?.sizingName || '-'}
                    </td>
                    <td>{item.party?.partyName || '-'}</td>
                    <td>{item.count?.countName || '-'}</td>
                    <td>{item.tickit?.tickitName || '-'}</td>
                    <td>{item.bags || '-'}</td>
                    <td style={{ fontWeight: 600, color: 'var(--accent-emerald)' }}>
                      {item.weightKg ? `${item.weightKg} kg` : '-'}
                    </td>
                    <td style={{ maxWidth: '180px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.remark || '-'}
                    </td>
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
        title={editingItem ? `Edit Sizing Inward #${editingItem.sizingInwardId}` : 'New Sizing Yarn Inward'}
        size="lg"
      >
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <OrderNumberField orders={fabricOrders} value={formData.orderNo} onChange={handleOrderChange} required />

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
              <label>Sizing Set ID</label>
              <input
                type="number"
                className="form-control"
                value={formData.sizingSetId}
                onChange={(e) => setFormData({ ...formData, sizingSetId: e.target.value })}
                placeholder="e.g. 1"
              />
            </div>

            <div className="form-group">
              <label>Sizing Unit</label>
              <select
                className="form-control"
                value={formData.sizingId}
                onChange={(e) => setFormData({ ...formData, sizingId: e.target.value })}
              >
                <option value="">-- Select Sizing Unit --</option>
                {sizingUnits.map(s => (
                  <option key={s.sizingId} value={s.sizingId}>
                    {s.sizingName}
                  </option>
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
                  <option key={p.partyId} value={p.partyId}>
                    {p.partyName}
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
                    {c.countName}
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
                    {t.tickitName}
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
                placeholder="e.g. 8"
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
                placeholder="e.g. 400.00"
                required
              />
            </div>

            <div className="form-group col-span-2">
              <label>Remarks</label>
              <textarea
                className="form-control"
                value={formData.remark}
                onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
                placeholder="Quality verification, moisture notes, batch details..."
              />
            </div>
          </div>

          <div className="modal-footer" style={{ padding: '20px 0 0', marginTop: '20px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {editingItem ? 'Update Inward' : 'Record Inward'}
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
          Are you sure you want to delete Sizing Yarn Inward record <strong style={{ color: 'var(--text-main)' }}>#{itemToDelete?.sizingInwardId}</strong>?
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
