<template>
  <div class="background-page">
    <!-- Page Header -->
    <div class="page-header">
      <div class="header-content">
        <div>
          <h1>Background Settings</h1>
          <p>Upload and manage background images for the application</p>
        </div>
        <div class="header-actions">
          <NuxtLink to="/webdav-settings" class="btn btn-secondary">
            <Icon name="material-symbols:cloud-outline" />
            WebDAV Settings
          </NuxtLink>
          <button @click="triggerFileUpload" class="btn btn-primary" :disabled="uploading">
            <Icon v-if="uploading" name="material-symbols:progress-activity" class="loading-icon" />
            <Icon v-else name="material-symbols:cloud-upload" />
            {{ uploading ? 'Uploading...' : 'Upload Image' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Hidden File Input -->
    <input
      ref="fileInput"
      type="file"
      accept="image/jpeg,image/jpg,image/png,image/webp"
      @change="handleFileUpload"
      style="display: none"
    />

    <!-- Storage Status -->
    <div class="card">
      <div class="storage-status">
        <div class="status-header">
          <Icon name="material-symbols:storage" class="status-icon" />
          <div>
            <h3>Storage Configuration</h3>
            <p>{{ webdavEnabled ? 'WebDAV storage is enabled' : 'Using local storage' }}</p>
          </div>
        </div>
        <div class="status-indicator" :class="webdavEnabled ? 'status-webdav' : 'status-local'">
          <Icon :name="webdavEnabled ? 'material-symbols:cloud' : 'material-symbols:folder'" />
          {{ webdavEnabled ? 'WebDAV' : 'Local' }}
        </div>
      </div>
      <div class="storage-actions">
        <label class="switch">
          <input type="checkbox" v-model="webdavEnabled" @change="toggleWebDAV" :disabled="togglingWebDAV" />
          <span class="slider round"></span>
        </label>
        <span class="switch-label">{{ webdavEnabled ? 'Disable WebDAV' : 'Enable WebDAV' }}</span>
      </div>
    </div>

    <!-- Upload Info -->
    <div class="card">
      <div class="upload-info">
        <Icon name="material-symbols:info" class="info-icon" />
        <div class="info-content">
          <h3>Upload Guidelines</h3>
          <ul>
            <li>Supported formats: JPEG, PNG, WebP</li>
            <li>Maximum file size: 5MB</li>
            <li>Recommended resolution: 1920x1080 or higher</li>
            <li>Images will be used as full-screen backgrounds</li>
            <li v-if="webdavEnabled" class="storage-info webdav-info">
              <Icon name="material-symbols:cloud" />
              New uploads will be stored on your WebDAV server
            </li>
            <li v-else class="storage-info local-info">
              <Icon name="material-symbols:folder" />
              Images are stored locally on the server
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Success/Error Messages -->
    <div v-if="successMessage" class="alert alert-success">
      <Icon name="material-symbols:check-circle" />
      {{ successMessage }}
    </div>

    <div v-if="errorMessage" class="alert alert-error">
      <Icon name="material-symbols:error" />
      {{ errorMessage }}
    </div>

    <!-- Background Images Grid -->
    <div class="backgrounds-grid">
      <div
        v-for="background in backgrounds"
        :key="background.id"
        class="background-card"
        :class="{ active: background.isActive }"
      >
        <div class="background-preview">
          <img :src="background.url" :alt="background.originalName" />
          <div v-if="background.isActive" class="active-badge">
            <Icon name="material-symbols:check-circle" />
            Active
          </div>
        </div>
        
        <div class="background-info">
          <h3>{{ background.originalName }}</h3>
          <p class="upload-details">
            Uploaded by {{ background.uploadedBy }} on {{ formatDate(background.uploadedAt) }}
          </p>
          <div class="storage-badge" :class="background.storageType === 'webdav' ? 'storage-webdav' : 'storage-local'">
            <Icon :name="background.storageType === 'webdav' ? 'material-symbols:cloud' : 'material-symbols:folder'" />
            {{ background.storageType === 'webdav' ? 'WebDAV' : 'Local' }}
          </div>
          
          <div class="background-actions">
            <button
              v-if="!background.isActive"
              @click="setActiveBackground(background.id)"
              class="btn btn-sm btn-primary"
              :disabled="settingActive"
            >
              <Icon v-if="settingActive" name="material-symbols:progress-activity" class="loading-icon" />
              <Icon v-else name="material-symbols:check" />
              Set Active
            </button>
            
            <button
              @click="deleteBackground(background.id)"
              class="btn btn-sm btn-danger"
              :disabled="deleting"
            >
              <Icon v-if="deleting" name="material-symbols:progress-activity" class="loading-icon" />
              <Icon v-else name="material-symbols:delete" />
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="backgrounds.length === 0 && !loading" class="card">
      <div class="empty-state">
        <Icon name="material-symbols:image" class="empty-icon" />
        <h3>No background images</h3>
        <p>Upload your first background image to customize the application</p>
        <button @click="triggerFileUpload" class="btn btn-primary">
          <Icon name="material-symbols:cloud-upload" />
          Upload First Image
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <Icon name="material-symbols:refresh" class="loading-icon" />
      <p>Loading background images...</p>
    </div>
  </div>
</template>

<script setup>
// No authentication middleware needed

// Page metadata
useHead({
  title: 'Background Settings - KFC Church Attendance System'
})

// Reactive data
const loading = ref(true)
const uploading = ref(false)
const settingActive = ref(false)
const deleting = ref(false)
const backgrounds = ref([])
const successMessage = ref('')
const errorMessage = ref('')
const fileInput = ref(null)
const webdavEnabled = ref(false)
const togglingWebDAV = ref(false)

// Methods
const fetchWebDAVStatus = async () => {
  try {
    const response = await $fetch('/api/webdav/config')
    webdavEnabled.value = response.data?.enabled || false
  } catch (error) {
    console.error('Error fetching WebDAV status:', error)
    webdavEnabled.value = false
  }
}

const toggleWebDAV = async () => {
  togglingWebDAV.value = true
  successMessage.value = ''
  errorMessage.value = ''
  try {
    const response = await $fetch('/api/webdav/config', {
      method: 'POST',
      body: {
        enabled: webdavEnabled.value,
        // Send other required fields, even if they are empty strings, to avoid validation errors
        serverUrl: '',
        username: '',
        password: '', // Password should not be sent from here, backend should handle it
        email: '',
        storageQuota: '',
        basePath: '/backgrounds'
      }
    })
    if (response.success) {
      successMessage.value = `WebDAV storage ${webdavEnabled.value ? 'enabled' : 'disabled'} successfully!`
      await fetchWebDAVStatus() // Re-fetch status to ensure consistency
    } else {
      errorMessage.value = response.message || `Failed to ${webdavEnabled.value ? 'enable' : 'disable'} WebDAV storage.`
      webdavEnabled.value = !webdavEnabled.value // Revert toggle state on error
    }
  } catch (error) {
    console.error('Error toggling WebDAV:', error)
    errorMessage.value = error.data?.message || `Failed to ${webdavEnabled.value ? 'enable' : 'disable'} WebDAV storage.`
    webdavEnabled.value = !webdavEnabled.value // Revert toggle state on error
  } finally {
    togglingWebDAV.value = false
  }
}

const fetchBackgrounds = async () => {
  try {
    loading.value = true
    const response = await $fetch('/api/background/list')
    backgrounds.value = response.data
  } catch (error) {
    console.error('Error fetching backgrounds:', error)
    errorMessage.value = 'Failed to load background images'
  } finally {
    loading.value = false
  }
}

const triggerFileUpload = () => {
  fileInput.value?.click()
}

const handleFileUpload = async (event) => {
  const file = event.target.files?.[0]
  if (!file) return

  try {
    uploading.value = true
    successMessage.value = ''
    errorMessage.value = ''

    const formData = new FormData()
    formData.append('file', file)

    const response = await $fetch('/api/background/upload', {
      method: 'POST',
      body: formData
    })

    if (response.success) {
      successMessage.value = 'Background image uploaded successfully!'
      await fetchBackgrounds()
      
      // Clear the file input
      if (fileInput.value) {
        fileInput.value.value = ''
      }
    }

  } catch (error) {
    console.error('Upload error:', error)
    errorMessage.value = error.data?.message || 'Failed to upload image'
  } finally {
    uploading.value = false
  }
}

const setActiveBackground = async (backgroundId) => {
  try {
    settingActive.value = true
    successMessage.value = ''
    errorMessage.value = ''

    const response = await $fetch('/api/background/set-active', {
      method: 'POST',
      body: { backgroundId }
    })

    if (response.success) {
      successMessage.value = 'Background set as active!'
      await fetchBackgrounds()
    }

  } catch (error) {
    console.error('Set active error:', error)
    errorMessage.value = error.data?.message || 'Failed to set background as active'
  } finally {
    settingActive.value = false
  }
}

const deleteBackground = async (backgroundId) => {
  if (!confirm('Are you sure you want to delete this background image? This action cannot be undone.')) {
    return
  }

  try {
    deleting.value = true
    successMessage.value = ''
    errorMessage.value = ''

    const response = await $fetch('/api/background/delete', {
      method: 'POST',
      body: { backgroundId }
    })

    if (response.success) {
      successMessage.value = 'Background image deleted successfully!'
      await fetchBackgrounds()
    }

  } catch (error) {
    console.error('Delete error:', error)
    errorMessage.value = error.data?.message || 'Failed to delete background'
  } finally {
    deleting.value = false
  }
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Clear messages after 5 seconds
watch([successMessage, errorMessage], () => {
  setTimeout(() => {
    successMessage.value = ''
    errorMessage.value = ''
  }, 5000)
})

// Load data on mount
onMounted(() => {
  fetchWebDAVStatus()
  fetchBackgrounds()
})
</script>

<style scoped>
.background-page {
  max-width: 1200px;
  margin: 0 auto;
}

.page-header h1 {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--text-color);
  margin-bottom: 0.5rem;
}

.page-header p {
  font-size: 0.95rem;
  color: var(--text-muted-color);
  margin-bottom: 1.5rem;
}

.upload-info {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  background: #f8faff;
  border-radius: var(--border-radius);
  border: 1px solid #e3f2fd;
}

.info-icon {
  width: 2rem;
  height: 2rem;
  color: var(--primary-color);
  flex-shrink: 0;
}

.info-content h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-color);
}

.info-content ul {
  margin: 0;
  padding-left: 1.25rem;
  color: var(--text-muted-color);
  font-size: 0.875rem;
}

.info-content li {
  margin-bottom: 0.25rem;
}

.storage-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  padding: 0.25rem 0;
}

.webdav-info {
  color: #1976d2;
}

.local-info {
  color: #f57c00;
}

.storage-status {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: #f8faff;
  border-radius: var(--border-radius);
  border: 1px solid #e3f2fd;
}

.status-header {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.status-icon {
  width: 2rem;
  height: 2rem;
  color: var(--primary-color);
  flex-shrink: 0;
}

.status-header h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-color);
}

.status-header p {
  margin: 0;
  font-size: 0.875rem;
  color: var(--text-muted-color);
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: var(--border-radius);
  font-weight: 500;
  font-size: 0.875rem;
}

.status-webdav {
  background-color: #e6f3ff;
  color: #1976d2;
  border: 1px solid #b3d9ff;
  font-weight: 600;
}

.status-local {
  background-color: #fff3e0;
  color: #f57c00;
  border: 1px solid #ffcc80;
  font-weight: 600;
}

.header-actions {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.storage-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
  margin-top: 0.5rem;
}

.storage-webdav {
  background-color: #e6f3ff;
  color: #1976d2;
  border: 1px solid #b3d9ff;
  font-weight: 600;
}

.storage-local {
  background-color: #fff3e0;
  color: #f57c00;
  border: 1px solid #ffcc80;
  font-weight: 600;
}

.alert {
  padding: 0.75rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
}

.alert-success {
  background-color: #f0f9f0;
  color: #22c55e;
  border: 1px solid #bbf7d0;
}

.alert-error {
  background-color: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
}

.backgrounds-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-top: 2rem;
}

.background-card {
  background: white;
  border: 2px solid var(--border-color);
  border-radius: var(--border-radius);
  overflow: hidden;
  transition: all 0.2s ease;
}

.background-card:hover {
  border-color: var(--primary-color);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.background-card.active {
  border-color: var(--success-color);
  box-shadow: 0 4px 12px rgba(34, 197, 94, 0.2);
}

.background-preview {
  position: relative;
  height: 200px;
  overflow: hidden;
}

.background-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.active-badge {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  background: var(--success-color);
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 15px;
  font-size: 0.75rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.background-info {
  padding: 1rem;
}

.background-info h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-color);
  word-break: break-word;
}

.upload-details {
  margin: 0 0 1rem 0;
  font-size: 0.75rem;
  color: var(--text-muted-color);
}

.background-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-sm {
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
}

.btn-danger {
  background-color: var(--danger-color);
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background-color: #dc2626;
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: var(--text-muted-color);
}

.empty-icon {
  width: 4rem;
  height: 4rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.empty-state h3 {
  margin-bottom: 0.5rem;
  color: var(--text-color);
}

.loading-state {
  text-align: center;
  padding: 3rem;
  color: var(--text-muted-color);
}

.loading-icon {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .backgrounds-grid {
    grid-template-columns: 1fr;
  }
  
  .upload-info {
    flex-direction: column;
    text-align: center;
  }
  
  .background-actions {
    flex-direction: column;
  }
  
  .background-actions .btn {
    width: 100%;
  }
}

/* Toggle Switch Styles */
.storage-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.switch {
  position: relative;
  display: inline-block;
  width: 40px;
  height: 24px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  -webkit-transition: .4s;
  transition: .4s;
}

.slider:before {
  position: absolute;
  content: "";
  height: 16px;
  width: 16px;
  left: 4px;
  bottom: 4px;
  background-color: white;
  -webkit-transition: .4s;
  transition: .4s;
}

input:checked + .slider {
  background-color: var(--primary-color);
}

input:focus + .slider {
  box-shadow: 0 0 1px var(--primary-color);
}

input:checked + .slider:before {
  -webkit-transform: translateX(16px);
  -ms-transform: translateX(16px);
  transform: translateX(16px);
}

/* Rounded sliders */
.slider.round {
  border-radius: 24px;
}

.slider.round:before {
  border-radius: 50%;
}

.switch-label {
  font-size: 0.9rem;
  color: var(--text-color);
  font-weight: 500;
}
</style>
