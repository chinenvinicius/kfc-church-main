<template>
  <div class="webdav-page">
    <!-- Page Header -->
    <div class="page-header">
      <div class="header-content">
        <div>
          <h1>WebDAV Storage Settings</h1>
          <p>Configure external WebDAV storage for background images</p>
        </div>
        <div class="header-actions">
          <button 
            @click="testConnection" 
            class="btn btn-secondary"
            :disabled="testing || !canTest"
          >
            <Icon v-if="testing" name="material-symbols:progress-activity" class="loading-icon" />
            <Icon v-else name="material-symbols:wifi-protected-setup" />
            {{ testing ? 'Testing...' : 'Test Connection' }}
          </button>
          <button 
            @click="saveConfig" 
            class="btn btn-primary"
            :disabled="saving || !isFormValid"
          >
            <Icon v-if="saving" name="material-symbols:progress-activity" class="loading-icon" />
            <Icon v-else name="material-symbols:save" />
            {{ saving ? 'Saving...' : 'Save Settings' }}
          </button>
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

    <!-- WebDAV Configuration Form -->
    <div class="config-card">
      <div class="card-header">
        <h2>WebDAV Server Configuration</h2>
        <p>Configure your Infinicloud WebDAV server settings</p>
      </div>

      <form @submit.prevent="saveConfig" class="config-form">
        <!-- Enable WebDAV -->
        <div class="form-group">
          <label class="checkbox-label">
            <input 
              v-model="config.enabled" 
              type="checkbox" 
              class="checkbox-input"
            />
            <span class="checkbox-custom"></span>
            Enable WebDAV Storage
          </label>
          <p class="form-help">When enabled, background images will be stored on the WebDAV server instead of locally</p>
        </div>

        <!-- Server URL -->
        <div class="form-group">
          <label for="serverUrl" class="form-label">
            <Icon name="material-symbols:cloud" />
            WebDAV Server URL
          </label>
          <input
            id="serverUrl"
            v-model="config.serverUrl"
            type="url"
            class="form-input"
            :class="{ 'error': errors.serverUrl }"
            placeholder="https://mori.teracloud.jp/dav/"
            required
          />
          <span v-if="errors.serverUrl" class="error-message">{{ errors.serverUrl }}</span>
          <p class="form-help">Your Infinicloud WebDAV server URL</p>
        </div>

        <!-- Username -->
        <div class="form-group">
          <label for="username" class="form-label">
            <Icon name="material-symbols:person" />
            Account Username
          </label>
          <input
            id="username"
            v-model="config.username"
            type="text"
            class="form-input"
            :class="{ 'error': errors.username }"
            placeholder="Your WebDAV username"
            required
            autocomplete="username"
          />
          <span v-if="errors.username" class="error-message">{{ errors.username }}</span>
        </div>

        <!-- Password -->
        <div class="form-group">
          <label for="password" class="form-label">
            <Icon name="material-symbols:lock" />
            Password
          </label>
          <div class="password-input-group">
            <input
              id="password"
              v-model="userPassword"
              :type="showPassword ? 'text' : 'password'"
              class="form-input"
              :class="{ 'error': errors.password }"
              placeholder="Your WebDAV password"
              required
              autocomplete="new-password"
            />
            <button
              type="button"
              @click="togglePassword"
              class="password-toggle"
              :title="showPassword ? 'Hide password' : 'Show password'"
            >
              <Icon :name="showPassword ? 'material-symbols:visibility-off' : 'material-symbols:visibility'" />
            </button>
          </div>
          <span v-if="errors.password" class="error-message">{{ errors.password }}</span>
          <div class="password-options">
            <label class="checkbox-label">
              <input
                v-model="showPassword"
                type="checkbox"
                class="checkbox-input"
              />
              <span class="checkbox-custom"></span>
              Keep password visible while typing
            </label>
          </div>
        </div>

        <!-- Email -->
        <div class="form-group">
          <label for="email" class="form-label">
            <Icon name="material-symbols:email" />
            Account Email
          </label>
          <input
            id="email"
            v-model="config.email"
            type="email"
            class="form-input"
            placeholder="your-email@example.com"
            autocomplete="email"
          />
          <p class="form-help">Email address associated with this WebDAV account</p>
        </div>

        <!-- Storage Quota -->
        <div class="form-group">
          <label for="storageQuota" class="form-label">
            <Icon name="material-symbols:storage" />
            Storage Quota
          </label>
          <input
            id="storageQuota"
            v-model="config.storageQuota"
            type="text"
            class="form-input"
            placeholder="e.g., 10GB, 1TB"
          />
          <p class="form-help">Total storage capacity of your WebDAV account</p>
        </div>

        <!-- Base Path -->
        <div class="form-group">
          <label for="basePath" class="form-label">
            <Icon name="material-symbols:folder" />
            Base Path
          </label>
          <input
            id="basePath"
            v-model="config.basePath"
            type="text"
            class="form-input"
            placeholder="/backgrounds"
          />
          <p class="form-help">Directory path on the WebDAV server where background images will be stored</p>
        </div>
      </form>
    </div>

    <!-- Connection Status -->
    <div v-if="config.lastTested" class="status-card">
      <div class="status-header">
        <h3>Connection Status</h3>
        <div class="status-indicator" :class="statusClass">
          <Icon :name="statusIcon" />
          {{ statusText }}
        </div>
      </div>
      <div class="status-details">
        <p><strong>Last Tested:</strong> {{ formatDate(config.lastTested) }}</p>
        <p v-if="config.lastUpdated"><strong>Last Updated:</strong> {{ formatDate(config.lastUpdated) }}</p>
      </div>
    </div>

    <!-- Storage Quota Information -->
    <div v-if="config.enabled && config.connectionStatus === 'connected'" class="quota-card">
      <div class="card-header">
        <h3>
          <Icon name="material-symbols:storage" />
          Storage Information
        </h3>
        <button
          @click="fetchQuota"
          class="btn btn-secondary btn-sm"
          :disabled="loadingQuota"
        >
          <Icon v-if="loadingQuota" name="material-symbols:progress-activity" class="loading-icon" />
          <Icon v-else name="material-symbols:refresh" />
          {{ loadingQuota ? 'Loading...' : 'Refresh' }}
        </button>
      </div>

      <div v-if="quotaInfo" class="quota-details">
        <div v-if="quotaInfo.totalQuotaFormatted !== 'Not available'" class="quota-summary">
          <div class="quota-item">
            <span class="quota-label">Total Storage:</span>
            <span class="quota-value">{{ quotaInfo.totalQuotaFormatted }}</span>
          </div>
          <div class="quota-item">
            <span class="quota-label">Used:</span>
            <span class="quota-value">{{ quotaInfo.quotaUsedFormatted }}</span>
          </div>
          <div class="quota-item">
            <span class="quota-label">Available:</span>
            <span class="quota-value">{{ quotaInfo.quotaAvailableFormatted }}</span>
          </div>
          <div v-if="quotaInfo.usagePercentage !== null" class="quota-progress">
            <div class="progress-bar">
              <div
                class="progress-fill"
                :style="{ width: quotaInfo.usagePercentage + '%' }"
                :class="{
                  'progress-warning': quotaInfo.usagePercentage > 80,
                  'progress-danger': quotaInfo.usagePercentage > 95
                }"
              ></div>
            </div>
            <span class="progress-text">{{ quotaInfo.usagePercentage }}% used</span>
          </div>
        </div>
        <div v-else class="quota-unavailable">
          <Icon name="material-symbols:info" />
          <p>{{ quotaInfo.message || 'Storage quota information is not available for this server.' }}</p>
        </div>
      </div>

      <div v-else class="quota-placeholder">
        <p>Click "Refresh" to load storage information</p>
      </div>
    </div>

    <!-- Migration Tools -->
    <div v-if="config.enabled && config.connectionStatus === 'connected'" class="migration-card">
      <div class="card-header">
        <h3>Migration Tools</h3>
        <p>Fix existing WebDAV images to display properly</p>
      </div>
      <div class="migration-actions">
        <button
          @click="migrateUrls"
          class="btn btn-secondary"
          :disabled="migrating"
        >
          <Icon v-if="migrating" name="material-symbols:progress-activity" class="loading-icon" />
          <Icon v-else name="material-symbols:sync" />
          {{ migrating ? 'Migrating...' : 'Fix Image URLs' }}
        </button>
        <p class="migration-help">
          Click this if existing WebDAV images are not displaying properly. This will update the URLs to use the image proxy.
        </p>
      </div>
    </div>

    <!-- Help Section -->
    <div class="help-card">
      <h3>
        <Icon name="material-symbols:help" />
        Setup Instructions
      </h3>
      <ol class="help-list">
        <li>Enter your Infinicloud WebDAV server URL (e.g., https://mori.teracloud.jp/dav/)</li>
        <li>Provide your WebDAV account username and password</li>
        <li>Optionally customize the base path where images will be stored</li>
        <li>Click "Test Connection" to verify the settings</li>
        <li>Enable WebDAV storage and save the configuration</li>
      </ol>
      <div class="help-note">
        <Icon name="material-symbols:info" />
        <p>When WebDAV storage is enabled, all new background images will be uploaded to your external server. Existing local images will remain accessible.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
// Page metadata
useHead({
  title: 'WebDAV Settings - KFC Church Attendance System'
})

// Reactive data
const loading = ref(true)
const saving = ref(false)
const testing = ref(false)
const migrating = ref(false)
const loadingQuota = ref(false)
const showPassword = ref(false)
const successMessage = ref('')
const errorMessage = ref('')
const errors = ref({})
const userPassword = ref('') // Store user's actual password separately
const quotaInfo = ref(null)

const config = ref({
  enabled: false,
  serverUrl: '',
  username: '',
  password: '',
  email: '',
  storageQuota: '',
  basePath: '/backgrounds',
  lastUpdated: null,
  lastTested: null,
  connectionStatus: 'untested'
})

// Computed properties
const isFormValid = computed(() => {
  return config.value.serverUrl.trim() &&
         config.value.username.trim() &&
         userPassword.value.trim()
})

const canTest = computed(() => {
  return isFormValid.value && !testing.value
})

const statusClass = computed(() => {
  switch (config.value.connectionStatus) {
    case 'connected': return 'status-success'
    case 'failed': return 'status-error'
    default: return 'status-neutral'
  }
})

const statusIcon = computed(() => {
  switch (config.value.connectionStatus) {
    case 'connected': return 'material-symbols:check-circle'
    case 'failed': return 'material-symbols:error'
    default: return 'material-symbols:help'
  }
})

const statusText = computed(() => {
  switch (config.value.connectionStatus) {
    case 'connected': return 'Connected'
    case 'failed': return 'Connection Failed'
    default: return 'Not Tested'
  }
})

// Methods
const fetchConfig = async () => {
  try {
    loading.value = true
    const response = await $fetch('/api/webdav/config')

    // Update config from server
    config.value = { ...config.value, ...response.data }

    // Try to restore password from localStorage if available
    const savedPassword = localStorage.getItem('webdav-password')
    if (savedPassword && !userPassword.value) {
      userPassword.value = savedPassword
    } else if (!userPassword.value && response.data.password !== '***') {
      userPassword.value = response.data.password || ''
    }
  } catch (error) {
    console.error('Error fetching WebDAV config:', error)
    errorMessage.value = 'Failed to load WebDAV configuration'
  } finally {
    loading.value = false
  }
}

const validateForm = () => {
  errors.value = {}
  
  if (!config.value.serverUrl.trim()) {
    errors.value.serverUrl = 'Server URL is required'
  } else {
    try {
      new URL(config.value.serverUrl)
    } catch {
      errors.value.serverUrl = 'Invalid URL format'
    }
  }
  
  if (!config.value.username.trim()) {
    errors.value.username = 'Username is required'
  }
  
  if (!userPassword.value.trim()) {
    errors.value.password = 'Password is required'
  }
  
  return Object.keys(errors.value).length === 0
}

const saveConfig = async () => {
  if (!validateForm()) {
    return
  }

  try {
    saving.value = true
    successMessage.value = ''
    errorMessage.value = ''

    console.log('Saving WebDAV config:', {
      enabled: config.value.enabled,
      serverUrl: config.value.serverUrl.trim(),
      username: config.value.username.trim(),
      email: config.value.email.trim(),
      storageQuota: config.value.storageQuota.trim(),
      basePath: config.value.basePath.trim() || '/backgrounds'
    })

    const response = await $fetch('/api/webdav/config', {
      method: 'POST',
      body: {
        enabled: config.value.enabled,
        serverUrl: config.value.serverUrl.trim(),
        username: config.value.username.trim(),
        password: userPassword.value,
        email: config.value.email.trim(),
        storageQuota: config.value.storageQuota.trim(),
        basePath: config.value.basePath.trim() || '/backgrounds'
      }
    })

    // Save password to localStorage for persistence
    if (userPassword.value) {
      localStorage.setItem('webdav-password', userPassword.value)
    }

    console.log('Save response:', response)

    if (response.success) {
      // Update config but keep the user's password visible
      config.value = { ...config.value, ...response.data }
      // userPassword stays as-is, never gets overwritten
      successMessage.value = 'WebDAV configuration saved successfully!'
    }

  } catch (error) {
    console.error('Save error:', error)
    errorMessage.value = error.data?.message || error.message || 'Failed to save WebDAV configuration'
  } finally {
    saving.value = false
  }
}

const testConnection = async () => {
  if (!validateForm()) {
    return
  }

  try {
    testing.value = true
    successMessage.value = ''
    errorMessage.value = ''

    console.log('Testing WebDAV connection...')

    // Save config first if it's not saved
    await saveConfig()

    const response = await $fetch('/api/webdav/test', {
      method: 'POST'
    })

    console.log('Test response:', response)

    if (response.success) {
      successMessage.value = 'WebDAV connection test successful!'
      config.value.connectionStatus = 'connected'
      config.value.lastTested = response.timestamp
    } else {
      errorMessage.value = response.message || 'Connection test failed'
      config.value.connectionStatus = 'failed'
      config.value.lastTested = response.timestamp
    }

  } catch (error) {
    console.error('Test error:', error)
    let errorMsg = 'Failed to test WebDAV connection'

    if (error.data?.message) {
      errorMsg = error.data.message
    } else if (error.message) {
      errorMsg = error.message
    } else if (error.statusText) {
      errorMsg = `HTTP ${error.status}: ${error.statusText}`
    }

    errorMessage.value = errorMsg
    config.value.connectionStatus = 'failed'
    config.value.lastTested = new Date().toISOString()
  } finally {
    testing.value = false
  }
}

const togglePassword = () => {
  showPassword.value = !showPassword.value
}

const migrateUrls = async () => {
  try {
    migrating.value = true
    successMessage.value = ''
    errorMessage.value = ''

    const response = await $fetch('/api/webdav/migrate-urls', {
      method: 'POST'
    })

    if (response.success) {
      successMessage.value = `${response.message}. ${response.updated} images updated.`
    }

  } catch (error) {
    console.error('Migration error:', error)
    errorMessage.value = error.data?.message || 'Failed to migrate image URLs'
  } finally {
    migrating.value = false
  }
}

const fetchQuota = async () => {
  try {
    loadingQuota.value = true

    const response = await $fetch('/api/webdav/quota')

    if (response.success) {
      quotaInfo.value = response.data
    }

  } catch (error) {
    console.error('Quota fetch error:', error)

    let errorMessage = 'Failed to load storage information'

    if (error.status === 401) {
      errorMessage = 'Session expired. Please refresh the page and log in again.'
    } else if (error.data?.message) {
      errorMessage = error.data.message
    }

    quotaInfo.value = {
      message: errorMessage
    }

    // Show error in the main error message area too
    if (error.status === 401) {
      errorMessage.value = 'Your session has expired. Please refresh the page and log in again.'
    }
  } finally {
    loadingQuota.value = false
  }
}

const formatDate = (dateString) => {
  if (!dateString) return 'Never'
  return new Date(dateString).toLocaleString()
}

// Clear messages when form changes
watch([() => config.value.serverUrl, () => config.value.username, () => userPassword.value], () => {
  successMessage.value = ''
  errorMessage.value = ''
  errors.value = {}
})

// Load configuration on mount
onMounted(() => {
  fetchConfig()
})
</script>

<style scoped>
.password-options {
  margin-top: 0.5rem;
}

.password-options .checkbox-label {
  font-size: 0.875rem;
  color: var(--text-muted-color);
  font-weight: normal;
}

.password-toggle:hover {
  color: var(--primary-color);
}

.migration-card {
  background: var(--card-background);
  border-radius: var(--card-border-radius);
  padding: 1.5rem;
  border: 1px solid var(--border-color);
  margin-bottom: 2rem;
}

.migration-actions {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.migration-help {
  font-size: 0.875rem;
  color: var(--text-muted-color);
  margin: 0;
}

.quota-card {
  background: var(--card-background);
  border-radius: var(--card-border-radius);
  padding: 1.5rem;
  border: 1px solid var(--border-color);
  margin-bottom: 2rem;
}

.quota-card .card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.quota-card .card-header h3 {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0;
}

.quota-details {
  margin-top: 1rem;
}

.quota-summary {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.quota-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--border-color);
}

.quota-item:last-child {
  border-bottom: none;
}

.quota-label {
  font-weight: 500;
  color: var(--text-color);
}

.quota-value {
  font-weight: 600;
  color: var(--primary-color);
}

.quota-progress {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border-color);
}

.progress-bar {
  width: 100%;
  height: 8px;
  background-color: var(--border-color);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.progress-fill {
  height: 100%;
  background-color: var(--success-color);
  transition: width 0.3s ease;
}

.progress-fill.progress-warning {
  background-color: var(--warning-color);
}

.progress-fill.progress-danger {
  background-color: var(--error-color);
}

.progress-text {
  font-size: 0.875rem;
  color: var(--text-muted-color);
  text-align: center;
  display: block;
}

.quota-unavailable {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  background: var(--background-color);
  border-radius: var(--border-radius);
  color: var(--text-muted-color);
}

.quota-placeholder {
  text-align: center;
  padding: 2rem;
  color: var(--text-muted-color);
}

.btn-sm {
  padding: 0.375rem 0.75rem;
  font-size: 0.875rem;
}
</style>
