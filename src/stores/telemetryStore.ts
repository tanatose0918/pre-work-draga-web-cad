import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { EquipmentNode, LayerVisibility, NodeStatus, CadViewAngle, CadLevelFocus, SystemZone, SimulationState } from '@/types/cad';
import { TelemetryWebSocketClient, type ConnectionStatus, type TelemetryBatchMessage } from '@/services/telemetryClient';
import { DragaApiClient } from '@/services/apiClient';
import { runSimulationTick } from '@/services/localSimulationEngine';


export const useTelemetryStore = defineStore('telemetry', () => {
  const selectedNodeTag = ref<string | null>('HEX-R01');
  const isSimulationRunning = ref<boolean>(true);
  const connectionStatus = ref<ConnectionStatus>('CONNECTING');
  const sequenceId = ref<number>(0);
  const lastTelemetryTimestamp = ref<number>(Date.now());
  const wsClient = new TelemetryWebSocketClient();
  let localTickerInterval: number | null = null;

  // 2D Viewport Angle & Floor Focus State
  const cadViewAngle = ref<CadViewAngle>('SIDE');
  const cadLevelFocus = ref<CadLevelFocus>('ALL');

  // Global Simulation Parameters
  const simState = ref<SimulationState>({
    currentLoadPct: 80,
    ambientTempC: 35.0, // Lampang, TH
    fcvOverrides: {
      'FCV-101': 100,
      'FCV-201': 100,
      'FCV-301': 100,
      'FCV-401': 100,
    },
    pumpSpeedRpm: 1750
  });

  // Layer Visibility
  const layers = ref<LayerVisibility>({
    grid: true,
    centralRisers: true,
    rooftopOrc: true,
    floor4: true,
    floor3: true,
    floor2: true,
    floor1: true,
    groundBasin: true,
    flowAnimations: true,
    telemetryLabels: true,
    zonesHighlight: true,
  });

  // Generate 10 Standalone Racks for each floor (40 racks = 1,800 kW total)
  function generateFloorRacks(floorNum: number, zone: SystemZone, floorLabel: string): Record<string, EquipmentNode> {
    const racks: Record<string, EquipmentNode> = {};
    for (let r = 1; r <= 10; r++) {
      const tag = `RACK-${floorNum}${r < 10 ? '0' + r : r}`;
      const rackIndex = r - 1;
      // 2D Layout position across floor
      const anchorX = 420 + (rackIndex % 5) * 110;
      const anchorY = floorNum === 4 ? 335 + Math.floor(rackIndex / 5) * 45 :
                      floorNum === 3 ? 515 + Math.floor(rackIndex / 5) * 45 :
                      floorNum === 2 ? 695 + Math.floor(rackIndex / 5) * 45 :
                                       875 + Math.floor(rackIndex / 5) * 45;

      racks[tag] = {
        tag,
        name: `AI Compute Rack #${floorNum}-${r}`,
        zone,
        floorLabel,
        category: 'rack',
        anchor: { x: anchorX, y: anchorY },
        bounds: { width: 90, height: 36 },
        status: 'normal',
        description: `45 kW high-density compute rack with direct-to-chip (D2C) liquid cold plates.`,
        metadata: {
          rackPower: '45 kW',
          coolantFlowRate: '35 L/min',
          gpuCount: '8x H100 SXM5',
          coldPlateDP: '26.8 PSI'
        },
        sensors: {
          tempReturn: { id: `TT-RACK-${floorNum}${r < 10 ? '0' + r : r}`, name: 'D2C Return Temp', unit: '°C', value: 62.4, nominal: 62.0, warningThreshold: 68.0, criticalThreshold: 75.0 },
          coldPlateDP: { id: `DPT-${floorNum}${r < 10 ? '0' + r : r}`, name: 'Cold Plate DP', unit: 'PSI', value: 26.8, nominal: 26.5, warningThreshold: 30.0, criticalThreshold: 35.0 },
          powerKw: { id: `KW-${floorNum}${r < 10 ? '0' + r : r}`, name: 'Active Power Draw', unit: 'kW', value: 45.0, nominal: 45.0, warningThreshold: 48.0, criticalThreshold: 52.0 }
        }
      };
    }
    return racks;
  }

  // Master Equipment Node Registry
  const nodes = ref<Record<string, EquipmentNode>>({
    // --- Rooftop ORC Energy Nucleus ---
    'HEX-R01': {
      tag: 'HEX-R01',
      name: 'Inverted 4-Prong U-Tube Heat Exchanger (Evaporator)',
      zone: 'rooftop-orc',
      floorLabel: 'Rooftop ORC Nucleus',
      category: 'hex',
      anchor: { x: 880, y: 140 },
      bounds: { width: 160, height: 85 },
      status: 'normal',
      description: 'Primary heat recovery evaporator transferring 62°C return water heat into ammonia (NH3) working fluid.',
      metadata: {
        capacity: '1,850 kW_th',
        fluid: 'Water / NH3 (Anhydrous Ammonia)',
        designHeatRecovery: '4,755.5 kW_th',
        flowRate: '120 m³/h',
        efficiency: '94.0%'
      },
      sensors: {
        tempIn: { id: 'TT-RISER-01', name: 'Hot Return Temp In', unit: '°C', value: 65.4, nominal: 65.0, warningThreshold: 72.0, criticalThreshold: 80.0 },
        nh3VaporTemp: { id: 'TI-8803', name: 'NH3 Vapor Out Temp', unit: '°C', value: 58.7, nominal: 58.0, warningThreshold: 70.0, criticalThreshold: 80.0 },
        pressureNH3: { id: 'PT-R101', name: 'NH3 Vapor Pressure', unit: 'bar', value: 18.5, nominal: 18.5, warningThreshold: 21.0, criticalThreshold: 24.0 },
        nh3MassFlow: { id: 'FT-NH3-01', name: 'NH3 Mass Flow', unit: 'kg/s', value: 3.8, nominal: 3.8, warningThreshold: 5.0, criticalThreshold: 6.0 }
      }
    },
    'TB-R01': {
      tag: 'TB-R01',
      name: 'Ammonia Expander Turbine (Radial Inflow)',
      zone: 'rooftop-orc',
      floorLabel: 'Rooftop ORC Nucleus',
      category: 'turbine',
      anchor: { x: 1240, y: 140 },
      bounds: { width: 140, height: 85 },
      status: 'normal',
      description: 'High-speed radial inflow ammonia expander converting superheated vapor into 524 kW green power.',
      metadata: {
        ratedOutput: '524.3 kW_e',
        workingFluid: 'Anhydrous Ammonia (NH3)',
        inletPressure: '18.5 bar_a',
        inletTemperature: '56.5°C',
        isentropicEfficiency: '85.0%',
        ratedSpeed: '12,000 RPM'
      },
      sensors: {
        powerOutput: { id: 'PWR-GEN-01', name: 'Generated Power', unit: 'kW', value: 524.3, nominal: 524.3, warningThreshold: 450.0, criticalThreshold: 350.0 },
        turbineSpeed: { id: 'RPM-TURB-01', name: 'Turbine Speed', unit: 'RPM', value: 12050, nominal: 12000, warningThreshold: 13000, criticalThreshold: 14000 },
        vibration: { id: 'VIB-01', name: 'Shaft Vibration', unit: 'mm/s', value: 1.2, nominal: 1.0, warningThreshold: 2.8, criticalThreshold: 4.5 }
      }
    },
    'GEN-R01': {
      tag: 'GEN-R01',
      name: 'Prosumer Synchronous Generator (400V 3-Phase)',
      zone: 'rooftop-orc',
      floorLabel: 'Rooftop ORC Nucleus',
      category: 'generator',
      anchor: { x: 1460, y: 140 },
      bounds: { width: 110, height: 80 },
      status: 'normal',
      description: '3-phase 400V synchronous generator feeding clean power back into facility bus.',
      metadata: { ratedCapacity: '600 kVA', voltage: '400 V', frequency: '50 Hz', powerFactor: '0.95' },
      sensors: {
        gridVoltage: { id: 'VOLT-GEN-01', name: 'Bus Voltage', unit: 'V', value: 400.2, nominal: 400.0 },
        currentA: { id: 'CURR-GEN-01', name: 'Phase Current', unit: 'A', value: 756.0, nominal: 750.0 }
      }
    },
    'CND-R01': {
      tag: 'CND-R01',
      name: '6-Arm Spiral Gravity-Fed Condenser Array',
      zone: 'rooftop-orc',
      floorLabel: 'Rooftop ORC Nucleus',
      category: 'condenser',
      anchor: { x: 1680, y: 140 },
      bounds: { width: 140, height: 90 },
      status: 'normal',
      description: 'Radial spiral condenser array rejecting 4,090 kW_th heat into ambient air.',
      metadata: { totalSurfaceArea: '14,400 m²', heatRejectionRate: '4,090.3 kW_th', lmtd: '7.85°C' },
      sensors: {
        condTemp: { id: 'TT-CND-01', name: 'Condensate Temp', unit: '°C', value: 35.2, nominal: 35.0, warningThreshold: 40.0 },
        subcooling: { id: 'TT-SUB-01', name: 'Subcooling Margin', unit: 'K', value: 2.1, nominal: 2.0 }
      }
    },
    'P-NH3-R01A': {
      tag: 'P-NH3-R01A',
      name: 'High-Pressure Ammonia Canned Motor Feed Pump',
      zone: 'rooftop-orc',
      floorLabel: 'Rooftop ORC Nucleus',
      category: 'pump',
      anchor: { x: 1060, y: 220 },
      bounds: { width: 90, height: 50 },
      status: 'normal',
      description: 'Hermetic canned motor pump pressurizing liquid NH3 from 10 bar to 18.5 bar.',
      metadata: { headPressure: '18.5 bar', flowRate: '85 L/min', powerDraw: '18.5 kW' },
      sensors: {
        flowRate: { id: 'FT-NH3-PUMP', name: 'NH3 Liquid Feed', unit: 'L/min', value: 85.0, nominal: 85.0 },
        pressureOut: { id: 'PT-NH3-OUT', name: 'Discharge Pressure', unit: 'bar', value: 18.5, nominal: 18.5 }
      }
    },

    // --- Floor 4 AI Infrastructure ---
    'CDU-401': {
      tag: 'CDU-401',
      name: 'Coolant Distribution Unit (Floor 4)',
      zone: 'floor-4',
      floorLabel: 'Floor 4 AI Cluster',
      category: 'cdu',
      anchor: { x: 260, y: 340 },
      bounds: { width: 110, height: 75 },
      status: 'normal',
      description: 'Floor 4 in-row liquid-to-liquid heat exchanger supplying 28°C coolant to Racks 401-410.',
      metadata: { coolingCapacity: '450 kW_th', secondaryCoolant: 'PG25 (25% Propylene Glycol)', primaryFlow: '300 L/min' },
      sensors: {
        supplyTemp: { id: 'TT-401', name: 'CHW Supply Temp', unit: '°C', value: 28.0, nominal: 28.0 },
        returnTemp: { id: 'TT-402', name: 'CHW Return Temp', unit: '°C', value: 62.4, nominal: 62.0 },
        flowRate: { id: 'FT-401', name: 'Secondary Flow', unit: 'L/min', value: 280.0, nominal: 280.0 }
      }
    },
    'FCV-401': {
      tag: 'FCV-401',
      name: 'Flow Control Valve (Floor 4)',
      zone: 'floor-4',
      floorLabel: 'Floor 4 AI Cluster',
      category: 'valve',
      anchor: { x: 170, y: 340 },
      bounds: { width: 60, height: 40 },
      status: 'normal',
      description: 'Modulating 4-20mA valve adjusting CHW supply flow to CDU-401.',
      metadata: { valveSize: 'DN100', position: '100%' },
      sensors: { position: { id: 'POS-FCV-401', name: 'Valve Opening', unit: '%', value: 100, nominal: 100 } }
    },
    ...generateFloorRacks(4, 'floor-4', 'Floor 4 AI Cluster'),

    // --- Floor 3 AI Infrastructure ---
    'CDU-301': {
      tag: 'CDU-301',
      name: 'Coolant Distribution Unit (Floor 3)',
      zone: 'floor-3',
      floorLabel: 'Floor 3 AI Cluster',
      category: 'cdu',
      anchor: { x: 260, y: 520 },
      bounds: { width: 110, height: 75 },
      status: 'normal',
      description: 'Floor 3 in-row CDU supplying 28°C coolant to Racks 301-310.',
      metadata: { coolingCapacity: '450 kW_th', secondaryCoolant: 'PG25', primaryFlow: '300 L/min' },
      sensors: {
        supplyTemp: { id: 'TT-301', name: 'CHW Supply Temp', unit: '°C', value: 28.0, nominal: 28.0 },
        returnTemp: { id: 'TT-302', name: 'CHW Return Temp', unit: '°C', value: 62.4, nominal: 62.0 },
        flowRate: { id: 'FT-301', name: 'Secondary Flow', unit: 'L/min', value: 280.0, nominal: 280.0 }
      }
    },
    'FCV-301': {
      tag: 'FCV-301',
      name: 'Flow Control Valve (Floor 3)',
      zone: 'floor-3',
      floorLabel: 'Floor 3 AI Cluster',
      category: 'valve',
      anchor: { x: 170, y: 520 },
      bounds: { width: 60, height: 40 },
      status: 'normal',
      description: 'Modulating 4-20mA valve adjusting CHW supply flow to CDU-301.',
      metadata: { valveSize: 'DN100', position: '100%' },
      sensors: { position: { id: 'POS-FCV-301', name: 'Valve Opening', unit: '%', value: 100, nominal: 100 } }
    },
    ...generateFloorRacks(3, 'floor-3', 'Floor 3 AI Cluster'),

    // --- Floor 2 AI Infrastructure ---
    'CDU-201': {
      tag: 'CDU-201',
      name: 'Coolant Distribution Unit (Floor 2)',
      zone: 'floor-2',
      floorLabel: 'Floor 2 AI Cluster',
      category: 'cdu',
      anchor: { x: 260, y: 700 },
      bounds: { width: 110, height: 75 },
      status: 'normal',
      description: 'Floor 2 in-row CDU supplying 28°C coolant to Racks 201-210.',
      metadata: { coolingCapacity: '450 kW_th', secondaryCoolant: 'PG25', primaryFlow: '300 L/min' },
      sensors: {
        supplyTemp: { id: 'TT-201', name: 'CHW Supply Temp', unit: '°C', value: 28.0, nominal: 28.0 },
        returnTemp: { id: 'TT-202', name: 'CHW Return Temp', unit: '°C', value: 62.4, nominal: 62.0 },
        flowRate: { id: 'FT-201', name: 'Secondary Flow', unit: 'L/min', value: 280.0, nominal: 280.0 }
      }
    },
    'FCV-201': {
      tag: 'FCV-201',
      name: 'Flow Control Valve (Floor 2)',
      zone: 'floor-2',
      floorLabel: 'Floor 2 AI Cluster',
      category: 'valve',
      anchor: { x: 170, y: 700 },
      bounds: { width: 60, height: 40 },
      status: 'normal',
      description: 'Modulating 4-20mA valve adjusting CHW supply flow to CDU-201.',
      metadata: { valveSize: 'DN100', position: '100%' },
      sensors: { position: { id: 'POS-FCV-201', name: 'Valve Opening', unit: '%', value: 100, nominal: 100 } }
    },
    ...generateFloorRacks(2, 'floor-2', 'Floor 2 AI Cluster'),

    // --- Floor 1 AI Infrastructure ---
    'CDU-101': {
      tag: 'CDU-101',
      name: 'Coolant Distribution Unit (Floor 1)',
      zone: 'floor-1',
      floorLabel: 'Floor 1 AI Cluster',
      category: 'cdu',
      anchor: { x: 260, y: 880 },
      bounds: { width: 110, height: 75 },
      status: 'normal',
      description: 'Floor 1 in-row CDU supplying 28°C coolant to Racks 101-110.',
      metadata: { coolingCapacity: '450 kW_th', secondaryCoolant: 'PG25', primaryFlow: '300 L/min' },
      sensors: {
        supplyTemp: { id: 'TT-101', name: 'CHW Supply Temp', unit: '°C', value: 28.0, nominal: 28.0 },
        returnTemp: { id: 'TT-102', name: 'CHW Return Temp', unit: '°C', value: 62.4, nominal: 62.0 },
        flowRate: { id: 'FT-101', name: 'Secondary Flow', unit: 'L/min', value: 280.0, nominal: 280.0 }
      }
    },
    'FCV-101': {
      tag: 'FCV-101',
      name: 'Flow Control Valve (Floor 1)',
      zone: 'floor-1',
      floorLabel: 'Floor 1 AI Cluster',
      category: 'valve',
      anchor: { x: 170, y: 880 },
      bounds: { width: 60, height: 40 },
      status: 'normal',
      description: 'Modulating 4-20mA valve adjusting CHW supply flow to CDU-101.',
      metadata: { valveSize: 'DN100', position: '100%' },
      sensors: { position: { id: 'POS-FCV-101', name: 'Valve Opening', unit: '%', value: 100, nominal: 100 } }
    },
    ...generateFloorRacks(1, 'floor-1', 'Floor 1 AI Cluster'),

    // --- Ground Floor & Utilities ---
    'P-101': {
      tag: 'P-101',
      name: 'Primary Chilled Water Pump (P-CHW-01A)',
      zone: 'ground-basin',
      floorLabel: 'Ground Basin & Pump Room',
      category: 'pump',
      anchor: { x: 380, y: 1000 },
      bounds: { width: 120, height: 60 },
      status: 'normal',
      description: 'Primary VFD centrifugal pump circulating chilled water up central DN250 risers.',
      metadata: { flowRate: '2,400 L/min', headPressure: '4.5 bar', motorPower: '45 kW', speed: '1,750 RPM' },
      sensors: {
        flowRate: { id: 'FT-01', name: 'Discharge Flow', unit: 'L/min', value: 2400.0, nominal: 2400.0 },
        pumpSpeed: { id: 'RPM-PUMP-01', name: 'VFD Speed', unit: 'RPM', value: 1750, nominal: 1750 }
      }
    },
    'WTP-01': {
      tag: 'WTP-01',
      name: 'Water Treatment & Demineralization Plant',
      zone: 'ground-basin',
      floorLabel: 'Ground Basin & Pump Room',
      category: 'basin',
      anchor: { x: 120, y: 1000 },
      bounds: { width: 140, height: 60 },
      status: 'normal',
      description: 'RO demineralization plant producing ultrapure makeup water for closed cooling loop.',
      metadata: { capacity: '25 m³/day', conductivity: '< 0.1 µS/cm', ph: '7.2' },
      sensors: {
        conductivity: { id: 'QI-01', name: 'Water Purity', unit: 'µS/cm', value: 0.08, nominal: 0.08 }
      }
    }
  });

  const selectedNode = computed(() => {
    return selectedNodeTag.value ? nodes.value[selectedNodeTag.value] || null : null;
  });

  const allNodesList = computed(() => Object.values(nodes.value));

  function selectNode(tag: string | null) {
    selectedNodeTag.value = tag;
  }

  function setLevelFocus(level: CadLevelFocus) {
    cadLevelFocus.value = level;
    if (level === 'ALL') {
      cadViewAngle.value = 'SIDE'; // default for all building
    } else {
      cadViewAngle.value = 'TOP'; // default to Top View when viewing single floor!
    }
  }

  function setViewAngle(angle: CadViewAngle) {
    cadViewAngle.value = angle;
  }

  function setNodeStatus(tag: string, status: NodeStatus) {
    if (nodes.value[tag]) {
      nodes.value[tag].status = status;
    }
  }

  function toggleLayer(layerKey: keyof LayerVisibility) {
    layers.value[layerKey] = !layers.value[layerKey];
  }

  function triggerAnomaly(tag: string) {
    setNodeStatus(tag, 'warning');
  }

  function getSensorValue(tag: string, sensorKey: string): string {
    const node = nodes.value[tag];
    if (!node || !node.sensors || !node.sensors[sensorKey]) return '--';
    return `${node.sensors[sensorKey].value.toFixed(1)} ${node.sensors[sensorKey].unit}`;
  }

  function sendOperatorOverride(target: string, parameter: string, value: number) {
    wsClient.sendOverride(target, parameter, value);
    if (target === 'COMPUTE_CLUSTER' && parameter === 'loadPct') {
      simState.value.currentLoadPct = value;
    } else if ((target === 'P-101' || target === 'P-CHW-01A') && parameter === 'pumpSpeedRpm') {
      simState.value.pumpSpeedRpm = value;
    } else if (target.startsWith('FCV-')) {
      simState.value.fcvOverrides[target] = value;
    }
  }

  function applySensorUpdate(sensorId: string, val: number) {
    for (const node of Object.values(nodes.value)) {
      if (node.sensors) {
        for (const sensor of Object.values(node.sensors)) {
          if (sensor.id === sensorId) {
            sensor.value = val;
            return;
          }
        }
      }
    }
  }

  function tickLocalSimulation() {
    const simulated = runSimulationTick(simState.value);
    sequenceId.value++;
    lastTelemetryTimestamp.value = Date.now();

    for (const item of simulated) {
      applySensorUpdate(item.tag, item.value);
    }
  }

  async function syncTopologyFromApi() {
    try {
      const topo = await DragaApiClient.getTopology();
      if (topo && topo.nodes && topo.nodes.length > 0) {
        console.log(`[TelemetryStore] Synced ${topo.nodes.length} nodes from .NET 8 Web API.`);
      }
    } catch {
      // Fallback
    }
  }

  function startSimulation() {
    isSimulationRunning.value = true;
    syncTopologyFromApi();
    wsClient.connect(
      (batch: TelemetryBatchMessage) => {
        sequenceId.value = batch.sequenceId;
        lastTelemetryTimestamp.value = batch.timestamp;
        if (batch.simState) {
          simState.value.currentLoadPct = batch.simState.currentLoadPct;
          simState.value.pumpSpeedRpm = batch.simState.pumpSpeedRpm;
        }
        for (const item of batch.data) {
          applySensorUpdate(item.tag, item.value);
        }
      },
      undefined,
      (status: ConnectionStatus) => {
        connectionStatus.value = status;
      }
    );

    if (localTickerInterval !== null) clearInterval(localTickerInterval);
    localTickerInterval = window.setInterval(() => {
      tickLocalSimulation();
    }, 500);
  }



  function pauseSimulation() {
    isSimulationRunning.value = false;
    if (localTickerInterval !== null) {
      clearInterval(localTickerInterval);
      localTickerInterval = null;
    }
    wsClient.disconnect();
    connectionStatus.value = 'DISCONNECTED';
  }

  function toggleSimulation() {
    if (isSimulationRunning.value) {
      pauseSimulation();
    } else {
      startSimulation();
    }
  }

  // Phase 6 Studio State
  const selectedCatalogItem = ref<any | null>(null);
  const activeStudioFloor = ref<string>('FLOOR_1');

  function selectCatalogItem(item: any) {
    selectedCatalogItem.value = item;
  }

  async function addNode(nodeData: Partial<EquipmentNode> & { floor?: string; coordinates3D?: any }) {
    const tag = nodeData.tag || `NODE-${Date.now().toString().slice(-4)}`;
    const fullNode: EquipmentNode = {
      tag,
      name: nodeData.name || tag,
      zone: nodeData.zone || 'floor-1',
      floorLabel: nodeData.floorLabel || 'Floor 1 AI Suite',
      category: (nodeData.category as any) || 'cdu',
      anchor: nodeData.anchor || { x: 960, y: 540 },
      bounds: nodeData.bounds || { width: 120, height: 80 },
      status: 'normal',
      description: nodeData.description || 'Custom provisioned equipment in Digital Twin Studio.',
      metadata: nodeData.metadata || {
        capacity: '450 kW_th',
        flowRate: '150 L/min',
        fluid: 'CHW / PG25'
      },
      sensors: nodeData.sensors || {
        mainSensor: { id: `TT-${tag}`, name: 'Operating Temp', unit: '°C', value: 28.5, nominal: 28.0 }
      }
    };

    nodes.value[tag] = fullNode;
    selectedNodeTag.value = tag;

    await DragaApiClient.createNode({
      tag,
      name: fullNode.name,
      floor: nodeData.floor || activeStudioFloor.value,
      type: nodeData.category?.toUpperCase() || 'CDU',
      systemZone: fullNode.zone,
      coordinates2D: fullNode.anchor,
      coordinates3D: nodeData.coordinates3D || { x: 50, y: 0, z: 50 },
      specifications: fullNode.metadata
    });

    return tag;
  }

  async function deleteNode(tag: string) {
    if (nodes.value[tag]) {
      delete nodes.value[tag];
      if (selectedNodeTag.value === tag) {
        selectedNodeTag.value = Object.keys(nodes.value)[0] || null;
      }
      await DragaApiClient.deleteNode(tag);
    }
  }

  async function updateNodePosition(tag: string, coords3D: { x: number; y: number; z: number }) {
    if (nodes.value[tag]) {
      await DragaApiClient.updateNode(tag, { coordinates3D: coords3D });
    }
  }


  return {
    nodes,
    selectedNodeTag,
    selectedNode,
    allNodesList,
    layers,
    isSimulationRunning,
    connectionStatus,
    sequenceId,
    lastTelemetryTimestamp,
    simState,
    cadViewAngle,
    cadLevelFocus,
    selectedCatalogItem,
    activeStudioFloor,
    setLevelFocus,
    setViewAngle,
    selectCatalogItem,
    addNode,
    deleteNode,
    updateNodePosition,
    getSensorValue,
    selectNode,
    setNodeStatus,
    toggleLayer,
    triggerAnomaly,
    sendOperatorOverride,
    startSimulation,
    pauseSimulation,
    toggleSimulation,
  };
});
