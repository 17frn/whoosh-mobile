<template>
  <div class="dynamic-island-wrapper">
    <nav class="dynamic-island">
      <a href="/" class="nav-link" :class="{ active: currentPath === '/' }">Beranda</a>
      <a href="/perjalanan" class="nav-link" :class="{ active: currentPath.startsWith('/perjalanan') }">Cerita Perjalanan</a>
      <a href="/proyek" class="nav-link" :class="{ active: currentPath.startsWith('/proyek') }">Projek</a>
    </nav>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const currentPath = ref('');

onMounted(() => {
  currentPath.value = window.location.pathname;
});
</script>

<style scoped>
.dynamic-island-wrapper {
  position: fixed;
  top: 20px;
  left: 0;
  width: 100%;
  display: flex;
  justify-content: center;
  z-index: 1000;
  pointer-events: none;
}

.dynamic-island {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(240, 235, 225, 0.5);
  box-shadow: 0 8px 32px rgba(15, 23, 42, 0.15);
  padding: 8px 12px;
  border-radius: 40px;
  display: flex;
  gap: 8px;
  pointer-events: auto;
  transition: all 0.3s ease;
}

.dynamic-island:hover {
  box-shadow: 0 12px 40px rgba(15, 23, 42, 0.25);
  transform: translateY(-2px);
}

.nav-link {
  text-decoration: none;
  color: var(--text-muted);
  font-weight: 600;
  font-size: 0.95rem;
  padding: 8px 16px;
  border-radius: 30px;
  transition: all 0.2s ease;
}

.nav-link:hover {
  color: var(--text-main);
  background: rgba(240, 235, 225, 0.5);
}

.nav-link.active {
  color: #ffffff;
  background: var(--text-main);
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.2);
}
</style>
