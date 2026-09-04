<template>
  <div class="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center select-none font-mono text-xs animate-in slide-in-from-bottom-6 duration-200">
    <!-- Active Placement Mode Tooltip / Cancel HUD -->
    <div 
      v-if="telemetryStore.selectedCatalogItem" 
      class="mb-3 px-4 py-2 bg-sky-500/90 text-slate-950 font-bold rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur"
    >
      <span class="w-2.5 h-2.5 rounded-full bg-white animate-ping"></span>
      <span>PLACING: {{ telemetryStore.selectedCatalogItem.name }} (Floor: {{ telemetryStore.activeStudioFloor }})</span>
      <span class="text-[10px] opacity-80">| Click Floor to Place (1m Snap)</span>
      <button 
        class="ml-2 px-2 py-0.5 bg-slate-950/20 hover:bg-slate-950/40 rounded-lg text-slate-950 text-xs font-bold transition cursor-pointer"
        @click="telemetryStore.selectCatalogItem(null)"
      >
        ✕ Cancel
      </button>
    </div>

    <!-- The Sims-Style Asset Catalog Dock -->
    <div class="bg-slate-900/95 backdrop-blur-md rounded-3xl border border-slate-700/80 shadow-2xl p-3 flex flex-col gap-2 max-w-4xl">
      <!-- Category Tabs & Floor Selector -->
      <div class="flex items-center justify-between gap-4 border-b border-slate-800 pb-2 px-2">
        <!-- Category Buttons -->
        <div class="flex items-center gap-1.5">
          <button 
            v-for="cat in categories" 
            :key="cat.id"
            class="px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 font-bold text-xs cursor-pointer"
            :class="activeCategory === cat.id 
              ? 'bg-sky-500 text-slate-950 shadow-md' 
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'"
            @click="activeCategory = cat.id"
          >
            <span>{{ cat.icon }}</span>
            <span>{{ cat.name }}</span>
          </button>
        </div>

        <!-- Target Floor Dropdown -->
        <div class="flex items-center gap-2 text-xs">
          <span class="text-slate-400">Target Floor:</span>
          <select 
            v-model="telemetryStore.activeStudioFloor"
            class="bg-slate-950 text-sky-400 border border-slate-700 rounded-lg px-2.5 py-1 font-bold outline-none cursor-pointer"
          >
            <option value="ROOFTOP_DECK">Rooftop ORC</option>
            <option value="FLOOR_4">Floor 4 AI</option>
            <option value="FLOOR_3">Floor 3 AI</option>
            <option value="FLOOR_2">Floor 2 AI</option>
            <option value="FLOOR_1">Floor 1 AI</option>
            <option value="GROUND_EXTERNAL">Ground Basin</option>
          </select>
        </div>
      </div>

      <!-- Asset Items Row -->
      <div class="flex items-center gap-3 overflow-x-auto p-1 max-w-3xl scrollbar-thin">
        <div 
          v-for="item in filteredCatalog" 
          :key="item.type"
          class="flex-shrink-0 w-44 bg-slate-950/80 hover:bg-slate-800/90 border rounded-2xl p-3 flex flex-col gap-2 transition cursor-pointer group"
          :class="telemetryStore.selectedCatalogItem?.type === item.type 
            ? 'border-sky-400 shadow-lg shadow-sky-500/20 ring-2 ring-sky-400/30' 
            : 'border-slate-800 hover:border-slate-700'"
          @click="selectItem(item)"
        >
          <div class="flex items-start justify-between">
            <span class="text-xl p-1.5 rounded-xl bg-slate-900 border border-slate-800 group-hover:scale-110 transition">{{ item.icon }}</span>
            <span class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-sky-400">{{ item.specs }}</span>
          </div>
          <div>
            <div class="text-xs font-bold text-slate-200 truncate">{{ item.name }}</div>
            <div class="text-[10px] text-slate-400 mt-0.5 truncate">{{ item.desc }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useTelemetryStore } from '@/stores/telemetryStore';

const telemetryStore = useTelemetryStore();
const activeCategory = ref<'compute' | 'cooling' | 'orc'>('compute');

const categories = [
  { id: 'compute' as const, name: 'AI Compute', icon: '🖥️' },
  { id: 'cooling' as const, name: 'Cooling & Pumps', icon: '❄️' },
  { id: 'orc' as const, name: 'Rooftop ORC Energy', icon: '⚡' }
];


const catalogItems = [
  // Compute
  { 
    type: 'RACK_45KW', 
    category: 'compute', 
    name: 'AI GPU Server Cluster', 
    icon: '🖥️', 
    specs: '450 kW', 
    desc: '3-Rack In-Row D2C Suite',
    nodeType: 'AI_SERVER_CLUSTER',
    defaultTagPrefix: 'RACK'
  },
  { 
    type: 'CDU_450KW', 
    category: 'cooling', 
    name: 'Liquid-to-Liquid CDU', 
    icon: '🎛️', 
    specs: '450 kW', 
    desc: 'Dual Loop Heat Exchanger',
    nodeType: 'COOLANT_DISTRIBUTION_UNIT',
    defaultTagPrefix: 'CDU'
  },
  { 
    type: 'PUMP_CHW', 
    category: 'cooling', 
    name: 'CHW Circulation Pump', 
    icon: '⚙️', 
    specs: '2,400 L/min', 
    desc: 'VFD Centrifugal Motor',
    nodeType: 'CHILLED_WATER_PUMP',
    defaultTagPrefix: 'P-CHW'
  },
  { 
    type: 'HEX_UTUBE', 
    category: 'orc', 
    name: 'Inverted U-Tube HEX', 
    icon: '🔁', 
    specs: '1,850 kW', 
    desc: 'Shell & Tube NH3 Evaporator',
    nodeType: 'INVERTED_4PRONG_UTUBE_HEX',
    defaultTagPrefix: 'HEX'
  },
  { 
    type: 'TB_EXPANDER', 
    category: 'orc', 
    name: 'Ammonia Radial Expander', 
    icon: '🌀', 
    specs: '520 kW_e', 
    desc: '12,000 RPM Generator Core',
    nodeType: 'AMMONIA_ORC_TURBINE',
    defaultTagPrefix: 'TB'
  },
  { 
    type: 'CND_SPIRAL', 
    category: 'orc', 
    name: '6-Arm Spiral Condenser', 
    icon: '✳️', 
    specs: '4,090 kW', 
    desc: 'Radial Air-Cooled Array',
    nodeType: 'SPIRAL_CONDENSER_ARM',
    defaultTagPrefix: 'CND'
  }
];

const filteredCatalog = computed(() => {
  return catalogItems.filter(item => item.category === activeCategory.value);
});

function selectItem(item: any) {
  if (telemetryStore.selectedCatalogItem?.type === item.type) {
    telemetryStore.selectCatalogItem(null);
  } else {
    telemetryStore.selectCatalogItem(item);
  }
}
</script>
