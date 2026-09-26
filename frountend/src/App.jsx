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
import { YarnInwardView } from './views/YarnInwardView';
import { SizingYarnInwardView } from './views/SizingYarnInwardView';
import { SizingSetsView } from './views/SizingSetsView';
import { YarnOutDyeingView } from './views/YarnOutDyeingView';
import { YarnReceiveDyeingView } from './views/YarnReceiveDyeingView';
import { BeamInwardView } from './views/BeamInwardView';
import { RewindingIssueView } from './views/RewindingIssueView';
import { RewindingYarnView } from './views/RewindingYarnView';

const MainContent = () => {
  const { currentTab } = useApp();

  const views = [
    ['dashboard', <DashboardView />],
    ['parties', <PartiesView />],
    ['fabric-orders', <FabricOrdersView />],
    ['tickits', <TickitsView />],
    ['yarn-counts', <YarnCountsView />],
    ['sizing-sets', <SizingSetsView />],
    ['beam-inward', <BeamInwardView />],
    ['yarn-inward', <YarnInwardView />],
    ['yarn-out-dyeing', <YarnOutDyeingView />],
    ['yarn-receive-dyeing', <YarnReceiveDyeingView />],
    ['sizing-yarn-inward', <SizingYarnInwardView />],
    ['rewinding-issue', <RewindingIssueView />],
    ['rewinding-yarn', <RewindingYarnView />],
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
