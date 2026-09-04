<template>
  <aside class="w-68 h-full bg-slate-900/95 border-r border-slate-800 flex flex-col justify-between z-20 select-none font-mono text-xs backdrop-blur">
    <!-- Top Scrollable Tool Sections -->
    <div class="flex-1 overflow-y-auto p-3 space-y-4 scrollbar-thin">
      
      <!-- SECTION 1: PROJECTION / VIEW ANGLES -->
      <div class="space-y-1.5">
        <div class="flex items-center justify-between px-1 text-[11px] text-slate-400 font-bold uppercase tracking-wider">
          <span>{{ currentMode === '2D' ? '2D Projection' : '3D Viewport Controls' }}</span>
          <span class="text-sky-400 text-[10px]">{{ currentMode }}</span>
        </div>

        <!-- 2D View Angles -->
        <div v-if="currentMode === '2D'" class="grid grid-cols-2 gap-1.5">
          <button 
            class="px-2.5 py-2 rounded-xl font-bold transition flex items-center gap-1.5 text-[11px] cursor-pointer"
            :class="telemetryStore.cadViewAngle === 'TOP' ? 'bg-sky-500 text-slate-950 shadow-md font-extrabold' : 'bg-slate-950/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800'"
            @click="telemetryStore.setViewAngle('TOP')"
          >
            <span>🔝</span>
            <span>Top Plan</span>
          </button>

          <button 
            class="px-2.5 py-2 rounded-xl font-bold transition flex items-center gap-1.5 text-[11px] cursor-pointer"
            :class="telemetryStore.cadViewAngle === 'SIDE' ? 'bg-sky-500 text-slate-950 shadow-md font-extrabold' : 'bg-slate-950/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800'"
            @click="telemetryStore.setViewAngle('SIDE')"
          >
            <span>🏢</span>
            <span>Side Section</span>
          </button>

          <button 
            class="px-2.5 py-2 rounded-xl font-bold transition flex items-center gap-1.5 text-[11px] cursor-pointer"
            :class="telemetryStore.cadViewAngle === 'FRONT' ? 'bg-sky-500 text-slate-950 shadow-md font-extrabold' : 'bg-slate-950/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800'"
            @click="telemetryStore.setViewAngle('FRONT')"
          >
            <span>🏙️</span>
            <span>Front Racks</span>
          </button>

          <button 
            class="px-2.5 py-2 rounded-xl font-bold transition flex items-center gap-1.5 text-[11px] cursor-pointer"
            :class="telemetryStore.cadViewAngle === 'BACK' ? 'bg-sky-500 text-slate-950 shadow-md font-extrabold' : 'bg-slate-950/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800'"
            @click="telemetryStore.setViewAngle('BACK')"
          >
            <span>🏭</span>
            <span>Back Cooling</span>
          </button>
        </div>

        <!-- 3D Actions (Exploded View & Cinematic Tour) -->
        <div v-else-if="currentMode === '3D'" class="flex flex-col gap-1.5">
          <button 
            class="w-full px-3 py-2 rounded-xl border text-[11px] font-bold transition flex items-center justify-center gap-2 cursor-pointer"
            :class="isExploded 
              ? 'bg-purple-500/20 text-purple-300 border-purple-500/40 shadow-lg shadow-purple-500/10' 
              : 'bg-slate-950/80 text-slate-300 border-slate-800 hover:bg-slate-800'"
            @click="$emit('toggleExplode')"
          >
            <span>💥</span>
            <span>{{ isExploded ? 'COLLAPSE FLOORS' : 'EXPLODED 3D VIEW' }}</span>
          </button>

          <button 
            class="w-full bg-gradient-to-r from-sky-600/30 to-purple-600/30 hover:from-sky-600/40 hover:to-purple-600/40 text-slate-100 border border-sky-500/30 px-3 py-2 rounded-xl text-[11px] font-bold transition flex items-center justify-center gap-2 cursor-pointer"
            @click="$emit('startCinematicTour')"
          >
            <span class="w-2 h-2 rounded-full bg-purple-400 animate-ping"></span>
            <span>🎬 CINEMATIC TOUR</span>
          </button>
        </div>
      </div>

      <!-- SECTION 2: ARCHITECTURAL LEVELS & ZONES -->
      <div class="space-y-1.5 pt-2 border-t border-slate-800/80">
        <div class="flex items-center justify-between px-1 text-[11px] text-slate-400 font-bold uppercase tracking-wider">
          <span>Levels & Zones</span>
          <span class="text-emerald-400 text-[10px]">6 Tiers</span>
        </div>

        <div class="space-y-1">
          <!-- All Levels -->
          <button 
            class="w-full flex items-center gap-2 px-3 py-2 rounded-xl transition text-left text-[11px] font-medium cursor-pointer"
            :class="telemetryStore.cadLevelFocus === 'ALL' 
              ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 font-bold' 
              : 'text-slate-300 hover:bg-slate-800 hover:text-white bg-slate-950/40 border border-slate-800/60'"
            @click="selectLevel('ALL', null)"
          >
            <span class="w-2 h-2 rounded-full bg-sky-400"></span>
            <span>All Levels (Full)</span>
          </button>

          <!-- Individual Tiers -->
          <button 
            v-for="lvl in levelTiers" 
            :key="lvl.id"
            class="w-full flex items-center justify-between px-3 py-2 rounded-xl transition text-left text-[11px] font-medium cursor-pointer"
            :class="telemetryStore.cadLevelFocus === lvl.id 
              ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 font-bold' 
              : 'text-slate-300 hover:bg-slate-800 hover:text-white bg-slate-950/40 border border-slate-800/60'"
            @click="selectLevel(lvl.id, lvl.leadTag)"
          >
            <div class="flex items-center gap-2">
              <span class="w-2 h-2 rounded-full" :class="lvl.dotColor"></span>
              <span>{{ lvl.label }}</span>
            </div>
            <span class="text-[10px] text-slate-500 font-mono">{{ lvl.sub }}</span>
          </button>
        </div>
      </div>

      <!-- SECTION 3: CAD LAYERS TOGGLES -->
      <div v-if="currentMode === '2D'" class="space-y-1.5 pt-2 border-t border-slate-800/80">
        <div class="flex items-center justify-between px-1 text-[11px] text-slate-400 font-bold uppercase tracking-wider">
          <span>CAD Layers</span>
          <span class="text-slate-500 text-[10px]">Filter</span>
        </div>

        <div class="space-y-1 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 text-[11px]">
          <label class="flex items-center justify-between cursor-pointer text-slate-300 hover:text-white py-0.5">
            <span>Grid Overlay</span>
            <input type="checkbox" v-model="telemetryStore.layers.grid" class="rounded accent-sky-500" />
          </label>
          <label class="flex items-center justify-between cursor-pointer text-slate-300 hover:text-white py-0.5">
            <span>DN250 Central Risers</span>
            <input type="checkbox" v-model="telemetryStore.layers.centralRisers" class="rounded accent-sky-500" />
          </label>
          <label class="flex items-center justify-between cursor-pointer text-slate-300 hover:text-white py-0.5">
            <span>Fluid Flow VFX</span>
            <input type="checkbox" v-model="telemetryStore.layers.flowAnimations" class="rounded accent-sky-500" />
          </label>
        </div>
      </div>
    </div>

    <!-- Bottom Status Info Bar -->
    <div class="p-3 bg-slate-950 border-t border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
      <span>AutoCAD / PS GUI</span>
      <span class="text-emerald-400 font-bold">● ONLINE</span>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { useTelemetryStore } from '@/stores/telemetryStore';
import type { CadLevelFocus } from '@/types/cad';

defineProps<{
  currentMode: '2D' | '3D' | 'STUDIO';
  isExploded?: boolean;
}>();

const emit = defineEmits<{
  (e: 'toggleExplode'): void;
  (e: 'startCinematicTour'): void;
  (e: 'isolate3DFloor', floorId: string): void;
}>();

const telemetryStore = useTelemetryStore();

const levelTiers = [
  { id: 'ROOFTOP_DECK' as CadLevelFocus, label: 'Rooftop ORC', sub: '1,850 kW', leadTag: 'HEX-R01', dotColor: 'bg-purple-400' },
  { id: 'FLOOR_4' as CadLevelFocus, label: 'Floor 4 AI Cluster', sub: '10 Racks', leadTag: 'CDU-401', dotColor: 'bg-sky-400' },
  { id: 'FLOOR_3' as CadLevelFocus, label: 'Floor 3 AI Cluster', sub: '10 Racks', leadTag: 'CDU-301', dotColor: 'bg-sky-400' },
  { id: 'FLOOR_2' as CadLevelFocus, label: 'Floor 2 AI Cluster', sub: '10 Racks', leadTag: 'CDU-201', dotColor: 'bg-sky-400' },
  { id: 'FLOOR_1' as CadLevelFocus, label: 'Floor 1 AI Cluster', sub: '10 Racks', leadTag: 'CDU-101', dotColor: 'bg-sky-400' },
  { id: 'GROUND_EXTERNAL' as CadLevelFocus, label: 'Ground Basin & Pump', sub: '2,400 L/m', leadTag: 'P-101', dotColor: 'bg-emerald-400' }
];

function selectLevel(levelId: CadLevelFocus, tag: string | null) {
  telemetryStore.setLevelFocus(levelId);
  if (tag) telemetryStore.selectNode(tag);
  emit('isolate3DFloor', levelId);
}
</script>
