import { readJsonFile, writeJsonFile } from './jsonDb'
import { AttendanceDB, MembersDB, VisitorsDB } from './database'

/**
 * Sync attendance data from database to JSON file
 */
export async function syncAttendanceToJson() {
  try {
    const dbData = AttendanceDB.getAll()
    await writeJsonFile('attendance.json', dbData)
    console.log(`✅ Synced ${dbData.length} attendance records from database to JSON`)
    return dbData
  } catch (error) {
    console.error('❌ Failed to sync attendance to JSON:', error)
    throw error
  }
}

/**
 * Sync attendance data from JSON file to database
 */
export async function syncAttendanceToDatabase() {
  try {
    const jsonData = await readJsonFile('attendance.json')
    let synced = 0
    let errors = 0
    
    for (const record of jsonData) {
      try {
        // Check if record exists
        const existing = AttendanceDB.getByMemberAndDate(record.memberId, record.sabbathDate)
        
        if (!existing) {
          AttendanceDB.upsert({
            memberId: record.memberId,
            sabbathDate: record.sabbathDate,
            status: record.status,
            notes: record.notes || ''
          })
          synced++
        }
      } catch (error) {
        console.error(`Error syncing attendance record ${record.id}:`, error)
        errors++
      }
    }
    
    console.log(`✅ Synced ${synced} attendance records from JSON to database (${errors} errors)`)
    return { synced, errors }
  } catch (error) {
    console.error('❌ Failed to sync attendance to database:', error)
    throw error
  }
}

/**
 * Dual save: Save attendance to both JSON and database
 */
export async function saveAttendanceDual(record: {
  memberId: number
  sabbathDate: string
  status: string
  notes?: string
}) {
  const results = {
    database: null as any,
    json: null as any,
    errors: [] as string[]
  }
  
  // Save to database first
  try {
    results.database = AttendanceDB.upsert(record)
  } catch (error) {
    results.errors.push(`Database save failed: ${error}`)
    console.error('Database save failed:', error)
  }
  
  // Save to JSON file
  try {
    const jsonData = await readJsonFile('attendance.json')
    
    // Check if record already exists for this member and date
    const existingIndex = jsonData.findIndex((r: any) => 
      r.memberId === record.memberId && r.sabbathDate === record.sabbathDate
    )
    
    if (existingIndex !== -1) {
      // Update existing record
      jsonData[existingIndex] = {
        ...jsonData[existingIndex],
        status: record.status,
        notes: record.notes || ''
      }
      results.json = jsonData[existingIndex]
    } else {
      // Create new record
      const newId = jsonData.length > 0 ? Math.max(...jsonData.map((a: any) => a.id)) + 1 : 1
      const newRecord = {
        id: newId,
        memberId: record.memberId,
        sabbathDate: record.sabbathDate,
        status: record.status,
        notes: record.notes || ''
      }
      jsonData.push(newRecord)
      results.json = newRecord
    }
    
    await writeJsonFile('attendance.json', jsonData)
  } catch (error) {
    results.errors.push(`JSON save failed: ${error}`)
    console.error('JSON save failed:', error)
  }
  
  return results
}

/**
 * Dual load: Load attendance from database first, fallback to JSON
 */
export async function loadAttendanceDual(sabbathDate?: string) {
  try {
    // Try database first
    const dbData = AttendanceDB.getAll(sabbathDate)
    if (dbData && dbData.length > 0) {
      return { data: dbData, source: 'database' }
    }
  } catch (error) {
    console.warn('Database load failed, falling back to JSON:', error)
  }
  
  // Fallback to JSON
  try {
    const jsonData = await readJsonFile('attendance.json')
    const filteredData = sabbathDate 
      ? jsonData.filter((record: any) => record.sabbathDate === sabbathDate)
      : jsonData
    
    return { data: filteredData, source: 'json' }
  } catch (error) {
    console.error('Both database and JSON load failed:', error)
    throw error
  }
}

/**
 * Get attendance statistics from both sources
 */
export async function getAttendanceStats(sabbathDate?: string) {
  try {
    const { data } = await loadAttendanceDual(sabbathDate)
    
    const stats = {
      total: data.length,
      present: data.filter((r: any) => r.status === 'present').length,
      absent: data.filter((r: any) => r.status === 'absent').length,
      other: data.filter((r: any) => r.status === 'other').length,
      date: sabbathDate || 'all'
    }
    
    return stats
  } catch (error) {
    console.error('Failed to get attendance stats:', error)
    throw error
  }
}

/**
 * Validate attendance data consistency between JSON and database
 */
export async function validateAttendanceConsistency() {
  try {
    const jsonData = await readJsonFile('attendance.json')
    const dbData = AttendanceDB.getAll()
    
    const inconsistencies = []
    
    // Check for records in JSON but not in database
    for (const jsonRecord of jsonData) {
      const dbRecord = dbData.find((db: any) => 
        db.memberId === jsonRecord.memberId && db.sabbathDate === jsonRecord.sabbathDate
      )
      
      if (!dbRecord) {
        inconsistencies.push({
          type: 'missing_in_db',
          record: jsonRecord
        })
      } else if (dbRecord.status !== jsonRecord.status || dbRecord.notes !== jsonRecord.notes) {
        inconsistencies.push({
          type: 'data_mismatch',
          json: jsonRecord,
          database: dbRecord
        })
      }
    }
    
    // Check for records in database but not in JSON
    for (const dbRecord of dbData) {
      const jsonRecord = jsonData.find((json: any) => 
        json.memberId === dbRecord.memberId && json.sabbathDate === dbRecord.sabbathDate
      )
      
      if (!jsonRecord) {
        inconsistencies.push({
          type: 'missing_in_json',
          record: dbRecord
        })
      }
    }
    
    return {
      consistent: inconsistencies.length === 0,
      inconsistencies,
      jsonCount: jsonData.length,
      dbCount: dbData.length
    }
  } catch (error) {
    console.error('Failed to validate consistency:', error)
    throw error
  }
}
