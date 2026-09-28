import React, { useEffect, useMemo, useState } from 'react';
import { ArrowUpRight, Edit2, Plus, Save, Search, Trash2, Package } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { Modal } from '../components/Modal';
import { IssueYarnPickerModal } from '../components/IssueYarnPickerModal';

const today = () => new Date().toISOString().split('T')[0];
const emptyHeader = { gatePassNo: '', outDate: today(), orderId: '', firmName: '', dyeingUnitId: '', remark: '' };
const emptyLine = () => ({ key: '', sourceType: '', sourceId: null, setNo: '', serialLabel: '', countId: '', countName: '', tickitId: '', tickitName: '', bags: '', availableBags: '', cone: '', weightKg: '', targetShade: '', dyeingType: 'Cone Dyeing' });

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
  const [splitSourceLine, setSplitSourceLine] = useState(null);
  const [splitDrafts, setSplitDrafts] = useState([]);

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
  const resetDraft = () => { setHeader({ ...emptyHeader, outDate: today() }); setLines([]); setStockRows([]); setIssuePickerOpen(false); setSplitSourceLine(null); setSplitDrafts([]); };

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
      bags: row.issueBags, availableBags: row.remainingBags, cone: row.issueCones || '0',
      weightKg: (Number(row.issueBags) * Number(row.weightPerBag || 0)).toFixed(3),
      targetShade: '', dyeingType: 'Cone Dyeing',
      originalBags: Number(row.issueBags), originalWeightKg: Number(row.issueBags) * Number(row.weightPerBag || 0),
    })));
    setIssuePickerOpen(false);
  };

  const openSplitEditor = line => {
    setSplitSourceLine(line);
    setSplitDrafts([{
      bags: '',
      weightKg: '',
      cone: '',
      targetShade: '',
      dyeingType: 'Cone Dyeing',
    }]);
  };

  const updateSplitDraft = (index, field, value) => {
    setSplitDrafts(previous => previous.map((row, rowIndex) => {
      if (rowIndex !== index) return row;
      if (field === 'bags' && value !== '' && splitSourceLine) {
        const totalBags = Number(splitSourceLine.originalBags ?? splitSourceLine.bags ?? 0);
        const totalWeight = Number(splitSourceLine.originalWeightKg ?? splitSourceLine.weightKg ?? 0);
        const totalCones = Number(splitSourceLine.cone || 0);
        const weightPerBag = totalBags > 0 ? totalWeight / totalBags : 0;
        const conesPerBag = totalBags > 0 ? totalCones / totalBags : 0;
        return { ...row, bags: value, weightKg: (Number(value) * weightPerBag).toFixed(3), cone: (Number(value) * conesPerBag).toFixed(3) };
      }
      return { ...row, [field]: value };
    }));
  };

  const splitBalance = useMemo(() => {
    const totalBags = Number(splitSourceLine?.originalBags ?? splitSourceLine?.bags ?? 0);
    const totalWeight = Number(splitSourceLine?.originalWeightKg ?? splitSourceLine?.weightKg ?? 0);
    const totalCones = Number(splitSourceLine?.cone || 0);
    const allocatedBags = splitDrafts.reduce((sum, row) => sum + (Number(row.bags) || 0), 0);
    const allocatedWeight = splitDrafts.reduce((sum, row) => sum + (Number(row.weightKg) || 0), 0);
    const allocatedCones = splitDrafts.reduce((sum, row) => sum + (Number(row.cone) || 0), 0);
    return {
      bags: totalBags - allocatedBags,
      weight: totalWeight - allocatedWeight,
      cones: totalCones - allocatedCones,
      balanced: Math.abs(totalBags - allocatedBags) <= 0.000001 && Math.abs(totalWeight - allocatedWeight) <= 0.000001 && Math.abs(totalCones - allocatedCones) <= 0.000001,
    };
  }, [splitSourceLine, splitDrafts]);

  const confirmSplit = () => {
    if (!splitSourceLine) return;
    const expectedBags = Number(splitSourceLine.originalBags ?? splitSourceLine.bags ?? 0);
    const expectedWeight = Number(splitSourceLine.originalWeightKg ?? splitSourceLine.weightKg ?? 0);
    const expectedCones = Number(splitSourceLine.cone || 0);
    const actualBags = splitDrafts.reduce((sum, row) => sum + (Number(row.bags) || 0), 0);
    const actualWeight = splitDrafts.reduce((sum, row) => sum + (Number(row.weightKg) || 0), 0);
    const actualCones = splitDrafts.reduce((sum, row) => sum + (Number(row.cone) || 0), 0);
    if (Math.abs(actualBags - expectedBags) > 0.000001 || Math.abs(actualWeight - expectedWeight) > 0.000001 || Math.abs(actualCones - expectedCones) > 0.000001) {
      addToast(`Split totals must equal ${expectedBags} bags, ${expectedCones} cones, and ${expectedWeight.toFixed(3)} kg`, 'error');
      return;
    }
    if (splitDrafts.some(row => !row.targetShade.trim() || Number(row.bags) <= 0 || Number(row.weightKg) <= 0)) {
      addToast('Every split row needs a shade, bags, and gross weight', 'error');
      return;
    }
    const replacement = splitDrafts.map((row, index) => ({
      ...splitSourceLine,
      key: `${splitSourceLine.key}-split-${Date.now()}-${index}`,
      bags: row.bags,
      cone: row.cone,
      weightKg: Number(row.weightKg).toFixed(3),
      targetShade: row.targetShade,
      dyeingType: row.dyeingType,
      isSplit: true,
    }));
    setLines(previous => previous.flatMap(line => line.key === splitSourceLine.key ? replacement : [line]));
    setSplitSourceLine(null);
    setSplitDrafts([]);
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
      availableBags: record.bags ?? '', targetShade: record.targetShade || '', dyeingType: record.dyeingType || 'Cone Dyeing',
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

    const invalidLine = lines.find(line => Number(line.bags || 0) <= 0 || Number(line.bags) > Number(line.availableBags || line.bags));
    if (invalidLine) {
      addToast(`Issued bags must be between 1 and ${invalidLine.availableBags || invalidLine.bags}`, 'error');
      return;
    }
    const splitTotals = lines.reduce((map, line) => {
      const sourceKey = line.sourceType + '-' + line.sourceId;
      const current = map.get(sourceKey) || { bags: 0, weight: 0, expectedBags: Number(line.originalBags || line.bags || 0), expectedWeight: Number(line.originalWeightKg || line.weightKg || 0) };
      current.bags += Number(line.bags || 0);
      current.weight += Number(line.weightKg || 0);
      map.set(sourceKey, current);
      return map;
    }, new Map());
    for (const totals of splitTotals.values()) {
      if (Math.abs(totals.bags - totals.expectedBags) > 0.000001 || Math.abs(totals.weight - totals.expectedWeight) > 0.000001) {
        addToast('Each color split must total exactly the original bags and weight', 'error');
        return;
      }
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
        targetShade: line.targetShade?.trim() || null,
        dyeingType: line.dyeingType || 'Cone Dyeing',
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
          <table className="data-table"><thead><tr><th>Gate Pass</th><th>Date</th><th>Order No.</th><th>Set No</th><th>Firm</th><th>Dyeing Unit</th><th>Count</th><th>Tickit</th><th>Bags</th><th>Cones</th><th>Weight</th><th>Target Shade</th><th>Dyeing Type</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>{loading ? <tr><td colSpan="15" style={{ textAlign: 'center', padding: '32px' }}><div className="spinner" style={{ margin: '0 auto' }} /></td></tr> : filteredRecords.length === 0 ? <tr><td colSpan="15" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-dim)' }}>No saved yarn out dyeing records found.</td></tr> : filteredRecords.map(record => <tr key={record.dyeingOutId}><td>{record.gatePassNo || '-'}</td><td>{record.outDate || '-'}</td><td>{record.order?.orderNo || '-'}</td><td>{record.setNo || '-'}</td><td>{record.firmName || '-'}</td><td>{record.party?.partyName || '-'}</td><td>{record.count?.countName || '-'}</td><td>{record.tickit?.tickitName || '-'}</td><td>{record.bags ?? '-'}</td><td>{record.cone ?? '-'}</td><td>{record.weightKg ? `${record.weightKg} kg` : '-'}</td><td>{record.targetShade || '-'}</td><td>{record.dyeingType || '-'}</td><td>{record.status || 'Active at Dyeing Unit'}</td><td><div style={{ display: 'flex', gap: '6px' }}><button type="button" className="btn-icon" onClick={() => openEditModal(record)} title="Edit row"><Edit2 size={16} /></button><button type="button" className="btn-icon" style={{ color: 'var(--accent-rose)' }} onClick={() => handleDelete(record)} title="Delete row"><Trash2 size={16} /></button></div></td></tr>)}</tbody>
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
            <div className="table-responsive"><table className="data-table dyeing-lines-table"><thead><tr><th>Sr. No.</th><th>Count & Ticket</th><th>Issued Bags</th><th>Cones</th><th>Gross Weight (Kg)</th><th>Target Shade / Color Code</th><th>Dyeing Type</th><th>Action</th></tr></thead><tbody>{lines.length === 0 ? <tr><td colSpan="8" style={{ textAlign: 'center', color: 'var(--text-dim)' }}>Click Issue Yarn to select available stock.</td></tr> : lines.map((line, index) => <tr key={line.key || index}><td>{index + 1}{line.isSplit && <span className="badge badge-subtle" style={{ marginLeft: 4 }}>Split</span>}</td><td>{[line.countName, line.tickitName].filter(Boolean).join(' ') || '-'}</td><td>{line.bags}</td><td>{line.cone}</td><td>{line.weightKg}</td><td><input className="form-control" value={line.targetShade} onChange={event => setLines(previous => previous.map((item, lineIndex) => lineIndex === index ? { ...item, targetShade: event.target.value } : item))} placeholder="e.g. Navy 001" /></td><td><select className="form-control" value={line.dyeingType} onChange={event => setLines(previous => previous.map((item, lineIndex) => lineIndex === index ? { ...item, dyeingType: event.target.value } : item))}><option>Cone Dyeing</option><option>Hank Dyeing</option></select></td><td><div style={{ display: 'flex', gap: 4 }}><button type="button" className="btn-icon" title="Split by color" onClick={() => openSplitEditor(line)}>+</button><button type="button" className="btn-icon" title="Remove row" onClick={() => setLines(previous => previous.filter((_, lineIndex) => lineIndex !== index))}><Trash2 size={15} /></button></div></td></tr>)}</tbody></table></div>
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
            <div className="form-group dyeing-remark"><label>Remarks</label><textarea className="form-control" value={header.remark} onChange={event => updateHeader('remark', event.target.value)} placeholder="General dispatch remarks" /></div>
            <div className="dyeing-editor-actions"><button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Close</button><button type="button" className="btn btn-secondary" onClick={resetDraft}>Clear Draft</button><button type="submit" className="btn btn-primary" disabled={saving}><Save size={17} /> {saving ? 'Saving...' : editingRecord ? 'Update Yarn Out' : 'Save Yarn Out'}</button></div>
          </div>
        </form>
      </Modal>

      <Modal isOpen={Boolean(splitSourceLine)} onClose={() => { setSplitSourceLine(null); setSplitDrafts([]); }} title="Split Yarn Lot by Color" size="lg">
        {splitSourceLine && <div>
          <div style={{ marginBottom: 14, color: 'var(--text-muted)' }}>Allocate exactly {splitSourceLine.originalBags ?? splitSourceLine.bags} bags and {Number(splitSourceLine.originalWeightKg ?? splitSourceLine.weightKg).toFixed(3)} kg across the color rows.</div>
          <div style={{ marginBottom: 14, padding: '10px 12px', borderRadius: 6, background: splitBalance.balanced ? '#ecfdf5' : '#fff7ed', color: splitBalance.balanced ? '#047857' : '#c2410c', fontWeight: 700 }}>Unallocated Bags: {splitBalance.bags.toFixed(3)} | Unallocated Cones: {splitBalance.cones.toFixed(3)} | Unallocated Weight: {splitBalance.weight.toFixed(3)} Kg</div>
          <div className="table-responsive"><table className="data-table"><thead><tr><th>Bags</th><th>Cones</th><th>Gross Weight (Kg)</th><th>Target Shade</th><th>Dyeing Type</th><th>Action</th></tr></thead><tbody>{splitDrafts.map((row, index) => <tr key={index}><td><input type="number" min="0" step="0.001" className="form-control" value={row.bags} onChange={event => updateSplitDraft(index, 'bags', event.target.value)} /></td><td><input type="number" min="0" step="0.001" className="form-control" value={row.cone} onChange={event => updateSplitDraft(index, 'cone', event.target.value)} /></td><td><input type="number" min="0" step="0.001" className="form-control" value={row.weightKg} onChange={event => updateSplitDraft(index, 'weightKg', event.target.value)} /></td><td><input className="form-control" value={row.targetShade} onChange={event => updateSplitDraft(index, 'targetShade', event.target.value)} placeholder="e.g. Royal Blue" /></td><td><select className="form-control" value={row.dyeingType} onChange={event => updateSplitDraft(index, 'dyeingType', event.target.value)}><option>Cone Dyeing</option><option>Hank Dyeing</option></select></td><td><button type="button" className="btn-icon" onClick={() => setSplitDrafts(previous => previous.length === 1 ? previous : previous.filter((_, rowIndex) => rowIndex !== index))}><Trash2 size={15} /></button></td></tr>)}</tbody></table></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 14 }}><button type="button" className="btn btn-secondary" onClick={() => setSplitDrafts(previous => [...previous, { bags: '', cone: '', weightKg: '', targetShade: '', dyeingType: 'Cone Dyeing' }])}>Add Color Row</button><button type="button" className="btn btn-primary" onClick={confirmSplit} disabled={!splitBalance.balanced}>Apply Color Split</button></div>
        </div>}
      </Modal>
    </div>
  );
};
