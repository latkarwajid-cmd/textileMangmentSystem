import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
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

  const renderActiveView = () => {
    switch (currentTab) {
      case 'dashboard': return <DashboardView />;
      case 'parties': return <PartiesView />;
      case 'fabric-orders': return <FabricOrdersView />;
      case 'tickits': return <TickitsView />;
      case 'yarn-counts': return <YarnCountsView />;
      case 'sizing-units': return <SizingUnitsView />;
      case 'sizing-sets': return <SizingSetsView />;
      case 'beam-inward': return <BeamInwardView />;
      case 'yarn-inward': return <YarnInwardView />;
      case 'yarn-out-dyeing': return <YarnOutDyeingView />;
      case 'sizing-yarn-inward': return <SizingYarnInwardView />;
      default: return <DashboardView />;
    }
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-wrapper">
        <Header />
        {renderActiveView()}
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
