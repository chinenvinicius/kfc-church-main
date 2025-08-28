import { join } from 'path'
import { existsSync, mkdirSync, readdirSync, statSync, unlinkSync, copyFileSync, readFileSync, writeFileSync } from 'fs'
import { v4 as uuidv4 } from 'uuid'

export interface FileRecord {
  id: string
  originalName: string
  filename: string
  category: string
  size: number
  mimeType: string
  uploadDate: string
  path: string
}

export class FileStorageManager {
  private storageDir: string
  private dataFile: string

  constructor() {
    this.storageDir = join(process.cwd(), 'server/storage')
    this.dataFile = join(process.cwd(), 'server/data/files.json')
    this.ensureDirectories()
  }

  private ensureDirectories() {
    const categories = ['documents', 'images', 'spreadsheets', 'others']
    
    if (!existsSync(this.storageDir)) {
      mkdirSync(this.storageDir, { recursive: true })
    }

    categories.forEach(category => {
      const categoryDir = join(this.storageDir, category)
      if (!existsSync(categoryDir)) {
        mkdirSync(categoryDir, { recursive: true })
      }
    })

    // Ensure data directory exists
    const dataDir = join(process.cwd(), 'server/data')
    if (!existsSync(dataDir)) {
      mkdirSync(dataDir, { recursive: true })
    }
  }

  private getFileCategory(mimeType: string, filename: string): string {
    const ext = filename.toLowerCase().split('.').pop() || ''
    
    // Images
    if (mimeType.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(ext)) {
      return 'images'
    }
    
    // Spreadsheets
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel') || 
        ['xlsx', 'xls', 'csv', 'ods'].includes(ext)) {
      return 'spreadsheets'
    }
    
    // Documents
    if (mimeType.includes('document') || mimeType.includes('pdf') || mimeType.includes('text') ||
        ['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt', 'ppt', 'pptx', 'odp'].includes(ext)) {
      return 'documents'
    }
    
    return 'others'
  }

  private loadFileRecords(): FileRecord[] {
    try {
      if (existsSync(this.dataFile)) {
        const data = JSON.parse(readFileSync(this.dataFile, 'utf-8'))
        return Array.isArray(data) ? data : []
      }
    } catch (error) {
      console.error('Error loading file records:', error)
    }
    return []
  }

  private saveFileRecords(records: FileRecord[]) {
    try {
      writeFileSync(this.dataFile, JSON.stringify(records, null, 2))
    } catch (error) {
      console.error('Error saving file records:', error)
      throw error
    }
  }

  async storeFile(
    tempPath: string,
    originalName: string,
    mimeType: string,
    size: number
  ): Promise<FileRecord> {
    const id = uuidv4()
    const category = this.getFileCategory(mimeType, originalName)
    const ext = originalName.split('.').pop() || ''
    const filename = `${id}.${ext}`
    const finalPath = join(this.storageDir, category, filename)

    // Copy file to final location
    copyFileSync(tempPath, finalPath)

    // Create file record
    const fileRecord: FileRecord = {
      id,
      originalName,
      filename,
      category,
      size,
      mimeType,
      uploadDate: new Date().toISOString(),
      path: finalPath
    }

    // Save to records
    const records = this.loadFileRecords()
    records.push(fileRecord)
    this.saveFileRecords(records)

    return fileRecord
  }

  getFiles(category?: string): FileRecord[] {
    const records = this.loadFileRecords()
    
    if (category && category !== 'all') {
      return records.filter(record => record.category === category)
    }
    
    return records
  }

  getFile(id: string): FileRecord | null {
    const records = this.loadFileRecords()
    return records.find(record => record.id === id) || null
  }

  deleteFile(id: string): boolean {
    const records = this.loadFileRecords()
    const fileIndex = records.findIndex(record => record.id === id)
    
    if (fileIndex === -1) {
      return false
    }

    const fileRecord = records[fileIndex]
    
    // Delete physical file
    try {
      if (existsSync(fileRecord.path)) {
        unlinkSync(fileRecord.path)
      }
    } catch (error) {
      console.error('Error deleting physical file:', error)
    }

    // Remove from records
    records.splice(fileIndex, 1)
    this.saveFileRecords(records)
    
    return true
  }

  getStorageStats() {
    const records = this.loadFileRecords()
    const totalFiles = records.length
    const totalSize = records.reduce((sum, record) => sum + record.size, 0)
    
    const categoryStats = {
      documents: records.filter(r => r.category === 'documents').length,
      images: records.filter(r => r.category === 'images').length,
      spreadsheets: records.filter(r => r.category === 'spreadsheets').length,
      others: records.filter(r => r.category === 'others').length
    }

    return {
      totalFiles,
      totalSize,
      categoryStats
    }
  }
}

export const fileStorage = new FileStorageManager()
