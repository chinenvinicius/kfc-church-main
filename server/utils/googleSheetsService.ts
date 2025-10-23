import { GoogleSpreadsheet } from 'google-spreadsheet'
import { JWT } from 'google-auth-library'
import { loadAttendanceDual } from './sync'
import { MembersDB } from './database'
import { writeFileSync, readFileSync, existsSync } from 'fs'
import { join } from 'path'

interface GoogleSheetsConfig {
  client_email: string
  private_key: string
  spreadsheet_id: string
  enabled: boolean
  autoImport: boolean
}

const CONFIG_PATH = join(process.cwd(), 'server/data/google-sheets-config.json')

/**
 * Load Google Sheets configuration
 */
function loadConfig(): GoogleSheetsConfig | null {
  try {
    if (!existsSync(CONFIG_PATH)) {
      return null
    }
    const configData = readFileSync(CONFIG_PATH, 'utf-8')
    return JSON.parse(configData)
  } catch (error) {
    console.error('Failed to load Google Sheets config:', error)
    return null
  }
}

/**
 * Save Google Sheets configuration
 */
function saveConfig(config: GoogleSheetsConfig): void {
  try {
    writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8')
  } catch (error) {
    console.error('Failed to save Google Sheets config:', error)
    throw error
  }
}

/**
 * Get Google Sheets configuration
 */
export function getGoogleSheetsConfig(): GoogleSheetsConfig | null {
  return loadConfig()
}

/**
 * Update Google Sheets configuration
 */
export function updateGoogleSheetsConfig(config: Partial<GoogleSheetsConfig>): GoogleSheetsConfig {
  const currentConfig = loadConfig() || {
    client_email: '',
    private_key: '',
    spreadsheet_id: '',
    enabled: false,
    autoImport: false
  }
  
  // Don't overwrite the private key if it's undefined (empty string from frontend)
  const configToUpdate = { ...config }
  if (configToUpdate.private_key === undefined) {
    delete configToUpdate.private_key
  }
  
  const newConfig = { ...currentConfig, ...configToUpdate }
  saveConfig(newConfig)
  return newConfig
}

/**
 * Initialize Google Sheets service
 */
async function initializeGoogleSheets(): Promise<GoogleSpreadsheet | null> {
  const config = loadConfig()
  
  if (!config || !config.enabled) {
    return null
  }
  
  if (!config.client_email || !config.private_key || !config.spreadsheet_id) {
    console.warn('Google Sheets configuration incomplete')
    return null
  }
  
  try {
    // Fix escaped newlines in private key
    const fixedPrivateKey = config.private_key.replace(/\\n/g, '\n')
    
    const serviceAccountAuth = new JWT({
      email: config.client_email,
      key: fixedPrivateKey,
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    })
    
    const doc = new GoogleSpreadsheet(config.spreadsheet_id, serviceAccountAuth)
    await doc.loadInfo()
    return doc
  } catch (error) {
    console.error('Failed to initialize Google Sheets:', error)
    return null
  }
}

/**
 * Ensure worksheet exists and has proper headers
 */
async function ensureWorksheet(doc: GoogleSpreadsheet, sheetTitle: string, headers: string[]): Promise<void> {
  let sheet = doc.sheetsByTitle[sheetTitle]
  
  if (!sheet) {
    sheet = await doc.addSheet({
      title: sheetTitle,
      headerValues: headers
    })
  } else {
    // Ensure headers are correct
    await sheet.loadHeaderRow()
    const currentHeaders = sheet.headerValues || []
    
    // Add any missing headers
    const missingHeaders = headers.filter(h => !currentHeaders.includes(h))
    if (missingHeaders.length > 0) {
      const newHeaders = [...currentHeaders, ...missingHeaders]
      await sheet.updateHeaderRow(newHeaders)
    }
  }
}

/**
 * Sync attendance data to Google Sheets
 */
export async function syncAttendanceToGoogleSheets(sabbathDate?: string): Promise<{ success: boolean; message: string }> {
  try {
    const doc = await initializeGoogleSheets()
    if (!doc) {
      return { success: false, message: 'Google Sheets not configured or enabled' }
    }
    
    // Load attendance data
    const { data: attendanceData } = await loadAttendanceDual(sabbathDate)
    const membersData = MembersDB.getAll(true)
    
    // Get unique Sabbath dates
    const uniqueDates = [...new Set(attendanceData.map(record => record.sabbathDate))].sort()
    
    // If specific date requested, only process that date
    const datesToProcess = sabbathDate ? [sabbathDate] : uniqueDates
    
    for (const date of datesToProcess) {
      // Create worksheet for this Sabbath date
      const sheetTitle = `Sabbath ${date}`
      await createSabbathWorksheet(doc, sheetTitle, date, attendanceData, membersData)
    }
    
    return {
      success: true,
      message: `Successfully synced ${datesToProcess.length} Sabbath date(s) to Google Sheets`
    }
  } catch (error) {
    console.error('Failed to sync to Google Sheets:', error)
    return {
      success: false,
      message: `Failed to sync to Google Sheets: ${error.message}`
    }
  }
}

/**
 * Create a worksheet for a specific Sabbath date
 */
async function createSabbathWorksheet(
  doc: GoogleSpreadsheet,
  sheetTitle: string,
  sabbathDate: string,
  attendanceData: any[],
  membersData: any[]
): Promise<void> {
  // Filter data for this specific date
  const dateAttendance = attendanceData.filter(record => record.sabbathDate === sabbathDate)
  
  // Get visitors for this date
  const { VisitorsDB } = await import('./database')
  const allVisitors = VisitorsDB.getAll()
  const dateVisitors = allVisitors.filter(visitor => visitor.dateOfVisit === sabbathDate)
  
  // Prepare headers
  const headers = [
    'Type', 'ID', 'First Name', 'Last Name', 'Category', 'Status', 'Notes', 'Is Active'
  ]
  
  // Ensure worksheet exists
  await ensureWorksheet(doc, sheetTitle, headers)
  const sheet = doc.sheetsByTitle[sheetTitle]
  
  // Clear existing data
  await sheet.clearRows()
  
  // Prepare member data
  const memberRows = membersData.map(member => {
    const attendance = dateAttendance.find(a => a.memberId === member.id)
    return {
      'Type': 'Member',
      'ID': member.id,
      'First Name': member.firstName,
      'Last Name': member.lastName,
      'Category': member.category,
      'Status': attendance ? attendance.status : 'Not Recorded',
      'Notes': attendance ? attendance.notes : '',
      'Is Active': member.isActive ? 'Yes' : 'No'
    }
  })
  
  // Prepare visitor data
  const visitorRows = dateVisitors.map(visitor => ({
    'Type': 'Visitor',
    'ID': visitor.id,
    'First Name': visitor.firstName,
    'Last Name': visitor.lastName,
    'Category': 'Visitor',
    'Status': 'Present',
    'Notes': visitor.notes || '',
    'Is Active': 'N/A'
  }))
  
  // Combine all data
  const allRows = [...memberRows, ...visitorRows]
  
  // Add data if we have any
  if (allRows.length > 0) {
    await sheet.addRows(allRows)
  }
  
  // Add totals at the end
  await addTotalsRow(sheet, allRows)
}

/**
 * Add totals row at the end of the worksheet
 */
async function addTotalsRow(sheet: GoogleSpreadsheet, data: any[]): Promise<void> {
  const totalMembers = data.filter(row => row.Type === 'Member').length
  const totalVisitors = data.filter(row => row.Type === 'Visitor').length
  const presentMembers = data.filter(row => row.Type === 'Member' && row.Status === 'Present').length
  const presentVisitors = data.filter(row => row.Type === 'Visitor' && row.Status === 'Present').length
  const absentMembers = data.filter(row => row.Type === 'Member' && row.Status === 'Absent').length
  const otherMembers = data.filter(row => row.Type === 'Member' && row.Status === 'Other').length
  
  // Add empty row for spacing
  await sheet.addRow({})
  
  // Add totals row
  await sheet.addRow({
    'Type': 'TOTALS',
    'ID': '',
    'First Name': `Members: ${totalMembers} (${presentMembers} Present, ${absentMembers} Absent, ${otherMembers} Other)`,
    'Last Name': `Visitors: ${totalVisitors} (${presentVisitors} Present)`,
    'Category': `Total People: ${totalMembers + totalVisitors}`,
    'Status': `Overall Present: ${presentMembers + presentVisitors}`,
    'Notes': '',
    'Is Active': ''
  })
}

/**
 * Update summary sheet with attendance statistics
 */
async function updateSummarySheet(
  doc: GoogleSpreadsheet, 
  attendanceData: any[], 
  membersData: any[],
  sabbathDate?: string
): Promise<void> {
  const summaryHeaders = [
    'Member ID', 'First Name', 'Last Name', 'Category', 'Status', 
    'Notes', 'Sabbath Date', 'Is Active'
  ]
  
  const sheetTitle = sabbathDate ? `Summary ${sabbathDate}` : 'Summary All'
  await ensureWorksheet(doc, sheetTitle, summaryHeaders)
  
  const sheet = doc.sheetsByTitle[sheetTitle]
  
  // Clear existing data
  await sheet.clearRows()
  
  // Create summary data (one row per member)
  const summaryData = membersData.map(member => {
    const memberAttendance = attendanceData.filter(a => a.memberId === member.id)
    const attendance = memberAttendance.length > 0 ? memberAttendance[0] : null
    
    return {
      'Member ID': member.id,
      'First Name': member.firstName,
      'Last Name': member.lastName,
      'Category': member.category,
      'Status': attendance?.status || 'not recorded',
      'Notes': attendance?.notes || '',
      'Sabbath Date': attendance?.sabbathDate || sabbathDate || 'Various',
      'Is Active': member.isActive ? 'Yes' : 'No'
    }
  })
  
  if (summaryData.length > 0) {
    await sheet.addRows(summaryData)
  }
}

/**
 * Test Google Sheets connection
 */
export async function testGoogleSheetsConnection(): Promise<{ success: boolean; message: string }> {
  try {
    const doc = await initializeGoogleSheets()
    if (!doc) {
      return { success: false, message: 'Google Sheets not configured or enabled' }
    }
    
    await doc.loadInfo()
    return { 
      success: true, 
      message: `Successfully connected to spreadsheet: ${doc.title}` 
    }
  } catch (error) {
    console.error('Google Sheets connection test failed:', error)
    return { 
      success: false, 
      message: `Connection failed: ${error.message}` 
    }
  }
}

/**
 * Get list of worksheets in the spreadsheet
 */
export async function getGoogleSheetsWorksheets(): Promise<{ success: boolean; sheets: string[]; message: string }> {
  try {
    const doc = await initializeGoogleSheets()
    if (!doc) {
      return { success: false, sheets: [], message: 'Google Sheets not configured or enabled' }
    }
    
    await doc.loadInfo()
    const sheets = Object.keys(doc.sheetsByTitle)
    
    return { 
      success: true, 
      sheets,
      message: `Found ${sheets.length} worksheets` 
    }
  } catch (error) {
    console.error('Failed to get worksheets:', error)
    return { 
      success: false, 
      sheets: [],
      message: `Failed to get worksheets: ${error.message}` 
    }
  }
}
/**
 * Sync attendance data from Google Sheets to local system
 */
export async function syncFromGoogleSheets(sabbathDate?: string): Promise<{ success: boolean; message: string; results?: any }> {
  try {
    const doc = await initializeGoogleSheets()
    if (!doc) {
      return { success: false, message: 'Google Sheets not configured or enabled' }
    }
    
    await doc.loadInfo()
    const sheetTitles = Object.keys(doc.sheetsByTitle)
    
    // Filter sheets that match our pattern
    const sabbathSheets = sabbathDate
      ? sheetTitles.filter(title => {
          // Try exact match first
          if (title === `Sabbath ${sabbathDate}`) return true
          
          // Try different date formats
          const dateObj = new Date(sabbathDate)
          const year = dateObj.getFullYear()
          const month = dateObj.getMonth() + 1
          const day = dateObj.getDate()
          
          // Format: M/D (e.g., 8/16)
          const shortFormat = `${month}/${day}`
          if (title === `Sabbath ${shortFormat}`) return true
          
          // Format: M/D/YYYY (e.g., 8/16/2024)
          const longFormat = `${month}/${day}/${year}`
          if (title === `Sabbath ${longFormat}`) return true
          
          return false
        })
      : sheetTitles.filter(title => title.startsWith('Sabbath '))
    
    if (sabbathSheets.length === 0) {
      return { success: false, message: 'No Sabbath sheets found' }
    }
    
    const results = {
      updated: 0,
      created: 0,
      errors: 0,
      errorDetails: [] as string[]
    }
    
    for (const sheetTitle of sabbathSheets) {
      console.log(`\n📋 Processing worksheet: ${sheetTitle}`)
      const sheet = doc.sheetsByTitle[sheetTitle]
      await sheet.loadHeaderRow()
      
      // Extract Sabbath date from sheet title and normalize it
      let sheetSabbathDate = sheetTitle.replace('Sabbath ', '')
      
      // Convert different date formats to YYYY-MM-DD
      if (!sheetSabbathDate.includes('-')) {
        // Handle formats like "8/16" or "8/16/2024"
        const parts = sheetSabbathDate.split('/')
        let month = parseInt(parts[0])
        let day = parseInt(parts[1])
        let year = parts[2] ? parseInt(parts[2]) : new Date().getFullYear()
        
        sheetSabbathDate = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
      }
      
      console.log(`📅 Processing date: ${sheetSabbathDate}`)
      
      // Get all rows (excluding totals and empty rows)
      const rows = await sheet.getRows()
      console.log(`📊 Found ${rows.length} total rows`)
      
      const validRows = rows.filter(row =>
        row.Type &&
        row.Type !== 'TOTALS' &&
        row.ID &&
        row['First Name'] &&
        row['Last Name']
      )
      
      console.log(`✅ Found ${validRows.length} valid rows`)
      
      if (validRows.length === 0) {
        console.log('⚠️ No valid rows found to process')
        continue
      }
      
      for (const row of validRows) {
        try {
          if (row.Type === 'Member') {
            await processMemberRow(row, sheetSabbathDate, results)
          } else if (row.Type === 'Visitor') {
            await processVisitorRow(row, sheetSabbathDate, results)
          }
        } catch (error) {
          console.error(`❌ Row processing error: ${error.message}`)
          results.errors++
          results.errorDetails.push(`Row processing error for ${row.Type} ${row['First Name']} ${row['Last Name']}: ${error.message}`)
        }
      }
      
      console.log(`✅ Completed worksheet: ${sheetTitle}`)
    }
    
    return { 
      success: true, 
      message: `Successfully synced from Google Sheets: ${results.created} created, ${results.updated} updated, ${results.errors} errors`,
      results
    }
  } catch (error) {
    console.error('Failed to sync from Google Sheets:', error)
    return { 
      success: false, 
      message: `Failed to sync from Google Sheets: ${error.message}` 
    }
  }
}

/**
 * Process a member row from Google Sheets
 */
async function processMemberRow(row: any, sabbathDate: string, results: any): Promise<void> {
  const memberId = parseInt(row.ID)
  const status = row.Status?.toLowerCase()
  const notes = row['Notes'] || ''
  
  console.log(`🔄 Processing member: ID=${memberId}, Status=${status}, Date=${sabbathDate}`)
  
  // Validate member exists
  const { MembersDB } = await import('./database')
  const member = MembersDB.getById(memberId)
  if (!member) {
    console.log(`❌ Member ID ${memberId} not found`)
    results.errors++
    results.errorDetails.push(`Member ID ${memberId} not found`)
    return
  }
  
  // Validate status
  if (!['present', 'absent', 'other', 'not recorded'].includes(status)) {
    console.log(`❌ Invalid status "${status}" for member ${memberId}`)
    results.errors++
    results.errorDetails.push(`Invalid status "${status}" for member ${memberId}`)
    return
  }
  
  // Check if attendance record exists
  const { jsonOnlyStorage } = await import('./jsonOnlyStorage')
  const existingRecords = await jsonOnlyStorage.attendance.getAll(sabbathDate)
  const existingRecord = existingRecords.find(r => r.memberId === memberId)
  
  const attendanceData = {
    memberId,
    sabbathDate,
    status: status === 'not recorded' ? 'other' : status,
    notes
  }
  
  if (existingRecord) {
    // Compare existing record with new data
    const hasChanges =
      existingRecord.status !== attendanceData.status ||
      existingRecord.notes !== attendanceData.notes
    
    if (hasChanges) {
      console.log(`📝 Updating member ${memberId}: ${existingRecord.status}→${attendanceData.status}, notes changed`)
      await jsonOnlyStorage.attendance.update(existingRecord.id, attendanceData)
      results.updated++
    } else {
      console.log(`✅ Member ${memberId} no changes needed`)
    }
  } else if (status !== 'not recorded') {
    // Create new record (only if status is not "not recorded")
    console.log(`➕ Creating new attendance record for member ${memberId}: ${attendanceData.status}`)
    await jsonOnlyStorage.attendance.create(attendanceData)
    results.created++
  } else {
    console.log(`⏭️ Skipping member ${memberId}: status is "not recorded"`)
  }
}

/**
 * Process a visitor row from Google Sheets
 */
async function processVisitorRow(row: any, sabbathDate: string, results: any): Promise<void> {
  const visitorId = parseInt(row.ID)
  const status = row.Status?.toLowerCase()
  
  // Validate status
  if (!['present'].includes(status)) {
    results.errors++
    results.errorDetails.push(`Invalid status "${status}" for visitor ${visitorId}`)
    return
  }
  
  // Check if visitor exists
  const { VisitorsDB } = await import('./database')
  const visitor = VisitorsDB.getById(visitorId)
  if (!visitor) {
    results.errors++
    results.errorDetails.push(`Visitor ID ${visitorId} not found`)
    return
  }
  
  // Update visitor notes if changed
  if (row['Notes'] && row['Notes'] !== visitor.notes) {
    await VisitorsDB.update(visitorId, {
      notes: row['Notes']
    })
    results.updated++
  }
}

/**
 * Watch for changes in Google Sheets (polling mechanism)
 */
export async function watchGoogleSheetsChanges(intervalMinutes: number = 5): Promise<void> {
  const config = loadConfig()
  if (!config || !config.enabled) {
    console.log('❌ Google Sheets watcher not started: Integration not enabled')
    return
  }
  
  const intervalSeconds = Math.round(intervalMinutes * 60)
  console.log(`⏰ Starting Google Sheets change watcher (checking every ${intervalSeconds} seconds)`)
  
  // Run once immediately
  console.log('🔄 Running initial Google Sheets sync...')
  try {
    const result = await syncFromGoogleSheets()
    if (result.success) {
      if (result.results?.created || result.results?.updated) {
        console.log(`✅ Initial sync: ${result.results.created} created, ${result.results.updated} updated`)
      } else {
        console.log('✅ Initial sync: No changes found')
      }
    } else {
      console.log('❌ Initial sync failed:', result.message)
    }
  } catch (error) {
    console.error('❌ Initial sync error:', error)
  }
  
  // Set up interval
  setInterval(async () => {
    console.log('🔄 Checking Google Sheets for changes...')
    try {
      const result = await syncFromGoogleSheets()
      if (result.success) {
        if (result.results?.created || result.results?.updated) {
          console.log(`✅ Google Sheets sync: ${result.results.created} created, ${result.results.updated} updated`)
        } else {
          console.log('✅ Google Sheets sync: No changes found')
        }
      } else {
        console.log('❌ Google Sheets sync failed:', result.message)
      }
    } catch (error) {
      console.error('❌ Google Sheets watcher error:', error)
    }
  }, intervalSeconds * 1000)
}

/**
 * Start auto-import watcher if enabled
 */
export function startAutoImportWatcher(): void {
  const config = loadConfig()
  console.log('🔍 Google Sheets Auto-Import Check:', {
    hasConfig: !!config,
    enabled: config?.enabled,
    autoImport: config?.autoImport
  })
  
  if (config && config.enabled && config.autoImport) {
    console.log('🚀 Starting automatic Google Sheets import watcher (every 1 minute to avoid rate limits)...')
    watchGoogleSheetsChanges(1) // Check every 1 minute (minimum to avoid rate limits)
  } else {
    console.log('⏸️  Google Sheets auto-import is disabled')
    if (!config) console.log('   - No configuration found')
    else if (!config.enabled) console.log('   - Google Sheets integration not enabled')
    else if (!config.autoImport) console.log('   - Auto-import not enabled')
  }
}
