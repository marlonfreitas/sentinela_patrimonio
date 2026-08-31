import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, useMap, LayersControl, WMSTileLayer } from 'react-leaflet';
import L from 'leaflet';
import { useData } from '../../context/DataContext';
import type { Asset } from '../../types';

// Helper to update map view dynamically when asset coordinates change
const ChangeView: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  map.setView(center, zoom);
  return null;
};

// Helper helper function to return 3 mock photos for any asset
const getAssetPhotos = (asset: Asset) => {
  // Jalapão
  if (asset.id.includes('3811')) {
    return [
      "https://lh3.googleusercontent.com/aida-public/AB6AXuB6eCyxfzvrgwFSzqfqvb8toBHuKl-ZmAswBlMwxZNpYQvFx7k-PXjZdq2sXvQvHFS5UE1AkBWo6bCS9BMftSLfjBOty8hi5xNSP9dhob0K5Qga1220PCS5gLiOqE5qTGgRlFHmTSUNtkIHaugchNejmqYEoZOXSu6GffYSBPPgwufR1p2MAv-b8rCgkuIXTdtynxgCCzi3QbehcC9HDgfavhJgz2PAPMmyFmjnHzJp68dXWrbtXVVSNg",
      "https://images.unsplash.com/photo-1596701062351-8c2c14d1fdd0?w=600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&auto=format&fit=crop"
    ];
  }
  // Igreja Natividade
  if (asset.id.includes('4092')) {
    return [
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBbhClcS76QJ7yqBGX5YLdF8l6RHm15Yf4jsI_64AV6-7DupqHYnWx051x_6ImXQJvxlIAVeb05vsWeLYzkP-DiMsDNMpSUFIqJO5plBHQJJzvOjxMawmOKeDSjgDprNTElOi3V3Qk1Mfv6dXC6UouNiCAZnX2_Kwou0TBCcGA9ySx9NYB3c3pKdfcfvItnqJ-TaJKLi206QC1W6Fx4PJsVCe4ibKzDwFo3fA6fiaABtSQe_DE8WbtIBQ",
      "https://images.unsplash.com/photo-1548625361-155deee223d2?w=600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1518005020951-eccb494ad742?w=600&auto=format&fit=crop"
    ];
  }
  // Catedral Porto Nacional
  if (asset.id.includes('5012')) {
    return [
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBbhClcS76QJ7yqBGX5YLdF8l6RHm15Yf4jsI_64AV6-7DupqHYnWx051x_6ImXQJvxlIAVeb05vsWeLYzkP-DiMsDNMpSUFIqJO5plBHQJJzvOjxMawmOKeDSjgDprNTElOi3V3Qk1Mfv6dXC6UouNiCAZnX2_Kwou0TBCcGA9ySx9NYB3c3pKdfcfvItnqJ-TaJKLi206QC1W6Fx4PJsVCe4ibKzDwFo3fA6fiaABtSQe_DE8WbtIBQ",
      "https://images.unsplash.com/photo-1438029071396-1e831a7fa6d8?w=600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1478147427282-58a87a120781?w=600&auto=format&fit=crop"
    ];
  }
  // Monumento Biblia
  if (asset.id.includes('7491')) {
    return [
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBbhClcS76QJ7yqBGX5YLdF8l6RHm15Yf4jsI_64AV6-7DupqHYnWx051x_6ImXQJvxlIAVeb05vsWeLYzkP-DiMsDNMpSUFIqJO5plBHQJJzvOjxMawmOKeDSjgDprNTElOi3V3Qk1Mfv6dXC6UouNiCAZnX2_Kwou0TBCcGA9ySx9NYB3c3pKdfcfvItnqJ-TaJKLi206QC1W6Fx4PJsVCe4ibKzDwFo3fA6fiaABtSQe_DE8WbtIBQ",
      "https://images.unsplash.com/photo-1544816155-12df9643f363?w=600&auto=format&fit=crop"
    ];
  }
  
  // Categorias padrão
  if (asset.category === 'material') {
    return [
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBbhClcS76QJ7yqBGX5YLdF8l6RHm15Yf4jsI_64AV6-7DupqHYnWx051x_6ImXQJvxlIAVeb05vsWeLYzkP-DiMsDNMpSUFIqJO5plBHQJJzvOjxMawmOKeDSjgDprNTElOi3V3Qk1Mfv6dXC6UouNiCAZnX2_Kwou0TBCcGA9ySx9NYB3c3pKdfcfvItnqJ-TaJKLi206QC1W6Fx4PJsVCe4ibKzDwFo3fA6fiaABtSQe_DE8WbtIBQ",
      "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=600&auto=format&fit=crop"
    ];
  } else if (asset.category === 'natural') {
    return [
      "https://lh3.googleusercontent.com/aida-public/AB6AXuB6eCyxfzvrgwFSzqfqvb8toBHuKl-ZmAswBlMwxZNpYQvFx7k-PXjZdq2sXvQvHFS5UE1AkBWo6bCS9BMftSLfjBOty8hi5xNSP9dhob0K5Qga1220PCS5gLiOqE5qTGgRlFHmTSUNtkIHaugchNejmqYEoZOXSu6GffYSBPPgwufR1p2MAv-b8rCgkuIXTdtynxgCCzi3QbehcC9HDgfavhJgz2PAPMmyFmjnHzJp68dXWrbtXVVSNg",
      "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1472214222541-d510753a4707?w=600&auto=format&fit=crop"
    ];
  } else {
    // Arqueológico
    return [
      "https://images.unsplash.com/photo-1503177119275-0aa32b31d468?w=600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1533105079780-92b9be482077?w=600&auto=format&fit=crop"
    ];
  }
};

export const Inventory: React.FC = () => {
  const { assets } = useData();

  // Estatísticas para a visualização pública
  const totalCount = assets.length;
  const materialCount = assets.filter(a => a.category === 'material').length;
  const naturalCount = assets.filter(a => a.category === 'natural').length;
  const arqueologicoCount = assets.filter(a => a.category === 'arqueologico').length;

  const stableCount = assets.filter(a => a.status === 'stable').length;
  const warningCount = assets.filter(a => a.status === 'warning').length;
  const criticalCount = assets.filter(a => a.status === 'critical').length;

  const stablePct = totalCount > 0 ? Math.round((stableCount / totalCount) * 100) : 0;
  const warningPct = totalCount > 0 ? Math.round((warningCount / totalCount) * 100) : 0;
  const criticalPct = totalCount > 0 ? Math.max(0, 100 - stablePct - warningPct) : 0;

  // Estados locais
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('Todos');
  const [filterStatus, setFilterStatus] = useState('Todos');
  const [filterLocation, setFilterLocation] = useState('Todos');
  
  // Estado para visualização de detalhes
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [activeTab, setActiveTab] = useState<'list' | 'detail'>('list');
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);

  const handleSelectAsset = (asset: Asset) => {
    setSelectedAsset(asset);
    setActivePhotoIndex(0);
    setActiveTab('detail');
  };

  // Filtragem dos bens
  const filteredAssets = assets.filter(asset => {
    const matchesSearch = 
      asset.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = filterCategory === 'Todos' || asset.category === filterCategory;
    const matchesStatus = filterStatus === 'Todos' || asset.status === filterStatus;
    
    let matchesLocation = true;
    if (filterLocation !== 'Todos') {
      matchesLocation = asset.location.toLowerCase().includes(filterLocation.toLowerCase());
    }

    return matchesSearch && matchesCategory && matchesStatus && matchesLocation;
  });

  // Imagens mockadas pré-definidas para as categorias
  const getCategoryImage = (category: string) => {
    if (category === 'material') {
      return "https://lh3.googleusercontent.com/aida-public/AB6AXuBbhClcS76QJ7yqBGX5YLdF8l6RHm15Yf4jsI_64AV6-7DupqHYnWx051x_6ImXQJvxlIAVeb05vsWeLYzkP-DiMsDNMpSUFIqJO5plBHQJJzvOjxMawmOKeDSjgDprNTElOi3V3Qk1Mfv6dXC6UouNiCAZnX2_Kwou0TBCcGA9ySx9NYB3c3pKdfcfvItnqJ-TaJKLi206QC1W6Fx4PJsVCe4ibKzDwFo3fA6fiaABtSQe_DE8WbtIBQ";
    } else if (category === 'natural') {
      return "https://lh3.googleusercontent.com/aida-public/AB6AXuB6eCyxfzvrgwFSzqfqvb8toBHuKl-ZmAswBlMwxZNpYQvFx7k-PXjZdq2sXvQvHFS5UE1AkBWo6bCS9BMftSLfjBOty8hi5xNSP9dhob0K5Qga1220PCS5gLiOqE5qTGgRlFHmTSUNtkIHaugchNejmqYEoZOXSu6GffYSBPPgwufR1p2MAv-b8rCgkuIXTdtynxgCCzi3QbehcC9HDgfavhJgz2PAPMmyFmjnHzJp68dXWrbtXVVSNg";
    } else {
      return "https://fonts.gstatic.com/s/i/materialsymbolsoutlined/landscape/v14/24px.svg";
    }
  };

  return (
    <div className="space-y-stack-lg animate-fade-in flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-border-subtle pb-4">
        <h2 className="font-headline-lg text-headline-lg text-on-surface mb-stack-sm">
          Gestão de Bens Patrimoniais
        </h2>
        <p className="font-body-lg text-body-lg text-on-surface-variant">
          Inventário oficial de bens tombados, protegidos e em fase de análise no Estado do Tocantins.
        </p>
      </div>

      {/* Seção de Estatísticas e Métricas (Pública) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in">
        {/* Card Total */}
        <div className="bg-white rounded-xl border border-border-subtle p-4 shadow-sm flex items-center justify-between transition-all hover:shadow-md">
          <div className="space-y-1">
            <span className="text-[10px] font-label-caps text-on-surface-variant uppercase block tracking-wider">Total Monitorado</span>
            <span className="text-2xl font-bold text-primary block leading-tight">{totalCount}</span>
            <span className="text-[10px] text-on-surface-variant block">Patrimônios no sistema</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-heritage-green-deep/10 flex items-center justify-center text-heritage-green-deep shrink-0">
            <span className="material-symbols-outlined text-[20px]">account_balance</span>
          </div>
        </div>

        {/* Card Material */}
        <div className="bg-white rounded-xl border border-border-subtle p-4 shadow-sm flex items-center justify-between transition-all hover:shadow-md">
          <div className="space-y-1">
            <span className="text-[10px] font-label-caps text-on-surface-variant uppercase block tracking-wider">Patrimônio Material</span>
            <span className="text-2xl font-bold text-[#b45309] block leading-tight">{materialCount}</span>
            <span className="text-[10px] text-on-surface-variant block">Edificações históricas</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-[#fef3c7] flex items-center justify-center text-[#b45309] shrink-0">
            <span className="material-symbols-outlined text-[20px]">museum</span>
          </div>
        </div>

        {/* Card Natural */}
        <div className="bg-white rounded-xl border border-border-subtle p-4 shadow-sm flex items-center justify-between transition-all hover:shadow-md">
          <div className="space-y-1">
            <span className="text-[10px] font-label-caps text-on-surface-variant uppercase block tracking-wider">Patrimônio Natural</span>
            <span className="text-2xl font-bold text-[#15803d] block leading-tight">{naturalCount}</span>
            <span className="text-[10px] text-on-surface-variant block">Parques e reservas</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-[#dcfce7] flex items-center justify-center text-[#15803d] shrink-0">
            <span className="material-symbols-outlined text-[20px]">forest</span>
          </div>
        </div>

        {/* Card Arqueológico */}
        <div className="bg-white rounded-xl border border-border-subtle p-4 shadow-sm flex items-center justify-between transition-all hover:shadow-md">
          <div className="space-y-1">
            <span className="text-[10px] font-label-caps text-on-surface-variant uppercase block tracking-wider">Patrimônio Arqueológico</span>
            <span className="text-2xl font-bold text-institutional-blue block leading-tight">{arqueologicoCount}</span>
            <span className="text-[10px] text-on-surface-variant block">Sítios e artes rupestres</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-primary-fixed flex items-center justify-center text-institutional-blue shrink-0">
            <span className="material-symbols-outlined text-[20px]">history_edu</span>
          </div>
        </div>
      </div>

      {/* Gráfico/Barra de Status de Preservação */}
      <div className="bg-white rounded-xl border border-border-subtle p-4 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <h4 className="font-bold text-on-surface text-body-sm flex items-center gap-1.5">
              <span className="material-symbols-outlined text-primary text-[16px]">analytics</span>
              Estado Geral de Conservação dos Bens
            </h4>
            <p className="text-[11px] text-on-surface-variant">Percentual de conservação e integridade dos patrimônios monitorados.</p>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px]">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-status-stable" />
              Estável ({stableCount})
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-status-warning" />
              Em Alerta ({warningCount})
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-status-critical" />
              Crítico ({criticalCount})
            </span>
          </div>
        </div>
        
        {/* Barra de Progresso Segmentada */}
        <div className="h-4 w-full rounded-full overflow-hidden flex bg-surface-gray">
          {stableCount > 0 && (
            <div 
              style={{ width: `${stablePct}%` }}
              className="bg-status-stable h-full flex items-center justify-center text-white text-[9px] font-bold transition-all duration-500"
              title={`Estável: ${stablePct}%`}
            >
              {stablePct > 5 ? `${stablePct}%` : ''}
            </div>
          )}
          {warningCount > 0 && (
            <div 
              style={{ width: `${warningPct}%` }}
              className="bg-status-warning h-full flex items-center justify-center text-white text-[9px] font-bold transition-all duration-500"
              title={`Alerta: ${warningPct}%`}
            >
              {warningPct > 5 ? `${warningPct}%` : ''}
            </div>
          )}
          {criticalCount > 0 && (
            <div 
              style={{ width: `${criticalPct}%` }}
              className="bg-status-critical h-full flex items-center justify-center text-white text-[9px] font-bold transition-all duration-500"
              title={`Crítico: ${criticalPct}%`}
            >
              {criticalPct > 5 ? `${criticalPct}%` : ''}
            </div>
          )}
        </div>
      </div>

      {/* Sistema de Abas Internas */}
      <div className="flex border-b border-border-subtle bg-white rounded-t-xl overflow-hidden shadow-sm">
        <button
          type="button"
          onClick={() => setActiveTab('list')}
          className={`px-6 py-3.5 font-label-bold text-label-bold uppercase transition-colors flex items-center gap-2 border-b-2 ${
            activeTab === 'list'
              ? 'border-heritage-green-deep text-heritage-green-deep font-bold bg-surface-container-low'
              : 'border-transparent text-on-surface-variant hover:text-primary hover:bg-surface-gray/30'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">inventory_2</span>
          Inventário de Bens ({filteredAssets.length})
        </button>
        {selectedAsset && (
          <div className="flex items-center border-b-2 border-transparent">
            <button
              type="button"
              onClick={() => setActiveTab('detail')}
              className={`px-6 py-3.5 font-label-bold text-label-bold uppercase transition-colors flex items-center gap-2 border-b-2 ${
                activeTab === 'detail'
                  ? 'border-heritage-green-deep text-heritage-green-deep font-bold bg-surface-container-low'
                  : 'border-transparent text-on-surface-variant hover:text-primary hover:bg-surface-gray/30'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">info</span>
              Detalhes: {selectedAsset.id}
            </button>
            <button 
              type="button"
              onClick={() => {
                setSelectedAsset(null);
                setActiveTab('list');
              }}
              className="text-on-surface-variant hover:bg-surface-gray p-1 rounded-full mr-2"
              title="Fechar Aba"
            >
              <span className="material-symbols-outlined text-[16px] block">close</span>
            </button>
          </div>
        )}
      </div>

      {/* 1. CONTEÚDO DA ABA: LISTA DE PATRIMÔNIOS */}
      {activeTab === 'list' && (
        <div className="flex-1 w-full bg-white rounded-b-xl border border-t-0 border-border-subtle shadow-sm overflow-hidden flex flex-col">
          {/* Painel de Filtros */}
          <div className="glass-panel border-b border-border-subtle p-stack-md flex flex-wrap gap-gutter items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="block font-label-caps text-label-caps text-on-surface-variant uppercase mb-2 tracking-wider">
                Busca de Patrimônios
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 transform -translate-y-1/2 text-outline text-sm">
                  search
                </span>
                <input 
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-border-subtle rounded text-body-sm text-on-surface focus:border-heritage-green-deep focus:ring-1 focus:ring-heritage-green-deep transition-colors" 
                  placeholder="ID, nome do bem, histórico..." 
                />
              </div>
            </div>

            <div className="w-40">
              <label className="block font-label-caps text-label-caps text-on-surface-variant uppercase mb-2 tracking-wider">
                Categoria
              </label>
              <select 
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-border-subtle rounded text-body-sm text-on-surface focus:border-heritage-green-deep focus:ring-1 focus:ring-heritage-green-deep transition-colors appearance-none cursor-pointer"
              >
                <option value="Todos">Todos</option>
                <option value="material">Material</option>
                <option value="natural">Natural</option>
                <option value="arqueologico">Arqueológico</option>
              </select>
            </div>

            <div className="w-36">
              <label className="block font-label-caps text-label-caps text-on-surface-variant uppercase mb-2 tracking-wider">
                Preservação
              </label>
              <select 
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-border-subtle rounded text-body-sm text-on-surface focus:border-heritage-green-deep focus:ring-1 focus:ring-heritage-green-deep transition-colors appearance-none cursor-pointer"
              >
                <option value="Todos">Todos</option>
                <option value="stable">Estável</option>
                <option value="warning">Em Alerta</option>
                <option value="critical">Crítico</option>
              </select>
            </div>

            <div className="w-36">
              <label className="block font-label-caps text-label-caps text-on-surface-variant uppercase mb-2 tracking-wider">
                Município
              </label>
              <select 
                value={filterLocation}
                onChange={(e) => setFilterLocation(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-border-subtle rounded text-body-sm text-on-surface focus:border-heritage-green-deep focus:ring-1 focus:ring-heritage-green-deep transition-colors appearance-none cursor-pointer"
              >
                <option value="Todos">Todos</option>
                <option value="Natividade">Natividade</option>
                <option value="Palmas">Palmas</option>
                <option value="Mateiros">Mateiros</option>
                <option value="Porto Nacional">Porto Nacional</option>
              </select>
            </div>
          </div>

          {/* Tabela */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead className="bg-surface-gray border-b border-border-subtle sticky top-0 z-10">
                <tr>
                  <th className="py-3 px-4 font-label-bold text-label-bold text-on-surface-variant uppercase tracking-wider w-16">ID</th>
                  <th className="py-3 px-4 font-label-bold text-label-bold text-on-surface-variant uppercase tracking-wider">Ativo Patrimonial</th>
                  <th className="py-3 px-4 font-label-bold text-label-bold text-on-surface-variant uppercase tracking-wider w-36">Categoria</th>
                  <th className="py-3 px-4 font-label-bold text-label-bold text-on-surface-variant uppercase tracking-wider w-40">Localidade</th>
                  <th className="py-3 px-4 font-label-bold text-label-bold text-on-surface-variant uppercase tracking-wider w-36">Status</th>
                  <th className="py-3 px-4 font-label-bold text-label-bold text-on-surface-variant uppercase tracking-wider w-28 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle bg-white text-body-sm">
                {filteredAssets.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-on-surface-variant">
                      Nenhum bem patrimonial encontrado para os filtros selecionados.
                    </td>
                  </tr>
                ) : (
                  filteredAssets.map((asset) => (
                    <tr 
                      key={asset.id} 
                      onClick={() => handleSelectAsset(asset)}
                      className="hover:bg-surface-container-low transition-colors group cursor-pointer"
                    >
                      <td className="py-4 px-4 text-on-surface-variant font-mono text-[13px]">{asset.id}</td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded bg-surface-container-high overflow-hidden border border-border-subtle shrink-0 flex items-center justify-center">
                            {asset.category === 'arqueologico' ? (
                              <span className="material-symbols-outlined text-material-ochre text-[20px]">landscape</span>
                            ) : (
                              <img 
                                alt={asset.name} 
                                className="w-full h-full object-cover"
                                src={getCategoryImage(asset.category)} 
                              />
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-on-surface">{asset.name}</div>
                            <div className="text-on-surface-variant text-[12px] truncate max-w-[280px]">
                              {asset.description}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded border font-label-caps text-[10px] ${
                          asset.category === 'material'
                            ? 'bg-secondary-fixed/50 text-material-terracotta border-secondary-fixed-dim'
                            : asset.category === 'natural'
                            ? 'bg-primary-fixed/50 text-heritage-green-leaf border-primary-fixed-dim'
                            : 'bg-surface-dim text-material-ochre border-outline-variant'
                        }`}>
                          <span className="material-symbols-outlined text-[14px]">
                            {asset.category === 'material' ? 'account_balance' : asset.category === 'natural' ? 'eco' : 'landscape'}
                          </span>
                          {asset.category === 'material' ? 'Material' : asset.category === 'natural' ? 'Natural' : 'Arqueológico'}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-on-surface">{asset.location}</td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-label-bold text-[11px] text-white shadow-sm ${
                          asset.status === 'stable'
                            ? 'bg-status-stable'
                            : asset.status === 'warning'
                            ? 'bg-status-warning'
                            : 'bg-status-critical'
                        }`}>
                          {asset.status === 'stable' ? 'Preservado' : asset.status === 'warning' ? 'Em Alerta' : 'Crítico'}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <button 
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectAsset(asset);
                          }}
                          className="px-3 py-1.5 bg-heritage-green-deep hover:bg-primary text-white font-label-bold text-[11px] rounded uppercase transition-colors inline-flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-[14px]">visibility</span>
                          Visualizar
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          <div className="p-4 border-t border-border-subtle bg-surface-gray flex items-center justify-between text-body-sm text-on-surface-variant mt-auto">
            <div>Mostrando {filteredAssets.length} de {assets.length} registros</div>
            <div className="text-[11px] italic">Fiscalização Integrada Secult/TO</div>
          </div>
        </div>
      )}

      {/* 2. CONTEÚDO DA ABA: DETALHES DO PATRIMÔNIO (TELA CHEIA) */}
      {activeTab === 'detail' && selectedAsset && (
        <div className="w-full bg-white rounded-b-xl border border-t-0 border-border-subtle shadow-sm p-6 space-y-6 animate-fade-in flex flex-col lg:flex-row gap-6">
          {/* Coluna Esquerda: Carrossel, Nome, Categoria, Relevância (7/12) */}
          <div className="flex-1 space-y-6">
            <div className="flex justify-between items-start border-b border-border-subtle pb-4">
              <div>
                <span className="font-mono text-outline-variant text-sm block">{selectedAsset.id}</span>
                <h3 className="font-headline-md text-headline-md font-bold text-on-surface">
                  {selectedAsset.name}
                </h3>
              </div>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-label-bold text-xs text-white shadow-md ${
                selectedAsset.status === 'stable'
                  ? 'bg-status-stable'
                  : selectedAsset.status === 'warning'
                  ? 'bg-status-warning'
                  : 'bg-status-critical'
              }`}>
                Status: {selectedAsset.status === 'stable' ? 'Preservado' : selectedAsset.status === 'warning' ? 'Em Alerta' : 'Crítico'}
              </span>
            </div>

            {/* Carrossel de Fotos Interativo */}
            <div className="space-y-2">
              <span className="font-label-caps text-[10px] text-on-surface-variant uppercase block">Galeria de Evidências e Fotos</span>
              
              <div className="relative w-full h-72 sm:h-96 rounded-xl overflow-hidden border border-border-subtle bg-surface-gray shadow-sm group">
                <img 
                  src={getAssetPhotos(selectedAsset)[activePhotoIndex]} 
                  alt={`Foto ${activePhotoIndex + 1} de ${selectedAsset.name}`}
                  className="w-full h-full object-cover transition-all duration-300"
                />
                
                {getAssetPhotos(selectedAsset).length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() => setActivePhotoIndex(prev => (prev === 0 ? getAssetPhotos(selectedAsset).length - 1 : prev - 1))}
                      className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/85 text-white p-2 rounded-full transition-colors flex items-center justify-center z-20"
                    >
                      <span className="material-symbols-outlined text-[24px]">chevron_left</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActivePhotoIndex(prev => (prev === getAssetPhotos(selectedAsset).length - 1 ? 0 : prev + 1))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/85 text-white p-2 rounded-full transition-colors flex items-center justify-center z-20"
                    >
                      <span className="material-symbols-outlined text-[24px]">chevron_right</span>
                    </button>
                    
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 bg-black/40 px-3 py-1.5 rounded-full z-20">
                      {getAssetPhotos(selectedAsset).map((_, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setActivePhotoIndex(idx)}
                          className={`w-2 h-2 rounded-full transition-all ${
                            idx === activePhotoIndex ? 'bg-white w-4' : 'bg-white/50'
                          }`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Informações detalhadas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <span className="font-label-caps text-[10px] text-on-surface-variant uppercase block">Categoria</span>
                <div>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded border font-label-caps text-xs mt-1 ${
                    selectedAsset.category === 'material'
                      ? 'bg-secondary-fixed/50 text-material-terracotta border-secondary-fixed-dim'
                      : selectedAsset.category === 'natural'
                      ? 'bg-primary-fixed/50 text-heritage-green-leaf border-primary-fixed-dim'
                      : 'bg-surface-dim text-material-ochre border-outline-variant'
                  }`}>
                    <span className="material-symbols-outlined text-[16px]">
                      {selectedAsset.category === 'material' ? 'account_balance' : selectedAsset.category === 'natural' ? 'eco' : 'landscape'}
                    </span>
                    {selectedAsset.category === 'material' ? 'Material' : selectedAsset.category === 'natural' ? 'Natural' : 'Arqueológico'}
                  </span>
                </div>
              </div>
              
              <div>
                <span className="font-label-caps text-[10px] text-on-surface-variant uppercase block">Reconhecimento</span>
                <span className="text-on-surface text-body-sm font-semibold block mt-1 uppercase">
                  {selectedAsset.source === 'iphan' ? 'IPHAN (Nacional)' : 
                   selectedAsset.source === 'state' ? 'SECULT (Estadual/TO)' : 
                   selectedAsset.source === 'municipal' ? 'Municipal' : 'Outra'}
                </span>
              </div>

              {selectedAsset.yearBuilt && (
                <div>
                  <span className="font-label-caps text-[10px] text-on-surface-variant uppercase block">Ano de Construção</span>
                  <span className="text-on-surface text-body-sm font-semibold block mt-1">{selectedAsset.yearBuilt}</span>
                </div>
              )}

              {selectedAsset.lastAudit && (
                <div>
                  <span className="font-label-caps text-[10px] text-on-surface-variant uppercase block">Último Monitoramento</span>
                  <span className="text-on-surface text-body-sm block mt-1">
                    {new Date(selectedAsset.lastAudit).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              )}
            </div>

            {/* Descrição / Histórico */}
            <div className="bg-surface-gray/50 p-4 rounded-xl border border-border-subtle/50">
              <span className="font-label-caps text-[10px] text-on-surface-variant uppercase block mb-1">Relevância Cultural e Histórica</span>
              <p className="text-on-surface text-body-sm leading-relaxed text-justify">{selectedAsset.description}</p>
            </div>
          </div>

          {/* Coluna Direita: Mapa e Dados Espaciais (5/12) */}
          <div className="w-full lg:w-[420px] xl:w-[480px] space-y-6 shrink-0 border-l border-border-subtle/50 pl-0 lg:pl-6">
            {/* Mapa de Localização */}
            <div className="space-y-2">
              <span className="font-label-caps text-[10px] text-on-surface-variant uppercase block">Localização Espacial (Mapa)</span>
              <div className="w-full h-72 rounded-xl border border-border-subtle overflow-hidden relative shadow-sm z-10">
                <MapContainer 
                  center={selectedAsset.coordinates} 
                  zoom={14} 
                  className="w-full h-full"
                  scrollWheelZoom={false}
                >
                  <LayersControl position="topright">
                    <LayersControl.BaseLayer name="Mapa de Ruas (OSM)">
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                    </LayersControl.BaseLayer>
                    <LayersControl.BaseLayer checked name="Satélite (ESRI)">
                      <TileLayer
                        attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
                        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                      />
                    </LayersControl.BaseLayer>

                    <LayersControl.Overlay checked name="Limites Municipais (SEPLAN/TO)">
                      <WMSTileLayer
                        url="https://geoportal.to.gov.br/geoserver/base_tematica_tocantins/wms"
                        layers="LimiteMunicipal_AGM_TO_2022_L"
                        format="image/png"
                        transparent={true}
                        version="1.1.1"
                        attribution="&copy; SEPLAN/TO"
                      />
                    </LayersControl.Overlay>

                    <LayersControl.Overlay name="Limite Estadual (SEPLAN/TO)">
                      <WMSTileLayer
                        url="https://geoportal.to.gov.br/geoserver/base_tematica_tocantins/wms"
                        layers="LimiteEstadual_AGM_TO_2022_A"
                        format="image/png"
                        transparent={true}
                        version="1.1.1"
                        attribution="&copy; SEPLAN/TO"
                      />
                    </LayersControl.Overlay>
                  </LayersControl>
                  <Marker 
                    position={selectedAsset.coordinates}
                    icon={L.divIcon({
                      html: `
                        <div class="flex items-center justify-center w-8 h-8 rounded-full border-2 border-white shadow-lg bg-heritage-green-deep">
                          <span class="material-symbols-outlined text-[16px] text-white font-bold">account_balance</span>
                        </div>
                      `,
                      className: 'custom-asset-marker',
                      iconSize: [32, 32],
                      iconAnchor: [16, 32]
                    })}
                  />
                  <ChangeView center={selectedAsset.coordinates} zoom={14} />
                </MapContainer>
              </div>
            </div>

            {/* Detalhes de Localização */}
            <div className="space-y-3 bg-surface-gray p-4 rounded-xl border border-border-subtle/50 text-body-sm">
              <div>
                <span className="font-label-caps text-[10px] text-on-surface-variant uppercase block">Localidade</span>
                <span className="font-semibold text-on-surface">{selectedAsset.location}</span>
              </div>
              <div className="border-t border-border-subtle/50 pt-2 font-mono text-xs">
                <span className="font-label-caps text-[10px] text-on-surface-variant uppercase block mb-1">Coordenadas de GPS</span>
                <div className="flex items-center gap-1.5 text-institutional-blue font-semibold">
                  <span className="material-symbols-outlined text-[14px]">gps_fixed</span>
                  <span>Lat: {selectedAsset.coordinates[0].toFixed(6)}</span>
                </div>
                <div className="flex items-center gap-1.5 text-institutional-blue font-semibold mt-0.5">
                  <span className="material-symbols-outlined text-[14px]">gps_fixed</span>
                  <span>Lng: {selectedAsset.coordinates[1].toFixed(6)}</span>
                </div>
              </div>
            </div>

            {/* Fechar detalhe */}
            <div className="pt-4 border-t border-border-subtle">
              <button
                type="button"
                onClick={() => {
                  setSelectedAsset(null);
                  setActiveTab('list');
                }}
                className="w-full py-2.5 bg-heritage-green-deep hover:bg-primary text-white rounded font-label-bold text-label-bold uppercase transition-colors text-center"
              >
                Voltar para o Inventário
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
