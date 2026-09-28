<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-card">
      <button class="close-btn" @click="$emit('close')" aria-label="Tutup">×</button>

      <!-- ── Tab Switcher ─────────────────────────────────────────────── -->
      <div class="auth-tabs">
        <button
          :class="['tab-btn', { active: mode === 'token' }]"
          @click="$emit('switch-mode', 'token')"
          id="tab-token"
        >🔑<br>Token Sesi</button>
        <button
          :class="['tab-btn', { active: mode === 'local' }]"
          @click="$emit('switch-mode', 'local')"
          id="tab-local"
        >👤<br>Akun Lokal</button>
      </div>

      <!-- ────────────────────────────────────────────────────────────── -->
      <!-- MODE: TOKEN (Cloud Session)                                    -->
      <!-- ────────────────────────────────────────────────────────────── -->
      <div v-if="mode === 'token'" class="auth-section">
        <h2 class="auth-title">Masuk via Token</h2>
        <p class="auth-subtitle">
          Masukkan token cloud (<code>MOMEN-XXXX-XXXX</code>) atau token lokal (<code>LOKAL-XXXX-XXXX</code>) untuk bergabung ke timeline.
        </p>

        <form @submit.prevent="handleTokenSubmit" class="auth-form">
          <div class="form-group">
            <label for="token-input">Token Sesi</label>
            <input
              type="text"
              id="token-input"
              v-model="tokenInput"
              required
              placeholder="MOMEN-XXXX-XXXX"
              class="brutal-input token-input"
              autocomplete="off"
            />
          </div>

          <p v-if="errorMessage" class="brutal-box error-msg">{{ errorMessage }}</p>

          <div class="btn-wrapper">
            <div class="btn-shadow"></div>
            <button type="submit" class="brutal-btn submit-btn" :disabled="loading">
              {{ loading ? 'Memeriksa...' : 'Masuk' }}
            </button>
          </div>
        </form>

        <div class="divider"><span>ATAU</span></div>

        <div class="create-section">
          <p class="create-subtitle">Belum punya timeline bersama?</p>
          <div class="btn-wrapper">
            <div class="btn-shadow"></div>
            <button
              @click="handleCreateNewTimeline"
              class="brutal-btn create-btn"
              id="btn-create-timeline"
              :disabled="loading"
            >
              {{ loading ? 'Membuat...' : 'Buat Timeline Baru' }}
            </button>
          </div>
        </div>
      </div>

      <!-- ────────────────────────────────────────────────────────────── -->
      <!-- MODE: LOCAL (Username + Password — Stored on Device)          -->
      <!-- ────────────────────────────────────────────────────────────── -->
      <div v-else-if="mode === 'local'" class="auth-section">
        <h2 class="auth-title">{{ isSignUp ? 'Buat Akun Lokal' : 'Masuk ke Akun Lokal' }}</h2>
        <p class="auth-subtitle">
          {{ isSignUp
            ? 'Data tersimpan di perangkat ini saja. Anda bisa gunakan username ini sebagai penanda saat berkolaborasi'
            : 'Masukkan username dan password akun lokal Anda'
          }}
        </p>

        <div v-if="isSignUp" class="info-banner">
          Data hanya tersimpan di HP ini. Jika uninstall, data akan hilang kecuali ada backup
        </div>

        <form @submit.prevent="handleLocalAuth" class="auth-form">
          <div class="form-group">
            <label for="username">Username</label>
            <input
              type="text"
              id="username"
              v-model="username"
              required
              placeholder="contoh: farhan, 17frn, sincostan"
              class="brutal-input"
              autocomplete="username"
            />
          </div>

          <div class="form-group">
            <label for="password">Password</label>
            <input
              type="password"
              id="password"
              v-model="password"
              required
              :placeholder="isSignUp ? 'Minimal 6 karakter' : '••••••••'"
              class="brutal-input"
              autocomplete="current-password"
            />
          </div>

          <p v-if="errorMessage" class="brutal-box error-msg">{{ errorMessage }}</p>
          <p v-if="successMessage" class="brutal-box success-msg">{{ successMessage }}</p>

          <div class="btn-wrapper">
            <div class="btn-shadow"></div>
            <button type="submit" class="brutal-btn submit-btn local-btn" :disabled="loading">
              {{ loading ? 'Memproses...' : (isSignUp ? 'Buat Akun' : 'Masuk') }}
            </button>
          </div>
        </form>

        <div class="toggle-link">
          <button @click="toggleSignUpMode" class="text-btn">
            {{ isSignUp ? 'Sudah punya akun lokal? Masuk di sini' : 'Belum punya akun lokal? Buat sekarang' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { getSessionByToken, createSession } from '../../data/authService';
import { createLocalUser, loginLocalUser, joinByLocalToken } from '../../data/localStore';

const props = defineProps<{
  mode: 'token' | 'local';
}>();

const emit = defineEmits<{
  'close': [];
  'switch-mode': [mode: 'token' | 'local'];
  'auth-success': [result: {
    authType: 'cloud' | 'local';
    username?: string;
    sessionId?: string;
    token?: string;
    sessionName?: string;
    shareToken?: string; // ← NEW: local share token
  }];
}>();

// Form state
const tokenInput = ref('');
const username = ref('');
const password = ref('');
const isSignUp = ref(false);
const loading = ref(false);
const errorMessage = ref('');
const successMessage = ref('');
const generatedToken = ref(''); // share token shown after local auth

// Reset on mode change
watch(() => props.mode, () => {
  errorMessage.value = '';
  successMessage.value = '';
  tokenInput.value = '';
  username.value = '';
  password.value = '';
  loading.value = false;
  generatedToken.value = '';
});

function toggleSignUpMode() {
  isSignUp.value = !isSignUp.value;
  errorMessage.value = '';
  successMessage.value = '';
}

// ── Token / Cloud Auth ────────────────────────────────────────────────

async function handleTokenSubmit() {
  loading.value = true;
  errorMessage.value = '';

  const rawToken = tokenInput.value.trim().toUpperCase();

  try {
    // Detect local share tokens (LOKAL- prefix)
    if (rawToken.startsWith('LOKAL-')) {
      try {
        const result = joinByLocalToken(rawToken);
        emit('auth-success', {
          authType: 'local',
          username: result.ownerUsername,
          shareToken: result.shareToken,
        });
        return;
      } catch (e) {
        // Fallback: If token is not registered locally (guest/different device), check Supabase
        const session = await getSessionByToken(rawToken);
        if (session) {
          emit('auth-success', {
            authType: 'cloud', // Guest behaves as a cloud collaborator
            sessionId: session.id,
            token: session.token,
            sessionName: session.name
          });
          return;
        } else {
          errorMessage.value = 'Token lokal tidak ditemukan di perangkat ini maupun di cloud.';
          return;
        }
      }
    }


    // Cloud token (MOMEN- prefix or anything else)
    const session = await getSessionByToken(rawToken);
    if (!session) {
      errorMessage.value = 'Token tidak ditemukan. Periksa kembali penulisan token Anda.';
      return;
    }
    emit('auth-success', {
      authType: 'cloud',
      sessionId: session.id,
      token: session.token,
      sessionName: session.name
    });
  } catch (err: any) {
    errorMessage.value = err.message || 'Gagal terhubung ke server.';
  } finally {
    loading.value = false;
  }
}

async function handleCreateNewTimeline() {
  loading.value = true;
  errorMessage.value = '';

  try {
    const session = await createSession();
    emit('auth-success', {
      authType: 'cloud',
      sessionId: session.id,
      token: session.token,
      sessionName: session.name
    });
  } catch (err: any) {
    errorMessage.value = err.message || 'Gagal membuat timeline baru.';
  } finally {
    loading.value = false;
  }
}

// ── Local Auth (Username + Password on Device) ────────────────────────

async function handleLocalAuth() {
  loading.value = true;
  errorMessage.value = '';
  successMessage.value = '';
  generatedToken.value = '';

  if (isSignUp.value && password.value.length < 6) {
    errorMessage.value = 'Password minimal 6 karakter.';
    loading.value = false;
    return;
  }

  try {
    const session = isSignUp.value
      ? await createLocalUser(username.value, password.value)
      : await loginLocalUser(username.value, password.value);

    // Store the share token to show to the user
    generatedToken.value = session.shareToken;

    emit('auth-success', {
      authType: 'local',
      username: session.username,
      shareToken: session.shareToken,
    });
  } catch (err: any) {
    errorMessage.value = err.message || 'Terjadi kesalahan.';
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
/* Overlay */
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background-color: rgba(26, 26, 46, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

/* Card */
.modal-card {
  position: relative;
  background-color: #f4f2f7;
  width: 100%;
  max-width: 400px;
  border: 3px solid #101010;
  box-shadow: 8px 8px 0px #101010;
  padding: 24px 28px 32px;
  display: flex;
  flex-direction: column;
  max-height: 90vh;
  overflow-y: auto;
}

/* Close */
.close-btn {
  position: absolute;
  top: 12px;
  right: 16px;
  background: none;
  border: none;
  font-size: 2rem;
  font-weight: 700;
  color: #101010;
  cursor: pointer;
  line-height: 1;
  z-index: 10;
}
.close-btn:hover { color: #f43f5e; }

/* Tabs */
.auth-tabs {
  display: flex;
  gap: 0;
  margin-bottom: 24px;
  border: 2px solid #101010;
  overflow: hidden;
}

.tab-btn {
  flex: 1;
  padding: 10px 8px;
  font-family: 'Inter', sans-serif;
  font-size: 0.85rem;
  font-weight: 700;
  border: none;
  background-color: #e2e0ea;
  color: #4b4b5e;
  cursor: pointer;
  transition: all 0.15s ease;
  border-right: 2px solid #101010;
}

.tab-btn:last-child { border-right: none; }
.tab-btn.active {
  background-color: #101010;
  color: #f4f2f7;
}
.tab-btn:not(.active):hover { background-color: #d0cde0; }

/* Section */
.auth-title {
  font-family: 'Inter', sans-serif;
  font-size: 1.6rem;
  font-weight: 800;
  color: #101010;
  margin: 0 0 8px;
  letter-spacing: -0.5px;
}

.auth-subtitle {
  font-family: 'Inter', sans-serif;
  font-size: 0.9rem;
  color: #4b4b5e;
  margin: 0 0 20px;
  line-height: 1.5;
}

/* Info Banner */
.info-banner {
  background-color: #fef9c3;
  border: 2px solid #ca8a04;
  padding: 10px 12px;
  font-family: 'Inter', sans-serif;
  font-size: 0.82rem;
  font-weight: 600;
  color: #854d0e;
  margin-bottom: 18px;
  line-height: 1.4;
}

/* Form */
.auth-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.form-group label {
  font-family: 'Inter', sans-serif;
  font-size: 0.88rem;
  font-weight: 700;
  color: #101010;
}

.brutal-input {
  width: 100%;
  padding: 11px 13px;
  border: 2px solid #101010;
  background-color: #ffffff;
  font-family: 'Inter', sans-serif;
  font-size: 0.95rem;
  font-weight: 500;
  color: #101010;
  outline: none;
  transition: all 0.15s ease;
  box-sizing: border-box;
}

.brutal-input:focus {
  box-shadow: 3px 3px 0px #101010;
  transform: translate(-2px, -2px);
}

.token-input {
  text-transform: uppercase;
  letter-spacing: 1.5px;
  font-weight: 700;
  font-size: 1rem;
}

/* Alerts */
.brutal-box {
  padding: 10px 12px;
  border: 2px solid #101010;
  font-family: 'Inter', sans-serif;
  font-size: 0.85rem;
  font-weight: 600;
  margin: 0;
}

.error-msg { background-color: #fecdd3; color: #9f1239; }
.success-msg { background-color: #d1fae5; color: #065f46; }

/* Buttons */
.btn-wrapper {
  position: relative;
  width: 100%;
  margin-top: 4px;
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

.brutal-btn {
  position: relative;
  z-index: 1;
  width: 100%;
  padding: 13px 20px;
  font-family: 'Inter', sans-serif;
  font-size: 1rem;
  font-weight: 700;
  border: 2px solid #101010;
  cursor: pointer;
  transition: transform 0.15s ease;
}

.brutal-btn:hover { transform: translate(-2px, -2px); }
.brutal-btn:active { transform: translate(2px, 2px); }
.brutal-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

.submit-btn { background-color: #fbbf24; color: #101010; }  /* Yellow for token */
.local-btn { background-color: #aeeacd; color: #101010; }   /* Mint for local */
.create-btn { background-color: #ada4db; color: #101010; }  /* Purple for create new */

/* Toggle Link */
.toggle-link { text-align: center; margin-top: 18px; }

.text-btn {
  background: none;
  border: none;
  font-family: 'Inter', sans-serif;
  font-size: 0.85rem;
  font-weight: 600;
  color: #4b4b5e;
  text-decoration: underline;
  cursor: pointer;
}
.text-btn:hover { color: #6366f1; }

/* Divider */
.divider {
  display: flex;
  align-items: center;
  margin: 22px 0;
  color: #94a3b8;
  font-size: 0.8rem;
}
.divider::before,
.divider::after {
  content: '';
  flex: 1;
  border-bottom: 2px solid #d1d5db;
}
.divider span {
  padding: 0 10px;
  font-weight: 700;
  color: #101010;
}

/* Create Section */
.create-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.create-subtitle {
  font-family: 'Inter', sans-serif;
  font-size: 0.9rem;
  color: #4b4b5e;
  font-weight: 600;
  margin: 0;
}
</style>
