import React, { useEffect, useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { Package, Search, CheckCircle2, Plus } from 'lucide-react';

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
  const [issueRows, setIssueRows] = useState([]);
  const [rewindingRecords, setRewindingRecords] = useState([]);
  const [showForm, setShowForm] = useState(false);

  const fetchAvailableYarn = async () => {
    try {
      const data = await api.yarnInward.getAll();
      const rows = (Array.isArray(data) ? data : [])
        .filter(item => Number(item.bags ?? 0) > 0)
        .map(item => {
          const totalWeight = Number(item.weightKg ?? 0);
          const totalBags = Number(item.bags ?? 0);
          const weightPerBag = totalBags > 0 ? totalWeight / totalBags : 0;

          return {
            id: item.yarnInwardId,
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

      setIssueRows(rows);
    } catch (err) {
      addToast(err.message || 'Failed to load available yarn inward stock', 'error');
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
    fetchAvailableYarn();
    fetchRewindingRecords();
  }, []);


  const filteredIssueRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return issueRows.filter(row => {
      if (!query) return true;

      const haystack = [
        row.serialLabel,
        row.countName,
        row.tickitName,
        row.supplierName,
        row.inwardDate,
      ].join(' ').toLowerCase();

      return haystack.includes(query);
    });
  }, [issueRows, search]);

  const updateField = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const toggleIssueRow = (rowId, checked) => {
    setIssueRows(prev => prev.map(row => {
      if (row.id !== rowId) return row;

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
      if (row.id !== rowId) return row;

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
      if (row.id !== rowId) return row;

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
          yarnInwardId: row.id,
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
                      colSpan="6"
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

            <div className="section-card" style={{ marginTop: 20 }}>
              <div
                className="section-card-header"
                style={{ borderBottom: '1px solid var(--border-color)' }}
              >
                <div className="section-card-title">
                  <Search size={18} color="var(--primary-blue)" />
                  <div>
                    <h3
                      style={{
                        margin: 0,
                        fontSize: '1rem',
                        fontWeight: 700,
                      }}
                    >
                      Available Yarn Inward Stock
                    </h3>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 16 }}>
                <div className="search-box" style={{ maxWidth: 360 }}>
                  <Search size={16} />
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search by bill / count / tickit / supplier"
                  />
                </div>
              </div>

              <div className="table-responsive" style={{ marginTop: 16 }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th style={{ width: 52 }}></th>
                      <th>Se No</th>
                      <th>Count</th>
                      <th>Tickit</th>
                      <th>Supplier</th>
                      <th>Remaining Bags</th>
                      <th>Cones</th>
                      <th>Weight (Kg)</th>
                      <th>Issue Bags</th>
                      <th>Issue Cones</th>
                      <th>Remark</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredIssueRows.length === 0 ? (
                      <tr>
                        <td
                          colSpan="11"
                          style={{
                            textAlign: 'center',
                            padding: '28px',
                            color: 'var(--text-muted)',
                          }}
                        >
                          No remaining yarn inward stock is available.
                        </td>
                      </tr>
                    ) : (
                      filteredIssueRows.map(row => (
                        <tr key={row.id}>
                          <td>
                            <input
                              type="checkbox"
                              checked={row.checked}
                              onChange={e =>
                                toggleIssueRow(row.id, e.target.checked)
                              }
                            />
                          </td>

                          <td>{row.serialLabel}</td>
                          <td>{row.countName}</td>
                          <td>{row.tickitName}</td>
                          <td>{row.supplierName}</td>
                          <td>{row.remainingBags}</td>
                          <td>{row.cones}</td>
                          <td>{Number(row.weightKg || 0).toFixed(2)}</td>

                          <td>
                            <input
                              className="form-control"
                              type="number"
                              min="0"
                              step="0.01"
                              value={row.issueBags}
                              onChange={e =>
                                handleBagsChange(row.id, e.target.value)
                              }
                              disabled={!row.checked}
                            />
                          </td>

                          <td>
                            <input
                              className="form-control"
                              type="number"
                              min="0"
                              step="0.01"
                              value={row.issueCones}
                              onChange={e =>
                                handleConesChange(row.id, e.target.value)
                              }
                              disabled={!row.checked}
                            />
                          </td>

                          <td>{row.remark || '-'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

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
