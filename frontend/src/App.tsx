import { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Feature, Camp, Box, MapState, PelotonType, ZoneType } from './types';
import './styles.css';

const CULTRA_CENTER: [number, number] = [40.879417, -7.348667];
const ZOOM_LEVEL = 13;

// Color scheme by zone type
const ZONE_COLORS: Record<ZoneType, string> = {
  safe: '#4ade80',      // green
  risk: '#f59e0b',      // amber
  danger: '#ef4444',    // red
  restricted: '#8b5cf6', // purple
  emergency: '#06b6d4'  // cyan
};

// Pelotão colors
const PELOTAO_COLORS: Record<PelotonType, string> = {
  alfa: '#3b82f6',      // blue
  bravo: '#10b981',     // emerald
  charlie: '#f97316'    // orange
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

  const [editMode, setEditMode] = useState<'view' | 'draw' | 'edit'>('view');
  const [selectedType, setSelectedType] = useState<string>('camp');
  const [selectedName, setSelectedName] = useState('');

  // Initialize map
  useEffect(() => {
    if (map.current) return;
    
    if (mapContainer.current) {
      map.current = L.map(mapContainer.current).setView(CULTRA_CENTER, ZOOM_LEVEL);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map.current);

      // Add layer group
      layerGroup.current.addTo(map.current);

      // Add marker at center
      L.circleMarker(CULTRA_CENTER, {
        radius: 6,
        fillColor: '#000',
        color: '#fff',
        weight: 2,
        opacity: 0.8,
        fillOpacity: 0.6,
      }).bindPopup('40°52\'45.9"N, 7°20\'55.2"W<br>CULTRA Base').addTo(map.current);

      // Add sample zones
      initializeSampleData();
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  const initializeSampleData = () => {
    // Sample acampamentos
    const camps: Camp[] = [
      {
        id: 'AC-0',
        type: 'camp',
        name: 'Acampamento Base',
        coordinates: [40.879417, -7.348667],
        isPrimary: true,
        createdAt: new Date(),
      },
      {
        id: 'AC-A',
        type: 'camp',
        name: 'Acampamento Alfa',
        coordinates: [40.885, -7.345],
        pelotao: 'alfa',
        createdAt: new Date(),
      },
      {
        id: 'AC-B',
        type: 'camp',
        name: 'Acampamento Bravo',
        coordinates: [40.875, -7.350],
        pelotao: 'bravo',
        createdAt: new Date(),
      },
      {
        id: 'AC-C',
        type: 'camp',
        name: 'Acampamento Charlie',
        coordinates: [40.870, -7.355],
        pelotao: 'charlie',
        createdAt: new Date(),
      },
    ];

    // Sample caixas
    const boxes: Box[] = [
      {
        id: 'CX-A',
        type: 'box',
        name: 'Caixa Alfa',
        coordinates: [40.890, -7.340],
        pelotao: 'alfa',
        status: 'not_found',
        createdAt: new Date(),
      },
      {
        id: 'CX-B',
        type: 'box',
        name: 'Caixa Bravo',
        coordinates: [40.870, -7.360],
        pelotao: 'bravo',
        status: 'not_found',
        createdAt: new Date(),
      },
      {
        id: 'CX-C',
        type: 'box',
        name: 'Caixa Charlie',
        coordinates: [40.865, -7.340],
        pelotao: 'charlie',
        status: 'not_found',
        createdAt: new Date(),
      },
    ];

    const allFeatures = [...camps, ...boxes] as Feature[];
    setMapState(prev => ({
      ...prev,
      features: allFeatures,
    }));

    renderFeatures([...camps, ...boxes]);
  };

  const renderFeatures = (features: Feature[]) => {
    if (!layerGroup.current) return;
    layerGroup.current.clearLayers();

    features.forEach(feature => {
      const [lat, lng] = feature.coordinates;
      let marker: L.Marker | L.CircleMarker;
      let color = '#000';

      if (feature.type === 'camp') {
        const camp = feature as Camp;
        color = camp.isPrimary ? '#000' : PELOTAO_COLORS[camp.pelotao || 'alfa'];
        marker = L.circleMarker([lat, lng], {
          radius: 8,
          fillColor: color,
          color: '#fff',
          weight: 2,
          opacity: 1,
          fillOpacity: 0.7,
        });
      } else if (feature.type === 'box') {
        const box = feature as Box;
        color = PELOTAO_COLORS[box.pelotao];
        marker = L.marker([lat, lng], {
          icon: L.divIcon({
            html: `<div style="background:${color};width:20px;height:20px;border-radius:50%;border:2px solid white;display:flex;align-items:center;justify-content:center;font-size:10px;color:white;font-weight:bold;">📦</div>`,
            iconSize: [24, 24],
            className: 'custom-marker',
          }),
        });
      } else {
        marker = L.circleMarker([lat, lng], {
          radius: 5,
          fillColor: color,
          color: '#fff',
          weight: 1,
          opacity: 0.8,
          fillOpacity: 0.5,
        });
      }

      const popup = `
        <b>${feature.name}</b><br/>
        Type: ${feature.type}<br/>
        Lat: ${lat.toFixed(6)}<br/>
        Lng: ${lng.toFixed(6)}
      `;

      marker.bindPopup(popup).addTo(layerGroup.current!);
    });
  };

  const addFeature = (lat: number, lng: number) => {
    if (!selectedName) {
      alert('Escreve um nome para o ponto!');
      return;
    }

    const newFeature: Feature = {
      id: `${selectedType.toUpperCase()}-${Date.now()}`,
      type: selectedType as any,
      name: selectedName,
      coordinates: [lat, lng],
      createdAt: new Date(),
    };

    setMapState(prev => ({
      ...prev,
      features: [...prev.features, newFeature],
    }));

    renderFeatures([...mapState.features, newFeature]);
    setSelectedName('');
    setEditMode('view');
  };

  // Click on map to add features
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
    <div className="cultra-gis">
      <header className="gis-header">
        <h1>🗺️ CULTRA BootCamp GIS</h1>
        <p>Gestão de Mapas, Rotas e Missões</p>
      </header>

      <div className="gis-container">
        {/* Left Panel - Controls */}
        <div className="control-panel">
          <div className="section">
            <h3>Modos</h3>
            <button
              className={`btn ${editMode === 'view' ? 'active' : ''}`}
              onClick={() => setEditMode('view')}
            >
              👁️ Visualizar
            </button>
            <button
              className={`btn ${editMode === 'draw' ? 'active' : ''}`}
              onClick={() => setEditMode('draw')}
            >
              ✏️ Desenhar
            </button>
          </div>

          {editMode === 'draw' && (
            <div className="section">
              <h3>Novo Ponto</h3>
              <select value={selectedType} onChange={e => setSelectedType(e.target.value)}>
                <option value="camp">Acampamento</option>
                <option value="box">Caixa de Mantimentos</option>
                <option value="control_point">Ponto de Controlo</option>
                <option value="emergency">Ponto de Emergência</option>
                <option value="user">Utilizador</option>
              </select>
              <input
                type="text"
                placeholder="Nome do ponto..."
                value={selectedName}
                onChange={e => setSelectedName(e.target.value)}
              />
              <p style={{ fontSize: '0.85em', color: '#666' }}>
                Clica no mapa para adicionar
              </p>
            </div>
          )}

          <div className="section">
            <h3>Pontos no Mapa ({mapState.features.length})</h3>
            <div className="features-list">
              {mapState.features.map(f => (
                <div key={f.id} className="feature-item">
                  <strong>{f.name}</strong>
                  <small>{f.type}</small>
                </div>
              ))}
            </div>
          </div>

          <div className="section">
            <h3>Legenda</h3>
            <div className="legend">
              <div className="legend-item">
                <div style={{ background: PELOTAO_COLORS.alfa, width: 12, height: 12, borderRadius: '50%' }}></div>
                Pelotão Alfa
              </div>
              <div className="legend-item">
                <div style={{ background: PELOTAO_COLORS.bravo, width: 12, height: 12, borderRadius: '50%' }}></div>
                Pelotão Bravo
              </div>
              <div className="legend-item">
                <div style={{ background: PELOTAO_COLORS.charlie, width: 12, height: 12, borderRadius: '50%' }}></div>
                Pelotão Charlie
              </div>
            </div>
          </div>
        </div>

        {/* Map */}
        <div className="map-container" ref={mapContainer}></div>

        {/* Right Panel - Info */}
        <div className="info-panel">
          <div className="section">
            <h3>Informação da Missão</h3>
            <p><strong>Coordenada Base:</strong><br />40°52'45.9"N, 7°20'55.2"W</p>
            <p><strong>Pelotões:</strong><br />Alfa | Bravo | Charlie</p>
            <p><strong>Caixas de Mantimentos:</strong><br />CX-A | CX-B | CX-C</p>
          </div>

          <div className="section">
            <h3>Zonas de Risco</h3>
            <div className="zone-colors">
              {Object.entries(ZONE_COLORS).map(([type, color]) => (
                <div key={type} className="zone-color-item">
                  <div style={{ background: color, width: 12, height: 12, borderRadius: '3px' }}></div>
                  {type}
                </div>
              ))}
            </div>
          </div>

          <div className="section">
            <h3>Exportar</h3>
            <button
              className="btn"
              onClick={() => {
                const json = JSON.stringify(mapState, null, 2);
                const blob = new Blob([json], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'cultra-map.json';
                a.click();
              }}
            >
              📥 GeoJSON
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
