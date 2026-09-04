<template>
  <div 
    class="canvas-container relative w-full h-full overflow-hidden bg-slate-950 select-none font-mono"
    @mousedown="startPan"
    @mousemove="onPan"
    @mouseup="endPan"
    @mouseleave="endPan"
    @wheel.prevent="onZoom"
  >
    <!-- TOP ORIENTATION & 5-RAI RATIO HUD (Top Floating Ribbon) -->
    <div class="absolute top-4 left-4 z-20 flex items-center gap-3 bg-slate-900/90 backdrop-blur-md px-4 py-2 rounded-2xl border border-slate-700/80 shadow-2xl text-xs">
      <div class="flex items-center gap-2">
        <span class="text-base">🧭</span>
        <div class="flex flex-col">
          <span class="font-bold text-sky-300 uppercase tracking-wider text-[11px]">
            {{ telemetryStore.cadViewAngle === 'TOP' ? 'TOP (PLAN VIEW) • SOUTH=FRONT' :
               telemetryStore.cadViewAngle === 'SIDE' ? 'SIDE SECTION • LEFT=FRONT | RIGHT=BACK' :
               telemetryStore.cadViewAngle === 'FRONT' ? 'FRONT ELEVATION • COMPUTE FACADE' :
               'BACK ELEVATION • COOLING INFRASTRUCTURE' }}
          </span>
          <span class="text-[10px] text-slate-400">
            Site: 5 Rai (8,000 m²) | Building Footprint: 36m × 24m (864 m² • BCR: 10.8%)
          </span>
        </div>
      </div>

      <div class="h-6 w-px bg-slate-800"></div>

      <!-- Quick 5-Rai Masterplan Toggle -->
      <button 
        class="px-2.5 py-1 rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
        :class="showSiteMasterplan ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'"
        @click="showSiteMasterplan = !showSiteMasterplan"
      >
        <span>🗺️</span>
        <span>{{ showSiteMasterplan ? 'HIDE 5-RAI SITE' : 'SHOW 5-RAI SITE' }}</span>
      </button>
    </div>

    <!-- SVG Viewport (1920x1080 Coordinate Space) -->
    <svg
      ref="svgRef"
      viewBox="0 0 1920 1080"
      class="w-full h-full select-none"
      :class="isPanning ? 'cursor-grabbing' : 'cursor-grab'"
    >
      <defs>
        <!-- Gradients -->
        <linearGradient id="chw-gradient" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stop-color="#0284C7" />
          <stop offset="100%" stop-color="#38BDF8" />
        </linearGradient>

        <linearGradient id="hot-return-gradient" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stop-color="#DC2626" />
          <stop offset="100%" stop-color="#F97316" />
        </linearGradient>

        <pattern id="cad-subgrid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1E293B" stroke-width="0.75" stroke-opacity="0.4" />
        </pattern>
        <pattern id="cad-majorgrid" width="100" height="100" patternUnits="userSpaceOnUse">
          <rect width="100" height="100" fill="url(#cad-subgrid)" />
          <path d="M 100 0 L 0 0 0 100" fill="none" stroke="#334155" stroke-width="1.2" stroke-opacity="0.6" />
        </pattern>
      </defs>

      <!-- PAN & ZOOM TRANSFORM ROOT -->
      <g :transform="`translate(${panX}, ${panY}) scale(${zoomScale})`">
        <!-- BACKGROUND ARCHITECTURAL GRID -->
        <rect x="0" y="0" width="1920" height="1080" fill="#0B0F19" />
        <rect 
          v-if="telemetryStore.layers.grid" 
          x="0" 
          y="0" 
          width="1920" 
          height="1080" 
          fill="url(#cad-majorgrid)" 
          opacity="0.85" 
        />

        <!-- ========================================================================= -->
        <!-- VIEW 1: SIDE VIEW (SECTION ELEVATION - DEFAULT COMPLETE SYSTEM)           -->
        <!-- ========================================================================= -->
        <g v-if="telemetryStore.cadViewAngle === 'SIDE'" id="view-side-section">
          <!-- DIRECTIONAL BOUNDARY MARKERS (TOP / BOTTOM / LEFT=FRONT / RIGHT=BACK) -->
          <g id="side-view-boundary-indicators">
            <!-- TOP (Rooftop ORC / Sky) -->
            <rect x="760" y="15" width="400" height="30" rx="8" fill="#1E293B" stroke="#C084FC" stroke-width="1.5" />
            <text x="960" y="35" fill="#C084FC" font-size="12" font-weight="bold" text-anchor="middle">▲ TOP (ด้านบน): ROOFTOP ORC POWER DECK (EL +22.50m)</text>

            <!-- BOTTOM (Ground Foundation / Demin Basin) -->
            <rect x="760" y="1035" width="400" height="30" rx="8" fill="#1E293B" stroke="#10B981" stroke-width="1.5" />
            <text x="960" y="1055" fill="#10B981" font-size="12" font-weight="bold" text-anchor="middle">▼ BOTTOM (ด้านล่าง): GROUND FOUNDATION & BASIN (EL +0.00m)</text>

            <!-- LEFT = FRONT OF BUILDING (Server Racks Side) -->
            <rect x="15" y="490" width="30" height="200" rx="6" fill="#1E293B" stroke="#38BDF8" stroke-width="1.5" />
            <text x="30" y="590" fill="#38BDF8" font-size="12" font-weight="bold" text-anchor="middle" transform="rotate(-90 30 590)">
              ◀ LEFT (ด้านหน้าตึก - FRONT): 40x RACKS
            </text>

            <!-- RIGHT = BACK OF BUILDING (Cooling / Mechanical Side) -->
            <rect x="1875" y="490" width="30" height="200" rx="6" fill="#1E293B" stroke="#F97316" stroke-width="1.5" />
            <text x="1890" y="590" fill="#F97316" font-size="12" font-weight="bold" text-anchor="middle" transform="rotate(90 1890 590)">
              ▶ RIGHT (ด้านหลังตึก - BACK): CDUs & RISERS
            </text>
          </g>

          <!-- Architectural Floor Plates & Zones -->
          <g opacity="0.8">
            <!-- Rooftop Deck -->
            <rect x="60" y="60" width="1800" height="200" rx="8" fill="#1E293B" fill-opacity="0.25" stroke="#475569" stroke-width="1.5" stroke-dasharray="6,6" />
            <text x="80" y="95" fill="#C084FC" font-size="14" font-family="monospace" font-weight="bold">ROOFTOP: AMMONIA ORC POWER RECOVERY & CONDENSER DECK (EL +22.5m)</text>

            <!-- Floor 4 -->
            <rect x="60" y="280" width="1800" height="160" rx="8" fill="#1E293B" fill-opacity="0.2" stroke="#334155" stroke-width="1.2" />
            <text x="80" y="310" fill="#38BDF8" font-size="13" font-family="monospace" font-weight="bold">FLOOR 4 (EL +18.0m): 10x AI SERVER RACKS (450 kW) + IN-ROW CDU-401</text>

            <!-- Floor 3 -->
            <rect x="60" y="460" width="1800" height="160" rx="8" fill="#1E293B" fill-opacity="0.2" stroke="#334155" stroke-width="1.2" />
            <text x="80" y="490" fill="#38BDF8" font-size="13" font-family="monospace" font-weight="bold">FLOOR 3 (EL +13.5m): 10x AI SERVER RACKS (450 kW) + IN-ROW CDU-301</text>

            <!-- Floor 2 -->
            <rect x="60" y="640" width="1800" height="160" rx="8" fill="#1E293B" fill-opacity="0.2" stroke="#334155" stroke-width="1.2" />
            <text x="80" y="670" fill="#38BDF8" font-size="13" font-family="monospace" font-weight="bold">FLOOR 2 (EL +9.0m): 10x AI SERVER RACKS (450 kW) + IN-ROW CDU-201</text>

            <!-- Floor 1 -->
            <rect x="60" y="820" width="1800" height="160" rx="8" fill="#1E293B" fill-opacity="0.2" stroke="#334155" stroke-width="1.2" />
            <text x="80" y="850" fill="#38BDF8" font-size="13" font-family="monospace" font-weight="bold">FLOOR 1 (EL +4.5m): 10x AI SERVER RACKS (450 kW) + IN-ROW CDU-101</text>

            <!-- Ground Basin -->
            <rect x="60" y="990" width="600" height="70" rx="6" fill="#0F172A" stroke="#0284C7" stroke-width="1.5" />
            <text x="80" y="1020" fill="#10B981" font-size="12" font-family="monospace" font-weight="bold">GROUND (EL +0.0m): WATER TREATMENT & PRIMARY CHW PUMP</text>
          </g>

          <!-- CENTRAL VERTICAL RISERS (DN250) -->
          <g v-if="telemetryStore.layers.centralRisers" id="central-risers-side">
            <line x1="340" y1="990" x2="340" y2="280" stroke="url(#chw-gradient)" stroke-width="8" stroke-linecap="round" />
            <line x1="340" y1="990" x2="340" y2="280" stroke="#E0F2FE" stroke-width="2" stroke-dasharray="8,12" class="flow-anim-chw" />

            <line x1="1020" y1="950" x2="1020" y2="180" stroke="url(#hot-return-gradient)" stroke-width="8" stroke-linecap="round" />
            <line x1="1020" y1="950" x2="1020" y2="180" stroke="#FEF08A" stroke-width="2" stroke-dasharray="8,12" class="flow-anim-hot" />

            <!-- Branch Piping from Riser to CDUs and Racks on Each Floor -->
            <g v-for="floor in [4, 3, 2, 1]" :key="floor">
              <path :d="`M 340 ${floor === 4 ? 340 : floor === 3 ? 520 : floor === 2 ? 700 : 880} L 260 ${floor === 4 ? 340 : floor === 3 ? 520 : floor === 2 ? 700 : 880}`" fill="none" stroke="#38BDF8" stroke-width="4" />
              <path :d="`M 260 ${floor === 4 ? 350 : floor === 3 ? 530 : floor === 2 ? 710 : 890} L 960 ${floor === 4 ? 350 : floor === 3 ? 530 : floor === 2 ? 710 : 890}`" fill="none" stroke="#0284C7" stroke-width="3.5" stroke-dasharray="6,4" />
              <path :d="`M 420 ${floor === 4 ? 395 : floor === 3 ? 575 : floor === 2 ? 755 : 935} L 1020 ${floor === 4 ? 395 : floor === 3 ? 575 : floor === 2 ? 755 : 935}`" fill="none" stroke="#F97316" stroke-width="4" />
            </g>

            <path d="M 880 180 L 780 180 L 780 990 L 440 990" fill="none" stroke="#0284C7" stroke-width="6" stroke-linecap="round" />
          </g>

          <!-- 10 STANDALONE SERVER RACKS PER FLOOR -->
          <g v-for="floor in [4, 3, 2, 1]" :key="'racks-floor-' + floor">
            <g 
              v-for="r in 10" 
              :key="`rack-${floor}-${r}`"
              class="cursor-pointer group"
              @click="telemetryStore.selectNode(`RACK-${floor}${r < 10 ? '0' + r : r}`)"
            >
              <rect 
                :x="420 + ((r - 1) % 5) * 110" 
                :y="floor === 4 ? 335 + Math.floor((r - 1) / 5) * 45 : floor === 3 ? 515 + Math.floor((r - 1) / 5) * 45 : floor === 2 ? 695 + Math.floor((r - 1) / 5) * 45 : 875 + Math.floor((r - 1) / 5) * 45"
                width="95" 
                height="38" 
                rx="4" 
                :fill="telemetryStore.selectedNodeTag === `RACK-${floor}${r < 10 ? '0' + r : r}` ? '#0369A1' : '#1E293B'"
                :stroke="telemetryStore.selectedNodeTag === `RACK-${floor}${r < 10 ? '0' + r : r}` ? '#38BDF8' : '#475569'"
                stroke-width="1.5"
              />
              <circle 
                :cx="430 + ((r - 1) % 5) * 110" 
                :cy="floor === 4 ? 354 + Math.floor((r - 1) / 5) * 45 : floor === 3 ? 534 + Math.floor((r - 1) / 5) * 45 : floor === 2 ? 714 + Math.floor((r - 1) / 5) * 45 : 894 + Math.floor((r - 1) / 5) * 45"
                r="3" 
                fill="#10B981" 
              />
              <text 
                :x="440 + ((r - 1) % 5) * 110" 
                :y="floor === 4 ? 358 + Math.floor((r - 1) / 5) * 45 : floor === 3 ? 538 + Math.floor((r - 1) / 5) * 45 : floor === 2 ? 718 + Math.floor((r - 1) / 5) * 45 : 898 + Math.floor((r - 1) / 5) * 45"
                fill="#F8FAFC" 
                font-size="10" 
                font-family="monospace" 
                font-weight="bold"
              >
                RACK-{{ floor }}{{ r < 10 ? '0' + r : r }}
              </text>
            </g>
          </g>

          <!-- IN-ROW CDUs & FCVs -->
          <g v-for="floor in [4, 3, 2, 1]" :key="'cdu-floor-' + floor">
            <g class="cursor-pointer" @click="telemetryStore.selectNode(`CDU-${floor}01`)">
              <rect x="210" :y="floor === 4 ? 320 : floor === 3 ? 500 : floor === 2 ? 680 : 860" width="100" height="80" rx="6" :fill="telemetryStore.selectedNodeTag === `CDU-${floor}01` ? '#0284C7' : '#1E293B'" stroke="#38BDF8" stroke-width="2" />
              <text x="260" :y="floor === 4 ? 365 : floor === 3 ? 545 : floor === 2 ? 725 : 905" fill="#FFFFFF" font-size="11" font-family="monospace" font-weight="bold" text-anchor="middle">CDU-{{ floor }}01</text>
            </g>
            <g class="cursor-pointer" @click="telemetryStore.selectNode(`FCV-${floor}01`)">
              <polygon :points="`150,${floor === 4 ? 345 : floor === 3 ? 525 : floor === 2 ? 705 : 885} 180,${floor === 4 ? 360 : floor === 3 ? 540 : floor === 2 ? 720 : 900} 150,${floor === 4 ? 375 : floor === 3 ? 555 : floor === 2 ? 735 : 915}`" fill="#F97316" />
              <polygon :points="`210,${floor === 4 ? 345 : floor === 3 ? 525 : floor === 2 ? 705 : 885} 180,${floor === 4 ? 360 : floor === 3 ? 540 : floor === 2 ? 720 : 900} 210,${floor === 4 ? 375 : floor === 3 ? 555 : floor === 2 ? 735 : 915}`" fill="#F97316" />
            </g>
          </g>

          <!-- ROOFTOP ORC POWER PLANT -->
          <g id="rooftop-orc-nodes">
            <g class="cursor-pointer" @click="telemetryStore.selectNode('HEX-R01')">
              <rect x="800" y="110" width="160" height="90" rx="8" :fill="telemetryStore.selectedNodeTag === 'HEX-R01' ? '#0369A1' : '#1E293B'" stroke="#64748B" stroke-width="2.5" />
              <text x="880" y="100" fill="#F8FAFC" font-size="12" font-family="monospace" font-weight="bold" text-anchor="middle">HEX-R01 (1,850 kW)</text>
            </g>
            <g class="cursor-pointer" @click="telemetryStore.selectNode('TB-R01')">
              <circle cx="1200" cy="155" r="40" :fill="telemetryStore.selectedNodeTag === 'TB-R01' ? '#6B21A8' : '#1E293B'" stroke="#A855F7" stroke-width="2.5" />
              <text x="1200" y="100" fill="#C084FC" font-size="12" font-family="monospace" font-weight="bold" text-anchor="middle">TB-R01 (524 kW)</text>
            </g>
            <g class="cursor-pointer" @click="telemetryStore.selectNode('CND-R01')">
              <circle cx="1600" cy="155" r="45" :fill="telemetryStore.selectedNodeTag === 'CND-R01' ? '#0369A1' : '#1E293B'" stroke="#38BDF8" stroke-width="2" />
              <text x="1600" y="95" fill="#38BDF8" font-size="12" font-family="monospace" font-weight="bold" text-anchor="middle">CND-R01 (4,090 kW)</text>
            </g>
          </g>

          <!-- GROUND BASIN & PUMPS -->
          <g id="ground-basin-nodes">
            <g class="cursor-pointer" @click="telemetryStore.selectNode('P-101')">
              <circle cx="400" cy="1030" r="28" :fill="telemetryStore.selectedNodeTag === 'P-101' ? '#0284C7' : '#1E293B'" stroke="#0284C7" stroke-width="2.5" />
              <text x="400" y="1075" fill="#38BDF8" font-size="11" font-family="monospace" font-weight="bold" text-anchor="middle">P-101 (CHW 2,400 L/m)</text>
            </g>
            <g class="cursor-pointer" @click="telemetryStore.selectNode('WTP-01')">
              <rect x="100" y="1005" width="130" height="50" rx="4" :fill="telemetryStore.selectedNodeTag === 'WTP-01' ? '#047857' : '#1E293B'" stroke="#10B981" stroke-width="2" />
              <text x="165" y="1035" fill="#10B981" font-size="11" font-family="monospace" font-weight="bold" text-anchor="middle">WTP-01 Demin</text>
            </g>
          </g>
        </g>

        <!-- ========================================================================= -->
        <!-- VIEW 2: TOP VIEW (PLAN VIEW - WITH EXPLICIT 4-DIRECTION LABELS)           -->
        <!-- ========================================================================= -->
        <g v-else-if="telemetryStore.cadViewAngle === 'TOP'" id="view-top-plan">
          <!-- 5-RAI SITE BOUNDARY OVERLAY (If enabled) -->
          <g v-if="showSiteMasterplan" id="site-masterplan-5rai">
            <!-- 5 Rai Plot Boundary (80m x 100m) -->
            <rect x="100" y="40" width="1720" height="1000" rx="20" fill="#0F172A" stroke="#059669" stroke-width="3" stroke-dasharray="12,8" />
            <text x="140" y="80" fill="#10B981" font-size="16" font-weight="bold">5-RAI INDUSTRIAL PLOT (80m × 100m = 8,000 m² / 5.00 ไร่)</text>

            <!-- Setback Buffer & Perimeter 6m Road -->
            <rect x="180" y="100" width="1560" height="880" rx="16" fill="none" stroke="#334155" stroke-width="1.5" stroke-dasharray="6,4" />
            <text x="200" y="130" fill="#64748B" font-size="12">6-METER PERIMETER FIRE ACCESS & STORMWATER RETENTION BELT (4,436 m²)</text>

            <!-- Substation & Diesel Genset Yard (Rear / North) -->
            <rect x="250" y="150" width="450" height="140" rx="10" fill="#1E293B" stroke="#EAB308" stroke-width="1.5" />
            <text x="270" y="180" fill="#FACC15" font-size="13" font-weight="bold">115 kV SUBSTATION & 2x 2000kVA GENSETS (1,500 m²)</text>

            <!-- Access Road & Entrance (Front / South) -->
            <rect x="600" y="900" width="720" height="100" rx="10" fill="#1E293B" stroke="#38BDF8" stroke-width="1.5" />
            <text x="960" y="955" fill="#38BDF8" font-size="14" font-weight="bold" text-anchor="middle">12-METER MAIN ACCESS ROAD & SECURITY GATE (1,200 m²)</text>
          </g>

          <!-- 4 DIRECTIONAL ORIENTATION BADGES -->
          <g id="top-view-cardinal-badges">
            <!-- BACK / NORTH (TOP OF PLAN) -->
            <rect x="760" y="15" width="400" height="30" rx="8" fill="#1E293B" stroke="#F97316" stroke-width="1.5" />
            <text x="960" y="35" fill="#F97316" font-size="13" font-weight="bold" text-anchor="middle">▲ BACK / NORTH (ด้านหลัง): CDUs, SUBSTATION & GENSETS</text>

            <!-- FRONT / SOUTH (BOTTOM OF PLAN) -->
            <rect x="760" y="1035" width="400" height="30" rx="8" fill="#1E293B" stroke="#38BDF8" stroke-width="1.5" />
            <text x="960" y="1055" fill="#38BDF8" font-size="13" font-weight="bold" text-anchor="middle">▼ FRONT / SOUTH (ด้านหน้า): 40x RACKS & MAIN ENTRANCE</text>

            <!-- LEFT / WEST (LEFT OF PLAN) -->
            <rect x="15" y="440" width="30" height="200" rx="6" fill="#1E293B" stroke="#10B981" stroke-width="1.5" />
            <text x="30" y="540" fill="#10B981" font-size="12" font-weight="bold" text-anchor="middle" transform="rotate(-90 30 540)">
              ◀ LEFT / WEST (ด้านซ้าย): WTP-01 BASIN
            </text>

            <!-- RIGHT / EAST (RIGHT OF PLAN) -->
            <rect x="1875" y="440" width="30" height="200" rx="6" fill="#1E293B" stroke="#A855F7" stroke-width="1.5" />
            <text x="1890" y="540" fill="#A855F7" font-size="12" font-weight="bold" text-anchor="middle" transform="rotate(90 1890 540)">
              ▶ RIGHT / EAST (ด้านขวา): DN250 RISERS SHAFT
            </text>
          </g>

          <!-- Building Slab Footprint (36m x 24m) -->
          <rect x="250" y="180" width="1420" height="720" rx="16" fill="#1E293B" fill-opacity="0.6" stroke="#38BDF8" stroke-width="2.5" />
          <text x="280" y="220" fill="#38BDF8" font-size="18" font-weight="bold">
            BUILDING FOOTPRINT: 36m (W) × 24m (D) = 864 m² ({{ telemetryStore.cadLevelFocus === 'ALL' ? 'FLOOR 1 PLAN' : `${telemetryStore.cadLevelFocus} PLAN` }})
          </text>

          <!-- Zone Split -->
          <line x1="250" y1="540" x2="1670" y2="540" stroke="#475569" stroke-width="1.5" stroke-dasharray="6,6" />
          <text x="280" y="530" fill="#F97316" font-size="13">▲ REAR ZONE (ด้านหลัง): CDUs, FCV VALVES & RISER SHAFT</text>
          <text x="280" y="565" fill="#38BDF8" font-size="13">▼ FRONT ZONE (ด้านหน้า): 10x STANDALONE AI COMPUTE RACKS (COLD/HOT AISLE)</text>

          <!-- 10 Standalone Racks in 2 Rows of 5 -->
          <g v-for="r in 10" :key="'top-rack-' + r" class="cursor-pointer" @click="telemetryStore.selectNode(`RACK-1${r < 10 ? '0' + r : r}`)">
            <rect 
              :x="340 + ((r - 1) % 5) * 260" 
              :y="r <= 5 ? 600 : 760" 
              width="200" 
              height="100" 
              rx="8" 
              :fill="telemetryStore.selectedNodeTag === `RACK-1${r < 10 ? '0' + r : r}` ? '#0369A1' : '#0F172A'"
              :stroke="telemetryStore.selectedNodeTag === `RACK-1${r < 10 ? '0' + r : r}` ? '#38BDF8' : '#334155'"
              stroke-width="2"
            />
            <text :x="440 + ((r - 1) % 5) * 260" :y="r <= 5 ? 655 : 815" fill="#F8FAFC" font-size="14" font-weight="bold" text-anchor="middle">
              RACK-{{ r < 10 ? '0' + r : r }} (45 kW)
            </text>
          </g>

          <!-- CDU & Riser Shaft -->
          <rect x="400" y="270" width="240" height="150" rx="10" fill="#0369A1" stroke="#38BDF8" stroke-width="2.5" />
          <text x="520" y="355" fill="#FFFFFF" font-size="16" font-weight="bold" text-anchor="middle">CDU-450 kW</text>

          <rect x="1300" y="270" width="180" height="150" rx="10" fill="#0F172A" stroke="#F97316" stroke-width="2" />
          <circle cx="1350" cy="345" r="24" fill="#0284C7" />
          <text x="1350" y="350" fill="#FFFFFF" font-size="10" font-weight="bold" text-anchor="middle">CHW</text>
          <circle cx="1410" cy="345" r="24" fill="#F97316" />
          <text x="1410" y="350" fill="#FFFFFF" font-size="10" font-weight="bold" text-anchor="middle">HOT</text>
        </g>

        <!-- ========================================================================= -->
        <!-- VIEW 3: FRONT VIEW (FRONT ELEVATION - ALL 40 SERVER RACKS)                -->
        <!-- ========================================================================= -->
        <g v-else-if="telemetryStore.cadViewAngle === 'FRONT'" id="view-front-elevation">
          <!-- Boundary Markers -->
          <rect x="760" y="15" width="400" height="30" rx="8" fill="#1E293B" stroke="#C084FC" stroke-width="1.5" />
          <text x="960" y="35" fill="#C084FC" font-size="12" font-weight="bold" text-anchor="middle">▲ TOP (ด้านบน): ROOFTOP ORC POWER PLANT</text>

          <rect x="760" y="1035" width="400" height="30" rx="8" fill="#1E293B" stroke="#10B981" stroke-width="1.5" />
          <text x="960" y="1055" fill="#10B981" font-size="12" font-weight="bold" text-anchor="middle">▼ BOTTOM (ด้านล่าง): GROUND ENTRANCE</text>

          <rect x="15" y="490" width="30" height="200" rx="6" fill="#1E293B" stroke="#10B981" stroke-width="1.5" />
          <text x="30" y="590" fill="#10B981" font-size="12" font-weight="bold" text-anchor="middle" transform="rotate(-90 30 590)">
            ◀ LEFT (ด้านซ้ายตึก - WEST / WATER PLANT)
          </text>

          <rect x="1875" y="490" width="30" height="200" rx="6" fill="#1E293B" stroke="#A855F7" stroke-width="1.5" />
          <text x="1890" y="590" fill="#A855F7" font-size="12" font-weight="bold" text-anchor="middle" transform="rotate(90 1890 590)">
            ▶ RIGHT (ด้านขวาตึก - EAST / RISER SHAFT)
          </text>

          <text x="80" y="90" fill="#38BDF8" font-size="18" font-weight="bold">FRONT ELEVATION (ด้านหน้าตึก): 40x STANDALONE AI COMPUTE SUITES (1,800 kW)</text>

          <g v-for="floor in [4, 3, 2, 1]" :key="'front-floor-' + floor">
            <rect x="100" :y="150 + (4 - floor) * 220" width="1720" height="180" rx="10" fill="#1E293B" fill-opacity="0.3" stroke="#334155" stroke-width="1.5" />
            <text x="120" :y="180 + (4 - floor) * 220" fill="#94A3B8" font-size="13" font-weight="bold">LEVEL {{ floor }} COMPUTE ROW (10x RACKS)</text>

            <g v-for="r in 10" :key="`front-rack-${floor}-${r}`" class="cursor-pointer" @click="telemetryStore.selectNode(`RACK-${floor}${r < 10 ? '0' + r : r}`)">
              <rect 
                :x="140 + (r - 1) * 165" 
                :y="200 + (4 - floor) * 220" 
                width="140" 
                height="110" 
                rx="6" 
                :fill="telemetryStore.selectedNodeTag === `RACK-${floor}${r < 10 ? '0' + r : r}` ? '#0369A1' : '#0F172A'"
                :stroke="telemetryStore.selectedNodeTag === `RACK-${floor}${r < 10 ? '0' + r : r}` ? '#38BDF8' : '#475569'"
                stroke-width="2"
              />
              <text :x="210 + (r - 1) * 165" :y="260 + (4 - floor) * 220" fill="#F8FAFC" font-size="11" font-weight="bold" text-anchor="middle">
                RACK-{{ floor }}{{ r < 10 ? '0' + r : r }}
              </text>
            </g>
          </g>
        </g>

        <!-- ========================================================================= -->
        <!-- VIEW 4: BACK VIEW (REAR ELEVATION - COOLING & HYDRAULIC INFRASTRUCTURE)  -->
        <!-- ========================================================================= -->
        <g v-else-if="telemetryStore.cadViewAngle === 'BACK'" id="view-back-elevation">
          <!-- Boundary Markers -->
          <rect x="760" y="15" width="400" height="30" rx="8" fill="#1E293B" stroke="#C084FC" stroke-width="1.5" />
          <text x="960" y="35" fill="#C084FC" font-size="12" font-weight="bold" text-anchor="middle">▲ TOP (ด้านบน): ROOFTOP CONDENSER ARRAYS</text>

          <rect x="760" y="1035" width="400" height="30" rx="8" fill="#1E293B" stroke="#10B981" stroke-width="1.5" />
          <text x="960" y="1055" fill="#10B981" font-size="12" font-weight="bold" text-anchor="middle">▼ BOTTOM (ด้านล่าง): MECHANICAL BASEMENT</text>

          <rect x="15" y="490" width="30" height="200" rx="6" fill="#1E293B" stroke="#A855F7" stroke-width="1.5" />
          <text x="30" y="590" fill="#A855F7" font-size="12" font-weight="bold" text-anchor="middle" transform="rotate(-90 30 590)">
            ◀ LEFT (ด้านขวาตึก - EAST / RISER SHAFT)
          </text>

          <rect x="1875" y="490" width="30" height="200" rx="6" fill="#1E293B" stroke="#10B981" stroke-width="1.5" />
          <text x="1890" y="590" fill="#10B981" font-size="12" font-weight="bold" text-anchor="middle" transform="rotate(90 1890 590)">
            ▶ RIGHT (ด้านซ้ายตึก - WEST / WATER PLANT)
          </text>

          <text x="80" y="90" fill="#F97316" font-size="18" font-weight="bold">BACK ELEVATION (ด้านหลังตึก): CDUs, FCV VALVES & HYDRAULIC RISERS</text>

          <g v-for="floor in [4, 3, 2, 1]" :key="'back-floor-' + floor">
            <rect x="100" :y="150 + (4 - floor) * 220" width="1720" height="180" rx="10" fill="#1E293B" fill-opacity="0.3" stroke="#334155" stroke-width="1.5" />
            <text x="120" :y="180 + (4 - floor) * 220" fill="#94A3B8" font-size="13" font-weight="bold">LEVEL {{ floor }} CDU & MANIFOLDS</text>

            <rect :x="400" :y="200 + (4 - floor) * 220" width="280" height="110" rx="8" fill="#0284C7" stroke="#38BDF8" stroke-width="2" />
            <text :x="540" :y="260 + (4 - floor) * 220" fill="#FFFFFF" font-size="14" font-weight="bold" text-anchor="middle">CDU-{{ floor }}01 (450 kW)</text>

            <circle :cx="800" :cy="255 + (4 - floor) * 220" r="30" fill="#F97316" />
            <text :x="800" :y="260 + (4 - floor) * 220" fill="#FFFFFF" font-size="11" font-weight="bold" text-anchor="middle">FCV-{{ floor }}01</text>
          </g>
        </g>
      </g>
    </svg>

    <!-- FLOATING CAD MINIMAP & NAVIGATION OVERLAY -->
    <div class="absolute bottom-4 left-4 flex items-center gap-3 bg-slate-900/80 backdrop-blur-md px-4 py-2 rounded-xl border border-slate-800 text-xs font-mono text-slate-300 shadow-xl">
      <span class="inline-flex items-center gap-1.5">
        <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
        <span>{{ t('app.viewport') }}</span>
      </span>
      <span class="text-slate-600">|</span>
      <span>{{ t('app.zoom') }}: {{ (zoomScale * 100).toFixed(0) }}%</span>
      <span class="text-slate-600">|</span>
      <span>{{ t('app.pan') }}: ({{ panX.toFixed(0) }}, {{ panY.toFixed(0) }})</span>
      <button 
        class="ml-2 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 rounded text-slate-200 transition cursor-pointer"
        @click="resetView"
      >
        {{ t('app.resetView') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useTelemetryStore } from '@/stores/telemetryStore';

const { t } = useI18n();
const telemetryStore = useTelemetryStore();
const svgRef = ref<SVGSVGElement | null>(null);
const showSiteMasterplan = ref(false);

// Pan & Zoom Reactive State
const panX = ref(0);
const panY = ref(0);
const zoomScale = ref(1);
const isPanning = ref(false);
let startClientX = 0;
let startClientY = 0;
let startPanX = 0;
let startPanY = 0;

function startPan(e: MouseEvent) {
  if ((e.target as HTMLElement)?.closest('button') || (e.target as HTMLElement)?.closest('.no-pan')) return;
  isPanning.value = true;
  startClientX = e.clientX;
  startClientY = e.clientY;
  startPanX = panX.value;
  startPanY = panY.value;
}

function onPan(e: MouseEvent) {
  if (!isPanning.value || !svgRef.value) return;
  const rect = svgRef.value.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return;
  const scaleX = 1920 / rect.width;
  const scaleY = 1080 / rect.height;
  panX.value = parseFloat((startPanX + (e.clientX - startClientX) * scaleX).toFixed(2));
  panY.value = parseFloat((startPanY + (e.clientY - startClientY) * scaleY).toFixed(2));
}

function endPan() {
  isPanning.value = false;
}

function onZoom(e: WheelEvent) {
  if (!svgRef.value) return;
  const rect = svgRef.value.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return;

  const mouseScreenX = e.clientX - rect.left;
  const mouseScreenY = e.clientY - rect.top;

  const svgMouseX = mouseScreenX * (1920 / rect.width);
  const svgMouseY = mouseScreenY * (1080 / rect.height);

  const worldX = (svgMouseX - panX.value) / zoomScale.value;
  const worldY = (svgMouseY - panY.value) / zoomScale.value;

  const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;
  const newScale = Math.max(0.35, Math.min(4.5, zoomScale.value * zoomFactor));

  panX.value = parseFloat((svgMouseX - worldX * newScale).toFixed(2));
  panY.value = parseFloat((svgMouseY - worldY * newScale).toFixed(2));
  zoomScale.value = parseFloat(newScale.toFixed(3));
}

function resetView() {
  panX.value = 0;
  panY.value = 0;
  zoomScale.value = 1;
}
</script>

<style scoped>
.canvas-container {
  touch-action: none;
}
.flow-anim-chw {
  animation: flowChw 1.2s linear infinite;
}
.flow-anim-hot {
  animation: flowHot 1.0s linear infinite;
}
@keyframes flowChw {
  from { stroke-dashoffset: 20; }
  to { stroke-dashoffset: 0; }
}
@keyframes flowHot {
  from { stroke-dashoffset: 0; }
  to { stroke-dashoffset: 20; }
}
</style>
