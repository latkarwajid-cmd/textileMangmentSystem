import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { Plus, Search, Edit2, Trash2, Layers } from 'lucide-react';
import { Modal } from '../components/Modal';

export const YarnCountsView = () => {
  const { addToast, refreshMasters } = useApp();
  const [yarnCounts, setYarnCounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCount, setEditingCount] = useState(null);
  const [formData, setFormData] = useState({
    countName: '',
    countType: 'COTTON',
    description: '',
  });

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [countToDelete, setCountToDelete] = useState(null);

  const fetchYarnCounts = async () => {
    setLoading(true);
    try {
      const data = await api.yarnCounts.getAll();
      setYarnCounts(Array.isArray(data) ? data : []);
    } catch (err) {
      addToast(err.message || 'Failed to fetch yarn counts', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchYarnCounts();
  }, []);

  const openCreateModal = () => {
    setEditingCount(null);
    setFormData({
      countName: '',
      countType: 'COTTON',
      description: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (count) => {
    setEditingCount(count);
    setFormData({
      countName: count.countName || '',
      countType: count.countType || 'COTTON',
      description: count.description || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCount) {
        await api.yarnCounts.update(editingCount.countId, formData);
        addToast('Yarn count updated successfully', 'success');
      } else {
        await api.yarnCounts.create(formData);
        addToast('Yarn count created successfully', 'success');
      }
      setIsModalOpen(false);
      fetchYarnCounts();
      refreshMasters();
    } catch (err) {
      addToast(err.message || 'Error saving yarn count', 'error');
    }
  };

  const handleDelete = async () => {
    if (!countToDelete) return;
    try {
      await api.yarnCounts.delete(countToDelete.countId);
      addToast('Yarn count deleted successfully', 'success');
      setIsDeleteModalOpen(false);
      setCountToDelete(null);
      fetchYarnCounts();
      refreshMasters();
    } catch (err) {
      addToast(err.message || 'Failed to delete yarn count', 'error');
    }
  };

  const filteredCounts = yarnCounts.filter(c => 
    c.countName?.toLowerCase().includes(search.toLowerCase()) ||
    c.countType?.toLowerCase().includes(search.toLowerCase()) ||
    c.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="content-area">
      <div className="section-card">
        <div className="section-card-header">
          <div className="section-card-title">
            <Layers size={20} color="var(--accent-emerald)" />
            <h3>Yarn Counts Master</h3>
            <span className="badge badge-info">{filteredCounts.length} Records</span>
          </div>

          <div className="section-card-actions">
            <div className="search-box">
              <Search size={16} />
              <input
                type="text"
                placeholder="Search by count name, type, description..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

          </div>
        </div>

        <div style={{ margin: '16px 0', display: 'flex', justifyContent: 'flex-start' }}>
          <button className="btn btn-primary" onClick={openCreateModal}>
            <Plus size={18} />
            <span>Add Yarn Count</span>
          </button>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Count Name</th>
                <th>Count Type</th>
                <th>Description</th>
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
              ) : filteredCounts.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-dim)' }}>
                    No yarn counts found. Add your first count above.
                  </td>
                </tr>
              ) : (
                filteredCounts.map((count) => (
                  <tr key={count.countId}>
                    <td>#{count.countId}</td>
                    <td style={{ fontWeight: 600, color: 'var(--accent-emerald)' }}>
                      {count.countName}
                    </td>
                    <td>
                      <span className="badge badge-info">{count.countType || 'Standard'}</span>
                    </td>
                    <td>{count.description || '-'}</td>
                    <td>
                      <span className={`badge ${count.active ? 'badge-success' : 'badge-danger'}`}>
                        {count.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                        <button className="btn-icon" onClick={() => openEditModal(count)} title="Edit Count">
                          <Edit2 size={16} />
                        </button>
                        <button
                          className="btn-icon"
                          style={{ color: 'var(--accent-rose)' }}
                          onClick={() => { setCountToDelete(count); setIsDeleteModalOpen(true); }}
                          title="Delete Count"
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
        title={editingCount ? `Edit Yarn Count #${editingCount.countId}` : 'Add New Yarn Count'}
      >
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label>Count Name *</label>
              <input
                type="text"
                className="form-control"
                value={formData.countName}
                onChange={(e) => setFormData({ ...formData, countName: e.target.value })}
                placeholder="e.g. 40s Ne, 60s CW, 2/40 PV"
                required
              />
            </div>

            <div className="form-group">
              <label>Count Type</label>
              <select
                className="form-control"
                value={formData.countType}
                onChange={(e) => setFormData({ ...formData, countType: e.target.value })}
              >
                <option value="COTTON">Cotton</option>
                <option value="POLYESTER">Polyester</option>
                <option value="PV">PV Blend</option>
                <option value="PC">PC Blend</option>
                <option value="VISCOSE">Viscose</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div className="form-group col-span-2">
              <label>Description</label>
              <textarea
                className="form-control"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Details, twist info, yarn quality remarks..."
              />
            </div>
          </div>

          <div className="modal-footer" style={{ padding: '20px 0 0', marginTop: '20px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {editingCount ? 'Update Count' : 'Create Count'}
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
          Are you sure you want to deactivate yarn count <strong style={{ color: 'var(--text-main)' }}>{countToDelete?.countName}</strong>?
        </p>
        <div className="modal-footer" style={{ padding: '0', border: 'none' }}>
          <button className="btn btn-secondary" onClick={() => setIsDeleteModalOpen(false)}>
            Cancel
          </button>
          <button className="btn btn-danger" onClick={handleDelete}>
            Deactivate Yarn Count
          </button>
        </div>
      </Modal>
    </div>
  );
};
