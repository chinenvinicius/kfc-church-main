import * as XLSX from 'xlsx'
import { join } from 'path'
import { writeFileSync, readFileSync, existsSync, mkdirSync, readdirSync, statSync, unlinkSync } from 'fs'
import { AttendanceDB, MembersDB, VisitorsDB } from './database'
import { loadAttendanceDual, saveAttendanceDual } from './sync'

/**
 * Excel file paths
 */
const EXCEL_DIR = join(process.cwd(), 'server/excel')
const ATTENDANCE_EXCEL_PATH = join(EXCEL_DIR, 'attendance.xlsx')
const MEMBERS_EXCEL_PATH = join(EXCEL_DIR, 'members.xlsx')
const VISITORS_EXCEL_PATH = join(EXCEL_DIR, 'visitors.xlsx')

/**
 * Ensure Excel directory exists
 */
function ensureExcelDir() {
  if (!existsSync(EXCEL_DIR)) {
    mkdirSync(EXCEL_DIR, { recursive: true })
  }
}

/**
 * Export attendance data to Excel
 */
export async function exportAttendanceToExcel(options: {
  sabbathDate?: string
  includeMembers?: boolean
  format?: 'detailed' | 'summary'
} = {}) {
  try {
    ensureExcelDir()
    
    // Load attendance data
    const { data: attendanceData } = await loadAttendanceDual(options.sabbathDate)
    
    // Load members data if needed
    let membersData = []
    if (options.includeMembers) {
      membersData = MembersDB.getAll(true) // Include inactive
    }
    
    // Create workbook
    const workbook = XLSX.utils.book_new()
    
    if (options.format === 'summary') {
      // Summary format - one row per member with attendance status
      await createSummarySheet(workbook, attendanceData, membersData, options.sabbathDate)
    } else {
      // Detailed format - one row per attendance record
      await createDetailedAttendanceSheet(workbook, attendanceData, membersData)
    }
    
    // Add members sheet if requested
    if (options.includeMembers) {
      createMembersSheet(workbook, membersData)
    }
    
    // Add statistics sheet
    await createStatsSheet(workbook, attendanceData, options.sabbathDate)
    
    // Write to file
    const filename = options.sabbathDate
      ? `attendance_${options.sabbathDate}.xlsx`
      : `attendance_all_${new Date().toISOString().split('T')[0]}.xlsx`

    const filepath = join(EXCEL_DIR, filename)

    // Use writeFileSync with buffer instead of XLSX.writeFile
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
    writeFileSync(filepath, buffer)
    
    return {
      success: true,
      filename,
      filepath,
      recordCount: attendanceData.length
    }
  } catch (error) {
    console.error('Excel export failed:', error)
    throw error
  }
}

/**
 * Create detailed attendance sheet
 */
async function createDetailedAttendanceSheet(workbook: XLSX.WorkBook, attendanceData: any[], membersData: any[]) {
  // Prepare data with member names
  const enrichedData = attendanceData.map(record => {
    const member = membersData.find(m => m.id === record.memberId)
    return {
      'ID': record.id,
      'Member ID': record.memberId,
      'First Name': member?.firstName || 'Unknown',
      'Last Name': member?.lastName || 'Unknown',
      'Full Name': member ? `${member.firstName} ${member.lastName}` : 'Unknown',
      'Category': member?.category || 'Unknown',
      'Sabbath Date': record.sabbathDate,
      'Status': record.status,
      'Notes': record.notes || '',
      'Created At': record.createdAt || '',
      'Updated At': record.updatedAt || ''
    }
  })
  
  // Create worksheet
  const worksheet = XLSX.utils.json_to_sheet(enrichedData)
  
  // Set column widths
  const colWidths = [
    { wch: 8 },  // ID
    { wch: 10 }, // Member ID
    { wch: 15 }, // First Name
    { wch: 15 }, // Last Name
    { wch: 25 }, // Full Name
    { wch: 12 }, // Category
    { wch: 12 }, // Sabbath Date
    { wch: 10 }, // Status
    { wch: 30 }, // Notes
    { wch: 20 }, // Created At
    { wch: 20 }  // Updated At
  ]
  worksheet['!cols'] = colWidths
  
  // Add to workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance Details')
}

/**
 * Create summary sheet (one row per member)
 */
async function createSummarySheet(workbook: XLSX.WorkBook, attendanceData: any[], membersData: any[], sabbathDate?: string) {
  const summaryData = membersData.map(member => {
    const memberAttendance = attendanceData.filter(a => a.memberId === member.id)
    const status = memberAttendance.length > 0 ? memberAttendance[0].status : 'not recorded'
    const notes = memberAttendance.length > 0 ? memberAttendance[0].notes : ''
    
    return {
      'Member ID': member.id,
      'First Name': member.firstName,
      'Last Name': member.lastName,
      'Full Name': `${member.firstName} ${member.lastName}`,
      'Category': member.category,
      'Status': status,
      'Notes': notes,
      'Date': sabbathDate || 'All Dates',
      'Is Active': member.isActive ? 'Yes' : 'No'
    }
  })
  
  const worksheet = XLSX.utils.json_to_sheet(summaryData)
  
  // Set column widths
  const colWidths = [
    { wch: 10 }, // Member ID
    { wch: 15 }, // First Name
    { wch: 15 }, // Last Name
    { wch: 25 }, // Full Name
    { wch: 12 }, // Category
    { wch: 12 }, // Status
    { wch: 30 }, // Notes
    { wch: 12 }, // Date
    { wch: 10 }  // Is Active
  ]
  worksheet['!cols'] = colWidths
  
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance Summary')
}

/**
 * Create members sheet
 */
function createMembersSheet(workbook: XLSX.WorkBook, membersData: any[]) {
  const memberSheet = membersData.map(member => ({
    'ID': member.id,
    'First Name': member.firstName,
    'Last Name': member.lastName,
    'Category': member.category,
    'Registration Date': member.registrationDate,
    'Is Active': member.isActive ? 'Yes' : 'No',
    'Created At': member.createdAt || '',
    'Updated At': member.updatedAt || ''
  }))
  
  const worksheet = XLSX.utils.json_to_sheet(memberSheet)
  
  const colWidths = [
    { wch: 8 },  // ID
    { wch: 15 }, // First Name
    { wch: 15 }, // Last Name
    { wch: 12 }, // Category
    { wch: 15 }, // Registration Date
    { wch: 10 }, // Is Active
    { wch: 20 }, // Created At
    { wch: 20 }  // Updated At
  ]
  worksheet['!cols'] = colWidths
  
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Members')
}

/**
 * Create statistics sheet
 */
async function createStatsSheet(workbook: XLSX.WorkBook, attendanceData: any[], sabbathDate?: string) {
  const stats = {
    total: attendanceData.length,
    present: attendanceData.filter(r => r.status === 'present').length,
    absent: attendanceData.filter(r => r.status === 'absent').length,
    other: attendanceData.filter(r => r.status === 'other').length
  }
  
  const statsData = [
    { 'Metric': 'Total Records', 'Count': stats.total, 'Percentage': '100%' },
    { 'Metric': 'Present', 'Count': stats.present, 'Percentage': `${Math.round((stats.present / stats.total) * 100)}%` },
    { 'Metric': 'Absent', 'Count': stats.absent, 'Percentage': `${Math.round((stats.absent / stats.total) * 100)}%` },
    { 'Metric': 'Other', 'Count': stats.other, 'Percentage': `${Math.round((stats.other / stats.total) * 100)}%` },
    { 'Metric': 'Date Range', 'Count': sabbathDate || 'All Dates', 'Percentage': '-' },
    { 'Metric': 'Generated At', 'Count': new Date().toISOString(), 'Percentage': '-' }
  ]
  
  const worksheet = XLSX.utils.json_to_sheet(statsData)
  
  const colWidths = [
    { wch: 20 }, // Metric
    { wch: 15 }, // Count
    { wch: 15 }  // Percentage
  ]
  worksheet['!cols'] = colWidths
  
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Statistics')
}

/**
 * Import attendance data from Excel
 */
export async function importAttendanceFromExcel(filepath: string, options: {
  sheetName?: string
  overwrite?: boolean
  validateMembers?: boolean
} = {}) {
  try {
    if (!existsSync(filepath)) {
      throw new Error('Excel file not found')
    }
    
    // Read Excel file
    const workbook = XLSX.readFile(filepath)
    const sheetName = options.sheetName || workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    
    if (!worksheet) {
      throw new Error(`Sheet "${sheetName}" not found`)
    }
    
    // Convert to JSON
    const data = XLSX.utils.sheet_to_json(worksheet)
    
    const results = {
      imported: 0,
      updated: 0,
      errors: 0,
      errorDetails: [] as string[]
    }
    
    // Process each row
    for (const row of data) {
      try {
        // Map Excel columns to our data structure
        const record = mapExcelRowToAttendance(row)
        
        if (!record) {
          results.errors++
          results.errorDetails.push(`Invalid row data: ${JSON.stringify(row)}`)
          continue
        }
        
        // Validate member exists if requested
        if (options.validateMembers) {
          const member = MembersDB.getById(record.memberId)
          if (!member) {
            results.errors++
            results.errorDetails.push(`Member ID ${record.memberId} not found`)
            continue
          }
        }
        
        // Save using dual storage
        await saveAttendanceDual(record)
        
        // Check if it was an update or new record
        const existing = AttendanceDB.getByMemberAndDate(record.memberId, record.sabbathDate)
        if (existing) {
          results.updated++
        } else {
          results.imported++
        }
        
      } catch (error) {
        results.errors++
        results.errorDetails.push(`Row processing error: ${error}`)
      }
    }
    
    return {
      success: true,
      results,
      totalRows: data.length
    }
  } catch (error) {
    console.error('Excel import failed:', error)
    throw error
  }
}

/**
 * Map Excel row to attendance record
 */
function mapExcelRowToAttendance(row: any): {
  memberId: number
  sabbathDate: string
  status: string
  notes?: string
} | null {
  try {
    // Try different possible column names
    const memberId = row['Member ID'] || row['MemberID'] || row['memberId'] || row['member_id']
    const sabbathDate = row['Sabbath Date'] || row['Date'] || row['sabbathDate'] || row['sabbath_date']
    const status = row['Status'] || row['status']
    const notes = row['Notes'] || row['notes'] || ''
    
    if (!memberId || !sabbathDate || !status) {
      return null
    }
    
    // Validate status
    if (!['present', 'absent', 'other'].includes(status.toLowerCase())) {
      return null
    }
    
    return {
      memberId: parseInt(memberId),
      sabbathDate: sabbathDate,
      status: status.toLowerCase(),
      notes: notes
    }
  } catch (error) {
    return null
  }
}

/**
 * Get list of Excel files
 */
export function getExcelFiles() {
  try {
    ensureExcelDir()
    const files = readdirSync(EXCEL_DIR)

    return files
      .filter((file: string) => file.endsWith('.xlsx'))
      .map((file: string) => ({
        name: file,
        path: join(EXCEL_DIR, file),
        size: statSync(join(EXCEL_DIR, file)).size,
        modified: statSync(join(EXCEL_DIR, file)).mtime
      }))
  } catch (error) {
    console.error('Failed to get Excel files:', error)
    return []
  }
}

/**
 * Delete Excel file
 */
export function deleteExcelFile(filename: string) {
  try {
    const filepath = join(EXCEL_DIR, filename)
    if (existsSync(filepath)) {
      unlinkSync(filepath)
      return { success: true }
    } else {
      throw new Error('File not found')
    }
  } catch (error) {
    console.error('Failed to delete Excel file:', error)
    throw error
  }
}
