export interface Asset {
  id: string;
  name: string;
  category: 'material' | 'natural' | 'arqueologico';
  location: string;
  coordinates: [number, number]; // [latitude, longitude]
  status: 'stable' | 'warning' | 'critical';
  description: string;
  lastAudit: string;
  yearBuilt?: number;
  // Campos alinhados ao escopo do PDF da FABrandt (Seções 6.3, 10 e 18)
  source?: 'iphan' | 'state' | 'municipal' | 'suggestion';
  geometryType?: 'point' | 'polygon';
  polygonCoords?: [number, number][]; // Coordenadas para desenhar o polígono no mapa
}


export interface TriageItem {
  id: string;
  assetName: string;
  date: string;
  description: string;
  urgency: 'low' | 'medium' | 'high';
  iaSuggestion: 'Vandalismo' | 'Degradação' | 'Risco Estrutural' | 'Outros';
  status: 'pending' | 'approved' | 'archived';
  location: string;
  coordinates?: [number, number];
  anonymity: 'anonymous' | 'confidential' | 'identified';
  reporterName?: string;
  reporterContact?: string;
  timeline: { status: string; date: string; description: string }[];
  accessKey?: string; // Chave de acesso para denúncia anônima
  photos?: string[];  // Lista de fotos anexadas (URLs ou nomes de arquivos)
}

export interface Occurrence {
  id: string;
  assetId: string;
  assetName: string;
  title: string;
  description: string;
  date: string;
  type: string;
  status: 'open' | 'auditing' | 'resolved';
  severity: 'low' | 'medium' | 'high';
  auditor?: string;
  nextAuditDate?: string;
  report?: string;
  referralDest?: 'mpto' | 'iphan' | 'secult' | 'police' | 'none';
  referralCaseNumber?: string;
  referralNotes?: string;
  timeline: { status: string; date: string; description: string; user?: string }[];
}
