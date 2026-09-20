import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { Plus, Edit2, Trash2, Eye, ArrowDownLeft } from 'lucide-react';
import { Modal } from '../components/Modal';

const formatDate = (d) => {
  if (!d) return '';
  if (Array.isArray(d)) {
    const [y,m,day] = d; return `${y}-${String(m).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
  }
  return String(d).substring(0,10);
};

export const BeamInwardView = () => {
  const { parties, tickits, yarnCounts, sizingUnits, addToast } = useApp();
  const [sizingSets, setSizingSets] = useState([]);
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    sizingSetId: '', orderNo: '', orderId: '', sizingId: '', inwardDate: new Date().toISOString().split('T')[0], beamNo: '', quality: '',
    // countId: '', tickitId: '',
     partyId: '', meter: '', weightKg: '', status: 'OPEN', remark: ''
  });

  const fetchList = async () => {
    setLoading(true);
    try {
      const data = await api.beamInward.getAll();
      setList(Array.isArray(data) ? data : []);
    } catch (err) {
      addToast(err.message || 'Failed to load beam inward', 'error');
    } finally { setLoading(false); }
  };

  const fetchSizingSets = async () => {
    try {
      const res = await api.sizingSets.getAll();
      setSizingSets(Array.isArray(res) ? res : []);
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => { fetchList(); fetchSizingSets(); }, []);

  const openCreate = () => { setEditing(null); setForm({ sizingSetId:'', orderNo:'', orderId:'', sizingId:'', inwardDate:new Date().toISOString().split('T')[0], beamNo:'', quality:'',
    //  countId:'', tickitId:'',
     partyId:'', meter:'', weightKg:'', status:'OPEN', remark:'' }); setIsModalOpen(true); };
  const openEdit = (item) => {
    setEditing(item);
    setForm({
      sizingSetId: item.sizingSet?.sizingSetId || '',
      orderNo: item.order?.orderNo || '',
      orderId: item.order?.orderId || '',
      sizingId: item.sizingUnit?.sizingId || '',
      inwardDate: formatDate(item.inwardDate),
      beamNo: item.beamNo || '', quality: item.quality || '', countId: item.count?.countId || '', tickitId: item.tickit?.tickitId || '', partyId: item.party?.partyId || '', meter: item.meter || '', weightKg: item.weightKg || '', status: item.status || 'OPEN', remark: item.remark || ''
    });
    setIsModalOpen(true);
  };

  const handleSizingSetChange = sizingSetId => {
    const sizingSet = sizingSets.find(item => String(item.sizingSetId) === String(sizingSetId));
    setForm(prev => ({
      ...prev,
      sizingSetId,
      orderNo: sizingSet?.order?.orderNo || '',
      orderId: sizingSet?.order?.orderId || '',
      sizingId: sizingSet?.sizingUnit?.sizingId || '',
      // countId: sizingSet?.count?.countId || '',
      // tickitId: sizingSet?.tickit?.tickitId || '',
      quality: sizingSet?.quality || sizingSet?.order?.quality || prev.quality || '',
      partyId: sizingSet?.party?.partyId || sizingSet?.order?.party?.partyId || prev.partyId || '',
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        sizingSetId: form.sizingSetId ? Number(form.sizingSetId) : null,
        orderId: form.orderId ? Number(form.orderId) : null,
        sizingId: form.sizingId ? Number(form.sizingId) : null,
        inwardDate: form.inwardDate || null,
        beamNo: form.beamNo || null,
        quality: form.quality || null,
        // countId: form.countId ? Number(form.countId) : null,
        // tickitId: form.tickitId ? Number(form.tickitId) : null,
        partyId: form.partyId ? Number(form.partyId) : null,
        meter: form.meter ? Number(form.meter) : null,
        weightKg: form.weightKg ? Number(form.weightKg) : null,
        status: form.status,
        remark: form.remark || null,
      };

      if (editing) {
        await api.beamInward.update(editing.beamId, payload);
        addToast('Beam inward updated', 'success');
      } else {
        await api.beamInward.create(payload);
        addToast('Beam inward created', 'success');
      }
      setIsModalOpen(false);
      fetchList();
    } catch (err) {
      addToast(err.message || 'Failed to save', 'error');
    }
  };

  const handleDelete = async (item) => {
    if (!item) return;
    try {
      await api.beamInward.delete(item.beamId);
      addToast('Deleted successfully', 'success');
      fetchList();
    } catch (err) {
      addToast(err.message || 'Delete failed', 'error');
    }
  };

  return (
    <div className="content-area">
      <div className="section-card">
        <div className="section-card-header">
          <div className="section-card-title">
            <ArrowDownLeft size={20} color="var(--primary-blue)" />
            <h3>Beam Inward</h3>
            <span className="badge badge-info">{list.length}</span>
          </div>
          <div className="section-card-actions">
            <button className="btn btn-primary" onClick={openCreate}><Plus size={16}/> <span>New Beam Inward</span></button>
          </div>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Beam ID</th>
                <th>Order</th>
                <th>Sizing Set</th>
                <th>Sizing Unit</th>
                <th>Quality</th>
                <th>Date</th>
                <th>No. Of Beams</th>
                <th>Meter</th>
                <th style={{textAlign:'right'}}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" style={{textAlign:'center'}}>Loading...</td></tr>
              ) : list.length === 0 ? (
                <tr><td colSpan="7" style={{textAlign:'center', padding:'24px'}}>No records</td></tr>
              ) : (
                list.map(item => (
                  <tr key={item.beamId}>
                    <td>#{item.beamId}</td>
                    <td>{item.order?.orderNo || '-'}</td>
                    <td>{item.sizingSet?.setNo || '-'}</td>
                    <td>{item.sizingUnit?.sizingName || '-'}</td>
                    <td>{item.quality || item.order?.quality || '-'}</td>
                    <td>{formatDate(item.inwardDate)}</td>
                    <td>{item.beamNo || '-'}</td>
                    <td>{item.meter || '-'}</td>
                    <td style={{textAlign:'right'}}>
                      <div style={{display:'flex', justifyContent:'flex-end', gap:6}}>
                        <button className="btn-icon" onClick={() => openEdit(item)} title="Edit"><Edit2 size={14}/></button>
                        <button className="btn-icon" onClick={() => handleDelete(item)} style={{color:'var(--color-danger)'}} title="Delete"><Trash2 size={14}/></button>
                        <button className="btn-icon" onClick={() => {}} title="View"><Eye size={14}/></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editing ? `Edit Beam #${editing.beamId}` : 'New Beam Inward'}>
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label>Sizing Set No *</label>
              <select className="form-control" value={form.sizingSetId} onChange={e => handleSizingSetChange(e.target.value)} required>
                <option value="">-- Select Sizing Set No --</option>
                {sizingSets.map(s => (<option key={s.sizingSetId} value={s.sizingSetId}>{s.setNo}</option>))}
              </select>
            </div>

            <div className="form-group">
              <label>Order No</label>
              <input className="form-control" value={form.orderNo} readOnly placeholder="Filled from sizing set" />
            </div>

            <div className="form-group">
              <label>Sizing Unit</label>
              <select className="form-control" value={form.sizingId} onChange={e => setForm({...form, sizingId: e.target.value})}>
                <option value="">-- Select Sizing Unit --</option>
                {sizingUnits.map(s => (<option key={s.sizingId} value={s.sizingId}>{s.sizingName}</option>))}
              </select>
            </div>

            <div className="form-group">
              <label>Inward Date</label>
              <input type="date" className="form-control" value={form.inwardDate} onChange={e => setForm({...form, inwardDate: e.target.value})} />
            </div>

            <div className="form-group">
              <label>No. Of Beams </label>
              <input type="text" className="form-control" value={form.beamNo} onChange={e => setForm({...form, beamNo: e.target.value})} />
            </div>

            <div className="form-group">
              <label>Quality</label>
              <input type="text" className="form-control" value={form.quality} onChange={e => setForm({...form, quality: e.target.value})} placeholder="Filled from order quality" />
            </div>

            {/* <div className="form-group">
              <label>Count</label>
              <select className="form-control" value={form.countId} onChange={e => setForm({...form, countId: e.target.value})}><option value="">-- Select Count --</option>{yarnCounts.map(c => <option key={c.countId} value={c.countId}>{c.countName}</option>)}</select>
            </div>

            <div className="form-group">
              <label>Tickit</label>
              <select className="form-control" value={form.tickitId} onChange={e => setForm({...form, tickitId: e.target.value})}><option value="">-- Select Tickit --</option>{tickits.map(t => <option key={t.tickitId} value={t.tickitId}>{t.tickitName}</option>)}</select>
            </div> */}

            <div className="form-group">
              <label>Party</label>
              <select className="form-control" value={form.partyId} onChange={e => setForm({...form, partyId: e.target.value})}><option value="">-- Select Party --</option>{parties.map(p => <option key={p.partyId} value={p.partyId}>{p.partyName}</option>)}</select>
            </div>

            <div className="form-group">
              <label>Meter</label>
              <input type="number" step="0.001" className="form-control" value={form.meter} onChange={e => setForm({...form, meter: e.target.value})} />
            </div>

            <div className="form-group">
              <label>Weight (Kg)</label>
              <input type="number" step="0.001" className="form-control" value={form.weightKg} onChange={e => setForm({...form, weightKg: e.target.value})} />
            </div>

            <div className="form-group">
              <label>Status</label>
              <select className="form-control" value={form.status} onChange={e => setForm({...form, status: e.target.value})}><option value="OPEN">Open</option><option value="IN_PROGRESS">In Progress</option><option value="COMPLETED">Completed</option><option value="CANCELLED">Cancelled</option></select>
            </div>

            <div className="form-group">
              <label>Remark</label>
              <input type="text" className="form-control" value={form.remark} onChange={e => setForm({...form, remark: e.target.value})} />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">{editing ? 'Update' : 'Save'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default BeamInwardView;
