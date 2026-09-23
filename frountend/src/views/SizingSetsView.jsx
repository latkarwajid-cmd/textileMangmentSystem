import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  Plus,
  Search,
  Layers,
  Edit2,
  Trash2,
  ArrowLeft,
  Loader2,
  Lock,
  Package,
  Calendar,
  Building2,
  FileText,
  Tag,
  Hash,
  CheckCircle2,
  Info
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';

const FROM_OPTIONS = ['Gate Pass', 'Warehouse', 'Sizing', 'Dyeing', 'Other'];
const CONDITION_OPTIONS = ['Fresh', 'Winding'];
const PART_SUGGESTIONS = ['Part 1', 'Part 2', 'Part 3', 'Part 4', 'Part 5'];

const formatDate = (date) => {
  if (!date) return '';
  if (Array.isArray(date)) {
    const [y, m, d] = date;
    return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  }
  return String(date).substring(0, 10);
};

const today = () => new Date().toISOString().split('T')[0];

const createEmptyLine = () => ({
  key: `line-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  sourceFrom: 'Warehouse',
  freshWinding: 'Fresh',
  countId: '',
  countName: '',
  tickitId: '',
  tickitName: '',
  bags: '',
  cones: '',
  weightKg: '',
  remark: '',
  yarnInwardId: '',
});

const toNumberOrNull = (value) => {
  if (value === '' || value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

const nextSetNoFromList = (existingSets = []) => {
  let maxNumber = 0;
  existingSets.forEach(item => {
    // Skip soft-deleted records so they don't inflate the counter
    if ((item?.status || '').toUpperCase() === 'DELETED') return;
    const match = String(item?.setNo || '').match(/(\d+)$/);
    if (match) {
      const parsed = Number(match[1]);
      if (!Number.isNaN(parsed) && parsed > maxNumber) maxNumber = parsed;
    }
  });
  // 2-digit padding: single digit gets one leading zero (SET-01), 10+ no extra zeros
  return `SET-${String(maxNumber + 1).padStart(2, '0')}`;
};

const createEmptyHeader = () => ({
  setNo: '',
  setDate: today(),
  orderNo: '',
  orderId: '',
  partyId: '',
  firmName: '',
  quality: '',
  totalEnds: '',
  cone: '',
  partNo: 'Part 1',
  lasa: '',
  countId: '',
  tickitId: '',
  status: 'OPEN',
});

export const SizingSetsView = () => {
  const { fabricOrders, tickits, yarnCounts, addToast } = useApp();
  const openOrders = useMemo(
    () => fabricOrders.filter(order => (order.status || 'OPEN').toUpperCase() !== 'CLOSED' && !order.complete),
    [fabricOrders]
  );

  const [sizingSets, setSizingSets] = useState([]);
  const [gatePassLots, setGatePassLots] = useState([]);
  const [loadingLots, setLoadingLots] = useState(false);
  const [loadingSets, setLoadingSets] = useState(false);
  const [loadingOrderDetails, setLoadingOrderDetails] = useState(false);

  const [search, setSearch] = useState('');
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingSet, setEditingSet] = useState(null);
  const [saving, setSaving] = useState(false);

  const [header, setHeader] = useState(createEmptyHeader());
  const [yarnLines, setYarnLines] = useState([createEmptyLine()]);

  const fetchSizingSets = useCallback(async () => {
    setLoadingSets(true);
    try {
      const data = await api.sizingSets.getAll();
      setSizingSets(Array.isArray(data) ? data.filter(item => item.status !== 'DELETED') : []);
    } catch (err) {
      addToast(err.message || 'Failed to fetch sizing sets', 'error');
    } finally {
      setLoadingSets(false);
    }
  }, [addToast]);

  const fetchGatePassLots = useCallback(async () => {
    setLoadingLots(true);
    try {
      const lots = await api.gatePasses.getActiveYarn();
      setGatePassLots(Array.isArray(lots) ? lots : []);
      return lots;
    } catch (err) {
      console.warn('Could not load gate passes:', err);
      return [];
    } finally {
      setLoadingLots(false);
    }
  }, []);

  useEffect(() => {
    fetchSizingSets();
  }, []);

  // Real-time reactive footer totals
  const totals = useMemo(() => {
    return yarnLines.reduce(
      (acc, line) => ({
        bags: acc.bags + (Math.max(0, parseInt(line.bags, 10) || 0)),
        cones: acc.cones + (Math.max(0, parseInt(line.cones, 10) || 0)),
        weightKg: acc.weightKg + (Math.max(0, parseFloat(line.weightKg) || 0)),
      }),
      { bags: 0, cones: 0, weightKg: 0 }
    );
  }, [yarnLines]);

  const filteredSets = useMemo(() => {
    const searchText = search.toLowerCase().trim();
    if (!searchText) return sizingSets;
    return sizingSets.filter(item => (
      item.setNo?.toLowerCase().includes(searchText) ||
      item.order?.orderNo?.toLowerCase().includes(searchText) ||
      item.party?.partyName?.toLowerCase().includes(searchText) ||
      item.quality?.toLowerCase().includes(searchText) ||
      item.partNo?.toLowerCase().includes(searchText)
    ));
  }, [sizingSets, search]);

  const updateHeader = (field, value) => {
    setHeader(prev => ({ ...prev, [field]: value }));
  };

  const openCreateEditor = async () => {
    setEditingSet(null);
    const next = createEmptyHeader();
    next.setNo = nextSetNoFromList(sizingSets);

    // Asynchronously get official next-set-no from database
    try {
      const response = await api.sizingSets.nextSetNo();
      if (response?.setNo) next.setNo = response.setNo;
    } catch {
      // Keep client computed set number
    }

    setHeader(next);
    setYarnLines([createEmptyLine()]);
    setEditorOpen(true);
    fetchGatePassLots();
  };

  const openEditEditor = async (sizingSet) => {
    setEditingSet(sizingSet);
    setHeader({
      setNo: sizingSet.setNo || '',
      setDate: formatDate(sizingSet.setDate || sizingSet.outDate) || today(),
      orderNo: sizingSet.order?.orderNo || '',
      orderId: sizingSet.order?.orderId || '',
      partyId: sizingSet.party?.partyId || '',
      firmName: sizingSet.party?.partyName || '',
      quality: sizingSet.quality || '',
      totalEnds: sizingSet.totalEnds ?? '',
      cone: sizingSet.cone ?? '',
      partNo: sizingSet.partNo || 'Part 1',
      lasa: sizingSet.lasa || '',
      countId: sizingSet.count?.countId || '',
      tickitId: sizingSet.tickit?.tickitId || '',
      status: sizingSet.status || 'OPEN',
    });

    const lines = Array.isArray(sizingSet.yarnLines) && sizingSet.yarnLines.length > 0
      ? sizingSet.yarnLines
          .slice()
          .sort((a, b) => (a.srNo || 0) - (b.srNo || 0))
          .map(line => ({
            key: `line-${line.yarnLineId || Math.random()}`,
            sourceFrom: line.sourceFrom || 'Warehouse',
            freshWinding: line.freshWinding || 'Fresh',
            countId: line.count?.countId || '',
            countName: line.count?.countName || '',
            tickitId: line.tickit?.tickitId || '',
            tickitName: line.tickit?.tickitName || '',
            bags: line.bags ?? '',
            cones: line.cones ?? '',
            weightKg: line.weightKg ?? '',
            remark: line.remark || '',
            yarnInwardId: line.yarnInward?.yarnInwardId || '',
          }))
      : [createEmptyLine()];

    setYarnLines(lines);
    setEditorOpen(true);
    fetchGatePassLots();
  };

  // Rule: When user selects Order No -> dispatch GET /api/orders/{orderNo}/details
  // and auto-fill Firm, Quality, Total Ends, Cone without page reload
  const handleOrderChange = async (orderNo) => {
    setHeader(prev => ({
      ...prev,
      orderNo,
      orderId: '',
      partyId: '',
      firmName: '',
      quality: '',
      totalEnds: '',
      cone: '',
    }));

    if (!orderNo) return;

    setLoadingOrderDetails(true);
    try {
      const details = await api.fabricOrderDetails.getByOrderNo(orderNo);
      setHeader(prev => ({
        ...prev,
        orderNo: details.orderNo || orderNo,
        orderId: details.orderId || '',
        partyId: details.partyId || '',
        firmName: details.customerName || '',
        quality: details.quality || '',
        totalEnds: details.totalEnds ?? '',
        cone: details.cone ?? prev.cone,
        countId: details.countId || prev.countId,
        tickitId: details.tickitId || prev.tickitId,
      }));
      addToast(`Order ${details.orderNo || orderNo} details loaded`, 'info');
    } catch (err) {
      // Fallback to local fabric orders master if offline or endpoint error
      const local = openOrders.find(item => item.orderNo?.trim().toLowerCase() === orderNo.trim().toLowerCase());
      if (local) {
        setHeader(prev => ({
          ...prev,
          orderId: local.orderId || '',
          partyId: local.party?.partyId || '',
          firmName: local.party?.partyName || '',
          quality: local.quality || '',
          countId: local.count?.countId || '',
          tickitId: local.tickit?.tickitId || '',
        }));
      } else {
        addToast(err.message || 'Could not load order details', 'error');
      }
    } finally {
      setLoadingOrderDetails(false);
    }
  };

  const updateLine = (key, field, value) => {
    setYarnLines(prev => prev.map(line => {
      if (line.key !== key) return line;

      const next = { ...line, [field]: value };

      // Rule A / Rule B: If Source changes
      if (field === 'sourceFrom') {
        if (value === 'Gate Pass') {
          if (gatePassLots.length === 0) {
            fetchGatePassLots();
          }
        } else {
          next.yarnInwardId = '';
        }
      }

      return next;
    }));
  };

  // When Gate Pass lot selected: autofill Count, Tickit, Bags, and Weight, but user can freely edit
  const applyGatePassLot = (key, yarnInwardId) => {
    const lot = gatePassLots.find(item => String(item.yarnInwardId) === String(yarnInwardId));
    setYarnLines(prev => prev.map(line => {
      if (line.key !== key) return line;

      if (!yarnInwardId) {
        return {
          ...line,
          yarnInwardId: '',
        };
      }

      return {
        ...line,
        yarnInwardId,
        countId: lot?.countId ? String(lot.countId) : line.countId,
        countName: lot?.countName || line.countName,
        tickitId: lot?.tickitId ? String(lot.tickitId) : line.tickitId,
        tickitName: lot?.tickitName || line.tickitName,
        // Auto-default bags and weight if current row values are empty or 0
        bags: line.bags === '' || Number(line.bags) === 0 ? (lot?.bags ?? line.bags) : line.bags,
        weightKg: line.weightKg === '' || Number(line.weightKg) === 0 ? (lot?.weightKg ?? line.weightKg) : line.weightKg,
      };
    }));
  };

  const addRow = () => {
    setYarnLines(prev => [...prev, createEmptyLine()]);
  };

  const removeRow = (key) => {
    setYarnLines(prev => (prev.length <= 1 ? prev : prev.filter(line => line.key !== key)));
  };

  const validateNumbers = () => {
    for (let i = 0; i < yarnLines.length; i++) {
      const line = yarnLines[i];
      if (Number(line.bags) < 0 || Number(line.cones) < 0 || Number(line.weightKg) < 0) {
        addToast(`Row #${i + 1}: Bags, Cones, and Weight cannot be negative`, 'error');
        return false;
      }
    }
    if (header.totalEnds && Number(header.totalEnds) < 0) {
      addToast('Total Ends cannot be negative', 'error');
      return false;
    }
    if (header.cone && Number(header.cone) < 0) {
      addToast('Cone value cannot be negative', 'error');
      return false;
    }
    return true;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!header.setNo || !header.setNo.trim()) {
      addToast('Set number is required', 'error');
      return;
    }
    if (!validateNumbers()) return;

    const payload = {
      setNo: header.setNo.trim(),
      setDate: header.setDate,
      outDate: header.setDate,
      orderId: toNumberOrNull(header.orderId),
      partyId: toNumberOrNull(header.partyId),
      quality: header.quality || null,
      totalEnds: toNumberOrNull(header.totalEnds),
      cone: toNumberOrNull(header.cone),
      partNo: header.partNo || null,
      lasa: header.lasa || null,
      countId: toNumberOrNull(header.countId),
      tickitId: toNumberOrNull(header.tickitId),
      bags: totals.bags || null,
      coneSummary: totals.cones || null,
      weightKg: totals.weightKg || null,
      status: header.status || 'OPEN',
      yarnLines: yarnLines.map((line, index) => ({
        srNo: index + 1,
        sourceFrom: line.sourceFrom,
        freshWinding: line.freshWinding,
        countId: toNumberOrNull(line.countId),
        tickitId: toNumberOrNull(line.tickitId),
        bags: toNumberOrNull(line.bags),
        cones: toNumberOrNull(line.cones),
        weightKg: toNumberOrNull(line.weightKg),
        remark: line.remark ? line.remark.trim() : null,
        yarnInwardId: toNumberOrNull(line.yarnInwardId),
      })),
    };

    setSaving(true);
    try {
      if (editingSet) {
        await api.sizingSets.update(editingSet.sizingSetId, payload);
        addToast('Sizing set updated successfully', 'success');
      } else {
        await api.sizingSets.create(payload);
        addToast('Sizing set created successfully', 'success');
      }
      setEditorOpen(false);
      setEditingSet(null);
      await fetchSizingSets();
    } catch (err) {
      addToast(err.message || 'Error saving sizing set', 'error');
    } finally {
      setSaving(false);
    }
  };

<<<<<<< Updated upstream
  const handleDelete = async (sizingSet) => {
    if (!sizingSet) return;
    if (!window.confirm(`Are you sure you want to delete Sizing Set ${sizingSet.setNo}?`)) {
      return;
    }
    // Optimistically remove from UI immediately
    setSizingSets(prev => prev.filter(s => s.sizingSetId !== sizingSet.sizingSetId));
    try {
      await api.sizingSets.delete(sizingSet.sizingSetId);
      addToast(`Sizing set ${sizingSet.setNo} deleted`, 'success');
    } catch (err) {
      // On failure, do a proper refetch to restore the list in correct order
      addToast(err.message || 'Failed to delete sizing set', 'error');
      await fetchSizingSets();
    }
  };
=======

>>>>>>> Stashed changes

  const isGatePass = (line) => line.sourceFrom === 'Gate Pass';

  // ----------------------------------------------------
  // RENDER: EDITOR (Top Card Details + Bottom Record Grid)
  // ----------------------------------------------------
  if (editorOpen) {
    return (
      <div className="content-area">
        <form onSubmit={handleSubmit}>
          {/* TOP SECTION: Header Details Card */}
          <div className="section-card">
            <div className="section-card-header">
              <div className="section-card-title">
                <Layers size={22} color="var(--primary-blue)" />
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700 }}>
                    {editingSet ? `Edit Sizing Set: ${header.setNo}` : 'Create Sizing Set'}
                  </h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Set metadata & order construction specification
                  </span>
                </div>
              </div>
              <div className="section-card-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setEditorOpen(false)}
                >
                  <ArrowLeft size={16} />
                  <span>Cancel / Back</span>
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={16} />
                      <span>{editingSet ? 'Update Sizing Set' : 'Save Sizing Set'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="form-grid-4" style={{ marginTop: '12px' }}>
              {/* Set No */}
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Hash size={13} color="var(--primary-blue)" />
                  <span>Set No</span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-light)' }}>(Auto / Editable)</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={header.setNo}
                  onChange={e => updateHeader('setNo', e.target.value)}
                  placeholder="e.g. SET-0001"
                  style={{ fontWeight: 600, color: 'var(--primary-blue-dark)' }}
                />
              </div>

              {/* Date */}
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Calendar size={13} color="var(--primary-blue)" />
                  <span>Date</span>
                </label>
                <input
                  type="date"
                  className="form-control"
                  value={header.setDate}
                  onChange={e => updateHeader('setDate', e.target.value)}
                  required
                />
              </div>

              {/* Order No */}
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <FileText size={13} color="var(--primary-blue)" />
                  <span>Order No</span>
                  {loadingOrderDetails && <Loader2 size={13} className="animate-spin" color="var(--primary-blue)" />}
                </label>
                <select
                  className="form-control"
                  value={header.orderNo}
                  onChange={e => handleOrderChange(e.target.value)}
                >
                  <option value="">-- Select Order --</option>
                  {header.orderNo && !openOrders.some(o => o.orderNo === header.orderNo) && (
                    <option value={header.orderNo}>{header.orderNo}</option>
                  )}
                  {openOrders.map(order => (
                    <option key={order.orderId} value={order.orderNo}>
                      {order.orderNo} {order.party?.partyName ? `(${order.party.partyName})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Firm / Customer */}
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Building2 size={13} color="var(--text-muted)" />
                  <span>Firm / Customer</span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-light)' }}>(Auto / Editable)</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={header.firmName}
                  onChange={e => updateHeader('firmName', e.target.value)}
                  placeholder="Auto-filled from order or manual"
                />
              </div>

              {/* Quality */}
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Tag size={13} color="var(--text-muted)" />
                  <span>Quality</span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-light)' }}>(Auto / Editable)</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={header.quality}
                  onChange={e => updateHeader('quality', e.target.value)}
                  placeholder="Auto-filled from order or manual"
                />
              </div>

              {/* Total Ends */}
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span>Total Ends</span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-light)' }}>(Override)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  className="form-control"
                  value={header.totalEnds}
                  onChange={e => updateHeader('totalEnds', e.target.value)}
                  placeholder="e.g. 7000"
                />
              </div>

              {/* Cone */}
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span>Cone</span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-light)' }}>(Packaging spec)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.001"
                  className="form-control"
                  value={header.cone}
                  onChange={e => updateHeader('cone', e.target.value)}
                  placeholder="e.g. 24"
                />
              </div>

              {/* Part */}
              <div className="form-group">
                <label>Part</label>
                <input
                  list="part-suggestions"
                  className="form-control"
                  value={header.partNo}
                  onChange={e => updateHeader('partNo', e.target.value)}
                  placeholder="e.g. Part 1"
                />
                <datalist id="part-suggestions">
                  {PART_SUGGESTIONS.map(p => (
                    <option key={p} value={p} />
                  ))}
                </datalist>
              </div>

              {/* Lasa */}
              <div className="form-group col-span-2">
                <label>Lasa</label>
                <input
                  className="form-control"
                  value={header.lasa}
                  onChange={e => updateHeader('lasa', e.target.value)}
                  placeholder="Lease / Lasa specification string (e.g. 1/1, 2/2)"
                />
              </div>
            </div>
          </div>

          {/* BOTTOM SECTION: Dynamic Record Table */}
          <div className="section-card" style={{ marginTop: 20 }}>
            <div className="section-card-header">
              <div className="section-card-title">
                <Package size={20} color="var(--primary-blue)" />
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>
                    Yarn Allocation Records
                  </h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Multi-row yarn allocations with Gate Pass locking & reactive footer summary
                  </span>
                </div>
                <span className="badge badge-info" style={{ marginLeft: 8 }}>
                  {yarnLines.length} {yarnLines.length === 1 ? 'Row' : 'Rows'}
                </span>
              </div>
              <button
                type="button"
                className="btn btn-primary"
                onClick={addRow}
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <Plus size={16} />
                <span>Add Row</span>
              </button>
            </div>

            {/* Horizontal Scrollable Grid */}
            <div className="table-responsive" style={{ overflowX: 'auto', marginTop: 12 }}>
              <table className="data-table yarn-line-table">
                <thead>
                  <tr>
                    <th style={{ width: '45px', textAlign: 'center' }}>Sr No</th>
                    <th style={{ width: '130px' }}>From?</th>
                    <th style={{ width: '220px' }}>Challan / Lot Ref</th>
                    <th style={{ width: '120px' }}>Fresh / Winding</th>
                    <th style={{ minWidth: '150px' }}>Count</th>
                    <th style={{ minWidth: '150px' }}>Tickit</th>
                    <th style={{ width: '90px' }}>Bags</th>
                    <th style={{ width: '90px' }}>Cones</th>
                    <th style={{ width: '120px' }}>Weight (Kg)</th>
                    <th style={{ minWidth: '160px' }}>Remark</th>
                    <th style={{ width: '45px', textAlign: 'center' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {yarnLines.map((line, index) => {
                    const locked = isGatePass(line);

                    return (
                      <tr key={line.key}>
                        {/* 1. Sr No */}
                        <td style={{ textAlign: 'center', fontWeight: 600, color: 'var(--text-muted)' }}>
                          {index + 1}
                        </td>

                        {/* 2. From? */}
                        <td>
                          <select
                            className="form-control"
                            value={line.sourceFrom}
                            onChange={e => updateLine(line.key, 'sourceFrom', e.target.value)}
                          >
                            {FROM_OPTIONS.map(opt => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        </td>

                        {/* Gate Pass / Challan Selection (Rule A) */}
                        <td>
                          {locked ? (
                            <select
                              className="form-control"
                              value={line.yarnInwardId}
                              onChange={e => applyGatePassLot(line.key, e.target.value)}
                              style={{ borderColor: line.yarnInwardId ? 'var(--primary-blue)' : 'var(--color-warning)' }}
                            >
                              <option value="">-- Select Inward Challan --</option>
                              {gatePassLots.map(lot => (
                                <option key={lot.yarnInwardId} value={lot.yarnInwardId}>
                                  #{lot.yarnInwardId} | {lot.billNo ? `Challan: ${lot.billNo}` : 'Lot'} - {lot.countName || ''} {lot.tickitName || ''} {lot.weightKg ? `(${lot.weightKg}kg)` : ''}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-light)', fontSize: '0.8rem', padding: '6px 8px' }}>
                              <span style={{ height: 6, width: 6, borderRadius: '50%', background: 'var(--color-success)', display: 'inline-block' }} />
                              <span>Direct Inventory</span>
                            </div>
                          )}
                        </td>

                        {/* 3. Fresh / Winding */}
                        <td>
                          <select
                            className="form-control"
                            value={line.freshWinding}
                            onChange={e => updateLine(line.key, 'freshWinding', e.target.value)}
                          >
                            {CONDITION_OPTIONS.map(opt => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        </td>

                        {/* 4. Count (Rule A: Locked if Gate Pass, Rule B: Searchable/Select if Warehouse/Sizing) */}
                        <td>
                          <select
                            className="form-control"
                            value={line.countId}
                            disabled={locked}
                            onChange={e => updateLine(line.key, 'countId', e.target.value)}
                            style={locked ? { backgroundColor: 'var(--bg-hover)', color: 'var(--text-main)', fontWeight: 600 } : {}}
                          >
                            <option value="">-- Select Count --</option>
                            {line.countId && !yarnCounts.some(c => String(c.countId) === String(line.countId)) && (
                              <option value={line.countId}>{line.countName || `Count #${line.countId}`}</option>
                            )}
                            {yarnCounts.map(count => (
                              <option key={count.countId} value={count.countId}>
                                {count.countName}
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* 5. Tickit (Rule A: Locked if Gate Pass, Rule B: Searchable/Select if Warehouse/Sizing) */}
                        <td>
                          <select
                            className="form-control"
                            value={line.tickitId}
                            disabled={locked}
                            onChange={e => updateLine(line.key, 'tickitId', e.target.value)}
                            style={locked ? { backgroundColor: 'var(--bg-hover)', color: 'var(--text-main)', fontWeight: 600 } : {}}
                          >
                            <option value="">-- Select Tickit --</option>
                            {line.tickitId && !tickits.some(t => String(t.tickitId) === String(line.tickitId)) && (
                              <option value={line.tickitId}>{line.tickitName || `Tickit #${line.tickitId}`}</option>
                            )}
                            {tickits.map(tickit => (
                              <option key={tickit.tickitId} value={tickit.tickitId}>
                                {tickit.tickitName}
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* 6. Bags */}
                        <td>
                          <input
                            type="number"
                            min="0"
                            step="1"
                            className="form-control"
                            value={line.bags}
                            onChange={e => updateLine(line.key, 'bags', e.target.value)}
                            placeholder="0"
                            style={{ textAlign: 'right' }}
                          />
                        </td>

                        {/* 7. Cones */}
                        <td>
                          <input
                            type="number"
                            min="0"
                            step="1"
                            className="form-control"
                            value={line.cones}
                            onChange={e => updateLine(line.key, 'cones', e.target.value)}
                            placeholder="0"
                            style={{ textAlign: 'right' }}
                          />
                        </td>

                        {/* 8. Weight (Kg) */}
                        <td>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            className="form-control"
                            value={line.weightKg}
                            onChange={e => updateLine(line.key, 'weightKg', e.target.value)}
                            placeholder="0.00"
                            style={{ textAlign: 'right', fontWeight: 600 }}
                          />
                        </td>

                        {/* 9. Remark */}
                        <td>
                          <input
                            type="text"
                            className="form-control"
                            value={line.remark}
                            onChange={e => updateLine(line.key, 'remark', e.target.value)}
                            placeholder="Optional notes"
                          />
                        </td>

                        {/* Action: Delete Row */}
                        <td style={{ textAlign: 'center' }}>
                          <button
                            type="button"
                            className="btn-icon"
                            style={{
                              color: yarnLines.length > 1 ? 'var(--color-danger)' : 'var(--text-light)',
                              cursor: yarnLines.length > 1 ? 'pointer' : 'not-allowed',
                            }}
                            onClick={() => removeRow(line.key)}
                            disabled={yarnLines.length <= 1}
                            title={yarnLines.length <= 1 ? 'At least one row required' : 'Remove row'}
                          >
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>

                {/* Rule C: Footer Summary */}
                <tfoot>
                  <tr className="table-totals-row">
                    <td colSpan="6" style={{ textAlign: 'right', paddingRight: '16px', letterSpacing: '0.05em' }}>
                      TOTAL SUMMARY:
                    </td>
                    <td style={{ textAlign: 'right', color: 'var(--primary-blue-dark)', fontSize: '0.95rem' }}>
                      {totals.bags}
                    </td>
                    <td style={{ textAlign: 'right', color: 'var(--primary-blue-dark)', fontSize: '0.95rem' }}>
                      {totals.cones}
                    </td>
                    <td style={{ textAlign: 'right', color: 'var(--primary-blue-dark)', fontSize: '0.95rem' }}>
                      {totals.weightKg.toFixed(2)} kg
                    </td>
                    <td colSpan="2" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                      Reactive calculated sum
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </form>
      </div>
    );
  }

  // ----------------------------------------------------
  // RENDER: LIST VIEW
  // ----------------------------------------------------
  return (
    <div className="content-area">
      <div className="section-card">
        <div className="section-card-header">
          <div className="section-card-title">
            <Layers size={22} color="var(--primary-blue)" />
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>Sizing Sets</h3>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Overview of active sizing batches and allocations
              </span>
            </div>
            <span className="badge badge-info" style={{ marginLeft: 8 }}>
              {filteredSets.length} {filteredSets.length === 1 ? 'Record' : 'Records'}
            </span>
          </div>

          <div className="section-card-actions">
            <div className="search-box">
              <Search size={16} />
              <input
                type="text"
                placeholder="Search set, order, party..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
<<<<<<< Updated upstream
=======


            <button
              className="btn btn-primary"
              onClick={openCreateEditor}
            >
              <Plus size={18} />
              <span>New Sizing Set</span>
            </button>

>>>>>>> Stashed changes
          </div>
        </div>

<<<<<<< Updated upstream
        <div style={{ margin: '16px 0', display: 'flex', justifyContent: 'flex-start' }}>
          <button className="btn btn-primary" onClick={openCreateEditor}>
            <Plus size={18} />
            <span>New Sizing Set</span>
          </button>
        </div>

        <div className="table-responsive">
          <table className="data-table">
=======

        {/* LIST TABLE */}

        <div className="table-responsive">

          <table className="data-table">

>>>>>>> Stashed changes
            <thead>
              <tr>
                <th>Set No</th>
                <th>Date</th>
                <th>Order No</th>
                <th>Firm / Customer</th>
                <th>Quality</th>
                <th>Part</th>
                <th style={{ textAlign: 'center' }}>Yarn Rows</th>
                <th style={{ textAlign: 'right' }}>Total Bags</th>
                <th style={{ textAlign: 'right' }}>Total Weight</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loadingSets ? (
                <tr>
                  <td colSpan="11" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                      <Loader2 size={18} className="animate-spin" color="var(--primary-blue)" />
                      <span>Loading sizing sets...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredSets.length === 0 ? (
                <tr>
                  <td colSpan="11" style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text-dim)' }}>
                    <Layers size={36} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                    <p style={{ fontWeight: 600, marginBottom: 4 }}>No Sizing Sets Found</p>
                    <p style={{ fontSize: '0.85rem' }}>
                      {search ? 'Try adjusting your search query' : 'Create your first sizing set using the button above'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredSets.map(item => {
                  const lineCount = item.yarnLines?.length || 0;
                  const totalLineBags = item.yarnLines?.reduce((acc, l) => acc + (Number(l.bags) || 0), 0) || Number(item.bags) || 0;
                  const totalLineWeight = item.yarnLines?.reduce((acc, l) => acc + (Number(l.weightKg) || 0), 0) || Number(item.weightKg) || 0;

                  return (
                    <tr key={item.sizingSetId}>
                      <td style={{ fontWeight: 700, color: 'var(--primary-blue-dark)' }}>
                        {item.setNo}
                      </td>
                      <td>{formatDate(item.setDate || item.outDate) || '-'}</td>
                      <td style={{ fontWeight: 600 }}>
                        {item.order?.orderNo || '-'}
                      </td>
                      <td>{item.party?.partyName || item.order?.party?.partyName || '-'}</td>
                      <td>{item.quality || item.order?.quality || '-'}</td>
                      <td>
                        <span className="badge badge-subtle">{item.partNo || 'Part 1'}</span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className="badge badge-info">{lineCount} lines</span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {totalLineBags}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>
                        {totalLineWeight > 0 ? `${totalLineWeight.toFixed(2)} kg` : '-'}
                      </td>
                      <td>
                        <span className={`badge ${item.status === 'COMPLETED' ? 'badge-success' : 'badge-warning'}`}>
                          {item.status || 'OPEN'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                          <button
                            className="btn-icon"
                            onClick={() => openEditEditor(item)}
                            title="Edit Sizing Set"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            className="btn-icon"
                            style={{ color: 'var(--color-danger)' }}
                            onClick={() => handleDelete(item)}
                            title="Delete Sizing Set"
                          >
                            <Trash2 size={15} />
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
    </div>
  );
};
