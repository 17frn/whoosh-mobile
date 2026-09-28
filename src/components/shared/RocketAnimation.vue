<template>
  <svg
    class="rocket-anim"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 64 90"
    :width="size"
    :height="size"
    aria-hidden="true"
  >
    <g class="rocket-body">
      <!-- Main body -->
      <ellipse cx="32" cy="36" rx="13" ry="20" fill="#6f6bd8" stroke="#101010" stroke-width="2.5"/>
      <!-- Nose cone -->
      <path d="M19,21 Q32,2 45,21 Z" fill="#f97316" stroke="#101010" stroke-width="2.5" stroke-linejoin="round"/>
      <!-- Window -->
      <circle cx="32" cy="32" r="6.5" fill="#e8f4fd" stroke="#101010" stroke-width="2"/>
      <circle cx="32" cy="32" r="4" fill="#a9cbe8"/>
      <circle cx="29.5" cy="29.5" r="1.5" fill="white" opacity="0.8"/>
      <!-- Left fin -->
      <path d="M19,46 L8,62 L19,56 Z" fill="#f97316" stroke="#101010" stroke-width="2" stroke-linejoin="round"/>
      <!-- Right fin -->
      <path d="M45,46 L56,62 L45,56 Z" fill="#f97316" stroke="#101010" stroke-width="2" stroke-linejoin="round"/>
      <!-- Nozzle -->
      <rect x="26" y="54" width="12" height="5" rx="2" fill="#101010"/>
      <!-- Flames -->
      <ellipse class="flame-outer" cx="32" cy="70" rx="8" ry="12" fill="#f97316"/>
      <ellipse class="flame-inner" cx="32" cy="70" rx="5" ry="8" fill="#f6b93b"/>
      <ellipse class="flame-core" cx="32" cy="70" rx="2.5" ry="4" fill="white" opacity="0.9"/>
    </g>
  </svg>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ size?: number }>(), { size: 60 });
</script>

<style scoped>
.rocket-anim {
  display: block;
  overflow: visible;
}
.rocket-body {
  animation: rocket-hover 1.6s ease-in-out infinite;
  transform-origin: 32px 40px;
}
.flame-outer {
  animation: flame-flicker 0.25s ease-in-out infinite alternate;
  transform-origin: 32px 70px;
}
.flame-inner {
  animation: flame-flicker 0.2s ease-in-out infinite alternate-reverse;
  transform-origin: 32px 70px;
}
.flame-core {
  animation: flame-flicker 0.15s ease-in-out infinite alternate;
  transform-origin: 32px 70px;
}
@keyframes rocket-hover {
  0%, 100% { transform: translateY(0px); }
  50%       { transform: translateY(-7px); }
}
@keyframes flame-flicker {
  0%   { transform: scaleY(1) scaleX(1);     opacity: 0.95; }
  100% { transform: scaleY(0.7) scaleX(1.1); opacity: 0.75; }
}
</style>
