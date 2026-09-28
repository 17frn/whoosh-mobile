<template>
  <div class="settings-view">
    <header class="page-header">
      <div class="header-top">
        <h1 class="page-title">Pengaturan</h1>
      </div>
    </header>

    <main class="settings-content">
      <div class="empty-state">
        <i class="fa-solid fa-screwdriver-wrench"></i>
        <p>Halaman pengaturan sedang dalam pengembangan.</p>
      </div>
    </main>
  </div>
</template>

<style scoped>
.settings-view {
  width: 100%;
  padding-bottom: 20px;
}
.page-header {
  padding: 12px 20px 8px;
  background: transparent;
  margin: 0;
  position: sticky;
  top: 0;
  z-index: 100;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.header-top { margin: 0; }
.page-title {
  font-family: 'Outfit', 'Space Grotesk', sans-serif;
  font-size: 1.6rem;
  font-weight: 900;
  color: #101010;
  margin: 0;
  line-height: 1.1;
}
.settings-content {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  color: #9ca3af;
  text-align: center;
  gap: 12px;
  font-family: 'Inter', sans-serif;
}
.empty-state i {
  font-size: 3rem;
  color: #d1d5db;
}
</style>
