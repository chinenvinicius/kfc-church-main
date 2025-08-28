<template>
  <div class="files-page">
    <!-- Modern Header with Inline Stats -->
    <div class="modern-header">
      <div class="header-main">
        <div class="header-info">
          <h1>Files</h1>
          <div class="header-stats">
            <span class="stat-item">{{ files.length }} files</span>
            <span class="stat-divider">•</span>
            <span class="stat-item">{{ formatFileSize(totalSize) }}</span>
            <span class="stat-divider">•</span>
            <span class="stat-item">{{ fileTypes.length }} types</span>
            <span class="stat-divider">•</span>
            <span class="stat-item">{{ recentFiles.length }} recent</span>
          </div>
        </div>
        <div class="header-actions">
          <button @click="toggleView" class="btn-view-toggle" :class="{ active: viewMode === 'grid' }">
            <Icon name="material-symbols:grid-view" />
          </button>
          <button @click="toggleView" class="btn-view-toggle" :class="{ active: viewMode === 'list' }">
            <Icon name="material-symbols:view-list" />
          </button>
          <button @click="showUploadModal = true" class="btn btn-primary btn-compact">
            <Icon name="material-symbols:add" />
            Upload
          </button>
        </div>
      </div>
    </div>

    <!-- Modern Search and Filter Bar -->
    <div class="control-bar">
      <div class="search-section">
        <div class="search-input-wrapper">
          <Icon name="material-symbols:search" class="search-icon" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search files by name or description..."
            class="search-input-modern"
          />
          <div v-if="searchQuery" class="search-clear" @click="searchQuery = ''">
            <Icon name="material-symbols:close" />
          </div>
        </div>
      </div>

      <div class="filter-section">
        <select v-model="typeFilter" class="filter-select">
          <option value="all">All Types</option>
          <option value="document">Documents</option>
          <option value="image">Images</option>
          <option value="spreadsheet">Spreadsheets</option>
          <option value="presentation">Presentations</option>
          <option value="other">Other</option>
        </select>

        <select v-model="sortBy" class="filter-select">
          <option value="date">Sort by Date</option>
          <option value="name">Sort by Name</option>
          <option value="size">Sort by Size</option>
          <option value="type">Sort by Type</option>
        </select>
      </div>

      <div class="results-info">
        {{ filteredFiles.length }} of {{ files.length }} files
      </div>
    </div>

    <!-- Modern File Display -->
    <div class="files-container">
      <!-- List View -->
      <div v-if="viewMode === 'list'" class="files-list">
        <div class="list-header">
          <div class="col-file">Name</div>
          <div class="col-type">Type</div>
          <div class="col-size">Size</div>
          <div class="col-date">Modified</div>
          <div class="col-actions">Actions</div>
        </div>

        <div v-for="file in sortedFiles" :key="file.id" class="file-row">
          <div class="col-file">
            <div class="file-info-modern">
              <div class="file-icon-container" :class="getFileTypeClass(file.mimeType)">
                <Icon :name="getFileIcon(file.mimeType)" class="file-icon-modern" />
              </div>
              <div class="file-details">
                <div class="file-name">{{ file.originalName }}</div>
                <div class="file-description">{{ file.description || 'No description' }}</div>
              </div>
            </div>
          </div>
          <div class="col-type">
            <span class="file-type-modern" :class="getFileTypeClass(file.mimeType)">
              {{ getFileType(file.mimeType) }}
            </span>
          </div>
          <div class="col-size">
            <span class="file-size-modern">{{ formatFileSize(file.size) }}</span>
          </div>
          <div class="col-date">
            <div class="date-info">
              <div class="date-primary">{{ formatDateShort(file.uploadDate) }}</div>
              <div class="date-secondary">{{ formatTimeAgo(file.uploadDate) }}</div>
            </div>
          </div>
          <div class="col-actions">
            <div class="action-buttons-modern">
              <button @click="downloadFile(file)" class="action-btn download" title="Download">
                <Icon name="material-symbols:download" />
              </button>
              <button @click="editFile(file)" class="action-btn edit" title="Edit">
                <Icon name="material-symbols:edit" />
              </button>
              <button @click="deleteFile(file)" class="action-btn delete" title="Delete">
                <Icon name="material-symbols:delete" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Grid View -->
      <div v-if="viewMode === 'grid'" class="files-grid">
        <div v-for="file in sortedFiles" :key="file.id" class="file-card-modern">
          <div class="file-card-header">
            <div class="file-icon-large" :class="getFileTypeClass(file.mimeType)">
              <Icon :name="getFileIcon(file.mimeType)" />
            </div>
            <div class="file-actions-overlay">
              <button @click="downloadFile(file)" class="overlay-btn" title="Download">
                <Icon name="material-symbols:download" />
              </button>
              <button @click="editFile(file)" class="overlay-btn" title="Edit">
                <Icon name="material-symbols:edit" />
              </button>
              <button @click="deleteFile(file)" class="overlay-btn" title="Delete">
                <Icon name="material-symbols:delete" />
              </button>
            </div>
          </div>
          <div class="file-card-body">
            <div class="file-name-grid">{{ file.originalName }}</div>
            <div class="file-meta-grid">
              <span class="file-type-grid">{{ getFileType(file.mimeType) }}</span>
              <span class="file-size-grid">{{ formatFileSize(file.size) }}</span>
            </div>
            <div class="file-date-grid">{{ formatDateShort(file.uploadDate) }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Files Cards (Mobile) -->
    <div class="mobile-only">
      <div v-for="file in filteredFiles" :key="file.id" class="file-card">
        <div class="file-card-header">
          <div class="file-info">
            <Icon :name="getFileIcon(file.mimeType)" class="file-icon" />
            <div>
              <strong>{{ file.originalName }}</strong>
              <div class="file-meta">
                <span class="file-type-badge" :class="getFileTypeClass(file.mimeType)">
                  {{ getFileType(file.mimeType) }}
                </span>
                <span class="file-size">{{ formatFileSize(file.size) }}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div class="file-card-content">
          <div class="file-description">
            {{ file.description || 'No description' }}
          </div>
          <div class="file-date">
            Uploaded: {{ formatDate(file.uploadDate) }}
          </div>
          <div class="file-actions">
            <button @click="downloadFile(file)" class="btn btn-primary btn-sm">
              <Icon name="material-symbols:download" />
              Download
            </button>
            <button @click="editFile(file)" class="btn btn-secondary btn-sm">
              <Icon name="material-symbols:edit" />
              Edit
            </button>
            <button @click="deleteFile(file)" class="btn btn-danger btn-sm">
              <Icon name="material-symbols:delete" />
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="filteredFiles.length === 0 && !loading" class="card">
      <div class="empty-state">
        <Icon name="material-symbols:folder-off" class="empty-icon" />
        <h3>No files found</h3>
        <p v-if="searchQuery">Try adjusting your search criteria</p>
        <p v-else>Start by uploading your first file</p>
        <button @click="showUploadModal = true" class="btn btn-primary">
          <Icon name="material-symbols:upload-file" />
          Upload First File
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <Icon name="material-symbols:refresh" class="loading-icon" />
      <p>Loading files...</p>
    </div>

    <!-- Upload Modal -->
    <div v-if="showUploadModal" class="modal-overlay" @click="closeUploadModal">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title">Upload File</h3>
          <button @click="closeUploadModal" class="modal-close">
            <Icon name="material-symbols:close" />
          </button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="uploadFile">
            <div class="form-group">
              <label class="form-label">Select File *</label>
              <input
                ref="fileInput"
                type="file"
                class="form-input"
                @change="handleFileSelect"
                required
              />
              <small class="form-help">Maximum file size: 10MB</small>
            </div>
            
            <div v-if="selectedFile" class="file-preview">
              <div class="preview-info">
                <Icon :name="getFileIcon(selectedFile.type)" class="preview-icon" />
                <div>
                  <strong>{{ selectedFile.name }}</strong>
                  <div class="preview-meta">
                    {{ formatFileSize(selectedFile.size) }} • {{ getFileType(selectedFile.type) }}
                  </div>
                </div>
              </div>
            </div>
            
            <div class="form-group">
              <label class="form-label">Description</label>
              <textarea
                v-model="uploadForm.description"
                class="form-input"
                rows="3"
                placeholder="Optional description for this file..."
              ></textarea>
            </div>
            
            <div class="modal-footer">
              <button type="button" @click="closeUploadModal" class="btn btn-secondary">
                Cancel
              </button>
              <button type="submit" class="btn btn-primary" :disabled="uploading || !selectedFile">
                <Icon v-if="uploading" name="material-symbols:refresh" class="loading-icon" />
                {{ uploading ? 'Uploading...' : 'Upload File' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Edit Modal -->
    <div v-if="showEditModal" class="modal-overlay" @click="closeEditModal">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title">Edit File Details</h3>
          <button @click="closeEditModal" class="modal-close">
            <Icon name="material-symbols:close" />
          </button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="updateFile">
            <div class="form-group">
              <label class="form-label">File Name</label>
              <input
                v-model="editForm.originalName"
                type="text"
                class="form-input"
                required
              />
            </div>
            
            <div class="form-group">
              <label class="form-label">Description</label>
              <textarea
                v-model="editForm.description"
                class="form-input"
                rows="3"
                placeholder="File description..."
              ></textarea>
            </div>
            
            <div class="modal-footer">
              <button type="button" @click="closeEditModal" class="btn btn-secondary">
                Cancel
              </button>
              <button type="submit" class="btn btn-primary" :disabled="updating">
                <Icon v-if="updating" name="material-symbols:refresh" class="loading-icon" />
                {{ updating ? 'Updating...' : 'Update File' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>

// Page metadata
useHead({
  title: 'Files - KFC Church Attendance System'
})

// Reactive data
const loading = ref(true)
const uploading = ref(false)
const updating = ref(false)
const files = ref([])
const searchQuery = ref('')
const typeFilter = ref('all')
const sortBy = ref('date')
const viewMode = ref('list')
const showUploadModal = ref(false)
const showEditModal = ref(false)
const selectedFile = ref(null)
const editingFile = ref(null)

// Form data
const uploadForm = ref({
  description: ''
})

const editForm = ref({
  originalName: '',
  description: ''
})

// Computed properties
const totalSize = computed(() => 
  files.value.reduce((sum, file) => sum + (file.size || 0), 0)
)

const fileTypes = computed(() => {
  const types = new Set()
  files.value.forEach(file => {
    types.add(getFileType(file.mimeType))
  })
  return Array.from(types)
})

const recentFiles = computed(() => 
  files.value
    .filter(file => {
      const uploadDate = new Date(file.uploadDate)
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      return uploadDate > weekAgo
    })
)

const filteredFiles = computed(() => {
  let filtered = files.value

  // Apply search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(file =>
      file.originalName.toLowerCase().includes(query) ||
      (file.description && file.description.toLowerCase().includes(query))
    )
  }

  // Apply type filter
  if (typeFilter.value !== 'all') {
    filtered = filtered.filter(file =>
      getFileTypeClass(file.mimeType) === typeFilter.value
    )
  }

  return filtered
})

const sortedFiles = computed(() => {
  const sorted = [...filteredFiles.value]

  switch (sortBy.value) {
    case 'name':
      return sorted.sort((a, b) => a.originalName.localeCompare(b.originalName))
    case 'size':
      return sorted.sort((a, b) => (b.size || 0) - (a.size || 0))
    case 'type':
      return sorted.sort((a, b) => getFileType(a.mimeType).localeCompare(getFileType(b.mimeType)))
    case 'date':
    default:
      return sorted.sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate))
  }
})

// Methods
const fetchFiles = async () => {
  try {
    loading.value = true
    const response = await $fetch('/api/files')
    files.value = response.files || []
  } catch (error) {
    console.error('Error fetching files:', error)
    files.value = []
  } finally {
    loading.value = false
  }
}

const handleFileSelect = (event) => {
  const file = event.target.files[0]
  if (file) {
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      alert('File size must be less than 10MB')
      return
    }
    selectedFile.value = file
  }
}

const uploadFile = async () => {
  if (!selectedFile.value) return
  
  try {
    uploading.value = true
    
    const formData = new FormData()
    formData.append('file', selectedFile.value)
    formData.append('description', uploadForm.value.description)
    
    await $fetch('/api/files', {
      method: 'POST',
      body: formData
    })
    
    await fetchFiles()
    closeUploadModal()
  } catch (error) {
    console.error('Error uploading file:', error)
    alert('Error uploading file. Please try again.')
  } finally {
    uploading.value = false
  }
}

const downloadFile = async (file) => {
  try {
    const response = await fetch(`/api/files/${file.id}/download`)
    const blob = await response.blob()
    
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = file.originalName
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  } catch (error) {
    console.error('Error downloading file:', error)
    alert('Error downloading file. Please try again.')
  }
}

const editFile = (file) => {
  editingFile.value = file
  editForm.value = {
    originalName: file.originalName,
    description: file.description || ''
  }
  showEditModal.value = true
}

const updateFile = async () => {
  try {
    updating.value = true
    
    await $fetch(`/api/files/${editingFile.value.id}`, {
      method: 'PUT',
      body: editForm.value
    })
    
    await fetchFiles()
    closeEditModal()
  } catch (error) {
    console.error('Error updating file:', error)
    alert('Error updating file. Please try again.')
  } finally {
    updating.value = false
  }
}

const deleteFile = async (file) => {
  if (!confirm(`Are you sure you want to delete "${file.originalName}"?`)) {
    return
  }
  
  try {
    await $fetch(`/api/files/${file.id}`, {
      method: 'DELETE'
    })
    
    await fetchFiles()
  } catch (error) {
    console.error('Error deleting file:', error)
    alert('Error deleting file. Please try again.')
  }
}

const closeUploadModal = () => {
  showUploadModal.value = false
  selectedFile.value = null
  uploadForm.value.description = ''
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

const closeEditModal = () => {
  showEditModal.value = false
  editingFile.value = null
  editForm.value = {
    originalName: '',
    description: ''
  }
}

const getFileIcon = (mimeType) => {
  if (mimeType.startsWith('image/')) return 'material-symbols:image'
  if (mimeType.includes('pdf')) return 'material-symbols:picture-as-pdf'
  if (mimeType.includes('word') || mimeType.includes('document')) return 'material-symbols:description'
  if (mimeType.includes('sheet') || mimeType.includes('excel')) return 'material-symbols:table-chart'
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return 'material-symbols:slideshow'
  if (mimeType.startsWith('video/')) return 'material-symbols:video-file'
  if (mimeType.startsWith('audio/')) return 'material-symbols:audio-file'
  return 'material-symbols:insert-drive-file'
}

const getFileType = (mimeType) => {
  if (mimeType.startsWith('image/')) return 'Image'
  if (mimeType.includes('pdf')) return 'PDF'
  if (mimeType.includes('word') || mimeType.includes('document')) return 'Document'
  if (mimeType.includes('sheet') || mimeType.includes('excel')) return 'Spreadsheet'
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return 'Presentation'
  if (mimeType.startsWith('video/')) return 'Video'
  if (mimeType.startsWith('audio/')) return 'Audio'
  return 'File'
}

const getFileTypeClass = (mimeType) => {
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType.includes('pdf') || mimeType.includes('word') || mimeType.includes('document')) return 'document'
  if (mimeType.includes('sheet') || mimeType.includes('excel')) return 'spreadsheet'
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return 'presentation'
  return 'other'
}

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const toggleView = () => {
  viewMode.value = viewMode.value === 'list' ? 'grid' : 'list'
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

const formatDateShort = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: '2-digit'
  })
}

const formatTimeAgo = (dateString) => {
  const now = new Date()
  const date = new Date(dateString)
  const diffInHours = Math.floor((now - date) / (1000 * 60 * 60))

  if (diffInHours < 1) return 'Just now'
  if (diffInHours < 24) return `${diffInHours}h ago`

  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 7) return `${diffInDays}d ago`

  const diffInWeeks = Math.floor(diffInDays / 7)
  if (diffInWeeks < 4) return `${diffInWeeks}w ago`

  const diffInMonths = Math.floor(diffInDays / 30)
  return `${diffInMonths}mo ago`
}

// Template refs
const fileInput = ref(null)

// Load data on mount
onMounted(() => {
  fetchFiles()
})
</script>

<style scoped>
/* Modern Header */
.modern-header {
  background: white;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.header-main {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-info h1 {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  color: var(--text-color);
}

.header-stats {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.85rem;
  color: var(--text-muted-color);
}

.stat-item {
  font-weight: 500;
}

.stat-divider {
  color: var(--border-color);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-view-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: 1px solid var(--border-color);
  background: white;
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: all 0.2s ease;
  color: var(--text-muted-color);
}

.btn-view-toggle:hover,
.btn-view-toggle.active {
  border-color: var(--primary-color);
  background: var(--primary-color);
  color: white;
}

.btn-compact {
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
}

/* Control Bar */
.control-bar {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: white;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  padding: 1rem;
  margin-bottom: 1.5rem;
}

.search-section {
  flex: 1;
  max-width: 400px;
}

.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.search-input-modern {
  width: 100%;
  padding: 0.75rem 2.5rem 0.75rem 2.5rem;
  border: 1px solid var(--border-color);
  border-radius: 25px;
  font-size: 0.9rem;
  transition: all 0.2s ease;
  background: #f8f9fa;
}

.search-input-modern:focus {
  outline: none;
  border-color: var(--primary-color);
  background: white;
}

.search-icon {
  position: absolute;
  left: 0.875rem;
  color: var(--text-muted-color);
  width: 1rem;
  height: 1rem;
}

.search-clear {
  position: absolute;
  right: 0.875rem;
  color: var(--text-muted-color);
  cursor: pointer;
  width: 1rem;
  height: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.search-clear:hover {
  color: var(--danger-color);
}

.filter-section {
  display: flex;
  gap: 0.75rem;
}

.filter-select {
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  font-size: 0.9rem;
  background: white;
  cursor: pointer;
}

.filter-select:focus {
  outline: none;
  border-color: var(--primary-color);
}

.results-info {
  font-size: 0.85rem;
  color: var(--text-muted-color);
  font-weight: 500;
  white-space: nowrap;
}

/* Files Container */
.files-container {
  background: white;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  overflow: hidden;
}

/* List View */
.files-list {
  display: flex;
  flex-direction: column;
}

.list-header {
  display: grid;
  grid-template-columns: 2fr 120px 100px 140px 120px;
  gap: 1rem;
  padding: 1rem 1.5rem;
  background: #f8f9fa;
  border-bottom: 1px solid var(--border-color);
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-muted-color);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.file-row {
  display: grid;
  grid-template-columns: 2fr 120px 100px 140px 120px;
  gap: 1rem;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #f0f0f0;
  align-items: center;
  transition: background-color 0.2s ease;
}

.file-row:hover {
  background: #f8f9fa;
}

.file-row:last-child {
  border-bottom: none;
}

.file-info-modern {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.file-icon-container {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.file-icon-container.document {
  background: #e3f2fd;
}

.file-icon-container.image {
  background: #f3e5f5;
}

.file-icon-container.spreadsheet {
  background: #e8f5e8;
}

.file-icon-container.presentation {
  background: #fff3e0;
}

.file-icon-container.other {
  background: #f5f5f5;
}

.file-icon-modern {
  width: 20px;
  height: 20px;
  color: var(--primary-color);
}

.file-details {
  min-width: 0;
  flex: 1;
}

.file-name {
  font-weight: 600;
  color: var(--text-color);
  font-size: 0.9rem;
  margin-bottom: 0.25rem;
  word-break: break-word;
}

.file-description {
  font-size: 0.8rem;
  color: var(--text-muted-color);
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.file-type-modern {
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.file-type-modern.document {
  background: #e3f2fd;
  color: #1565c0;
}

.file-type-modern.image {
  background: #f3e5f5;
  color: #7b1fa2;
}

.file-type-modern.spreadsheet {
  background: #e8f5e8;
  color: #2e7d32;
}

.file-type-modern.presentation {
  background: #fff3e0;
  color: #ef6c00;
}

.file-type-modern.other {
  background: #f5f5f5;
  color: #616161;
}

.file-size-modern {
  font-size: 0.85rem;
  color: var(--text-color);
  font-weight: 500;
}

.date-info {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.date-primary {
  font-size: 0.85rem;
  color: var(--text-color);
  font-weight: 500;
}

.date-secondary {
  font-size: 0.75rem;
  color: var(--text-muted-color);
}

.action-buttons-modern {
  display: flex;
  gap: 0.25rem;
}

.action-btn {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 14px;
}

.action-btn.download {
  background: #e3f2fd;
  color: #1565c0;
}

.action-btn.download:hover {
  background: #1565c0;
  color: white;
}

.action-btn.edit {
  background: #fff3e0;
  color: #ef6c00;
}

.action-btn.edit:hover {
  background: #ef6c00;
  color: white;
}

.action-btn.delete {
  background: #ffebee;
  color: #d32f2f;
}

.action-btn.delete:hover {
  background: #d32f2f;
  color: white;
}

.file-card {
  background: white;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  padding: 1rem;
  margin-bottom: 1rem;
}

.file-card-header {
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--border-color);
}

.file-meta {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  margin-top: 0.25rem;
}

.file-size {
  font-size: 0.8rem;
  color: var(--text-muted-color);
}

.file-card-content {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.file-description {
  color: var(--text-muted-color);
  font-size: 0.9rem;
}

.file-date {
  font-size: 0.8rem;
  color: var(--text-muted-color);
}

.file-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.file-preview {
  padding: 1rem;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  background: #f9fafb;
  margin-bottom: 1rem;
}

.preview-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.preview-icon {
  width: 2.5rem;
  height: 2.5rem;
  color: var(--primary-color);
}

.preview-meta {
  font-size: 0.9rem;
  color: var(--text-muted-color);
  margin-top: 0.25rem;
}

.form-help {
  font-size: 0.8rem;
  color: var(--text-muted-color);
  margin-top: 0.25rem;
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
  width: 1.5rem;
  height: 1.5rem;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Grid View */
.files-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
  padding: 1.5rem;
}

.file-card-modern {
  background: white;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  overflow: hidden;
  transition: all 0.2s ease;
  position: relative;
}

.file-card-modern:hover {
  border-color: var(--primary-color);
  transform: translateY(-2px);
}

.file-card-modern:hover .file-actions-overlay {
  opacity: 1;
}

.file-card-header {
  position: relative;
  padding: 1.5rem;
  text-align: center;
  background: #f8f9fa;
}

.file-icon-large {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
}

.file-icon-large.document {
  background: #e3f2fd;
}

.file-icon-large.image {
  background: #f3e5f5;
}

.file-icon-large.spreadsheet {
  background: #e8f5e8;
}

.file-icon-large.presentation {
  background: #fff3e0;
}

.file-icon-large.other {
  background: #f5f5f5;
}

.file-icon-large svg {
  width: 32px;
  height: 32px;
  color: var(--primary-color);
}

.file-actions-overlay {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  display: flex;
  gap: 0.25rem;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.overlay-btn {
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.9);
  color: var(--text-color);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 12px;
}

.overlay-btn:hover {
  background: white;
  color: var(--primary-color);
}

.file-card-body {
  padding: 1rem;
}

.file-name-grid {
  font-weight: 600;
  color: var(--text-color);
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
  word-break: break-word;
  line-height: 1.3;
}

.file-meta-grid {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.file-type-grid {
  font-size: 0.75rem;
  color: var(--text-muted-color);
  text-transform: uppercase;
  font-weight: 500;
}

.file-size-grid {
  font-size: 0.8rem;
  color: var(--text-color);
  font-weight: 500;
}

.file-date-grid {
  font-size: 0.75rem;
  color: var(--text-muted-color);
}

@media (max-width: 768px) {
  .modern-header {
    padding: 1rem;
  }

  .header-main {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }

  .header-stats {
    justify-content: center;
  }

  .control-bar {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }

  .filter-section {
    flex-direction: column;
  }

  .list-header {
    display: none;
  }

  .file-row {
    grid-template-columns: 1fr;
    gap: 0.75rem;
    padding: 1rem;
    border-radius: var(--border-radius);
    margin-bottom: 0.5rem;
    border: 1px solid var(--border-color);
  }

  .files-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    padding: 1rem;
  }

  .file-actions {
    flex-direction: column;
  }

  .file-actions .btn {
    width: 100%;
  }
}
</style>
