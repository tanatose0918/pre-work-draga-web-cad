<template>
  <div class="fixed bottom-6 right-6 z-30 flex flex-col items-end select-none">
    <!-- Toggle Button -->
    <button 
      class="flex items-center gap-2 px-4 py-2.5 bg-slate-900/90 hover:bg-slate-800 text-sky-400 rounded-2xl border border-sky-500/30 shadow-2xl backdrop-blur font-mono text-xs font-bold transition cursor-pointer"
      @click="isOpen = !isOpen"
    >
      <span class="w-2.5 h-2.5 rounded-full" :class="telemetryStore.connectionStatus === 'CONNECTED' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'"></span>
      <span>🎮 {{ t('app.operatorControls') }}</span>
      <span class="text-[10px]">{{ isOpen ? '▼' : '▲' }}</span>
    </button>

    <!-- Modal / Drawer Content -->
    <div 
      v-if="isOpen" 
      class="mt-2 w-96 bg-slate-900/95 backdrop-blur-md rounded-2xl border border-slate-700/80 shadow-2xl p-5 text-slate-200 font-mono text-xs space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-150"
    >
      <div class="flex items-center justify-between border-b border-slate-800 pb-3">
        <div>
          <h3 class="font-bold text-sm text-sky-400">{{ t('operator.title') }}</h3>
          <p class="text-[10px] text-slate-400">{{ t('operator.sub') }}</p>
        </div>
        <span 
          class="px-2 py-0.5 rounded text-[10px] font-bold uppercase"
          :class="telemetryStore.connectionStatus === 'CONNECTED' 
            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
            : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'"
        >
          {{ telemetryStore.connectionStatus }}
        </span>
      </div>

      <!-- Control 1: Global AI Compute Load -->
      <div class="space-y-1.5 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
        <div class="flex justify-between items-center text-xs">
          <span class="text-slate-300 font-bold">{{ t('operator.computeLoad') }}:</span>
          <span class="text-sky-400 font-bold text-sm">{{ telemetryStore.simState.currentLoadPct }}%</span>
        </div>
        <input 
          type="range" 
          min="10" 
          max="100" 
          step="5"
          v-model.number="telemetryStore.simState.currentLoadPct"
          @input="onLoadChange"
          class="w-full accent-sky-400 cursor-pointer"
        />
        <div class="flex justify-between text-[10px] text-slate-400">
          <span>{{ t('operator.idle') }}</span>
          <span>{{ t('operator.nominalLoad') }}</span>
          <span>{{ t('operator.peak') }}</span>
        </div>
      </div>

      <!-- Control 2: Main Primary CHW Pump Speed RPM -->
      <div class="space-y-1.5 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
        <div class="flex justify-between items-center text-xs">
          <span class="text-slate-300 font-bold">{{ t('operator.pumpSpeed') }}:</span>
          <span class="text-emerald-400 font-bold text-sm">{{ telemetryStore.simState.pumpSpeedRpm }} RPM</span>
        </div>
        <input 
          type="range" 
          min="900" 
          max="2200" 
          step="50"
          v-model.number="telemetryStore.simState.pumpSpeedRpm"
          @input="onPumpChange"
          class="w-full accent-emerald-400 cursor-pointer"
        />
        <div class="flex justify-between text-[10px] text-slate-400">
          <span>900 RPM</span>
          <span>1,750 RPM (Nominal)</span>
          <span>2,200 RPM (Max)</span>
        </div>
      </div>

      <!-- Control 3: Floor Flow Control Valves (FCV-101 to FCV-401) -->
      <div class="space-y-2 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
        <div class="text-slate-300 font-bold text-xs">{{ t('operator.fcvValves') }}:</div>
        <div class="grid grid-cols-2 gap-2">
          <div v-for="floor in [4, 3, 2, 1]" :key="floor" class="space-y-1">
            <div class="flex justify-between text-[11px]">
              <span class="text-slate-400">FCV-{{ floor }}01:</span>
              <span class="text-orange-400 font-bold">{{ telemetryStore.simState.fcvOverrides[`FCV-${floor}01`] ?? 100 }}%</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="100" 
              step="10"
              :value="telemetryStore.simState.fcvOverrides[`FCV-${floor}01`] ?? 100"
              @input="(e) => onFcvChange(`FCV-${floor}01`, Number((e.target as HTMLInputElement).value))"
              class="w-full accent-orange-400 cursor-pointer"
            />
          </div>
        </div>
      </div>

      <div class="flex justify-between items-center text-[10px] text-slate-400 pt-1">
        <span>{{ t('operator.seq') }}: #{{ telemetryStore.sequenceId }}</span>
        <span>{{ t('operator.facility') }}: DC-CM-01 (Chiang Mai)</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useTelemetryStore } from '@/stores/telemetryStore';

const { t } = useI18n();
const telemetryStore = useTelemetryStore();
const isOpen = ref(false);

function onLoadChange() {
  telemetryStore.sendOperatorOverride('COMPUTE_CLUSTER', 'loadPct', telemetryStore.simState.currentLoadPct);
}

function onPumpChange() {
  telemetryStore.sendOperatorOverride('P-101', 'pumpSpeedRpm', telemetryStore.simState.pumpSpeedRpm);
}

function onFcvChange(tag: string, val: number) {
  telemetryStore.simState.fcvOverrides[tag] = val;
  telemetryStore.sendOperatorOverride(tag, 'valvePositionPct', val);
}
</script>
