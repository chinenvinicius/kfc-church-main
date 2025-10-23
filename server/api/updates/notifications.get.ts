import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const lastCheck = query.lastCheck as string
    
    const notificationPath = join(process.cwd(), 'server/data/last-update-notification.json')
    
    if (!existsSync(notificationPath)) {
      return {
        success: true,
        hasUpdates: false,
        notifications: []
      }
    }
    
    const notificationData = JSON.parse(readFileSync(notificationPath, 'utf-8'))
    
    // If client provided a lastCheck timestamp, only return newer notifications
    if (lastCheck) {
      const clientLastCheck = new Date(lastCheck)
      const notificationTime = new Date(notificationData.timestamp)
      
      if (notificationTime <= clientLastCheck) {
        return {
          success: true,
          hasUpdates: false,
          notifications: []
        }
      }
    }
    
    return {
      success: true,
      hasUpdates: true,
      notifications: [notificationData],
      timestamp: notificationData.timestamp
    }
  } catch (error) {
    console.error('Failed to get update notifications:', error)
    return {
      success: true,
      hasUpdates: false,
      notifications: []
    }
  }
})