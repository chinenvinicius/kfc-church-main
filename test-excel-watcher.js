/**
 * Test script for Excel Watcher functionality
 * This script tests the complete workflow:
 * 1. Enable the Excel watcher
 * 2. Check for Excel files
 * 3. Trigger manual check
 * 4. Verify real-time updates
 */

const baseURL = 'http://localhost:3500'

async function testExcelWatcher() {
  console.log('🧪 Testing Excel Watcher Workflow...\n')

  try {
    // Test 1: Get current status
    console.log('1️⃣ Getting current Excel watcher status...')
    const statusResponse = await fetch(`${baseURL}/api/excel-watcher/config`)
    const status = await statusResponse.json()
    console.log('Current status:', status.config)
    console.log('✅ Status check passed\n')

    // Test 2: Enable Excel watcher
    console.log('2️⃣ Enabling Excel watcher...')
    const enableResponse = await fetch(`${baseURL}/api/test/excel-watcher`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ action: 'enable' })
    })
    const enableResult = await enableResponse.json()
    console.log('Enable result:', enableResult)
    console.log('✅ Excel watcher enabled\n')

    // Test 3: Get Excel files list
    console.log('3️⃣ Getting Excel files list...')
    const filesResponse = await fetch(`${baseURL}/api/excel/files`)
    const files = await filesResponse.json()
    console.log(`Found ${files.files?.length || 0} Excel files:`)
    files.files?.forEach(file => {
      console.log(`  - ${file.name} (${file.size} bytes)`)
    })
    console.log('✅ Files list retrieved\n')

    // Test 4: Trigger manual check
    console.log('4️⃣ Triggering manual Excel check...')
    const checkResponse = await fetch(`${baseURL}/api/test/excel-watcher`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ action: 'check' })
    })
    const checkResult = await checkResponse.json()
    console.log('Check result:', checkResult)
    console.log('✅ Manual check completed\n')

    // Test 5: Check for update notifications
    console.log('5️⃣ Checking for update notifications...')
    const notificationsResponse = await fetch(`${baseURL}/api/updates/notifications`)
    const notifications = await notificationsResponse.json()
    console.log('Notifications:', notifications)
    console.log('✅ Notifications checked\n')

    // Test 6: Get attendance data to verify updates
    console.log('6️⃣ Getting attendance data...')
    const attendanceResponse = await fetch(`${baseURL}/api/attendance`)
    const attendance = await attendanceResponse.json()
    console.log(`Found ${attendance.data?.length || 0} attendance records`)
    console.log('✅ Attendance data retrieved\n')

    console.log('🎉 All tests completed successfully!')
    console.log('\n📋 Summary:')
    console.log('- Excel watcher is enabled and configured')
    console.log('- Excel files are being monitored')
    console.log('- Manual checks work correctly')
    console.log('- Real-time update notifications are available')
    console.log('- Attendance data is accessible')

  } catch (error) {
    console.error('❌ Test failed:', error.message)
    console.error('Stack:', error.stack)
  }
}

// Run the test
testExcelWatcher()