<template>
  <div class="relative w-full h-full overflow-hidden bg-slate-950 select-none">
    <!-- 3D Canvas Mount Point -->
    <div 
      ref="canvasMount" 
      class="w-full h-full"
      :class="telemetryStore.selectedCatalogItem ? 'cursor-crosshair' : 'cursor-grab active:cursor-grabbing'"
      @pointermove="onPointerMove"
      @pointerdown="onPointerDown"
    ></div>

    <!-- 3D SELECTED EQUIPMENT QUICK ACTION GIZMO (Top Right HUD) -->

    <div 
      v-if="telemetryStore.selectedNode" 
      class="absolute top-6 right-6 w-80 bg-slate-900/90 backdrop-blur-md p-4 rounded-2xl border border-slate-700/80 shadow-2xl text-white font-mono text-xs z-10 animate-in fade-in duration-150"
    >
      <div class="flex items-start justify-between">
        <div>
          <span class="text-[10px] uppercase font-bold text-sky-400">Selected Asset (3D)</span>
          <h3 class="font-bold text-base text-emerald-400">{{ telemetryStore.selectedNode.tag }}</h3>
          <p class="text-[11px] text-slate-400 truncate">{{ telemetryStore.selectedNode.name }}</p>
        </div>
        <button 
          class="text-slate-400 hover:text-white text-xs p-1"
          @click="telemetryStore.selectNode(null)"
        >
          ✕
        </button>
      </div>

      <!-- Studio 3D Actions: Rotate & Delete -->
      <div class="mt-3 pt-3 border-t border-slate-800 flex items-center gap-2">
        <button 
          class="flex-1 py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
          @click="rotateSelectedNode"
          title="Rotate 45 degrees on floor"
        >
          <span>🔄</span>
          <span>Rotate 45°</span>
        </button>

        <button 
          class="py-1.5 px-3 bg-red-500/10 hover:bg-red-500/25 text-red-400 border border-red-500/30 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
          @click="deleteSelectedNode"
          title="Delete asset from Digital Twin"
        >
          <span>🗑️</span>
          <span>Delete</span>
        </button>
      </div>
    </div>

    <!-- THE SIMS-STYLE ASSET BUILDER PALETTE DOCK -->
    <StudioAssetPalette />

    <!-- 3D Camera & Viewport Info (Bottom Left) -->
    <div class="absolute bottom-6 left-6 flex items-center gap-3 bg-slate-900/80 backdrop-blur-md px-4 py-2 rounded-xl border border-slate-800 text-xs font-mono text-slate-300 shadow-xl z-10">
      <span class="inline-flex items-center gap-1.5">
        <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
        <span>WEBGL 3D DIGITAL TWIN STUDIO</span>
      </span>
      <span class="text-slate-600">|</span>
      <span>ORBIT: LEFT-DRAG</span>
      <span class="text-slate-600">|</span>
      <span>PAN: RIGHT-DRAG</span>
      <span class="text-slate-600">|</span>
      <span>ZOOM: WHEEL</span>
      <button 
        class="ml-2 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 rounded text-slate-200 transition cursor-pointer"
        @click="resetCamera"
      >
        Reset Camera
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import gsap from 'gsap';
import { useTelemetryStore } from '@/stores/telemetryStore';
import { ThreeBuildingModel } from '@/services/threeBuildingModel';
import { ThreeEquipmentFactory } from '@/services/threeEquipmentFactory';
import StudioAssetPalette from '@/components/StudioAssetPalette.vue';

const telemetryStore = useTelemetryStore();
const canvasMount = ref<HTMLDivElement | null>(null);

// 3D Scene Core
let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
let controls: OrbitControls;
let animationFrameId: number;
let raycaster: THREE.Raycaster;
let mouse: THREE.Vector2;

// Ghost Placement Mesh for The Sims-style Builder
let ghostMesh: THREE.Group | null = null;
const ghostMaterial = new THREE.MeshBasicMaterial({
  color: 0x38bdf8,
  transparent: true,
  opacity: 0.55,
  wireframe: true
});

const buildingModel = new ThreeBuildingModel();
const isExploded = ref(false);
const activeFloor = ref<string>('ALL');


onMounted(async () => {
  if (!canvasMount.value) return;

  // 1. Setup Three.js Scene & Camera with Bright Studio Lighting
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0f172a); // Modern studio slate background
  scene.fog = new THREE.FogExp2(0x0f172a, 0.008);

  const width = canvasMount.value.clientWidth;
  const height = canvasMount.value.clientHeight;

  camera = new THREE.PerspectiveCamera(45, width / height, 0.5, 500);
  camera.position.set(38, 28, 42);

  // 2. WebGL Renderer with High-Luminance Tonemapping
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.45;
  canvasMount.value.appendChild(renderer.domElement);

  // 3. Orbit Controls
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.maxPolarAngle = Math.PI / 2 + 0.05;
  controls.target.set(0, 12, 0);

  // 4. Multi-Source High-Illumination Studio Lighting Setup
  const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
  scene.add(ambientLight);

  const hemiLight = new THREE.HemisphereLight(0xe0f2fe, 0x1e293b, 1.2);
  hemiLight.position.set(0, 50, 0);
  scene.add(hemiLight);

  const sunLight = new THREE.DirectionalLight(0xbae6fd, 2.8);
  sunLight.position.set(40, 70, 35);
  scene.add(sunLight);

  const warmFillLight = new THREE.DirectionalLight(0xffedd5, 1.8);
  warmFillLight.position.set(-35, 30, -25);
  scene.add(warmFillLight);

  const rimLight = new THREE.DirectionalLight(0xa855f7, 1.2);
  rimLight.position.set(0, 40, -40);
  scene.add(rimLight);

  // Ground Plane Grid
  const groundGrid = new THREE.GridHelper(140, 40, 0x0284c7, 0x334155);
  groundGrid.position.y = -0.05;
  scene.add(groundGrid);

  // 5. Fetch Topology Nodes & Build Procedural Building
  let nodesData = [];
  try {
    const res = await fetch('http://localhost:3001/api/topology');
    if (res.ok) {
      const data = await res.json();
      nodesData = data.nodes || [];
    }
  } catch {
    nodesData = Object.keys(telemetryStore.nodes).map(tag => ({
      tag,
      name: telemetryStore.nodes[tag]?.name || tag,
      floor: (telemetryStore.nodes[tag] as any)?.floor || 'FLOOR_1',
      coordinates3D: { x: 50, z: 50 }
    }));
  }

  const building = buildingModel.build(nodesData);
  scene.add(building);

  // 6. Raycaster & Pointer Handlers
  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();

  window.addEventListener('resize', onWindowResize);

  // 7. Render Loop
  const clock = new THREE.Clock();
  const animate = () => {
    animationFrameId = requestAnimationFrame(animate);
    const elapsedTime = clock.getElapsedTime();

    const flowSpeed = (telemetryStore.simState.pumpSpeedRpm || 1750) / 1750;
    buildingModel.update(elapsedTime, flowSpeed);

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
  if (!canvasMount.value || !camera || !renderer) return;
  const width = canvasMount.value.clientWidth;
  const height = canvasMount.value.clientHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
}

// Raycasting Pointer Move for Ghost Placement
function onPointerMove(e: MouseEvent) {
  if (!canvasMount.value || !telemetryStore.selectedCatalogItem) return;
  const rect = canvasMount.value.getBoundingClientRect();
  mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const targetFloor = buildingModel.floors.get(telemetryStore.activeStudioFloor);
  if (!targetFloor) return;

  const hits = raycaster.intersectObject(targetFloor.plateMesh, false);
  if (hits.length > 0) {
    const point = hits[0].point;
    // 1-Meter Snap to Grid on Floor Plate
    const snapX = Math.round(point.x);
    const snapZ = Math.round(point.z);

    if (!ghostMesh) {
      ghostMesh = new THREE.Group();
      const boxGeo = new THREE.BoxGeometry(1.8, 2.4, 1.8);
      const boxMesh = new THREE.Mesh(boxGeo, ghostMaterial);
      ghostMesh.add(boxMesh);
      scene.add(ghostMesh);
    }
    ghostMesh.position.set(snapX, targetFloor.nominalY + 1.2, snapZ);
    ghostMesh.visible = true;
  } else if (ghostMesh) {
    ghostMesh.visible = false;
  }
}

// Pointer Down for Selection or Placing Asset
async function onPointerDown(e: MouseEvent) {
  if (!canvasMount.value) return;
  const rect = canvasMount.value.getBoundingClientRect();
  mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  // CASE 1: PLACING ASSET FROM CATALOG (The Sims-Style)
  if (telemetryStore.selectedCatalogItem) {
    const targetFloor = buildingModel.floors.get(telemetryStore.activeStudioFloor);
    if (!targetFloor) return;

    const hits = raycaster.intersectObject(targetFloor.plateMesh, false);
    if (hits.length > 0) {
      const point = hits[0].point;
      const snapX = Math.round(point.x);
      const snapZ = Math.round(point.z);

      const catalogItem = telemetryStore.selectedCatalogItem;
      const newTag = `${catalogItem.defaultTagPrefix}-${Date.now().toString().slice(-4)}`;

      // 1. Add to Pinia Store & MongoDB
      await telemetryStore.addNode({
        tag: newTag,
        name: `${catalogItem.name} #${newTag.slice(-4)}`,
        floorLabel: targetFloor.name,
        category: catalogItem.nodeType.toLowerCase(),
        metadata: {
          capacity: catalogItem.specs,
          model: catalogItem.name,
          addedInStudio: 'true'
        },
        coordinates3D: { x: (snapX + 8.0) / 0.18, y: 0, z: (snapZ + 4.0) / 0.18 }
      });

      // 2. Instantiate 3D Mesh in real-time
      let newMesh: THREE.Group | null = null;
      if (catalogItem.nodeType === 'INVERTED_4PRONG_UTUBE_HEX') newMesh = ThreeEquipmentFactory.createHeatExchanger(newTag);
      else if (catalogItem.nodeType === 'AMMONIA_ORC_TURBINE') newMesh = ThreeEquipmentFactory.createTurbineGenerator(newTag);
      else if (catalogItem.nodeType === 'SPIRAL_CONDENSER_ARM') newMesh = ThreeEquipmentFactory.createSpiralCondenserArray(newTag);
      else if (catalogItem.nodeType === 'COOLANT_DISTRIBUTION_UNIT') newMesh = ThreeEquipmentFactory.createCdu(newTag);
      else if (catalogItem.nodeType === 'AI_SERVER_CLUSTER') newMesh = ThreeEquipmentFactory.createServerRackCluster(newTag);
      else if (catalogItem.nodeType === 'CHILLED_WATER_PUMP') newMesh = ThreeEquipmentFactory.createPump(newTag);

      if (newMesh) {
        newMesh.position.set(snapX, 0.2, snapZ);
        newMesh.userData = { tag: newTag, name: catalogItem.name, floor: targetFloor.id };
        newMesh.traverse((child) => {
          if (child instanceof THREE.Mesh) child.userData = newMesh!.userData;
        });
        targetFloor.group.add(newMesh);

        // Success animation (pop in with scale)
        newMesh.scale.set(0.01, 0.01, 0.01);
        gsap.to(newMesh.scale, { x: 1, y: 1, z: 1, duration: 0.5, ease: 'back.out(2.0)' });
      }

      // Clear ghost mesh
      if (ghostMesh) {
        scene.remove(ghostMesh);
        ghostMesh = null;
      }
      telemetryStore.selectCatalogItem(null);
    }
    return;
  }

  // CASE 2: PICKING EQUIPMENT (Inspect / Edit)
  const intersects = raycaster.intersectObjects(buildingModel.rootGroup.children, true);
  if (intersects.length > 0) {
    for (const hit of intersects) {
      if (hit.object.userData?.tag) {
        telemetryStore.selectNode(hit.object.userData.tag);
        break;
      }
    }
  }
}

function rotateSelectedNode() {
  if (!telemetryStore.selectedNodeTag) return;
  const tag = telemetryStore.selectedNodeTag;
  
  // Find mesh in building
  buildingModel.rootGroup.traverse((obj) => {
    if (obj instanceof THREE.Group && obj.userData?.tag === tag) {
      gsap.to(obj.rotation, {
        y: obj.rotation.y + Math.PI / 4, // 45 deg rotation
        duration: 0.4,
        ease: 'power2.out'
      });
    }
  });
}

function deleteSelectedNode() {
  if (!telemetryStore.selectedNodeTag) return;
  const tag = telemetryStore.selectedNodeTag;

  // Remove mesh from 3D scene with shrink animation
  buildingModel.rootGroup.traverse((obj) => {
    if (obj instanceof THREE.Group && obj.userData?.tag === tag) {
      gsap.to(obj.scale, {
        x: 0.01,
        y: 0.01,
        z: 0.01,
        duration: 0.35,
        onComplete: () => {
          obj.parent?.remove(obj);
        }
      });
    }
  });

  telemetryStore.deleteNode(tag);
}

function selectFloor(floorId: string) {
  activeFloor.value = floorId;
  telemetryStore.activeStudioFloor = floorId === 'ALL' ? 'FLOOR_1' : floorId;

  if (floorId === 'ALL') {
    buildingModel.isolateFloor(null);
    gsap.to(controls.target, { x: 0, y: 12, z: 0, duration: 1.0 });
    gsap.to(camera.position, { x: 38, y: 28, z: 42, duration: 1.0 });
  } else {
    buildingModel.isolateFloor(floorId);
    const lvl = buildingModel.floors.get(floorId);
    if (lvl) {
      const targetY = lvl.nominalY + 2.5;
      gsap.to(controls.target, { x: 0, y: targetY, z: 0, duration: 1.0 });
      gsap.to(camera.position, { x: 26, y: targetY + 12, z: 28, duration: 1.0 });
    }
  }
}

function toggleExplode() {
  isExploded.value = !isExploded.value;
  buildingModel.setExplodedView(isExploded.value);
  if (isExploded.value) {
    gsap.to(camera.position, { x: 48, y: 36, z: 52, duration: 1.2 });
    gsap.to(controls.target, { x: 0, y: 18, z: 0, duration: 1.2 });
  }
}

function resetCamera() {
  activeFloor.value = 'ALL';
  isExploded.value = false;
  buildingModel.isolateFloor(null);
  buildingModel.setExplodedView(false);
  gsap.to(camera.position, { x: 38, y: 28, z: 42, duration: 1.2, ease: 'power2.inOut' });
  gsap.to(controls.target, { x: 0, y: 12, z: 0, duration: 1.2, ease: 'power2.inOut' });
}

function startCinematicTour() {
  const waypoints = [
    { cam: { x: 28, y: 6, z: 28 }, target: { x: 0, y: 2, z: 0 }, duration: 3.5 },
    { cam: { x: 24, y: 12, z: 24 }, target: { x: 0, y: 6.5, z: 0 }, duration: 3.5 },
    { cam: { x: 24, y: 22, z: 24 }, target: { x: 0, y: 16.0, z: 0 }, duration: 3.5 },
    { cam: { x: 18, y: 32, z: 20 }, target: { x: 0, y: 24.5, z: 0 }, duration: 4.0 },
    { cam: { x: 38, y: 28, z: 42 }, target: { x: 0, y: 12.0, z: 0 }, duration: 3.0 }
  ];

  const tl = gsap.timeline();
  for (const wp of waypoints) {
    tl.to(camera.position, { ...wp.cam, duration: wp.duration, ease: 'power1.inOut' }, '+=0.2');
    tl.to(controls.target, { ...wp.target, duration: wp.duration, ease: 'power1.inOut' }, '<');
  }
}

defineExpose({
  toggleExplode,
  startCinematicTour,
  selectFloor,
  isExploded
});
</script>

