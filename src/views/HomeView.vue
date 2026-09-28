<template>
  <div
    class="timeline-view-wrapper"
    @touchstart="onTouchStart"
    @touchend="onTouchEnd"
  >
    <!-- Page Header -->
    <div class="page-header">
      <div class="header-top">
        <h1 class="page-title">Galeri</h1>
      </div>

      <div class="header-actions-container">
        <!-- Custom Year Selector (Neo Brutalism Pastel) -->
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

    <!-- Timeline Content with slide transition -->
    <div class="timeline-content-wrapper">
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
                    :style="{ backgroundColor: getCardBackground(item.dotColor) }"
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


    <!-- Detail Modal -->
    <Transition name="fade">
      <div v-if="activeDetailItem" class="detail-modal-overlay" @click.self="closeDetail">
        <div class="detail-modal-content">

          <!-- Fixed top: header + map + edit button -->
          <div class="detail-fixed-top">
            <div class="detail-header">
              <button class="back-link-btn" @click="closeDetail">&larr; Kembali</button>
              
              <div class="detail-header-actions">
                <div class="action-btn-wrap">
                  <button class="btn-detail-action" @click="isGalleryLocked = !isGalleryLocked" aria-label="Toggle Kunci" title="Kunci/Buka Posisi Foto">
                    <i class="fa-solid" :class="isGalleryLocked ? 'fa-lock' : 'fa-lock-open'"></i>
                  </button>
                  <span class="action-label">{{ isGalleryLocked ? 'Terkunci' : 'Terbuka' }}</span>
                </div>
                <div class="action-btn-wrap">
                  <button class="btn-detail-action" @click="$emit('edit-moment', activeDetailItem)" aria-label="Edit Momen" title="Edit Momen">
                    <i class="fa-solid fa-pencil"></i>
                  </button>
                  <span class="action-label">Edit</span>
                </div>
              </div>
              <h2 class="detail-title">{{ activeDetailItem.title }}</h2>
              <p class="detail-subtitle">
                <span v-if="activeDetailItem.location">
                  <i class="fa-solid fa-location-dot"></i> {{ activeDetailItem.location }}
                </span>
                <span v-if="activeDetailItem.date">
                  &nbsp;•&nbsp;<i class="fa-regular fa-calendar"></i> {{ activeDetailItem.date }}
                </span>
              </p>
            </div>

            <!-- Map embed -->
            <div v-if="isValidMapUrl(activeDetailItem.mapEmbedUrl)" class="detail-map-container">
              <iframe
                :src="activeDetailItem.mapEmbedUrl"
                width="100%"
                height="200"
                style="border:0; border-radius: 12px;"
                allowfullscreen="false"
                loading="lazy"
                referrerpolicy="no-referrer-when-downgrade"
              ></iframe>
            </div>
          </div>
          <!-- /Fixed top -->

          <!-- Scrollable gallery section -->
          <div class="detail-gallery-scroll">
            <div class="gallery-grid" :style="`direction: ${activeDetailItem.rtl ? 'rtl' : 'ltr'}`">
              <div
                v-for="(momen, idx) in activeDetailItem.moments"
                :key="idx"
                class="gallery-card-wrap"
                :class="{ 'is-dragging': draggingPhotoIdx === idx }"
                @touchstart.passive="onPhotoTouchStart(idx, $event)"
                @touchend="onPhotoTouchEnd(idx, $event)"
              >
                <TimelineCard
                  :image="momen.image"
                  :title="momen.title"
                  :description="momen.description"
                  :accentColor="momen.accentColor"
                />
                <div class="drag-hint"><i class="fa-solid fa-arrows-up-down-left-right"></i></div>
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
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import TimelineCard from '../components/feed/TimelineCard.vue';

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

// ── Year logic ───────────────────────────────────────────────────────
const availableYears = computed(() => {
  const years = new Set(props.items.map(i => i.year));
  [2027, 2026, 2025, 2024, 2023, 2022, 2021, 2020].forEach(y => years.add(y));
  return Array.from(years).sort((a, b) => b - a);
});

const initialYear = computed(() =>
  props.items.length > 0
    ? Math.max(...props.items.map(i => i.year))
    : new Date().getFullYear()
);

const activeYear = ref(null);
const isYearDropdownOpen = ref(false);

function selectYear(y) {
  activeYear.value = y;
  isYearDropdownOpen.value = false;
}
const transitionName = ref('slide-left');
const activeDetailItem = ref(null);
const isGalleryLocked = ref(true); // Default to locked to prevent accidental swipe
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
    return a - b;
  });
  return sorted.map(month => ({
    month,
    label: month > 0 ? BULAN_ID[month - 1] : 'Tanpa Tanggal',
    items: map.get(month),
  }));
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
const openGlobalMap = () => window.dispatchEvent(new Event('open-global-map'));

const openDetail = item => {
  activeDetailItem.value = item;
  document.documentElement.classList.add('modal-open');
  emit('detail-modal-toggled', true);
};
const closeDetail = () => {
  activeDetailItem.value = null;
  document.documentElement.classList.remove('modal-open');
  emit('detail-modal-toggled', false);
};

// ── Swipe-to-reorder photos ──────────────────────────────────────────
const draggingPhotoIdx = ref(null);
let swipeTouchStartX = 0;
let swipeTouchStartY = 0;

function onPhotoTouchStart(idx, e) {
  if (isGalleryLocked.value) return;
  draggingPhotoIdx.value = idx;
  swipeTouchStartX = e.touches[0].clientX;
  swipeTouchStartY = e.touches[0].clientY;
}

function onPhotoTouchEnd(idx, e) {
  if (isGalleryLocked.value || draggingPhotoIdx.value !== idx) return;
  
  const dx = e.changedTouches[0].clientX - swipeTouchStartX;
  const dy = e.changedTouches[0].clientY - swipeTouchStartY;
  const adx = Math.abs(dx), ady = Math.abs(dy);
  if (adx < 10 && ady < 10) { draggingPhotoIdx.value = null; return; }

  const moments = [...(activeDetailItem.value?.moments || [])];
  if (moments.length < 2) { draggingPhotoIdx.value = null; return; }

  let newIdx = idx;
  if (adx > ady) {
    // horizontal swipe — left moves backward, right moves forward
    newIdx = dx < 0 ? idx - 1 : idx + 1;
  } else {
    // vertical swipe — up moves backward, down moves forward
    newIdx = dy < 0 ? idx - 1 : idx + 1;
  }

  newIdx = Math.max(0, Math.min(moments.length - 1, newIdx));
  if (newIdx === idx) { draggingPhotoIdx.value = null; return; }

  // Swap
  [moments[idx], moments[newIdx]] = [moments[newIdx], moments[idx]];
  activeDetailItem.value = { ...activeDetailItem.value, moments };

  // Persist reorder via parent
  emit('reorder-photos', { momentId: activeDetailItem.value.id, moments });

  draggingPhotoIdx.value = null;
}

// ── Color Generation Helper ──────────────────────────────────────────
function getCardBackground(color) {
  if (!color) return '#ffffff';
  let baseColor = color;
  if (color.startsWith('var(')) {
    const varName = color.replace('var(', '').replace(')', '').trim();
    // Resolve CSS variables dynamically from document or fallback to standard palette
    const rootStyles = typeof window !== 'undefined' ? getComputedStyle(document.documentElement) : null;
    const resolved = rootStyles ? rootStyles.getPropertyValue(varName).trim() : '';
    if (resolved) {
      baseColor = resolved;
    } else {
      const accents = {
        '--accent-1': '#6366f1',
        '--accent-2': '#14b8a6',
        '--accent-3': '#0ea5e9',
        '--accent-4': '#f43f5e',
        '--accent-5': '#8b5cf6',
        '--accent-6': '#f59e0b',
        '--accent-7': '#fd7979',
        '--accent-8': '#3f9aae'
      };
      baseColor = accents[varName] || '#6366f1';
    }
  }
  
  // Parse hex to rgba with very soft (7%) opacity
  if (baseColor.startsWith('#')) {
    const hex = baseColor.replace('#', '').trim();
    let r = 0, g = 0, b = 0;
    if (hex.length === 3) {
      r = parseInt(hex[0] + hex[0], 16);
      g = parseInt(hex[1] + hex[1], 16);
      b = parseInt(hex[2] + hex[2], 16);
    } else if (hex.length === 6) {
      r = parseInt(hex.substring(0, 2), 16);
      g = parseInt(hex.substring(2, 4), 16);
      b = parseInt(hex.substring(4, 6), 16);
    }
    return `rgba(${r}, ${g}, ${b}, 0.07)`;
  }
  return baseColor;
}

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
  padding-bottom: 20px;
}

/* ── Page Header ────────────────────────────────────── */
.page-header {
  padding: 12px 20px 8px;
  background: transparent;
  margin: 0;
  position: sticky;
  top: 0;
  z-index: 100;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-top {
  margin: 0;
}

.page-title {
  font-family: 'Outfit', 'Space Grotesk', sans-serif;
  font-size: 1.6rem;
  font-weight: 900;
  color: #101010;
  margin: 0;
  line-height: 1.1;
}

.header-actions-container {
  display: flex;
  align-items: center;
  gap: 10px;
}

/* Custom Year Dropdown (Neo Brutalism Pastel) */
.year-selector-wrapper {
  position: relative;
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
}

.year-dropdown-btn {
  appearance: none;
  background: #ffffff;
  color: #101010;
  font-family: 'Inter', sans-serif;
  font-weight: 700;
  font-size: 0.8rem;
  padding: 6px 30px 6px 14px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  box-shadow: none;
  outline: none;
  transition: all 0.15s;
}

.year-dropdown-btn:hover {
  background: #f9fafb;
}

.year-dropdown-btn:active {
  background: #f3f4f6;
}

.dropdown-icon {
  position: absolute;
  right: 10px;
  pointer-events: none;
  color: #101010;
  font-size: 0.75rem;
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
  width: 140px;
  background: #ffffff;
  border: 2px solid #101010;
  box-shadow: 4px 4px 0 #ffe4e6, 4px 4px 0 2px #101010;
  z-index: 100;
  display: flex;
  flex-direction: column;
}

.year-dropdown-item {
  background: transparent;
  border: none;
  border-bottom: 2px solid #101010;
  padding: 12px 14px;
  font-family: 'Outfit', sans-serif;
  font-weight: 700;
  font-size: 1rem;
  color: #101010;
  text-align: left;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: background 0.15s;
}

.year-dropdown-item:last-child {
  border-bottom: none;
}

.year-dropdown-item:hover, .year-dropdown-item.is-active {
  background: #ffe4e6;
}

.radio-circle {
  width: 16px;
  height: 16px;
  border: 2px solid #101010;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
}

.radio-inner {
  width: 8px;
  height: 8px;
  background: #101010;
  border-radius: 50%;
}

/* Map button */
.btn-global-map {
  flex: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: #ffffff;
  color: #101010;
  font-size: 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-global-map:hover { background: #f9fafb; }
.btn-global-map:active { background: #f3f4f6; }



/* ── Timeline container ──────────────────────────────────────────── */
.timeline-content-wrapper {
  position: relative;
  min-height: 300px;
}

.timeline-container {
  padding: 20px 16px 8px;
  position: relative;
}

/* Global Vertical Dotted Line */
.timeline-main-line {
  position: absolute;
  top: 36px;
  bottom: 36px;
  left: 27px; /* Align precisely with the center of the 14px dots (padding-left 16px + column center 11px) */
  width: 0;
  border-left: 2.5px dashed #cbd5e1;
  z-index: 0;
  pointer-events: none;
}

/* ── Month groups ────────────────────────────────────────────────── */
.month-group {
  margin-bottom: 28px;
  position: relative;
  z-index: 1;
}

.month-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
  padding-left: 36px; /* Offset to align month name with card text, keeping line area clear */
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
  color: #101010;
  text-transform: uppercase;
  letter-spacing: -0.3px;
}

.month-count {
  font-family: 'Inter', sans-serif;
  font-size: 0.68rem;
  font-weight: 700;
  color: #9ca3af;
  background: #f1f5f9;
  padding: 1px 6px;
  border-radius: 20px;
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
  background: #ffffff;
  border: 2px solid #101010;
  box-shadow: 3px 3px 0 #101010;
  padding: 14px 10px 14px 12px;
  cursor: pointer;
  transition: transform 0.1s, box-shadow 0.1s, background-color 0.2s ease;
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
  box-shadow: 5px 5px 0 #101010;
  outline: none;
}

.trip-card:active {
  transform: translate(1px, 1px);
  box-shadow: 1px 1px 0 #101010;
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
  color: #101010;
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
  color: #374151;
  background: #f1f5f9;
  padding: 2px 8px;
  border-radius: 20px;
}

.trip-tag i { font-size: 0.65rem; color: #6f6bd8; }
.trip-tag--muted { color: #9ca3af; }
.trip-tag--author { background: #f0f0ff; color: #6f6bd8; }
.trip-tag--author i { color: #6f6bd8; }

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
  border: 1.5px solid #e5e7eb;
  background: #f1f5f9;
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
  color: #6f6bd8;
  background: #f4f3ff;
  border-color: #6f6bd8;
}

.thumb-empty {
  font-family: 'Inter', sans-serif;
  font-size: 0.75rem;
  color: #9ca3af;
  display: flex;
  align-items: center;
  gap: 5px;
}

/* Chevron */
.trip-chevron {
  flex-shrink: 0;
  color: #d1d5db;
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
  border: 2px dashed #d1d5db;
  background: #fafafa;
}

.empty-icon {
  font-size: 2.6rem;
  color: #d1d5db;
  margin-bottom: 16px;
}

.empty-state h3 {
  font-family: 'Outfit', sans-serif;
  font-size: 1.1rem;
  font-weight: 800;
  color: #374151;
  margin: 0 0 8px;
  line-height: 1.3;
}

.empty-state p {
  font-family: 'Inter', sans-serif;
  font-size: 0.85rem;
  color: #9ca3af;
  margin: 0 0 20px;
}

.btn-add-empty {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #6f6bd8;
  color: #ffffff;
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
  background: #ffffff;
  border: 2px solid #101010;
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
  top: 0;
  right: 0;
  display: flex;
  gap: 12px;
}

.action-btn-wrap {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 6px;
}

.action-label {
  font-size: 0.65rem;
  font-weight: 700;
  color: #6b7280;
  font-family: 'Inter', sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.btn-detail-action {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: #fef08a; /* solid yellow background for both */
  color: #854d0e;
  border: 1.5px solid #101010;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  cursor: pointer;
  transition: background 0.2s, opacity 0.2s;
}
.btn-detail-action:hover {
  background: #fde047;
  opacity: 0.9;
}
.btn-detail-action:active {
  opacity: 0.7;
}

.back-link-btn {
  background: none;
  border: none;
  color: #6f6bd8;
  font-family: 'Inter', sans-serif;
  font-weight: 700;
  font-size: 0.9rem;
  cursor: pointer;
  padding: 0;
  margin-bottom: 12px;
  display: inline-block;
}
.back-link-btn:hover { text-decoration: underline; }

.detail-title {
  font-family: 'Outfit', sans-serif;
  font-size: 1.6rem;
  color: #101010;
  margin: 0 0 6px;
  font-weight: 800;
}

.detail-subtitle {
  font-family: 'Inter', sans-serif;
  font-size: 0.82rem;
  color: #9ca3af;
  margin: 0;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 2px;
  flex-wrap: wrap;
}
.detail-subtitle i { color: #6f6bd8; }

.detail-map-container {
  margin-bottom: 20px;
  border-radius: 8px;
  overflow: hidden;
}

.gallery-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

@media (min-width: 600px) {
  .gallery-grid {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 16px;
  }
}

.gallery-empty {
  text-align: center;
  padding: 40px 20px;
  color: #9ca3af;
  font-family: 'Inter', sans-serif;
  font-weight: 500;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}
.gallery-empty i {
  font-size: 2.5rem;
  color: #d1d5db;
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
