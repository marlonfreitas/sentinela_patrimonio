import React from 'react';
import { useData } from '../context/DataContext';

import logoCaoma from '../assets/logo_caoma_MPE.png';

interface SideNavBarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onLogout?: () => void;
}

export const SideNavBar: React.FC<SideNavBarProps> = ({ activeTab, setActiveTab, isOpen, setIsOpen, onLogout }) => {
  const { triageItems } = useData();

  // Contar denúncias pendentes de triagem
  const pendingTriageCount = triageItems.filter(item => item.status === 'pending').length;

  const citizenItems = [
    { id: 'inventory', label: 'Inventário', icon: 'inventory_2' },
    { id: 'map', label: 'Mapas', icon: 'map' },
    { id: 'citizen', label: 'Canal do Cidadão', icon: 'campaign' },
  ];

  const internalItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
    { id: 'triage', label: 'Triagem', icon: 'fact_check', badge: pendingTriageCount },
    { id: 'occurrences', label: 'Ocorrências', icon: 'warning' },
  ];

  return (
    <>
      {/* Backdrop para mobile */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40 transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed left-0 top-0 h-screen w-[280px] bg-white border-r border-border-subtle flex flex-col py-gutter px-base z-50 transition-transform duration-300 ease-in-out md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-4 mb-8">
          <div className="w-12 h-12 rounded overflow-hidden flex items-center justify-center shrink-0">
            <img src={logoCaoma} alt="Logo CAOMA" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="font-display-lg text-sm font-bold text-primary leading-tight">Sentinela do Patrimônio</h1>
            <p className="font-label-caps text-[9px] text-on-surface-variant tracking-widest uppercase mt-0.5">
              CAOMA / MPTO
            </p>
          </div>
        </div>

        {/* Main Navigation Links */}
        <nav className="flex-1 overflow-y-auto space-y-6 pr-1 custom-scrollbar">
          {/* Grupo 1: Portal do Cidadão */}
          <div className="space-y-2">
            <h3 className="px-4 font-label-caps text-[10px] text-heritage-green-deep font-bold uppercase tracking-wider mb-2">
              Portal do Cidadão
            </h3>
            <ul className="space-y-1.5">
              {citizenItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => {
                        setActiveTab(item.id);
                        setIsOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg font-label-bold text-label-bold uppercase transition-all duration-200 ${isActive
                          ? 'bg-primary-fixed text-primary font-bold shadow-sm'
                          : 'text-on-surface-variant hover:bg-surface-container-low hover:text-primary'
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`material-symbols-outlined text-[20px] ${isActive ? 'text-primary' : 'text-on-surface-variant'}`}>
                          {item.icon}
                        </span>
                        <span>{item.label}</span>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="h-px bg-border-subtle/60 mx-4" />

          {/* Grupo 2: Gestão Interna (MPTO) */}
          <div className="space-y-2">
            <h3 className="px-4 font-label-caps text-[10px] text-institutional-blue font-bold uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Gestão Interna (MPTO)</span>
              <span className="material-symbols-outlined text-[14px] text-outline">lock</span>
            </h3>
            <ul className="space-y-1.5">
              {internalItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => {
                        setActiveTab(item.id);
                        setIsOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg font-label-bold text-label-bold uppercase transition-all duration-200 ${isActive
                          ? 'bg-primary-fixed text-primary font-bold shadow-sm'
                          : 'text-on-surface-variant hover:bg-surface-container-low hover:text-primary'
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`material-symbols-outlined text-[20px] ${isActive ? 'text-primary' : 'text-on-surface-variant'}`}>
                          {item.icon}
                        </span>
                        <span>{item.label}</span>
                      </div>
                      {item.badge !== undefined && item.badge > 0 && (
                        <span className="bg-status-critical text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>

        {/* Footer Navigation Links */}
        <div className="mt-auto border-t border-border-subtle pt-4 space-y-4">
          <button
            onClick={() => alert('Suporte técnico: suporte@sentinelapatrimonio.to.gov.br')}
            className="w-full flex items-center gap-3 px-4 py-2 text-on-surface-variant hover:bg-surface-container-low hover:text-primary rounded-lg font-label-bold text-label-bold uppercase transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">help_outline</span>
            <span>Suporte</span>
          </button>

          <button
            onClick={() => {
              if (onLogout) {
                onLogout();
              } else {
                alert('Sessão encerrada.');
              }
            }}
            className="w-full flex items-center gap-3 px-4 py-2 text-status-critical hover:bg-status-critical/10 rounded-lg font-label-bold text-label-bold uppercase transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
            <span>Sair</span>
          </button>

          {/* User Info */}
          <div className="flex items-center gap-3 px-4 pt-2 border-t border-border-subtle/50">
            <img
              alt="User Avatar"
              className="w-9 h-9 rounded-full object-cover border border-border-subtle"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAwgHpQEkKoyv_xa6GUupkLHp4L6jbzICsYOfCTOmP6Qs6OB63P1T0ETg89l29PX8R9vF-IBd_wny5Xf_FARG-B77KTS7LXwHLKh5GUs50XNCuiEO4MIjY3WS5VirGJzTuHprojybAE12QKCfTYwzIXPXD8BLbvTTYqIri6wAZIHQwPw63sleM07cDadg-sbuPQwGGJJ5Qh1_fpJvvzlD1Dh6ZLGaQH8rOyg_4g1bbDqjOCMHbMQtrGbA"
            />
            <div className="truncate">
              <div className="font-bold text-on-surface text-body-sm truncate">Dr. Eduardo Silva</div>
              <div className="text-on-surface-variant text-[11px] truncate">Administrador</div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
