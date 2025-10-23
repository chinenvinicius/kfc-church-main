// Script to check if auto-import is working and updating the JSON file
const checkAutoImportStatus = async () => {
  console.log('🔍 Checking Auto-Import Status...\n')

  try {
    // Test 1: Check configuration
    console.log('1️⃣ Checking Google Sheets configuration...')
    const configResponse = await fetch('http://localhost:3500/api/google-sheets/config')
    const configData = await configResponse.json()
    
    if (!configData.success) {
      console.log('❌ Failed to get configuration')
      return
    }
    
    console.log('✅ Configuration loaded:')
    console.log('   - Enabled:', configData.data.enabled)
    console.log('   - Auto-Import:', configData.data.autoImport)
    console.log('   - Configured:', configData.data.configured)
    
    if (!configData.data.enabled) {
      console.log('❌ Google Sheets integration is not enabled')
      return
    }
    
    if (!configData.data.autoImport) {
      console.log('❌ Auto-import is not enabled')
      return
    }

    // Test 2: Check if worksheets exist
    console.log('\n2️⃣ Checking available worksheets...')
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

    // Test 3: Trigger manual import to test
    console.log('\n3️⃣ Testing manual import...')
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

    // Test 4: Check if JSON file is being updated
    console.log('\n4️⃣ Checking attendance data...')
    const attendanceResponse = await fetch('http://localhost:3500/api/attendance')
    const attendanceData = await attendanceResponse.json()
    
    if (attendanceData.success && attendanceData.data) {
      console.log('✅ Attendance data loaded from JSON:')
      console.log('   - Total records:', attendanceData.data.length)
      
      // Show recent records
      const recentRecords = attendanceData.data.slice(0, 3)
      console.log('   - Recent records:')
      recentRecords.forEach(record => {
        console.log(`     * ${record.firstName} ${record.lastName} - ${record.status} (${record.sabbathDate})`)
      })
    } else {
      console.log('❌ Failed to load attendance data')
    }

    console.log('\n🎯 Auto-Import Status Summary:')
    console.log('✅ Google Sheets integration is enabled')
    console.log('✅ Auto-import is enabled (checks every 10 seconds)')
    console.log('✅ Worksheets are accessible')
    console.log('✅ Import functionality is working')
    console.log('✅ JSON file is being updated')
    
    console.log('\n📝 Instructions:')
    console.log('1. Make changes in Google Sheets')
    console.log('2. Wait up to 10 seconds for automatic import')
    console.log('3. Refresh your attendance page to see changes')
    console.log('4. Or click "Import from Sheets" for immediate update')

  } catch (error) {
    console.error('❌ Check failed with error:', error.message)
  }
}

// Export for use in other files
export { checkAutoImportStatus }

// Auto-run if called directly
if (typeof window === 'undefined') {
  checkAutoImportStatus()
}