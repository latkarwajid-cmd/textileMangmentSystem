import React, { useEffect, useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { Package, CheckCircle2, Plus } from 'lucide-react';
import { IssueYarnPickerModal } from '../components/IssueYarnPickerModal';

const emptyForm = {
  getpassNo: '',
  firmName: '',
  issueDate: new Date().toISOString().split('T')[0],
  rewindingName: '',
  remark: '',
};

export const RewindingIssueView = () => {
  const { addToast } = useApp();
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [issueRows, setIssueRows] = useState([]);
  const [loadingStock, setLoadingStock] = useState(false);
  const [rewindingRecords, setRewindingRecords] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showIssuePicker, setShowIssuePicker] = useState(false);

  const fetchAvailableYarn = async () => {
    setLoadingStock(true);
    try {
      const [yarnResult, sizingResult] = await Promise.allSettled([
        api.yarnInward.getAll(),
        api.sizingYarnInward.getAll(),
      ]);
      const yarnRows = (yarnResult.status === 'fulfilled' && Array.isArray(yarnResult.value) ? yarnResult.value : [])
        .filter(item => Number(item.bags ?? 0) > 0)
        .map(item => {
          const totalWeight = Number(item.weightKg ?? 0);
          const totalBags = Number(item.bags ?? 0);
          const weightPerBag = totalBags > 0 ? totalWeight / totalBags : 0;

          return {
            id: item.yarnInwardId,
            key: `yarn-${item.yarnInwardId}`,
            sourceType: 'yarnIn',
            sourceLabel: 'Yarn In',
            type: 'FRESH',
            setNo: '-',
            serialLabel: item.billNo || `YI-${item.yarnInwardId}`,
            countName: item.count?.countName || item.count?.countNo || '-',
            tickitName: item.tickit?.tickitName || item.tickit?.tickitNo || '-',
            supplierName: item.supplier?.partyName || item.storageParty?.partyName || '-',
            inwardDate: item.inwardDate || '',
            totalBags,
            remainingBags: totalBags,
            cones: Number(item.yCone ?? 0),
            weightPerBag,
            weightKg: totalWeight,
            remark: item.remark || '',
            checked: false,
            issueBags: '',
            issueCones: '',
            issueWeightKg: 0,
          };
        });

      const sizingRows = (sizingResult.status === 'fulfilled' && Array.isArray(sizingResult.value) ? sizingResult.value : [])
        .filter(item => Number(item.bags ?? 0) > 0)
        .map(item => {
          const totalBags = Number(item.bags ?? 0);
          const totalWeight = Number(item.weightKg ?? 0);
          return {
            id: item.sizingInwardId,
            key: `sizing-${item.sizingInwardId}`,
            sourceType: 'sizingIn',
            sourceLabel: 'Sizing In',
            type: 'FRESH',
            setNo: item.sizingSet?.setNo || '-',
            serialLabel: `SIn ${item.sizingInwardId}`,
            countName: item.count?.countName || item.count?.countNo || '-',
            tickitName: item.tickit?.tickitName || item.tickit?.tickitNo || '-',
            supplierName: item.party?.partyName || item.sizingUnit?.sizingName || '-',
            inwardDate: item.inwardDate || '',
            totalBags,
            remainingBags: totalBags,
            cones: 0,
            weightPerBag: totalBags > 0 ? totalWeight / totalBags : 0,
            weightKg: totalWeight,
            remark: item.remark || '',
            checked: false,
            issueBags: '',
            issueCones: '0',
            issueWeightKg: 0,
          };
        });

      if (yarnResult.status === 'rejected' && sizingResult.status === 'rejected') {
        throw yarnResult.reason || sizingResult.reason;
      }
      const availableRows = [...yarnRows, ...sizingRows];
      setIssueRows(previousRows => {
        const previousByKey = new Map(previousRows.map(row => [row.key, row]));
        return availableRows.map(row => {
          const previous = previousByKey.get(row.key);
          return previous?.checked
            ? { ...row, checked: true, issueBags: previous.issueBags, issueCones: previous.issueCones }
            : row;
        });
      });
    } catch (err) {
      addToast(err.message || 'Failed to load available yarn inward stock', 'error');
    } finally {
      setLoadingStock(false);
    }
  };

  const fetchRewindingRecords = async () => {
    try {
      const data = await api.rewindingIssues.getAll();
      setRewindingRecords(Array.isArray(data) ? data : []);
    } catch (err) {
      addToast(err.message || 'Failed to load rewinding records', 'error');
    }
  };

  useEffect(() => {
    fetchRewindingRecords();
  }, []);


  const filteredIssueRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return issueRows.filter(row => {
      if (sourceFilter !== 'all' && row.sourceType !== sourceFilter) return false;
      if (!query) return true;

      const haystack = [
        row.serialLabel,
        row.setNo,
        row.countName,
        row.tickitName,
        row.supplierName,
        row.inwardDate,
      ].join(' ').toLowerCase();

      return haystack.includes(query);
    });
  }, [issueRows, search, sourceFilter]);

  const updateField = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const toggleIssueRow = (rowId, checked) => {
    setIssueRows(prev => prev.map(row => {
      if (row.key !== rowId) return row;

      const safeBags = Number(row.remainingBags || 0);
      const availableCones = Number(row.cones || 0);

      return {
        ...row,
        checked,
        issueBags: checked ? String(safeBags) : '',
        issueCones: checked ? String(availableCones) : '',
        issueWeightKg: checked ? safeBags * Number(row.weightPerBag || 0) : 0,
      };
    }));
  };

  const handleBagsChange = (rowId, value) => {
    setIssueRows(prev => prev.map(row => {
      if (row.key !== rowId) return row;

      if (value === '') {
        return { ...row, issueBags: '', issueWeightKg: 0 };
      }

      const parsed = Number(value);
      const safeValue = Number.isFinite(parsed) ? Math.max(0, Math.min(parsed, Number(row.remainingBags || 0))) : 0;
      return {
        ...row,
        issueBags: String(safeValue),
        issueWeightKg: safeValue * Number(row.weightPerBag || 0),
      };
    }));
  };

  const handleConesChange = (rowId, value) => {
    setIssueRows(prev => prev.map(row => {
      if (row.key !== rowId) return row;

      if (value === '') {
        return { ...row, issueCones: '' };
      }

      const parsed = Number(value);
      const safeValue = Number.isFinite(parsed) ? Math.max(0, Math.min(parsed, Number(row.cones || 0))) : 0;
      return { ...row, issueCones: String(safeValue) };
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.getpassNo || !form.firmName || !form.rewindingName) {
      addToast('Getpass number, firm name and rewinding name are required', 'error');
      return;
    }

    const selected = issueRows.filter(row => row.checked);
    if (selected.length === 0) {
      addToast('Please select at least one yarn inward record to issue', 'error');
      return;
    }

    for (const row of selected) {
      const issueBags = Number(row.issueBags || 0);
      const issueCones = Number(row.issueCones || 0);

      if (!Number.isFinite(issueBags) || issueBags <= 0 || issueBags > Number(row.remainingBags || 0)) {
        addToast(`Enter valid bags for ${row.serialLabel}. Available: ${row.remainingBags}`, 'error');
        return;
      }

      if (!Number.isFinite(issueCones) || issueCones < 0 || issueCones > Number(row.cones || 0)) {
        addToast(`Enter valid cones for ${row.serialLabel}. Available: ${row.cones}`, 'error');
        return;
      }
    }

    try {
      setLoading(true);
      const payload = {
        getpassNo: form.getpassNo,
        firmName: form.firmName,
        issueDate: form.issueDate,
        rewindingName: form.rewindingName,
        remark: form.remark,
        lines: selected.map((row, index) => ({
          yarnInwardId: row.sourceType === 'yarnIn' ? row.id : null,
          sizingInwardId: row.sourceType === 'sizingIn' ? row.id : null,
          setNo: row.setNo === '-' ? null : row.setNo,
          seNo: row.serialLabel || `SE-${index + 1}`,
          countName: row.countName || '-',
          tickitName: row.tickitName || '-',
          bags: Number(row.issueBags || 0),
          cone: Number(row.issueCones || 0),
          weightKg: Number(row.issueWeightKg || 0),
          remark: row.remark || 'Issued to rewinding',
        })),
      };

      await api.rewindingIssues.create(payload);
      addToast('Yarn issued to rewinding successfully', 'success');
      setForm(emptyForm);
      setIssueRows(prev =>
        prev.map(row => ({
          ...row,
          checked: false,
          issueBags: '',
          issueCones: '',
          issueWeightKg: 0,
        }))
      );

      await fetchAvailableYarn();
      await fetchRewindingRecords();
      setShowIssuePicker(false);
      setShowForm(false);
    } catch (err) {
      addToast(err.message || 'Failed to issue yarn to rewinding', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="content-area">
      <div className="section-card">
        <div className="section-card-header">
          <div className="section-card-title">
            <Package size={20} color="var(--primary-blue)" />
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700 }}>
                Rewinding
              </h3>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Rewinding issue records
              </span>
            </div>
          </div>

          {!showForm && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                setForm({
                  ...emptyForm,
                  issueDate: new Date().toISOString().split('T')[0],
                });
                setShowIssuePicker(false);
                setShowForm(true);
              }}
            >
              <Plus size={16} />
              <span>New Rewinding</span>
            </button>
          )}
        </div>

        {!showForm ? (
          <div className="table-responsive" style={{ marginTop: 20 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Rewinding Sr No</th>
                  <th>Getpass No</th>
                  <th>Set No</th>
                  <th>Firm Name</th>
                  <th>Date</th>
                  <th>Rewinding Name</th>
                  <th>Remark</th>
                </tr>
              </thead>

              <tbody>
                {rewindingRecords.length === 0 ? (
                  <tr>
                    <td
                      colSpan="7"
                      style={{
                        textAlign: 'center',
                        padding: '28px',
                        color: 'var(--text-muted)',
                      }}
                    >
                      No rewinding records found.
                    </td>
                  </tr>
                ) : (
                  rewindingRecords.map((row, index) => (
                    <tr
                      key={
                        row.rewindingIssueId ||
                        row.rewindingId ||
                        row.id ||
                        index
                      }
                    >
                      {/* Normal running serial number: 1, 2, 3... */}
                      <td>{index + 1}</td>
                      <td>{row.getpassNo || '-'}</td>
                      <td>{[...new Set((row.lines || []).map(line => line.setNo).filter(Boolean))].join(', ') || '-'}</td>
                      <td>{row.firmName || '-'}</td>
                      <td>{row.issueDate || '-'}</td>
                      <td>{row.rewindingName || '-'}</td>
                      <td>{row.remark || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ marginTop: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setForm(emptyForm);
                  setShowForm(false);
                  setShowIssuePicker(false);
                }}
              >
                Back
              </button>
            </div>

            <div className="form-grid-4">
              <div className="form-group">
                <label>Getpass No</label>
                <input
                  className="form-control"
                  value={form.getpassNo}
                  onChange={e => updateField('getpassNo', e.target.value)}
                  placeholder="e.g. GP-001"
                  required
                />
              </div>

              <div className="form-group">
                <label>Firm Name</label>
                <input
                  className="form-control"
                  value={form.firmName}
                  onChange={e => updateField('firmName', e.target.value)}
                  placeholder="Customer / firm name"
                  required
                />
              </div>

              <div className="form-group">
                <label>Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={form.issueDate}
                  onChange={e => updateField('issueDate', e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Rewinding Name</label>
                <input
                  className="form-control"
                  value={form.rewindingName}
                  onChange={e => updateField('rewindingName', e.target.value)}
                  placeholder="Rewinding unit"
                  required
                />
              </div>

              <div
                className="form-group"
                style={{ gridColumn: '1 / -1' }}
              >
                <label>Remark</label>
                <textarea
                  className="form-control"
                  rows={3}
                  value={form.remark}
                  onChange={e => updateField('remark', e.target.value)}
                  placeholder="Optional remarks"
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
              <button type="button" className="btn btn-secondary" onClick={async () => {
                setSearch('');
                setSourceFilter('all');
                setShowIssuePicker(true);
                await fetchAvailableYarn();
              }}>
                <Package size={16} /> <span>Issue Yarn</span>
              </button>
            </div>

            <IssueYarnPickerModal
              isOpen={showIssuePicker}
              onClose={() => setShowIssuePicker(false)}
              rows={filteredIssueRows}
              loading={loadingStock}
              search={search}
              onSearchChange={setSearch}
              sourceFilter={sourceFilter}
              onSourceFilterChange={setSourceFilter}
              onToggle={toggleIssueRow}
              onBagsChange={handleBagsChange}
              onConesChange={handleConesChange}
              onDone={() => setShowIssuePicker(false)}
              showSetNo
            />

            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                marginTop: 20,
              }}
            >
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                <CheckCircle2 size={16} />
                <span>
                {loading ? 'Issuing...' : 'Issue to Rewinding'}
                </span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );

};
