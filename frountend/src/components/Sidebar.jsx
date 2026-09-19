import React from 'react';
import { useApp } from '../context/AppContext';
import logoImg from '../assets/logo.webp';
import { 
  LayoutDashboard, 
  Users, 
  ShoppingBag,
  Ticket, 
  Layers, 
  Factory, 
  ArrowDownLeft, 
  ArrowUpRight, 
  RotateCcw
  ,Layers3
  ,Droplets
} from 'lucide-react';

export const Sidebar = () => {
  const { currentTab, setCurrentTab } = useApp();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, section: 'Overview' },
    { id: 'parties', label: 'Parties Master', icon: Users, section: 'Masters' },
    { id: 'fabric-orders', label: 'Fabric Orders', icon: ShoppingBag, section: 'Masters' },
    { id: 'tickits', label: 'Tickits Master', icon: Ticket, section: 'Masters' },
    { id: 'yarn-counts', label: 'Yarn Counts', icon: Layers, section: 'Masters' },
    { id: 'sizing-units', label: 'Sizing Units', icon: Factory, section: 'Masters' },
    { id: 'sizing-sets', label: 'Sizing Sets', icon: Layers3, section: 'Masters' },
    { id: 'yarn-inward', label: 'Yarn Inward', icon: ArrowDownLeft, section: 'Transactions' },
    { id: 'beam-inward', label: 'Beam Inward', icon: ArrowDownLeft, section: 'Transactions' },
    { id: 'yarn-out-sizing', label: 'Yarn Out Sizing', icon: ArrowUpRight, section: 'Transactions' },
    { id: 'yarn-out-dyeing', label: 'Yarn Out Dyeing', icon: Droplets, section: 'Transactions' },
    { id: 'sizing-yarn-inward', label: 'Sizing Yarn Inward', icon: RotateCcw, section: 'Transactions' },
  ];

  const sections = ['Overview', 'Masters', 'Transactions'];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <img src={logoImg} alt="Textile Logo" className="sidebar-logo" />
        <div className="sidebar-title">
          <h2>Textile ERP</h2>
          <span>Management</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {sections.map(section => (
          <React.Fragment key={section}>
            <div className="nav-section-label">{section}</div>
            {navItems
              .filter(item => item.section === section)
              .map(item => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    className={`nav-item ${isActive ? 'active' : ''}`}
                    onClick={() => setCurrentTab(item.id)}
                  >
                    <Icon size={17} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
          </React.Fragment>
        ))}
      </nav>

      <div className="sidebar-footer">
        <span>Spring Boot API</span>
        <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>Connected</span>
      </div>
    </aside>
  );
};
