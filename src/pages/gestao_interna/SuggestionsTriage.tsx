import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap, Polygon, LayersControl, WMSTileLayer } from 'react-leaflet';
import L from 'leaflet';
import { useData } from '../../context/DataContext';
import type { TriageItem } from '../../types';

// Helper to update map view dynamically when coordinates change
const ChangeView: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
};

export const SuggestionsTriage: React.FC = () => {
  const { triageItems, approveAssetSuggestion, archiveTriageItem } = useData();

  // Estados locais
  const [selectedItem, setSelectedItem] = useState<TriageItem | null>(null);
  const [activeTab, setActiveTab] = useState<'list' | 'analyze'>('list');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Estados para aprovação/edição de bem sugerido
  const [editedName, setEditedName] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<'material' | 'natural' | 'arqueologico'>('material');
  const [geometryType, setGeometryType] = useState<'point' | 'polygon'>('point');
  const [pointLat, setPointLat] = useState<number>(-10.249);
  const [pointLng, setPointLng] = useState<number>(-48.324);
  const [polygonCoordsText, setPolygonCoordsText] = useState<string>('');

  // Filtragem dos itens pendentes (mais antigos primeiro, apenas SUG-)
  const pendingSuggestions = triageItems
    .filter(item => {
      if (item.status !== 'pending' || !item.id.startsWith('SUG-')) return false;
      
      const matchesSearch = 
        item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.assetName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesSearch;
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const handleSelectAnalyze = (item: TriageItem) => {
    setSelectedItem(item);
    setEditedName(item.assetName);
    
    // Tenta deduzir a categoria com base no relato ou usa material
    const descLower = item.description.toLowerCase();
    if (descLower.includes('reserva') || descLower.includes('natural') || descLower.includes('parque')) {
      setSelectedCategory('natural');
    } else if (descLower.includes('arqueologico') || descLower.includes('rupestre') || descLower.includes('indígena')) {
      setSelectedCategory('arqueologico');
    } else {
      setSelectedCategory('material');
    }

    setGeometryType('point');
    const lat = item.coordinates?.[0] || -10.249;
    const lng = item.coordinates?.[1] || -48.324;
    setPointLat(lat);
    setPointLng(lng);

    // Preencher polígono default de 4 vértices (quadrado ao redor do ponto)
    const defaultPolygon = `${(lat + 0.001).toFixed(6)}, ${(lng - 0.001).toFixed(6)}\n${(lat + 0.001).toFixed(6)}, ${(lng + 0.001).toFixed(6)}\n${(lat - 0.001).toFixed(6)}, ${(lng + 0.001).toFixed(6)}\n${(lat - 0.001).toFixed(6)}, ${(lng - 0.001).toFixed(6)}`;
    setPolygonCoordsText(defaultPolygon);

    setActiveTab('analyze');
  };

  const parsePolygonCoords = (text: string): [number, number][] | null => {
    try {
      const lines = text.trim().split('\n');
      const coords: [number, number][] = [];
      for (const line of lines) {
        if (!line.trim()) continue;
        const parts = line.split(',');
        if (parts.length !== 2) return null;
        const lat = parseFloat(parts[0].trim());
        const lng = parseFloat(parts[1].trim());
        if (isNaN(lat) || isNaN(lng)) return null;
        coords.push([lat, lng]);
      }
      if (coords.length < 3) return null;
      return coords;
    } catch (e) {
      return null;
    }
  };

  const handleApprove = () => {
    if (!selectedItem) return;
    if (!editedName.trim()) {
      alert('Por favor, informe o nome oficial do patrimônio.');
      return;
    }

    let finalCoords: [number, number] = [pointLat, pointLng];
    let polyCoords: [number, number][] | undefined = undefined;

    if (geometryType === 'polygon') {
      const parsed = parsePolygonCoords(polygonCoordsText);
      if (!parsed) {
        alert('Formato de coordenadas do polígono inválido. Use um par "lat, lng" por linha (mínimo de 3 vértices).');
        return;
      }
      polyCoords = parsed;
      // Centralizar coordenadas do bem no primeiro vértice do polígono
      finalCoords = parsed[0];
    }

    approveAssetSuggestion(
      selectedItem.id,
      editedName,
      selectedCategory,
      selectedItem.location,
      finalCoords,
      geometryType,
      polyCoords
    );

    alert(`Sugestão ${selectedItem.id} aprovada com sucesso! O bem "${editedName}" foi integrado ao inventário oficial.`);
    setSelectedItem(null);
    setActiveTab('list');
  };

  const handleArchive = () => {
    if (!selectedItem) return;
    if (window.confirm(`Tem certeza de que deseja recusar/arquivar a sugestão ${selectedItem.id}?`)) {
      archiveTriageItem(selectedItem.id);
      setSelectedItem(null);
      setActiveTab('list');
    }
  };

  // Coordenadas para centralizar o mapa de visualização
  const mapCenter: [number, number] = selectedItem?.coordinates || [-10.249, -48.324];

  // Ícone Customizado para o Marcador do Leaflet
  const suggestionIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41]
  });

  // Polígono atualmente digitado para pré-visualização no mapa
  const parsedPreviewPolygon = geometryType === 'polygon' ? parsePolygonCoords(polygonCoordsText) : null;

  return (
    <div className="space-y-stack-lg animate-fade-in flex flex-col h-full">
      {/* Header */}
      <div>
        <h2 className="font-headline-lg text-headline-lg text-on-surface mb-stack-sm flex items-center gap-2">
          <span className="material-symbols-outlined text-[28px] text-heritage-green-deep font-bold">add_moderator</span>
          Sugestões de Novos Bens - Triagem Técnica
        </h2>
        <p className="font-body-lg text-body-lg text-on-surface-variant">
          Avalie propostas enviadas por cidadãos para catalogação e inclusão de novos patrimônios históricos, naturais ou arqueológicos.
        </p>
      </div>

      {/* Abas */}
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
          Fila de Sugestões ({pendingSuggestions.length})
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
              Avaliação: {selectedItem.id}
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

      {/* Conteúdo Aba Lista */}
      {activeTab === 'list' && (
        <div className="flex-1 w-full bg-white rounded-b-xl border border-t-0 border-border-subtle shadow-sm overflow-hidden flex flex-col">
          {/* Barra de Busca */}
          <div className="glass-panel border-b border-border-subtle p-stack-md flex gap-gutter items-end">
            <div className="flex-1">
              <label className="block font-label-caps text-label-caps text-on-surface-variant uppercase mb-2 tracking-wider">
                Buscar sugestões
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
                  placeholder="Buscar por ID, Nome sugerido, Localidade..." 
                />
              </div>
            </div>
          </div>

          {/* Tabela */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-surface-container-low border-b border-border-subtle">
                <tr>
                  <th className="py-4 px-6 font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider w-24">ID</th>
                  <th className="py-4 px-6 font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">Nome Sugerido / Local</th>
                  <th className="py-4 px-6 font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider w-40">Data Envio</th>
                  <th className="py-4 px-6 font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider w-40">Sigilo</th>
                  <th className="py-4 px-6 font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider w-32 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle text-body-sm text-on-surface">
                {pendingSuggestions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-on-surface-variant italic">
                      Nenhuma sugestão pendente de avaliação.
                    </td>
                  </tr>
                ) : (
                  pendingSuggestions.map((item, idx) => (
                    <tr 
                      key={item.id} 
                      className={`hover:bg-surface-gray transition-colors cursor-pointer ${idx % 2 === 0 ? '' : 'bg-surface-gray/30'}`}
                      onClick={() => handleSelectAnalyze(item)}
                    >
                      <td className="py-4 px-6 font-mono text-outline-variant">{item.id}</td>
                      <td className="py-4 px-6 font-label-bold text-label-bold">
                        <div>{item.assetName}</div>
                        <div className="font-normal text-on-surface-variant text-[11px] mt-0.5">{item.location}</div>
                      </td>
                      <td className="py-4 px-6 text-on-surface-variant">
                        {new Date(item.date).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="py-4 px-6">
                        {item.anonymity === 'anonymous' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-gray-100 text-on-surface-variant border border-border-subtle text-[11px] font-label-bold">
                            Anônima
                          </span>
                        )}
                        {item.anonymity === 'confidential' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-label-bold">
                            Sigilosa
                          </span>
                        )}
                        {item.anonymity === 'identified' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200 text-[11px] font-label-bold">
                            Identificada
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button 
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleSelectAnalyze(item); }}
                          className="px-4 py-1.5 bg-heritage-green-deep text-white font-label-bold text-label-bold rounded hover:bg-primary transition-colors"
                        >
                          Avaliar
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

      {/* Conteúdo Aba Análise */}
      {activeTab === 'analyze' && selectedItem && (
        <div className="w-full bg-white rounded-b-xl border border-t-0 border-border-subtle shadow-sm p-6 space-y-6 animate-fade-in flex flex-col lg:flex-row gap-6">
          {/* Coluna Esquerda: Detalhes, Fotos e Descrição */}
          <div className="flex-1 space-y-6">
            <div>
              <span className="font-mono text-outline-variant text-sm block">{selectedItem.id}</span>
              <h3 className="font-headline-md text-headline-md font-bold text-on-surface">
                Avaliação Detalhada da Proposta do Cidadão
              </h3>
            </div>

            {/* Justificativa e Relato */}
            <div className="space-y-2">
              <h4 className="font-label-caps text-label-caps text-primary uppercase font-bold tracking-wider">
                Justificativa / Relato do Cidadão
              </h4>
              <div className="p-4 bg-surface-gray border border-border-subtle rounded-lg text-body-sm leading-relaxed text-on-surface">
                {selectedItem.description}
              </div>
            </div>

            {/* Fotos Comprobatórias */}
            <div className="space-y-2">
              <h4 className="font-label-caps text-label-caps text-primary uppercase font-bold tracking-wider">
                Imagens Anexadas
              </h4>
              {selectedItem.photos && selectedItem.photos.length > 0 ? (
                <div className="grid grid-cols-3 gap-3">
                  {selectedItem.photos.map((url, idx) => (
                    <div key={idx} className="aspect-square rounded-lg border border-border-subtle overflow-hidden bg-surface-gray">
                      <img 
                        src={url} 
                        alt={`Foto da sugestão ${idx + 1}`} 
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-200 cursor-zoom-in"
                        onClick={() => window.open(url, '_blank')}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-body-sm text-on-surface-variant italic p-4 bg-surface-gray border border-dashed border-border-subtle rounded-lg text-center">
                  Nenhuma imagem anexada a esta sugestão.
                </div>
              )}
            </div>

            {/* Informações do Cidadão */}
            <div className="space-y-2">
              <h4 className="font-label-caps text-label-caps text-primary uppercase font-bold tracking-wider">
                Dados do Proponente
              </h4>
              <div className="grid grid-cols-2 gap-4 p-4 bg-surface-gray border border-border-subtle rounded-lg text-body-sm">
                <div>
                  <span className="text-on-surface-variant font-medium block">Nome do Cidadão:</span>
                  <span className="font-bold text-on-surface">{selectedItem.reporterName || 'Anônimo'}</span>
                </div>
                <div>
                  <span className="text-on-surface-variant font-medium block">Contato:</span>
                  <span className="font-bold text-on-surface">{selectedItem.reporterContact || 'Não fornecido (Anônimo)'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Coluna Direita: Mapa, Edição e Ações */}
          <div className="w-full lg:w-[450px] space-y-6">
            {/* Mapa de Localização */}
            <div className="space-y-2">
              <h4 className="font-label-caps text-label-caps text-primary uppercase font-bold tracking-wider">
                Geolocalização Indicada
              </h4>
              <div className="h-64 rounded-xl border border-border-subtle overflow-hidden relative">
                <MapContainer center={mapCenter} zoom={15} scrollWheelZoom={false} className="h-full w-full">
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
                  <ChangeView center={mapCenter} zoom={15} />
                  
                  {/* Se for ponto, desenha marcador */}
                  {geometryType === 'point' && selectedItem.coordinates && (
                    <Marker position={selectedItem.coordinates} icon={suggestionIcon} />
                  )}

                  {/* Se for polígono e o texto for válido, exibe o polígono no mapa */}
                  {geometryType === 'polygon' && parsedPreviewPolygon && (
                    <Polygon positions={parsedPreviewPolygon} pathOptions={{ color: 'blue', fillColor: 'blue', fillOpacity: 0.2 }} />
                  )}
                </MapContainer>
              </div>
            </div>

            {/* Formulário de Catalogação Oficial */}
            <div className="bg-surface-gray border border-border-subtle rounded-xl p-5 space-y-4">
              <h4 className="font-label-caps text-label-caps text-primary uppercase font-bold tracking-wider border-b border-border-subtle pb-2">
                Ficha de Catalogação Oficial
              </h4>

              {/* Nome Oficial */}
              <div className="space-y-1">
                <label className="block text-[11px] font-label-bold text-on-surface-variant uppercase">
                  Nome Oficial do Bem Patrimonial
                </label>
                <input 
                  type="text"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-border-subtle rounded text-body-sm focus:border-heritage-green-deep focus:ring-1 outline-none"
                  placeholder="Nome do bem para o diário oficial..."
                />
              </div>

              {/* Categoria */}
              <div className="space-y-1">
                <label className="block text-[11px] font-label-bold text-on-surface-variant uppercase">
                  Categoria
                </label>
                <select 
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value as any)}
                  className="w-full px-3 py-2 bg-white border border-border-subtle rounded text-body-sm cursor-pointer outline-none"
                >
                  <option value="material">Material (Prédio/Monumento)</option>
                  <option value="natural">Natural (Paisagens/Reservas)</option>
                  <option value="arqueologico">Arqueológico (Sítios históricos/gravuras)</option>
                </select>
              </div>

              {/* Tipo de Geometria */}
              <div className="space-y-1">
                <label className="block text-[11px] font-label-bold text-on-surface-variant uppercase">
                  Tipo de Geometria (Sem suporte a linhas)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setGeometryType('point')}
                    className={`py-2 px-3 text-body-sm font-bold rounded border text-center transition-colors ${
                      geometryType === 'point'
                        ? 'bg-primary-fixed border-primary text-primary shadow-sm'
                        : 'bg-white border-border-subtle text-on-surface-variant hover:bg-surface-container-low'
                    }`}
                  >
                    Ponto
                  </button>
                  <button
                    type="button"
                    onClick={() => setGeometryType('polygon')}
                    className={`py-2 px-3 text-body-sm font-bold rounded border text-center transition-colors ${
                      geometryType === 'polygon'
                        ? 'bg-primary-fixed border-primary text-primary shadow-sm'
                        : 'bg-white border-border-subtle text-on-surface-variant hover:bg-surface-container-low'
                    }`}
                  >
                    Polígono
                  </button>
                </div>
              </div>

              {/* Coordenadas */}
              {geometryType === 'point' ? (
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="block text-[10px] text-on-surface-variant uppercase font-medium">Latitude</label>
                    <input 
                      type="number"
                      step="0.000001"
                      value={pointLat}
                      onChange={(e) => setPointLat(parseFloat(e.target.value))}
                      className="w-full px-3 py-1.5 bg-white border border-border-subtle rounded text-body-sm outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] text-on-surface-variant uppercase font-medium">Longitude</label>
                    <input 
                      type="number"
                      step="0.000001"
                      value={pointLng}
                      onChange={(e) => setPointLng(parseFloat(e.target.value))}
                      className="w-full px-3 py-1.5 bg-white border border-border-subtle rounded text-body-sm outline-none"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  <label className="block text-[10px] text-on-surface-variant uppercase font-medium">
                    Vértices do Polígono (lat, lng por linha)
                  </label>
                  <textarea 
                    value={polygonCoordsText}
                    onChange={(e) => setPolygonCoordsText(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 bg-white border border-border-subtle rounded font-mono text-xs outline-none resize-y"
                    placeholder="-10.249, -48.324&#10;-10.250, -48.324..."
                  />
                  <p className="text-[10px] text-on-surface-variant italic">
                    Escreva no formato "latitude, longitude" com um ponto por linha (mínimo de 3 pontos para formar a geometria do polígono).
                  </p>
                </div>
              )}
            </div>

            {/* Ações de Aprovação/Rejeição */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleArchive}
                className="flex-1 py-3 border border-status-critical text-status-critical hover:bg-status-critical/10 rounded font-label-bold text-label-bold uppercase transition-colors"
              >
                Recusar e Arquivar
              </button>
              <button
                type="button"
                onClick={handleApprove}
                className="flex-1 py-3 bg-heritage-green-deep hover:bg-primary text-white rounded font-label-bold text-label-bold uppercase transition-colors shadow-md"
              >
                Aprovar e Cadastrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
