import React from 'react';
import { useData } from '../context/DataContext';
import logoSentinela from '../assets/logo_sentinela_Tocantins_fundo.png';

interface TopAppBarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export const TopAppBar: React.FC<TopAppBarProps> = ({
  sidebarOpen,
  setSidebarOpen,
  searchQuery,
  setSearchQuery
}) => {
  const { triageItems } = useData();
  const pendingTriageCount = triageItems.filter(item => item.status === 'pending').length;

  return (
    <header className="bg-surface border-b border-border-subtle fixed top-0 right-0 w-full md:w-[calc(100%-280px)] h-16 flex justify-between items-center px-gutter z-30 transition-all duration-300">
      {/* Lado Esquerdo: Hamburguer no Mobile e Nome do Sistema */}
      <div className="flex items-center gap-3">
        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="md:hidden text-primary p-2 rounded hover:bg-surface-container-low transition-all"
          title="Abrir Menu"
        >
          <span className="material-symbols-outlined text-[24px]">menu</span>
        </button>
        <img src={logoSentinela} alt="Sentinela do Patrimônio" className="h-11 w-auto object-contain hidden md:block hover:scale-105 transition-transform duration-200" />
        <h2 className="font-headline-md text-headline-md font-bold text-primary truncate max-w-[200px] sm:max-w-none">
          Sentinela do Patrimônio
        </h2>
      </div>

      {/* Lado Direito: Busca rápida, Notificações e Perfil */}
      <div className="flex items-center gap-base">
        {/* Barra de Busca rápida */}
        <div className="relative hidden sm:block w-48 lg:w-64">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">
            search
          </span>
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-surface-gray border border-border-subtle rounded text-body-sm text-on-surface focus:outline-none focus:border-institutional-blue focus:ring-1 focus:ring-institutional-blue transition-all placeholder:text-on-surface-variant/70" 
            placeholder="Buscar..." 
          />
        </div>

        {/* Botão Notificações */}
        <button 
          onClick={() => alert(`Você tem ${pendingTriageCount} novas denúncias pendentes para triagem.`)}
          className="p-2 text-on-surface-variant hover:bg-surface-container-low rounded transition-all relative"
          title="Notificações"
        >
          <span className="material-symbols-outlined text-[24px]">notifications</span>
          {pendingTriageCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-status-critical rounded-full border border-white"></span>
          )}
        </button>

        {/* Botão Configurações */}
        <button 
          onClick={() => alert('Opções de configuração administrativa.')}
          className="p-2 text-on-surface-variant hover:bg-surface-container-low rounded transition-all"
          title="Configurações"
        >
          <span className="material-symbols-outlined text-[24px]">settings</span>
        </button>

        <div className="h-8 w-px bg-border-subtle mx-2 hidden sm:block"></div>

        {/* Profile Avatar */}
        <button 
          onClick={() => alert('Visualização do perfil do usuário: Dr. Marlo Silva')}
          className="flex items-center gap-2 pl-2 pr-1 py-1 hover:bg-surface-container-low rounded transition-all"
        >
          <span className="font-label-bold text-label-bold text-primary uppercase hidden lg:block">Perfil</span>
          <div className="w-8 h-8 rounded-full overflow-hidden border border-border-subtle shrink-0">
            <img 
              alt="User Profile" 
              className="w-full h-full object-cover"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAwgHpQEkKoyv_xa6GUupkLHp4L6jbzICsYOfCTOmP6Qs6OB63P1T0ETg89l29PX8R9vF-IBd_wny5Xf_FARG-B77KTS7LXwHLKh5GUs50XNCuiEO4MIjY3WS5VirGJzTuHprojybAE12QKCfTYwzIXPXD8BLbvTTYqIri6wAZIHQwPw63sleM07cDadg-sbuPQwGGJJ5Qh1_fpJvvzlD1Dh6ZLGaQH8rOyg_4g1bbDqjOCMHbMQtrGbA"
            />
          </div>
        </button>
      </div>
    </header>
  );
};
