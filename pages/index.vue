<template>
  <div class="dashboard">
    <!-- Page Header -->
    <div class="page-header">
      <h1>Dashboardsss</h1>
      <p>DEV elcome to KFC Church Attendance System</p>
    </div>

    <!-- Quick Stats -->
    <div class="stats">
      <div class="stat-card">
        <div class="stat-number">{{ totalMembers }}</div>
        <div class="stat-label">Total Members</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">{{ activeMembers }}</div>
        <div class="stat-label">Active Members</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">{{ lastSabbathAttendance.present || 0 }}</div>
        <div class="stat-label">Last Sabbath Present</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">{{ lastSabbathAttendance.percentage || 0 }}%</div>
        <div class="stat-label">Attendance Rate</div>
      </div>
    </div>

    <!-- Recent Activity & Quick Actions -->
    <div class="grid grid-2">
      <!-- Quick Actions -->
      <div class="card">
        <h2 class="card-title">Quick Actions</h2>
        <div class="quick-actions">
          <NuxtLink to="/attendance" class="action-card">
            <Icon name="material-symbols:checklist" class="action-icon" />
            <div class="action-content">
              <h3>Mark Attendance</h3>
              <p>Record today's Sabbath attendance</p>
            </div>
          </NuxtLink>
          
          <NuxtLink to="/members" class="action-card">
            <Icon name="material-symbols:person-add" class="action-icon" />
            <div class="action-content">
              <h3>Add Member</h3>
              <p>Register new church member</p>
            </div>
          </NuxtLink>
          
          <NuxtLink to="/reports" class="action-card">
            <Icon name="material-symbols:analytics" class="action-icon" />
            <div class="action-content">
              <h3>View Reports</h3>
              <p>Check attendance statistics</p>
            </div>
          </NuxtLink>
          
          <NuxtLink to="/files" class="action-card">
            <Icon name="material-symbols:upload-file" class="action-icon" />
            <div class="action-content">
              <h3>Upload Files</h3>
              <p>Manage church documents</p>
            </div>
          </NuxtLink>
        </div>
      </div>

      <!-- Recent Attendance -->
      <div class="card">
        <h2 class="card-title">Recent Attendance</h2>
        <div v-if="recentAttendance.length > 0" class="recent-list">
          <div 
            v-for="record in recentAttendance" 
            :key="`${record.sabbathDate}-${record.memberId}`"
            class="recent-item"
          >
            <div class="recent-date">{{ formatDate(record.sabbathDate) }}</div>
            <div class="recent-stats">
              <span class="stat-present">{{ record.present }} Present</span>
              <span class="stat-absent">{{ record.absent }} Absent</span>
            </div>
          </div>
        </div>
        <div v-else class="empty-state">
          <Icon name="material-symbols:event-busy" class="empty-icon" />
          <p>No recent attendance records</p>
          <NuxtLink to="/attendance" class="btn btn-primary btn-sm">
            Start Recording
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <Icon name="material-symbols:refresh" class="loading-icon" />
      <p>Loading dashboard data...</p>
    </div>
  </div>
</template>

<script setup>

// Page metadata
useHead({
  title: 'Dashboard - KFC Church Attendance System'
})

// Reactive data
const loading = ref(true)
const totalMembers = ref(0)
const activeMembers = ref(0)
const lastSabbathAttendance = ref({})
const recentAttendance = ref([])

// Fetch dashboard data
const fetchDashboardData = async () => {
  try {
    loading.value = true
    
    // Fetch members data
    const membersResponse = await $fetch('/api/members')
    totalMembers.value = membersResponse.length
    activeMembers.value = membersResponse.filter(m => m.isActive !== false).length
    
    // Fetch recent attendance stats
    const attendanceResponse = await $fetch('/api/attendance/stats')
    if (attendanceResponse.success) {
      lastSabbathAttendance.value = {
        present: attendanceResponse.stats.present,
        percentage: attendanceResponse.percentages.present
      }
    }
    
    // Fetch recent attendance records (grouped by date)
    const allAttendance = await $fetch('/api/attendance')
    const groupedByDate = {}
    
    allAttendance.data.forEach(record => {
      if (!groupedByDate[record.sabbathDate]) {
        groupedByDate[record.sabbathDate] = {
          sabbathDate: record.sabbathDate,
          present: 0,
          absent: 0,
          other: 0
        }
      }
      groupedByDate[record.sabbathDate][record.status]++
    })
    
    recentAttendance.value = Object.values(groupedByDate)
      .sort((a, b) => new Date(b.sabbathDate) - new Date(a.sabbathDate))
      .slice(0, 5)
    
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
  } finally {
    loading.value = false
  }
}

// Format date for display
const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

// Load data on mount
onMounted(() => {
  fetchDashboardData()
})
</script>

<style scoped>
.dashboard {
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

.quick-actions {
  display: grid;
  gap: 1rem;
}

.action-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  text-decoration: none;
  color: var(--text-color);
  transition: all 0.2s ease;
  background: white;
}

.action-card:hover {
  border-color: var(--primary-color);
  background: #f8faff;
}

.action-icon {
  width: 2.5rem;
  height: 2.5rem;
  color: var(--primary-color);
  flex-shrink: 0;
}

.action-content h3 {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.action-content p {
  font-size: 0.85rem;
  color: var(--text-muted-color);
  margin: 0;
}

.recent-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.recent-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  background: #f9fafb;
}

.recent-date {
  font-weight: 600;
  color: var(--text-color);
}

.recent-stats {
  display: flex;
  gap: 1rem;
  font-size: 0.8rem;
}

.stat-present {
  color: var(--success-color);
  font-weight: 500;
}

.stat-absent {
  color: var(--danger-color);
  font-weight: 500;
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: var(--text-muted-color);
}

.empty-icon {
  width: 3rem;
  height: 3rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.loading-state {
  text-align: center;
  padding: 3rem;
  color: var(--text-muted-color);
}

.loading-icon {
  width: 2rem;
  height: 2rem;
  margin-bottom: 1rem;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .page-header h1 {
    font-size: 1.5rem;
  }

  .page-header p {
    font-size: 0.9rem;
  }

  .stats {
    grid-template-columns: repeat(2, 1fr);
  }

  .action-card {
    flex-direction: column;
    text-align: center;
    gap: 0.75rem;
  }

  .action-content h3 {
    font-size: 0.95rem;
  }

  .action-content p {
    font-size: 0.8rem;
  }

  .recent-item {
    flex-direction: column;
    gap: 0.5rem;
    text-align: center;
  }
}
</style>
