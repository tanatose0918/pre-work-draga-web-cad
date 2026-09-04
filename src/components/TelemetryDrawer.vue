<template>
  <aside 
    v-if="telemetryStore.selectedNode"
    class="w-96 bg-slate-900 border-l border-slate-800 flex flex-col h-[calc(100vh-4rem)] overflow-y-auto z-10 select-text"
  >
    <!-- Header -->
    <div class="p-5 border-b border-slate-800 bg-slate-900/60 sticky top-0 backdrop-blur z-10 flex items-start justify-between">
      <div>
        <div class="flex items-center gap-2">
          <span 
            class="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wide border"
            :class="getBadgeClass(telemetryStore.selectedNode.status)"
          >
            {{ telemetryStore.selectedNode.status }}
          </span>
          <span class="text-xs font-mono text-slate-400">{{ telemetryStore.selectedNode.zone }}</span>
        </div>
        <h2 class="text-lg font-bold text-slate-100 font-mono mt-1">{{ telemetryStore.selectedNode.tag }}</h2>
        <p class="text-xs text-slate-400">{{ telemetryStore.selectedNode.name }}</p>
      </div>
      <button 
        class="text-slate-400 hover:text-slate-200 text-sm p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
        @click="telemetryStore.selectNode(null)"
      >
        ✕
      </button>
    </div>

    <!-- Description & Zone -->
    <div class="p-5 border-b border-slate-800 space-y-3">
      <div class="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
        {{ telemetryStore.selectedNode.description }}
      </div>

      <div class="grid grid-cols-2 gap-2 text-xs font-mono">
        <div class="bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/60">
          <div class="text-[10px] text-slate-400 uppercase">{{ t('drawer.anchor') }}</div>
          <div class="font-bold text-sky-400 mt-0.5">X: {{ telemetryStore.selectedNode.anchor.x }}, Y: {{ telemetryStore.selectedNode.anchor.y }}</div>
        </div>
        <div class="bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/60">
          <div class="text-[10px] text-slate-400 uppercase">{{ t('drawer.floorZone') }}</div>
          <div class="font-bold text-emerald-400 mt-0.5">{{ telemetryStore.selectedNode.floorLabel }}</div>
        </div>
      </div>
    </div>

    <!-- Real-Time Telemetry Sensors -->
    <div class="p-5 border-b border-slate-800 space-y-3">
      <div class="flex items-center justify-between">
        <h3 class="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">{{ t('drawer.liveSensorFeed') }}</h3>
        <span class="flex items-center gap-1 text-[10px] font-mono text-emerald-400">
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
          {{ t('drawer.streaming') }}
        </span>
      </div>

      <div class="space-y-2.5">
        <div 
          v-for="sensor in Object.values(telemetryStore.selectedNode.sensors)" 
          :key="sensor.id"
          class="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80 hover:border-slate-700 transition"
        >
          <div class="flex items-center justify-between text-xs">
            <span class="text-slate-400 font-mono text-[11px]">{{ sensor.id }}</span>
            <span class="font-bold font-mono text-sm text-sky-400">{{ sensor.value.toFixed(1) }} {{ sensor.unit }}</span>
          </div>
          <div class="text-xs font-medium text-slate-200 mt-0.5">{{ sensor.name }}</div>

          <!-- Mini Bar Gauge -->
          <div v-if="sensor.nominal" class="mt-2.5">
            <div class="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden flex">
              <div 
                class="h-full transition-all duration-500"
                :class="sensor.value > (sensor.warningThreshold || 999) ? 'bg-amber-400' : 'bg-sky-400'"
                :style="{ width: `${Math.min(100, Math.max(10, (sensor.value / (sensor.nominal * 1.5)) * 100))}%` }"
              ></div>
            </div>
            <div class="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
              <span>{{ t('drawer.nominal') }}: {{ sensor.nominal }} {{ sensor.unit }}</span>
              <span v-if="sensor.warningThreshold">{{ t('drawer.warn') }}: {{ sensor.warningThreshold }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Metadata & Engineering Specs -->
    <div class="p-5 border-b border-slate-800 space-y-3">
      <h3 class="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">{{ t('drawer.engineeringSpecs') }}</h3>
      <div class="bg-slate-950/70 rounded-xl border border-slate-800/80 overflow-hidden divide-y divide-slate-800/60 text-xs font-mono">
        <div 
          v-for="(val, key) in telemetryStore.selectedNode.metadata" 
          :key="key"
          class="p-2.5 flex items-center justify-between"
        >
          <span class="text-slate-400 capitalize">{{ formatKey(key) }}</span>
          <span class="text-slate-200 font-medium">{{ val }}</span>
        </div>
      </div>
    </div>

    <!-- Diagnostics / Fault Simulation Actions -->
    <div class="p-5 mt-auto bg-slate-950/40 space-y-2">
      <button 
        class="w-full py-2.5 px-4 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl text-xs font-mono font-semibold transition flex items-center justify-center gap-2 cursor-pointer"
        @click="telemetryStore.triggerAnomaly(telemetryStore.selectedNode.tag)"
      >
        <span>{{ t('drawer.faultAnomaly') }}</span>
      </button>

      <button 
        class="w-full py-2 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-mono transition cursor-pointer"
        @click="telemetryStore.setNodeStatus(telemetryStore.selectedNode.tag, 'normal')"
      >
        {{ t('drawer.resetStatus') }}
      </button>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { useTelemetryStore } from '@/stores/telemetryStore';
import type { NodeStatus } from '@/types/cad';

const { t } = useI18n();
const telemetryStore = useTelemetryStore();

function formatKey(key: string): string {
  return key.replace(/([A-Z])/g, ' $1').toLowerCase();
}

function getBadgeClass(status?: NodeStatus): string {
  switch (status) {
    case 'critical':
      return 'bg-red-500/20 text-red-400 border-red-500/30';
    case 'warning':
      return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    default:
      return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
  }
}
</script>
