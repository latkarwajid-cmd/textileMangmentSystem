import React, { useEffect, useMemo, useState } from 'react';
import { ArrowUpRight, Edit2, Plus, Save, Search, Trash2, Package } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { Modal } from '../components/Modal';
import { IssueYarnPickerModal } from '../components/IssueYarnPickerModal';

const today = () => new Date().toISOString().split('T')[0];
const emptyHeader = { gatePassNo: '', outDate: today(), orderId: '', firmName: '', dyeingUnitId: '', remark: '' };
const emptyLine = () => ({ key: '', sourceType: '', sourceId: null, setNo: '', serialLabel: '', countId: '', countName: '', tickitId: '', tickitName: '', bags: '', cone: '', weightKg: '' });

export const YarnOutDyeingView = () => {
  const { parties, fabricOrders, addToast } = useApp();
  const [records, setRecords] = useState([]);
  const [header, setHeader] = useState(emptyHeader);
  const [lines, setLines] = useState([]);
  const [stockRows, setStockRows] = useState([]);
  const [stockSearch, setStockSearch] = useState('');
  const [stockSourceFilter, setStockSourceFilter] = useState('all');
  const [loadingStock, setLoadingStock] = useState(false);
  const [issuePickerOpen, setIssuePickerOpen] = useState(false);
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
  const resetDraft = () => { setHeader({ ...emptyHeader, outDate: today() }); setLines([]); setStockRows([]); setIssuePickerOpen(false); };

  const fetchAvailableStock = async () => {
    setLoadingStock(true);
    try {
      const [yarnResult, sizingResult] = await Promise.allSettled([
        api.yarnInward.getAll(),
        api.sizingYarnInward.getAll(),
      ]);
      const yarnRows = (yarnResult.status === 'fulfilled' && Array.isArray(yarnResult.value) ? yarnResult.value : [])
        .filter(item => Number(item.bags || 0) > 0)
        .map(item => {
          const bags = Number(item.bags || 0);
          const weightKg = Number(item.weightKg || 0);
          return {
            key: `yarn-${item.yarnInwardId}`,
            sourceType: 'yarnIn', sourceLabel: 'Yarn In', type: 'FRESH',
            sourceId: item.yarnInwardId, id: item.yarnInwardId, setNo: '-',
            serialLabel: `YIn ${item.yarnInwardId}`,
            countId: item.count?.countId || '', countName: item.count?.countName || '-',
            tickitId: item.tickit?.tickitId || '', tickitName: item.tickit?.tickitName || '-',
            remainingBags: bags, cones: Number(item.yCone || 0),
            weightPerBag: Number(item.weightPerBag || (bags ? weightKg / bags : 0)),
            weightKg, inwardDate: item.inwardDate || '', checked: false, issueBags: '', issueCones: '',
          };
        });
      const sizingRows = (sizingResult.status === 'fulfilled' && Array.isArray(sizingResult.value) ? sizingResult.value : [])
        .filter(item => Number(item.bags || 0) > 0)
        .map(item => {
          const bags = Number(item.bags || 0);
          const weightKg = Number(item.weightKg || 0);
          return {
            key: `sizing-${item.sizingInwardId}`,
            sourceType: 'sizingIn', sourceLabel: 'Sizing In', type: 'FRESH',
            sourceId: item.sizingInwardId, id: item.sizingInwardId,
            setNo: item.sizingSet?.setNo || '-',
            serialLabel: `SIn ${item.sizingInwardId}`,
            countId: item.count?.countId || '', countName: item.count?.countName || '-',
            tickitId: item.tickit?.tickitId || '', tickitName: item.tickit?.tickitName || '-',
            remainingBags: bags, cones: 0,
            weightPerBag: bags ? weightKg / bags : 0,
            weightKg, inwardDate: item.inwardDate || '', checked: false, issueBags: '', issueCones: '0',
          };
        });
      if (yarnResult.status === 'rejected' && sizingResult.status === 'rejected') throw yarnResult.reason || sizingResult.reason;
      const rows = [...yarnRows, ...sizingRows];
      setStockRows(previous => {
        const byKey = new Map(previous.map(row => [row.key, row]));
        return rows.map(row => {
          const old = byKey.get(row.key);
          return old?.checked ? { ...row, checked: true, issueBags: old.issueBags, issueCones: old.issueCones } : row;
        });
      });
    } catch (error) {
      addToast(error.message || 'Failed to load available yarn stock', 'error');
    } finally {
      setLoadingStock(false);
    }
  };

  const updateStockRow = (key, field, value) => setStockRows(previous => previous.map(row => {
    if (row.key !== key) return row;
    if (field === 'checked') return {
      ...row,
      checked: value,
      issueBags: value ? String(row.remainingBags) : '',
      issueCones: value ? String(row.cones) : '',
    };
    const max = field === 'issueBags' ? row.remainingBags : row.cones;
    const amount = value === '' ? '' : String(Math.min(Math.max(Number(value) || 0, 0), Number(max || 0)));
    return { ...row, [field]: amount };
  }));

  const filteredStockRows = useMemo(() => {
    const query = stockSearch.trim().toLowerCase();
    return stockRows.filter(row => (
      (stockSourceFilter === 'all' || row.sourceType === stockSourceFilter) &&
      [row.serialLabel, row.setNo, row.countName, row.tickitName, row.inwardDate].some(value => String(value || '').toLowerCase().includes(query))
    ));
  }, [stockRows, stockSearch, stockSourceFilter]);

  const finishStockSelection = () => {
    const selected = stockRows.filter(row => row.checked && Number(row.issueBags) > 0);
    setLines(selected.map(row => ({
      ...emptyLine(),
      key: row.key, sourceType: row.sourceType, sourceId: row.sourceId, setNo: row.setNo,
      serialLabel: row.serialLabel, countId: row.countId, countName: row.countName,
      tickitId: row.tickitId, tickitName: row.tickitName,
      bags: row.issueBags, cone: row.issueCones || '0',
      weightKg: (Number(row.issueBags) * Number(row.weightPerBag || 0)).toFixed(3),
    })));
    setIssuePickerOpen(false);
  };
  const openModal = () => {
    resetDraft();
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
    const sourceType = record.sizingInwardId ? 'sizingIn' : record.yarnInwardId ? 'yarnIn' : '';
    const sourceId = record.sizingInwardId || record.yarnInwardId || null;
    setLines([{
      ...emptyLine(),
      key: `${sourceType}-${sourceId}`,
      sourceType,
      sourceId,
      setNo: record.setNo || record.sizingSet?.setNo || '-',
      serialLabel: sourceType === 'sizingIn' ? `SIn ${sourceId}` : sourceId ? `YIn ${sourceId}` : 'Legacy row',
      countId: record.count?.countId || '',
      countName: record.count?.countName || '-',
      tickitId: record.tickit?.tickitId || '',
      tickitName: record.tickit?.tickitName || '-',
      bags: record.bags ?? '', cone: record.cone ?? '', weightKg: record.weightKg ?? '',
    }]);
    setIsModalOpen(true);
  };

  const handleOrderChange = orderId => setHeader(previous => ({ ...previous, orderId, firmName: previous.firmName }));

  const handleSubmit = async event => {
    event.preventDefault();
    if (!header.gatePassNo.trim()) {
      addToast('Enter a gate pass number so dyeing receipts can be tracked', 'error');
      return;
    }
    if (!selectedOrder || !header.dyeingUnitId) {
      addToast('Select an order and dyeing unit before saving', 'error');
      return;
    }
    if (!lines.length) {
      addToast('Click Issue Yarn and select at least one stock row', 'error');
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
        yarnInwardId: line.sourceType === 'yarnIn' ? line.sourceId : null,
        sizingInwardId: line.sourceType === 'sizingIn' ? line.sourceId : null,
        setNo: line.setNo === '-' ? null : line.setNo,
        countId: line.countId || selectedOrder.count?.countId || editingRecord?.count?.countId || null,
        tickitId: line.tickitId || selectedOrder.tickit?.tickitId || editingRecord?.tickit?.tickitId || null,
        bags: line.bags ? Number(line.bags) : null,
        cone: line.cone ? Number(line.cone) : null,
        weightKg: line.weightKg ? Number(line.weightKg) : null,
        remark: header.remark || null,
      }));
      if (editingRecord) {
        await api.yarnOutDyeing.update(editingRecord.dyeingOutId, payloads[0]);
        addToast('Yarn dyeing row updated successfully', 'success');
      } else {
        await api.yarnOutDyeing.createBatch(payloads);
        addToast(`${payloads.length} yarn dyeing row${payloads.length === 1 ? '' : 's'} saved successfully`, 'success');
      }
      resetDraft();
      setEditingRecord(null);
      setIsModalOpen(false);
      await fetchRecords();
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
      await fetchRecords();
    } catch (error) {
      addToast(error.message || 'Failed to delete yarn dyeing row', 'error');
    }
  };

  const filteredRecords = records.filter(record => [
    record.gatePassNo, record.order?.orderNo, record.setNo, record.firmName, record.party?.partyName,
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
          <table className="data-table"><thead><tr><th>Gate Pass</th><th>Date</th><th>Order No.</th><th>Set No</th><th>Firm</th><th>Dyeing Unit</th><th>Count</th><th>Tickit</th><th>Bags</th><th>Cones</th><th>Weight</th><th>Remarks</th><th>Actions</th></tr></thead>
            <tbody>{loading ? <tr><td colSpan="13" style={{ textAlign: 'center', padding: '32px' }}><div className="spinner" style={{ margin: '0 auto' }} /></td></tr> : filteredRecords.length === 0 ? <tr><td colSpan="13" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-dim)' }}>No saved yarn out dyeing records found.</td></tr> : filteredRecords.map(record => <tr key={record.dyeingOutId}><td>{record.gatePassNo || '-'}</td><td>{record.outDate || '-'}</td><td>{record.order?.orderNo || '-'}</td><td>{record.setNo || '-'}</td><td>{record.firmName || '-'}</td><td>{record.party?.partyName || '-'}</td><td>{record.count?.countName || '-'}</td><td>{record.tickit?.tickitName || '-'}</td><td>{record.bags ?? '-'}</td><td>{record.cone ?? '-'}</td><td>{record.weightKg ? `${record.weightKg} kg` : '-'}</td><td>{record.remark || '-'}</td><td><div style={{ display: 'flex', gap: '6px' }}><button type="button" className="btn-icon" onClick={() => openEditModal(record)} title="Edit row"><Edit2 size={16} /></button><button type="button" className="btn-icon" style={{ color: 'var(--accent-rose)' }} onClick={() => handleDelete(record)} title="Delete row"><Trash2 size={16} /></button></div></td></tr>)}</tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingRecord ? `Edit Yarn Out #${editingRecord.dyeingOutId}` : 'Record New Yarn Out for Dyeing'} size="lg">
        <form onSubmit={handleSubmit}>
          <div className="dyeing-editor">
            <div className="dyeing-header-fields form-grid">
              <div className="form-group"><label>Gate Pass No. *</label><input className="form-control" value={header.gatePassNo} onChange={event => updateHeader('gatePassNo', event.target.value)} placeholder="Enter gate pass number" required /></div>
              <div className="form-group"><label>Date *</label><input type="date" className="form-control" value={header.outDate} onChange={event => updateHeader('outDate', event.target.value)} required /></div>
              <div className="form-group"><label>Firm Name</label><input className="form-control" value={header.firmName} onChange={event => updateHeader('firmName', event.target.value)} placeholder="Enter firm name" /></div>
              <div className="form-group"><label>Order No. *</label><select className="form-control" value={header.orderId} onChange={event => handleOrderChange(event.target.value)} required><option value="">-- Select Order --</option>{fabricOrders.map(order => <option key={order.orderId} value={order.orderId}>{order.orderNo}</option>)}</select></div>
              <div className="form-group"><label>Dyeing Unit Name *</label><select className="form-control" value={header.dyeingUnitId} onChange={event => updateHeader('dyeingUnitId', event.target.value)} required><option value="">-- Select Dyeing Unit --</option>{dyers.map(dyer => <option key={dyer.partyId} value={dyer.partyId}>{dyer.partyName}</option>)}</select></div>
            </div>
            <div className="dyeing-lines-header">
              <div><h4>Yarn Records</h4><span>Choose stock using Issue Yarn. Quantities are taken from selected stock.</span></div>
              {!editingRecord && <button type="button" className="btn btn-secondary" onClick={async () => {
                setStockSearch('');
                setStockSourceFilter('all');
                setIssuePickerOpen(true);
                await fetchAvailableStock();
              }}><Package size={16} /> Issue Yarn</button>}
            </div>
            <div className="table-responsive"><table className="data-table dyeing-lines-table"><thead><tr><th>Sr. No.</th><th>Set No</th><th>Serial</th><th>Count</th><th>Tickit</th><th>Bags</th><th>Cones</th><th>Weight (Kg)</th></tr></thead><tbody>{lines.length === 0 ? <tr><td colSpan="8" style={{ textAlign: 'center', color: 'var(--text-dim)' }}>Click Issue Yarn to select available stock.</td></tr> : lines.map((line, index) => <tr key={line.key || index}><td>{index + 1}</td><td>{line.setNo || '-'}</td><td>{line.serialLabel || '-'}</td><td>{line.countName || '-'}</td><td>{line.tickitName || '-'}</td><td>{line.bags}</td><td>{line.cone}</td><td>{line.weightKg}</td></tr>)}</tbody></table></div>
            <IssueYarnPickerModal
              isOpen={issuePickerOpen}
              onClose={() => setIssuePickerOpen(false)}
              rows={filteredStockRows}
              loading={loadingStock}
              search={stockSearch}
              onSearchChange={setStockSearch}
              sourceFilter={stockSourceFilter}
              onSourceFilterChange={setStockSourceFilter}
              onToggle={(key, checked) => updateStockRow(key, 'checked', checked)}
              onBagsChange={(key, value) => updateStockRow(key, 'issueBags', value)}
              onConesChange={(key, value) => updateStockRow(key, 'issueCones', value)}
              onDone={finishStockSelection}
              showSetNo
            />
            <div className="form-group dyeing-remark"><label>Remarks</label><textarea className="form-control" value={header.remark} onChange={event => updateHeader('remark', event.target.value)} placeholder="Example: 500 kg for blue, 200 kg for red..." /></div>
            <div className="dyeing-editor-actions"><button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Close</button><button type="button" className="btn btn-secondary" onClick={resetDraft}>Clear Draft</button><button type="submit" className="btn btn-primary" disabled={saving}><Save size={17} /> {saving ? 'Saving...' : editingRecord ? 'Update Yarn Out' : 'Save Yarn Out'}</button></div>
          </div>
        </form>
      </Modal>
    </div>
  );
};
