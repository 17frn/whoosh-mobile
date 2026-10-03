<template>
  <Teleport to="body">
    <Transition name="pmap-modal">
      <div v-if="isOpen" class="pmap-overlay" @click.self="close">
        <div class="pmap-modal" role="dialog" aria-modal="true" aria-label="Peta Perjalanan">

          <!-- Header -->
          <div class="pmap-header">
            <div>
              <h2 class="pmap-title">🗺️ Peta Perjalanan</h2>
              <p class="pmap-subtitle">{{ totalItems }} momen di {{ totalProvinces }} provinsi</p>
            </div>
            <button class="pmap-close" @click="close" aria-label="Tutup"><i class="fa-solid fa-xmark"></i></button>
          </div>

          <!-- Province Selector -->
          <div class="pmap-selector-wrap">
            <ProvinceSelector
              :provinces="availableProvinces"
              :selected="selectedProvinceId"
              @select="onSelectProvince"
            />
          </div>

          <!-- Map Viewer -->
          <div class="pmap-body">
            <template v-if="selectedProvince">
              <ProvinceMapViewer
                :province="selectedProvince"
                :markers="markersForProvince"
                @marker-click="onMarkerClick"
              />
            </template>
            <div v-else class="pmap-empty-state">
              <span class="pmap-empty-icon">📍</span>
              <p>Pilih provinsi untuk melihat peta</p>
            </div>
          </div>

          <!-- Footer stats -->
          <div class="pmap-footer">
            <span class="pmap-stat"><i class="fa-solid fa-location-dot"></i> {{ totalItems }} momen</span>
            <span class="pmap-stat"><i class="fa-solid fa-map"></i> {{ totalProvinces }} provinsi</span>
            <span v-if="selectedProvince" class="pmap-stat pmap-stat--accent">
              <i class="fa-solid fa-filter"></i> {{ markersForProvince.length }} momen di {{ selectedProvince.name }}
            </span>
          </div>

          <!-- Marker Popup -->
          <Transition name="pmap-popup">
            <div v-if="activeMarker" class="pmap-popup">
              <div class="pmap-popup-header">
                <div class="pmap-popup-dot" :style="{ background: activeMarker.dotColor }"></div>
                <h3 class="pmap-popup-title">{{ activeMarker.title }}</h3>
                <button class="pmap-popup-close" @click="activeMarker = null"><i class="fa-solid fa-xmark"></i></button>
              </div>
              <p class="pmap-popup-location"><i class="fa-solid fa-location-dot"></i> {{ activeMarker.location }}</p>
              <p class="pmap-popup-date"><i class="fa-regular fa-calendar"></i> {{ activeMarker.date }}</p>
              <p class="pmap-popup-moments"><i class="fa-solid fa-images"></i> {{ activeMarker.moments.length }} foto/momen</p>
              <button class="pmap-popup-cta" @click="openDetail">
                Lihat Detail <i class="fa-solid fa-arrow-right"></i>
              </button>
            </div>
          </Transition>

        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import ProvinceSelector from './ProvinceSelector.vue';
import ProvinceMapViewer from './ProvinceMapViewer.vue';
import { getAllProvinces, getProvinceData } from '../../data/provinceMaps';
import type { ProvinceMapData } from '../../data/provinceMaps';
import { indonesiaLocations } from '../../data/indonesiaLocations';
import type { TimelineData } from '../../data/timeline';

const props = defineProps<{
  timelineItems: TimelineData[];
}>();

const emit = defineEmits<{
  (e: 'open-detail', item: TimelineData): void;
}>();

// ── State ──────────────────────────────────────
const isOpen = ref(false);
const selectedProvinceId = ref<string | null>(null);
const activeMarker = ref<TimelineData | null>(null);

// ── Helpers ────────────────────────────────────
/** Match a location string to a province id in provinceMaps */
function getProvinceIdForItem(item: TimelineData): string | null {
  const loc = item.location.toLowerCase();
  for (const entry of indonesiaLocations) {
    if (entry.keywords.some(k => loc.includes(k))) {
      // Map province name to our provinceMaps id
      const id = nameToId(entry.province);
      if (getProvinceData(id)) return id;
    }
  }
  return null;
}

function nameToId(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z_]/g, '');
}

// ── Computed ───────────────────────────────────
const allAvailableProvinces = computed<{ id: string; name: string; count: number }[]>(() => {
  const map = new Map<string, { name: string; count: number }>();
  for (const item of props.timelineItems) {
    const id = getProvinceIdForItem(item);
    if (!id) continue;
    const province = getProvinceData(id);
    if (!province) continue;
    const existing = map.get(id);
    if (existing) existing.count++;
    else map.set(id, { name: province.name, count: 1 });
  }
  return Array.from(map.entries())
    .map(([id, v]) => ({ id, ...v }))
    .sort((a, b) => b.count - a.count);
});

const availableProvinces = computed(() => {
  if (allAvailableProvinces.value.length > 0) return allAvailableProvinces.value;
  // Fallback: show all registered provinces even without data
  return getAllProvinces().map(p => ({ id: p.id, name: p.name, count: 0 }));
});

const selectedProvince = computed<ProvinceMapData | null>(() =>
  selectedProvinceId.value ? getProvinceData(selectedProvinceId.value) : null
);

const markersForProvince = computed(() => {
  if (!selectedProvinceId.value) return [];
  return props.timelineItems.filter(item => {
    if (item.latitude == null || item.longitude == null) return false;
    return getProvinceIdForItem(item) === selectedProvinceId.value;
  });
});

const totalItems     = computed(() => props.timelineItems.length);
const totalProvinces = computed(() => allAvailableProvinces.value.length);

// ── Methods ────────────────────────────────────
function open()  { isOpen.value = true; }
function close() {
  isOpen.value = false;
  activeMarker.value = null;
}

function onSelectProvince(id: string) {
  selectedProvinceId.value = id;
  activeMarker.value = null;
}

function onMarkerClick(item: TimelineData) {
  activeMarker.value = item;
}

function openDetail() {
  if (!activeMarker.value) return;
  emit('open-detail', activeMarker.value);
  close();
}

// Expose open() so parent can trigger it
defineExpose({ open, close });
</script>

<style scoped>
/* ── Overlay ── */
.pmap-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.75);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9000;
  padding: 16px;
}

/* ── Modal ── */
.pmap-modal {
  background: var(--theme-background, #fff);
  border: 3px solid var(--theme-border, #101010);
  box-shadow: 6px 6px 0 var(--theme-border, #101010);
  width: 100%;
  max-width: 680px;
  max-height: 92vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}

/* Header */
.pmap-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 18px 20px 14px;
  border-bottom: 2px solid var(--theme-border, #101010);
  background: var(--theme-surface, #f8fafc);
  flex-shrink: 0;
}
.pmap-title {
  font-family: 'Outfit', sans-serif;
  font-size: 1.2rem;
  font-weight: 900;
  color: var(--theme-text, #101010);
  margin: 0 0 2px;
}
.pmap-subtitle {
  font-family: 'Inter', sans-serif;
  font-size: 0.78rem;
  color: var(--theme-text-secondary, #64748b);
  margin: 0;
}
.pmap-close {
  background: none;
  border: none;
  font-size: 1.1rem;
  cursor: pointer;
  color: var(--theme-text, #101010);
  padding: 4px 8px;
  transition: transform 0.15s;
}
.pmap-close:hover { transform: scale(1.15) rotate(10deg); }

/* Selector */
.pmap-selector-wrap {
  padding: 14px 20px 10px;
  border-bottom: 1.5px solid var(--theme-border, #e2e8f0);
  flex-shrink: 0;
}

/* Body */
.pmap-body {
  flex: 1;
  padding: 14px 20px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 280px;
}

.pmap-empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--theme-text-secondary, #94a3b8);
  font-family: 'Inter', sans-serif;
  font-size: 0.9rem;
  gap: 8px;
}
.pmap-empty-icon { font-size: 2.5rem; }

/* Footer */
.pmap-footer {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 20px;
  border-top: 1.5px solid var(--theme-border, #e2e8f0);
  background: var(--theme-surface, #f8fafc);
  flex-shrink: 0;
  flex-wrap: wrap;
}
.pmap-stat {
  font-family: 'Inter', sans-serif;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--theme-text-secondary, #64748b);
  display: flex;
  align-items: center;
  gap: 5px;
}
.pmap-stat--accent {
  color: var(--theme-accent, #6b9bd6);
  font-weight: 700;
}

/* Marker Popup */
.pmap-popup {
  position: absolute;
  bottom: 80px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--theme-surface, #fff);
  border: 2.5px solid var(--theme-border, #101010);
  box-shadow: 4px 4px 0 var(--theme-border, #101010);
  padding: 14px 18px;
  width: 280px;
  z-index: 10;
}
.pmap-popup-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}
.pmap-popup-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
  border: 2px solid #101010;
}
.pmap-popup-title {
  font-family: 'Outfit', sans-serif;
  font-size: 0.95rem;
  font-weight: 800;
  color: var(--theme-text, #101010);
  margin: 0;
  flex: 1;
  line-height: 1.2;
}
.pmap-popup-close {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--theme-text-secondary, #94a3b8);
  font-size: 0.9rem;
  padding: 0 4px;
}
.pmap-popup-location,
.pmap-popup-date,
.pmap-popup-moments {
  font-family: 'Inter', sans-serif;
  font-size: 0.78rem;
  color: var(--theme-text-secondary, #64748b);
  margin: 4px 0;
  display: flex;
  align-items: center;
  gap: 6px;
}
.pmap-popup-cta {
  margin-top: 12px;
  width: 100%;
  padding: 8px;
  background: var(--theme-accent, #101010);
  color: #fff;
  font-family: 'Inter', sans-serif;
  font-size: 0.82rem;
  font-weight: 700;
  border: 2px solid var(--theme-border, #101010);
  box-shadow: 2px 2px 0 var(--theme-border, #101010);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: transform 0.1s, box-shadow 0.1s;
}
.pmap-popup-cta:hover {
  transform: translate(-1px, -1px);
  box-shadow: 3px 3px 0 var(--theme-border, #101010);
}

/* ── Transitions ── */
.pmap-modal-enter-active,
.pmap-modal-leave-active {
  transition: opacity 0.3s ease;
}
.pmap-modal-enter-active .pmap-modal,
.pmap-modal-leave-active .pmap-modal {
  transition: transform 0.3s ease, opacity 0.3s ease;
}
.pmap-modal-enter-from,
.pmap-modal-leave-to {
  opacity: 0;
}
.pmap-modal-enter-from .pmap-modal {
  transform: translateY(20px) scale(0.97);
}
.pmap-modal-leave-to .pmap-modal {
  transform: translateY(10px) scale(0.98);
  opacity: 0;
}

.pmap-popup-enter-active,
.pmap-popup-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.pmap-popup-enter-from,
.pmap-popup-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(10px);
}

/* ── Mobile ── */
@media (max-width: 640px) {
  .pmap-overlay { padding: 0; align-items: flex-end; }
  .pmap-modal {
    max-width: 100%;
    max-height: 90vh;
    box-shadow: none;
    border-left: none;
    border-right: none;
    border-bottom: none;
  }
  .pmap-popup {
    width: calc(100% - 32px);
    bottom: 70px;
  }
}
</style>
