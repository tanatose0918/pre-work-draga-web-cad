import * as THREE from 'three';
import gsap from 'gsap';
import { ThreeEquipmentFactory } from './threeEquipmentFactory';

export interface FloorLevel {
  id: string;
  name: string;
  nominalY: number;
  currentY: number;
  group: THREE.Group;
  plateMesh: THREE.Mesh;
}

export class ThreeBuildingModel {
  rootGroup = new THREE.Group();
  floors: Map<string, FloorLevel> = new Map();
  centralRisersGroup?: THREE.Group;
  materialsToAnimate: any[] = [];

  private buildingWidth = 36.0;
  private buildingDepth = 24.0;
  private floorHeight = 4.5;
  public isExploded = false;
  private activeIsolatedFloor: string | null = null;

  constructor() {
    this.rootGroup.name = 'DRAGA_AI_BUILDING_MODEL';
  }

  /**
   * Build complete 5-Rai Site + 4-Story Building + Rooftop + Ground architecture
   */
  build(nodesData: any[]): THREE.Group {
    this.rootGroup.clear();
    this.floors.clear();
    this.materialsToAnimate = [];

    // 0. Build 5-Rai (80m x 100m = 8,000 m2) Site Foundation Pad
    const siteGeo = new THREE.BoxGeometry(80.0, 0.4, 100.0);
    const siteMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.2,
      roughness: 0.8
    });
    const siteMesh = new THREE.Mesh(siteGeo, siteMat);
    siteMesh.position.y = -0.4;
    this.rootGroup.add(siteMesh);

    // Site Perimeter Boundary Line (Green dashed marker)
    const siteGrid = new THREE.GridHelper(100, 20, 0x10b981, 0x334155);
    siteGrid.position.y = -0.15;
    this.rootGroup.add(siteGrid);

    // 3D Directional Floating Boundary Markers
    this.createDirectionalMarkers();

    // 1. Central Vertical Risers
    const totalHeight = this.floorHeight * 5 + 3.0;
    const risers = ThreeEquipmentFactory.createCentralRisers(totalHeight);
    risers.group.position.set(0, 0, 0);
    this.centralRisersGroup = risers.group;
    this.rootGroup.add(risers.group);
    this.materialsToAnimate.push(risers.supplyMat, risers.returnMat);

    // 2. Build Floor Levels
    const levelConfigs = [
      { id: 'GROUND_EXTERNAL', name: 'Ground Floor & WTP Basin', floorIndex: 0 },
      { id: 'FLOOR_1', name: 'Floor 1: AI Cluster 1 (450kW)', floorIndex: 1 },
      { id: 'FLOOR_2', name: 'Floor 2: AI Cluster 2 (450kW)', floorIndex: 2 },
      { id: 'FLOOR_3', name: 'Floor 3: AI Cluster 3 (450kW)', floorIndex: 3 },
      { id: 'FLOOR_4', name: 'Floor 4: AI Cluster 4 (450kW)', floorIndex: 4 },
      { id: 'ROOFTOP_DECK', name: 'Rooftop: Ammonia ORC Nucleus', floorIndex: 5 }
    ];


    for (const lvl of levelConfigs) {
      const nominalY = lvl.floorIndex * this.floorHeight;
      const floorGroup = new THREE.Group();
      floorGroup.name = `LEVEL_${lvl.id}`;
      floorGroup.position.y = nominalY;

      // Floor Slab (Plate) - Clean architectural slate
      const slabGeo = new THREE.BoxGeometry(this.buildingWidth, 0.35, this.buildingDepth);
      const slabMat = new THREE.MeshStandardMaterial({
        color: lvl.floorIndex === 5 ? 0x1e293b : 0x334155,
        metalness: 0.3,
        roughness: 0.4,
        transparent: true,
        opacity: 0.92
      });
      const slabMesh = new THREE.Mesh(slabGeo, slabMat);
      slabMesh.position.y = -0.175;
      floorGroup.add(slabMesh);

      // Floor Grid Overlay (Crisp sky-blue engineering grid)
      const gridHelper = new THREE.GridHelper(this.buildingWidth, 16, 0x38bdf8, 0x64748b);
      gridHelper.position.y = 0.01;
      (gridHelper.material as THREE.Material).transparent = true;
      (gridHelper.material as THREE.Material).opacity = 0.45;
      floorGroup.add(gridHelper);

      // Semi-transparent Architectural Glass Wall Shell (High-transparency crystal blue glass)
      const wallGeo = new THREE.BoxGeometry(this.buildingWidth + 0.2, this.floorHeight - 0.35, this.buildingDepth + 0.2);
      const wallMat = new THREE.MeshPhysicalMaterial({
        color: 0x7dd3fc,
        metalness: 0.05,
        roughness: 0.05,
        transmission: 0.92,
        opacity: 0.15,
        transparent: true,
        depthWrite: false
      });
      const wallMesh = new THREE.Mesh(wallGeo, wallMat);
      wallMesh.position.y = (this.floorHeight - 0.35) / 2;
      floorGroup.add(wallMesh);


      // Floor Structural Columns
      const colGeo = new THREE.BoxGeometry(0.5, this.floorHeight, 0.5);
      const colMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8, roughness: 0.3 });
      const corners = [
        [-this.buildingWidth / 2 + 0.5, -this.buildingDepth / 2 + 0.5],
        [this.buildingWidth / 2 - 0.5, -this.buildingDepth / 2 + 0.5],
        [-this.buildingWidth / 2 + 0.5, this.buildingDepth / 2 - 0.5],
        [this.buildingWidth / 2 - 0.5, this.buildingDepth / 2 - 0.5]
      ];
      for (const [cx, cz] of corners) {
        const col = new THREE.Mesh(colGeo, colMat);
        col.position.set(cx, this.floorHeight / 2, cz);
        floorGroup.add(col);
      }

      this.floors.set(lvl.id, {
        id: lvl.id,
        name: lvl.name,
        nominalY,
        currentY: nominalY,
        group: floorGroup,
        plateMesh: slabMesh
      });

      this.rootGroup.add(floorGroup);
    }

    // 3. Populate Equipment from MongoDB Topology Nodes
    this.populateEquipmentNodes(nodesData);

    return this.rootGroup;
  }

  /**
   * Instantiate 3D Equipment Meshes onto corresponding floor groups with exact 3D spatial layout
   */
  private populateEquipmentNodes(nodesData: any[]) {
    // 1. If nodes are passed, index them for quick reference
    const customNodes = new Set(nodesData.map((n: any) => n.tag));

    // 2. Build Floor 1 to 4 Standard High-Density Suites
    for (const floorId of ['FLOOR_1', 'FLOOR_2', 'FLOOR_3', 'FLOOR_4']) {
      const floorLevel = this.floors.get(floorId);
      if (!floorLevel) continue;
      const fNum = floorId.slice(-1);

      // A. Place 10 Standalone Server Racks (2 rows of 5 on Front Half)
      for (let r = 1; r <= 10; r++) {
        const rackTag = `RACK-${fNum}${r < 10 ? '0' + r : r}`;
        const rackMesh = ThreeEquipmentFactory.createSingleServerRack(rackTag);
        
        const col = (r - 1) % 5;
        const row = Math.floor((r - 1) / 5);
        const posX = -6.0 + col * 3.0; // -6, -3, 0, 3, 6
        const posZ = row === 0 ? 2.4 : 5.2; // Front zone

        rackMesh.position.set(posX, 0.2, posZ);
        rackMesh.userData = { tag: rackTag, name: `AI Rack #${fNum}-${r}`, floor: floorId };
        rackMesh.traverse((child) => {
          if (child instanceof THREE.Mesh) child.userData = rackMesh.userData;
        });
        floorLevel.group.add(rackMesh);
      }

      // B. Place In-Row CDU in Rear Zone
      const cduTag = `CDU-${fNum}01`;
      const cduMesh = ThreeEquipmentFactory.createCdu(cduTag);
      cduMesh.position.set(-4.0, 0.2, -3.5);
      cduMesh.userData = { tag: cduTag, name: `Coolant Distribution Unit (${floorId})`, floor: floorId };
      cduMesh.traverse((child) => {
        if (child instanceof THREE.Mesh) child.userData = cduMesh.userData;
      });
      floorLevel.group.add(cduMesh);

      // C. Floor Piping Branch (CDU -> Central Risers & Racks)
      const branchGeo = new THREE.CylinderGeometry(0.1, 0.1, 4.0, 12);
      const branchMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.8, roughness: 0.3 });
      const branchMesh = new THREE.Mesh(branchGeo, branchMat);
      branchMesh.rotation.z = Math.PI / 2;
      branchMesh.position.set(-2.0, 0.3, -3.5);
      floorLevel.group.add(branchMesh);
    }

    // 3. Build Rooftop ORC Power Plant Nucleus
    const roofLevel = this.floors.get('ROOFTOP_DECK');
    if (roofLevel) {
      // HEX-R01 (Evaporator)
      const hexMesh = ThreeEquipmentFactory.createHeatExchanger('HEX-R01');
      hexMesh.position.set(-6.0, 0.8, 0.0);
      hexMesh.userData = { tag: 'HEX-R01', name: 'Inverted U-Tube HEX (1,850 kW)', floor: 'ROOFTOP_DECK' };
      hexMesh.traverse((child) => { if (child instanceof THREE.Mesh) child.userData = hexMesh.userData; });
      roofLevel.group.add(hexMesh);

      // TB-R01 + GEN-R01 (Expander & Generator)
      const tbMesh = ThreeEquipmentFactory.createTurbineGenerator('TB-R01');
      tbMesh.position.set(0.0, 0.8, 0.0);
      tbMesh.userData = { tag: 'TB-R01', name: 'Ammonia Radial Expander (524 kW)', floor: 'ROOFTOP_DECK' };
      tbMesh.traverse((child) => { if (child instanceof THREE.Mesh) child.userData = tbMesh.userData; });
      roofLevel.group.add(tbMesh);

      // CND-R01 Array (6-Arm Spiral Condensers)
      const cndMesh = ThreeEquipmentFactory.createSpiralCondenserArray('CND-R01');
      cndMesh.position.set(6.5, 0.8, 0.0);
      cndMesh.userData = { tag: 'CND-R01', name: '6-Arm Spiral Condenser Array (4,090 kW)', floor: 'ROOFTOP_DECK' };
      cndMesh.traverse((child) => { if (child instanceof THREE.Mesh) child.userData = cndMesh.userData; });
      roofLevel.group.add(cndMesh);
    }

    // 4. Build Ground Level Water Treatment & Primary Pump
    const groundLevel = this.floors.get('GROUND_EXTERNAL');
    if (groundLevel) {
      const pumpMesh = ThreeEquipmentFactory.createPump('P-101');
      pumpMesh.position.set(-3.0, 0.2, 0.0);
      pumpMesh.userData = { tag: 'P-101', name: 'Primary CHW Pump (2,400 L/min)', floor: 'GROUND_EXTERNAL' };
      pumpMesh.traverse((child) => { if (child instanceof THREE.Mesh) child.userData = pumpMesh.userData; });
      groundLevel.group.add(pumpMesh);
    }

    // 5. Add custom studio nodes created at runtime
    for (const node of nodesData) {
      if (customNodes.has(node.tag) && node.addedInStudio) {
        const floorLevel = this.floors.get(node.floor);
        if (!floorLevel) continue;
        const posX = (node.coordinates3D?.x ?? 0) * 0.18 - 8.0;
        const posZ = (node.coordinates3D?.z ?? 0) * 0.18 - 4.0;
        const cMesh = ThreeEquipmentFactory.createSingleServerRack(node.tag);
        cMesh.position.set(posX, 0.2, posZ);
        cMesh.userData = { tag: node.tag, name: node.name, floor: node.floor };
        floorLevel.group.add(cMesh);
      }
    }
  }


  /**
   * Exploded View: Expand floor levels vertically with GSAP animation
   */
  setExplodedView(enable: boolean) {
    this.isExploded = enable;
    const spacingFactor = enable ? 2.2 : 1.0;

    let index = 0;
    this.floors.forEach((lvl) => {
      const targetY = index * this.floorHeight * spacingFactor;
      lvl.currentY = targetY;

      gsap.to(lvl.group.position, {
        y: targetY,
        duration: 1.2,
        ease: 'power2.out'
      });

      // Restore full visibility when exploding
      gsap.to(lvl.group.scale, { x: 1, y: 1, z: 1, duration: 0.6 });
      lvl.group.visible = true;

      index++;
    });

    if (this.centralRisersGroup) {
      gsap.to(this.centralRisersGroup.scale, {
        y: enable ? spacingFactor : 1.0,
        duration: 1.2,
        ease: 'power2.out'
      });
    }
  }

  /**
   * Floor Isolation Mode: Focus on a specific floor and dim/hide others
   */
  isolateFloor(floorId: string | null) {
    this.activeIsolatedFloor = floorId;

    this.floors.forEach((lvl) => {
      if (!floorId || lvl.id === floorId) {
        lvl.group.visible = true;
        gsap.to(lvl.group.scale, { x: 1, y: 1, z: 1, duration: 0.6, ease: 'back.out(1.4)' });
        lvl.plateMesh.material = new THREE.MeshStandardMaterial({
          color: 0x0284c7,
          metalness: 0.6,
          roughness: 0.3
        });
      } else {
        gsap.to(lvl.group.scale, {
          x: 0.05,
          y: 0.05,
          z: 0.05,
          duration: 0.5,
          onComplete: () => {
            if (this.activeIsolatedFloor === floorId) {
              lvl.group.visible = false;
            }
          }
        });
      }
    });

    if (this.centralRisersGroup) {
      this.centralRisersGroup.visible = !floorId;
    }
  }

  /**
   * Animation update tick for custom shaders
   */
  update(time: number, flowSpeed = 1.0) {
    for (const mat of this.materialsToAnimate) {
      if (mat?.uniforms?.uTime) {
        mat.uniforms.uTime.value = time;
        mat.uniforms.uFlowSpeed.value = flowSpeed;
      }
    }
  }

  /**
   * 3D Directional Floating Boundary Markers on the 5-Rai Site
   */
  private createDirectionalMarkers() {

    const markerConfigs = [
      { text: 'SOUTH / FRONT (ด้านหน้า)', pos: [0, 0.2, 46], color: 0x38bdf8, size: [18, 0.2, 3] },
      { text: 'NORTH / BACK (ด้านหลัง)', pos: [0, 0.2, -46], color: 0xf97316, size: [18, 0.2, 3] },
      { text: 'WEST / LEFT (ด้านซ้าย)', pos: [-36, 0.2, 0], color: 0x10b981, size: [3, 0.2, 18] },
      { text: 'EAST / RIGHT (ด้านขวา)', pos: [36, 0.2, 0], color: 0xa855f7, size: [3, 0.2, 18] }
    ];

    for (const m of markerConfigs) {
      const geo = new THREE.BoxGeometry(m.size[0], m.size[1], m.size[2]);
      const mat = new THREE.MeshStandardMaterial({
        color: m.color,
        emissive: m.color,
        emissiveIntensity: 0.35,
        roughness: 0.3
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(m.pos[0], m.pos[1], m.pos[2]);
      this.rootGroup.add(mesh);
    }
  }
}

