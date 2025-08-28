import { readJsonFile } from './jsonDb'
import { getDatabase, AttendanceDB, MembersDB, VisitorsDB } from './database'

/**
 * Migrate data from JSON files to SQLite database
 */
export async function migrateJsonToDatabase() {
  console.log('🔄 Starting migration from JSON to database...')
  
  try {
    // Initialize database (creates tables if they don't exist)
    const db = getDatabase()
    
    // Migrate members
    console.log('📋 Migrating members...')
    await migrateMembers()
    
    // Migrate attendance
    console.log('✅ Migrating attendance...')
    await migrateAttendance()
    
    // Migrate visitors
    console.log('👥 Migrating visitors...')
    await migrateVisitors()
    
    console.log('✅ Migration completed successfully!')
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  }
}

/**
 * Migrate members from JSON to database
 */
async function migrateMembers() {
  try {
    const members = await readJsonFile('members.json')
    console.log(`Found ${members.length} members to migrate`)
    
    for (const member of members) {
      try {
        // Check if member already exists
        const existing = MembersDB.getById(member.id)
        
        if (!existing) {
          // Insert new member with original ID
          const db = getDatabase()
          const stmt = db.prepare(`
            INSERT INTO members (id, firstName, lastName, category, registrationDate, isActive, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          `)
          stmt.run(
            member.id,
            member.firstName,
            member.lastName,
            member.category,
            member.registrationDate,
            member.isActive ? 1 : 0
          )
          console.log(`✓ Migrated member: ${member.firstName} ${member.lastName}`)
        } else {
          console.log(`- Member already exists: ${member.firstName} ${member.lastName}`)
        }
      } catch (error) {
        console.error(`❌ Error migrating member ${member.firstName} ${member.lastName}:`, error)
      }
    }
  } catch (error) {
    console.error('❌ Error reading members.json:', error)
  }
}

/**
 * Migrate attendance from JSON to database
 */
async function migrateAttendance() {
  try {
    const attendance = await readJsonFile('attendance.json')
    console.log(`Found ${attendance.length} attendance records to migrate`)
    
    for (const record of attendance) {
      try {
        // Check if attendance record already exists
        const existing = AttendanceDB.getByMemberAndDate(record.memberId, record.sabbathDate)
        
        if (!existing) {
          // Insert new attendance record with original ID
          const db = getDatabase()
          const stmt = db.prepare(`
            INSERT INTO attendance (id, memberId, sabbathDate, status, notes, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          `)
          stmt.run(
            record.id,
            record.memberId,
            record.sabbathDate,
            record.status,
            record.notes || ''
          )
          console.log(`✓ Migrated attendance: Member ${record.memberId} on ${record.sabbathDate}`)
        } else {
          console.log(`- Attendance already exists: Member ${record.memberId} on ${record.sabbathDate}`)
        }
      } catch (error) {
        console.error(`❌ Error migrating attendance record ${record.id}:`, error)
      }
    }
  } catch (error) {
    console.error('❌ Error reading attendance.json:', error)
  }
}

/**
 * Migrate visitors from JSON to database
 */
async function migrateVisitors() {
  try {
    const visitors = await readJsonFile('visitors.json')
    console.log(`Found ${visitors.length} visitors to migrate`)
    
    for (const visitor of visitors) {
      try {
        // Check if visitor already exists
        const db = getDatabase()
        const stmt = db.prepare('SELECT * FROM visitors WHERE id = ?')
        const existing = stmt.get(visitor.id)
        
        if (!existing) {
          // Insert new visitor
          VisitorsDB.create({
            id: visitor.id.toString(),
            visitorName: visitor.visitorName,
            sabbathDate: visitor.sabbathDate,
            notes: visitor.notes || ''
          })
          console.log(`✓ Migrated visitor: ${visitor.visitorName} on ${visitor.sabbathDate}`)
        } else {
          console.log(`- Visitor already exists: ${visitor.visitorName} on ${visitor.sabbathDate}`)
        }
      } catch (error) {
        console.error(`❌ Error migrating visitor ${visitor.visitorName}:`, error)
      }
    }
  } catch (error) {
    console.error('❌ Error reading visitors.json:', error)
  }
}

/**
 * Sync database data back to JSON files (backup)
 */
export async function syncDatabaseToJson() {
  console.log('🔄 Syncing database to JSON files...')
  
  try {
    const { writeJsonFile } = await import('./jsonDb')
    
    // Sync members
    const members = MembersDB.getAll(true) // Include inactive
    await writeJsonFile('members.json', members)
    console.log(`✓ Synced ${members.length} members to JSON`)
    
    // Sync attendance
    const attendance = AttendanceDB.getAll()
    await writeJsonFile('attendance.json', attendance)
    console.log(`✓ Synced ${attendance.length} attendance records to JSON`)
    
    // Sync visitors
    const visitors = VisitorsDB.getAll()
    await writeJsonFile('visitors.json', visitors)
    console.log(`✓ Synced ${visitors.length} visitors to JSON`)
    
    console.log('✅ Database to JSON sync completed!')
    
  } catch (error) {
    console.error('❌ Sync failed:', error)
    throw error
  }
}

// Run migration if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateJsonToDatabase()
    .then(() => {
      console.log('Migration completed successfully')
      process.exit(0)
    })
    .catch((error) => {
      console.error('Migration failed:', error)
      process.exit(1)
    })
}
