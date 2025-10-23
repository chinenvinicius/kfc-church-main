// Simple test script to manually trigger Google Sheets import
const testManualImport = async () => {
  console.log('🔧 Testing Manual Google Sheets Import...\n')

  try {
    // Step 1: Check configuration
    console.log('1️⃣ Checking configuration...')
    const configResponse = await fetch('http://localhost:3500/api/google-sheets/config')
    const configData = await configResponse.json()
    
    if (!configData.success) {
      console.log('❌ Failed to get configuration:', configData.message)
      return
    }
    
    console.log('✅ Configuration:')
    console.log('   - Enabled:', configData.data.enabled)
    console.log('   - Auto-Import:', configData.data.autoImport)
    console.log('   - Configured:', configData.data.configured)
    
    if (!configData.data.enabled) {
      console.log('❌ Google Sheets is not enabled')
      return
    }

    // Step 2: Test connection
    console.log('\n2️⃣ Testing connection...')
    const testResponse = await fetch('http://localhost:3500/api/google-sheets/test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ action: 'connection' })
    })
    const testData = await testResponse.json()
    
    if (!testData.success) {
      console.log('❌ Connection failed:', testData.message)
      return
    }
    
    console.log('✅ Connection successful:', testData.message)

    // Step 3: List worksheets
    console.log('\n3️⃣ Listing worksheets...')
    const sheetsResponse = await fetch('http://localhost:3500/api/google-sheets/test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ action: 'worksheets' })
    })
    const sheetsData = await sheetsResponse.json()
    
    if (!sheetsData.success) {
      console.log('❌ Failed to list worksheets:', sheetsData.message)
      return
    }
    
    console.log('✅ Available worksheets:')
    sheetsData.sheets.forEach(sheet => {
      console.log('   -', sheet)
    })

    // Step 4: Manual import
    console.log('\n4️⃣ Triggering manual import...')
    const importResponse = await fetch('http://localhost:3500/api/google-sheets/sync-from', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    })
    const importData = await importResponse.json()
    
    console.log('Import Response:')
    console.log('   - Success:', importData.success)
    console.log('   - Message:', importData.message)
    
    if (importData.results) {
      console.log('   - Created:', importData.results.created)
      console.log('   - Updated:', importData.results.updated)
      console.log('   - Errors:', importData.results.errors)
      
      if (importData.results.errors > 0) {
        console.log('\n⚠️  Errors:')
        importData.results.errorDetails.forEach(error => {
          console.log('   -', error)
        })
      }
    }

    // Step 5: Check recent attendance
    console.log('\n5️⃣ Checking recent attendance data...')
    const attendanceResponse = await fetch('http://localhost:3500/api/attendance')
    const attendanceData = await attendanceResponse.json()
    
    if (attendanceData.success && attendanceData.data) {
      console.log('✅ Attendance data loaded:')
      console.log('   - Total records:', attendanceData.data.length)
      
      // Get unique dates
      const uniqueDates = [...new Set(attendanceData.data.map(r => r.sabbathDate))].sort()
      console.log('   - Sabbath dates:', uniqueDates.join(', '))
      
      // Show recent records
      const recentRecords = attendanceData.data.slice(0, 5)
      console.log('   - Recent records:')
      recentRecords.forEach(record => {
        console.log(`     * ${record.firstName} ${record.lastName} - ${record.status} (${record.sabbathDate})`)
      })
    } else {
      console.log('❌ Failed to load attendance data')
    }

    console.log('\n🎯 Test Complete!')
    console.log('If the import shows 0 created/updated, try making a change in Google Sheets first.')

  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

// Run the test
testManualImport()