<template>
  <div class="timeline-view-wrapper">
    <!-- Hero Header Section (optional banner/branding bisa di sini) -->

    <!-- Recent Highlights Section -->
    <RecentHighlights
      :items="items"
      :max-items="5"
      @open-detail="openDetail"
    />

    <!-- Timeline Content with slide transition -->
    <div class="timeline-content-wrapper">
      <!-- Timeline Section Header (Galeri + Year Selector + Map) - STICKY, NO SWIPE -->
      <div class="timeline-section-header">
        <div class="timeline-header-left">
          <h1 class="timeline-section-title">Galeri</h1>
        </div>

        <div class="timeline-header-actions">
          <!-- Custom Year Selector -->
          <div class="year-selector-wrapper">
            <button class="year-dropdown-btn" @click="isYearDropdownOpen = !isYearDropdownOpen" aria-label="Pilih Tahun">
              {{ activeYear || 'Tahun' }}
              <i class="fa-solid fa-chevron-down dropdown-icon"></i>
            </button>

            <div v-if="isYearDropdownOpen" class="year-dropdown-overlay" @click="isYearDropdownOpen = false"></div>

            <Transition name="fade">
              <div v-if="isYearDropdownOpen" class="year-dropdown-menu">
                <button
                  v-for="y in availableYears"
                  :key="y"
                  class="year-dropdown-item"
                  :class="{ 'is-active': y === activeYear }"
                  @click="selectYear(y)"
                >
                  {{ y }}
                  <div class="radio-circle"><div v-if="y === activeYear" class="radio-inner"></div></div>
                </button>
              </div>
            </Transition>
          </div>

          <!-- Global Map Trigger -->
          <button id="global-map-trigger" class="btn-global-map" @click="openGlobalMap" title="Lihat Jejak Momen">
            <i class="fa-solid fa-map-location-dot"></i>
          </button>
        </div>
      </div>

      <!-- Swipeable Content Area - ONLY THIS SWIPES -->
      <div
        class="timeline-swipeable-area"
        @touchstart="onTouchStart"
        @touchend="onTouchEnd"
      >
        <Transition :name="transitionName" mode="out-in">
          <div :key="activeYear" class="timeline-container">
            <!-- Global Vertical Dotted Line -->
            <div v-if="filteredItems.length > 0" class="timeline-main-line"></div>

            <!-- Month groups -->
            <template v-if="filteredItems.length > 0">
            <div v-for="group in monthGroups" :key="group.month" class="month-group">

              <!-- Month header -->
              <div class="month-header">
                <div class="month-label-wrap">
                  <span class="month-name">{{ group.label }}</span>
                  <span class="month-count">{{ group.items.length }}×</span>
                </div>
                <div class="month-line"></div>
              </div>

              <!-- Trip cards list -->
              <div class="trips-list">
                <div
                  v-for="item in group.items"
                  :key="item.id"
                  class="trip-row"
                >
                  <!-- Timeline vertical marker column -->
                  <div class="trip-timeline-col">
                    <div class="trip-dot" :style="{ backgroundColor: item.dotColor }"></div>
                  </div>

                  <!-- Actual Trip Card -->
                  <div
                    class="trip-card"
                    @click="openDetail(item)"
                    role="button"
                    tabindex="0"
                    @keydown.enter="openDetail(item)"
                  >
                    <!-- Edit button -->
                    <button
                      class="btn-trip-edit"
                      @click.stop="$emit('edit-moment', item)"
                      :aria-label="'Edit ' + item.title"
                      title="Edit Momen"
                    >
                      <i class="fa-solid fa-pencil"></i>
                    </button>
                    <div class="trip-body">
                      <div class="trip-meta">
                        <h3 class="trip-title">{{ item.title }}</h3>
                        <div class="trip-tags">
                          <span v-if="item.location" class="trip-tag">
                            <i class="fa-solid fa-location-dot"></i> {{ item.location }}
                          </span>
                          <span v-if="item.date" class="trip-tag trip-tag--muted">
                            <i class="fa-regular fa-calendar"></i> {{ item.date }}
                          </span>
                          <span v-if="item.addedBy" class="trip-tag trip-tag--author">
                            <i class="fa-solid fa-user"></i> {{ item.addedBy }}
                          </span>
                        </div>
                      </div>

                      <!-- Photo thumbnail strip -->
                      <div v-if="item.moments && item.moments.length > 0" class="thumb-strip">
                        <div v-for="(m, idx) in item.moments.slice(0, 4)" :key="idx" class="thumb">
                          <img :src="m.image" :alt="m.title" loading="lazy" />
                        </div>
                        <div v-if="item.moments.length > 4" class="thumb thumb--more">
                          +{{ item.moments.length - 4 }}
                        </div>
                      </div>
                      <div v-else class="thumb-empty">
                        <i class="fa-regular fa-image"></i> Belum ada foto
                      </div>
                    </div>

                    <!-- Chevron -->
                    <div class="trip-chevron">
                      <i class="fa-solid fa-chevron-right"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </template>

            <!-- Empty state -->
            <div v-else class="empty-state">
              <div class="empty-icon"><i class="fa-regular fa-compass"></i></div>
              <h3>Belum ada perjalanan<br>di tahun {{ activeYear }}</h3>
              <p>Mungkin masih dalam perencanaan :D</p>
              <button class="btn-add-empty" @click="$emit('add-moment')" id="btn-add-first-moment">
                <i class="fa-solid fa-plus"></i> Tambah Momen Pertama
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </div>


    <!-- Detail Modal -->
    <Transition name="fade">
      <div v-if="activeDetailItem" class="detail-modal-overlay" @click.self="closeDetail">
        <div class="detail-modal-content">

          <!-- Fixed top: header + map + edit button -->
          <div class="detail-fixed-top">
            <div class="detail-header">
              <h2 class="detail-title">{{ activeDetailItem.title }}</h2>
              <div class="detail-header-actions">
                <button class="neo-btn edit-btn" @click="$emit('edit-moment', activeDetailItem)" aria-label="Edit Momen">
                  EDIT
                </button>
                <button class="neo-btn close-btn" @click="closeDetail" aria-label="Tutup">
                  <i class="fa-solid fa-xmark"></i>
                </button>
              </div>
            </div>

            <!-- Pill container for subtitle/map -->
            <div class="detail-subtitle-row">
              <button
                v-if="activeDetailItem.location"
                class="neo-pill map-pill"
                :class="{ 'has-map': isValidMapUrl(activeDetailItem.mapEmbedUrl) }"
                @click="isValidMapUrl(activeDetailItem.mapEmbedUrl) && (isMapExpanded = !isMapExpanded)"
              >
                <i class="fa-solid fa-location-dot"></i> {{ activeDetailItem.location }}
                <i v-if="isValidMapUrl(activeDetailItem.mapEmbedUrl)" class="fa-solid" :class="isMapExpanded ? 'fa-chevron-up' : 'fa-chevron-down'"></i>
              </button>

              <div v-if="activeDetailItem.date" class="neo-pill date-pill">
                <i class="fa-regular fa-calendar"></i> {{ activeDetailItem.date }}
              </div>
            </div>

            <!-- Map embed (Conditional) -->
            <div v-if="isMapExpanded && isValidMapUrl(activeDetailItem.mapEmbedUrl)" class="detail-map-container">
              <iframe
                :src="activeDetailItem.mapEmbedUrl"
                width="100%"
                height="160"
                class="neo-iframe"
                allowfullscreen="false"
                loading="lazy"
                referrerpolicy="no-referrer-when-downgrade"
              ></iframe>
            </div>
          </div>
          <!-- /Fixed top -->

          <!-- Scrollable gallery section -->
          <div class="detail-gallery-scroll">
            <div class="gallery-grid-neo" :style="`direction: ${activeDetailItem.rtl ? 'rtl' : 'ltr'}`">
              <div
                v-for="(momen, idx) in activeDetailItem.moments?.slice(0, 9)"
                :key="idx"
                class="gallery-card-wrap"
              >
                <TimelineCard
                  :image="momen.image"
                  :title="momen.title"
                  :description="momen.description"
                  :accentColor="momen.accentColor"
                />
              </div>
            </div>
            <div v-if="!activeDetailItem.moments || activeDetailItem.moments.length === 0" class="gallery-empty">
              <i class="fa-regular fa-image"></i>
              <p>Belum ada foto. Tambahkan lewat tombol ✏️</p>
            </div>
          </div>
          <!-- /Scrollable gallery -->

        </div>
      </div>
    </Transition>

    <!-- Province Map Modal -->
    <ProvinceMapModal
      ref="provinceMapModalRef"
      :timeline-items="items"
      @open-detail="openDetail"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import TimelineCard from '../components/feed/TimelineCard.vue';
import ProvinceMapModal from '../components/shared/ProvinceMapModal.vue';
import RecentHighlights from '../components/shared/RecentHighlights.vue';

const props = defineProps({
  items: { type: Array, required: true }
});

const emit = defineEmits(['add-moment', 'edit-moment', 'detail-modal-toggled', 'reorder-photos']);


// ── Indonesian month names ───────────────────────────────────────────
const BULAN_ID = [
  'Januari','Februari','Maret','April','Mei','Juni',
  'Juli','Agustus','September','Oktober','November','Desember'
];

function isValidMapUrl(url) {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  return trimmed.startsWith('http://') || trimmed.startsWith('https://');
}

const ID_UP = BULAN_ID.map(b => b.toUpperCase());
const EN_UP = ['JANUARY','FEBRUARY','MARCH','APRIL','MAY','JUNE','JULY','AUGUST','SEPTEMBER','OCTOBER','NOVEMBER','DECEMBER'];
const SH_UP = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];

function getMonthFromDate(dateStr) {
  if (!dateStr) return null;
  const u = dateStr.toUpperCase();
  for (let i = 0; i < ID_UP.length; i++) if (u.includes(ID_UP[i])) return i + 1;
  for (let i = 0; i < EN_UP.length; i++) if (u.includes(EN_UP[i])) return i + 1;
  for (let i = 0; i < SH_UP.length; i++) if (u.includes(SH_UP[i])) return i + 1;
  const m = dateStr.match(/\d{4}-(\d{2})/);
  if (m) return parseInt(m[1]);
  const parsed = new Date(dateStr);
  if (!isNaN(parsed.getTime())) return parsed.getMonth() + 1;
  return null;
}

function getDayFromDate(dateStr) {
  if (!dateStr) return 0;
  // Look for 1 or 2 digits standing alone or at the start
  const m = dateStr.match(/(?:^|\b)(\d{1,2})\b/);
  return m ? parseInt(m[1]) : 0;
}

// ── Year logic ───────────────────────────────────────────────────────
const availableYears = computed(() => {
  const years = new Set(props.items.filter(i => i.year !== 9999).map(i => i.year));
  [2027, 2026, 2025, 2024, 2023, 2022, 2021, 2020].forEach(y => years.add(y));
  return Array.from(years).sort((a, b) => b - a);
});

const initialYear = computed(() => {
  const validItems = props.items.filter(i => i.year !== 9999);
  return validItems.length > 0
    ? Math.max(...validItems.map(i => i.year))
    : new Date().getFullYear();
});

const activeYear = ref(null);
const isYearDropdownOpen = ref(false);

function selectYear(y) {
  activeYear.value = y;
  isYearDropdownOpen.value = false;
}
const transitionName = ref('slide-left');
const activeDetailItemId = ref(null);
// Computed: always reads the freshest data from props.items — no sync needed
const activeDetailItem = computed(() => {
  if (!activeDetailItemId.value) return null;
  return props.items.find(i => i.id === activeDetailItemId.value) || null;
});
const isMapExpanded = ref(false);
let touchStartX = 0;

watch(initialYear, (val) => {
  if (activeYear.value === null) activeYear.value = val;
}, { immediate: true });

// ── Filtered by year ─────────────────────────────────────────────────
const filteredItems = computed(() =>
  props.items.filter(item => item.year === activeYear.value && item.title !== '__SYSTEM_COLLABORATOR_METADATA__')
);


// ── Group by month ───────────────────────────────────────────────────
const monthGroups = computed(() => {
  const map = new Map();
  for (const item of filteredItems.value) {
    const month = getMonthFromDate(item.date) ?? 0;
    if (!map.has(month)) map.set(month, []);
    map.get(month).push(item);
  }
  const sorted = Array.from(map.keys()).sort((a, b) => {
    if (a === 0) return 1;
    if (b === 0) return -1;
    return a - b; // Ascending months
  });
  return sorted.map(month => {
    const items = map.get(month);
    // Sort items by day ascending (1 -> 31)
    items.sort((a, b) => getDayFromDate(a.date) - getDayFromDate(b.date));

    return {
      month,
      label: month > 0 ? BULAN_ID[month - 1] : 'Tanpa Tanggal',
      items,
    };
  });
});

// ── Year slide direction ─────────────────────────────────────────────
watch(activeYear, (newVal, oldVal) => {
  if (oldVal === null) return;
  const ni = availableYears.value.indexOf(newVal);
  const oi = availableYears.value.indexOf(oldVal);
  transitionName.value = ni > oi ? 'slide-left' : 'slide-right';
});

// ── Swipe ────────────────────────────────────────────────────────────
const onTouchStart = e => { touchStartX = e.changedTouches[0].screenX; };
const onTouchEnd = e => {
  const diff = e.changedTouches[0].screenX - touchStartX;
  if (Math.abs(diff) < 60) return;
  const idx = availableYears.value.indexOf(activeYear.value);
  if (diff > 0 && idx > 0) activeYear.value = availableYears.value[idx - 1];
  else if (diff < 0 && idx < availableYears.value.length - 1) activeYear.value = availableYears.value[idx + 1];
};

// ── Map & Detail ─────────────────────────────────────────────────────
const provinceMapModalRef = ref(null);
const openGlobalMap = () => provinceMapModalRef.value?.open();

const openDetail = item => {
  activeDetailItemId.value = item.id;
  document.documentElement.classList.add('modal-open');
  emit('detail-modal-toggled', true);
};
const closeDetail = () => {
  activeDetailItemId.value = null;
  document.documentElement.classList.remove('modal-open');
  emit('detail-modal-toggled', false);
};

// When a moment is deleted externally, close detail if it was open
watch(() => props.items, (newItems) => {
  if (activeDetailItemId.value) {
    const stillExists = newItems.find(i => i.id === activeDetailItemId.value);
    if (!stillExists) closeDetail();
  }
});

// ── Photo Grid Logic (Removed swipe-to-reorder) ───────────────────────
// Reordering is now exclusively handled in the Edit Modal.

onMounted(() => {
  window.addEventListener('open-timeline-detail', e => {
    const item = props.items.find(i => i.id === e.detail);
    if (item) openDetail(item);
  });
});
</script>

<style scoped>
.timeline-view-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow-y: auto; /* Enable vertical scrolling */
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none; /* Firefox - hide scrollbar */
  -ms-overflow-style: none; /* IE/Edge - hide scrollbar */
}

/* Hide scrollbar for Chrome/Safari */
.timeline-view-wrapper::-webkit-scrollbar {
  display: none;
}

/* ── Timeline Section Header ─────────────────────────────────────── */
.timeline-section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0 12px;
  margin-bottom: 8px;
  background: var(--theme-header-bg);
  border-bottom: 2px solid var(--theme-border, #101010);
  position: sticky;
  top: 0;
  z-index: 30;
  transition: background 0.3s ease;
}

.timeline-header-left {
  flex: 1;
  padding-left: 16px;
}

.timeline-section-title {
  font-family: 'Outfit', 'Space Grotesk', sans-serif;
  font-size: 1.6rem;
  font-weight: 900;
  color: var(--theme-header-text, #101010);
  margin: 0;
  line-height: 1.1;
  transition: color 0.3s ease;
}

.timeline-header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-right: 16px;
}

/* Custom Year Dropdown (Button: Normal, Menu: Neo Brutalism) */
.year-selector-wrapper {
  position: relative;
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
}

.year-dropdown-btn {
  appearance: none;
  background: var(--theme-surface);
  color: var(--theme-text);
  font-family: 'Inter', sans-serif;
  font-weight: 700;
  font-size: 0.8rem;
  padding: 6px 30px 6px 14px;
  border: 1px solid var(--theme-border);
  border-radius: 8px;
  cursor: pointer;
  box-shadow: none;
  outline: none;
  transition: all 0.2s ease;
  position: relative;
}

.year-dropdown-btn:hover {
  background: var(--theme-accent);
  color: white;
  border-color: var(--theme-accent);
}

.year-dropdown-btn:active {
  transform: scale(0.98);
}

.dropdown-icon {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  font-size: 0.75rem;
  transition: color 0.2s ease;
}

.year-dropdown-btn:hover .dropdown-icon {
  color: white;
}

.year-dropdown-overlay {
  position: fixed;
  inset: 0;
  z-index: 99;
}

.year-dropdown-menu {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  min-width: 140px;
  background: var(--theme-surface);
  border: 2px solid var(--theme-border);
  border-radius: 0;
  box-shadow: 4px 4px 0 var(--theme-accent-light), 4px 4px 0 2px var(--theme-border);
  z-index: 100;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.year-dropdown-item {
  background: transparent;
  border: none;
  border-bottom: 2px solid var(--theme-border);
  padding: 12px 14px;
  font-family: 'Outfit', sans-serif;
  font-weight: 700;
  font-size: 1rem;
  color: var(--theme-text);
  text-align: left;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.15s;
}

.year-dropdown-item:last-child {
  border-bottom: none;
}

.year-dropdown-item:hover {
  background: var(--theme-accent-light);
  color: var(--theme-text);
}

.year-dropdown-item.is-active {
  background: var(--theme-accent);
  color: white;
  font-weight: 800;
}

.radio-circle {
  width: 16px;
  height: 16px;
  border: 2px solid currentColor;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--theme-surface);
  transition: all 0.15s;
}

.year-dropdown-item.is-active .radio-circle {
  background: white;
  border-color: white;
}

.radio-inner {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--theme-text);
  transition: background 0.15s;
}

.year-dropdown-item.is-active .radio-inner {
  background: var(--theme-accent);
}

/* Map button */
.btn-global-map {
  flex: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: var(--theme-surface, #ffffff);
  color: var(--theme-text, #101010);
  font-size: 1rem;
  border: 1px solid var(--theme-border-light, #e5e7eb);
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-global-map:hover {
  background: var(--theme-dropdown-hover, #f9fafb);
}

.btn-global-map:active {
  background: var(--theme-dropdown-hover, #f3f4f6);
}



/* ── Timeline container ──────────────────────────────────────────── */
.timeline-content-wrapper {
  flex: 1;
  position: relative;
  display: flex;
  flex-direction: column;
}

/* Timeline Swipeable Area - This is where swipe happens */
.timeline-swipeable-area {
  flex: 1;
  position: relative;
  overflow: visible;
  touch-action: pan-y; /* Allow vertical scroll, enable horizontal swipe detection */
}

.timeline-container {
  padding: 0 0 80px;
  position: relative;
}

/* Global Vertical Dotted Line */
.timeline-main-line {
  position: absolute;
  top: 36px;
  bottom: 36px;
  left: 27px;
  width: 0;
  border-left: 2.5px dashed var(--theme-dot-line);
  z-index: 0;
  pointer-events: none;
  transition: border-color 0.3s ease;
}

/* ── Month groups ────────────────────────────────────────────────── */
.month-group {
  margin-bottom: 28px;
  margin-left: 16px;
  margin-right: 16px;
  position: relative;
  z-index: 1;
}

.month-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
  padding-top: 8px;
  padding-bottom: 8px;
  position: sticky;
  top: 0;
  z-index: 10;
  background: var(--theme-month-bg);
  margin-left: -16px;
  margin-right: -16px;
  padding-left: 52px;
  padding-right: 16px;
  transition: background 0.3s ease;
}

.month-label-wrap {
  display: flex;
  align-items: baseline;
  gap: 6px;
  flex-shrink: 0;
}

.month-name {
  font-family: 'Outfit', 'Space Grotesk', sans-serif;
  font-size: 1rem;
  font-weight: 900;
  color: var(--theme-month-label);
  text-transform: uppercase;
  letter-spacing: -0.3px;
  transition: color 0.3s ease;
}

.month-count {
  font-family: 'Inter', sans-serif;
  font-size: 0.68rem;
  font-weight: 700;
  color: var(--theme-month-count-text);
  background: var(--theme-month-count-bg);
  padding: 1px 6px;
  border-radius: 20px;
  transition: background 0.3s ease, color 0.3s ease;
}

.month-line {
  flex: 1;
  height: 1px;
  background: repeating-linear-gradient(90deg, #d1d5db 0px, #d1d5db 5px, transparent 5px, transparent 10px);
}

/* ── Trip list ───────────────────────────────────────────────────── */
.trips-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.trip-row {
  display: flex;
  align-items: stretch;
  gap: 14px;
}

/* Timeline Column on the Left */
.trip-timeline-col {
  width: 22px;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  flex-shrink: 0;
  z-index: 2;
}

.trip-dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 3.5px solid #101010;
  margin-top: 18px; /* Vertically center dot with the first text line of card */
  flex-shrink: 0;
  box-shadow: 2px 2px 0 #101010;
}

/* ── Trip card ───────────────────────────────────────────────────── */
.trip-card {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: flex-start;
  gap: 10px;
  background: var(--theme-moment-layer1, #ffffff);
  border: 2px solid var(--theme-moment-layer2, #101010);
  box-shadow: 3px 3px 0 var(--theme-moment-layer2, #101010);
  padding: 14px 10px 14px 12px;
  cursor: pointer;
  transition: transform 0.1s, box-shadow 0.1s, background-color 0.3s ease;
  -webkit-tap-highlight-color: transparent;
  position: relative;
}

/* Edit button inside trip card */
.btn-trip-edit {
  position: absolute;
  top: -8px;
  right: -8px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #fef08a; /* Yellow */
  border: 1.5px solid #101010;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  color: #854d0e;
  cursor: pointer;
  opacity: 0;
  transform: scale(0.8);
  transition: opacity 0.2s, transform 0.2s;
  z-index: 2;
  box-shadow: 2px 2px 0 #101010;
}
.trip-card:hover .btn-trip-edit,
.trip-card:focus-within .btn-trip-edit {
  opacity: 1;
  transform: scale(1);
}
.btn-trip-edit:hover {
  background: #fde047;
  transform: scale(1) translate(-1px, -1px) !important;
  box-shadow: 3px 3px 0 #101010;
}

.trip-card:hover,
.trip-card:focus {
  transform: translate(-2px, -2px);
  box-shadow: 5px 5px 0 var(--theme-moment-layer2, #101010);
  background: var(--theme-card-hover-bg);
  outline: none;
}

.trip-card:active {
  transform: translate(1px, 1px);
  box-shadow: 1px 1px 0 var(--theme-moment-layer2, #101010);
}


/* Body */
.trip-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.trip-meta { display: flex; flex-direction: column; gap: 5px; }

.trip-title {
  font-family: 'Inter', sans-serif;
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--theme-text, #101010);
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.trip-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.trip-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-family: 'Inter', sans-serif;
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--theme-tag-text);
  background: var(--theme-tag-bg);
  padding: 2px 8px;
  border-radius: 20px;
  transition: background 0.3s ease;
}

.trip-tag i { font-size: 0.65rem; color: var(--theme-accent, #6f6bd8); }
.trip-tag--muted { color: var(--theme-text-muted, #9ca3af); }
.trip-tag--author { background: var(--theme-accent-soft, #f0f0ff); color: var(--theme-accent, #6f6bd8); }
.trip-tag--author i { color: var(--theme-accent, #6f6bd8); }

/* Thumbnail strip */
.thumb-strip {
  display: flex;
  gap: 6px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  padding-bottom: 2px;
}
.thumb-strip::-webkit-scrollbar { display: none; }

.thumb {
  width: 68px;
  height: 68px;
  border-radius: 6px;
  overflow: hidden;
  flex-shrink: 0;
  border: 1.5px solid var(--theme-border-light, #e5e7eb);
  background: var(--theme-surface-2, #f1f5f9);
  transition: background 0.3s ease;
}

.thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.thumb--more {
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Inter', sans-serif;
  font-size: 0.75rem;
  font-weight: 800;
  color: var(--theme-accent, #6f6bd8);
  background: var(--theme-accent-soft, #f4f3ff);
  border-color: var(--theme-accent, #6f6bd8);
}

.thumb-empty {
  font-family: 'Inter', sans-serif;
  font-size: 0.75rem;
  color: var(--theme-text-muted, #9ca3af);
  display: flex;
  align-items: center;
  gap: 5px;
}

/* Chevron */
.trip-chevron {
  flex-shrink: 0;
  color: var(--theme-text-muted, #d1d5db);
  font-size: 0.8rem;
  padding-top: 3px;
  transition: color 0.15s, transform 0.15s;
}
.trip-card:hover .trip-chevron,
.trip-card:focus .trip-chevron { color: #6f6bd8; transform: translateX(2px); }

/* ── Empty state ─────────────────────────────────────────────────── */
.empty-state {
  text-align: center;
  padding: 60px 24px;
  margin: 0 16px;
  border: 2px dashed var(--theme-empty-border);
  background: var(--theme-surface-2);
  border-radius: 16px;
}

.empty-icon {
  font-size: 2.6rem;
  color: var(--theme-text-muted, #d1d5db);
  margin-bottom: 16px;
}

.empty-state h3 {
  font-family: 'Outfit', sans-serif;
  font-size: 1.1rem;
  font-weight: 800;
  color: var(--theme-text, #374151);
  margin: 0 0 8px;
  line-height: 1.3;
}

.empty-state p {
  font-family: 'Inter', sans-serif;
  font-size: 0.85rem;
  color: var(--theme-text-muted, #9ca3af);
  margin: 0 0 20px;
}

.btn-add-empty {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: var(--theme-accent, #6f6bd8);
  color: var(--theme-bg, #ffffff);
  border: 2px solid #101010;
  padding: 10px 20px;
  font-family: 'Inter', sans-serif;
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 3px 3px 0 #101010;
  transition: transform 0.1s;
}
.btn-add-empty:hover { transform: translate(-2px,-2px); }

/* ── FAB ─────────────────────────────────────────────────────────── */

/* ── Slide transitions ───────────────────────────────────────────── */
.slide-left-enter-active,
.slide-left-leave-active,
.slide-right-enter-active,
.slide-right-leave-active {
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}
.slide-left-enter-from  { opacity: 0; transform: translateX(30px); }
.slide-left-leave-to    { opacity: 0; transform: translateX(-30px); }
.slide-right-enter-from { opacity: 0; transform: translateX(-30px); }
.slide-right-leave-to   { opacity: 0; transform: translateX(30px); }

/* ── Fade transition ─────────────────────────────────────────────── */
.fade-enter-active, .fade-leave-active { transition: opacity 0.25s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* ── Detail Modal ────────────────────────────────────────────────── */
.detail-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(15, 23, 42, 0.65);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  z-index: 700;
  display: flex;
  justify-content: center;
  align-items: center; /* Center the modal vertically and horizontally */
  padding: 16px;
  box-sizing: border-box;
}

.detail-modal-content {
  background: var(--theme-modal-bg, #ffffff);
  border: 2px solid var(--theme-modal-border, #101010);
  box-shadow: 6px 6px 0 #101010;
  width: 100%;
  max-width: 700px;
  max-height: 85vh; /* Fixed max height for the modal */
  display: flex;
  flex-direction: column;
  overflow: hidden; /* Prevent the modal itself from scrolling */
  box-sizing: border-box;
}

.detail-fixed-top {
  padding: 20px 20px 0 20px;
  flex-shrink: 0;
}

.detail-gallery-scroll {
  padding: 0 20px 20px 20px;
  flex-grow: 1;
  overflow-y: auto;
}

.detail-header { position: relative; margin-bottom: 20px; }

.detail-header-actions {
  position: absolute;
  top: -10px;
  right: -10px;
  display: flex;
  gap: 8px;
}

.neo-btn {
  font-family: 'Outfit', sans-serif;
  font-weight: 800;
  font-size: 0.8rem;
  border: 2px solid #101010;
  box-shadow: 2px 2px 0 #101010;
  cursor: pointer;
  transition: all 0.1s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}
.neo-btn:active {
  transform: translate(2px, 2px);
  box-shadow: 0 0 0 #101010;
}

.edit-btn {
  background: #fef08a; /* yellow */
  color: #101010;
  padding: 6px 14px;
  border-radius: 6px;
}
.close-btn {
  background: #f43f5e; /* red */
  color: white;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  font-size: 1rem;
}

.detail-title {
  font-family: 'Outfit', sans-serif;
  font-size: 1.8rem;
  color: var(--theme-text, #101010);
  margin: 0 0 12px;
  font-weight: 800;
  padding-right: 80px; /* space for absolute buttons */
}

.detail-subtitle-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 20px;
}

.neo-pill {
  font-family: 'Inter', sans-serif;
  font-size: 0.8rem;
  font-weight: 700;
  border: 2px solid #101010;
  padding: 6px 12px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--theme-modal-bg, #ffffff);
  color: var(--theme-text, #101010);
}

.map-pill {
  background: var(--theme-accent-soft, #e0e7ff); /* soft indigo */
  cursor: default;
}
.map-pill.has-map {
  cursor: pointer;
  box-shadow: 2px 2px 0 #101010;
  transition: all 0.1s ease;
}
.map-pill.has-map:active {
  transform: translate(2px, 2px);
  box-shadow: 0 0 0 #101010;
}
.map-chevron {
  transition: transform 0.2s ease;
}

.date-pill {
  background: var(--theme-surface-2, #f3f4f6);
}

.detail-map-container {
  margin-bottom: 20px;
}
.neo-iframe {
  border: 2px solid #101010 !important;
  box-shadow: 4px 4px 0 #101010;
  border-radius: 12px;
}

.gallery-grid-neo {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

@media (min-width: 600px) {
  .gallery-grid-neo {
    grid-template-columns: repeat(3, 1fr); /* 3x3 layout max 9 photos */
    gap: 20px;
  }
}

.gallery-empty {
  text-align: center;
  padding: 40px 20px;
  color: var(--theme-text-muted, #9ca3af);
  font-family: 'Inter', sans-serif;
  font-weight: 500;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}
.gallery-empty i {
  font-size: 2.5rem;
  color: var(--theme-text-muted, #d1d5db);
}

.gallery-card-wrap {
  position: relative;
  touch-action: pan-y; /* let vertical scroll still work except when swiping */
  user-select: none;
  transition: transform 0.18s ease, opacity 0.18s ease;
}

.gallery-card-wrap.is-dragging {
  opacity: 0.55;
  transform: scale(0.96);
}

.drag-hint {
  position: absolute;
  top: 8px;
  left: 8px;
  width: 26px;
  height: 26px;
  background: rgba(255,255,255,0.75);
  backdrop-filter: blur(4px);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  color: #6f6bd8;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.2s;
}

.gallery-card-wrap:active .drag-hint,
.gallery-card-wrap.is-dragging .drag-hint {
  opacity: 1;
}

:global(html.modal-open),
:global(html.modal-open body) {
  overflow: hidden !important;
  height: 100vh !important;
}

@media (max-width: 480px) {
  .page-header {
    margin: 0;
    padding: 12px 16px 8px;
  }
}
</style>
