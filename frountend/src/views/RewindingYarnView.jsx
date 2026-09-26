import React, { useState } from 'react';
import { Search, Package } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';

export const RewindingYarnView = () => {
  const { addToast } = useApp();
  const [getpassNo, setGetpassNo] = useState('');
  const [entry, setEntry] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    const trimmed = getpassNo.trim();
    if (!trimmed) {
      addToast('Please enter a getpass number', 'error');
      return;
    }

    try {
      setLoading(true);
      const data = await api.rewindingIssues.getByGetpassNo(trimmed);
      setEntry(data);
    } catch (err) {
      setEntry(null);
      addToast(err.message || 'No rewinding issue found for this getpass', 'error');
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
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700 }}>Yarn from Rewinding</h3>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>View rewinded yarn against getpass number</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 20, flexWrap: 'wrap' }}>
          <div className="search-box" style={{ flex: 1, minWidth: 260 }}>
            <Search size={16} />
            <input
              type="text"
              value={getpassNo}
              onChange={e => setGetpassNo(e.target.value)}
              placeholder="Enter getpass number"
            />
          </div>
          <button className="btn btn-primary" onClick={handleSearch} disabled={loading}>
            <Search size={16} />
            <span>{loading ? 'Searching...' : 'View Getpass'}</span>
          </button>
        </div>

        {!entry ? (
          <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>Enter getpass number to view rewinded yarn.</div>
        ) : (
          <div style={{ marginTop: 24 }}>
            <div className="form-grid-4" style={{ marginBottom: 20 }}>
              <div className="form-group">
                <label>Getpass No</label>
                <input className="form-control" value={entry.getpassNo || ''} readOnly />
              </div>
              <div className="form-group">
                <label>Date</label>
                <input className="form-control" value={entry.issueDate || ''} readOnly />
              </div>
              <div className="form-group">
                <label>Firm Name</label>
                <input className="form-control" value={entry.firmName || ''} readOnly />
              </div>
              <div className="form-group">
                <label>Rewinding Name</label>
                <input className="form-control" value={entry.rewindingName || ''} readOnly />
              </div>
            </div>

            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Se No</th>
                    <th>Count</th>
                    <th>Tickit</th>
                    <th>Bags</th>
                    <th>Cone</th>
                    <th>Weight (Kg)</th>
                    <th>Remark</th>
                  </tr>
                </thead>
                <tbody>
                  {(entry.lines || []).length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>No rewinded yarn found for this getpass.</td>
                    </tr>
                  ) : (
                    (entry.lines || []).map((line, index) => (
                      <tr key={`${entry.getpassNo}-${index}`}>
                        <td>{line.seNo || `SE-${index + 1}`}</td>
                        <td>{line.countName || '-'}</td>
                        <td>{line.tickitName || '-'}</td>
                        <td>{Number(line.bags || 0)}</td>
                        <td>{Number(line.cone || 0)}</td>
                        <td>{Number(line.weightKg || 0).toFixed(2)}</td>
                        <td>{line.remark || '-'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
