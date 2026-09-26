import React, { useEffect, useMemo, useState } from 'react';
import { ArrowDownLeft, Edit2, Plus, Save, Search, Trash2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { Modal } from '../components/Modal';

const today = () => new Date().toISOString().split('T')[0];
const emptyHeader = { partyGatePassNo: '', gatePassNo: '', receiveDate: today(), remarks: '' };

const numberValue = value => Number(value) || 0;

export const YarnReceiveDyeingView = () => {
  const { addToast } = useApp();
  const [issueRecords, setIssueRecords] = useState([]);
  const [receiveRecords, setReceiveRecords] = useState([]);
  const [header, setHeader] = useState(emptyHeader);
  const [lines, setLines] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const [issues, received] = await Promise.all([api.yarnOutDyeing.getAll(), api.yarnReceiveDyeing.getAll()]);
      setIssueRecords(Array.isArray(issues) ? issues : []);
      setReceiveRecords(Array.isArray(received) ? received : []);
    } catch (error) {
      addToast(error.message || 'Failed to load dyeing receipt records', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRecords(); }, []);

  const gatePassGroups = useMemo(() => {
    const groups = new Map();
    issueRecords.filter(record => record.gatePassNo).forEach(record => {
      if (!groups.has(record.gatePassNo)) groups.set(record.gatePassNo, []);
      groups.get(record.gatePassNo).push(record);
    });
    return [...groups.entries()].map(([gatePassNo, records]) => [
      gatePassNo,
      records.filter(record => {
        const consumed = receiveRecords
          .filter(receipt => receipt.yarnOutDyeing?.dyeingOutId === record.dyeingOutId)
          .reduce((total, receipt) => total + numberValue(receipt.receivedWeight) + numberValue(receipt.wastage), 0);
        return numberValue(record.weightKg) - consumed > 0.000001;
      }),
    ]).filter(([, records]) => records.length > 0);
  }, [issueRecords, receiveRecords]);

  const updateHeader = (field, value) => setHeader(previous => ({ ...previous, [field]: value }));
  const selectGatePass = gatePassNo => {
    const selected = gatePassGroups.find(([number]) => number === gatePassNo)?.[1] || [];
    setHeader(previous => ({ ...previous, gatePassNo }));
    setLines(selected.map(record => ({ sourceId: record.dyeingOutId, receivedWeight: '', wastage: '' })));
  };

  const previouslyConsumed = (sourceId, excludedReceiptId = editingRecord?.yarnReceiveDyeingId) => receiveRecords
    .filter(receipt => receipt.yarnOutDyeing?.dyeingOutId === sourceId && receipt.yarnReceiveDyeingId !== excludedReceiptId)
    .reduce((total, receipt) => total + numberValue(receipt.receivedWeight) + numberValue(receipt.wastage), 0);

  const updateLine = (sourceId, field, value) => {
    const source = issueRecords.find(record => record.dyeingOutId === sourceId);
    const line = lines.find(item => item.sourceId === sourceId);
    const receivedWeight = field === 'receivedWeight' ? numberValue(value) : numberValue(line?.receivedWeight);
    const remaining = Math.max(0, numberValue(source?.weightKg) - previouslyConsumed(sourceId) - receivedWeight);
    if (field === 'wastage' && numberValue(value) > 0 && numberValue(value) >= remaining) {
      setLines(previous => previous.filter(line => line.sourceId !== sourceId));
      return;
    }
    setLines(previous => previous.map(line => line.sourceId === sourceId ? { ...line, [field]: value } : line));
  };

  const openModal = () => {
    setHeader({ ...emptyHeader, receiveDate: today() });
    setLines([]);
    setEditingRecord(null);
    setIsModalOpen(true);
  };

  const openEditModal = record => {
    setEditingRecord(record);
    setHeader({
      partyGatePassNo: record.partyGatePassNo || '',
      gatePassNo: record.gatePassNo || '',
      receiveDate: record.receiveDate || today(),
      remarks: record.remarks || '',
    });
    setLines([{ sourceId: record.yarnOutDyeing?.dyeingOutId, receivedWeight: record.receivedWeight ?? '', wastage: record.wastage ?? '' }]);
    setIsModalOpen(true);
  };

  const handleSubmit = async event => {
    event.preventDefault();
    const rowsToSave = lines.filter(line => numberValue(line.receivedWeight) > 0 || numberValue(line.wastage) > 0);
    if (!header.gatePassNo || rowsToSave.length === 0) {
      addToast('Select an against challan and enter at least one received weight', 'error');
      return;
    }
    const invalidRow = rowsToSave.find(line => {
      const source = issueRecords.find(record => record.dyeingOutId === line.sourceId);
      const available = numberValue(source?.weightKg) - previouslyConsumed(line.sourceId);
      return numberValue(line.receivedWeight) + numberValue(line.wastage) > available + 0.000001;
    });
    if (invalidRow) {
      addToast('Received weight plus wastage cannot exceed the remaining issued weight', 'error');
      return;
    }
    setSaving(true);
    try {
      const payloads = rowsToSave.map(line => ({
        dyeingOutId: line.sourceId,
        gatePassNo: header.gatePassNo,
        receiveDate: header.receiveDate || null,
        partyGatePassNo: header.partyGatePassNo || null,
        receivedWeight: numberValue(line.receivedWeight),
        wastage: numberValue(line.wastage),
        remarks: header.remarks || null,
      }));
      if (editingRecord) {
        await api.yarnReceiveDyeing.update(editingRecord.yarnReceiveDyeingId, payloads[0]);
      } else {
        await Promise.all(payloads.map(payload => api.yarnReceiveDyeing.create(payload)));
      }
      addToast(editingRecord ? 'Yarn dyeing receipt updated successfully' : 'Yarn received from dyeing saved successfully', 'success');
      setIsModalOpen(false);
      setEditingRecord(null);
      fetchRecords();
    } catch (error) {
      addToast(error.message || 'Failed to save yarn dyeing receipt', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async record => {
    try {
      await api.yarnReceiveDyeing.delete(record.yarnReceiveDyeingId);
      addToast('Yarn dyeing receipt deleted successfully', 'success');
      fetchRecords();
    } catch (error) {
      addToast(error.message || 'Failed to delete receipt', 'error');
    }
  };

  const filteredRecords = receiveRecords.filter(record => [record.gatePassNo, record.partyGatePassNo, record.yarnOutDyeing?.count?.countName, record.yarnOutDyeing?.tickit?.tickitName].some(value => String(value || '').toLowerCase().includes(search.toLowerCase())));

  return (
    <div className="content-area">
      <div className="section-card">
        <div className="section-card-header">
          <div className="section-card-title"><ArrowDownLeft size={20} color="var(--primary-blue)" /><h3>Yarn Receive from Dyeing</h3><span className="badge badge-info">{filteredRecords.length} Records</span></div>
          <div className="section-card-actions"><div className="search-box"><Search size={16} /><input placeholder="Search gate pass, party, count..." value={search} onChange={event => setSearch(event.target.value)} /></div></div>
        </div>
        <div style={{ padding: '16px 20px' }}><button type="button" className="btn btn-primary" onClick={openModal}><Plus size={18} /> Record Yarn Receipt</button></div>
        <div className="table-responsive"><table className="data-table"><thead><tr><th>Gate Pass</th><th>Date</th><th>Party Gate Pass</th><th>Count</th><th>Tickit</th><th>Received (Kg)</th><th>Wastage (Kg)</th><th>Remarks</th><th>Actions</th></tr></thead><tbody>{loading ? <tr><td colSpan="9" style={{ textAlign: 'center', padding: '32px' }}><div className="spinner" style={{ margin: '0 auto' }} /></td></tr> : filteredRecords.length === 0 ? <tr><td colSpan="9" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-dim)' }}>No saved yarn receipts found.</td></tr> : filteredRecords.map(record => <tr key={record.yarnReceiveDyeingId}><td>{record.gatePassNo || '-'}</td><td>{record.receiveDate || '-'}</td><td>{record.partyGatePassNo || '-'}</td><td>{record.yarnOutDyeing?.count?.countName || '-'}</td><td>{record.yarnOutDyeing?.tickit?.tickitName || '-'}</td><td>{record.receivedWeight ?? '-'}</td><td>{record.wastage ?? '-'}</td><td>{record.remarks || '-'}</td><td><div style={{ display: 'flex', gap: '6px' }}><button type="button" className="btn-icon" onClick={() => openEditModal(record)} title="Edit receipt"><Edit2 size={16} /></button><button type="button" className="btn-icon" style={{ color: 'var(--accent-rose)' }} onClick={() => handleDelete(record)} title="Delete receipt"><Trash2 size={16} /></button></div></td></tr>)}</tbody></table></div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingRecord ? 'Edit Yarn Receive from Dyeing' : 'Record Yarn Receive from Dyeing'} size="lg">
        <form onSubmit={handleSubmit}><div className="dyeing-editor"><div className="dyeing-header-fields form-grid">
          <div className="form-group"><label>Party Gate Pass Number</label><input className="form-control" value={header.partyGatePassNo} onChange={event => updateHeader('partyGatePassNo', event.target.value)} placeholder="Enter dyer party gate pass number" /></div>
          <div className="form-group"><label>Gate Pass Number</label><input className="form-control" value={header.gatePassNo} readOnly placeholder="Selected from issue records" /></div>
          <div className="form-group"><label>Against Challan Number *</label><select className="form-control" value={header.gatePassNo} onChange={event => selectGatePass(event.target.value)} required><option value="">-- Select Yarn Issue Gate Pass --</option>{gatePassGroups.map(([gatePassNo, records]) => <option key={gatePassNo} value={gatePassNo}>{gatePassNo} ({records.length} row{records.length === 1 ? '' : 's'})</option>)}</select></div>
          <div className="form-group"><label>Receive Date *</label><input type="date" className="form-control" value={header.receiveDate} onChange={event => updateHeader('receiveDate', event.target.value)} required /></div>
        </div>
        <div className="dyeing-lines-header"><div><h4>Received Yarn Records</h4><span>Rows are filled from the selected yarn issue gate pass.</span></div></div>
        <div className="table-responsive"><table className="data-table dyeing-lines-table"><thead><tr><th>Sr. No.</th><th>Count</th><th>Tickit</th><th>Issued (Kg)</th><th>Received (Kg)</th><th>Remaining (Kg)</th><th>Wastage (Kg)</th></tr></thead><tbody>{lines.length === 0 ? <tr><td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-dim)' }}>Select an against challan to load yarn rows.</td></tr> : lines.map((line, index) => { const source = issueRecords.find(record => record.dyeingOutId === line.sourceId); const issued = numberValue(source?.weightKg); const remaining = Math.max(0, issued - previouslyConsumed(line.sourceId) - numberValue(line.receivedWeight) - numberValue(line.wastage)); return <tr key={line.sourceId}><td>{index + 1}</td><td>{source?.count?.countName || '-'}</td><td>{source?.tickit?.tickitName || '-'}</td><td>{issued.toFixed(3)}</td><td><input type="number" min="0" step="0.001" className="form-control" value={line.receivedWeight} onChange={event => updateLine(line.sourceId, 'receivedWeight', event.target.value)} placeholder="0.000" /></td><td>{remaining.toFixed(3)}</td><td><input type="number" min="0" step="0.001" className="form-control" value={line.wastage} onChange={event => updateLine(line.sourceId, 'wastage', event.target.value)} placeholder="0.000" /></td></tr>; })}</tbody></table></div>
        <div className="form-group dyeing-remark"><label>Remarks</label><textarea className="form-control" value={header.remarks} onChange={event => updateHeader('remarks', event.target.value)} placeholder="Enter remarks" /></div>
        <div className="dyeing-editor-actions"><button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Close</button><button type="submit" className="btn btn-primary" disabled={saving}><Save size={17} /> {saving ? 'Saving...' : 'Save Receipt'}</button></div></div></form>
      </Modal>
    </div>
  );
};
