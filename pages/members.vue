<template>
  <div class="members-page">
    <!-- Page Header -->
    <div class="page-header">
      <div class="header-content">
        <div>
          <h1>Members Management</h1>
          <p>Manage church members and registrations</p>
        </div>
        <button @click="showAddModal = true" class="btn btn-primary">
          <Icon name="material-symbols:person-add" />
          Add New Member
        </button>
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
      <div v-if="searchQuery" class="search-results-info">
        Found {{ filteredMembers.length }} member(s)
      </div>
    </div>

    <!-- Filter Buttons -->
    <div class="filters">
      <button 
        @click="activeFilter = 'all'" 
        :class="['filter-btn', { active: activeFilter === 'all' }]"
      >
        All Members ({{ members.length }})
      </button>
      <button 
        @click="activeFilter = 'active'" 
        :class="['filter-btn', { active: activeFilter === 'active' }]"
      >
        Active ({{ activeMembers.length }})
      </button>
      <button 
        @click="activeFilter = 'adult'" 
        :class="['filter-btn', { active: activeFilter === 'adult' }]"
      >
        Adults ({{ adultMembers.length }})
      </button>
      <button 
        @click="activeFilter = 'child'" 
        :class="['filter-btn', { active: activeFilter === 'child' }]"
      >
        Children ({{ childMembers.length }})
      </button>
    </div>

    <!-- Members Table (Desktop) -->
    <div class="card mobile-hidden">
      <div class="table-responsive">
        <table class="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Category</th>
              <th>Registration Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="member in filteredMembers" :key="member.id">
              <td>{{ member.id }}</td>
              <td>{{ member.firstName }} {{ member.lastName }}</td>
              <td>
                <span class="category-badge" :class="member.category">
                  {{ member.category }}
                </span>
              </td>
              <td>{{ formatDate(member.registrationDate) }}</td>
              <td>
                <span 
                  class="status-badge" 
                  :class="member.isActive !== false ? 'active' : 'inactive'"
                >
                  {{ member.isActive !== false ? 'Active' : 'Inactive' }}
                </span>
              </td>
              <td>
                <div class="action-buttons">
                  <button 
                    @click="editMember(member)" 
                    class="btn-icon btn-edit"
                    title="Edit Member"
                  >
                    <Icon name="material-symbols:edit" />
                  </button>
                  <button 
                    @click="toggleMemberStatus(member)" 
                    class="btn-icon"
                    :class="member.isActive !== false ? 'btn-delete' : 'btn-success'"
                    :title="member.isActive !== false ? 'Deactivate' : 'Activate'"
                  >
                    <Icon :name="member.isActive !== false ? 'material-symbols:person-remove' : 'material-symbols:person-add'" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Members Cards (Mobile) -->
    <div class="mobile-only">
      <div v-for="member in filteredMembers" :key="member.id" class="mobile-card">
        <div class="mobile-card-header">
          {{ member.firstName }} {{ member.lastName }}
        </div>
        <div class="mobile-card-content">
          <div class="mobile-card-row">
            <span class="mobile-card-label">ID:</span>
            <span>{{ member.id }}</span>
          </div>
          <div class="mobile-card-row">
            <span class="mobile-card-label">Category:</span>
            <span class="category-badge" :class="member.category">
              {{ member.category }}
            </span>
          </div>
          <div class="mobile-card-row">
            <span class="mobile-card-label">Registered:</span>
            <span>{{ formatDate(member.registrationDate) }}</span>
          </div>
          <div class="mobile-card-row">
            <span class="mobile-card-label">Status:</span>
            <span 
              class="status-badge" 
              :class="member.isActive !== false ? 'active' : 'inactive'"
            >
              {{ member.isActive !== false ? 'Active' : 'Inactive' }}
            </span>
          </div>
          <div class="mobile-card-row">
            <span class="mobile-card-label">Actions:</span>
            <div class="action-buttons">
              <button 
                @click="editMember(member)" 
                class="btn-icon btn-edit"
                title="Edit Member"
              >
                <Icon name="material-symbols:edit" />
              </button>
              <button 
                @click="toggleMemberStatus(member)" 
                class="btn-icon"
                :class="member.isActive !== false ? 'btn-delete' : 'btn-success'"
                :title="member.isActive !== false ? 'Deactivate' : 'Activate'"
              >
                <Icon :name="member.isActive !== false ? 'material-symbols:person-remove' : 'material-symbols:person-add'" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="filteredMembers.length === 0 && !loading" class="card">
      <div class="empty-state">
        <Icon name="material-symbols:group-off" class="empty-icon" />
        <h3>No members found</h3>
        <p v-if="searchQuery">Try adjusting your search criteria</p>
        <p v-else>Start by adding your first church member</p>
        <button @click="showAddModal = true" class="btn btn-primary">
          <Icon name="material-symbols:person-add" />
          Add First Member
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <Icon name="material-symbols:refresh" class="loading-icon" />
      <p>Loading members...</p>
    </div>

    <!-- Add/Edit Member Modal -->
    <div v-if="showAddModal || showEditModal" class="modal-overlay" @click="closeModals">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title">
            {{ showEditModal ? 'Edit Member' : 'Add New Member' }}
          </h3>
          <button @click="closeModals" class="modal-close">
            <Icon name="material-symbols:close" />
          </button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="saveMember">
            <div class="form-group">
              <label class="form-label">First Name *</label>
              <input
                v-model="memberForm.firstName"
                type="text"
                class="form-input"
                required
              />
            </div>
            <div class="form-group">
              <label class="form-label">Last Name *</label>
              <input
                v-model="memberForm.lastName"
                type="text"
                class="form-input"
                required
              />
            </div>
            <div class="form-group">
              <label class="form-label">Category *</label>
              <select v-model="memberForm.category" class="form-select" required>
                <option value="">Select category</option>
                <option value="adult">Adult</option>
                <option value="child">Child</option>
              </select>
            </div>
            <div class="modal-footer">
              <button type="button" @click="closeModals" class="btn btn-secondary">
                Cancel
              </button>
              <button type="submit" class="btn btn-primary" :disabled="saving">
                <Icon v-if="saving" name="material-symbols:refresh" class="loading-icon" />
                {{ saving ? 'Saving...' : (showEditModal ? 'Update' : 'Add') }} Member
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// No authentication middleware needed

// Page metadata
useHead({
  title: 'Members - KFC Church Attendance System'
})

// Reactive data
const loading = ref(true)
const saving = ref(false)
const members = ref([])
const searchQuery = ref('')
const activeFilter = ref('all')
const showAddModal = ref(false)
const showEditModal = ref(false)
const editingMember = ref(null)

// Form data
const memberForm = ref({
  firstName: '',
  lastName: '',
  category: ''
})

// Computed properties
const activeMembers = computed(() => 
  members.value.filter(m => m.isActive !== false)
)

const adultMembers = computed(() => 
  members.value.filter(m => m.category === 'adult')
)

const childMembers = computed(() => 
  members.value.filter(m => m.category === 'child')
)

const filteredMembers = computed(() => {
  let filtered = members.value

  // Apply search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(member => 
      member.firstName.toLowerCase().includes(query) ||
      member.lastName.toLowerCase().includes(query) ||
      `${member.firstName} ${member.lastName}`.toLowerCase().includes(query)
    )
  }

  // Apply category filter
  switch (activeFilter.value) {
    case 'active':
      filtered = filtered.filter(m => m.isActive !== false)
      break
    case 'adult':
      filtered = filtered.filter(m => m.category === 'adult')
      break
    case 'child':
      filtered = filtered.filter(m => m.category === 'child')
      break
  }

  return filtered
})

// Methods
const fetchMembers = async () => {
  try {
    loading.value = true
    const response = await $fetch('/api/members?includeInactive=true&limit=1000')
    members.value = response.data || []
  } catch (error) {
    console.error('Error fetching members:', error)
  } finally {
    loading.value = false
  }
}

const editMember = (member) => {
  editingMember.value = member
  memberForm.value = {
    firstName: member.firstName,
    lastName: member.lastName,
    category: member.category
  }
  showEditModal.value = true
}

const saveMember = async () => {
  try {
    saving.value = true
    
    if (showEditModal.value) {
      // Update existing member
      await $fetch(`/api/members/${editingMember.value.id}`, {
        method: 'PUT',
        body: memberForm.value
      })
    } else {
      // Add new member
      await $fetch('/api/members', {
        method: 'POST',
        body: memberForm.value
      })
    }
    
    await fetchMembers()
    closeModals()
  } catch (error) {
    console.error('Error saving member:', error)
  } finally {
    saving.value = false
  }
}

const toggleMemberStatus = async (member) => {
  try {
    await $fetch(`/api/members/${member.id}`, {
      method: 'PUT',
      body: { isActive: member.isActive === false }
    })
    await fetchMembers()
  } catch (error) {
    console.error('Error updating member status:', error)
  }
}

const closeModals = () => {
  showAddModal.value = false
  showEditModal.value = false
  editingMember.value = null
  memberForm.value = {
    firstName: '',
    lastName: '',
    category: ''
  }
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString()
}

// Load data on mount
onMounted(() => {
  fetchMembers()
})
</script>

<style scoped>
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

.btn-success {
  background: var(--success-color);
  color: white;
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
</style>
