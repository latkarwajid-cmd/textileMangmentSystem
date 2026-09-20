import React, { useEffect, useState } from 'react';
import { Plus, Search, Layers, Edit2, Trash2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { Modal } from '../components/Modal';

export const SizingSetsView = () => {
  const { parties, fabricOrders, tickits, yarnCounts, sizingUnits, addToast } = useApp();
  const [sizingSets, setSizingSets] = useState([]);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSet, setEditingSet] = useState(null);
  const [formData, setFormData] = useState({
    setNo: '',
    orderId: '',
    countId: '',
    tickitId: '',
    sizingId: '',
    partyId: '',
    quality: '',
    totalEnds: '',
    sizingMeters: '',
    sizingCount: '',
  });

  const fetchSizingSets = async () => {
    try {
      const data = await api.sizingSets.getAll();
      setSizingSets(Array.isArray(data) ? data : []);
    } catch (err) {
      addToast(err.message || 'Failed to fetch sizing sets', 'error');
    }
  };

  useEffect(() => {
    fetchSizingSets();
  }, []);

  const openCreateModal = () => {
    setFormData({
      setNo: '',
      orderId: fabricOrders[0]?.orderId || '',
      countId: yarnCounts[0]?.countId || '',
      tickitId: tickits[0]?.tickitId || '',
      sizingId: sizingUnits[0]?.sizingId || '',
      partyId: parties[0]?.partyId || '',
      quality: '',
      totalEnds: '',
      sizingMeters: '',
      sizingCount: '',
    });
    setIsModalOpen(true);
    setEditingSet(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      if (editingSet) {
        await api.sizingSets.update(editingSet.sizingSetId, {
          setNo: formData.setNo,
          orderId: formData.orderId ? Number(formData.orderId) : null,
          countId: formData.countId ? Number(formData.countId) : null,
          tickitId: formData.tickitId ? Number(formData.tickitId) : null,
          sizingId: formData.sizingId ? Number(formData.sizingId) : null,
          partyId: formData.partyId ? Number(formData.partyId) : null,
          quality: formData.quality,
          totalEnds: formData.totalEnds ? Number(formData.totalEnds) : null,
          sizingMeters: formData.sizingMeters ? Number(formData.sizingMeters) : null,
          sizingCount: formData.sizingCount,
          status: 'OPEN',
        });
        addToast('Sizing set updated successfully', 'success');
      } else {
        await api.sizingSets.create({
        setNo: formData.setNo,
        orderId: formData.orderId ? Number(formData.orderId) : null,
        countId: formData.countId ? Number(formData.countId) : null,
        tickitId: formData.tickitId ? Number(formData.tickitId) : null,
        sizingId: formData.sizingId ? Number(formData.sizingId) : null,
        partyId: formData.partyId ? Number(formData.partyId) : null,
        quality: formData.quality,
        totalEnds: formData.totalEnds ? Number(formData.totalEnds) : null,
        sizingMeters: formData.sizingMeters ? Number(formData.sizingMeters) : null,
        sizingCount: formData.sizingCount,
        status: 'OPEN',
        });
        addToast('Sizing set created successfully', 'success');
      }
      setIsModalOpen(false);
      setEditingSet(null);
      fetchSizingSets();
    } catch (err) {
      addToast(err.message || 'Error creating sizing set', 'error');
    }
  };

  const openEditModal = (set) => {
    setEditingSet(set);
    setFormData({
      setNo: set.setNo || '',
      orderId: set.order?.orderId || '',
      countId: set.count?.countId || '',
      tickitId: set.tickit?.tickitId || '',
      sizingId: set.sizingUnit?.sizingId || '',
      partyId: set.party?.partyId || '',
      quality: set.quality || '',
      totalEnds: set.totalEnds || '',
      sizingMeters: set.sizingMeters || '',
      sizingCount: set.sizingCount || '',
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (set) => {
    if (!set) return;
    try {
      await api.sizingSets.delete(set.sizingSetId);
      addToast('Sizing set deleted', 'success');
      fetchSizingSets();
    } catch (err) {
      addToast(err.message || 'Failed to delete sizing set', 'error');
    }
  };

  const filteredSets = sizingSets.filter(sizingSet =>
    sizingSet.setNo?.toLowerCase().includes(search.toLowerCase()) ||
    sizingSet.order?.orderNo?.toLowerCase().includes(search.toLowerCase()) ||
    sizingSet.party?.partyName?.toLowerCase().includes(search.toLowerCase())
  );

  const updateField = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  return (
    <div className="content-area">
      <div className="section-card">
        <div className="section-card-header">
          <div className="section-card-title">
            <Layers size={20} color="var(--accent-amber)" />
            <h3>Sizing Sets</h3>
            <span className="badge badge-info">{filteredSets.length} Records</span>
          </div>
          <div className="section-card-actions">
            <div className="search-box">
              <Search size={16} />
              <input
                type="text"
                placeholder="Search set, order, party..."
                value={search}
                onChange={event => setSearch(event.target.value)}
              />
            </div>
            <button className="btn btn-primary" onClick={openCreateModal}>
              <Plus size={18} />
              <span>New Sizing Set</span>
            </button>
          </div>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Set No</th>
                <th>Order No</th>
                <th>Party</th>
                <th>Sizing Unit</th>
                <th>Yarn Count</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSets.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-dim)' }}>
                    No sizing sets found. Create the first one above.
                  </td>
                </tr>
              ) : filteredSets.map(sizingSet => (
                <tr key={sizingSet.sizingSetId}>
                  <td>#{sizingSet.sizingSetId}</td>
                  <td style={{ fontWeight: 600, color: 'var(--accent-amber)' }}>{sizingSet.setNo}</td>
                  <td>{sizingSet.order?.orderNo || '-'}</td>
                  <td>{sizingSet.party?.partyName || '-'}</td>
                  <td>{sizingSet.sizingUnit?.sizingName || '-'}</td>
                  <td>{sizingSet.count?.countName || '-'}</td>
                  <td>{sizingSet.status || 'OPEN'}</td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                      <button className="btn-icon" onClick={() => openEditModal(sizingSet)} title="Edit"><Edit2 size={15} /></button>
                      <button className="btn-icon" style={{ color: 'var(--color-danger)' }} onClick={() => handleDelete(sizingSet)} title="Delete"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingSet ? `Edit Sizing Set #${editingSet.sizingSetId}` : 'New Sizing Set'} size="lg">
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label>Set No *</label>
              <input className="form-control" value={formData.setNo} onChange={event => updateField('setNo', event.target.value)} placeholder="e.g. SET-001" required />
            </div>
            <div className="form-group">
              <label>Fabric Order</label>
              <select className="form-control" value={formData.orderId} onChange={event => updateField('orderId', event.target.value)}>
                <option value="">-- Select Order --</option>
                {fabricOrders.map(order => <option key={order.orderId} value={order.orderId}>{order.orderNo}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Party</label>
              <select className="form-control" value={formData.partyId} onChange={event => updateField('partyId', event.target.value)}>
                <option value="">-- Select Party --</option>
                {parties.map(party => <option key={party.partyId} value={party.partyId}>{party.partyName}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Sizing Unit</label>
              <select className="form-control" value={formData.sizingId} onChange={event => updateField('sizingId', event.target.value)}>
                <option value="">-- Select Sizing Unit --</option>
                {sizingUnits.map(unit => <option key={unit.sizingId} value={unit.sizingId}>{unit.sizingName}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Yarn Count</label>
              <select className="form-control" value={formData.countId} onChange={event => updateField('countId', event.target.value)}>
                <option value="">-- Select Count --</option>
                {yarnCounts.map(count => <option key={count.countId} value={count.countId}>{count.countName}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Tickit</label>
              <select className="form-control" value={formData.tickitId} onChange={event => updateField('tickitId', event.target.value)}>
                <option value="">-- Select Tickit --</option>
                {tickits.map(tickit => <option key={tickit.tickitId} value={tickit.tickitId}>{tickit.tickitName}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Total Ends</label>
              <input type="number" className="form-control" value={formData.totalEnds} onChange={event => updateField('totalEnds', event.target.value)} />
            </div>
            <div className="form-group">
              <label>Sizing Meters</label>
              <input type="number" step="0.001" className="form-control" value={formData.sizingMeters} onChange={event => updateField('sizingMeters', event.target.value)} />
            </div>
            <div className="form-group">
              <label>Sizing Count</label>
              <input className="form-control" value={formData.sizingCount} onChange={event => updateField('sizingCount', event.target.value)} />
            </div>
            <div className="form-group col-span-2">
              <label>Quality</label>
              <input className="form-control" value={formData.quality} onChange={event => updateField('quality', event.target.value)} />
            </div>
          </div>
          <div className="modal-footer" style={{ padding: '20px 0 0', marginTop: '20px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">
              {editingSet ? 'Update Sizing Set' : 'Create Sizing Set'}
            </button>
            </div>
        </form>
      </Modal>
    </div>
  );
};