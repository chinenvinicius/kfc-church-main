import Database from 'better-sqlite3'
import { join } from 'path'
// Define interfaces for data models
import { Member, Attendance, Visitor } from './types'

// Database connection
let db: Database.Database | null = null

/**
 * Get database connection
 */
export function getDatabase(): Database.Database {
  if (!db) {
    const dbPath = join(process.cwd(), 'server/church.db')
    db = new Database(dbPath)
    
    // Enable foreign keys
    db.pragma('foreign_keys = ON')
    
    // Initialize tables
    initializeTables()
  }
  return db
}

/**
 * Initialize database tables
 */
function initializeTables() {
  if (!db) return
  
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

/**
 * Attendance database operations
 */
export const AttendanceDB = {
  /**
   * Get all attendance records or filter by date
   */
  getAll: (sabbathDate?: string): Attendance[] => {
    const db = getDatabase()
    if (sabbathDate) {
      const stmt = db.prepare('SELECT * FROM attendance WHERE sabbathDate = ? ORDER BY id')
      return stmt.all(sabbathDate) as Attendance[]
    } else {
      const stmt = db.prepare('SELECT * FROM attendance ORDER BY sabbathDate DESC, id')
      return stmt.all() as Attendance[]
    }
  },

  /**
   * Create or update attendance record
   */
  upsert: (record: {
    memberId: number
    sabbathDate: string
    status: string
    notes?: string
  }): Attendance => {
    const db = getDatabase()
    const stmt = db.prepare(`
      INSERT INTO attendance (memberId, sabbathDate, status, notes, updatedAt)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(memberId, sabbathDate) 
      DO UPDATE SET 
        status = excluded.status,
        notes = excluded.notes,
        updatedAt = CURRENT_TIMESTAMP
      RETURNING *
    `)
    return stmt.get(record.memberId, record.sabbathDate, record.status, record.notes || '') as Attendance
  },

  /**
   * Delete attendance record
   */
  delete: (id: number) => {
    const db = getDatabase()
    const stmt = db.prepare('DELETE FROM attendance WHERE id = ?')
    return stmt.run(id)
  },

  /**
   * Get attendance by member and date
   */
  getByMemberAndDate: (memberId: number, sabbathDate: string): Attendance | undefined => {
    const db = getDatabase()
    const stmt = db.prepare('SELECT * FROM attendance WHERE memberId = ? AND sabbathDate = ?')
    return stmt.get(memberId, sabbathDate) as Attendance | undefined
  }
}

/**
 * Members database operations
 */
export const MembersDB = {
  /**
   * Get all members
   */
  getAll: (includeInactive = false): Member[] => {
    const db = getDatabase()
    if (includeInactive) {
      const stmt = db.prepare('SELECT * FROM members ORDER BY lastName, firstName')
      return stmt.all() as Member[]
    } else {
      const stmt = db.prepare('SELECT * FROM members WHERE isActive = 1 ORDER BY lastName, firstName')
      return stmt.all() as Member[]
    }
  },

  /**
   * Create new member
   */
  create: (member: {
    firstName: string
    lastName: string
    category: string
    registrationDate: string
  }): Member => {
    const db = getDatabase()
    const stmt = db.prepare(`
      INSERT INTO members (firstName, lastName, category, registrationDate, isActive, updatedAt)
      VALUES (?, ?, ?, ?, 1, CURRENT_TIMESTAMP)
      RETURNING *
    `)
    return stmt.get(member.firstName, member.lastName, member.category, member.registrationDate) as Member
  },

  /**
   * Update member
   */
  update: (id: number, updates: {
    firstName?: string
    lastName?: string
    category?: string
    isActive?: boolean
  }): Member => {
    const db = getDatabase()
    const fields = []
    const values = []
    
    if (updates.firstName !== undefined) {
      fields.push('firstName = ?')
      values.push(updates.firstName)
    }
    if (updates.lastName !== undefined) {
      fields.push('lastName = ?')
      values.push(updates.lastName)
    }
    if (updates.category !== undefined) {
      fields.push('category = ?')
      values.push(updates.category)
    }
    if (updates.isActive !== undefined) {
      fields.push('isActive = ?')
      values.push(updates.isActive ? 1 : 0)
    }
    
    fields.push('updatedAt = CURRENT_TIMESTAMP')
    values.push(id)
    
    const stmt = db.prepare(`
      UPDATE members 
      SET ${fields.join(', ')}
      WHERE id = ?
      RETURNING *
    `)
    return stmt.get(...values) as Member
  },

  /**
   * Delete member
   */
  delete: (id: number) => {
    const db = getDatabase()
    const stmt = db.prepare('DELETE FROM members WHERE id = ?')
    return stmt.run(id)
  },

  /**
   * Get member by ID
   */
  getById: (id: number): Member | undefined => {
    const db = getDatabase()
    const stmt = db.prepare('SELECT * FROM members WHERE id = ?')
    return stmt.get(id) as Member | undefined
  }
}

/**
 * Visitors database operations
 */
export const VisitorsDB = {
  /**
   * Get all visitors or filter by date
   */
  getAll: (sabbathDate?: string): Visitor[] => {
    const db = getDatabase()
    if (sabbathDate) {
      const stmt = db.prepare('SELECT * FROM visitors WHERE sabbathDate = ? ORDER BY visitorName')
      return stmt.all(sabbathDate) as Visitor[]
    } else {
      const stmt = db.prepare('SELECT * FROM visitors ORDER BY sabbathDate DESC, visitorName')
      return stmt.all() as Visitor[]
    }
  },

  /**
   * Create new visitor
   */
  create: (visitor: {
    id: string
    visitorName: string
    sabbathDate: string
    notes?: string
  }): Visitor => {
    const db = getDatabase()
    const stmt = db.prepare(`
      INSERT INTO visitors (id, visitorName, sabbathDate, notes, updatedAt)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
      RETURNING *
    `)
    return stmt.get(visitor.id, visitor.visitorName, visitor.sabbathDate, visitor.notes || '') as Visitor
  },

  /**
   * Update visitor
   */
  update: (id: string, updates: {
    visitorName?: string
    sabbathDate?: string
    notes?: string
  }): Visitor => {
    const db = getDatabase()
    const fields = []
    const values = []
    
    if (updates.visitorName !== undefined) {
      fields.push('visitorName = ?')
      values.push(updates.visitorName)
    }
    if (updates.sabbathDate !== undefined) {
      fields.push('sabbathDate = ?')
      values.push(updates.sabbathDate)
    }
    if (updates.notes !== undefined) {
      fields.push('notes = ?')
      values.push(updates.notes)
    }
    
    fields.push('updatedAt = CURRENT_TIMESTAMP')
    values.push(id)
    
    const stmt = db.prepare(`
      UPDATE visitors 
      SET ${fields.join(', ')}
      WHERE id = ?
      RETURNING *
    `)
    return stmt.get(...values) as Visitor
  },

  /**
   * Delete visitor
   */
  delete: (id: string) => {
    const db = getDatabase()
    const stmt = db.prepare('DELETE FROM visitors WHERE id = ?')
    return stmt.run(id)
  }
}

/**
 * Close database connection
 */
export function closeDatabase() {
  if (db) {
    db.close()
    db = null
  }
}
