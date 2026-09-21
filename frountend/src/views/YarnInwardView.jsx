import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  ArrowDownLeft, 
  Building2,
  Info,
  Calendar,
  Layers,
  Ticket,
  FileText,
  Eye,
  DollarSign
} from 'lucide-react';
import { Modal } from '../components/Modal';
import { OrderNumberField } from '../components/OrderNumberField';

// Normalize date from backend: handles both "2024-09-18" string and [2024,9,18] array
const formatDate = (date) => {
 if (!date || date === '-') return '';
  if (Array.isArray(date)) {
    const [y, m, d] = date;
    return `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
  }
  return String(date).substring(0, 10);
};

export const YarnInwardView = () => {
  const { parties, fabricOrders, tickits, yarnCounts, sizingUnits, yarnStorageLocations, addToast } = useApp();
  const [inwardList, setInwardList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [orderFilter, setOrderFilter] = useState('ALL');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    orderId: '',
    inwardDate: new Date().toISOString().split('T')[0],
    countId: '',
    tickitId: '',
    supplierId: '',
    storageLocationId: '',
    storageSizingId: '',
    storagePartyId: '',
    bags: '',
    weightKg: '',
    rate: '',
    gstPercent: '5.0',
    calculatedAmount: '',
    actualAmount: '',

  });

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const [viewDetailItem, setViewDetailItem] = useState(null);

  const fetchInwardList = async () => {
    setLoading(true);
    try {
      const data = await api.yarnInward.getAll();
      setInwardList(Array.isArray(data) ? data : []);
    } catch (err) {
      addToast(err.message || 'Failed to fetch yarn inward entries', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInwardList();
  }, []);

  // Real-time calculation effect
  useEffect(() => {
    const weight = parseFloat(formData.weightKg) || 0;
    const rate = parseFloat(formData.rate) || 0;
    const gst = parseFloat(formData.gstPercent) || 0;

    if (weight > 0 && rate > 0) {
      const base = weight * rate;
      const total = gst > 0 ? base * (1 + gst / 100) : base;
      const rounded = total.toFixed(2);
      setFormData(prev => ({
        ...prev,
        calculatedAmount: rounded,
        actualAmount: prev.actualAmount === '' || prev.actualAmount === prev.calculatedAmount ? rounded : prev.actualAmount,
        billAmount: prev.billAmount === '' || prev.billAmount === prev.calculatedAmount ? rounded : prev.billAmount,
      }));
    }
  }, [formData.weightKg, formData.rate, formData.gstPercent]);

  const selectedOrder = fabricOrders.find(o => String(o.orderId) === String(formData.orderId));
  const selectedStorageLocation = yarnStorageLocations.find(location => String(location.storageLocationId) === String(formData.storageLocationId));
  const isSizingStorage = selectedStorageLocation?.locationName?.toLowerCase() === 'sizing';
  const isWeaverStorage = selectedStorageLocation?.locationName?.toLowerCase() === 'weaver';
  const isDyeingStorage = selectedStorageLocation?.locationName?.toLowerCase() === 'dyeing';

  const handleOrderChange = orderNo => {
    const order = fabricOrders.find(item => item.orderNo?.trim().toLowerCase() === orderNo.trim().toLowerCase());
    setFormData(prev => ({
      ...prev,
      orderId: order?.orderId || '',
      countId: order?.count?.countId || '',
      tickitId: order?.tickit?.tickitId || '',
      supplierId: order?.supplier?.partyId || '',
    }));
  };

  const openCreateModal = () => {
    setEditingItem(null);
    setFormData({
      orderId: '',
      inwardDate: new Date().toISOString().split('T')[0],
      countId: '',
      tickitId: '',
      supplierId: '',
      storageLocationId: '',
      storageSizingId: '',
      storagePartyId: '',
      bags: '',
      weightKg: '',
      rate: '',
      gstPercent: '5.0',
      calculatedAmount: '',
      actualAmount: '',

    });
    setIsModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      orderId: item.order?.orderId || '',
      inwardDate: formatDate(item.inwardDate),
      countId: item.count?.countId || '',
      tickitId: item.tickit?.tickitId || '',
      supplierId: item.supplier?.partyId || '',
      storageLocationId: item.storageLocation?.storageLocationId || '',
      storageSizingId: item.storageSizingUnit?.sizingId || '',
      storagePartyId: item.storageParty?.partyId || '',
      bags: item.bags || '',
      weightKg: item.weightKg || '',
      rate: item.rate || '',
      gstPercent: item.gstPercent || '5.0',
      calculatedAmount: item.calculatedAmount || '',
      actualAmount: item.actualAmount || '',

    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        orderId: formData.orderId ? Number(formData.orderId) : null,
        inwardDate: formData.inwardDate || null,
        countId: formData.countId ? Number(formData.countId) : null,
        tickitId: formData.tickitId ? Number(formData.tickitId) : null,
        supplierId: formData.supplierId ? Number(formData.supplierId) : null,
        storageLocationId: formData.storageLocationId ? Number(formData.storageLocationId) : null,
        storageSizingId: formData.storageSizingId ? Number(formData.storageSizingId) : null,
        storagePartyId: formData.storagePartyId ? Number(formData.storagePartyId) : null,
        bags: formData.bags ? Number(formData.bags) : null,
        weightKg: formData.weightKg ? Number(formData.weightKg) : null,
        rate: formData.rate ? Number(formData.rate) : null,
        gstPercent: formData.gstPercent ? Number(formData.gstPercent) : null,
        calculatedAmount: formData.calculatedAmount ? Number(formData.calculatedAmount) : null,
        actualAmount: formData.actualAmount ? Number(formData.actualAmount) : null,
 
      };

      if (editingItem) {
        await api.yarnInward.update(editingItem.yarnInwardId, payload);
        addToast('Yarn Inward updated successfully', 'success');
      } else {
        await api.yarnInward.create(payload);
        addToast('Yarn Inward created successfully', 'success');
      }
      setIsModalOpen(false);
      fetchInwardList();
    } catch (err) {
      addToast(err.message || 'Error saving inward record', 'error');
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    try {
      await api.yarnInward.delete(itemToDelete.yarnInwardId);
      addToast('Yarn Inward entry deleted successfully', 'success');
      setIsDeleteModalOpen(false);
      setItemToDelete(null);
      fetchInwardList();
    } catch (err) {
      addToast(err.message || 'Failed to delete record', 'error');
    }
  };

  const filteredList = inwardList.filter(item => {
    const matchesSearch = 
      item.billNo?.toLowerCase().includes(search.toLowerCase()) ||
      item.order?.orderNo?.toLowerCase().includes(search.toLowerCase()) ||
      item.supplier?.partyName?.toLowerCase().includes(search.toLowerCase()) ||
      item.count?.countName?.toLowerCase().includes(search.toLowerCase()) ||
      item.tickit?.tickitName?.toLowerCase().includes(search.toLowerCase()) ||
      item.storageLocation?.locationName?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || item.paymentStatus?.toUpperCase() === statusFilter;
    const matchesOrder = orderFilter === 'ALL' || String(item.order?.orderId) === String(orderFilter);
    return matchesSearch && matchesStatus && matchesOrder;
  });

  return (
    <div className="content-area">
      <div className="section-card">
        <div className="section-card-header">
          <div className="section-card-title">
            <ArrowDownLeft size={20} color="var(--primary-blue)" />
            <h3>Yarn Inward Register</h3>
            <span className="badge badge-info">{filteredList.length} Lots</span>
          </div>

          <div className="section-card-actions">
            <div className="search-box">
              <Search size={16} />
              <input
                type="text"
                placeholder="Search by Order No, Bill No, Supplier..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <select
              className="form-control"
              style={{ width: '170px' }}
              value={orderFilter}
              onChange={(e) => setOrderFilter(e.target.value)}
            >
              <option value="ALL">All Fabric Orders</option>
              {fabricOrders.map(o => (
                <option key={o.orderId} value={o.orderId}>
                  {o.orderNo} ({o.party?.partyName || 'Order'})
                </option>
              ))}
            </select>

            <select
              className="form-control"
              style={{ width: '130px' }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All Statuses</option>
              <option value="UNPAID">Unpaid</option>
              <option value="PAID">Paid</option>
              <option value="PARTIAL">Partial</option>
            </select>

          </div>
        </div>

        <div style={{ margin: '16px 0', display: 'flex', justifyContent: 'flex-start' }}>
          <button className="btn btn-primary" onClick={openCreateModal}>
            <Plus size={18} />
            <span>New Yarn Inward</span>
          </button>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Order No</th>
                <th>Inward Date</th>
                <th>Supplier Party</th>
                <th>Stored At</th>
                <th>Yarn Count</th>
                <th>Tickit</th>
                <th>Bags</th>
                <th>Weight (Kg)</th>
                <th>Rate (₹)</th>
                <th>Amount (₹)</th>

                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="19" style={{ textAlign: 'center', padding: '32px' }}>
                    <div className="spinner" style={{ margin: '0 auto' }}></div>
                  </td>
                </tr>
              ) : filteredList.length === 0 ? (
                <tr>
                  <td colSpan="19" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                    No inward records found. Click 'New Yarn Inward' to record a shipment.
                  </td>
                </tr>
              ) : (
                filteredList.map((item) => (
                  <tr key={item.yarnInwardId}>
                    <td>
                      {item.order?.orderNo ? (
                        <span className="badge badge-info" style={{ fontWeight: 700 }}>
                          {item.order.orderNo}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-light)', fontSize: '0.8rem' }}>Direct / None</span>
                      )}
                    </td>
                    <td>{formatDate(item.inwardDate)}</td>
                    <td style={{ fontWeight: 600 }}>{item.supplier?.partyName || '-'}</td>
                    <td>{item.storageLocation?.locationName || '-'}</td>
                    <td>{item.count?.countName || '-'}</td>
                    <td>{item.tickit?.tickitName || '-'}</td>
                    <td>{item.bags || '-'}</td>
                    <td style={{ fontWeight: 600 }}>{item.weightKg ? `${item.weightKg} kg` : '-'}</td>
                    <td>{item.rate ? `₹${item.rate}` : '-'}</td>
                    <td style={{ color: 'var(--primary-blue-dark)', fontWeight: 700 }}>
                      ₹{item.actualAmount || item.calculatedAmount || '-'}
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                        <button className="btn-icon" onClick={() => setViewDetailItem(item)} title="View All Details">
                          <Eye size={15} />
                        </button>
                        <button className="btn-icon" onClick={() => openEditModal(item)} title="Edit Entry">
                          <Edit2 size={15} />
                        </button>
                        <button
                          className="btn-icon"
                          style={{ color: 'var(--color-danger)' }}
                          onClick={() => { setItemToDelete(item); setIsDeleteModalOpen(true); }}
                          title="Delete Entry"
                        >
                          <Trash2 size={15} />
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
        title={editingItem ? `Edit Yarn Inward Lot #${editingItem.yarnInwardId}` : 'Record New Yarn Inward'}
        size="lg"
      >
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            {/* Order Selection at Top */}
            <OrderNumberField
              orders={fabricOrders}
              value={selectedOrder?.orderNo || ''}
              onChange={handleOrderChange}
              className="col-span-2"
            />

            {/* Instant Order Summary Info Box */}
            {selectedOrder && (
              <div className="form-group col-span-2" style={{
                backgroundColor: 'var(--primary-blue-light)',
                border: '1px solid #bae6fd',
                borderRadius: '6px',
                padding: '12px 16px',
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '10px'
              }}>
                <div>
                  <div style={{ fontSize: '0.7rem', color: '#0369a1', fontWeight: 600, textTransform: 'uppercase' }}>Customer Party</div>
                  <div style={{ fontWeight: 700, color: '#0f172a' }}>{selectedOrder.party?.partyName || '-'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', color: '#0369a1', fontWeight: 600, textTransform: 'uppercase' }}>Fabric Quality</div>
                  <div style={{ fontWeight: 600, color: '#0f172a' }}>{selectedOrder.quality || '-'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', color: '#0369a1', fontWeight: 600, textTransform: 'uppercase' }}>Ordered Meters</div>
                  <div style={{ fontWeight: 600, color: '#0f172a' }}>{selectedOrder.orderedMeters} m</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', color: '#0369a1', fontWeight: 600, textTransform: 'uppercase' }}>Order Status</div>
                  <div style={{ fontWeight: 700, color: '#0369a1' }}>{selectedOrder.status}</div>
                </div>
              </div>
            )}

            <div className="form-group">
              <label>Inward Date *</label>
              <input
                type="date"
                className="form-control"
                value={formData.inwardDate}
                onChange={(e) => setFormData({ ...formData, inwardDate: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Supplier Party *</label>
              <select
                className="form-control"
                value={formData.supplierId}
                onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
                required
              >
                <option value="">-- Select Yarn Supplier --</option>
                {parties.map(p => (
                  <option key={p.partyId} value={p.partyId}>
                    {p.partyName} ({p.partyType || 'Supplier'})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Stored At *</label>
              <select
                className="form-control"
                value={formData.storageLocationId}
                onChange={(e) => setFormData({ ...formData, storageLocationId: e.target.value, storageSizingId: '', storagePartyId: '' })}
                required
              >
                <option value="">-- Select Storage Location --</option>
                {[...yarnStorageLocations].sort((first, second) => {
                  const order = { Dyeing: 0, Other: 1 };
                  return (order[first.locationName] ?? 0) - (order[second.locationName] ?? 0);
                }).map(location => (
                  <option key={location.storageLocationId} value={location.storageLocationId}>
                    {location.locationName}
                  </option>
                ))}
              </select>
            </div>

            {(isSizingStorage || isWeaverStorage || isDyeingStorage) && (
              <div className="form-group">
                <label>{isSizingStorage ? 'Sizing Unit' : isDyeingStorage ? 'Dyeing Unit' : 'Weaver'} *</label>
                <select
                  className="form-control"
                  value={isSizingStorage ? formData.storageSizingId : formData.storagePartyId}
                  onChange={(e) => setFormData({
                    ...formData,
                    storageSizingId: isSizingStorage ? e.target.value : '',
                    storagePartyId: isWeaverStorage ? e.target.value : '',
                  })}
                  required
                >
                  <option value="">-- Select {isSizingStorage ? 'Sizing Unit' : isDyeingStorage ? 'Dyeing Unit' : 'Weaver'} --</option>
                  {isSizingStorage
                    ? sizingUnits.map(unit => <option key={unit.sizingId} value={unit.sizingId}>{unit.sizingName}</option>)
                    : parties.filter(party => party.partyType?.toUpperCase() === (isDyeingStorage ? 'DYEING' : 'WEAVER')).map(party => <option key={party.partyId} value={party.partyId}>{party.partyName}</option>)}
                </select>
              </div>
            )}

            <div className="form-group">
              <label>Yarn Count</label>
              <select
                className="form-control"
                value={formData.countId}
                onChange={(e) => setFormData({ ...formData, countId: e.target.value })}
              >
                <option value="">-- Select Count --</option>
                {yarnCounts.map(c => (
                  <option key={c.countId} value={c.countId}>
                    {c.countName} ({c.countType || 'Standard'})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Tickit</label>
              <select
                className="form-control"
                value={formData.tickitId}
                onChange={(e) => setFormData({ ...formData, tickitId: e.target.value })}
              >
                <option value="">-- Select Tickit --</option>
                {tickits.map(t => (
                  <option key={t.tickitId} value={t.tickitId}>
                    {t.tickitName} ({t.party?.partyName || 'Party'})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Bags Count</label>
              <input
                type="number"
                step="0.001"
                className="form-control"
                value={formData.bags}
                onChange={(e) => setFormData({ ...formData, bags: e.target.value })}
                placeholder="e.g. 10"
              />
            </div>

            <div className="form-group">
              <label>Net Weight (Kg) *</label>
              <input
                type="number"
                step="0.001"
                className="form-control"
                value={formData.weightKg}
                onChange={(e) => setFormData({ ...formData, weightKg: e.target.value })}
                placeholder="e.g. 500.000"
                required
              />
            </div>

            <div className="form-group">
              <label>Rate per Kg (₹) *</label>
              <input
                type="number"
                step="0.01"
                className="form-control"
                value={formData.rate}
                onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                placeholder="e.g. 265.00"
                required
              />
            </div>

            <div className="form-group">
              <label>GST %</label>
              <input
                type="number"
                step="0.01"
                className="form-control"
                value={formData.gstPercent}
                onChange={(e) => setFormData({ ...formData, gstPercent: e.target.value })}
                placeholder="5.0"
              />
            </div>

            <div className="form-group">
              <label>Calculated Amount (₹) (Auto)</label>
              <input
                type="number"
                step="0.01"
                className="form-control"
                value={formData.calculatedAmount}
                onChange={(e) => setFormData({ ...formData, calculatedAmount: e.target.value })}
                placeholder="Auto computed"
                style={{ color: '#0369a1', fontWeight: 700, backgroundColor: '#f0f9ff' }}
              />
            </div>

            <div className="form-group">
              <label>Actual Invoiced Amount (₹)</label>
              <input
                type="number"
                step="0.01"
                className="form-control"
                value={formData.actualAmount}
                onChange={(e) => setFormData({ ...formData, actualAmount: e.target.value })}
                placeholder="Amount on bill"
              />
            </div>


          </div>

          <div className="modal-footer" style={{ padding: '20px 0 0', marginTop: '20px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {editingItem ? 'Update Inward Lot' : 'Save Inward Record'}
            </button>
          </div>
        </form>
      </Modal>

      {/* View Full Details Modal */}
      <Modal
        isOpen={Boolean(viewDetailItem)}
        onClose={() => setViewDetailItem(null)}
        title={`Yarn Inward Lot Details #${viewDetailItem?.yarnInwardId}`}
        size="lg"
      >
        {viewDetailItem && (
          <div>
            <div style={{
              backgroundColor: '#f8fafc',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              padding: '16px',
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '14px',
              marginBottom: '16px'
            }}>
              <div>
                <strong style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>FABRIC ORDER NO</strong>
                <div style={{ fontWeight: 700, color: 'var(--primary-blue-dark)' }}>
                  {viewDetailItem.order?.orderNo || 'None / General Inward'}
                </div>
              </div>
              <div>
                <strong style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ORDER CUSTOMER</strong>
                <div style={{ fontWeight: 600 }}>{viewDetailItem.order?.party?.partyName || '-'}</div>
              </div>
              <div>
                <strong style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ORDER QUALITY</strong>
                <div>{viewDetailItem.order?.quality || '-'}</div>
              </div>
              <div>
                <strong style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>INWARD DATE</strong>
                <div>{formatDate(viewDetailItem.inwardDate)}</div>
              </div>
              <div>
                <strong style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>SUPPLIER PARTY</strong>
                <div style={{ fontWeight: 600 }}>{viewDetailItem.supplier?.partyName || '-'}</div>
              </div>
              <div>
                <strong style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>STORED AT</strong>
                <div style={{ fontWeight: 600 }}>{viewDetailItem.storageLocation?.locationName || '-'}</div>
              </div>
              <div>
                <strong style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>BILL NO</strong>
                <div>{viewDetailItem.billNo || '-'}</div>
              </div>
              <div>
                <strong style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>YARN COUNT</strong>
                <div>{viewDetailItem.count?.countName || '-'}</div>
              </div>
              <div>
                <strong style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>TICKIT</strong>
                <div>{viewDetailItem.tickit?.tickitName || '-'}</div>
              </div>
              <div>
                <strong style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>BAGS / WEIGHT</strong>
                <div>{viewDetailItem.bags || 0} Bags | {viewDetailItem.weightKg || 0} kg</div>
              </div>
              <div>
                <strong style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>RATE (₹) & GST %</strong>
                <div>₹{viewDetailItem.rate || 0} / kg ({viewDetailItem.gstPercent || 0}% GST)</div>
              </div>
              <div>
                <strong style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>CALCULATED AMOUNT</strong>
                <div style={{ color: 'var(--primary-blue-dark)', fontWeight: 700 }}>₹{viewDetailItem.calculatedAmount || '-'}</div>
              </div>

            </div>

            <div className="modal-footer" style={{ padding: '0', border: 'none', background: 'transparent' }}>
              <button className="btn btn-secondary" onClick={() => setViewDetailItem(null)}>
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Lot Deletion"
      >
        <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>
          Are you sure you want to delete Yarn Inward record <strong style={{ color: 'var(--text-main)' }}>#{itemToDelete?.yarnInwardId} ({itemToDelete?.billNo || 'No Bill No'})</strong>?
        </p>
        <div className="modal-footer" style={{ padding: '0', border: 'none', background: 'transparent' }}>
          <button className="btn btn-secondary" onClick={() => setIsDeleteModalOpen(false)}>
            Cancel
          </button>
          <button className="btn btn-danger" onClick={handleDelete}>
            Delete Record
          </button>
        </div>
      </Modal>
    </div>
  );
};
