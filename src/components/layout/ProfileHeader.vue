<template>
  <header class="session-header">
    <!-- ── SECTION 1: Main Header ─────────────────── -->
    <div class="hdr-section-main">
      <!-- Timeline title -->
      <div class="hdr-title-block">
        <h1 class="hdr-title">
          SELAMAT DATANG {{ userAlias ? userAlias.toUpperCase() : 'USER' }}
        </h1>
      </div>

      <!-- Alias + Edit -->
      <div v-if="userAlias" class="hdr-alias-block">
        <i class="fa-solid fa-user-circle hdr-icon-me"></i>
        <span class="hdr-alias-label">Kamu</span>
        <strong class="hdr-alias-name">{{ userAlias }}</strong>
        <button class="hdr-btn-edit" @click="$emit('change-alias')" title="Ubah nama">
          <i class="fa-solid fa-pen-to-square"></i>
        </button>
      </div>

      <!-- Collaborators -->
      <div v-if="collaborators && collaborators.filter(c => c !== userAlias).length > 0" class="hdr-collab-block">
        <i class="fa-solid fa-users hdr-icon-collab"></i>
        <span class="hdr-collab-label">Bersama</span>
        <div class="hdr-collab-tags">
          <span
            v-for="c in collaborators.filter(c => c !== userAlias)"
            :key="c"
            class="hdr-collab-tag"
          >
            {{ c }}
            <button class="hdr-btn-remove" @click.stop="$emit('delete-alias', c)" title="Hapus alias ini">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </span>
        </div>
      </div>

      <!-- ── Animated Vehicles ──────────────────── -->
      <div class="hdr-animations">
        <!-- Plane with surrounding clouds -->
        <div class="anim-wrapper plane-wrapper">
          <i class="fa-solid fa-cloud particle-cloud cloud1"></i>
          <i class="fa-solid fa-cloud particle-cloud cloud2"></i>
          <i class="fa-solid fa-cloud particle-cloud cloud3"></i>
          <i class="fa-solid fa-cloud particle-cloud cloud4"></i>
          <i class="fa-solid fa-plane hdr-anim-plane" title="Terbang ke tujuan baru"></i>
        </div>

        <!-- Car with smoke -->
        <div class="anim-wrapper car-wrapper">
          <i class="fa-solid fa-wind particle-smoke smoke1"></i>
          <i class="fa-solid fa-wind particle-smoke smoke2"></i>
          <i class="fa-solid fa-car-side hdr-anim-car" title="Perjalanan darat"></i>
        </div>
      </div>
    </div>

    <!-- ── SECTION 2: Info Strip ──────────────────── -->
    <div class="hdr-section-info">
      <!-- Token (cloud) -->
      <template v-if="isCloud">
        <div class="hdr-info-chip">
          <span v-if="activeSessionToken?.startsWith('LOKAL-')" class="hdr-badge hdr-badge-local">📱 Lokal</span>
          <span v-else class="hdr-badge hdr-badge-cloud">☁️ Cloud</span>
          <code class="hdr-token" @click="$emit('copy-token')" title="Klik salin">{{ activeSessionToken }}</code>
          <button class="hdr-btn-copy" @click="$emit('copy-token')" aria-label="Salin token">
            <i class="fa-regular fa-copy"></i>
          </button>
        </div>
      </template>

      <!-- Local share token -->
      <template v-if="isLocal && activeLocalShareToken">
        <div class="hdr-info-chip">
          <span class="hdr-badge hdr-badge-local">🔑 Token</span>
          <code class="hdr-token" @click="$emit('copy-local-token')" title="Klik salin">{{ activeLocalShareToken }}</code>
          <button class="hdr-btn-copy" @click="$emit('copy-local-token')" aria-label="Salin token lokal">
            <i class="fa-regular fa-copy"></i>
          </button>
        </div>
      </template>

      <!-- Device -->
      <div v-if="deviceBrand" class="hdr-info-chip hdr-info-device">
        <i class="fa-solid fa-mobile-screen-button"></i>
        <span>{{ deviceBrand }}</span>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
defineProps<{
  userAlias: string;
  collaborators: string[];
  isCloud: boolean;
  isLocal: boolean;
  activeSessionName: string | null;
  activeSessionToken: string | null;
  activeLocalShareToken: string | null;
  deviceBrand: string;
}>();

defineEmits(['change-alias', 'delete-alias', 'copy-token', 'copy-local-token']);
</script>

<style scoped>
/* ══════════════════════════════════════════
   SESSION HEADER (Old)
══════════════════════════════════════════ */
.session-header {
  display: flex;
  flex-direction: column;
  background: #ffffff;
  border-bottom: 2.5px solid #101010;
  box-shadow: 0 3px 0 #101010;
  overflow: hidden;
  margin-left: -40px;
  margin-right: -40px;
  margin-bottom: 16px;
  flex-shrink: 0;
}

/* ── Section 1: Main Header ─────────────── */
.hdr-section-main {
  padding: 16px 40px 14px;
  background-color: #ffb38a; /* Pastel Orange Neo-brutalism */
  background-image: radial-gradient(rgba(16, 16, 16, 0.15) 2px, transparent 2px);
  background-size: 14px 14px;
  border-bottom: 3px solid #101010;
  display: flex;
  flex-direction: column;
  gap: 8px;
  position: relative;
}

.hdr-title-block {
  display: flex;
  align-items: center;
  gap: 8px;
}

.hdr-title {
  font-family: 'Outfit', 'Space Grotesk', sans-serif;
  font-size: 1.35rem;
  font-weight: 900;
  color: #101010;
  text-transform: uppercase;
  margin: 0;
  letter-spacing: -0.3px;
  text-shadow: none;
  line-height: 1.2;
}

/* Alias row */
.hdr-alias-block {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #ffffff;
  padding: 4px 12px;
  border: 2px solid #101010;
  box-shadow: 2px 2px 0 #101010;
  border-radius: 4px;
  width: fit-content;
}
.hdr-icon-me {
  color: #101010;
  font-size: 1.1rem;
}
.hdr-alias-label {
  font-size: 0.85rem;
  color: #101010;
  font-weight: 700;
}
.hdr-alias-name {
  font-family: 'Inter', sans-serif;
  font-size: 0.95rem;
  font-weight: 900;
  color: #101010;
}
.hdr-btn-edit {
  background: none;
  border: none;
  color: #101010;
  cursor: pointer;
  padding: 2px;
  transition: transform 0.1s;
}
.hdr-btn-edit:hover { transform: scale(1.1); }

/* Collaborators row */
.hdr-collab-block {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
}
.hdr-icon-collab {
  color: #101010;
  font-size: 1.1rem;
}
.hdr-collab-label {
  font-size: 0.85rem;
  color: #101010;
  font-weight: 700;
}
.hdr-collab-tags {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}
.hdr-collab-tag {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #ffffff;
  border: 2px solid #101010;
  box-shadow: 2px 2px 0 #101010;
  border-radius: 0;
  padding: 2px 8px;
  font-size: 0.8rem;
  font-weight: 800;
  color: #101010;
}
.hdr-btn-remove {
  background: none;
  border: none;
  color: #ef4444;
  cursor: pointer;
  padding: 0;
  font-size: 0.8rem;
  font-weight: 900;
}

/* ── Header Animations ─────────────── */
.hdr-animations {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  pointer-events: none;
  overflow: hidden;
}

.anim-wrapper {
  position: absolute;
  display: flex;
  align-items: center;
}

.plane-wrapper {
  top: 5px;
  right: 240px; /* geser ke kiri sejauh 1.5cm */
  font-size: 3.6rem; /* diperbesar 2x */
}

.car-wrapper {
  bottom: -6px; /* sejajar border bawah */
  right: 20px;
  font-size: 3.6rem; /* diperbesar 2x */
}

.hdr-anim-plane {
  animation: floatPlane 3s ease-in-out infinite;
  color: #101010;
  text-shadow: 3px 3px 0 #fff;
  z-index: 2;
}

.hdr-anim-car {
  animation: driveCar 0.4s linear infinite;
  color: #101010;
  text-shadow: 3px 3px 0 #fff;
  z-index: 2;
}

/* Particles */
.particle-cloud, .particle-smoke {
  position: absolute;
  color: #ffffff;
  text-shadow: 2px 2px 0 #101010;
  opacity: 0;
  z-index: 1;
}

/* Plane clouds */
.cloud1 {
  font-size: 0.8rem;
  right: 40px;
  top: 25px;
  animation: flyTrail 1.5s linear infinite;
}
.cloud2 {
  font-size: 0.6rem;
  right: 60px;
  top: 10px;
  animation: flyTrail 1.5s linear infinite 0.75s;
}
.cloud3 {
  font-size: 0.7rem;
  right: -30px; /* muncul jauh di depan pesawat */
  top: 40px; /* di bawah pesawat */
  animation: flyTrail 2s linear infinite 0.3s;
  z-index: 3; /* melintas di depan pesawat */
}
.cloud4 {
  font-size: 0.9rem;
  right: -20px; /* muncul di depan atas pesawat */
  top: -5px;
  animation: flyTrail 1.8s linear infinite 1.1s;
  z-index: 3; /* melintas di depan pesawat */
}

/* Car smoke */
.smoke1 {
  font-size: 1.5rem;
  right: 45px; /* lebih dekat ke knalpot mobil */
  bottom: 8px;
  animation: flyTrailSmoke 0.8s linear infinite;
}
.smoke2 {
  font-size: 1rem;
  right: 55px; /* lebih dekat ke knalpot mobil */
  bottom: 18px;
  animation: flyTrailSmoke 0.8s linear infinite 0.4s;
}

@keyframes floatPlane {
  0%, 100% { transform: translateY(0) rotate(-10deg); }
  50% { transform: translateY(-10px) rotate(5deg); }
}

@keyframes driveCar {
  0% { transform: translateY(0) rotate(0); }
  50% { transform: translateY(-4px) rotate(-2deg); }
  100% { transform: translateY(0) rotate(0); }
}

@keyframes flyTrail {
  0% {
    transform: translateX(0) scale(0.5);
    opacity: 1;
  }
  100% {
    transform: translateX(-60px) scale(1.5);
    opacity: 0;
  }
}

@keyframes flyTrailSmoke {
  0% {
    transform: translateX(0) scale(-0.5, 0.5); /* flip X */
    opacity: 1;
  }
  100% {
    transform: translateX(-50px) scale(-1.5, 1.5); /* flip X */
    opacity: 0;
  }
}

/* ── Section 2: Info Strip ─────────────── */
.hdr-section-info {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 40px;
  background: #fdfdfd;
  overflow-x: auto;
  white-space: nowrap;
}
.hdr-section-info::-webkit-scrollbar { display: none; }

.hdr-info-chip {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #ffffff;
  border: 2px solid #101010;
  box-shadow: 2px 2px 0 #101010;
  border-radius: 4px;
  padding: 4px 12px;
  font-family: 'Inter', sans-serif;
  font-size: 0.85rem;
  color: #101010;
  font-weight: 700;
}
.hdr-badge {
  font-weight: 900;
  padding-right: 6px;
  border-right: 2px solid #101010;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.hdr-badge-cloud { color: #3b82f6; }
.hdr-badge-local { color: #eab308; }
.hdr-token {
  font-family: 'JetBrains Mono', monospace;
  font-weight: 800;
  color: #101010;
  cursor: pointer;
  background: #f4f4f5;
  padding: 2px 6px;
  border: 1px solid #101010;
}
.hdr-btn-copy {
  background: #101010;
  border: none;
  color: #ffffff;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 2px;
  transition: transform 0.1s;
}
.hdr-btn-copy:hover { transform: scale(1.1); }
.hdr-info-device i { color: #8b5cf6; font-size: 1rem; }

@media (max-width: 1024px) {
  .session-header { margin-left: -30px; margin-right: -30px; }
  .hdr-section-main { padding-left: 30px; padding-right: 30px; }
  .hdr-section-info { padding-left: 30px; padding-right: 30px; }
}
@media (max-width: 640px) {
  .hdr-section-main { padding-top: 14px; padding-bottom: 13px; }
  .hdr-title { font-size: 1.15rem; }
  .hdr-section-info { padding-top: 6px; padding-bottom: 7px; }
  .plane-wrapper { right: 120px; font-size: 2rem; }
  .car-wrapper { right: 10px; font-size: 2rem; }
}
@media (max-width: 480px) {
  .session-header { margin-left: -16px; margin-right: -16px; }
  .hdr-section-main { padding-left: 16px; padding-right: 16px; }
  .hdr-section-info { padding-left: 16px; padding-right: 16px; }
  .hdr-animations { display: none; }
}
</style>
