// Debug script to show exactly what data is in Google Sheets vs local system
const debugGoogleSheetsData = async () => {
  console.log('🔍 Debugging Google Sheets Data Comparison...\n')

  try {
    // Step 1: Get configuration
    console.log('1️⃣ Getting configuration...')
    const configResponse = await fetch('http://localhost:3500/api/google-sheets/config')
    const configData = await configResponse.json()

    if (!configData.data.enabled) {
      console.log('❌ Google Sheets integration not enabled')
      return
    }

    // Step 2: Get worksheets
    console.log('\n2️⃣ Getting worksheets...')
    const sheetsResponse = await fetch('http://localhost:3500/api/google-sheets/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'worksheets' })
    })
    const sheetsData = await sheetsResponse.json()

    console.log('📋 Available worksheets:', sheetsData.sheets.join(', '))

    // Step 3: Get Google Sheets data directly
    console.log('\n3️⃣ Getting Google Sheets data...')
    const { GoogleSpreadsheet } = await import('google-spreadsheet')
    const { JWT } = await import('google-auth-library')
    const { readFileSync } = await import('fs')
    const { join } = await import('path')

    const CONFIG_PATH = join(process.cwd(), 'server/data/google-sheets-config.json')
    const config = JSON.parse(readFileSync(CONFIG_PATH, 'utf-8'))

    const serviceAccountAuth = new JWT({
      email: config.client_email,
      key: config.private_key.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    })

    const doc = new GoogleSpreadsheet(config.spreadsheet_id, serviceAccountAuth)
    await doc.loadInfo()

    // Find Sabbath worksheets
    const sabbathSheets = Object.keys(doc.sheetsByTitle).filter(title => title.startsWith('Sabbath '))
    console.log(`🎯 Found ${sabbathSheets.length} Sabbath worksheets`)

    for (const sheetTitle of sabbathSheets) {
      console.log(`\n📋 Processing: ${sheetTitle}`)
      const sheet = doc.sheetsByTitle[sheetTitle]
      await sheet.loadHeaderRow()

      const rows = await sheet.getRows()
      console.log(`📊 Found ${rows.length} rows`)

      // Show first few rows
      const validRows = rows.filter(row =>
        row.Type &&
        row.Type !== 'TOTALS' &&
        row.ID &&
        row['First Name'] &&
        row['Last Name']
      )

      console.log(`✅ Valid rows: ${validRows.length}`)
      console.log('📝 Sample data:')
      validRows.slice(0, 3).forEach((row, index) => {
        console.log(`   ${index + 1}. ${row.Type} ${row['First Name']} ${row['Last Name']} - ${row.Status} (${row.ID})`)
      })

      // Check if any rows have changes
      console.log('\n🔍 Checking for changes...')
      for (const row of validRows) {
        if (row.Type === 'Member') {
          const memberId = parseInt(row.ID)
          const status = row.Status?.toLowerCase()
          const notes = row['Notes'] || ''

          // Get existing record
          const attendanceResponse = await fetch(`http://localhost:3500/api/attendance?sabbathDate=${sheetTitle.replace('Sabbath ', '')}`)
          const attendanceData = await attendanceResponse.json()

          if (attendanceData.success && attendanceData.data) {
            const existingRecord = attendanceData.data.find(r => r.memberId === memberId)
            if (existingRecord) {
              const hasChanges = existingRecord.status !== status || existingRecord.notes !== notes
              if (hasChanges) {
                console.log(`📝 CHANGE DETECTED: ${row['First Name']} ${row['Last Name']} (${memberId})`)
                console.log(`   Google Sheets: ${status} - "${notes}"`)
                console.log(`   Local System: ${existingRecord.status} - "${existingRecord.notes}"`)
              } else {
                console.log(`✅ No change: ${row['First Name']} ${row['Last Name']} (${memberId})`)
              }
            } else if (status !== 'not recorded') {
              console.log(`➕ NEW RECORD: ${row['First Name']} ${row['Last Name']} (${memberId}) - ${status}`)
            }
          }
        }
      }
    }

    // Step 4: Get local attendance data
    console.log('\n4️⃣ Getting local attendance data...')
    const localAttendanceResponse = await fetch('http://localhost:3500/api/attendance')
    const localAttendanceData = await localAttendanceResponse.json()

    if (localAttendanceData.success && localAttendanceData.data) {
      console.log(`✅ Local data: ${localAttendanceData.data.length} records`)
      const uniqueDates = [...new Set(localAttendanceData.data.map(r => r.sabbathDate))].sort()
      console.log('📅 Local dates:', uniqueDates.join(', '))
    } else {
      console.log('❌ Failed to get local attendance data')
    }

    console.log('\n🎯 Debug Complete!')
    console.log('Check the logs above to see what data is in Google Sheets vs local system')

  } catch (error) {
    console.error('❌ Debug failed:', error.message)
  }
}

// Run the debug
debugGoogleSheetsData()