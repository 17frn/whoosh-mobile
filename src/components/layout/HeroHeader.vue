<template>
  <header class="app-main-header">
    <div class="greeting-container">
      <h1 class="greeting-title">Hello, {{ userAlias || 'User' }}</h1>
      <p class="greeting-subtitle">Which moment you wanna revisit today ?</p>
    </div>

    <!-- Auto-swipe Carousel -->
    <div class="banner-carousel" @touchstart="onTouchStart" @touchend="onTouchEnd">
      <div class="banner-track" :style="{ transform: `translateX(calc(-${activeIndex * 100}% - ${activeIndex * 20}px))` }">

        <!-- Slide 1 -->
        <div class="trending-banner banner--blue">
          <img src="../../assets/anime-banner.png" alt="Character" class="trending-char" />
          <div class="trending-content">
            <h2 class="trending-title">HITS<br/>DIFFERENT</h2>
            <p class="trending-desc"><span class="trending-badge badge--dark">gaskeun</span> moment-mu is iconic</p>
          </div>
        </div>

        <!-- Slide 2 -->
        <div class="trending-banner banner--yellow banner--reverse">
          <img src="../../assets/anime-banner-1.png" alt="Character 2" class="trending-char trending-char-2" />
          <div class="trending-content">
            <h2 class="trending-title trending-title--light">HIDUP LO<br/>HITS BANGET</h2>
            <p class="trending-desc"><span class="trending-badge badge--white">literally</span> hidup lo hits banget</p>
          </div>
        </div>

      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';

defineProps<{
  userAlias: string;
}>();

const activeIndex = ref(0);
let autoTimer: ReturnType<typeof setInterval> | null = null;

function next() {
  activeIndex.value = (activeIndex.value + 1) % 2;
}

// Touch swipe support
let touchStartX = 0;
function onTouchStart(e: TouchEvent) {
  touchStartX = e.touches[0].clientX;
}
function onTouchEnd(e: TouchEvent) {
  const dx = e.changedTouches[0].clientX - touchStartX;
  if (Math.abs(dx) > 40) {
    if (dx < 0) next();
    else activeIndex.value = (activeIndex.value - 1 + 2) % 2;
    resetTimer();
  }
}

function resetTimer() {
  if (autoTimer) clearInterval(autoTimer);
  autoTimer = setInterval(next, 4000);
}

onMounted(() => {
  resetTimer();
});

onUnmounted(() => {
  if (autoTimer) clearInterval(autoTimer);
});
</script>

<style scoped>
.app-main-header {
  padding: 32px 30px 24px;
  background: var(--theme-canvas-bg, var(--bg-color, #ffffff));
  margin-left: -40px;
  margin-right: -40px;
}

.greeting-container {
  margin-bottom: 50px;
  padding: 0 10px;
}
.greeting-title {
  font-family: 'Outfit', sans-serif;
  font-size: 2.2rem;
  font-weight: 900;
  color: #101010;
  margin: 0 0 4px 0;
  letter-spacing: -0.5px;
}
.greeting-subtitle {
  font-family: 'Inter', sans-serif;
  font-size: 0.95rem;
  color: #52525b;
  margin: 0;
  font-weight: 500;
}

/* ── Carousel ──────────────────────────── */
.banner-carousel {
  position: relative;
  touch-action: pan-y;
  cursor: grab;
  /* Allow top/bottom overflow for character and shadow, clip sides */
  clip-path: inset(-150px 0 -20px 0);
  padding-bottom: 8px; /* space for the dots and shadow */
}

.banner-track {
  display: flex;
  gap: 20px; /* Space between the two shapes */
  transition: transform 0.45s cubic-bezier(0.4, 0, 0.2, 1);
  will-change: transform;
}

/* ── Individual Banner ─────────────────── */
.trending-banner {
  position: relative;
  flex: 0 0 100%;
  min-width: 0;
  padding: 20px 24px 20px 24px;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: center;
  min-height: 150px;
  border-radius: 12px;
  border: 3px solid #101010;
  box-shadow: 4px 4px 0 #101010;
}

.banner--blue {
  background: #cce4ff;
}

.banner--yellow {
  background: #F8E0A4;
}

/* Modifier for Slide 2 (Text on left) */
.banner--reverse {
  align-items: flex-start;
}
.banner--reverse .trending-content {
  align-items: flex-start;
  text-align: left;
  padding-right: 0;
  padding-left: 12px;
}
.banner--reverse .trending-title {
  text-align: left;
}
.banner--reverse .trending-desc {
  flex-direction: row; /* badge on the right of text */
}

/* Characters */
.trending-char {
  position: absolute;
  left: 10px;
  bottom: 0px;
  height: 230px;
  z-index: 2;
  filter: drop-shadow(6px 4px 0 rgba(0,0,0,0.5));
}

/* Character Banner 2 — override per-banner */
.trending-char-2 {
  left: auto;
  right: -50px;
  height: 270px; /* tweak sesuai kebutuhan banner 2 */
  /* filter, z-index diwarisi dari .trending-char */
}
.slide--reverse .trending-char {
  left: auto;
  right: 10px;
}

.trending-title {
  font-family: 'Outfit', sans-serif;
  font-size: 2.4rem;
  font-weight: 900;
  color: #101010;
  margin: 0;
  text-transform: uppercase;
  letter-spacing: -1px;
  line-height: 1.0;
  text-align: right;
}

.trending-title--light {
  color: #5c0a3a;
}

.trending-desc {
  font-family: 'Inter', sans-serif;
  font-size: 0.88rem;
  color: #374151;
  margin: 10px 0 0 0;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
  flex-direction: row-reverse;
}

.trending-badge {
  font-size: 0.72rem;
  font-weight: 800;
  padding: 2px 8px;
  border-radius: 4px;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}
.badge--dark {
  background: #101010;
  color: #ffffff;
}
.badge--white {
  background: #ffffff;
  color: #5c0a3a;
  border: 1.5px solid #5c0a3a;
}

/* ── Responsive ────────────────────────── */
@media (max-width: 1024px) {
  .app-main-header {
    margin-left: -30px;
    margin-right: -30px;
  }
}

@media (max-width: 480px) {
  .app-main-header {
    margin-left: -16px;
    margin-right: -16px;
  }
  .trending-char {
    height: 180px;
  }
  .trending-title {
    font-size: 1.9rem;
  }
}
</style>
