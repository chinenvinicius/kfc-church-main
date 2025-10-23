// Debug script to test Google Sheets import for specific date
const debugGoogleSheetsImport = async () => {
  console.log('🔍 Debugging Google Sheets Import for 8/16...\n')

  try {
    // Test 1: Check configuration
    console.log('1️⃣ Checking Google Sheets configuration...')
    const configResponse = await fetch('http://localhost:3500/api/google-sheets/config')
    const configData = await configResponse.json()
    
    if (!configData.success || !configData.data.enabled) {
      console.log('❌ Google Sheets not enabled')
      return
    }
    
    console.log('✅ Google Sheets is enabled')
    console.log('📅 Auto-import enabled:', configData.data.autoImport)

    // Test 2: List worksheets
    console.log('\n2️⃣ Listing available worksheets...')
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

    // Test 3: Try importing for specific date
    console.log('\n3️⃣ Testing import for 8/16...')
    const importResponse = await fetch('http://localhost:3500/api/google-sheets/sync-from', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ sabbathDate: '2024-08-16' })
    })
    const importData = await importResponse.json()
    
    if (!importData.success) {
      console.log('❌ Import failed:', importData.message)
      return
    }
    
    console.log('✅ Import successful!')
    console.log('📊 Results:', importData.results)
    
    if (importData.results && importData.results.errors > 0) {
      console.log('\n⚠️  Errors occurred during import:')
      importData.results.errorDetails.forEach(error => {
        console.log('   -', error)
      })
    }

    // Test 4: Check current attendance for Ricky Preño
    console.log('\n4️⃣ Checking current attendance for Ricky Preño...')
    const attendanceResponse = await fetch('http://localhost:3500/api/attendance?sabbathDate=2024-08-16')
    const attendanceData = await attendanceResponse.json()
    
    if (attendanceData.success && attendanceData.data) {
      const rickyRecord = attendanceData.data.find(record => 
        record.firstName.toLowerCase() === 'ricky' && 
        record.lastName.toLowerCase() === 'preño'
      )
      
      if (rickyRecord) {
        console.log('✅ Found Ricky Preño record:')
        console.log('   - ID:', rickyRecord.id)
        console.log('   - Status:', rickyRecord.status)
        console.log('   - Notes:', rickyRecord.notes)
        console.log('   - Updated At:', rickyRecord.updatedAt)
      } else {
        console.log('❌ Ricky Preño record not found for 2024-08-16')
      }
    } else {
      console.log('❌ Failed to fetch attendance data')
    }

  } catch (error) {
    console.error('❌ Debug failed with error:', error.message)
  }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { debugGoogleSheetsImport }
}

// Auto-run if called directly
if (typeof window === 'undefined' && require.main === module) {
  debugGoogleSheetsImport()
}