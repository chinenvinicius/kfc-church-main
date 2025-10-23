<template>
  <div class="reports-page">
    <!-- Page Header -->
    <div class="page-header">
      <div class="header-content">
        <div>
          <h1>Attendance Reports</h1>
          <p>View attendance statistics and trends</p>
        </div>
        <div class="export-actions">
          <button @click="exportToExcel" class="btn btn-primary">
            <Icon name="material-symbols:download" />
            Export Excel
          </button>
        </div>
      </div>
    </div>

    <!-- Date Range Filter -->
    <div class="card">
      <h3 class="card-title">Filter Reports</h3>
      <div class="date-filters">
        <div class="form-group">
          <label class="form-label">From Date:</label>
          <input
            v-model="dateRange.from"
            type="date"
            class="form-input"
            @change="loadReportData"
          />
        </div>
        <div class="form-group">
          <label class="form-label">To Date:</label>
          <input
            v-model="dateRange.to"
            type="date"
            class="form-input"
            @change="loadReportData"
          />
        </div>
        <div class="form-group">
          <label class="form-label">Quick Select:</label>
          <select @change="setQuickDateRange" class="form-select">
            <option value="">Custom Range</option>
            <option value="thisWeek">This Week</option>
            <option value="thisMonth">This Month</option>
            <option value="lastMonth">Last Month</option>
            <option value="thisYear">This Year</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Overall Statistics -->
    <div class="stats">
      <div class="stat-card">
        <div class="stat-number">{{ overallStats.totalSabbaths }}</div>
        <div class="stat-label">Total Sabbaths</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">{{ overallStats.averageAttendance }}</div>
        <div class="stat-label">Average Attendance</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">{{ overallStats.highestAttendance }}</div>
        <div class="stat-label">Highest Attendance</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">{{ overallStats.totalVisitors }}</div>
        <div class="stat-label">Total Visitors</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">{{ overallStats.attendanceRate }}%</div>
        <div class="stat-label">Overall Rate</div>
      </div>
    </div>

    <!-- Attendance by Date -->
    <div class="card">
      <h3 class="card-title">Attendance by Date</h3>
      <div class="table-responsive">
        <table class="table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Present</th>
              <th>Absent</th>
              <th>Other</th>
              <th>Total</th>
              <th>Visitors</th>
              <th>Rate</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="record in attendanceByDate" :key="record.date">
              <td>{{ formatDate(record.date) }}</td>
              <td>
                <span class="status-count present">{{ record.present }}</span>
              </td>
              <td>
                <span class="status-count absent">{{ record.absent }}</span>
              </td>
              <td>
                <span class="status-count other">{{ record.other }}</span>
              </td>
              <td>{{ record.total }}</td>
              <td>
                <span class="status-count visitors">{{ record.visitors || 0 }}</span>
              </td>
              <td>
                <div class="progress-bar">
                  <div
                    class="progress-fill"
                    :style="{ width: record.rate + '%' }"
                  ></div>
                  <span class="progress-text">{{ record.rate }}%</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Member Attendance Summary -->
    <div class="card">
      <h3 class="card-title">Member Attendance Summary</h3>
      <div class="search-container">
        <div class="search-input-wrapper">
          <input
            v-model="memberSearchQuery"
            type="text"
            placeholder="Search members..."
            class="search-input"
          />
          <Icon name="material-symbols:search" class="search-icon" />
        </div>
      </div>
      
      <div class="table-responsive">
        <table class="table">
          <thead>
            <tr>
              <th>Member</th>
              <th>Category</th>
              <th>Present</th>
              <th>Absent</th>
              <th>Other</th>
              <th>Total</th>
              <th>Rate</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="member in filteredMemberStats" :key="member.id">
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
                <span class="status-count present">{{ member.present }}</span>
              </td>
              <td>
                <span class="status-count absent">{{ member.absent }}</span>
              </td>
              <td>
                <span class="status-count other">{{ member.other }}</span>
              </td>
              <td>{{ member.total }}</td>
              <td>
                <div class="progress-bar">
                  <div 
                    class="progress-fill" 
                    :style="{ width: member.rate + '%' }"
                  ></div>
                  <span class="progress-text">{{ member.rate }}%</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Detailed Charts Section -->
    <div class="charts-section">
      <!-- Attendance Trend Chart -->
      <div class="card">
        <h3 class="card-title">Attendance Trend Over Time</h3>
        <div class="chart-container">
          <div class="trend-chart">
            <div class="chart-y-axis">
              <div class="y-label">100%</div>
              <div class="y-label">75%</div>
              <div class="y-label">50%</div>
              <div class="y-label">25%</div>
              <div class="y-label">0%</div>
            </div>
            <div class="chart-area">
              <div class="chart-grid">
                <div class="grid-line" v-for="i in 5" :key="i"></div>
              </div>
              <div class="chart-bars">
                <div
                  v-for="(record, index) in attendanceByDate.slice(0, 10)"
                  :key="record.date"
                  class="chart-bar-container"
                >
                  <div
                    class="chart-bar"
                    :style="{ height: record.rate + '%' }"
                    :class="getBarClass(record.rate)"
                  >
                    <div class="bar-tooltip">
                      <div class="tooltip-date">{{ formatDateShort(record.date) }}</div>
                      <div class="tooltip-stats">
                        <div>{{ record.present }} Present</div>
                        <div>{{ record.rate }}% Rate</div>
                      </div>
                    </div>
                  </div>
                  <div class="chart-label">{{ formatDateShort(record.date) }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Category Comparison Chart -->
      <div class="grid grid-2">
        <div class="card">
          <h3 class="card-title">Adults vs Children Attendance</h3>
          <div class="pie-chart-container">
            <div class="pie-chart">
              <div
                class="pie-slice adults"
                :style="{
                  '--percentage': categoryStats.adults.rate,
                  '--rotation': '0deg'
                }"
              ></div>
              <div
                class="pie-slice children"
                :style="{
                  '--percentage': categoryStats.children.rate,
                  '--rotation': (categoryStats.adults.rate * 3.6) + 'deg'
                }"
              ></div>
              <div class="pie-center">
                <div class="pie-total">{{ Math.round((categoryStats.adults.rate + categoryStats.children.rate) / 2) }}%</div>
                <div class="pie-label">Avg Rate</div>
              </div>
            </div>
            <div class="pie-legend">
              <div class="legend-item">
                <div class="legend-color adults"></div>
                <span>Adults ({{ categoryStats.adults.count }}) - {{ categoryStats.adults.rate }}%</span>
              </div>
              <div class="legend-item">
                <div class="legend-color children"></div>
                <span>Children ({{ categoryStats.children.count }}) - {{ categoryStats.children.rate }}%</span>
              </div>
            </div>
          </div>
        </div>

        <div class="card">
          <h3 class="card-title">Weekly Attendance Pattern</h3>
          <div class="pattern-chart">
            <div v-for="week in weeklyPattern" :key="week.week" class="week-row">
              <div class="week-label">{{ week.label }}</div>
              <div class="week-bar">
                <div
                  class="week-fill"
                  :style="{ width: week.percentage + '%' }"
                  :class="getWeekClass(week.percentage)"
                ></div>
                <span class="week-text">{{ week.count }} ({{ week.percentage }}%)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Member Performance Chart -->
      <div class="card">
        <h3 class="card-title">Top Attendees vs Needs Attention</h3>
        <div class="performance-chart">
          <div class="performance-section">
            <h4 class="performance-title">🏆 Top Attendees (90%+ Rate)</h4>
            <div class="performance-list">
              <div
                v-for="member in topAttendees"
                :key="member.id"
                class="performance-item excellent"
              >
                <div class="member-name">{{ member.firstName }} {{ member.lastName }}</div>
                <div class="member-stats">
                  <span class="attendance-rate">{{ member.rate }}%</span>
                  <span class="attendance-count">({{ member.present }}/{{ member.total }})</span>
                </div>
                <div class="performance-bar">
                  <div class="performance-fill excellent" :style="{ width: member.rate + '%' }"></div>
                </div>
              </div>
            </div>
          </div>

          <div class="performance-section">
            <h4 class="performance-title">⚠️ Needs Attention (Below 70%)</h4>
            <div class="performance-list">
              <div
                v-for="member in needsAttention"
                :key="member.id"
                class="performance-item warning"
              >
                <div class="member-name">{{ member.firstName }} {{ member.lastName }}</div>
                <div class="member-stats">
                  <span class="attendance-rate">{{ member.rate }}%</span>
                  <span class="attendance-count">({{ member.present }}/{{ member.total }})</span>
                </div>
                <div class="performance-bar">
                  <div class="performance-fill warning" :style="{ width: member.rate + '%' }"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Monthly Comparison Chart -->
      <div class="card">
        <h3 class="card-title">Monthly Attendance Comparison</h3>
        <div class="monthly-chart">
          <div class="month-bars">
            <div
              v-for="month in monthlyData"
              :key="month.month"
              class="month-column"
            >
              <div class="month-bar-container">
                <div
                  class="month-bar present"
                  :style="{ height: (month.present / month.total * 100) + '%' }"
                  :title="`Present: ${month.present}`"
                ></div>
                <div
                  class="month-bar absent"
                  :style="{ height: (month.absent / month.total * 100) + '%' }"
                  :title="`Absent: ${month.absent}`"
                ></div>
                <div
                  class="month-bar other"
                  :style="{ height: (month.other / month.total * 100) + '%' }"
                  :title="`Other: ${month.other}`"
                ></div>
              </div>
              <div class="month-label">{{ month.label }}</div>
              <div class="month-stats">
                <div class="month-total">{{ month.total }} total</div>
                <div class="month-rate">{{ Math.round(month.present / month.total * 100) }}% rate</div>
              </div>
            </div>
          </div>
          <div class="monthly-legend">
            <div class="legend-item">
              <div class="legend-color present"></div>
              <span>Present</span>
            </div>
            <div class="legend-item">
              <div class="legend-color absent"></div>
              <span>Absent</span>
            </div>
            <div class="legend-item">
              <div class="legend-color other"></div>
              <span>Other</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="attendanceByDate.length === 0 && !loading" class="card">
      <div class="empty-state">
        <Icon name="material-symbols:analytics-off" class="empty-icon" />
        <h3>No attendance data found</h3>
        <p>No attendance records found for the selected date range</p>
        <NuxtLink to="/attendance" class="btn btn-primary">
          <Icon name="material-symbols:checklist" />
          Start Recording Attendance
        </NuxtLink>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <Icon name="material-symbols:refresh" class="loading-icon" />
      <p>Loading reports...</p>
    </div>
  </div>
</template>

<script setup>
// No authentication middleware needed

// Page metadata
useHead({
  title: 'Reports - KFC Church Attendance System'
})

// Reactive data
const loading = ref(true)
const memberSearchQuery = ref('')
const dateRange = ref({
  from: '',
  to: ''
})

const overallStats = ref({
  totalSabbaths: 0,
  averageAttendance: 0,
  highestAttendance: 0,
  attendanceRate: 0,
  totalVisitors: 0 // Add totalVisitors
})

const attendanceByDate = ref([])
const memberStats = ref([])
const categoryStats = ref({
  adults: { count: 0, rate: 0 },
  children: { count: 0, rate: 0 }
})

const trends = ref({
  bestMonth: 'N/A',
  needsAttention: 'N/A'
})

const weeklyPattern = ref([])
const monthlyData = ref([])

// Computed properties for charts
const topAttendees = computed(() =>
  memberStats.value
    .filter(m => m.total > 0 && m.rate >= 90)
    .sort((a, b) => b.rate - a.rate)
    .slice(0, 5)
)

const needsAttention = computed(() =>
  memberStats.value
    .filter(m => m.total > 0 && m.rate < 70)
    .sort((a, b) => a.rate - b.rate)
    .slice(0, 5)
)

// Computed properties
const filteredMemberStats = computed(() => {
  if (!memberSearchQuery.value) return memberStats.value
  
  const query = memberSearchQuery.value.toLowerCase()
  return memberStats.value.filter(member => 
    member.firstName.toLowerCase().includes(query) ||
    member.lastName.toLowerCase().includes(query) ||
    `${member.firstName} ${member.lastName}`.toLowerCase().includes(query)
  )
})

// Methods
const loadReportData = async () => {
  try {
    loading.value = true
    
    // Load all attendance data
    const attendanceResponse = await $fetch('/api/attendance?limit=1000')
    const allAttendance = attendanceResponse.data
    
    // Load members data
    const membersResponse = await $fetch('/api/members?limit=1000')
    const allMembers = membersResponse.data || []

    // Load all visitors data
    const visitorsResponse = await $fetch('/api/visitors')
    const allVisitors = visitorsResponse || []
    
    // Filter by date range if specified
    let filteredAttendance = allAttendance
    if (dateRange.value.from && dateRange.value.to) {
      filteredAttendance = allAttendance.filter(record => 
        record.sabbathDate >= dateRange.value.from && 
        record.sabbathDate <= dateRange.value.to
      )
    }
    
    // Process attendance by date
    const dateGroups = {}
    filteredAttendance.forEach(record => {
      if (!dateGroups[record.sabbathDate]) {
        dateGroups[record.sabbathDate] = {
          date: record.sabbathDate,
          present: 0,
          absent: 0,
          other: 0,
          total: 0,
          visitors: 0
        }
      }
      dateGroups[record.sabbathDate][record.status]++
      dateGroups[record.sabbathDate].total++
    })

    // Add visitor counts to date groups
    allVisitors.forEach(visitor => {
      if (dateGroups[visitor.sabbathDate]) {
        dateGroups[visitor.sabbathDate].visitors++
      } else if (!dateRange.value.from || !dateRange.value.to ||
                 (visitor.sabbathDate >= dateRange.value.from && visitor.sabbathDate <= dateRange.value.to)) {
        // Create entry for dates that have only visitors (no member attendance)
        dateGroups[visitor.sabbathDate] = {
          date: visitor.sabbathDate,
          present: 0,
          absent: 0,
          other: 0,
          total: 0,
          visitors: 1
        }
      }
    })
    
    attendanceByDate.value = Object.values(dateGroups)
      .map(group => ({
        ...group,
        rate: group.total > 0 ? Math.round((group.present / group.total) * 100) : 0
      }))
      .sort((a, b) => new Date(b.date) - new Date(a.date))
    
    // Process member statistics
    const memberGroups = {}
    allMembers.forEach(member => {
      memberGroups[member.id] = {
        ...member,
        present: 0,
        absent: 0,
        other: 0,
        total: 0
      }
    })
    
    filteredAttendance.forEach(record => {
      if (memberGroups[record.memberId]) {
        memberGroups[record.memberId][record.status]++
        memberGroups[record.memberId].total++
      }
    })
    
    memberStats.value = Object.values(memberGroups)
      .map(member => ({
        ...member,
        rate: member.total > 0 ? Math.round((member.present / member.total) * 100) : 0
      }))
      .sort((a, b) => b.rate - a.rate)
    
    // Calculate overall statistics
    const totalSabbaths = attendanceByDate.value.length
    const totalAttendance = attendanceByDate.value.reduce((sum, day) => sum + day.present, 0)
    const averageAttendance = totalSabbaths > 0 ? Math.round(totalAttendance / totalSabbaths) : 0
    const highestAttendance = Math.max(...attendanceByDate.value.map(day => day.present), 0)
    const overallRate = attendanceByDate.value.length > 0
      ? Math.round(attendanceByDate.value.reduce((sum, day) => sum + day.rate, 0) / attendanceByDate.value.length)
      : 0

    const totalVisitors = attendanceByDate.value.reduce((sum, day) => sum + day.visitors, 0)
    
    overallStats.value = {
      totalSabbaths,
      averageAttendance,
      highestAttendance,
      attendanceRate: overallRate,
      totalVisitors: totalVisitors // Populate totalVisitors
    }
    
    // Calculate category statistics
    const adults = memberStats.value.filter(m => m.category === 'adult')
    const children = memberStats.value.filter(m => m.category === 'child')

    categoryStats.value = {
      adults: {
        count: adults.length,
        rate: adults.length > 0 ? Math.round(adults.reduce((sum, m) => sum + m.rate, 0) / adults.length) : 0
      },
      children: {
        count: children.length,
        rate: children.length > 0 ? Math.round(children.reduce((sum, m) => sum + m.rate, 0) / children.length) : 0
      }
    }

    // Generate weekly pattern data
    const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4']
    weeklyPattern.value = weeks.map((week, index) => {
      const weekData = attendanceByDate.value.filter((_, i) => Math.floor(i / 7) === index)
      const totalWeek = weekData.reduce((sum, day) => sum + day.total, 0)
      const presentWeek = weekData.reduce((sum, day) => sum + day.present, 0)
      const percentage = totalWeek > 0 ? Math.round((presentWeek / totalWeek) * 100) : 0

      return {
        week: index + 1,
        label: week,
        count: presentWeek,
        total: totalWeek,
        percentage
      }
    })

    // Generate monthly data
    const monthGroups = {}
    filteredAttendance.forEach(record => {
      const date = new Date(record.sabbathDate)
      const monthKey = `${date.getFullYear()}-${date.getMonth()}`
      const monthLabel = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })

      if (!monthGroups[monthKey]) {
        monthGroups[monthKey] = {
          month: monthKey,
          label: monthLabel,
          present: 0,
          absent: 0,
          other: 0,
          total: 0
        }
      }

      monthGroups[monthKey][record.status]++
      monthGroups[monthKey].total++
    })

    monthlyData.value = Object.values(monthGroups)
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-6) // Last 6 months
    
  } catch (error) {
    console.error('Error loading report data:', error)
  } finally {
    loading.value = false
  }
}

const setQuickDateRange = (event) => {
  const value = event.target.value
  const today = new Date()
  
  switch (value) {
    case 'thisWeek':
      const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()))
      const endOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 6))
      dateRange.value.from = startOfWeek.toISOString().split('T')[0]
      dateRange.value.to = endOfWeek.toISOString().split('T')[0]
      break
    case 'thisMonth':
      dateRange.value.from = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0]
      dateRange.value.to = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0]
      break
    case 'lastMonth':
      dateRange.value.from = new Date(today.getFullYear(), today.getMonth() - 1, 1).toISOString().split('T')[0]
      dateRange.value.to = new Date(today.getFullYear(), today.getMonth(), 0).toISOString().split('T')[0]
      break
    case 'thisYear':
      dateRange.value.from = new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0]
      dateRange.value.to = new Date(today.getFullYear(), 11, 31).toISOString().split('T')[0]
      break
  }
  
  if (value) {
    loadReportData()
  }
}

const exportToExcel = async () => {
  try {
    // Create Excel data
    const workbook = {
      SheetNames: ['Attendance by Date', 'Member Summary'],
      Sheets: {}
    }
    
    // Attendance by Date sheet
    const dateData = [
      ['Date', 'Present', 'Absent', 'Other', 'Total', 'Rate (%)'],
      ...attendanceByDate.value.map(record => [
        record.date,
        record.present,
        record.absent,
        record.other,
        record.total,
        record.rate
      ])
    ]
    
    // Member Summary sheet
    const memberData = [
      ['Name', 'Category', 'Present', 'Absent', 'Other', 'Total', 'Rate (%)'],
      ...memberStats.value.map(member => [
        `${member.firstName} ${member.lastName}`,
        member.category,
        member.present,
        member.absent,
        member.other,
        member.total,
        member.rate
      ])
    ]
    
    // Convert to worksheet format (simplified)
    workbook.Sheets['Attendance by Date'] = { data: dateData }
    workbook.Sheets['Member Summary'] = { data: memberData }
    
    // Trigger download (this would need actual Excel library implementation)
    console.log('Excel export data:', workbook)
    alert('Excel export feature would be implemented with SheetJS library')
    
  } catch (error) {
    console.error('Error exporting to Excel:', error)
  }
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const formatDateShort = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  })
}

const getBarClass = (rate) => {
  if (rate >= 90) return 'excellent'
  if (rate >= 75) return 'good'
  if (rate >= 60) return 'average'
  return 'poor'
}

const getWeekClass = (percentage) => {
  if (percentage >= 90) return 'excellent'
  if (percentage >= 75) return 'good'
  if (percentage >= 60) return 'average'
  return 'poor'
}

// Initialize date range to current month
const initializeDateRange = () => {
  const today = new Date()
  dateRange.value.from = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0]
  dateRange.value.to = today.toISOString().split('T')[0]
}

// Load data on mount
onMounted(() => {
  initializeDateRange()
  loadReportData()
})
</script>

<style scoped>
.date-filters {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

/* Charts Section */
.charts-section {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

/* Trend Chart */
.chart-container {
  padding: 1rem;
  background: #f8f9fa;
  border-radius: var(--border-radius);
}

.trend-chart {
  display: flex;
  height: 300px;
  gap: 1rem;
}

.chart-y-axis {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  width: 40px;
  font-size: 0.8rem;
  color: var(--text-muted-color);
  text-align: right;
  padding-right: 0.5rem;
}

.chart-area {
  flex: 1;
  position: relative;
}

.chart-grid {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.grid-line {
  height: 1px;
  background: #e0e0e0;
  width: 100%;
}

.chart-bars {
  display: flex;
  align-items: end;
  height: 100%;
  gap: 0.5rem;
  padding: 0 0.5rem;
}

.chart-bar-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
  position: relative;
}

.chart-bar {
  width: 100%;
  min-height: 4px;
  border-radius: 4px 4px 0 0;
  position: relative;
  cursor: pointer;
  transition: all 0.3s ease;
}

.chart-bar:hover {
  transform: scaleY(1.05);
}

.chart-bar:hover .bar-tooltip {
  opacity: 1;
  transform: translateY(-10px);
}

.chart-bar.excellent {
  background: linear-gradient(to top, #4caf50, #66bb6a);
}

.chart-bar.good {
  background: linear-gradient(to top, #2196f3, #42a5f5);
}

.chart-bar.average {
  background: linear-gradient(to top, #ff9800, #ffb74d);
}

.chart-bar.poor {
  background: linear-gradient(to top, #f44336, #ef5350);
}

.bar-tooltip {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  white-space: nowrap;
  opacity: 0;
  transition: all 0.3s ease;
  z-index: 10;
}

.tooltip-date {
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.chart-label {
  margin-top: 0.5rem;
  font-size: 0.75rem;
  color: var(--text-muted-color);
  text-align: center;
  transform: rotate(-45deg);
  white-space: nowrap;
}

.status-count {
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 500;
}

.status-count.present {
  background: #d4edda;
  color: #155724;
}

.status-count.absent {
  background: #f8d7da;
  color: #721c24;
}

.status-count.other {
  background: #fff3cd;
  color: #856404;
}

.status-count.visitors {
  background: #cce5ff;
  color: #004085;
}

.progress-bar {
  position: relative;
  width: 100px;
  height: 20px;
  background: #e9ecef;
  border-radius: 10px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--primary-color);
  transition: width 0.3s ease;
}

.progress-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--text-color);
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

.category-stats {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.category-stat {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  background: #f9fafb;
}

.category-label {
  font-weight: 600;
  color: var(--text-color);
}

.category-numbers {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.25rem;
}

.category-count {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--primary-color);
}

.category-rate {
  font-size: 0.9rem;
  color: var(--text-muted-color);
}

.trend-info {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.trend-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  background: #f9fafb;
}

.trend-icon {
  width: 2rem;
  height: 2rem;
  flex-shrink: 0;
}

.trend-icon.up {
  color: var(--success-color);
}

.trend-icon.down {
  color: var(--danger-color);
}

.trend-label {
  font-size: 0.9rem;
  color: var(--text-muted-color);
}

.trend-value {
  font-weight: 600;
  color: var(--text-color);
}

.export-actions {
  display: flex;
  gap: 1rem;
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

/* Performance Chart */
.performance-chart {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
}

.performance-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.performance-title {
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid var(--border-color);
}

.performance-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.performance-item {
  padding: 1rem;
  border-radius: var(--border-radius);
  border: 1px solid var(--border-color);
}

.performance-item.excellent {
  background: #f8fff8;
  border-color: #4caf50;
}

.performance-item.warning {
  background: #fff8f0;
  border-color: #ff9800;
}

.member-name {
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.member-stats {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  font-size: 0.85rem;
}

.attendance-rate {
  font-weight: 600;
  color: var(--primary-color);
}

.attendance-count {
  color: var(--text-muted-color);
}

.performance-bar {
  height: 6px;
  background: #f0f0f0;
  border-radius: 3px;
  overflow: hidden;
}

.performance-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.5s ease;
}

.performance-fill.excellent {
  background: #4caf50;
}

.performance-fill.warning {
  background: #ff9800;
}

/* Monthly Chart */
.monthly-chart {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.month-bars {
  display: flex;
  align-items: end;
  gap: 1rem;
  height: 200px;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: var(--border-radius);
}

.month-column {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
}

.month-bar-container {
  flex: 1;
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: end;
  gap: 2px;
  margin-bottom: 0.5rem;
}

.month-bar {
  width: 100%;
  min-height: 4px;
  border-radius: 2px;
  transition: all 0.3s ease;
  cursor: pointer;
}

.month-bar:hover {
  opacity: 0.8;
  transform: scaleY(1.05);
}

.month-bar.present {
  background: #4caf50;
}

.month-bar.absent {
  background: #f44336;
}

.month-bar.other {
  background: #ff9800;
}

.month-label {
  font-size: 0.75rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
  text-align: center;
}

.month-stats {
  text-align: center;
  font-size: 0.7rem;
  color: var(--text-muted-color);
}

.month-total {
  margin-bottom: 0.125rem;
}

.monthly-legend {
  display: flex;
  justify-content: center;
  gap: 1rem;
  flex-wrap: wrap;
}

/* Weekly Pattern Chart */
.pattern-chart {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.week-row {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.week-label {
  width: 60px;
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--text-color);
}

.week-bar {
  flex: 1;
  height: 24px;
  background: #f0f0f0;
  border-radius: 12px;
  position: relative;
  overflow: hidden;
}

.week-fill {
  height: 100%;
  border-radius: 12px;
  transition: width 0.5s ease;
  position: relative;
}

.week-fill.excellent {
  background: linear-gradient(90deg, #4caf50, #66bb6a);
}

.week-fill.good {
  background: linear-gradient(90deg, #2196f3, #42a5f5);
}

.week-fill.average {
  background: linear-gradient(90deg, #ff9800, #ffb74d);
}

.week-fill.poor {
  background: linear-gradient(90deg, #f44336, #ef5350);
}

.week-text {
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  font-size: 0.75rem;
  font-weight: 600;
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

@media (max-width: 768px) {
  .date-filters {
    grid-template-columns: 1fr;
  }

  .export-actions {
    flex-direction: column;
  }

  .progress-bar {
    width: 80px;
  }

  .category-stat {
    flex-direction: column;
    gap: 0.5rem;
    text-align: center;
  }

  .category-numbers {
    align-items: center;
  }

  .performance-chart {
    grid-template-columns: 1fr;
  }

  .month-bars {
    height: 150px;
    gap: 0.5rem;
  }

  .chart-bars {
    gap: 0.25rem;
  }

  .chart-label {
    font-size: 0.65rem;
  }
}
</style>
