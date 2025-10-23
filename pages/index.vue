<template>
  <div class="dashboard">
    <!-- Page Header -->
    <div class="page-header">
      <h1>Dashboard</h1>
      <p>Welcome to KFC Church Attendance System</p>
    </div>

    <!-- Quick Stats -->
    <div class="stats">
      <div class="stat-card">
        <Icon name="material-symbols:group" class="stat-icon" />
        <div class="stat-card-content">
          <div class="stat-number">{{ totalMembers }}</div>
          <div class="stat-label">Total Members</div>
        </div>
      </div>
      <div class="stat-card">
        <Icon name="material-symbols:person-check" class="stat-icon" />
        <div class="stat-card-content">
          <div class="stat-number">{{ activeMembers }}</div>
          <div class="stat-label">Active Members</div>
        </div>
      </div>
      <div class="stat-card">
        <Icon name="material-symbols:event-available" class="stat-icon" />
        <div class="stat-card-content">
          <div class="stat-number">{{ lastSabbathAttendance.present || 0 }}</div>
          <div class="stat-label">Last Sabbath Present</div>
        </div>
      </div>
      <div class="stat-card">
        <Icon name="material-symbols:trending-up" class="stat-icon" />
        <div class="stat-card-content">
          <div class="stat-number" :class="getAttendanceClass(lastSabbathAttendance.percentage)">
            {{ lastSabbathAttendance.percentage || 0 }}%
          </div>
          <div class="stat-label">Attendance Rate</div>
          <div v-if="lastSabbathAttendance.percentage" class="stat-trend" :class="getTrendClass(lastSabbathAttendance.percentage)">
            <Icon name="material-symbols:trending-up" v-if="lastSabbathAttendance.percentage >= 70" />
            <Icon name="material-symbols:trending-flat" v-else-if="lastSabbathAttendance.percentage >= 50" />
            <Icon name="material-symbols:trending-down" v-else />
          </div>
        </div>
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
            :key="record.sabbathDate"
            class="recent-item"
          >
            <div class="recent-header">
              <div class="recent-date">{{ formatDate(record.sabbathDate) }}</div>
              <div class="recent-percentage">{{ record.percentage }}%</div>
            </div>
            <div class="recent-progress">
              <div
                class="progress-bar"
                :style="{ width: record.percentage + '%' }"
              ></div>
            </div>
            <div class="recent-stats">
              <span class="stat-present">{{ record.present }} Present</span>
              <span class="stat-absent">{{ record.absent }} Absent</span>
              <span class="stat-total">{{ record.total }} Total</span>
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
    
    // Fetch members data - get all members for accurate statistics
    const membersResponse = await $fetch('/api/members?limit=1000')
    const membersData = membersResponse.data || []
    totalMembers.value = membersResponse.pagination?.total || membersData.length
    activeMembers.value = membersData.filter(m => m.isActive !== false).length
    
    // Fetch all attendance records to find the most recent Sabbath date
    const attendanceRecords = await $fetch('/api/attendance?limit=1000')
    const attendanceData = attendanceRecords.data || []
    const uniqueDates = [...new Set(attendanceData.map(record => record.sabbathDate))]
    const mostRecentDate = uniqueDates.sort((a, b) => new Date(b) - new Date(a))[0]

    // Fetch attendance stats for the most recent Sabbath
    if (mostRecentDate) {
      try {
        const attendanceResponse = await $fetch('/api/attendance/stats', {
          query: { sabbathDate: mostRecentDate }
        })
        if (attendanceResponse.success) {
          lastSabbathAttendance.value = {
            present: attendanceResponse.stats.present,
            percentage: attendanceResponse.percentages.present
          }
        }
      } catch (statsError) {
        console.error('Error fetching attendance stats:', statsError)
      }
    }
    
    // Fetch recent attendance records (grouped by date)
    const allAttendance = await $fetch('/api/attendance?limit=1000')
    const allAttendanceData = allAttendance.data || []
    const groupedByDate = {}
    
    allAttendanceData.forEach(record => {
      if (!groupedByDate[record.sabbathDate]) {
        groupedByDate[record.sabbathDate] = {
          sabbathDate: record.sabbathDate,
          present: 0,
          absent: 0,
          other: 0,
          total: 0,
          percentage: 0
        }
      }
      groupedByDate[record.sabbathDate][record.status]++
      groupedByDate[record.sabbathDate].total++
    })
    
    // Calculate percentage for each date
    Object.keys(groupedByDate).forEach(date => {
      const record = groupedByDate[date]
      record.percentage = totalMembers.value > 0
        ? Math.round((record.present / totalMembers.value) * 100)
        : 0
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

// Get attendance class based on percentage
const getAttendanceClass = (percentage) => {
  if (percentage >= 70) return 'positive'
  if (percentage >= 50) return 'neutral'
  return 'negative'
}

// Get trend class based on percentage
const getTrendClass = (percentage) => {
  if (percentage >= 70) return 'positive'
  if (percentage >= 50) return 'neutral'
  return 'negative'
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
