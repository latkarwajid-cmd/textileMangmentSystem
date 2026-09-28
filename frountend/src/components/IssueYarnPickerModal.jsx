import { CheckCircle2, Loader2, Package, Search } from 'lucide-react';
import { Modal } from './Modal';

export const IssueYarnPickerModal = ({
  isOpen,
  onClose,
  rows,
  loading = false,
  search,
  onSearchChange,
  sourceFilter,
  onSourceFilterChange,
  onToggle,
  onBagsChange,
  onConesChange,
  onDone,
  showSetNo = false,
}) => {
  const columnCount = 11 + (showSetNo ? 1 : 0);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Issue Yarn" size="lg">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="search-box" style={{ flex: 1, minWidth: 220 }}>
            <Search size={16} />
            <input
              type="text"
              placeholder="Search by serial, count, tickit, date..."
              value={search}
              onChange={event => onSearchChange(event.target.value)}
            />
          </div>
          <select
            className="form-control"
            value={sourceFilter}
            onChange={event => onSourceFilterChange(event.target.value)}
            style={{ maxWidth: 180 }}
          >
            <option value="all">All Inward</option>
            <option value="yarnIn">Yarn In</option>
            <option value="sizingIn">Sizing In</option>
          </select>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: 45, textAlign: 'center' }}>Select</th>
                {showSetNo && <th>Set No</th>}
                <th>Serial</th>
                <th>Type</th>
                <th>Count</th>
                <th>Tickit</th>
                <th>Available Bags</th>
                <th>Given Bags</th>
                <th>Cone</th>
                <th>Weight/Bag (Kg)</th>
                <th>Weight (Kg)</th>
                <th>Inward Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={columnCount} style={{ textAlign: 'center', padding: 35 }}>
                    <Loader2 size={22} className="animate-spin" style={{ margin: '0 auto 8px' }} />
                    <div>Loading available yarn...</div>
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={columnCount} style={{ textAlign: 'center', padding: 35, color: 'var(--text-muted)' }}>
                    <Package size={28} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
                    <div style={{ fontWeight: 600 }}>No Yarn Available</div>
                    <div style={{ fontSize: '0.8rem', marginTop: 4 }}>No available yarn matches this selection.</div>
                  </td>
                </tr>
              ) : rows.map(row => (
                <tr key={row.key}>
                  <td style={{ textAlign: 'center' }}>
                    <input type="checkbox" checked={row.checked} onChange={event => onToggle(row.key, event.target.checked)} />
                  </td>
                  {showSetNo && <td>{row.setNo || '-'}</td>}
                  <td style={{ fontWeight: 700, color: 'var(--primary-blue-dark)' }}>{row.serialLabel}</td>
                  <td><span className={`badge ${row.type === 'USED' ? 'badge-warning' : 'badge-success'}`}>{row.type || 'FRESH'}</span></td>
                  <td>{row.countName || '-'}</td>
                  <td>{row.tickitName || '-'}</td>
                  <td style={{ fontWeight: 700, textAlign: 'right' }}>{row.remainingBags}</td>
                  <td>
                    <input
                      type="number"
                      min="0"
                      max={row.remainingBags}
                      step="1"
                      className="form-control"
                      value={row.issueBags}
                      disabled={!row.checked}
                      onChange={event => onBagsChange(row.key, event.target.value)}
                      placeholder={String(row.remainingBags)}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      className="form-control"
                      value={row.issueCones ?? ''}
                      disabled={!row.checked}
                      onChange={event => onConesChange(row.key, event.target.value)}
                      placeholder="Cone"
                    />
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>{Number(row.weightPerBag || 0).toFixed(2)}</td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>
                    {(Number(row.issueBags || 0) * Number(row.weightPerBag || 0)).toFixed(2)}
                  </td>
                  <td>{row.inwardDate || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
          <button type="button" className="btn btn-primary" onClick={onDone}>
            <CheckCircle2 size={16} /> <span>Done</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
