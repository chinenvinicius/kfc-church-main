<template>
  <div class="container">
    <h1>Google Sheets Integration</h1>
    <p class="description">
      Configure real-time synchronization of attendance data to Google Sheets
    </p>

    <div class="card">
      <h2>Configuration</h2>
      
      <form @submit.prevent="saveConfiguration" class="form">
        <div class="form-group">
          <label for="client_email">Service Account Email</label>
          <input
            id="client_email"
            v-model="config.client_email"
            type="email"
            placeholder="your-service-account@project.iam.gserviceaccount.com"
            class="form-control"
          />
          <small class="form-text">
            The client email from your Google Cloud service account JSON file
          </small>
        </div>

        <div class="form-group">
          <label for="private_key">Private Key</label>
          <textarea
            id="private_key"
            v-model="config.private_key"
            placeholder="-----BEGIN PRIVATE KEY-----&#10;...&#10;-----END PRIVATE KEY-----"
            class="form-control"
            rows="8"
          ></textarea>
          <small class="form-text">
            The entire private key from your service account JSON file, including the BEGIN/END lines
          </small>
        </div>

        <div class="form-group">
          <label for="spreadsheet_id">Spreadsheet ID</label>
          <input
            id="spreadsheet_id"
            v-model="config.spreadsheet_id"
            type="text"
            placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
            class="form-control"
          />
          <small class="form-text">
            The ID from your Google Sheet URL (between /d/ and /edit)
          </small>
        </div>

        <div class="form-group">
          <label class="checkbox-label">
            <input
              type="checkbox"
              v-model="config.enabled"
            />
            Enable Google Sheets Integration
          </label>
          <small class="form-text">
            When enabled, attendance data will automatically sync to Google Sheets
          </small>
        </div>
        
        <div class="form-group">
          <label class="checkbox-label">
            <input
              type="checkbox"
              v-model="config.autoImport"
              :disabled="!config.enabled"
            />
            Enable Automatic Import from Google Sheets
          </label>
          <small class="form-text">
            When enabled, changes from Google Sheets will automatically import every 1 minute
          </small>
        </div>

        <div class="form-actions">
          <button type="submit" class="btn btn-primary" :disabled="loading">
            {{ loading ? 'Saving...' : 'Save Configuration' }}
          </button>
          <button
            type="button"
            class="btn btn-secondary"
            @click="testConnection"
            :disabled="loading || !isConfigured"
          >
            {{ loading ? 'Testing...' : 'Test Connection' }}
          </button>
          <button
            type="button"
            class="btn btn-secondary"
            @click="listWorksheets"
            :disabled="loading || !isConfigured"
          >
            {{ loading ? 'Loading...' : 'List Worksheets' }}
          </button>
          <button
            type="button"
            class="btn btn-success"
            @click="syncNow"
            :disabled="loading || !config.enabled"
          >
            {{ loading ? 'Syncing...' : 'Sync Now' }}
          </button>
          <button
            type="button"
            class="btn btn-info"
            @click="syncFromSheets"
            :disabled="loading || !config.enabled"
          >
            {{ loading ? 'Importing...' : 'Import from Sheets' }}
          </button>
        </div>
      </form>
    </div>

    <!-- Status Messages -->
    <div v-if="message" :class="['alert', message.type]">
      {{ message.text }}
    </div>

    <!-- Connection Status -->
    <div v-if="connectionStatus" class="card">
      <h2>Connection Status</h2>
      <div class="status-item">
        <span class="status-label">Configured:</span>
        <span :class="['status-value', isConfigured ? 'status-success' : 'status-error']">
          {{ isConfigured ? 'Yes' : 'No' }}
        </span>
      </div>
      <div class="status-item">
        <span class="status-label">Enabled:</span>
        <span :class="['status-value', config.enabled ? 'status-success' : 'status-warning']">
          {{ config.enabled ? 'Yes' : 'No' }}
        </span>
      </div>
      <div v-if="lastConnectionTest" class="status-item">
        <span class="status-label">Last Test:</span>
        <span :class="['status-value', lastConnectionTest.success ? 'status-success' : 'status-error']">
          {{ lastConnectionTest.success ? 'Success' : 'Failed' }}
        </span>
      </div>
    </div>

    <!-- Worksheets List -->
    <div v-if="worksheets.length > 0" class="card">
      <h2>Available Worksheets</h2>
      <ul class="worksheets-list">
        <li v-for="sheet in worksheets" :key="sheet" class="worksheet-item">
          {{ sheet }}
        </li>
      </ul>
    </div>

    <!-- Help Section -->
    <div class="card">
      <h2>Setup Instructions</h2>
      <ol class="instructions">
        <li>Create a Google Cloud Project and enable the Google Sheets API</li>
        <li>Create a Service Account and download the JSON credentials</li>
        <li>Create a Google Sheet and share it with your service account email</li>
        <li>Copy the Spreadsheet ID from the URL</li>
        <li>Enter all configuration details above and click "Save Configuration"</li>
        <li>Click "Test Connection" to verify everything is working</li>
        <li>Enable the integration to start automatic syncing</li>
      </ol>
      
      <h3>Bidirectional Sync</h3>
      <ul class="instructions">
        <li><strong>Sync Now</strong> - Pushes attendance data from the system to Google Sheets</li>
        <li><strong>Import from Sheets</strong> - Pulls changes from Google Sheets back to the system</li>
        <li><strong>Automatic Import</strong> - When enabled, automatically imports changes every 1 minute</li>
        <li>You can edit attendance status and notes directly in Google Sheets</li>
        <li>Changes made in Google Sheets will be imported automatically or when you click "Import from Sheets"</li>
        <li>Each Sabbath date creates a separate worksheet organized by members and visitors</li>
      </ul>
      
      <p>
        <strong>Need help?</strong> Check the <a href="/GOOGLE_SHEETS_SETUP.md" target="_blank">detailed setup guide</a>.
      </p>
    </div>
  </div>
</template>

<script setup>
// Reactive data
const config = ref({
  client_email: '',
  private_key: '',
  spreadsheet_id: '',
  enabled: false,
  autoImport: false
})

const loading = ref(false)
const message = ref(null)
const connectionStatus = ref(null)
const lastConnectionTest = ref(null)
const worksheets = ref([])

// Computed properties
const isConfigured = computed(() => {
  return config.value.client_email && 
         config.value.private_key && 
         config.value.spreadsheet_id
})

// Methods
const loadConfiguration = async () => {
  try {
    const response = await $fetch('/api/google-sheets/config')
    if (response.success) {
      // Keep the actual private key empty for security only if it was never configured
      config.value = {
        ...response.data,
        private_key: response.data.private_key === '***CONFIGURED***' ? config.value.private_key : response.data.private_key
      }
    }
  } catch (error) {
    showMessage('Failed to load configuration', 'error')
  }
}

const saveConfiguration = async () => {
  loading.value = true
  message.value = null
  
  try {
    // Only send the private key if it's been entered (not empty)
    const configToSave = {
      ...config.value,
      private_key: config.value.private_key || undefined
    }
    
    const response = await $fetch('/api/google-sheets/config', {
      method: 'POST',
      body: configToSave
    })
    
    if (response.success) {
      showMessage('Configuration saved successfully', 'success')
      
      if (response.connectionTest) {
        lastConnectionTest.value = response.connectionTest
        if (response.connectionTest.success) {
          showMessage('Connection test passed!', 'success')
        } else {
          showMessage(`Connection test failed: ${response.connectionTest.message}`, 'error')
        }
      }
    } else {
      showMessage('Failed to save configuration', 'error')
    }
  } catch (error) {
    showMessage(`Error: ${error.message}`, 'error')
  } finally {
    loading.value = false
  }
}

const testConnection = async () => {
  loading.value = true
  message.value = null
  
  try {
    const response = await $fetch('/api/google-sheets/test', {
      method: 'POST',
      body: { action: 'connection' }
    })
    
    lastConnectionTest.value = response
    
    if (response.success) {
      showMessage('Connection successful!', 'success')
    } else {
      showMessage(`Connection failed: ${response.message}`, 'error')
    }
  } catch (error) {
    showMessage(`Connection test failed: ${error.message}`, 'error')
  } finally {
    loading.value = false
  }
}

const listWorksheets = async () => {
  loading.value = true
  message.value = null
  
  try {
    const response = await $fetch('/api/google-sheets/test', {
      method: 'POST',
      body: { action: 'worksheets' }
    })
    
    if (response.success) {
      worksheets.value = response.sheets
      showMessage(`Found ${response.sheets.length} worksheets`, 'success')
    } else {
      showMessage(`Failed to list worksheets: ${response.message}`, 'error')
    }
  } catch (error) {
    showMessage(`Failed to list worksheets: ${error.message}`, 'error')
  } finally {
    loading.value = false
  }
}

const syncNow = async () => {
  loading.value = true
  message.value = null
  
  try {
    const response = await $fetch('/api/google-sheets/sync', {
      method: 'POST',
      body: {}
    })
    
    if (response.success) {
      showMessage(response.message, 'success')
    } else {
      showMessage(`Sync failed: ${response.message}`, 'error')
    }
  } catch (error) {
    showMessage(`Sync failed: ${error.message}`, 'error')
  } finally {
    loading.value = false
  }
}

const syncFromSheets = async () => {
  loading.value = true
  message.value = null
  
  try {
    const response = await $fetch('/api/google-sheets/sync-from', {
      method: 'POST',
      body: {}
    })
    
    if (response.success) {
      let messageText = response.message
      if (response.results) {
        messageText += ` (Created: ${response.results.created}, Updated: ${response.results.updated})`
        if (response.results.errors > 0) {
          messageText += ` (Errors: ${response.results.errors})`
        }
      }
      showMessage(messageText, 'success')
    } else {
      showMessage(`Import failed: ${response.message}`, 'error')
    }
  } catch (error) {
    showMessage(`Import failed: ${error.message}`, 'error')
  } finally {
    loading.value = false
  }
}

const showMessage = (text, type) => {
  message.value = { text, type }
  setTimeout(() => {
    message.value = null
  }, 5000)
}

// Load configuration on mount
onMounted(() => {
  loadConfiguration()
})
</script>

<style scoped>
.container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.description {
  color: #666;
  margin-bottom: 30px;
  font-style: italic;
}

.card {
  background: #f9f9f9;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.form-group label {
  font-weight: bold;
  color: #333;
}

.form-control {
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 14px;
}

.form-control:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

.form-text {
  font-size: 12px;
  color: #666;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: normal;
}

.checkbox-label input[type="checkbox"] {
  margin: 0;
}

.form-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: bold;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: #007bff;
  color: white;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-success {
  background: #28a745;
  color: white;
}

.btn-info {
  background: #17a2b8;
  color: white;
}

.alert {
  padding: 12px;
  border-radius: 4px;
  margin-bottom: 20px;
}

.alert-success {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.alert-error {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.status-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #eee;
}

.status-label {
  font-weight: bold;
}

.status-value {
  font-weight: bold;
}

.status-success {
  color: #28a745;
}

.status-error {
  color: #dc3545;
}

.status-warning {
  color: #ffc107;
}

.worksheets-list {
  list-style: none;
  padding: 0;
}

.worksheet-item {
  padding: 8px 12px;
  background: #e9ecef;
  border-radius: 4px;
  margin-bottom: 5px;
}

.instructions {
  padding-left: 20px;
  line-height: 1.6;
}

.instructions li {
  margin-bottom: 8px;
}

a {
  color: #007bff;
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}
</style>