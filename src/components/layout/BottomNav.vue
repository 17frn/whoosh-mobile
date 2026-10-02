<template>
  <nav class="bottom-nav" role="navigation" aria-label="Navigasi Utama">
    <!-- Cutout Background Mask Trick -->
    <div class="nav-bg-container">
      <div class="nav-bg-slider" :class="'active-' + modelValue">
        <div class="bg-cutout"></div>
      </div>
    </div>

    <!-- Floating elevated circle (sits inside the cutout) -->
    <div class="nav-indicator" :class="'active-' + modelValue">
      <div class="indicator-circle"></div>
    </div>

    <button
      id="nav-home"
      class="nav-item"
      :class="{ active: modelValue === 'home' }"
      @click="$emit('update:modelValue', 'home')"
      aria-label="Home"
    >
      <div class="icon-wrapper"><i class="fa-solid fa-house"></i></div>
      <span class="nav-label">Home</span>
    </button>
    <button
      id="nav-timeline"
      class="nav-item"
      :class="{ active: modelValue === 'timeline' }"
      @click="$emit('update:modelValue', 'timeline')"
      aria-label="Timeline"
    >
      <div class="icon-wrapper"><i class="fa-solid fa-calendar-days"></i></div>
      <span class="nav-label">Timeline</span>
    </button>
    <button
      id="nav-settings"
      class="nav-item"
      :class="{ active: modelValue === 'settings' }"
      @click="$emit('update:modelValue', 'settings')"
      aria-label="Pengaturan"
    >
      <div class="icon-wrapper"><i class="fa-solid fa-gear"></i></div>
      <span class="nav-label">Setting</span>
    </button>
  </nav>
</template>

<script setup lang="ts">
defineProps<{ modelValue: 'home' | 'timeline' | 'settings' }>();
defineEmits<{ 'update:modelValue': [tab: 'home' | 'timeline' | 'settings'] }>();
</script>

<style scoped>
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 68px;
  background: transparent; /* Must be transparent for cutout to show */
  display: flex;
  z-index: 600;
  padding-bottom: env(safe-area-inset-bottom, 0px);
}

/* Container for the background and cutout */
.nav-bg-container {
  position: absolute;
  inset: 0;
  overflow: hidden; /* Clips the huge box-shadow to just the navbar bounds */
  border-radius: 22px 22px 0 0;
  box-shadow: 0 -2px 15px rgba(0, 0, 0, 0.06);
  z-index: 0;
}

.nav-bg-slider {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 33.333%;
  display: flex;
  justify-content: center;
  transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.active-home     { transform: translateX(0); }
.active-timeline { transform: translateX(100%); }
.active-settings { transform: translateX(200%); }

/* The Cutout Hole */
.bg-cutout {
  width: 86px;
  height: 86px;
  border-radius: 50%;
  background: transparent; /* The hole */
  /* This huge shadow acts as the solid background for the rest of the navbar */
  box-shadow: 0 0 0 2000px var(--theme-nav-bg, #ffffff);
  transform: translateY(-43px);
}

/* The Elevated Circle that sits inside the cutout */
.nav-indicator {
  position: absolute;
  top: 0; /* Anchor to top edge of navbar */
  width: 33.333%;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  z-index: 1;
  pointer-events: none;
}

.indicator-circle {
  width: 68px;
  height: 68px;
  background: var(--theme-nav-indicator, #ffffff);
  border-radius: 50%;
  transform: translateY(-50%);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
  transition: background 0.3s ease;
}

/* Nav Buttons */
.nav-item {
  flex: 1;
  height: 100%;
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--theme-icon-primary, #b0bac9);
  position: relative;
  z-index: 2;
  outline: none;
  -webkit-tap-highlight-color: transparent;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.icon-wrapper {
  position: absolute;
  top: 14px;
  left: 50%;
  transform: translateX(-50%);
  transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), color 0.3s ease;
}

.icon-wrapper i {
  font-size: 1.8rem;
}

.nav-label {
  position: absolute;
  bottom: 12px;
  font-family: 'Inter', sans-serif;
  font-size: 0.65rem;
  font-weight: 600;
  transition: opacity 0.3s ease, transform 0.3s ease;
  opacity: 1;
  transform: translateY(0);
}

/* Active Tab Styles */
.nav-item.active .icon-wrapper {
  /* Move icon up to be exactly centered in the elevated circle (at y=0 relative to navbar) */
  /* 14px top + roughly 14px (half height of 1.8rem icon) = center at 28px. So -28px moves it to 0 */
  transform: translate(-50%, -28px);
  color: var(--theme-icon-secondary, #6b9bd6);
}

.nav-item.active .nav-label {
  opacity: 0;
  transform: translateY(10px);
}
</style>
