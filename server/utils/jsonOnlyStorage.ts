import { readJsonFile, writeJsonFile } from './jsonDb'

// Define interfaces locally to avoid importing database module
import { Member, Attendance, Visitor } from './types'

export interface Admin {
  id: number;
  username: string;
  password: string;
  email: string;
  isActive: boolean;
  isSuperAdmin?: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * =================================================================
 * JSON-ONLY STORAGE IMPLEMENTATION
 * =================================================================
 * This is a fallback storage system that uses only JSON files
 * when the SQLite database is not available (e.g., in production
 * containers where better-sqlite3 native bindings fail).
 * =================================================================
 */

export const jsonOnlyStorage = {
  members: {
    /**
     * Create a new member in JSON file
     */
    async create(member: Member) {
      const members = await readJsonFile('members.json')
      const newId = members.length > 0 ? Math.max(...members.map(m => m.id)) + 1 : 1
      const newMember = {
        ...member,
        id: newId,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      members.push(newMember)
      await writeJsonFile('members.json', members)
      return newMember
    },

    /**
     * Get all members from JSON file
     */
    async getAll(includeInactive = false) {
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
     * Get a member by ID from JSON file
     */
    async getById(id: number) {
      const members = await readJsonFile('members.json')
      return members.find(m => m.id === id)
    },

    /**
     * Update a member in JSON file
     */
    async update(id: number, updates: Partial<Member>) {
      const members = await readJsonFile('members.json')
      const index = members.findIndex(m => m.id === id)
      if (index !== -1) {
        members[index] = { 
          ...members[index], 
          ...updates, 
          updatedAt: new Date().toISOString() 
        }
        await writeJsonFile('members.json', members)
        return members[index]
      }
      return null
    },

    /**
     * Delete a member from JSON file
     */
    async delete(id: number) {
      const members = await readJsonFile('members.json')
      const index = members.findIndex(m => m.id === id)
      if (index !== -1) {
        members.splice(index, 1)
        await writeJsonFile('members.json', members)
        return { changes: 1 }
      }
      return { changes: 0 }
    },
  },

  attendance: {
    /**
     * Create a new attendance record in JSON file
     */
    async create(record: Partial<Attendance>) {
      const attendance = await readJsonFile('attendance.json')
      
      // Check if record already exists (upsert behavior)
      const existingIndex = attendance.findIndex(a => 
        a.memberId === record.memberId && a.sabbathDate === record.sabbathDate
      )
      
      if (existingIndex !== -1) {
        // Update existing record
        attendance[existingIndex] = {
          ...attendance[existingIndex],
          ...record,
          updatedAt: new Date().toISOString()
        }
        await writeJsonFile('attendance.json', attendance)
        return attendance[existingIndex]
      } else {
        // Create new record
        const newId = attendance.length > 0 ? Math.max(...attendance.map(a => a.id)) + 1 : 1
        const newRecord = {
          ...record,
          id: newId,
          notes: record.notes || '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        } as Attendance
        attendance.push(newRecord)
        await writeJsonFile('attendance.json', attendance)
        return newRecord
      }
    },

    /**
     * Update an attendance record in JSON file
     */
    async update(id: number, updates: Partial<Attendance>) {
      const attendance = await readJsonFile('attendance.json')
      const index = attendance.findIndex(a => a.id === id)
      if (index !== -1) {
        attendance[index] = {
          ...attendance[index],
          ...updates,
          updatedAt: new Date().toISOString()
        }
        await writeJsonFile('attendance.json', attendance)
        return attendance[index]
      }
      return null
    },

    /**
     * Get all attendance records from JSON file
     */
    async getAll(sabbathDate?: string) {
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
     * Delete an attendance record from JSON file
     */
    async delete(id: number) {
      const attendance = await readJsonFile('attendance.json')
      const index = attendance.findIndex(a => a.id === id)
      if (index !== -1) {
        attendance.splice(index, 1)
        await writeJsonFile('attendance.json', attendance)
        return { changes: 1 }
      }
      return { changes: 0 }
    },
  },

  visitors: {
    /**
     * Create a new visitor in JSON file
     */
    async create(visitor: Partial<Visitor>) {
      const visitors = await readJsonFile('visitors.json')
      const newVisitor = {
        ...visitor,
        notes: visitor.notes || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      } as Visitor
      visitors.push(newVisitor)
      await writeJsonFile('visitors.json', visitors)
      return newVisitor
    },

    /**
     * Get all visitors from JSON file
     */
    async getAll(sabbathDate?: string) {
      const visitors = await readJsonFile('visitors.json')
      if (sabbathDate) {
        return visitors
          .filter(v => v.sabbathDate === sabbathDate)
          .sort((a, b) => a.visitorName.localeCompare(b.visitorName))
      } else {
        return visitors.sort((a, b) => new Date(b.sabbathDate).getTime() - new Date(a.sabbathDate).getTime())
      }
    },

    /**
     * Update a visitor in JSON file
     */
    async update(id: string, updates: Partial<Visitor>) {
      const visitors = await readJsonFile('visitors.json')
      const index = visitors.findIndex(v => v.id === id)
      if (index !== -1) {
        visitors[index] = { 
          ...visitors[index], 
          ...updates, 
          updatedAt: new Date().toISOString() 
        }
        await writeJsonFile('visitors.json', visitors)
        return visitors[index]
      }
      return null
    },

    /**
     * Delete a visitor from JSON file
     */
    async delete(id: string) {
      const visitors = await readJsonFile('visitors.json')
      const index = visitors.findIndex(v => v.id === id)
      if (index !== -1) {
        visitors.splice(index, 1)
        await writeJsonFile('visitors.json', visitors)
        return { changes: 1 }
      }
      return { changes: 0 }
    },
  },

  admin: {
    /**
     * Get admin by username from JSON file
     */
    async getByUsername(username: string) {
      const admins = await readJsonFile('admins.json')
      return admins.find(a => a.username === username && a.isActive)
    },

    /**
     * Create a new admin in JSON file
     */
    async create(admin: Partial<Admin>) {
      const admins = await readJsonFile('admins.json')
      const newId = admins.length > 0 ? Math.max(...admins.map(a => a.id)) + 1 : 1
      const newAdmin = {
        ...admin,
        id: newId,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      } as Admin
      admins.push(newAdmin)
      await writeJsonFile('admins.json', admins)
      return newAdmin
    },

    /**
     * Get all admins from JSON file
     */
    async getAll() {
      const admins = await readJsonFile('admins.json')
      return admins.filter(a => a.isActive)
    },

    /**
     * Update admin password
     */
    async updatePassword(username: string, newPassword: string) {
      const admins = await readJsonFile('admins.json')
      const index = admins.findIndex(a => a.username === username)
      if (index !== -1) {
        admins[index] = {
          ...admins[index],
          password: newPassword,
          updatedAt: new Date().toISOString()
        }
        await writeJsonFile('admins.json', admins)
        return admins[index]
      }
      return null
    },

    /**
     * Get admin by ID from JSON file
     */
    async getById(id: number) {
      const admins = await readJsonFile('admins.json')
      return admins.find(a => a.id === id && a.isActive)
    },

    /**
     * Update admin account
     */
    async update(id: number, updates: Partial<Admin>) {
      const admins = await readJsonFile('admins.json')
      const index = admins.findIndex(a => a.id === id)
      if (index !== -1) {
        admins[index] = {
          ...admins[index],
          ...updates,
          updatedAt: new Date().toISOString()
        }
        await writeJsonFile('admins.json', admins)
        return admins[index]
      }
      return null
    }
  }
}

/**
 * Get attendance statistics from JSON files only
 */
export async function getAttendanceStatsJsonOnly(sabbathDate?: string) {
  try {
    const attendance = await readJsonFile('attendance.json')

    const filteredData = sabbathDate
      ? attendance.filter((record: any) => record.sabbathDate === sabbathDate)
      : attendance

    const stats = {
      total: filteredData.length,
      present: filteredData.filter((r: any) => r.status === 'present').length,
      absent: filteredData.filter((r: any) => r.status === 'absent').length,
      other: filteredData.filter((r: any) => r.status === 'other').length,
      date: sabbathDate || 'all'
    }

    return stats
  } catch (error) {
    console.error('Failed to get attendance stats:', error)
    throw error
  }
}
