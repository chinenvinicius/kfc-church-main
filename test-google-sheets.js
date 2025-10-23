// Test script for Google Sheets integration
// Run this script to test your Google Sheets setup

const testGoogleSheets = async () => {
  console.log('🧪 Testing Google Sheets Integration...\n')

  try {
    // Test 1: Get current configuration
    console.log('1️⃣ Testing configuration endpoint...')
    const configResponse = await fetch('http://localhost:3500/api/google-sheets/config')
    const configData = await configResponse.json()
    
    if (configData.success) {
      console.log('✅ Configuration endpoint working')
      console.log('   Configured:', configData.data.configured)
      console.log('   Enabled:', configData.data.enabled)
    } else {
      console.log('❌ Configuration endpoint failed')
      return
    }

    // Test 2: Test connection (if configured)
    if (configData.data.configured) {
      console.log('\n2️⃣ Testing Google Sheets connection...')
      const testResponse = await fetch('http://localhost:3500/api/google-sheets/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'connection' })
      })
      const testData = await testResponse.json()
      
      if (testData.success) {
        console.log('✅ Google Sheets connection successful')
        console.log('   Message:', testData.message)
      } else {
        console.log('❌ Google Sheets connection failed')
        console.log('   Error:', testData.message)
      }

      // Test 3: List worksheets (if connection works)
      if (testData.success) {
        console.log('\n3️⃣ Testing worksheet listing...')
        const sheetsResponse = await fetch('http://localhost:3500/api/google-sheets/test', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ action: 'worksheets' })
        })
        const sheetsData = await sheetsResponse.json()
        
        if (sheetsData.success) {
          console.log('✅ Worksheet listing successful')
          console.log('   Sheets found:', sheetsData.sheets.join(', '))
        } else {
          console.log('❌ Worksheet listing failed')
          console.log('   Error:', sheetsData.message)
        }
      }
    } else {
      console.log('\n⚠️  Google Sheets not configured. Please set up credentials first.')
      console.log('   Follow the setup guide in GOOGLE_SHEETS_SETUP.md')
    }

    // Test 4: Test sync endpoint (if configured and enabled)
    if (configData.data.configured && configData.data.enabled) {
      console.log('\n4️⃣ Testing attendance sync...')
      const syncResponse = await fetch('http://localhost:3500/api/google-sheets/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      })
      const syncData = await syncResponse.json()
      
      if (syncData.success) {
        console.log('✅ Attendance sync successful')
        console.log('   Message:', syncData.message)
      } else {
        console.log('❌ Attendance sync failed')
        console.log('   Error:', syncData.message)
      }
    }

    console.log('\n🎉 Google Sheets integration test completed!')

  } catch (error) {
    console.error('❌ Test failed with error:', error.message)
    console.log('\nMake sure the server is running on http://localhost:3500')
  }
}

// Configuration test helper
const testConfiguration = async (config) => {
  console.log('🔧 Testing configuration update...')
  
  try {
    const response = await fetch('http://localhost:3500/api/google-sheets/config', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(config)
    })
    
    const data = await response.json()
    
    if (data.success) {
      console.log('✅ Configuration updated successfully')
      if (data.connectionTest) {
        console.log('   Connection test:', data.connectionTest.success ? 'PASSED' : 'FAILED')
        if (!data.connectionTest.success) {
          console.log('   Error:', data.connectionTest.message)
        }
      }
    } else {
      console.log('❌ Configuration update failed')
      console.log('   Error:', data.message)
    }
  } catch (error) {
    console.error('❌ Configuration test failed:', error.message)
  }
}

// Example usage:
// testGoogleSheets()
// 
// // To test configuration:
// testConfiguration({
//   client_email: 'your-service-account@project.iam.gserviceaccount.com',
//   private_key: '-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n',
//   spreadsheet_id: 'your-spreadsheet-id',
//   enabled: true
// })

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testGoogleSheets, testConfiguration }
}

// Auto-run if called directly
if (typeof window === 'undefined' && require.main === module) {
  testGoogleSheets()
}