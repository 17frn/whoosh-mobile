<template>
  <div class="province-selector">
    <!-- Search box -->
    <div class="ps-search">
      <i class="fa-solid fa-magnifying-glass ps-search-icon"></i>
      <input
        v-model="query"
        type="search"
        placeholder="Cari provinsi..."
        class="ps-search-input"
      />
    </div>

    <!-- Pills (scrollable) -->
    <div class="ps-pills" ref="pillsRef">
      <button
        v-for="p in filteredProvinces"
        :key="p.id"
        class="ps-pill"
        :class="{ 'ps-pill--active': p.id === selected }"
        @click="$emit('select', p.id)"
      >
        {{ p.name }}
        <span class="ps-pill-count">{{ p.count }}</span>
      </button>
      <p v-if="filteredProvinces.length === 0" class="ps-empty">
        Tidak ada data untuk "{{ query }}"
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

interface ProvinceItem {
  id: string;
  name: string;
  count: number;
}

const props = defineProps<{
  provinces: ProvinceItem[];
  selected: string | null;
}>();

defineEmits<{
  (e: 'select', id: string): void;
}>();

const query = ref('');
const pillsRef = ref<HTMLElement | null>(null);

const filteredProvinces = computed(() =>
  props.provinces.filter(p =>
    p.name.toLowerCase().includes(query.value.toLowerCase())
  )
);
</script>

<style scoped>
.province-selector {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* Search */
.ps-search {
  position: relative;
  display: flex;
  align-items: center;
}
.ps-search-icon {
  position: absolute;
  left: 12px;
  color: var(--theme-text-secondary, #64748b);
  font-size: 0.85rem;
  pointer-events: none;
}
.ps-search-input {
  width: 100%;
  padding: 9px 14px 9px 34px;
  font-family: 'Inter', sans-serif;
  font-size: 0.88rem;
  border: 2px solid var(--theme-border, #101010);
  border-radius: 0;
  background: var(--theme-surface, #fff);
  color: var(--theme-text, #101010);
  outline: none;
  box-shadow: 2px 2px 0 var(--theme-border, #101010);
  transition: box-shadow 0.15s;
}
.ps-search-input:focus {
  box-shadow: 3px 3px 0 var(--theme-accent, #6b9bd6);
}

/* Pills */
.ps-pills {
  display: flex;
  flex-wrap: nowrap;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 4px;
  scrollbar-width: none;
}
.ps-pills::-webkit-scrollbar { display: none; }

.ps-pill {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  font-family: 'Inter', sans-serif;
  font-size: 0.8rem;
  font-weight: 700;
  border: 2px solid var(--theme-border, #101010);
  border-radius: 20px;
  background: var(--theme-surface, #fff);
  color: var(--theme-text, #101010);
  cursor: pointer;
  transition: background 0.15s, box-shadow 0.15s, transform 0.1s;
  box-shadow: 2px 2px 0 var(--theme-border, #101010);
  white-space: nowrap;
}
.ps-pill:hover {
  transform: translate(-1px, -1px);
  box-shadow: 3px 3px 0 var(--theme-border, #101010);
}
.ps-pill--active {
  background: var(--theme-accent, #101010);
  color: #fff;
}

.ps-pill-count {
  background: rgba(255,255,255,0.3);
  color: inherit;
  font-size: 0.7rem;
  font-weight: 800;
  padding: 1px 6px;
  border-radius: 10px;
}
.ps-pill--active .ps-pill-count {
  background: rgba(0,0,0,0.25);
}

.ps-empty {
  font-family: 'Inter', sans-serif;
  font-size: 0.8rem;
  color: var(--theme-text-secondary, #94a3b8);
  margin: 0;
  padding: 8px 0;
}
</style>
