<template>
  <div class="pmap-viewer">
    <!-- Zoom Controls -->
    <div class="pmap-controls">
      <button class="pmap-ctrl-btn" @click="zoomIn" aria-label="Zoom In"><i class="fa-solid fa-plus"></i></button>
      <span class="pmap-zoom-label">{{ Math.round(zoom * 100) }}%</span>
      <button class="pmap-ctrl-btn" @click="zoomOut" aria-label="Zoom Out"><i class="fa-solid fa-minus"></i></button>
      <button class="pmap-ctrl-btn" @click="reset" aria-label="Reset"><i class="fa-solid fa-rotate-left"></i></button>
    </div>

    <!-- SVG Canvas -->
    <div
      class="pmap-canvas"
      ref="canvasRef"
      @wheel.prevent="onWheel"
      @mousedown="onMouseDown"
      @mousemove="onMouseMove"
      @mouseup="onMouseUp"
      @mouseleave="onMouseUp"
      @touchstart="onTouchStart"
      @touchmove="onTouchMove"
      @touchend="onTouchEnd"
    >
      <svg :viewBox="viewBox" class="pmap-svg" xmlns="http://www.w3.org/2000/svg">
        <g :transform="`translate(${panX}, ${panY}) scale(${zoom})`">

          <!-- Province base shape -->
          <path
            :d="province.svgPath"
            fill="#fef3c7"
            stroke="#1a1a2e"
            stroke-width="0.4"
            stroke-linejoin="round"
          />

          <!-- Sub-region overlay (kabupaten/kota boundaries) -->
          <template v-if="province.subRegions">
            <g
              v-for="sub in province.subRegions"
              :key="sub.id"
              class="pmap-subregion-group"
              :class="{ 'has-data': sub.hasData, 'is-hovered': hoveredSubRegion === sub.id }"
              @mouseenter="hoveredSubRegion = sub.id"
              @mouseleave="hoveredSubRegion = null"
              @click.stop="onSubRegionClick(sub)"
            >
              <path
                :d="sub.svgPath"
                :fill="subRegionFill(sub)"
                :stroke="sub.hasData ? '#1a1a2e' : '#94a3b8'"
                :stroke-width="hoveredSubRegion === sub.id ? 0.4 : 0.25"
                stroke-linejoin="round"
                fill-opacity="0.75"
              />
              <!-- Label for sub-region (shows at higher zoom) -->
              <text
                v-if="zoom >= 1.5"
                :x="getSubRegionLabelPos(sub).x"
                :y="getSubRegionLabelPos(sub).y"
                class="pmap-sublabel"
                :font-size="sub.type === 'kota' ? '0.6' : '0.7'"
                text-anchor="middle"
                dominant-baseline="middle"
                :fill="sub.hasData ? '#1a1a2e' : '#6b7280'"
                pointer-events="none"
              >{{ sub.name.replace('Kabupaten ', 'Kab. ').replace('Kota ', '') }}</text>
            </g>
          </template>

          <!-- Moment markers -->
          <g
            v-for="marker in validMarkers"
            :key="marker.id"
            class="pmap-marker-group"
            @click.stop="$emit('marker-click', marker)"
          >
            <circle
              :cx="getMarkerPos(marker).x"
              :cy="getMarkerPos(marker).y"
              r="2.2"
              :fill="marker.dotColor"
              opacity="0.3"
              class="pmap-marker-glow"
            />
            <circle
              :cx="getMarkerPos(marker).x"
              :cy="getMarkerPos(marker).y"
              r="1.4"
              :fill="marker.dotColor"
              stroke="#fff"
              stroke-width="0.5"
              class="pmap-marker"
            />
            <title>{{ marker.title }} — {{ marker.location }}</title>
          </g>

        </g>
      </svg>

      <!-- Hover tooltip for sub-region -->
      <Transition name="sub-tooltip">
        <div
          v-if="hoveredSubRegion && hoveredSubTooltip"
          class="pmap-sub-tooltip"
          :class="{ 'has-data': hoveredSubTooltip.hasData }"
        >
          <span class="pmap-sub-tooltip-type">{{ hoveredSubTooltip.type === 'kota' ? 'Kota' : 'Kabupaten' }}</span>
          <span class="pmap-sub-tooltip-name">{{ hoveredSubTooltip.name }}</span>
          <span v-if="hoveredSubTooltip.hasData" class="pmap-sub-tooltip-cta">Klik untuk lihat →</span>
          <span v-else class="pmap-sub-tooltip-empty">Belum ada momen</span>
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { ProvinceMapData, SubRegionData } from '../../data/provinceMaps';
import { latLngToSVG } from '../../data/provinceMaps';
import type { TimelineData } from '../../data/timeline';

const props = defineProps<{
  province: ProvinceMapData;
  markers: TimelineData[];
}>();

const emit = defineEmits<{
  (e: 'marker-click', item: TimelineData): void;
  (e: 'subregion-click', sub: SubRegionData): void;
}>();

// ── Zoom / Pan ──────────────────────────────────
const zoom   = ref(1);
const panX   = ref(0);
const panY   = ref(0);
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 8;

// Reset zoom/pan when province changes
watch(() => props.province.id, () => { zoom.value = 1; panX.value = 0; panY.value = 0; });

const viewBox = computed(() => {
  const b = props.province.bounds;
  const pad = Math.max(b.width, b.height) * 0.3;
  return `${b.x - pad} ${b.y - pad} ${b.width + pad * 2} ${b.height + pad * 2}`;
});

function zoomIn()  { zoom.value = Math.min(MAX_ZOOM, zoom.value * 1.3); }
function zoomOut() { zoom.value = Math.max(MIN_ZOOM, zoom.value / 1.3); }
function reset()   { zoom.value = 1; panX.value = 0; panY.value = 0; }

// ── Mouse drag ──────────────────────────────────
const isDragging = ref(false);
let lastX = 0, lastY = 0;
function onMouseDown(e: MouseEvent) { isDragging.value = true; lastX = e.clientX; lastY = e.clientY; }
function onMouseMove(e: MouseEvent) {
  if (!isDragging.value) return;
  panX.value += (e.clientX - lastX) / zoom.value;
  panY.value += (e.clientY - lastY) / zoom.value;
  lastX = e.clientX; lastY = e.clientY;
}
function onMouseUp() { isDragging.value = false; }
function onWheel(e: WheelEvent) {
  const factor = e.deltaY < 0 ? 1.15 : 0.87;
  zoom.value = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom.value * factor));
}

// ── Touch drag + pinch ──────────────────────────
let lastTouch1 = { x: 0, y: 0 };
let lastTouch2 = { x: 0, y: 0 };
let lastPinchDist = 0;

function onTouchStart(e: TouchEvent) {
  if (e.touches.length === 1) {
    isDragging.value = true;
    lastX = e.touches[0].clientX; lastY = e.touches[0].clientY;
  } else if (e.touches.length === 2) {
    lastTouch1 = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    lastTouch2 = { x: e.touches[1].clientX, y: e.touches[1].clientY };
    lastPinchDist = Math.hypot(lastTouch2.x - lastTouch1.x, lastTouch2.y - lastTouch1.y);
  }
}
function onTouchMove(e: TouchEvent) {
  e.preventDefault();
  if (e.touches.length === 1 && isDragging.value) {
    panX.value += (e.touches[0].clientX - lastX) / zoom.value;
    panY.value += (e.touches[0].clientY - lastY) / zoom.value;
    lastX = e.touches[0].clientX; lastY = e.touches[0].clientY;
  } else if (e.touches.length === 2) {
    const dist = Math.hypot(e.touches[1].clientX - e.touches[0].clientX, e.touches[1].clientY - e.touches[0].clientY);
    if (lastPinchDist > 0) zoom.value = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom.value * (dist / lastPinchDist)));
    lastPinchDist = dist;
  }
}
function onTouchEnd() { isDragging.value = false; lastPinchDist = 0; }

// ── Markers ─────────────────────────────────────
const validMarkers = computed(() =>
  props.markers.filter(m => m.latitude != null && m.longitude != null)
);
function getMarkerPos(m: TimelineData) {
  return latLngToSVG(m.latitude!, m.longitude!, props.province.bounds);
}

// ── Sub-region ──────────────────────────────────
const hoveredSubRegion = ref<string | null>(null);
const hoveredSubTooltip = computed(() =>
  props.province.subRegions?.find(s => s.id === hoveredSubRegion.value) ?? null
);

// Sub-region color palette by type and state
const KOTA_ACTIVE_FILL   = '#fcd34d';  // amber-300 — Kota with data
const KOTA_FILL          = '#e5e7eb';  // gray-200  — Kota placeholder
const KAB_FILL           = '#f3f4f6';  // gray-100  — Kabupaten placeholder
const HOVER_FILL         = '#fef08a';  // yellow-200

function subRegionFill(sub: SubRegionData): string {
  if (hoveredSubRegion.value === sub.id) return HOVER_FILL;
  if (sub.hasData) return KOTA_ACTIVE_FILL;
  return sub.type === 'kota' ? KOTA_FILL : KAB_FILL;
}

function getSubRegionLabelPos(sub: SubRegionData) {
  return latLngToSVG(sub.center.lat, sub.center.lng, props.province.bounds);
}

function onSubRegionClick(sub: SubRegionData) {
  if (sub.hasData) emit('subregion-click', sub);
}
</script>

<style scoped>
.pmap-viewer {
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: 0;
  min-height: 0;
  position: relative;
}

/* Controls */
.pmap-controls {
  display: flex;
  align-items: center;
  gap: 6px;
  justify-content: flex-end;
  padding: 8px 10px 0;
  position: absolute;
  top: 0;
  right: 0;
  z-index: 5;
}
.pmap-ctrl-btn {
  width: 34px; height: 34px;
  border: 2px solid #1a1a2e;
  border-radius: 6px;
  background: #fff;
  color: #1a1a2e;
  font-size: 0.82rem;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 2px 2px 0 #1a1a2e;
  transition: transform 0.08s, box-shadow 0.08s;
}
.pmap-ctrl-btn:hover { transform: translate(-1px,-1px); box-shadow: 3px 3px 0 #1a1a2e; }
.pmap-ctrl-btn:active { transform: translate(1px,1px); box-shadow: 0 0 0 #1a1a2e; }

.pmap-zoom-label {
  font-family: 'Inter', monospace;
  font-size: 0.7rem;
  font-weight: 800;
  color: #1a1a2e;
  min-width: 36px;
  text-align: center;
  background: #ffdd00;
  border: 2px solid #1a1a2e;
  border-radius: 4px;
  padding: 2px 4px;
}

/* Canvas */
.pmap-canvas {
  flex: 1;
  background: #fffbf0;
  overflow: hidden;
  cursor: grab;
  position: relative;
  min-height: 240px;
  background-image: radial-gradient(circle, #fde68a 1px, transparent 1px);
  background-size: 28px 28px;
}
.pmap-canvas:active { cursor: grabbing; }

.pmap-svg { width: 100%; height: 100%; display: block; }

/* Sub-region */
.pmap-subregion-group { cursor: default; }
.pmap-subregion-group.has-data { cursor: pointer; }
.pmap-subregion-group path { transition: fill 0.15s, stroke-width 0.1s; }

.pmap-sublabel {
  font-family: 'Inter', sans-serif;
  font-weight: 700;
  pointer-events: none;
}

/* Markers */
.pmap-marker-group { cursor: pointer; }
.pmap-marker { transition: r 0.15s; }
.pmap-marker-group:hover .pmap-marker { r: 2.4; }
.pmap-marker-glow { transition: r 0.15s, opacity 0.15s; }
.pmap-marker-group:hover .pmap-marker-glow { r: 4; opacity: 0.4; }

/* Sub-region tooltip */
.pmap-sub-tooltip {
  position: absolute;
  bottom: 14px;
  left: 50%;
  transform: translateX(-50%);
  background: #fff;
  border: 2px solid #1a1a2e;
  border-radius: 8px;
  box-shadow: 3px 3px 0 #1a1a2e;
  padding: 8px 14px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  pointer-events: none;
  white-space: nowrap;
}
.pmap-sub-tooltip.has-data { border-color: #f59e0b; box-shadow: 3px 3px 0 #f59e0b; }
.pmap-sub-tooltip-type {
  font-family: 'Inter', sans-serif;
  font-size: 0.62rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #9ca3af;
}
.pmap-sub-tooltip-name {
  font-family: 'Outfit', sans-serif;
  font-size: 0.9rem;
  font-weight: 800;
  color: #1a1a2e;
}
.pmap-sub-tooltip-cta {
  font-family: 'Inter', sans-serif;
  font-size: 0.72rem;
  font-weight: 700;
  color: #f59e0b;
}
.pmap-sub-tooltip-empty {
  font-family: 'Inter', sans-serif;
  font-size: 0.72rem;
  color: #9ca3af;
}

.sub-tooltip-enter-active { transition: opacity 0.15s, transform 0.15s; }
.sub-tooltip-leave-active { transition: opacity 0.1s; }
.sub-tooltip-enter-from { opacity: 0; transform: translateX(-50%) translateY(6px); }
.sub-tooltip-leave-to   { opacity: 0; }
</style>
