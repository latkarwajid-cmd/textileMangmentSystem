import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { 
  Users, 
  ShoppingBag,
  Ticket, 
  Layers, 
  Factory, 
  ArrowDownLeft, 
  Layers3,
  TrendingUp,
  PackageCheck
} from 'lucide-react';

const formatDate = (date) => {
  if (!date) return '-';
  if (Array.isArray(date)) {
    const [y, m, d] = date;
    return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  }
  return String(date).substring(0, 10);
};

const inwardSortKey = (item) => {
  const date = formatDate(item.inwardDate);
  const id = Number(item.yarnInwardId) || 0;
  return `${date}-${String(id).padStart(10, '0')}`;
};

export const DashboardView = () => {
  const { parties, fabricOrders, tickits, yarnCounts, sizingUnits, setCurrentTab } = useApp();
  const [inwardCount, setInwardCount] = useState(0);
  const [sizingSetCount, setSizingSetCount] = useState(0);
  const [totalInwardWeight, setTotalInwardWeight] = useState(0);
  const [recentInwards, setRecentInwards] = useState([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [inwardRes, sizingSetsRes] = await Promise.allSettled([
          api.yarnInward.getAll(),
          api.sizingSets.getAll(),
        ]);

        if (inwardRes.status === 'fulfilled' && Array.isArray(inwardRes.value)) {
          const inwards = inwardRes.value;
          setInwardCount(inwards.length);
          setRecentInwards(
            [...inwards]
              .sort((a, b) => inwardSortKey(b).localeCompare(inwardSortKey(a)))
              .slice(0, 5)
          );
          const totalKg = inwards.reduce((acc, curr) => acc + (Number(curr.weightKg) || 0), 0);
          setTotalInwardWeight(totalKg);
        } else if (inwardRes.status === 'rejected') {
          console.error('Error fetching yarn inward for dashboard:', inwardRes.reason);
        }

        if (sizingSetsRes.status === 'fulfilled' && Array.isArray(sizingSetsRes.value)) {
          setSizingSetCount(sizingSetsRes.value.length);
        }
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="content-area">
      <div className="stats-grid">
        <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => setCurrentTab('parties')}>
          <div className="stat-icon" style={{ background: '#37c0fb' }}>
            <Users size={22} />
          </div>
          <div className="stat-info">
            <h3>Total Parties</h3>
            <div className="stat-value">{parties.length}</div>
          </div>
        </div>

        <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => setCurrentTab('fabric-orders')}>
          <div className="stat-icon" style={{ background: '#0284c7' }}>
            <ShoppingBag size={22} />
          </div>
          <div className="stat-info">
            <h3>Fabric Orders</h3>
            <div className="stat-value">{fabricOrders.length}</div>
          </div>
        </div>

        <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => setCurrentTab('tickits')}>
          <div className="stat-icon" style={{ background: '#0ea5e9' }}>
            <Ticket size={22} />
          </div>
          <div className="stat-info">
            <h3>Active Tickits</h3>
            <div className="stat-value">{tickits.length}</div>
          </div>
        </div>

        <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => setCurrentTab('yarn-counts')}>
          <div className="stat-icon" style={{ background: '#10b981' }}>
            <Layers size={22} />
          </div>
          <div className="stat-info">
            <h3>Yarn Counts</h3>
            <div className="stat-value">{yarnCounts.length}</div>
          </div>
        </div>

        <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => setCurrentTab('sizing-units')}>
          <div className="stat-icon" style={{ background: '#f59e0b' }}>
            <Factory size={22} />
          </div>
          <div className="stat-info">
            <h3>Sizing Units</h3>
            <div className="stat-value">{sizingUnits.length}</div>
          </div>
        </div>

        <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => setCurrentTab('yarn-inward')}>
          <div className="stat-icon" style={{ background: '#8b5cf6' }}>
            <ArrowDownLeft size={22} />
          </div>
          <div className="stat-info">
            <h3>Yarn Inward Lots</h3>
            <div className="stat-value">{inwardCount}</div>
          </div>
        </div>

        <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => setCurrentTab('yarn-inward')}>
          <div className="stat-icon" style={{ background: '#37c0fb' }}>
            <PackageCheck size={22} />
          </div>
          <div className="stat-info">
            <h3>Yarn Received</h3>
            <div className="stat-value">{totalInwardWeight.toLocaleString()} <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>kg</span></div>
          </div>
        </div>

        <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => setCurrentTab('sizing-sets')}>
          <div className="stat-icon" style={{ background: '#06b6d4' }}>
            <Layers3 size={22} />
          </div>
          <div className="stat-info">
            <h3>Sizing Sets</h3>
            <div className="stat-value">{sizingSetCount}</div>
          </div>
        </div>
      </div>

      <div className="section-card">
        <div className="section-card-header">
          <div className="section-card-title">
            <TrendingUp size={20} color="var(--primary-blue)" />
            <h3>Recent Yarn Inward Transactions</h3>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => setCurrentTab('yarn-inward')}>
            View All Inwards
          </button>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Inward Date</th>
                <th>Supplier Party</th>
                <th>Count</th>
                <th>Tickit</th>
                <th>Weight (Kg)</th>
                <th>Bill No</th>
                <th>Amount (₹)</th>
                <th>Payment Status</th>
              </tr>
            </thead>
            <tbody>
              {recentInwards.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                    No recent inward records found. Click on 'Yarn Inward' to add one.
                  </td>
                </tr>
              ) : (
                recentInwards.map((item) => (
                  <tr key={item.yarnInwardId}>
                    <td>#{item.yarnInwardId}</td>
                    <td>{formatDate(item.inwardDate)}</td>
                    <td style={{ fontWeight: 600 }}>{item.supplier?.partyName || '-'}</td>
                    <td>{item.count?.countName || '-'}</td>
                    <td>{item.tickit?.tickitName || '-'}</td>
                    <td>{item.weightKg ? `${item.weightKg} kg` : '-'}</td>
                    <td>{item.billNo || '-'}</td>
                    <td style={{ fontWeight: 600, color: 'var(--primary-blue-dark)' }}>
                      ₹{item.actualAmount || item.calculatedAmount || '-'}
                    </td>
                    <td>
                      <span className={`badge ${item.paymentStatus === 'PAID' ? 'badge-success' : 'badge-warning'}`}>
                        {item.paymentStatus || 'UNPAID'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
