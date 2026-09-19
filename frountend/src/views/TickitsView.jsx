import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { Plus, Search, Edit2, Trash2, Ticket, Building2 } from 'lucide-react';
import { Modal } from '../components/Modal';

export const TickitsView = () => {
  const { parties, addToast, refreshMasters } = useApp();
  const [tickits, setTickits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedPartyFilter, setSelectedPartyFilter] = useState('ALL');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTickit, setEditingTickit] = useState(null);
  const [formData, setFormData] = useState({
    tickitName: '',
    partyId: '',
  });

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [tickitToDelete, setTickitToDelete] = useState(null);

  const fetchTickits = async () => {
    setLoading(true);
    try {
      const data = await api.tickits.getAll();
      setTickits(Array.isArray(data) ? data : []);
    } catch (err) {
      addToast(err.message || 'Failed to fetch tickits', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickits();
  }, []);

  const openCreateModal = () => {
    setEditingTickit(null);
    setFormData({
      tickitName: '',
      partyId: parties.length > 0 ? parties[0].partyId : '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (tickit) => {
    setEditingTickit(tickit);
    setFormData({
      tickitName: tickit.tickitName || '',
      partyId: tickit.party?.partyId || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        tickitName: formData.tickitName,
        partyId: Number(formData.partyId),
      };

      if (editingTickit) {
        await api.tickits.update(editingTickit.tickitId, payload);
        addToast('Tickit updated successfully', 'success');
      } else {
        await api.tickits.create(payload);
        addToast('Tickit created successfully', 'success');
      }
      setIsModalOpen(false);
      fetchTickits();
      refreshMasters();
    } catch (err) {
      addToast(err.message || 'Error saving tickit', 'error');
    }
  };

  const handleDelete = async () => {
    if (!tickitToDelete) return;
    try {
      await api.tickits.delete(tickitToDelete.tickitId);
      addToast('Tickit deleted successfully', 'success');
      setIsDeleteModalOpen(false);
      setTickitToDelete(null);
      fetchTickits();
      refreshMasters();
    } catch (err) {
      addToast(err.message || 'Failed to delete tickit', 'error');
    }
  };

  const filteredTickits = tickits.filter(t => {
    const matchesSearch = 
      t.tickitName?.toLowerCase().includes(search.toLowerCase()) ||
      t.party?.partyName?.toLowerCase().includes(search.toLowerCase());
    const matchesParty = selectedPartyFilter === 'ALL' || String(t.party?.partyId) === String(selectedPartyFilter);
    return matchesSearch && matchesParty;
  });

  return (
    <div className="content-area">
      <div className="section-card">
        <div className="section-card-header">
          <div className="section-card-title">
            <Ticket size={20} color="var(--accent-cyan)" />
            <h3>Tickits Master</h3>
            <span className="badge badge-info">{filteredTickits.length} Records</span>
          </div>

          <div className="section-card-actions">
            <div className="search-box">
              <Search size={16} />
              <input
                type="text"
                placeholder="Search tickit by name or party..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <select
              className="form-control"
              style={{ width: '180px' }}
              value={selectedPartyFilter}
              onChange={(e) => setSelectedPartyFilter(e.target.value)}
            >
              <option value="ALL">All Parties</option>
              {parties.map(p => (
                <option key={p.partyId} value={p.partyId}>
                  {p.partyName}
                </option>
              ))}
            </select>

            <button className="btn btn-primary" onClick={openCreateModal}>
              <Plus size={18} />
              <span>Add Tickit</span>
            </button>
          </div>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Tickit Name</th>
                <th>Assigned Party</th>
                <th>Party Phone</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '32px' }}>
                    <div className="spinner" style={{ margin: '0 auto' }}></div>
                  </td>
                </tr>
              ) : filteredTickits.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-dim)' }}>
                    No tickits found. Add your first tickit above.
                  </td>
                </tr>
              ) : (
                filteredTickits.map((tickit) => (
                  <tr key={tickit.tickitId}>
                    <td>#{tickit.tickitId}</td>
                    <td style={{ fontWeight: 600, color: 'var(--accent-cyan)' }}>
                      {tickit.tickitName}
                    </td>
                    <td>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Building2 size={15} color="var(--text-dim)" />
                        {tickit.party?.partyName || '-'}
                      </span>
                    </td>
                    <td>{tickit.party?.phone || '-'}</td>
                    <td>
                      <span className={`badge ${tickit.active ? 'badge-success' : 'badge-danger'}`}>
                        {tickit.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                        <button className="btn-icon" onClick={() => openEditModal(tickit)} title="Edit Tickit">
                          <Edit2 size={16} />
                        </button>
                        <button
                          className="btn-icon"
                          style={{ color: 'var(--accent-rose)' }}
                          onClick={() => { setTickitToDelete(tickit); setIsDeleteModalOpen(true); }}
                          title="Delete Tickit"
                        >
                          <Trash2 size={16} />
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

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTickit ? `Edit Tickit #${editingTickit.tickitId}` : 'Add New Tickit'}
      >
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group col-span-2">
              <label>Tickit Name *</label>
              <input
                type="text"
                className="form-control"
                value={formData.tickitName}
                onChange={(e) => setFormData({ ...formData, tickitName: e.target.value })}
                placeholder="e.g. TICKIT-40S-COMBED"
                required
              />
            </div>

            <div className="form-group col-span-2">
              <label>Select Party *</label>
              <select
                className="form-control"
                value={formData.partyId}
                onChange={(e) => setFormData({ ...formData, partyId: e.target.value })}
                required
              >
                <option value="">-- Choose Party --</option>
                {parties.map(p => (
                  <option key={p.partyId} value={p.partyId}>
                    {p.partyName} ({p.partyType || 'Party'})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="modal-footer" style={{ padding: '20px 0 0', marginTop: '20px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {editingTickit ? 'Update Tickit' : 'Create Tickit'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Soft Deletion"
      >
        <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>
          Are you sure you want to deactivate tickit <strong style={{ color: 'var(--text-main)' }}>{tickitToDelete?.tickitName}</strong>?
        </p>
        <div className="modal-footer" style={{ padding: '0', border: 'none' }}>
          <button className="btn btn-secondary" onClick={() => setIsDeleteModalOpen(false)}>
            Cancel
          </button>
          <button className="btn btn-danger" onClick={handleDelete}>
            Deactivate Tickit
          </button>
        </div>
      </Modal>
    </div>
  );
};
