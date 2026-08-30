import type { TerrainApiResponse, TerrainMap, TerrainOptions } from './types';

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export function generateTerrain(options: TerrainOptions): TerrainMap {
  const { width, height, seed, roughness, moistureBias, temperatureBias } = options;
  const map: TerrainMap = [];

  for (let y = 0; y < height; y++) {
    const row: TerrainMap[number] = [];
    for (let x = 0; x < width; x++) {
      const nx = x / Math.max(width, 1);
      const ny = y / Math.max(height, 1);
      const base = Math.sin((x + seed) * 0.5) * 0.6 + Math.cos((y - seed) * 0.7) * 0.5;
      const ridge = Math.sin((nx * 18 + seed) * 3.14) * roughness;
      const moisture = clamp((Math.cos((x + seed) * 0.35) + Math.sin((y + seed) * 0.42) + 2) / 4 + moistureBias, 0, 1);
      const temperature = clamp((1 - ny) * 0.7 + Math.sin((x + seed) * 0.2) * 0.15 + temperatureBias, 0, 1);
      const elevation = clamp(base + ridge + (ny - 0.5) * 1.2, 0, 1);
      const water = clamp(1 - elevation + moisture * 0.35, 0, 1);
      const vegetation = clamp((elevation * 0.7 + moisture * 0.9 - temperature * 0.2), 0, 1);

      let biome = 'plains';
      if (elevation < 0.25) biome = 'ocean';
      else if (elevation < 0.4) biome = 'shore';
      else if (elevation < 0.7 && moisture > 0.6) biome = 'forest';
      else if (elevation < 0.7 && moisture < 0.35) biome = 'savanna';
      else if (elevation > 0.75) biome = 'mountain';
      else if (temperature < 0.3) biome = 'tundra';
      else if (moisture > 0.7) biome = 'wetlands';

      row.push({
        x,
        y,
        elevation,
        moisture,
        temperature,
        water,
        vegetation,
        biome,
      });
    }
    map.push(row);
  }

  return map;
}

export async function fetchTerrain(options: TerrainOptions): Promise<TerrainMap> {
  const apiUrl = import.meta.env.VITE_TERRAIN_WORKER_URL || 'http://localhost:8080';
  const params = new URLSearchParams({
    width: String(options.width),
    height: String(options.height),
    seed: String(options.seed),
    roughness: String(options.roughness),
    moisture_bias: String(options.moistureBias),
    temperature_bias: String(options.temperatureBias),
  });

  const response = await fetch(`${apiUrl}/terrain?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`Terrain worker request failed with status ${response.status}`);
  }

  const data = (await response.json()) as TerrainApiResponse;
  return data.map;
}
