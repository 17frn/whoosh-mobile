<template>
  <div class="settings-view">
    <header class="page-header">
      <div class="header-top">
        <h1 class="page-title">Pengaturan</h1>
      </div>
    </header>

    <main class="settings-content">

      <!-- SECTION: Tema Tampilan -->
      <section class="settings-section">
        <div class="section-label">
          <i class="fa-solid fa-palette"></i>
          Tema Tampilan
        </div>

        <div class="theme-grid">
          <button
            v-for="theme in themes"
            :key="theme.id"
            class="theme-card"
            :class="{ 'is-active': activeThemeId === theme.id }"
            @click="setTheme(theme.id)"
            :aria-pressed="activeThemeId === theme.id"
            :aria-label="`Pilih tema ${theme.name}`"
          >
            <!-- Preview swatch -->
            <div class="theme-preview" :style="{ background: theme.bgPreview }">
              <div class="theme-preview-dots">
                <div class="p-dot" :style="{ background: theme.accentColor }"></div>
                <div class="p-dot" style="background: rgba(255,255,255,0.6)"></div>
                <div class="p-dot" style="background: rgba(255,255,255,0.3)"></div>
              </div>
              <div
                class="theme-preview-bar"
                :style="{ background: theme.accentColor }"
              ></div>
            </div>

            <!-- Info -->
            <div class="theme-info">
              <div class="theme-name-row">
                <i class="fa-solid" :class="theme.badge" :style="{ color: theme.accentColor }"></i>
                <span class="theme-name">{{ theme.name }}</span>
              </div>
              <p class="theme-desc">{{ theme.description }}</p>
            </div>

            <!-- Active checkmark -->
            <div v-if="activeThemeId === theme.id" class="theme-check">
              <i class="fa-solid fa-check"></i>
            </div>
          </button>
        </div>
      </section>

      <!-- SECTION: Tentang -->
      <section class="settings-section">
        <div class="section-label">
          <i class="fa-solid fa-circle-info"></i>
          Tentang
        </div>
        <div class="about-card">
          <div class="about-row">
            <span class="about-key">Versi</span>
            <span class="about-val">1.0.0</span>
          </div>
          <div class="about-row">
            <span class="about-key">Framework</span>
            <span class="about-val">Vue 3 + Capacitor</span>
          </div>
        </div>
      </section>

    </main>
  </div>
</template>

<script setup lang="ts">
import { useTheme } from '../composables/useTheme';
const { activeThemeId, themes, setTheme } = useTheme();
</script>

<style scoped>
.settings-view {
  width: 100%;
  min-height: 100%;
  background: var(--theme-bg, #fdfdf5);
  transition: background 0.3s ease;
}

.page-header {
  padding: 12px 20px 8px;
  background: var(--theme-header-bg, #fdfdf5);
  margin: 0;
  position: sticky;
  top: 0;
  z-index: 100;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 2px solid var(--theme-border, #101010);
}

.header-top { margin: 0; }

.page-title {
  font-family: 'Outfit', 'Space Grotesk', sans-serif;
  font-size: 1.6rem;
  font-weight: 900;
  color: var(--theme-header-text, #101010);
  margin: 0;
  line-height: 1.1;
}

.settings-content {
  padding: 24px 20px;
  display: flex;
  flex-direction: column;
  gap: 28px;
}

/* ── Section ── */
.settings-section {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.section-label {
  font-family: 'Inter', sans-serif;
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1.2px;
  color: var(--theme-text-muted, #7c7060);
  display: flex;
  align-items: center;
  gap: 8px;
}

/* ── Theme Cards Grid ── */
.theme-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.theme-card {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 14px;
  background: var(--theme-surface, #ffffff);
  border: 2px solid var(--theme-border, #101010);
  box-shadow: 3px 3px 0 var(--theme-border, #101010);
  padding: 0;
  cursor: pointer;
  text-align: left;
  position: relative;
  transition: transform 0.1s ease, box-shadow 0.1s ease;
  overflow: hidden;
}

.theme-card:active {
  transform: translate(2px, 2px);
  box-shadow: 1px 1px 0 var(--theme-border, #101010);
}

.theme-card.is-active {
  border-color: var(--theme-accent, #6f6bd8);
  box-shadow: 3px 3px 0 var(--theme-accent, #6f6bd8);
}

/* Preview column */
.theme-preview {
  width: 80px;
  height: 80px;
  flex-shrink: 0;
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  overflow: hidden;
}

.theme-preview-dots {
  position: absolute;
  top: 14px;
  left: 10px;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.p-dot {
  width: 30px;
  height: 6px;
  border-radius: 3px;
}

.theme-preview-bar {
  height: 18px;
  width: 100%;
}

/* Info column */
.theme-info {
  flex: 1;
  min-width: 0;
  padding: 12px 0;
}

.theme-name-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.theme-name {
  font-family: 'Outfit', sans-serif;
  font-size: 1rem;
  font-weight: 800;
  color: var(--theme-text, #101010);
}

.theme-desc {
  font-family: 'Inter', sans-serif;
  font-size: 0.72rem;
  color: var(--theme-text-muted, #7c7060);
  margin: 0;
  line-height: 1.4;
  padding-right: 40px; /* space for check */
}

/* Active checkmark */
.theme-check {
  position: absolute;
  top: 8px;
  right: 10px;
  width: 22px;
  height: 22px;
  background: var(--theme-accent, #6f6bd8);
  color: #ffffff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.65rem;
}

/* ── About Card ── */
.about-card {
  background: var(--theme-surface, #ffffff);
  border: 2px solid var(--theme-border, #101010);
  box-shadow: 3px 3px 0 var(--theme-border, #101010);
}

.about-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--theme-border-light, #e2e0d0);
}
.about-row:last-child {
  border-bottom: none;
}

.about-key {
  font-family: 'Inter', sans-serif;
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--theme-text-muted, #7c7060);
}

.about-val {
  font-family: 'Inter', sans-serif;
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--theme-text, #101010);
}
</style>
