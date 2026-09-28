<template>
  <div class="timeline-section" :class="{ 'is-alternate': isAlternate, 'is-first': isFirst }" :style="{ marginTop: marginTop }">
    <FloatingIcons v-if="isAlternate" :isDarkTheme="true" :count="20" :sizeModifier="1.6" />
    <div class="section-inner">
      <div class="section-timeline-line"></div>
      <div class="timeline-dot" :style="{ backgroundColor: dotColor }"></div>
      
      <div class="timeline-header">
        <div class="header-text">
          <h2 v-html="title"></h2>
          <div v-if="location" class="location">
            <i class="fa-solid fa-location-dot"></i> {{ location }}
          </div>
          <div class="date">{{ date }}</div>
        </div>
        <div class="header-actions">
          <button v-if="mapEmbedUrl" @click="openMap" class="btn-map" aria-label="Lihat Peta Lokasi">
            <i class="fa-solid fa-map-location-dot"></i> Lihat Peta
          </button>
          <button @click="$emit('open-detail')" class="link-all">Lihat Semua Tempat &gt;</button>
        </div>
      </div>

      <!-- Grid Foto -->
      <div class="timeline-grid" :style="{ direction: rtl ? 'rtl' : 'ltr' }">
        <slot />
      </div>
    </div>

    <!-- Map Dialog Modal -->
    <dialog ref="mapDialog" class="map-dialog" @click="onDialogClick" @close="onDialogClose">
      <div class="dialog-content">
        <button class="close-btn" @click="closeMap" aria-label="Tutup Peta">
          <i class="fa-solid fa-xmark"></i>
        </button>
        <div class="iframe-container">
          <iframe 
            :src="mapEmbedUrl" 
            width="100%" 
            height="100%" 
            style="border:0;" 
            allowfullscreen="false" 
            loading="lazy" 
            referrerpolicy="no-referrer-when-downgrade">
          </iframe>
        </div>
      </div>
    </dialog>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import FloatingIcons from './FloatingIcons.vue';

defineProps({
  title: String,
  date: String,
  location: String,
  dotColor: {
    type: String,
    default: '#e66a5c'
  },
  marginTop: {
    type: String,
    default: '0px'
  },
  link: {
    type: String,
    default: ''
  },
  rtl: {
    type: Boolean,
    default: false
  },
  isAlternate: {
    type: Boolean,
    default: false
  },
  mapEmbedUrl: {
    type: String,
    default: ''
  },
  isFirst: {
    type: Boolean,
    default: false
  }
});

defineEmits(['open-detail']);

const mapDialog = ref(null);


const openMap = () => {
  if (mapDialog.value) {
    mapDialog.value.showModal();
    document.documentElement.classList.add('modal-open');
  }
};

const closeMap = () => {
  if (mapDialog.value) {
    mapDialog.value.close();
    document.body.style.overflow = '';
  }
};

const onDialogClick = (e) => {
  if (e.target === mapDialog.value) closeMap();
};

const onDialogClose = () => {
  document.documentElement.classList.remove('modal-open');
};
</script>

<style scoped>
.timeline-section {
  position: relative;
  z-index: 1;
  padding: 40px 0; /* Vertical padding to give space to the full-bleed background */
  margin-bottom: 80px;
}

/* Full bleed alternate background */
.timeline-section.is-alternate {
  background-color: #624896;
  width: 100vw;
  margin-left: calc(50% - 50vw);
}

.section-inner {
  position: relative;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

/* The dotted line inside the section */
.section-timeline-line {
  position: absolute;
  top: -190px; /* cover margin-top (150) + padding-top (40) */
  bottom: -150px; /* cover margin-bottom (80) + padding-bottom (40) + extra to reach next */
  left: 50%;
  width: 2px;
  background-image: linear-gradient(to bottom, #cbd5e1 50%, transparent 50%);
  background-size: 2px 14px;
  background-repeat: repeat-y;
  transform: translateX(-50%);
  z-index: 0;
}

.timeline-section.is-first .section-timeline-line {
  top: -40px; /* Don't extend up for the first section as requested */
}

/* Alternate dotted line color */
.timeline-section.is-alternate .section-timeline-line {
  background-image: linear-gradient(to bottom, rgba(255, 255, 255, 0.4) 50%, transparent 50%);
}

.timeline-dot {
  position: absolute;
  left: 50%;
  top: 10px;
  transform: translateX(-50%);
  width: 14px;
  height: 14px;
  border: 3px solid var(--bg-color);
  border-radius: 50%;
  z-index: 2;
  transition: border-color 0.3s;
}

.timeline-section.is-alternate .timeline-dot {
  border-color: #624896;
}

.timeline-header {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 40px;
  padding-top: 20px;
  position: relative;
  padding-bottom: 10px;
  z-index: 2;
}

.header-text {
  background-color: var(--bg-color);
  padding: 10px 20px 10px 0;
  border-radius: 8px;
  transition: background-color 0.3s;
}

.timeline-section.is-alternate .header-text {
  background-color: transparent;
}

h2 {
  font-size: 2.2rem;
  color: var(--text-main);
  margin: 0 0 5px 0;
  font-weight: 700;
  line-height: 1.2;
  transition: color 0.3s;
}

.timeline-section.is-alternate h2 {
  color: #ffffff;
}

.date {
  font-size: 1rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 2px;
  font-weight: 600;
  transition: color 0.3s;
}

.location {
  font-size: 0.9rem;
  color: var(--text-muted);
  font-weight: 600;
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: color 0.3s;
}

.location i {
  font-size: 0.85rem;
}

.timeline-section.is-alternate .location {
  color: rgba(255, 255, 255, 0.75);
}

.timeline-section.is-alternate .date {
  color: rgba(255, 255, 255, 0.7);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.btn-map {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #ffffff;
  text-decoration: none;
  font-weight: 600;
  font-size: 0.9rem;
  background-color: #7c6fbf;
  border: none;
  padding: 8px 16px;
  border-radius: 20px;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(124, 111, 191, 0.35);
  transition: all 0.25s ease;
  font-family: 'Inter', sans-serif;
}

.btn-map:hover {
  background-color: #6558a8;
  transform: translateY(-2px);
  box-shadow: 0 4px 14px rgba(124, 111, 191, 0.5);
}

.timeline-section.is-alternate .btn-map {
  background-color: rgba(255, 255, 255, 0.2);
  color: #ffffff;
  backdrop-filter: blur(8px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.timeline-section.is-alternate .btn-map:hover {
  background-color: rgba(255, 255, 255, 0.35);
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.2);
}

.link-all {
  color: var(--accent-1);
  text-decoration: none;
  font-weight: 600;
  font-size: 1rem;
  background-color: var(--bg-color);
  padding: 8px 20px;
  border-radius: 20px;
  transition: all 0.3s;
  border: none;
  cursor: pointer;
  font-family: 'Inter', sans-serif;
}


.timeline-section.is-alternate .link-all {
  background-color: rgba(255, 255, 255, 0.1);
  color: #ffffff;
  backdrop-filter: blur(8px);
}

.timeline-section.is-alternate .link-all:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

.timeline-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  padding: 0;
}

@media (min-width: 640px) {
  .timeline-grid {
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 24px;
  }
}

/* Glassmorphism for cards in alternate section */
:deep(.card) {
  transition: all 0.3s ease;
}

.timeline-section.is-alternate :deep(.card) {
  background: rgba(255, 255, 255, 0.1) !important;
  backdrop-filter: blur(12px) !important;
  -webkit-backdrop-filter: blur(12px) !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2) !important;
}

.timeline-section.is-alternate :deep(.card h3) {
  color: #ffffff !important;
}

.timeline-section.is-alternate :deep(.card p) {
  color: rgba(255, 255, 255, 0.8) !important;
}

.timeline-section.is-alternate :deep(.card .card-content) {
  background: transparent !important;
}

.timeline-section.is-alternate :deep(.coming-soon) {
  background: rgba(255, 255, 255, 0.05) !important;
  border-color: rgba(255, 255, 255, 0.2) !important;
}

.timeline-section.is-alternate :deep(.coming-soon span),
.timeline-section.is-alternate :deep(.more-indicator span) {
  color: rgba(255, 255, 255, 0.6) !important;
}

.timeline-section.is-alternate :deep(.more-indicator) {
  background: rgba(255, 255, 255, 0.05) !important;
  border-color: rgba(255, 255, 255, 0.2) !important;
}

/* --- Dialog Styles --- */
.map-dialog {
  border: none;
  border-radius: 20px;
  padding: 0;
  background: transparent;
  max-width: 90vw;
  width: 800px;
  max-height: 90vh;
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
  padding: 20px;
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

.close-btn:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 16px rgba(244, 63, 94, 0.55);
}

.iframe-container {
  width: 100%;
  height: 500px;
  border-radius: 12px;
  overflow: hidden;
  border: none;
  box-shadow: inset 0 0 0 1px rgba(0,0,0,0.08);
}

@media (max-width: 768px) {
  .header-actions {
    margin-top: 14px;
    width: 100%;
    flex-direction: row;
    flex-wrap: wrap;
    align-items: flex-start;
  }
  .iframe-container {
    height: 350px;
  }
  .dialog-content {
    padding: 12px;
  }
}

:global(html.modal-open),
:global(html.modal-open body) {
  overflow: hidden !important;
  height: 100vh !important;
}
</style>
