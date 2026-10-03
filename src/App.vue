<script setup lang="ts">
import { Device } from '@capacitor/device';
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import BottomNav from './components/layout/BottomNav.vue';
import HeroHeader from './components/layout/HeroHeader.vue';
import AddMomentModal from './components/modals/AddMomentModal.vue';
import AuthModal from './components/modals/AuthModal.vue';
import EditMomentModal from './components/modals/EditMomentModal.vue';
import GlobalMapModal from './components/modals/GlobalMapModal.vue';
import { addMoment, createSessionWithToken, getSessionByToken, getTimelineData, registerCollaborator, removeCollaborator, saveAliasToSession } from './data/authService';
import { addLocalMoment, getActiveLocalSession, getActiveLocalShareToken, getLocalTimeline, logoutLocalUser } from './data/localStore';
import type { TimelineData, TimelineMoment } from './data/timeline';
import HomeView from './views/HomeView.vue';
import OnboardingView from './views/OnboardingView.vue';
import SettingsView from './views/SettingsView.vue';
import TimelineView from './views/TimelineView.vue';

// ── App State ─────────────────────────────────────────────────────────
type AuthType = 'cloud' | 'local' | null;

const showOnboarding = ref(true);
const showAuthModal = ref(false);
const authModalMode = ref<'token' | 'local'>('token');
const activeTab = ref<'home' | 'timeline' | 'settings'>('home');
const showAddModal = ref(false);
const showEditModal = ref(false);
const showDetailModal = ref(false);  // tracks when detail modal inside TimelineView is open
const activeEditMoment = ref<TimelineData | null>(null);

const authType = ref<AuthType>(null);
const activeCloudSession = ref<{ id: string; token: string; name: string } | null>(null);
const activeLocalUsername = ref<string | null>(null);
const activeLocalShareToken = ref<string | null>(null); // ← NEW: local share token
const userAlias = ref<string>(''); // ← NEW: customizable username/alias
const collaborators = ref<string[]>([]); // ← NEW: real-time collaborators list

const timelineItems = ref<TimelineData[]>([]);

const loading = ref(false);
const loadingMessage = ref('Memuat...');
const deviceBrand = ref<string>('');

// ── Device Brand Detection ────────────────────────────────────────────

/**
 * Extract the raw device segment from Android WebView User-Agent.
 * UA format: "Mozilla/5.0 (Linux; Android 11; <MODEL> Build/...; wv) ..."
 */
function getRawModelFromUA(): string {
  const ua = navigator.userAgent;
  const match = ua.match(/\(Linux; Android [^;]+; ([^;)]+?)(?:\s+Build\/|Build\/|\))/);
  return match ? match[1].trim() : '';
}

/**
 * Detect brand name from Android model code prefixes/patterns.
 * Returns empty string if brand cannot be determined.
 */
function detectBrandFromModel(model: string): string {
  const m = model.toUpperCase().trim();

  // ── Brand name already in string (e.g. "Xiaomi 2210132C", "Samsung Galaxy S21") ──
  const explicitBrands = [
    'Samsung', 'Xiaomi', 'POCO', 'Redmi', 'OPPO', 'Realme', 'Vivo', 'OnePlus',
    'Huawei', 'Honor', 'Motorola', 'Nokia', 'Sony', 'Google', 'ASUS', 'Lenovo',
    'Infinix', 'Tecno', 'Nothing', 'Meizu', 'ZTE', 'TCL'
  ];
  for (const brand of explicitBrands) {
    if (m.startsWith(brand.toUpperCase())) return brand;
  }

  // ── Samsung: SM-, GT-, SGH-, SCH-, SHV-, SPH- ──
  if (/^(SM-|GT-|SGH-|SCH-|SHV-|SPH-)/.test(m)) return 'Samsung';

  // ── Redmi (Xiaomi sub-brand — separate brand identity) ──
  // 4 digits + DRA/DRM/DRB/DRC → Redmi Note series (e.g. 2510DRA23E = Redmi Note 15 4G)
  if (/^\d{4}(DRA|DRM|DRB|DRC)/.test(m)) return 'Redmi';
  // RN suffix in code → Redmi (e.g. 23100RN82L = Redmi 13C, 23053RN02A = Redmi 12)
  if (/^\d{5}RN\d/.test(m)) return 'Redmi';
  // PCD suffix → Redmi Note 13 series (e.g. 23049PCD8G)
  if (/^\d{5}PCD/.test(m)) return 'Redmi';
  // Known Redmi 5-digit numeric prefixes
  if (/^(22120|23100|23049|23053|24117|2304F|2408F|22111)/.test(m)) return 'Redmi';
  // Old Redmi: HM prefix (Hongmi)
  if (/^HM[_\s]/.test(m)) return 'Redmi';

  // ── Xiaomi (Mi series & POCO) ──
  // M + 4 digits (e.g. M2011K2G = Xiaomi Mi 11, M2007J20CI = POCO X3)
  if (/^M\d{4}[A-Z]/.test(m)) return 'Xiaomi';
  // 4 digits + Xiaomi Mi series suffix (MSF/MJG/MCE etc: Xiaomi 11/12/13 series)
  if (/^\d{4}(MSF|MJG|MCE|EMG|ENG|MJT|116|117|118|123|124|125|126)/.test(m)) return 'Xiaomi';

  // ── Realme ──
  // RMX prefix (most reliable Realme identifier)
  if (/^RMX/.test(m)) return 'Realme';
  // Confirmed Realme 4-digit patterns (DA/DB/DC/DM with digit suffix)
  if (/^\d{4}(DA\d|DB\d|DC\d|DM\d)/.test(m)) return 'Realme';

  // ── OPPO ──
  if (/^(CPH|PDHM|PDVM|PHK|PEQ|PGM|PEGM|PFUM)/.test(m)) return 'OPPO';

  // ── Vivo ──
  if (/^(V\d{4}A|V\d{4}T|PD\d{4}|I\d{4}(BA|EL))/.test(m)) return 'Vivo';

  // ── OnePlus ──
  if (/^(IN2|IN1|GM1|LE2|LE1|BE20|KB2|AC2|HD1|DE2|CPH\d{4}OBT)/.test(m)) return 'OnePlus';
  if (/^(ONE\s?PLUS|1\+)/.test(m)) return 'OnePlus';

  // ── Huawei ──
  if (/^(ELS|ANE|PRA|ALP|LYA|HMA|OCE|JSN|VOG|MAR|CLT|INE|DUB|LLD|ARS|MRD|ARE|BLA|RNE|ATU|AUM|COR|BND|CML|VTR|BKL|PCT|CAN|TAS|GOT|JKM|LIO|SEA|EVR|YAL|HRY|ELS|CDY|NEN|NOH|JNY|NNA|BAH|WGR|DBY)/.test(m)) return 'Huawei';

  // ── Honor (spun off from Huawei) ──
  if (/^(NTH|ANY|CRT|TNN|TNA|RLM|GIA|FNE|REA|CMA|DEA|VNE|BNE|DNE|WDY|CLE|ROB|FRI|ELZ|MAD|VER|PPA|NCE|CHL|CLA|CHM|PLK|CAM|ALE|MLA|TAG|NXT|LON|VNS|FIG|KII|KIW|KSA|MED|BAC|WAS|VEN)/.test(m)) return 'Honor';

  // ── Motorola ──
  if (/^XT\d{4}/.test(m)) return 'Motorola';
  if (/^MOTO/.test(m)) return 'Motorola';

  // ── Nokia ──
  if (/^TA-\d{4}/.test(m)) return 'Nokia';

  // ── Sony Xperia ──
  if (/^(XQ-|SOG\d{2}|SO-\d{2}[A-Z]|SOV\d{2})/.test(m)) return 'Sony';
  if (/^[GHIJ]\d{4}$/.test(m)) return 'Sony'; // G8342 etc.

  // ── LG ──
  if (/^(LM-|LG-)/.test(m)) return 'LG';

  // ── ASUS ──
  if (/^(ZB\d{3}|ZS\d{3}|AI22|ASUS_|ROG|ZE\d{3})/.test(m)) return 'ASUS';

  // ── Lenovo ──
  if (/^(TB-|K\d{5}(C|F)|L\d{5})/.test(m)) return 'Lenovo';

  // ── Google Pixel ──
  if (/^PIXEL/.test(m)) return 'Google';

  // ── Infinix ──
  if (/^(X\d{3}[A-Z]?$|X\d{4}[A-Z]?$)/.test(m)) return 'Infinix';

  // ── Tecno ──
  if (/^(TECNO|KG\d|KE\d|KH\d|KC\d|CD\d|LC\d|CE\d|CF\d|CH\d)/.test(m)) return 'Tecno';

  // ── Nothing Phone ──
  if (/^(A063|A065)/.test(m)) return 'Nothing';

  return '';
}

// Fetch device info — detects brand from UA model code
async function fetchDeviceInfo() {
  const rawModel = getRawModelFromUA();

  if (rawModel && rawModel !== 'unknown') {
    // Try to identify brand from model code
    const brand = detectBrandFromModel(rawModel);
    deviceBrand.value = brand || rawModel; // Show brand if detected, else raw model code
    return;
  }

  // Fallback: @capacitor/device native plugin
  try {
    const info = await Device.getInfo();
    const manufacturer = info.manufacturer;
    if (manufacturer && manufacturer !== 'unknown') {
      deviceBrand.value = manufacturer.charAt(0).toUpperCase() + manufacturer.slice(1);
    } else {
      deviceBrand.value = 'Perangkat Android';
    }
  } catch (err) {
    console.error('Failed to get device info:', err);
    deviceBrand.value = 'Perangkat Android';
  }
}


// ── Computed ──────────────────────────────────────────────────────────
const activeSessionToken = computed(() => activeCloudSession.value?.token ?? null);
const activeSessionName = computed(() => activeCloudSession.value?.name ?? activeLocalUsername.value ?? null);
const isCloud = computed(() => authType.value === 'cloud');
const isLocal = computed(() => authType.value === 'local');

// ── Collaborator & Alias Helpers ──────────────────────────────────────

/** Returns a stable device key that survives reinstalls (via Device plugin UUID or fallback) */
async function getDeviceKey(): Promise<string> {
  try {
    const info = await Device.getId();
    // identifier is stable on Android between reinstalls (Android ID)
    return (info as any).identifier || (info as any).uuid || '';
  } catch {
    return '';
  }
}

/**
 * Generates a deterministic, human-readable alias from a device key.
 * The same deviceKey always produces the same alias — no randomness.
 */
function buildAliasFromDeviceKey(deviceKey: string): string {
  // Use last 6 chars of device key as a stable suffix
  const suffix = deviceKey.replace(/[^a-zA-Z0-9]/g, '').slice(-6).toUpperCase();
  return `@Perangkat_${suffix || 'XXXX'}`;
}

/**
 * Initialises the user alias.
 * Priority:
 *  1. Already in localStorage → user may have manually set a custom alias (fastest path)
 *  2. Derived deterministically from Device.getId() → stable across reinstalls, no randomness
 *  3. Username for local mode (e.g. @parhan)
 * NOTE: There is NO random fallback. Same device = same alias, always.
 */
async function initUserAlias(username?: string, _sessionId?: string) {
  // 1) Already stored locally (same install, or user set a custom alias)
  const saved = localStorage.getItem('tl_user_alias');
  if (saved) {
    userAlias.value = saved;
    return;
  }

  let alias: string;

  if (username) {
    // 3) Local mode: use the actual username
    alias = `@${username}`;
  } else {
    // 2) Derive deterministically from stable device ID
    //    Device.getId() returns Android ID on Android — survives reinstalls
    const deviceKey = await getDeviceKey();
    if (deviceKey) {
      alias = buildAliasFromDeviceKey(deviceKey);
    } else {
      // Web/desktop fallback: use a persistent ID stored in localStorage under a
      // separate key that we try to preserve. If truly missing, generate once.
      let webId = localStorage.getItem('tl_device_id');
      if (!webId) {
        webId = Math.random().toString(36).substring(2, 10).toUpperCase();
        localStorage.setItem('tl_device_id', webId);
      }
      alias = `@Perangkat_${webId.slice(-6)}`;
    }
  }

  localStorage.setItem('tl_user_alias', alias);
  userAlias.value = alias;
}

async function syncCollaborators() {
  let sessionId = activeCloudSession.value?.id;
  if (!sessionId && isLocal.value && activeLocalShareToken.value) {
    try {
      const session = await getSessionByToken(activeLocalShareToken.value);
      if (session) sessionId = session.id;
    } catch {}
  }

  if (sessionId && userAlias.value) {
    try {
      const list = await registerCollaborator(sessionId, userAlias.value);
      collaborators.value = list;
    } catch (err) {
      console.warn('Gagal sinkronisasi kolaborator:', err);
    }
  }
}

async function changeAlias() {
  const newAlias = prompt('Ubah Nama Panggilan / Alias Anda:', userAlias.value);
  if (newAlias === null) return;
  
  const clean = newAlias.trim();
  if (!clean) {
    alert('Alias tidak boleh kosong!');
    return;
  }

  const old = userAlias.value;
  userAlias.value = clean;
  localStorage.setItem('tl_user_alias', clean);
  // Also persist to cloud so the new alias survives reinstall
  const sid = activeCloudSession.value?.id;
  if (sid) { _persistAliasToCloud(sid).catch(() => {}); }

  let sessionId = activeCloudSession.value?.id;
  if (!sessionId && isLocal.value && activeLocalShareToken.value) {
    try {
      const session = await getSessionByToken(activeLocalShareToken.value);
      if (session) sessionId = session.id;
    } catch {}
  }

  if (sessionId) {
    try {
      const list = await registerCollaborator(sessionId, clean, old);
      collaborators.value = list;
      alert(`Alias berhasil diubah menjadi: ${clean}`);
    } catch (err) {
      console.warn('Gagal update alias ke server:', err);
      alert('Alias disimpan secara lokal, gagal upload ke cloud.');
    }
  } else {
    alert(`Alias disimpan secara lokal.`);
  }
}

async function deleteAlias(aliasToRemove: string) {
  if (!confirm(`Hapus alias "${aliasToRemove}" dari sesi ini?`)) return;
  
  let sessionId = activeCloudSession.value?.id;
  if (!sessionId && isLocal.value && activeLocalShareToken.value) {
    try {
      const session = await getSessionByToken(activeLocalShareToken.value);
      if (session) sessionId = session.id;
    } catch {}
  }
  
  if (!sessionId) return;
  
  try {
    const list = await removeCollaborator(sessionId, aliasToRemove);
    collaborators.value = list;
  } catch (err) {
    console.error('Gagal menghapus alias:', err);
    alert('Gagal menghapus alias, periksa koneksi Anda.');
  }
}

// ── Auto-login on App Mount ───────────────────────────────────────────
onMounted(async () => {
  fetchDeviceInfo();

  // Check for saved cloud token
  const savedToken = localStorage.getItem('tl_cloud_token');
  if (savedToken) {
    loading.value = true;
    loadingMessage.value = 'Menghubungkan sesi cloud...';
    try {
      const session = await getSessionByToken(savedToken);
      if (session) {
        activeCloudSession.value = session;
        authType.value = 'cloud';
        await initUserAlias(undefined, session.id);
        await fetchCloudTimeline(session.id);
        await syncCollaborators();
        // Save alias back to cloud in case this is a fresh install restoring
        await _persistAliasToCloud(session.id);
        showOnboarding.value = false;
        return;
      } else {
        localStorage.removeItem('tl_cloud_token');
      }
    } catch (err) {
      console.error('Cloud auto-login failed:', err);
    } finally {
      loading.value = false;
    }
  }

  // Check for saved local session
  const localSession = getActiveLocalSession();
  if (localSession) {
    activeLocalUsername.value = localSession.username;
    authType.value = 'local';
    activeLocalShareToken.value = getActiveLocalShareToken();
    await initUserAlias(localSession.username);
    loadLocalTimeline(localSession.username);
    await syncCollaborators();
    showOnboarding.value = false;
  }
})

/** Persist current alias to cloud so it survives reinstall */
async function _persistAliasToCloud(sessionId: string) {
  if (!userAlias.value || !sessionId) return;
  try {
    const deviceKey = await getDeviceKey();
    if (deviceKey) {
      await saveAliasToSession(sessionId, deviceKey, userAlias.value);
    }
  } catch { /* non-critical, ignore */ }
};


// ── Cloud Timeline ────────────────────────────────────────────────────
async function fetchCloudTimeline(sessionId: string) {
  loading.value = true;
  loadingMessage.value = 'Sinkronisasi data dari cloud...';
  try {
    const data = await getTimelineData(sessionId);
    timelineItems.value = data;
  } catch (err) {
    console.error('Failed to fetch cloud timeline:', err);
  } finally {
    loading.value = false;
  }
}

// ── Local Timeline ────────────────────────────────────────────────────
function loadLocalTimeline(username: string) {
  const localData = getLocalTimeline(username);
  timelineItems.value = localData;
  triggerLocalSync();

  function triggerLocalSync() {
    if (activeLocalShareToken.value) {
      syncLocalTimelineWithCloud(username, activeLocalShareToken.value);
    }
  }
}

let isLocalSyncing = false;

/**
 * Reconciles local storage moments with Supabase cloud database
 * for local accounts sharing their timeline.
 * Pass force=true to bypass the in-progress guard (used after explicit edits).
 */
async function syncLocalTimelineWithCloud(username: string, shareToken: string, force = false) {
  if (isLocalSyncing && !force) return;
  isLocalSyncing = true;

  try {
    // 1. Get or create corresponding session in Supabase cloud
    let session = await getSessionByToken(shareToken);
    if (!session) {
      session = await createSessionWithToken(shareToken, `Lokal: @${username}`);
    }

    // 2. Fetch data from both sources
    const cloudItems = await getTimelineData(session.id);
    const localItems = getLocalTimeline(username);

    // Build lookup maps by cloud ID (the stable Supabase UUID)
    // Local items may have a local_xxx ID (before first sync) or a cloud UUID (after sync)
    const cloudById = new Map(cloudItems.map(c => [c.id, c]));

    // Fallback signature using title+date only (NOT location, since location can change)
    const getSig = (item: any) =>
      `${(item.title || '').trim().toLowerCase()}|${(item.date || '').trim().toLowerCase()}`;

    const cloudBySig = new Map(cloudItems.map(c => [getSig(c), c]));

    let updated = false;
    const { updateMoment, addMomentPhoto } = await import('./data/authService');
    const { updateLocalMoment } = await import('./data/localStore');

    // A. Upload/update moments from local → cloud
    for (const localItem of localItems) {
      // Try to match by ID first (reliable after first sync)
      const matchById = cloudById.get(localItem.id);
      const isUUID = localItem.id && !localItem.id.toString().startsWith('local_');
      
      // Fallback: match by title+date signature ONLY if it's a local_ ID.
      // If it's a UUID and missing from cloud, it means it was deleted explicitly.
      const matchBySig = (!matchById && !isUUID) ? cloudBySig.get(getSig(localItem)) : null;
      const cloudMatch = matchById || matchBySig;

      if (!cloudMatch) {
        if (isUUID) {
          // This local item has a cloud UUID but is missing from the cloud.
          // This means it was deleted on another device. We should delete it locally!
          const { deleteLocalMoment } = await import('./data/localStore');
          deleteLocalMoment(username, localItem.id);
          updated = true;
        } else {
          // Truly new local moment — insert to cloud
          await addMoment(session.id, localItem, localItem.moments || [], username);
          updated = true;
        }
      } else {
        // Moment exists in cloud — update metadata if changed (e.g., location was edited)
        const metaChanged =
          localItem.title !== cloudMatch.title ||
          localItem.location !== cloudMatch.location ||
          localItem.date !== cloudMatch.date ||
          localItem.dotColor !== cloudMatch.dotColor ||
          localItem.rtl !== cloudMatch.rtl ||
          localItem.mapEmbedUrl !== cloudMatch.mapEmbedUrl;

        if (metaChanged && force) {
          await updateMoment(session.id, cloudMatch.id, {
            title: localItem.title,
            location: localItem.location,
            date: localItem.date,
            year: localItem.year,
            dotColor: localItem.dotColor,
            rtl: localItem.rtl,
            mapEmbedUrl: localItem.mapEmbedUrl || '',
            latitude: localItem.latitude,
            longitude: localItem.longitude,
          });
          updated = true;
        }

        // Sync extra photos: upload local extras that cloud doesn't have yet
        const localCount = (localItem.moments || []).length;
        const cloudCount = (cloudMatch.moments || []).length;
        if (localCount > cloudCount) {
          const photosToUpload = (localItem.moments || []).slice(cloudCount);
          for (const photo of photosToUpload) {
            await addMomentPhoto(cloudMatch.id, {
              title: photo.title || '',
              description: photo.description || '',
              image: photo.image,
              accentColor: photo.accentColor || ''
            });
          }
          updated = true;
        } else if (cloudCount > localCount) {
          // Download extra photos from cloud to local
          updateLocalMoment(username, localItem.id, { moments: cloudMatch.moments });
          updated = true;
        }
      }
    }

    // B. Download moments existing in cloud but missing locally
    const localIds = new Set(localItems.map(l => l.id));
    const localSigs = new Set(localItems.map(l => getSig(l)));
    for (const cloudItem of cloudItems) {
      if (!localIds.has(cloudItem.id) && !localSigs.has(getSig(cloudItem))) {
        addLocalMoment(username, cloudItem);
        updated = true;
      }
    }

    // C. Refresh UI if database reconciliation made additions
    if (updated) {
      timelineItems.value = getLocalTimeline(username);
    }
  } catch (err) {
    console.warn('Gagal sinkronisasi dengan database cloud (offline?):', err);
  } finally {
    isLocalSyncing = false;
  }
}



// ── Onboarding Handlers ───────────────────────────────────────────────
function handleChooseAccount() {
  authModalMode.value = 'local';
  showAuthModal.value = true;
}

function handleChooseToken() {
  authModalMode.value = 'token';
  showAuthModal.value = true;
}

function handleLearnMore() {
  alert(
    'Token Sesi (☁️ Cloud)\nKode unik seperti MOMEN-AB12-XY34.\nMemungkinkan beberapa pengguna bergabung ke satu timeline yang sama. Data tersimpan di cloud.\n\n' +
    'Akun Lokal (📱 Lokal)\nUsername & password hanya tersimpan di HP ini. Cocok untuk catatan pribadi. Data tidak dikirim ke internet.'
  );
}

// ── Auth Modal Handlers ───────────────────────────────────────────────
async function handleAuthSuccess(result: {
  authType: 'cloud' | 'local';
  username?: string;
  sessionId?: string;
  token?: string;
  sessionName?: string;
  shareToken?: string;
}) {
  showAuthModal.value = false;
  loading.value = true;

  try {
    if (result.authType === 'cloud' && result.sessionId && result.token) {
      activeCloudSession.value = {
        id: result.sessionId,
        token: result.token,
        name: result.sessionName || 'Timeline Kami'
      };
      authType.value = 'cloud';
      localStorage.setItem('tl_cloud_token', result.token);
      await initUserAlias(undefined, result.sessionId);
      await fetchCloudTimeline(result.sessionId);
      await syncCollaborators();
      await _persistAliasToCloud(result.sessionId);
    } else if (result.authType === 'local' && result.username) {
      activeLocalUsername.value = result.username;
      authType.value = 'local';
      activeLocalShareToken.value = result.shareToken ?? getActiveLocalShareToken();
      await initUserAlias(result.username);
      loadLocalTimeline(result.username);
      await syncCollaborators();
    }


    showOnboarding.value = false;
  } catch (err) {
    console.error('Post-auth error:', err);
  } finally {
    loading.value = false;
  }
}

// ── Logout ────────────────────────────────────────────────────────────
function handleLogout() {
  const tokenHint = isCloud.value
    ? `\n\nToken Anda: ${activeSessionToken.value}`
    : activeLocalShareToken.value
      ? `\n\nToken Lokal Anda: ${activeLocalShareToken.value}\nSimpan ini untuk bergabung lagi!`
      : '';

  if (!confirm(`Apakah Anda yakin ingin keluar?${isCloud.value ? tokenHint + '\n\nSimpan token ini sebelum keluar!' : tokenHint}`)) {
    return;
  }

  if (isCloud.value) {
    localStorage.removeItem('tl_cloud_token');
    activeCloudSession.value = null;
  } else {
    logoutLocalUser();
    activeLocalUsername.value = null;
    activeLocalShareToken.value = null;
  }

  authType.value = null;
  timelineItems.value = [];
  showOnboarding.value = true;
}

// ── Copy Token ────────────────────────────────────────────────────────
function copyToken() {
  if (activeSessionToken.value) {
    navigator.clipboard.writeText(activeSessionToken.value);
    alert(`Token disalin: ${activeSessionToken.value}`);
  }
}

function copyLocalToken() {
  if (activeLocalShareToken.value) {
    navigator.clipboard.writeText(activeLocalShareToken.value);
    alert(`Token lokal disalin: ${activeLocalShareToken.value}\n\nBagikan ke teman untuk join ke timeline ini!`);
  }
}
// ── Add Moment ─────────────────────────────────────────────────────────
async function handleMomentAdded(data: {
  title: string;
  location: string;
  date: string;
  year: number;
  dotColor: string;
  rtl: boolean;
  mapEmbedUrl: string;
  latitude?: number;
  longitude?: number;
  initialPhoto?: { image: string, localImageId: string };
  additionalPhotos?: Array<{ image: string, localImageId: string }>;
}) {
  showAddModal.value = false;
  loading.value = true;
  loadingMessage.value = 'Menyimpan momen...';
  try {
    const momentShape = {
      title: data.title,
      location: data.location,
      date: data.date,
      year: data.year,
      dotColor: data.dotColor,
      rtl: data.rtl,
      mapEmbedUrl: data.mapEmbedUrl,
      latitude: data.latitude,
      longitude: data.longitude,
    };

    const newMomentItems: TimelineMoment[] = [];
    if (data.initialPhoto) {
      newMomentItems.push({
        title: 'Foto Utama',
        description: '',
        image: data.initialPhoto.image,
        accentColor: data.dotColor,
        localImageId: data.initialPhoto.localImageId
      });
    }
    // Add additional photos (multi-select)
    if (data.additionalPhotos && data.additionalPhotos.length > 0) {
      for (const photo of data.additionalPhotos) {
        newMomentItems.push({
          title: '',
          description: '',
          image: photo.image,
          accentColor: data.dotColor,
          localImageId: photo.localImageId
        });
      }
    }

    if (isCloud.value && activeCloudSession.value) {
      await addMoment(
        activeCloudSession.value.id,
        momentShape,
        newMomentItems,
        activeLocalUsername.value || undefined
      );
      await fetchCloudTimeline(activeCloudSession.value.id);
    } else if (isLocal.value && activeLocalUsername.value) {
      const addedData = { ...momentShape, moments: newMomentItems } as TimelineData;
      addLocalMoment(activeLocalUsername.value, addedData);
      loadLocalTimeline(activeLocalUsername.value);
    }
  } catch (err) {
    console.error('Failed to add moment:', err);
    alert('Gagal menyimpan momen. Coba lagi.');
  } finally {
    loading.value = false;
  }
}

function openEditModal(moment: TimelineData) {
  activeEditMoment.value = moment;
  showEditModal.value = true;
}

async function handleMomentUpdated(data: any) {
  showEditModal.value = false;
  loading.value = true;
  loadingMessage.value = 'Menyimpan perubahan...';
  try {
    const updatedData = { ...data };

    // Collect ALL new photos (initialPhoto + additionalPhotos)
    const allNewPhotos: Array<{ image: string; localImageId: string }> = [];
    if (data.initialPhoto) allNewPhotos.push(data.initialPhoto);
    if (data.additionalPhotos && data.additionalPhotos.length > 0) {
      allNewPhotos.push(...data.additionalPhotos);
    }

    // Build updated moments list: existing + new
    const existingMoments = data.existingMoments || (timelineItems.value.find(m => m.id === data.id)?.moments || []);
    const newPhotoItems = allNewPhotos.map(photo => ({
      title: '',
      description: '',
      image: photo.image,
      accentColor: data.dotColor,
      localImageId: photo.localImageId
    }));
    
    // Always assign moments array because existingMoments might have been reordered/deleted/edited
    updatedData.moments = [...existingMoments, ...newPhotoItems];

    // Optimistic UI update — create new array reference so Vue watchers trigger
    const idx = timelineItems.value.findIndex(m => m.id === data.id);
    if (idx !== -1) {
      const updated = { ...timelineItems.value[idx], ...updatedData };
      const newArr = [...timelineItems.value];
      newArr[idx] = updated;
      timelineItems.value = newArr;
    }

    if (isCloud.value && activeCloudSession.value) {
      const { updateMoment, addMomentPhoto, clearMomentPhotos } = await import('./data/authService');
      // Update metadata
      await updateMoment(activeCloudSession.value.id, data.id, updatedData);
      
      // Sync photos: clear existing in cloud and re-upload the entire updated array sequentially
      // Sequential upload guarantees that Supabase's created_at reflects the exact sorted order
      await clearMomentPhotos(data.id);
      for (const photo of updatedData.moments) {
        await addMomentPhoto(data.id, {
          title: photo.title || '',
          description: photo.description || '',
          image: photo.image,
          accentColor: photo.accentColor || data.dotColor
        });
        // Small delay to ensure created_at timestamps are strictly sequential
        await new Promise(r => setTimeout(r, 10));
      }
      
      await fetchCloudTimeline(activeCloudSession.value.id);
    } else if (isLocal.value && activeLocalUsername.value) {
      const { updateLocalMoment } = await import('./data/localStore');
      updateLocalMoment(activeLocalUsername.value, data.id, updatedData);
      loadLocalTimeline(activeLocalUsername.value);
      // ── Sync to cloud so other devices can pull the updated moment ──
      if (activeLocalShareToken.value) {
        syncLocalTimelineWithCloud(activeLocalUsername.value, activeLocalShareToken.value, true).catch(
          err => console.warn('Background cloud sync failed after edit:', err)
        );
      }
    }
  } catch (err) {
    console.error('Failed to update moment:', err);
    alert('Gagal menyimpan perubahan. Coba lagi.');
  } finally {
    loading.value = false;
  }
}

async function handleReorderPhotos({ momentId, moments }: { momentId: string; moments: any[] }) {
  // Optimistic UI already done in TimelineView — just persist
  const idx = timelineItems.value.findIndex(m => m.id === momentId);
  if (idx !== -1) {
    timelineItems.value[idx] = { ...timelineItems.value[idx], moments };
  }
  try {
    if (isLocal.value && activeLocalUsername.value) {
      const { updateLocalMoment } = await import('./data/localStore');
      updateLocalMoment(activeLocalUsername.value, momentId, { moments });
    } else if (isCloud.value && activeCloudSession.value) {
      // For cloud, update each moment_item order if backend supports it
      // For now, we rely on the local optimistic update within the session
      console.log('Photo reorder saved locally for cloud session:', momentId);
    }
  } catch (err) {
    console.error('Failed to persist photo reorder:', err);
  }
}

// ── Delete Moments FAB State ──────────────────────────────────────────
const showDeleteMomentModal = ref(false);
const selectedMomentsToDelete = ref<string[]>([]);
const isFabOpen = ref(false);

// Delete modal v2 filters
// ── Delete modal year paging ────────────────────────────────────────────
const YEARS_PER_PAGE = 9;
const DEL_BASE_YEAR  = 2020;
// Start on the page that contains the current year
const currentYear   = new Date().getFullYear();
const yearPageIndex = ref(Math.floor((currentYear - DEL_BASE_YEAR) / YEARS_PER_PAGE));

// Drag/swipe state
const delYearDragX      = ref(0);
const delYearIsDragging = ref(false);
const delYearSlideDir   = ref<'left' | 'right'>('left'); // which direction to animate
let   delYearStartX     = 0;

const delTotalYearPages = computed(() => {
  const maxYear = Math.max(new Date().getFullYear() + 5, DEL_BASE_YEAR + YEARS_PER_PAGE - 1);
  return Math.ceil((maxYear - DEL_BASE_YEAR + 1) / YEARS_PER_PAGE);
});

// 9 years for current page, descending (largest first)
const delYearPageYears = computed(() => {
  const start = DEL_BASE_YEAR + yearPageIndex.value * YEARS_PER_PAGE;
  const years: number[] = [];
  for (let i = YEARS_PER_PAGE - 1; i >= 0; i--) years.push(start + i);
  return years;
});

// Live drag offset (only during drag)
const delYearTrackStyle = computed(() => ({
  transform: `translateX(${delYearDragX.value}px)`,
  transition: delYearIsDragging.value ? 'none' : 'transform 0.35s cubic-bezier(0.25,1,0.5,1)',
}));

function delYearTouchStart(e: TouchEvent) {
  delYearStartX          = e.touches[0].clientX;
  delYearIsDragging.value = true;
  delYearDragX.value     = 0;
}
function delYearTouchMove(e: TouchEvent) {
  if (!delYearIsDragging.value) return;
  // Follow finger, clamped to ±80px for a "rubber band" feel
  const raw = e.touches[0].clientX - delYearStartX;
  delYearDragX.value = Math.max(-80, Math.min(80, raw));
}
function delYearTouchEnd(e: TouchEvent) {
  delYearIsDragging.value = false;
  const diff = e.changedTouches[0].clientX - delYearStartX;
  const threshold = 50;

  if (diff > threshold && yearPageIndex.value < delTotalYearPages.value - 1) {
    // Swipe RIGHT → later years (2029+)
    delYearSlideDir.value = 'left';
    yearPageIndex.value++;
  } else if (diff < -threshold && yearPageIndex.value > 0) {
    // Swipe LEFT → earlier years
    delYearSlideDir.value = 'right';
    yearPageIndex.value--;
  }
  delYearDragX.value = 0;
}

// Close speed dial when switching tabs
watch(activeTab, () => { isFabOpen.value = false; });

const deleteSelectedYear  = ref<number>(new Date().getFullYear());
const deleteSelectedMonth = ref<string>('');
const showDeleteSearch    = ref(false);
const deleteSearchQuery   = ref('');
const delSearchInputRef   = ref<HTMLInputElement | null>(null);

// Auto-focus search input when search panel opens
watch(showDeleteSearch, (val) => {
  if (val) nextTick(() => delSearchInputRef.value?.focus());
});

// Reset month filter when year changes
watch(deleteSelectedYear, () => {
  deleteSelectedMonth.value = '';
});

// Computed for delete modal v2
// Helper: parse Indonesian date string "DD MMMM YYYY" → { year, month }
const MONTHS_ID: Record<string, string> = {
  'Januari': '01', 'Februari': '02', 'Maret': '03', 'April': '04',
  'Mei': '05', 'Juni': '06', 'Juli': '07', 'Agustus': '08',
  'September': '09', 'Oktober': '10', 'November': '11', 'Desember': '12',
};
const MONTHS_ID_LABEL: Record<string, string> = {
  '01': 'Januari', '02': 'Februari', '03': 'Maret', '04': 'April',
  '05': 'Mei', '06': 'Juni', '07': 'Juli', '08': 'Agustus',
  '09': 'September', '10': 'Oktober', '11': 'November', '12': 'Desember',
};

function parseDateID(dateStr: string): { year: number; monthNum: string; monthLabel: string } | null {
  if (!dateStr) return null;
  const parts = dateStr.trim().split(' ');
  // Format: "DD MMMM YYYY" → parts[0]=day, parts[1]=month-name, parts[2]=year
  if (parts.length === 3) {
    const year = parseInt(parts[2], 10);
    const monthNum = MONTHS_ID[parts[1]] ?? '';
    const monthLabel = parts[1];
    if (!isNaN(year) && monthNum) return { year, monthNum, monthLabel };
  }
  // Fallback: try YYYY-MM-DD
  if (parts.length === 1 && dateStr.includes('-')) {
    const [y, m] = dateStr.split('-');
    const year = parseInt(y, 10);
    if (!isNaN(year) && m) return { year, monthNum: m, monthLabel: MONTHS_ID_LABEL[m] ?? m };
  }
  return null;
}

const deleteMomentYears = computed(() => {
  const years = new Set<number>();
  timelineItems.value.forEach(item => {
    const parsed = parseDateID(item.date);
    if (parsed) years.add(parsed.year);
  });
  return Array.from(years).sort((a, b) => b - a);
});

// All 12 months always shown; months with data get a dot indicator
const ALL_MONTHS_LABEL = [
  'Januari','Februari','Maret','April','Mei','Juni',
  'Juli','Agustus','September','Oktober','November','Desember'
];

const monthsWithData = computed(() => {
  const set = new Set<string>();
  timelineItems.value.forEach(item => {
    const p = parseDateID(item.date);
    if (p && p.year === deleteSelectedYear.value) set.add(p.monthLabel);
  });
  return set;
});

// Always return all 12 month names
const deleteMomentMonths = computed(() => ALL_MONTHS_LABEL);

const deleteFilteredMoments = computed(() => {
  let items = timelineItems.value;

  // Filter by year
  items = items.filter(item => {
    const parsed = parseDateID(item.date);
    return parsed?.year === deleteSelectedYear.value;
  });

  // Filter by month label if selected
  if (deleteSelectedMonth.value) {
    items = items.filter(item => {
      const parsed = parseDateID(item.date);
      return parsed?.monthLabel === deleteSelectedMonth.value;
    });
  }

  // Filter by search query (title or location)
  if (deleteSearchQuery.value.trim()) {
    const q = deleteSearchQuery.value.trim().toLowerCase();
    items = items.filter(item =>
      item.title?.toLowerCase().includes(q) ||
      item.location?.toLowerCase().includes(q)
    );
  }

  return items;
});

function closeDeleteMomentModal() {
  showDeleteMomentModal.value = false;
  selectedMomentsToDelete.value = [];
}

function openDeleteMomentModal() {
  // Set initial year to the latest year available
  const years = deleteMomentYears.value;
  if (years.length > 0) {
    deleteSelectedYear.value = years[0]; // First item is the latest (sorted desc)
  }
  deleteSelectedMonth.value = '';
  selectedMomentsToDelete.value = [];
  showDeleteMomentModal.value = true;
}

function toggleDeleteSelectAll(e: Event) {
  const checked = (e.target as HTMLInputElement).checked;
  if (checked) {
    selectedMomentsToDelete.value = timelineItems.value.map(i => i.id);
  } else {
    selectedMomentsToDelete.value = [];
  }
}

function toggleDeleteSelectAllFiltered(e: Event) {
  const checked = (e.target as HTMLInputElement).checked;
  if (checked) {
    selectedMomentsToDelete.value = deleteFilteredMoments.value.map(i => i.id);
  } else {
    selectedMomentsToDelete.value = [];
  }
}

async function confirmDeleteMoments() {
  if (selectedMomentsToDelete.value.length === 0) return;
  const ids = [...selectedMomentsToDelete.value];
  closeDeleteMomentModal();
  await handleDeleteMoments(ids);
}

// ── Delete Moments ────────────────────────────────────────────────────
async function handleDeleteMoments(ids: string[]) {
  if (!ids || ids.length === 0) return;
  loading.value = true;
  loadingMessage.value = `Menghapus ${ids.length} momen...`;
  try {
    if (isCloud.value && activeCloudSession.value) {
      const { deleteMoment } = await import('./data/authService');
      for (const id of ids) {
        await deleteMoment(id);
      }
      await fetchCloudTimeline(activeCloudSession.value.id);
    } else if (isLocal.value && activeLocalUsername.value) {
      const { deleteLocalMoment, getLocalTimeline } = await import('./data/localStore');
      const { deleteMoment, getSessionByToken, getTimelineData } = await import('./data/authService');
      
      const localMomentsBefore = getLocalTimeline(activeLocalUsername.value);
      const itemsToDelete = localMomentsBefore.filter(m => ids.includes(m.id));

      for (const id of ids) {
        deleteLocalMoment(activeLocalUsername.value, id);
      }
      loadLocalTimeline(activeLocalUsername.value);
      
      // Also clean up from cloud sync if share token exists
      if (activeLocalShareToken.value) {
        try {
          const session = await getSessionByToken(activeLocalShareToken.value);
          if (session) {
            const cloudItems = await getTimelineData(session.id);
            for (const itemToDelete of itemsToDelete) {
               const sig = `${(itemToDelete.title || '').trim().toLowerCase()}|${(itemToDelete.date || '').trim().toLowerCase()}`;
               const cloudMatch = cloudItems.find(c => c.id === itemToDelete.id || `${(c.title || '').trim().toLowerCase()}|${(c.date || '').trim().toLowerCase()}` === sig);
               if (cloudMatch) {
                 await deleteMoment(cloudMatch.id);
               }
            }
          }
        } catch (e) {
          console.warn('Gagal menghapus momen dari cloud:', e);
        }

        syncLocalTimelineWithCloud(activeLocalUsername.value, activeLocalShareToken.value, true).catch(
          err => console.warn('Cloud sync after delete failed:', err)
        );
      }
    }
  } catch (err) {
    console.error('Failed to delete moments:', err);
    alert('Gagal menghapus momen. Coba lagi.');
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <!-- Loading Overlay -->
  <Transition name="fade">
    <div v-if="loading" class="loading-overlay">
      <div class="loading-card">
        <i class="fa-solid fa-spinner fa-spin spinner-icon"></i>
        <p>{{ loadingMessage }}</p>
      </div>
    </div>
  </Transition>

  <!-- Auth Modal -->
  <AuthModal
    v-if="showAuthModal"
    :mode="authModalMode"
    @close="showAuthModal = false"
    @switch-mode="(m) => authModalMode = m"
    @auth-success="handleAuthSuccess"
  />

  <!-- Onboarding / Setup Flow -->
  <OnboardingView
    v-if="showOnboarding"
    @choose-account="handleChooseAccount"
    @choose-token="handleChooseToken"
    @learn-more="handleLearnMore"
  />

  <!-- Timeline View with Bottom Navigation -->
  <div v-else class="portfolio-container timeline-active-view">

    <!-- ═══════════════════════════════════════════════
         SESSION HEADER
    ═══════════════════════════════════════════════ -->
    <header v-if="activeTab === 'settings'" class="session-header">

      <!-- ── SECTION 1: Main Header ─────────────────── -->
      <div class="hdr-section-main">
        <!-- Timeline title -->
        <div class="hdr-title-block">
          <h1 class="hdr-title">
            SELAMAT DATANG {{ userAlias ? userAlias.toUpperCase() : '' }}
          </h1>
        </div>

        <!-- Alias + Edit -->
        <div v-if="userAlias" class="hdr-alias-block">
          <i class="fa-solid fa-user-circle hdr-icon-me"></i>
          <span class="hdr-alias-label">Kamu</span>
          <strong class="hdr-alias-name">{{ userAlias }}</strong>
          <button class="hdr-btn-edit" @click="changeAlias" title="Ubah nama">
            <i class="fa-solid fa-pen-to-square"></i>
          </button>
        </div>

        <!-- Collaborators -->
        <div v-if="collaborators.filter(c => c !== userAlias).length > 0" class="hdr-collab-block">
          <i class="fa-solid fa-users hdr-icon-collab"></i>
          <span class="hdr-collab-label">Bersama</span>
          <div class="hdr-collab-tags">
            <span
              v-for="c in collaborators.filter(c => c !== userAlias)"
              :key="c"
              class="hdr-collab-tag"
            >
              {{ c }}
              <button class="hdr-btn-remove" @click.stop="deleteAlias(c)" title="Hapus alias ini">
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
            <code class="hdr-token" @click="copyToken" title="Klik salin">{{ activeSessionToken }}</code>
            <button class="hdr-btn-copy" @click="copyToken" aria-label="Salin token">
              <i class="fa-regular fa-copy"></i>
            </button>
          </div>
        </template>

        <!-- Local share token -->
        <template v-if="isLocal && activeLocalShareToken">
          <div class="hdr-info-chip">
            <span class="hdr-badge hdr-badge-local">🔑 Token</span>
            <code class="hdr-token" @click="copyLocalToken" title="Klik salin">{{ activeLocalShareToken }}</code>
            <button class="hdr-btn-copy" @click="copyLocalToken" aria-label="Salin token lokal">
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

    <!-- Home Tab -->
    <div v-if="activeTab === 'home'" class="tab-content">
      <!-- Hero Header with Anime Banner -->
      <HeroHeader :user-alias="userAlias" />
      
      <HomeView
        :items="timelineItems"
        @add-moment="showAddModal = true"
        @edit-moment="openEditModal"
        @detail-modal-toggled="(v: boolean) => showDetailModal = v"
        @reorder-photos="handleReorderPhotos"
        @delete-moments="handleDeleteMoments"
      />
    </div>

    <!-- Timeline Tab (placeholder) -->
    <div v-else-if="activeTab === 'timeline'" class="tab-content">
      <TimelineView />
    </div>

    <div v-else-if="activeTab === 'settings'" class="tab-content">
      <SettingsView />
    </div>

    <!-- Global Map (always mounted to listen to events) -->
    <GlobalMapModal :markers="timelineItems" />

    <!-- Bottom Navigation -->
    <BottomNav v-model="activeTab" />

    <!-- Add Moment Modal -->
    <AddMomentModal
      v-if="showAddModal"
      @close="showAddModal = false"
      @moment-added="handleMomentAdded"
    />

    <!-- Edit Moment Modal -->
    <EditMomentModal
      v-if="showEditModal && activeEditMoment"
      :moment="activeEditMoment"
      @close="showEditModal = false"
      @moment-updated="handleMomentUpdated"
    />

    <!-- Speed Dial FAB -->
    <div
      v-show="activeTab === 'home' && !showAddModal && !showEditModal && !showDetailModal"
      class="speed-dial-wrapper"
    >
      <!-- Sub actions (appear when open) -->
      <Transition name="fab-sub">
        <div v-if="isFabOpen" class="speed-dial-actions">
          <!-- Add Moment -->
          <div class="speed-dial-item">
            <span class="speed-dial-label">Tambah Momen</span>
            <button class="speed-dial-btn speed-dial-btn--add" @click="isFabOpen = false; showAddModal = true" aria-label="Tambah Momen">
              <i class="fa-solid fa-plus"></i>
            </button>
          </div>
          <!-- Delete Moments -->
          <div class="speed-dial-item">
            <span class="speed-dial-label">Hapus Momen</span>
            <button class="speed-dial-btn speed-dial-btn--delete" @click="isFabOpen = false; openDeleteMomentModal()" aria-label="Hapus Momen">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>
          <!-- Logout -->
          <div class="speed-dial-item">
            <span class="speed-dial-label">Keluar</span>
            <button class="speed-dial-btn speed-dial-btn--logout" @click="isFabOpen = false; handleLogout()" aria-label="Keluar">
              <i class="fa-solid fa-right-from-bracket"></i>
            </button>
          </div>
        </div>
      </Transition>

      <!-- Backdrop to close -->
      <div v-if="isFabOpen" class="speed-dial-backdrop" @click="isFabOpen = false"></div>

      <!-- Main toggle button -->
      <button
        class="speed-dial-main"
        :class="{ 'is-open': isFabOpen }"
        @click="isFabOpen = !isFabOpen"
        aria-label="Menu Aksi"
      >
        <span class="icon-dots"><i class="fa-solid fa-ellipsis-vertical"></i></span>
        <span class="icon-chevron"><i class="fa-solid fa-chevron-down"></i></span>
      </button>
    </div>

    <!-- Delete Moments Modal (v2 with Year & Month Filter) -->
    <Transition name="fade">
      <div v-if="showDeleteMomentModal" class="del-modal-overlay" @click.self="closeDeleteMomentModal">
        <div class="del-modal-content-v2">
          <!-- Header -->
          <div class="del-modal-header-v2">
            <div class="del-header-left">
              <i class="fa-solid fa-trash-can del-header-icon"></i>
              <div>
                <h3 class="del-modal-title-v2">Hapus Momen</h3>
                <p class="del-modal-subtitle-v2">Tindakan hapus tidak dapat dibatalkan</p>
              </div>
            </div>
            <div class="del-header-actions">
              <button
                class="del-btn-icon del-btn-search"
                :class="{ 'is-searching': showDeleteSearch }"
                aria-label="Cari"
                @click="showDeleteSearch = !showDeleteSearch; if (!showDeleteSearch) deleteSearchQuery = ''"
              >
                <i class="fa-solid fa-magnifying-glass"></i>
              </button>
              <button class="del-btn-icon del-btn-close-v2" @click="closeDeleteMomentModal" aria-label="Tutup">
                <i class="fa-solid fa-xmark"></i>
              </button>
            </div>
          </div>

          <!-- Year Filter (swipeable 3x3 grid, 9 years per page) -->
          <div class="del-year-section">
            <div
              class="del-year-viewport"
              @touchstart.prevent="delYearTouchStart"
              @touchmove.prevent="delYearTouchMove"
              @touchend.prevent="delYearTouchEnd"
            >
              <!-- Direction-aware sliding grid -->
              <Transition :name="`year-slide-${delYearSlideDir}`" mode="out-in">
                <div
                  class="del-year-filter"
                  :key="yearPageIndex"
                  :style="delYearTrackStyle"
                >
                  <button
                    v-for="year in delYearPageYears"
                    :key="year"
                    class="del-year-btn"
                    :class="{ 'is-active': deleteSelectedYear === year }"
                    @click.stop="deleteSelectedYear = year; deleteSelectedMonth = ''"
                  >
                    {{ year }}
                  </button>
                </div>
              </Transition>
            </div>
            <!-- Page indicator dots -->
            <div class="del-year-page-dots">
              <span
                v-for="p in delTotalYearPages"
                :key="p"
                class="del-year-dot"
                :class="{ 'is-active': p - 1 === yearPageIndex }"
                @click="yearPageIndex = p - 1"
              ></span>
            </div>
          </div>

          <!-- Month Pills: ALL 12 months always visible, scrollable -->
          <div class="del-month-filter">
            <button
              class="del-month-pill"
              :class="{ 'is-active': deleteSelectedMonth === '' }"
              @click="deleteSelectedMonth = ''"
            >Semua</button>
            <button
              v-for="month in deleteMomentMonths"
              :key="month"
              class="del-month-pill"
              :class="{
                'is-active': deleteSelectedMonth === month,
                'has-data': monthsWithData.has(month)
              }"
              @click="deleteSelectedMonth = month"
            >{{ month }}</button>
          </div>

          <!-- Search Panel (shown when search toggled) -->
          <Transition name="del-search-slide">
            <div v-if="showDeleteSearch" class="del-search-panel">
              <div class="del-search-input-wrap">
                <i class="fa-solid fa-magnifying-glass del-search-icon"></i>
                <input
                  ref="delSearchInputRef"
                  v-model="deleteSearchQuery"
                  type="text"
                  class="del-search-input"
                  placeholder="Cari judul atau lokasi..."
                  @keydown.esc="showDeleteSearch = false; deleteSearchQuery = ''"
                />
                <button
                  v-if="deleteSearchQuery"
                  class="del-search-clear"
                  @click="deleteSearchQuery = ''"
                >
                  <i class="fa-solid fa-circle-xmark"></i>
                </button>
              </div>
              <p class="del-search-hint">
                Hasil di tahun <strong>{{ deleteSelectedYear }}</strong>
              </p>
            </div>
          </Transition>

          <!-- Moments List -->
          <div class="del-list-v2">
            <label
              v-for="item in deleteFilteredMoments"
              :key="item.id"
              class="del-item-card"
            >
              <input type="checkbox" :value="item.id" v-model="selectedMomentsToDelete" class="del-checkbox" />
              <div class="del-item-dot-v2" :style="{ backgroundColor: item.dotColor }"></div>
              <div class="del-item-details">
                <h4 class="del-item-title-v2">{{ item.title }}</h4>
                <div class="del-item-meta-v2">
                  <span><i class="fa-solid fa-location-dot"></i> {{ item.location || '—' }}</span>
                  <span>·</span>
                  <span><i class="fa-regular fa-calendar"></i> {{ item.date || '—' }}</span>
                </div>
              </div>
            </label>
            <div v-if="deleteFilteredMoments.length === 0" class="del-empty-v2">
              <i class="fa-solid fa-ghost del-empty-ghost-icon"></i>
              <p>Tidak ada momen di bulan ini.</p>
            </div>
          </div>

          <!-- Footer -->
          <div class="del-modal-footer-v2">
            <div class="del-footer-left">
              <label class="del-select-all-v2">
                <input
                  type="checkbox"
                  :checked="selectedMomentsToDelete.length === deleteFilteredMoments.length && deleteFilteredMoments.length > 0"
                  @change="toggleDeleteSelectAllFiltered"
                />
                <span>Pilih Semua</span>
              </label>
            </div>
            <span class="del-count"><span class="del-count-num">{{ selectedMomentsToDelete.length }}</span> terpilih</span>
            <button
              class="del-btn-delete-v2"
              :disabled="selectedMomentsToDelete.length === 0"
              @click="confirmDeleteMoments"
            >
              <i class="fa-solid fa-trash-can"></i>
              HAPUS
            </button>
          </div>
        </div>
      </div>
    </Transition>

  </div>
</template>

<style>
body {
  background-color: var(--bg-color);
  min-height: 100vh;
}

/* Loading */
.loading-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(26, 26, 46, 0.5);
  backdrop-filter: blur(4px);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.loading-card {
  background: #ffffff;
  border: 3px solid #101010;
  box-shadow: 6px 6px 0px #101010;
  padding: 28px 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  text-align: center;
}

.loading-card p {
  font-family: 'Inter', sans-serif;
  font-weight: 700;
  color: #101010;
  margin: 0;
  font-size: 0.95rem;
}

.spinner-icon {
  font-size: 2rem;
  color: #6366f1;
}

/* Fade transition */
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* Session Bar */
.session-bar {
  display: flex;
  flex-direction: column;
  padding: 12px 16px;
  background: #ffffff;
  border-bottom: 2px solid #101010;
  box-shadow: 0 2px 0 #101010;
  margin-bottom: 20px;
  gap: 8px;
}
.session-bar-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
}

.session-device-row {
  display: flex;
  align-items: center;
  gap: 6px;
  font-family: 'Inter', sans-serif;
  font-size: 0.8rem;
  color: #4b5563;
  padding-top: 6px;
  border-top: 1px dashed #cbd5e1;
}

.session-device-row strong {
  color: #0f172a;
  font-weight: 700;
}

/* ── Local share token row ────────────────────────────────────── */
.session-token-row {
  display: flex;
  align-items: center;
  gap: 7px;
  font-family: 'Inter', sans-serif;
  font-size: 0.8rem;
  color: #374151;
  padding-top: 6px;
  border-top: 1px dashed #cbd5e1;
  flex-wrap: wrap;
}

.session-token-row i { color: #6b9bd6; flex-shrink: 0; }

.local-share-token {
  font-family: monospace;
  font-size: 0.88rem;
  font-weight: 800;
  background: #e0f2fe;
  color: #0369a1;
  padding: 3px 9px;
  border: 1.5px solid #7dd3fc;
  letter-spacing: 0.5px;
  cursor: pointer;
  transition: background 0.15s;
}
.local-share-token:hover { background: #bae6fd; }

/* ── Alias Row ───────────────────────────────────────────────── */
.session-alias-row {
  display: flex;
  align-items: center;
  gap: 7px;
  font-family: 'Inter', sans-serif;
  font-size: 0.8rem;
  color: #374151;
  padding-top: 6px;
  border-top: 1px dashed #cbd5e1;
  flex-wrap: wrap;
}

.session-alias-row i { color: #7c6fd6; flex-shrink: 0; }

.alias-name {
  font-family: monospace;
  font-size: 0.88rem;
  font-weight: 800;
  color: #1e1b4b;
  background: #ede9fe;
  border: 1.5px solid #a5b4fc;
  padding: 2px 8px;
  letter-spacing: 0.4px;
}

.btn-edit-alias {
  color: #7c6fd6;
  font-size: 0.75rem;
  padding: 2px 6px;
  transition: color 0.15s;
}
.btn-edit-alias:hover { color: #4f46e5; }

/* ── Collaborators Row ───────────────────────────────────────── */
.session-collab-row {
  display: flex;
  align-items: center;
  gap: 7px;
  font-family: 'Inter', sans-serif;
  font-size: 0.8rem;
  color: #374151;
  padding-top: 6px;
  border-top: 1px dashed #cbd5e1;
  flex-wrap: wrap;
}

.session-collab-row i { color: #10b981; flex-shrink: 0; }

.collab-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.collab-tag {
  font-family: monospace;
  font-size: 0.82rem;
  font-weight: 700;
  background: #d1fae5;
  color: #065f46;
  border: 1.5px solid #6ee7b7;
  padding: 2px 8px;
  border-radius: 0;
}

.session-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.badge {
  display: inline-block;
  padding: 3px 8px;
  border: 2px solid #101010;
  font-family: 'Inter', sans-serif;
  font-size: 0.75rem;
  font-weight: 800;
}

.cloud-badge { background-color: #dbeafe; color: #1e3a8a; }
.local-badge { background-color: #d1fae5; color: #064e3b; }

.session-token {
  font-family: monospace;
  font-size: 0.9rem;
  font-weight: 700;
  background: #f1f5f9;
  padding: 3px 8px;
  border: 1px solid #cbd5e1;
  cursor: pointer;
  color: #0f172a;
}
.session-token:hover { background: #e2e8f0; }

.session-username {
  font-family: 'Inter', sans-serif;
  font-size: 0.9rem;
  font-weight: 700;
  color: #101010;
}

.session-name {
  font-family: 'Inter', sans-serif;
  font-size: 0.85rem;
  font-weight: 600;
  color: #475569;
}

.btn-icon {
  background: none;
  border: none;
  cursor: pointer;
  color: #64748b;
  font-size: 0.95rem;
  padding: 2px;
}
.btn-icon:hover { color: #6366f1; }

.btn-logout {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #fecdd3;
  color: #9f1239;
  border: 2px solid #101010;
  padding: 5px 12px;
  font-family: 'Inter', sans-serif;
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 2px 2px 0 #101010;
  transition: all 0.1s ease;
}
.btn-logout:hover { transform: translate(-1px, -1px); box-shadow: 3px 3px 0 #101010; }
.btn-logout:active { transform: translate(1px, 1px); box-shadow: 1px 1px 0 #101010; }


/* ── Layout with bottom nav ──────────────────────────────────── */
.timeline-active-view {
  display: flex;
  flex-direction: column;
  height: 100dvh;
  overflow: hidden;
  padding-top: 0;
}

.tab-content {
  width: 100%;
  flex: 1;
  overflow: hidden; /* Each view manages its own scroll internally */
  display: flex;
  flex-direction: column;
}

/* ── Timeline placeholder ────────────────────────────────────── */
.tab-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 200px);
}

.placeholder-inner {
  text-align: center;
  padding: 40px 24px;
}

.placeholder-icon {
  font-size: 3rem;
  margin-bottom: 16px;
}

.placeholder-inner h3 {
  font-family: 'Outfit', 'Space Grotesk', sans-serif;
  font-size: 1.3rem;
  font-weight: 800;
  color: #101010;
  margin: 0 0 10px;
}

.placeholder-inner p {
  font-family: 'Inter', sans-serif;
  font-size: 0.9rem;
  color: #9ca3af;
  margin: 0;
  line-height: 1.6;
}

/* ══════════════════════════════════════════
   SESSION HEADER
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
  margin-bottom: 16px; /* Gap between token section and Galeri section */
  flex-shrink: 0; /* Never shrink; always reserve its full height */
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

/* Decorative accent bar */
.hdr-section-main::after {
  display: none;
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
  gap: 7px;
  flex-wrap: wrap;
}

.hdr-icon-me {
  color: #101010;
  font-size: 0.95rem;
  flex-shrink: 0;
}

.hdr-alias-label {
  font-family: 'Inter', sans-serif;
  font-size: 0.85rem;
  color: #101010;
  font-weight: 700;
  letter-spacing: 0.3px;
}

.hdr-alias-name {
  font-family: 'Outfit', monospace;
  font-size: 1rem;
  font-weight: 800;
  color: #101010;
  background: #ffffff;
  border: 2px solid #101010;
  box-shadow: 2px 2px 0 #101010;
  padding: 2px 10px;
  letter-spacing: 0.3px;
}

.hdr-btn-edit {
  background: none;
  border: none;
  cursor: pointer;
  color: #101010;
  font-size: 0.8rem;
  padding: 2px 5px;
  transition: transform 0.15s;
  line-height: 1;
}
.hdr-btn-edit:hover { transform: scale(1.2) rotate(-5deg); }

/* Collaborators row */
.hdr-collab-block {
  display: flex;
  align-items: center;
  gap: 7px;
  flex-wrap: wrap;
}

.hdr-icon-collab {
  color: #101010;
  font-size: 0.9rem;
  flex-shrink: 0;
}

.hdr-collab-label {
  font-family: 'Inter', sans-serif;
  font-size: 0.85rem;
  color: #101010;
  font-weight: 700;
  letter-spacing: 0.3px;
}

.hdr-collab-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.hdr-collab-tag {
  font-family: 'Outfit', monospace;
  font-size: 0.8rem;
  font-weight: 800;
  background: #ffffff;
  color: #101010;
  border: 2px solid #101010;
  box-shadow: 2px 2px 0 #101010;
  padding: 1px 9px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.hdr-btn-remove {
  background: none;
  border: none;
  color: #ef4444;
  cursor: pointer;
  padding: 0;
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.1s ease;
}

.hdr-btn-remove:hover {
  transform: scale(1.2);
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
  flex-wrap: wrap;
  gap: 6px;
  padding: 7px 40px 8px;
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
}

.hdr-info-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-family: 'Inter', sans-serif;
  font-size: 0.75rem;
  color: #64748b;
  background: #fff;
  border: 1.5px solid #e2e8f0;
  padding: 3px 9px;
  border-radius: 0;
}

.hdr-info-device {
  color: #94a3b8;
  font-style: italic;
}
.hdr-info-device i { font-size: 0.7rem; }

.hdr-badge {
  font-family: 'Inter', sans-serif;
  font-size: 0.68rem;
  font-weight: 800;
  padding: 1px 6px;
  letter-spacing: 0.3px;
  line-height: 1.5;
  border: 1.5px solid currentColor;
}

.hdr-badge-cloud { color: #1e3a8a; background: #dbeafe; border-color: #93c5fd; }
.hdr-badge-local { color: #064e3b; background: #d1fae5; border-color: #6ee7b7; }

.hdr-token {
  font-family: monospace;
  font-size: 0.75rem;
  font-weight: 700;
  color: #334155;
  letter-spacing: 0.4px;
  cursor: pointer;
  transition: color 0.15s;
}
.hdr-token:hover { color: #4f46e5; }

.hdr-btn-copy {
  background: none;
  border: none;
  cursor: pointer;
  color: #94a3b8;
  font-size: 0.75rem;
  padding: 0 2px;
  transition: color 0.15s;
}
.hdr-btn-copy:hover { color: #6366f1; }

/* ══════════════════════════════════════════
   SPEED DIAL FAB
══════════════════════════════════════════ */
.speed-dial-wrapper {
  position: fixed;
  bottom: 84px;   /* just above bottom nav (68px + 16px gap) */
  right: 20px;
  z-index: 900;
  display: flex;
  flex-direction: column;
  align-items: flex-end; /* Align right to prevent center shift */
}

/* Transparent backdrop to dismiss on tap-outside */
.speed-dial-backdrop {
  position: fixed;
  inset: 0;
  z-index: -1;
}

/* Main toggle button – pill shape like ">;" */
.speed-dial-main {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: #ffffff;
  border: 1.5px solid #e5e7eb;
  box-shadow: 0 4px 16px rgba(0,0,0,0.12);
  color: #374151;
  font-size: 1.35rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  outline: none;
  -webkit-tap-highlight-color: transparent;
  position: relative;
  overflow: hidden;
  transition: background 0.2s ease, box-shadow 0.2s ease;
  z-index: 2;
}

/* Pressing the button: no translate (keep position fixed), just a subtle bg pulse */
.speed-dial-main:active { background: #e5e7eb; }

.speed-dial-main.is-open {
  background: #f9fafb;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

/* Both icon wrappers overlap perfectly in center of button */
.speed-dial-main .icon-dots,
.speed-dial-main .icon-chevron {
  position: absolute !important;
  top: 50% !important;
  left: 50% !important;
  display: flex !important;
  align-items: center;
  justify-content: center;
  font-size: 1.15rem;
  line-height: 1;
  pointer-events: none;
  transition:
    opacity 0.35s ease,
    transform 0.45s cubic-bezier(0.4, 0, 0.2, 1);
  will-change: transform, opacity;
}

/* ── DOTS: start visible at 0°, spin CCW to -180° when menu opens */
.speed-dial-main .icon-dots {
  opacity: 1;
  transform: translate(-50%, -50%) rotate(0deg);
}
.speed-dial-main.is-open .icon-dots {
  opacity: 0;
  transform: translate(-50%, -50%) rotate(-180deg);
}

/* ── CHEVRON: start hidden at +180°, spin CCW to 0° when menu opens */
.speed-dial-main .icon-chevron {
  opacity: 0;
  transform: translate(-50%, -50%) rotate(180deg);
}
.speed-dial-main.is-open .icon-chevron {
  opacity: 1;
  transform: translate(-50%, -50%) rotate(0deg);
}

/* Sub-actions column */
.speed-dial-actions {
  position: absolute;
  bottom: 100%; /* Anchor to top of main button */
  right: 6px; /* Center 44px buttons above 56px main button (56-44)/2 = 6 */
  display: flex;
  flex-direction: column-reverse;  /* top item = farthest from button */
  align-items: flex-end;
  gap: 10px;
  padding-bottom: 12px;
  width: max-content;
}

/* Each action row: label + button */
.speed-dial-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.speed-dial-label {
  background: rgba(255,255,255,0.95);
  color: #374151;
  font-family: 'Inter', sans-serif;
  font-size: 0.78rem;
  font-weight: 600;
  padding: 5px 10px;
  border-radius: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  white-space: nowrap;
  pointer-events: none;
}

/* Individual action buttons */
.speed-dial-btn {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  cursor: pointer;
  box-shadow: 0 3px 10px rgba(0,0,0,0.15);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  outline: none;
  -webkit-tap-highlight-color: transparent;
}

.speed-dial-btn:active { transform: scale(0.9); box-shadow: 0 1px 4px rgba(0,0,0,0.1); }

.speed-dial-btn--add    { background: #6b9bd6; color: #fff; }
.speed-dial-btn--delete { background: #f87171; color: #fff; }
.speed-dial-btn--logout { background: #ffffff; color: #6b7280; border: 1.5px solid #e5e7eb; }

/* FAB sub-action enter/leave animation */
.fab-sub-enter-active {
  animation: fabSubIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
}
.fab-sub-leave-active {
  animation: fabSubOut 0.2s ease forwards;
}
@keyframes fabSubIn {
  from { opacity: 0; transform: translateY(20px) scale(0.8); }
  to   { opacity: 1; transform: translateY(0)    scale(1);   }
}
@keyframes fabSubOut {
  from { opacity: 1; transform: translateY(0)    scale(1);   }
  to   { opacity: 0; transform: translateY(12px) scale(0.85); }
}


/* ══════════════════════════════════════════
   DELETE MODAL
══════════════════════════════════════════ */
.del-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 9999;
}

.del-modal-content {
  background: #fff;
  width: 100%;
  max-width: 500px;
  border-radius: 20px 20px 0 0;
  border: 2.5px solid #101010;
  border-bottom: none;
  display: flex;
  flex-direction: column;
  max-height: 85vh;
  overflow: hidden;
  box-shadow: 0 -4px 24px rgba(0,0,0,0.18);
}

.del-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 20px 12px;
  border-bottom: 2px solid #f1f5f9;
  flex-shrink: 0;
}

.del-modal-title {
  font-family: 'Outfit', sans-serif;
  font-size: 1.1rem;
  font-weight: 800;
  color: #ef4444;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.del-modal-close {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  color: #6b7280;
  padding: 4px 8px;
  border-radius: 6px;
  transition: background 0.15s;
}
.del-modal-close:hover { background: #f3f4f6; }

.del-modal-subtitle {
  font-size: 0.82rem;
  color: #6b7280;
  padding: 8px 20px 0;
  margin: 0;
  flex-shrink: 0;
}

.del-select-all {
  padding: 10px 20px 6px;
  border-bottom: 1.5px solid #f1f5f9;
  flex-shrink: 0;
}

.del-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px 20px;
}

.del-checkbox-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.12s;
  user-select: none;
}
.del-checkbox-row:hover { background: #fef2f2; }
.del-checkbox-row.is-selected { background: #fee2e2; }
.del-checkbox-row--all { font-weight: 700; font-size: 0.88rem; color: #374151; }

.del-checkbox-row input[type="checkbox"] {
  width: 18px;
  height: 18px;
  accent-color: #ef4444;
  flex-shrink: 0;
  cursor: pointer;
}

.del-item-info {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 0;
}

.del-item-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.del-item-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.del-item-title {
  font-weight: 700;
  font-size: 0.88rem;
  color: #1f2937;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.del-item-meta {
  font-size: 0.72rem;
  color: #9ca3af;
  font-weight: 500;
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.del-empty {
  text-align: center;
  color: #9ca3af;
  font-size: 0.88rem;
  padding: 24px 0;
}

.del-modal-footer {
  display: flex;
  gap: 10px;
  padding: 14px 20px;
  border-top: 2px solid #f1f5f9;
  flex-shrink: 0;
}

.del-btn-cancel {
  flex: 1;
  padding: 10px;
  background: #f3f4f6;
  color: #374151;
  font-weight: 700;
  font-family: 'Inter', sans-serif;
  font-size: 0.88rem;
  border: 2px solid #101010;
  border-radius: 0;
  cursor: pointer;
  box-shadow: 2px 2px 0 #101010;
  transition: transform 0.1s;
}
.del-btn-cancel:hover { transform: translate(-1px,-1px); }

.del-btn-confirm {
  flex: 1.5;
  padding: 10px;
  background: #ef4444;
  color: #fff;
  font-weight: 700;
  font-family: 'Inter', sans-serif;
  font-size: 0.88rem;
  border: 2px solid #101010;
  border-radius: 0;
  cursor: pointer;
  box-shadow: 2px 2px 0 #101010;
  transition: transform 0.1s, opacity 0.15s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}
.del-btn-confirm:hover:not(:disabled) { transform: translate(-1px,-1px); }
.del-btn-confirm:disabled { opacity: 0.4; cursor: not-allowed; }

/* ══════════════════════════════════════════
   DELETE MODAL V2 (with Year & Month Filters)
══════════════════════════════════════════ */
.del-modal-content-v2 {
  background: #fdfdfd;
  width: 100%;
  max-width: 520px;
  border-radius: 0;
  display: flex;
  flex-direction: column;
  height: 100vh; /* Full screen as per design */
  overflow: hidden;
}

.del-modal-header-v2 {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 18px;
  border-bottom: 2.5px solid #101010;
  flex-shrink: 0;
  gap: 12px;
}

.del-header-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.del-header-icon {
  font-size: 1.6rem;
  color: #ef4444;
  flex-shrink: 0;
}

.del-modal-title-v2 {
  font-family: 'Outfit', sans-serif;
  font-size: 1.2rem;
  font-weight: 900;
  color: #101010;
  margin: 0;
  line-height: 1.2;
}

.del-modal-subtitle-v2 {
  font-size: 0.75rem;
  color: #64748b;
  margin: 2px 0 0;
  line-height: 1.3;
}

.del-header-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.del-btn-icon {
  background: #fff;
  border: 2px solid #101010;
  font-size: 1rem;
  color: #101010;
  cursor: pointer;
  width: 32px;
  height: 32px;
  border-radius: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 2px 2px 0 #101010;
  transition: transform 0.1s, box-shadow 0.1s;
}
.del-btn-icon:active { 
  transform: translate(2px, 2px);
  box-shadow: 0 0 0 #101010;
}

/* Year Section wrapper */
.del-year-section {
  flex-shrink: 0;
  border-bottom: 1.5px solid #f1f5f9;
  user-select: none;
}

/* Viewport clips the sliding track — height fixed so nothing below shifts */
.del-year-viewport {
  overflow: hidden;
  /* 3 rows × ~40px + padding */
  height: 144px;
  position: relative;
}

/* The track slides left/right during drag */
.del-year-track {
  width: 100%;
  height: 100%;
  will-change: transform;
}

/* Year Filter Buttons (Grid 3 cols) */
.del-year-filter {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 4px;
  padding: 20px 28px 8px;
}

.del-year-btn {
  padding: 10px 4px;
  background: transparent;
  border: none;
  font-family: 'Inter', sans-serif;
  font-weight: 700;
  font-size: 1rem;
  color: #9ca3af;
  cursor: pointer;
  text-align: center;
  transition: color 0.15s;
}
.del-year-btn:hover { color: #6b7280; }
.del-year-btn.is-active {
  color: #ef4444;
  font-size: 1.1rem;
}

/* Page indicator dots */
.del-year-page-dots {
  display: flex;
  justify-content: center;
  gap: 6px;
  padding: 6px 0 10px;
}
.del-year-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #e4e4e7;
  cursor: pointer;
  transition: background 0.15s, transform 0.15s;
}
.del-year-dot.is-active {
  background: #ef4444;
  transform: scale(1.3);
}

/* Month Pills Filter */
.del-month-filter {
  display: flex;
  gap: 8px;
  padding: 12px 18px 14px;
  overflow-x: auto;
  flex-shrink: 0;
  scrollbar-width: none;
  border-bottom: 1.5px solid #f1f5f9;
}
.del-month-filter::-webkit-scrollbar { display: none; }

.del-month-pill {
  padding: 6px 16px;
  background: #f4f4f5;
  border: none;
  border-radius: 20px;
  font-family: 'Inter', sans-serif;
  font-weight: 600;
  font-size: 0.85rem;
  color: #52525b;
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
  transition: all 0.15s;
}
.del-month-pill:hover { background: #e4e4e7; }
.del-month-pill.is-active {
  background: #101010;
  color: #fff;
}
/* Month with data gets a subtle accent border */
.del-month-pill.has-data:not(.is-active) {
  color: #101010;
  font-weight: 700;
  background: #fff;
  border: 1.5px solid #d1d5db;
}

/* ── Year grid slide transition (direction-aware) ── */
/* Slide LEFT (going to later years: swipe right) */
.year-slide-left-enter-active,
.year-slide-left-leave-active,
.year-slide-right-enter-active,
.year-slide-right-leave-active {
  transition: opacity 0.28s cubic-bezier(0.25,1,0.5,1),
              transform 0.28s cubic-bezier(0.25,1,0.5,1);
  position: absolute;
  width: 100%;
}
.year-slide-left-enter-from  { opacity: 0; transform: translateX(60%); }
.year-slide-left-leave-to    { opacity: 0; transform: translateX(-60%); }
.year-slide-right-enter-from { opacity: 0; transform: translateX(-60%); }
.year-slide-right-leave-to   { opacity: 0; transform: translateX(60%); }


/* Search Panel */
.del-search-panel {
  padding: 12px 18px 8px;
  border-bottom: 1.5px solid #f1f5f9;
  flex-shrink: 0;
}

.del-search-input-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #fff;
  border: 1.5px solid #e5e7eb;
  border-radius: 12px;
  padding: 10px 14px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.del-search-icon {
  color: #9ca3af;
  font-size: 0.9rem;
  flex-shrink: 0;
}

.del-search-input {
  flex: 1;
  border: none;
  outline: none;
  font-family: 'Inter', sans-serif;
  font-size: 0.92rem;
  color: #111827;
  background: transparent;
}
.del-search-input::placeholder { color: #9ca3af; }

.del-search-clear {
  background: none;
  border: none;
  color: #9ca3af;
  cursor: pointer;
  font-size: 1rem;
  padding: 0;
  display: flex;
  align-items: center;
  transition: color 0.15s;
}
.del-search-clear:hover { color: #ef4444; }

.del-search-hint {
  font-size: 0.75rem;
  color: #9ca3af;
  margin: 6px 0 0 2px;
}
.del-search-hint strong { color: #374151; }

/* Search button active state */
.del-btn-search.is-searching {
  background: #101010;
  color: #fff;
  box-shadow: none;
}

/* Search panel slide transition */
.del-search-slide-enter-active { transition: max-height 0.28s cubic-bezier(0.25,1,0.5,1), opacity 0.22s ease; }
.del-search-slide-leave-active { transition: max-height 0.22s ease, opacity 0.18s ease; }
.del-search-slide-enter-from,
.del-search-slide-leave-to    { max-height: 0; opacity: 0; overflow: hidden; }
.del-search-slide-enter-to,
.del-search-slide-leave-from  { max-height: 120px; opacity: 1; }

/* Moments List v2 */

.del-list-v2 {
  flex: 1;
  overflow-y: auto;
  padding: 0 18px 12px;
}

.del-item-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  background: transparent;
  border: none;
  cursor: pointer;
  user-select: none;
}

.del-item-card .del-checkbox {
  width: 18px;
  height: 18px;
  accent-color: #101010;
  flex-shrink: 0;
  cursor: pointer;
  margin: 0 6px 0 0;
}

.del-item-dot-v2 {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  flex-shrink: 0;
  border: 2px solid #101010;
}

.del-item-details {
  flex: 1;
  min-width: 0;
}

.del-item-title-v2 {
  font-family: 'Outfit', sans-serif;
  font-weight: 700;
  font-size: 0.92rem;
  color: #1f2937;
  margin: 0 0 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.del-item-meta-v2 {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.72rem;
  color: #9ca3af;
  font-weight: 500;
}

.del-item-meta-v2 i {
  font-size: 0.7rem;
  opacity: 0.8;
}

.del-empty-v2 {
  text-align: center;
  color: #9ca3af;
  padding: 60px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.del-empty-ghost-icon {
  font-size: 3.5rem;
  color: #d1d5db;
  display: block;
  animation: ghost-float 2.8s ease-in-out infinite;
}

@keyframes ghost-float {
  0%, 100% { transform: translateY(0px); }
  50%       { transform: translateY(-8px); }
}

.del-empty-v2 p {
  font-size: 0.9rem;
  margin: 0;
  color: #6b7280;
  font-weight: 500;
}

/* Footer v2 */
.del-modal-footer-v2 {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-top: 2.5px solid #101010;
  background: #fdfdfd;
  flex-shrink: 0;
}

.del-footer-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.del-select-all-v2 {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-family: 'Inter', sans-serif;
  font-size: 0.88rem;
  font-weight: 700;
  color: #101010;
  user-select: none;
}

.del-select-all-v2 input[type="checkbox"] {
  width: 18px;
  height: 18px;
  accent-color: #101010;
  margin: 0;
  cursor: pointer;
}

.del-count {
  font-family: 'Inter', sans-serif;
  font-size: 0.85rem;
  font-weight: 500;
  color: #52525b;
}

.del-count-num {
  color: #ef4444;
  font-weight: 800;
}

.del-btn-delete-v2 {
  background: #fca5a5;
  color: #101010;
  border: 2px solid #101010;
  padding: 10px 20px;
  border-radius: 0;
  font-family: 'Outfit', sans-serif;
  font-weight: 800;
  font-size: 0.95rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  box-shadow: 3px 3px 0 #101010;
  transition: transform 0.1s, box-shadow 0.1s;
  flex-shrink: 0;
}
.del-btn-delete-v2:hover:not(:disabled) {
  background: #f87171;
}
.del-btn-delete-v2:active:not(:disabled) {
  transform: translate(2px, 2px);
  box-shadow: 1px 1px 0 #101010;
}
.del-btn-delete-v2:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  box-shadow: none;
  transform: translate(3px, 3px);
}

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
  .hdr-animations { display: none; } /* Hide on very small screens to prevent overlap */
}
</style>
