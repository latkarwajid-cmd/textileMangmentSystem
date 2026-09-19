import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Settings, RefreshCw } from 'lucide-react';
import { Modal } from './Modal';

export const Header = () => {
  const { currentTab, apiUrl, updateApiUrl, refreshMasters, loadingMasters } = useApp();
  const [showSettings, setShowSettings] = useState(false);
  const [tempUrl, setTempUrl] = useState(apiUrl);

  const getTabTitle = (tab) => {
    switch (tab) {
      case 'dashboard': return 'Dashboard Overview';
      case 'parties': return 'Parties Master';
      case 'fabric-orders': return 'Fabric Orders Master';
      case 'tickits': return 'Tickits Master';
      case 'yarn-counts': return 'Yarn Counts Master';
      case 'sizing-units': return 'Sizing Units Master';
      case 'yarn-inward': return 'Yarn Inward Inventory';
      case 'yarn-out-sizing': return 'Yarn Out for Sizing';
      case 'sizing-yarn-inward': return 'Sizing Yarn Inward';
      default: return 'Textile Management System';
    }
  };

  const handleSaveSettings = (e) => {
    e.preventDefault();
    updateApiUrl(tempUrl);
    setShowSettings(false);
  };

  return (
    <>
      <header className="top-header">
        <div className="header-title">
          <h1>{getTabTitle(currentTab)}</h1>
        </div>

        <div className="header-actions">
          <button 
            className="btn-icon" 
            onClick={refreshMasters} 
            title="Refresh Masters Data"
            disabled={loadingMasters}
          >
            <RefreshCw size={16} className={loadingMasters ? 'animate-spin' : ''} />
          </button>

          <button 
            className="btn-icon" 
            onClick={() => { setTempUrl(apiUrl); setShowSettings(true); }}
            title="Backend Settings"
          >
            <Settings size={16} />
          </button>
        </div>
      </header>

      <Modal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        title="Backend API Configuration"
      >
        <form onSubmit={handleSaveSettings}>
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label>Spring Boot API Base URL</label>
            <input
              type="text"
              className="form-control"
              value={tempUrl}
              onChange={(e) => setTempUrl(e.target.value)}
              placeholder="http://localhost:8080"
              required
            />
            <small style={{ color: 'var(--text-muted)', marginTop: '4px', fontSize: '0.75rem' }}>
              Ensure your backend Spring Boot service is accessible at this address.
            </small>
          </div>

          <div className="modal-footer" style={{ padding: '0', border: 'none', background: 'transparent' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setShowSettings(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save & Connect
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
};
