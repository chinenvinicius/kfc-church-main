<template>
  <div class="excel-watcher-page">
    <!-- Page Header -->
    <div class="page-header">
      <div class="header-content">
        <div>
          <h1>Excel File Watcher</h1>
          <p>Automatically monitor and import Excel files when they change</p>
        </div>
        <div class="status-indicator">
          <span :class="['status-badge', config?.enabled ? 'enabled' : 'disabled']">
            <Icon :name="config?.enabled ? 'material-symbols:check-circle' : 'material-symbols:cancel'" />
            {{ config?.enabled ? 'Enabled' : 'Disabled' }}
          </span>
        </div>
      </div>
    </div>

    <!-- Configuration Card -->
    <div class="card">
      <div class="card-header">
        <h2 class="card-title">Watcher Configuration</h2>
        <button 
          @click="saveConfig" 
          class="btn btn-primary"
          :disabled="savingConfig"
        >
          <Icon v-if="savingConfig" name="material-symbols:refresh" class="loading-icon" />
          <Icon v-else name="material-symbols:save" />
          Save Configuration
        </button>
      </div>

      <div class="config-form">
        <div class="form-group">
          <label class="form-label">
            <input
              v-model="config.enabled"
              type="checkbox"
              class="form-checkbox"
            />
            Enable Excel File Watcher
          </label>
          <p class="form-help">
            When enabled, the system will monitor the Excel directory for file changes
          </p>
        </div>

        <div class="form-group">
          <label class="form-label">
            <input
              v-model="config.autoImport"
              type="checkbox"
              class="form-checkbox"
              :disabled="!config.enabled"
            />
            Auto-Import Changed Files
          </label>
          <p class="form-help">
            Automatically import Excel files when changes are detected
          </p>
        </div>

        <div class="form-group">
          <label class="form-label" for="watchInterval">
            Check Interval (seconds)
          </label>
          <input
            id="watchInterval"
            v-model.number="config.watchInterval"
            type="number"
            min="10"
            max="300"
            class="form-input"
            :disabled="!config.enabled"
          />
          <p class="form-help">
            How often to check for file changes (minimum 10 seconds)
          </p>
        </div>

        <div class="form-group">
          <label class="form-label" for="watchDirectory">
            Watch Directory
          </label>
          <input
            id="watchDirectory"
            v-model="config.watchDirectory"
            type="text"
            class="form-input"
            :disabled="!config.enabled"
          />
          <p class="form-help">
            Directory to monitor for Excel files
          </p>
        </div>
      </div>
    </div>

    <!-- Manual Actions -->
    <div class="card">
      <div class="card-header">
        <h2 class="card-title">Manual Actions</h2>
      </div>

      <div class="action-buttons">
        <button 
          @click="triggerManualCheck" 
          class="btn btn-secondary"
          :disabled="checkingFiles"
        >
          <Icon v-if="checkingFiles" name="material-symbols:refresh" class="loading-icon" />
          <Icon v-else name="material-symbols:search" />
          Check for Changes Now
        </button>

        <button 
          @click="loadExcelFiles" 
          class="btn btn-outline"
        >
          <Icon name="material-symbols:folder-open" />
          Refresh File List
        </button>
      </div>
    </div>

    <!-- Excel Files List -->
    <div class="card">
      <div class="card-header">
        <h2 class="card-title">Excel Files</h2>
        <span class="file-count">{{ excelFiles.length }} files found</span>
      </div>

      <div v-if="loadingFiles" class="loading-state">
        <Icon name="material-symbols:refresh" class="loading-icon" />
        <p>Loading Excel files...</p>
      </div>

      <div v-else-if="excelFiles.length === 0" class="empty-state">
        <Icon name="material-symbols:folder-open" class="empty-icon" />
        <h3>No Excel files found</h3>
        <p>Upload Excel files to the server directory to monitor them</p>
      </div>

      <div v-else class="files-list">
        <div 
          v-for="file in excelFiles" 
          :key="file.name"
          class="file-item"
        >
          <div class="file-info">
            <Icon name="material-symbols:table-chart" class="file-icon" />
            <div class="file-details">
              <strong>{{ file.name }}</strong>
              <small>{{ formatFileSize(file.size) }} • {{ formatDate(file.modified) }}</small>
            </div>
          </div>
          <div class="file-actions">
            <button 
              @click="importFile(file.name)"
              class="btn btn-sm btn-primary"
              :disabled="importingFile === file.name"
            >
              <Icon v-if="importingFile === file.name" name="material-symbols:refresh" class="loading-icon" />
              <Icon v-else name="material-symbols:upload" />
              Import
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Recent Updates -->
    <div class="card">
      <div class="card-header">
        <h2 class="card-title">Recent Updates</h2>
        <button @click="clearUpdates" class="btn btn-sm btn-outline">
          Clear
        </button>
      </div>

      <div v-if="recentUpdates.length === 0" class="empty-state">
        <Icon name="material-symbols:history" class="empty-icon" />
        <p>No recent updates</p>
      </div>

      <div v-else class="updates-list">
        <div 
          v-for="update in recentUpdates" 
          :key="update.timestamp"
          class="update-item"
        >
          <div class="update-info">
            <Icon :name="getUpdateIcon(update.type)" class="update-icon" />
            <div class="update-details">
              <strong>{{ getUpdateTitle(update.type) }}</strong>
              <p>{{ getUpdateMessage(update) }}</p>
              <small>{{ formatDate(update.timestamp) }}</small>
            </div>
          </div>
          <div class="update-status">
            <span :class="['status-badge', update.success ? 'success' : 'error']">
              {{ update.success ? 'Success' : 'Error' }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Toast Notification -->
    <div v-if="toast.show" :class="['toast', toast.type]">
      <Icon :name="toast.icon" />
      <span>{{ toast.message }}</span>
      <button @click="hideToast" class="toast-close">
        <Icon name="material-symbols:close" />
      </button>
    </div>
  </div>
</template>

<script setup>
// Page metadata
useHead({
  title: 'Excel Watcher - KFC Church Attendance System'
})

// Reactive data
const config = ref({
  enabled: false,
  autoImport: false,
  watchInterval: 30,
  watchDirectory: '/server/excel'
})

const excelFiles = ref([])
const recentUpdates = ref([])
const loadingFiles = ref(false)
const savingConfig = ref(false)
const checkingFiles = ref(false)
const importingFile = ref(null)

// Toast notification
const toast = ref({
  show: false,
  message: '',
  type: 'success',
  icon: 'material-symbols:check-circle'
})

// Update polling
const lastCheck = ref(new Date().toISOString())
let updatePollingInterval = null

// Methods
const loadConfig = async () => {
  try {
    const response = await $fetch('/api/excel-watcher/config')
    config.value = response.config
  } catch (error) {
    console.error('Failed to load Excel watcher config:', error)
    showToast('Failed to load configuration', 'error')
  }
}

const saveConfig = async () => {
  try {
    savingConfig.value = true
    
    const response = await $fetch('/api/excel-watcher/config', {
      method: 'POST',
      body: config.value
    })
    
    if (response.success) {
      showToast('Configuration saved successfully', 'success')
      addUpdate({
        type: 'config_update',
        success: true,
        timestamp: new Date().toISOString(),
        message: 'Watcher configuration updated'
      })
    }
  } catch (error) {
    console.error('Failed to save Excel watcher config:', error)
    showToast('Failed to save configuration', 'error')
  } finally {
    savingConfig.value = false
  }
}

const loadExcelFiles = async () => {
  try {
    loadingFiles.value = true
    
    const response = await $fetch('/api/excel/files')
    excelFiles.value = response.files || []
  } catch (error) {
    console.error('Failed to load Excel files:', error)
    showToast('Failed to load Excel files', 'error')
  } finally {
    loadingFiles.value = false
  }
}

const triggerManualCheck = async () => {
  try {
    checkingFiles.value = true
    
    const response = await $fetch('/api/excel-watcher/check', {
      method: 'POST'
    })
    
    if (response.success) {
      showToast(response.message, 'success')
      addUpdate({
        type: 'manual_check',
        success: true,
        timestamp: new Date().toISOString(),
        message: response.message
      })
    } else {
      showToast(response.message, 'error')
      addUpdate({
        type: 'manual_check',
        success: false,
        timestamp: new Date().toISOString(),
        message: response.message
      })
    }
    
    // Refresh files list after check
    await loadExcelFiles()
  } catch (error) {
    console.error('Failed to trigger manual check:', error)
    showToast('Failed to check for changes', 'error')
  } finally {
    checkingFiles.value = false
  }
}

const importFile = async (filename) => {
  try {
    importingFile.value = filename
    
    const response = await $fetch('/api/excel/import', {
      method: 'POST',
      body: {
        filename,
        overwrite: true,
        validateMembers: true
      }
    })
    
    if (response.success) {
      showToast(`Successfully imported ${filename}`, 'success')
      addUpdate({
        type: 'file_import',
        success: true,
        timestamp: new Date().toISOString(),
        filename,
        results: response.results,
        message: `Imported ${response.results.imported} new, updated ${response.results.updated} records`
      })
    } else {
      showToast(`Failed to import ${filename}`, 'error')
      addUpdate({
        type: 'file_import',
        success: false,
        timestamp: new Date().toISOString(),
        filename,
        message: response.message
      })
    }
  } catch (error) {
    console.error('Failed to import file:', error)
    showToast(`Failed to import ${filename}`, 'error')
  } finally {
    importingFile.value = null
  }
}

const checkForUpdates = async () => {
  try {
    const response = await $fetch(`/api/updates/notifications?lastCheck=${lastCheck.value}`)
    
    if (response.hasUpdates && response.notifications.length > 0) {
      response.notifications.forEach(notification => {
        addUpdate({
          type: notification.type,
          success: true,
          timestamp: notification.timestamp,
          filename: notification.filename,
          results: notification.results,
          message: `Auto-imported: ${notification.filename}`
        })
        
        showToast(`Excel file updated: ${notification.filename}`, 'info')
      })
      
      lastCheck.value = response.timestamp
    }
  } catch (error) {
    console.error('Failed to check for updates:', error)
  }
}

const addUpdate = (update) => {
  recentUpdates.value.unshift(update)
  if (recentUpdates.value.length > 10) {
    recentUpdates.value = recentUpdates.value.slice(0, 10)
  }
}

const clearUpdates = () => {
  recentUpdates.value = []
}

const showToast = (message, type = 'success') => {
  toast.value = {
    show: true,
    message,
    type,
    icon: type === 'success' ? 'material-symbols:check-circle' : 
          type === 'error' ? 'material-symbols:error' : 
          'material-symbols:info'
  }
  
  setTimeout(() => {
    hideToast()
  }, 3000)
}

const hideToast = () => {
  toast.value.show = false
}

// Utility functions
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleString()
}

const getUpdateIcon = (type) => {
  switch (type) {
    case 'excel_import': return 'material-symbols:upload'
    case 'config_update': return 'material-symbols:settings'
    case 'manual_check': return 'material-symbols:search'
    case 'file_import': return 'material-symbols:table-chart'
    default: return 'material-symbols:info'
  }
}

const getUpdateTitle = (type) => {
  switch (type) {
    case 'excel_import': return 'Auto Import'
    case 'config_update': return 'Configuration Update'
    case 'manual_check': return 'Manual Check'
    case 'file_import': return 'File Import'
    default: return 'Update'
  }
}

const getUpdateMessage = (update) => {
  if (update.message) return update.message
  if (update.filename) return `File: ${update.filename}`
  if (update.results) {
    return `Imported: ${update.results.imported}, Updated: ${update.results.updated}`
  }
  return 'No details available'
}

// Lifecycle
onMounted(async () => {
  await loadConfig()
  await loadExcelFiles()
  
  // Start polling for updates every 5 seconds
  updatePollingInterval = setInterval(checkForUpdates, 5000)
})

onUnmounted(() => {
  if (updatePollingInterval) {
    clearInterval(updatePollingInterval)
  }
})
</script>

<style scoped>
.page-header {
  margin-bottom: 2rem;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.status-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 500;
}

.status-badge.enabled {
  background: #d4edda;
  color: #155724;
}

.status-badge.disabled {
  background: #f8d7da;
  color: #721c24;
}

.status-badge.success {
  background: #d4edda;
  color: #155724;
}

.status-badge.error {
  background: #f8d7da;
  color: #721c24;
}

.config-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
  color: var(--text-color);
}

.form-checkbox {
  width: 1rem;
  height: 1rem;
}

.form-input {
  padding: 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  font-size: 1rem;
}

.form-input:disabled {
  background: #f8f9fa;
  color: var(--text-muted-color);
}

.form-help {
  font-size: 0.875rem;
  color: var(--text-muted-color);
  margin: 0;
}

.action-buttons {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.file-count {
  font-size: 0.9rem;
  color: var(--text-muted-color);
}

.files-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.file-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  background: #f8f9fa;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.file-icon {
  width: 2rem;
  height: 2rem;
  color: var(--primary-color);
}

.file-details {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.file-details strong {
  color: var(--text-color);
}

.file-details small {
  color: var(--text-muted-color);
}

.updates-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.update-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 1rem;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
}

.update-info {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  flex: 1;
}

.update-icon {
  width: 1.5rem;
  height: 1.5rem;
  color: var(--primary-color);
  margin-top: 0.25rem;
}

.update-details {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
}

.update-details strong {
  color: var(--text-color);
}

.update-details p {
  margin: 0;
  color: var(--text-muted-color);
  font-size: 0.9rem;
}

.update-details small {
  color: var(--text-muted-color);
}

.toast {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  border-radius: var(--border-radius);
  color: white;
  font-weight: 500;
  z-index: 1000;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.toast.success {
  background: var(--success-color);
}

.toast.error {
  background: var(--danger-color);
}

.toast.info {
  background: var(--primary-color);
}

.toast-close {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: var(--border-radius);
}

.loading-icon {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }

  .action-buttons {
    flex-direction: column;
  }

  .file-item {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }

  .file-actions {
    align-self: stretch;
  }

  .update-item {
    flex-direction: column;
    gap: 1rem;
  }

  .toast {
    bottom: 1rem;
    right: 1rem;
    left: 1rem;
  }
}
</style>