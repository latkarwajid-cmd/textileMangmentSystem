import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { Plus, Search, Edit2, Trash2, Factory, Building2 } from 'lucide-react';
import { Modal } from '../components/Modal';

export const SizingUnitsView = () => {
  const { parties, addToast, refreshMasters } = useApp();
  const [sizingUnits, setSizingUnits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [partyFilter, setPartyFilter] = useState('ALL');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState(null);
  const [formData, setFormData] = useState({
    sizingName: '',
    partyId: '',
  });

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [unitToDelete, setUnitToDelete] = useState(null);

  const fetchSizingUnits = async () => {
    setLoading(true);
    try {
      const data = await api.sizingUnits.getAll();
      setSizingUnits(Array.isArray(data) ? data : []);
    } catch (err) {
      addToast(err.message || 'Failed to fetch sizing units', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSizingUnits();
  }, []);

  const openCreateModal = () => {
    setEditingUnit(null);
    setFormData({
      sizingName: '',
      partyId: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (unit) => {
    setEditingUnit(unit);
    setFormData({
      sizingName: unit.sizingName || '',
      partyId: unit.party?.partyId || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        sizingName: formData.sizingName,
        partyId: formData.partyId ? Number(formData.partyId) : null,
      };

      if (editingUnit) {
        await api.sizingUnits.update(editingUnit.sizingId, payload);
        addToast('Sizing unit updated successfully', 'success');
      } else {
        await api.sizingUnits.create(payload);
        addToast('Sizing unit created successfully', 'success');
      }
      setIsModalOpen(false);
      fetchSizingUnits();
      refreshMasters();
    } catch (err) {
      addToast(err.message || 'Error saving sizing unit', 'error');
    }
  };

  const handleDelete = async () => {
    if (!unitToDelete) return;
    try {
      await api.sizingUnits.delete(unitToDelete.sizingId);
      addToast('Sizing unit deleted successfully', 'success');
      setIsDeleteModalOpen(false);
      setUnitToDelete(null);
      fetchSizingUnits();
      refreshMasters();
    } catch (err) {
      addToast(err.message || 'Failed to delete sizing unit', 'error');
    }
  };

  const filteredUnits = sizingUnits.filter(u => {
    const matchesSearch = 
      u.sizingName?.toLowerCase().includes(search.toLowerCase()) ||
      u.party?.partyName?.toLowerCase().includes(search.toLowerCase());
    const matchesParty = partyFilter === 'ALL' || String(u.party?.partyId) === String(partyFilter);
    return matchesSearch && matchesParty;
  });

  return (
    <div className="content-area">
      <div className="section-card">
        <div className="section-card-header">
          <div className="section-card-title">
            <Factory size={20} color="var(--accent-amber)" />
            <h3>Sizing Units Master</h3>
            <span className="badge badge-info">{filteredUnits.length} Records</span>
          </div>

          <div className="section-card-actions">
            <div className="search-box">
              <Search size={16} />
              <input
                type="text"
                placeholder="Search sizing unit or party..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <select
              className="form-control"
              style={{ width: '180px' }}
              value={partyFilter}
              onChange={(e) => setPartyFilter(e.target.value)}
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
              <span>Add Sizing Unit</span>
            </button>
          </div>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Sizing Name</th>
                <th>Associated Party</th>
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
              ) : filteredUnits.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-dim)' }}>
                    No sizing units found. Add your first sizing unit above.
                  </td>
                </tr>
              ) : (
                filteredUnits.map((unit) => (
                  <tr key={unit.sizingId}>
                    <td>#{unit.sizingId}</td>
                    <td style={{ fontWeight: 600, color: 'var(--accent-amber)' }}>
                      {unit.sizingName}
                    </td>
                    <td>
                      {unit.party ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Building2 size={15} color="var(--text-dim)" />
                          {unit.party.partyName}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-dim)' }}>Independent Unit</span>
                      )}
                    </td>
                    <td>{unit.party?.phone || '-'}</td>
                    <td>
                      <span className={`badge ${unit.active ? 'badge-success' : 'badge-danger'}`}>
                        {unit.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                        <button className="btn-icon" onClick={() => openEditModal(unit)} title="Edit Sizing Unit">
                          <Edit2 size={16} />
                        </button>
                        <button
                          className="btn-icon"
                          style={{ color: 'var(--accent-rose)' }}
                          onClick={() => { setUnitToDelete(unit); setIsDeleteModalOpen(true); }}
                          title="Delete Sizing Unit"
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
        title={editingUnit ? `Edit Sizing Unit #${editingUnit.sizingId}` : 'Add New Sizing Unit'}
      >
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group col-span-2">
              <label>Sizing Unit Name *</label>
              <input
                type="text"
                className="form-control"
                value={formData.sizingName}
                onChange={(e) => setFormData({ ...formData, sizingName: e.target.value })}
                placeholder="e.g. Sizing Mill #1, Apex Sizers"
                required
              />
            </div>

            <div className="form-group col-span-2">
              <label>Associated Party (Optional)</label>
              <select
                className="form-control"
                value={formData.partyId}
                onChange={(e) => setFormData({ ...formData, partyId: e.target.value })}
              >
                <option value="">-- Standalone / No Specific Party --</option>
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
              {editingUnit ? 'Update Unit' : 'Create Unit'}
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
          Are you sure you want to deactivate sizing unit <strong style={{ color: 'var(--text-main)' }}>{unitToDelete?.sizingName}</strong>?
        </p>
        <div className="modal-footer" style={{ padding: '0', border: 'none' }}>
          <button className="btn btn-secondary" onClick={() => setIsDeleteModalOpen(false)}>
            Cancel
          </button>
          <button className="btn btn-danger" onClick={handleDelete}>
            Deactivate Unit
          </button>
        </div>
      </Modal>
    </div>
  );
};
