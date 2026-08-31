import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap, LayersControl, WMSTileLayer } from 'react-leaflet';
import L from 'leaflet';
import { useData } from '../../context/DataContext';
import type { TriageItem, Asset } from '../../types';

// Componentes Auxiliares do Mapa
const ChangeView: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
};

const MapClickHandler: React.FC<{
  onMapClick: (lat: number, lng: number) => void;
}> = ({ onMapClick }) => {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

// Ícones Customizados
const createCustomIcon = (status: Asset['status'], category: Asset['category'], source: Asset['source']) => {
  let color = '#059669'; // stable (Verde)
  if (status === 'warning') color = '#D97706'; // warning (Laranja)
  if (status === 'critical') color = '#B91C1C'; // critical (Vermelho)

  let iconSymbol = 'account_balance';
  if (category === 'natural') iconSymbol = 'eco';
  if (category === 'arqueologico') iconSymbol = 'landscape';

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

const createConfirmedIcon = () => {
  return L.divIcon({
    html: `
      <div class="flex items-center justify-center w-8 h-8 rounded-full border-2 border-white shadow-lg bg-[#0284c7] text-white cursor-pointer transition-transform scale-110 animate-pulse">
        <span class="material-symbols-outlined text-[16px] text-white font-bold">add_location_alt</span>
      </div>
    `,
    className: 'confirmed-map-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

interface ChannelMapProps {
  activeSubTab: 'denounce' | 'suggest';
  assets: Asset[];
  suggestLat: number;
  suggestLng: number;
  setSuggestLat: (lat: number) => void;
  setSuggestLng: (lng: number) => void;
  setSuggestLocation: (loc: string) => void;
  denounceLat: number | null;
  denounceLng: number | null;
  setDenounceLat: (lat: number | null) => void;
  setDenounceLng: (lng: number | null) => void;
  setDenounceLocation: (loc: string) => void;
  setSelectedAssetId: (id: string) => void;
}

const ChannelMap: React.FC<ChannelMapProps> = ({
  activeSubTab,
  assets,
  suggestLat,
  suggestLng,
  setSuggestLat,
  setSuggestLng,
  setSuggestLocation,
  denounceLat,
  denounceLng,
  setDenounceLat,
  setDenounceLng,
  setDenounceLocation,
  setSelectedAssetId,
}) => {
  const [mapCenter, setMapCenter] = useState<[number, number]>([-10.249, -48.324]);
  const [mapZoom, setMapZoom] = useState<number>(7);
  const [clickedCoords, setClickedCoords] = useState<[number, number] | null>(null);
  const [geocodedAddress, setGeocodedAddress] = useState<string | null>(null);
  const [isGeocoding, setIsGeocoding] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const performReverseGeocoding = async (lat: number, lng: number) => {
    setIsGeocoding(true);
    setGeocodedAddress(null);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=14`,
        {
          headers: {
            'User-Agent': 'SentinelaPatrimonioTocantins/1.0'
          }
        }
      );
      if (response.ok) {
        const data = await response.json();
        const addr = data.address;
        if (addr) {
          const city = addr.city || addr.town || addr.village || addr.municipality || '';
          const road = addr.road || '';
          
          let parts = [];
          if (city) parts.push(city);
          if (road) parts.push(road);
          
          const formatted = parts.join(' - ');
          setGeocodedAddress(formatted || data.display_name || 'Localização no Tocantins');
          setIsGeocoding(false);
          return;
        }
      }
    } catch (err) {
      console.error('Error reverse geocoding:', err);
    }
    setGeocodedAddress('Coordenadas capturadas');
    setIsGeocoding(false);
  };

  const handleMapClick = (lat: number, lng: number) => {
    const latFixed = parseFloat(lat.toFixed(6));
    const lngFixed = parseFloat(lng.toFixed(6));
    setClickedCoords([latFixed, lngFixed]);
    performReverseGeocoding(latFixed, lngFixed);
  };

  return (
    <div className="bg-white rounded-xl p-4 border border-border-subtle flex flex-col h-[580px] shadow-sm">
      <div className="mb-3">
        <h4 className="font-label-caps text-xs text-heritage-green-deep font-bold uppercase tracking-wider flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[18px]">map</span>
          Mapa Interativo do Tocantins
        </h4>
        <p className="text-[11px] text-on-surface-variant leading-relaxed mt-1">
          {activeSubTab === 'suggest'
            ? 'Navegue pelo estado, localize o município e clique no local exato onde se encontra o bem para capturar as coordenadas e sugerir.'
            : 'Clique em um patrimônio existente no mapa para selecioná-lo no formulário, ou clique em um local vazio para definir coordenadas de GPS personalizadas.'}
        </p>
      </div>

      {successMessage && (
        <div className="bg-[#ecfdf5] border border-[#10b981] text-[#065f46] rounded-lg px-3 py-2 text-xs flex items-center gap-1.5 mb-3 animate-fade-in">
          <span className="material-symbols-outlined text-[16px]">check_circle</span>
          {successMessage}
        </div>
      )}

      <div className="flex-1 w-full rounded-lg overflow-hidden border border-border-subtle shadow-inner min-h-[300px] relative z-0">
        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          scrollWheelZoom={true}
          style={{ width: '100%', height: '100%' }}
        >
          <ChangeView center={mapCenter} zoom={mapZoom} />
          
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

          <MapClickHandler onMapClick={handleMapClick} />

          {clickedCoords && (
            <Popup position={clickedCoords} onClose={() => setClickedCoords(null)}>
              <div className="p-1 space-y-2 text-on-surface text-body-sm max-w-[220px]">
                <div>
                  <span className="font-mono text-[9px] text-on-surface-variant font-bold block uppercase tracking-wider">Local Selecionado</span>
                  <span className="font-mono text-xs block mt-1">Lat: <strong>{clickedCoords[0]}</strong></span>
                  <span className="font-mono text-xs block">Lng: <strong>{clickedCoords[1]}</strong></span>
                </div>
                <div className="border-t border-border-subtle/50 pt-1.5">
                  <span className="text-[10px] font-bold block text-on-surface">Localidade Estimada:</span>
                  {isGeocoding ? (
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="material-symbols-outlined text-[12px] animate-spin text-primary">sync</span>
                      <span className="text-[10px] text-on-surface-variant italic">Buscando município...</span>
                    </div>
                  ) : (
                    <span className="text-[10px] text-on-surface-variant block leading-tight mt-0.5">{geocodedAddress}</span>
                  )}
                </div>
                <div className="flex gap-2 pt-1 border-t border-border-subtle/50">
                  <button
                    type="button"
                    onClick={() => {
                      if (activeSubTab === 'suggest') {
                        setSuggestLat(clickedCoords[0]);
                        setSuggestLng(clickedCoords[1]);
                        if (geocodedAddress && geocodedAddress !== 'Coordenadas capturadas') {
                          setSuggestLocation(geocodedAddress);
                        }
                        setSuccessMessage("Localização da sugestão vinculada com sucesso!");
                      } else {
                        setDenounceLat(clickedCoords[0]);
                        setDenounceLng(clickedCoords[1]);
                        if (geocodedAddress && geocodedAddress !== 'Coordenadas capturadas') {
                          setDenounceLocation(geocodedAddress);
                        }
                        setSuccessMessage("Coordenadas GPS da denúncia vinculadas com sucesso!");
                      }
                      setClickedCoords(null);
                      setTimeout(() => setSuccessMessage(null), 4000);
                    }}
                    className="flex-grow py-1 bg-heritage-green-deep hover:bg-primary text-white text-[10px] font-label-bold rounded transition-colors uppercase text-center cursor-pointer border-none font-bold"
                  >
                    Confirmar
                  </button>
                  <button
                    type="button"
                    onClick={() => setClickedCoords(null)}
                    className="flex-grow py-1 bg-white hover:bg-surface-gray border border-border-subtle text-on-surface-variant text-[10px] font-label-bold rounded transition-colors uppercase text-center cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </Popup>
          )}

          {activeSubTab === 'suggest' && suggestLat !== -10.249 && suggestLng !== -48.324 && (
            <Marker position={[suggestLat, suggestLng]} icon={createConfirmedIcon()}>
              <Popup>
                <div className="p-1 text-center font-body-sm">
                  <strong className="text-primary text-xs">Ponto Sugerido</strong>
                  <p className="text-[10px] text-on-surface-variant m-0 mt-1">Lat: {suggestLat}, Lng: {suggestLng}</p>
                </div>
              </Popup>
            </Marker>
          )}

          {activeSubTab === 'denounce' && denounceLat !== null && denounceLng !== null && (
            <Marker position={[denounceLat, denounceLng]} icon={createConfirmedIcon()}>
              <Popup>
                <div className="p-1 text-center font-body-sm">
                  <strong className="text-primary text-xs">Coordenada do Dano</strong>
                  <p className="text-[10px] text-on-surface-variant m-0 mt-1">Lat: {denounceLat}, Lng: {denounceLng}</p>
                </div>
              </Popup>
            </Marker>
          )}

          {activeSubTab === 'denounce' && assets.map((asset) => {
            if (asset.coordinates && asset.coordinates[0] !== 0) {
              return (
                <Marker
                  key={asset.id}
                  position={asset.coordinates}
                  icon={createCustomIcon(asset.status, asset.category, asset.source)}
                >
                  <Popup>
                    <div className="p-1 space-y-1.5 text-on-surface font-body-sm max-w-[200px]">
                      <span className="font-mono text-[9px] text-on-surface-variant uppercase font-bold tracking-wider">Bem Cadastrado</span>
                      <h5 className="font-bold text-heritage-green-deep text-xs leading-tight m-0">{asset.name}</h5>
                      <p className="text-[10px] text-on-surface-variant m-0">{asset.location}</p>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedAssetId(asset.id);
                          setDenounceLocation(asset.location);
                          setSuccessMessage(`Bem "${asset.name}" selecionado no formulário.`);
                          setTimeout(() => setSuccessMessage(null), 3500);
                        }}
                        className="w-full mt-1.5 py-1 bg-heritage-green-deep hover:bg-primary text-white text-[10px] font-label-bold rounded transition-colors uppercase text-center cursor-pointer border-none font-bold"
                      >
                        Selecionar no Formulário
                      </button>
                    </div>
                  </Popup>
                </Marker>
              );
            }
            return null;
          })}
        </MapContainer>
      </div>
    </div>
  );
};

export const CitizenChannel: React.FC = () => {
  const { assets, triageItems, occurrences, addCitizenTriage } = useData();

  // Abas locais da Área do Cidadão
  const [activeSubTab, setActiveSubTab] = useState<'denounce' | 'suggest' | 'track'>('denounce');

  // Estado geral de sucesso após envio
  const [submittedId, setSubmittedId] = useState<string | null>(null);
  const [submittedAccessKey, setSubmittedAccessKey] = useState<string | null>(null);

  // Estados - Nova Denúncia
  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [denounceUrgency, setDenounceUrgency] = useState<'low' | 'medium' | 'high'>('medium');
  const [denounceType, setDenounceType] = useState<'Vandalismo' | 'Degradação' | 'Risco Estrutural' | 'Outros'>('Degradação');
  const [denounceLocation, setDenounceLocation] = useState('');
  const [denounceDesc, setDenounceDesc] = useState('');
  const [denounceAnonymity, setDenounceAnonymity] = useState<'anonymous' | 'confidential' | 'identified'>('anonymous');
  const [denounceName, setDenounceName] = useState('');
  const [denounceContact, setDenounceContact] = useState('');
  const [denouncePhotos, setDenouncePhotos] = useState<string[]>([]);
  const [denounceLat, setDenounceLat] = useState<number | null>(null);
  const [denounceLng, setDenounceLng] = useState<number | null>(null);
  const [isGpsCapturing, setIsGpsCapturing] = useState(false);

  // Estados - Sugerir Patrimônio
  const [suggestName, setSuggestName] = useState('');
  const [suggestCategory, setSuggestCategory] = useState<'material' | 'natural' | 'arqueologico'>('material');
  const [suggestLocation, setSuggestLocation] = useState('');
  const [suggestLat, setSuggestLat] = useState<number>(-10.249);
  const [suggestLng, setSuggestLng] = useState<number>(-48.324);
  const [suggestDesc, setSuggestDesc] = useState('');
  const [suggestAnonymity, setSuggestAnonymity] = useState<'anonymous' | 'confidential' | 'identified'>('anonymous');
  const [suggestReporterName, setSuggestReporterName] = useState('');
  const [suggestReporterContact, setSuggestReporterContact] = useState('');
  const [suggestPhotos, setSuggestPhotos] = useState<string[]>([]);

  // Estados - Consulta
  const [searchTrackingId, setSearchTrackingId] = useState('');
  const [searchAccessKey, setSearchAccessKey] = useState('');
  const [trackedItem, setTrackedItem] = useState<TriageItem | null>(null);
  const [trackedOccurrence, setTrackedOccurrence] = useState<any | null>(null);
  const [searchAttempted, setSearchAttempted] = useState(false);

  // Manipuladores de Envio
  const handleDenounceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssetId || !denounceDesc) {
      alert('Por favor, selecione um bem patrimonial e descreva a ocorrência.');
      return;
    }

    if (denouncePhotos.length < 3) {
      alert('Atenção: Toda denúncia requer o envio de no mínimo 3 fotos comprobatórias do dano.');
      return;
    }

    const assetObj = assets.find(a => a.id === selectedAssetId);
    const assetName = assetObj ? assetObj.name : 'Bem Patrimonial';
    const finalLocation = denounceLocation || (assetObj ? assetObj.location : '');

    const { id, accessKey } = addCitizenTriage({
      assetName,
      description: denounceDesc,
      urgency: denounceUrgency,
      iaSuggestion: denounceType,
      location: finalLocation,
      anonymity: denounceAnonymity,
      reporterName: denounceAnonymity !== 'anonymous' ? denounceName : undefined,
      reporterContact: denounceAnonymity !== 'anonymous' ? denounceContact : undefined,
      coordinates: denounceLat !== null && denounceLng !== null 
        ? [denounceLat, denounceLng] 
        : (assetObj ? assetObj.coordinates : undefined),
      photos: denouncePhotos
    });

    setSubmittedId(id);
    setSubmittedAccessKey(accessKey || null);

    // Limpar formulário
    setSelectedAssetId('');
    setDenounceLocation('');
    setDenounceDesc('');
    setDenounceName('');
    setDenounceContact('');
    setDenouncePhotos([]);
    setDenounceLat(null);
    setDenounceLng(null);
  };

  const handleSuggestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!suggestName || !suggestLocation || !suggestDesc) {
      alert('Por favor, preencha todos os campos obrigatórios da sugestão.');
      return;
    }

    if (suggestPhotos.length === 0) {
      alert('Atenção: A sugestão de novo bem requer o envio de pelo menos 1 foto do local/monumento.');
      return;
    }

    const { id } = addCitizenTriage({
      assetName: suggestName,
      description: suggestDesc,
      urgency: 'low',
      iaSuggestion: 'Outros',
      location: suggestLocation,
      anonymity: suggestAnonymity,
      reporterName: suggestAnonymity !== 'anonymous' ? suggestReporterName : undefined,
      reporterContact: suggestAnonymity !== 'anonymous' ? suggestReporterContact : undefined,
      coordinates: [suggestLat, suggestLng],
      photos: suggestPhotos
    }, 'SUG');

    setSubmittedId(id);
    setSubmittedAccessKey(null);

    // Limpar formulário
    setSuggestName('');
    setSuggestLocation('');
    setSuggestDesc('');
    setSuggestReporterName('');
    setSuggestReporterContact('');
    setSuggestPhotos([]);
  };

  const handleTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchAttempted(true);
    if (!searchTrackingId) return;

    // Achar denúncia na triagem
    const foundItem = triageItems.find(t => t.id.trim().toUpperCase() === searchTrackingId.trim().toUpperCase());
    
    if (foundItem) {
      if (foundItem.anonymity === 'anonymous') {
        if (!searchAccessKey) {
          alert('Por favor, digite a Chave de Acesso para consultar esta denúncia anônima.');
          setTrackedItem(null);
          setTrackedOccurrence(null);
          return;
        }
        if (foundItem.accessKey && foundItem.accessKey.trim().toUpperCase() !== searchAccessKey.trim().toUpperCase()) {
          alert('Chave de Acesso incorreta. Verifique e tente novamente.');
          setTrackedItem(null);
          setTrackedOccurrence(null);
          return;
        }
      }
      
      setTrackedItem(foundItem);
      const oco = occurrences.find(o => o.assetName === foundItem.assetName && o.description === foundItem.description);
      setTrackedOccurrence(oco || null);
    } else {
      setTrackedItem(null);
      setTrackedOccurrence(null);
    }
  };

  const handleGetCoordinates = () => {
    // Gerar coordenadas mockadas em Palmas/TO
    const randomOffsetLat = (Math.random() - 0.5) * 0.05;
    const randomOffsetLng = (Math.random() - 0.5) * 0.05;
    setSuggestLat(parseFloat((-10.249091 + randomOffsetLat).toFixed(6)));
    setSuggestLng(parseFloat((-48.324278 + randomOffsetLng).toFixed(6)));
  };

  const getReferralLabel = (dest?: string) => {
    switch (dest) {
      case 'mpto': return 'Procuradoria de Justiça (MPTO)';
      case 'iphan': return 'IPHAN (Federal)';
      case 'secult': return 'SECULT (Estadual)';
      case 'police': return 'Delegacia de Polícia Civil';
      default: return 'Órgão Competente';
    }
  };

  return (
    <div className="space-y-stack-lg animate-fade-in flex flex-col h-full">
      {/* Header */}
      <div>
        <h2 className="font-headline-lg text-headline-lg text-on-surface mb-stack-sm flex items-center gap-2">
          <span className="material-symbols-outlined text-[28px] text-heritage-green-deep">campaign</span>
          Canal do Cidadão - CAOMA/MPTO
        </h2>
        <p className="font-body-lg text-body-lg text-on-surface-variant">
          Colabore na proteção do patrimônio cultural, histórico e ambiental de Tocantins. Envie denúncias ou sugira bens para preservação.
        </p>
      </div>

      {/* Sub-Aba Menu */}
      <div className="flex border-b border-border-subtle bg-white rounded-t-xl overflow-hidden shadow-sm">
        <button
          onClick={() => { setActiveSubTab('denounce'); setSubmittedId(null); }}
          className={`flex-1 py-4 text-center font-label-bold text-label-bold uppercase transition-colors flex items-center justify-center gap-2 border-b-2 ${
            activeSubTab === 'denounce'
              ? 'border-heritage-green-deep text-heritage-green-deep font-bold bg-surface-container-low'
              : 'border-transparent text-on-surface-variant hover:text-primary hover:bg-surface-gray/30'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">report</span>
          Denunciar Dano em Ativo
        </button>
        <button
          onClick={() => { setActiveSubTab('suggest'); setSubmittedId(null); }}
          className={`flex-1 py-4 text-center font-label-bold text-label-bold uppercase transition-colors flex items-center justify-center gap-2 border-b-2 ${
            activeSubTab === 'suggest'
              ? 'border-heritage-green-deep text-heritage-green-deep font-bold bg-surface-container-low'
              : 'border-transparent text-on-surface-variant hover:text-primary hover:bg-surface-gray/30'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">add_location_alt</span>
          Sugerir Novo Patrimônio
        </button>
        <button
          onClick={() => { setActiveSubTab('track'); setSubmittedId(null); setSearchAttempted(false); setTrackedItem(null); setTrackedOccurrence(null); }}
          className={`flex-1 py-4 text-center font-label-bold text-label-bold uppercase transition-colors flex items-center justify-center gap-2 border-b-2 ${
            activeSubTab === 'track'
              ? 'border-heritage-green-deep text-heritage-green-deep font-bold bg-surface-container-low'
              : 'border-transparent text-on-surface-variant hover:text-primary hover:bg-surface-gray/30'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">search_check</span>
          Acompanhar Protocolo
        </button>
      </div>

      {/* Conteúdo Principal */}
      <div className="bg-white border border-t-0 border-border-subtle rounded-b-xl p-6 shadow-sm flex-1 min-h-[400px]">
        {/* Caso tenha enviado com sucesso */}
        {submittedId ? (
          <div className="max-w-md mx-auto text-center py-8 space-y-5 animate-fade-in">
            <span className="material-symbols-outlined text-[64px] text-status-stable">check_circle</span>
            <div className="space-y-2">
              <h3 className="font-headline-md text-headline-md font-bold text-on-surface">Envio Concluído com Sucesso!</h3>
              <p className="text-body-md text-on-surface-variant">
                Obrigado pelo seu registro. A equipe técnica do CAOMA/MPTO analisará as informações.
              </p>
            </div>

            <div className="space-y-4">
              <div className="bg-surface-container p-4 rounded-lg border border-border-subtle text-center">
                <span className="font-label-caps text-[10px] text-on-surface-variant block uppercase">Código de Acompanhamento (Protocolo)</span>
                <span className="font-mono text-2xl font-bold text-primary tracking-wider select-all block mt-1">{submittedId}</span>
                <p className="text-[10px] text-on-surface-variant mt-2">
                  Guarde este código para acompanhar o status e o laudo de fiscalização na aba "Acompanhar Protocolo".
                </p>
              </div>

              {submittedAccessKey && (
                <div className="bg-amber-50 p-4 rounded-lg border border-amber-200 text-center">
                  <span className="font-label-caps text-[10px] text-amber-800 font-bold block uppercase tracking-wider">Chave de Segurança (Acesso Anônimo)</span>
                  <span className="font-mono text-2xl font-bold text-on-surface tracking-wider select-all block mt-1">{submittedAccessKey}</span>
                  <p className="text-[10px] text-amber-900 font-semibold mt-2">
                    ATENÇÃO: Guarde esta chave! Como a denúncia é anônima, ela é obrigatória para consultar o andamento na aba "Acompanhar Protocolo".
                  </p>
                </div>
              )}
            </div>

            <button
              onClick={() => setSubmittedId(null)}
              className="px-6 py-2 bg-heritage-green-deep hover:bg-primary text-white font-label-bold text-label-bold rounded uppercase transition-colors"
            >
              Novo Envio
            </button>
          </div>
        ) : (
          <>
            {/* 1. ABA DENUNCIAR DANO */}
            {activeSubTab === 'denounce' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                <div className="lg:col-span-6">
                  <form onSubmit={handleDenounceSubmit} className="space-y-5">
                <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface border-b border-border-subtle pb-2">
                  Registrar Ocorrência em Bem Existente
                </h3>

                {/* Selecionar Bem */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="block font-label-caps text-[10px] text-on-surface-variant uppercase tracking-wider">
                      Selecione o Patrimônio Afetado *
                    </label>
                    <button 
                      type="button"
                      onClick={() => setActiveSubTab('suggest')}
                      className="text-[10px] text-heritage-green-deep hover:underline font-label-bold uppercase flex items-center gap-0.5"
                    >
                      <span className="material-symbols-outlined text-[13px]">help_outline</span>
                      Não encontrou o bem? Sugira aqui
                    </button>
                  </div>
                  <select
                    value={selectedAssetId}
                    onChange={(e) => {
                      setSelectedAssetId(e.target.value);
                      const asset = assets.find(a => a.id === e.target.value);
                      if (asset) setDenounceLocation(asset.location);
                    }}
                    className="w-full px-3 py-2 border border-border-subtle rounded text-body-sm text-on-surface focus:border-heritage-green-deep focus:ring-1 focus:ring-heritage-green-deep outline-none cursor-pointer"
                    required
                  >
                    <option value="">Selecione o bem...</option>
                    {assets.map(a => (
                      <option key={a.id} value={a.id}>{a.name} ({a.location})</option>
                    ))}
                  </select>
                </div>

                {/* Detalhes Localização & GPS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block font-label-caps text-[10px] text-on-surface-variant uppercase tracking-wider">
                      Detalhes do Local / Ponto de Referência
                    </label>
                    <input
                      type="text"
                      value={denounceLocation}
                      onChange={(e) => setDenounceLocation(e.target.value)}
                      className="w-full px-3 py-2 border border-border-subtle rounded text-body-sm text-on-surface focus:border-heritage-green-deep focus:ring-1 outline-none"
                      placeholder="Complemento de localização..."
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block font-label-caps text-[10px] text-on-surface-variant uppercase tracking-wider flex justify-between items-center">
                      <span>Captura de Localização por GPS</span>
                      <button
                        type="button"
                        onClick={() => {
                          setIsGpsCapturing(true);
                          setTimeout(() => {
                            const randomOffsetLat = (Math.random() - 0.5) * 0.05;
                            const randomOffsetLng = (Math.random() - 0.5) * 0.05;
                            setDenounceLat(parseFloat((-10.249091 + randomOffsetLat).toFixed(6)));
                            setDenounceLng(parseFloat((-48.324278 + randomOffsetLng).toFixed(6)));
                            setIsGpsCapturing(false);
                          }, 800);
                        }}
                        className="text-[11px] text-institutional-blue hover:underline flex items-center gap-0.5"
                        disabled={isGpsCapturing}
                      >
                        <span className="material-symbols-outlined text-[13px]">my_location</span>
                        {isGpsCapturing ? 'Capturando...' : 'Obter Localização'}
                      </button>
                    </label>
                    <div className="w-full px-3 py-2 bg-surface-gray border border-border-subtle rounded text-body-sm text-on-surface flex items-center justify-between min-h-[38px]">
                      {denounceLat !== null && denounceLng !== null ? (
                        <span className="font-mono text-xs text-heritage-green-leaf font-bold">
                          Lat: {denounceLat.toFixed(6)}, Lng: {denounceLng.toFixed(6)}
                        </span>
                      ) : (
                        <span className="text-on-surface-variant text-[11px] italic">Coordenadas GPS não vinculadas</span>
                      )}
                      {denounceLat !== null && (
                        <button 
                          type="button" 
                          onClick={() => { setDenounceLat(null); setDenounceLng(null); }}
                          className="text-status-critical text-[10px] hover:underline"
                        >
                          Limpar
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Urgência e Tipo */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block font-label-caps text-[10px] text-on-surface-variant uppercase tracking-wider">
                      Urgência Estimada
                    </label>
                    <select
                      value={denounceUrgency}
                      onChange={(e) => setDenounceUrgency(e.target.value as any)}
                      className="w-full px-3 py-2 border border-border-subtle rounded text-body-sm text-on-surface focus:border-heritage-green-deep focus:ring-1 outline-none cursor-pointer"
                    >
                      <option value="low">Baixa (Manutenção normal)</option>
                      <option value="medium">Média (Atenção recomendada)</option>
                      <option value="high">Alta (Risco de ruína/perda permanente)</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="block font-label-caps text-[10px] text-on-surface-variant uppercase tracking-wider">
                      Tipo de Ocorrência
                    </label>
                    <select
                      value={denounceType}
                      onChange={(e) => setDenounceType(e.target.value as any)}
                      className="w-full px-3 py-2 border border-border-subtle rounded text-body-sm text-on-surface focus:border-heritage-green-deep focus:ring-1 outline-none cursor-pointer"
                    >
                      <option value="Vandalismo">Vandalismo / Pichação</option>
                      <option value="Degradação">Degradação Natural / Intemperismo</option>
                      <option value="Risco Estrutural">Rachaduras / Risco estrutural</option>
                      <option value="Outros">Outros tipos de danos</option>
                    </select>
                  </div>
                </div>

                {/* Descrição */}
                <div className="space-y-1">
                  <label className="block font-label-caps text-[10px] text-on-surface-variant uppercase tracking-wider">
                    Descrição do Dano Constatado *
                  </label>
                  <textarea
                    value={denounceDesc}
                    onChange={(e) => setDenounceDesc(e.target.value)}
                    className="w-full px-3 py-2 border border-border-subtle rounded text-body-sm text-on-surface focus:border-heritage-green-deep focus:ring-1 outline-none h-28 resize-none"
                    placeholder="Descreva detalhadamente o dano, infiltrações, desabamentos, intervenções não autorizadas, etc."
                    required
                  />
                </div>

                {/* Envio de Fotos (Mínimo de 3 Fotos) */}
                <div className="space-y-2 pt-2 border-t border-border-subtle">
                  <label className="block font-label-caps text-[10px] text-on-surface-variant uppercase tracking-wider flex justify-between items-center">
                    <span>Anexar Fotos Comprobatórias (Mínimo de 3 fotos) *</span>
                    <span className={`text-[10px] font-bold ${denouncePhotos.length >= 3 ? 'text-status-stable' : 'text-status-critical'}`}>
                      {denouncePhotos.length} de 3 anexadas
                    </span>
                  </label>
                  
                  <div className="grid grid-cols-3 gap-2">
                    {[1, 2, 3].map((num) => {
                      const photoIndex = num - 1;
                      const hasPhoto = denouncePhotos[photoIndex] !== undefined;
                      return (
                        <div key={num} className="relative w-full h-24 rounded border border-dashed border-border-subtle bg-surface-gray flex flex-col items-center justify-center overflow-hidden group">
                          {hasPhoto ? (
                            <>
                              <img 
                                src={denouncePhotos[photoIndex]} 
                                alt={`Foto ${num}`} 
                                className="w-full h-full object-cover"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  setDenouncePhotos(prev => prev.filter((_, idx) => idx !== photoIndex));
                                }}
                                className="absolute top-1 right-1 bg-status-critical text-white p-1 rounded-full opacity-80 hover:opacity-100 transition-opacity"
                              >
                                <span className="material-symbols-outlined text-xs block">close</span>
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                const damagePhotos = [
                                  'https://images.unsplash.com/photo-1590076214227-ba79185a6b0c?w=400',
                                  'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400',
                                  'https://images.unsplash.com/photo-1590076214004-9037bc0f607c?w=400'
                                ];
                                const mockImg = damagePhotos[denouncePhotos.length % damagePhotos.length] + `&sig=${Math.random()}`;
                                setDenouncePhotos(prev => [...prev, mockImg]);
                              }}
                              className="w-full h-full flex flex-col items-center justify-center text-on-surface-variant hover:text-primary transition-colors gap-1 cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-[20px]">add_a_photo</span>
                              <span className="text-[10px]">Adicionar Foto {num}</span>
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-[10px] text-on-surface-variant italic">
                    Clique nos botões acima para anexar as fotos comprobatórias do dano (necessário pelo menos 3 fotos para validação).
                  </p>
                </div>

                {/* Nível de Sigilo */}
                <div className="space-y-2 pt-2 border-t border-border-subtle">
                  <label className="block font-label-caps text-[10px] text-on-surface-variant uppercase tracking-wider">
                    Políticas de Sigilo e Identidade *
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setDenounceAnonymity('anonymous')}
                      className={`py-2 px-3 text-body-sm font-label-bold rounded border text-center transition-colors ${
                        denounceAnonymity === 'anonymous'
                          ? 'bg-primary-fixed border-primary text-primary font-bold shadow-sm'
                          : 'bg-white border-border-subtle text-on-surface-variant hover:bg-surface-gray'
                      }`}
                    >
                      Anônima
                    </button>
                    <button
                      type="button"
                      onClick={() => setDenounceAnonymity('confidential')}
                      className={`py-2 px-3 text-body-sm font-label-bold rounded border text-center transition-colors ${
                        denounceAnonymity === 'confidential'
                          ? 'bg-primary-fixed border-primary text-primary font-bold shadow-sm'
                          : 'bg-white border-border-subtle text-on-surface-variant hover:bg-surface-gray'
                      }`}
                    >
                      Sigilosa
                    </button>
                    <button
                      type="button"
                      onClick={() => setDenounceAnonymity('identified')}
                      className={`py-2 px-3 text-body-sm font-label-bold rounded border text-center transition-colors ${
                        denounceAnonymity === 'identified'
                          ? 'bg-primary-fixed border-primary text-primary font-bold shadow-sm'
                          : 'bg-white border-border-subtle text-on-surface-variant hover:bg-surface-gray'
                      }`}
                    >
                      Identificada
                    </button>
                  </div>
                  <p className="text-[10px] text-on-surface-variant italic">
                    {denounceAnonymity === 'anonymous' && 'O sistema não guardará nenhuma informação sua de nome ou contato.'}
                    {denounceAnonymity === 'confidential' && 'Seus dados de contato serão arquivados de forma protegida para possíveis dúvidas técnicas do MPTO, mas nunca revelados publicamente.'}
                    {denounceAnonymity === 'identified' && 'Seus dados de contato serão exibidos no fluxo normal do processo de triagem pública.'}
                  </p>
                </div>

                {/* Campos do Cidadão se for Identificada/Sigilosa */}
                {denounceAnonymity !== 'anonymous' && (
                  <div className="grid grid-cols-2 gap-3 p-4 bg-surface-gray/50 rounded-lg border border-border-subtle/50 animate-fade-in">
                    <div className="space-y-1">
                      <label className="block font-label-caps text-[10px] text-on-surface-variant uppercase tracking-wider">Seu Nome *</label>
                      <input
                        type="text"
                        value={denounceName}
                        onChange={(e) => setDenounceName(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-border-subtle rounded text-body-sm outline-none"
                        placeholder="Ex: João Silva"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block font-label-caps text-[10px] text-on-surface-variant uppercase tracking-wider">E-mail / Telefone *</label>
                      <input
                        type="text"
                        value={denounceContact}
                        onChange={(e) => setDenounceContact(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-border-subtle rounded text-body-sm outline-none"
                        placeholder="Ex: joao@email.com"
                        required
                      />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-3 bg-heritage-green-deep hover:bg-primary text-white font-label-bold text-label-bold uppercase rounded transition-colors shadow-sm"
                >
                  Registrar Denúncia de Dano
                </button>
              </form>
            </div>
            <div className="lg:col-span-6 lg:sticky lg:top-4">
              <ChannelMap
                activeSubTab={activeSubTab}
                assets={assets}
                suggestLat={suggestLat}
                suggestLng={suggestLng}
                setSuggestLat={setSuggestLat}
                setSuggestLng={setSuggestLng}
                setSuggestLocation={setSuggestLocation}
                denounceLat={denounceLat}
                denounceLng={denounceLng}
                setDenounceLat={setDenounceLat}
                setDenounceLng={setDenounceLng}
                setDenounceLocation={setDenounceLocation}
                setSelectedAssetId={setSelectedAssetId}
              />
            </div>
          </div>
        )}

            {/* 2. ABA SUGERIR PATRIMÔNIO */}
            {activeSubTab === 'suggest' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                <div className="lg:col-span-6">
                  <form onSubmit={handleSuggestSubmit} className="space-y-5">
                <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface border-b border-border-subtle pb-2">
                  Sugerir Bem para Catalogação
                </h3>

                {/* Nome do Bem */}
                <div className="space-y-1">
                  <label className="block font-label-caps text-[10px] text-on-surface-variant uppercase tracking-wider">
                    Nome Sugerido do Ativo Patrimonial *
                  </label>
                  <input
                    type="text"
                    value={suggestName}
                    onChange={(e) => setSuggestName(e.target.value)}
                    className="w-full px-3 py-2 border border-border-subtle rounded text-body-sm text-on-surface focus:border-heritage-green-deep focus:ring-1 outline-none"
                    placeholder="Ex: Ruínas da Capela do Bonfim"
                    required
                  />
                </div>

                {/* Categoria e Localidade */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block font-label-caps text-[10px] text-on-surface-variant uppercase tracking-wider">
                      Categoria do Bem *
                    </label>
                    <select
                      value={suggestCategory}
                      onChange={(e) => setSuggestCategory(e.target.value as any)}
                      className="w-full px-3 py-2 border border-border-subtle rounded text-body-sm text-on-surface focus:border-heritage-green-deep focus:ring-1 outline-none cursor-pointer"
                    >
                      <option value="material">Material (Edificações/Monumentos)</option>
                      <option value="natural">Natural (Reservas/Belezas Cênicas)</option>
                      <option value="arqueologico">Arqueológico (Sítios rupestres/históricos)</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="block font-label-caps text-[10px] text-on-surface-variant uppercase tracking-wider">
                      Localidade / Município *
                    </label>
                    <input
                      type="text"
                      value={suggestLocation}
                      onChange={(e) => setSuggestLocation(e.target.value)}
                      className="w-full px-3 py-2 border border-border-subtle rounded text-body-sm text-on-surface focus:border-heritage-green-deep focus:ring-1 outline-none"
                      placeholder="Ex: Natividade - Zona Rural"
                      required
                    />
                  </div>
                </div>

                {/* Coordenadas */}
                <div className="space-y-1">
                  <label className="block font-label-caps text-[10px] text-on-surface-variant uppercase tracking-wider flex justify-between items-center">
                    <span>Coordenadas Geográficas (Latitude/Longitude) *</span>
                    <button
                      type="button"
                      onClick={handleGetCoordinates}
                      className="text-[11px] text-institutional-blue hover:underline flex items-center gap-0.5"
                    >
                      <span className="material-symbols-outlined text-[13px]">my_location</span>
                      Obter Coordenadas do GPS
                    </button>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="number"
                      step="0.000001"
                      value={suggestLat}
                      onChange={(e) => setSuggestLat(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-border-subtle rounded text-body-sm text-on-surface focus:border-heritage-green-deep focus:ring-1 outline-none"
                      placeholder="Latitude"
                      required
                    />
                    <input
                      type="number"
                      step="0.000001"
                      value={suggestLng}
                      onChange={(e) => setSuggestLng(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-border-subtle rounded text-body-sm text-on-surface focus:border-heritage-green-deep focus:ring-1 outline-none"
                      placeholder="Longitude"
                      required
                    />
                  </div>
                </div>

                {/* Justificativa */}
                <div className="space-y-1">
                  <label className="block font-label-caps text-[10px] text-on-surface-variant uppercase tracking-wider">
                    Justificativa de Tombamento / Valor Histórico *
                  </label>
                  <textarea
                    value={suggestDesc}
                    onChange={(e) => setSuggestDesc(e.target.value)}
                    className="w-full px-3 py-2 border border-border-subtle rounded text-body-sm text-on-surface focus:border-heritage-green-deep focus:ring-1 outline-none h-24 resize-none"
                    placeholder="Explique por que este bem patrimonial merece ser preservado e catalogado oficialmente pelo Caoma."
                    required
                  />
                </div>

                {/* Envio de Fotos para Sugestão */}
                <div className="space-y-2 pt-2 border-t border-border-subtle">
                  <label className="block font-label-caps text-[10px] text-on-surface-variant uppercase tracking-wider flex justify-between items-center">
                    <span>Anexar Fotos do Patrimônio (Mínimo de 1 foto) *</span>
                    <span className={`text-[10px] font-bold ${suggestPhotos.length >= 1 ? 'text-status-stable' : 'text-status-critical'}`}>
                      {suggestPhotos.length} de 3 anexada(s)
                    </span>
                  </label>
                  
                  <div className="grid grid-cols-3 gap-2">
                    {[1, 2, 3].map((num) => {
                      const photoIndex = num - 1;
                      const hasPhoto = suggestPhotos[photoIndex] !== undefined;
                      return (
                        <div key={num} className="relative w-full h-24 rounded border border-dashed border-border-subtle bg-surface-gray flex flex-col items-center justify-center overflow-hidden group">
                          {hasPhoto ? (
                            <>
                              <img 
                                src={suggestPhotos[photoIndex]} 
                                alt={`Foto Sugestão ${num}`} 
                                className="w-full h-full object-cover"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  setSuggestPhotos(prev => prev.filter((_, idx) => idx !== photoIndex));
                                }}
                                className="absolute top-1 right-1 bg-status-critical text-white p-1 rounded-full opacity-80 hover:opacity-100 transition-opacity"
                              >
                                <span className="material-symbols-outlined text-xs block">close</span>
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                const suggestPhotosMock = [
                                  'https://images.unsplash.com/photo-1544816155-12df9643f363?w=400',
                                  'https://images.unsplash.com/photo-1563911302283-d2bc129e7570?w=400',
                                  'https://images.unsplash.com/photo-1605649487212-47bdab064df7?w=400'
                                ];
                                const mockImg = suggestPhotosMock[suggestPhotos.length % suggestPhotosMock.length] + `&sig=${Math.random()}`;
                                setSuggestPhotos(prev => [...prev, mockImg]);
                              }}
                              className="w-full h-full flex flex-col items-center justify-center text-on-surface-variant hover:text-primary transition-colors gap-1 cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-[20px]">add_a_photo</span>
                              <span className="text-[10px]">Adicionar Foto {num}</span>
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-[10px] text-on-surface-variant italic">
                    Clique nos botões acima para anexar as fotos do bem sugerido (necessário pelo menos 1 foto para validação).
                  </p>
                </div>

                {/* Nível de Sigilo */}
                <div className="space-y-2 pt-2 border-t border-border-subtle">
                  <label className="block font-label-caps text-[10px] text-on-surface-variant uppercase tracking-wider">
                    Políticas de Sigilo e Identidade *
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setSuggestAnonymity('anonymous')}
                      className={`py-2 px-3 text-body-sm font-label-bold rounded border text-center transition-colors ${
                        suggestAnonymity === 'anonymous'
                          ? 'bg-primary-fixed border-primary text-primary font-bold shadow-sm'
                          : 'bg-white border-border-subtle text-on-surface-variant hover:bg-surface-gray'
                      }`}
                    >
                      Anônima
                    </button>
                    <button
                      type="button"
                      onClick={() => setSuggestAnonymity('confidential')}
                      className={`py-2 px-3 text-body-sm font-label-bold rounded border text-center transition-colors ${
                        suggestAnonymity === 'confidential'
                          ? 'bg-primary-fixed border-primary text-primary font-bold shadow-sm'
                          : 'bg-white border-border-subtle text-on-surface-variant hover:bg-surface-gray'
                      }`}
                    >
                      Sigilosa
                    </button>
                    <button
                      type="button"
                      onClick={() => setSuggestAnonymity('identified')}
                      className={`py-2 px-3 text-body-sm font-label-bold rounded border text-center transition-colors ${
                        suggestAnonymity === 'identified'
                          ? 'bg-primary-fixed border-primary text-primary font-bold shadow-sm'
                          : 'bg-white border-border-subtle text-on-surface-variant hover:bg-surface-gray'
                      }`}
                    >
                      Identificada
                    </button>
                  </div>
                </div>

                {/* Campos do Cidadão */}
                {suggestAnonymity !== 'anonymous' && (
                  <div className="grid grid-cols-2 gap-3 p-4 bg-surface-gray/50 rounded-lg border border-border-subtle/50 animate-fade-in">
                    <div className="space-y-1">
                      <label className="block font-label-caps text-[10px] text-on-surface-variant uppercase tracking-wider">Seu Nome *</label>
                      <input
                        type="text"
                        value={suggestReporterName}
                        onChange={(e) => setSuggestReporterName(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-border-subtle rounded text-body-sm outline-none"
                        placeholder="Ex: João Silva"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block font-label-caps text-[10px] text-on-surface-variant uppercase tracking-wider">E-mail / Telefone *</label>
                      <input
                        type="text"
                        value={suggestReporterContact}
                        onChange={(e) => setSuggestReporterContact(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-border-subtle rounded text-body-sm outline-none"
                        placeholder="Ex: joao@email.com"
                        required
                      />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-3 bg-heritage-green-deep hover:bg-primary text-white font-label-bold text-label-bold uppercase rounded transition-colors shadow-sm"
                >
                  Enviar Sugestão de Patrimônio
                </button>
              </form>
            </div>
            <div className="lg:col-span-6 lg:sticky lg:top-4">
              <ChannelMap
                activeSubTab={activeSubTab}
                assets={assets}
                suggestLat={suggestLat}
                suggestLng={suggestLng}
                setSuggestLat={setSuggestLat}
                setSuggestLng={setSuggestLng}
                setSuggestLocation={setSuggestLocation}
                denounceLat={denounceLat}
                denounceLng={denounceLng}
                setDenounceLat={setDenounceLat}
                setDenounceLng={setDenounceLng}
                setDenounceLocation={setDenounceLocation}
                setSelectedAssetId={setSelectedAssetId}
              />
            </div>
          </div>
        )}

            {/* 3. ABA ACOMPANHAR PROTOCOLO */}
            {activeSubTab === 'track' && (
              <div className="max-w-xl mx-auto space-y-6">
                <form onSubmit={handleTrackSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg">
                        tag
                      </span>
                      <input
                        type="text"
                        value={searchTrackingId}
                        onChange={(e) => setSearchTrackingId(e.target.value)}
                        className="w-full pl-10 pr-3 py-2.5 border border-border-subtle rounded text-body-sm text-on-surface focus:border-heritage-green-deep focus:ring-1 outline-none uppercase font-mono tracking-wider"
                        placeholder="Protocolo (ex: DEN-1023)"
                        required
                      />
                    </div>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg">
                        lock
                      </span>
                      <input
                        type="text"
                        value={searchAccessKey}
                        onChange={(e) => setSearchAccessKey(e.target.value)}
                        className="w-full pl-10 pr-3 py-2.5 border border-border-subtle rounded text-body-sm text-on-surface focus:border-heritage-green-deep focus:ring-1 outline-none uppercase font-mono tracking-wider"
                        placeholder="Chave de Acesso (apenas p/ anônima)"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2.5 bg-heritage-green-deep hover:bg-primary text-white font-label-bold text-label-bold uppercase rounded transition-colors shadow-sm flex items-center justify-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[18px]">search</span>
                    Consultar Protocolo
                  </button>
                </form>

                {searchAttempted && !trackedItem && (
                  <div className="p-5 text-center text-body-md text-status-critical bg-status-critical/10 border border-status-critical/30 rounded-lg animate-fade-in">
                    Nenhum protocolo encontrado com o código "{searchTrackingId}". Verifique a digitação e tente novamente.
                  </div>
                )}

                {trackedItem && (
                  <div className="space-y-6 border border-border-subtle rounded-xl p-5 bg-white shadow-sm animate-fade-in">
                    {/* Header */}
                    <div className="flex justify-between items-start border-b border-border-subtle pb-3">
                      <div>
                        <span className="font-mono text-outline-variant text-[12px]">{trackedItem.id}</span>
                        <h4 className="font-bold text-on-surface text-body-lg mt-0.5">{trackedItem.assetName}</h4>
                        <p className="text-body-sm text-on-surface-variant flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">location_on</span>
                          {trackedItem.location}
                        </p>
                      </div>
                      
                      {/* Badge de status */}
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full font-label-bold text-[11px] ${
                        trackedItem.status === 'pending'
                          ? 'bg-status-warning/10 text-status-warning'
                          : trackedItem.status === 'approved'
                          ? 'bg-status-stable/10 text-status-stable'
                          : 'bg-gray-100 text-gray-500'
                      }`}>
                        {trackedItem.status === 'pending' && 'Em Triagem'}
                        {trackedItem.status === 'approved' && (trackedItem.id.startsWith('SUG-') ? 'Sugestão Aprovada' : 'Aprovado / Ocorrência Aberta')}
                        {trackedItem.status === 'archived' && (trackedItem.id.startsWith('SUG-') ? 'Sugestão Recusada' : 'Arquivado')}
                      </span>
                    </div>
 
                    {/* Descrição */}
                    <div className="space-y-1">
                      <span className="font-label-caps text-[10px] text-on-surface-variant uppercase block">Relato Enviado</span>
                      <p className="text-on-surface text-body-sm leading-relaxed bg-surface-gray/50 p-3 rounded-lg border border-border-subtle/50">
                        {trackedItem.description}
                      </p>
                    </div>
 
                    {/* Detalhes de Retorno Técnico (Laudo e Parecer) */}
                    {trackedOccurrence && trackedOccurrence.status === 'resolved' && (
                      <div className="p-4 bg-green-50 rounded-xl border border-green-200 space-y-3 animate-fade-in">
                        <h5 className="font-label-caps text-green-800 font-bold uppercase text-[11px] tracking-wider flex items-center gap-1">
                          <span className="material-symbols-outlined text-[15px]">verified</span>
                          Retorno Técnico da Fiscalização (CAOMA/MPTO)
                        </h5>
                        <p className="text-on-surface text-body-sm leading-relaxed italic">
                          "{trackedOccurrence.report}"
                        </p>
                        
                        {/* Se tiver encaminhamento */}
                        {trackedOccurrence.referralDest && trackedOccurrence.referralDest !== 'none' && (
                          <div className="pt-2 border-t border-green-200/50 text-[12px] text-green-900 space-y-1">
                            <p className="font-bold flex items-center gap-1">
                              <span className="material-symbols-outlined text-[14px]">gavel</span>
                              Encaminhamento Institucional &amp; Jurídico:
                            </p>
                            <p>Encaminhado para: <strong>{getReferralLabel(trackedOccurrence.referralDest)}</strong></p>
                            {trackedOccurrence.referralCaseNumber && (
                              <p>Nº de Acompanhamento: <strong>{trackedOccurrence.referralCaseNumber}</strong></p>
                            )}
                            {trackedOccurrence.referralNotes && (
                              <p className="text-green-800/80">Despacho: {trackedOccurrence.referralNotes}</p>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Retorno Técnico para Sugestões */}
                    {trackedItem.id.startsWith('SUG-') && trackedItem.status === 'approved' && (
                      <div className="p-4 bg-green-50 rounded-xl border border-green-200 space-y-3 animate-fade-in">
                        <h5 className="font-label-caps text-green-800 font-bold uppercase text-[11px] tracking-wider flex items-center gap-1">
                          <span className="material-symbols-outlined text-[15px]">verified</span>
                          Retorno Técnico (CAOMA/MPTO)
                        </h5>
                        <p className="text-on-surface text-body-sm leading-relaxed font-semibold text-status-stable">
                          Sua sugestão de catalogação foi avaliada e aprovada pela equipe técnica do CAOMA. O bem foi integrado oficialmente ao inventário público do Sentinela do Patrimônio!
                        </p>
                      </div>
                    )}
                    {trackedItem.id.startsWith('SUG-') && trackedItem.status === 'archived' && (
                      <div className="p-4 bg-red-50 rounded-xl border border-red-200 space-y-3 animate-fade-in">
                        <h5 className="font-label-caps text-red-800 font-bold uppercase text-[11px] tracking-wider flex items-center gap-1">
                          <span className="material-symbols-outlined text-[15px]">info</span>
                          Retorno Técnico (CAOMA/MPTO)
                        </h5>
                        <p className="text-on-surface text-body-sm leading-relaxed text-status-critical">
                          Após análise técnica da equipe do CAOMA, a sugestão de inclusão deste bem foi arquivada. Agradecemos sua colaboração na defesa do patrimônio tocantinense.
                        </p>
                      </div>
                    )}
 
                    {/* Timeline de Rastreabilidade */}
                    <div className="space-y-4 pt-3 border-t border-border-subtle">
                      <span className="font-label-caps text-label-caps text-primary uppercase font-bold tracking-wider">
                        Rastreabilidade e Auditoria do Protocolo
                      </span>
                      
                      <div className="relative pl-6 border-l-2 border-border-subtle space-y-5">
                        {trackedItem.timeline.map((step, idx) => (
                          <div key={idx} className="relative">
                            {/* Pontinho */}
                            <span className="absolute -left-[31px] top-0.5 w-2.5 h-2.5 rounded-full bg-heritage-green-deep border-2 border-white ring-4 ring-heritage-green-deep/10" />
                            <div>
                              <span className="font-bold text-on-surface text-body-sm">{step.status}</span>
                              <span className="text-[10px] text-on-surface-variant ml-2">
                                {new Date(step.date).toLocaleString('pt-BR')}
                              </span>
                              <p className="text-[11px] text-on-surface-variant mt-0.5">{step.description}</p>
                            </div>
                          </div>
                        ))}
                        {/* Se estiver associada a uma ocorrência ativa, estender a timeline */}
                        {trackedOccurrence && trackedOccurrence.timeline.slice(trackedItem.timeline.length).map((step: any, idx: number) => (
                          <div key={idx} className="relative">
                            <span className="absolute -left-[31px] top-0.5 w-2.5 h-2.5 rounded-full bg-institutional-blue border-2 border-white ring-4 ring-institutional-blue/10" />
                            <div>
                              <span className="font-bold text-on-surface text-body-sm">{step.status}</span>
                              <span className="text-[10px] text-on-surface-variant ml-2">
                                {new Date(step.date).toLocaleString('pt-BR')}
                              </span>
                              <p className="text-[11px] text-on-surface-variant mt-0.5">{step.description}</p>
                              {step.user && (
                                <span className="text-[9px] font-bold text-outline uppercase tracking-widest mt-0.5 block">
                                  Por: {step.user}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
