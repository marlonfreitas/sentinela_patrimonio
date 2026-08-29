import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Asset, TriageItem, Occurrence } from '../types';
import { supabase } from '../lib/supabaseClient';

interface DataContextType {
  assets: Asset[];
  triageItems: TriageItem[];
  occurrences: Occurrence[];
  addAsset: (asset: Omit<Asset, 'id' | 'lastAudit'>) => void;
  updateAsset: (id: string, updated: Partial<Asset>) => void;
  approveTriageItem: (id: string, category: 'material' | 'natural' | 'arqueologico', customAssetId?: string) => void;
  archiveTriageItem: (id: string) => void;
  addOccurrence: (occurrence: Omit<Occurrence, 'id'>) => void;
  updateOccurrenceStatus: (id: string, status: Occurrence['status'], auditor?: string, report?: string) => void;
  scheduleAudit: (id: string, date: string, auditor: string) => void;
  addCitizenTriage: (item: Omit<TriageItem, 'id' | 'status' | 'date' | 'timeline'>) => { id: string; accessKey?: string };
  updateOccurrenceReferral: (id: string, referralDest: Occurrence['referralDest'], referralCaseNumber?: string, referralNotes?: string) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

// --- MAPEADORES DE DADOS (DB <-> TypeScript) ---

const mapAssetFromDb = (db: any): Asset => ({
  id: db.id,
  name: db.name,
  category: db.category,
  location: db.location,
  coordinates: db.coordinates as [number, number],
  status: db.status,
  description: db.description || '',
  lastAudit: db.last_audit,
  yearBuilt: db.year_built ?? undefined,
  source: db.source ?? undefined,
  geometryType: db.geometry_type ?? undefined,
  polygonCoords: db.polygon_coords ?? undefined
});

const mapAssetToDb = (asset: any) => ({
  id: asset.id,
  name: asset.name,
  category: asset.category,
  location: asset.location,
  coordinates: asset.coordinates,
  status: asset.status,
  description: asset.description,
  last_audit: asset.lastAudit,
  year_built: asset.yearBuilt || null,
  source: asset.source || 'suggestion',
  geometry_type: asset.geometryType || 'point',
  polygon_coords: asset.polygonCoords || null
});

const mapTriageFromDb = (db: any): TriageItem => ({
  id: db.id,
  assetName: db.asset_name,
  date: db.date,
  description: db.description,
  urgency: db.urgency,
  iaSuggestion: db.ia_suggestion,
  status: db.status,
  location: db.location,
  coordinates: db.coordinates ? (db.coordinates as [number, number]) : undefined,
  anonymity: db.anonymity,
  reporterName: db.reporter_name ?? undefined,
  reporterContact: db.reporter_contact ?? undefined,
  timeline: db.timeline || [],
  accessKey: db.access_key ?? undefined,
  photos: db.photos ?? undefined
});

const mapTriageToDb = (item: any) => ({
  id: item.id,
  asset_name: item.assetName,
  date: item.date,
  description: item.description,
  urgency: item.urgency,
  ia_suggestion: item.iaSuggestion,
  status: item.status,
  location: item.location,
  coordinates: item.coordinates || null,
  anonymity: item.anonymity,
  reporter_name: item.reporterName || null,
  reporter_contact: item.reporterContact || null,
  timeline: item.timeline || [],
  access_key: item.accessKey || null,
  photos: item.photos || null
});

const mapOccurrenceFromDb = (db: any): Occurrence => ({
  id: db.id,
  assetId: db.asset_id,
  assetName: db.asset_name,
  title: db.title,
  description: db.description,
  date: db.date,
  type: db.type,
  status: db.status,
  severity: db.severity,
  auditor: db.auditor ?? undefined,
  nextAuditDate: db.next_audit_date ?? undefined,
  report: db.report ?? undefined,
  referralDest: db.referral_dest ?? undefined,
  referralCaseNumber: db.referral_case_number ?? undefined,
  referralNotes: db.referral_notes ?? undefined,
  timeline: db.timeline || []
});

const mapOccurrenceToDb = (o: any) => ({
  id: o.id,
  asset_id: o.assetId,
  asset_name: o.assetName,
  title: o.title,
  description: o.description,
  date: o.date,
  type: o.type,
  status: o.status,
  severity: o.severity,
  auditor: o.auditor || null,
  next_audit_date: o.nextAuditDate || null,
  report: o.report || null,
  referral_dest: o.referral_dest || 'none',
  referral_case_number: o.referral_case_number || null,
  referral_notes: o.referral_notes || null,
  timeline: o.timeline || []
});

// --- MOCKS PARA SEMEADURA INICIAL ---

const initialAssetsSeed: Asset[] = [
  {
    id: 'PAT-4092',
    name: 'Igreja Matriz de Nossa Senhora da Natividade',
    category: 'material',
    location: 'Natividade - Centro Histórico',
    coordinates: [-11.7061, -47.7275],
    status: 'stable',
    description: 'Construção do século XVIII, marco histórico e religioso do Tocantins.',
    lastAudit: '2026-08-15',
    yearBuilt: 1759,
    source: 'iphan',
    geometryType: 'point'
  },
  {
    id: 'PAT-3811',
    name: 'Parque Estadual do Jalapão',
    category: 'natural',
    location: 'Mateiros - Jalapão',
    coordinates: [-10.5482, -46.4173],
    status: 'stable',
    description: 'Unidade de conservação de proteção integral com dunas e fervedouros.',
    lastAudit: '2026-07-22',
    source: 'state',
    geometryType: 'polygon',
    polygonCoords: [
      [-10.4500, -46.6000],
      [-10.4500, -46.2000],
      [-10.6500, -46.2000],
      [-10.6500, -46.6000]
    ]
  },
  {
    id: 'PAT-5012',
    name: 'Catedral de Nossa Senhora das Mercês',
    category: 'material',
    location: 'Porto Nacional - Centro',
    coordinates: [-10.7082, -48.4172],
    status: 'warning',
    description: 'Catedral histórica datada do início do século XX, com arquitetura francesa.',
    lastAudit: '2026-08-10',
    yearBuilt: 1904,
    source: 'iphan',
    geometryType: 'point'
  },
  {
    id: 'PAT-6120',
    name: 'Sítio Arqueológico Gruta dos Desenhos',
    category: 'arqueologico',
    location: 'Natividade - Serra',
    coordinates: [-11.6950, -47.7120],
    status: 'critical',
    description: 'Sítio arqueológico com inscrições rupestres pré-históricas em rocha arenítica.',
    lastAudit: '2026-08-01',
    source: 'state',
    geometryType: 'polygon',
    polygonCoords: [
      [-11.6800, -47.7250],
      [-11.6800, -47.7000],
      [-11.7100, -47.7000],
      [-11.7100, -47.7250]
    ]
  },
  {
    id: 'PAT-7491',
    name: 'Monumento à Bíblia - Praça dos Girassóis',
    category: 'material',
    location: 'Palmas - Centro',
    coordinates: [-10.1843, -48.3336],
    status: 'stable',
    description: 'Monumento localizado na maior praça pública da América Latina.',
    lastAudit: '2026-06-18',
    yearBuilt: 2000,
    source: 'municipal',
    geometryType: 'point'
  }
];

const initialTriageSeed: TriageItem[] = [
  {
    id: 'DEN-1023',
    assetName: 'Catedral de Porto Nacional',
    date: '2026-08-25T09:45:00Z',
    description: 'Infiltração grave identificada na parede lateral direita e desgaste de reboco histórico devido à umidade ascendente.',
    urgency: 'high',
    iaSuggestion: 'Degradação',
    status: 'pending',
    location: 'Porto Nacional - Centro',
    coordinates: [-10.7082, -48.4172],
    anonymity: 'confidential',
    reporterName: 'Carlos Mendonça',
    reporterContact: 'carlos.mendonca@gmail.com',
    timeline: [
      { status: 'Envio', date: '2026-08-25T09:45:00Z', description: 'Denúncia sigilosa recebida via portal público do cidadão.' }
    ]
  },
  {
    id: 'DEN-1024',
    assetName: 'Ruínas de São João',
    date: '2026-08-25T11:20:00Z',
    description: 'Pichações e vandalismo nas ruínas de pedra remanescentes do período colonial na região norte.',
    urgency: 'medium',
    iaSuggestion: 'Vandalismo',
    status: 'pending',
    location: 'Porto Nacional - Zona Rural',
    coordinates: [-10.6500, -48.3800],
    anonymity: 'anonymous',
    timeline: [
      { status: 'Envio', date: '2026-08-25T11:20:00Z', description: 'Denúncia anônima enviada com sucesso.' }
    ]
  },
  {
    id: 'DEN-1025',
    assetName: 'Museu Histórico de Natividade',
    date: '2026-08-24T16:05:00Z',
    description: 'Rachadura estrutural de grande porte apareceu no arco de entrada principal após fortes chuvas de inverno.',
    urgency: 'high',
    iaSuggestion: 'Risco Estrutural',
    status: 'pending',
    location: 'Natividade - Centro',
    coordinates: [-11.7065, -47.7280],
    anonymity: 'identified',
    reporterName: 'Dra. Luiza Castro (Historiadora)',
    reporterContact: 'luiza.castro@cultura.org',
    timeline: [
      { status: 'Envio', date: '2026-08-24T16:05:00Z', description: 'Envio público com dados de contato identificados.' }
    ]
  },
  {
    id: 'DEN-1026',
    assetName: 'Sítio Arqueológico Lajeado',
    date: '2026-08-23T08:30:00Z',
    description: 'Visitação desordenada sem controle técnico está provocando desgaste físico nas gravuras rupestres do piso rochoso.',
    urgency: 'medium',
    iaSuggestion: 'Degradação',
    status: 'pending',
    location: 'Lajeado - Serra do Lajeado',
    coordinates: [-9.7500, -48.3500],
    anonymity: 'anonymous',
    timeline: [
      { status: 'Envio', date: '2026-08-23T08:30:00Z', description: 'Denúncia anônima registrada por cidadão local.' }
    ]
  }
];

const initialOccurrencesSeed: Occurrence[] = [
  {
    id: 'OCO-201',
    assetId: 'PAT-6120',
    assetName: 'Sítio Arqueológico Gruta dos Desenhos',
    title: 'Degradação por intemperismo e falta de proteção',
    description: 'Presença de fuligem nas rochas e desmoronamento parcial da encosta de acesso ao sítio.',
    date: '2026-08-10',
    type: 'Degradação',
    status: 'auditing',
    severity: 'high',
    auditor: 'Dra. Helena Souza (Arqueologia)',
    nextAuditDate: '2026-08-28',
    report: 'Necessidade de isolamento imediato da área de encosta e restrição de turismo.',
    timeline: [
      { status: 'Denúncia Recebida', date: '2026-08-08T10:00:00Z', description: 'Dano reportado por sensor municipal.' },
      { status: 'Triagem e Validação', date: '2026-08-10T09:00:00Z', description: 'Aprovado pelo técnico do Caoma.' },
      { status: 'Vistoria Agendada', date: '2026-08-10T14:30:00Z', description: 'Agendado para 28 de agosto com equipe técnica.' }
    ]
  },
  {
    id: 'OCO-202',
    assetId: 'PAT-5012',
    assetName: 'Catedral de Nossa Senhora das Mercês',
    title: 'Instabilidade na torre sineira',
    description: 'Fissura detectada na junção da torre norte com a nave principal. Ruído de estalo relatado pelos paroquianos.',
    date: '2026-08-14',
    type: 'Risco Estrutural',
    status: 'open',
    severity: 'high',
    nextAuditDate: '2026-09-02',
    timeline: [
      { status: 'Denúncia Recebida', date: '2026-08-12T11:00:00Z', description: 'Denúncia pública sigilosa enviada por paroquiano.' },
      { status: 'Triagem e Abertura', date: '2026-08-14T08:30:00Z', description: 'Ocorrência aberta e designada para vistoria preventiva.' }
    ]
  },
  {
    id: 'OCO-203',
    assetId: 'PAT-4092',
    assetName: 'Igreja Matriz de Nossa Senhora da Natividade',
    title: 'Manutenção Preventiva de Pintura',
    description: 'Descascamento natural da cal na fachada posterior exposta aos ventos e insolação.',
    date: '2026-08-01',
    type: 'Manutenção',
    status: 'resolved',
    severity: 'low',
    auditor: 'Eng. Roberto Lima',
    report: 'Fachada repintada com cal natural conforme especificações técnicas do IPHAN.',
    referralDest: 'secult',
    referralCaseNumber: 'PR-2026.0122',
    referralNotes: 'Notificação expedida para a SECULT/TO recomendando manutenção predial periódica.',
    timeline: [
      { status: 'Denúncia Recebida', date: '2026-07-28T14:00:00Z', description: 'Dano de manutenção apontado por associação cultural.' },
      { status: 'Triagem Concluída', date: '2026-08-01T09:00:00Z', description: 'Aprovada e vistoriada no mesmo dia.' },
      { status: 'Laudo Concluído', date: '2026-08-01T16:00:00Z', description: 'Resolvido. Emitido parecer técnico.' },
      { status: 'Encaminhamento Institucional', date: '2026-08-02T10:00:00Z', description: 'Caso encaminhado para SECULT/TO.' }
    ]
  }
];

// --- PROVIDER ---

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [triageItems, setTriageItems] = useState<TriageItem[]>([]);
  const [occurrences, setOccurrences] = useState<Occurrence[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const isConfigured = 
          import.meta.env.VITE_SUPABASE_ANON_KEY && 
          import.meta.env.VITE_SUPABASE_ANON_KEY !== 'INSIRA_SUA_CHAVE_ANON_AQUI' &&
          import.meta.env.VITE_SUPABASE_URL;

        if (!isConfigured) {
          console.warn('Supabase não configurado ou chave padrão detectada. Usando fallback local.');
          await loadLocalFallback();
          return;
        }

        const { data: dbAssets, error: assetsError } = await supabase.from('assets').select('*');
        if (assetsError) throw assetsError;

        const { data: dbTriage, error: triageError } = await supabase.from('triage_items').select('*');
        if (triageError) throw triageError;

        const { data: dbOccurrences, error: ocoError } = await supabase.from('occurrences').select('*');
        if (ocoError) throw ocoError;

        if (!dbAssets || dbAssets.length === 0) {
          console.log('Banco de dados vazio no Supabase. Iniciando semeadura automática...');
          const loadedAssets = [...initialAssetsSeed];

          try {
            const [arqueologicoData, naturalData, materialData] = await Promise.all([
              fetch('/sitios_arqueologicos.json').then((res) => res.ok ? res.json() : { features: [] }),
              fetch('/patrimonios_naturais.json').then((res) => res.ok ? res.json() : { features: [] }),
              fetch('/patrimonios_materiais.json').then((res) => res.ok ? res.json() : { features: [] })
            ]);

            if (arqueologicoData && arqueologicoData.features) {
              arqueologicoData.features.forEach((feature: any) => {
                const props = feature.properties;
                const coords = feature.geometry.coordinates;
                loadedAssets.push({
                  id: `PAT-${props.id_bem || props.co_iphan}`,
                  name: props.identifica || 'Sítio Arqueológico Sem Nome',
                  category: 'arqueologico',
                  location: props.no_logrado || 'Sem localidade informada',
                  coordinates: [coords[1], coords[0]],
                  status: 'stable',
                  description: `Sítio arqueológico federal de código ${props.co_iphan || ''} cadastrado junto ao IPHAN. Tipo: ${props.ds_tipo_be || 'Sítio'}. Natureza: ${props.ds_naturez || 'Bem Arqueológico'}.`,
                  lastAudit: props.dt_cadastr || '2019-05-10',
                  source: 'iphan',
                  geometryType: 'point'
                });
              });
            }

            if (naturalData && naturalData.features) {
              naturalData.features.forEach((feature: any) => {
                const props = feature.properties;
                const coords = feature.geometry.coordinates;
                loadedAssets.push({
                  id: `PAT-${props.id_bem}`,
                  name: props.identifica,
                  category: 'natural',
                  location: props.no_logrado || 'Sem localidade informada',
                  coordinates: [coords[1], coords[0]],
                  status: 'stable',
                  description: props.desc || `Área de preservação ambiental no Tocantins de classificação ${props.codigo_iph || 'UC'}.`,
                  lastAudit: props.dt_cadastr || '2020-01-01',
                  source: 'state',
                  geometryType: 'point'
                });
              });
            }

            if (materialData && materialData.features) {
              materialData.features.forEach((feature: any) => {
                const props = feature.properties;
                const coords = feature.geometry.coordinates;
                loadedAssets.push({
                  id: `PAT-${props.id_bem}`,
                  name: props.identifica,
                  category: 'material',
                  location: props.no_logrado || 'Sem localidade informada',
                  coordinates: [coords[1], coords[0]],
                  status: 'stable',
                  description: props.desc || `Edificação de valor histórico e arquitetônico tombada.`,
                  lastAudit: props.dt_cadastr || '2020-01-01',
                  source: props.codigo_iph === 'IPHAN' ? 'iphan' : 'state',
                  geometryType: 'point'
                });
              });
            }
          } catch (e) {
            console.error('Falha ao processar arquivos GeoJSON locais para semeadura:', e);
          }

          await supabase.from('assets').insert(loadedAssets.map(mapAssetToDb));
          await supabase.from('triage_items').insert(initialTriageSeed.map(mapTriageToDb));
          await supabase.from('occurrences').insert(initialOccurrencesSeed.map(mapOccurrenceToDb));

          setAssets(loadedAssets);
          setTriageItems(initialTriageSeed);
          setOccurrences(initialOccurrencesSeed);
        } else {
          setAssets(dbAssets.map(mapAssetFromDb));
          setTriageItems(dbTriage ? dbTriage.map(mapTriageFromDb) : []);
          setOccurrences(dbOccurrences ? dbOccurrences.map(mapOccurrenceFromDb) : []);
        }
      } catch (err) {
        console.error('Erro ao ler do Supabase. Usando fallback local...', err);
        await loadLocalFallback();
      }
    };

    const loadLocalFallback = async () => {
      setAssets(initialAssetsSeed);
      setTriageItems(initialTriageSeed);
      setOccurrences(initialOccurrencesSeed);
    };

    loadData();
  }, []);

  // Sincronizar localmente os status dos bens com base nas ocorrências ativas
  useEffect(() => {
    setAssets(prevAssets => {
      return prevAssets.map(asset => {
        const activeOcos = occurrences.filter(o => o.assetId === asset.id && o.status !== 'resolved');
        if (activeOcos.length === 0) return { ...asset, status: 'stable' };
        const hasHigh = activeOcos.some(o => o.severity === 'high');
        return { ...asset, status: hasHigh ? 'critical' : 'warning' };
      });
    });
  }, [occurrences]);

  // Função auxiliar para atualizar o status do bem no Supabase ao alterar ocorrências
  const syncAssetStatusInDb = async (assetId: string, currentOccurrences: Occurrence[]) => {
    const activeOcos = currentOccurrences.filter(o => o.assetId === assetId && o.status !== 'resolved');
    let newStatus: 'stable' | 'warning' | 'critical' = 'stable';
    if (activeOcos.length > 0) {
      newStatus = activeOcos.some(o => o.severity === 'high') ? 'critical' : 'warning';
    }
    const isConfigured = import.meta.env.VITE_SUPABASE_ANON_KEY && import.meta.env.VITE_SUPABASE_ANON_KEY !== 'INSIRA_SUA_CHAVE_ANON_AQUI';
    if (isConfigured) {
      await supabase.from('assets').update({ status: newStatus }).eq('id', assetId);
    }
  };

  const addAsset = async (newAsset: Omit<Asset, 'id' | 'lastAudit'>) => {
    const id = `PAT-${Math.floor(1000 + Math.random() * 9000)}`;
    const asset: Asset = { ...newAsset, id, lastAudit: new Date().toISOString().split('T')[0], source: newAsset.source || 'suggestion', geometryType: newAsset.geometryType || 'point' };
    setAssets(prev => [...prev, asset]);
    const isConfigured = import.meta.env.VITE_SUPABASE_ANON_KEY && import.meta.env.VITE_SUPABASE_ANON_KEY !== 'INSIRA_SUA_CHAVE_ANON_AQUI';
    if (isConfigured) {
      const { error } = await supabase.from('assets').insert(mapAssetToDb(asset));
      if (error) console.error('Erro ao cadastrar bem no Supabase:', error);
    }
  };

  const updateAsset = async (id: string, updated: Partial<Asset>) => {
    setAssets(prev => prev.map(a => a.id === id ? { ...a, ...updated } : a));
    const isConfigured = import.meta.env.VITE_SUPABASE_ANON_KEY && import.meta.env.VITE_SUPABASE_ANON_KEY !== 'INSIRA_SUA_CHAVE_ANON_AQUI';
    if (isConfigured) {
      const asset = assets.find(a => a.id === id);
      if (asset) {
        const { error } = await supabase.from('assets').update(mapAssetToDb({ ...asset, ...updated })).eq('id', id);
        if (error) console.error('Erro ao atualizar bem no Supabase:', error);
      }
    }
  };

  const approveTriageItem = async (id: string, category: 'material' | 'natural' | 'arqueologico', customAssetId?: string) => {
    const item = triageItems.find(t => t.id === id);
    if (!item) return;
    let targetAssetId = customAssetId;
    const dateStr = new Date().toISOString().split('T')[0];
    const timestamp = new Date().toISOString();
    const isConfigured = import.meta.env.VITE_SUPABASE_ANON_KEY && import.meta.env.VITE_SUPABASE_ANON_KEY !== 'INSIRA_SUA_CHAVE_ANON_AQUI';

    if (!targetAssetId) {
      const newAssetId = `PAT-${Math.floor(1000 + Math.random() * 9000)}`;
      const newAsset: Asset = { id: newAssetId, name: item.assetName, category, location: item.location, coordinates: item.coordinates || [-10.249, -48.324], status: item.urgency === 'high' ? 'critical' : 'warning', description: `Denúncia aprovada: ${item.description}`, lastAudit: dateStr, source: 'suggestion', geometryType: 'point' };
      setAssets(prev => [...prev, newAsset]);
      if (isConfigured) {
        const { error } = await supabase.from('assets').insert(mapAssetToDb(newAsset));
        if (error) console.error('Erro ao cadastrar novo bem na aprovação no Supabase:', error);
      }
      targetAssetId = newAssetId;
    }

    const ocoId = `OCO-${Math.floor(200 + Math.random() * 800)}`;
    const updatedTriageTimeline = [...item.timeline, { status: 'Triagem Aprovada', date: timestamp, description: `Ocorrência ${ocoId} criada.` }];
    const newOco: Occurrence = { id: ocoId, assetId: targetAssetId!, assetName: item.assetName, title: `${item.iaSuggestion} - ${item.assetName}`, description: item.description, date: dateStr, type: item.iaSuggestion, status: 'open', severity: item.urgency, timeline: updatedTriageTimeline.map(t => ({ ...t, user: 'Sistema' })) };
    const nextOccurrences = [...occurrences, newOco];
    setOccurrences(nextOccurrences);
    setTriageItems(prev => prev.map(t => t.id === id ? { ...t, status: 'approved', timeline: updatedTriageTimeline } : t));
    if (isConfigured) {
      const { error: errorOco } = await supabase.from('occurrences').insert(mapOccurrenceToDb(newOco));
      if (errorOco) console.error('Erro ao inserir ocorrência na aprovação no Supabase:', errorOco);
      
      const { error: errorTriage } = await supabase.from('triage_items').update({ status: 'approved', timeline: updatedTriageTimeline }).eq('id', id);
      if (errorTriage) console.error('Erro ao atualizar denúncia na aprovação no Supabase:', errorTriage);
      
      await syncAssetStatusInDb(targetAssetId!, nextOccurrences);
    }
  };

  const archiveTriageItem = async (id: string) => {
    const timestamp = new Date().toISOString();
    const item = triageItems.find(t => t.id === id);
    if (!item) return;
    const updatedTimeline = [...item.timeline, { status: 'Arquivado', date: timestamp, description: 'Denúncia arquivada.' }];
    setTriageItems(prev => prev.map(t => t.id === id ? { ...t, status: 'archived', timeline: updatedTimeline } : t));
    const isConfigured = import.meta.env.VITE_SUPABASE_ANON_KEY && import.meta.env.VITE_SUPABASE_ANON_KEY !== 'INSIRA_SUA_CHAVE_ANON_AQUI';
    if (isConfigured) {
      const { error } = await supabase.from('triage_items').update({ status: 'archived', timeline: updatedTimeline }).eq('id', id);
      if (error) console.error('Erro ao arquivar denúncia no Supabase:', error);
    }
  };

  const addOccurrence = async (newOco: Omit<Occurrence, 'id'>) => {
    const id = `OCO-${Math.floor(200 + Math.random() * 800)}`;
    const occurrence: Occurrence = { ...newOco, id, timeline: [{ status: 'Registrado', date: new Date().toISOString(), description: 'Criado pelo sistema.' }] };
    const nextOccurrences = [...occurrences, occurrence];
    setOccurrences(nextOccurrences);
    const isConfigured = import.meta.env.VITE_SUPABASE_ANON_KEY && import.meta.env.VITE_SUPABASE_ANON_KEY !== 'INSIRA_SUA_CHAVE_ANON_AQUI';
    if (isConfigured) {
      const { error } = await supabase.from('occurrences').insert(mapOccurrenceToDb(occurrence));
      if (error) console.error('Erro ao adicionar ocorrência no Supabase:', error);
      await syncAssetStatusInDb(occurrence.assetId, nextOccurrences);
    }
  };

  const updateOccurrenceStatus = async (id: string, status: Occurrence['status'], auditor?: string, report?: string) => {
    const o = occurrences.find(occ => occ.id === id);
    if (!o) return;
    const updatedTimeline = [...o.timeline, { status: status === 'resolved' ? 'Resolvido' : status, date: new Date().toISOString(), description: status === 'resolved' ? 'Laudo emitido.' : 'Status alterado.', user: auditor || 'Técnico' }];
    const updatedFields = { status, auditor, report, timeline: updatedTimeline };
    const nextOccurrences = occurrences.map(occ => occ.id === id ? { ...occ, ...updatedFields } : occ);
    setOccurrences(nextOccurrences);
    const isConfigured = import.meta.env.VITE_SUPABASE_ANON_KEY && import.meta.env.VITE_SUPABASE_ANON_KEY !== 'INSIRA_SUA_CHAVE_ANON_AQUI';
    if (isConfigured) {
      const { error } = await supabase.from('occurrences').update(mapOccurrenceToDb({ ...o, ...updatedFields })).eq('id', id);
      if (error) console.error('Erro ao atualizar status da ocorrência no Supabase:', error);
      await syncAssetStatusInDb(o.assetId, nextOccurrences);
    }
  };

  const scheduleAudit = async (id: string, date: string, auditor: string) => {
    const o = occurrences.find(occ => occ.id === id);
    if (!o) return;
    const updatedFields = { status: 'auditing' as const, nextAuditDate: date, auditor, timeline: [...o.timeline, { status: 'Vistoria Agendada', date: new Date().toISOString(), description: `Vistoria em ${date}`, user: auditor }] };
    const nextOccurrences = occurrences.map(occ => occ.id === id ? { ...occ, ...updatedFields } : occ);
    setOccurrences(nextOccurrences);
    const isConfigured = import.meta.env.VITE_SUPABASE_ANON_KEY && import.meta.env.VITE_SUPABASE_ANON_KEY !== 'INSIRA_SUA_CHAVE_ANON_AQUI';
    if (isConfigured) {
      const { error } = await supabase.from('occurrences').update(mapOccurrenceToDb({ ...o, ...updatedFields })).eq('id', id);
      if (error) console.error('Erro ao agendar vistoria da ocorrência no Supabase:', error);
      await syncAssetStatusInDb(o.assetId, nextOccurrences);
    }
  };

  const addCitizenTriage = (item: Omit<TriageItem, 'id' | 'status' | 'date' | 'timeline'>) => {
    const id = `DEN-${Math.floor(1000 + Math.random() * 9000)}`;
    const accessKey = item.anonymity === 'anonymous' ? `KEY-${Math.floor(1000 + Math.random() * 9000)}` : undefined;
    const newTriage: TriageItem = { ...item, id, date: new Date().toISOString(), status: 'pending', accessKey, timeline: [{ status: 'Envio', date: new Date().toISOString(), description: 'Denúncia recebida.' }] };
    setTriageItems(prev => [newTriage, ...prev]);
    const isConfigured = import.meta.env.VITE_SUPABASE_ANON_KEY && import.meta.env.VITE_SUPABASE_ANON_KEY !== 'INSIRA_SUA_CHAVE_ANON_AQUI';
    if (isConfigured) {
      supabase.from('triage_items').insert(mapTriageToDb(newTriage)).then(({ error }) => {
        if (error) console.error('Erro ao enviar denúncia para o Supabase:', error);
      });
    }
    return { id, accessKey };
  };

  const updateOccurrenceReferral = async (id: string, referralDest: Occurrence['referralDest'], referralCaseNumber?: string, referralNotes?: string) => {
    const o = occurrences.find(occ => occ.id === id);
    if (!o) return;
    const updatedFields = { referralDest, referralCaseNumber, referralNotes, timeline: [...o.timeline, { status: 'Encaminhamento', date: new Date().toISOString(), description: 'Encaminhado.' }] };
    setOccurrences(prev => prev.map(occ => occ.id === id ? { ...occ, ...updatedFields } : occ));
    const isConfigured = import.meta.env.VITE_SUPABASE_ANON_KEY && import.meta.env.VITE_SUPABASE_ANON_KEY !== 'INSIRA_SUA_CHAVE_ANON_AQUI';
    if (isConfigured) {
      const { error } = await supabase.from('occurrences').update(mapOccurrenceToDb({ ...o, ...updatedFields })).eq('id', id);
      if (error) console.error('Erro ao encaminhar ocorrência no Supabase:', error);
    }
  };

  return (
    <DataContext.Provider value={{ assets, triageItems, occurrences, addAsset, updateAsset, approveTriageItem, archiveTriageItem, addOccurrence, updateOccurrenceStatus, scheduleAudit, addCitizenTriage, updateOccurrenceReferral }}>
      {children}
    </DataContext.Provider>
  );
};
