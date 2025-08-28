// Simple migration script that can be run with Node.js
// This is a CommonJS version for easier execution

const fs = require('fs')
const path = require('path')
const Database = require('better-sqlite3')

// Database setup
function getDatabase() {
  const dbPath = path.join(process.cwd(), 'server/church.db')
  const db = new Database(dbPath)
  
  // Enable foreign keys
  db.pragma('foreign_keys = ON')
  
  // Initialize tables
  initializeTables(db)
  
  return db
}

function initializeTables(db) {
  // Create members table
  db.exec(`
    CREATE TABLE IF NOT EXISTS members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      firstName TEXT NOT NULL,
      lastName TEXT NOT NULL,
      category TEXT NOT NULL,
      registrationDate TEXT NOT NULL,
      isActive BOOLEAN DEFAULT 1,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)
  
  // Create attendance table
  db.exec(`
    CREATE TABLE IF NOT EXISTS attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      memberId INTEGER NOT NULL,
      sabbathDate TEXT NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'other')),
      notes TEXT DEFAULT '',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (memberId) REFERENCES members (id),
      UNIQUE(memberId, sabbathDate)
    )
  `)
  
  // Create visitors table
  db.exec(`
    CREATE TABLE IF NOT EXISTS visitors (
      id TEXT PRIMARY KEY,
      visitorName TEXT NOT NULL,
      sabbathDate TEXT NOT NULL,
      notes TEXT DEFAULT '',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)
  
  // Create indexes for better performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_attendance_member_date ON attendance(memberId, sabbathDate);
    CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(sabbathDate);
    CREATE INDEX IF NOT EXISTS idx_visitors_date ON visitors(sabbathDate);
  `)
}

function readJsonFile(filename) {
  try {
    const dataPath = path.join(process.cwd(), 'server/data', filename)
    
    if (!fs.existsSync(dataPath)) {
      return []
    }
    
    const data = fs.readFileSync(dataPath, 'utf-8')
    return JSON.parse(data)
  } catch (error) {
    console.error(`Error reading ${filename}:`, error)
    return []
  }
}

function migrateMembers(db) {
  console.log('📋 Migrating members...')
  const members = readJsonFile('members.json')
  console.log(`Found ${members.length} members to migrate`)
  
  const checkStmt = db.prepare('SELECT id FROM members WHERE id = ?')
  const insertStmt = db.prepare(`
    INSERT INTO members (id, firstName, lastName, category, registrationDate, isActive, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `)
  
  let migrated = 0
  let skipped = 0
  
  for (const member of members) {
    try {
      const existing = checkStmt.get(member.id)
      
      if (!existing) {
        insertStmt.run(
          member.id,
          member.firstName,
          member.lastName,
          member.category,
          member.registrationDate,
          member.isActive ? 1 : 0
        )
        migrated++
        console.log(`✓ Migrated member: ${member.firstName} ${member.lastName}`)
      } else {
        skipped++
        console.log(`- Member already exists: ${member.firstName} ${member.lastName}`)
      }
    } catch (error) {
      console.error(`❌ Error migrating member ${member.firstName} ${member.lastName}:`, error)
    }
  }
  
  console.log(`Members migration complete: ${migrated} migrated, ${skipped} skipped`)
}

function migrateAttendance(db) {
  console.log('✅ Migrating attendance...')
  const attendance = readJsonFile('attendance.json')
  console.log(`Found ${attendance.length} attendance records to migrate`)
  
  const checkStmt = db.prepare('SELECT id FROM attendance WHERE memberId = ? AND sabbathDate = ?')
  const insertStmt = db.prepare(`
    INSERT INTO attendance (id, memberId, sabbathDate, status, notes, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `)
  
  let migrated = 0
  let skipped = 0
  
  for (const record of attendance) {
    try {
      const existing = checkStmt.get(record.memberId, record.sabbathDate)
      
      if (!existing) {
        insertStmt.run(
          record.id,
          record.memberId,
          record.sabbathDate,
          record.status,
          record.notes || ''
        )
        migrated++
        console.log(`✓ Migrated attendance: Member ${record.memberId} on ${record.sabbathDate}`)
      } else {
        skipped++
        console.log(`- Attendance already exists: Member ${record.memberId} on ${record.sabbathDate}`)
      }
    } catch (error) {
      console.error(`❌ Error migrating attendance record ${record.id}:`, error)
    }
  }
  
  console.log(`Attendance migration complete: ${migrated} migrated, ${skipped} skipped`)
}

function migrateVisitors(db) {
  console.log('👥 Migrating visitors...')
  const visitors = readJsonFile('visitors.json')
  console.log(`Found ${visitors.length} visitors to migrate`)
  
  const checkStmt = db.prepare('SELECT id FROM visitors WHERE id = ?')
  const insertStmt = db.prepare(`
    INSERT INTO visitors (id, visitorName, sabbathDate, notes, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `)
  
  let migrated = 0
  let skipped = 0
  
  for (const visitor of visitors) {
    try {
      const existing = checkStmt.get(visitor.id.toString())
      
      if (!existing) {
        insertStmt.run(
          visitor.id.toString(),
          visitor.visitorName,
          visitor.sabbathDate,
          visitor.notes || ''
        )
        migrated++
        console.log(`✓ Migrated visitor: ${visitor.visitorName} on ${visitor.sabbathDate}`)
      } else {
        skipped++
        console.log(`- Visitor already exists: ${visitor.visitorName} on ${visitor.sabbathDate}`)
      }
    } catch (error) {
      console.error(`❌ Error migrating visitor ${visitor.visitorName}:`, error)
    }
  }
  
  console.log(`Visitors migration complete: ${migrated} migrated, ${skipped} skipped`)
}

function runMigration() {
  console.log('🔄 Starting migration from JSON to database...')
  
  try {
    const db = getDatabase()
    
    migrateMembers(db)
    migrateAttendance(db)
    migrateVisitors(db)
    
    db.close()
    console.log('✅ Migration completed successfully!')
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
}

// Run migration
runMigration()
