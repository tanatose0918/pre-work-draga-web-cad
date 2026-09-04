export default {
  app: {
    title: 'DRAGA 2D BLUEPRINT CAD',
    subtitle: 'AI Data Center & Ammonia ORC Thermal Integration',
    versionTag: 'Interactive SVG v1.0',
    viewport: 'ENGINEERING VIEWPORT: 1920x1080',
    zoom: 'ZOOM',
    pan: 'PAN',
    resetView: 'Reset View',
    cadSymbols: 'CAD SYMBOLS',
    cadLayers: 'CAD LAYERS',
    simulationActive: 'SIMULATION ACTIVE',
    simulationPaused: 'SIMULATION PAUSED',
    operatorControls: 'OPERATOR CONTROLS',
    zones: 'ZONES'
  },
  kpis: {
    totalItLoad: 'TOTAL IT LOAD',
    orcPowerGen: 'ORC POWER GEN',
    hotReturnRiser: 'HOT RETURN (RISER)',
    chwFlowRate: 'CHW FLOW RATE'
  },
  layers: {
    title: 'Blueprint Layers',
    grid: 'Grid Overlay',
    centralRisers: 'Central Risers (DN250)',
    rooftopOrc: 'Rooftop ORC Nucleus',
    floors: 'Floor 1 - 4 AI Clusters',
    groundBasin: 'Ground Basin & Pump',
    flowAnimations: 'Flow Keyframe Animations',
    telemetryLabels: 'Telemetry Labels'
  },
  zones: {
    rooftop: 'Rooftop ORC (HEX/Turbine)',
    floor4: 'Floor 4 AI Cluster',
    floor3: 'Floor 3 AI Cluster',
    floor2: 'Floor 2 AI Cluster',
    floor1: 'Floor 1 AI Cluster',
    groundBasin: 'Ground Basin & Pump'
  },
  drawer: {
    liveSensorFeed: 'Live Sensor Signals',
    engineeringSpecs: 'Engineering Specs',
    faultAnomaly: '⚠️ INJECT FAULT / ANOMALY',
    resetStatus: 'Acknowledge / Reset Status',
    streaming: 'STREAMING 1Hz',
    nominal: 'Nominal',
    warn: 'Warn',
    zone: 'Zone',
    anchor: 'Anchor (X, Y)',
    floorZone: 'Floor Zone'
  },
  operator: {
    title: 'Bidirectional Telemetry & Control',
    sub: 'Fastify WebSocket (500ms broadcast)',
    computeLoad: 'AI Compute Cluster Load',
    pumpSpeed: 'Main CHW Pump (P-101)',
    fcvValves: 'Floor Flow Control Valves (FCV)',
    idle: 'Idle (10%)',
    nominalLoad: 'Nominal (80%)',
    peak: 'Peak (100%)',
    facility: 'Facility',
    seq: 'Seq'
  },
  symbols: {
    title: 'ISA-5.1 CAD SYMBOL & GLYPH LIBRARY',
    subtitle: 'Standard Engineering Representations for 2D P&ID Digital Twin',
    close: '✕ Close',
    standardsNote: 'Conforms to ANSI/ISA-5.1-2009 & DEXPI Plant Topology Standards',
    dragaLibrary: 'DRAGA High-Density AI CAD Library'
  }
};
