import React, { useMemo, useState } from 'react';
import { Package, Plus, Printer, Save, Search, Trash2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';

const today = () => new Date().toISOString().split('T')[0];
const emptyLine = (countAndTicket = '') => ({
  packageType: 'CONES', countAndTicket, packagesCount: '', grossWeightKg: '',
  destinationWarehouse: 'Main Raw Yarn Warehouse', remark: '',
});

export const RewindingYarnView = () => {
  const { addToast, yarnStorageLocations } = useApp();
  const [getpassNo, setGetpassNo] = useState('');
  const [entry, setEntry] = useState(null);
  const [receipt, setReceipt] = useState(null);
  const [receiveDate, setReceiveDate] = useState(today());
  const [lines, setLines] = useState([emptyLine()]);
  const [returnedEmptyCones, setReturnedEmptyCones] = useState('');
  const [scrapWeightKg, setScrapWeightKg] = useState('');
  const [balanceReturnWeightKg, setBalanceReturnWeightKg] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const issuedWeight = useMemo(() => (entry?.lines || []).reduce((sum, line) => sum + (Number(line.weightKg) || 0), 0), [entry]);
  const receivedWeight = useMemo(() => lines.reduce((sum, line) => sum + (Number(line.grossWeightKg) || 0), 0), [lines]);
  const shortage = issuedWeight - receivedWeight - (Number(scrapWeightKg) || 0) - (Number(balanceReturnWeightKg) || 0);
  const expectedOutput = [...new Set((entry?.lines || []).map(line => line.targetOutputType).filter(Boolean))].join(', ');

  const handleSearch = async () => {
    const trimmed = getpassNo.trim();
    if (!trimmed) { addToast('Please enter a getpass number', 'error'); return; }
    try {
      setLoading(true);
      const data = await api.rewindingYarnReceive.getIssue(trimmed);
      setEntry(data);
      const completed = String(data.status || '').toUpperCase() === 'COMPLETED';
      setReceipt(completed ? await api.rewindingYarnReceive.getByGetpass(trimmed) : null);
      setReceiveDate(today());
      setReturnedEmptyCones(''); setScrapWeightKg(''); setBalanceReturnWeightKg('');
      const first = data.lines?.[0];
      setLines([emptyLine(first ? `${first.countName || ''} ${first.tickitName || ''}`.trim() : '')]);
    } catch (err) {
      setEntry(null);
      setReceipt(null);
      addToast(err.message || 'No rewinding dispatch found for this getpass', 'error');
    } finally { setLoading(false); }
  };

  const updateLine = (index, field, value) => setLines(previous => previous.map((line, lineIndex) => lineIndex === index ? { ...line, [field]: value } : line));

  const handleSave = async event => {
    event.preventDefault();
    if (!entry || entry.status?.toUpperCase() === 'COMPLETED') return;
    const validLines = lines.filter(line => Number(line.packagesCount) > 0 && Number(line.grossWeightKg) > 0);
    if (!validLines.length) { addToast('Enter package count and gross weight for at least one received row', 'error'); return; }
    if (shortage < -0.000001) { addToast('Received, scrap and balance return weight cannot exceed issued weight', 'error'); return; }
    try {
      setSaving(true);
      await api.rewindingYarnReceive.complete({
        getpassNo: entry.getpassNo, receiveDate,
        returnedEmptyCones: Number(returnedEmptyCones) || 0,
        scrapWeightKg: Number(scrapWeightKg) || 0,
        balanceReturnWeightKg: Number(balanceReturnWeightKg) || 0,
        lines: validLines.map(line => ({ ...line, packagesCount: Number(line.packagesCount), grossWeightKg: Number(line.grossWeightKg) })),
      });
      addToast('Yarn received from rewinding and stock updated successfully', 'success');
      setEntry(null); setReceipt(null); setLines([emptyLine()]);
    } catch (err) { addToast(err.message || 'Failed to save rewinding receipt', 'error'); }
    finally { setSaving(false); }
  };

  const issuedBags = (entry?.lines || []).reduce((sum, line) => sum + (Number(line.bags) || 0), 0);
  const issuedCones = (entry?.lines || []).reduce((sum, line) => sum + (Number(line.cone) || 0), 0);
  const countAndTicket = [...new Set((entry?.lines || []).map(line => `${line.countName || ''} ${line.tickitName || ''}`.trim()).filter(Boolean))].join(', ');
  const isCompleted = String(entry?.status || '').toUpperCase() === 'COMPLETED';
  const completedReceivedWeight = (receipt?.lines || []).reduce((sum, line) => sum + (Number(line.grossWeightKg) || 0), 0);
  const completedScrapWeight = Number(receipt?.scrapWeightKg || 0);
  const completedBalanceWeight = Number(receipt?.balanceReturnWeightKg || 0);
  const completedShortage = issuedWeight - completedReceivedWeight - completedScrapWeight - completedBalanceWeight;

  return (
    <div className="content-area">
      <div className="section-card">
        <div className="section-card-header">
          <div className="section-card-title"><Package size={20} color="var(--primary-blue)" /><div><h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700 }}>Yarn Inward from Rewinding</h3><span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Receive finished yarn and complete the rewinding gatepass</span></div></div>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 20, flexWrap: 'wrap' }}>
          <div className="search-box" style={{ flex: 1, minWidth: 260 }}><Search size={16} /><input value={getpassNo} onChange={event => setGetpassNo(event.target.value)} onKeyDown={event => event.key === 'Enter' && handleSearch()} placeholder="Enter gatepass number" /></div>
          <button type="button" className="btn btn-primary" onClick={handleSearch} disabled={loading}><Search size={16} /> {loading ? 'Searching...' : 'Fetch Gatepass'}</button>
        </div>

        {!entry ? <div style={{ textAlign: 'center', padding: 36, color: 'var(--text-muted)' }}>Search a gatepass to load its issued yarn baseline.</div> : isCompleted ? (
          <div className="rewinding-completed-summary" style={{ marginTop: 24 }}>
            <div className="section-card" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
              <div className="section-card-header" style={{ padding: '12px 16px' }}><h4 style={{ margin: 0 }}>Completed Rewinding Receipt</h4><span className="badge badge-success">COMPLETED</span></div>
              <div className="form-grid-4" style={{ padding: 16 }}>
                <div className="form-group"><label>Gatepass Number</label><input className="form-control" value={entry.getpassNo || ''} readOnly /></div>
                <div className="form-group"><label>Dispatch Date</label><input className="form-control" value={entry.issueDate || ''} readOnly /></div>
                <div className="form-group"><label>Rewinding Party</label><input className="form-control" value={entry.rewindingName || ''} readOnly /></div>
                <div className="form-group"><label>Receive Date</label><input className="form-control" value={receipt?.receiveDate || ''} readOnly /></div>
                <div className="form-group"><label>Issued Count / Ticket</label><input className="form-control" value={countAndTicket || '-'} readOnly /></div>
                <div className="form-group"><label>Issued Weight (Kg)</label><input className="form-control" value={issuedWeight.toFixed(3)} readOnly /></div>
                <div className="form-group"><label>Received Weight (Kg)</label><input className="form-control" value={completedReceivedWeight.toFixed(3)} readOnly /></div>
                <div className="form-group"><label>Expected Output</label><input className="form-control" value={expectedOutput || '-'} readOnly /></div>
              </div>
            </div>
            <div className="section-card" style={{ marginTop: 20 }}>
              <div className="section-card-header" style={{ padding: '12px 16px' }}><h4 style={{ margin: 0 }}>Received Yarn Summary</h4></div>
              <div className="table-responsive"><table className="data-table"><thead><tr><th>Package Type</th><th>Count & Ticket</th><th>Packages / Boxes</th><th>Gross Weight (Kg)</th><th>Destination Warehouse</th><th>Remark</th></tr></thead><tbody>{(receipt?.lines || []).map(line => <tr key={line.rewindingYarnReceiveLineId}><td>{line.packageType}</td><td>{line.countAndTicket || '-'}</td><td>{line.packagesCount}</td><td>{Number(line.grossWeightKg || 0).toFixed(3)}</td><td>{line.destinationWarehouse || '-'}</td><td>{line.remark || '-'}</td></tr>)}</tbody></table></div>
              <div className="form-grid-4" style={{ padding: 16 }}>
                <div className="form-group"><label>Returned Empty Cones / Tubes</label><input className="form-control" value={receipt?.returnedEmptyCones || 0} readOnly /></div>
                <div className="form-group"><label>Scrap Weight (Kg)</label><input className="form-control" value={completedScrapWeight.toFixed(3)} readOnly /></div>
                <div className="form-group"><label>Balance Return (Kg)</label><input className="form-control" value={completedBalanceWeight.toFixed(3)} readOnly /></div>
                <div className="form-group"><label>Shortage / Variance (Kg)</label><input className="form-control" value={completedShortage.toFixed(3)} readOnly /></div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}><button type="button" className="btn btn-secondary" onClick={() => window.print()}><Printer size={16} /> Print</button><button type="button" className="btn btn-primary" onClick={() => { setEntry(null); setReceipt(null); }}>Close</button></div>
          </div>
        ) : (
          <form onSubmit={handleSave} style={{ marginTop: 24 }}>
            <div className="section-card" style={{ background: '#f8fafc', border: '1px solid var(--border-color)' }}>
              <div className="section-card-header" style={{ padding: '12px 16px' }}><h4 style={{ margin: 0 }}>Issued Baseline</h4><span className={`badge ${entry.status?.toUpperCase() === 'COMPLETED' ? 'badge-success' : 'badge-info'}`}>{entry.status || 'ACTIVE'}</span></div>
              <div className="form-grid-4" style={{ padding: 16 }}>
                <div className="form-group"><label>Gatepass Number</label><input className="form-control" value={entry.getpassNo || ''} readOnly /></div>
                <div className="form-group"><label>Dispatch Date</label><input className="form-control" value={entry.issueDate || ''} readOnly /></div>
                <div className="form-group"><label>Rewinding Party</label><input className="form-control" value={entry.rewindingName || ''} readOnly /></div>
                <div className="form-group"><label>Expected Output</label><input className="form-control" value={expectedOutput || '-'} readOnly /></div>
                <div className="form-group"><label>Issued Count / Ticket</label><input className="form-control" value={countAndTicket || '-'} readOnly /></div>
                <div className="form-group"><label>Issued Bags</label><input className="form-control" value={issuedBags} readOnly /></div>
                <div className="form-group"><label>Issued Cones</label><input className="form-control" value={issuedCones} readOnly /></div>
                <div className="form-group"><label>Total Issued Weight (Kg)</label><input className="form-control" value={issuedWeight.toFixed(3)} readOnly /></div>
              </div>
            </div>

            <div className="section-card" style={{ marginTop: 20 }}>
              <div className="section-card-header" style={{ padding: '12px 16px' }}><h4 style={{ margin: 0 }}>Received Yarn</h4><button type="button" className="btn btn-secondary btn-sm" onClick={() => setLines(previous => [...previous, emptyLine()])}><Plus size={14} /> Add Row</button></div>
              <div className="table-responsive"><table className="data-table"><thead><tr><th>Package Type</th><th>Count & Ticket</th><th>Packages / Boxes</th><th>Gross Weight (Kg)</th><th>Destination Warehouse</th><th>Remark</th><th>Action</th></tr></thead><tbody>{lines.map((line, index) => <tr key={index}>
                <td><select className="form-control" value={line.packageType} onChange={event => updateLine(index, 'packageType', event.target.value)}><option value="CONES">Cones</option><option value="PIRN">PIRN</option><option value="CHEESE">Cheese</option></select></td>
                <td><input className="form-control" value={line.countAndTicket} onChange={event => updateLine(index, 'countAndTicket', event.target.value)} placeholder="Count & Ticket" /></td>
                <td><input type="number" min="0" step="0.001" className="form-control" value={line.packagesCount} onChange={event => updateLine(index, 'packagesCount', event.target.value)} /></td>
                <td><input type="number" min="0" step="0.001" className="form-control" value={line.grossWeightKg} onChange={event => updateLine(index, 'grossWeightKg', event.target.value)} /></td>
                <td><select className="form-control" value={line.destinationWarehouse} onChange={event => updateLine(index, 'destinationWarehouse', event.target.value)}><option>Main Raw Yarn Warehouse</option><option>Shed 1 Raw Storage</option><option>Shed 2 Raw Storage</option>{yarnStorageLocations.map(location => <option key={location.locationId} value={location.locationName}>{location.locationName}</option>)}</select></td>
                <td><input className="form-control" value={line.remark} onChange={event => updateLine(index, 'remark', event.target.value)} /></td>
                <td><button type="button" className="btn-icon" title="Remove row" onClick={() => setLines(previous => previous.length === 1 ? [emptyLine()] : previous.filter((_, lineIndex) => lineIndex !== index))}><Trash2 size={15} /></button></td>
              </tr>)}</tbody><tfoot><tr style={{ background: '#f8fafc' }}><td colSpan="2" style={{ textAlign: 'right', fontWeight: 700 }}>Received Total</td><td style={{ fontWeight: 700 }}>{lines.reduce((sum, line) => sum + (Number(line.packagesCount) || 0), 0).toFixed(3)}</td><td style={{ fontWeight: 700 }}>{receivedWeight.toFixed(3)} kg</td><td colSpan="3" /></tr></tfoot></table></div>
            </div>

            <div className="section-card" style={{ marginTop: 20 }}>
              <div className="section-card-header" style={{ padding: '12px 16px' }}><h4 style={{ margin: 0 }}>Scrap & Reconciliation</h4></div>
              <div className="form-grid-4" style={{ padding: 16 }}>
                <div className="form-group"><label>Returned Empty Cones / Tubes</label><input type="number" min="0" className="form-control" value={returnedEmptyCones} onChange={event => setReturnedEmptyCones(event.target.value)} /></div>
                <div className="form-group"><label>Waste / Scrap Weight (Kg)</label><input type="number" min="0" step="0.001" className="form-control" value={scrapWeightKg} onChange={event => setScrapWeightKg(event.target.value)} /></div>
                <div className="form-group"><label>Unprocessed Balance Return (Kg)</label><input type="number" min="0" step="0.001" className="form-control" value={balanceReturnWeightKg} onChange={event => setBalanceReturnWeightKg(event.target.value)} /></div>
                <div className="form-group"><label>Receive Date</label><input type="date" className="form-control" value={receiveDate} onChange={event => setReceiveDate(event.target.value)} /></div>
              </div>
              <div style={{ margin: '0 16px 16px', padding: 14, borderRadius: 6, background: shortage < 0 ? '#fef2f2' : '#ecfdf5', color: shortage < 0 ? '#b91c1c' : '#047857', fontWeight: 700 }}>Shortage / Variance: {shortage.toFixed(3)} Kg <span style={{ fontWeight: 400 }}>({issuedWeight.toFixed(3)} issued - received - scrap - balance)</span></div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}><button type="submit" className="btn btn-primary" disabled={saving || entry.status?.toUpperCase() === 'COMPLETED'}><Save size={16} /> {saving ? 'Saving...' : entry.status?.toUpperCase() === 'COMPLETED' ? 'Already Completed' : 'Complete Gatepass & Update Stock'}</button></div>
          </form>
        )}
      </div>
    </div>
  );
};

export default RewindingYarnView;
