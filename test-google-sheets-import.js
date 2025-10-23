// Test script for importing changes from Google Sheets
// Run this to debug the import process

const testGoogleSheetsImport = async () => {
  console.log('🧪 Testing Google Sheets Import...\n')

  try {
    // Test 1: Check if Google Sheets is configured
    console.log('1️⃣ Checking Google Sheets configuration...')
    const configResponse = await fetch('http://localhost:3500/api/google-sheets/config')
    const configData = await configResponse.json()
    
    if (!configData.success || !configData.data.configured) {
      console.log('❌ Google Sheets not configured')
      return
    }
    
    if (!configData.data.enabled) {
      console.log('❌ Google Sheets not enabled')
      return
    }
    
    console.log('✅ Google Sheets is configured and enabled')

    // Test 2: Test connection
    console.log('\n2️⃣ Testing Google Sheets connection...')
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
    
    console.log('✅ Connection successful')

    // Test 3: List worksheets
    console.log('\n3️⃣ Listing available worksheets...')
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
    
    console.log('✅ Available worksheets:', sheetsData.sheets.join(', '))

    // Test 4: Try importing from Google Sheets
    console.log('\n4️⃣ Testing import from Google Sheets...')
    const importResponse = await fetch('http://localhost:3500/api/google-sheets/sync-from', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
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

  } catch (error) {
    console.error('❌ Test failed with error:', error.message)
  }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testGoogleSheetsImport }
}

// Auto-run if called directly
if (typeof window === 'undefined' && require.main === module) {
  testGoogleSheetsImport()
}