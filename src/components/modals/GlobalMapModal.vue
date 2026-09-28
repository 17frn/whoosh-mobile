<template>
  <dialog ref="mapDialog" class="map-dialog" @click="onDialogClick" @close="onDialogClose">
    <div class="dialog-content">
      <button class="close-btn" @click="closeMap" aria-label="Tutup Peta">
        <i class="fa-solid fa-xmark"></i>
      </button>

      <div class="map-container-wrapper">
        <h2 class="map-title">Peta Perjalanan</h2>
        <p class="map-subtitle">Titik lokasi tempat yang pernah dikunjungi. Klik provinsi untuk fokus.</p>

        <div class="map-controls">
          <button @click="zoomIn" class="control-btn" aria-label="Zoom In"><i class="fa-solid fa-plus"></i></button>
          <button @click="zoomOut" class="control-btn" aria-label="Zoom Out"><i class="fa-solid fa-minus"></i></button>
          <button @click="resetView" class="control-btn" aria-label="Reset"><i class="fa-solid fa-rotate-left"></i></button>
        </div>

        <div
          class="svg-canvas"
          ref="svgCanvas"
          @wheel.prevent="onWheel"
          @mousedown="onMouseDown"
          @mousemove="onMouseMove"
          @mouseup="onMouseUp"
          @mouseleave="onMouseUp"
          @touchstart="onTouchStart"
          @touchmove="onTouchMove"
          @touchend="onTouchEnd"
        >
          <IndonesiaMapSVG
            :markers="markers"
            :view-scale="viewScale"
            :view-box="currentViewBox"
            @focus-province="handleFocusProvince"
            @marker-click="handleMarkerClick"
          />

          <!-- Marker Popup -->
          <Transition name="popup">
            <div v-if="activeMarker" class="marker-popup split-layout" :style="popupStyle" @mousedown.stop>
              
              <!-- Left Pane -->
              <div class="popup-left">
                <div class="popup-map-icon">
                  <i class="fa-regular fa-map"></i>
                </div>
                <div class="popup-info">
                  <h3 class="popup-title">{{ activeMarker.title }}</h3>
                  <p class="popup-location">
                    <i class="fa-solid fa-location-dot"></i>
                    {{ activeMarker.location }}
                  </p>
                  <button class="popup-detail-btn" @click="navigateToDetail(activeMarker)">
                    Lihat Detail Momen &rarr;
                  </button>
                </div>
                <div class="popup-date-row">
                  <i class="fa-regular fa-calendar"></i>
                  <span>{{ activeMarker.date }}</span>
                </div>
                
                <!-- Center Overlap Button -->
                <div class="popup-accent-icon" aria-hidden="true">
                  <i class="ph-duotone ph-airplane-tilt"></i>
                </div>
              </div>

              <!-- Right Pane -->
              <div class="popup-right">
                <button class="popup-close" @click.stop="activeMarker = null" aria-label="Tutup">
                  <i class="fa-solid fa-xmark"></i>
                </button>
                
                <!-- Photos label -->
                <div class="popup-photos-label">
                  <div class="label-icon"><i class="fa-regular fa-images"></i></div> MOMEN
                </div>

                <!-- Photo Grid -->
                <div class="popup-photos" v-if="activeMarker.moments && activeMarker.moments.length">
                  <div
                    v-for="(moment, idx) in activeMarker.moments.slice(0, 4)"
                    :key="idx"
                    class="popup-photo"
                  >
                    <img :src="moment.image" :alt="moment.description" loading="lazy" />
                    <div class="popup-photo-caption">{{ moment.description }}</div>
                  </div>
                </div>
              </div>

            </div>
          </Transition>
        </div>
      </div>
    </div>
  </dialog>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import IndonesiaMapSVG from '../shared/IndonesiaMapSVG.vue';

const props = defineProps({
  isOpen: { type: Boolean, default: false },
  markers: { type: Array, default: () => [] }
});

const emit = defineEmits(['close']);

const mapDialog = ref(null);
const svgCanvas = ref(null);

// ── Marker Popup ──────────────────────────────────────────────────────────────
const activeMarker = ref(null);
const popupClickPos = ref({ x: 0, y: 0 });

const popupStyle = computed(() => {
  return {
    left: popupClickPos.value.x + 'px',
    top: popupClickPos.value.y + 'px',
  };
});

const navigateToDetail = (marker) => {
  activeMarker.value = null;
  closeMap();
  window.dispatchEvent(new CustomEvent('open-timeline-detail', { detail: marker.id }));
};

function handleMarkerClick({ marker, event }) {
  activeMarker.value = marker;
  const canvas = svgCanvas.value;
  if (canvas) {
    const rect = canvas.getBoundingClientRect();
    
    const popupWidth = window.innerWidth <= 768 ? 320 : 480;
    const popupHeight = 350; // Estimasi batas maksimal tinggi popup

    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;

    let x = clickX + 16;
    let y = clickY + 16;

    if (x + popupWidth > rect.width) x = Math.max(12, clickX - popupWidth - 16);
    if (y + popupHeight > rect.height) y = Math.max(12, clickY - popupHeight - 16);

    popupClickPos.value = { x, y };
  }
}

// ── ViewBox state ─────────────────────────────────────────────────────────────
const FULL_VB = { x: 0, y: 0, w: 792.54596, h: 316.66394 };
const vb = ref({ ...FULL_VB });

const currentViewBox = computed(() =>
  `${vb.value.x} ${vb.value.y} ${vb.value.w} ${vb.value.h}`
);

// Scale relative to full view — used for inverse marker sizing
const viewScale = computed(() => FULL_VB.w / vb.value.w);

// ── Animation ─────────────────────────────────────────────────────────────────
let animFrame = null;

function animateViewBox(target, duration = 350) {
  activeMarker.value = null; // Tutup popup ketika map bernavigasi otomatis
  const start = { ...vb.value };
  const t0 = performance.now();
  cancelAnimationFrame(animFrame);

  function step(t) {
    const p = Math.min((t - t0) / duration, 1);
    const ease = p < 0.5 ? 2 * p * p : -1 + (4 - 2 * p) * p;
    vb.value = {
      x: start.x + (target.x - start.x) * ease,
      y: start.y + (target.y - start.y) * ease,
      w: start.w + (target.w - start.w) * ease,
      h: start.h + (target.h - start.h) * ease,
    };
    if (p < 1) animFrame = requestAnimationFrame(step);
  }
  animFrame = requestAnimationFrame(step);
}

// ── Click to focus province ───────────────────────────────────────────────────
function handleFocusProvince(pathEl) {
  const bbox = pathEl.getBBox();
  if (!bbox || bbox.width === 0) return;

  const padX = bbox.width * 0.2;
  const padY = bbox.height * 0.2;

  const canvas = svgCanvas.value;
  const canvasAspect = canvas ? canvas.clientWidth / canvas.clientHeight : FULL_VB.w / FULL_VB.h;

  let tw = bbox.width + padX * 2;
  let th = bbox.height + padY * 2;

  // Adjust to maintain canvas aspect ratio
  if (tw / th > canvasAspect) {
    th = tw / canvasAspect;
  } else {
    tw = th * canvasAspect;
  }

  const cx = bbox.x + bbox.width / 2;
  const cy = bbox.y + bbox.height / 2;

  animateViewBox({ x: cx - tw / 2, y: cy - th / 2, w: tw, h: th });
}

// ── Zoom controls ─────────────────────────────────────────────────────────────
function scaleViewBox(factor) {
  const cx = vb.value.x + vb.value.w / 2;
  const cy = vb.value.y + vb.value.h / 2;
  const aspect = FULL_VB.w / FULL_VB.h;
  const newW = Math.min(Math.max(vb.value.w * factor, 15), FULL_VB.w);
  const newH = newW / aspect;
  animateViewBox({ x: cx - newW / 2, y: cy - newH / 2, w: newW, h: newH });
}

const zoomIn  = () => scaleViewBox(0.65);
const zoomOut = () => scaleViewBox(1 / 0.65);
const resetView = () => animateViewBox({ ...FULL_VB });

// ── Wheel zoom (cursor as focal point) ───────────────────────────────────────
function onWheel(e) {
  activeMarker.value = null; // Tutup popup ketika user melakukan scroll zoom
  const factor = e.deltaY > 0 ? 1.12 : 0.88;
  const canvas = svgCanvas.value;
  if (!canvas) return;
  const rect = canvas.getBoundingClientRect();

  // Mouse position in SVG coordinate space
  const mx = vb.value.x + ((e.clientX - rect.left) / rect.width) * vb.value.w;
  const my = vb.value.y + ((e.clientY - rect.top) / rect.height) * vb.value.h;

  const aspect = FULL_VB.w / FULL_VB.h;
  const newW = Math.min(Math.max(vb.value.w * factor, 15), FULL_VB.w * 1.05);
  const newH = newW / aspect;

  // Keep the point under the cursor fixed
  const newX = mx - (mx - vb.value.x) * (newW / vb.value.w);
  const newY = my - (my - vb.value.y) * (newH / vb.value.h);

  cancelAnimationFrame(animFrame);
  vb.value = { x: newX, y: newY, w: newW, h: newH };
}

// ── Drag to pan ───────────────────────────────────────────────────────────────
let isDragging = false;
let dragStart = { mx: 0, my: 0, vbx: 0, vby: 0 };

function onMouseDown(e) {
  if (e.button !== 0) return;
  activeMarker.value = null; // Tutup popup ketika map ditarik/pan
  isDragging = true;
  cancelAnimationFrame(animFrame);
  dragStart = { mx: e.clientX, my: e.clientY, vbx: vb.value.x, vby: vb.value.y };
}

function onMouseMove(e) {
  if (!isDragging) return;
  const canvas = svgCanvas.value;
  const rect = canvas.getBoundingClientRect();
  const sx = vb.value.w / rect.width;
  const sy = vb.value.h / rect.height;
  vb.value = {
    ...vb.value,
    x: dragStart.vbx - (e.clientX - dragStart.mx) * sx,
    y: dragStart.vby - (e.clientY - dragStart.my) * sy,
  };
}

function onMouseUp() { isDragging = false; }

// ── Gestur Sentuh (Pan & Zoom Mobile) ─────────────────────────────────────────
let initialPinchDistance = null;
let initialPinchViewBox = null;
let pinchCenterSVG = null;

function getPinchDistance(touches) {
  const dx = touches[0].clientX - touches[1].clientX;
  const dy = touches[0].clientY - touches[1].clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

function getPinchCenter(touches) {
  return {
    clientX: (touches[0].clientX + touches[1].clientX) / 2,
    clientY: (touches[0].clientY + touches[1].clientY) / 2,
  };
}

function onTouchStart(e) {
  activeMarker.value = null; // Tutup popup ketika map berinteraksi
  cancelAnimationFrame(animFrame);

  if (e.touches.length === 1) {
    // Panning 1 jari
    isDragging = true;
    dragStart = { mx: e.touches[0].clientX, my: e.touches[0].clientY, vbx: vb.value.x, vby: vb.value.y };
  } else if (e.touches.length === 2) {
    // Zooming 2 jari
    isDragging = false;
    initialPinchDistance = getPinchDistance(e.touches);
    initialPinchViewBox = { ...vb.value };

    const center = getPinchCenter(e.touches);
    const canvas = svgCanvas.value;
    const rect = canvas.getBoundingClientRect();

    // Titik pusat (focal point) di antara dua jari dalam koordinat SVG
    pinchCenterSVG = {
      x: vb.value.x + ((center.clientX - rect.left) / rect.width) * vb.value.w,
      y: vb.value.y + ((center.clientY - rect.top) / rect.height) * vb.value.h
    };
  }
}

function onTouchMove(e) {
  e.preventDefault(); // Mencegah pull-to-refresh & scroll layer utama
  const canvas = svgCanvas.value;
  if (!canvas) return;
  const rect = canvas.getBoundingClientRect();

  if (e.touches.length === 1 && isDragging) {
    const sx = vb.value.w / rect.width;
    const sy = vb.value.h / rect.height;
    vb.value = {
      ...vb.value,
      x: dragStart.vbx - (e.touches[0].clientX - dragStart.mx) * sx,
      y: dragStart.vby - (e.touches[0].clientY - dragStart.my) * sy,
    };
  } else if (e.touches.length === 2 && initialPinchDistance) {
    const currentDistance = getPinchDistance(e.touches);
    if (currentDistance === 0) return;

    // Hitung skala berdasarkan pembesaran/pengecilan jarak jari
    const zoomFactor = initialPinchDistance / currentDistance;
    const aspect = FULL_VB.w / FULL_VB.h;

    let newW = initialPinchViewBox.w * zoomFactor;
    newW = Math.min(Math.max(newW, 15), FULL_VB.w * 1.05); // Pembatasan maksimal zoom
    const newH = newW / aspect;

    // Atur ulang X & Y agar titik tengah di bawah jari tetap tidak bergeser
    const actualZoomFactor = newW / initialPinchViewBox.w;
    const newX = pinchCenterSVG.x - (pinchCenterSVG.x - initialPinchViewBox.x) * actualZoomFactor;
    const newY = pinchCenterSVG.y - (pinchCenterSVG.y - initialPinchViewBox.y) * actualZoomFactor;

    vb.value = { x: newX, y: newY, w: newW, h: newH };
  }
}

function onTouchEnd(e) {
  if (e.touches.length < 2) {
    initialPinchDistance = null;
  }
  if (e.touches.length === 1) {
    // Transisi mulus kembali ke panning bila satu jari dilepas
    isDragging = true;
    dragStart = { mx: e.touches[0].clientX, my: e.touches[0].clientY, vbx: vb.value.x, vby: vb.value.y };
  } else if (e.touches.length === 0) {
    isDragging = false;
  }
}

// ── Dialog ────────────────────────────────────────────────────────────────────
const openMap = () => {
  if (mapDialog.value && !mapDialog.value.open) {
    mapDialog.value.showModal();
    document.documentElement.classList.add('modal-open');
    vb.value = { ...FULL_VB };
    activeMarker.value = null;
  }
};

const closeMap = () => {
  if (mapDialog.value && mapDialog.value.open) mapDialog.value.close();
};

const onDialogClick = (e) => { if (e.target === mapDialog.value) closeMap(); };
const onDialogClose = () => {
  document.documentElement.classList.remove('modal-open');
  emit('close');
};

onMounted(() => {
  window.addEventListener('open-global-map', openMap);
});

onBeforeUnmount(() => {
  window.removeEventListener('open-global-map', openMap);
  cancelAnimationFrame(animFrame);
});

defineExpose({ openMap });
</script>

<style scoped>
.map-dialog {
  border: none;
  border-radius: 20px;
  padding: 0;
  background: transparent;
  max-width: 95vw;
  width: 1000px;
  max-height: 95vh;
  overflow: hidden;
}

.map-dialog::backdrop {
  background: rgba(30, 20, 60, 0.6);
  backdrop-filter: blur(6px);
}

.dialog-content {
  position: relative;
  width: 100%;
  background-color: #ffffff;
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.2);
}

.close-btn {
  position: absolute;
  top: -14px;
  right: -14px;
  background: #f43f5e;
  color: white;
  border: none;
  border-radius: 50%;
  width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 1.1rem;
  box-shadow: 0 4px 12px rgba(244, 63, 94, 0.4);
  transition: all 0.2s ease;
  z-index: 10;
}

.close-btn:hover { transform: scale(1.1); }

.map-container-wrapper {
  position: relative;
  display: flex;
  flex-direction: column;
  height: calc(90vh - 48px);
  min-height: 500px;
  background: #f8fafc;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid var(--border-light);
}

.map-title {
  margin: 20px 20px 5px 20px;
  font-size: 1.5rem;
  color: var(--text-main);
}

.map-subtitle {
  margin: 0 20px 10px 20px;
  font-size: 0.9rem;
  color: var(--text-muted);
}

.map-controls {
  position: absolute;
  bottom: 20px;
  right: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 5;
}

.control-btn {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background-color: white;
  border: 1px solid var(--border-light);
  color: var(--text-main);
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.control-btn:hover {
  background-color: var(--bg-color);
  transform: scale(1.05);
}

.svg-canvas {
  position: relative;
  flex: 1;
  width: 100%;
  overflow: hidden;
  cursor: grab;
  user-select: none;
  touch-action: none; /* Mencegah bentrok dengan scroll/refresh default browser di HP */
}

.svg-canvas:active { cursor: grabbing; }

/* ── Marker Popup (Calm Split Layout) ──────────────────────────────────── */
.marker-popup.split-layout {
  position: absolute;
  z-index: 20;
  width: 480px;
  display: flex;
  background: #FAFAFA;
  border-radius: 24px;
  border: none;
  box-shadow:
    0 10px 30px rgba(0, 0, 0, 0.08),
    0 20px 40px rgba(0, 0, 0, 0.12);
  pointer-events: all;
}

/* -- Left Pane -- */
.popup-left {
  width: 42%;
  background: #6B8A7A; /* Calm Sage Green */
  border-radius: 24px 0 0 24px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  color: #ffffff;
  position: relative;
  z-index: 2;
}

.popup-map-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.3rem;
  margin-bottom: 24px;
}

.popup-info {
  margin-bottom: 24px;
  flex-grow: 1;
}

.popup-title {
  font-size: 1.25rem;
  font-weight: 800;
  margin: 0 0 8px;
  line-height: 1.2;
  text-shadow: 0 1px 2px rgba(0,0,0,0.1);
}

.popup-location {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0;
}

.popup-date-row {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 0.75rem;
  font-weight: 700;
  color: #6B8A7A;
  background: #ffffff;
  border-radius: 20px;
  padding: 6px 14px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  align-self: flex-start;
}

.popup-detail-btn {
  background: white;
  color: #6B8A7A;
  border: none;
  border-radius: 12px;
  padding: 8px 12px;
  font-weight: 700;
  font-size: 0.8rem;
  margin-top: 12px;
  cursor: pointer;
  font-family: 'Inter', sans-serif;
  transition: all 0.2s ease;
  align-self: flex-start;
}

.popup-detail-btn:hover {
  background: rgba(255, 255, 255, 0.9);
  transform: translateY(-1px);
}

/* -- Center Overlap Button -- */
.popup-accent-icon {
  position: absolute;
  top: 50%;
  right: -20px;
  transform: translateY(-50%);
  width: 40px;
  height: 40px;
  background: #ffffff;
  border: 2px solid #6B8A7A;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6B8A7A;
  font-size: 1rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 3;
}

/* -- Right Pane -- */
.popup-right {
  width: 58%;
  padding: 24px;
  position: relative;
  display: flex;
  flex-direction: column;
}

.popup-close {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #E5E7EB;
  border: none;
  color: #6B7280;
  font-size: 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  z-index: 2;
}
.popup-close:hover {
  background: #D1D5DB;
  color: #374151;
  transform: scale(1.05);
}

.popup-photos-label {
  font-size: 0.75rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: #6B8A7A;
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}

.label-icon {
  width: 28px;
  height: 28px;
  background: rgba(107, 138, 122, 0.15);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6B8A7A;
  font-size: 0.9rem;
}

.popup-photos {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.popup-photo {
  border-radius: 12px;
  overflow: hidden;
  position: relative;
  aspect-ratio: 1;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  background: #E5E7EB;
}

.popup-photo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.3s ease;
}
.popup-photo:hover img { transform: scale(1.1); }

.popup-photo-caption {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(0,0,0,0.7));
  color: #fff;
  font-size: 0.65rem;
  font-weight: 600;
  padding: 16px 8px 8px;
  text-align: center;
  line-height: 1.2;
}

/* ── Popup Transition ─────────────────────────────────────────────── */
.popup-enter-active,
.popup-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.popup-enter-from,
.popup-leave-to {
  opacity: 0;
  transform: scale(0.95) translateY(10px);
}

@media (max-width: 768px) {
  .map-container-wrapper {
    height: 400px;
    min-height: auto;
  }
  .marker-popup.split-layout { 
    width: 320px;
    flex-direction: column;
    border-radius: 20px;
  }
  .popup-left {
    width: 100%;
    border-radius: 20px 20px 0 0;
    padding: 20px;
  }
  .popup-right {
    width: 100%;
    padding: 20px;
  }
  .popup-accent-icon {
    top: auto;
    bottom: -20px;
    right: 24px;
    transform: none;
  }
}
</style>
