import * as THREE from 'three';
import { createFluidFlowMaterial } from './threePipeShaders';

/**
 * 3D Equipment Factory: Generates high-fidelity parametric engineering meshes
 * for ISA-5.1 equipment and mechanical assemblies.
 */
export class ThreeEquipmentFactory {
  // Shared materials for performance optimization
  private static metalDark = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.85, roughness: 0.25 });
  private static metalSteel = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.9, roughness: 0.2 });
  private static copperOrange = new THREE.MeshStandardMaterial({ color: 0xea580c, metalness: 0.7, roughness: 0.3 });
  private static cyanGlow = new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 0.4 });
  private static purpleGlow = new THREE.MeshStandardMaterial({ color: 0xa855f7, emissive: 0x7e22ce, emissiveIntensity: 0.5 });
  private static emeraldGlow = new THREE.MeshStandardMaterial({ color: 0x10b981, emissive: 0x059669, emissiveIntensity: 0.4 });

  /**
   * 1. Inverted 4-Prong U-Tube Shell & Tube Evaporator (HEX-R01)
   */
  static createHeatExchanger(tag = 'HEX-R01'): THREE.Group {
    const group = new THREE.Group();
    group.name = tag;

    // Outer Cylindrical Shell
    const shellGeo = new THREE.CylinderGeometry(1.6, 1.6, 4.2, 32);
    const shellMat = new THREE.MeshPhysicalMaterial({
      color: 0x334155,
      metalness: 0.85,
      roughness: 0.15,
      transmission: 0.5,
      opacity: 0.85,
      transparent: true
    });
    const shell = new THREE.Mesh(shellGeo, shellMat);
    shell.rotation.z = Math.PI / 2;
    group.add(shell);

    // 4 Inverted U-Tubes (Heat Transfer bundle)
    for (let i = -1.2; i <= 1.2; i += 0.8) {
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(i, -1.0, -0.6),
        new THREE.Vector3(i, 1.1, -0.6),
        new THREE.Vector3(i, 1.1, 0.6),
        new THREE.Vector3(i, -1.0, 0.6)
      ]);
      const tubeGeo = new THREE.TubeGeometry(curve, 32, 0.12, 12, false);
      const tubeMat = this.copperOrange;
      const tubeMesh = new THREE.Mesh(tubeGeo, tubeMat);
      group.add(tubeMesh);
    }

    // Flanged Inlet/Outlet Nozzles
    const nozzleGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.8, 16);
    const nozzleHotIn = new THREE.Mesh(nozzleGeo, this.metalSteel);
    nozzleHotIn.position.set(-1.6, 1.8, 0);
    group.add(nozzleHotIn);

    const nozzleChwOut = new THREE.Mesh(nozzleGeo, this.metalSteel);
    nozzleChwOut.position.set(1.6, -1.8, 0);
    group.add(nozzleChwOut);

    return group;
  }

  /**
   * 2. Ammonia Expander Turbine & Generator Assembly (TB-R01, GEN-R01)
   */
  static createTurbineGenerator(tag = 'TB-R01'): THREE.Group {
    const group = new THREE.Group();
    group.name = tag;

    // Spiral Volute Casing (Radial Inflow Expander)
    const torusGeo = new THREE.TorusGeometry(1.2, 0.45, 16, 32);
    const volute = new THREE.Mesh(torusGeo, this.purpleGlow);
    volute.rotation.x = Math.PI / 2;
    group.add(volute);

    // Center Rotor Core
    const rotorGeo = new THREE.CylinderGeometry(0.65, 0.65, 0.9, 24);
    const rotor = new THREE.Mesh(rotorGeo, this.metalSteel);
    group.add(rotor);

    // Kinetic Driveshaft
    const shaftGeo = new THREE.CylinderGeometry(0.18, 0.18, 2.2, 16);
    const shaft = new THREE.Mesh(shaftGeo, this.metalDark);
    shaft.position.x = 1.6;
    shaft.rotation.z = Math.PI / 2;
    group.add(shaft);

    // Synchronous Generator (GEN-R01)
    const genGeo = new THREE.BoxGeometry(1.8, 1.8, 1.8);
    const genMesh = new THREE.Mesh(genGeo, this.metalDark);
    genMesh.position.x = 3.0;
    group.add(genMesh);

    const genCapGeo = new THREE.CylinderGeometry(0.7, 0.7, 1.85, 24);
    const genCap = new THREE.Mesh(genCapGeo, this.metalSteel);
    genCap.position.x = 3.0;
    genCap.rotation.z = Math.PI / 2;
    group.add(genCap);

    return group;
  }

  /**
   * 3. 6-Arm Spiral Condenser Radial Array (CND-R01..06)
   */
  static createSpiralCondenserArray(tag = 'CND-ARRAY'): THREE.Group {
    const group = new THREE.Group();
    group.name = tag;

    // Central Condenser Hub
    const hubGeo = new THREE.CylinderGeometry(1.0, 1.0, 0.8, 24);
    const hub = new THREE.Mesh(hubGeo, this.metalDark);
    group.add(hub);

    // 6 Radial Cooling Spiral Arms
    const armCount = 6;
    const radius = 3.8;
    for (let a = 0; a < armCount; a++) {
      const angle = (a / armCount) * Math.PI * 2;
      const armGroup = new THREE.Group();
      armGroup.rotation.y = angle;

      // Spiral Arm Fin Structure
      const finGeo = new THREE.BoxGeometry(radius, 0.25, 0.6);
      const finMesh = new THREE.Mesh(finGeo, this.cyanGlow);
      finMesh.position.x = radius / 2;
      armGroup.add(finMesh);

      // Top Exhaust Fan
      const fanGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.2, 16);
      const fanMesh = new THREE.Mesh(fanGeo, this.metalSteel);
      fanMesh.position.set(radius * 0.85, 0.3, 0);
      armGroup.add(fanMesh);

      group.add(armGroup);
    }

    return group;
  }

  /**
   * 4. In-Row Coolant Distribution Unit (CDU-101..401)
   */
  static createCdu(tag: string): THREE.Group {
    const group = new THREE.Group();
    group.name = tag;

    // CDU Server Rack Enclosure
    const bodyGeo = new THREE.BoxGeometry(1.2, 3.2, 1.8);
    const body = new THREE.Mesh(bodyGeo, this.metalDark);
    body.position.y = 1.6;
    group.add(body);

    // Front Glass Status Panel
    const panelGeo = new THREE.PlaneGeometry(0.9, 2.4);
    const panel = new THREE.Mesh(panelGeo, this.cyanGlow);
    panel.position.set(0, 1.6, 0.91);
    group.add(panel);

    // Primary & Secondary Heat Exchanger Plate Block
    const hexPlateGeo = new THREE.BoxGeometry(0.8, 0.8, 0.8);
    const hexPlate = new THREE.Mesh(hexPlateGeo, this.copperOrange);
    hexPlate.position.set(0, 0.9, 0);
    group.add(hexPlate);

    return group;
  }

  /**
   * 5. Standalone 42U AI Server Rack (45 kW D2C Liquid Cooled)
   */
  static createSingleServerRack(tag = 'RACK-01'): THREE.Group {
    const group = new THREE.Group();
    group.name = tag;

    const rackWidth = 0.95;
    const rackHeight = 3.0;
    const rackDepth = 1.3;

    // 42U Steel Chassis
    const rackGeo = new THREE.BoxGeometry(rackWidth, rackHeight, rackDepth);
    const rackMesh = new THREE.Mesh(rackGeo, this.metalDark);
    rackMesh.position.y = rackHeight / 2;
    group.add(rackMesh);

    // Front Mesh Status Glow
    const frontGeo = new THREE.PlaneGeometry(0.8, 2.6);
    const frontMesh = new THREE.Mesh(frontGeo, this.cyanGlow);
    frontMesh.position.set(0, rackHeight / 2, rackDepth / 2 + 0.01);
    group.add(frontMesh);

    // Compute Blade Status LEDs
    for (let s = 0.6; s <= 2.6; s += 0.45) {
      const bladeGeo = new THREE.PlaneGeometry(0.7, 0.06);
      const bladeGlow = new THREE.Mesh(bladeGeo, this.emeraldGlow);
      bladeGlow.position.set(0, s, rackDepth / 2 + 0.02);
      group.add(bladeGlow);
    }

    return group;
  }

  /**
   * 6. High-Density AI Server Rack Cluster with Direct-to-Chip (D2C) Manifold (RACK-101..401)
   */
  static createServerRackCluster(tag: string): THREE.Group {
    const group = new THREE.Group();
    group.name = tag;

    const rackCount = 3;
    for (let r = 0; r < rackCount; r++) {
      const rack = this.createSingleServerRack(`${tag}-R${r + 1}`);
      rack.position.x = (r - 1) * 1.15;
      group.add(rack);
    }

    return group;
  }


  /**
   * 6. Central CHW Circulation Pump (P-CHW-01A)
   */
  static createPump(tag = 'P-CHW-01A'): THREE.Group {
    const group = new THREE.Group();
    group.name = tag;

    // Volute casing
    const voluteGeo = new THREE.CylinderGeometry(0.9, 0.9, 0.6, 24);
    const volute = new THREE.Mesh(voluteGeo, this.metalSteel);
    volute.rotation.z = Math.PI / 2;
    volute.position.y = 0.9;
    group.add(volute);

    // VFD Electric Motor
    const motorGeo = new THREE.CylinderGeometry(0.65, 0.65, 1.4, 20);
    const motor = new THREE.Mesh(motorGeo, this.metalDark);
    motor.position.set(1.1, 0.9, 0);
    motor.rotation.z = Math.PI / 2;
    group.add(motor);

    // Baseplate
    const baseGeo = new THREE.BoxGeometry(2.6, 0.25, 1.4);
    const base = new THREE.Mesh(baseGeo, this.metalDark);
    base.position.y = 0.125;
    group.add(base);

    return group;
  }

  /**
   * 7. Central Dual Vertical Risers (DN250 Supply & Hot Return)
   */
  static createCentralRisers(height = 24.0): { group: THREE.Group; supplyMat: THREE.Material; returnMat: THREE.Material } {
    const group = new THREE.Group();
    group.name = 'CENTRAL_RISERS_DN250';

    const pipeRadius = 0.28; // DN250 Scale
    const riserGeo = new THREE.CylinderGeometry(pipeRadius, pipeRadius, height, 24);

    // Chilled Supply Riser (CHW @ 28°C)
    const supplyMat = createFluidFlowMaterial('#38bdf8', 1.2);
    const supplyRiser = new THREE.Mesh(riserGeo, supplyMat);
    supplyRiser.position.set(-0.8, height / 2, 0);
    group.add(supplyRiser);

    // Hot Return Riser (Hot Return @ 62°C)
    const returnMat = createFluidFlowMaterial('#f97316', 1.4);
    const returnRiser = new THREE.Mesh(riserGeo, returnMat);
    returnRiser.position.set(0.8, height / 2, 0);
    group.add(returnRiser);

    return { group, supplyMat, returnMat };
  }
}
