<template>
  <Teleport to="body">
    <Transition name="pmap-fade">
      <div v-if="isOpen" class="pmap-fullscreen">

        <!-- Top Bar -->
        <div class="pmap-topbar">
          <div class="pmap-topbar-left">
            <div class="pmap-topbar-icon-wrap">
              <i class="fa-solid fa-map-location-dot"></i>
            </div>
            <div>
              <h2 class="pmap-topbar-title">
                <template v-if="selectedSubRegion">
                  <button class="pmap-breadcrumb-btn" @click="selectedSubRegion = null">Banten</button>
                  <span class="pmap-breadcrumb-sep">›</span>
                  {{ selectedSubRegion.name }}
                </template>
                <template v-else>Peta Perjalanan</template>
              </h2>
              <p class="pmap-topbar-sub">{{ totalItems }} momen · {{ totalProvinces }} provinsi</p>
            </div>
          </div>
          <button class="pmap-close-btn" @click="close" aria-label="Tutup">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <!-- Province Chips -->
        <div class="pmap-chips-bar">
          <button
            v-for="p in availableProvinces"
            :key="p.id"
            class="pmap-chip"
            :class="{ 'is-active': selectedProvinceId === p.id }"
            @click="onSelectProvince(p.id)"
          >
            <span class="pmap-chip-name">{{ p.name }}</span>
            <span class="pmap-chip-count">{{ p.count }}</span>
          </button>
        </div>

        <!-- Map Body -->
        <div class="pmap-body">
          <template v-if="selectedProvince">
            <ProvinceMapViewer
              :province="selectedProvince"
              :markers="markersForProvince"
              @marker-click="onMarkerClick"
              @subregion-click="onSubRegionClick"
            />
          </template>
          <div v-else class="pmap-empty-state">
            <div class="pmap-empty-icon">🗺️</div>
            <p class="pmap-empty-text">Pilih provinsi dulu!</p>
            <p class="pmap-empty-hint">{{ availableProvinces.length }} provinsi tersedia</p>
          </div>
        </div>

        <!-- Marker Popup -->
        <Transition name="pmap-popup-slide">
          <div v-if="activeMarker" class="pmap-popup-card">
            <div class="pmap-popup-top">
              <div class="pmap-popup-dot" :style="{ background: activeMarker.dotColor }"></div>
              <h3 class="pmap-popup-title">{{ activeMarker.title }}</h3>
              <button class="pmap-popup-dismiss" @click="activeMarker = null">
                <i class="fa-solid fa-xmark"></i>
              </button>
            </div>
            <div class="pmap-popup-meta">
              <span><i class="fa-solid fa-location-dot"></i> {{ activeMarker.location }}</span>
              <span><i class="fa-regular fa-calendar"></i> {{ activeMarker.date }}</span>
            </div>
            <button class="pmap-popup-cta" @click="openDetail">
              Lihat Detail <i class="fa-solid fa-arrow-right"></i>
            </button>
          </div>
        </Transition>

        <!-- Stats Bar -->
        <div class="pmap-statsbar">
          <template v-if="selectedSubRegion">
            <span class="pmap-stat-badge pmap-stat-province">
              <i class="fa-solid fa-building"></i> {{ selectedSubRegion.name }}
            </span>
            <span class="pmap-stat-badge pmap-stat-count">
              <i class="fa-solid fa-images"></i> {{ markersForSubRegion.length }} momen
            </span>
            <button class="pmap-stat-badge pmap-stat-back" @click="selectedSubRegion = null">
              <i class="fa-solid fa-arrow-left"></i> Kembali ke Banten
            </button>
          </template>
          <template v-else-if="selectedProvince">
            <span class="pmap-stat-badge pmap-stat-province">
              <i class="fa-solid fa-map"></i> {{ selectedProvince.name }}
            </span>
            <span class="pmap-stat-badge pmap-stat-count">
              <i class="fa-solid fa-images"></i> {{ markersForProvince.length }} momen
            </span>
          </template>
          <template v-else>
            <span class="pmap-stat-badge">Pilih provinsi di atas 👆</span>
          </template>
        </div>

      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import ProvinceMapViewer from './ProvinceMapViewer.vue';
import { getAllProvinces, getProvinceData } from '../../data/provinceMaps';
import type { ProvinceMapData, SubRegionData } from '../../data/provinceMaps';
import { indonesiaLocations } from '../../data/indonesiaLocations';
import type { TimelineData } from '../../data/timeline';

const props = defineProps<{ timelineItems: TimelineData[] }>();
const emit = defineEmits<{ (e: 'open-detail', item: TimelineData): void }>();

const isOpen = ref(false);
const selectedProvinceId = ref<string | null>(null);
const activeMarker = ref<TimelineData | null>(null);
const selectedSubRegion = ref<SubRegionData | null>(null);

const PROVINCE_NAME_TO_ID: Record<string, string> = {
  'dki jakarta': 'jakarta',
  'dki_jakarta': 'jakarta',
};

function nameToId(name: string): string {
  const lower = name.toLowerCase();
  if (PROVINCE_NAME_TO_ID[lower]) return PROVINCE_NAME_TO_ID[lower];
  return lower.replace(/\s+/g, '_').replace(/[^a-z_]/g, '');
}

function getProvinceIdForItem(item: TimelineData): string | null {
  const loc = item.location?.toLowerCase() ?? '';
  for (const entry of indonesiaLocations) {
    if (entry.keywords.some((k: string) => loc.includes(k))) {
      const id = nameToId(entry.province);
      if (getProvinceData(id)) return id;
    }
  }
  return null;
}

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
  return Array.from(map.entries()).map(([id, v]) => ({ id, ...v })).sort((a, b) => b.count - a.count);
});

const availableProvinces = computed(() => {
  if (allAvailableProvinces.value.length > 0) return allAvailableProvinces.value;
  return getAllProvinces().map(p => ({ id: p.id, name: p.name, count: 0 }));
});

const selectedProvince = computed<ProvinceMapData | null>(() =>
  selectedProvinceId.value ? getProvinceData(selectedProvinceId.value) : null
);

const markersForProvince = computed<TimelineData[]>(() => {
  if (!selectedProvinceId.value) return [];
  return props.timelineItems.filter(item => getProvinceIdForItem(item) === selectedProvinceId.value);
});

const totalItems = computed(() => props.timelineItems.length);
const totalProvinces = computed(() => allAvailableProvinces.value.length);

// Markers filtered to selected sub-region
const markersForSubRegion = computed<TimelineData[]>(() => {
  if (!selectedSubRegion.value) return [];
  const sub = selectedSubRegion.value;
  // Filter by sub-region keywords — Tangsel keywords match via indonesiaLocations
  return markersForProvince.value.filter(item => {
    const loc = item.location?.toLowerCase() ?? '';
    // Match by sub-region id: tangsel = 'tangsel', 'tangerang selatan', etc.
    const subKeywords: Record<string, string[]> = {
      tangsel:         ['tangerang selatan', 'tangsel', 'ciputat', 'pamulang', 'pondok aren', 'serpong', 'bintaro'],
      cilegon:         ['cilegon'],
      kota_serang:     ['kota serang'],
      kab_serang:      ['kabupaten serang', 'kab serang'],
      pandeglang:      ['pandeglang'],
      lebak:           ['lebak'],
      kab_tangerang:   ['kabupaten tangerang', 'kab tangerang', 'tigaraksa', 'tangerang'],
      kota_tangerang:  ['kota tangerang'],
    };
    const kws = subKeywords[sub.id] ?? [sub.name.toLowerCase()];
    return kws.some(kw => loc.includes(kw));
  });
});

function open() {
  isOpen.value = true;
  if (!selectedProvinceId.value && availableProvinces.value.length > 0) {
    selectedProvinceId.value = availableProvinces.value[0].id;
  }
}
function close() { isOpen.value = false; activeMarker.value = null; selectedSubRegion.value = null; }
function onSelectProvince(id: string) { selectedProvinceId.value = id; activeMarker.value = null; selectedSubRegion.value = null; }
function onMarkerClick(item: TimelineData) { activeMarker.value = item; }
function onSubRegionClick(sub: SubRegionData) { selectedSubRegion.value = sub; activeMarker.value = null; }
function openDetail() { if (!activeMarker.value) return; emit('open-detail', activeMarker.value); close(); }

defineExpose({ open, close });
</script>

<style scoped>
/* ─── Full Screen ─── */
.pmap-fullscreen {
  position: fixed;
  inset: 0;
  z-index: 9000;
  display: flex;
  flex-direction: column;
  background: #fffbf0;
  overflow: hidden;
}

/* ─── Top Bar ─── */
.pmap-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  background: #ffffff;
  border-bottom: 2.5px solid #1a1a2e;
  flex-shrink: 0;
  gap: 12px;
}
.pmap-topbar-left { display: flex; align-items: center; gap: 12px; }

.pmap-topbar-icon-wrap {
  width: 40px; height: 40px;
  background: #ffdd00;
  border: 2px solid #1a1a2e;
  border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  font-size: 1.1rem;
  color: #1a1a2e;
  box-shadow: 3px 3px 0 #1a1a2e;
  flex-shrink: 0;
}

.pmap-topbar-title {
  font-family: 'Outfit', sans-serif;
  font-size: 1rem;
  font-weight: 900;
  color: #1a1a2e;
  margin: 0 0 1px;
  line-height: 1.1;
}
.pmap-topbar-sub {
  font-family: 'Inter', sans-serif;
  font-size: 0.72rem;
  font-weight: 600;
  color: #6b7280;
  margin: 0;
}

.pmap-close-btn {
  width: 38px; height: 38px;
  border: 2.5px solid #1a1a2e;
  border-radius: 8px;
  background: #ff6b6b;
  color: #fff;
  font-size: 0.95rem;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 3px 3px 0 #1a1a2e;
  transition: transform 0.1s, box-shadow 0.1s;
  flex-shrink: 0;
}
.pmap-close-btn:hover { transform: translate(-1px,-1px); box-shadow: 4px 4px 0 #1a1a2e; }
.pmap-close-btn:active { transform: translate(2px,2px); box-shadow: 1px 1px 0 #1a1a2e; }

/* ─── Chips Bar ─── */
.pmap-chips-bar {
  display: flex;
  gap: 8px;
  padding: 10px 16px;
  overflow-x: auto;
  flex-shrink: 0;
  background: #fff;
  border-bottom: 2.5px solid #1a1a2e;
  scrollbar-width: none;
}
.pmap-chips-bar::-webkit-scrollbar { display: none; }

.pmap-chip {
  display: flex; align-items: center; gap: 6px;
  padding: 6px 12px;
  border-radius: 6px;
  border: 2px solid #1a1a2e;
  background: #f3f4f6;
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
  box-shadow: 2px 2px 0 #1a1a2e;
  transition: transform 0.08s, box-shadow 0.08s, background 0.12s;
}
.pmap-chip:hover { transform: translate(-1px,-1px); box-shadow: 3px 3px 0 #1a1a2e; }
.pmap-chip:active { transform: translate(1px,1px); box-shadow: 0 0 0 #1a1a2e; }
.pmap-chip.is-active {
  background: #ffdd00;
  border-color: #1a1a2e;
  box-shadow: 3px 3px 0 #1a1a2e;
}

.pmap-chip-name {
  font-family: 'Inter', sans-serif;
  font-size: 0.78rem;
  font-weight: 700;
  color: #374151;
}
.pmap-chip.is-active .pmap-chip-name { color: #1a1a2e; }

.pmap-chip-count {
  font-family: 'Inter', sans-serif;
  font-size: 0.68rem;
  font-weight: 800;
  background: #1a1a2e;
  color: #ffdd00;
  border-radius: 4px;
  padding: 1px 6px;
  min-width: 18px;
  text-align: center;
}
.pmap-chip.is-active .pmap-chip-count { background: #1a1a2e; color: #ffdd00; }

/* ─── Map Body ─── */
.pmap-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
  background: #fffbf0;
}

.pmap-empty-state {
  flex: 1; display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 10px;
}
.pmap-empty-icon { font-size: 4rem; }
.pmap-empty-text {
  font-family: 'Outfit', sans-serif;
  font-size: 1rem; font-weight: 800; color: #1a1a2e;
}
.pmap-empty-hint {
  font-family: 'Inter', sans-serif;
  font-size: 0.8rem; color: #9ca3af; margin: 0;
}

/* ─── Marker Popup Card ─── */
.pmap-popup-card {
  position: absolute;
  bottom: 52px;
  left: 50%; transform: translateX(-50%);
  width: calc(100% - 32px); max-width: 420px;
  background: #ffffff;
  border: 2.5px solid #1a1a2e;
  border-radius: 12px;
  box-shadow: 5px 5px 0 #1a1a2e;
  padding: 14px 16px;
  z-index: 10;
}
.pmap-popup-top {
  display: flex; align-items: center; gap: 10px; margin-bottom: 8px;
}
.pmap-popup-dot {
  width: 14px; height: 14px; border-radius: 50%;
  border: 2px solid #1a1a2e;
  flex-shrink: 0;
  box-shadow: 2px 2px 0 #1a1a2e;
}
.pmap-popup-title {
  font-family: 'Outfit', sans-serif;
  font-size: 0.95rem; font-weight: 800; color: #1a1a2e;
  margin: 0; flex: 1;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.pmap-popup-dismiss {
  width: 28px; height: 28px;
  border: 2px solid #1a1a2e;
  border-radius: 6px;
  background: #f3f4f6;
  color: #374151;
  font-size: 0.8rem;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  box-shadow: 2px 2px 0 #1a1a2e;
  transition: transform 0.08s;
}
.pmap-popup-dismiss:hover { transform: translate(-1px,-1px); }
.pmap-popup-meta {
  display: flex; flex-direction: column; gap: 3px;
  font-family: 'Inter', sans-serif;
  font-size: 0.75rem; color: #6b7280;
  margin-bottom: 12px;
}
.pmap-popup-meta span { display: flex; align-items: center; gap: 6px; }
.pmap-popup-meta i { color: #ff6b6b; font-size: 0.7rem; }

.pmap-popup-cta {
  width: 100%; padding: 9px;
  background: #ffdd00;
  border: 2.5px solid #1a1a2e;
  border-radius: 8px;
  font-family: 'Inter', sans-serif;
  font-size: 0.85rem; font-weight: 800;
  color: #1a1a2e;
  cursor: pointer;
  box-shadow: 3px 3px 0 #1a1a2e;
  display: flex; align-items: center; justify-content: center; gap: 8px;
  transition: transform 0.08s, box-shadow 0.08s;
}
.pmap-popup-cta:hover { transform: translate(-1px,-1px); box-shadow: 4px 4px 0 #1a1a2e; }
.pmap-popup-cta:active { transform: translate(2px,2px); box-shadow: 1px 1px 0 #1a1a2e; }

/* ─── Stats Bar ─── */
.pmap-statsbar {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 16px;
  background: #fff;
  border-top: 2.5px solid #1a1a2e;
  flex-shrink: 0;
  min-height: 44px;
  flex-wrap: wrap;
}
.pmap-stat-badge {
  font-family: 'Inter', sans-serif;
  font-size: 0.72rem; font-weight: 700;
  padding: 4px 10px;
  border: 2px solid #1a1a2e;
  border-radius: 6px;
  background: #f3f4f6;
  color: #1a1a2e;
  display: flex; align-items: center; gap: 5px;
  box-shadow: 2px 2px 0 #1a1a2e;
}
.pmap-stat-province { background: #e0f2fe; }
.pmap-stat-count    { background: #fef9c3; }
.pmap-stat-back {
  cursor: pointer;
  background: #fff;
  transition: transform 0.08s, box-shadow 0.08s;
}
.pmap-stat-back:hover { transform: translate(-1px,-1px); box-shadow: 3px 3px 0 #1a1a2e; }
.pmap-stat-back:active { transform: translate(1px,1px); box-shadow: 0 0 0 #1a1a2e; }

/* Breadcrumb in topbar */
.pmap-breadcrumb-btn {
  background: none;
  border: none;
  font-family: 'Outfit', sans-serif;
  font-size: inherit;
  font-weight: 900;
  color: #3b82f6;
  cursor: pointer;
  padding: 0;
  text-decoration: underline;
  text-decoration-color: transparent;
  transition: text-decoration-color 0.15s;
}
.pmap-breadcrumb-btn:hover { text-decoration-color: #3b82f6; }
.pmap-breadcrumb-sep { color: #9ca3af; margin: 0 4px; font-weight: 400; }

/* ─── Transitions ─── */
.pmap-fade-enter-active { transition: opacity 0.22s ease; }
.pmap-fade-leave-active { transition: opacity 0.18s ease; }
.pmap-fade-enter-from, .pmap-fade-leave-to { opacity: 0; }

.pmap-popup-slide-enter-active { transition: transform 0.3s cubic-bezier(0.25,1,0.5,1), opacity 0.25s; }
.pmap-popup-slide-leave-active { transition: transform 0.2s ease, opacity 0.18s; }
.pmap-popup-slide-enter-from  { transform: translateX(-50%) translateY(20px); opacity: 0; }
.pmap-popup-slide-leave-to    { transform: translateX(-50%) translateY(10px); opacity: 0; }
</style>
