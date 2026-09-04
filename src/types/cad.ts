export type NodeStatus = 'normal' | 'warning' | 'critical' | 'offline';

export type SystemZone = 
  | 'rooftop-orc'
  | 'central-riser'
  | 'floor-4'
  | 'floor-3'
  | 'floor-2'
  | 'floor-1'
  | 'ground-basin';

export type EquipmentCategory = 
  | 'hex' 
  | 'turbine' 
  | 'condenser' 
  | 'pump' 
  | 'cdu' 
  | 'rack' 
  | 'rack-array' 
  | 'basin' 
  | 'generator' 
  | 'valve';

export type CadViewAngle = 'SIDE' | 'FRONT' | 'BACK' | 'TOP';
export type CadLevelFocus = 'ALL' | 'ROOFTOP_DECK' | 'FLOOR_4' | 'FLOOR_3' | 'FLOOR_2' | 'FLOOR_1' | 'GROUND_EXTERNAL';

export interface TelemetrySensor {
  id: string;
  name: string;
  unit: string;
  value: number;
  minVal?: number;
  maxVal?: number;
  nominal?: number;
  warningThreshold?: number;
  criticalThreshold?: number;
}

export interface EquipmentNode {
  tag: string;
  name: string;
  zone: SystemZone;
  floorLabel: string;
  category: EquipmentCategory;
  anchor: { x: number; y: number };
  bounds?: { width: number; height: number };
  status: NodeStatus;
  description: string;
  sensors: Record<string, TelemetrySensor>;
  metadata: {
    capacity?: string;
    fluid?: string;
    flowRate?: string;
    efficiency?: string;
    ratedPower?: string;
    [key: string]: unknown;
  };
}

export interface LayerVisibility {
  grid: boolean;
  centralRisers: boolean;
  rooftopOrc: boolean;
  floor4: boolean;
  floor3: boolean;
  floor2: boolean;
  floor1: boolean;
  groundBasin: boolean;
  flowAnimations: boolean;
  telemetryLabels: boolean;
  zonesHighlight: boolean;
}

export interface SimulationState {
  currentLoadPct: number;
  ambientTempC: number;
  fcvOverrides: Record<string, number>;
  pumpSpeedRpm: number;
}

export interface ApiPndNode {
  id: number;
  tag: string;
  name: string;
  type: string;
  floor: string;
  systemZone: string;
  coordinates2D: { x: number; y: number };
  coordinates3D: { x: number; y: number; z: number };
  specifications?: Record<string, any>;
  isActive: boolean;
}

export interface ApiTopologyResponse {
  facility: {
    name: string;
    location: string;
    capacityMw: number;
    orcEfficiency: number;
    levels: number;
    siteAreaM2: number;
    buildingCoverageRatio: number;
  };
  nodes: ApiPndNode[];
  edges: any[];
  totalNodes: number;
  totalEdges: number;
}


export interface ViewportTransform {
  panX: number;
  panY: number;
  zoomScale: number;
}
