import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import type { Occurrence } from '../../types';
import logoCaoma from '../../assets/logo_caoma_MPE.png';

export const Occurrences: React.FC = () => {
  const { occurrences, assets, triageItems, scheduleAudit, updateOccurrenceStatus, updateOccurrenceReferral } = useData();

  // Funções auxiliares para contagem de dias da validação
  const getValidationDate = (oco: Occurrence) => {
    if (!oco.timeline || oco.timeline.length === 0) return null;
    const validationStep = oco.timeline.find(t => 
      t.status.toLowerCase().includes('triagem') ||
      t.status.toLowerCase().includes('validação') ||
      t.status.toLowerCase().includes('validacao')
    );
    return validationStep ? new Date(validationStep.date) : new Date(oco.date);
  };

  const getDaysSinceValidation = (oco: Occurrence) => {
    const valDate = getValidationDate(oco);
    if (!valDate) return 0;
    const currentDate = new Date();
    const diffTime = currentDate.getTime() - valDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays < 0 ? 0 : diffDays;
  };

  const getDaysAgoText = (diffDays: number) => {
    if (diffDays <= 0) return 'hoje';
    if (diffDays === 1) return 'há 1 dia';
    return `há ${diffDays} dias`;
  };

  // Estados locais
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('Todos');
  const [filterSeverity, setFilterSeverity] = useState<string>('Todos');
  const [filterCategory, setFilterCategory] = useState<string>('Todos');
  const [filterDate, setFilterDate] = useState<string>('Todos');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'severity-desc' | 'severity-asc'>('severity-desc');
  
  // Estado para modal / formulário de ação
  const [selectedOco, setSelectedOco] = useState<Occurrence | null>(null);
  const [actionType, setActionType] = useState<'schedule' | 'resolve' | 'view' | null>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Campos para o formulário
  const [auditorName, setAuditorName] = useState('');
  const [auditDate, setAuditDate] = useState('');
  const [auditReport, setAuditReport] = useState('');
  
  // Encaminhamento jurídico
  const [referralDest, setReferralDest] = useState<'mpto' | 'iphan' | 'secult' | 'police' | 'none'>('none');
  const [referralCaseNumber, setReferralCaseNumber] = useState('');
  const [referralNotes, setReferralNotes] = useState('');

  // Filtragem das ocorrências
  const filteredOccurrences = occurrences.filter(oco => {
    const matchesSearch = 
      oco.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      oco.assetName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      oco.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      oco.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (oco.auditor && oco.auditor.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = filterStatus === 'Todos' || oco.status === filterStatus;
    const matchesSeverity = filterSeverity === 'Todos' || oco.severity === filterSeverity;

    // Filtrar por categoria do patrimônio associado
    const assetObj = assets.find(a => a.id === oco.assetId || a.name === oco.assetName);
    const assetCategory = assetObj ? assetObj.category : 'material';
    const matchesCategory = filterCategory === 'Todos' || assetCategory === filterCategory;

    // Filtrar por período de registro
    const ocoDate = new Date(oco.date);
    const now = new Date();
    let matchesDate = true;
    if (filterDate === 'today') {
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      matchesDate = ocoDate >= today;
    } else if (filterDate === '7days') {
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      matchesDate = ocoDate >= sevenDaysAgo;
    } else if (filterDate === '30days') {
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      matchesDate = ocoDate >= thirtyDaysAgo;
    }

    return matchesSearch && matchesStatus && matchesSeverity && matchesCategory && matchesDate;
  });

  // Ordenação
  const sortedOccurrences = [...filteredOccurrences].sort((a, b) => {
    if (sortBy === 'date-desc') {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    }
    if (sortBy === 'date-asc') {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    }
    if (sortBy === 'severity-desc') {
      const w = { high: 3, medium: 2, low: 1 };
      return w[b.severity] - w[a.severity];
    }
    if (sortBy === 'severity-asc') {
      const w = { high: 3, medium: 2, low: 1 };
      return w[a.severity] - w[b.severity];
    }
    return 0;
  });

  const handleOpenSchedule = (oco: Occurrence) => {
    setSelectedOco(oco);
    setActionType('schedule');
    setAuditorName(oco.auditor || '');
    setAuditDate(oco.nextAuditDate || '');
  };

  const handleOpenResolve = (oco: Occurrence) => {
    setSelectedOco(oco);
    setActionType('resolve');
    setAuditorName(oco.auditor || 'Dr. Marlo Silva');
    setAuditReport('');
    setReferralDest('none');
    setReferralCaseNumber('');
    setReferralNotes('');
  };

  const handleOpenView = (oco: Occurrence) => {
    setSelectedOco(oco);
    setActionType('view');
  };

  const handleScheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOco || !auditDate || !auditorName) {
      alert('Data da vistoria e auditor técnico são obrigatórios.');
      return;
    }
    scheduleAudit(selectedOco.id, auditDate, auditorName);
    alert(`Vistoria técnica para a ocorrência ${selectedOco.id} agendada para ${new Date(auditDate).toLocaleDateString('pt-BR')}.`);
    setActionType(null);
    setSelectedOco(null);
  };

  const handleResolveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOco || !auditReport) {
      alert('É necessário registrar o laudo/parecer técnico.');
      return;
    }
    updateOccurrenceStatus(selectedOco.id, 'resolved', auditorName, auditReport);
    updateOccurrenceReferral(selectedOco.id, referralDest, referralCaseNumber, referralNotes);
    alert(`Ocorrência ${selectedOco.id} resolvida! O status do bem patrimonial foi atualizado no Inventário e o despacho de encaminhamento jurídico foi concluído.`);
    setActionType(null);
    setSelectedOco(null);
  };

  // Métricas do Dashboard de Ocorrências
  const totalOcos = occurrences.length;
  const activeOcos = occurrences.filter(o => o.status !== 'resolved').length;
  const resolvedOcos = occurrences.filter(o => o.status === 'resolved').length;
  const openOcos = occurrences.filter(o => o.status === 'open').length;
  const auditingOcos = occurrences.filter(o => o.status === 'auditing').length;

  const totalTriages = triageItems.length;
  const triageConverted = triageItems.filter(t => t.status === 'approved').length;
  const triageDiscarded = triageItems.filter(t => t.status === 'archived').length;

  // Porcentagem de conversão de denúncias
  const conversionRate = totalTriages > 0 ? Math.round((triageConverted / totalTriages) * 100) : 0;
  
  // Porcentagem de resolubilidade
  const resolutionRate = totalOcos > 0 ? Math.round((resolvedOcos / totalOcos) * 100) : 0;

  // Urgência de ocorrências ativas
  const activeHigh = occurrences.filter(o => o.status !== 'resolved' && o.severity === 'high').length;
  const activeMedium = occurrences.filter(o => o.status !== 'resolved' && o.severity === 'medium').length;
  const activeLow = occurrences.filter(o => o.status !== 'resolved' && o.severity === 'low').length;

  return (
    <div className="space-y-stack-lg animate-fade-in flex flex-col h-full">
      {/* Header */}
      <div>
        <h2 className="font-headline-lg text-headline-lg text-on-surface mb-stack-sm">
          Gestão de Ocorrências e Vistorias
        </h2>
        <p className="font-body-lg text-body-lg text-on-surface-variant">
          Controle de incidentes, agendamento de laudos técnicos e fiscalização in loco do patrimônio cultural.
        </p>
      </div>

      {/* Seção de Métricas e Gráficos Operacionais */}
      <div className="space-y-4">
        {/* Grid de 4 Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-border-subtle p-4 shadow-sm flex items-center justify-between transition-all hover:shadow-md">
            <div className="space-y-1">
              <span className="text-[10px] font-label-caps text-on-surface-variant uppercase block tracking-wider">Ocorrências Ativas</span>
              <span className="text-2xl font-bold text-status-critical block leading-tight">{activeOcos}</span>
              <span className="text-[10px] text-on-surface-variant block">
                {openOcos} em aberto / {auditingOcos} em vistoria
              </span>
            </div>
            <span className="material-symbols-outlined text-[32px] text-status-critical bg-status-critical/10 p-2 rounded-lg">priority_high</span>
          </div>

          <div className="bg-white rounded-xl border border-border-subtle p-4 shadow-sm flex items-center justify-between transition-all hover:shadow-md">
            <div className="space-y-1">
              <span className="text-[10px] font-label-caps text-on-surface-variant uppercase block tracking-wider">Taxa de Conversão</span>
              <span className="text-2xl font-bold text-heritage-green-deep block leading-tight">{conversionRate}%</span>
              <span className="text-[10px] text-on-surface-variant block">
                {triageConverted} aprovadas de {totalTriages}
              </span>
            </div>
            <span className="material-symbols-outlined text-[32px] text-heritage-green-deep bg-heritage-green-deep/10 p-2 rounded-lg">transform</span>
          </div>

          <div className="bg-white rounded-xl border border-border-subtle p-4 shadow-sm flex items-center justify-between transition-all hover:shadow-md">
            <div className="space-y-1">
              <span className="text-[10px] font-label-caps text-on-surface-variant uppercase block tracking-wider">Triagens Descartadas</span>
              <span className="text-2xl font-bold text-on-surface block leading-tight">{triageDiscarded}</span>
              <span className="text-[10px] text-on-surface-variant block">
                Relatos arquivados/improcedentes
              </span>
            </div>
            <span className="material-symbols-outlined text-[32px] text-on-surface-variant bg-surface-gray p-2 rounded-lg">delete_sweep</span>
          </div>

          <div className="bg-white rounded-xl border border-border-subtle p-4 shadow-sm flex items-center justify-between transition-all hover:shadow-md">
            <div className="space-y-1">
              <span className="text-[10px] font-label-caps text-on-surface-variant uppercase block tracking-wider">Laudos Concluídos</span>
              <span className="text-2xl font-bold text-status-stable block leading-tight">{resolvedOcos}</span>
              <span className="text-[10px] text-on-surface-variant block">
                {resolutionRate}% de resolubilidade total
              </span>
            </div>
            <span className="material-symbols-outlined text-[32px] text-status-stable bg-status-stable/10 p-2 rounded-lg">task_alt</span>
          </div>
        </div>

        {/* Grid de 2 Gráficos em CSS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white rounded-xl border border-border-subtle p-5 shadow-sm">
          {/* Gráfico 1: Resolubilidade */}
          <div className="space-y-3">
            <h4 className="font-label-caps text-[11px] text-on-surface-variant font-bold uppercase tracking-wider flex items-center gap-1">
              <span className="material-symbols-outlined text-[15px] text-heritage-green-deep">query_stats</span>
              Resolubilidade de Ocorrências (Histórico Geral)
            </h4>
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold text-on-surface">
                <span>{resolvedOcos} Concluídas ({resolutionRate}%)</span>
                <span className="text-on-surface-variant">{activeOcos} Ativas ({100 - resolutionRate}%)</span>
              </div>
              {/* Stacked Progress Bar */}
              <div className="w-full h-4 bg-surface-gray rounded-full overflow-hidden flex">
                <div 
                  style={{ width: `${resolutionRate}%` }} 
                  className="bg-status-stable h-full transition-all duration-500" 
                  title={`Concluídas: ${resolutionRate}%`}
                />
                <div 
                  style={{ width: `${100 - resolutionRate}%` }} 
                  className="bg-status-critical h-full transition-all duration-500" 
                  title={`Ativas: ${100 - resolutionRate}%`}
                />
              </div>
              <p className="text-[10px] text-on-surface-variant leading-relaxed">
                Métrica que calcula o percentual de vistorias técnicas concluídas e arquivadas com despacho técnico final pelo MPTO.
              </p>
            </div>
          </div>

          {/* Gráfico 2: Níveis de Urgência Ativas */}
          <div className="space-y-3 border-t md:border-t-0 md:border-l border-border-subtle pt-4 md:pt-0 md:pl-5">
            <h4 className="font-label-caps text-[11px] text-on-surface-variant font-bold uppercase tracking-wider flex items-center gap-1">
              <span className="material-symbols-outlined text-[15px] text-status-critical">analytics</span>
              Distribuição de Urgência (Ocorrências Ativas)
            </h4>
            <div className="space-y-2">
              {[
                { label: 'Alta (Crítico)', count: activeHigh, colorClass: 'bg-status-critical', total: activeOcos },
                { label: 'Média (Atenção)', count: activeMedium, colorClass: 'bg-status-warning', total: activeOcos },
                { label: 'Baixa (Manutenção)', count: activeLow, colorClass: 'bg-status-stable', total: activeOcos }
              ].map((item, idx) => {
                const percent = item.total > 0 ? Math.round((item.count / item.total) * 100) : 0;
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-[11px] text-on-surface">
                      <span className="font-semibold">{item.label}</span>
                      <span>{item.count} ocorrências ({percent}%)</span>
                    </div>
                    <div className="w-full h-2 bg-surface-gray rounded-full overflow-hidden">
                      <div 
                        style={{ width: `${percent}%` }} 
                        className={`${item.colorClass} h-full transition-all duration-500`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-stack-lg items-start h-full">
        {/* Lista de Ocorrências (Esquerda) */}
        <div className="flex-1 w-full bg-white rounded-xl border border-border-subtle shadow-sm overflow-hidden flex flex-col">
          {/* Barra de Filtros */}
          <div className="glass-panel border-b border-border-subtle p-4 flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="block font-label-caps text-[10px] text-on-surface-variant uppercase mb-1.5 tracking-wider">
                Busca de Ocorrências
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
                  placeholder="Código, bem, título, auditor..." 
                />
              </div>
            </div>

            <div className="w-40">
              <label className="block font-label-caps text-[10px] text-on-surface-variant uppercase mb-1.5 tracking-wider">
                Status
              </label>
              <select 
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-border-subtle rounded text-body-sm text-on-surface focus:border-heritage-green-deep focus:ring-1 focus:ring-heritage-green-deep transition-colors appearance-none cursor-pointer"
              >
                <option value="Todos">Todos</option>
                <option value="open">Aberto (Não Vistoriado)</option>
                <option value="auditing">Em Vistoria</option>
                <option value="resolved">Resolvido (Laudo Emitido)</option>
              </select>
            </div>

            <div className="w-32">
              <label className="block font-label-caps text-[10px] text-on-surface-variant uppercase mb-1.5 tracking-wider">
                Gravidade
              </label>
              <select 
                value={filterSeverity}
                onChange={(e) => setFilterSeverity(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-border-subtle rounded text-body-sm text-on-surface focus:border-heritage-green-deep focus:ring-1 focus:ring-heritage-green-deep transition-colors appearance-none cursor-pointer"
              >
                <option value="Todos">Todos</option>
                <option value="high">Alta (Crítico)</option>
                <option value="medium">Média (Atenção)</option>
                <option value="low">Baixa (Manutenção)</option>
              </select>
            </div>

            <div className="w-36">
              <label className="block font-label-caps text-[10px] text-on-surface-variant uppercase mb-1.5 tracking-wider">
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
              <label className="block font-label-caps text-[10px] text-on-surface-variant uppercase mb-1.5 tracking-wider">
                Período
              </label>
              <select 
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-border-subtle rounded text-body-sm text-on-surface focus:border-heritage-green-deep focus:ring-1 focus:ring-heritage-green-deep transition-colors appearance-none cursor-pointer"
              >
                <option value="Todos">Todo o histórico</option>
                <option value="today">Registradas hoje</option>
                <option value="7days">Últimos 7 dias</option>
                <option value="30days">Últimos 30 dias</option>
              </select>
            </div>

            <div className="w-44">
              <label className="block font-label-caps text-[10px] text-on-surface-variant uppercase mb-1.5 tracking-wider">
                Ordenar por
              </label>
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full px-3 py-2 bg-white border border-border-subtle rounded text-body-sm text-on-surface focus:border-heritage-green-deep focus:ring-1 focus:ring-heritage-green-deep transition-colors appearance-none cursor-pointer"
              >
                <option value="severity-desc">Gravidade (Maior p/ Menor)</option>
                <option value="severity-asc">Gravidade (Menor p/ Maior)</option>
                <option value="date-desc">Mais Recentes</option>
                <option value="date-asc">Mais Antigas</option>
              </select>
            </div>

            <button 
              onClick={() => { 
                setSearchTerm(''); 
                setFilterStatus('Todos'); 
                setFilterSeverity('Todos'); 
                setFilterCategory('Todos');
                setFilterDate('Todos');
                setSortBy('severity-desc');
              }}
              className="px-4 py-2 bg-surface border border-border-subtle text-on-surface font-label-bold text-label-bold rounded hover:bg-surface-container-low transition-colors h-[38px] flex items-center justify-center text-xs uppercase"
            >
              Limpar
            </button>
          </div>

          {/* Lista de Ocorrências Agrupadas por Status (Empilhadas verticalmente) */}
          <div className="p-6 space-y-8 overflow-y-auto max-h-[70vh]">
            {(() => {
              const openGroup = sortedOccurrences.filter(o => o.status === 'open');
              const auditingGroup = sortedOccurrences.filter(o => o.status === 'auditing');
              const resolvedGroup = sortedOccurrences.filter(o => o.status === 'resolved');

              const renderOccurrenceGroup = (title: string, groupItems: Occurrence[], colorClass: string, icon: string, emptyMessage: string) => {
                if (filterStatus !== 'Todos' && groupItems.length === 0) return null;
                
                return (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-border-subtle/80 pb-2">
                      <h3 className={`font-label-bold text-xs uppercase ${colorClass} tracking-wider flex items-center gap-2`}>
                        <span className="material-symbols-outlined text-[18px]">{icon}</span>
                        {title} ({groupItems.length})
                      </h3>
                    </div>
                    
                    {groupItems.length === 0 ? (
                      <div className="text-xs text-on-surface-variant italic py-3.5 px-4 bg-surface-gray rounded-xl border border-dashed border-border-subtle">
                        {emptyMessage}
                      </div>
                    ) : (
                      <div className="flex flex-col gap-4">
                        {groupItems.map((oco) => {
                          const globalIdx = sortedOccurrences.findIndex(item => item.id === oco.id);
                          return (
                            <div 
                              key={oco.id} 
                              className={`bento-card p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:shadow-md transition-all duration-200 relative group border-l-4 ${
                                oco.severity === 'high'
                                  ? 'border-l-status-critical'
                                  : oco.severity === 'medium'
                                  ? 'border-l-status-warning'
                                  : 'border-l-status-stable'
                              } ${
                                selectedOco?.id === oco.id ? 'ring-2 ring-heritage-green-deep' : ''
                              }`}
                            >
                              {/* Indicador de Ordem/Posição de Urgência */}
                              <span className="absolute top-2 left-2 w-5 h-5 rounded-full bg-surface-gray border border-border-subtle flex items-center justify-center font-mono text-[9px] text-on-surface-variant font-bold">
                                #{globalIdx + 1}
                              </span>
                              
                              {/* Conteúdo Principal */}
                              <div className="flex-1 min-w-0 space-y-3 pl-4">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="font-mono text-outline-variant text-[12px]">{oco.id}</span>
                                  <div className="flex gap-1.5">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-label-bold ${
                                      oco.severity === 'high'
                                        ? 'bg-status-critical/10 text-status-critical'
                                        : oco.severity === 'medium'
                                        ? 'bg-status-warning/10 text-status-warning'
                                        : 'bg-status-stable/10 text-status-stable'
                                    }`}>
                                      {oco.severity === 'high' ? 'Alta' : oco.severity === 'medium' ? 'Média' : 'Baixa'}
                                    </span>
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-label-bold ${
                                      oco.status === 'open'
                                        ? 'bg-red-100 text-red-800'
                                        : oco.status === 'auditing'
                                        ? 'bg-blue-100 text-blue-800'
                                        : 'bg-green-100 text-green-800'
                                    }`}>
                                      {oco.status === 'open' ? 'Aberto' : oco.status === 'auditing' ? 'Vistoriando' : 'Resolvido'}
                                    </span>
                                  </div>
                                </div>

                                <div>
                                  <h4 className="font-bold text-on-surface text-body-md leading-tight">{oco.title}</h4>
                                  <p className="text-[12px] text-primary font-bold mt-1">{oco.assetName}</p>
                                </div>

                                <p className="text-on-surface-variant text-body-sm leading-relaxed max-w-3xl">
                                  {oco.description}
                                </p>

                                {/* Metadados */}
                                <div className="pt-3 border-t border-border-subtle/50 text-[11px] flex flex-wrap gap-x-4 gap-y-1.5 text-on-surface-variant">
                                  <div className="flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                                    <span>Registrado em: {new Date(oco.date).toLocaleDateString('pt-BR')}</span>
                                  </div>
                                  
                                  {getValidationDate(oco) && (
                                    <div className="flex items-center gap-1 text-heritage-green-leaf font-semibold">
                                      <span className="material-symbols-outlined text-[14px]">verified</span>
                                      <span>Validada {getDaysAgoText(getDaysSinceValidation(oco))} ({getValidationDate(oco)!.toLocaleDateString('pt-BR')})</span>
                                    </div>
                                  )}
                                  
                                  {oco.nextAuditDate && (
                                    <div className="flex items-center gap-1 text-institutional-blue font-bold">
                                      <span className="material-symbols-outlined text-[14px]">explore</span>
                                      <span>Vistoria: {new Date(oco.nextAuditDate).toLocaleDateString('pt-BR')}</span>
                                    </div>
                                  )}

                                  {oco.auditor && (
                                    <div className="flex items-center gap-1">
                                      <span className="material-symbols-outlined text-[14px]">person</span>
                                      <span>Técnico: {oco.auditor}</span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Ações */}
                              <div className="w-full md:w-auto md:shrink-0 flex flex-row md:flex-col gap-2 border-t md:border-t-0 pt-3 md:pt-0 border-border-subtle/50">
                                {oco.status === 'open' && (
                                  <button
                                    onClick={() => handleOpenSchedule(oco)}
                                    className="w-full px-4 py-2 bg-heritage-green-deep hover:bg-primary text-white font-label-bold text-label-bold uppercase rounded text-[11px] transition-colors whitespace-nowrap text-center"
                                  >
                                    Agendar Vistoria
                                  </button>
                                )}
                                {oco.status === 'auditing' && (
                                  <button
                                    onClick={() => handleOpenResolve(oco)}
                                    className="w-full px-4 py-2 bg-institutional-blue hover:bg-blue-800 text-white font-label-bold text-label-bold uppercase rounded text-[11px] transition-colors whitespace-nowrap text-center"
                                  >
                                    Registrar Laudo
                                  </button>
                                )}
                                {oco.status === 'resolved' && (
                                  <button
                                    onClick={() => handleOpenView(oco)}
                                    className="w-full px-4 py-2 bg-white border border-border-subtle text-on-surface hover:bg-surface-gray font-label-bold text-label-bold uppercase rounded text-[11px] transition-colors flex items-center justify-center gap-1 whitespace-nowrap text-center"
                                  >
                                    <span className="material-symbols-outlined text-[14px]">visibility</span>
                                    Ver Parecer
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              };

              if (sortedOccurrences.length === 0) {
                return (
                  <div className="py-12 text-center text-on-surface-variant">
                    Nenhuma ocorrência registrada para os filtros selecionados.
                  </div>
                );
              }

              return (
                <>
                  {(filterStatus === 'Todos' || filterStatus === 'open') && 
                    renderOccurrenceGroup(
                      'Aguardando Vistoria', 
                      openGroup, 
                      'text-status-critical', 
                      'pending_actions', 
                      'Nenhuma ocorrência aguardando vistoria.'
                    )}
                  
                  {(filterStatus === 'Todos' || filterStatus === 'auditing') && 
                    renderOccurrenceGroup(
                      'Em Vistoria / Vistoriadas', 
                      auditingGroup, 
                      'text-institutional-blue', 
                      'explore', 
                      'Nenhuma ocorrência em vistoria no momento.'
                    )}
                  
                  {(filterStatus === 'Todos' || filterStatus === 'resolved') && 
                    renderOccurrenceGroup(
                      'Resolvidas / Concluídas', 
                      resolvedGroup, 
                      'text-status-stable', 
                      'task_alt', 
                      'Nenhuma ocorrência resolvida.'
                    )}
                </>
              );
            })()}
          </div>
        </div>

        {/* Formulário / Detalhe de Ação (Direita) */}
        {selectedOco && actionType && (
          <div className="w-full xl:w-[450px] bg-white rounded-xl border border-border-subtle shadow-sm p-6 space-y-6 animate-fade-in shrink-0">
            <div className="flex justify-between items-start border-b border-border-subtle pb-4">
              <div>
                <span className="font-mono text-outline-variant text-xs">{selectedOco.id}</span>
                <h3 className="font-headline-md text-headline-md font-bold text-on-surface">
                  {actionType === 'schedule' && 'Agendamento de Vistoria'}
                  {actionType === 'resolve' && 'Registro de Parecer / Laudo'}
                  {actionType === 'view' && 'Parecer Técnico Concluído'}
                </h3>
              </div>
              <button 
                onClick={() => { setSelectedOco(null); setActionType(null); }}
                className="text-on-surface-variant hover:bg-surface-gray p-1 rounded"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Agendamento */}
            {actionType === 'schedule' && (
              <form onSubmit={handleScheduleSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="block font-label-caps text-[10px] text-on-surface-variant uppercase tracking-wider">
                    Auditor Técnico Responsável *
                  </label>
                  <input 
                    type="text" 
                    value={auditorName}
                    onChange={(e) => setAuditorName(e.target.value)}
                    className="w-full px-3 py-2 border border-border-subtle rounded text-body-sm text-on-surface focus:border-heritage-green-deep focus:ring-1"
                    placeholder="Ex: Dra. Helena Souza (Fiscal)"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="block font-label-caps text-[10px] text-on-surface-variant uppercase tracking-wider">
                    Data Programada para Vistoria *
                  </label>
                  <input 
                    type="date" 
                    value={auditDate}
                    onChange={(e) => setAuditDate(e.target.value)}
                    className="w-full px-3 py-2 border border-border-subtle rounded text-body-sm text-on-surface focus:border-heritage-green-deep focus:ring-1"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 bg-heritage-green-deep hover:bg-primary text-white rounded font-label-bold text-label-bold uppercase transition-colors"
                >
                  Confirmar Agendamento
                </button>
              </form>
            )}

            {/* Registrar Laudo */}
            {actionType === 'resolve' && (
              <form onSubmit={handleResolveSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="block font-label-caps text-[10px] text-on-surface-variant uppercase tracking-wider">
                    Auditor Responsável
                  </label>
                  <input 
                    type="text" 
                    value={auditorName}
                    onChange={(e) => setAuditorName(e.target.value)}
                    className="w-full px-3 py-2 border border-border-subtle rounded text-body-sm text-on-surface focus:border-heritage-green-deep focus:ring-1"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="block font-label-caps text-[10px] text-on-surface-variant uppercase tracking-wider">
                    Parecer Técnico / Laudo de Fiscalização *
                  </label>
                  <textarea 
                    value={auditReport}
                    onChange={(e) => setAuditReport(e.target.value)}
                    className="w-full px-3 py-2 border border-border-subtle rounded text-body-sm text-on-surface focus:border-heritage-green-deep focus:ring-1 h-28 resize-none"
                    placeholder="Descreva as medidas de conservação adotadas, recomendações técnicas e conclusões..."
                    required
                  />
                </div>

                {/* Encaminhamento Institucional / Jurídico */}
                <div className="space-y-3 pt-2.5 border-t border-border-subtle/50">
                  <h5 className="font-label-caps text-[10px] text-primary font-bold uppercase tracking-wider">Encaminhamento Institucional / Jurídico</h5>
                  <div className="space-y-1">
                    <label className="block font-label-caps text-[10px] text-on-surface-variant uppercase tracking-wider">Destinatário</label>
                    <select
                      value={referralDest}
                      onChange={(e) => setReferralDest(e.target.value as any)}
                      className="w-full px-3 py-1.5 border border-border-subtle rounded text-body-sm text-on-surface focus:border-heritage-green-deep outline-none cursor-pointer"
                    >
                      <option value="none">Nenhum encaminhamento necessário</option>
                      <option value="mpto">Procuradoria de Justiça (MPTO)</option>
                      <option value="iphan">IPHAN (Órgão Federal)</option>
                      <option value="secult">SECULT (Órgão Estadual/TO)</option>
                      <option value="police">Delegacia de Polícia Civil (Del. Ambiental)</option>
                    </select>
                  </div>
                  {referralDest !== 'none' && (
                    <div className="space-y-2 animate-fade-in">
                      <div className="space-y-1">
                        <label className="block font-label-caps text-[10px] text-on-surface-variant uppercase tracking-wider">Nº Processo/Inquérito/Ofício</label>
                        <input
                          type="text"
                          value={referralCaseNumber}
                          onChange={(e) => setReferralCaseNumber(e.target.value)}
                          className="w-full px-3 py-1.5 border border-border-subtle rounded text-body-sm outline-none"
                          placeholder="Ex: IC nº 0122/2026-CAOMA"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block font-label-caps text-[10px] text-on-surface-variant uppercase tracking-wider">Despacho / Providências Recomendadas</label>
                        <textarea
                          value={referralNotes}
                          onChange={(e) => setReferralNotes(e.target.value)}
                          className="w-full px-3 py-1.5 border border-border-subtle rounded text-body-sm h-16 resize-none outline-none"
                          placeholder="Digite as providências solicitadas..."
                        />
                      </div>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-institutional-blue hover:bg-blue-800 text-white rounded font-label-bold text-label-bold uppercase transition-colors"
                >
                  Salvar Laudo &amp; Resolver Ocorrência
                </button>
              </form>
            )}

            {/* Visualizar Laudo Concluído */}
            {actionType === 'view' && (
              <div className="space-y-4">
                <div>
                  <span className="font-label-caps text-[10px] text-on-surface-variant uppercase block">Bem Auditado</span>
                  <span className="font-bold text-on-surface text-body-md">{selectedOco.assetName}</span>
                </div>
                <div>
                  <span className="font-label-caps text-[10px] text-on-surface-variant uppercase block">Fiscal Técnico</span>
                  <span className="text-on-surface text-body-sm">{selectedOco.auditor}</span>
                </div>
                <div className="bg-green-50 p-4 rounded border border-green-200">
                  <span className="font-label-caps text-[10px] text-green-800 uppercase block mb-1">Laudo e Medidas de Proteção</span>
                  <p className="text-on-surface text-body-sm leading-relaxed">{selectedOco.report}</p>
                </div>

                {/* Exibir Encaminhamento se houver */}
                {selectedOco.referralDest && selectedOco.referralDest !== 'none' && (
                  <div className="bg-surface-container-low p-3.5 rounded border border-border-subtle space-y-1 text-body-sm">
                    <span className="font-label-caps text-[10px] text-on-surface-variant uppercase block mb-1">Despacho Institucional</span>
                    <p><strong>Órgão:</strong> {
                      selectedOco.referralDest === 'mpto' ? 'Procuradoria de Justiça (MPTO)' :
                      selectedOco.referralDest === 'iphan' ? 'IPHAN (Federal)' :
                      selectedOco.referralDest === 'secult' ? 'SECULT (Estadual/TO)' : 'Delegacia de Polícia Civil'
                    }</p>
                    {selectedOco.referralCaseNumber && (
                      <p><strong>Nº Procedimento:</strong> {selectedOco.referralCaseNumber}</p>
                    )}
                    {selectedOco.referralNotes && (
                      <p className="text-on-surface-variant italic mt-1 bg-white p-2 rounded border border-border-subtle/50 text-[12px]">"{selectedOco.referralNotes}"</p>
                    )}
                  </div>
                )}

                {/* Linha do tempo na Ocorrência */}
                {selectedOco.timeline && selectedOco.timeline.length > 0 && (
                  <div className="border-t border-border-subtle/50 pt-2.5 space-y-2">
                    <span className="font-label-caps text-[10px] text-on-surface-variant uppercase block">Rastreabilidade do Procedimento</span>
                    <div className="relative pl-4 border-l border-border-subtle space-y-3">
                      {selectedOco.timeline.map((step: any, idx: number) => (
                        <div key={idx} className="relative text-[11px]">
                          <span className="absolute -left-[21px] top-0.5 w-2 h-2 rounded-full bg-institutional-blue border border-white" />
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

                <div className="flex gap-2 pt-2 border-t border-border-subtle">
                  <button
                    onClick={() => setShowPrintModal(true)}
                    className="w-full py-2 bg-heritage-green-deep hover:bg-primary text-white font-label-bold text-label-bold uppercase rounded text-[11px] transition-colors flex items-center justify-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[16px]">print</span>
                    Gerar Laudo Oficial (PDF)
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal de Impressão de Laudo Oficial CAOMA (Fiel aos Requisitos MPTO) */}
      {showPrintModal && selectedOco && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-4xl rounded-xl shadow-2xl overflow-hidden flex flex-col h-[90vh]">
            {/* Toolbar superior (não aparece na impressão) */}
            <div className="bg-surface-container border-b border-border-subtle p-4 flex justify-between items-center print:hidden shrink-0">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-heritage-green-deep">gavel</span>
                <span className="font-bold text-on-surface text-body-md">Pré-visualização do Laudo Oficial (CAOMA/MPTO)</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-1.5 bg-heritage-green-deep hover:bg-primary text-white rounded font-label-bold text-label-bold uppercase text-xs flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[16px]">print</span>
                  Imprimir / Salvar PDF
                </button>
                <button
                  onClick={() => setShowPrintModal(false)}
                  className="px-4 py-1.5 bg-white border border-border-subtle text-on-surface-variant hover:bg-surface-gray rounded font-label-bold text-label-bold uppercase text-xs"
                >
                  Fechar
                </button>
              </div>
            </div>

            {/* Corpo do Laudo (Formatado para impressão) */}
            <div className="flex-1 overflow-y-auto p-12 bg-white print:p-0 font-serif text-black tracking-normal leading-relaxed custom-scrollbar">
              <div className="max-w-[800px] mx-auto space-y-8 print:max-w-none">
                
                {/* Timbre MPTO */}
                <div className="flex flex-col items-center text-center space-y-2 border-b-2 border-black pb-4">
                  <img src={logoCaoma} alt="Logo CAOMA MPTO" className="h-20 w-auto object-contain" />
                  <div className="space-y-0.5">
                    <h2 className="text-[16px] font-bold uppercase tracking-wider">Ministério Público do Estado do Tocantins</h2>
                    <h3 className="text-[14px] font-bold text-gray-700 uppercase tracking-widest font-sans">Centro de Apoio Operacional do Meio Ambiente - CAOMA</h3>
                    <p className="text-[11px] text-gray-500 font-sans italic">Praça dos Girassóis, Palmas - TO | Fone: (63) 3216-7500</p>
                  </div>
                </div>

                {/* Título do Documento */}
                <div className="text-center space-y-1">
                  <h1 className="text-xl font-bold uppercase underline">Laudo Técnico de Vistoria e Fiscalização</h1>
                  <p className="text-sm font-mono font-bold">DOCUMENTO DE REFERÊNCIA JURÍDICA: {selectedOco.id}</p>
                </div>

                {/* Qualificação do Bem */}
                <div className="space-y-2 font-sans text-sm border border-gray-300 p-4 rounded-lg bg-gray-50/50">
                  <h4 className="font-bold text-gray-900 uppercase border-b border-gray-300 pb-1 text-[11px]">1. Identificação do Bem Patrimonial</h4>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs">
                    <p><strong>Nome do Ativo:</strong> {selectedOco.assetName}</p>
                    <p><strong>Código Interno:</strong> {selectedOco.assetId}</p>
                    <p><strong>Localidade/Município:</strong> {assets.find(a => a.id === selectedOco.assetId)?.location || 'Não cadastrado'}</p>
                    <p><strong>Nível de Urgência/Dano:</strong> {
                      selectedOco.severity === 'high' ? 'Crítico (Alto)' :
                      selectedOco.severity === 'medium' ? 'Médio' : 'Baixo'
                    }</p>
                    <p className="col-span-2"><strong>Data do Registro da Ocorrência:</strong> {new Date(selectedOco.date).toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>

                {/* Parecer do Auditor */}
                <div className="space-y-3">
                  <h4 className="font-sans font-bold text-gray-900 uppercase border-b border-gray-300 pb-1 text-[11px]">2. Descrição Técnica das Ocorrências</h4>
                  <p className="text-justify text-sm leading-relaxed text-gray-800 indent-8 font-serif">
                    {selectedOco.description}
                  </p>
                </div>

                <div className="space-y-3">
                  <h4 className="font-sans font-bold text-gray-900 uppercase border-b border-gray-300 pb-1 text-[11px]">3. Laudo Técnico e Recomendações</h4>
                  <p className="text-justify text-sm leading-relaxed text-gray-800 indent-8 font-serif">
                    {selectedOco.report}
                  </p>
                </div>

                {/* Encaminhamento Legal */}
                {selectedOco.referralDest && selectedOco.referralDest !== 'none' && (
                  <div className="space-y-3">
                    <h4 className="font-sans font-bold text-gray-900 uppercase border-b border-gray-300 pb-1 text-[11px]">4. Encaminhamento e Despacho Jurídico</h4>
                    <div className="text-sm space-y-1.5 text-gray-800">
                      <p>Fica este laudo despachado e encaminhado formalmente ao órgão: <strong>{
                        selectedOco.referralDest === 'mpto' ? 'Procuradoria de Justiça (MPTO)' :
                        selectedOco.referralDest === 'iphan' ? 'IPHAN (Órgão Federal)' :
                        selectedOco.referralDest === 'secult' ? 'SECULT (Estadual/TO)' : 'Delegacia de Polícia Civil (Crimes Ambientais)'
                      }</strong>.</p>
                      {selectedOco.referralCaseNumber && (
                        <p>Vinculado ao inquérito/ofício de acompanhamento de nº: <strong>{selectedOco.referralCaseNumber}</strong>.</p>
                      )}
                      {selectedOco.referralNotes && (
                        <div className="p-3 bg-gray-50 border border-gray-200 rounded text-xs mt-1 italic text-justify text-gray-700 font-sans">
                          <strong>Despacho Oficial:</strong> "{selectedOco.referralNotes}"
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Linha de Rastreabilidade para Auditoria */}
                <div className="space-y-2 text-[10px] text-gray-500 font-sans border-t border-gray-200 pt-3">
                  <p className="font-bold uppercase tracking-wider">Histórico de Auditoria e Assinatura Digital do Protocolo:</p>
                  <ul className="list-disc list-inside space-y-0.5">
                    {selectedOco.timeline && selectedOco.timeline.map((step: any, idx: number) => (
                      <li key={idx}>
                        {new Date(step.date).toLocaleDateString('pt-BR')} {new Date(step.date).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})} - <strong>{step.status}</strong>: {step.description} {step.user ? `(Por: ${step.user})` : ''}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Assinatura */}
                <div className="pt-12 text-center flex flex-col items-center space-y-1 font-sans text-xs">
                  <div className="w-64 border-b border-black"></div>
                  <p className="font-bold text-gray-900 uppercase mt-2">{selectedOco.auditor || 'Fiscal do Caoma'}</p>
                  <p className="text-gray-500">Auditor Técnico de Fiscalização do Patrimônio</p>
                  <p className="text-[10px] text-gray-400 mt-2 font-mono">Assinado Digitalmente nos termos da MP nº 2.200-2/2001</p>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
