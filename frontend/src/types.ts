export type TerrainCell = {
  x: number;
  y: number;
  elevation: number;
  moisture: number;
  temperature: number;
  water: number;
  vegetation: number;
  biome: string;
};

export type TerrainMap = TerrainCell[][];

export type ExportFormat = 'json' | 'csv' | 'png';

export type TerrainOptions = {
  width: number;
  height: number;
  seed: number;
  roughness: number;
  moistureBias: number;
  temperatureBias: number;
};

export type TerrainApiResponse = {
  width: number;
  height: number;
  seed: number;
  roughness: number;
  moisture_bias: number;
  temperature_bias: number;
  map: TerrainMap;
};
