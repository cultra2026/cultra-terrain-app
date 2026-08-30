import { useEffect, useMemo, useState } from 'react';
import { exportTerrain } from './export';
import { fetchTerrain, generateTerrain } from './terrain';
import type { ExportFormat, TerrainCell, TerrainMap } from './types';

const colorByBiome: Record<string, string> = {
  ocean: '#1d4ed8',
  shore: '#94a3b8',
  plains: '#a3e635',
  forest: '#15803d',
  savanna: '#d97706',
  wetlands: '#22c55e',
  mountain: '#64748b',
  tundra: '#e2e8f0',
};

const DEMO_WIDTH = 28;
const DEMO_HEIGHT = 18;

function App() {
  const [seed, setSeed] = useState(42);
  const [roughness, setRoughness] = useState(0.8);
  const [moistureBias, setMoistureBias] = useState(0.15);
  const [temperatureBias, setTemperatureBias] = useState(0.1);
  const [terrain, setTerrain] = useState<TerrainMap>(() => generateTerrain({
    width: DEMO_WIDTH,
    height: DEMO_HEIGHT,
    seed,
    roughness,
    moistureBias,
    temperatureBias,
  }));
  const [apiStatus, setApiStatus] = useState('Loading terrain worker…');

  useEffect(() => {
    let active = true;

    const loadTerrain = async () => {
      const options = {
        width: DEMO_WIDTH,
        height: DEMO_HEIGHT,
        seed,
        roughness,
        moistureBias,
        temperatureBias,
      };

      try {
        const remoteMap = await fetchTerrain(options);
        if (active) {
          setTerrain(remoteMap);
          setApiStatus('Live terrain from terrain-worker');
        }
      } catch (error) {
        if (active) {
          setTerrain(generateTerrain(options));
          setApiStatus(`Local fallback (${error instanceof Error ? error.message : 'request failed'})`);
        }
      }
    };

    void loadTerrain();

    return () => {
      active = false;
    };
  }, [seed, roughness, moistureBias, temperatureBias]);

  const stats = useMemo(() => {
    const cells = terrain.flat();
    const avgElevation = cells.reduce((sum, cell) => sum + cell.elevation, 0) / cells.length;
    const avgMoisture = cells.reduce((sum, cell) => sum + cell.moisture, 0) / cells.length;
    const waterCells = cells.filter((cell) => cell.water > 0.6).length;
    const biomeCounts = cells.reduce<Record<string, number>>((acc, cell) => {
      acc[cell.biome] = (acc[cell.biome] ?? 0) + 1;
      return acc;
    }, {});

    return { avgElevation, avgMoisture, waterCells, biomeCounts };
  }, [terrain]);

  const handleExport = (format: ExportFormat) => {
    if (format === 'png') {
      const url = exportTerrain(terrain, 'png');
      if (!url) {
        return;
      }

      const link = document.createElement('a');
      link.href = url;
      link.download = 'cultra-terrain.png';
      link.click();
      return;
    }

    const content = exportTerrain(terrain, format);
    const blob = new Blob([content], { type: format === 'json' ? 'application/json' : 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cultra-terrain.${format === 'json' ? 'json' : 'csv'}`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const renderCell = (cell: TerrainCell) => ({
    background: colorByBiome[cell.biome] ?? '#86efac',
    opacity: 0.8 + cell.elevation * 0.2,
    border: cell.water > 0.6 ? '1px solid rgba(255,255,255,0.4)' : '1px solid rgba(15,23,42,0.1)',
  });

  return (
    <div className="app-shell">
      <aside className="controls-panel">
        <h1>Cultra Terrain Lab</h1>
        <label>
          <span>Seed</span>
          <input type="range" min="1" max="100" value={seed} onChange={(e) => setSeed(Number(e.target.value))} />
          <strong>{seed}</strong>
        </label>
        <label>
          <span>Roughness</span>
          <input type="range" min="0.2" max="1.6" step="0.05" value={roughness} onChange={(e) => setRoughness(Number(e.target.value))} />
          <strong>{roughness.toFixed(2)}</strong>
        </label>
        <label>
          <span>Moisture bias</span>
          <input type="range" min="-0.5" max="0.8" step="0.05" value={moistureBias} onChange={(e) => setMoistureBias(Number(e.target.value))} />
          <strong>{moistureBias.toFixed(2)}</strong>
        </label>
        <label>
          <span>Temperature bias</span>
          <input type="range" min="-0.5" max="0.8" step="0.05" value={temperatureBias} onChange={(e) => setTemperatureBias(Number(e.target.value))} />
          <strong>{temperatureBias.toFixed(2)}</strong>
        </label>

        <div className="stats-panel">
          <h2>World Stats</h2>
          <p>Terrain source: {apiStatus}</p>
          <p>Avg elevation: {stats.avgElevation.toFixed(2)}</p>
          <p>Avg moisture: {stats.avgMoisture.toFixed(2)}</p>
          <p>Water cells: {stats.waterCells}</p>
          <p>Biomes: {Object.entries(stats.biomeCounts).map(([name, count]) => `${name}:${count}`).join(' · ')}</p>
        </div>

        <div className="export-panel">
          <button onClick={() => handleExport('json')}>Export JSON</button>
          <button onClick={() => handleExport('csv')}>Export CSV</button>
          <button onClick={() => handleExport('png')}>Export PNG</button>
        </div>

        <div className="download-panel">
          <a className="download-link" href="/cultra-app.zip" download>
            Download App
          </a>
        </div>
      </aside>

      <main className="terrain-panel">
        <div className="terrain-grid" style={{ gridTemplateColumns: `repeat(${DEMO_WIDTH}, minmax(0, 1fr))` }}>
          {terrain.flat().map((cell) => (
            <div key={`${cell.x}-${cell.y}`} className="terrain-cell" style={renderCell(cell)} title={`${cell.biome} (${cell.elevation.toFixed(2)})`} />
          ))}
        </div>
      </main>
    </div>
  );
}

export default App;
