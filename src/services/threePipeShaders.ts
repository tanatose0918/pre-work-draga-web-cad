import * as THREE from 'three';

/**
 * Custom GLSL Shader Material for Pulsating Directional Fluid Flow
 * Animates fluid stream particles along piping runs with speed tied to pump RPM / flow rate.
 */
export function createFluidFlowMaterial(baseColor: string, flowSpeed = 1.0) {
  const color = new THREE.Color(baseColor);
  
  const vertexShader = `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition;

    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      vPosition = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  const fragmentShader = `
    uniform vec3 uColor;
    uniform float uTime;
    uniform float uFlowSpeed;
    varying vec2 vUv;
    varying vec3 vNormal;

    void main() {
      // Animated directional chevron / pulse waves along the pipe length (U axis)
      float wave = sin((vUv.x * 24.0 - uTime * uFlowSpeed * 6.0));
      float pulse = smoothstep(0.2, 0.9, wave);

      // Radial rim / fresnel glow for sleek digital twin aesthetic
      float rim = 1.0 - max(dot(vNormal, vec3(0.0, 0.0, 1.0)), 0.0);
      rim = pow(rim, 2.0) * 0.45;

      vec3 finalColor = mix(uColor * 0.75, uColor * 1.35 + vec3(0.2), pulse);
      finalColor += vec3(rim) * uColor;

      gl_FragColor = vec4(finalColor, 0.92);
    }
  `;

  return new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: color },
      uTime: { value: 0 },
      uFlowSpeed: { value: flowSpeed }
    },
    vertexShader,
    fragmentShader,
    transparent: true,
    side: THREE.DoubleSide
  });
}

/**
 * Thermal Heatmap Material that shifts color from Chilled (28°C Blue) to Hot (62°C Red/Orange)
 */
export function createThermalHeatmapMaterial(tempC = 28.0) {
  const material = new THREE.MeshStandardMaterial({
    roughness: 0.25,
    metalness: 0.65,
    transparent: true,
    opacity: 0.92
  });

  updateThermalColor(material, tempC);
  return material;
}

export function updateThermalColor(material: THREE.MeshStandardMaterial, tempC: number) {
  // Normalize temp between 25°C (cool blue) and 65°C (hot red)
  const norm = Math.max(0.0, Math.min(1.0, (tempC - 25.0) / 40.0));
  
  const coolColor = new THREE.Color(0x0284c7); // 25°C Blue
  const warmColor = new THREE.Color(0xf59e0b); // 45°C Amber
  const hotColor = new THREE.Color(0xef4444);  // 65°C Red
  
  if (norm < 0.5) {
    material.color.copy(coolColor).lerp(warmColor, norm * 2.0);
    material.emissive.copy(material.color).multiplyScalar(0.15);
  } else {
    material.color.copy(warmColor).lerp(hotColor, (norm - 0.5) * 2.0);
    material.emissive.copy(material.color).multiplyScalar(0.25);
  }
}
