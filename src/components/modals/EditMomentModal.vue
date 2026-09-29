<template>
  <Transition name="modal-fade">
    <div class="modal-overlay" @click.self="$emit('close')" role="dialog" aria-modal="true" aria-label="Edit Momen">
      <div class="modal-box">

        <!-- STICKY HEADER -->
        <div class="modal-sticky-header">
          <div class="handle-bar"></div>
          <div class="modal-header">
            <div class="modal-header-title">
              <div class="header-icon-badge">
                <i class="fa-solid fa-pen-to-square"></i>
              </div>
              <div class="header-text">
                <span class="header-eyebrow">PERJALANAN</span>
                <h2>Edit Momen</h2>
              </div>
            </div>
          </div>
        </div>

        <!-- SCROLLABLE BODY -->
        <div class="modal-body">
          <form @submit.prevent="handleSubmit" id="edit-moment-form" class="modal-form">

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

            <!-- FOTO TERSIMPAN -->
            <div v-if="existingPhotos.length > 0" class="form-group">
              <label>Foto Tersimpan <span class="label-hint">(Tahan & Geser untuk urutkan)</span></label>
              <div class="existing-photos-grid scrollable-photos" ref="sortableGrid">
                <div v-for="(photo, idx) in existingPhotos" :key="photo.localImageId || idx" class="photo-card" :data-id="idx">
                  <div class="photo-img-wrap">
                    <img :src="photo.image" alt="Thumbnail" />
                    <button type="button" class="btn-delete-photo" @click="removeExistingPhoto(idx)" title="Hapus Foto">
                      <i class="fa-solid fa-xmark"></i>
                    </button>
                  </div>
                  <input type="text" v-model="photo.title" class="photo-caption-input" placeholder="Tulis caption..." autocomplete="off" />
                </div>
              </div>
            </div>

            <!-- Error -->
            <div v-if="error" class="form-error">
              <i class="fa-solid fa-triangle-exclamation"></i> {{ error }}
            </div>

          </form>
        </div>
        <!-- /SCROLLABLE BODY -->

        <!-- STICKY FOOTER -->
        <div class="modal-sticky-footer">
          <!-- Tombol Tambah Foto (kiri) -->
          <div class="file-upload-wrapper">
            <input type="file" id="mom-photo-edit" accept="image/*" multiple @change="handleFileChange" class="file-input-hidden" />
            <label for="mom-photo-edit" class="neo-btn-upload">
              <i class="fa-solid fa-images"></i>
              <span>{{ selectedFileCount > 0 ? `+${selectedFileCount} Foto` : 'Tambah Foto' }}</span>
            </label>
          </div>

          <!-- Tombol Batal & Simpan (kanan) -->
          <div class="footer-actions-right">
            <button type="button" class="neo-btn-cancel" @click="$emit('close')">BATAL</button>
            <button type="submit" form="edit-moment-form" class="neo-btn-save" :disabled="loading" id="btn-save-moment">
              <i v-if="loading" class="fa-solid fa-spinner fa-spin"></i>
              <i v-else class="fa-solid fa-floppy-disk"></i>
              {{ loading ? 'SIMPAN...' : 'SIMPAN' }}
            </button>
          </div>
        </div>
        <!-- /STICKY FOOTER -->

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
    existingMoments?: any[];
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

const existingPhotos = ref<any[]>([]);
const sortableGrid = ref<HTMLElement | null>(null);

let sortableInstance: any = null;

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


onMounted(async () => {
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
    existingPhotos.value = props.moment.moments ? JSON.parse(JSON.stringify(props.moment.moments)) : [];
  }

  // Initialize SortableJS
  if (existingPhotos.value.length > 0) {
    const Sortable = (await import('sortablejs')).default;
    setTimeout(() => {
      if (sortableGrid.value) {
        sortableInstance = new Sortable(sortableGrid.value, {
          animation: 150,
          ghostClass: 'sortable-ghost',
          onEnd: (evt: any) => {
            const item = existingPhotos.value.splice(evt.oldIndex, 1)[0];
            existingPhotos.value.splice(evt.newIndex, 0, item);
          }
        });
      }
    }, 100);
  }
});

function removeExistingPhoto(idx: number) {
  existingPhotos.value.splice(idx, 1);
}

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
      additionalPhotos,
      existingMoments: existingPhotos.value
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
  max-height: 92vh;
  /* 3-layer flex for sticky header + scrollable body + sticky footer */
  display: flex;
  flex-direction: column;
  overflow: hidden; /* CRITICAL: prevents the box itself from scrolling */
}

/* ── STICKY HEADER ── */
.modal-sticky-header {
  flex-shrink: 0;
  padding: 12px 24px 0;
  background: #fafafa;
  border-bottom: 2px solid #101010;
}

.handle-bar {
  width: 40px;
  height: 4px;
  background: #d1d5db;
  border-radius: 99px;
  margin: 0 auto 14px;
}

.modal-header {
  display: flex;
  align-items: center;
  padding-bottom: 16px;
}

.modal-header-title {
  display: flex;
  align-items: center;
  gap: 14px;
}

.header-icon-badge {
  width: 48px;
  height: 48px;
  background: #fef08a;
  border: 2.5px solid #101010;
  box-shadow: 3px 3px 0 #101010;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.3rem;
  color: #101010;
  flex-shrink: 0;
}

.header-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.header-eyebrow {
  font-family: 'Inter', sans-serif;
  font-size: 0.62rem;
  font-weight: 700;
  color: #6f6bd8;
  letter-spacing: 1.5px;
  text-transform: uppercase;
}

.modal-header h2 {
  font-family: 'Outfit', sans-serif;
  font-size: 1.35rem;
  font-weight: 900;
  color: #101010;
  margin: 0;
  line-height: 1.1;
}

.neo-close-btn {
  width: 34px;
  height: 34px;
  border: 2px solid #101010;
  border-radius: 0;
  background: #fef2f2;
  color: #f43f5e;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.95rem;
  box-shadow: 2px 2px 0 #101010;
  transition: all 0.1s ease;
}
.neo-close-btn:active {
  transform: translate(2px, 2px);
  box-shadow: 0 0 0 #101010;
}

/* ── SCROLLABLE BODY ── */
.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  scrollbar-width: none; /* Firefox */
}
.modal-body::-webkit-scrollbar { display: none; } /* Chrome/Safari */

/* ── STICKY FOOTER ── */
.modal-sticky-footer {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 24px;
  border-top: 3px solid #101010;
  background: #f0f0f0;
  gap: 12px;
}

.footer-actions-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

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

/* ══ NEO-BRUTALIST BUTTONS ══ */

/* Tambah Foto */
.file-input-hidden { display: none; }

.neo-btn-upload {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #fef08a;
  color: #101010;
  font-family: 'Outfit', sans-serif;
  font-size: 0.82rem;
  font-weight: 900;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  border: 2px solid #101010;
  padding: 10px 16px;
  cursor: pointer;
  box-shadow: 3px 3px 0 #101010;
  transition: all 0.08s ease;
}
.neo-btn-upload:active {
  transform: translate(3px, 3px);
  box-shadow: 0 0 0 #101010;
}

/* Batal */
.neo-btn-cancel {
  font-family: 'Outfit', sans-serif;
  font-size: 0.82rem;
  font-weight: 900;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  background: #ffffff;
  color: #101010;
  border: 2px solid #101010;
  padding: 10px 18px;
  cursor: pointer;
  box-shadow: 3px 3px 0 #101010;
  transition: all 0.08s ease;
}
.neo-btn-cancel:active {
  transform: translate(3px, 3px);
  box-shadow: 0 0 0 #101010;
}

/* Simpan */
.neo-btn-save {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #101010;
  color: #fafafa;
  font-family: 'Outfit', sans-serif;
  font-size: 0.82rem;
  font-weight: 900;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  border: 2px solid #101010;
  padding: 10px 20px;
  cursor: pointer;
  box-shadow: 3px 3px 0 #6f6bd8;
  transition: all 0.08s ease;
}
.neo-btn-save:active {
  transform: translate(3px, 3px);
  box-shadow: 0 0 0 #6f6bd8;
}
.neo-btn-save:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
  box-shadow: 3px 3px 0 #6f6bd8;
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

/* ── Photo Grid (Scrollable) ── */
.scrollable-photos {
  max-height: 40vh;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 12px;
  background: #f3f4f6;
  border: 2px solid #101010;
  border-radius: 4px;
}

/* Custom Scrollbar for photos */
.scrollable-photos::-webkit-scrollbar { width: 8px; }
.scrollable-photos::-webkit-scrollbar-track { background: #e5e7eb; border-left: 2px solid #101010; }
.scrollable-photos::-webkit-scrollbar-thumb { background: #6f6bd8; border: 2px solid #101010; border-right: none; }

.existing-photos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
  gap: 12px;
}

.photo-card {
  position: relative;
  background: #ffffff;
  border: 2px solid #101010;
  box-shadow: 2px 2px 0 #101010;
  display: flex;
  flex-direction: column;
  cursor: grab;
}
.photo-card:active {
  cursor: grabbing;
}

.photo-img-wrap {
  position: relative;
  width: 100%;
  aspect-ratio: 1 / 1;
  border-bottom: 2px solid #101010;
  overflow: hidden;
}

.photo-img-wrap img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.btn-delete-photo {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #f87171;
  color: #fff;
  border: 2px solid #101010;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 0.75rem;
  z-index: 10;
}
.btn-delete-photo:hover { background: #ef4444; }

.photo-caption-input {
  border: none;
  border-radius: 0;
  box-shadow: none;
  font-size: 0.75rem;
  padding: 6px 8px;
  width: 100%;
  background: #f8fafc;
  margin: 0;
}
.photo-caption-input:focus {
  background: #ffffff;
  outline: none;
}
.sortable-ghost {
  opacity: 0.4;
}

/* ── FILE INPUT BRUTALIST ── */
.file-input-hidden {
  display: none;
}

.btn-neo-upload {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  background: #e0e7ff;
  color: #3730a3;
  border: 2px solid #101010;
  padding: 11px 16px;
  font-family: 'Inter', sans-serif;
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.1s, box-shadow 0.1s;
  box-shadow: 3px 3px 0 #101010;
}
.btn-neo-upload:active {
  transform: translate(2px, 2px);
  box-shadow: 1px 1px 0 #101010;
}

</style>
