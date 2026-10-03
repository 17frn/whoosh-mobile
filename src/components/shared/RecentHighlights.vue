<template>
  <div class="recent-highlights-section">
    <!-- Section Header -->
    <div class="highlights-header">
      <h2 class="header-title">
        <i class="fa-solid fa-sparkles"></i>
        Recent Highlights
      </h2>
      <div class="header-count">{{ recentItems.length }}×</div>
    </div>

    <!-- Horizontal Scroll Container -->
    <div class="highlights-scroll-container">
      <div class="highlights-track">
        <!-- Recent Highlight Cards -->
        <div
          v-for="item in recentItems"
          :key="item.id"
          class="highlight-card"
          @click="$emit('open-detail', item)"
          role="button"
          tabindex="0"
          @keydown.enter="$emit('open-detail', item)"
        >
          <!-- Image Thumbnail -->
          <div class="highlight-image-wrapper">
            <img
              v-if="item.moments && item.moments.length > 0"
              :src="item.moments[0].image"
              :alt="item.title"
              class="highlight-image"
              loading="lazy"
            />
            <div v-else class="highlight-image-placeholder">
              <i class="fa-regular fa-image"></i>
            </div>

            <!-- Overlay Badge -->
            <div class="highlight-badge" :style="{ background: item.dotColor }">
              <i class="fa-solid fa-location-dot"></i>
            </div>
          </div>

          <!-- Card Content -->
          <div class="highlight-content">
            <h3 class="highlight-title">{{ item.title }}</h3>
            <div class="highlight-meta">
              <span class="highlight-location" v-if="item.location">
                <i class="fa-solid fa-map-marker-alt"></i>
                {{ truncate(item.location, 15) }}
              </span>
              <span class="highlight-date" v-if="item.date">
                {{ formatDate(item.date) }}
              </span>
            </div>

            <!-- Photos Count Badge -->
            <div class="highlight-photos-count" v-if="item.moments && item.moments.length > 0">
              <i class="fa-solid fa-images"></i>
              {{ item.moments.length }} foto
            </div>
          </div>

          <!-- Chevron Icon -->
          <div class="highlight-chevron">
            <i class="fa-solid fa-chevron-right"></i>
          </div>
        </div>

        <!-- Empty State Card -->
        <div v-if="recentItems.length === 0" class="highlight-card highlight-empty">
          <div class="empty-content">
            <i class="fa-regular fa-compass"></i>
            <p>Belum ada momen terbaru</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { TimelineData } from '../../data/timeline';

const props = defineProps<{
  items: TimelineData[];
  maxItems?: number;
}>();

defineEmits<{
  'open-detail': [item: TimelineData];
}>();

// ── Date parsing helpers (same as HomeView) ───────────────────────
const BULAN_ID = [
  'Januari','Februari','Maret','April','Mei','Juni',
  'Juli','Agustus','September','Oktober','November','Desember'
];

const ID_UP = BULAN_ID.map(b => b.toUpperCase());
const EN_UP = ['JANUARY','FEBRUARY','MARCH','APRIL','MAY','JUNE','JULY','AUGUST','SEPTEMBER','OCTOBER','NOVEMBER','DECEMBER'];
const SH_UP = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];

function getMonthFromDate(dateStr: string): number | null {
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

function getDayFromDate(dateStr: string): number {
  if (!dateStr) return 0;
  // Look for 1 or 2 digits standing alone or at the start
  const m = dateStr.match(/(?:^|\b)(\d{1,2})\b/);
  return m ? parseInt(m[1]) : 0;
}

// Get recent items (sorted by year DESC, month DESC, day DESC)
const recentItems = computed(() => {
  const validItems = props.items.filter(
    item => item.title !== '__SYSTEM_COLLABORATOR_METADATA__' && item.year !== 9999
  );

  // Sort by year (newest first), then month (newest first), then day (newest first)
  const sorted = [...validItems].sort((a, b) => {
    // 1. Sort by year descending (2026 before 2025)
    if (a.year !== b.year) return b.year - a.year;

    // 2. Sort by month descending (December before January)
    const monthA = getMonthFromDate(a.date) ?? 0;
    const monthB = getMonthFromDate(b.date) ?? 0;
    if (monthA !== monthB) return monthB - monthA;

    // 3. Sort by day descending (31 before 1)
    const dayA = getDayFromDate(a.date);
    const dayB = getDayFromDate(b.date);
    return dayB - dayA;
  });

  return sorted.slice(0, props.maxItems || 5);
});

function truncate(text: string, maxLength: number): string {
  if (!text) return '';
  return text.length > maxLength ? text.slice(0, maxLength) + '...' : text;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  // Simple format - just return first 10 chars or original
  return dateStr.length > 12 ? dateStr.slice(0, 12) + '...' : dateStr;
}
</script>

<style scoped>
/* ── Section Container ──────────────────────────────────────────── */
.recent-highlights-section {
  padding: 0;
  background: transparent;
}

/* ── Header (Sticky) ────────────────────────────────────────────── */
.highlights-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px 14px;
  background: var(--theme-header-bg);
  position: sticky;
  top: 0;
  z-index: 25;
  border-bottom: 1px solid var(--theme-header-border);
  transition: background 0.3s ease;
}

.header-title {
  font-family: 'Outfit', 'Space Grotesk', sans-serif;
  font-size: 1.6rem;
  font-weight: 900;
  color: var(--theme-header-text, #101010);
  margin: 0;
  line-height: 1.1;
  display: flex;
  align-items: center;
  gap: 10px;
  transition: color 0.3s ease;
}

.header-title i {
  font-size: 1.4rem;
  color: var(--theme-accent, #6f6bd8);
}

.header-count {
  font-family: 'Inter', sans-serif;
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--theme-text, #101010);
  background: var(--theme-surface, #ffffff);
  border: 1px solid var(--theme-border-light, #e5e7eb);
  border-radius: 8px;
  padding: 6px 14px;
  box-shadow: none;
  transition: all 0.15s;
}

.header-count:hover {
  background: #f9fafb;
}

/* ── Horizontal Scroll ──────────────────────────────────────────── */
.highlights-scroll-container {
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE/Edge */
  padding: 20px 0;
}

.highlights-scroll-container::-webkit-scrollbar {
  display: none; /* Chrome/Safari */
}

.highlights-track {
  display: flex;
  gap: 12px;
  padding: 0 20px;
  min-width: min-content;
}

/* ── Highlight Card (Neo Brutalism - Compact) ───────────────────── */
.highlight-card {
  flex: 0 0 220px;
  width: 220px;
  background: var(--theme-surface, #ffffff);
  border: 3px solid var(--theme-border, #101010);
  border-radius: 12px;
  box-shadow: 4px 4px 0 var(--theme-border, #101010);
  cursor: pointer;
  transition: all 0.12s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  position: relative;
  display: flex;
  flex-direction: column;
  -webkit-tap-highlight-color: transparent;
}

.highlight-card:hover {
  transform: translate(-2px, -2px);
  box-shadow: 6px 6px 0 var(--theme-border, #101010);
}

.highlight-card:active {
  transform: translate(1px, 1px);
  box-shadow: 2px 2px 0 var(--theme-border, #101010);
}

/* ── Image Section ──────────────────────────────────────────────── */
.highlight-image-wrapper {
  position: relative;
  width: 100%;
  height: 110px;
  background: var(--theme-bg-alt, #f5f5f0);
  border-bottom: 3px solid var(--theme-border, #101010);
  overflow: hidden;
}

.highlight-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.highlight-image-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--theme-bg-alt, #f5f5f0);
  color: var(--theme-text-muted, #7c7060);
  font-size: 2rem;
}

/* ── Badge Overlay ──────────────────────────────────────────────── */
.highlight-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 28px;
  height: 28px;
  background: #6f6bd8;
  border: 2.5px solid var(--theme-border, #101010);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  font-size: 0.75rem;
}

/* ── Content Section ────────────────────────────────────────────── */
.highlight-content {
  padding: 10px 12px 12px;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.highlight-title {
  font-family: 'Outfit', sans-serif;
  font-size: 0.9rem;
  font-weight: 800;
  color: var(--theme-text, #101010);
  margin: 0;
  line-height: 1.25;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.highlight-meta {
  display: flex;
  flex-direction: column;
  gap: 3px;
  font-family: 'Inter', sans-serif;
  font-size: 0.7rem;
}

.highlight-location {
  display: flex;
  align-items: center;
  gap: 5px;
  color: var(--theme-text-muted, #7c7060);
  font-weight: 600;
}

.highlight-location i {
  font-size: 0.65rem;
  color: var(--theme-accent, #6f6bd8);
}

.highlight-date {
  color: var(--theme-text-muted, #9ca3af);
  font-weight: 500;
  font-size: 0.65rem;
}

.highlight-photos-count {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  align-self: flex-start;
  font-family: 'Inter', sans-serif;
  font-size: 0.65rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  color: var(--theme-text, #101010);
  background: #fef08a;
  border: 2px solid var(--theme-border, #101010);
  border-radius: 10px;
  padding: 2px 8px;
  margin-top: 2px;
  box-shadow: 1px 1px 0 var(--theme-border, #101010);
}

.highlight-photos-count i {
  font-size: 0.6rem;
}

/* ── Chevron Icon ───────────────────────────────────────────────── */
.highlight-chevron {
  position: absolute;
  bottom: 10px;
  right: 10px;
  width: 24px;
  height: 24px;
  background: var(--theme-accent, #6f6bd8);
  border: 2.5px solid var(--theme-border, #101010);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  font-size: 0.7rem;
  transition: transform 0.12s ease;
}

.highlight-card:hover .highlight-chevron {
  transform: translateX(1px);
}

/* ── Empty State ────────────────────────────────────────────────── */
.highlight-empty {
  cursor: default;
  border-style: dashed;
  border-color: var(--theme-border-light, #d1d5db);
}

.highlight-empty:hover {
  transform: none;
  box-shadow: 4px 4px 0 var(--theme-border, #101010);
}

.empty-content {
  width: 100%;
  height: 160px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: var(--theme-text-muted, #7c7060);
}

.empty-content i {
  font-size: 2.2rem;
  color: var(--theme-border-light, #d1d5db);
}

.empty-content p {
  font-family: 'Inter', sans-serif;
  font-size: 0.8rem;
  font-weight: 600;
  margin: 0;
}

/* ── Responsive ─────────────────────────────────────────────────── */
@media (max-width: 480px) {
  .highlight-card {
    flex: 0 0 200px;
    width: 200px;
  }

  .highlight-image-wrapper {
    height: 100px;
  }

  .header-title {
    font-size: 0.95rem;
  }

  .header-count {
    font-size: 0.65rem;
    padding: 2px 8px;
  }
}
</style>
