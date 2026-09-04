<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-6 animate-in fade-in duration-150 select-none">
    <div class="w-full max-w-5xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
      <!-- Header -->
      <div class="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 font-mono font-bold text-lg">
            ⎔
          </div>
          <div>
            <h2 class="text-lg font-bold text-slate-100 font-mono">{{ t('symbols.title') }}</h2>
            <p class="text-xs text-slate-400 font-mono">{{ t('symbols.subtitle') }}</p>
          </div>
        </div>
        <button 
          class="px-4 py-2 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 rounded-xl text-xs font-mono text-slate-200 transition cursor-pointer"
          @click="$emit('close')"
        >
          {{ t('symbols.close') }}
        </button>
      </div>

      <!-- Symbols Grid -->
      <div class="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <!-- 1. Heat Exchanger -->
        <div class="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 flex flex-col gap-3">
          <div class="flex justify-between items-start">
            <span class="text-xs font-mono font-bold text-sky-400">HEX-R01</span>
            <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">ISA: E / HEX</span>
          </div>
          <div class="h-28 bg-slate-900/80 rounded-xl flex items-center justify-center border border-slate-800/80">
            <svg width="180" height="90" viewBox="0 0 180 90">
              <rect x="20" y="10" width="140" height="70" rx="8" fill="#1E293B" stroke="#64748B" stroke-width="2.5" />
              <path d="M 40 80 L 40 30 Q 60 15 80 30 L 80 80" fill="none" stroke="#F97316" stroke-width="3" />
              <path d="M 60 80 L 60 40 Q 75 25 90 40 L 90 80" fill="none" stroke="#F97316" stroke-width="2" />
              <path d="M 100 80 L 100 30 Q 120 15 140 30 L 140 80" fill="none" stroke="#38BDF8" stroke-width="3" />
              <circle cx="145" cy="22" r="5" fill="#10B981" />
            </svg>
          </div>
          <div class="text-xs font-medium text-slate-200">Inverted 4-Prong U-Tube Evaporator</div>
          <p class="text-[11px] text-slate-400 leading-relaxed">Shell & Tube heat recovery transfer between 62°C return water and NH3 ammonia refrigerant.</p>
        </div>

        <!-- 2. Ammonia Turbine -->
        <div class="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 flex flex-col gap-3">
          <div class="flex justify-between items-start">
            <span class="text-xs font-mono font-bold text-purple-400">TB-R01</span>
            <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">ISA: T / EXP</span>
          </div>
          <div class="h-28 bg-slate-900/80 rounded-xl flex items-center justify-center border border-slate-800/80">
            <svg width="180" height="90" viewBox="0 0 180 90">
              <circle cx="90" cy="45" r="35" fill="#1E293B" stroke="#A855F7" stroke-width="2.5" />
              <polygon points="75,30 105,45 75,60" fill="#C084FC" />
              <polygon points="105,30 75,45 105,60" fill="#A855F7" opacity="0.8" />
              <circle cx="90" cy="45" r="6" fill="#F8FAFC" />
              <circle cx="115" cy="20" r="5" fill="#10B981" />
            </svg>
          </div>
          <div class="text-xs font-medium text-slate-200">Radial Inflow Ammonia ORC Turbine</div>
          <p class="text-[11px] text-slate-400 leading-relaxed">High-pressure superheated vapor expansion generating 520 kW of green auxiliary power.</p>
        </div>

        <!-- 3. Spiral Condenser Array -->
        <div class="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 flex flex-col gap-3">
          <div class="flex justify-between items-start">
            <span class="text-xs font-mono font-bold text-cyan-400">CND-R01..06</span>
            <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">ISA: C / AERO</span>
          </div>
          <div class="h-28 bg-slate-900/80 rounded-xl flex items-center justify-center border border-slate-800/80">
            <svg width="180" height="90" viewBox="0 0 180 90">
              <g transform="translate(90, 45)">
                <circle cx="0" cy="0" r="35" fill="#1E293B" stroke="#38BDF8" stroke-width="2" />
                <line x1="-25" y1="0" x2="25" y2="0" stroke="#38BDF8" stroke-width="2" />
                <line x1="-12" y1="-21" x2="12" y2="21" stroke="#38BDF8" stroke-width="2" />
                <line x1="-12" y1="21" x2="12" y2="-21" stroke="#38BDF8" stroke-width="2" />
                <circle cx="0" cy="0" r="8" fill="#0284C7" />
              </g>
            </svg>
          </div>
          <div class="text-xs font-medium text-slate-200">6-Arm Gravity-Fed Spiral Condenser</div>
          <p class="text-[11px] text-slate-400 leading-relaxed">Air-cooled hybrid heat rejection with 14,400 m² total surface area rated for 35°C ambient.</p>
        </div>

        <!-- 4. Coolant Distribution Unit -->
        <div class="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 flex flex-col gap-3">
          <div class="flex justify-between items-start">
            <span class="text-xs font-mono font-bold text-sky-400">CDU-101..401</span>
            <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">ISA: CDU / L2L</span>
          </div>
          <div class="h-28 bg-slate-900/80 rounded-xl flex items-center justify-center border border-slate-800/80">
            <svg width="180" height="90" viewBox="0 0 180 90">
              <rect x="45" y="15" width="90" height="60" rx="8" fill="#1E293B" stroke="#38BDF8" stroke-width="2" />
              <line x1="60" y1="30" x2="120" y2="30" stroke="#0284C7" stroke-width="2" stroke-dasharray="4,2" />
              <line x1="60" y1="60" x2="120" y2="60" stroke="#F97316" stroke-width="2" stroke-dasharray="4,2" />
              <text x="90" y="49" fill="#F8FAFC" font-size="11" font-family="monospace" font-weight="bold" text-anchor="middle">CDU-450kW</text>
            </svg>
          </div>
          <div class="text-xs font-medium text-slate-200">Liquid-to-Liquid In-Row CDU</div>
          <p class="text-[11px] text-slate-400 leading-relaxed">Decouples primary building chilled water from secondary PG25 direct-to-chip rack cooling.</p>
        </div>

        <!-- 5. Flow Control Valve -->
        <div class="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 flex flex-col gap-3">
          <div class="flex justify-between items-start">
            <span class="text-xs font-mono font-bold text-orange-400">FCV-101..401</span>
            <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">ISA: FCV / VAL</span>
          </div>
          <div class="h-28 bg-slate-900/80 rounded-xl flex items-center justify-center border border-slate-800/80">
            <svg width="180" height="90" viewBox="0 0 180 90">
              <polygon points="50,25 90,45 50,65" fill="#334155" stroke="#F97316" stroke-width="2" />
              <polygon points="130,25 90,45 130,65" fill="#334155" stroke="#F97316" stroke-width="2" />
              <line x1="90" y1="45" x2="90" y2="15" stroke="#F97316" stroke-width="2" />
              <circle cx="90" cy="15" r="10" fill="#1E293B" stroke="#F97316" stroke-width="2" />
              <text x="90" y="19" fill="#F97316" font-size="9" font-family="monospace" text-anchor="middle">M</text>
            </svg>
          </div>
          <div class="text-xs font-medium text-slate-200">Modulating 4-20mA Flow Valve</div>
          <p class="text-[11px] text-slate-400 leading-relaxed">Dynamic flow throttling responding to CPU/GPU thermal load and differential pressure.</p>
        </div>

        <!-- 6. Centrifugal CHW Pump -->
        <div class="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 flex flex-col gap-3">
          <div class="flex justify-between items-start">
            <span class="text-xs font-mono font-bold text-emerald-400">P-CHW-01A</span>
            <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">ISA: P / PUMP</span>
          </div>
          <div class="h-28 bg-slate-900/80 rounded-xl flex items-center justify-center border border-slate-800/80">
            <svg width="180" height="90" viewBox="0 0 180 90">
              <circle cx="85" cy="45" r="28" fill="#1E293B" stroke="#0284C7" stroke-width="2.5" />
              <polygon points="70,30 100,45 70,60" fill="#38BDF8" />
              <rect x="110" y="30" width="22" height="30" rx="3" fill="#334155" stroke="#64748B" stroke-width="1.5" />
            </svg>
          </div>
          <div class="text-xs font-medium text-slate-200">Primary CHW Circulation Pump</div>
          <p class="text-[11px] text-slate-400 leading-relaxed">VFD controlled 2,400 L/min variable speed circulation through central DN250 vertical risers.</p>
        </div>
      </div>

      <!-- Footer Info -->
      <div class="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400">
        <span>{{ t('symbols.standardsNote') }}</span>
        <span>{{ t('symbols.dragaLibrary') }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

defineEmits<{
  (e: 'close'): void;
}>();

const { t } = useI18n();
</script>
