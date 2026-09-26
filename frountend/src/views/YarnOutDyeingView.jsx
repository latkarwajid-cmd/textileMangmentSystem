import React, { useEffect, useMemo, useState } from 'react';
import { ArrowUpRight, Edit2, Plus, Save, Search, Trash2, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { Modal } from '../components/Modal';

const today = () => new Date().toISOString().split('T')[0];
const emptyHeader = { gatePassNo: '', outDate: today(), orderId: '', firmName: '', dyeingUnitId: '', remark: '' };
const emptyLine = () => ({ bags: '', cone: '', weightKg: '' });

export const YarnOutDyeingView = () => {
  const { parties, fabricOrders, addToast } = useApp();
  const [records, setRecords] = useState([]);
  const [header, setHeader] = useState(emptyHeader);
  const [lines, setLines] = useState([emptyLine()]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);

  const dyers = useMemo(() => parties.filter(party => (
    party.status !== false && ['DYEING', 'DYER'].includes(party.partyType?.toUpperCase())
  )), [parties]);
  const selectedOrder = fabricOrders.find(order => String(order.orderId) === String(header.orderId));

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const data = await api.yarnOutDyeing.getAll();
      setRecords(Array.isArray(data) ? data : []);
    } catch (error) {
      addToast(error.message || 'Failed to load yarn out dyeing records', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRecords(); }, []);

  const updateHeader = (field, value) => setHeader(previous => ({ ...previous, [field]: value }));
  const updateLine = (index, field, value) => setLines(previous => previous.map((line, lineIndex) => (
    lineIndex === index ? { ...line, [field]: value } : line
  )));
  const addLine = () => setLines(previous => [...previous, emptyLine()]);
  const removeLine = index => setLines(previous => previous.length === 1 ? previous : previous.filter((_, lineIndex) => lineIndex !== index));
  const resetDraft = () => { setHeader({ ...emptyHeader, outDate: today() }); setLines([emptyLine()]); };
  const openModal = () => {
    if (editingRecord) resetDraft();
    setEditingRecord(null);
    setIsModalOpen(true);
  };

  const openEditModal = record => {
    setEditingRecord(record);
    setHeader({
      gatePassNo: record.gatePassNo || '',
      outDate: record.outDate || today(),
      orderId: record.order?.orderId || '',
      firmName: record.firmName || '',
      dyeingUnitId: record.party?.partyId || '',
      remark: record.remark || '',
    });
    setLines([{ bags: record.bags ?? '', cone: record.cone ?? '', weightKg: record.weightKg ?? '' }]);
    setIsModalOpen(true);
  };

  const handleOrderChange = orderId => setHeader(previous => ({ ...previous, orderId, firmName: previous.firmName }));

  const handleSubmit = async event => {
    event.preventDefault();
    if (!selectedOrder || !header.dyeingUnitId) {
      addToast('Select an order and dyeing unit before saving', 'error');
      return;
    }

    setSaving(true);
    try {
      const payloads = lines.map(line => ({
        gatePassNo: header.gatePassNo || null,
        outDate: header.outDate || null,
        orderId: Number(header.orderId),
        firmName: header.firmName || null,
        dyeingUnitId: Number(header.dyeingUnitId),
        countId: selectedOrder.count?.countId || editingRecord?.count?.countId || null,
        tickitId: selectedOrder.tickit?.tickitId || editingRecord?.tickit?.tickitId || null,
        bags: line.bags ? Number(line.bags) : null,
        cone: line.cone ? Number(line.cone) : null,
        weightKg: line.weightKg ? Number(line.weightKg) : null,
        remark: header.remark || null,
      }));
      if (editingRecord) {
        await api.yarnOutDyeing.update(editingRecord.dyeingOutId, payloads[0]);
        addToast('Yarn dyeing row updated successfully', 'success');
      } else {
        await Promise.all(payloads.map(payload => api.yarnOutDyeing.create(payload)));
        addToast(`${payloads.length} yarn dyeing row${payloads.length === 1 ? '' : 's'} saved successfully`, 'success');
      }
      resetDraft();
      setEditingRecord(null);
      setIsModalOpen(false);
      fetchRecords();
    } catch (error) {
      addToast(error.message || 'Failed to save yarn out dyeing records', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async record => {
    try {
      await api.yarnOutDyeing.delete(record.dyeingOutId);
      addToast('Yarn dyeing row deleted successfully', 'success');
      fetchRecords();
    } catch (error) {
      addToast(error.message || 'Failed to delete yarn dyeing row', 'error');
    }
  };

  const filteredRecords = records.filter(record => [
    record.gatePassNo, record.order?.orderNo, record.firmName, record.party?.partyName,
    record.count?.countName, record.tickit?.tickitName,
  ].some(value => String(value || '').toLowerCase().includes(search.toLowerCase())));

  return (
    <div className="content-area">
      <div className="section-card">
        <div className="section-card-header">
          <div className="section-card-title"><ArrowUpRight size={20} color="var(--accent-rose)" /><h3>Yarn Out for Dyeing</h3><span className="badge badge-info">{filteredRecords.length} Records</span></div>
          <div className="section-card-actions"><div className="search-box"><Search size={16} /><input placeholder="Search gate pass, order, firm, dyer..." value={search} onChange={event => setSearch(event.target.value)} /></div></div>
        </div>
        <div style={{ padding: '16px 20px' }}><button type="button" className="btn btn-primary" onClick={openModal}><Plus size={18} /> Record New Yarn Out</button></div>
        <div className="table-responsive">
          <table className="data-table"><thead><tr><th>Gate Pass</th><th>Date</th><th>Order No.</th><th>Firm</th><th>Dyeing Unit</th><th>Count</th><th>Tickit</th><th>Bags</th><th>Cones</th><th>Weight</th><th>Remarks</th><th>Actions</th></tr></thead>
            <tbody>{loading ? <tr><td colSpan="12" style={{ textAlign: 'center', padding: '32px' }}><div className="spinner" style={{ margin: '0 auto' }} /></td></tr> : filteredRecords.length === 0 ? <tr><td colSpan="12" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-dim)' }}>No saved yarn out dyeing records found.</td></tr> : filteredRecords.map(record => <tr key={record.dyeingOutId}><td>{record.gatePassNo || '-'}</td><td>{record.outDate || '-'}</td><td>{record.order?.orderNo || '-'}</td><td>{record.firmName || '-'}</td><td>{record.party?.partyName || '-'}</td><td>{record.count?.countName || '-'}</td><td>{record.tickit?.tickitName || '-'}</td><td>{record.bags ?? '-'}</td><td>{record.cone ?? '-'}</td><td>{record.weightKg ? `${record.weightKg} kg` : '-'}</td><td>{record.remark || '-'}</td><td><div style={{ display: 'flex', gap: '6px' }}><button type="button" className="btn-icon" onClick={() => openEditModal(record)} title="Edit row"><Edit2 size={16} /></button><button type="button" className="btn-icon" style={{ color: 'var(--accent-rose)' }} onClick={() => handleDelete(record)} title="Delete row"><Trash2 size={16} /></button></div></td></tr>)}</tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingRecord ? `Edit Yarn Out #${editingRecord.dyeingOutId}` : 'Record New Yarn Out for Dyeing'} size="lg">
        <form onSubmit={handleSubmit}>
          <div className="dyeing-editor">
            <div className="dyeing-header-fields form-grid">
              <div className="form-group"><label>Gate Pass No.</label><input className="form-control" value={header.gatePassNo} onChange={event => updateHeader('gatePassNo', event.target.value)} placeholder="Enter gate pass number" /></div>
              <div className="form-group"><label>Date *</label><input type="date" className="form-control" value={header.outDate} onChange={event => updateHeader('outDate', event.target.value)} required /></div>
              <div className="form-group"><label>Firm Name</label><input className="form-control" value={header.firmName} onChange={event => updateHeader('firmName', event.target.value)} placeholder="Enter firm name" /></div>
              <div className="form-group"><label>Order No. *</label><select className="form-control" value={header.orderId} onChange={event => handleOrderChange(event.target.value)} required><option value="">-- Select Order --</option>{fabricOrders.map(order => <option key={order.orderId} value={order.orderId}>{order.orderNo}</option>)}</select></div>
              <div className="form-group"><label>Dyeing Unit Name *</label><select className="form-control" value={header.dyeingUnitId} onChange={event => updateHeader('dyeingUnitId', event.target.value)} required><option value="">-- Select Dyeing Unit --</option>{dyers.map(dyer => <option key={dyer.partyId} value={dyer.partyId}>{dyer.partyName}</option>)}</select></div>
            </div>
            <div className="dyeing-lines-header"><div><h4>Yarn Records</h4><span>Count and tickit are filled from the selected order.</span></div><button type="button" className="btn btn-secondary" onClick={addLine}><Plus size={16} /> Add Row</button></div>
            <div className="table-responsive"><table className="data-table dyeing-lines-table"><thead><tr><th>Sr. No.</th><th>Count</th><th>Tickit</th><th>Bags</th><th>Cones</th><th>Weight (Kg)</th><th aria-label="Remove row" /></tr></thead><tbody>{lines.map((line, index) => <tr key={index}><td>{index + 1}</td><td>{selectedOrder?.count?.countName || '-'}</td><td>{selectedOrder?.tickit?.tickitName || '-'}</td><td><input type="number" min="0" step="0.001" className="form-control" value={line.bags} onChange={event => updateLine(index, 'bags', event.target.value)} placeholder="0" /></td><td><input type="number" min="0" step="0.001" className="form-control" value={line.cone} onChange={event => updateLine(index, 'cone', event.target.value)} placeholder="0" /></td><td><input type="number" min="0" step="0.001" className="form-control" value={line.weightKg} onChange={event => updateLine(index, 'weightKg', event.target.value)} placeholder="0.000" /></td><td><button type="button" className="btn-icon" onClick={() => removeLine(index)} title="Remove row" disabled={lines.length === 1}><X size={16} /></button></td></tr>)}</tbody></table></div>
            <div className="form-group dyeing-remark"><label>Remarks</label><textarea className="form-control" value={header.remark} onChange={event => updateHeader('remark', event.target.value)} placeholder="Example: 500 kg for blue, 200 kg for red..." /></div>
            <div className="dyeing-editor-actions"><button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Close</button><button type="button" className="btn btn-secondary" onClick={resetDraft}>Clear Draft</button><button type="submit" className="btn btn-primary" disabled={saving}><Save size={17} /> {saving ? 'Saving...' : editingRecord ? 'Update Yarn Out' : 'Save Yarn Out'}</button></div>
          </div>
        </form>
      </Modal>
    </div>
  );
};
