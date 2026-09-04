import type { SimulationState } from '@/types/cad';

export interface SensorTelemetry {
  tag: string;
  value: number;
  unit: string;
  status: 'NORMAL' | 'WARNING' | 'CRITICAL';
  timestamp?: number;
}

function gaussianNoise(mean = 0, stdDev = 0.15): number {
  const u1 = Math.random() || 0.0001;
  const u2 = Math.random() || 0.0001;
  const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  return mean + z0 * stdDev;
}

export function runSimulationTick(state: SimulationState): SensorTelemetry[] {
  const now = Date.now();
  const loadFrac = Math.max(0.05, Math.min(1.0, state.currentLoadPct / 100));
  const telemetry: SensorTelemetry[] = [];

  const baseFlowLpmPerFloor = 450;
  let totalHotReturnFlowLpm = 0;
  let weightedReturnTempSum = 0;

  for (let floor = 1; floor <= 4; floor++) {
    const fcvTag = `FCV-${floor}01`;
    const fcvOpenFrac = (state.fcvOverrides[fcvTag] ?? 100) / 100;
    const floorFlowLpm = baseFlowLpmPerFloor * fcvOpenFrac * (state.pumpSpeedRpm / 1750);
    
    const rackHeatKw = 450 * loadFrac * (0.95 + 0.1 * (floor / 4));
    const tin = 28.0 + gaussianNoise(0, 0.08);
    const tout = tin + (rackHeatKw * 14.384) / Math.max(50, floorFlowLpm) + gaussianNoise(0, 0.2);
    
    const dpPsi = 0.00032 * Math.pow(Math.max(10, floorFlowLpm), 1.85) + 0.5 + gaussianNoise(0, 0.3);
    const supplyPressureBar = 5.8 - (floor * 0.25) + gaussianNoise(0, 0.05);

    totalHotReturnFlowLpm += floorFlowLpm;
    weightedReturnTempSum += tout * floorFlowLpm;

    telemetry.push({
      tag: `TT-${floor}01`,
      value: Number(tin.toFixed(2)),
      unit: '°C',
      status: 'NORMAL',
      timestamp: now
    });
    telemetry.push({
      tag: `TT-${floor}02`,
      value: Number(tout.toFixed(2)),
      unit: '°C',
      status: tout > 70 ? 'CRITICAL' : tout > 60 ? 'WARNING' : 'NORMAL',
      timestamp: now
    });
    telemetry.push({
      tag: `PT-${floor}01`,
      value: Number(supplyPressureBar.toFixed(2)),
      unit: 'bar',
      status: 'NORMAL',
      timestamp: now
    });
    telemetry.push({
      tag: `DP-${floor}01`,
      value: Number(dpPsi.toFixed(2)),
      unit: 'psi',
      status: 'NORMAL',
      timestamp: now
    });
    telemetry.push({
      tag: `FT-${floor}01`,
      value: Number(floorFlowLpm.toFixed(1)),
      unit: 'L/min',
      status: 'NORMAL',
      timestamp: now
    });
  }

  const avgReturnTemp = totalHotReturnFlowLpm > 0 ? weightedReturnTempSum / totalHotReturnFlowLpm : 65.0;
  telemetry.push({
    tag: 'TT-RISER-01',
    value: Number(avgReturnTemp.toFixed(2)),
    unit: '°C',
    status: avgReturnTemp > 75 ? 'CRITICAL' : 'NORMAL',
    timestamp: now
  });

  const orcThermalInputKw = (totalHotReturnFlowLpm * (avgReturnTemp - 30) * 4.184) / 60;
  const orcGenPowerKw = Math.max(0, orcThermalInputKw * 0.185 + gaussianNoise(0, 2.5));
  const turbineRpm = 12000 * Math.min(1.0, orcGenPowerKw / 524) + gaussianNoise(0, 15);

  telemetry.push({
    tag: 'PWR-GEN-01',
    value: Number(orcGenPowerKw.toFixed(1)),
    unit: 'kW',
    status: 'NORMAL',
    timestamp: now
  });
  telemetry.push({
    tag: 'RPM-TURB-01',
    value: Number(turbineRpm.toFixed(0)),
    unit: 'RPM',
    status: 'NORMAL',
    timestamp: now
  });

  return telemetry;
}
