import type { TerrainMap, ExportFormat } from './types';

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

export function exportTerrain(map: TerrainMap, format: ExportFormat): string {
  if (format === 'json') {
    return JSON.stringify(map, null, 2);
  }

  if (format === 'csv') {
    const rows = map.flat().map((cell) => [
      cell.x,
      cell.y,
      cell.elevation.toFixed(4),
      cell.moisture.toFixed(4),
      cell.temperature.toFixed(4),
      cell.water.toFixed(4),
      cell.vegetation.toFixed(4),
      cell.biome,
    ].join(','));

    return ['x,y,elevation,moisture,temperature,water,vegetation,biome', ...rows].join('\n');
  }

  const cellSize = 22;
  const width = map[0]?.length ?? 0;
  const height = map.length;
  const canvas = document.createElement('canvas');
  canvas.width = width * cellSize;
  canvas.height = height * cellSize;

  const context = canvas.getContext('2d');
  if (!context) {
    return '';
  }

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const cell = map[y][x];
      context.fillStyle = colorByBiome[cell.biome] ?? '#86efac';
      context.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
      context.strokeStyle = 'rgba(15, 23, 42, 0.15)';
      context.strokeRect(x * cellSize, y * cellSize, cellSize, cellSize);
    }
  }

  return canvas.toDataURL('image/png');
}
