import { watch } from 'fs'
import { join, extname } from 'path'
import { importAttendanceFromExcel } from './excel'
import { saveAttendanceDual } from './sync'
import { readFileSync, existsSync, statSync, writeFileSync } from 'fs'

interface ExcelWatcherConfig {
  enabled: boolean
  watchInterval: number // in seconds
  autoImport: boolean
  watchDirectory: string
}

interface FileChangeInfo {
  filename: string
  lastModified: Date
  size: number
}

const EXCEL_WATCHER_CONFIG_PATH = join(process.cwd(), 'server/data/excel-watcher-config.json')
const EXCEL_DIR = join(process.cwd(), 'server/excel')

// Store last known file states
const fileStates = new Map<string, FileChangeInfo>()

/**
 * Load Excel watcher configuration
 */
function loadWatcherConfig(): ExcelWatcherConfig {
  const defaultConfig: ExcelWatcherConfig = {
    enabled: false,
    watchInterval: 30, // 30 seconds
    autoImport: false,
    watchDirectory: EXCEL_DIR
  }

  try {
    if (existsSync(EXCEL_WATCHER_CONFIG_PATH)) {
      const configData = readFileSync(EXCEL_WATCHER_CONFIG_PATH, 'utf-8')
      return { ...defaultConfig, ...JSON.parse(configData) }
    }
  } catch (error) {
    console.error('Failed to load Excel watcher config:', error)
  }

  return defaultConfig
}

/**
 * Save Excel watcher configuration
 */
function saveWatcherConfig(config: ExcelWatcherConfig): void {
  try {
    const configData = JSON.stringify(config, null, 2)
    writeFileSync(EXCEL_WATCHER_CONFIG_PATH, configData, 'utf-8')
  } catch (error) {
    console.error('Failed to save Excel watcher config:', error)
    throw error
  }
}

/**
 * Get Excel watcher configuration
 */
export function getExcelWatcherConfig(): ExcelWatcherConfig {
  return loadWatcherConfig()
}

/**
 * Update Excel watcher configuration
 */
export function updateExcelWatcherConfig(config: Partial<ExcelWatcherConfig>): ExcelWatcherConfig {
  const currentConfig = loadWatcherConfig()
  const newConfig = { ...currentConfig, ...config }
  saveWatcherConfig(newConfig)
  return newConfig
}

/**
 * Get all Excel files in the watch directory
 */
function getExcelFiles(directory: string): string[] {
  try {
    const { readdirSync } = require('fs')
    const files = readdirSync(directory)
    
    return files.filter((file: string) => {
      const ext = extname(file).toLowerCase()
      return ext === '.xlsx' || ext === '.xls'
    })
  } catch (error) {
    console.error('Failed to read Excel directory:', error)
    return []
  }
}

/**
 * Check if a file has been modified
 */
function hasFileChanged(filepath: string): boolean {
  try {
    const stats = statSync(filepath)
    const currentState: FileChangeInfo = {
      filename: filepath,
      lastModified: stats.mtime,
      size: stats.size
    }

    const previousState = fileStates.get(filepath)
    
    if (!previousState) {
      fileStates.set(filepath, currentState)
      return true // First time seeing this file
    }

    const hasChanged = 
      previousState.lastModified.getTime() !== currentState.lastModified.getTime() ||
      previousState.size !== currentState.size

    if (hasChanged) {
      fileStates.set(filepath, currentState)
    }

    return hasChanged
  } catch (error) {
    console.error(`Failed to check file state for ${filepath}:`, error)
    return false
  }
}

/**
 * Import a single Excel file and update JSON
 */
async function importExcelFile(filepath: string): Promise<{ success: boolean; message: string; results?: any }> {
  try {
    console.log(`📊 Processing Excel file: ${filepath}`)
    
    const options = {
      validateMembers: true,
      overwrite: true // Update existing records
    }

    const result = await importAttendanceFromExcel(filepath, options)
    
    if (result.success) {
      console.log(`✅ Excel import successful: ${result.results.imported} imported, ${result.results.updated} updated`)
      
      // Trigger real-time update notification
      await notifyFrontendUpdate({
        type: 'excel_import',
        filename: filepath,
        results: result.results,
        timestamp: new Date().toISOString()
      })
      
      return {
        success: true,
        message: `Successfully imported ${result.results.imported} new records and updated ${result.results.updated} existing records`,
        results: result.results
      }
    } else {
      return {
        success: false,
        message: `Excel import failed: ${result.message || 'Unknown error'}`
      }
    }
  } catch (error) {
    console.error(`❌ Failed to import Excel file ${filepath}:`, error)
    return {
      success: false,
      message: `Import failed: ${error.message}`
    }
  }
}

/**
 * Notify frontend of data updates
 */
async function notifyFrontendUpdate(updateData: any): Promise<void> {
  try {
    // This will be used to send real-time updates to connected clients
    // We'll implement this with Server-Sent Events or WebSocket
    console.log('📢 Notifying frontend of update:', updateData.type)
    
    // Store the update notification for clients to poll
    const notificationPath = join(process.cwd(), 'server/data/last-update-notification.json')
    writeFileSync(notificationPath, JSON.stringify(updateData, null, 2), 'utf-8')
  } catch (error) {
    console.error('Failed to notify frontend:', error)
  }
}

/**
 * Check for changes in Excel files and import if needed
 */
async function checkForExcelChanges(): Promise<void> {
  const config = loadWatcherConfig()
  
  if (!config.enabled || !config.autoImport) {
    return
  }

  try {
    const excelFiles = getExcelFiles(config.watchDirectory)
    console.log(`🔍 Checking ${excelFiles.length} Excel files for changes...`)

    let changesFound = 0
    let successfulImports = 0

    for (const filename of excelFiles) {
      const filepath = join(config.watchDirectory, filename)
      
      if (hasFileChanged(filepath)) {
        changesFound++
        console.log(`📝 Change detected in: ${filename}`)
        
        const result = await importExcelFile(filepath)
        if (result.success) {
          successfulImports++
        }
      }
    }

    if (changesFound > 0) {
      console.log(`✅ Excel watcher completed: ${changesFound} files changed, ${successfulImports} successfully imported`)
    } else {
      console.log('✅ Excel watcher: No changes detected')
    }
  } catch (error) {
    console.error('❌ Excel watcher error:', error)
  }
}

/**
 * Start the Excel file watcher
 */
export function startExcelWatcher(): void {
  const config = loadWatcherConfig()
  
  console.log('🔍 Excel Watcher Configuration:', {
    enabled: config.enabled,
    autoImport: config.autoImport,
    watchInterval: config.watchInterval,
    watchDirectory: config.watchDirectory
  })

  if (!config.enabled) {
    console.log('⏸️  Excel watcher is disabled')
    return
  }

  if (!config.autoImport) {
    console.log('⏸️  Excel auto-import is disabled')
    return
  }

  const intervalSeconds = Math.max(config.watchInterval, 10) // Minimum 10 seconds
  console.log(`🚀 Starting Excel file watcher (checking every ${intervalSeconds} seconds)...`)

  // Run once immediately
  console.log('🔄 Running initial Excel check...')
  checkForExcelChanges()

  // Set up interval
  setInterval(async () => {
    console.log('🔄 Checking Excel files for changes...')
    await checkForExcelChanges()
  }, intervalSeconds * 1000)
}

/**
 * Manually trigger Excel file check
 */
export async function triggerExcelCheck(): Promise<{ success: boolean; message: string; results?: any }> {
  try {
    console.log('🔄 Manual Excel check triggered...')
    await checkForExcelChanges()
    return {
      success: true,
      message: 'Excel check completed successfully'
    }
  } catch (error) {
    console.error('Manual Excel check failed:', error)
    return {
      success: false,
      message: `Excel check failed: ${error.message}`
    }
  }
}

/**
 * Get current file states for debugging
 */
export function getFileStates(): Map<string, FileChangeInfo> {
  return new Map(fileStates)
}

/**
 * Reset file states (useful for testing)
 */
export function resetFileStates(): void {
  fileStates.clear()
}