import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useData } from '../../context/DataContext';
import type { TriageItem } from '../../types';

// Helper to update map view dynamically when report coordinates change
const ChangeView: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  map.setView(center, zoom);
  return null;
};

export const Triage: React.FC = () => {
  const { triageItems, assets, approveTriageItem, archiveTriageItem } = useData();

  // Estados locais
  const [selectedItem, setSelectedItem] = useState<TriageItem | null>(null);
  const [activeTab, setActiveTab] = useState<'list' | 'analyze'>('list');
  const [filterUrgency, setFilterUrgency] = useState<string>('Todos');
  const [filterIa, setFilterIa] = useState<string>('Todos');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Estados para aprovação
  const [associationType, setAssociationType] = useState<'new' | 'existing'>('new');
  const [selectedAssetId, setSelectedAssetId] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<'material' | 'natural' | 'arqueologico'>('material');

  // Funções auxiliares para contagem de dias
  const getDaysDiff = (dateStr: string) => {
    const itemDate = new Date(dateStr);
    const currentDate = new Date();
    const diffTime = currentDate.getTime() - itemDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays < 0 ? 0 : diffDays;
  };

  const getDaysAgoText = (diffDays: number) => {
    if (diffDays <= 0) return 'hoje';
    if (diffDays === 1) return 'há 1 dia';
    return `há ${diffDays} dias`;
  };

  // Filtragem e ordenação dos itens pendentes (mais antigos primeiro)
  const pendingItems = triageItems
    .filter(item => {
      if (item.status !== 'pending') return false;
      
      // Busca por termo
      const matchesSearch = 
        item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.assetName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase());

      // Filtro urgência
      const matchesUrgency = filterUrgency === 'Todos' || 
        (filterUrgency === 'Alta' && item.urgency === 'high') ||
        (filterUrgency === 'Média' && item.urgency === 'medium') ||
        (filterUrgency === 'Baixa' && item.urgency === 'low');

      // Filtro sugestão da IA
      const matchesIa = filterIa === 'Todos' || item.iaSuggestion === filterIa;

      return matchesSearch && matchesUrgency && matchesIa;
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const handleSelectAnalyze = (item: TriageItem) => {
    setSelectedItem(item);
    setAssociationType('new');
    setSelectedAssetId('');
    setSelectedCategory('material');
    setActiveTab('analyze');
  };

  const handleApprove = () => {
    if (!selectedItem) return;
    
    const assetIdParam = associationType === 'existing' ? selectedAssetId : undefined;
    approveTriageItem(selectedItem.id, selectedCategory, assetIdParam);
    
    alert(`Denúncia ${selectedItem.id} aprovada com sucesso! Uma ocorrência de ${selectedItem.iaSuggestion} foi registrada.`);
    setSelectedItem(null);
    setActiveTab('list');
  };

  const handleArchive = () => {
    if (!selectedItem) return;
    if (window.confirm(`Tem certeza de que deseja arquivar a denúncia ${selectedItem.id}?`)) {
      archiveTriageItem(selectedItem.id);
      setSelectedItem(null);
      setActiveTab('list');
    }
  };

  return (
    <div className="space-y-stack-lg animate-fade-in flex flex-col h-full">
      {/* Header */}
      <div>
        <h2 className="font-headline-lg text-headline-lg text-on-surface mb-stack-sm">
          Fila de Triagem de Denúncias
        </h2>
        <p className="font-body-lg text-body-lg text-on-surface-variant">
          Analise relatos de cidadãos e sensores, cruze dados com a IA e determine o encaminhamento para fiscalização.
        </p>
      </div>

      {/* Sistema de Abas Internas (Dentro do Sistema) */}
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
          <span className="material-symbols-outlined text-[20px]">inbox</span>
          Fila de Triagem ({pendingItems.length})
        </button>
        {selectedItem && (
          <div className="flex items-center border-b-2 border-transparent">
            <button
              type="button"
              onClick={() => setActiveTab('analyze')}
              className={`px-6 py-3.5 font-label-bold text-label-bold uppercase transition-colors flex items-center gap-2 border-b-2 ${
                activeTab === 'analyze'
                  ? 'border-heritage-green-deep text-heritage-green-deep font-bold bg-surface-container-low'
                  : 'border-transparent text-on-surface-variant hover:text-primary hover:bg-surface-gray/30'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">analytics</span>
              Análise: {selectedItem.id}
            </button>
            <button 
              type="button"
              onClick={() => {
                setSelectedItem(null);
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

      {/* 1. CONTEÚDO DA ABA: LISTA DE TRIAGEM */}
      {activeTab === 'list' && (
        <div className="flex-1 w-full bg-white rounded-b-xl border border-t-0 border-border-subtle shadow-sm overflow-hidden flex flex-col">
          {/* Barra de Filtros */}
          <div className="glass-panel border-b border-border-subtle p-stack-md flex flex-wrap gap-gutter items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="block font-label-caps text-label-caps text-on-surface-variant uppercase mb-2 tracking-wider">
                Busca Específica
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
                  placeholder="ID, Local, Ativo..." 
                />
              </div>
            </div>

            <div className="w-36">
              <label className="block font-label-caps text-label-caps text-on-surface-variant uppercase mb-2 tracking-wider">
                Urgência
              </label>
              <select 
                value={filterUrgency}
                onChange={(e) => setFilterUrgency(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-border-subtle rounded text-body-sm text-on-surface focus:border-heritage-green-deep focus:ring-1 focus:ring-heritage-green-deep transition-colors appearance-none cursor-pointer"
              >
                <option value="Todos">Todos</option>
                <option value="Alta">Alta</option>
                <option value="Média">Média</option>
                <option value="Baixa">Baixa</option>
              </select>
            </div>

            <div className="w-44">
              <label className="block font-label-caps text-label-caps text-on-surface-variant uppercase mb-2 tracking-wider flex items-center gap-1">
                Sugestão IA <span className="material-symbols-outlined text-[14px] text-institutional-blue">smart_toy</span>
              </label>
              <select 
                value={filterIa}
                onChange={(e) => setFilterIa(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-border-subtle rounded text-body-sm text-on-surface focus:border-heritage-green-deep focus:ring-1 focus:ring-heritage-green-deep transition-colors appearance-none cursor-pointer"
              >
                <option value="Todos">Todos</option>
                <option value="Vandalismo">Vandalismo</option>
                <option value="Degradação">Degradação</option>
                <option value="Risco Estrutural">Risco Estrutural</option>
              </select>
            </div>

            <button 
              type="button"
              onClick={() => { setSearchTerm(''); setFilterUrgency('Todos'); setFilterIa('Todos'); }}
              className="px-6 py-2 bg-surface border border-border-subtle text-on-surface font-label-bold text-label-bold rounded hover:bg-surface-container-low transition-colors h-[38px] flex items-center justify-center"
            >
              Limpar
            </button>
          </div>

          {/* Tabela de Itens */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-surface-container-low border-b border-border-subtle sticky top-0">
                <tr>
                  <th className="py-4 px-6 font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider w-24">ID</th>
                  <th className="py-4 px-6 font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">Ativo/Local</th>
                  <th className="py-4 px-6 font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider w-36">Data Envio</th>
                  <th className="py-4 px-6 font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider w-40">Sugestão IA</th>
                  <th className="py-4 px-6 font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider w-36">Sigilo/Origem</th>
                  <th className="py-4 px-6 font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider w-24">Urgência</th>
                  <th className="py-4 px-6 font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider w-24 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle text-body-sm text-on-surface">
                {pendingItems.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-on-surface-variant">
                      Nenhuma denúncia pendente para os filtros selecionados.
                    </td>
                  </tr>
                ) : (
                  pendingItems.map((item, idx) => (
                    <tr 
                      key={item.id} 
                      className={`hover:bg-surface-gray transition-colors cursor-pointer ${
                        selectedItem?.id === item.id ? 'bg-surface-container' : (idx % 2 === 0 ? '' : 'bg-surface-gray/30')
                      }`}
                      onClick={() => handleSelectAnalyze(item)}
                    >
                      <td className="py-4 px-6 font-mono text-outline-variant">{item.id}</td>
                      <td className="py-4 px-6 font-label-bold text-label-bold text-on-surface">
                        <div>{item.assetName}</div>
                        <div className="font-normal text-on-surface-variant text-[11px] mt-0.5">{item.location}</div>
                      </td>
                      <td className="py-4 px-6 text-on-surface-variant">
                        <div className="font-medium text-on-surface">
                          {new Date(item.date).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                        </div>
                        <div className="mt-1.5 flex items-center">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-label-bold text-[10px] ${
                            getDaysDiff(item.date) >= 5 
                              ? 'bg-status-critical/10 text-status-critical border border-status-critical/20' 
                              : getDaysDiff(item.date) >= 3 
                              ? 'bg-status-warning/10 text-status-warning border border-status-warning/20' 
                              : 'bg-status-stable/10 text-status-stable border border-status-stable/20'
                          }`}>
                            <span className="material-symbols-outlined text-[12px] block">schedule</span>
                            {getDaysAgoText(getDaysDiff(item.date))}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container text-institutional-blue font-label-bold text-[11px] border border-surface-variant">
                          <span className="material-symbols-outlined text-[14px]">smart_toy</span>
                          {item.iaSuggestion}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        {item.anonymity === 'anonymous' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-gray-155 text-on-surface-variant border border-border-subtle text-[11px] font-label-bold">
                            <span className="material-symbols-outlined text-[13px] text-gray-500">visibility_off</span>
                            Anônima
                          </span>
                        )}
                        {item.anonymity === 'confidential' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-label-bold">
                            <span className="material-symbols-outlined text-[13px]">shield_lock</span>
                            Sigilosa
                          </span>
                        )}
                        {item.anonymity === 'identified' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200 text-[11px] font-label-bold">
                            <span className="material-symbols-outlined text-[13px]">person</span>
                            Identificada
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-label-bold text-[11px] ${
                          item.urgency === 'high' 
                            ? 'bg-status-critical/10 text-status-critical' 
                            : item.urgency === 'medium'
                            ? 'bg-status-warning/10 text-status-warning'
                            : 'bg-status-stable/10 text-status-stable'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            item.urgency === 'high' ? 'bg-status-critical' : item.urgency === 'medium' ? 'bg-status-warning' : 'bg-status-stable'
                          }`} />
                          {item.urgency === 'high' ? 'Alta' : item.urgency === 'medium' ? 'Média' : 'Baixa'}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button 
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectAnalyze(item);
                          }}
                          className="px-4 py-1.5 bg-heritage-green-deep text-white font-label-bold text-label-bold rounded hover:bg-primary transition-colors"
                        >
                          Analisar
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. CONTEÚDO DA ABA: ANÁLISE EXPANDIDA (LARGURA TOTAL) */}
      {activeTab === 'analyze' && selectedItem && (
        <div className="w-full bg-white rounded-b-xl border border-t-0 border-border-subtle shadow-sm p-6 space-y-6 animate-fade-in flex flex-col lg:flex-row gap-6">
          {/* Coluna Esquerda: Detalhes, Descrição, Fotos Grandes (7/12) */}
          <div className="flex-1 space-y-6">
            <div className="flex justify-between items-start border-b border-border-subtle pb-4">
              <div>
                <span className="font-mono text-outline-variant text-sm block">{selectedItem.id}</span>
                <h3 className="font-headline-md text-headline-md font-bold text-on-surface">
                  Análise Técnica e Rastreabilidade do Relato
                </h3>
              </div>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-label-bold text-xs ${
                selectedItem.urgency === 'high' 
                  ? 'bg-status-critical/10 text-status-critical' 
                  : selectedItem.urgency === 'medium'
                  ? 'bg-status-warning/10 text-status-warning'
                  : 'bg-status-stable/10 text-status-stable'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  selectedItem.urgency === 'high' ? 'bg-status-critical' : selectedItem.urgency === 'medium' ? 'bg-status-warning' : 'bg-status-stable'
                }`} />
                Urgência: {selectedItem.urgency === 'high' ? 'Alta' : selectedItem.urgency === 'medium' ? 'Média' : 'Baixa'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <span className="font-label-caps text-[10px] text-on-surface-variant uppercase block">Bem Relatado</span>
                <span className="font-bold text-on-surface text-body-md">{selectedItem.assetName}</span>
              </div>
              <div>
                <span className="font-label-caps text-[10px] text-on-surface-variant uppercase block">Localidade</span>
                <span className="text-on-surface text-body-sm font-semibold">{selectedItem.location}</span>
              </div>
              <div>
                <span className="font-label-caps text-[10px] text-on-surface-variant uppercase block">Data e Hora de Envio</span>
                <span className="text-on-surface text-body-sm">
                  {new Date(selectedItem.date).toLocaleString('pt-BR')}
                </span>
              </div>
              <div>
                <span className="font-label-caps text-[10px] text-on-surface-variant uppercase block">Classificação Inteligente (IA)</span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-primary-fixed text-primary border border-primary-fixed-dim text-xs font-label-bold mt-0.5">
                  <span className="material-symbols-outlined text-[14px]">smart_toy</span>
                  {selectedItem.iaSuggestion}
                </span>
              </div>
            </div>

            {/* Descrição / Relato */}
            <div className="bg-surface-gray/50 p-4 rounded-xl border border-border-subtle/50">
              <span className="font-label-caps text-[10px] text-on-surface-variant uppercase block mb-1">Descrição Detalhada do Dano</span>
              <p className="text-on-surface text-body-sm leading-relaxed text-justify">{selectedItem.description}</p>
            </div>

            {/* Galeria de Fotos Anexadas */}
            {selectedItem.photos && selectedItem.photos.length > 0 && (
              <div className="space-y-2">
                <span className="font-label-caps text-[10px] text-on-surface-variant uppercase block">Fotos de Evidência Anexadas ({selectedItem.photos.length})</span>
                <div className="grid grid-cols-3 gap-3">
                  {selectedItem.photos.map((photo, idx) => (
                    <div key={idx} className="w-full h-32 rounded-lg overflow-hidden border border-border-subtle bg-surface-gray shadow-sm group relative">
                      <img 
                        src={photo} 
                        alt={`Evidência ${idx + 1}`} 
                        className="w-full h-full object-cover cursor-zoom-in hover:scale-105 transition-transform"
                        onClick={() => window.open(photo, '_blank')}
                      />
                      <span className="absolute bottom-2 left-2 bg-black/60 text-white font-mono text-[9px] px-1.5 py-0.5 rounded">
                        Foto {idx + 1}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-on-surface-variant italic">Clique em qualquer foto para abrir em tamanho real em uma nova guia.</p>
              </div>
            )}

            {/* Origem, Nome do Relator e Sigilo */}
            <div className="border-t border-border-subtle/50 pt-4 space-y-2">
              <span className="font-label-caps text-[10px] text-on-surface-variant uppercase block">Informações de Sigilo e Relator</span>
              {selectedItem.anonymity === 'anonymous' ? (
                <div className="bg-gray-50 p-3 rounded-lg border border-border-subtle/50 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[20px] text-on-surface-variant">visibility_off</span>
                  <div>
                    <span className="text-body-sm font-bold text-on-surface block">Denúncia Anônima</span>
                    <span className="text-[11px] text-on-surface-variant font-mono">Chave de Segurança: {selectedItem.accessKey || 'N/A'}</span>
                  </div>
                </div>
              ) : (
                <div className="bg-surface-container-low p-4 rounded-lg border border-border-subtle/50 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-primary">
                    <span className="material-symbols-outlined text-[16px]">
                      {selectedItem.anonymity === 'confidential' ? 'shield_lock' : 'person'}
                    </span>
                    {selectedItem.anonymity === 'confidential' ? 'Sigilosa (Dados guardados em sigilo pelo CAOMA)' : 'Identificada (Pública)'}
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-body-sm">
                    <p className="text-on-surface"><strong>Nome:</strong> {selectedItem.reporterName || 'Não informado'}</p>
                    <p className="text-on-surface-variant"><strong>Contato:</strong> {selectedItem.reporterContact || 'Não informado'}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Linha do Tempo */}
            {selectedItem.timeline && selectedItem.timeline.length > 0 && (
              <div className="border-t border-border-subtle/50 pt-4 space-y-2">
                <span className="font-label-caps text-[10px] text-on-surface-variant uppercase block">Auditoria de Rastreabilidade</span>
                <div className="relative pl-4 border-l border-border-subtle space-y-4">
                  {selectedItem.timeline.map((step, idx) => (
                    <div key={idx} className="relative text-xs">
                      <span className="absolute -left-[21px] top-0.5 w-2 h-2 rounded-full bg-heritage-green-deep border border-white" />
                      <div>
                        <span className="font-bold text-on-surface block">{step.status}</span>
                        <span className="text-[9px] text-on-surface-variant">{new Date(step.date).toLocaleString('pt-BR')}</span>
                        <p className="text-on-surface-variant mt-0.5">{step.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Coluna Direita: Mapa Interativo e Encaminhamento (5/12) */}
          <div className="w-full lg:w-[420px] xl:w-[480px] space-y-6 shrink-0 border-l border-border-subtle/50 pl-0 lg:pl-6">
            {/* Mapa de Localização */}
            <div className="space-y-2">
              <span className="font-label-caps text-[10px] text-on-surface-variant uppercase block">Localização Espacial (Mapa)</span>
              <div className="w-full h-64 rounded-xl border border-border-subtle overflow-hidden relative shadow-sm z-10">
                <MapContainer 
                  center={selectedItem.coordinates || [-10.249, -48.324]} 
                  zoom={12} 
                  className="w-full h-full"
                  scrollWheelZoom={false}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <Marker 
                    position={selectedItem.coordinates || [-10.249, -48.324]}
                    icon={L.divIcon({
                      html: `
                        <div class="flex items-center justify-center w-8 h-8 rounded-full border-2 border-white shadow-lg bg-status-critical">
                          <span class="material-symbols-outlined text-[16px] text-white font-bold">report</span>
                        </div>
                      `,
                      className: 'custom-triage-marker',
                      iconSize: [32, 32],
                      iconAnchor: [16, 32]
                    })}
                  />
                  <ChangeView center={selectedItem.coordinates || [-10.249, -48.324]} zoom={12} />
                </MapContainer>
              </div>
              {selectedItem.coordinates ? (
                <div className="flex items-center justify-between text-[11px] text-on-surface-variant font-mono bg-surface-gray p-2 rounded border border-border-subtle/50">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm text-institutional-blue">gps_fixed</span>
                    <strong>GPS:</strong> Lat {selectedItem.coordinates[0].toFixed(6)}, Lng {selectedItem.coordinates[1].toFixed(6)}
                  </span>
                </div>
              ) : (
                <span className="text-[10px] text-on-surface-variant block italic">Sem coordenadas precisas de GPS anexadas.</span>
              )}
            </div>

            {/* Configuração da Ação Administrativa */}
            <div className="space-y-4 pt-4 border-t border-border-subtle">
              <h4 className="font-label-caps text-label-caps text-primary uppercase font-bold tracking-wider">
                Definição do Encaminhamento
              </h4>

              {/* Relação do Bem */}
              <div className="space-y-2">
                <span className="font-body-sm text-[12px] text-on-surface-variant block">Associação no Inventário:</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAssociationType('new')}
                    className={`py-2 px-3 text-body-sm font-label-bold rounded border text-center transition-colors ${
                      associationType === 'new'
                        ? 'bg-primary-fixed border-primary text-primary font-bold'
                        : 'bg-white border-border-subtle text-on-surface-variant hover:bg-surface-gray'
                    }`}
                  >
                    Novo Bem
                  </button>
                  <button
                    type="button"
                    onClick={() => setAssociationType('existing')}
                    className={`py-2 px-3 text-body-sm font-label-bold rounded border text-center transition-colors ${
                      associationType === 'existing'
                        ? 'bg-primary-fixed border-primary text-primary font-bold'
                        : 'bg-white border-border-subtle text-on-surface-variant hover:bg-surface-gray'
                    }`}
                  >
                    Vincular Existente
                  </button>
                </div>
              </div>

              {associationType === 'new' ? (
                /* Selecionar categoria se for Novo Bem */
                <div className="space-y-2">
                  <label className="font-body-sm text-[12px] text-on-surface-variant block">Categoria do Novo Bem:</label>
                  <select 
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value as any)}
                    className="w-full px-3 py-2 bg-white border border-border-subtle rounded text-body-sm text-on-surface focus:border-heritage-green-deep focus:ring-1 focus:ring-heritage-green-deep cursor-pointer"
                  >
                    <option value="material">Material (Edificado/Histórico)</option>
                    <option value="natural">Natural (Biomas/Reservas)</option>
                    <option value="arqueologico">Arqueológico (Sítios/Inscrições)</option>
                  </select>
                </div>
              ) : (
                /* Selecionar bem existente */
                <div className="space-y-2">
                  <label className="font-body-sm text-[12px] text-on-surface-variant block">Selecione o Bem no Inventário:</label>
                  <select 
                    value={selectedAssetId}
                    onChange={(e) => setSelectedAssetId(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-border-subtle rounded text-body-sm text-on-surface focus:border-heritage-green-deep focus:ring-1 focus:ring-heritage-green-deep cursor-pointer"
                  >
                    <option value="">Selecione...</option>
                    {assets.map(asset => (
                      <option key={asset.id} value={asset.id}>
                        {asset.name} ({asset.id})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Ações */}
            <div className="flex gap-2 pt-4 border-t border-border-subtle">
              <button
                type="button"
                onClick={handleArchive}
                className="flex-1 py-2.5 bg-white border border-status-critical/30 text-status-critical rounded font-label-bold text-label-bold uppercase hover:bg-status-critical/10 transition-colors"
              >
                Arquivar
              </button>
              <button
                type="button"
                onClick={handleApprove}
                disabled={associationType === 'existing' && !selectedAssetId}
                className={`flex-1 py-2.5 text-white rounded font-label-bold text-label-bold uppercase transition-colors ${
                  associationType === 'existing' && !selectedAssetId
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-heritage-green-deep hover:bg-primary'
                }`}
              >
                Aprovar &amp; Vistoriar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
