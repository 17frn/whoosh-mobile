import { ref, watch } from 'vue';

export type ThemeId = 'blue amber' | 'blue amber warm' | 'blue amber cool' | 'zine' | 'crimson';

export interface Theme {
  id: ThemeId;
  name: string;
  description: string;
  badge: string;
  accentColor: string;
  bgPreview: string;
}

export const THEMES: Theme[] = [
  // ── BLUE AMBER VARIANTS ──
  {
    id: 'blue amber',
    name: 'Blue Amber',
    description: 'Hangat & elegan. Krem lembut dengan aksen indigo.',
    badge: 'fa-feather',
    accentColor: '#6f6bd8',
    bgPreview: '#fdfdf5',
  },
  {
    id: 'blue amber warm',
    name: 'Blue Amber Warm',
    description: 'Cozy warm. Soft blue + terracotta amber yang nyaman.',
    badge: 'fa-home',
    accentColor: '#5b8dee',
    bgPreview: '#fef5e7',
  },
  {
    id: 'blue amber cool',
    name: 'Blue Amber Cool',
    description: 'Fresh modern. Cool blue + bright amber yang tech.',
    badge: 'fa-rocket',
    accentColor: '#2563eb',
    bgPreview: '#f0f4f8',
  },
  // ── EXISTING THEMES ──
  {
    id: 'zine',
    name: 'Zine',
    description: 'Bold & editorial. Header hitam solid, aksen kuning tegas.',
    badge: 'fa-newspaper',
    accentColor: '#fef08a',
    bgPreview: '#101010',
  },
  {
    id: 'crimson',
    name: 'Crimson',
    description: 'Playful & travel. Lavender hangat dengan aksen merah-pink.',
    badge: 'fa-paper-plane',
    accentColor: '#f43f5e',
    bgPreview: '#f0f0ff',
  },
];

const STORAGE_KEY = 'app-theme';

const activeThemeId = ref<ThemeId>(
  (localStorage.getItem(STORAGE_KEY) as ThemeId) || 'blue amber'
);

function applyTheme(id: ThemeId) {
  document.documentElement.setAttribute('data-theme', id);
  localStorage.setItem(STORAGE_KEY, id);
}

// Apply on initial load
applyTheme(activeThemeId.value);

// Reactively apply whenever theme changes
watch(activeThemeId, (id) => applyTheme(id));

export function useTheme() {
  function setTheme(id: ThemeId) {
    activeThemeId.value = id;
  }

  return {
    activeThemeId,
    themes: THEMES,
    setTheme,
  };
}
