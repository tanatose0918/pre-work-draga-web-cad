<template>
  <div class="flex flex-col h-screen w-screen bg-slate-950 overflow-hidden text-slate-100 font-mono">
    <!-- Top CAD Header & Global Status -->
    <CadToolbar 
      :current-mode="viewMode"
      @openSymbols="showSymbols = true" 
      @changeMode="(mode) => viewMode = mode"
    />

    <!-- Main Workspace with AutoCAD / Photoshop Style Docks -->
    <div class="flex-1 flex overflow-hidden relative">
      <!-- Left CAD Workbench Tool Sidebar -->
      <CadLeftSidebar 
        :current-mode="viewMode"
        :is-exploded="canvas3DRef?.isExploded"
        @toggleExplode="canvas3DRef?.toggleExplode()"
        @startCinematicTour="canvas3DRef?.startCinematicTour()"
        @isolate3DFloor="(floorId) => canvas3DRef?.selectFloor(floorId)"
      />

      <!-- Center Viewport Engine Area -->
      <main class="flex-1 h-full w-full relative overflow-hidden bg-slate-950">
        <VuePndCanvas v-if="viewMode === '2D'" />
        <VuePndCanvas3D v-else-if="viewMode === '3D'" ref="canvas3DRef" />
        <NewFacilityStudio v-else />
      </main>

      <!-- Right Side Telemetry Inspector Drawer -->
      <TelemetryDrawer v-if="viewMode !== 'STUDIO'" />

      <!-- Bottom Right Non-Obtrusive Operator Control Trigger -->
      <OperatorControlPanel v-if="viewMode !== 'STUDIO'" />

      <!-- CAD Symbol Library Modal -->
      <CadSymbolLegend v-if="showSymbols" @close="showSymbols = false" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useTelemetryStore } from '@/stores/telemetryStore';
import CadToolbar from '@/components/CadToolbar.vue';
import CadLeftSidebar from '@/components/CadLeftSidebar.vue';
import VuePndCanvas from '@/components/VuePndCanvas.vue';
import VuePndCanvas3D from '@/components/VuePndCanvas3D.vue';
import NewFacilityStudio from '@/components/NewFacilityStudio.vue';
import TelemetryDrawer from '@/components/TelemetryDrawer.vue';
import OperatorControlPanel from '@/components/OperatorControlPanel.vue';
import CadSymbolLegend from '@/components/CadSymbolLegend.vue';

const telemetryStore = useTelemetryStore();
const showSymbols = ref(false);
const viewMode = ref<'2D' | '3D' | 'STUDIO'>('2D');
const canvas3DRef = ref<any | null>(null);

onMounted(() => {
  telemetryStore.startSimulation();
});

onUnmounted(() => {
  telemetryStore.pauseSimulation();
});
</script>
