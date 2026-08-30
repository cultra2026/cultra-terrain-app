// GIS Feature Types
export type FeatureType = 'camp' | 'box' | 'control_point' | 'emergency' | 'route' | 'zone' | 'user';
export type ZoneType = 'safe' | 'risk' | 'danger' | 'restricted' | 'emergency';
export type PelotonType = 'alfa' | 'bravo' | 'charlie';

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface Feature {
  id: string;
  type: FeatureType;
  name: string;
  coordinates: [number, number];
  properties?: Record<string, any>;
  createdAt: Date;
}

export interface Camp extends Feature {
  type: 'camp';
  pelotao?: PelotonType;
  isPrimary?: boolean;
}

export interface Box extends Feature {
  type: 'box';
  pelotao: PelotonType;
  status: 'not_found' | 'found' | 'recovered';
  foundAt?: Date;
}

export interface Route {
  id: string;
  name: string;
  waypoints: GeoPoint[];
  startPoint: GeoPoint;
  endPoint: GeoPoint;
  distance: number;
  elevationGain: number;
  difficulty: number;
  safetyScore: number;
  riskFactors: string[];
  estimatedTime: number;
  createdAt: Date;
}

export interface Zone {
  id: string;
  name: string;
  type: ZoneType;
  coordinates: [number, number][];
  radius?: number;
  properties?: Record<string, any>;
}

export interface User {
  id: string;
  name: string;
  role: 'chefe' | 'socorrista' | 'escriturario' | 'navegador' | 'abrigo' | 'cozinha';
  pelotao: PelotonType;
  lastLocation?: GeoPoint;
  lastUpdate?: Date;
}

export interface MapState {
  features: Feature[];
  routes: Route[];
  zones: Zone[];
  users: User[];
  selectedFeature?: string;
}

export type ExportFormat = 'json' | 'geojson' | 'csv';
