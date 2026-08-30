import { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Feature, MapState, PelotonType } from './types';
import './styles.css';

const CULTRA_CENTER: [number, number] = [40.879417, -7.348667];
const ZOOM_LEVEL = 13;

interface Scenario {
  id: string;
  name: string;
  description: string;
  data: MapState;
  createdAt: Date;
  updatedAt: Date;
}

interface UserLocation {
  userId: string;
  name: string;
  pelotao: PelotonType;
  lat: number;
  lng: number;
  timestamp: Date;
  status: 'active' | 'inactive' | 'emergency';
}

const PELOTAO_COLORS: Record<PelotonType, string> = {
  alfa: '#3b82f6',
  bravo: '#10b981',
  charlie: '#f97316'
};

function App() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const layerGroup = useRef<L.FeatureGroup>(new L.FeatureGroup());

  const [mapState, setMapState] = useState<MapState>({
    features: [],
    routes: [],
    zones: [],
    users: [],
  });

  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [currentScenario, setCurrentScenario] = useState<string | null>(null);
  const [userLocations, setUserLocations] = useState<UserLocation[]>([]);

  const [editMode, setEditMode] = useState<'view' | 'draw' | 'edit'>('view');
  const [selectedType, setSelectedType] = useState<string>('camp');
  const [selectedName, setSelectedName] = useState('');
  const [mapLayer, setMapLayer] = useState<'osm' | 'satellite' | 'topographic'>('osm');
  const [scenarioName, setScenarioName] = useState('');
  const [showTerrainAnalysis, setShowTerrainAnalysis] = useState(false);

  const layerRefs = useRef<Record<string, L.TileLayer>>({});

  useEffect(() => {
    if (map.current) return;

    if (mapContainer.current) {
      map.current = L.map(mapContainer.current).setView(CULTRA_CENTER, ZOOM_LEVEL);

      layerRefs.current.osm = L.tileLayer(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        { attribution: '© OpenStreetMap', maxZoom: 19 }
      ).addTo(map.current);

      layerRefs.current.satellite = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        { attribution: '© Esri', maxZoom: 19 }
      );

      layerRefs.current.topographic = L.tileLayer(
        'https://tile.opentopomap.org/{z}/{x}/{y}.png',
        { attribution: '© OpenTopoMap', maxZoom: 17 }
      );

      layerGroup.current.addTo(map.current);

      L.circleMarker(CULTRA_CENTER, {
        radius: 6,
        fillColor: '#000',
        color: '#fff',
        weight: 2,
        fillOpacity: 0.6,
      }).bindPopup('CULTRA Base: 40°52\'45.9"N, 7°20\'55.2"W').addTo(map.current);

      loadInitialData();
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!map.current || !layerRefs.current) return;

    Object.values(layerRefs.current).forEach(layer => {
      if (map.current?.hasLayer(layer)) {
        map.current.removeLayer(layer);
      }
    });

    const layer = layerRefs.current[mapLayer];
    if (layer) {
      map.current.addLayer(layer);
    }
  }, [mapLayer]);

  const loadInitialData = () => {
    const defaultScenario: Scenario = {
      id: 'default',
      name: 'BootCamp CULTRA 2026',
      description: 'Cenário padrão',
      data: {
        features: [
          {
            id: 'AC-0',
            type: 'camp',
            name: 'Acampamento Base',
            coordinates: [40.879417, -7.348667],
            createdAt: new Date(),
          },
          {
            id: 'AC-A',
            type: 'camp',
            name: 'Acampamento Alfa',
            coordinates: [40.885, -7.345],
            createdAt: new Date(),
          },
          {
            id: 'CX-A',
            type: 'box',
            name: 'Caixa Alfa',
            coordinates: [40.890, -7.340],
            createdAt: new Date(),
          },
        ],
        routes: [],
        zones: [],
        users: [],
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setScenarios([defaultScenario]);
    setCurrentScenario('default');
    setMapState(defaultScenario.data);
    renderFeatures(defaultScenario.data.features);
  };

  const renderFeatures = (features: Feature[]) => {
    if (!layerGroup.current) return;
    layerGroup.current.clearLayers();

    features.forEach(feature => {
      const [lat, lng] = feature.coordinates;
      const marker = L.circleMarker([lat, lng], {
        radius: 7,
        fillColor: '#1e40af',
        color: '#fff',
        weight: 2,
        fillOpacity: 0.7,
      }) as any;

      const popup = `<b>${feature.name}</b><br/>Type: ${feature.type}<br/>Lat: ${lat.toFixed(6)}<br/>Lng: ${lng.toFixed(6)}`;
      marker.bindPopup(popup).addTo(layerGroup.current!);
    });
  };

  const addFeature = (lat: number, lng: number) => {
    if (!selectedName) {
      alert('Escreve um nome!');
      return;
    }

    const newFeature: Feature = {
      id: `${selectedType.toUpperCase()}-${Date.now()}`,
      type: selectedType as any,
      name: selectedName,
      coordinates: [lat, lng],
      createdAt: new Date(),
    };

    const updatedState: MapState = {
      ...mapState,
      features: [...mapState.features, newFeature],
    };

    setMapState(updatedState);
    renderFeatures(updatedState.features);
    setSelectedName('');
    setEditMode('view');
  };

  const saveScenario = () => {
    if (!scenarioName) {
      alert('Dá um nome ao cenário!');
      return;
    }

    const newScenario: Scenario = {
      id: `scenario-${Date.now()}`,
      name: scenarioName,
      description: `Criado em ${new Date().toLocaleDateString()}`,
      data: mapState,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setScenarios([...scenarios, newScenario]);
    setCurrentScenario(newScenario.id);
    setScenarioName('');
    alert(`Cenário "${scenarioName}" guardado!`);
  };

  const loadScenario = (scenarioId: string) => {
    const scenario = scenarios.find(s => s.id === scenarioId);
    if (scenario) {
      setMapState(scenario.data);
      setCurrentScenario(scenarioId);
      renderFeatures(scenario.data.features);
    }
  };

  const deleteScenario = (scenarioId: string) => {
    if (confirm('Tens a certeza?')) {
      setScenarios(scenarios.filter(s => s.id !== scenarioId));
      if (currentScenario === scenarioId) {
        setCurrentScenario(null);
      }
    }
  };

  const deleteFeature = (featureId: string) => {
    const updated = mapState.features.filter(f => f.id !== featureId);
    setMapState({ ...mapState, features: updated });
    renderFeatures(updated);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      let geojson: any;

      if (file.name.endsWith('.kml')) {
        geojson = { features: [] };
      } else {
        geojson = JSON.parse(text);
      }

      if (geojson.features) {
        const importedFeatures: Feature[] = geojson.features
          .filter((f: any) => f.geometry?.coordinates)
          .map((f: any, i: number) => ({
            id: `imported-${Date.now()}-${i}`,
            type: 'control_point' as any,
            name: f.properties?.name || `Importado ${i + 1}`,
            coordinates: f.geometry.type === 'Point'
              ? [f.geometry.coordinates[1], f.geometry.coordinates[0]]
              : [40.879417, -7.348667],
            createdAt: new Date(),
          }));

        const updated: MapState = {
          ...mapState,
          features: [...mapState.features, ...importedFeatures],
        };
        setMapState(updated);
        renderFeatures(updated.features);
        alert(`${importedFeatures.length} pontos importados!`);
      }
    } catch (error) {
      alert(`Erro: ${error instanceof Error ? error.message : 'desconhecido'}`);
    }
  };

  const simulateUserLocations = () => {
    const locations: UserLocation[] = [
      { userId: 'u1', name: 'João Silva', pelotao: 'alfa', lat: 40.879, lng: -7.348, timestamp: new Date(), status: 'active' },
      { userId: 'u2', name: 'Maria Santos', pelotao: 'bravo', lat: 40.881, lng: -7.350, timestamp: new Date(), status: 'active' },
      { userId: 'u3', name: 'Pedro Costa', pelotao: 'charlie', lat: 40.877, lng: -7.346, timestamp: new Date(), status: 'active' },
    ];

    setUserLocations(locations);

    locations.forEach(loc => {
      if (map.current) {
        const marker = L.circleMarker([loc.lat, loc.lng], {
          radius: 5,
          fillColor: PELOTAO_COLORS[loc.pelotao],
          color: '#fff',
          weight: 1,
          fillOpacity: 0.8,
        }) as any;
        marker.bindPopup(`${loc.name} (${loc.pelotao})`).addTo(map.current);
      }
    });
  };

  const exportScenario = () => {
    const data = JSON.stringify(mapState, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cultra-scenario-${Date.now()}.json`;
    a.click();
  };

  useEffect(() => {
    if (!map.current || editMode !== 'draw') return;

    const handler = (e: L.LeafletMouseEvent) => {
      addFeature(e.latlng.lat, e.latlng.lng);
    };

    map.current.on('click', handler);
    return () => {
      if (map.current) map.current.off('click', handler);
    };
  }, [editMode, selectedType, selectedName, mapState.features]);

  return (
    <div className="cultra-gis-advanced">
      <header className="gis-header">
        <h1>🗺️ CULTRA BootCamp GIS Advanced</h1>
        <p>Gestão Operacional com Análise de Terreno</p>
      </header>

      <div className="gis-container">
        <div className="control-panel">
          <div className="section">
            <h3>Camadas de Mapa</h3>
            <div className="layer-buttons">
              <button className={`layer-btn ${mapLayer === 'osm' ? 'active' : ''}`} onClick={() => setMapLayer('osm')}>🗺️ OSM</button>
              <button className={`layer-btn ${mapLayer === 'satellite' ? 'active' : ''}`} onClick={() => setMapLayer('satellite')}>🛰️ Satélite</button>
              <button className={`layer-btn ${mapLayer === 'topographic' ? 'active' : ''}`} onClick={() => setMapLayer('topographic')}>⛰️ Topo</button>
            </div>
          </div>

          <div className="section">
            <h3>Modos</h3>
            <button className={`btn ${editMode === 'view' ? 'active' : ''}`} onClick={() => setEditMode('view')}>👁️ Ver</button>
            <button className={`btn ${editMode === 'draw' ? 'active' : ''}`} onClick={() => setEditMode('draw')}>✏️ Desenhar</button>
          </div>

          {editMode === 'draw' && (
            <div className="section">
              <h3>Novo Ponto</h3>
              <select value={selectedType} onChange={e => setSelectedType(e.target.value)}>
                <option value="camp">Acampamento</option>
                <option value="box">Caixa</option>
                <option value="control_point">Controlo</option>
                <option value="emergency">Emergência</option>
              </select>
              <input type="text" placeholder="Nome..." value={selectedName} onChange={e => setSelectedName(e.target.value)} />
            </div>
          )}

          <div className="section">
            <h3>Importar Ficheiros</h3>
            <input type="file" accept=".kml,.geojson,.json" onChange={handleFileUpload} style={{ fontSize: '0.8em' }} />
          </div>

          <div className="section">
            <h3>Pontos ({mapState.features.length})</h3>
            <div className="features-list">
              {mapState.features.map(f => (
                <div key={f.id} className="feature-item">
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div><strong>{f.name}</strong><small>{f.type}</small></div>
                    <button className="delete-btn" onClick={() => deleteFeature(f.id)}>✕</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="map-wrapper">
          <div className="map-container" ref={mapContainer}></div>
        </div>

        <div className="info-panel">
          <div className="section">
            <h3>Cenários</h3>
            <div className="scenario-input">
              <input type="text" placeholder="Nome..." value={scenarioName} onChange={e => setScenarioName(e.target.value)} />
              <button className="btn" onClick={saveScenario}>💾 Guardar</button>
            </div>

            <div className="scenarios-list">
              {scenarios.map(s => (
                <div key={s.id} className="scenario-item">
                  <div><strong>{s.name}</strong><small>{s.data.features.length} pontos</small></div>
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    <button className={`scenario-btn ${currentScenario === s.id ? 'active' : ''}`} onClick={() => loadScenario(s.id)}>⏯️</button>
                    <button className="scenario-btn delete" onClick={() => deleteScenario(s.id)}>🗑️</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="section">
            <h3>Utilizadores ({userLocations.length})</h3>
            <button className="btn" onClick={simulateUserLocations}>👥 Localizar</button>
            {userLocations.map(loc => (
              <div key={loc.userId} className="user-item">
                <strong>{loc.name}</strong>
                <small>{loc.pelotao} • {loc.lat.toFixed(4)}, {loc.lng.toFixed(4)}</small>
              </div>
            ))}
          </div>

          <div className="section">
            <h3>Análise de Terreno</h3>
            <button className="btn" onClick={() => setShowTerrainAnalysis(!showTerrainAnalysis)}>{showTerrainAnalysis ? '🔒' : '🔓'} Análise</button>
            {showTerrainAnalysis && (
              <div className="terrain-analysis">
                <p>📊 Pontos: {mapState.features.length}</p>
                <p>📍 Centro: {CULTRA_CENTER[0].toFixed(4)}°</p>
              </div>
            )}
          </div>

          <div className="section">
            <h3>Exportar</h3>
            <button className="btn" onClick={exportScenario}>📥 GeoJSON</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
