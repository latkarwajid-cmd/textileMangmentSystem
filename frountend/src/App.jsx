import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import ErrorBoundary from './components/ErrorBoundary';
import { ToastContainer } from './components/Toast';

import { DashboardView } from './views/DashboardView';
import { PartiesView } from './views/PartiesView';
import { FabricOrdersView } from './views/FabricOrdersView';
import { TickitsView } from './views/TickitsView';
import { YarnCountsView } from './views/YarnCountsView';
import { SizingUnitsView } from './views/SizingUnitsView';
import { YarnInwardView } from './views/YarnInwardView';
import { SizingYarnInwardView } from './views/SizingYarnInwardView';
import { SizingSetsView } from './views/SizingSetsView';
import { YarnOutDyeingView } from './views/YarnOutDyeingView';
import { BeamInwardView } from './views/BeamInwardView';

const MainContent = () => {
  const { currentTab } = useApp();

  const views = [
    ['dashboard', <DashboardView />],
    ['parties', <PartiesView />],
    ['fabric-orders', <FabricOrdersView />],
    ['tickits', <TickitsView />],
    ['yarn-counts', <YarnCountsView />],
    ['sizing-units', <SizingUnitsView />],
    ['sizing-sets', <SizingSetsView />],
    ['beam-inward', <BeamInwardView />],
    ['yarn-inward', <YarnInwardView />],
    ['yarn-out-dyeing', <YarnOutDyeingView />],
    ['sizing-yarn-inward', <SizingYarnInwardView />],
  ];

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-wrapper">
        <Header />
        <ErrorBoundary>
          {views.map(([tab, view]) => (
            <div key={tab} className={`view-panel ${currentTab === tab ? 'view-panel-active' : ''}`} aria-hidden={currentTab !== tab}>
              {view}
            </div>
          ))}
        </ErrorBoundary>
      </div>
      <ToastContainer />
    </div>
  );
};

export function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}

export default App;
