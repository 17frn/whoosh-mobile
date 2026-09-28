<template>
  <Transition name="modal-fade">
    <div class="modal-overlay" @click.self="$emit('close')" role="dialog" aria-modal="true" aria-label="Tambah Momen">
      <div class="modal-box">

        <!-- Handle bar -->
        <div class="handle-bar"></div>

        <div class="modal-header">
          <h2>✏️ Edit Momen</h2>
          <button class="close-btn" @click="$emit('close')" aria-label="Tutup">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <form @submit.prevent="handleSubmit" class="modal-form">

          <!-- Judul -->
          <div class="form-group">
            <label for="mom-title">Judul Perjalanan <span class="required">*</span></label>
            <input
              id="mom-title"
              v-model="form.title"
              type="text"
              placeholder="Mis: Liburan ke Bali 🏖️"
              required
              autocomplete="off"
            />
          </div>

          <!-- Lokasi -->
          <div class="form-group">
            <label for="mom-location">Lokasi</label>
            <input
              id="mom-location"
              v-model="form.location"
              type="text"
              placeholder="Mis: Bali, Indonesia"
              autocomplete="off"
            />
          </div>

          <!-- Tanggal & Tahun -->
          <div class="form-row">
            <div class="form-group">
              <label for="mom-date">Tanggal</label>
              <input
                id="mom-date"
                v-model="form.date"
                type="text"
                placeholder="Mis: 15 Januari 2025"
              />
            </div>
            <div class="form-group">
              <label for="mom-year">Tahun <span class="required">*</span></label>
              <input
                id="mom-year"
                v-model.number="form.year"
                type="number"
                :min="2000"
                :max="2100"
                required
              />
            </div>
          </div>

          <!-- Warna Dot -->
          <div class="form-group">
            <label>Warna Penanda</label>
            <div class="color-picker-row">
              <button
                v-for="color in dotColors"
                :key="color"
                type="button"
                class="color-dot"
                :class="{ selected: form.dotColor === color }"
                :style="{ backgroundColor: color }"
                @click="form.dotColor = color"
                :aria-label="`Pilih warna ${color}`"
              ></button>
            </div>
          </div>

          <!-- Map Embed URL -->
          <div class="form-group">
            <label for="mom-map">Embed URL Peta <span class="label-hint">(opsional)</span></label>
            <div class="map-embed-hint">
              <i class="fa-solid fa-circle-info"></i>
              Buka Google Maps → Bagikan → Sematkan peta → salin URL dari <code>src="..."</code>
            </div>
            <textarea
              id="mom-map"
              v-model="form.mapEmbedUrl"
              rows="2"
              placeholder="https://www.google.com/maps/embed?pb=..."
              autocomplete="off"
              spellcheck="false"
            ></textarea>
          </div>

          <!-- Upload Foto Tambahan -->
          <div class="form-group">
            <label>Tambah Foto <span class="label-hint">(opsional, bisa pilih banyak)</span></label>
            <div class="file-upload-wrapper">
              <input type="file" id="mom-photo-edit" accept="image/*" multiple @change="handleFileChange" class="file-input" />
              <label for="mom-photo-edit" class="file-label">
                <i class="fa-solid fa-cloud-arrow-up"></i>
                <span>{{ selectedFileCount > 0 ? `${selectedFileCount} foto dipilih` : 'Pilih Foto Baru...' }}</span>
              </label>
            </div>
          </div>

          <!-- Error -->
          <div v-if="error" class="form-error">
            <i class="fa-solid fa-triangle-exclamation"></i> {{ error }}
          </div>

          <!-- Actions -->
          <div class="form-actions">
            <button type="button" class="btn-cancel" @click="$emit('close')">Batal</button>
            <div class="btn-wrapper">
              <div class="btn-shadow"></div>
              <button type="submit" class="btn-submit" :disabled="loading" id="btn-save-moment">
                <i v-if="loading" class="fa-solid fa-spinner fa-spin"></i>
                <i v-else class="fa-solid fa-floppy-disk"></i>
                {{ loading ? 'Menyimpan...' : 'Simpan Perubahan' }}
              </button>
            </div>
          </div>

        </form>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import type { TimelineData } from '../../data/timeline';
import { compressImage, saveLocalImage } from '../../data/imageStore';

const props = defineProps<{
  moment: TimelineData;
}>();

const emit = defineEmits<{
  close: [];
  'moment-updated': [data: {
    id: string;
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
  }];
}>();

const dotColors = [
  '#6f6bd8', // indigo
  '#e66a5c', // red-coral
  '#f97316', // orange
  '#10b981', // emerald
  '#f6b93b', // yellow
  '#ec4899', // pink
];

const form = ref({
  id: '',
  title: '',
  location: '',
  date: '',
  year: new Date().getFullYear(),
  dotColor: '#6f6bd8',
  rtl: false,
  mapEmbedUrl: '',
});

const loading = ref(false);
const error = ref('');

const selectedFiles = ref<File[]>([]);
const selectedFileCount = computed(() => selectedFiles.value.length);

function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    selectedFiles.value = Array.from(target.files);
  } else {
    selectedFiles.value = [];
  }
}


onMounted(() => {
  if (props.moment) {
    form.value = {
      id: props.moment.id,
      title: props.moment.title,
      location: props.moment.location,
      date: props.moment.date,
      year: props.moment.year,
      dotColor: props.moment.dotColor,
      rtl: props.moment.rtl,
      mapEmbedUrl: props.moment.mapEmbedUrl || '',
    };
  }
});

async function handleSubmit() {
  error.value = '';
  if (!form.value.title.trim()) {
    error.value = 'Judul perjalanan tidak boleh kosong.';
    return;
  }
  loading.value = true;
  try {
    // Process all selected photos
    const photos: Array<{ image: string; localImageId: string }> = [];
    for (const file of selectedFiles.value) {
      const { highRes, lowRes } = await compressImage(file);
      const localImageId = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await saveLocalImage(localImageId, highRes);
      photos.push({ image: lowRes, localImageId });
    }
    const initialPhoto = photos.length > 0 ? photos[0] : undefined;
    const additionalPhotos = photos.slice(1);

    let cleanMapUrl = form.value.mapEmbedUrl.trim();
    if (cleanMapUrl.toLowerCase().startsWith('<iframe') && cleanMapUrl.includes('src="')) {
      const match = cleanMapUrl.match(/src="([^"]+)"/);
      if (match) {
        cleanMapUrl = match[1];
      }
    }

    let latitude: number | undefined;
    let longitude: number | undefined;

    if (cleanMapUrl) {
      const pbMatch = cleanMapUrl.match(/pb=/);
      if (pbMatch) {
        const latMatch = cleanMapUrl.match(/!3d(-?\d+(\.\d+)?)/);
        const lngMatch = cleanMapUrl.match(/![24]d(-?\d+(\.\d+)?)/);
        if (latMatch) latitude = parseFloat(latMatch[1]);
        if (lngMatch) longitude = parseFloat(lngMatch[1]);
      }
      if (latitude === undefined || longitude === undefined) {
        const atMatch = cleanMapUrl.match(/@(-?\d+(\.\d+)?),(-?\d+(\.\d+)?)/);
        if (atMatch) {
          latitude = parseFloat(atMatch[1]);
          longitude = parseFloat(atMatch[3]);
        }
      }
      if (latitude === undefined || longitude === undefined) {
        const qMatch = cleanMapUrl.match(/q=(-?\d+(\.\d+)?),(-?\d+(\.\d+)?)/);
        if (qMatch) {
          latitude = parseFloat(qMatch[1]);
          longitude = parseFloat(qMatch[3]);
        }
      }
    }

    if (latitude === undefined || longitude === undefined) {
      const { findProvinceCoordinates } = await import('../../data/indonesiaLocations');
      const fallback = findProvinceCoordinates(form.value.location) || findProvinceCoordinates(form.value.title);
      if (fallback) {
        latitude = fallback.lat;
        longitude = fallback.lng;
      }
    }

    emit('moment-updated', { 
      ...form.value, 
      title: form.value.title.trim(),
      mapEmbedUrl: cleanMapUrl,
      latitude,
      longitude,
      initialPhoto,
      additionalPhotos
    });
    
  } catch (err: any) {
    console.error('Error updating moment:', err);
    error.value = 'Terjadi kesalahan saat menyimpan data.';
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.55);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  z-index: 900;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.modal-box {
  background: #fafafa;
  border: 3px solid #101010;
  border-bottom: none;
  border-radius: 24px 24px 0 0;
  width: 100%;
  max-width: 540px;
  box-shadow: 0 -5px 0 #101010;
  padding: 12px 24px 40px;
  max-height: 92vh;
  overflow-y: auto;
  scrollbar-width: none;
}

.modal-box::-webkit-scrollbar { display: none; }

.handle-bar {
  width: 40px;
  height: 4px;
  background: #d1d5db;
  border-radius: 99px;
  margin: 0 auto 18px;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 22px;
}

.modal-header h2 {
  font-family: 'Outfit', 'Space Grotesk', sans-serif;
  font-size: 1.35rem;
  font-weight: 900;
  color: #101010;
  margin: 0;
}

.close-btn {
  background: none;
  border: 2px solid #e5e7eb;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.95rem;
  color: #6b7280;
  transition: all 0.15s;
}
.close-btn:hover { background: #fef2f2; border-color: #f43f5e; color: #f43f5e; }

.modal-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-row {
  display: grid;
  grid-template-columns: 1.6fr 1fr;
  gap: 12px;
}

label {
  font-family: 'Inter', sans-serif;
  font-size: 0.72rem;
  font-weight: 700;
  color: #374151;
  text-transform: uppercase;
  letter-spacing: 0.6px;
}

.required { color: #ef4444; }

.label-hint {
  font-size: 0.68rem;
  color: #9ca3af;
  font-weight: 500;
  text-transform: none;
  letter-spacing: 0;
}

.map-embed-hint {
  display: flex;
  align-items: flex-start;
  gap: 7px;
  background: #f0f7ff;
  border: 1px solid #bfdbfe;
  padding: 8px 10px;
  font-family: 'Inter', sans-serif;
  font-size: 0.72rem;
  color: #1e40af;
  line-height: 1.4;
  margin-bottom: 4px;
}
.map-embed-hint i { margin-top: 1px; flex-shrink: 0; }
.map-embed-hint code {
  background: rgba(0,0,0,0.08);
  padding: 0 4px;
  border-radius: 3px;
  font-size: 0.7rem;
}

textarea {
  font-family: 'Inter', monospace;
  font-size: 0.78rem;
  padding: 10px 14px;
  border: 2px solid #101010;
  border-radius: 0;
  background: #ffffff;
  color: #374151;
  outline: none;
  transition: box-shadow 0.15s, border-color 0.15s;
  box-shadow: 3px 3px 0 #101010;
  width: 100%;
  box-sizing: border-box;
  resize: vertical;
  line-height: 1.5;
}
textarea:focus {
  border-color: #6f6bd8;
  box-shadow: 4px 4px 0 #6f6bd8;
}


input {
  font-family: 'Inter', sans-serif;
  font-size: 0.95rem;
  padding: 11px 14px;
  border: 2px solid #101010;
  border-radius: 0;
  background: #ffffff;
  color: #101010;
  outline: none;
  transition: box-shadow 0.15s, border-color 0.15s;
  box-shadow: 3px 3px 0 #101010;
  width: 100%;
  box-sizing: border-box;
}

input:focus {
  border-color: #6f6bd8;
  box-shadow: 4px 4px 0 #6f6bd8;
}

.color-picker-row {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.color-dot {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: 3px solid transparent;
  cursor: pointer;
  transition: transform 0.15s, border-color 0.15s, box-shadow 0.15s;
  box-shadow: 2px 2px 0 #101010;
}

.color-dot:hover { transform: scale(1.12); }
.color-dot.selected {
  border-color: #101010;
  transform: scale(1.2);
  box-shadow: 3px 3px 0 #101010;
}

.form-error {
  background: #fef2f2;
  border: 2px solid #f87171;
  color: #b91c1c;
  padding: 10px 14px;
  font-family: 'Inter', sans-serif;
  font-size: 0.85rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
}

.form-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 4px;
}

.btn-cancel {
  background: none;
  border: 2px solid #d1d5db;
  padding: 11px 20px;
  font-family: 'Inter', sans-serif;
  font-size: 0.88rem;
  font-weight: 700;
  cursor: pointer;
  color: #6b7280;
  transition: all 0.15s;
  border-radius: 0;
}
.btn-cancel:hover { border-color: #101010; color: #101010; }

.btn-wrapper {
  position: relative;
}

.btn-shadow {
  position: absolute;
  top: 4px;
  left: 4px;
  right: -4px;
  bottom: -4px;
  background: #101010;
}

.btn-submit {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  background: #6f6bd8;
  color: #ffffff;
  border: 2px solid #101010;
  padding: 11px 22px;
  font-family: 'Inter', sans-serif;
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.1s, box-shadow 0.1s;
  letter-spacing: 0.2px;
}
.btn-submit:hover { transform: translate(-2px, -2px); }
.btn-submit:active { transform: translate(2px, 2px); }
.btn-submit:disabled { opacity: 0.65; cursor: not-allowed; transform: none; }

/* Transitions */
.modal-fade-enter-active { transition: opacity 0.22s ease; }
.modal-fade-leave-active { transition: opacity 0.18s ease; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }

.modal-fade-enter-active .modal-box {
  animation: sheet-up 0.28s cubic-bezier(0.34, 1.3, 0.64, 1);
}
.modal-fade-leave-active .modal-box {
  animation: sheet-down 0.18s ease-in forwards;
}

@keyframes sheet-up {
  from { transform: translateY(60%); }
  to   { transform: translateY(0); }
}
@keyframes sheet-down {
  from { transform: translateY(0); }
  to   { transform: translateY(100%); }
}
</style>
