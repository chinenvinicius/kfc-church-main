<template>
o,mk  <div class="attendance-page">
    <!-- Page Header -->
    <div class="page-header">
      <div class="header-content">
        <div>
          <h1>Sabbath Attendance</h1>
          <p>Track member attendance for Sabbath services</p>
        </div>
        <div class="date-selector">
          <label class="form-label">Sabbath Date:</label>
          <input
            v-model="selectedDate"
            type="date"
            class="form-input"
            @change="loadAttendanceData"
          />
        </div>
      </div>
    </div>

    <!-- Attendance Summary -->
    <div class="stats">
      <div class="stat-card">
        <div class="stat-number">{{ attendanceStats.present }}</div>
        <div class="stat-label">Present</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">{{ attendanceStats.absent }}</div>
        <div class="stat-label">Absent</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">{{ attendanceStats.other }}</div>
        <div class="stat-label">Other</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">{{ attendanceStats.percentage }}%</div>
        <div class="stat-label">Attendance Rate</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">{{ visitors.length }}</div>
        <div class="stat-label">Visitors</div>
      </div>
    </div>

    <!-- Search and Filters -->
    <div class="search-container">
      <div class="search-input-wrapper">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search members..."
          class="search-input"
        />
        <Icon name="material-symbols:search" class="search-icon" />
      </div>

      <!-- Category Filter -->
      <div class="filter-section">
        <label class="filter-label">Filter by Category:</label>
        <div class="filter-buttons">
          <button
            @click="categoryFilter = 'all'"
            :class="['filter-btn', { active: categoryFilter === 'all' }]"
          >
            <Icon name="material-symbols:group" />
            All ({{ allMembersCount }})
          </button>
          <button
            @click="categoryFilter = 'adult'"
            :class="['filter-btn', { active: categoryFilter === 'adult' }]"
          >
            <Icon name="material-symbols:person" />
            Adults ({{ adultMembersCount }})
          </button>
          <button
            @click="categoryFilter = 'child'"
            :class="['filter-btn', { active: categoryFilter === 'child' }]"
          >
            <Icon name="material-symbols:child-care" />
            Children ({{ childMembersCount }})
          </button>
        </div>
      </div>
    </div>

    <!-- Filter Buttons -->
    <div class="filters">
      <button 
        @click="statusFilter = 'all'" 
        :class="['filter-btn', { active: statusFilter === 'all' }]"
      >
        All Members
      </button>
      <button 
        @click="statusFilter = 'present'" 
        :class="['filter-btn', { active: statusFilter === 'present' }]"
      >
        Present
      </button>
      <button 
        @click="statusFilter = 'absent'" 
        :class="['filter-btn', { active: statusFilter === 'absent' }]"
      >
        Absent
      </button>
      <button 
        @click="statusFilter = 'other'" 
        :class="['filter-btn', { active: statusFilter === 'other' }]"
      >
        Other
      </button>
    </div>

    <!-- Attendance Grid (Desktop) -->
    <div class="card mobile-hidden">
      <div class="table-responsive">
        <table class="table">
          <thead>
            <tr>
              <th>Member</th>
              <th>Category</th>
              <th>Status</th>
              <th>Notes</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="member in filteredMembers" :key="member.id">
              <td>
                <div class="member-info">
                  <strong>{{ member.firstName }} {{ member.lastName }}</strong>
                  <small>ID: {{ member.id }}</small>
                </div>
              </td>
              <td>
                <span class="category-badge" :class="member.category">
                  {{ member.category }}
                </span>
              </td>
              <td>
                <div class="status-buttons">
                  <button
                    @click="updateAttendance(member.id, 'present')"
                    :class="['status-btn', 'present', { active: getAttendanceStatus(member.id) === 'present' }]"
                    :title="getAttendanceStatus(member.id) === 'present' ? 'Click again to clear' : 'Present'"
                  >
                    <Icon name="material-symbols:check-circle" />
                  </button>
                  <button
                    @click="updateAttendance(member.id, 'absent')"
                    :class="['status-btn', 'absent', { active: getAttendanceStatus(member.id) === 'absent' }]"
                    :title="getAttendanceStatus(member.id) === 'absent' ? 'Click again to clear' : 'Absent'"
                  >
                    <Icon name="material-symbols:cancel" />
                  </button>
                  <button
                    @click="updateAttendance(member.id, 'other')"
                    :class="['status-btn', 'other', { active: getAttendanceStatus(member.id) === 'other' }]"
                    :title="getAttendanceStatus(member.id) === 'other' ? 'Click again to clear' : 'Other'"
                  >
                    <Icon name="material-symbols:help" />
                  </button>
                </div>
              </td>
              <td>
                <input
                  v-model="attendanceNotes[member.id]"
                  type="text"
                  placeholder="Add notes..."
                  class="notes-input"
                  @blur="updateAttendanceNotes(member.id)"
                />
              </td>
              <td>
                <div class="status-indicator">
                  <span v-if="!getAttendanceStatus(member.id)" class="no-status">
                    Not Set
                  </span>
                  <span v-else class="has-status">
                    {{ getAttendanceStatus(member.id) }}
                  </span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Attendance Cards (Mobile) -->
    <div class="mobile-only">
      <div v-for="member in filteredMembers" :key="member.id" class="attendance-card">
        <div class="attendance-card-header">
          <div class="member-info">
            <strong>{{ member.firstName }} {{ member.lastName }}</strong>
            <span class="category-badge" :class="member.category">{{ member.category }}</span>
          </div>
          <div class="member-id">ID: {{ member.id }}</div>
        </div>
        
        <div class="attendance-card-content">
          <div class="status-section">
            <label class="form-label">Attendance Status:</label>
            <div class="status-buttons">
              <button
                @click="updateAttendance(member.id, 'present')"
                :class="['status-btn', 'present', { active: getAttendanceStatus(member.id) === 'present' }]"
                :title="getAttendanceStatus(member.id) === 'present' ? 'Tap again to clear' : 'Present'"
              >
                <Icon name="material-symbols:check-circle" />
                Present
              </button>
              <button
                @click="updateAttendance(member.id, 'absent')"
                :class="['status-btn', 'absent', { active: getAttendanceStatus(member.id) === 'absent' }]"
                :title="getAttendanceStatus(member.id) === 'absent' ? 'Tap again to clear' : 'Absent'"
              >
                <Icon name="material-symbols:cancel" />
                Absent
              </button>
              <button
                @click="updateAttendance(member.id, 'other')"
                :class="['status-btn', 'other', { active: getAttendanceStatus(member.id) === 'other' }]"
                :title="getAttendanceStatus(member.id) === 'other' ? 'Tap again to clear' : 'Other'"
              >
                <Icon name="material-symbols:help" />
                Other
              </button>
            </div>
          </div>
          
          <div class="notes-section">
            <label class="form-label">Notes:</label>
            <input
              v-model="attendanceNotes[member.id]"
              type="text"
              placeholder="Add notes..."
              class="form-input"
              @blur="updateAttendanceNotes(member.id)"
            />
          </div>
          
          <div class="actions-section">
            <div class="status-hint">
              <small>💡 Tip: Click the same button twice to clear status</small>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="filteredMembers.length === 0 && !loading" class="card">
      <div class="empty-state">
        <Icon name="material-symbols:event-busy" class="empty-icon" />
        <h3>No members found</h3>
        <p v-if="searchQuery">Try adjusting your search criteria</p>
        <p v-else>No active members available for attendance tracking</p>
        <NuxtLink to="/members" class="btn btn-primary">
          <Icon name="material-symbols:group" />
          Manage Members
        </NuxtLink>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <Icon name="material-symbols:refresh" class="loading-icon" />
      <p>Loading attendance data...</p>
    </div>

    <!-- Visitors Section -->
    <div class="card">
      <div class="card-header">
        <h2 class="card-title">Visitors</h2>
        <button @click="showAddVisitorModal = true" class="btn btn-primary btn-sm">
          <Icon name="material-symbols:person-add" />
          Add Visitor
        </button>
      </div>

      <!-- Visitors List -->
      <div v-if="visitors.length > 0" class="visitors-list">
        <div v-for="visitor in visitors" :key="visitor.id" class="visitor-item">
          <div class="visitor-info">
            <strong>{{ visitor.visitorName }}</strong>
            <small v-if="visitor.notes">{{ visitor.notes }}</small>
          </div>
          <div class="visitor-actions">
            <button @click="editVisitor(visitor)" class="btn btn-secondary btn-sm">
              <Icon name="material-symbols:edit" />
            </button>
            <button @click="deleteVisitor(visitor.id)" class="btn btn-danger btn-sm">
              <Icon name="material-symbols:delete" />
            </button>
          </div>
        </div>
      </div>

      <!-- Empty State for Visitors -->
      <div v-else class="empty-state">
        <Icon name="material-symbols:person-outline" class="empty-icon" />
        <p>No visitors recorded for this date</p>
        <button @click="showAddVisitorModal = true" class="btn btn-primary btn-sm">
          <Icon name="material-symbols:person-add" />
          Add First Visitor
        </button>
      </div>
    </div>

    <!-- Add/Edit Visitor Modal -->
    <div v-if="showAddVisitorModal || showEditVisitorModal" class="modal-overlay" @click="closeVisitorModals">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title">
            {{ showEditVisitorModal ? 'Edit Visitor' : 'Add New Visitor' }}
          </h3>
          <button @click="closeVisitorModals" class="modal-close">
            <Icon name="material-symbols:close" />
          </button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="saveVisitor">
            <div class="form-group">
              <label class="form-label">Visitor Name *</label>
              <input
                v-model="visitorForm.visitorName"
                type="text"
                class="form-input"
                placeholder="Enter visitor name"
                required
              />
            </div>
            <div class="form-group">
              <label class="form-label">Notes</label>
              <textarea
                v-model="visitorForm.notes"
                class="form-input"
                placeholder="Optional notes about the visitor"
                rows="3"
              ></textarea>
            </div>
            <div class="form-actions">
              <button type="button" @click="closeVisitorModals" class="btn btn-secondary">
                Cancel
              </button>
              <button type="submit" class="btn btn-primary" :disabled="savingVisitor">
                <Icon v-if="savingVisitor" name="material-symbols:refresh" class="loading-icon" />
                {{ showEditVisitorModal ? 'Update' : 'Add' }} Visitor
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Bulk Actions Button -->
    <div class="bulk-actions-container">
      <button @click="showBulkActionsModal = true" class="btn btn-outline">
        <Icon name="material-symbols:more-horiz" />
        Bulk Actions
      </button>
    </div>

    <!-- Bulk Actions Modal -->
    <div v-if="showBulkActionsModal" class="modal-overlay" @click="closeBulkActionsModal">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title">Bulk Actions</h3>
          <button @click="closeBulkActionsModal" class="modal-close">
            <Icon name="material-symbols:close" />
          </button>
        </div>
        <div class="modal-body">
          <p class="bulk-actions-description">
            Choose an action to apply to all members for the selected date: <strong>{{ formatDate(selectedDate) }}</strong>
          </p>

          <div class="bulk-actions-grid">
            <button @click="confirmMarkAllPresent" class="bulk-action-btn success">
              <Icon name="material-symbols:done-all" />
              <div class="bulk-action-content">
                <strong>Mark All Present</strong>
                <small>Set all members as present</small>
              </div>
            </button>

            <button @click="confirmMarkAllAbsent" class="bulk-action-btn danger">
              <Icon name="material-symbols:close" />
              <div class="bulk-action-content">
                <strong>Mark All Absent</strong>
                <small>Set all members as absent</small>
              </div>
            </button>

            <button @click="confirmClearAllAttendance" class="bulk-action-btn secondary">
              <Icon name="material-symbols:refresh" />
              <div class="bulk-action-content">
                <strong>Clear All</strong>
                <small>Remove all attendance records</small>
              </div>
            </button>
          </div>

          <div class="bulk-actions-warning">
            <Icon name="material-symbols:warning" />
            <span>These actions will affect all {{ filteredMembers.length }} members and cannot be undone.</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// No authentication middleware needed

// Page metadata
useHead({
  title: 'Attendance - KFC Church Attendance System'
})

// Reactive data
const loading = ref(true)
const members = ref([])
const attendanceRecords = ref([])
const attendanceNotes = ref({})
const searchQuery = ref('')
const statusFilter = ref('all')
const categoryFilter = ref('all')
const selectedDate = ref(new Date().toISOString().split('T')[0])

// Visitor-related reactive data
const visitors = ref([])
const showAddVisitorModal = ref(false)
const showEditVisitorModal = ref(false)
const editingVisitor = ref(null)
const savingVisitor = ref(false)
const visitorForm = ref({
  visitorName: '',
  notes: ''
})

// Bulk actions modal
// Update polling
const lastCheck = ref(new Date().toISOString())
let updatePollingInterval = null

// Check for real-time updates
const checkForUpdates = async () => {
  try {
    const response = await $fetch(`/api/updates/notifications?lastCheck=${lastCheck.value}`)
    
    if (response.hasUpdates && response.notifications.length > 0) {
      response.notifications.forEach(notification => {
        if (notification.type === 'excel_import') {
          // Show a subtle notification
          console.log(`Excel file updated: ${notification.filename}`)
          // Reload attendance data to show the changes
          loadAttendanceData()
        }
      })
      
      lastCheck.value = response.timestamp
    }
  } catch (error) {
    console.error('Failed to check for updates:', error)
  }
}

const showBulkActionsModal = ref(false)

// Computed properties
const attendanceStats = computed(() => {
  const stats = { present: 0, absent: 0, other: 0, total: 0, percentage: 0 }
  
  attendanceRecords.value.forEach(record => {
    if (record.sabbathDate === selectedDate.value) {
      stats[record.status]++
      stats.total++
    }
  })
  
  if (stats.total > 0) {
    stats.percentage = Math.round((stats.present / stats.total) * 100)
  }
  
  return stats
})

// Member count computed properties
const allMembersCount = computed(() =>
  members.value.filter(m => m.isActive !== false).length
)

const adultMembersCount = computed(() =>
  members.value.filter(m => m.isActive !== false && m.category === 'adult').length
)

const childMembersCount = computed(() =>
  members.value.filter(m => m.isActive !== false && m.category === 'child').length
)

const filteredMembers = computed(() => {
  let filtered = members.value.filter(m => m.isActive !== false)

  // Apply category filter
  if (categoryFilter.value !== 'all') {
    filtered = filtered.filter(member => member.category === categoryFilter.value)
  }

  // Apply search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(member =>
      member.firstName.toLowerCase().includes(query) ||
      member.lastName.toLowerCase().includes(query) ||
      `${member.firstName} ${member.lastName}`.toLowerCase().includes(query)
    )
  }

  // Apply status filter
  if (statusFilter.value !== 'all') {
    filtered = filtered.filter(member =>
      getAttendanceStatus(member.id) === statusFilter.value
    )
  }

  return filtered
})

// Methods
const loadAttendanceData = async () => {
  try {
    loading.value = true

    // Load members
    const membersResponse = await $fetch('/api/members?limit=1000')
    members.value = membersResponse.data || []

    // Load attendance for selected date
    const attendanceResponse = await $fetch(`/api/attendance?sabbathDate=${selectedDate.value}`)
    attendanceRecords.value = attendanceResponse.data

    // Load visitors for selected date
    const visitorsResponse = await $fetch(`/api/visitors?sabbathDate=${selectedDate.value}`)
    visitors.value = visitorsResponse || []

    // Load notes - ensure all members have note entries
    attendanceNotes.value = {}

    // Initialize notes for all members
    members.value.forEach(member => {
      attendanceNotes.value[member.id] = ''
    })

    // Load existing notes from attendance records
    attendanceRecords.value.forEach(record => {
      if (record.sabbathDate === selectedDate.value) {
        attendanceNotes.value[record.memberId] = record.notes || ''
      }
    })

  } catch (error) {
    console.error('Error loading attendance data:', error)
  } finally {
    loading.value = false
  }
}

const getAttendanceStatus = (memberId) => {
  const record = attendanceRecords.value.find(r => 
    r.memberId === memberId && r.sabbathDate === selectedDate.value
  )
  return record ? record.status : null
}

const updateAttendance = async (memberId, status) => {
  try {
    // Check if clicking the same status that's already active - if so, clear it
    const currentStatus = getAttendanceStatus(memberId)
    if (currentStatus === status) {
      // Double-click to reset - clear the attendance
      await clearAttendance(memberId)
      return
    }

    await $fetch('/api/attendance', {
      method: 'POST',
      body: {
        memberId,
        sabbathDate: selectedDate.value,
        status,
        notes: attendanceNotes.value[memberId] || ''
      }
    })

    // Update local records
    const existingIndex = attendanceRecords.value.findIndex(r =>
      r.memberId === memberId && r.sabbathDate === selectedDate.value
    )

    if (existingIndex >= 0) {
      attendanceRecords.value[existingIndex].status = status
      attendanceRecords.value[existingIndex].notes = attendanceNotes.value[memberId] || ''
    } else {
      attendanceRecords.value.push({
        memberId,
        sabbathDate: selectedDate.value,
        status,
        notes: attendanceNotes.value[memberId] || ''
      })
    }

  } catch (error) {
    console.error('Error updating attendance:', error)
  }
}

const updateAttendanceNotes = async (memberId) => {
  try {
    const notes = attendanceNotes.value[memberId] || ''
    const existingRecord = attendanceRecords.value.find(r =>
      r.memberId === memberId && r.sabbathDate === selectedDate.value
    )

    if (existingRecord) {
      // If record exists, update only notes using the new endpoint
      await $fetch('/api/attendance/notes', {
        method: 'PUT',
        body: {
          memberId,
          sabbathDate: selectedDate.value,
          notes: notes
        }
      })
      // Update local record
      existingRecord.notes = notes
    } else if (notes.trim()) {
      // If no record exists but notes are added, create a new record with 'other' status
      await $fetch('/api/attendance', {
        method: 'POST',
        body: {
          memberId,
          sabbathDate: selectedDate.value,
          status: 'other', // Default to 'other' if only notes are added
          notes: notes
        }
      })
      // Reload attendance data to reflect the new record
      await loadAttendanceData()
    }
  } catch (error) {
    console.error('Error updating attendance notes:', error)
  }
}

const clearAttendance = async (memberId) => {
  try {
    // Find the attendance record
    const record = attendanceRecords.value.find(r =>
      r.memberId === memberId && r.sabbathDate === selectedDate.value
    )

    if (record && record.id) {
      // Delete from server if it has an ID
      await $fetch(`/api/attendance/${record.id}`, {
        method: 'DELETE'
      })
    }

    // Remove from local records
    const index = attendanceRecords.value.findIndex(r =>
      r.memberId === memberId && r.sabbathDate === selectedDate.value
    )
    if (index >= 0) {
      attendanceRecords.value.splice(index, 1)
    }

    // Clear notes
    attendanceNotes.value[memberId] = ''

  } catch (error) {
    console.error('Error clearing attendance:', error)
    // Still clear locally even if server request fails
    const index = attendanceRecords.value.findIndex(r =>
      r.memberId === memberId && r.sabbathDate === selectedDate.value
    )
    if (index >= 0) {
      attendanceRecords.value.splice(index, 1)
    }
    attendanceNotes.value[memberId] = ''
  }
}

// Bulk actions modal functions
const closeBulkActionsModal = () => {
  showBulkActionsModal.value = false
}

const confirmMarkAllPresent = async () => {
  if (!confirm(`Are you sure you want to mark all ${filteredMembers.value.length} members as present for ${formatDate(selectedDate.value)}?`)) {
    return
  }

  await markAllPresent()
  closeBulkActionsModal()
}

const confirmMarkAllAbsent = async () => {
  if (!confirm(`Are you sure you want to mark all ${filteredMembers.value.length} members as absent for ${formatDate(selectedDate.value)}?`)) {
    return
  }

  await markAllAbsent()
  closeBulkActionsModal()
}

const confirmClearAllAttendance = async () => {
  if (!confirm(`Are you sure you want to clear all attendance records for ${formatDate(selectedDate.value)}? This action cannot be undone.`)) {
    return
  }

  await clearAllAttendance()
  closeBulkActionsModal()
}

const markAllPresent = async () => {
  for (const member of members.value.filter(m => m.isActive !== false)) {
    await updateAttendance(member.id, 'present')
  }
}

const markAllAbsent = async () => {
  for (const member of members.value.filter(m => m.isActive !== false)) {
    await updateAttendance(member.id, 'absent')
  }
}

const clearAllAttendance = async () => {
  try {
    // Clear all attendance records for the selected date
    const recordsToDelete = attendanceRecords.value.filter(r =>
      r.sabbathDate === selectedDate.value
    )

    // Delete each record from server
    for (const record of recordsToDelete) {
      if (record.id) {
        try {
          await $fetch(`/api/attendance/${record.id}`, {
            method: 'DELETE'
          })
        } catch (error) {
          console.error(`Error deleting attendance record ${record.id}:`, error)
        }
      }
    }

    // Clear local records
    attendanceRecords.value = attendanceRecords.value.filter(r =>
      r.sabbathDate !== selectedDate.value
    )

    // Clear all notes
    attendanceNotes.value = {}

  } catch (error) {
    console.error('Error clearing all attendance:', error)
    // Still clear locally even if some server requests fail
    attendanceRecords.value = attendanceRecords.value.filter(r =>
      r.sabbathDate !== selectedDate.value
    )
    attendanceNotes.value = {}
  }
}

// Utility function for date formatting
const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// Visitor management functions
const closeVisitorModals = () => {
  showAddVisitorModal.value = false
  showEditVisitorModal.value = false
  editingVisitor.value = null
  visitorForm.value = {
    visitorName: '',
    notes: ''
  }
}

const editVisitor = (visitor) => {
  editingVisitor.value = visitor
  visitorForm.value = {
    visitorName: visitor.visitorName,
    notes: visitor.notes || ''
  }
  showEditVisitorModal.value = true
}

const saveVisitor = async () => {
  try {
    savingVisitor.value = true

    if (showEditVisitorModal.value && editingVisitor.value) {
      // Update existing visitor
      const updatedVisitor = await $fetch(`/api/visitors/${editingVisitor.value.id}`, {
        method: 'PUT',
        body: {
          visitorName: visitorForm.value.visitorName,
          notes: visitorForm.value.notes
        }
      })

      // Update local data
      const index = visitors.value.findIndex(v => v.id === editingVisitor.value.id)
      if (index !== -1) {
        visitors.value[index] = updatedVisitor
      }
    } else {
      // Add new visitor
      const newVisitor = await $fetch('/api/visitors', {
        method: 'POST',
        body: {
          visitorName: visitorForm.value.visitorName,
          sabbathDate: selectedDate.value,
          notes: visitorForm.value.notes
        }
      })

      // Add to local data
      visitors.value.push(newVisitor)
    }

    closeVisitorModals()
  } catch (error) {
    console.error('Error saving visitor:', error)
  } finally {
    savingVisitor.value = false
  }
  // Start polling for updates every 5 seconds
  updatePollingInterval = setInterval(checkForUpdates, 5000)
}

onUnmounted(() => {
  if (updatePollingInterval) {
    clearInterval(updatePollingInterval)
  }
})
const deleteVisitor = async (visitorId) => {
  if (!confirm('Are you sure you want to delete this visitor?')) {
    return
  }

  try {
    await $fetch(`/api/visitors/${visitorId}`, {
      method: 'DELETE'
    })

    // Remove from local data
    visitors.value = visitors.value.filter(v => v.id !== visitorId)
  } catch (error) {
    console.error('Error deleting visitor:', error)
  }
}

// Load data on mount and when date changes
onMounted(() => {
  loadAttendanceData()
})

watch(selectedDate, () => {
  loadAttendanceData()
})
</script>

<style scoped>
.date-selector {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.date-selector .form-input {
  min-width: 200px;
}

.member-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.member-info small {
  color: var(--text-muted-color);
  font-size: 0.8rem;
}

.status-buttons {
  display: flex;
  gap: 0.5rem;
}

.status-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  border: 2px solid transparent;
  border-radius: var(--border-radius);
  background: #f8f9fa;
  color: var(--text-muted-color);
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.9rem;
}

.status-btn:hover {
  opacity: 0.8;
  transform: scale(1.05);
}

.status-btn:active {
  transform: scale(0.95);
}

.status-btn.active:hover {
  opacity: 0.9;
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.3);
}

.status-btn.present {
  border-color: #e8f5e8;
  background: #f0f9f0;
}

.status-btn.present.active {
  border-color: var(--success-color);
  background: var(--success-color);
  color: white;
}

.status-btn.absent {
  border-color: #fdeaea;
  background: #fef5f5;
}

.status-btn.absent.active {
  border-color: var(--danger-color);
  background: var(--danger-color);
  color: white;
}

.status-btn.other {
  border-color: #fff4e6;
  background: #fffaf0;
}

.status-btn.other.active {
  border-color: var(--warning-color);
  background: var(--warning-color);
  color: white;
}

.status-hint {
  text-align: center;
  margin-top: 0.5rem;
}

.status-hint small {
  color: var(--text-muted-color);
  font-style: italic;
}

.status-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
}

.no-status {
  color: var(--text-muted-color);
  font-style: italic;
  font-size: 0.85rem;
}

.has-status {
  color: var(--text-color);
  font-weight: 500;
  font-size: 0.85rem;
  text-transform: capitalize;
}

.notes-input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  font-size: 0.9rem;
}

.attendance-card {
  background: white;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  padding: 1rem;
  margin-bottom: 1rem;
}

.attendance-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--border-color);
}

.attendance-card-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.status-section,
.notes-section,
.actions-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.member-id {
  font-size: 0.8rem;
  color: var(--text-muted-color);
}

.category-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 15px;
  font-size: 0.875rem;
  font-weight: 500;
  text-transform: capitalize;
}

.category-badge.adult {
  background: #e3f2fd;
  color: #1565c0;
}

.category-badge.child {
  background: #f3e5f5;
  color: #7b1fa2;
}

.bulk-actions-container {
  display: flex;
  justify-content: center;
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid var(--border-color);
}

.bulk-actions-description {
  margin-bottom: 1.5rem;
  color: var(--text-muted-color);
  text-align: center;
}

.bulk-actions-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.bulk-action-btn {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border: 2px solid transparent;
  border-radius: var(--border-radius);
  background: #f8f9fa;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
  width: 100%;
}

.bulk-action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.bulk-action-btn.success {
  border-color: #e8f5e8;
  background: #f0f9f0;
}

.bulk-action-btn.success:hover {
  border-color: var(--success-color);
  background: var(--success-color);
  color: white;
}

.bulk-action-btn.danger {
  border-color: #fdeaea;
  background: #fef5f5;
}

.bulk-action-btn.danger:hover {
  border-color: var(--danger-color);
  background: var(--danger-color);
  color: white;
}

.bulk-action-btn.secondary {
  border-color: #f0f0f0;
  background: #f8f9fa;
}

.bulk-action-btn.secondary:hover {
  border-color: #6c757d;
  background: #6c757d;
  color: white;
}

.bulk-action-content {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.bulk-action-content strong {
  font-weight: 600;
  font-size: 1rem;
}

.bulk-action-content small {
  font-size: 0.875rem;
  opacity: 0.8;
}

.bulk-actions-warning {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  background: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: var(--border-radius);
  color: #856404;
  font-size: 0.9rem;
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
  width: 2rem;
  height: 2rem;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .date-selector .form-input {
    min-width: auto;
  }
  
  .status-btn {
    flex: 1;
    justify-content: center;
    padding: 0.75rem 0.5rem;
  }
  
  .bulk-actions-grid {
    grid-template-columns: 1fr;
  }

  .bulk-action-btn {
    padding: 0.75rem;
  }
}

/* Visitor Styles */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border-color);
}

.visitors-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.visitor-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  background: #f8f9fa;
}

.visitor-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.visitor-info strong {
  color: var(--text-color);
  font-weight: 600;
}

.visitor-info small {
  color: var(--text-muted-color);
  font-size: 0.85rem;
}

.visitor-actions {
  display: flex;
  gap: 0.5rem;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal {
  background: white;
  border-radius: var(--border-radius);
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid var(--border-color);
}

.modal-title {
  margin: 0;
  color: var(--text-color);
  font-size: 1.25rem;
  font-weight: 600;
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--text-muted-color);
  padding: 0.25rem;
  border-radius: var(--border-radius);
  transition: all 0.2s ease;
}

.modal-close:hover {
  background: #f8f9fa;
  color: var(--text-color);
}

.modal-body {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-label {
  display: block;
  margin-bottom: 0.5rem;
  color: var(--text-color);
  font-weight: 500;
}

.form-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  font-size: 1rem;
  transition: border-color 0.2s ease;
}

.form-input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2rem;
}

@media (max-width: 768px) {
  .visitor-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .visitor-actions {
    align-self: stretch;
    justify-content: flex-end;
  }

  .form-actions {
    flex-direction: column;
  }

  .form-actions .btn {
    width: 100%;
  }
}
</style>
