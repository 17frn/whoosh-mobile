<template>
  <div class="banten-wrap">
    <!-- Zoom Controls -->
    <div class="bmap-controls">
      <button class="bmap-btn" @click="zoomIn"><i class="fa-solid fa-plus"></i></button>
      <span class="bmap-zoom-lbl">{{ Math.round(zoom * 100) }}%</span>
      <button class="bmap-btn" @click="zoomOut"><i class="fa-solid fa-minus"></i></button>
      <button class="bmap-btn" @click="reset"><i class="fa-solid fa-rotate-left"></i></button>
    </div>

    <!-- SVG Canvas -->
    <div
      class="bmap-canvas"
      ref="canvasRef"
      @wheel.prevent="onWheel"
      @mousedown="onMouseDown"
      @mousemove="onMouseMove"
      @mouseup="isDragging = false"
      @mouseleave="isDragging = false"
      @touchstart.passive="onTouchStart"
      @touchmove.prevent="onTouchMove"
      @touchend="isDragging = false; lastPinchDist = 0"
    >
      <!--
        Banten Province SVG — viewBox 0 0 400 280
        Coordinate system:
          x → East  (0 = Cilegon/Selat Sunda, 400 = DKI Jakarta border)
          y → South (0 = Java Sea north coast, 280 = Indian Ocean south)

        8 Kabupaten/Kota paths (drawn in z-order; kota paths on top to visually override kab):
          1. Kab. Serang       — full north band
          2. Kab. Pandeglang   — large SW peninsula
          3. Kab. Lebak        — large south interior
          4. Kab. Tangerang    — NE, L-shaped around kota
          5. Kota Cilegon      — NW tip (on top of Kab. Serang)
          6. Kota Serang       — center-north enclave
          7. Kota Tangerang    — far NE, borders DKI Jakarta N
          8. Kota Tangerang Selatan — E, borders DKI Jakarta E  ← ACTIVE
      -->
      <svg
        viewBox="0 0 400 280"
        class="bmap-svg"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="Peta Provinsi Banten"
      >
        <defs>
          <!-- Province outline clip -->
          <clipPath id="banten-clip">
            <path d="M 10 10 L 395 8 L 395 270 L 110 272 L 10 270 Z"/>
          </clipPath>
          <!-- Drop shadow for labels -->
          <filter id="label-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="0" stdDeviation="1.5" flood-color="#fff" flood-opacity="0.9"/>
          </filter>
        </defs>

        <g :transform="`translate(${panX}, ${panY}) scale(${zoom})`">

          <!-- ══ KABUPATEN (base layer) ══════════════════════════════════ -->

          <!-- Kabupaten Serang — North strip (full, cities rendered on top) -->
          <g class="bmap-region" @mouseenter="hovered='kab_serang'" @mouseleave="hovered=null">
            <path
              d="M 65 10 L 292 8 L 292 130 L 65 130 Z"
              :fill="regionFill('kab_serang')"
              stroke="#1a1a2e" stroke-width="0.8"
            />
          </g>

          <!-- Kabupaten Pandeglang — Large SW peninsula -->
          <g
            class="bmap-region"
            @mouseenter="hovered='pandeglang'"
            @mouseleave="hovered=null"
          >
            <path
              d="M 10 10 L 65 10 L 65 130 L 215 130 L 188 200 L 115 272 L 10 270 Z"
              :fill="regionFill('pandeglang')"
              stroke="#1a1a2e" stroke-width="0.8"
            />
          </g>

          <!-- Kabupaten Lebak — Large south interior -->
          <g
            class="bmap-region"
            @mouseenter="hovered='lebak'"
            @mouseleave="hovered=null"
          >
            <path
              d="M 215 130 L 292 130 L 320 130 L 320 162 L 356 162 L 395 162 L 395 270 L 115 272 L 188 200 Z"
              :fill="regionFill('lebak')"
              stroke="#1a1a2e" stroke-width="0.8"
            />
          </g>

          <!-- Kabupaten Tangerang — NE, L-shape surrounding the two kota -->
          <g
            class="bmap-region"
            @mouseenter="hovered='kab_tangerang'"
            @mouseleave="hovered=null"
          >
            <path
              d="M 292 8 L 356 6 L 356 162 L 320 162 L 320 130 L 292 130 Z"
              :fill="regionFill('kab_tangerang')"
              stroke="#1a1a2e" stroke-width="0.8"
            />
          </g>

          <!-- ══ KOTA (top layer — overlays kabupaten) ══════════════════ -->

          <!-- Kota Cilegon — NW corner, Selat Sunda coast -->
          <g
            class="bmap-region"
            @mouseenter="hovered='cilegon'"
            @mouseleave="hovered=null"
          >
            <path
              d="M 10 10 L 65 10 L 65 130 L 10 130 Z"
              :fill="regionFill('cilegon')"
              stroke="#1a1a2e" stroke-width="1"
            />
          </g>

          <!-- Kota Serang — center-north enclave inside Kab. Serang -->
          <g
            class="bmap-region"
            @mouseenter="hovered='kota_serang'"
            @mouseleave="hovered=null"
          >
            <path
              d="M 108 62 L 192 60 L 192 112 L 108 114 Z"
              :fill="regionFill('kota_serang')"
              stroke="#1a1a2e" stroke-width="1"
            />
          </g>

          <!-- Kota Tangerang — far NE, borders DKI Jakarta (north) -->
          <g
            class="bmap-region"
            @mouseenter="hovered='kota_tangerang'"
            @mouseleave="hovered=null"
          >
            <path
              d="M 356 6 L 395 4 L 395 88 L 356 90 Z"
              :fill="regionFill('kota_tangerang')"
              stroke="#1a1a2e" stroke-width="1"
            />
          </g>

          <!-- Kota Tangerang Selatan — E, borders DKI Jakarta (east) ← ACTIVE -->
          <g
            class="bmap-region has-data"
            @mouseenter="hovered='tangsel'"
            @mouseleave="hovered=null"
            @click="onRegionClick('tangsel')"
          >
            <path
              d="M 356 90 L 395 88 L 395 162 L 356 162 Z"
              :fill="regionFill('tangsel')"
              stroke="#f59e0b" stroke-width="1.5"
            />
            <!-- Active indicator ring -->
            <path
              d="M 358 92 L 393 90 L 393 160 L 358 160 Z"
              fill="none"
              :stroke="hovered === 'tangsel' ? '#f59e0b' : 'none'"
              stroke-width="1"
              stroke-dasharray="3,2"
            />
          </g>

          <!-- ══ REGION LABELS ═══════════════════════════════════════════ -->

          <!-- Kab. Serang label -->
          <text x="175" y="75" class="bmap-label bmap-label--kab" filter="url(#label-shadow)">Kab.</text>
          <text x="175" y="83" class="bmap-label bmap-label--kab" filter="url(#label-shadow)">Serang</text>

          <!-- Kab. Pandeglang label -->
          <text x="95" y="195" class="bmap-label bmap-label--kab" filter="url(#label-shadow)">Kab.</text>
          <text x="95" y="203" class="bmap-label bmap-label--kab" filter="url(#label-shadow)">Pandeglang</text>

          <!-- Kab. Lebak label -->
          <text x="295" y="215" class="bmap-label bmap-label--kab" filter="url(#label-shadow)">Kab.</text>
          <text x="295" y="223" class="bmap-label bmap-label--kab" filter="url(#label-shadow)">Lebak</text>

          <!-- Kab. Tangerang label -->
          <text x="316" y="80" class="bmap-label bmap-label--kab" filter="url(#label-shadow)">Kab.</text>
          <text x="316" y="88" class="bmap-label bmap-label--kab" filter="url(#label-shadow)">Tangerang</text>

          <!-- Kota Cilegon label -->
          <text x="37" y="68" class="bmap-label bmap-label--kota" filter="url(#label-shadow)">Kota</text>
          <text x="37" y="76" class="bmap-label bmap-label--kota" filter="url(#label-shadow)">Cilegon</text>

          <!-- Kota Serang label -->
          <text x="150" y="85" class="bmap-label bmap-label--kota" filter="url(#label-shadow)">Kota Serang</text>

          <!-- Kota Tangerang label -->
          <text x="375" y="44" class="bmap-label bmap-label--kota" filter="url(#label-shadow)">Kota</text>
          <text x="375" y="52" class="bmap-label bmap-label--kota" filter="url(#label-shadow)">Tangerang</text>

          <!-- Kota Tangsel label (special, active) -->
          <text x="375" y="122" class="bmap-label bmap-label--active" filter="url(#label-shadow)">Kota</text>
          <text x="375" y="130" class="bmap-label bmap-label--active" filter="url(#label-shadow)">Tangsel</text>
          <!-- "Klik!" hint -->
          <text x="375" y="140" class="bmap-label bmap-label--hint" v-if="hovered !== 'tangsel'">↑ klik!</text>

          <!-- ══ COMPASS ROSE ════════════════════════════════════════════ -->
          <g transform="translate(35, 248)">
            <circle cx="0" cy="0" r="10" fill="#fff" stroke="#1a1a2e" stroke-width="0.8"/>
            <text x="0" y="-13" class="bmap-compass" text-anchor="middle">N</text>
            <line x1="0" y1="-8" x2="0" y2="8" stroke="#1a1a2e" stroke-width="1"/>
            <line x1="-8" y1="0" x2="8" y2="0" stroke="#1a1a2e" stroke-width="0.8" stroke-dasharray="2,2"/>
            <polygon points="0,-8 -2,0 2,0" fill="#1a1a2e"/>
          </g>

          <!-- ══ MOMENT MARKERS ══════════════════════════════════════════ -->
          <g
            v-for="m in validMarkers"
            :key="m.id"
            class="bmap-marker-group"
            @click.stop="$emit('marker-click', m)"
          >
            <circle :cx="markerX(m)" :cy="markerY(m)" r="4" :fill="m.dotColor" opacity="0.25" class="bmap-marker-glow"/>
            <circle :cx="markerX(m)" :cy="markerY(m)" r="2.5" :fill="m.dotColor" stroke="#fff" stroke-width="0.8" class="bmap-marker-dot"/>
            <title>{{ m.title }} — {{ m.location }}</title>
          </g>

        </g>
      </svg>

      <!-- Hover Tooltip -->
      <Transition name="bmap-tt">
        <div v-if="hovered && hoveredRegion" class="bmap-tooltip" :class="{ 'is-active': hoveredRegion.hasData }">
          <span class="bmap-tt-badge">{{ hoveredRegion.type === 'kota' ? 'Kota' : 'Kabupaten' }}</span>
          <span class="bmap-tt-name">{{ hoveredRegion.name }}</span>
          <span v-if="hoveredRegion.hasData" class="bmap-tt-cta">Klik untuk drill-down →</span>
          <span v-else class="bmap-tt-empty">Belum ada momen</span>
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { TimelineData } from '../../data/timeline';

const props = defineProps<{ markers: TimelineData[] }>();
const emit = defineEmits<{
  (e: 'marker-click', item: TimelineData): void;
  (e: 'subregion-click', regionId: string): void;
}>();

// ── Region metadata ──────────────────────────────────────
interface RegionMeta { id: string; name: string; type: 'kabupaten' | 'kota'; hasData: boolean; }
const REGIONS: RegionMeta[] = [
  { id: 'kab_serang',     name: 'Kabupaten Serang',            type: 'kabupaten', hasData: false },
  { id: 'pandeglang',     name: 'Kabupaten Pandeglang',        type: 'kabupaten', hasData: false },
  { id: 'lebak',          name: 'Kabupaten Lebak',             type: 'kabupaten', hasData: false },
  { id: 'kab_tangerang',  name: 'Kabupaten Tangerang',         type: 'kabupaten', hasData: false },
  { id: 'cilegon',        name: 'Kota Cilegon',                type: 'kota',      hasData: false },
  { id: 'kota_serang',    name: 'Kota Serang',                 type: 'kota',      hasData: false },
  { id: 'kota_tangerang', name: 'Kota Tangerang',              type: 'kota',      hasData: false },
  { id: 'tangsel',        name: 'Kota Tangerang Selatan',      type: 'kota',      hasData: true  },
];

const COLORS: Record<string, string> = {
  kab:    '#e5e7eb',   // kabupaten default
  kota:   '#d1d5db',   // kota default
  active: '#fcd34d',   // has data
  hover:  '#fef08a',   // hovered
};

const hovered = ref<string | null>(null);
const hoveredRegion = computed(() => REGIONS.find(r => r.id === hovered.value) ?? null);

function regionFill(id: string): string {
  const r = REGIONS.find(r => r.id === id);
  if (!r) return COLORS.kab;
  if (hovered.value === id) return COLORS.hover;
  if (r.hasData)            return COLORS.active;
  return r.type === 'kota'  ? COLORS.kota : COLORS.kab;
}

function onRegionClick(id: string) {
  const r = REGIONS.find(r => r.id === id);
  if (r?.hasData) emit('subregion-click', id);
}

// ── Marker projection ────────────────────────────────────
// Banten SVG coordinate system:
//   viewBox 0 0 400 280
//   lon 105.0–106.9, lat -5.9–-7.1
const LNG_MIN = 105.0, LNG_RANGE = 1.9;  // → 400px
const LAT_MIN = -5.9,  LAT_RANGE = 1.2;  // → 280px

const validMarkers = computed(() => props.markers.filter(m => m.latitude != null && m.longitude != null));
function markerX(m: TimelineData) { return ((m.longitude! - LNG_MIN) / LNG_RANGE) * 400; }
function markerY(m: TimelineData) { return ((-LAT_MIN + m.latitude!) / LAT_RANGE) * 280; }
// y: (-5.9 - lat) / 1.2 * 280  →  at lat=-5.9, y=0; at lat=-7.1, y=280

// ── Zoom / Pan ───────────────────────────────────────────
const zoom = ref(1);
const panX = ref(0);
const panY = ref(0);
const MIN_ZOOM = 0.5, MAX_ZOOM = 8;
const isDragging = ref(false);
let lastX = 0, lastY = 0;
let lastPinchDist = 0;

function zoomIn()  { zoom.value = Math.min(MAX_ZOOM, zoom.value * 1.3); }
function zoomOut() { zoom.value = Math.max(MIN_ZOOM, zoom.value / 1.3); }
function reset()   { zoom.value = 1; panX.value = 0; panY.value = 0; }

function onMouseDown(e: MouseEvent) { isDragging.value = true; lastX = e.clientX; lastY = e.clientY; }
function onMouseMove(e: MouseEvent) {
  if (!isDragging.value) return;
  panX.value += (e.clientX - lastX) / zoom.value;
  panY.value += (e.clientY - lastY) / zoom.value;
  lastX = e.clientX; lastY = e.clientY;
}
function onWheel(e: WheelEvent) {
  zoom.value = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom.value * (e.deltaY < 0 ? 1.15 : 0.87)));
}
function onTouchStart(e: TouchEvent) {
  if (e.touches.length === 1) {
    isDragging.value = true; lastX = e.touches[0].clientX; lastY = e.touches[0].clientY;
  } else if (e.touches.length === 2) {
    lastPinchDist = Math.hypot(e.touches[1].clientX - e.touches[0].clientX, e.touches[1].clientY - e.touches[0].clientY);
  }
}
function onTouchMove(e: TouchEvent) {
  if (e.touches.length === 1 && isDragging.value) {
    panX.value += (e.touches[0].clientX - lastX) / zoom.value;
    panY.value += (e.touches[0].clientY - lastY) / zoom.value;
    lastX = e.touches[0].clientX; lastY = e.touches[0].clientY;
  } else if (e.touches.length === 2) {
    const d = Math.hypot(e.touches[1].clientX - e.touches[0].clientX, e.touches[1].clientY - e.touches[0].clientY);
    if (lastPinchDist > 0) zoom.value = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom.value * d / lastPinchDist));
    lastPinchDist = d;
  }
}
</script>

<style scoped>
.banten-wrap {
  display: flex; flex-direction: column; flex: 1; position: relative; min-height: 0;
}

/* Controls */
.bmap-controls {
  position: absolute; top: 8px; right: 10px; z-index: 5;
  display: flex; align-items: center; gap: 6px;
}
.bmap-btn {
  width: 34px; height: 34px;
  border: 2px solid #1a1a2e; border-radius: 6px;
  background: #fff; color: #1a1a2e; font-size: 0.82rem;
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  box-shadow: 2px 2px 0 #1a1a2e;
  transition: transform 0.08s, box-shadow 0.08s;
}
.bmap-btn:hover { transform: translate(-1px,-1px); box-shadow: 3px 3px 0 #1a1a2e; }
.bmap-btn:active { transform: translate(1px,1px); box-shadow: none; }
.bmap-zoom-lbl {
  font-family: 'Inter', monospace; font-size: 0.7rem; font-weight: 800;
  background: #ffdd00; border: 2px solid #1a1a2e; border-radius: 4px;
  padding: 2px 5px; color: #1a1a2e;
}

/* Canvas */
.bmap-canvas {
  flex: 1; overflow: hidden; cursor: grab; position: relative; min-height: 240px;
  background: #fffbf0;
  background-image: radial-gradient(circle, #fde68a 1px, transparent 1px);
  background-size: 28px 28px;
}
.bmap-canvas:active { cursor: grabbing; }
.bmap-svg { width: 100%; height: 100%; display: block; }

/* Region styles */
.bmap-region { cursor: default; }
.bmap-region.has-data { cursor: pointer; }
.bmap-region path { transition: fill 0.15s; }

/* Labels */
.bmap-label { font-family: 'Inter', sans-serif; font-size: 5px; font-weight: 700; text-anchor: middle; fill: #374151; }
.bmap-label--kab { font-size: 4.5px; fill: #6b7280; }
.bmap-label--kota { font-size: 4px; fill: #1a1a2e; }
.bmap-label--active { font-size: 4.5px; fill: #b45309; font-weight: 800; }
.bmap-label--hint { font-size: 4px; fill: #f59e0b; font-weight: 700; text-anchor: middle; }
.bmap-compass { font-family: 'Inter', sans-serif; font-size: 6px; font-weight: 800; fill: #1a1a2e; }

/* Markers */
.bmap-marker-group { cursor: pointer; }
.bmap-marker-dot { transition: r 0.12s; }
.bmap-marker-group:hover .bmap-marker-dot { r: 4; }
.bmap-marker-group:hover .bmap-marker-glow { r: 7; opacity: 0.4; }

/* Tooltip */
.bmap-tooltip {
  position: absolute; bottom: 14px; left: 50%; transform: translateX(-50%);
  background: #fff; border: 2px solid #1a1a2e; border-radius: 8px;
  box-shadow: 3px 3px 0 #1a1a2e; padding: 8px 14px;
  display: flex; flex-direction: column; align-items: center; gap: 2px;
  pointer-events: none; white-space: nowrap;
}
.bmap-tooltip.is-active { border-color: #f59e0b; box-shadow: 3px 3px 0 #f59e0b; }
.bmap-tt-badge { font-family:'Inter',sans-serif; font-size:0.6rem; font-weight:700; text-transform:uppercase; letter-spacing:0.08em; color:#9ca3af; }
.bmap-tt-name  { font-family:'Outfit',sans-serif; font-size:0.9rem; font-weight:800; color:#1a1a2e; }
.bmap-tt-cta   { font-family:'Inter',sans-serif; font-size:0.72rem; font-weight:700; color:#f59e0b; }
.bmap-tt-empty { font-family:'Inter',sans-serif; font-size:0.72rem; color:#9ca3af; }

.bmap-tt-enter-active { transition: opacity 0.15s, transform 0.15s; }
.bmap-tt-leave-active { transition: opacity 0.1s; }
.bmap-tt-enter-from { opacity: 0; transform: translateX(-50%) translateY(6px); }
.bmap-tt-leave-to   { opacity: 0; }
</style>
