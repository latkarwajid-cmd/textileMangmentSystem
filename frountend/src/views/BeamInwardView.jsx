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
  const { fabricOrders, sizingUnits, addToast } = useApp();
  const [sizingSets, setSizingSets] = useState([]);
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    sizingSetId: '', orderId: '', sizingId: '', date: new Date().toISOString().split('T')[0], beams: '', dNo: '', cut: '', mtrs: '', pick: '', fold: '', rs: '', lasa: ''
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

  const openCreate = () => { setEditing(null); setForm({ sizingSetId:'', orderId:'', sizingId:'', date:new Date().toISOString().split('T')[0], beams:'', dNo:'', cut:'', mtrs:'', pick:'', fold:'', rs:'', lasa:'' }); setIsModalOpen(true); };
  const openEdit = (item) => {
    setEditing(item);
    setForm({
      sizingSetId: item.sizingSet?.sizingSetId || '',
      orderId: item.order?.orderId || '',
      sizingId: item.sizingUnit?.sizingId || '',
      date: formatDate(item.date),
      beams: item.beams || '', dNo: item.dNo || '', cut: item.cut || '', mtrs: item.mtrs || '', pick: item.pick || '', fold: item.fold || '', rs: item.rs || '', lasa: item.lasa || ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        sizingSetId: form.sizingSetId ? Number(form.sizingSetId) : null,
        orderId: form.orderId ? Number(form.orderId) : null,
        sizingId: form.sizingId ? Number(form.sizingId) : null,
        date: form.date || null,
        beams: form.beams ? Number(form.beams) : null,
        dNo: form.dNo || null,
        cut: form.cut ? Number(form.cut) : null,
        mtrs: form.mtrs ? Number(form.mtrs) : null,
        pick: form.pick ? Number(form.pick) : null,
        fold: form.fold ? Number(form.fold) : null,
        rs: form.rs ? Number(form.rs) : null,
        lasa: form.lasa ? Number(form.lasa) : null,
      };

      if (editing) {
        await api.beamInward.update(editing.beamInwardId, payload);
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
      await api.beamInward.delete(item.beamInwardId);
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
                <th>Order</th>
                <th>Sizing Set</th>
                <th>Sizing Unit</th>
                <th>Date</th>
                <th>Beams</th>
                <th>Mtrs</th>
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
                  <tr key={item.beamInwardId}>
                    <td>{item.order?.orderNo || '-'}</td>
                    <td>{item.sizingSet?.setNo || '-'}</td>
                    <td>{item.sizingUnit?.sizingName || '-'}</td>
                    <td>{formatDate(item.date)}</td>
                    <td>{item.beams || '-'}</td>
                    <td>{item.mtrs || '-'}</td>
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

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editing ? `Edit Beam #${editing.beamInwardId}` : 'New Beam Inward'}>
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label>Fabric Order</label>
              <select className="form-control" value={form.orderId} onChange={e => setForm({...form, orderId: e.target.value})}>
                <option value="">-- Select Order --</option>
                {fabricOrders.map(o => (<option key={o.orderId} value={o.orderId}>{o.orderNo}</option>))}
              </select>
            </div>

            <div className="form-group">
              <label>Sizing Set</label>
              <select className="form-control" value={form.sizingSetId} onChange={e => setForm({...form, sizingSetId: e.target.value})}>
                <option value="">-- Select Sizing Set --</option>
                {sizingSets.map(s => (<option key={s.sizingSetId} value={s.sizingSetId}>{s.setNo}</option>))}
              </select>
            </div>

            <div className="form-group">
              <label>Sizing Unit</label>
              <select className="form-control" value={form.sizingId} onChange={e => setForm({...form, sizingId: e.target.value})}>
                <option value="">-- Select Sizing Unit --</option>
                {sizingUnits.map(s => (<option key={s.sizingId} value={s.sizingId}>{s.sizingName}</option>))}
              </select>
            </div>

            <div className="form-group">
              <label>Date</label>
              <input type="date" className="form-control" value={form.date} onChange={e => setForm({...form, date: e.target.value})} />
            </div>

            <div className="form-group">
              <label>Beams</label>
              <input type="number" className="form-control" value={form.beams} onChange={e => setForm({...form, beams: e.target.value})} />
            </div>

            <div className="form-group">
              <label>D No</label>
              <input type="text" className="form-control" value={form.dNo} onChange={e => setForm({...form, dNo: e.target.value})} />
            </div>

            <div className="form-group">
              <label>Mtrs</label>
              <input type="number" step="0.001" className="form-control" value={form.mtrs} onChange={e => setForm({...form, mtrs: e.target.value})} />
            </div>

            <div className="form-group">
              <label>Cut</label>
              <input type="number" step="0.01" className="form-control" value={form.cut} onChange={e => setForm({...form, cut: e.target.value})} />
            </div>

            <div className="form-group">
              <label>Pick</label>
              <input type="number" step="0.01" className="form-control" value={form.pick} onChange={e => setForm({...form, pick: e.target.value})} />
            </div>

            <div className="form-group">
              <label>Fold</label>
              <input type="number" step="0.01" className="form-control" value={form.fold} onChange={e => setForm({...form, fold: e.target.value})} />
            </div>

            <div className="form-group">
              <label>Rs</label>
              <input type="number" step="0.01" className="form-control" value={form.rs} onChange={e => setForm({...form, rs: e.target.value})} />
            </div>

            <div className="form-group">
              <label>Lasa</label>
              <input type="number" step="0.01" className="form-control" value={form.lasa} onChange={e => setForm({...form, lasa: e.target.value})} />
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
