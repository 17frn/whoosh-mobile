<template>
  <div class="onboarding-page">
   <div class="ob-frame">

    <!-- Decorative background shapes -->
    <svg
      class="ob-bg"
      viewBox="0 0 420 910"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <!-- Top-left indigo wavy blob -->
      <path
        d="M0,0 L155,0
           C150,40 105,55 115,95
           C125,135 95,160 60,175
           C30,188 10,215 0,245 Z"
        fill="#6f6bd8"
      />

      <!-- Orange outline hugging the blue blob's top edge -->
      <path
        d="M430,270
           C360,248 315,285 275,318
           C230,355 205,345 172,398
           C142,446 138,530 95,595
           C70,635 58,700 55,760
           L55,915 L430,915 Z"
        fill="#f97316"
      />

      <!-- Big blue blob (right / bottom) -->
      <path
        d="M430,285
           C362,262 320,298 280,330
           C235,367 210,357 178,408
           C148,456 144,538 102,602
           C78,640 66,703 63,762
           L63,915 L430,915 Z"
        fill="#6f6bd8"
      />

      <!-- Bottom-left yellow blob (stretching ~65% width, dipping down on the right) -->
      <path
        d="M0,580
           C80,560 160,720 270,895
           L270,915
           L0,915 Z"
        fill="#f6b93b"
      />
    </svg>

    <!-- Content wrapper -->
    <div class="ob-content">

      <!-- App Header / Tagline Typography (Neo-Brutalist 3-Line Title) -->
      <div class="ob-header-typo">
        <!-- Spiky star outline decoration -->
        <svg class="decor-spiky" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M50 0 L58 35 L90 20 L68 47 L100 50 L68 53 L90 80 L58 65 L50 100 L42 65 L10 80 L32 53 L0 50 L32 47 L10 20 L42 35 Z" stroke="#101010" stroke-width="6" stroke-linejoin="round"/>
        </svg>

        <h1 class="ob-line-1">WHOOSH</h1>
        <p class="ob-line-2">Collaborate Your Journey With</p>
        <div class="ob-line-3-container">
          <RocketAnimation :size="86" />
          <h1 class="ob-line-3">US</h1>
        </div>

        <!-- Orange star solid decoration -->
        <svg class="decor-orange" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M50 0 L58 35 L90 20 L68 47 L100 50 L68 53 L90 80 L58 65 L50 100 L42 65 L10 80 L32 53 L0 50 L32 47 L10 20 L42 35 Z" fill="#f97316" stroke="#101010" stroke-width="5" stroke-linejoin="round"/>
        </svg>
      </div>

      <!-- Map illustration card -->
      <div class="ob-map-wrapper" aria-hidden="true">
        <div class="ob-map-shadow"></div>
        <div class="ob-map-card">
          <!-- SVG map illustration -->
          <svg viewBox="0 0 350 300" xmlns="http://www.w3.org/2000/svg" class="ob-map-svg">
            <!-- Full background -->
            <rect width="350" height="300" fill="#f7eed6"/>

            <!-- Inner map area (padded inset: from 22,22 to 328,278) -->
            <rect x="22" y="22" width="306" height="256" fill="#f3e3bc"/>

            <!-- Teal water areas — all aligned to inner rect bounds -->
            <!-- Top-left water -->
            <path d="M22,22 L140,22 C118,58 72,66 66,105 C58,138 36,143 22,150 Z" fill="#5fa8a0"/>
            <!-- Top-right water -->
            <path d="M328,22 L328,100 C298,87 278,57 292,22 Z" fill="#5fa8a0"/>
            <!-- Bottom-left water -->
            <path d="M22,278 L22,200 C60,208 92,232 136,240 C172,246 186,278 186,278 Z" fill="#5fa8a0"/>
            <!-- Bottom-right water -->
            <path d="M328,278 L328,170 C298,183 268,215 274,278 Z" fill="#5fa8a0"/>

            <!-- Small cloud detail -->
            <circle cx="90" cy="68" r="11" fill="#f7eed6"/>
            <circle cx="105" cy="62" r="9" fill="#f7eed6"/>
            <circle cx="76" cy="73" r="7" fill="#f7eed6"/>

            <!-- Small island bottom-right -->
            <circle cx="298" cy="225" r="12" fill="#f3e3bc"/>

            <!-- Dashed route loop — spans inner area -->
            <path d="M105,155
                     C122,123 168,100 208,93
                     C242,87 268,106 274,132
                     C280,156 258,170 230,175
                     C200,180 168,172 152,194
                     C138,212 152,230 180,232
                     C212,235 248,223 266,205"
                  stroke="#1b1b1b" stroke-width="3.5" stroke-dasharray="10,8"
                  fill="none" stroke-linecap="round"/>

            <!-- Pin 1 -->
            <path d="M208 70 C198 70 191 77 191 87 C191 100 208 115 208 115 C208 115 225 100 225 87 C225 77 218 70 208 70 Z" fill="#1b1b1b"/>
            <circle cx="208" cy="87" r="6" fill="#f3e3bc"/>

            <!-- Pin 2 -->
            <path d="M180 212 C171 212 164 219 164 228 C164 240 180 255 180 255 C180 255 196 240 196 228 C196 219 189 212 180 212 Z" fill="#1b1b1b"/>
            <circle cx="180" cy="228" r="5.5" fill="#f3e3bc"/>

            <!-- Corner brackets aligned to inner rect corners -->
            <path d="M36,46 L36,34 L54,34" stroke="#b3987a" stroke-width="3" fill="none"/>
            <path d="M296,34 L314,34 L314,46" stroke="#b3987a" stroke-width="3" fill="none"/>
            <path d="M36,254 L36,266 L54,266" stroke="#b3987a" stroke-width="3" fill="none"/>
            <path d="M314,254 L314,266 L296,266" stroke="#b3987a" stroke-width="3" fill="none"/>

            <!-- Tiny compass marks -->
            <text x="10" y="155" font-size="11" fill="#b3987a" font-family="serif">&#10547;</text>
            <text x="332" y="162" font-size="11" fill="#b3987a" font-family="serif">&#9737;</text>
          </svg>
        </div>
      </div>

      <!-- Action buttons -->
      <div class="ob-actions">
        <!-- Primary button: Daftar / Masuk dengan Akun -->
        <div class="btn-wrapper">
          <div class="btn-shadow" aria-hidden="true"></div>
          <button
            id="btn-login-akun"
            class="ob-btn-primary"
            @click="$emit('choose-account')"
          >
            Daftar / Masuk <br>dengan Akun
          </button>
        </div>

        <!-- Secondary button: Masuk dengan Token Sesi (Tanpa shadow/bg hitam) -->
        <button
          id="btn-login-token"
          class="ob-btn-secondary"
          @click="$emit('choose-token')"
        >
          Masuk dengan Token Sesi
        </button>

        <!-- Info link -->
        <button
          id="btn-pelajari"
          class="ob-link"
          @click="$emit('learn-more')"
        >
          Pelajari lanjutan
        </button>

        <p class="ob-footer-note">
          Made with ❤️ by 17frn<br>v0.1
        </p>
        
      </div>

    </div>
   </div>
  </div>
</template>

<script setup lang="ts">
import RocketAnimation from '../components/shared/RocketAnimation.vue';
defineEmits<{
  'choose-account': [];
  'choose-token': [];
  'learn-more': [];
}>();
</script>

<style scoped>
/* ── Root (Mobile-First: Default Fullscreen) ─────────────────────────── */
.onboarding-page {
  position: relative;
  width: 100%;
  min-height: 100dvh;
  min-height: 100vh;
  background-color: #f4f2f7;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}

.ob-frame {
  position: relative;
  width: 100%;
  height: 100dvh;
  height: 100vh;
  background-color: #f4f2f7;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* ── Desktop Only Preview Card (Layar Desktop > 768px) ──────────────── */
@media (min-width: 769px) {
  .onboarding-page {
    background-color: #d8d9e4;
    padding: 24px 0;
  }

  .ob-frame {
    max-width: 420px;
    height: auto;
    aspect-ratio: 9 / 19.5;
    max-height: calc(100vh - 48px);
    border-radius: 32px;
    box-shadow: 0 20px 60px rgba(26, 26, 46, 0.25);
  }
}

/* ── Background shapes ───────────────────────────────────────────────── */
.ob-bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
}
/* ── Content ─────────────────────────────────────────────────────────── */
.ob-content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  height: 100%;
  padding: 36px 24px 24px;
  box-sizing: border-box;
}

/* ── App Header / Tagline Typography (Neo-Brutalist 3-Line Title) ── */
.ob-header-typo {
  position: relative;
  width: 100%;
  max-width: 320px;
  display: flex;
  flex-direction: column;
  gap: 1px;
  margin-top: 80px; /* Increased to shift tagline down */
}

.ob-line-1 {
  font-family: 'Outfit', 'Space Grotesk', 'Impact', sans-serif;
  font-size: 3.4rem;
  font-weight: 900;
  color: #101010;
  text-align: center;
  text-transform: uppercase;
  line-height: 0.85;
  letter-spacing: -2px;
  margin: 0;
}

.ob-line-2 {
  font-family: 'Space Grotesk', 'Inter', sans-serif;
  font-size: 1.2rem; /* Adjusted size for pure text presentation */
  font-weight: 800;
  color: #101010;
  text-align: center;
  text-transform: uppercase;
  line-height: 1.0;
  letter-spacing: -0.5px;
  margin: 6px 0;
  white-space: nowrap; /* Forces text to stay on a single line */
}

.ob-line-3-container {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 16px;
  width: 100%;
  margin: 0;
  padding-right: 25px; /* Alignment with map card */
  box-sizing: border-box;
}


.ob-line-3 {
  font-family: 'Syne', 'Outfit', 'Space Grotesk', 'Impact', sans-serif;
  font-size: 4.2rem;
  font-weight: 800;
  color: #6f6bd8; /* Vibrant purple/indigo matching the photo's colored text line! */
  text-transform: uppercase;
  line-height: 0.85;
  letter-spacing: -2px;
  margin: 0;
}

/* Floating decorations similar to the reference photo */
.decor-spiky {
  position: absolute;
  top: -18px;
  left: -12px;
  width: 38px;
  height: 38px;
  transform: rotate(-15deg);
  pointer-events: none;
  animation: float-slow 4s ease-in-out infinite;
}

.decor-orange {
  position: absolute;
  bottom: -12px;
  left: 20px;
  width: 34px;
  height: 34px;
  transform: rotate(20deg);
  pointer-events: none;
  animation: float-slow 3s ease-in-out infinite alternate;
}

@keyframes float-slow {
  0% { transform: translateY(0) rotate(-15deg); }
  50% { transform: translateY(-4px) rotate(-10deg); }
  100% { transform: translateY(0) rotate(-15deg); }
}

/* ── Map illustration ────────────────────────────────────────────────── */
.ob-map-wrapper {
  position: relative;
  width: 100%;
  max-width: 320px;
  margin: 36px auto 12px; /* Increased to shift map further down */
  margin-top: 90px;
}

.ob-map-shadow {
  position: absolute;
  top: 5px;
  left: 5px;
  width: 100%;
  height: 100%;
  background: #101010;
  z-index: 0;
}

.ob-map-card {
  position: relative;
  z-index: 1;
  border: 4px solid #101010;
  overflow: hidden;
  background: #f7eed6;
}

.ob-map-svg {
  display: block;
  width: 100%;
  height: auto;
}

/* ── Actions ─────────────────────────────────────────────────────────── */
.ob-actions {
  width: 100%;
  max-width: 240px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px; /* Reduced gap to fit screens perfectly without overflow */
  margin-top: auto;
}

/* wrapper for offset shadow effect */
.btn-wrapper {
  position: relative;
  width: 100%;
}

.btn-shadow {
  position: absolute;
  top: 4px;
  left: 4px;
  width: 100%;
  height: 100%;
  background: #101010;
  z-index: 0;
}

.ob-btn-primary {
  position: relative;
  z-index: 1;
  width: 100%;
  /* Memperkecil padding & ukuran font tombol */
  padding: 19px 20px;
  background-color: #aeeacd;
  color: #0f0f0f;
  font-family: 'Inter', sans-serif;
  font-size: 1.1rem;
  font-weight: 600;
  border: 2px solid #101010;
  cursor: pointer;
  transition: transform 0.15s ease;
  letter-spacing: 0.1px;
}

.ob-btn-primary:hover {
  transform: translate(-2px, -2px);
}

.ob-btn-primary:active {
  transform: translate(2px, 2px);
}

.ob-btn-secondary {
  width: 100%;
 border-style: hidden;
  background-color: transparent;
  font-family: 'Inter', sans-serif;
  font-size: 0.9rem;
  font-weight: 700;
 
  cursor: pointer;
  transition: all 0.15s ease;
  letter-spacing: 0.1px;
}

.ob-btn-secondary:hover {
  background-color: #f7f7f7;
  transform: translateY(-1px);
}

.ob-btn-secondary:active {
  transform: translateY(1px);
}

.ob-link {
  background: none;
  border: none;
  color: #4b4b5e;
  font-family: 'Inter', sans-serif;
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  padding: 4px 0;
  margin-top: 2px;
  transition: opacity 0.2s ease;
}

.ob-link:hover {
  opacity: 0.7;
}

.ob-footer-note {
  font-family: 'Inter', sans-serif;
  font-size: 0.7rem;
  font-weight:bolder ;
  color: #000000;
  text-align: center;
  margin-top: 90px;
}

/* ── Responsive ──────────────────────────────────────────────────────── */
@media (max-width: 380px) {
  .ob-title {
    font-size: 2.2rem;
  }
  .ob-content {
    padding: 48px 24px 40px;
  }
}
</style>
