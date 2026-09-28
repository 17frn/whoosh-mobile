<template>
  <div class="floating-icons-container">
    <i 
      v-for="(icon, index) in generatedIcons" 
      :key="index"
      :class="['fa-solid', icon.name]"
      :style="{
        position: 'absolute',
        top: icon.top + '%',
        left: icon.isLeft ? icon.x + '%' : 'auto',
        right: !icon.isLeft ? icon.x + '%' : 'auto',
        color: icon.color,
        fontSize: (0.9 * icon.scale) + 'rem',
        transform: `rotate(${icon.rotation}deg)`,
        opacity: icon.opacity,
        pointerEvents: 'none',
        transition: 'opacity 0.5s ease-in'
      }"
    ></i>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const props = defineProps({
  isDarkTheme: {
    type: Boolean,
    default: false
  },
  count: {
    type: Number,
    default: 20
  },
  sizeModifier: {
    type: Number,
    default: 1.0
  }
});

const iconList = [
  'fa-fingerprint',
  'fa-camera', 
  'fa-compass', 
  'fa-code', 
  'fa-laptop-code',
  'fa-map-location-dot',
  'fa-plane',
  'fa-mug-hot',
  'fa-gamepad'
];

const lightColors = [
  '#6366f1',
  '#14b8a6',
  '#0ea5e9',
  '#8b5cf6',
  '#64748b',
];

const darkColors = [
  '#ffffff',
  '#f8fafc',
  '#e2e8f0'
];

const generatedIcons = ref([]);

onMounted(() => {
  const icons = [];
  const themeColors = props.isDarkTheme ? darkColors : lightColors;

  // Deteksi ukuran layar saat mount
  const screenW = window.innerWidth;
  const isMobile = screenW <= 480;
  const isTablet = screenW > 480 && screenW <= 1024;

  // === Konfigurasi per device ===
  let config = {
    // Desktop: ikon muncul kiri & kanan di area gutter luar konten
    xRange: { min: 8, max: 15 },
    count: props.count,
    sizeModifier: props.sizeModifier,
    opacityBase: 0.08,
    opacityRange: 0.12
  };

  if (isMobile) {
    // Mobile: jumlah ikon dikurangi dan ukuran diperkecil agar tidak terlalu ramai
    config.xRange = { min: 2, max: 12 }; // Perlebar sedikit sebarannya
    config.count = Math.max(10, Math.floor(props.count * 0.4)); // Pastikan setidaknya ada 10 ikon
    config.sizeModifier = props.sizeModifier * 0.8; // Perbesar ukuran dari sebelumnya agar terlihat
    config.opacityBase = 0.12; // Naikkan dasar opacity (setara desktop) agar tidak tembus pandang
    config.opacityRange = 0.15;
  } else if (isTablet) {
    // Tablet: sedikit lebih ke pinggir, jumlah dikurangi setengah
    config.xRange = { min: 2, max: 6 };
    config.count = Math.floor(props.count * 0.5);
    config.sizeModifier = props.sizeModifier * 0.7;
    config.opacityBase = 0.05;
    config.opacityRange = 0.08;
  }

  if (config.count === 0) {
    generatedIcons.value = [];
    return;
  }

  const halfCount = Math.floor(config.count / 2);
  const segmentHeight = 100 / halfCount;

  // Kiri
  for (let i = 0; i < halfCount; i++) {
    const x = config.xRange.min + Math.random() * (config.xRange.max - config.xRange.min);
    const top = (i * segmentHeight) + (Math.random() * (segmentHeight * 0.7));

    icons.push({
      name: iconList[Math.floor(Math.random() * iconList.length)],
      isLeft: true,
      x, top,
      color: themeColors[Math.floor(Math.random() * themeColors.length)],
      rotation: Math.random() * 360,
      scale: (0.9 + Math.random() * 0.6) * config.sizeModifier,
      opacity: props.isDarkTheme
        ? (config.opacityBase + Math.random() * 0.1)
        : (config.opacityBase + Math.random() * config.opacityRange)
    });
  }

  // Kanan
  for (let i = 0; i < halfCount; i++) {
    const x = config.xRange.min + Math.random() * (config.xRange.max - config.xRange.min);
    const top = (i * segmentHeight) + (Math.random() * (segmentHeight * 0.7));

    icons.push({
      name: iconList[Math.floor(Math.random() * iconList.length)],
      isLeft: false,
      x, top,
      color: themeColors[Math.floor(Math.random() * themeColors.length)],
      rotation: Math.random() * 360,
      scale: (0.9 + Math.random() * 0.6) * config.sizeModifier,
      opacity: props.isDarkTheme
        ? (config.opacityBase + Math.random() * 0.1)
        : (config.opacityBase + Math.random() * config.opacityRange)
    });
  }

  generatedIcons.value = icons;
});
</script>

<style scoped>
.floating-icons-container {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
  pointer-events: none;
  z-index: 0;
}

/* Mobile & Tablet: Konten melebar menutupi layar dengan z-index > 0 dan background putih.
   Kita naikkan z-index floating icons agar tampil sebagai watermark tipis di atas konten. */
@media (max-width: 1024px) {
  .floating-icons-container {
    z-index: 10;
  }
}
</style>
