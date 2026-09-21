import React, { useEffect, useState } from 'react';
import { Plus, Search, Layers, Edit2, Trash2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { Modal } from '../components/Modal';
import { OrderNumberField } from '../components/OrderNumberField';

const getNextSetNo = (existingSets = []) => {
  const values = existingSets
    .map(item => item?.setNo)
    .filter(value => value !== null && value !== undefined && value !== '');

  let maxNumber = 0;

  values.forEach(value => {
    const match = String(value).match(/(\d+)$/);

    if (match) {
      const parsed = Number(match[1]);

      if (!Number.isNaN(parsed) && parsed > maxNumber) {
        maxNumber = parsed;
      }
    }
  });

  return String(maxNumber + 1);
};

export const SizingSetsView = () => {
  const {
    parties,
    fabricOrders,
    tickits,
    yarnCounts,
    sizingUnits,
    addToast
  } = useApp();

  const [sizingSets, setSizingSets] = useState([]);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSet, setEditingSet] = useState(null);

  const [formData, setFormData] = useState({
    setNo: '',
    orderNo: '',
    orderId: '',
    countId: '',
    tickitId: '',
    sizingId: '',
    partyId: '',
    quality: '',
    totalEnds: '',
    sizingMeters: '',
    outDate: new Date().toISOString().split('T')[0],
    bags: '',
    cone: '',
    weightKg: '',
    rate: '',
    billNo: '',
    amount: '',
    totalEnd: '',
    sizingMtr: '',
    sizingReceivedKhart: '',
    sizingFreshYarnReceived: '',
    balanceInSizing: '',
    sizingConsumption: '',
    sizingCount: '',
    status: 'OPEN'
  });

  const fetchSizingSets = async () => {
    try {
      const data = await api.sizingSets.getAll();
      setSizingSets(Array.isArray(data) ? data : []);
    } catch (err) {
      addToast(err.message || 'Failed to fetch sizing sets', 'error');
    }
  };

  useEffect(() => {
    fetchSizingSets();
  }, []);

  const openCreateModal = () => {
    const nextSetNo = getNextSetNo(sizingSets);

    setEditingSet(null);

    setFormData({
      setNo: nextSetNo,
      orderNo: '',
      orderId: '',
      countId: '',
      tickitId: '',
      sizingId: '',
      partyId: '',
      quality: '',
      totalEnds: '',
      sizingMeters: '',
      outDate: new Date().toISOString().split('T')[0],
      bags: '',
      cone: '',
      weightKg: '',
      rate: '',
      billNo: '',
      amount: '',
      totalEnd: '',
      sizingMtr: '',
      sizingReceivedKhart: '',
      sizingFreshYarnReceived: '',
      balanceInSizing: '',
      sizingConsumption: '',
      sizingCount: '',
      status: 'OPEN'
    });

    setIsModalOpen(true);
  };

  const handleSubmit = async event => {
    event.preventDefault();

    try {
      const payload = {
        setNo: formData.setNo,
        orderId: formData.orderId ? Number(formData.orderId) : null,
        countId: formData.countId ? Number(formData.countId) : null,
        tickitId: formData.tickitId ? Number(formData.tickitId) : null,
        sizingId: formData.sizingId ? Number(formData.sizingId) : null,
        partyId: formData.partyId ? Number(formData.partyId) : null,
        quality: formData.quality || null,
        totalEnds: formData.totalEnds ? Number(formData.totalEnds) : null,
        sizingMeters: formData.sizingMeters ? Number(formData.sizingMeters) : null,
        outDate: formData.outDate || null,
        bags: formData.bags ? Number(formData.bags) : null,
        cone: formData.cone ? Number(formData.cone) : null,
        weightKg: formData.weightKg ? Number(formData.weightKg) : null,
        rate: formData.rate ? Number(formData.rate) : null,
        billNo: formData.billNo || null,
        amount: formData.amount ? Number(formData.amount) : null,
        totalEnd: formData.totalEnd ? Number(formData.totalEnd) : null,
        sizingMtr: formData.sizingMtr ? Number(formData.sizingMtr) : null,
        sizingReceivedKhart: formData.sizingReceivedKhart ? Number(formData.sizingReceivedKhart) : null,
        sizingFreshYarnReceived: formData.sizingFreshYarnReceived ? Number(formData.sizingFreshYarnReceived) : null,
        balanceInSizing: formData.balanceInSizing ? Number(formData.balanceInSizing) : null,
        sizingConsumption: formData.sizingConsumption ? Number(formData.sizingConsumption) : null,
        sizingCount: formData.sizingCount ? Number(formData.sizingCount) : null,
        status: formData.status || 'OPEN'
      };

      if (editingSet) {
        await api.sizingSets.update(
          editingSet.sizingSetId,
          payload
        );

        addToast(
          'Sizing set updated successfully',
          'success'
        );
      } else {
        await api.sizingSets.create(payload);

        addToast(
          'Sizing set created successfully',
          'success'
        );
      }

      setIsModalOpen(false);
      setEditingSet(null);

      await fetchSizingSets();

    } catch (err) {
      addToast(
        err.message || 'Error saving sizing set',
        'error'
      );
    }
  };

  const openEditModal = set => {
    setEditingSet(set);

    setFormData({
      setNo: set.setNo || '',
      orderNo: set.order?.orderNo || '',
      orderId: set.order?.orderId || '',
      countId: set.count?.countId || '',
      tickitId: set.tickit?.tickitId || '',
      sizingId: set.sizingUnit?.sizingId || '',
      partyId: set.party?.partyId || '',
      quality: set.quality || '',
      totalEnds: set.totalEnds ?? '',
      sizingMeters: set.sizingMeters ?? '',
      outDate: set.outDate || new Date().toISOString().split('T')[0],
      bags: set.bags ?? '',
      cone: set.cone ?? '',
      weightKg: set.weightKg ?? '',
      rate: set.rate ?? '',
      billNo: set.billNo || '',
      amount: set.amount ?? '',
      totalEnd: set.totalEnd ?? '',
      sizingMtr: set.sizingMtr ?? '',
      sizingReceivedKhart: set.sizingReceivedKhart ?? '',
      sizingFreshYarnReceived: set.sizingFreshYarnReceived ?? '',
      balanceInSizing: set.balanceInSizing ?? '',
      sizingConsumption: set.sizingConsumption ?? '',
      sizingCount: set.sizingCount ?? '',
      status: set.status || 'OPEN'
    });

    setIsModalOpen(true);
  };

  const handleDelete = async set => {
    if (!set) return;

    try {
      await api.sizingSets.delete(set.sizingSetId);

      addToast(
        'Sizing set deleted',
        'success'
      );

      await fetchSizingSets();

    } catch (err) {
      addToast(
        err.message || 'Failed to delete sizing set',
        'error'
      );
    }
  };

  const filteredSets = sizingSets.filter(sizingSet => {
    const searchText = search.toLowerCase();

    return (
      sizingSet.setNo
        ?.toLowerCase()
        .includes(searchText) ||

      sizingSet.order?.orderNo
        ?.toLowerCase()
        .includes(searchText) ||

      sizingSet.party?.partyName
        ?.toLowerCase()
        .includes(searchText)
    );
  });

  const updateField = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleOrderChange = orderNo => {
    const order = fabricOrders.find(
      item =>
        item.orderNo
          ?.trim()
          .toLowerCase() ===
        orderNo.trim().toLowerCase()
    );

    setFormData(prev => ({
      ...prev,

      orderNo,

      orderId: order?.orderId || '',

      countId: order?.count?.countId || '',

      tickitId: order?.tickit?.tickitId || '',

      partyId: order?.party?.partyId || '',

      quality: order?.quality || ''
    }));
  };

  return (
    <div className="content-area">

      {/* =========================
          HEADER
      ========================== */}

      <div className="section-card">

        <div className="section-card-header">

          <div className="section-card-title">

            <Layers
              size={20}
              color="var(--accent-amber)"
            />

            <h3>Sizing Sets</h3>

            <span className="badge badge-info">
              {filteredSets.length} Records
            </span>

          </div>

          <div className="section-card-actions">

            <div className="search-box">

              <Search size={16} />

              <input
                type="text"
                placeholder="Search set, order, party..."
                value={search}
                onChange={event =>
                  setSearch(event.target.value)
                }
              />

            </div>

            <button
              className="btn btn-primary"
              onClick={openCreateModal}
            >

              <Plus size={18} />

              <span>New Sizing Set</span>

            </button>

          </div>

        </div>

        {/* =========================
            TABLE
        ========================== */}

        <div className="table-responsive">

          <table className="data-table">

            <thead>

              <tr>

                <th>ID</th>
                <th>Set No</th>
                <th>Order No</th>
                <th>Party</th>
                <th>Sizing Unit</th>
                <th>Yarn Count</th>
                <th>Quality</th>
                <th>Total Ends</th>
                <th>Sizing Meters</th>
                <th>Out Date</th>
                <th>Bags</th>
                <th>Cone</th>
                <th>Weight Kg</th>
                <th>Rate</th>
                <th>Bill No</th>
                <th>Amount</th>
                <th>Total End</th>
                <th>Sizing Mtr</th>
                <th>Received Khard</th>
                <th>Fresh Yarn</th>
                <th>Balance</th>
                <th>Consumption</th>
                <th>Sizing Count</th>
                <th>Status</th>
                <th>Actions</th>

              </tr>

            </thead>

            <tbody>

              {filteredSets.length === 0 ? (

                <tr>

                  <td
                    colSpan="21"
                    style={{
                      textAlign: 'center',
                      padding: '32px',
                      color: 'var(--text-dim)'
                    }}
                  >
                    No sizing sets found.
                    Create the first one above.
                  </td>

                </tr>

              ) : (

                filteredSets.map(sizingSet => (

                  <tr
                    key={sizingSet.sizingSetId}
                  >

                    <td>
                      #{sizingSet.sizingSetId}
                    </td>

                    <td
                      style={{
                        fontWeight: 600,
                        color: 'var(--accent-amber)'
                      }}
                    >
                      {sizingSet.setNo}
                    </td>

                    <td>
                      {sizingSet.order?.orderNo || '-'}
                    </td>

                    <td>
                      {sizingSet.party?.partyName || '-'}
                    </td>

                    <td>
                      {sizingSet.sizingUnit?.sizingName || '-'}
                    </td>

                    <td>
                      {sizingSet.count?.countName || '-'}
                    </td>

                    <td>
                      {sizingSet.quality || '-'}
                    </td>

                    <td>
                      {sizingSet.totalEnds ?? '-'}
                    </td>

                    <td>
                      {sizingSet.sizingMeters ?? '-'}
                    </td>

                    <td>
                      {sizingSet.outDate || '-'}
                    </td>

                    <td>
                      {sizingSet.bags ?? '-'}
                    </td>

                    <td>
                      {sizingSet.cone ?? '-'}
                    </td>

                    <td>
                      {sizingSet.weightKg ?? '-'}
                    </td>

                    <td>
                      {sizingSet.rate ?? '-'}
                    </td>

                    <td>
                      {sizingSet.billNo || '-'}
                    </td>

                    <td>
                      {sizingSet.amount ?? '-'}
                    </td>

                    <td>
                      {sizingSet.totalEnd ?? '-'}
                    </td>

                    <td>
                      {sizingSet.sizingMtr ?? '-'}
                    </td>

                    <td>
                      {sizingSet.sizingReceivedKhart ?? '-'}
                    </td>

                    <td>
                      {sizingSet.sizingFreshYarnReceived ?? '-'}
                    </td>

                    <td>
                      {sizingSet.balanceInSizing ?? '-'}
                    </td>

                    <td>
                      {sizingSet.sizingConsumption ?? '-'}
                    </td>

                    <td>
                      {sizingSet.sizingCount ?? '-'}
                    </td>

                    <td>
                      {sizingSet.status || 'OPEN'}
                    </td>

                    <td
                      style={{
                        textAlign: 'right'
                      }}
                    >

                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'flex-end',
                          gap: 6
                        }}
                      >

                        <button
                          className="btn-icon"
                          onClick={() =>
                            openEditModal(sizingSet)
                          }
                          title="Edit"
                        >
                          <Edit2 size={15} />
                        </button>

                        <button
                          className="btn-icon"
                          style={{
                            color: 'var(--color-danger)'
                          }}
                          onClick={() =>
                            handleDelete(sizingSet)
                          }
                          title="Delete"
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

      {/* =========================
          CREATE / EDIT MODAL
      ========================== */}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={
          editingSet
            ? `Edit Sizing Set #${editingSet.sizingSetId}`
            : 'New Sizing Set'
        }
        size="lg"
      >

        <form onSubmit={handleSubmit}>

          <div className="form-grid">

            {/* Set No */}

            <div className="form-group">

              <label>Set No *</label>

              <input
                className="form-control"
                value={formData.setNo}
                onChange={event =>
                  updateField(
                    'setNo',
                    event.target.value
                  )
                }
                placeholder="e.g. SET-001"
                required
              />

            </div>

            {/* Order */}

            <OrderNumberField
              orders={fabricOrders}
              value={formData.orderNo}
              onChange={handleOrderChange}
            />

            {/* Party */}

            <div className="form-group">

              <label>Party</label>

              <select
                className="form-control"
                value={formData.partyId}
                onChange={event =>
                  updateField(
                    'partyId',
                    event.target.value
                  )
                }
              >

                <option value="">
                  -- Select Party --
                </option>

                {parties.map(party => (

                  <option
                    key={party.partyId}
                    value={party.partyId}
                  >
                    {party.partyName}
                  </option>

                ))}

              </select>

            </div>

            {/* Sizing Unit */}

            <div className="form-group">

              <label>Sizing Unit</label>

              <select
                className="form-control"
                value={formData.sizingId}
                onChange={event =>
                  updateField(
                    'sizingId',
                    event.target.value
                  )
                }
              >

                <option value="">
                  -- Select Sizing Unit --
                </option>

                {sizingUnits.map(unit => (

                  <option
                    key={unit.sizingId}
                    value={unit.sizingId}
                  >
                    {unit.sizingName}
                  </option>

                ))}

              </select>

            </div>

            {/* Yarn Count */}

            <div className="form-group">

              <label>Yarn Count</label>

              <select
                className="form-control"
                value={formData.countId}
                onChange={event =>
                  updateField(
                    'countId',
                    event.target.value
                  )
                }
              >

                <option value="">
                  -- Select Count --
                </option>

                {yarnCounts.map(count => (

                  <option
                    key={count.countId}
                    value={count.countId}
                  >
                    {count.countName}
                  </option>

                ))}

              </select>

            </div>

            {/* Tickit */}

            <div className="form-group">

              <label>Tickit</label>

              <select
                className="form-control"
                value={formData.tickitId}
                onChange={event =>
                  updateField(
                    'tickitId',
                    event.target.value
                  )
                }
              >

                <option value="">
                  -- Select Tickit --
                </option>

                {tickits.map(tickit => (

                  <option
                    key={tickit.tickitId}
                    value={tickit.tickitId}
                  >
                    {tickit.tickitName}
                  </option>

                ))}

              </select>

            </div>

            {/* Quality */}

            <div className="form-group">

              <label>Quality</label>

              <input
                className="form-control"
                value={formData.quality}
                onChange={event =>
                  updateField(
                    'quality',
                    event.target.value
                  )
                }
              />

            </div>

            {/* Total Ends */}

            <div className="form-group">

              <label>Total Ends</label>

              <input
                type="number"
                className="form-control"
                value={formData.totalEnds}
                onChange={event =>
                  updateField(
                    'totalEnds',
                    event.target.value
                  )
                }
              />

            </div>

            {/* Sizing Meters */}

            <div className="form-group">

              <label>Sizing Meters</label>

              <input
                type="number"
                step="0.001"
                className="form-control"
                value={formData.sizingMeters}
                onChange={event =>
                  updateField(
                    'sizingMeters',
                    event.target.value
                  )
                }
              />

            </div>

            {/* Out Date */}

            <div className="form-group">

              <label>Out Date</label>

              <input
                type="date"
                className="form-control"
                value={formData.outDate}
                onChange={event =>
                  updateField(
                    'outDate',
                    event.target.value
                  )
                }
              />

            </div>

            {/* Bags */}

            <div className="form-group">

              <label>Bags</label>

              <input
                type="number"
                step="0.001"
                className="form-control"
                value={formData.bags}
                onChange={event =>
                  updateField(
                    'bags',
                    event.target.value
                  )
                }
              />

            </div>

            {/* Cone */}

            <div className="form-group">

              <label>Cone</label>

              <input
                type="number"
                step="0.001"
                className="form-control"
                value={formData.cone}
                onChange={event =>
                  updateField(
                    'cone',
                    event.target.value
                  )
                }
              />

            </div>

            {/* Weight Kg */}

            <div className="form-group">

              <label>Weight Kg</label>

              <input
                type="number"
                step="0.001"
                className="form-control"
                value={formData.weightKg}
                onChange={event =>
                  updateField(
                    'weightKg',
                    event.target.value
                  )
                }
              />

            </div>

            {/* Rate */}

            <div className="form-group">

              <label>Rate</label>

              <input
                type="number"
                step="0.01"
                className="form-control"
                value={formData.rate}
                onChange={event =>
                  updateField(
                    'rate',
                    event.target.value
                  )
                }
              />

            </div>

            {/* Bill No */}

            <div className="form-group">

              <label>Bill No</label>

              <input
                className="form-control"
                value={formData.billNo}
                onChange={event =>
                  updateField(
                    'billNo',
                    event.target.value
                  )
                }
              />

            </div>

            {/* Amount */}

            <div className="form-group">

              <label>Amount</label>

              <input
                type="number"
                step="0.01"
                className="form-control"
                value={formData.amount}
                onChange={event =>
                  updateField(
                    'amount',
                    event.target.value
                  )
                }
              />

            </div>

            {/* Total End */}

            <div className="form-group">

              <label>Total End</label>

              <input
                type="number"
                step="0.001"
                className="form-control"
                value={formData.totalEnd}
                onChange={event =>
                  updateField(
                    'totalEnd',
                    event.target.value
                  )
                }
              />

            </div>

            {/* Sizing Mtr */}

            <div className="form-group">

              <label>Sizing Mtr</label>

              <input
                type="number"
                step="0.001"
                className="form-control"
                value={formData.sizingMtr}
                onChange={event =>
                  updateField(
                    'sizingMtr',
                    event.target.value
                  )
                }
              />

            </div>

            {/* Received Khard */}

            <div className="form-group">

              <label>Received Khard</label>

              <input
                type="number"
                step="0.001"
                className="form-control"
                value={formData.sizingReceivedKhart}
                onChange={event =>
                  updateField(
                    'sizingReceivedKhart',
                    event.target.value
                  )
                }
              />

            </div>

            {/* Fresh Yarn Received */}

            <div className="form-group">

              <label>Fresh Yarn Received</label>

              <input
                type="number"
                step="0.001"
                className="form-control"
                value={formData.sizingFreshYarnReceived}
                onChange={event =>
                  updateField(
                    'sizingFreshYarnReceived',
                    event.target.value
                  )
                }
              />

            </div>

            {/* Balance In Sizing */}

            <div className="form-group">

              <label>Balance In Sizing</label>

              <input
                type="number"
                step="0.001"
                className="form-control"
                value={formData.balanceInSizing}
                onChange={event =>
                  updateField(
                    'balanceInSizing',
                    event.target.value
                  )
                }
              />

            </div>

            {/* Sizing Consumption */}

            <div className="form-group">

              <label>Sizing Consumption</label>

              <input
                type="number"
                step="0.001"
                className="form-control"
                value={formData.sizingConsumption}
                onChange={event =>
                  updateField(
                    'sizingConsumption',
                    event.target.value
                  )
                }
              />

            </div>

            {/* Sizing Count */}

            <div className="form-group">

              <label>Sizing Count</label>

              <input
                type="number"
                step="0.001"
                className="form-control"
                value={formData.sizingCount}
                onChange={event =>
                  updateField(
                    'sizingCount',
                    event.target.value
                  )
                }
              />

            </div>

            {/* Status */}

            <div className="form-group">

              <label>Status</label>

              <select
                className="form-control"
                value={formData.status}
                onChange={event =>
                  updateField(
                    'status',
                    event.target.value
                  )
                }
              >

                <option value="OPEN">OPEN</option>
                <option value="CLOSED">CLOSED</option>
                <option value="DELETED">DELETED</option>

              </select>

            </div>

          </div>

          {/* =========================
              FOOTER
          ========================== */}

          <div
            className="modal-footer"
            style={{
              padding: '20px 0 0',
              marginTop: '20px'
            }}
          >

            <button
              type="button"
              className="btn btn-secondary"
              onClick={() =>
                setIsModalOpen(false)
              }
            >
              Cancel
            </button>

            <button
              type="submit"
              className="btn btn-primary"
            >
              {editingSet
                ? 'Update Sizing Set'
                : 'Create Sizing Set'}
            </button>

          </div>

        </form>

      </Modal>

    </div>
  );
};