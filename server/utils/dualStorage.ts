import type { Member, Attendance, Visitor } from './database'
import { readJsonFile, writeJsonFile } from './jsonDb'

// Database availability check
let databaseAvailable: boolean | null = null
let MembersDB: any = null
let AttendanceDB: any = null
let VisitorsDB: any = null

// Function to check database availability at runtime
async function checkDatabaseAvailability() {
  if (databaseAvailable !== null) {
    return databaseAvailable
  }

  try {
    const dbModule = await import('./database')
    MembersDB = dbModule.MembersDB
    AttendanceDB = dbModule.AttendanceDB
    VisitorsDB = dbModule.VisitorsDB
    databaseAvailable = true
    console.log('✅ Database connection successful')
    return true
  } catch (error) {
    console.warn('⚠️ Database unavailable, falling back to JSON files:', error instanceof Error ? error.message : String(error))
    databaseAvailable = false
    return false
  }
}

/**
 * =================================================================
 * DUAL STORAGE IMPLEMENTATION
 * =================================================================
 * The following functions implement a dual storage system, writing
 * data to both a SQLite database and JSON files. This provides
 * redundancy and flexibility for data access.
 * =================================================================
 */

export const dualStorage = {
  members: {
    /**
     * Create a new member in both DB and JSON file
     */
    async create(member: Member) {
      let dbMember = null

      // 1. Check database availability and try to write
      const dbAvailable = await checkDatabaseAvailability()
      if (dbAvailable && MembersDB) {
        try {
          dbMember = MembersDB.create(member)
        } catch (error) {
          console.warn('Database write failed, using JSON only:', error)
        }
      }

      // 2. Write to JSON file (always)
      const members = await readJsonFile('members.json')

      if (dbMember && dbMember.id) {
        // Use database result
        members.push(dbMember)
        await writeJsonFile('members.json', members)
        return dbMember
      } else {
        // Fallback: create member with JSON-based ID
        const newId = members.length > 0 ? Math.max(...members.map(m => m.id)) + 1 : 1
        const newMember = {
          ...member,
          id: newId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
        members.push(newMember)
        await writeJsonFile('members.json', members)
        return newMember
      }
    },

    /**
     * Get all members from the database or JSON fallback
     */
    async getAll(includeInactive = false) {
      // Try database first if available
      const dbAvailable = await checkDatabaseAvailability()
      if (dbAvailable && MembersDB) {
        try {
          return MembersDB.getAll(includeInactive)
        } catch (error) {
          console.warn('Database read failed, falling back to JSON:', error)
        }
      }

      // Fallback to JSON
      const members = await readJsonFile('members.json')
      if (includeInactive) {
        return members.sort((a, b) => `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`))
      } else {
        return members
          .filter(m => m.isActive !== false)
          .sort((a, b) => `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`))
      }
    },

    /**
     * Get a member by ID from the database or JSON fallback
     */
    async getById(id: number) {
      // Try database first if available
      const dbAvailable = await checkDatabaseAvailability()
      if (dbAvailable && MembersDB) {
        try {
          return MembersDB.getById(id)
        } catch (error) {
          console.warn('Database read failed, falling back to JSON:', error)
        }
      }

      // Fallback to JSON
      const members = await readJsonFile('members.json')
      return members.find(m => m.id === id)
    },

    /**
     * Update a member in both DB and JSON file
     */
    async update(id: number, updates: Partial<Member>) {
      // 1. Update in Database
      const updatedMember = MembersDB.update(id, updates)

      // 2. Update in JSON file
      if (updatedMember) {
        const members = await readJsonFile('members.json')
        const index = members.findIndex(m => m.id === id)
        if (index !== -1) {
          members[index] = { ...members[index], ...updatedMember }
          await writeJsonFile('members.json', members)
        }
      }
      
      return updatedMember
    },

    /**
     * Delete a member from both DB and JSON file
     */
    async delete(id: number) {
      // 1. Delete from Database
      const result = MembersDB.delete(id)

      // 2. Delete from JSON file
      if (result.changes > 0) {
        let members = await readJsonFile('members.json')
        members = members.filter(m => m.id !== id)
        await writeJsonFile('members.json', members)
      }
      
      return result
    },
  },

  attendance: {
    /**
     * Create a new attendance record in both DB and JSON file
     */
    async create(record: Partial<Attendance>) {
      // 1. Write to Database
      const dbRecord = AttendanceDB.upsert(record as Attendance)

      // 2. Write to JSON file
      const attendance = await readJsonFile('attendance.json')
      if (dbRecord && dbRecord.id) {
        // Check if record already exists to avoid duplicates
        const index = attendance.findIndex(a => a.id === dbRecord.id);
        if (index !== -1) {
          attendance[index] = dbRecord; // Update existing
        } else {
          attendance.push(dbRecord); // Add new
        }
        await writeJsonFile('attendance.json', attendance)
      } else {
        console.error("Failed to create attendance record in database or retrieve ID.")
      }

      return dbRecord
    },

    /**
     * Get all attendance records from the database or JSON fallback
     */
    async getAll(sabbathDate?: string) {
      // Try database first if available
      const dbAvailable = await checkDatabaseAvailability()
      if (dbAvailable && AttendanceDB) {
        try {
          return AttendanceDB.getAll(sabbathDate)
        } catch (error) {
          console.warn('Database read failed, falling back to JSON:', error)
        }
      }

      // Fallback to JSON
      const attendance = await readJsonFile('attendance.json')
      if (sabbathDate) {
        return attendance
          .filter(a => a.sabbathDate === sabbathDate)
          .sort((a, b) => a.id - b.id)
      } else {
        return attendance.sort((a, b) => new Date(b.sabbathDate).getTime() - new Date(a.sabbathDate).getTime())
      }
    },

    /**
     * Delete an attendance record from both DB and JSON file
     */
    async delete(id: number) {
      // 1. Delete from Database
      const result = AttendanceDB.delete(id)

      // 2. Delete from JSON file
      if (result.changes > 0) {
        let attendance = await readJsonFile('attendance.json')
        attendance = attendance.filter(a => a.id !== id)
        await writeJsonFile('attendance.json', attendance)
      }
      
      return result
    },
  },

  visitors: {
    /**
     * Create a new visitor in both DB and JSON file
     */
    async create(visitor: Partial<Visitor>) {
      // 1. Write to Database
      const dbVisitor = VisitorsDB.create(visitor as Visitor)

      // 2. Write to JSON file
      const visitors = await readJsonFile('visitors.json')
      if (dbVisitor && dbVisitor.id) {
        visitors.push(dbVisitor)
        await writeJsonFile('visitors.json', visitors)
      } else {
        console.error("Failed to create visitor in database or retrieve ID.")
      }
      
      return dbVisitor
    },

    /**
     * Get all visitors from the database
     */
    getAll(sabbathDate?: string) {
      return VisitorsDB.getAll(sabbathDate)
    },

    /**
     * Update a visitor in both DB and JSON file
     */
    async update(id: string, updates: Partial<Visitor>) {
      // 1. Update in Database
      const updatedVisitor = VisitorsDB.update(id, updates)

      // 2. Update in JSON file
      if (updatedVisitor) {
        const visitors = await readJsonFile('visitors.json')
        const index = visitors.findIndex(v => v.id === id)
        if (index !== -1) {
          visitors[index] = { ...visitors[index], ...updatedVisitor }
          await writeJsonFile('visitors.json', visitors)
        }
      }
      
      return updatedVisitor
    },

    /**
     * Delete a visitor from both DB and JSON file
     */
    async delete(id: string) {
      // 1. Delete from Database
      const result = VisitorsDB.delete(id)

      // 2. Delete from JSON file
      if (result.changes > 0) {
        let visitors = await readJsonFile('visitors.json')
        visitors = visitors.filter(v => v.id !== id)
        await writeJsonFile('visitors.json', visitors)
      }
      
      return result
    },
  }
}