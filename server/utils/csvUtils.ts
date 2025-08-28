import { join } from 'path'
import { writeFileSync, existsSync, mkdirSync, readdirSync, statSync, unlinkSync, readFileSync } from 'fs'
import { loadAttendanceDual } from './sync'
import { MembersDB, VisitorsDB } from './database'
import { ImportAttendanceOptions } from '../utils/types'

/**
 * Export directory
 */
const EXPORT_DIR = join(process.cwd(), 'server/exports')

/**
 * Ensure export directory exists
 */
function ensureExportDir() {
  if (!existsSync(EXPORT_DIR)) {
    mkdirSync(EXPORT_DIR, { recursive: true })
  }
}

/**
 * Convert array of objects to CSV string
 */
function arrayToCSV(data: any[]): string {
  if (data.length === 0) return ''
  
  const headers = Object.keys(data[0])
  const csvHeaders = headers.join(',')
  
  const csvRows = data.map(row => {
    return headers.map(header => {
      const value = row[header]
      // Escape commas and quotes in CSV
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`
      }
      return value
    }).join(',')
  })
  
  return [csvHeaders, ...csvRows].join('\n')
}

/**
 * Export attendance data to CSV
 */
export async function exportAttendanceToCSV(options: {
  sabbathDate?: string
  format?: 'detailed' | 'summary'
} = {}) {
  try {
    ensureExportDir()
    
    // Load attendance data
    const { data: attendanceData } = await loadAttendanceDual(options.sabbathDate)
    
    // Load members data
    const membersData = MembersDB.getAll(true) // Include inactive
    
    let exportData
    let filename
    
    if (options.format === 'summary') {
      // Summary format - one row per member
      exportData = membersData.map(member => {
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
          'Date': options.sabbathDate || 'All Dates',
          'Is Active': member.isActive ? 'Yes' : 'No'
        }
      })
      
      const timestamp = new Date().toISOString().split('T')[0]
      filename = options.sabbathDate 
        ? `attendance_summary_${options.sabbathDate}.csv`
        : `attendance_summary_all_${timestamp}.csv`
    } else {
      // Detailed format - one row per attendance record
      exportData = attendanceData.map(record => {
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
      
      const timestamp = new Date().toISOString().split('T')[0]
      filename = options.sabbathDate 
        ? `attendance_detailed_${options.sabbathDate}.csv`
        : `attendance_detailed_all_${timestamp}.csv`
    }
    
    // Convert to CSV
    const csvContent = arrayToCSV(exportData)
    
    // Write to file
    const filepath = join(EXPORT_DIR, filename)
    writeFileSync(filepath, csvContent, 'utf-8')
    
    return {
      success: true,
      filename,
      filepath,
      recordCount: exportData.length,
      format: 'CSV'
    }
  } catch (error) {
    console.error('CSV export failed:', error)
    throw error
  }
}

/**
 * Get list of export files
 */
export function getExportFiles() {
  try {
    ensureExportDir()
    const files = readdirSync(EXPORT_DIR)
    
    return files
      .filter((file: string) => file.endsWith('.csv') || file.endsWith('.xlsx'))
      .map((file: string) => ({
        name: file,
        path: join(EXPORT_DIR, file),
        size: statSync(join(EXPORT_DIR, file)).size,
        modified: statSync(join(EXPORT_DIR, file)).mtime,
        type: file.endsWith('.csv') ? 'CSV' : 'Excel'
      }))
  } catch (error) {
    console.error('Failed to get export files:', error)
    return []
  }
}

/**
 * Delete export file
 */
export function deleteExportFile(filename: string) {
  try {
    const filepath = join(EXPORT_DIR, filename)
    if (existsSync(filepath)) {
      unlinkSync(filepath)
      return { success: true }
    } else {
      throw new Error('File not found')
    }
  } catch (error) {
    console.error('Failed to delete export file:', error)
    throw error
  }
}

/**
 * Parse CSV content into an array of objects
 */
export function parseCSV(csvContent: string): any[] {
  const lines = csvContent.split('\n').filter(line => line.trim())

  if (lines.length < 2) {
    return [] // No data rows
  }

  // Parse header
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))

  // Parse data rows
  const data = []
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''))
    if (values.length === headers.length) {
      const row: any = {}
      headers.forEach((header, index) => {
        row[header] = values[index]
      })
      data.push(row)
    }
  }
  return data
}

/**
 * Import attendance data from CSV
 */
export async function importAttendanceFromCSV(filepath: string, options: ImportAttendanceOptions) {
  try {
    if (!existsSync(filepath)) {
      throw new Error('CSV file not found')
    }

    // Read CSV file
    const csvContent = require('fs').readFileSync(filepath, 'utf-8')
    const data = parseCSV(csvContent)

    if (data.length === 0) {
      return {
        success: true,
        results: {
          imported: 0,
          updated: 0,
          errors: 0,
          errorDetails: [] as string[]
        },
        totalRows: 0,
        message: 'No data found in CSV file'
      }
    }

    const results = {
      imported: 0,
      updated: 0,
      errors: 0,
      errorDetails: [] as string[]
    }

    // Import using dual storage
    const { saveAttendanceDual } = await import('./sync')
    const { MembersDB } = await import('./database')

    // Process each row
    for (const row of data) {
      try {
        // Map CSV columns to our data structure
        const record = mapCSVRowToAttendance(row)

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
        results.imported++

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
    console.error('CSV import failed:', error)
    throw error
  }
}

/**
 * Map CSV row to attendance record
 */
function mapCSVRowToAttendance(row: any): {
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
 * Import members data from CSV
 */
export async function importMembersFromCSV(filepath: string, options: {
  overwrite?: boolean
} = {}) {
  try {
    if (!existsSync(filepath)) {
      throw new Error('CSV file not found')
    }

    const csvContent = require('fs').readFileSync(filepath, 'utf-8')
    const data = parseCSV(csvContent)

    if (data.length === 0) {
      return {
        success: true,
        results: {
          imported: 0,
          updated: 0,
          errors: 0,
          errorDetails: [] as string[]
        },
        totalRows: 0,
        message: 'No data found in CSV file'
      }
    }

    const results = {
      imported: 0,
      updated: 0,
      errors: 0,
      errorDetails: [] as string[]
    }

    const { MembersDB } = await import('./database')

    for (const row of data) {
      try {
        const member = mapCSVRowToMember(row)

        if (!member) {
          results.errors++
          results.errorDetails.push(`Invalid row data: ${JSON.stringify(row)}`)
          continue
        }

        // Check if member already exists by firstName and lastName
        const existingMember = MembersDB.getAll(true).find(
          m => m.firstName.toLowerCase() === member.firstName.toLowerCase() &&
               m.lastName.toLowerCase() === member.lastName.toLowerCase()
        )

        if (existingMember) {
          // Update existing member
          MembersDB.update(existingMember.id, {
            firstName: member.firstName,
            lastName: member.lastName,
            category: member.category,
            isActive: member.isActive
          })
          results.updated++
        } else {
          // Create new member
          MembersDB.create({
            firstName: member.firstName,
            lastName: member.lastName,
            category: member.category,
            registrationDate: member.registrationDate
          })
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
    console.error('CSV import failed:', error)
    throw error
  }
}

/**
 * Map CSV row to member record
 */
function mapCSVRowToMember(row: any): {
  firstName: string
  lastName: string
  category: string
  registrationDate: string
  isActive: boolean
} | null {
  try {
    const firstName = row['First Name'] || row['FirstName'] || row['firstName'] || row['first_name']
    const lastName = row['Last Name'] || row['LastName'] || row['lastName'] || row['last_name']
    const category = row['Category'] || row['category']
    const registrationDate = row['Registration Date'] || row['RegistrationDate'] || row['registrationDate'] || row['registration_date']
    const isActive = (row['Is Active'] || row['IsActive'] || row['isActive'] || row['is_active'] || 'Yes').toLowerCase() === 'yes'

    if (!firstName || !lastName || !category || !registrationDate) {
      return null
    }

    return {
      firstName: firstName,
      lastName: lastName,
      category: category,
      registrationDate: registrationDate,
      isActive: isActive
    }
  } catch (error) {
    return null
  }
}

/**
 * Import visitors data from CSV
 */
export async function importVisitorsFromCSV(filepath: string, options: {
  overwrite?: boolean
} = {}) {
  try {
    if (!existsSync(filepath)) {
      throw new Error('CSV file not found')
    }

    const csvContent = readFileSync(filepath, 'utf-8')
    const data = parseCSV(csvContent)

    if (data.length === 0) {
      return {
        success: true,
        results: {
          imported: 0,
          updated: 0,
          errors: 0,
          errorDetails: [] as string[]
        },
        totalRows: 0,
        message: 'No data found in CSV file'
      }
    }

    const results = {
      imported: 0,
      updated: 0,
      errors: 0,
      errorDetails: [] as string[]
    }

    for (const row of data) {
      try {
        const visitor = mapCSVRowToVisitor(row)

        if (!visitor) {
          results.errors++
          results.errorDetails.push(`Invalid row data: ${JSON.stringify(row)}`)
          continue
        }

        // Check if visitor already exists by firstName and lastName
        const existingVisitor = VisitorsDB.getAll().find(
          v => v.firstName.toLowerCase() === visitor.firstName.toLowerCase() &&
               v.lastName.toLowerCase() === visitor.lastName.toLowerCase()
        )

        if (existingVisitor) {
          // Update existing visitor
          VisitorsDB.update(existingVisitor.id, {
            firstName: visitor.firstName,
            lastName: visitor.lastName,
            contact: visitor.contact,
            notes: visitor.notes,
            dateOfVisit: visitor.dateOfVisit
          })
          results.updated++
        } else {
          // Create new visitor
          VisitorsDB.create({
            firstName: visitor.firstName,
            lastName: visitor.lastName,
            contact: visitor.contact,
            notes: visitor.notes,
            dateOfVisit: visitor.dateOfVisit
          })
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
    console.error('Visitors CSV import failed:', error)
    throw error
  }
}

/**
 * Map CSV row to visitor record
 */
function mapCSVRowToVisitor(row: any): {
  firstName: string
  lastName: string
  contact?: string
  notes?: string
  dateOfVisit: string
} | null {
  try {
    const firstName = row['First Name'] || row['FirstName'] || row['firstName'] || row['first_name']
    const lastName = row['Last Name'] || row['LastName'] || row['lastName'] || row['last_name']
    const contact = row['Contact'] || row['contact'] || ''
    const notes = row['Notes'] || row['notes'] || ''
    const dateOfVisit = row['Date of Visit'] || row['DateOfVisit'] || row['dateOfVisit'] || row['date_of_visit']

    if (!firstName || !lastName || !dateOfVisit) {
      return null
    }

    return {
      firstName: firstName,
      lastName: lastName,
      contact: contact,
      notes: notes,
      dateOfVisit: dateOfVisit
    }
  } catch (error) {
    return null
  }
}

/**
 * Create attendance statistics CSV
 */
export async function exportAttendanceStats(sabbathDate?: string) {
  try {
    ensureExportDir()
    
    const { data: attendanceData } = await loadAttendanceDual(sabbathDate)
    
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
    
    const csvContent = arrayToCSV(statsData)
    
    const timestamp = new Date().toISOString().split('T')[0]
    const filename = sabbathDate
      ? `attendance_stats_${sabbathDate}.csv`
      : `attendance_stats_all_${timestamp}.csv`
    
    const filepath = join(EXPORT_DIR, filename)
    writeFileSync(filepath, csvContent, 'utf-8')
    
    return {
      success: true,
      filename,
      filepath,
      recordCount: statsData.length,
      format: 'CSV',
      stats
    }
  } catch (error) {
    console.error('Stats export failed:', error)
    throw error
  }
}
