import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polygon, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useData } from '../../context/DataContext';
import type { Asset } from '../../types';

// Função auxiliar para centralizar ou mover o mapa dinamicamente
const ChangeView: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  map.setView(center, zoom);
  return null;
};

export const Map: React.FC = () => {
  const { assets, occurrences } = useData();

  // Estados locais dos filtros de mapa (FABrandt Sec. 6.3 / 9 / 10)
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [selectedStatus, setSelectedStatus] = useState<string>('Todos');
  const [selectedSource, setSelectedSource] = useState<string>('Todos'); // Oficial vs Sugestão

  const [mapCenter, setMapCenter] = useState<[number, number]>([-10.249, -48.324]); // Palmas/TO
  const [mapZoom, setMapZoom] = useState<number>(7);

  // Filtragem dos bens para exibição no mapa
  const mapAssets = assets.filter(asset => {
    const matchesCategory = selectedCategory === 'Todos' || asset.category === selectedCategory;
    const matchesStatus = selectedStatus === 'Todos' || asset.status === selectedStatus;
    
    // Distinção de fonte (FABrandt Sec 6.3: "separado dos registros operacionais")
    let matchesSource = true;
    if (selectedSource === 'oficial') {
      matchesSource = asset.source === 'iphan' || asset.source === 'state' || asset.source === 'municipal';
    } else if (selectedSource === 'sugestao') {
      matchesSource = asset.source === 'suggestion';
    }

    const hasCoords = asset.coordinates && asset.coordinates[0] !== 0;
    
    return matchesCategory && matchesStatus && matchesSource && hasCoords;
  });

  // Função para criar o ícone customizado baseado no status e categoria (FABrandt Sec 6.8 / 18)
  const createCustomIcon = (status: Asset['status'], category: Asset['category'], source: Asset['source']) => {
    let color = '#059669'; // stable (Verde)
    if (status === 'warning') color = '#D97706'; // warning (Laranja)
    if (status === 'critical') color = '#B91C1C'; // critical (Vermelho)

    let iconSymbol = 'account_balance';
    if (category === 'natural') iconSymbol = 'eco';
    if (category === 'arqueologico') iconSymbol = 'landscape';

    // Se for sugestão cidadã, coloca uma borda tracejada ou estilo distinto
    const borderStyle = source === 'suggestion' ? 'border-dashed border-institutional-blue' : 'border-white';

    return L.divIcon({
      html: `
        <div class="flex items-center justify-center w-8 h-8 rounded-full border-2 ${borderStyle} shadow-lg cursor-pointer transition-transform hover:scale-110" style="background-color: ${color}">
          <span class="material-symbols-outlined text-[16px] text-white font-bold">${iconSymbol}</span>
        </div>
      `,
      className: 'custom-map-marker',
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32],
    });
  };

  const getSourceLabel = (source: Asset['source']) => {
    switch (source) {
      case 'iphan':
        return 'Cadastro Oficial (IPHAN GeoServer)';
      case 'state':
        return 'Cadastro Oficial (Estado/SECULT)';
      case 'municipal':
        return 'Cadastro Oficial (Município)';
      case 'suggestion':
        return 'Sugestão Cidadã (App)';
      default:
        return 'Desconhecido';
    }
  };

  const handleFocusAsset = (coords: [number, number]) => {
    setMapCenter(coords);
    setMapZoom(13);
  };

  // Cores de polígono
  const getPolygonColor = (status: Asset['status']) => {
    if (status === 'critical') return '#B91C1C';
    if (status === 'warning') return '#D97706';
    return '#059669';
  };

  return (
    <div className="relative h-[calc(100vh-8rem)] w-full rounded-xl overflow-hidden border border-border-subtle shadow-sm flex flex-col lg:flex-row animate-fade-in">
      
      {/* Sidebar do Mapa: Lista de locais focáveis */}
      <div className="w-full lg:w-80 bg-white border-b lg:border-b-0 lg:border-r border-border-subtle flex flex-col z-10 shrink-0 h-64 lg:h-full">
        <div className="p-4 border-b border-border-subtle bg-surface-gray">
          <h3 className="font-label-caps text-label-caps text-primary uppercase font-bold tracking-wider">
            Pontos e Áreas de Monitoramento
          </h3>
          <p className="text-[11px] text-on-surface-variant mt-1">
            Clique em um bem do inventário para centralizar sua localização e visualizar os limites cadastrados.
          </p>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-border-subtle/50 custom-scrollbar">
          {mapAssets.length === 0 ? (
            <div className="p-6 text-center text-body-sm text-on-surface-variant">
              Nenhum ponto ou área encontrado com os filtros atuais.
            </div>
          ) : (
            mapAssets.map((asset) => (
              <button
                key={asset.id}
                onClick={() => handleFocusAsset(asset.coordinates)}
                className="w-full text-left p-3.5 hover:bg-surface-container-low transition-colors flex items-start gap-3 group"
              >
                {/* Indicador de Tipo de Geometria e Status */}
                <div className="flex flex-col items-center shrink-0">
                  <span className={`w-3.5 h-3.5 rounded-full ${
                    asset.status === 'stable' ? 'bg-status-stable' : asset.status === 'warning' ? 'bg-status-warning' : 'bg-status-critical'
                  }`} />
                  <span className="material-symbols-outlined text-[13px] text-on-surface-variant mt-1">
                    {asset.geometryType === 'polygon' ? 'polyline' : 'pin_drop'}
                  </span>
                </div>
                <div className="truncate">
                  <h4 className="font-bold text-on-surface text-body-sm truncate group-hover:text-primary transition-colors">
                    {asset.name}
                  </h4>
                  <p className="text-[11px] text-on-surface-variant truncate">{asset.location}</p>
                  <span className="inline-block text-[9px] font-bold text-institutional-blue mt-0.5 uppercase tracking-wider">
                    {asset.source === 'suggestion' ? 'Sugestão' : 'Oficial'}
                  </span>
                </div>
              </button>
            ))
          )}
        </div>
        
        <div className="p-4 border-t border-border-subtle bg-surface-gray text-center text-[10px] text-on-surface-variant">
          Total: {mapAssets.length} registros no mapa
        </div>
      </div>

      {/* Área do Mapa Leaflet */}
      <div className="flex-1 h-full w-full relative z-0">
        
        {/* Painel Flutuante de Filtros (Top Right) com Backdrop Blur (Regra de Design do IPHAN/Secult) */}
        <div className="absolute top-4 right-4 z-[1000] glass-panel p-4 rounded-xl border border-heritage-green-deep/30 map-layer-container max-w-[280px] space-y-3 shadow-md">
          <h4 className="font-label-caps text-[10px] text-heritage-green-deep font-bold uppercase tracking-wider flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">layers</span>
            Controle de Camadas
          </h4>

          {/* Fonte de Cadastro (IPHAN vs Cidadão) */}
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-on-surface-variant uppercase">Origem/Base</label>
            <select
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value)}
              className="w-full bg-white/95 border border-border-subtle rounded py-1 px-2 text-body-sm text-on-surface focus:outline-none focus:border-heritage-green-deep cursor-pointer"
            >
              <option value="Todos">Todas as Bases</option>
              <option value="oficial">Cadastro Oficial (IPHAN/SECULT)</option>
              <option value="sugestao">Sugestões Cidadãs (App)</option>
            </select>
          </div>

          {/* Categoria */}
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-on-surface-variant uppercase">Categoria</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-white/95 border border-border-subtle rounded py-1 px-2 text-body-sm text-on-surface focus:outline-none focus:border-heritage-green-deep cursor-pointer"
            >
              <option value="Todos">Todos os Tipos</option>
              <option value="material">Material (Edificado)</option>
              <option value="natural">Natural</option>
              <option value="arqueologico">Arqueológico</option>
            </select>
          </div>

          {/* Preservação */}
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-on-surface-variant uppercase">Preservação</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full bg-white/95 border border-border-subtle rounded py-1 px-2 text-body-sm text-on-surface focus:outline-none focus:border-heritage-green-deep cursor-pointer"
            >
              <option value="Todos">Todos os Status</option>
              <option value="stable">Preservado</option>
              <option value="warning">Alerta</option>
              <option value="critical">Crítico</option>
            </select>
          </div>

          <button
            onClick={() => { setMapCenter([-10.249, -48.324]); setMapZoom(7); }}
            className="w-full py-1.5 bg-heritage-green-deep hover:bg-primary text-white text-[11px] font-label-bold uppercase rounded transition-colors text-center"
          >
            Focalizar Tocantins
          </button>
        </div>

        {/* Legenda do Mapa (Bottom Left) com Backdrop Blur */}
        <div className="absolute bottom-4 left-4 z-[1000] glass-panel p-3.5 rounded-lg border border-heritage-green-deep/20 map-layer-container max-w-[240px] shadow-md text-[11px] space-y-2">
          <h5 className="font-label-caps text-[9px] text-on-surface-variant font-bold uppercase tracking-wider m-0">Legenda Sentinela</h5>
          
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-status-stable" />
              <span className="text-on-surface-variant">Estável / Preservado</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-status-warning" />
              <span className="text-on-surface-variant">Alerta (Dano Médio)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-status-critical" />
              <span className="text-on-surface-variant">Crítico / Sob Risco</span>
            </div>
            <div className="h-px bg-border-subtle/50 my-1" />
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[14px] text-on-surface-variant">polyline</span>
              <span className="text-on-surface-variant">Área / Polígono (Tombamento)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full border border-dashed border-institutional-blue flex items-center justify-center shrink-0">
                <div className="w-1.5 h-1.5 rounded-full bg-institutional-blue" />
              </div>
              <span className="text-on-surface-variant">Ponto de Sugestão Cidadã</span>
            </div>
          </div>
        </div>

        {/* Leaflet MapContainer */}
        <MapContainer 
          center={mapCenter} 
          zoom={mapZoom} 
          scrollWheelZoom={true}
          style={{ width: '100%', height: '100%' }}
        >
          {/* Mover câmera automaticamente */}
          <ChangeView center={mapCenter} zoom={mapZoom} />

          {/* Camada base do OpenStreetMap */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Renderização Inteligente de Geometrias: Pontos e Polígonos (Sec 6.3 / 18) */}
          {mapAssets.map((asset) => {
            const isActiveOcoCount = occurrences.filter(
              o => o.assetId === asset.id && o.status !== 'resolved'
            ).length;

            if (asset.geometryType === 'polygon' && asset.polygonCoords) {
              const polyColor = getPolygonColor(asset.status);
              return (
                <Polygon
                  key={asset.id}
                  positions={asset.polygonCoords}
                  pathOptions={{
                    fillColor: polyColor,
                    fillOpacity: 0.25,
                    color: polyColor,
                    weight: 2,
                    dashArray: asset.source === 'suggestion' ? '5, 5' : undefined
                  }}
                >
                  <Popup>
                    <div className="p-1 space-y-2 text-on-surface font-body-sm max-w-[220px]">
                      <div>
                        <span className="font-mono text-[9px] text-outline-variant">{asset.id} (Polígono)</span>
                        <h4 className="font-bold text-primary text-[13px] leading-tight m-0">{asset.name}</h4>
                        <p className="text-[10px] text-on-surface-variant m-0">{asset.location}</p>
                      </div>
                      
                      <div className="flex flex-col gap-1 border-t border-b border-border-subtle/50 py-1.5">
                        <span className="text-[10px] font-bold text-on-surface">Fonte: {getSourceLabel(asset.source)}</span>
                        <span className="text-[10px] text-on-surface-variant">Última auditoria: {asset.lastAudit}</span>
                        {isActiveOcoCount > 0 && (
                          <span className="text-[10px] font-bold text-status-critical flex items-center gap-0.5">
                            <span className="material-symbols-outlined text-[13px]">warning</span>
                            {isActiveOcoCount} ocorrência(s) ativa(s)
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] leading-relaxed text-on-surface-variant m-0">
                        {asset.description}
                      </p>
                    </div>
                  </Popup>
                </Polygon>
              );
            }

            // Caso contrário, renderiza marcador de Ponto
            return (
              <Marker
                key={asset.id}
                position={asset.coordinates}
                icon={createCustomIcon(asset.status, asset.category, asset.source)}
              >
                <Popup>
                  <div className="p-1 space-y-2 text-on-surface font-body-sm max-w-[220px]">
                    <div>
                      <span className="font-mono text-[9px] text-outline-variant">{asset.id} (Ponto)</span>
                      <h4 className="font-bold text-primary text-[13px] leading-tight m-0">{asset.name}</h4>
                      <p className="text-[10px] text-on-surface-variant m-0">{asset.location}</p>
                    </div>
                    
                    <div className="flex flex-col gap-1 border-t border-b border-border-subtle/50 py-1.5">
                      <span className="text-[10px] font-bold text-on-surface">Fonte: {getSourceLabel(asset.source)}</span>
                      <span className="text-[10px] text-on-surface-variant">Última auditoria: {asset.lastAudit}</span>
                      {isActiveOcoCount > 0 && (
                        <span className="text-[10px] font-bold text-status-critical flex items-center gap-0.5">
                          <span className="material-symbols-outlined text-[13px]">warning</span>
                          {isActiveOcoCount} ocorrência(s) ativa(s)
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] leading-relaxed text-on-surface-variant m-0">
                      {asset.description}
                    </p>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
};
