import { getDatabase } from './database';
import { logError } from './logger';
import { Admin } from './types';

/**
 * Database admin operations with JSON fallback
 */
export const adminStorage = {
  /**
   * Get admin by username with database fallback to JSON
   */
  async getByUsername(username: string): Promise<Admin | null> {
    // Try database first
    try {
      const db = getDatabase();
      const admin = db.prepare('SELECT * FROM admins WHERE username = ? AND isActive = 1').get(username);
      if (admin) {
        return admin as Admin;
      }
    } catch (dbError) {
      logError('Database admin lookup failed, trying JSON fallback', dbError instanceof Error ? dbError : new Error(String(dbError)), { username });
    }

    // Fallback to JSON storage
    try {
      const { jsonOnlyStorage } = await import('./jsonOnlyStorage');
      const admin = await jsonOnlyStorage.admin.getByUsername(username);
      if (admin) {
        return admin;
      }
    } catch (jsonError) {
      logError('JSON admin lookup failed', jsonError instanceof Error ? jsonError : new Error(String(jsonError)), { username });
    }

    return null;
  },

  /**
   * Get admin by ID with database fallback to JSON
   */
  async getById(id: number): Promise<Admin | null> {
    // Try database first
    try {
      const db = getDatabase();
      const admin = db.prepare('SELECT * FROM admins WHERE id = ? AND isActive = 1').get(id);
      if (admin) {
        return admin as Admin;
      }
    } catch (dbError) {
      logError('Database admin lookup by ID failed, trying JSON fallback', dbError instanceof Error ? dbError : new Error(String(dbError)), { id });
    }

    // Fallback to JSON storage
    try {
      const { jsonOnlyStorage } = await import('./jsonOnlyStorage');
      const admin = await jsonOnlyStorage.admin.getById(id);
      if (admin) {
        return admin;
      }
    } catch (jsonError) {
      logError('JSON admin lookup by ID failed', jsonError instanceof Error ? jsonError : new Error(String(jsonError)), { id });
    }

    return null;
  },

  /**
   * Get all admins with database fallback to JSON
   */
  async getAll(): Promise<Admin[]> {
    // Try database first
    try {
      const db = getDatabase();
      const admins = db.prepare('SELECT * FROM admins WHERE isActive = 1 ORDER BY username').all();
      if (admins && admins.length > 0) {
        return admins as Admin[];
      }
    } catch (dbError) {
      logError('Database admin list failed, trying JSON fallback', dbError instanceof Error ? dbError : new Error(String(dbError)));
    }

    // Fallback to JSON storage
    try {
      const { jsonOnlyStorage } = await import('./jsonOnlyStorage');
      const admins = await jsonOnlyStorage.admin.getAll();
      return admins || [];
    } catch (jsonError) {
      logError('JSON admin list failed', jsonError instanceof Error ? jsonError : new Error(String(jsonError)));
      return [];
    }
  },

  /**
   * Create admin with database fallback to JSON
   */
  async create(adminData: Partial<Admin>): Promise<Admin | null> {
    // Try database first
    try {
      const db = getDatabase();
      const stmt = db.prepare(`
        INSERT INTO admins (username, password, email, isActive, isSuperAdmin, createdAt, updatedAt)
        VALUES (?, ?, ?, 1, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING *
      `);
      const admin = stmt.get(
        adminData.username,
        adminData.password,
        adminData.email,
        adminData.isSuperAdmin ? 1 : 0
      );
      if (admin) {
        return admin as Admin;
      }
    } catch (dbError) {
      logError('Database admin creation failed, trying JSON fallback', dbError instanceof Error ? dbError : new Error(String(dbError)), { username: adminData.username });
    }

    // Fallback to JSON storage
    try {
      const { jsonOnlyStorage } = await import('./jsonOnlyStorage');
      const admin = await jsonOnlyStorage.admin.create(adminData);
      return admin;
    } catch (jsonError) {
      logError('JSON admin creation failed', jsonError instanceof Error ? jsonError : new Error(String(jsonError)), { username: adminData.username });
      return null;
    }
  }
};