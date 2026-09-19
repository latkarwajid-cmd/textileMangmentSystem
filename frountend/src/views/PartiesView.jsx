import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { Plus, Search, Edit2, Trash2, Phone, MapPin, FileText, CheckCircle2, XCircle } from 'lucide-react';
import { Modal } from '../components/Modal';

export const PartiesView = () => {
  const { addToast, refreshMasters } = useApp();
  const [parties, setParties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('ALL');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingParty, setEditingParty] = useState(null);
  const [formData, setFormData] = useState({
    partyName: '',
    partyType: 'SUPPLIER',
    phone: '',
    address: '',
    gstNo: '',
  });

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [partyToDelete, setPartyToDelete] = useState(null);

  const fetchParties = async () => {
    setLoading(true);
    try {
      const data = await api.parties.getAll();
      setParties(Array.isArray(data) ? data : []);
    } catch (err) {
      addToast(err.message || 'Failed to fetch parties', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParties();
  }, []);

  const openCreateModal = () => {
    setEditingParty(null);
    setFormData({
      partyName: '',
      partyType: 'SUPPLIER',
      phone: '',
      address: '',
      gstNo: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (party) => {
    setEditingParty(party);
    setFormData({
      partyName: party.partyName || '',
      partyType: party.partyType || 'SUPPLIER',
      phone: party.phone || '',
      address: party.address || '',
      gstNo: party.gstNo || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingParty) {
        await api.parties.update(editingParty.partyId, formData);
        addToast('Party updated successfully', 'success');
      } else {
        await api.parties.create(formData);
        addToast('Party created successfully', 'success');
      }
      setIsModalOpen(false);
      fetchParties();
      refreshMasters();
    } catch (err) {
      addToast(err.message || 'Error saving party', 'error');
    }
  };

  const handleDelete = async () => {
    if (!partyToDelete) return;
    try {
      await api.parties.delete(partyToDelete.partyId);
      addToast('Party deleted successfully', 'success');
      setIsDeleteModalOpen(false);
      setPartyToDelete(null);
      fetchParties();
      refreshMasters();
    } catch (err) {
      addToast(err.message || 'Failed to delete party', 'error');
    }
  };

  const filteredParties = parties.filter(p => {
    const matchesSearch = 
      p.partyName?.toLowerCase().includes(search.toLowerCase()) ||
      p.phone?.toLowerCase().includes(search.toLowerCase()) ||
      p.gstNo?.toLowerCase().includes(search.toLowerCase());
    const matchesType = filterType === 'ALL' || p.partyType?.toUpperCase() === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="content-area">
      <div className="section-card">
        <div className="section-card-header">
          <div className="section-card-title">
            <h3>Parties Master</h3>
            <span className="badge badge-info">{filteredParties.length} Records</span>
          </div>

          <div className="section-card-actions">
            <div className="search-box">
              <Search size={16} />
              <input
                type="text"
                placeholder="Search party by name, phone, GST..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <select
              className="form-control"
              style={{ width: '160px' }}
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="ALL">All Types</option>
              <option value="SUPPLIER">Supplier</option>
              <option value="CUSTOMER">Customer</option>
              <option value="WEAVER">Weaver</option>
              <option value="SIZING">Sizing Unit</option>
              <option value="DYEING">Dyeing Unit</option>
            </select>

            <button className="btn btn-primary" onClick={openCreateModal}>
              <Plus size={18} />
              <span>Add Party</span>
            </button>
          </div>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Party Name</th>
                <th>Party Type</th>
                <th>Phone</th>
                <th>Address</th>
                <th>GST No</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '32px' }}>
                    <div className="spinner" style={{ margin: '0 auto' }}></div>
                  </td>
                </tr>
              ) : filteredParties.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-dim)' }}>
                    No parties found matching your search.
                  </td>
                </tr>
              ) : (
                filteredParties.map((party) => (
                  <tr key={party.partyId}>
                    <td>#{party.partyId}</td>
                    <td style={{ fontWeight: 600 }}>{party.partyName}</td>
                    <td>
                      <span className="badge badge-info">{party.partyType || 'STANDARD'}</span>
                    </td>
                    <td>
                      {party.phone ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Phone size={14} color="var(--text-dim)" /> {party.phone}
                        </span>
                      ) : '-'}
                    </td>
                    <td style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {party.address || '-'}
                    </td>
                    <td>{party.gstNo || '-'}</td>
                    <td>
                      <span className={`badge ${party.status ? 'badge-success' : 'badge-danger'}`}>
                        {party.status ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                        <button className="btn-icon" onClick={() => openEditModal(party)} title="Edit Party">
                          <Edit2 size={16} />
                        </button>
                        <button
                          className="btn-icon"
                          style={{ color: 'var(--accent-rose)' }}
                          onClick={() => { setPartyToDelete(party); setIsDeleteModalOpen(true); }}
                          title="Delete Party"
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
        title={editingParty ? `Edit Party #${editingParty.partyId}` : 'Add New Party'}
      >
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group col-span-2">
              <label>Party Name *</label>
              <input
                type="text"
                className="form-control"
                value={formData.partyName}
                onChange={(e) => setFormData({ ...formData, partyName: e.target.value })}
                placeholder="e.g. Acme Textiles Ltd."
                required
              />
            </div>

            <div className="form-group">
              <label>Party Type</label>
              <select
                className="form-control"
                value={formData.partyType}
                onChange={(e) => setFormData({ ...formData, partyType: e.target.value })}
              >
                <option value="SUPPLIER">Supplier</option>
                <option value="CUSTOMER">Customer</option>
                <option value="WEAVER">Weaver</option>
                <option value="SIZING">Sizing Unit</option>
                <option value="DYEING">Dyeing Unit</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label>Phone Number</label>
              <input
                type="text"
                className="form-control"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91 98765 43210"
              />
            </div>

            <div className="form-group col-span-2">
              <label>GST Number</label>
              <input
                type="text"
                className="form-control"
                value={formData.gstNo}
                onChange={(e) => setFormData({ ...formData, gstNo: e.target.value })}
                placeholder="27AABCU9603R1ZM"
              />
            </div>

            <div className="form-group col-span-2">
              <label>Address</label>
              <textarea
                className="form-control"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Full street address, city, state..."
              />
            </div>
          </div>

          <div className="modal-footer" style={{ padding: '20px 0 0', marginTop: '20px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {editingParty ? 'Update Party' : 'Create Party'}
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
          Are you sure you want to deactivate party <strong style={{ color: 'var(--text-main)' }}>{partyToDelete?.partyName}</strong>?
        </p>
        <div className="modal-footer" style={{ padding: '0', border: 'none' }}>
          <button className="btn btn-secondary" onClick={() => setIsDeleteModalOpen(false)}>
            Cancel
          </button>
          <button className="btn btn-danger" onClick={handleDelete}>
            Deactivate Party
          </button>
        </div>
      </Modal>
    </div>
  );
};
