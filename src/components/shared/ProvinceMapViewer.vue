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
      <svg
        :viewBox="viewBox"
        class="pmap-svg"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g :transform="`translate(${panX}, ${panY}) scale(${zoom})`">
          <!-- Province shape -->
          <path
            :d="province.svgPath"
            fill="#fde68a"
            stroke="#1a1a2e"
            stroke-width="0.5"
            stroke-linejoin="round"
          />

          <!-- Markers -->
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
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { ProvinceMapData } from '../../data/provinceMaps';
import { latLngToSVG } from '../../data/provinceMaps';
import type { TimelineData } from '../../data/timeline';

const props = defineProps<{
  province: ProvinceMapData;
  markers: TimelineData[];
}>();

defineEmits<{
  (e: 'marker-click', item: TimelineData): void;
}>();

// ── Zoom / Pan State ───────────────────────────
const zoom   = ref(1);
const panX   = ref(0);
const panY   = ref(0);
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 5;

const viewBox = computed(() => {
  const b = props.province.bounds;
  // Add 30% padding around province bounds
  const pad = Math.max(b.width, b.height) * 0.3;
  return `${b.x - pad} ${b.y - pad} ${b.width + pad * 2} ${b.height + pad * 2}`;
});

function zoomIn()  { zoom.value = Math.min(MAX_ZOOM, zoom.value * 1.3); }
function zoomOut() { zoom.value = Math.max(MIN_ZOOM, zoom.value / 1.3); }
function reset()   { zoom.value = 1; panX.value = 0; panY.value = 0; }

// ── Mouse drag ─────────────────────────────────
const isDragging = ref(false);
let lastX = 0, lastY = 0;
function onMouseDown(e: MouseEvent) {
  isDragging.value = true;
  lastX = e.clientX; lastY = e.clientY;
}
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

// ── Touch drag + pinch zoom ────────────────────
let lastTouch1 = { x: 0, y: 0 };
let lastTouch2 = { x: 0, y: 0 };
let lastPinchDist = 0;

function onTouchStart(e: TouchEvent) {
  if (e.touches.length === 1) {
    isDragging.value = true;
    lastX = e.touches[0].clientX;
    lastY = e.touches[0].clientY;
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
    lastX = e.touches[0].clientX;
    lastY = e.touches[0].clientY;
  } else if (e.touches.length === 2) {
    const dist = Math.hypot(
      e.touches[1].clientX - e.touches[0].clientX,
      e.touches[1].clientY - e.touches[0].clientY
    );
    if (lastPinchDist > 0) {
      zoom.value = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom.value * (dist / lastPinchDist)));
    }
    lastPinchDist = dist;
  }
}
function onTouchEnd() { isDragging.value = false; lastPinchDist = 0; }

// ── Markers ────────────────────────────────────
const validMarkers = computed(() =>
  props.markers.filter(m => m.latitude != null && m.longitude != null)
);

function getMarkerPos(marker: TimelineData) {
  return latLngToSVG(marker.latitude!, marker.longitude!, props.province.bounds);
}
</script>

<style scoped>
.pmap-viewer {
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: 10px;
  min-height: 0;
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
  color: #374151;
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
  /* dot grid pattern */
  background-image: radial-gradient(circle, #fde68a 1px, transparent 1px);
  background-size: 28px 28px;
}
.pmap-canvas:active { cursor: grabbing; }

.pmap-svg {
  width: 100%;
  height: 100%;
  display: block;
}

/* Markers */
.pmap-marker-group { cursor: pointer; }
.pmap-marker { transition: r 0.15s; }
.pmap-marker-group:hover .pmap-marker { r: 2.4; }
.pmap-marker-glow { transition: r 0.15s, opacity 0.15s; }
.pmap-marker-group:hover .pmap-marker-glow { r: 4; opacity: 0.4; }
</style>
