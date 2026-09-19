import React, { useEffect, useState } from 'react';
import { ArrowUpRight, Edit2, Plus, Search, Trash2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { Modal } from '../components/Modal';

const emptyForm = {
  sizingSetId: '', orderId: '', outDate: new Date().toISOString().split('T')[0],
  countId: '', tickitId: '', sizingId: '', partyId: '', bags: '', weightKg: '',
  quality: '', totalEnds: '', sizingMeters: '', sizingReceivedWeight: '',
  freshBagsReceived: '', balanceInSizing: '', sizingConsumptionKg: '', sizingCount: '',
  billNo: '', status: 'OPEN',
};

export const YarnOutDyeingView = () => {
  const { parties, fabricOrders, tickits, yarnCounts, sizingUnits, addToast } = useApp();
  const [sizingSets, setSizingSets] = useState([]);
  const [records, setRecords] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [recordsResult, setsResult] = await Promise.allSettled([
        api.yarnOutDyeing.getAll(),
        api.sizingSets.getAll(),
      ]);

      if (recordsResult.status === 'fulfilled') {
        setRecords(Array.isArray(recordsResult.value) ? recordsResult.value : []);
      } else {
        setRecords([]);
      }

      if (setsResult.status === 'fulfilled') {
        setSizingSets(Array.isArray(setsResult.value) ? setsResult.value : []);
      } else {
        setSizingSets([]);
        addToast('Could not load sizing sets', 'error');
      }
    } catch (err) {
      addToast(err.message || 'Failed to fetch dyeing records', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const openCreateModal = () => {
    setEditingItem(null);
    setFormData({
      ...emptyForm,
      sizingSetId: sizingSets[0]?.sizingSetId || '',
      orderId: sizingSets[0]?.order?.orderId || '',
      countId: sizingSets[0]?.count?.countId || '',
      sizingId: sizingSets[0]?.sizingUnit?.sizingId || '',
      partyId: sizingSets[0]?.party?.partyId || '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      sizingSetId: item.sizingSet?.sizingSetId || '', orderId: item.order?.orderId || '',
      outDate: item.outDate || '', countId: item.count?.countId || '',
      tickitId: item.tickit?.tickitId || '', sizingId: item.sizingUnit?.sizingId || '',
      partyId: item.party?.partyId || '', bags: item.bags || '', weightKg: item.weightKg || '',
      quality: item.quality || '', totalEnds: item.totalEnds || '', sizingMeters: item.sizingMeters || '',
      sizingReceivedWeight: item.sizingReceivedWeight || '', freshBagsReceived: item.freshBagsReceived || '',
      balanceInSizing: item.balanceInSizing || '', sizingConsumptionKg: item.sizingConsumptionKg || '',
      sizingCount: item.sizingCount || '', billNo: item.billNo || '', status: item.status || 'OPEN',
    });
    setIsModalOpen(true);
  };

  const handleSetChange = (value) => {
    const selectedSet = sizingSets.find(item => String(item.sizingSetId) === value);
    setFormData(prev => ({
      ...prev,
      sizingSetId: value,
      orderId: selectedSet?.order?.orderId || prev.orderId,
      countId: selectedSet?.count?.countId || prev.countId,
      sizingId: selectedSet?.sizingUnit?.sizingId || prev.sizingId,
      partyId: selectedSet?.party?.partyId || prev.partyId,
      quality: selectedSet?.quality || prev.quality,
      totalEnds: selectedSet?.totalEnds || prev.totalEnds,
      sizingMeters: selectedSet?.sizingMeters || prev.sizingMeters,
      sizingCount: selectedSet?.sizingCount || prev.sizingCount,
    }));
  };

  const handleSubmit = async event => {
    event.preventDefault();
    try {
      const numericFields = ['sizingSetId', 'orderId', 'countId', 'tickitId', 'sizingId', 'partyId', 'totalEnds'];
      const decimalFields = ['bags', 'weightKg', 'sizingMeters', 'sizingReceivedWeight', 'freshBagsReceived', 'balanceInSizing', 'sizingConsumptionKg'];
      const payload = { ...formData };
      numericFields.forEach(field => { payload[field] = formData[field] ? Number(formData[field]) : null; });
      decimalFields.forEach(field => { payload[field] = formData[field] ? Number(formData[field]) : null; });
      if (editingItem) {
        await api.yarnOutDyeing.update(editingItem.dyeingOutId, payload);
        addToast('Yarn out dyeing record updated successfully', 'success');
      } else {
        await api.yarnOutDyeing.create(payload);
        addToast('Yarn out dyeing record created successfully', 'success');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      addToast(err.message || 'Error saving dyeing record', 'error');
    }
  };

  const handleDelete = async () => {
    try {
      await api.yarnOutDyeing.delete(itemToDelete.dyeingOutId);
      addToast('Dyeing record deleted successfully', 'success');
      setIsDeleteModalOpen(false);
      setItemToDelete(null);
      fetchData();
    } catch (err) {
      addToast(err.message || 'Failed to delete dyeing record', 'error');
    }
  };

  const filteredRecords = records.filter(item => [
    item.sizingSet?.setNo, item.order?.orderNo, item.sizingUnit?.sizingName,
    item.party?.partyName, item.billNo, item.status,
  ].some(value => value?.toLowerCase().includes(search.toLowerCase())));
  const updateField = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));
  const selectOptions = (items, id, label) => items.map(item => <option key={item[id]} value={item[id]}>{item[label]}</option>);

  return (
    <div className="content-area">
      <div className="section-card">
        <div className="section-card-header">
          <div className="section-card-title"><ArrowUpRight size={20} color="var(--accent-rose)" /><h3>Yarn Out for Dyeing</h3><span className="badge badge-info">{filteredRecords.length} Records</span></div>
          <div className="section-card-actions">
            <div className="search-box"><Search size={16} /><input placeholder="Search set, order, party, bill..." value={search} onChange={event => setSearch(event.target.value)} /></div>
            <button className="btn btn-primary" onClick={openCreateModal}><Plus size={18} /><span>Record Yarn Out</span></button>
          </div>
        </div>
        <div className="table-responsive">
          <table className="data-table"><thead><tr>
            <th>Set No (ID)</th><th>Date</th><th>Count</th><th>Tickit</th><th>Bags</th><th>Weight</th><th>Sizing Name</th><th>Party Name</th><th>Order No</th><th>Quality</th><th>Total Ends</th><th>Sizing Mtr</th><th>Received Khard</th><th>Fresh Bags</th><th>Balance</th><th>Consumption KG</th><th>Sizing Count</th><th>Bill No</th><th>Status</th><th>Actions</th>
          </tr></thead><tbody>
            {loading ? <tr><td colSpan="20" style={{ textAlign: 'center', padding: '32px' }}><div className="spinner" style={{ margin: '0 auto' }} /></td></tr> : filteredRecords.length === 0 ? <tr><td colSpan="20" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-dim)' }}>No yarn out dyeing records found.</td></tr> : filteredRecords.map(item => <tr key={item.dyeingOutId}>
              <td>{item.sizingSet ? `${item.sizingSet.setNo || '-'} (ID: ${item.sizingSet.sizingSetId})` : '-'}</td><td>{item.outDate || '-'}</td><td>{item.count?.countName || '-'}</td><td>{item.tickit?.tickitName || '-'}</td><td>{item.bags || '-'}</td><td>{item.weightKg ? `${item.weightKg} kg` : '-'}</td><td>{item.sizingUnit?.sizingName || '-'}</td><td>{item.party?.partyName || '-'}</td><td>{item.order?.orderNo || '-'}</td><td>{item.quality || '-'}</td><td>{item.totalEnds || '-'}</td><td>{item.sizingMeters || '-'}</td><td>{item.sizingReceivedWeight || '-'}</td><td>{item.freshBagsReceived || '-'}</td><td>{item.balanceInSizing || '-'}</td><td>{item.sizingConsumptionKg || '-'}</td><td>{item.sizingCount || '-'}</td><td>{item.billNo || '-'}</td><td>{item.status || '-'}</td>
              <td><div style={{ display: 'flex', gap: '8px' }}><button className="btn-icon" onClick={() => openEditModal(item)} title="Edit"><Edit2 size={16} /></button><button className="btn-icon" style={{ color: 'var(--accent-rose)' }} onClick={() => { setItemToDelete(item); setIsDeleteModalOpen(true); }} title="Delete"><Trash2 size={16} /></button></div></td>
            </tr>)}
          </tbody></table>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingItem ? `Edit Dyeing Entry #${editingItem.dyeingOutId}` : 'New Yarn Out for Dyeing'} size="lg">
        <form onSubmit={handleSubmit}><div className="form-grid">
          <div className="form-group"><label>Set No / ID *</label><select className="form-control" value={formData.sizingSetId} onChange={event => handleSetChange(event.target.value)} required><option value="">-- Select Set --</option>{sizingSets.map(item => <option key={item.sizingSetId} value={item.sizingSetId}>{item.setNo} (ID: {item.sizingSetId})</option>)}</select></div>
          <div className="form-group"><label>Date *</label><input type="date" className="form-control" value={formData.outDate} onChange={event => updateField('outDate', event.target.value)} required /></div>
          <div className="form-group"><label>Count</label><select className="form-control" value={formData.countId} onChange={event => updateField('countId', event.target.value)}><option value="">-- Select Count --</option>{selectOptions(yarnCounts, 'countId', 'countName')}</select></div>
          <div className="form-group"><label>Tickit</label><select className="form-control" value={formData.tickitId} onChange={event => updateField('tickitId', event.target.value)}><option value="">-- Select Tickit --</option>{selectOptions(tickits, 'tickitId', 'tickitName')}</select></div>
          <div className="form-group"><label>Bags</label><input type="number" step="0.001" className="form-control" value={formData.bags} onChange={event => updateField('bags', event.target.value)} /></div>
          <div className="form-group"><label>Weight (Kg)</label><input type="number" step="0.001" className="form-control" value={formData.weightKg} onChange={event => updateField('weightKg', event.target.value)} /></div>
          <div className="form-group"><label>Sizing Name</label><select className="form-control" value={formData.sizingId} onChange={event => updateField('sizingId', event.target.value)}><option value="">-- Select Sizing --</option>{selectOptions(sizingUnits, 'sizingId', 'sizingName')}</select></div>
          <div className="form-group"><label>Party Name</label><select className="form-control" value={formData.partyId} onChange={event => updateField('partyId', event.target.value)}><option value="">-- Select Party --</option>{selectOptions(parties, 'partyId', 'partyName')}</select></div>
          <div className="form-group"><label>Order No</label><select className="form-control" value={formData.orderId} onChange={event => updateField('orderId', event.target.value)}><option value="">-- Select Order --</option>{selectOptions(fabricOrders, 'orderId', 'orderNo')}</select></div>
          <div className="form-group"><label>Quality</label><input className="form-control" value={formData.quality} onChange={event => updateField('quality', event.target.value)} /></div>
          <div className="form-group"><label>Total Ends</label><input type="number" className="form-control" value={formData.totalEnds} onChange={event => updateField('totalEnds', event.target.value)} /></div>
          <div className="form-group"><label>Sizing Mtr</label><input type="number" step="0.001" className="form-control" value={formData.sizingMeters} onChange={event => updateField('sizingMeters', event.target.value)} /></div>
          <div className="form-group"><label>Sizing Received Khard</label><input type="number" step="0.001" className="form-control" value={formData.sizingReceivedWeight} onChange={event => updateField('sizingReceivedWeight', event.target.value)} /></div>
          <div className="form-group"><label>Sizing Fresh Bag Receive</label><input type="number" step="0.001" className="form-control" value={formData.freshBagsReceived} onChange={event => updateField('freshBagsReceived', event.target.value)} /></div>
          <div className="form-group"><label>Balance In Sizing</label><input type="number" step="0.001" className="form-control" value={formData.balanceInSizing} onChange={event => updateField('balanceInSizing', event.target.value)} /></div>
          <div className="form-group"><label>Sizing Consumption KG</label><input type="number" step="0.001" className="form-control" value={formData.sizingConsumptionKg} onChange={event => updateField('sizingConsumptionKg', event.target.value)} /></div>
          <div className="form-group"><label>Sizing Count</label><input className="form-control" value={formData.sizingCount} onChange={event => updateField('sizingCount', event.target.value)} /></div>
          <div className="form-group"><label>Bill No</label><input className="form-control" value={formData.billNo} onChange={event => updateField('billNo', event.target.value)} /></div>
          <div className="form-group"><label>Status</label><select className="form-control" value={formData.status} onChange={event => updateField('status', event.target.value)}><option value="OPEN">Open</option><option value="IN_PROGRESS">In Progress</option><option value="COMPLETED">Completed</option><option value="CANCELLED">Cancelled</option></select></div>
        </div><div className="modal-footer" style={{ padding: '20px 0 0', marginTop: '20px' }}><button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button><button type="submit" className="btn btn-primary">{editingItem ? 'Update Record' : 'Record Yarn Out'}</button></div></form>
      </Modal>
      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Confirm Deletion"><p>Delete this yarn out dyeing record?</p><div className="modal-footer" style={{ padding: '20px 0 0' }}><button className="btn btn-secondary" onClick={() => setIsDeleteModalOpen(false)}>Cancel</button><button className="btn btn-danger" onClick={handleDelete}>Delete</button></div></Modal>
    </div>
  );
};