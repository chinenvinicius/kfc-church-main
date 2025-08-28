<template>
  <div id="app">
    <!-- Header Navigation -->
    <header class="header">
      <div class="container">
        <div class="header-content">
          <!-- Brand -->
          <div class="header-brand">
            <NuxtLink to="/" class="brand-link">
              <Icon name="material-symbols:church" class="brand-icon" />
              <span class="brand-text">KFC Church</span>
            </NuxtLink>
          </div>
          
          <!-- Desktop Navigation -->
          <nav class="nav mobile-hidden">
            <ul class="nav-list">
              <li>
                <NuxtLink to="/" class="nav-link">
                  <Icon name="material-symbols:dashboard-outline" class="nav-icon" />
                  Dashboard
                </NuxtLink>
              </li>
              <li>
                <NuxtLink to="/members" class="nav-link">
                  <Icon name="material-symbols:group-outline" class="nav-icon" />
                  Members
                </NuxtLink>
              </li>
              <li>
                <NuxtLink to="/attendance" class="nav-link">
                  <Icon name="material-symbols:checklist-outline" class="nav-icon" />
                  Attendance
                </NuxtLink>
              </li>
              <li>
                <NuxtLink to="/reports" class="nav-link">
                  <Icon name="material-symbols:analytics-outline" class="nav-icon" />
                  Reports
                </NuxtLink>
              </li>
              <li>
                <NuxtLink to="/files" class="nav-link">
                  <Icon name="material-symbols:folder-outline" class="nav-icon" />
                  Files
                </NuxtLink>
              </li>
              <li>
                <NuxtLink to="/background-settings" class="nav-link">
                  <Icon name="material-symbols:image-outline" class="nav-icon" />
                  Background
                </NuxtLink>
              </li>
              <li>
                <NuxtLink to="/webdav-settings" class="nav-link">
                  <Icon name="material-symbols:cloud-outline" class="nav-icon" />
                  WebDAV
                </NuxtLink>
              </li>
            </ul>
          </nav>
          
          <!-- Mobile Menu Toggle -->
          <button
            class="mobile-nav-toggle mobile-only"
            @click="toggleMobileNav"
            aria-label="Toggle navigation"
          >
            <Icon name="material-symbols:menu" class="hamburger-icon" />
          </button>
        </div>
      </div>
    </header>
    
    <!-- Mobile Navigation Overlay -->
    <nav class="nav mobile-nav" :class="{ 'mobile-open': isMobileNavOpen }" @click="closeMobileNav">
      <div class="nav-container" @click.stop>
        <div class="nav-header">
          <h3>Menu</h3>
          <button @click="closeMobileNav" class="modal-close">
            <Icon name="material-symbols:close" />
          </button>
        </div>
        <ul class="nav-list">
          <li>
            <NuxtLink to="/" class="nav-link" @click="closeMobileNav">
              <Icon name="material-symbols:dashboard-outline" class="nav-icon" />
              Dashboard
            </NuxtLink>
          </li>
          <li>
            <NuxtLink to="/members" class="nav-link" @click="closeMobileNav">
              <Icon name="material-symbols:group-outline" class="nav-icon" />
              Members
            </NuxtLink>
          </li>
          <li>
            <NuxtLink to="/attendance" class="nav-link" @click="closeMobileNav">
              <Icon name="material-symbols:checklist-outline" class="nav-icon" />
              Attendance
            </NuxtLink>
          </li>
          <li>
            <NuxtLink to="/reports" class="nav-link" @click="closeMobileNav">
              <Icon name="material-symbols:analytics-outline" class="nav-icon" />
              Reports
            </NuxtLink>
          </li>
          <li>
            <NuxtLink to="/files" class="nav-link" @click="closeMobileNav">
              <Icon name="material-symbols:folder-outline" class="nav-icon" />
              Files
            </NuxtLink>
          </li>
          <li>
            <NuxtLink to="/background-settings" class="nav-link" @click="closeMobileNav">
              <Icon name="material-symbols:image-outline" class="nav-icon" />
              Background
            </NuxtLink>
          </li>
          <li>
            <NuxtLink to="/webdav-settings" class="nav-link" @click="closeMobileNav">
              <Icon name="material-symbols:cloud-outline" class="nav-icon" />
              WebDAV
            </NuxtLink>
          </li>
        </ul>
      </div>
    </nav>
    
    <!-- Main Content -->
    <main class="main-content">
      <div class="container">
        <NuxtPage />
      </div>
    </main>
  </div>
</template>

<script setup>
// Mobile navigation state
const isMobileNavOpen = ref(false)

// Toggle mobile navigation
const toggleMobileNav = () => {
  isMobileNavOpen.value = !isMobileNavOpen.value
}

// Close mobile navigation
const closeMobileNav = () => {
  isMobileNavOpen.value = false
}

// Close mobile nav on route change
watch(() => useRoute().path, () => {
  closeMobileNav()
})

// Set page title
useHead({
  title: 'KFC Church Attendance System',
  meta: [
    { name: 'description', content: 'Church attendance tracking and member management system' }
  ]
})
</script>

<style scoped>
.main-content {
  padding-top: 1.25rem;
  padding-bottom: 2rem;
  min-height: calc(100vh - var(--header-height));
}

.nav-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border-color);
}

.nav-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
}

@media (max-width: 768px) {
  .main-content {
    padding-top: 1rem;
    padding-bottom: 1rem;
  }
}
</style>