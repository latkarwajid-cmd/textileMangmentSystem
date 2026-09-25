import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import {
  ArrowDownLeft,
  Plus,
  Trash2,
  Edit2,
  Eye,
  Search,
  CheckCircle2,
  AlertCircle,
  Package,
  Layers,
  Activity,
  FileText,
  RotateCcw,
  Save,
  Check,
  Building2,
  Calendar,
  Tag,
  Hash,
  RefreshCw,
  SlidersHorizontal,
  ArrowRight,
  Scale,
  CornerDownLeft,
  Calculator,
  Warehouse
} from 'lucide-react';
import { Modal } from '../components/Modal';

/* =========================================================
   HELPERS
========================================================= */
const todayDate = () => new Date().toISOString().split('T')[0];

const formatDate = (date) => {
  if (!date) return '-';
  if (Array.isArray(date)) {
    const [y, m, d] = date;
    return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  }
  return String(date).substring(0, 10);
};

const formatNum = (val, decimals = 2) => {
  if (val === '' || val === null || val === undefined) return '-';
  const num = Number(val);
  return isNaN(num) ? '-' : num.toLocaleString('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
};

const createEmptyHeader = () => ({
  inwardNo: '',
  inwardDate: todayDate(),
  challanNo: '',
  challanDate: todayDate(),
  sizingId: '',
  sizingName: '',
  sizingSetId: '',
  setNo: '',
  partyId: '',
  partyName: '',
  clientName: '',
  shed: '',
  quality: '',
  countId: '',
  countName: '',
  tickitId: '',
  tickitName: '',
  countAndTicket: '',
  totalEnds: '',
  totalBeamsCount: 1,
  orderId: '',
  orderNo: '',
  remark: ''
});

const createEmptyBeamRow = (srNo = 1, beamNo = '') => ({
  id: `beam-${Date.now()}-${Math.random()}`,
  srNo: srNo,
  beamNo: beamNo || String(srNo),
  flangeNo: '',
  cuts: '',
  meter: '',
  grossWeight: '',
  tareWeight: '',
  netWeight: '',
  status: 'In Stock',
  storedAt: '',
  remark: ''
});

const createEmptyReturnRow = (srNo = 1, countTicket = '', countId = '', tickitId = '') => ({
  id: `ret-${Date.now()}-${Math.random()}`,
  srNo: srNo,
  itemType: 'Partial / Loose Bag',
  countId: countId,
  tickitId: tickitId,
  countAndTicket: countTicket,
  bagsReturned: '',
  conesReturned: '',
  returnedWeightKg: '',
  destinationWarehouse: 'Main Raw Yarn Warehouse',
  remark: ''
});

export const BeamInwardView = () => {
  const { sizingUnits, parties, yarnCounts, tickits, yarnStorageLocations, addToast } = useApp();

  // Active Main Navigation: 'entry' | 'history' | 'flange-tracker'
  const [activeTab, setActiveTab] = useState('entry');

  // Entry Sub-Tabs: 'white-slip' (Beams Grid) | 'pink-slip' (Yarn Reconciliation)
  const [entrySubTab, setEntrySubTab] = useState('white-slip');

  // Master Data & Lists
  const [sizingSets, setSizingSets] = useState([]);
  const [allBeams, setAllBeams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingLookup, setLoadingLookup] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State: Header
  const [header, setHeader] = useState(createEmptyHeader());

  // Form State: Tab 1 (White Slip - Sized Beams Grid)
  const [beamRows, setBeamRows] = useState([createEmptyBeamRow(1, '1')]);

  // Form State: Tab 2 (Pink Slip - Yarn Reconciliation & Balance Return)
  const [reconciliation, setReconciliation] = useState({
    totalIssuedBags: '',
    totalIssuedCones: '',
    issuedGrossWeight: '',
    emptyConeTareGrams: '60', // 60g per cone default
    conesPerBag: '32'
  });

  const [balanceReturns, setBalanceReturns] = useState([
    createEmptyReturnRow(1)
  ]);

  // History & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [flangeSearch, setFlangeSearch] = useState('');

  // Modals
  const [viewBeamModal, setViewBeamModal] = useState(null);
  const [editBeamModal, setEditBeamModal] = useState(null);
  const [editForm, setEditForm] = useState(null);

  /* =========================================================
     FETCH DATA
  ========================================================= */
  const fetchAllBeams = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.beamInward.getAll();
      setAllBeams(Array.isArray(data) ? data : []);
    } catch (err) {
      addToast(err.message || 'Failed to load beam records', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  const fetchSizingSets = useCallback(async () => {
    try {
      const data = await api.sizingSets.getAll();
      setSizingSets(Array.isArray(data) ? data.filter(s => s.status !== 'DELETED') : []);
    } catch (err) {
      console.warn('Could not load sizing sets', err);
    }
  }, []);

  const generateNextInwardNumber = useCallback(async () => {
    try {
      const res = await api.beamInward.getNextInwardNo();
      if (res && res.inwardNo) {
        setHeader(prev => ({ ...prev, inwardNo: res.inwardNo }));
      }
    } catch (e) {
      // Fallback: read current beams from the repo directly to avoid stale closure
      const list = await api.beamInward.getAll().catch(() => []);
      const maxNo = (Array.isArray(list) ? list : []).reduce((max, b) => {
        const match = String(b.inwardNo || '').match(/(\d+)$/);
        return match ? Math.max(max, parseInt(match[1], 10)) : max;
      }, 0);
      setHeader(prev => ({ ...prev, inwardNo: `BINW-${String(maxNo + 1).padStart(2, '0')}` }));
    }
  }, []); // stable — no external state dependencies

  // Init: fetch data and generate the first inward number once on mount only
  const initDoneRef = React.useRef(false);
  useEffect(() => {
    if (initDoneRef.current) return;
    initDoneRef.current = true;
    fetchAllBeams();
    fetchSizingSets();
    generateNextInwardNumber();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* =========================================================
     REACTIVITY: SIZING SET LOOKUP (Zero Full-Page Reload)
  ========================================================= */
  const handleSizingSetChange = async (selectedSetId) => {
    if (!selectedSetId) {
      setHeader(prev => ({
        ...prev,
        sizingSetId: '',
        setNo: '',
        clientName: '',
        partyName: '',
        partyId: '',
        quality: '',
        countName: '',
        tickitName: '',
        countAndTicket: '',
        totalEnds: '',
        orderId: '',
        orderNo: '',
        sizingId: ''
      }));
      setReconciliation({
        totalIssuedBags: '',
        totalIssuedCones: '',
        issuedGrossWeight: '',
        emptyConeTareGrams: '60',
        conesPerBag: '32'
      });
      return;
    }

    setLoadingLookup(true);
    try {
      // 1. Fire API call GET /api/sizing-sets/{setId}/inward-lookup
      let lookup = null;
      try {
        lookup = await api.sizingSets.getInwardLookup(selectedSetId);
      } catch (err) {
        // ignore and fallback
      }

      // 2. Also fetch full set details to inspect full yarnLines, count, tickit relations
      let fullSet = null;
      try {
        fullSet = await api.sizingSets.getById(selectedSetId);
      } catch (err) {
        fullSet = sizingSets.find(s => String(s.sizingSetId) === String(selectedSetId));
      }

      const targetSet = fullSet || sizingSets.find(s => String(s.sizingSetId) === String(selectedSetId)) || {};

      // Party / Client
      const partyObj = targetSet.party || targetSet.order?.party || null;
      const clientName = lookup?.clientName || lookup?.partyName || partyObj?.partyName || '';
      const partyId = lookup?.partyId || partyObj?.partyId || '';

      // Quality
      const quality = lookup?.quality || targetSet.quality || targetSet.order?.quality || '';

      // Total Ends
      const totalEnds = lookup?.totalEnds ?? targetSet.totalEnds ?? '';

      // Sizing Unit
      const sizingUnit = targetSet.sizingUnit || null;
      const sizingId = lookup?.sizingId || sizingUnit?.sizingId || '';
      const sizingName = lookup?.sizingName || sizingUnit?.sizingName || '';

      // Order
      const orderObj = targetSet.order || null;
      const orderId = lookup?.orderId || orderObj?.orderId || '';
      const orderNo = lookup?.orderNo || orderObj?.orderNo || '';

      // Comprehensive Count & Ticket Resolution
      let cName = lookup?.countName || '';
      let tName = lookup?.tickitName || '';
      let countId = lookup?.countId || '';
      let tickitId = lookup?.tickitId || '';

      // 1. Direct header
      if (!cName && targetSet.count) {
        cName = targetSet.count.countName || '';
        countId = targetSet.count.countId || '';
      }
      if (!cName && targetSet.countId) {
        const found = yarnCounts.find(c => String(c.countId) === String(targetSet.countId));
        if (found) {
          cName = found.countName;
          countId = found.countId;
        }
      }

      if (!tName && targetSet.tickit) {
        tName = targetSet.tickit.tickitName || '';
        tickitId = targetSet.tickit.tickitId || '';
      }
      if (!tName && targetSet.tickitId) {
        const found = tickits.find(t => String(t.tickitId) === String(targetSet.tickitId));
        if (found) {
          tName = found.tickitName;
          tickitId = found.tickitId;
        }
      }

      // 2. From yarnLines (Crucial for Sets 1 & 2 where count & tickit are on allocated lines!)
      if ((!cName || !tName) && targetSet.yarnLines && targetSet.yarnLines.length > 0) {
        for (const line of targetSet.yarnLines) {
          if (!cName) {
            if (line.count?.countName) {
              cName = line.count.countName;
              countId = line.count.countId;
            } else if (line.countName) {
              cName = line.countName;
            } else if (line.countId) {
              const found = yarnCounts.find(c => String(c.countId) === String(line.countId));
              if (found) {
                cName = found.countName;
                countId = found.countId;
              }
            } else if (line.yarnInward?.count?.countName) {
              cName = line.yarnInward.count.countName;
              countId = line.yarnInward.count.countId;
            } else if (line.sizingInward?.count?.countName) {
              cName = line.sizingInward.count.countName;
              countId = line.sizingInward.count.countId;
            }
          }
          if (!tName) {
            if (line.tickit?.tickitName) {
              tName = line.tickit.tickitName;
              tickitId = line.tickit.tickitId;
            } else if (line.tickitName) {
              tName = line.tickitName;
            } else if (line.tickitId) {
              const found = tickits.find(t => String(t.tickitId) === String(line.tickitId));
              if (found) {
                tName = found.tickitName;
                tickitId = found.tickitId;
              }
            } else if (line.yarnInward?.tickit?.tickitName) {
              tName = line.yarnInward.tickit.tickitName;
              tickitId = line.yarnInward.tickit.tickitId;
            } else if (line.sizingInward?.tickit?.tickitName) {
              tName = line.sizingInward.tickit.tickitName;
              tickitId = line.sizingInward.tickit.tickitId;
            }
          }
        }
      }

      // 3. From order
      if (!cName && targetSet.order?.count) {
        cName = targetSet.order.count.countName || '';
        countId = targetSet.order.count.countId || '';
      }
      if (!tName && targetSet.order?.tickit) {
        tName = targetSet.order.tickit.tickitName || '';
        tickitId = targetSet.order.tickit.tickitId || '';
      }

      // 4. Construct countAndTicket string
      let countAndTicket = lookup?.countAndTicket || '';
      if (!countAndTicket) {
        if (cName && tName) {
          countAndTicket = `${cName} ${tName}`;
        } else if (cName) {
          countAndTicket = cName;
        } else if (tName) {
          countAndTicket = tName;
        } else if (targetSet.sizingCount) {
          countAndTicket = targetSet.sizingCount;
        }
      }

      // 5. If still missing, search in known yarnCounts and tickits against quality string
      if (!countAndTicket && quality) {
        for (const yc of yarnCounts) {
          if (yc.countName && quality.toLowerCase().includes(yc.countName.toLowerCase())) {
            cName = yc.countName;
            countId = yc.countId;
            break;
          }
        }
        for (const t of tickits) {
          if (t.tickitName && quality.toLowerCase().includes(t.tickitName.toLowerCase())) {
            tName = t.tickitName;
            tickitId = t.tickitId;
            break;
          }
        }
        if (cName && tName) countAndTicket = `${cName} ${tName}`;
        else if (cName) countAndTicket = cName;
        else if (tName) countAndTicket = tName;
      }

      // Raw Yarn Issued Metrics for Tab 2 Reconciliation
      const issuedBags = lookup?.issuedBags || targetSet.bags || (targetSet.yarnLines ? targetSet.yarnLines.reduce((acc, l) => acc + (parseFloat(l.bags) || 0), 0) : '') || '';
      const issuedWeight = lookup?.issuedWeightKg || targetSet.weightKg || (targetSet.yarnLines ? targetSet.yarnLines.reduce((acc, l) => acc + (parseFloat(l.weightKg) || 0), 0) : '') || '';
      const issuedCones = issuedBags ? Math.round(parseFloat(issuedBags) * 32) : '';

      setHeader(prev => ({
        ...prev,
        sizingSetId: selectedSetId,
        setNo: targetSet.setNo || lookup?.setNo || '',
        partyId: partyId || prev.partyId,
        partyName: clientName || prev.partyName,
        clientName: clientName || prev.clientName,
        quality: quality || prev.quality,
        countId: countId || prev.countId,
        countName: cName || prev.countName,
        tickitId: tickitId || prev.tickitId,
        tickitName: tName || prev.tickitName,
        countAndTicket: countAndTicket || `${cName} ${tName}`.trim(),
        totalEnds: totalEnds ?? prev.totalEnds,
        sizingId: sizingId || prev.sizingId,
        sizingName: sizingName || prev.sizingName,
        orderId: orderId || prev.orderId,
        orderNo: orderNo || prev.orderNo,
        shed: lookup?.shed || prev.shed || 'Kalawant Shed 3'
      }));

      setReconciliation(prev => ({
        ...prev,
        totalIssuedBags: String(issuedBags || ''),
        totalIssuedCones: String(issuedCones || ''),
        issuedGrossWeight: String(issuedWeight || '')
      }));

      // Update default count/ticket in balance returns
      setBalanceReturns(prev =>
        prev.map(r => ({
          ...r,
          countId: countId || r.countId,
          tickitId: tickitId || r.tickitId,
          countAndTicket: countAndTicket || r.countAndTicket
        }))
      );

      addToast(`Loaded specifications for Sizing Set ${targetSet.setNo || selectedSetId}`, 'info');
    } catch (error) {
      addToast('Error fetching sizing set details', 'error');
    } finally {
      setLoadingLookup(false);
    }
  };

  /* =========================================================
     DYNAMIC BEAM GRID HANDLERS (TAB 1: WHITE SLIP)
  ========================================================= */
  const handleAddBeamRow = () => {
    setBeamRows(prev => {
      const nextSr = prev.length + 1;
      return [...prev, createEmptyBeamRow(nextSr, String(nextSr))];
    });
  };

  const handleGenerateBeams = (count) => {
    const num = parseInt(count, 10);
    if (isNaN(num) || num <= 0) {
      addToast('Please enter a valid beam count greater than 0', 'warning');
      return;
    }
    const newRows = [];
    for (let i = 1; i <= num; i++) {
      newRows.push(createEmptyBeamRow(i, String(i)));
    }
    setBeamRows(newRows);
    setHeader(prev => ({ ...prev, totalBeamsCount: num }));
    addToast(`Generated ${num} beam rows`, 'info');
  };

  const handleRemoveBeamRow = (id) => {
    if (beamRows.length === 1) {
      addToast('At least one beam record is required', 'warning');
      return;
    }
    setBeamRows(prev => {
      const filtered = prev.filter(r => r.id !== id);
      return filtered.map((row, idx) => ({
        ...row,
        srNo: idx + 1,
        beamNo: row.beamNo || String(idx + 1)
      }));
    });
  };

  const handleBeamCellChange = (id, field, value) => {
    setBeamRows(prev =>
      prev.map(row => {
        if (row.id !== id) return row;
        const updated = { ...row, [field]: value };

        // Auto-calculate Net Yarn Weight = Gross Weight - Tare Weight
        if (field === 'grossWeight' || field === 'tareWeight') {
          const gross = parseFloat(field === 'grossWeight' ? value : row.grossWeight);
          const tare = parseFloat(field === 'tareWeight' ? value : row.tareWeight);
          if (!isNaN(gross) && !isNaN(tare)) {
            const net = Math.max(0, gross - tare);
            updated.netWeight = net.toFixed(3);
          } else if (!isNaN(gross) && isNaN(tare)) {
            updated.netWeight = gross.toFixed(3);
          }
        }
        return updated;
      })
    );
  };

  /* =========================================================
     BALANCE RETURN HANDLERS (TAB 2: PINK SLIP)
  ========================================================= */
  const handleAddReturnRow = () => {
    setBalanceReturns(prev => {
      const nextSr = prev.length + 1;
      return [...prev, createEmptyReturnRow(nextSr, header.countAndTicket, header.countId, header.tickitId)];
    });
  };

  const handleRemoveReturnRow = (id) => {
    if (balanceReturns.length === 1) {
      // Clear instead of removing last row
      setBalanceReturns([createEmptyReturnRow(1, header.countAndTicket, header.countId, header.tickitId)]);
      return;
    }
    setBalanceReturns(prev => {
      const filtered = prev.filter(r => r.id !== id);
      return filtered.map((row, idx) => ({ ...row, srNo: idx + 1 }));
    });
  };

  const handleReturnCellChange = (id, field, value) => {
    setBalanceReturns(prev =>
      prev.map(row => {
        if (row.id !== id) return row;
        return { ...row, [field]: value };
      })
    );
  };

  /* =========================================================
     DYNAMIC RECONCILIATION FORMULAS & SUMMARIES
  ========================================================= */
  const beamTotals = useMemo(() => {
    return beamRows.reduce(
      (acc, row) => {
        const cuts = parseFloat(row.cuts) || 0;
        const meter = parseFloat(row.meter) || 0;
        const gross = parseFloat(row.grossWeight) || 0;
        const tare = parseFloat(row.tareWeight) || 0;
        const net = parseFloat(row.netWeight) || (gross > tare ? gross - tare : 0);

        return {
          totalCuts: acc.totalCuts + cuts,
          totalMeters: acc.totalMeters + meter,
          totalGross: acc.totalGross + gross,
          totalTare: acc.totalTare + tare,
          totalNet: acc.totalNet + net,
          validCount: acc.validCount + (row.flangeNo.trim() ? 1 : 0)
        };
      },
      { totalCuts: 0, totalMeters: 0, totalGross: 0, totalTare: 0, totalNet: 0, validCount: 0 }
    );
  }, [beamRows]);

  const reconciliationSummary = useMemo(() => {
    const issuedBags = parseFloat(reconciliation.totalIssuedBags) || 0;
    const conesPerBag = parseFloat(reconciliation.conesPerBag) || 32;
    const issuedCones = issuedBags * conesPerBag;
    const issuedGrossWeight = parseFloat(reconciliation.issuedGrossWeight) || 0;
    const tareGrams = parseFloat(reconciliation.emptyConeTareGrams) || 60; // 60g default

    // Total Empty Cone Tare (kg) = Total Issued Cones * (tareGrams / 1000)
    const totalEmptyConeTareKg = issuedCones * (tareGrams / 1000);

    // Net Yarn Issued (kg) = Issued Gross Weight - Total Empty Cone Tare
    const netYarnIssuedKg = Math.max(0, issuedGrossWeight - totalEmptyConeTareKg);

    // Total Balance Returns
    const totalReturnedBags = balanceReturns.reduce((sum, r) => sum + (parseFloat(r.bagsReturned) || 0), 0);
    const totalReturnedCones = balanceReturns.reduce((sum, r) => sum + (parseFloat(r.conesReturned) || 0), 0);
    const totalReturnedWeightKg = balanceReturns.reduce((sum, r) => sum + (parseFloat(r.returnedWeightKg) || 0), 0);

    // Net Yarn Consumed (kg) = Net Yarn Issued - Total Returned Weight
    const netYarnConsumedKg = Math.max(0, netYarnIssuedKg - totalReturnedWeightKg);

    return {
      issuedBags,
      issuedCones,
      issuedGrossWeight,
      tareGrams,
      totalEmptyConeTareKg,
      netYarnIssuedKg,
      totalReturnedBags,
      totalReturnedCones,
      totalReturnedWeightKg,
      netYarnConsumedKg
    };
  }, [reconciliation, balanceReturns]);

  /* =========================================================
     SUBMIT INWARD & RECONCILIATION (Single Workflow)
  ========================================================= */
  const handleSaveCompleteInward = async (e) => {
    if (e) e.preventDefault();

    // Validation: Header
    if (!header.inwardNo?.trim()) {
      addToast('Inward Number is required', 'error');
      return;
    }
    if (!header.sizingSetId) {
      addToast('Please select a Sizing Set No', 'error');
      return;
    }
    if (beamRows.length === 0) {
      addToast('At least one beam record is required in the grid', 'error');
      return;
    }

    // Validation: Row Grid (Flange No required, Meters > 0, Cuts > 0)
    for (let i = 0; i < beamRows.length; i++) {
      const row = beamRows[i];
      const rowNum = i + 1;

      if (!row.flangeNo || !row.flangeNo.trim()) {
        addToast(`Flange No is required for Beam row #${rowNum}`, 'error');
        setEntrySubTab('white-slip');
        return;
      }
      const cutsVal = parseFloat(row.cuts);
      if (isNaN(cutsVal) || cutsVal <= 0) {
        addToast(`Cuts must be greater than 0 for Beam row #${rowNum}`, 'error');
        setEntrySubTab('white-slip');
        return;
      }
      const meterVal = parseFloat(row.meter);
      if (isNaN(meterVal) || meterVal <= 0) {
        addToast(`Meters must be greater than 0 for Beam row #${rowNum}`, 'error');
        setEntrySubTab('white-slip');
        return;
      }
    }

    setSubmitting(true);
    try {
      const payload = {
        inwardNo: header.inwardNo.trim(),
        inwardDate: header.inwardDate || todayDate(),
        challanNo: header.challanNo?.trim() || null,
        challanDate: header.challanDate || null,
        sizingSetId: Number(header.sizingSetId),
        orderId: header.orderId ? Number(header.orderId) : null,
        sizingId: header.sizingId ? Number(header.sizingId) : null,
        partyId: header.partyId ? Number(header.partyId) : null,
        shed: header.shed?.trim() || null,
        quality: header.quality?.trim() || null,
        countId: header.countId ? Number(header.countId) : null,
        tickitId: header.tickitId ? Number(header.tickitId) : null,
        totalEnds: header.totalEnds ? parseInt(header.totalEnds, 10) : null,
        totalBeamsCount: beamRows.length,
        remark: header.remark?.trim() || null,

        // Tab 1: Sized Beams
        beamLines: beamRows.map((r, idx) => ({
          srNo: idx + 1,
          beamNo: r.beamNo?.trim() || String(idx + 1),
          flangeNo: r.flangeNo.trim(),
          cuts: parseFloat(r.cuts),
          meter: parseFloat(r.meter),
          grossWeight: r.grossWeight ? parseFloat(r.grossWeight) : null,
          tareWeight: r.tareWeight ? parseFloat(r.tareWeight) : null,
          netWeight: r.netWeight ? parseFloat(r.netWeight) : null,
          weightKg: r.netWeight ? parseFloat(r.netWeight) : null,
          status: r.status || 'In Stock',
          storedAt: r.storedAt || null,
          remark: r.remark?.trim() || null
        })),

        // Tab 2: Pink Slip Yarn Reconciliation
        reconciliation: {
          totalIssuedBags: reconciliationSummary.issuedBags,
          totalIssuedCones: reconciliationSummary.issuedCones,
          issuedGrossWeight: reconciliationSummary.issuedGrossWeight,
          emptyConeTareGrams: reconciliationSummary.tareGrams,
          totalEmptyConeTareKg: reconciliationSummary.totalEmptyConeTareKg,
          netYarnIssuedKg: reconciliationSummary.netYarnIssuedKg,
          totalReturnedWeightKg: reconciliationSummary.totalReturnedWeightKg,
          netYarnConsumedKg: reconciliationSummary.netYarnConsumedKg,
          returnsList: balanceReturns
            .filter(r => (parseFloat(r.returnedWeightKg) > 0 || parseFloat(r.bagsReturned) > 0))
            .map((r, idx) => ({
              srNo: idx + 1,
              itemType: r.itemType,
              countId: r.countId ? Number(r.countId) : (header.countId ? Number(header.countId) : null),
              tickitId: r.tickitId ? Number(r.tickitId) : (header.tickitId ? Number(header.tickitId) : null),
              countAndTicket: r.countAndTicket || header.countAndTicket,
              bagsReturned: r.bagsReturned ? parseFloat(r.bagsReturned) : null,
              conesReturned: r.conesReturned ? parseFloat(r.conesReturned) : null,
              returnedWeightKg: parseFloat(r.returnedWeightKg) || 0,
              destinationWarehouse: r.destinationWarehouse || 'Main Raw Yarn Warehouse',
              remark: r.remark?.trim() || null
            }))
        }
      };

      await api.beamInward.complete(payload);
      addToast(`Successfully saved ${beamRows.length} sized beams and completed yarn stock reconciliation under ${header.inwardNo}!`, 'success');

      // Reset Form & Generate Next Inward Number
      setHeader(createEmptyHeader());
      setBeamRows([createEmptyBeamRow(1, '1')]);
      setReconciliation({
        totalIssuedBags: '',
        totalIssuedCones: '',
        issuedGrossWeight: '',
        emptyConeTareGrams: '60',
        conesPerBag: '32'
      });
      setBalanceReturns([createEmptyReturnRow(1)]);
      await fetchAllBeams();
      await generateNextInwardNumber();
      setActiveTab('history');
    } catch (err) {
      addToast(err.message || 'Failed to save Sized Beam Inward and Reconciliation', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetForm = () => {
    if (window.confirm('Are you sure you want to clear the form?')) {
      setHeader(createEmptyHeader());
      setBeamRows([createEmptyBeamRow(1, '1')]);
      setReconciliation({
        totalIssuedBags: '',
        totalIssuedCones: '',
        issuedGrossWeight: '',
        emptyConeTareGrams: '60',
        conesPerBag: '32'
      });
      setBalanceReturns([createEmptyReturnRow(1)]);
      generateNextInwardNumber();
      addToast('Form reset', 'info');
    }
  };

  /* =========================================================
     DELETE / EDIT SINGLE BEAM RECORD
  ========================================================= */
  const handleDeleteBeam = async (beam) => {
    if (!beam) return;
    if (!window.confirm(`Are you sure you want to delete Beam #${beam.beamNo || beam.beamId} (Flange: ${beam.flangeNo || 'N/A'})?`)) {
      return;
    }
    try {
      await api.beamInward.delete(beam.beamId);
      addToast(`Beam #${beam.beamNo || beam.beamId} deleted`, 'success');
      fetchAllBeams();
    } catch (err) {
      addToast(err.message || 'Delete failed', 'error');
    }
  };

  const openEditModal = (beam) => {
    setEditBeamModal(beam);
    setEditForm({
      inwardNo: beam.inwardNo || '',
      inwardDate: formatDate(beam.inwardDate),
      challanNo: beam.challanNo || '',
      challanDate: formatDate(beam.challanDate),
      beamNo: beam.beamNo || '',
      flangeNo: beam.flangeNo || '',
      cuts: beam.cuts || '',
      meter: beam.meter || '',
      grossWeight: beam.grossWeight || '',
      tareWeight: beam.tareWeight || '',
      netWeight: beam.netWeight || beam.weightKg || '',
      status: beam.status || 'In Stock',
      storedAt: beam.storedAt || '',
      shed: beam.shed || '',
      remark: beam.remark || ''
    });
  };

  const handleUpdateSingleBeam = async (e) => {
    e.preventDefault();
    if (!editBeamModal) return;

    try {
      const gross = parseFloat(editForm.grossWeight);
      const tare = parseFloat(editForm.tareWeight);
      const net = (!isNaN(gross) && !isNaN(tare)) ? Math.max(0, gross - tare) : (parseFloat(editForm.netWeight) || null);

      const payload = {
        inwardNo: editForm.inwardNo || editBeamModal.inwardNo,
        inwardDate: editForm.inwardDate || editBeamModal.inwardDate,
        challanNo: editForm.challanNo,
        challanDate: editForm.challanDate,
        beamNo: editForm.beamNo,
        flangeNo: editForm.flangeNo,
        cuts: editForm.cuts ? parseFloat(editForm.cuts) : null,
        meter: editForm.meter ? parseFloat(editForm.meter) : null,
        grossWeight: !isNaN(gross) ? gross : null,
        tareWeight: !isNaN(tare) ? tare : null,
        netWeight: net,
        weightKg: net,
        status: editForm.status,
        storedAt: editForm.storedAt || null,
        shed: editForm.shed,
        remark: editForm.remark,
        sizingSetId: editBeamModal.sizingSet?.sizingSetId,
        orderId: editBeamModal.order?.orderId,
        sizingId: editBeamModal.sizingUnit?.sizingId,
        partyId: editBeamModal.party?.partyId,
        quality: editBeamModal.quality
      };

      await api.beamInward.update(editBeamModal.beamId, payload);
      addToast('Beam updated successfully', 'success');
      setEditBeamModal(null);
      fetchAllBeams();
    } catch (err) {
      addToast(err.message || 'Failed to update beam', 'error');
    }
  };

  /* =========================================================
     FILTERED LIST & EQUIPMENT TRACKING
  ========================================================= */
  const filteredBeams = useMemo(() => {
    return allBeams.filter(b => {
      const matchesSearch =
        !searchQuery.trim() ||
        (b.inwardNo && b.inwardNo.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (b.challanNo && b.challanNo.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (b.beamNo && b.beamNo.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (b.flangeNo && b.flangeNo.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (b.sizingSet?.setNo && b.sizingSet.setNo.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (b.sizingUnit?.sizingName && b.sizingUnit.sizingName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (b.party?.partyName && b.party.partyName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (b.quality && b.quality.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus =
        statusFilter === 'ALL' ||
        (b.status && b.status.toUpperCase() === statusFilter.toUpperCase());

      return matchesSearch && matchesStatus;
    });
  }, [allBeams, searchQuery, statusFilter]);

  // Unique Flange Equipment Tracking Matrix
  const flangeEquipmentList = useMemo(() => {
    const map = new Map();
    const sorted = [...allBeams].sort((a, b) => new Date(b.inwardDate || 0) - new Date(a.inwardDate || 0));

    sorted.forEach(b => {
      const flangeKey = (b.flangeNo || '').trim();
      if (!flangeKey) return;
      if (!map.has(flangeKey)) {
        map.set(flangeKey, b);
      }
    });

    let list = Array.from(map.values());
    if (flangeSearch.trim()) {
      const q = flangeSearch.toLowerCase().trim();
      list = list.filter(b =>
        (b.flangeNo && b.flangeNo.toLowerCase().includes(q)) ||
        (b.beamNo && b.beamNo.toLowerCase().includes(q)) ||
        (b.shed && b.shed.toLowerCase().includes(q)) ||
        (b.sizingSet?.setNo && b.sizingSet.setNo.toLowerCase().includes(q))
      );
    }
    return list;
  }, [allBeams, flangeSearch]);

  // Statistics KPI
  const stats = useMemo(() => {
    const totalBeams = allBeams.length;
    const inStock = allBeams.filter(b => (b.status || '').toLowerCase() === 'in stock').length;
    const onLoom = allBeams.filter(b => (b.status || '').toLowerCase() === 'loaded on loom').length;
    const totalMeters = allBeams.reduce((acc, b) => acc + (parseFloat(b.meter) || 0), 0);
    const uniqueFlanges = new Set(allBeams.map(b => b.flangeNo).filter(Boolean)).size;

    return { totalBeams, inStock, onLoom, totalMeters, uniqueFlanges };
  }, [allBeams]);

  const renderStatusBadge = (status = 'In Stock') => {
    const s = String(status).toLowerCase();
    if (s === 'loaded on loom') {
      return <span className="badge beam-badge-loom">Loaded on Loom</span>;
    }
    if (s === 'completed') {
      return <span className="badge beam-badge-completed">Completed</span>;
    }
    return <span className="badge beam-badge-stock">In Stock</span>;
  };

  return (
    <div className="content-area">
      {/* Page Header */}
      <div className="section-card" style={{ marginBottom: 16 }}>
        <div className="section-card-header" style={{ padding: '16px 20px', borderBottom: 'none' }}>
          <div className="section-card-title">
            <div style={{ background: 'var(--primary-blue-light)', padding: 8, borderRadius: 'var(--radius-md)', display: 'flex' }}>
              <ArrowDownLeft size={22} color="var(--primary-blue-dark)" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                Sized Beam Inward & Yarn Reconciliation
              </h2>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Receive sized warp beams and reconcile raw yarn stock & returns
              </span>
            </div>
          </div>
          <div className="section-card-actions">
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => { fetchAllBeams(); fetchSizingSets(); generateNextInwardNumber(); }}
              title="Refresh Data"
            >
              <RefreshCw size={14} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Top KPI Metrics */}
        <div style={{ padding: '0 20px 16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
          <div style={{ background: '#f8fafc', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ background: '#e0f2fe', color: '#0284c7', padding: 8, borderRadius: 6 }}><Layers size={18} /></div>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Total Sized Beams</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)' }}>{stats.totalBeams}</div>
            </div>
          </div>

          <div style={{ background: '#f8fafc', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ background: '#ecfdf5', color: '#059669', padding: 8, borderRadius: 6 }}><Package size={18} /></div>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>In Stock (Mill)</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#059669' }}>{stats.inStock} Beams</div>
            </div>
          </div>

          <div style={{ background: '#f8fafc', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ background: '#eff6ff', color: '#2563eb', padding: 8, borderRadius: 6 }}><Activity size={18} /></div>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Loaded on Loom</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#2563eb' }}>{stats.onLoom} Beams</div>
            </div>
          </div>

          <div style={{ background: '#f8fafc', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ background: '#fef3c7', color: '#d97706', padding: 8, borderRadius: 6 }}><Tag size={18} /></div>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Total Sized Meters</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#d97706' }}>{formatNum(stats.totalMeters, 0)} m</div>
            </div>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="tab-nav" style={{ margin: '0 20px 0', borderTop: '1px solid var(--border-color)', paddingTop: 4 }}>
          <button
            className={`tab-btn ${activeTab === 'entry' ? 'active' : ''}`}
            onClick={() => setActiveTab('entry')}
          >
            <Plus size={16} />
            <span>New Inward & Reconciliation</span>
          </button>
          <button
            className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            <FileText size={16} />
            <span>Inward History ({allBeams.length})</span>
          </button>
          <button
            className={`tab-btn ${activeTab === 'flange-tracker' ? 'active' : ''}`}
            onClick={() => setActiveTab('flange-tracker')}
          >
            <SlidersHorizontal size={16} />
            <span>Equipment & Flange Tracker ({stats.uniqueFlanges})</span>
          </button>
        </div>
      </div>

      {/* =========================================================
          TAB 1: NEW INWARD & RECONCILIATION WORKSPACE
      ========================================================= */}
      {activeTab === 'entry' && (
        <form onSubmit={handleSaveCompleteInward}>
          {/* SECTION 1: HEADER FORM CARD */}
          <div className="section-card" style={{ marginBottom: 20 }}>
            <div className="section-card-header" style={{ background: '#f8fafc' }}>
              <div className="section-card-title">
                <FileText size={18} color="var(--primary-blue-dark)" />
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0 }}>
                  Section 1: Inward Challan & Sizing Set Reference
                </h3>
              </div>
              <div className="section-card-actions">
                <span className="badge badge-info" style={{ fontSize: '0.75rem' }}>
                  Auto-Lookup Enabled
                </span>
              </div>
            </div>

            <div style={{ padding: '20px' }}>
              <div className="form-grid-4">
                {/* 1. Inward No */}
                <div className="form-group">
                  <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Inward No *</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--primary-blue-dark)' }}>Unique ID</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={header.inwardNo}
                    onChange={e => setHeader({ ...header, inwardNo: e.target.value })}
                    required
                    placeholder="BINW-01"
                  />
                </div>

                {/* 2. Inward Date */}
                <div className="form-group">
                  <label>Inward Date *</label>
                  <input
                    type="date"
                    className="form-control"
                    value={header.inwardDate}
                    onChange={e => setHeader({ ...header, inwardDate: e.target.value })}
                    required
                  />
                </div>

                {/* 3. Challan / Slip No */}
                <div className="form-group">
                  <label>Challan / Slip No *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. 404, 427"
                    value={header.challanNo}
                    onChange={e => setHeader({ ...header, challanNo: e.target.value })}
                    required
                  />
                </div>

                {/* 4. Challan Date */}
                <div className="form-group">
                  <label>Challan Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={header.challanDate}
                    onChange={e => setHeader({ ...header, challanDate: e.target.value })}
                  />
                </div>

                {/* 5. Sizing Party Name (Outside Sizer Unit) */}
                <div className="form-group">
                  <label>Sizing Party Name (Sizer Unit) *</label>
                  <select
                    className="form-control"
                    value={header.sizingId}
                    onChange={e => {
                      const unit = sizingUnits.find(u => String(u.sizingId) === String(e.target.value));
                      setHeader({ ...header, sizingId: e.target.value, sizingName: unit?.sizingName || '' });
                    }}
                    required
                  >
                    <option value="">-- Select Sizing Unit --</option>
                    {sizingUnits.map(u => (
                      <option key={u.sizingId} value={u.sizingId}>
                        {u.sizingName}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 6. Sizing Set No (Searchable/Select Dropdown) */}
                <div className="form-group">
                  <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Sizing Set No *</span>
                    {loadingLookup && <span style={{ fontSize: '0.7rem', color: 'var(--primary-blue-dark)' }}>Fetching...</span>}
                  </label>
                  <select
                    className="form-control"
                    value={header.sizingSetId}
                    onChange={e => handleSizingSetChange(e.target.value)}
                    required
                    style={{ borderColor: header.sizingSetId ? 'var(--primary-blue)' : undefined }}
                  >
                    <option value="">-- Select Sizing Set No --</option>
                    {sizingSets.map(s => (
                      <option key={s.sizingSetId} value={s.sizingSetId}>
                        {s.setNo} {s.party?.partyName ? `(${s.party.partyName})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 7. Client / Party Name (Auto-filled & Editable) */}
                <div className="form-group">
                  <label>Client / Party Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={header.clientName || header.partyName || ''}
                    onChange={e => setHeader({ ...header, clientName: e.target.value, partyName: e.target.value })}
                    placeholder="e.g. I. M. Textiles"
                  />
                </div>

                {/* 8. Shed / Mill Owner */}
                <div className="form-group">
                  <label>Shed / Mill Owner *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Kalawant Shed 3"
                    value={header.shed}
                    onChange={e => setHeader({ ...header, shed: e.target.value })}
                    required
                  />
                </div>

                {/* 9. Quality (Auto-filled & Editable) */}
                <div className="form-group">
                  <label>Quality</label>
                  <input
                    type="text"
                    className="form-control"
                    value={header.quality || ''}
                    onChange={e => setHeader({ ...header, quality: e.target.value })}
                    placeholder="e.g. 82&quot; 84x54 30 OE x 30 OE"
                  />
                </div>

                {/* 10. Count & Ticket (Auto-filled & Editable) */}
                <div className="form-group">
                  <label>Count & Ticket</label>
                  <input
                    type="text"
                    className="form-control"
                    value={header.countAndTicket || ''}
                    onChange={e => setHeader({ ...header, countAndTicket: e.target.value })}
                    placeholder="e.g. 30 OE KATYA"
                  />
                </div>

                {/* 11. Total Ends (Auto-filled & Editable) */}
                <div className="form-group">
                  <label>Total Ends</label>
                  <input
                    type="number"
                    className="form-control"
                    value={header.totalEnds || ''}
                    onChange={e => setHeader({ ...header, totalEnds: e.target.value })}
                    placeholder="e.g. 7000"
                  />
                </div>

                {/* 12. Total Beams Count */}
                <div className="form-group">
                  <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Total Beams Count</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>In this delivery</span>
                  </label>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      className="form-control"
                      value={header.totalBeamsCount}
                      onChange={e => setHeader({ ...header, totalBeamsCount: e.target.value })}
                    />
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleGenerateBeams(header.totalBeamsCount)}
                      title="Set Rows"
                      style={{ whiteSpace: 'nowrap' }}
                    >
                      Set Grid
                    </button>
                  </div>
                </div>
              </div>

              {/* Order Reference Note */}
              {header.orderNo && (
                <div style={{ marginTop: 12, padding: '6px 12px', background: 'var(--primary-blue-light)', borderRadius: 4, display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: '0.78rem', color: 'var(--primary-blue-dark)' }}>
                  <Tag size={14} />
                  <span>Linked Order: <strong>{header.orderNo}</strong></span>
                </div>
              )}
            </div>
          </div>

          {/* =========================================================
              SUB-TABS: WHITE SLIP (BEAMS) vs PINK SLIP (RECONCILIATION)
          ========================================================= */}
          <div className="subtab-nav">
            <button
              type="button"
              className={`subtab-btn ${entrySubTab === 'white-slip' ? 'active-white' : ''}`}
              onClick={() => setEntrySubTab('white-slip')}
            >
              <Layers size={16} />
              <span>Sized Beams List</span>
              <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>
                {beamRows.length} Beams
              </span>
            </button>

          </div>

          {/* =========================================================
              SUB-TAB 1: SIZED BEAMS LIST (WHITE SLIP)
          ========================================================= */}
          {entrySubTab === 'white-slip' && (
            <div className="section-card" style={{ marginBottom: 24 }}>
              <div className="section-card-header" style={{ background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="section-card-title">
                  <Layers size={18} color="var(--primary-blue-dark)" />
                  <div>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0 }}>
                      Sized Beams List ({beamRows.length} {beamRows.length === 1 ? 'Beam' : 'Beams'})
                    </h3>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Log individual physical warp beams with flange IDs, cuts, meters, and gross/tare weights
                    </span>
                  </div>
                </div>
                <div className="section-card-actions" style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={handleAddBeamRow}
                  >
                    <Plus size={14} />
                    <span>Add Beam Row</span>
                  </button>
                </div>
              </div>

              <div style={{ padding: 16 }}>
                <div className="beam-table-container">
                  <div className="table-responsive">
                    <table className="beam-table">
                      <thead>
                        <tr>
                          <th style={{ width: 45, textAlign: 'center' }}>Sr.</th>
                          <th style={{ width: 90 }}>Beam No. *</th>
                          <th style={{ width: 110 }}>Flange No. *</th>
                          <th style={{ width: 95 }}>Cuts *</th>
                          <th style={{ width: 110 }}>Meters *</th>
                          <th style={{ width: 110 }}>Gross Wt (kg)</th>
                          <th style={{ width: 110 }}>Tare Wt (kg)</th>
                          <th style={{ width: 120 }}>Net Yarn Wt (kg)</th>
                          <th style={{ width: 140 }}>Status</th>
                          <th style={{ width: 170 }}>Stored At</th>
                          <th>Remark</th>
                          <th style={{ width: 50, textAlign: 'center' }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {beamRows.map((row, idx) => (
                          <tr key={row.id}>
                            {/* Sr No */}
                            <td style={{ textAlign: 'center', fontWeight: 600, color: 'var(--text-muted)' }}>
                              {idx + 1}
                            </td>

                            {/* Beam No */}
                            <td>
                              <input
                                type="text"
                                className="beam-table-input"
                                placeholder={`Beam ${idx + 1}`}
                                value={row.beamNo}
                                onChange={e => handleBeamCellChange(row.id, 'beamNo', e.target.value)}
                                required
                              />
                            </td>

                            {/* Flange No (Mandatory) */}
                            <td>
                              <input
                                type="text"
                                className="beam-table-input"
                                placeholder="e.g. 67, 60"
                                value={row.flangeNo}
                                onChange={e => handleBeamCellChange(row.id, 'flangeNo', e.target.value)}
                                required
                                style={{
                                  borderColor: !row.flangeNo.trim() ? '#fca5a5' : undefined,
                                  fontWeight: 600
                                }}
                              />
                            </td>

                            {/* Cuts */}
                            <td>
                              <input
                                type="number"
                                step="0.01"
                                min="0.01"
                                className="beam-table-input"
                                placeholder="23.00"
                                value={row.cuts}
                                onChange={e => handleBeamCellChange(row.id, 'cuts', e.target.value)}
                                required
                              />
                            </td>

                            {/* Meters */}
                            <td>
                              <input
                                type="number"
                                step="0.01"
                                min="0.01"
                                className="beam-table-input"
                                placeholder="3726.00"
                                value={row.meter}
                                onChange={e => handleBeamCellChange(row.id, 'meter', e.target.value)}
                                required
                              />
                            </td>

                            {/* Gross Weight */}
                            <td>
                              <input
                                type="number"
                                step="0.001"
                                className="beam-table-input"
                                placeholder="Gross (kg)"
                                value={row.grossWeight}
                                onChange={e => handleBeamCellChange(row.id, 'grossWeight', e.target.value)}
                              />
                            </td>

                            {/* Tare Weight */}
                            <td>
                              <input
                                type="number"
                                step="0.001"
                                className="beam-table-input"
                                placeholder="Tare (kg)"
                                value={row.tareWeight}
                                onChange={e => handleBeamCellChange(row.id, 'tareWeight', e.target.value)}
                              />
                            </td>

                            {/* Net Yarn Weight (Auto-calculated) */}
                            <td>
                              <div style={{
                                padding: '6px 8px',
                                background: '#f8fafc',
                                border: '1px solid var(--border-color)',
                                borderRadius: 4,
                                fontWeight: 700,
                                color: 'var(--primary-blue-dark)',
                                textAlign: 'right',
                                fontSize: '0.85rem'
                              }}>
                                {row.netWeight ? `${row.netWeight} kg` : '-'}
                              </div>
                            </td>

                            {/* Status */}
                            <td>
                              <select
                                className="beam-table-input"
                                value={row.status}
                                onChange={e => handleBeamCellChange(row.id, 'status', e.target.value)}
                              >
                                <option value="In Stock">In Stock</option>
                                <option value="Loaded on Loom">Loaded on Loom</option>
                                <option value="Completed">Completed</option>
                              </select>
                            </td>

                            {/* Stored At */}
                            <td>
                              <select
                                className="beam-table-input"
                                value={row.storedAt}
                                onChange={e => handleBeamCellChange(row.id, 'storedAt', e.target.value)}
                              >
                                <option value="">-- Select Location --</option>
                                {[...yarnStorageLocations].sort((first, second) => first.locationName.localeCompare(second.locationName)).map(location => (
                                  <option key={location.storageLocationId} value={location.locationName}>
                                    {location.locationName}
                                  </option>
                                ))}
                              </select>
                            </td>

                            {/* Remark */}
                            <td>
                              <input
                                type="text"
                                className="beam-table-input"
                                placeholder="Notes on flange / beam condition"
                                value={row.remark}
                                onChange={e => handleBeamCellChange(row.id, 'remark', e.target.value)}
                              />
                            </td>

                            {/* Action */}
                            <td style={{ textAlign: 'center' }}>
                              <button
                                type="button"
                                className="btn-icon"
                                onClick={() => handleRemoveBeamRow(row.id)}
                                style={{ color: 'var(--color-danger)', width: 28, height: 28 }}
                                title="Delete Row"
                              >
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>

                      {/* DYNAMIC SUMMARY FOOTER */}
                      <tfoot>
                        <tr style={{ background: '#f8fafc', borderTop: '2px solid var(--border-color)' }}>
                          <td colSpan="3" style={{ fontWeight: 700, textAlign: 'right', padding: '10px 12px' }}>
                            Beam Summary ({beamRows.length} Beams):
                          </td>
                          <td style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                            {formatNum(beamTotals.totalCuts, 2)} cuts
                          </td>
                          <td style={{ fontWeight: 700, color: 'var(--primary-blue-dark)' }}>
                            {formatNum(beamTotals.totalMeters, 2)} m
                          </td>
                          <td style={{ fontWeight: 600, color: 'var(--text-muted)' }}>
                            {beamTotals.totalGross > 0 ? `${formatNum(beamTotals.totalGross, 2)} kg` : '-'}
                          </td>
                          <td style={{ fontWeight: 600, color: 'var(--text-muted)' }}>
                            {beamTotals.totalTare > 0 ? `${formatNum(beamTotals.totalTare, 2)} kg` : '-'}
                          </td>
                          <td style={{ fontWeight: 700, color: '#059669', textAlign: 'right' }}>
                            {beamTotals.totalNet > 0 ? `${formatNum(beamTotals.totalNet, 2)} kg` : '-'}
                          </td>
                          <td colSpan="4"></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================
              SUB-TAB 2: YARN RECONCILIATION & BALANCE RETURN (PINK SLIP)
          ========================================================= */}
          {entrySubTab === 'pink-slip' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 24 }}>
              {/* SECTION 2A: ISSUED VS. CONSUMED SUMMARY CARD */}
              <div className="section-card">
                <div className="section-card-header" style={{ background: '#fff1f2' }}>
                  <div className="section-card-title">
                    <Scale size={18} color="#e11d48" />
                    <div>
                      <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#9f1239', margin: 0 }}>
                        Section 2A: Issued Raw Yarn Parameters
                      </h3>
                      <span style={{ fontSize: '0.75rem', color: '#be123c' }}>
                        Baseline yarn quantity sent to sizing unit for tare deduction and consumption calculation
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ padding: 20 }}>
                  <div className="form-grid-4">
                    {/* Total Yarn Issued Bags */}
                    <div className="form-group">
                      <label>Total Yarn Issued (Bags)</label>
                      <input
                        type="number"
                        step="0.01"
                        className="form-control"
                        value={reconciliation.totalIssuedBags}
                        onChange={e => setReconciliation({ ...reconciliation, totalIssuedBags: e.target.value })}
                        placeholder="e.g. 28 Bags"
                      />
                    </div>

                    {/* Cones Per Bag */}
                    <div className="form-group">
                      <label>Cones Per Bag (Standard)</label>
                      <input
                        type="number"
                        className="form-control"
                        value={reconciliation.conesPerBag}
                        onChange={e => setReconciliation({ ...reconciliation, conesPerBag: e.target.value })}
                        placeholder="32"
                      />
                    </div>

                    {/* Total Issued Cones */}
                    <div className="form-group">
                      <label style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Total Issued Cones</span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Bags × Cones/Bag</span>
                      </label>
                      <input
                        type="number"
                        className="form-control"
                        value={reconciliationSummary.issuedCones}
                        readOnly
                        style={{ background: '#f8fafc' }}
                        placeholder="e.g. 896"
                      />
                    </div>

                    {/* Issued Gross Weight (kg) */}
                    <div className="form-group">
                      <label>Issued Gross Weight (Kg)</label>
                      <input
                        type="number"
                        step="0.001"
                        className="form-control"
                        value={reconciliation.issuedGrossWeight}
                        onChange={e => setReconciliation({ ...reconciliation, issuedGrossWeight: e.target.value })}
                        placeholder="e.g. 1733.760"
                      />
                    </div>

                    {/* Empty Cone Tare Weight (g) */}
                    <div className="form-group">
                      <label style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Empty Cone Tare Weight (g)</span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--primary-blue-dark)' }}>Standard 60g</span>
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        className="form-control"
                        value={reconciliation.emptyConeTareGrams}
                        onChange={e => setReconciliation({ ...reconciliation, emptyConeTareGrams: e.target.value })}
                        placeholder="60"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 2B: BALANCE YARN RETURN GRID ("BALANCE RETURN TABLE") */}
              <div className="section-card">
                <div className="section-card-header" style={{ background: '#fff1f2', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div className="section-card-title">
                    <RotateCcw size={18} color="#e11d48" />
                    <div>
                      <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#9f1239', margin: 0 }}>
                        Section 2B: Balance Yarn Return Grid ({balanceReturns.length} Rows)
                      </h3>
                      <span style={{ fontSize: '0.75rem', color: '#be123c' }}>
                        Log unconsumed full bags, partial bags, loose cones, and scrap returned by sizer
                      </span>
                    </div>
                  </div>
                  <div className="section-card-actions">
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={handleAddReturnRow}
                      style={{ borderColor: '#fecdd3', color: '#be123c' }}
                    >
                      <Plus size={14} />
                      <span>Add Return Row</span>
                    </button>
                  </div>
                </div>

                <div style={{ padding: 16 }}>
                  <div className="beam-table-container" style={{ borderColor: '#fecdd3' }}>
                    <div className="table-responsive">
                      <table className="beam-table">
                        <thead>
                          <tr style={{ background: '#fff1f2' }}>
                            <th style={{ width: 45, textAlign: 'center' }}>Sr.</th>
                            <th style={{ width: 160 }}>Item Type</th>
                            <th style={{ width: 170 }}>Yarn Count & Ticket</th>
                            <th style={{ width: 110 }}>Bags Returned</th>
                            <th style={{ width: 110 }}>Cones Returned</th>
                            <th style={{ width: 130 }}>Returned Wt (Kg) *</th>
                            <th style={{ width: 200 }}>Destination Warehouse</th>
                            <th>Remark</th>
                            <th style={{ width: 50, textAlign: 'center' }}>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {balanceReturns.map((row, idx) => (
                            <tr key={row.id}>
                              {/* Sr */}
                              <td style={{ textAlign: 'center', fontWeight: 600, color: 'var(--text-muted)' }}>
                                {idx + 1}
                              </td>

                              {/* Item Type */}
                              <td>
                                <select
                                  className="beam-table-input"
                                  value={row.itemType}
                                  onChange={e => handleReturnCellChange(row.id, 'itemType', e.target.value)}
                                >
                                  <option value="Full Bag">Full Bag</option>
                                  <option value="Partial / Loose Bag">Partial / Loose Bag</option>
                                  <option value="Empty Cones Scrap">Empty Cones Scrap</option>
                                </select>
                              </td>

                              {/* Count & Ticket */}
                              <td>
                                <input
                                  type="text"
                                  className="beam-table-input"
                                  value={row.countAndTicket || header.countAndTicket || ''}
                                  onChange={e => handleReturnCellChange(row.id, 'countAndTicket', e.target.value)}
                                  placeholder="Count & Ticket"
                                />
                              </td>

                              {/* Bags Returned */}
                              <td>
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  className="beam-table-input"
                                  placeholder="0"
                                  value={row.bagsReturned}
                                  onChange={e => handleReturnCellChange(row.id, 'bagsReturned', e.target.value)}
                                />
                              </td>

                              {/* Cones Returned */}
                              <td>
                                <input
                                  type="number"
                                  min="0"
                                  className="beam-table-input"
                                  placeholder="0"
                                  value={row.conesReturned}
                                  onChange={e => handleReturnCellChange(row.id, 'conesReturned', e.target.value)}
                                />
                              </td>

                              {/* Returned Weight (Kg) */}
                              <td>
                                <input
                                  type="number"
                                  step="0.001"
                                  min="0"
                                  className="beam-table-input"
                                  placeholder="0.000 kg"
                                  value={row.returnedWeightKg}
                                  onChange={e => handleReturnCellChange(row.id, 'returnedWeightKg', e.target.value)}
                                  style={{ fontWeight: 600, color: '#be123c' }}
                                />
                              </td>

                              {/* Destination Warehouse */}
                              <td>
                                <select
                                  className="beam-table-input"
                                  value={row.destinationWarehouse}
                                  onChange={e => handleReturnCellChange(row.id, 'destinationWarehouse', e.target.value)}
                                >
                                  <option value="Main Raw Yarn Warehouse">Main Raw Yarn Warehouse</option>
                                  <option value="Shed 1 Raw Storage">Shed 1 Raw Storage</option>
                                  <option value="Shed 2 Raw Storage">Shed 2 Raw Storage</option>
                                  <option value="Kalawant Warehouse">Kalawant Warehouse</option>
                                  {yarnStorageLocations.map(loc => (
                                    <option key={loc.locationId} value={loc.locationName}>
                                      {loc.locationName}
                                    </option>
                                  ))}
                                </select>
                              </td>

                              {/* Remark */}
                              <td>
                                <input
                                  type="text"
                                  className="beam-table-input"
                                  placeholder="e.g. Loose cones returned"
                                  value={row.remark}
                                  onChange={e => handleReturnCellChange(row.id, 'remark', e.target.value)}
                                />
                              </td>

                              {/* Action */}
                              <td style={{ textAlign: 'center' }}>
                                <button
                                  type="button"
                                  className="btn-icon"
                                  onClick={() => handleRemoveReturnRow(row.id)}
                                  style={{ color: 'var(--color-danger)', width: 28, height: 28 }}
                                  title="Delete Return Row"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>

                        {/* Summary Footer */}
                        <tfoot>
                          <tr style={{ background: '#fff1f2', borderTop: '2px solid #fecdd3' }}>
                            <td colSpan="3" style={{ fontWeight: 700, textAlign: 'right', padding: '10px 12px' }}>
                              Total Balance Yarn Returned:
                            </td>
                            <td style={{ fontWeight: 700 }}>
                              {reconciliationSummary.totalReturnedBags > 0 ? `${reconciliationSummary.totalReturnedBags} bags` : '-'}
                            </td>
                            <td style={{ fontWeight: 700 }}>
                              {reconciliationSummary.totalReturnedCones > 0 ? `${reconciliationSummary.totalReturnedCones} cones` : '-'}
                            </td>
                            <td style={{ fontWeight: 700, color: '#e11d48', fontSize: '0.95rem' }}>
                              {reconciliationSummary.totalReturnedWeightKg > 0 ? `${formatNum(reconciliationSummary.totalReturnedWeightKg, 3)} kg` : '0.000 kg'}
                            </td>
                            <td colSpan="3"></td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 2C: AUTOMATED RECONCILIATION SUMMARY CARD */}
              <div className="reconciliation-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <Calculator size={20} color="var(--primary-blue-dark)" />
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                    Section 2C: Automated Yarn Stock Reconciliation Summary
                  </h3>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
                  {/* Step 1: Issued Gross */}
                  <div style={{ background: '#ffffff', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '12px 16px' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>1. Issued Gross Weight</span>
                    <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)', marginTop: 4 }}>
                      {formatNum(reconciliationSummary.issuedGrossWeight, 3)} kg
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {reconciliationSummary.issuedBags} bags ({reconciliationSummary.issuedCones} cones)
                    </span>
                  </div>

                  {/* Step 2: Empty Cone Tare */}
                  <div style={{ background: '#ffffff', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '12px 16px' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>2. Empty Cone Tare Deduction</span>
                    <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#d97706', marginTop: 4 }}>
                      - {formatNum(reconciliationSummary.totalEmptyConeTareKg, 3)} kg
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {reconciliationSummary.issuedCones} cones × {reconciliationSummary.tareGrams}g
                    </span>
                  </div>

                  {/* Step 3: Net Yarn Issued */}
                  <div style={{ background: '#ffffff', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '12px 16px' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>3. Net Yarn Issued to Sizer</span>
                    <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--primary-blue-dark)', marginTop: 4 }}>
                      = {formatNum(reconciliationSummary.netYarnIssuedKg, 3)} kg
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      (Gross − Total Cone Tare)
                    </span>
                  </div>

                  {/* Step 4: Balance Returned */}
                  <div style={{ background: '#ffffff', border: '1px solid #fecdd3', borderRadius: 'var(--radius-md)', padding: '12px 16px' }}>
                    <span style={{ fontSize: '0.72rem', color: '#be123c', textTransform: 'uppercase', fontWeight: 600 }}>4. Balance Yarn Returned</span>
                    <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#e11d48', marginTop: 4 }}>
                      - {formatNum(reconciliationSummary.totalReturnedWeightKg, 3)} kg
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#be123c' }}>
                      {reconciliationSummary.totalReturnedBags} bags / {reconciliationSummary.totalReturnedCones} cones
                    </span>
                  </div>

                  {/* Step 5: Final Net Consumed */}
                  <div style={{ background: 'linear-gradient(135deg, #059669 0%, #047857 100%)', color: '#ffffff', borderRadius: 'var(--radius-md)', padding: '12px 16px', boxShadow: '0 4px 6px -1px rgba(5, 150, 105, 0.2)' }}>
                    <span style={{ fontSize: '0.72rem', color: '#d1fae5', textTransform: 'uppercase', fontWeight: 700 }}>5. Actual Net Yarn Consumed</span>
                    <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#ffffff', marginTop: 4 }}>
                      {formatNum(reconciliationSummary.netYarnConsumedKg, 3)} kg
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#a7f3d0' }}>
                      Exact Yarn Bound on Beams
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Form Action Controls (Global for Single Workflow) */}
          <div style={{ padding: '0 4px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                Yarn reconciliation is recorded in Yarn Return from Sizing.
              </span>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleResetForm}
                disabled={submitting}
              >
                <RotateCcw size={16} />
                <span>Reset All</span>
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting}
                style={{ minWidth: 220 }}
              >
                <Save size={16} />
                <span>{submitting ? 'Processing Entry & Stock...' : 'Save Inward & Reconcile Stock'}</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* =========================================================
          TAB 2: ALL INWARD CHALLANS & BEAMS HISTORY
      ========================================================= */}
      {activeTab === 'history' && (
        <div className="section-card">
          <div className="section-card-header">
            <div className="section-card-title">
              <FileText size={18} color="var(--primary-blue-dark)" />
              <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>
                Logged Sized Beam Inward Records ({filteredBeams.length})
              </h3>
            </div>
            <div className="section-card-actions" style={{ display: 'flex', gap: 10 }}>
              {/* Search input */}
              <div className="search-box" style={{ width: 260 }}>
                <Search size={16} />
                <input
                  type="text"
                  placeholder="Search inward, flange, set, party..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Status Filter */}
              <select
                className="form-control"
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                style={{ width: 160 }}
              >
                <option value="ALL">All Statuses</option>
                <option value="In Stock">In Stock</option>
                <option value="Loaded on Loom">Loaded on Loom</option>
                <option value="Completed">Completed</option>
              </select>

              <button
                className="btn btn-primary btn-sm"
                onClick={() => setActiveTab('entry')}
              >
                <Plus size={14} />
                <span>New Inward</span>
              </button>
            </div>
          </div>

          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Inward No</th>
                  <th>Date</th>
                  <th>Challan No</th>
                  <th>Sizing Set</th>
                  <th>Sizer Unit</th>
                  <th>Client</th>
                  <th>Beam No</th>
                  <th>Flange No</th>
                  <th>Cuts</th>
                  <th>Meters</th>
                  <th>Net Wt</th>
                  <th>Status</th>
                  <th>Stored At</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="14" style={{ textAlign: 'center', padding: 32 }}>
                      Loading beam inward records...
                    </td>
                  </tr>
                ) : filteredBeams.length === 0 ? (
                  <tr>
                    <td colSpan="14" style={{ textAlign: 'center', padding: 36, color: 'var(--text-muted)' }}>
                      No sized beam inward records found matching your filters.
                    </td>
                  </tr>
                ) : (
                  filteredBeams.map(beam => (
                    <tr key={beam.beamId}>
                      <td style={{ fontWeight: 700, color: 'var(--primary-blue-dark)' }}>
                        {beam.inwardNo || `#${beam.beamId}`}
                      </td>
                      <td>{formatDate(beam.inwardDate)}</td>
                      <td>
                        <span className="badge badge-subtle">
                          {beam.challanNo || '-'}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600 }}>{beam.sizingSet?.setNo || '-'}</td>
                      <td>{beam.sizingUnit?.sizingName || '-'}</td>
                      <td>{beam.party?.partyName || beam.order?.party?.partyName || '-'}</td>
                      <td style={{ fontWeight: 600 }}>Beam {beam.beamNo || '-'}</td>
                      <td>
                        <span className="badge badge-info" style={{ fontWeight: 700 }}>
                          #{beam.flangeNo || 'N/A'}
                        </span>
                      </td>
                      <td>{beam.cuts ? `${beam.cuts} cuts` : '-'}</td>
                      <td style={{ fontWeight: 600 }}>{formatNum(beam.meter, 2)} m</td>
                      <td>{beam.netWeight ? `${formatNum(beam.netWeight, 2)} kg` : (beam.weightKg ? `${formatNum(beam.weightKg, 2)} kg` : '-')}</td>
                      <td>{renderStatusBadge(beam.status)}</td>
                      <td>{beam.storedAt || '-'}</td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                          <button
                            className="btn-icon"
                            onClick={() => setViewBeamModal(beam)}
                            title="View Details"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            className="btn-icon"
                            onClick={() => openEditModal(beam)}
                            title="Edit Record"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            className="btn-icon"
                            style={{ color: 'var(--color-danger)' }}
                            onClick={() => handleDeleteBeam(beam)}
                            title="Delete"
                          >
                            <Trash2 size={14} />
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
      )}

      {/* =========================================================
          TAB 3: EQUIPMENT & FLANGE TRACKER
      ========================================================= */}
      {activeTab === 'flange-tracker' && (
        <div className="section-card">
          <div className="section-card-header">
            <div className="section-card-title">
              <SlidersHorizontal size={18} color="var(--primary-blue-dark)" />
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>
                  Equipment & Flange Wheel Inventory Tracker ({flangeEquipmentList.length} Flanges)
                </h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Monitor physical location and status of metal beam flanges across shed inventory and looms
                </span>
              </div>
            </div>
            <div className="section-card-actions">
              <div className="search-box" style={{ width: 280 }}>
                <Search size={16} />
                <input
                  type="text"
                  placeholder="Search flange code, beam, shed..."
                  value={flangeSearch}
                  onChange={e => setFlangeSearch(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Flange No (ID)</th>
                  <th>Current Status</th>
                  <th>Current Beam</th>
                  <th>Shed / Mill Owner</th>
                  <th>Sizing Set</th>
                  <th>Sizing Unit</th>
                  <th>Meters</th>
                  <th>Last Inward Date</th>
                  <th>Inward Challan</th>
                  <th>Condition / Remark</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {flangeEquipmentList.length === 0 ? (
                  <tr>
                    <td colSpan="11" style={{ textAlign: 'center', padding: 36, color: 'var(--text-muted)' }}>
                      No flanges recorded in equipment inventory.
                    </td>
                  </tr>
                ) : (
                  flangeEquipmentList.map(item => (
                    <tr key={item.beamId}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span className="badge badge-info" style={{ fontSize: '0.85rem', fontWeight: 700, padding: '4px 10px' }}>
                            Flange #{item.flangeNo}
                          </span>
                        </div>
                      </td>
                      <td>{renderStatusBadge(item.status)}</td>
                      <td style={{ fontWeight: 600 }}>Beam {item.beamNo || '-'}</td>
                      <td>{item.shed || 'Main Shed'}</td>
                      <td>{item.sizingSet?.setNo || '-'}</td>
                      <td>{item.sizingUnit?.sizingName || '-'}</td>
                      <td style={{ fontWeight: 600 }}>{formatNum(item.meter, 2)} m</td>
                      <td>{formatDate(item.inwardDate)}</td>
                      <td>{item.challanNo ? `Slip #${item.challanNo}` : '-'}</td>
                      <td>{item.remark || 'Good condition'}</td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          className="btn-icon"
                          onClick={() => openEditModal(item)}
                          title="Update Flange Status"
                        >
                          <Edit2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================
          VIEW BEAM DETAILS MODAL
      ========================================================= */}
      {viewBeamModal && (
        <Modal
          isOpen={true}
          onClose={() => setViewBeamModal(null)}
          title={`Sized Beam Details - Inward ${viewBeamModal.inwardNo || viewBeamModal.beamId}`}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, background: '#f8fafc', padding: 16, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <div><span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Inward Number:</span><div style={{ fontWeight: 700, color: 'var(--primary-blue-dark)' }}>{viewBeamModal.inwardNo || '-'}</div></div>
              <div><span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Inward Date:</span><div style={{ fontWeight: 600 }}>{formatDate(viewBeamModal.inwardDate)}</div></div>
              <div><span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Challan / Slip No:</span><div style={{ fontWeight: 600 }}>{viewBeamModal.challanNo || '-'}</div></div>
              <div><span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Challan Date:</span><div style={{ fontWeight: 600 }}>{formatDate(viewBeamModal.challanDate)}</div></div>
              <div><span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Sizing Set:</span><div style={{ fontWeight: 600 }}>{viewBeamModal.sizingSet?.setNo || '-'}</div></div>
              <div><span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Sizing Unit:</span><div style={{ fontWeight: 600 }}>{viewBeamModal.sizingUnit?.sizingName || '-'}</div></div>
              <div><span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Client / Party:</span><div style={{ fontWeight: 600 }}>{viewBeamModal.party?.partyName || viewBeamModal.order?.party?.partyName || '-'}</div></div>
              <div><span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Shed Destination:</span><div style={{ fontWeight: 600 }}>{viewBeamModal.shed || '-'}</div></div>
              <div><span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Quality:</span><div style={{ fontWeight: 600 }}>{viewBeamModal.quality || '-'}</div></div>
              <div><span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Count & Ticket:</span><div style={{ fontWeight: 600 }}>{viewBeamModal.count?.countName} {viewBeamModal.tickit?.tickitName}</div></div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, padding: 12, background: 'var(--primary-blue-light)', borderRadius: 'var(--radius-md)' }}>
              <div><span style={{ fontSize: '0.72rem', color: 'var(--primary-blue-dark)', fontWeight: 600 }}>BEAM NO</span><div style={{ fontSize: '1.1rem', fontWeight: 700 }}>#{viewBeamModal.beamNo}</div></div>
              <div><span style={{ fontSize: '0.72rem', color: 'var(--primary-blue-dark)', fontWeight: 600 }}>FLANGE NO</span><div style={{ fontSize: '1.1rem', fontWeight: 700 }}>#{viewBeamModal.flangeNo}</div></div>
              <div><span style={{ fontSize: '0.72rem', color: 'var(--primary-blue-dark)', fontWeight: 600 }}>CUTS</span><div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{viewBeamModal.cuts || '-'}</div></div>
              <div><span style={{ fontSize: '0.72rem', color: 'var(--primary-blue-dark)', fontWeight: 600 }}>METERS</span><div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{formatNum(viewBeamModal.meter, 2)} m</div></div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <div><span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Gross Weight:</span><div style={{ fontWeight: 600 }}>{viewBeamModal.grossWeight ? `${viewBeamModal.grossWeight} kg` : '-'}</div></div>
              <div><span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Tare Weight:</span><div style={{ fontWeight: 600 }}>{viewBeamModal.tareWeight ? `${viewBeamModal.tareWeight} kg` : '-'}</div></div>
              <div><span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Net Yarn Weight:</span><div style={{ fontWeight: 700, color: '#059669' }}>{viewBeamModal.netWeight ? `${viewBeamModal.netWeight} kg` : (viewBeamModal.weightKg ? `${viewBeamModal.weightKg} kg` : '-')}</div></div>
            </div>

            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Stored At:</span>
              <div style={{ fontWeight: 600 }}>{viewBeamModal.storedAt || '-'}</div>
            </div>

            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Current Status:</span>
              <div style={{ marginTop: 4 }}>{renderStatusBadge(viewBeamModal.status)}</div>
            </div>

            {viewBeamModal.remark && (
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Remarks / Flange condition:</span>
                <p style={{ marginTop: 4, background: '#f8fafc', padding: 8, borderRadius: 4, fontSize: '0.85rem' }}>{viewBeamModal.remark}</p>
              </div>
            )}
          </div>
          <div className="modal-footer" style={{ marginTop: 20 }}>
            <button className="btn btn-secondary" onClick={() => setViewBeamModal(null)}>Close</button>
          </div>
        </Modal>
      )}

      {/* =========================================================
          EDIT BEAM RECORD MODAL
      ========================================================= */}
      {editBeamModal && editForm && (
        <Modal
          isOpen={true}
          onClose={() => setEditBeamModal(null)}
          title={`Edit Beam #${editBeamModal.beamNo || editBeamModal.beamId} (Flange: ${editBeamModal.flangeNo || 'N/A'})`}
        >
          <form onSubmit={handleUpdateSingleBeam}>
            <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <div className="form-group">
                <label>Inward No</label>
                <input
                  type="text"
                  className="form-control"
                  value={editForm.inwardNo}
                  onChange={e => setEditForm({ ...editForm, inwardNo: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Inward Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={editForm.inwardDate}
                  onChange={e => setEditForm({ ...editForm, inwardDate: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Challan No</label>
                <input
                  type="text"
                  className="form-control"
                  value={editForm.challanNo}
                  onChange={e => setEditForm({ ...editForm, challanNo: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Challan Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={editForm.challanDate}
                  onChange={e => setEditForm({ ...editForm, challanDate: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Beam No *</label>
                <input
                  type="text"
                  className="form-control"
                  value={editForm.beamNo}
                  onChange={e => setEditForm({ ...editForm, beamNo: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Flange No * (Equipment ID)</label>
                <input
                  type="text"
                  className="form-control"
                  value={editForm.flangeNo}
                  onChange={e => setEditForm({ ...editForm, flangeNo: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Cuts *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  className="form-control"
                  value={editForm.cuts}
                  onChange={e => setEditForm({ ...editForm, cuts: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Meters *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  className="form-control"
                  value={editForm.meter}
                  onChange={e => setEditForm({ ...editForm, meter: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Gross Weight (Kg)</label>
                <input
                  type="number"
                  step="0.001"
                  className="form-control"
                  value={editForm.grossWeight}
                  onChange={e => setEditForm({ ...editForm, grossWeight: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Tare Weight (Kg)</label>
                <input
                  type="number"
                  step="0.001"
                  className="form-control"
                  value={editForm.tareWeight}
                  onChange={e => setEditForm({ ...editForm, tareWeight: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Status (Equipment Location)</label>
                <select
                  className="form-control"
                  value={editForm.status}
                  onChange={e => setEditForm({ ...editForm, status: e.target.value })}
                >
                  <option value="In Stock">In Stock</option>
                  <option value="Loaded on Loom">Loaded on Loom</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>

              <div className="form-group">
                <label>Stored At</label>
                <select
                  className="form-control"
                  value={editForm.storedAt}
                  onChange={e => setEditForm({ ...editForm, storedAt: e.target.value })}
                >
                  <option value="">-- Select Location --</option>
                  {[...yarnStorageLocations].sort((first, second) => first.locationName.localeCompare(second.locationName)).map(location => (
                    <option key={location.storageLocationId} value={location.locationName}>
                      {location.locationName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Shed Location</label>
                <input
                  type="text"
                  className="form-control"
                  value={editForm.shed}
                  onChange={e => setEditForm({ ...editForm, shed: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label>Remark / Flange condition</label>
                <input
                  type="text"
                  className="form-control"
                  value={editForm.remark}
                  onChange={e => setEditForm({ ...editForm, remark: e.target.value })}
                />
              </div>
            </div>

            <div className="modal-footer" style={{ marginTop: 20 }}>
              <button type="button" className="btn btn-secondary" onClick={() => setEditBeamModal(null)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Update Beam
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default BeamInwardView;
