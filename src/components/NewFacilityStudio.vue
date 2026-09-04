<template>
  <div class="relative w-full h-full overflow-hidden bg-slate-950 select-none font-mono text-xs">
    <!-- 3D WebGL Studio Canvas -->
    <div 
      ref="studioCanvasMount" 
      class="w-full h-full"
      :class="selectedAsset ? 'cursor-crosshair' : 'cursor-grab active:cursor-grabbing'"
      @pointermove="onPointerMove"
      @pointerdown="onPointerDown"
    ></div>

    <!-- STUDIO TOP HEADER & KPI BAR -->
    <div class="absolute top-6 left-6 flex flex-col gap-2 z-10">
      <div class="bg-slate-900/95 backdrop-blur-md p-4 rounded-2xl border border-slate-700/80 shadow-2xl space-y-2 max-w-sm">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="w-3 h-3 rounded-full bg-sky-400 animate-ping"></span>
            <h2 class="font-extrabold text-sm text-sky-300">FACILITY CAD STUDIO (SIMS BUILDER)</h2>
          </div>
          <span class="text-[10px] px-2 py-0.5 rounded bg-sky-500/20 text-sky-400 font-bold border border-sky-500/30">PHASE 6</span>
        </div>
        <p class="text-[11px] text-slate-400">
          Design, place, and simulate new Data Center modules before physical construction.
        </p>

        <!-- Studio Metrics -->
        <div class="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-[11px]">
          <div class="flex flex-col">
            <span class="text-slate-400">Total Placed Units:</span>
            <span class="font-bold text-emerald-400 text-sm">{{ placedItems.length }} Assets</span>
          </div>
          <div class="flex flex-col">
            <span class="text-slate-400">Total IT Compute:</span>
            <span class="font-bold text-purple-400 text-sm">{{ totalStudioPower }} kW_th</span>
          </div>
        </div>

        <!-- Target Floor Selector -->
        <div class="pt-2 border-t border-slate-800 flex items-center justify-between">
          <span class="text-slate-300">Active Build Floor:</span>
          <select 
            v-model="activeFloor" 
            class="bg-slate-950 text-sky-400 border border-slate-700 rounded-lg px-2.5 py-1 font-bold outline-none cursor-pointer"
            @change="focusFloor(activeFloor)"
          >
            <option value="ROOFTOP_DECK">Rooftop ORC</option>
            <option value="FLOOR_4">Floor 4 AI Suite</option>
            <option value="FLOOR_3">Floor 3 AI Suite</option>
            <option value="FLOOR_2">Floor 2 AI Suite</option>
            <option value="FLOOR_1">Floor 1 AI Suite</option>
            <option value="GROUND_EXTERNAL">Ground Utilities</option>
          </select>
        </div>
      </div>
    </div>

    <!-- PLACEMENT GHOST HUD (Center Top) -->
    <div 
      v-if="selectedAsset" 
      class="absolute top-6 left-1/2 -translate-x-1/2 z-20 px-5 py-2.5 bg-sky-500 text-slate-950 font-extrabold rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur"
    >
      <span class="w-2.5 h-2.5 rounded-full bg-slate-950 animate-ping"></span>
      <span>READY TO PLACE: {{ selectedAsset.name }}</span>
      <span class="text-[10px] bg-slate-950/20 px-2 py-0.5 rounded">1m Snap Grid Active</span>
      <button 
        class="ml-2 px-2.5 py-1 bg-slate-950 text-white rounded-xl text-xs font-bold transition hover:bg-slate-800 cursor-pointer"
        @click="selectedAsset = null"
      >
        ✕ Cancel
      </button>
    </div>

    <!-- THE SIMS-STYLE ASSET BUILDER DOCK (Bottom) -->
    <div class="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 max-w-4xl">
      <div class="bg-slate-900/95 backdrop-blur-md rounded-3xl border border-slate-700/80 shadow-2xl p-3 flex flex-col gap-2">
        <!-- Category Selector -->
        <div class="flex items-center gap-2 border-b border-slate-800 pb-2 px-2">
          <button 
            v-for="cat in categories" 
            :key="cat.id"
            class="px-3.5 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer"
            :class="activeCat === cat.id ? 'bg-sky-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'"
            @click="activeCat = cat.id"
          >
            <span>{{ cat.icon }}</span>
            <span>{{ cat.name }}</span>
          </button>
        </div>

        <!-- Catalog Cards -->
        <div class="flex items-center gap-3 overflow-x-auto p-1 max-w-3xl scrollbar-thin">
          <div 
            v-for="item in currentCategoryItems" 
            :key="item.type"
            class="flex-shrink-0 w-44 bg-slate-950/80 hover:bg-slate-800/90 border rounded-2xl p-3 flex flex-col gap-2 transition cursor-pointer group"
            :class="selectedAsset?.type === item.type 
              ? 'border-sky-400 shadow-lg shadow-sky-500/20 ring-2 ring-sky-400/30' 
              : 'border-slate-800 hover:border-slate-700'"
            @click="pickAsset(item)"
          >
            <div class="flex items-start justify-between">
              <span class="text-2xl p-1.5 rounded-xl bg-slate-900 border border-slate-800 group-hover:scale-110 transition">{{ item.icon }}</span>
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

    <!-- Navigation Help HUD (Bottom Left) -->
    <div class="absolute bottom-6 left-6 flex items-center gap-3 bg-slate-900/80 backdrop-blur-md px-4 py-2 rounded-xl border border-slate-800 text-xs font-mono text-slate-300 shadow-xl z-10">
      <span>ORBIT: LEFT-DRAG</span>
      <span class="text-slate-600">|</span>
      <span>PAN: RIGHT-DRAG</span>
      <span class="text-slate-600">|</span>
      <span>ZOOM: WHEEL</span>
      <button 
        class="ml-2 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-200 transition cursor-pointer"
        @click="resetCamera"
      >
        Reset Camera
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import gsap from 'gsap';
import { ThreeBuildingModel } from '@/services/threeBuildingModel';
import { ThreeEquipmentFactory } from '@/services/threeEquipmentFactory';

const studioCanvasMount = ref<HTMLDivElement | null>(null);


let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
let controls: OrbitControls;
let animationFrameId: number;
let raycaster: THREE.Raycaster;
let mouse: THREE.Vector2;

const buildingModel = new ThreeBuildingModel();
const activeFloor = ref<string>('FLOOR_1');
const selectedAsset = ref<any | null>(null);
const placedItems = ref<any[]>([]);

let ghostMesh: THREE.Group | null = null;
const ghostMaterial = new THREE.MeshBasicMaterial({
  color: 0x38bdf8,
  transparent: true,
  opacity: 0.65,
  wireframe: true
});

const activeCat = ref<'compute' | 'cooling' | 'orc'>('compute');
const categories = [
  { id: 'compute' as const, name: 'AI Compute', icon: '🖥️' },
  { id: 'cooling' as const, name: 'Cooling & Pumps', icon: '❄️' },
  { id: 'orc' as const, name: 'Rooftop ORC', icon: '⚡' }
];

const catalogItems = [
  { type: 'RACK_45KW', cat: 'compute', name: 'Standalone 42U AI Rack', icon: '🖥️', specs: '45 kW', desc: 'D2C Liquid Cooled Blade Rack', nodeType: 'AI_SERVER_STANDALONE', prefix: 'RACK' },
  { type: 'CDU_450KW', cat: 'cooling', name: 'In-Row CDU 450kW', icon: '🎛️', specs: '450 kW', desc: 'Dual Liquid-to-Liquid Loop', nodeType: 'COOLANT_DISTRIBUTION_UNIT', prefix: 'CDU' },
  { type: 'PUMP_CHW', cat: 'cooling', name: 'CHW Circulation Pump', icon: '⚙️', specs: '2,400 L/min', desc: 'VFD Primary Loop Motor', nodeType: 'CHILLED_WATER_PUMP', prefix: 'P-CHW' },
  { type: 'HEX_UTUBE', cat: 'orc', name: 'Inverted U-Tube HEX', icon: '🔁', specs: '1,850 kW', desc: 'Shell & Tube NH3 Evaporator', nodeType: 'INVERTED_4PRONG_UTUBE_HEX', prefix: 'HEX' },
  { type: 'TB_EXPANDER', cat: 'orc', name: 'Ammonia Expander Turbine', icon: '🌀', specs: '520 kW_e', desc: '12,000 RPM Radial Inflow', nodeType: 'AMMONIA_ORC_TURBINE', prefix: 'TB' },
  { type: 'CND_SPIRAL', cat: 'orc', name: '6-Arm Spiral Condenser', icon: '✳️', specs: '4,090 kW', desc: 'Radial Air-Cooled Matrix', nodeType: 'SPIRAL_CONDENSER_ARM', prefix: 'CND' }
];

const currentCategoryItems = computed(() => {
  return catalogItems.filter(item => item.cat === activeCat.value);
});

const totalStudioPower = computed(() => {
  return placedItems.value.length * 45;
});

onMounted(() => {
  if (!studioCanvasMount.value) return;

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0f172a);
  scene.fog = new THREE.FogExp2(0x0f172a, 0.008);

  const width = studioCanvasMount.value.clientWidth;
  const height = studioCanvasMount.value.clientHeight;

  camera = new THREE.PerspectiveCamera(45, width / height, 0.5, 500);
  camera.position.set(32, 24, 36);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.5;
  studioCanvasMount.value.appendChild(renderer.domElement);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.target.set(0, 8, 0);

  // Lighting
  const ambient = new THREE.AmbientLight(0xffffff, 1.5);
  scene.add(ambient);

  const hemi = new THREE.HemisphereLight(0xe0f2fe, 0x1e293b, 1.2);
  scene.add(hemi);

  const sun = new THREE.DirectionalLight(0xbae6fd, 2.6);
  sun.position.set(30, 60, 30);
  scene.add(sun);

  // Grid
  const grid = new THREE.GridHelper(120, 40, 0x0284c7, 0x334155);
  scene.add(grid);

  // Building Shell
  const building = buildingModel.build([]);
  scene.add(building);

  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();

  window.addEventListener('resize', onWindowResize);

  const animate = () => {
    animationFrameId = requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  };
  animate();
});

onUnmounted(() => {
  cancelAnimationFrame(animationFrameId);
  window.removeEventListener('resize', onWindowResize);
  renderer?.dispose();
});

function onWindowResize() {
  if (!studioCanvasMount.value || !camera || !renderer) return;
  camera.aspect = studioCanvasMount.value.clientWidth / studioCanvasMount.value.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(studioCanvasMount.value.clientWidth, studioCanvasMount.value.clientHeight);
}

function pickAsset(item: any) {
  if (selectedAsset.value?.type === item.type) {
    selectedAsset.value = null;
    if (ghostMesh) ghostMesh.visible = false;
  } else {
    selectedAsset.value = item;
  }
}

function onPointerMove(e: MouseEvent) {
  if (!studioCanvasMount.value || !selectedAsset.value) return;
  const rect = studioCanvasMount.value.getBoundingClientRect();
  mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const targetFloor = buildingModel.floors.get(activeFloor.value);
  if (!targetFloor) return;

  const hits = raycaster.intersectObject(targetFloor.plateMesh, false);
  if (hits.length > 0) {
    const pt = hits[0].point;
    const snapX = Math.round(pt.x);
    const snapZ = Math.round(pt.z);

    if (!ghostMesh) {
      ghostMesh = new THREE.Group();
      const geo = new THREE.BoxGeometry(1.2, 2.5, 1.2);
      const mesh = new THREE.Mesh(geo, ghostMaterial);
      ghostMesh.add(mesh);
      scene.add(ghostMesh);
    }
    ghostMesh.position.set(snapX, targetFloor.nominalY + 1.25, snapZ);
    ghostMesh.visible = true;
  } else if (ghostMesh) {
    ghostMesh.visible = false;
  }
}

function onPointerDown(e: MouseEvent) {
  if (!selectedAsset.value || !studioCanvasMount.value) return;
  const rect = studioCanvasMount.value.getBoundingClientRect();
  mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const targetFloor = buildingModel.floors.get(activeFloor.value);
  if (!targetFloor) return;

  const hits = raycaster.intersectObject(targetFloor.plateMesh, false);
  if (hits.length > 0) {
    const pt = hits[0].point;
    const snapX = Math.round(pt.x);
    const snapZ = Math.round(pt.z);

    const asset = selectedAsset.value;
    const newTag = `${asset.prefix}-${Date.now().toString().slice(-4)}`;

    let newMesh: THREE.Group | null = null;
    if (asset.nodeType === 'AI_SERVER_STANDALONE') newMesh = ThreeEquipmentFactory.createSingleServerRack(newTag);
    else if (asset.nodeType === 'COOLANT_DISTRIBUTION_UNIT') newMesh = ThreeEquipmentFactory.createCdu(newTag);
    else if (asset.nodeType === 'CHILLED_WATER_PUMP') newMesh = ThreeEquipmentFactory.createPump(newTag);
    else if (asset.nodeType === 'INVERTED_4PRONG_UTUBE_HEX') newMesh = ThreeEquipmentFactory.createHeatExchanger(newTag);
    else if (asset.nodeType === 'AMMONIA_ORC_TURBINE') newMesh = ThreeEquipmentFactory.createTurbineGenerator(newTag);
    else if (asset.nodeType === 'SPIRAL_CONDENSER_ARM') newMesh = ThreeEquipmentFactory.createSpiralCondenserArray(newTag);

    if (newMesh) {
      newMesh.position.set(snapX, 0.2, snapZ);
      newMesh.userData = { tag: newTag, name: asset.name, floor: activeFloor.value };
      targetFloor.group.add(newMesh);

      // Pop-in animation
      newMesh.scale.set(0.01, 0.01, 0.01);
      gsap.to(newMesh.scale, { x: 1, y: 1, z: 1, duration: 0.45, ease: 'back.out(2.0)' });

      placedItems.value.push({ tag: newTag, name: asset.name, floor: activeFloor.value, x: snapX, z: snapZ });
    }

    if (ghostMesh) ghostMesh.visible = false;
    selectedAsset.value = null;
  }
}

function focusFloor(floorId: string) {
  buildingModel.isolateFloor(floorId);
  const lvl = buildingModel.floors.get(floorId);
  if (lvl) {
    const targetY = lvl.nominalY + 2.0;
    gsap.to(controls.target, { x: 0, y: targetY, z: 0, duration: 1.0 });
    gsap.to(camera.position, { x: 24, y: targetY + 12, z: 26, duration: 1.0 });
  }
}

function resetCamera() {
  buildingModel.isolateFloor(null);
  gsap.to(camera.position, { x: 32, y: 24, z: 36, duration: 1.0 });
  gsap.to(controls.target, { x: 0, y: 8, z: 0, duration: 1.0 });
}
</script>
