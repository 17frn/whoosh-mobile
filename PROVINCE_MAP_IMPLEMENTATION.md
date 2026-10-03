# Province-Focused Map System Implementation Guide

## Context
Aplikasi timeline momen berbasis Vue 3 + TypeScript + Capacitor dengan sistem tema dinamis (blue amber variants). Saat ini menggunakan GlobalMapModal yang menampilkan peta seluruh Indonesia dalam satu view. Perlu dirombak menjadi sistem per-provinsi yang lebih fokus.

## Requirement
Buat sistem peta yang:
1. **Modal utama** dengan dropdown selector provinsi Indonesia
2. **Peta SVG per provinsi** (bukan full Indonesia) - mulai dari Banten dan DKI Jakarta
3. **Zoom in/out dan pan** pada peta provinsi
4. **Marker timeline** ditampilkan berdasarkan koordinat lat/lng dari data
5. **Klik marker** menampilkan popup detail momen
6. **Mobile-friendly** dengan touch gestures (pinch zoom, drag pan)

## Data Structure yang Sudah Ada

### TimelineData Interface
```typescript
interface TimelineData {
  id: string;
  title: string;
  location: string;
  date: string;
  year: number;
  dotColor: string;
  rtl: boolean;
  mapEmbedUrl?: string;
  latitude?: number;    // GPS koordinat
  longitude?: number;   // GPS koordinat
  moments: TimelineMoment[];
}
```

### Indonesia Locations Database
File: `src/data/indonesiaLocations.ts`
- 38 provinsi dengan keywords untuk matching location string
- Setiap provinsi punya lat/lng center
- Contoh: `{ province: "DKI Jakarta", keywords: ["jakarta", "dki", "jkt", ...], lat: -6.38, lng: 106.05 }`

### SVG Map Existing
File: `src/components/modals/IndonesiaMapSVG.vue` 
- Full Indonesia SVG dengan 38 `<path>` elements
- Setiap path punya `id="ID-XX"` (contoh: `id="ID-JK"` untuk Jakarta, `id="ID-BT"` untuk Banten)
- Perlu ekstrak individual path untuk setiap provinsi

## File Structure yang Harus Dibuat

```
src/
├── data/
│   └── provinceMaps.ts          # Data SVG path + bounds per provinsi
├── components/
    └── shared/
        ├── ProvinceMapModal.vue     # Modal container utama
        ├── ProvinceSelector.vue     # Dropdown/pills selector provinsi
        └── ProvinceMapViewer.vue    # SVG viewer dengan zoom/pan
```

## Detail Implementasi

### 1. provinceMaps.ts
```typescript
export interface ProvinceMapData {
  id: string;              // 'jakarta', 'banten'
  name: string;            // 'DKI Jakarta'
  svgPath: string;         // Path SVG element
  bounds: {                // Bounding box dari getBBox()
    x: number;
    y: number;
    width: number;
    height: number;
  };
  center: {
    lat: number;
    lng: number;
  };
}

// Helper function
export function getProvinceData(id: string): ProvinceMapData | null;

// Coordinate conversion
export function latLngToSVG(lat: number, lng: number, bounds: any): { x: number, y: number };
```

**Cara ekstrak SVG path:**
1. Buka `IndonesiaMapSVG.vue`
2. Cari `<path id="ID-JK"` untuk Jakarta
3. Copy attribute `d="..."` (path data)
4. Di browser console: `document.querySelector('#ID-JK').getBBox()` untuk dapat bounds

**Konversi koordinat:**
- Indonesia bounds: lng 95-141°, lat -11° to 8°
- SVG viewport: lihat dari path bounds
- Linear projection sederhana cukup untuk 2 provinsi

### 2. ProvinceSelector.vue
**Props:**
- `provinces: Array<{ name: string, count: number }>`
- `selected: string | null`

**Emit:**
- `@select="provinceName"`

**UI:**
- Search box dengan icon
- Horizontal scrollable pills (desktop) dengan badge count
- Native `<select>` dropdown (mobile)
- Active state styling

**Styling:**
- Gunakan CSS variables tema: `var(--theme-accent)`, `var(--theme-border)`, `var(--theme-surface)`
- Border radius 20px untuk pills
- Transition smooth 0.2s

### 3. ProvinceMapViewer.vue
**Props:**
- `province: ProvinceMapData`
- `markers: TimelineData[]`

**Emit:**
- `@marker-click="timelineData"`

**Features:**
- SVG dengan viewBox dinamis berdasarkan province bounds
- Zoom: mouse wheel, +/- buttons (level 1x - 4x)
- Pan: mouse drag, touch drag
- Pinch-to-zoom (mobile)
- Markers sebagai circles dengan warna dotColor
- Click marker → emit event

**State:**
```typescript
const zoom = ref(1);
const panX = ref(0);
const panY = ref(0);
const isDragging = ref(false);
```

**SVG Structure:**
```vue
<svg :viewBox="computedViewBox" @wheel="handleWheel">
  <g :transform="`translate(${panX}, ${panY}) scale(${zoom})`">
    <path :d="province.svgPath" fill="#e5e7eb" stroke="#101010" />
    <circle
      v-for="marker in markers"
      :cx="getMarkerX(marker)"
      :cy="getMarkerY(marker)"
      :fill="marker.dotColor"
      @click="$emit('marker-click', marker)"
    />
  </g>
</svg>
```

### 4. ProvinceMapModal.vue
**Props:**
- `timelineItems: TimelineData[]`

**Emit:**
- `@close`
- `@open-detail="timelineData"`

**State:**
```typescript
const isOpen = ref(false);
const selectedProvinceId = ref<string | null>(null);
const selectedMarker = ref<TimelineData | null>(null);
```

**Methods:**
```typescript
function open() { isOpen.value = true; }
function close() { isOpen.value = false; }
```

**Logic:**
1. Group timeline items by province (match location string dengan keywords dari indonesiaLocations)
2. Hitung count per provinsi untuk selector
3. Render ProvinceSelector dengan provinces yang punya data
4. Render ProvinceMapViewer untuk selected province
5. Show marker popup overlay saat marker diklik

**Layout:**
```
┌─────────────────────────────────┐
│ Header: "Peta Perjalanan" [X]   │
├─────────────────────────────────┤
│ ProvinceSelector                 │
├─────────────────────────────────┤
│                                  │
│   ProvinceMapViewer              │
│   (with zoom/pan controls)       │
│                                  │
├─────────────────────────────────┤
│ Footer: Stats (X momen, Y prov) │
└─────────────────────────────────┘
```

**Marker Popup (overlay):**
- Position: center modal
- Show: title, location, date, moment count
- Button: "Lihat Detail" → emit open-detail → close modal

## Integrasi ke App

### File: `src/views/HomeView.vue`
**Tambahkan:**
```vue
<template>
  <!-- existing content -->
  
  <ProvinceMapModal
    ref="provinceMapModalRef"
    :timeline-items="items"
    @open-detail="openDetail"
  />
</template>

<script setup>
import ProvinceMapModal from '../components/shared/ProvinceMapModal.vue';

const provinceMapModalRef = ref(null);

// Ganti fungsi existing
const openGlobalMap = () => {
  provinceMapModalRef.value?.open();
};
</script>
```

**Hapus:**
- Event dispatcher `window.dispatchEvent(new Event('open-global-map'))`
- Jangan hapus GlobalMapModal dari App.vue dulu (biar aman)

## Styling Requirements

1. **Tema Integration:**
   - `var(--theme-background)`
   - `var(--theme-surface)` 
   - `var(--theme-border)`
   - `var(--theme-accent)`
   - `var(--theme-text)`
   - `var(--theme-text-secondary)`

2. **Modal:**
   - Backdrop: `rgba(0,0,0,0.75)` dengan `backdrop-filter: blur(4px)`
   - Border radius: 16px
   - Max width: 1000px desktop
   - Full screen mobile

3. **Animations:**
   - Modal fade: 0.3s ease
   - Marker hover: scale 1.2
   - Button transitions: 0.2s

4. **Mobile Responsive:**
   - Breakpoint: 768px
   - Touch-friendly buttons (min 44px)
   - Hide desktop pills, show mobile select

## Testing Checklist

- [ ] Modal bisa dibuka dari tombol "Lihat Jejak Momen"
- [ ] Selector menampilkan provinsi yang punya data
- [ ] Peta muncul saat pilih provinsi
- [ ] Zoom in/out berfungsi (mouse wheel + buttons)
- [ ] Pan berfungsi (drag mouse/touch)
- [ ] Pinch zoom berfungsi di mobile
- [ ] Markers muncul di posisi yang benar
- [ ] Klik marker munculkan popup
- [ ] "Lihat Detail" di popup membuka detail modal
- [ ] Close modal kembali ke Home normal
- [ ] Styling match dengan tema blue amber
- [ ] Responsive di mobile

## Prioritas
1. **PHASE 1:** provinceMaps.ts + data extraction (Jakarta & Banten only)
2. **PHASE 2:** ProvinceMapViewer (rendering + basic zoom/pan)
3. **PHASE 3:** ProvinceSelector (UI + filtering)
4. **PHASE 4:** ProvinceMapModal (container + integration)
5. **PHASE 5:** HomeView integration
6. **PHASE 6:** Polish (animations, mobile gestures, popup)

## Notes
- **Jangan** gunakan library external (Leaflet, OpenLayers, dll)
- **Gunakan** Vue 3 Composition API (`<script setup>`)
- **Pastikan** TypeScript types semua benar
- **Test** di browser dulu sebelum test di HP
- **Coordinate fallback:** Kalau timeline item tidak punya lat/lng, jangan tampilkan marker (skip)

## SVG Path Extraction Example

### Jakarta (ID-JK)
1. Buka browser console di halaman yang render IndonesiaMapSVG
2. Run: `document.querySelector('#ID-JK').getAttribute('d')`
3. Run: `document.querySelector('#ID-JK').getBBox()`
4. Copy hasil untuk masukkan ke provinceMaps.ts

### Banten (ID-BT)
1. Run: `document.querySelector('#ID-BT').getAttribute('d')`
2. Run: `document.querySelector('#ID-BT').getBBox()`
3. Copy hasil

## Coordinate Conversion Formula

```typescript
// Simple linear projection
function latLngToSVG(lat: number, lng: number, provinceBounds: Bounds): { x: number, y: number } {
  // Indonesia geographic bounds
  const indonesiaBounds = {
    minLng: 95,
    maxLng: 141,
    minLat: -11,
    maxLat: 8
  };
  
  // Normalize to 0-1
  const normalizedLng = (lng - indonesiaBounds.minLng) / (indonesiaBounds.maxLng - indonesiaBounds.minLng);
  const normalizedLat = (lat - indonesiaBounds.minLat) / (indonesiaBounds.maxLat - indonesiaBounds.minLat);
  
  // Map to SVG bounds
  const x = provinceBounds.x + (normalizedLng * provinceBounds.width);
  const y = provinceBounds.y + ((1 - normalizedLat) * provinceBounds.height); // Invert Y for SVG
  
  return { x, y };
}
```

## Complete Example: provinceMaps.ts

```typescript
export interface ProvinceMapData {
  id: string;
  name: string;
  svgPath: string;
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  center: {
    lat: number;
    lng: number;
  };
}

const PROVINCE_DATA: Record<string, ProvinceMapData> = {
  jakarta: {
    id: 'jakarta',
    name: 'DKI Jakarta',
    svgPath: 'm 173.98571,239.51789 ... (long path data)', // Copy dari SVG
    bounds: {
      x: 171.23,
      y: 231.87,
      width: 30.45,
      height: 12.34
    },
    center: {
      lat: -6.38,
      lng: 106.05
    }
  },
  banten: {
    id: 'banten',
    name: 'Banten',
    svgPath: 'm 199.16571,231.92789 ... (long path data)',
    bounds: {
      x: 178.12,
      y: 228.56,
      width: 24.78,
      height: 20.23
    },
    center: {
      lat: -6.43,
      lng: 106.00
    }
  }
};

export function getProvinceData(id: string): ProvinceMapData | null {
  return PROVINCE_DATA[id] || null;
}

export function getAllProvinces(): ProvinceMapData[] {
  return Object.values(PROVINCE_DATA);
}

export function latLngToSVG(
  lat: number, 
  lng: number, 
  bounds: ProvinceMapData['bounds']
): { x: number; y: number } {
  const indonesiaBounds = {
    minLng: 95,
    maxLng: 141,
    minLat: -11,
    maxLat: 8
  };
  
  const normalizedLng = (lng - indonesiaBounds.minLng) / (indonesiaBounds.maxLng - indonesiaBounds.minLng);
  const normalizedLat = (lat - indonesiaBounds.minLat) / (indonesiaBounds.maxLat - indonesiaBounds.minLat);
  
  const x = bounds.x + (normalizedLng * bounds.width);
  const y = bounds.y + ((1 - normalizedLat) * bounds.height);
  
  return { x, y };
}
```

---

**File ini siap digunakan sebagai spesifikasi lengkap untuk implementasi province map system!**
