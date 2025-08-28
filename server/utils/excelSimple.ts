import * as XLSX from 'xlsx'
import { join } from 'path'
import { writeFileSync, existsSync, mkdirSync, readdirSync, statSync, unlinkSync } from 'fs'
import { loadAttendanceDual } from './sync'
import { MembersDB } from './database'

/**
 * Excel file paths
 */
const EXCEL_DIR = join(process.cwd(), 'server/excel')

/**
 * Ensure Excel directory exists
 */
function ensureExcelDir() {
  if (!existsSync(EXCEL_DIR)) {
    mkdirSync(EXCEL_DIR, { recursive: true })
  }
}

/**
 * Simple Excel export for attendance data
 */
export async function exportAttendanceToExcelSimple(options: {
  sabbathDate?: string
  format?: 'detailed' | 'summary'
} = {}) {
  try {
    ensureExcelDir()
    
    // Load attendance data
    const { data: attendanceData } = await loadAttendanceDual(options.sabbathDate)
    
    // Load members data
    const membersData = MembersDB.getAll(true) // Include inactive
    
    // Create simple data structure
    const excelData = attendanceData.map(record => {
      const member = membersData.find(m => m.id === record.memberId)
      return {
        'Member ID': record.memberId,
        'First Name': member?.firstName || 'Unknown',
        'Last Name': member?.lastName || 'Unknown',
        'Category': member?.category || 'Unknown',
        'Sabbath Date': record.sabbathDate,
        'Status': record.status,
        'Notes': record.notes || '',
        'Is Active': member?.isActive ? 'Yes' : 'No'
      }
    })
    
    // Create workbook and worksheet
    const worksheet = XLSX.utils.json_to_sheet(excelData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance')
    
    // Generate filename
    const timestamp = new Date().toISOString().split('T')[0]
    const filename = options.sabbathDate 
      ? `attendance_${options.sabbathDate}.xlsx`
      : `attendance_all_${timestamp}.xlsx`
    
    const filepath = join(EXCEL_DIR, filename)
    
    // Write file using buffer method
    try {
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
      writeFileSync(filepath, buffer)
    } catch (writeError) {
      console.error('Buffer write failed, trying direct write:', writeError)
      // Fallback to direct write
      XLSX.writeFile(workbook, filepath)
    }
    
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
 * Export summary format (one row per member)
 */
export async function exportAttendanceSummarySimple(sabbathDate?: string) {
  try {
    ensureExcelDir()
    
    // Load data
    const { data: attendanceData } = await loadAttendanceDual(sabbathDate)
    const membersData = MembersDB.getAll(true)
    
    // Create summary data
    const summaryData = membersData.map(member => {
      const memberAttendance = attendanceData.filter(a => a.memberId === member.id)
      const status = memberAttendance.length > 0 ? memberAttendance[0].status : 'not recorded'
      const notes = memberAttendance.length > 0 ? memberAttendance[0].notes : ''
      
      return {
        'Member ID': member.id,
        'First Name': member.firstName,
        'Last Name': member.lastName,
        'Category': member.category,
        'Status': status,
        'Notes': notes,
        'Date': sabbathDate || 'All Dates',
        'Is Active': member.isActive ? 'Yes' : 'No'
      }
    })
    
    // Create workbook
    const worksheet = XLSX.utils.json_to_sheet(summaryData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Summary')
    
    // Generate filename
    const timestamp = new Date().toISOString().split('T')[0]
    const filename = sabbathDate 
      ? `summary_${sabbathDate}.xlsx`
      : `summary_all_${timestamp}.xlsx`
    
    const filepath = join(EXCEL_DIR, filename)
    
    // Write file
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
    writeFileSync(filepath, buffer)
    
    return {
      success: true,
      filename,
      filepath,
      recordCount: summaryData.length
    }
  } catch (error) {
    console.error('Excel summary export failed:', error)
    throw error
  }
}

/**
 * Get list of Excel files
 */
export function getExcelFilesSimple() {
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
export function deleteExcelFileSimple(filename: string) {
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

/**
 * Create a test Excel file to verify functionality
 */
export async function createTestExcelFile() {
  try {
    ensureExcelDir()
    
    // Create test data
    const testData = [
      { 'Name': 'John Doe', 'Status': 'present', 'Date': '2025-06-10' },
      { 'Name': 'Jane Smith', 'Status': 'absent', 'Date': '2025-06-10' },
      { 'Name': 'Bob Johnson', 'Status': 'other', 'Date': '2025-06-10' }
    ]
    
    // Create workbook
    const worksheet = XLSX.utils.json_to_sheet(testData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Test')
    
    const filename = 'test_excel.xlsx'
    const filepath = join(EXCEL_DIR, filename)
    
    // Write file
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
    writeFileSync(filepath, buffer)
    
    return {
      success: true,
      filename,
      filepath,
      message: 'Test Excel file created successfully'
    }
  } catch (error) {
    console.error('Failed to create test Excel file:', error)
    throw error
  }
}
