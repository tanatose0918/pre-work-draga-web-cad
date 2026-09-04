<template>
  <header class="h-16 bg-slate-900/95 border-b border-slate-800 flex items-center justify-between px-6 z-20 backdrop-blur select-none">
    <!-- Brand / Title -->
    <div class="flex items-center gap-3">
      <div class="w-9 h-9 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 font-black font-mono">
        CAD
      </div>
      <div>
        <div class="flex items-center gap-2">
          <h1 class="font-bold text-sm text-slate-100 font-mono tracking-wide">{{ t('app.title') }}</h1>
          <span class="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-400 border border-sky-500/30">
            {{ currentMode === '3D' ? 'WebGL 3D Twin' : currentMode === 'STUDIO' ? 'Sims Studio' : t('app.versionTag') }}
          </span>
        </div>
        <p class="text-[11px] text-slate-400 font-mono">{{ t('app.subtitle') }}</p>
      </div>
    </div>

    <!-- 2D / 3D / Studio Mode Switcher (Prominent Center Segment) -->
    <div class="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 font-mono text-xs shadow-inner">
      <button 
        class="px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer"
        :class="currentMode === '2D' 
          ? 'bg-sky-500 text-slate-950 shadow-md' 
          : 'text-slate-400 hover:text-slate-200'"
        @click="$emit('changeMode', '2D')"
      >
        <span>📐</span>
        <span>2D BLUEPRINT</span>
      </button>

      <button 
        class="px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer"
        :class="currentMode === '3D' 
          ? 'bg-gradient-to-r from-sky-400 to-purple-400 text-slate-950 shadow-md' 
          : 'text-slate-400 hover:text-slate-200'"
        @click="$emit('changeMode', '3D')"
      >
        <span>🌐</span>
        <span>3D DIGITAL TWIN</span>
      </button>

      <button 
        class="px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer"
        :class="currentMode === 'STUDIO' 
          ? 'bg-emerald-400 text-slate-950 shadow-md font-extrabold' 
          : 'text-slate-400 hover:text-slate-200'"
        @click="$emit('changeMode', 'STUDIO')"
      >
        <span>🏗️</span>
        <span>SIMS STUDIO (CRUD)</span>
      </button>
    </div>

    <!-- Quick Engineering KPIs -->
    <div class="hidden xl:flex items-center gap-6 text-xs font-mono">
      <div class="flex flex-col">
        <span class="text-[10px] text-slate-400">{{ t('kpis.totalItLoad') }}</span>
        <span class="font-bold text-emerald-400">1,800 kW_th</span>
      </div>
      <div class="h-6 w-px bg-slate-800"></div>
      <div class="flex flex-col">
        <span class="text-[10px] text-slate-400">{{ t('kpis.orcPowerGen') }}</span>
        <span class="font-bold text-purple-400">{{ telemetryStore.getSensorValue('TB-R01', 'powerOutput') }}</span>
      </div>
      <div class="h-6 w-px bg-slate-800"></div>
      <div class="flex flex-col">
        <span class="text-[10px] text-slate-400">{{ t('kpis.hotReturnRiser') }}</span>
        <span class="font-bold text-orange-400">{{ telemetryStore.getSensorValue('HEX-R01', 'tempIn') }}</span>
      </div>
      <div class="h-6 w-px bg-slate-800"></div>
      <div class="flex flex-col">
        <span class="text-[10px] text-slate-400">{{ t('kpis.chwFlowRate') }}</span>
        <span class="font-bold text-sky-400">{{ telemetryStore.getSensorValue('P-101', 'pumpSpeed') }}</span>
      </div>
    </div>

    <!-- Controls & Actions -->
    <div class="flex items-center gap-2.5">
      <!-- Language Switcher Button -->
      <button 
        class="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 rounded-lg border border-slate-700 text-xs font-mono font-bold text-slate-200 transition cursor-pointer"
        @click="switchLang"
        :title="locale === 'th' ? 'Switch to English' : 'เปลี่ยนเป็นภาษาไทย'"
      >
        <span>{{ locale === 'th' ? '🇹🇭 TH' : '🇬🇧 EN' }}</span>
        <span class="text-[10px] text-slate-400">⇄</span>
      </button>

      <!-- Live Simulation Play/Pause -->
      <button 
        class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono font-medium transition cursor-pointer"
        :class="telemetryStore.isSimulationRunning 
          ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/20' 
          : 'bg-amber-500/10 border-amber-500/40 text-amber-400 hover:bg-amber-500/20'"
        @click="telemetryStore.toggleSimulation"
      >
        <span class="w-2 h-2 rounded-full" :class="telemetryStore.isSimulationRunning ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'"></span>
        <span>{{ telemetryStore.isSimulationRunning ? t('app.simulationActive') : t('app.simulationPaused') }}</span>
      </button>

      <!-- CAD Symbols Library Button -->
      <button 
        class="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 rounded-lg border border-slate-700 text-xs font-mono text-sky-300 transition cursor-pointer"
        @click="$emit('openSymbols')"
      >
        <span>⎔ {{ t('app.cadSymbols') }}</span>
      </button>

      <!-- Layer Dropdown Menu Toggle (2D Mode) -->
      <div v-if="currentMode === '2D'" class="relative">
        <button 
          class="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 rounded-lg border border-slate-700 text-xs font-mono text-slate-200 transition cursor-pointer"
          @click="showLayersMenu = !showLayersMenu"
        >
          <span>{{ t('app.cadLayers') }}</span>
          <span class="text-[10px]">▼</span>
        </button>

        <!-- Dropdown Content -->
        <div 
          v-if="showLayersMenu" 
          class="absolute right-0 mt-2 w-60 bg-slate-900 border border-slate-700 rounded-xl p-3 shadow-2xl z-50 text-xs space-y-2"
        >
          <div class="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-2 font-bold">{{ t('layers.title') }}</div>
          
          <label class="flex items-center justify-between cursor-pointer text-slate-300 hover:text-white py-1">
            <span>{{ t('layers.grid') }}</span>
            <input type="checkbox" v-model="telemetryStore.layers.grid" class="rounded accent-sky-500" />
          </label>

          <label class="flex items-center justify-between cursor-pointer text-slate-300 hover:text-white py-1">
            <span>{{ t('layers.centralRisers') }}</span>
            <input type="checkbox" v-model="telemetryStore.layers.centralRisers" class="rounded accent-sky-500" />
          </label>

          <label class="flex items-center justify-between cursor-pointer text-slate-300 hover:text-white py-1">
            <span>{{ t('layers.rooftopOrc') }}</span>
            <input type="checkbox" v-model="telemetryStore.layers.rooftopOrc" class="rounded accent-sky-500" />
          </label>

          <label class="flex items-center justify-between cursor-pointer text-slate-300 hover:text-white py-1">
            <span>{{ t('layers.floors') }}</span>
            <input type="checkbox" v-model="telemetryStore.layers.floor4" class="rounded accent-sky-500" />
          </label>

          <label class="flex items-center justify-between cursor-pointer text-slate-300 hover:text-white py-1">
            <span>{{ t('layers.groundBasin') }}</span>
            <input type="checkbox" v-model="telemetryStore.layers.groundBasin" class="rounded accent-sky-500" />
          </label>

          <label class="flex items-center justify-between cursor-pointer text-slate-300 hover:text-white py-1">
            <span>{{ t('layers.flowAnimations') }}</span>
            <input type="checkbox" v-model="telemetryStore.layers.flowAnimations" class="rounded accent-sky-500" />
          </label>

          <label class="flex items-center justify-between cursor-pointer text-slate-300 hover:text-white py-1">
            <span>{{ t('layers.telemetryLabels') }}</span>
            <input type="checkbox" v-model="telemetryStore.layers.telemetryLabels" class="rounded accent-sky-500" />
          </label>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useTelemetryStore } from '@/stores/telemetryStore';
import { toggleLanguage } from '@/i18n';

defineProps<{
  currentMode: '2D' | '3D' | 'STUDIO';
}>();

defineEmits<{
  (e: 'openSymbols'): void;
  (e: 'changeMode', mode: '2D' | '3D' | 'STUDIO'): void;
}>();

const { t, locale } = useI18n();
const telemetryStore = useTelemetryStore();
const showLayersMenu = ref(false);

function switchLang() {
  toggleLanguage();
}
</script>
