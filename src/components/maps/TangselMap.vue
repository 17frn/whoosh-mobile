<template>
  <div class="tangsel-wrap">
    <!-- Zoom Controls -->
    <div class="tmap-controls">
      <button class="tmap-btn" @click="zoomIn"><i class="fa-solid fa-plus"></i></button>
      <span class="tmap-zoom-lbl">{{ Math.round(zoom * 100) }}%</span>
      <button class="tmap-btn" @click="zoomOut"><i class="fa-solid fa-minus"></i></button>
      <button class="tmap-btn" @click="reset"><i class="fa-solid fa-rotate-left"></i></button>
    </div>

    <!-- SVG Canvas -->
    <div
      class="tmap-canvas"
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
        Kota Tangerang Selatan SVG — viewBox 0 0 300 250
        Coordinate system:
          x → East  (0=west border Kab.Tangerang, 300=DKI Jakarta)
          y → South (0=north border Kota Tangerang, 250=south border Depok)

        7 Kecamatan:
          NW: Serpong Utara
          W:  Serpong
          NE: Pondok Aren (large, borders Jakarta)
          C:  Ciputat
          E:  Ciputat Timur (borders Jakarta)
          S:  Pamulang
          SE: Setu (small)

        Geography (rough):
          Serpong Utara & Serpong = western side (industrial/residential)
          Pondok Aren = northeast, borders DKI Jakarta to the north
          Ciputat & Ciputat Timur = center belt
          Pamulang = south, large residential
          Setu = small SE corner (newer kecamatan)
      -->
      <svg
        viewBox="0 0 300 250"
        class="tmap-svg"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="Peta Kota Tangerang Selatan"
      >
        <defs>
          <filter id="tmap-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="0" stdDeviation="1.5" flood-color="#fff" flood-opacity="0.9"/>
          </filter>
        </defs>

        <g :transform="`translate(${panX}, ${panY}) scale(${zoom})`">

          <!-- ══ 7 KECAMATAN PATHS ═══════════════════════════════════════ -->

          <!-- Serpong Utara — NW, industrial/Alam Sutera area -->
          <g class="tmap-region" :class="{ hovered: hovered==='serpong_utara' }"
             @mouseenter="hovered='serpong_utara'" @mouseleave="hovered=null"
             @click="onKecClick('serpong_utara')">
            <path d="M 5 5 L 108 5 L 108 108 L 5 108 Z"
              :fill="kecFill('serpong_utara')" stroke="#1a1a2e" stroke-width="0.8"/>
            <text x="56" y="52" class="tmap-label">Serpong</text>
            <text x="56" y="60" class="tmap-label">Utara</text>
          </g>

          <!-- Serpong — W, BSD City area -->
          <g class="tmap-region" :class="{ hovered: hovered==='serpong' }"
             @mouseenter="hovered='serpong'" @mouseleave="hovered=null"
             @click="onKecClick('serpong')">
            <path d="M 5 108 L 108 108 L 108 245 L 5 245 Z"
              :fill="kecFill('serpong')" stroke="#1a1a2e" stroke-width="0.8"/>
            <text x="56" y="172" class="tmap-label">Serpong</text>
          </g>

          <!-- Pondok Aren — NE, large, borders DKI Jakarta -->
          <g class="tmap-region" :class="{ hovered: hovered==='pondok_aren' }"
             @mouseenter="hovered='pondok_aren'" @mouseleave="hovered=null"
             @click="onKecClick('pondok_aren')">
            <path d="M 108 5 L 295 5 L 295 125 L 190 125 L 190 108 L 108 108 Z"
              :fill="kecFill('pondok_aren')" stroke="#1a1a2e" stroke-width="0.8"/>
            <text x="200" y="62" class="tmap-label">Pondok</text>
            <text x="200" y="70" class="tmap-label">Aren</text>
          </g>

          <!-- Ciputat — center, Ciputat town -->
          <g class="tmap-region" :class="{ hovered: hovered==='ciputat' }"
             @mouseenter="hovered='ciputat'" @mouseleave="hovered=null"
             @click="onKecClick('ciputat')">
            <path d="M 108 108 L 190 108 L 190 200 L 108 200 Z"
              :fill="kecFill('ciputat')" stroke="#1a1a2e" stroke-width="0.8"/>
            <text x="149" y="152" class="tmap-label">Ciputat</text>
          </g>

          <!-- Ciputat Timur — E, borders DKI Jakarta (Pesanggrahan) -->
          <g class="tmap-region" :class="{ hovered: hovered==='ciputat_timur' }"
             @mouseenter="hovered='ciputat_timur'" @mouseleave="hovered=null"
             @click="onKecClick('ciputat_timur')">
            <path d="M 190 125 L 295 125 L 295 205 L 190 205 L 190 200 Z"
              :fill="kecFill('ciputat_timur')" stroke="#1a1a2e" stroke-width="0.8"/>
            <text x="242" y="162" class="tmap-label">Ciputat</text>
            <text x="242" y="170" class="tmap-label">Timur</text>
          </g>

          <!-- Pamulang — S, large residential -->
          <g class="tmap-region" :class="{ hovered: hovered==='pamulang' }"
             @mouseenter="hovered='pamulang'" @mouseleave="hovered=null"
             @click="onKecClick('pamulang')">
            <path d="M 108 200 L 265 200 L 265 245 L 108 245 Z"
              :fill="kecFill('pamulang')" stroke="#1a1a2e" stroke-width="0.8"/>
            <text x="186" y="226" class="tmap-label">Pamulang</text>
          </g>

          <!-- Setu — SE, small/newer kecamatan -->
          <g class="tmap-region" :class="{ hovered: hovered==='setu' }"
             @mouseenter="hovered='setu'" @mouseleave="hovered=null"
             @click="onKecClick('setu')">
            <path d="M 265 205 L 295 205 L 295 245 L 265 245 Z"
              :fill="kecFill('setu')" stroke="#1a1a2e" stroke-width="0.8"/>
            <text x="280" y="228" class="tmap-label tmap-label--sm">Setu</text>
          </g>

          <!-- ══ BORDER LABELS ════════════════════════════════════════════ -->
          <!-- DKI Jakarta border (right) -->
          <text x="297" y="65" class="tmap-border-label" transform="rotate(90, 297, 65)">← DKI Jakarta</text>
          <!-- Kota Tangerang border (top) -->
          <text x="150" y="4" class="tmap-border-label" text-anchor="middle">Kota Tangerang ↑</text>
          <!-- Kab. Tangerang border (left) -->
          <text x="4" y="130" class="tmap-border-label" transform="rotate(-90, 4, 130)">← Kab. Tangerang</text>
          <!-- Depok border (bottom) -->
          <text x="150" y="249" class="tmap-border-label" text-anchor="middle">↓ Depok (Jawa Barat)</text>

          <!-- ══ COMPASS ══════════════════════════════════════════════════ -->
          <g transform="translate(25, 230)">
            <circle cx="0" cy="0" r="10" fill="#fff" stroke="#1a1a2e" stroke-width="0.8"/>
            <text x="0" y="-13" class="tmap-compass" text-anchor="middle">N</text>
            <line x1="0" y1="-8" x2="0" y2="8" stroke="#1a1a2e" stroke-width="1"/>
            <line x1="-8" y1="0" x2="8" y2="0" stroke="#1a1a2e" stroke-width="0.8" stroke-dasharray="2,2"/>
            <polygon points="0,-8 -2,0 2,0" fill="#1a1a2e"/>
          </g>

          <!-- ══ MOMENT MARKERS ══════════════════════════════════════════ -->
          <g
            v-for="m in validMarkers"
            :key="m.id"
            class="tmap-marker-group"
            @click.stop="$emit('marker-click', m)"
          >
            <circle :cx="markerX(m)" :cy="markerY(m)" r="5" :fill="m.dotColor" opacity="0.25" class="tmap-marker-glow"/>
            <circle :cx="markerX(m)" :cy="markerY(m)" r="3" :fill="m.dotColor" stroke="#fff" stroke-width="0.8" class="tmap-marker-dot"/>
            <title>{{ m.title }} — {{ m.location }}</title>
          </g>

        </g>
      </svg>

      <!-- Hover Tooltip -->
      <Transition name="tmap-tt">
        <div v-if="hovered && hoveredKec" class="tmap-tooltip">
          <span class="tmap-tt-badge">Kecamatan</span>
          <span class="tmap-tt-name">{{ hoveredKec.name }}</span>
          <span class="tmap-tt-sub">{{ hoveredKec.note }}</span>
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
}>();

// ── Kecamatan metadata ──────────────────────────────────
interface KecMeta { id: string; name: string; note: string; color: string; }
const KECAMATAN: KecMeta[] = [
  { id: 'serpong_utara',  name: 'Serpong Utara',  note: 'Alam Sutera, Gading Serpong', color: '#bfdbfe' },
  { id: 'serpong',        name: 'Serpong',         note: 'BSD City, Pasar Modern',      color: '#bbf7d0' },
  { id: 'pondok_aren',    name: 'Pondok Aren',     note: 'Bintaro, Pondok Jaya',        color: '#fde68a' },
  { id: 'ciputat',        name: 'Ciputat',         note: 'Pusat kota lama',             color: '#ddd6fe' },
  { id: 'ciputat_timur',  name: 'Ciputat Timur',   note: 'Pisangan, Cempaka Putih',     color: '#fbcfe8' },
  { id: 'pamulang',       name: 'Pamulang',        note: 'Pamulang Barat/Timur',        color: '#fed7aa' },
  { id: 'setu',           name: 'Setu',            note: 'Muncul, Kranggan',            color: '#e5e7eb' },
];

const hovered = ref<string | null>(null);
const hoveredKec = computed(() => KECAMATAN.find(k => k.id === hovered.value) ?? null);

const KEC_ALPHA = 0.6;
function kecFill(id: string): string {
  const k = KECAMATAN.find(k => k.id === id);
  return hovered.value === id ? '#ffdd00' : (k?.color ?? '#e5e7eb');
}

function onKecClick(id: string) {
  // Future: emit kecamatan click for further drill-down
  hovered.value = id;
}

// ── Marker projection ────────────────────────────────────
// Tangsel SVG: 300x250
// Lat/lng bounds (approximate):
//   Lng: 106.62–106.78 → 300px
//   Lat: -6.19–-6.37  → 250px
const LNG_MIN = 106.62, LNG_RANGE = 0.16;
const LAT_MIN = -6.19,  LAT_RANGE = 0.18;

const validMarkers = computed(() => props.markers.filter(m => m.latitude != null && m.longitude != null));
function markerX(m: TimelineData) { return ((m.longitude! - LNG_MIN) / LNG_RANGE) * 300; }
function markerY(m: TimelineData) { return ((m.latitude! - LAT_MIN) / LAT_RANGE) * 250; }

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
  if (e.touches.length === 1) { isDragging.value = true; lastX = e.touches[0].clientX; lastY = e.touches[0].clientY; }
  else if (e.touches.length === 2) lastPinchDist = Math.hypot(e.touches[1].clientX - e.touches[0].clientX, e.touches[1].clientY - e.touches[0].clientY);
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
.tangsel-wrap { display:flex; flex-direction:column; flex:1; position:relative; min-height:0; }

/* Controls */
.tmap-controls {
  position:absolute; top:8px; right:10px; z-index:5;
  display:flex; align-items:center; gap:6px;
}
.tmap-btn {
  width:34px; height:34px;
  border:2px solid #1a1a2e; border-radius:6px;
  background:#fff; color:#1a1a2e; font-size:0.82rem;
  cursor:pointer; display:flex; align-items:center; justify-content:center;
  box-shadow:2px 2px 0 #1a1a2e; transition:transform 0.08s, box-shadow 0.08s;
}
.tmap-btn:hover { transform:translate(-1px,-1px); box-shadow:3px 3px 0 #1a1a2e; }
.tmap-btn:active { transform:translate(1px,1px); box-shadow:none; }
.tmap-zoom-lbl {
  font-family:'Inter',monospace; font-size:0.7rem; font-weight:800;
  background:#ffdd00; border:2px solid #1a1a2e; border-radius:4px;
  padding:2px 5px; color:#1a1a2e;
}

/* Canvas */
.tmap-canvas {
  flex:1; overflow:hidden; cursor:grab; position:relative; min-height:240px;
  background:#fffbf0;
  background-image:radial-gradient(circle, #fde68a 1px, transparent 1px);
  background-size:24px 24px;
}
.tmap-canvas:active { cursor:grabbing; }
.tmap-svg { width:100%; height:100%; display:block; }

/* Region */
.tmap-region { cursor:pointer; }
.tmap-region path { transition:fill 0.15s; }
.tmap-region.hovered path { stroke-width:1.5; }

/* Labels */
.tmap-label {
  font-family:'Inter',sans-serif; font-size:7px; font-weight:700;
  fill:#374151; text-anchor:middle; pointer-events:none;
}
.tmap-label--sm { font-size:5.5px; }
.tmap-border-label {
  font-family:'Inter',sans-serif; font-size:4.5px; font-weight:600;
  fill:#9ca3af; pointer-events:none;
}
.tmap-compass { font-family:'Inter',sans-serif; font-size:6px; font-weight:800; fill:#1a1a2e; }

/* Markers */
.tmap-marker-group { cursor:pointer; }
.tmap-marker-dot { transition:r 0.12s; }
.tmap-marker-group:hover .tmap-marker-dot { r:5; }
.tmap-marker-group:hover .tmap-marker-glow { r:9; opacity:0.4; }

/* Tooltip */
.tmap-tooltip {
  position:absolute; bottom:14px; left:50%; transform:translateX(-50%);
  background:#fff; border:2px solid #1a1a2e; border-radius:8px;
  box-shadow:3px 3px 0 #1a1a2e; padding:8px 14px;
  display:flex; flex-direction:column; align-items:center; gap:2px;
  pointer-events:none; white-space:nowrap;
}
.tmap-tt-badge { font-family:'Inter',sans-serif; font-size:0.6rem; font-weight:700; text-transform:uppercase; letter-spacing:0.08em; color:#9ca3af; }
.tmap-tt-name  { font-family:'Outfit',sans-serif; font-size:0.9rem; font-weight:800; color:#1a1a2e; }
.tmap-tt-sub   { font-family:'Inter',sans-serif; font-size:0.72rem; color:#6b7280; }

.tmap-tt-enter-active { transition:opacity 0.15s, transform 0.15s; }
.tmap-tt-leave-active { transition:opacity 0.1s; }
.tmap-tt-enter-from { opacity:0; transform:translateX(-50%) translateY(6px); }
.tmap-tt-leave-to   { opacity:0; }
</style>
