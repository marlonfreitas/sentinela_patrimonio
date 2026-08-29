import React, { useState } from 'react';
import { DataProvider } from './context/DataContext';
import { SideNavBar } from './components/SideNavBar';
import { TopAppBar } from './components/TopAppBar';
import { Dashboard } from './pages/gestao_interna/Dashboard';
import { Triage } from './pages/gestao_interna/Triage';
import { SuggestionsTriage } from './pages/gestao_interna/SuggestionsTriage';
import { Inventory } from './pages/portal_do_cidadao/Inventory';
import { Occurrences } from './pages/gestao_interna/Occurrences';
import { Map } from './pages/portal_do_cidadao/Map';
import { CitizenChannel } from './pages/portal_do_cidadao/CitizenChannel';
import { Login } from './pages/Login';

const MainAppContent: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('inventory'); // Iniciar na aba de Inventário
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  if (!isLoggedIn) {
    return <Login onLogin={() => setIsLoggedIn(true)} />;
  }

  // Renderização dinâmica da aba ativa
  const renderActivePage = () => {
    switch (activeTab) {
      case 'citizen':
        return <CitizenChannel />;
      case 'dashboard':
        return <Dashboard setActiveTab={setActiveTab} />;
      case 'triage':
        return <Triage />;
      case 'suggestions-triage':
        return <SuggestionsTriage />;
      case 'inventory':
        return <Inventory />;
      case 'occurrences':
        return <Occurrences />;
      case 'map':
        return <Map />;
      default:
        return <CitizenChannel />;
    }
  };

  return (
    <div className="min-h-screen text-on-surface bg-background flex flex-col font-body-md antialiased">
      {/* Barra de Navegação Lateral */}
      <SideNavBar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isOpen={sidebarOpen} 
        setIsOpen={setSidebarOpen} 
        onLogout={() => setIsLoggedIn(false)}
      />

      {/* Container Principal */}
      <div className="flex-1 md:ml-[280px] flex flex-col min-h-screen pt-16 transition-all duration-300">
        
        {/* Barra Superior */}
        <TopAppBar 
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />

        {/* Conteúdo da Página */}
        <main className="flex-1 p-margin-mobile md:p-margin-desktop bg-surface-gray overflow-y-auto">
          <div className="max-w-container-max mx-auto h-full">
            {renderActivePage()}
          </div>
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <DataProvider>
      <MainAppContent />
    </DataProvider>
  );
}

export default App;
