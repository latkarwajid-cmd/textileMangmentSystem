import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { Plus, Search, Edit2, Trash2, RotateCcw, Scale, Calculator } from 'lucide-react';
import { Modal } from '../components/Modal';
import { OrderNumberField } from '../components/OrderNumberField';

const createEmptyReturnRow = (srNo = 1, countAndTicket = '', countId = '', tickitId = '') => ({
  id: `ret-${Date.now()}-${Math.random()}`,
  srNo,
  itemType: 'Partial / Loose Bag',
  countId,
  tickitId,
  countAndTicket,
  bagsReturned: '',
  conesReturned: '',
  returnedWeightKg: '',
  destinationWarehouse: 'Main Raw Yarn Warehouse',
  remark: ''
});

export const SizingYarnInwardView = () => {
  const { parties, fabricOrders, tickits, yarnCounts, sizingUnits, yarnStorageLocations, addToast } = useApp();
  const [inwardList, setInwardList] = useState([]);
  const [sizingSets, setSizingSets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    sizingSetId: '1',
    setNo: '',
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
    reconciliation: { totalIssuedBags: '', emptyConeTareGrams: '60', conesPerBag: '32', issuedGrossWeight: '' },
    balanceReturns: [],
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
    api.sizingSets.getAll().then(data => setSizingSets(Array.isArray(data) ? data.filter(s => s.status !== 'DELETED') : [])).catch(() => {});
  }, []);

  const openCreateModal = () => {
    setEditingItem(null);
    setFormData({
      sizingSetId: '1',
      setNo: '',
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
      reconciliation: { totalIssuedBags: '', emptyConeTareGrams: '60', conesPerBag: '32', issuedGrossWeight: '' },
      balanceReturns: [createEmptyReturnRow(1)],
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      sizingSetId: item.sizingSet?.sizingSetId || '1',
      setNo: item.sizingSet?.setNo || '',
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
      reconciliation: { totalIssuedBags: '', emptyConeTareGrams: '60', conesPerBag: '32', issuedGrossWeight: '' },
      balanceReturns: [createEmptyReturnRow(1, '', item.count?.countId || '', item.tickit?.tickitId || '')],
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const returnRows = formData.balanceReturns?.filter(row => row.returnedWeightKg || row.bagsReturned || row.conesReturned) || [];
      const rowsToSave = returnRows.length ? returnRows : [{ countId: formData.countId, tickitId: formData.tickitId, bagsReturned: formData.bags, returnedWeightKg: formData.weightKg, itemType: 'Partial / Loose Bag', destinationWarehouse: 'Main Raw Yarn Warehouse', remark: formData.remark }];
      const makePayload = row => ({
        sizingSetId: formData.sizingSetId ? Number(formData.sizingSetId) : null,
        orderNo: formData.orderNo || null,
        orderId: formData.orderId ? Number(formData.orderId) : null,
        sizingId: formData.sizingId ? Number(formData.sizingId) : null,
        inwardDate: formData.inwardDate,
        countId: row.countId ? Number(row.countId) : (formData.countId ? Number(formData.countId) : null),
        tickitId: row.tickitId ? Number(row.tickitId) : (formData.tickitId ? Number(formData.tickitId) : null),
        partyId: formData.partyId ? Number(formData.partyId) : null,
        bags: row.bagsReturned ? Number(row.bagsReturned) : null,
        weightKg: row.returnedWeightKg ? Number(row.returnedWeightKg) : null,
        remark: [
          row.itemType,
          `Count & Ticket: ${row.countAndTicket || '-'}`,
          `Cones Returned: ${row.conesReturned || 0}`,
          `Destination: ${row.destinationWarehouse || '-'}`,
          `Issued: ${formData.reconciliation.totalIssuedBags || 0} bags / ${reconciliationSummary.issuedCones} cones / ${formData.reconciliation.issuedGrossWeight || 0} kg`,
          `Tare: ${formData.reconciliation.emptyConeTareGrams || 60} g`,
          row.remark || formData.remark
        ].filter(Boolean).join(' | '),
      });

      if (editingItem) {
        await api.sizingYarnInward.update(editingItem.sizingInwardId, makePayload(rowsToSave[0]));
        addToast('Sizing Yarn Inward updated successfully', 'success');
      } else {
        await Promise.all(rowsToSave.map(row => api.sizingYarnInward.create(makePayload(row))));
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

  const handleSizingSetChange = async sizingSetId => {
    const selectedSet = sizingSets.find(set => String(set.sizingSetId) === String(sizingSetId));
    if (!sizingSetId) {
      setFormData(prev => ({ ...prev, sizingSetId: '', setNo: '' }));
      return;
    }
    try {
      const lookup = await api.sizingSets.getInwardLookup(sizingSetId);
      const set = selectedSet || {};
      const order = set.order || {};
      const party = set.party || order.party || {};
      const count = set.count || order.count || {};
      const tickit = set.tickit || order.tickit || {};
      setFormData(prev => ({
        ...prev,
        sizingSetId,
        setNo: lookup?.setNo || set.setNo || '',
        orderNo: lookup?.orderNo || order.orderNo || prev.orderNo,
        orderId: lookup?.orderId || order.orderId || prev.orderId,
        sizingId: lookup?.sizingId || set.sizingUnit?.sizingId || prev.sizingId,
        partyId: lookup?.partyId || party.partyId || prev.partyId,
        countId: lookup?.countId || count.countId || prev.countId,
        tickitId: lookup?.tickitId || tickit.tickitId || prev.tickitId,
        bags: lookup?.issuedBags || prev.bags,
        weightKg: lookup?.issuedWeightKg || prev.weightKg,
        reconciliation: { ...prev.reconciliation, totalIssuedBags: lookup?.issuedBags || prev.reconciliation.totalIssuedBags, issuedGrossWeight: lookup?.issuedWeightKg || prev.reconciliation.issuedGrossWeight },
        balanceReturns: (prev.balanceReturns?.length ? prev.balanceReturns : [createEmptyReturnRow(1)]).map(row => ({ ...row, countId: lookup?.countId || count.countId || row.countId, tickitId: lookup?.tickitId || tickit.tickitId || row.tickitId, countAndTicket: lookup?.countAndTicket || row.countAndTicket }))
      }));
    } catch {
      addToast('Could not load sizing set details', 'error');
    }
  };

  const updateReturnRow = (id, field, value) => setFormData(prev => ({ ...prev, balanceReturns: prev.balanceReturns.map(row => row.id === id ? { ...row, [field]: value } : row) }));
  const addReturnRow = () => setFormData(prev => ({ ...prev, balanceReturns: [...(prev.balanceReturns || []), createEmptyReturnRow((prev.balanceReturns || []).length + 1, '', prev.countId, prev.tickitId)] }));
  const removeReturnRow = id => setFormData(prev => ({ ...prev, balanceReturns: prev.balanceReturns.length === 1 ? [createEmptyReturnRow(1, '', prev.countId, prev.tickitId)] : prev.balanceReturns.filter(row => row.id !== id).map((row, index) => ({ ...row, srNo: index + 1 })) }));

  const reconciliationSummary = (() => {
    const issuedBags = Number(formData.reconciliation?.totalIssuedBags) || 0;
    const conesPerBag = Number(formData.reconciliation?.conesPerBag) || 32;
    const issuedCones = issuedBags * conesPerBag;
    const tareKg = issuedCones * ((Number(formData.reconciliation?.emptyConeTareGrams) || 60) / 1000);
    const issuedGrossWeight = Number(formData.reconciliation?.issuedGrossWeight) || 0;
    const returnedWeight = (formData.balanceReturns || []).reduce((sum, row) => sum + (Number(row.returnedWeightKg) || 0), 0);
    const returnedBags = (formData.balanceReturns || []).reduce((sum, row) => sum + (Number(row.bagsReturned) || 0), 0);
    const returnedCones = (formData.balanceReturns || []).reduce((sum, row) => sum + (Number(row.conesReturned) || 0), 0);
    return { issuedBags, issuedCones, tareKg, issuedGrossWeight, returnedWeight, returnedBags, returnedCones, consumed: Math.max(0, issuedGrossWeight - tareKg - returnedWeight) };
  })();

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
    Number(item.bags ?? 0) > 0 && (
      item.party?.partyName?.toLowerCase().includes(search.toLowerCase()) ||
      item.order?.orderNo?.toLowerCase().includes(search.toLowerCase()) ||
      item.sizingUnit?.sizingName?.toLowerCase().includes(search.toLowerCase()) ||
      item.count?.countName?.toLowerCase().includes(search.toLowerCase()) ||
      item.tickit?.tickitName?.toLowerCase().includes(search.toLowerCase())
    )
  );

  return (
    <div className="content-area">
      <div className="section-card">
        <div className="section-card-header">
          <div className="section-card-title">
            <RotateCcw size={20} color="var(--accent-emerald)" />
            <h3>Yarn Return from Sizing</h3>
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

          </div>
        </div>

        <div style={{ margin: '16px 0', display: 'flex', justifyContent: 'flex-start' }}>
          <button className="btn btn-primary" onClick={openCreateModal}>
            <Plus size={18} />
            <span>Record Yarn Return</span>
          </button>
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
                    No yarn returns from sizing found. Record the first return above.
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
        title={editingItem ? `Edit Yarn Return #${editingItem.sizingInwardId}` : 'New Yarn Return from Sizing'}
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
              <label>Sizing Set</label>
              <select
                className="form-control"
                value={formData.sizingSetId}
                onChange={(e) => handleSizingSetChange(e.target.value)}
              >
                <option value="">-- Select Sizing Set --</option>
                {sizingSets.map(set => <option key={set.sizingSetId} value={set.sizingSetId}>{set.setNo || `Set #${set.sizingSetId}`}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label>Set No (Auto-filled)</label>
              <input className="form-control" value={formData.setNo} readOnly placeholder="Select a sizing set" />
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
              <div className="section-card-header" style={{ background: '#fff1f2', margin: '8px 0 12px', padding: '10px 14px' }}>
                <div className="section-card-title"><Scale size={18} color="#e11d48" /><h3 style={{ margin: 0, fontSize: '0.95rem' }}>Yarn Reconciliation and Balance Return</h3></div>
                <button type="button" className="btn btn-secondary btn-sm" onClick={addReturnRow}><Plus size={14} /> Add Return Row</button>
              </div>
              <div className="form-grid-4">
                <div className="form-group"><label>Total Yarn Issued (Bags)</label><input type="number" step="0.01" className="form-control" value={formData.reconciliation.totalIssuedBags} onChange={e => setFormData({ ...formData, reconciliation: { ...formData.reconciliation, totalIssuedBags: e.target.value } })} /></div>
                <div className="form-group"><label>Cones Per Bag</label><input type="number" className="form-control" value={formData.reconciliation.conesPerBag} onChange={e => setFormData({ ...formData, reconciliation: { ...formData.reconciliation, conesPerBag: e.target.value } })} /></div>
                <div className="form-group"><label>Total Issued Cones</label><input className="form-control" value={reconciliationSummary.issuedCones} readOnly /></div>
                <div className="form-group"><label>Issued Gross Weight (Kg)</label><input type="number" step="0.001" className="form-control" value={formData.reconciliation.issuedGrossWeight} onChange={e => setFormData({ ...formData, reconciliation: { ...formData.reconciliation, issuedGrossWeight: e.target.value } })} /></div>
                <div className="form-group"><label>Empty Cone Tare Weight (g)</label><input type="number" step="0.1" className="form-control" value={formData.reconciliation.emptyConeTareGrams} onChange={e => setFormData({ ...formData, reconciliation: { ...formData.reconciliation, emptyConeTareGrams: e.target.value } })} /></div>
                <div className="form-group"><label>Net Yarn Issued (Kg)</label><input className="form-control" value={Math.max(0, reconciliationSummary.issuedGrossWeight - reconciliationSummary.tareKg).toFixed(3)} readOnly /></div>
              </div>
              <div className="table-responsive">
                <table className="beam-table">
                  <thead><tr><th>Sr.</th><th>Item Type</th><th>Yarn Count & Ticket</th><th>Bags Returned</th><th>Cones Returned</th><th>Returned Wt (Kg)</th><th>Destination Warehouse</th><th>Remark</th><th>Action</th></tr></thead>
                  <tbody>{(formData.balanceReturns || []).map((row, index) => <tr key={row.id}>
                    <td>{index + 1}</td>
                    <td><select className="beam-table-input" value={row.itemType} onChange={e => updateReturnRow(row.id, 'itemType', e.target.value)}><option>Full Bag</option><option>Partial / Loose Bag</option><option>Empty Cones Scrap</option></select></td>
                    <td><input className="beam-table-input" value={row.countAndTicket} onChange={e => updateReturnRow(row.id, 'countAndTicket', e.target.value)} placeholder="Count & Ticket" /></td>
                    <td><input type="number" step="0.01" min="0" className="beam-table-input" value={row.bagsReturned} onChange={e => updateReturnRow(row.id, 'bagsReturned', e.target.value)} /></td>
                    <td><input type="number" min="0" className="beam-table-input" value={row.conesReturned} onChange={e => updateReturnRow(row.id, 'conesReturned', e.target.value)} /></td>
                    <td><input type="number" step="0.001" min="0" className="beam-table-input" value={row.returnedWeightKg} onChange={e => updateReturnRow(row.id, 'returnedWeightKg', e.target.value)} /></td>
                    <td><select className="beam-table-input" value={row.destinationWarehouse} onChange={e => updateReturnRow(row.id, 'destinationWarehouse', e.target.value)}><option>Main Raw Yarn Warehouse</option><option>Shed 1 Raw Storage</option><option>Shed 2 Raw Storage</option><option>Kalawant Warehouse</option>{yarnStorageLocations.map(loc => <option key={loc.locationId} value={loc.locationName}>{loc.locationName}</option>)}</select></td>
                    <td><input className="beam-table-input" value={row.remark} onChange={e => updateReturnRow(row.id, 'remark', e.target.value)} placeholder="Return notes" /></td>
                    <td><button type="button" className="btn-icon" onClick={() => removeReturnRow(row.id)} title="Delete Return Row"><Trash2 size={14} /></button></td>
                  </tr>)}</tbody>
                  <tfoot><tr><td colSpan="3"><strong>Total Returned</strong></td><td>{reconciliationSummary.returnedBags || '-'}</td><td>{reconciliationSummary.returnedCones || '-'}</td><td>{reconciliationSummary.returnedWeight.toFixed(3)} kg</td><td colSpan="3"></td></tr></tfoot>
                </table>
              </div>
              <div className="reconciliation-card" style={{ marginTop: 12 }}><Calculator size={18} /> Net Yarn Consumed: <strong>{reconciliationSummary.consumed.toFixed(3)} kg</strong></div>
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
