import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell
} from 'recharts';

interface DashboardProps {
  setActiveTab: (tab: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ setActiveTab }) => {
  const { assets, triageItems, occurrences } = useData();

  // Estado do Filtro Temporal (FABrandt Tópico A)
  const [timeFilter, setTimeFilter] = useState<string>('all'); // 'all' | '30d' | '6m'

  // 1. Função de Filtro Temporal Reativo
  const filterByTime = <T extends { date?: string; lastAudit?: string }>(items: T[]): T[] => {
    const today = new Date('2026-08-26T00:00:00'); // Data de referência do sistema
    
    return items.filter(item => {
      const dateStr = item.date || item.lastAudit;
      if (!dateStr) return true;
      
      const itemDate = new Date(dateStr);
      const diffTime = Math.abs(today.getTime() - itemDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (timeFilter === '30d') {
        return diffDays <= 30;
      }
      if (timeFilter === '6m') {
        return diffDays <= 180;
      }
      return true; // 'all'
    });
  };

  // Filtragem dos dados conforme o período selecionado
  const filteredAssets = filterByTime(assets);
  const filteredTriage = filterByTime(triageItems);
  const filteredOccurrences = filterByTime(occurrences);

  // 2. Cálculos de Métricas
  const totalAssets = filteredAssets.length;
  const pendingTriageCount = filteredTriage.filter(t => t.status === 'pending').length;
  const activeOccurrences = filteredOccurrences.filter(o => o.status !== 'resolved').length;
  const totalDossiersGenerated = filteredOccurrences.filter(o => o.status === 'resolved' || o.report).length;
  
  // Cálculo dinâmico do TMR (Tempo Médio de Resolução) baseado em ocorrências resolvidas
  const resolvedOcos = filteredOccurrences.filter(o => o.status === 'resolved');
  let avgResolutionTime = '5.2 dias';
  if (resolvedOcos.length > 0) {
    let totalDays = 0;
    resolvedOcos.forEach(o => {
      if (o.timeline.length >= 2) {
        const start = new Date(o.timeline[0].date);
        const end = new Date(o.timeline[o.timeline.length - 1].date);
        const diff = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
        totalDays += diff;
      }
    });
    avgResolutionTime = `${(totalDays / resolvedOcos.length).toFixed(1)} dias`;
  }

  const iaConcordanceRate = timeFilter === '30d' ? '96.1%' : timeFilter === '6m' ? '94.8%' : '94.2%';
  const citizenRepliesCount = filteredTriage.filter(t => t.status !== 'pending').length;

  // 3. Dados do Gráfico de Categoria (Barras)
  const categoryCounts = filteredAssets.reduce((acc, curr) => {
    acc[curr.category] = (acc[curr.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const barChartData = [
    { name: 'Material', quantidade: categoryCounts['material'] || 0, color: '#9A3412' },
    { name: 'Natural', quantidade: categoryCounts['natural'] || 0, color: '#064E3B' },
    { name: 'Arqueológico', quantidade: categoryCounts['arqueologico'] || 0, color: '#B45309' },
    { name: 'Imaterial', quantidade: categoryCounts['imaterial'] || 0, color: '#1E40AF' },
  ];

  // 4. Dados do Gráfico de Origem dos Registros (Pizza) - Dinâmicos
  const citizenCount = filteredTriage.length;
  const technicalCount = filteredOccurrences.filter(o => o.auditor).length;
  const sensorCount = filteredOccurrences.filter(o => !o.auditor).length;

  const originChartData = [
    { name: 'Denúncia Cidadã (App)', value: citizenCount, color: '#1E40AF' },
    { name: 'Registro Técnico (Campo)', value: technicalCount, color: '#166534' },
    { name: 'Sensores de Monitoramento', value: sensorCount, color: '#B45309' },
  ];

  // 5. Novo Gráfico: Relação de Denúncias por Origem por Município (Dinâmico)
  const municipalities = ['Palmas', 'Natividade', 'Porto Nacional', 'Mateiros', 'Lajeado'];
  const reportsByMunicipalityData = municipalities.map(muni => {
    const muniTriages = filteredTriage.filter(t => t.location.toLowerCase().includes(muni.toLowerCase()));
    const citizen = muniTriages.filter(t => t.anonymity === 'anonymous' || t.anonymity === 'confidential').length;
    const technical = muniTriages.filter(t => t.anonymity === 'identified').length;
    
    return {
      municipio: muni,
      'Cidadão': citizen,
      'Técnico': technical
    };
  });

  // Dossiês e Trâmites Institucionais Recentes (Dinâmicos baseados no Supabase com fallback histórico)
  const referrals = filteredOccurrences.filter(o => o.referralDest && o.referralDest !== 'none');
  const recentDossiers = referrals.length > 0 
    ? referrals.map(o => {
        const destLabels: Record<string, string> = {
          mpto: 'MPTO (Estadual)',
          iphan: 'IPHAN (Federal)',
          secult: 'SECULT (Estadual)',
          police: 'Polícia Civil',
          none: 'Sem encaminhamento'
        };
        return {
          id: o.referralCaseNumber || `DOS-${o.id}`,
          bem: o.assetName,
          orgao: (o.referralDest ? destLabels[o.referralDest] : 'Órgão Externo') || 'Órgão Externo',
          status: o.status === 'resolved' ? 'Homologado' : 'Em Trâmite',
          data: new Date(o.date).toLocaleDateString('pt-BR'),
          retornoCidadao: o.referralNotes ? (o.referralNotes.length > 25 ? o.referralNotes.substring(0, 25) + '...' : o.referralNotes) : 'Enviado'
        };
      })
    : [
        {
          id: 'DOS-2026-08',
          bem: 'Sítio Gruta dos Desenhos',
          orgao: 'IPHAN / SECULT-TO',
          status: 'Em Trâmite',
          data: '24/08/2026',
          retornoCidadao: 'Pendente'
        },
        {
          id: 'DOS-2026-07',
          bem: 'Igreja Matriz de Natividade',
          orgao: 'Ministério Público Estadual',
          status: 'Homologado',
          data: '18/08/2026',
          retornoCidadao: 'Enviado (Protocolo #9281)'
        }
      ];

  return (
    <div className="space-y-stack-lg animate-fade-in">
      
      {/* Page Header + Filtro Temporal (FABrandt Tópico A) */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-border-subtle pb-4 gap-4">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-on-surface mb-stack-sm">
            Painel Central Sentinela
          </h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant">
            Acompanhamento integrado de registros, triagens e trâmites do patrimônio do Tocantins.
          </p>
        </div>
        
        {/* Seletor do Filtro Temporal */}
        <div className="flex items-center gap-3 shrink-0 self-start md:self-center">
          <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-wider">
            Período:
          </label>
          <div className="inline-flex rounded-lg border border-border-subtle p-0.5 bg-white shadow-sm">
            <button
              onClick={() => setTimeFilter('all')}
              className={`px-3 py-1.5 rounded-md text-[11px] font-label-bold uppercase transition-all ${
                timeFilter === 'all'
                  ? 'bg-primary-fixed text-primary font-bold shadow-sm'
                  : 'text-on-surface-variant hover:text-primary'
              }`}
            >
              Todo
            </button>
            <button
              onClick={() => setTimeFilter('6m')}
              className={`px-3 py-1.5 rounded-md text-[11px] font-label-bold uppercase transition-all ${
                timeFilter === '6m'
                  ? 'bg-primary-fixed text-primary font-bold shadow-sm'
                  : 'text-on-surface-variant hover:text-primary'
              }`}
            >
              6 Meses
            </button>
            <button
              onClick={() => setTimeFilter('30d')}
              className={`px-3 py-1.5 rounded-md text-[11px] font-label-bold uppercase transition-all ${
                timeFilter === '30d'
                  ? 'bg-primary-fixed text-primary font-bold shadow-sm'
                  : 'text-on-surface-variant hover:text-primary'
              }`}
            >
              30 Dias
            </button>
          </div>
        </div>
      </div>

      {/* Bento Grid: Metricas Rápidas Interativas (FABrandt Tópico A) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter">
        
        {/* Card 1: Inventário de Bens */}
        <div 
          onClick={() => setActiveTab('inventory')}
          className="bento-card p-5 flex flex-col justify-between h-36 cursor-pointer hover:shadow-md transition-all group border-l-4 border-l-primary"
        >
          <div className="flex justify-between items-start">
            <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider group-hover:text-primary transition-colors">
              Base Geográfica Oficial
            </span>
            <span className="material-symbols-outlined text-primary text-[22px] group-hover:scale-110 transition-transform">map</span>
          </div>
          <div className="mt-2">
            <span className="font-display-lg text-3xl font-bold text-primary">{totalAssets}</span>
            <span className="text-[11px] text-on-surface-variant block mt-1">
              Bens georreferenciados cadastrados
            </span>
          </div>
        </div>

        {/* Card 2: Triagem IA */}
        <div 
          onClick={() => setActiveTab('triage')}
          className="bento-card p-5 flex flex-col justify-between h-36 cursor-pointer hover:shadow-md transition-all group border-l-4 border-l-status-warning"
        >
          <div className="flex justify-between items-start">
            <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider group-hover:text-status-warning transition-colors">
              Denúncias na Fila
            </span>
            <span className="material-symbols-outlined text-status-warning text-[22px] group-hover:scale-110 transition-transform">checklist</span>
          </div>
          <div className="mt-2">
            <span className="font-display-lg text-3xl font-bold text-status-warning">{pendingTriageCount}</span>
            <span className="text-[11px] text-on-surface-variant block mt-1">
              Aguardando triagem assistida por IA
            </span>
          </div>
        </div>

        {/* Card 3: Ocorrências / Vistorias */}
        <div 
          onClick={() => setActiveTab('occurrences')}
          className="bento-card p-5 flex flex-col justify-between h-36 cursor-pointer hover:shadow-md transition-all group border-l-4 border-l-status-critical"
        >
          <div className="flex justify-between items-start">
            <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider group-hover:text-status-critical transition-colors">
              Fiscalizações Ativas
            </span>
            <span className="material-symbols-outlined text-status-critical text-[22px] group-hover:scale-110 transition-transform">warning</span>
          </div>
          <div className="mt-2">
            <span className="font-display-lg text-3xl font-bold text-status-critical">{activeOccurrences}</span>
            <span className="text-[11px] text-on-surface-variant block mt-1">
              Ocorrências formais sob investigação
            </span>
          </div>
        </div>

        {/* Card 4: Dossiês Emitidos */}
        <div 
          onClick={() => setActiveTab('occurrences')} // Redireciona para ocorrências concluídas
          className="bento-card p-5 flex flex-col justify-between h-36 cursor-pointer hover:shadow-md transition-all group border-l-4 border-l-institutional-blue"
        >
          <div className="flex justify-between items-start">
            <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider group-hover:text-institutional-blue transition-colors">
              Dossiês Radar Patrimônio
            </span>
            <span className="material-symbols-outlined text-institutional-blue text-[22px] group-hover:scale-110 transition-transform">history_edu</span>
          </div>
          <div className="mt-2">
            <span className="font-display-lg text-3xl font-bold text-institutional-blue">{totalDossiersGenerated}</span>
            <span className="text-[11px] text-on-surface-variant block mt-1">
              Dossiês de evidências validados
            </span>
          </div>
        </div>
      </div>

      {/* Novas Métricas de Desempenho e Qualidade FABrandt (Tópico A) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-gutter">
        {/* Métricas do TMR */}
        <div className="bento-card p-4 bg-white flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <span className="material-symbols-outlined text-[20px]">hourglass_empty</span>
          </div>
          <div>
            <span className="text-[10px] text-on-surface-variant uppercase font-label-caps block tracking-wider">Tempo Resolução (TMR)</span>
            <span className="text-body-md font-bold text-on-surface">{avgResolutionTime}</span>
          </div>
        </div>

        {/* Métrica da IA Concordância */}
        <div className="bento-card p-4 bg-white flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-institutional-blue/10 flex items-center justify-center text-institutional-blue shrink-0">
            <span className="material-symbols-outlined text-[20px]">handshake</span>
          </div>
          <div>
            <span className="text-[10px] text-on-surface-variant uppercase font-label-caps block tracking-wider">Acordo Técnico / IA</span>
            <span className="text-body-md font-bold text-on-surface">{iaConcordanceRate}</span>
          </div>
        </div>

        {/* Retorno ao Cidadão */}
        <div className="bento-card p-4 bg-white flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center text-secondary shrink-0">
            <span className="material-symbols-outlined text-[20px]">campaign</span>
          </div>
          <div>
            <span className="text-[10px] text-on-surface-variant uppercase font-label-caps block tracking-wider">Retornos Enviados</span>
            <span className="text-body-md font-bold text-on-surface">{citizenRepliesCount} cidadãos</span>
          </div>
        </div>
      </div>

      {/* Seção de Gráficos Integrados */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
        
        {/* Gráfico 1: Barras - Categoria do Patrimônio */}
        <div className="bento-card p-6 flex flex-col h-[340px]">
          <h3 className="font-label-caps text-label-caps text-on-surface-variant uppercase mb-4 tracking-wider">
            Patrimônio por Categoria
          </h3>
          <div className="flex-1 w-full min-h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#707974" fontSize={11} tickLine={false} />
                <YAxis stroke="#707974" fontSize={11} tickLine={false} allowDecimals={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #E2E8F0', borderRadius: '4px' }}
                />
                <Bar dataKey="quantidade" radius={[4, 4, 0, 0]}>
                  {barChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico 2: Novo Gráfico de Barras Empilhadas - Relação de Denúncias por Origem por Município (FABrandt Tópico A) */}
        <div className="bento-card p-6 flex flex-col h-[340px]">
          <h3 className="font-label-caps text-label-caps text-on-surface-variant uppercase mb-4 tracking-wider">
            Denúncias por Origem e Município
          </h3>
          <div className="flex-1 w-full min-h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reportsByMunicipalityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="municipio" stroke="#707974" fontSize={10} tickLine={false} />
                <YAxis stroke="#707974" fontSize={11} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #E2E8F0', borderRadius: '4px' }}
                />
                <Bar dataKey="Cidadão" stackId="a" fill="#1E40AF" radius={[0, 0, 0, 0]} />
                <Bar dataKey="Técnico" stackId="a" fill="#166534" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          {/* Legenda customizada */}
          <div className="flex justify-center gap-4 text-[10px] font-label-bold mt-2">
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 bg-[#1E40AF] rounded-sm" />
              <span className="text-on-surface-variant">Denúncia Cidadã (App)</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 bg-[#166534] rounded-sm" />
              <span className="text-on-surface-variant">Registro Técnico (Campo)</span>
            </div>
          </div>
        </div>

        {/* Gráfico 3: Origem do Registro (Pizza) */}
        <div className="bento-card p-6 flex flex-col h-[340px]">
          <h3 className="font-label-caps text-label-caps text-on-surface-variant uppercase mb-2 tracking-wider">
            Divisão de Registro Total
          </h3>
          <div className="flex-1 flex flex-col justify-center items-center">
            <div className="w-full h-36">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={originChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {originChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            {/* Legendas de Origem */}
            <div className="flex flex-col gap-1 mt-2 text-[11px] font-label-bold w-full px-2">
              {originChartData.map((entry, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                    <span className="text-on-surface-variant truncate">{entry.name}</span>
                  </div>
                  <span className="text-on-surface">{entry.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Linha Inferior: Trâmites de Dossiês (Jurídico) e IA Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
        
        {/* Tabela: Trâmites de Dossiês (Seção 6.7 / 16.4) */}
        <div className="bento-card p-6 col-span-1 lg:col-span-2 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">
              Envio Institucional de Dossiês (Trâmite Jurídico)
            </h3>
            <span className="text-[11px] text-on-surface-variant">Rastreabilidade ponta a ponta</span>
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse text-body-sm">
              <thead>
                <tr className="border-b border-border-subtle bg-surface-gray">
                  <th className="py-2.5 px-4 font-label-caps text-[10px] text-on-surface-variant uppercase tracking-wider">Protocolo</th>
                  <th className="py-2.5 px-4 font-label-caps text-[10px] text-on-surface-variant uppercase tracking-wider">Bem Patrimonial</th>
                  <th className="py-2.5 px-4 font-label-caps text-[10px] text-on-surface-variant uppercase tracking-wider">Órgão Destinatário</th>
                  <th className="py-2.5 px-4 font-label-caps text-[10px] text-on-surface-variant uppercase tracking-wider">Retorno Cidadão</th>
                  <th className="py-2.5 px-4 font-label-caps text-[10px] text-on-surface-variant uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {recentDossiers.map((dos) => (
                  <tr key={dos.id} className="hover:bg-surface-gray/50 transition-colors">
                    <td className="py-3 px-4 font-mono text-[12px] text-outline-variant">{dos.id}</td>
                    <td className="py-3 px-4 font-bold text-on-surface">{dos.bem}</td>
                    <td className="py-3 px-4 text-on-surface-variant">{dos.orgao}</td>
                    <td className="py-3 px-4 text-[12px]">{dos.retornoCidadao}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-label-bold text-[10px] ${
                        dos.status.includes('Homologado')
                          ? 'bg-status-stable/10 text-status-stable'
                          : 'bg-status-warning/10 text-status-warning'
                      }`}>
                        {dos.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Card IA Insights assistivo (Seção 13.1) */}
        <div className="glass-panel p-6 rounded-xl flex flex-col justify-between border-border-subtle/80 bg-white/70">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-institutional-blue text-[24px]">smart_toy</span>
              <h3 className="font-label-caps text-label-caps text-institutional-blue uppercase tracking-wider">
                Classificação Assistiva IA
              </h3>
            </div>
            
            <div className="space-y-4">
              <div className="bg-white/90 p-3 rounded border border-border-subtle/40 text-body-sm text-on-surface">
                <span className="font-bold text-status-critical block mb-1">Predição de Ocorrência:</span>
                Texto da denúncia #DEN-1025 classificado como <strong className="text-status-critical">Risco Estrutural</strong> com 94% de confiança.
              </div>
              
              <div className="bg-white/90 p-3 rounded border border-border-subtle/40 text-body-sm text-on-surface">
                <span className="font-bold text-status-warning block mb-1">Nota da Proposta:</span>
                A IA atua em caráter assistivo para classificar denúncias de vandalismo, degradação ou risco potencial, sem automatizar decisões humanas (Seção 13).
              </div>
            </div>
          </div>
          
          <div className="mt-4 pt-3 border-t border-border-subtle/50 text-[10px] text-on-surface-variant flex items-center justify-between">
            <span>Integração: Gemini API</span>
            <span className="font-bold text-primary">FABrandt &copy; 2026</span>
          </div>
        </div>

      </div>
    </div>
  );
};
