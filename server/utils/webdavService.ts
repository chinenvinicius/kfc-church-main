import { createClient, WebDAVClient } from 'webdav'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'

export interface WebDAVConfig {
  enabled: boolean
  serverUrl: string
  username: string
  password: string
  email?: string
  storageQuota?: string
  basePath: string
  lastUpdated: string | null
  lastTested: string | null
  connectionStatus: 'untested' | 'connected' | 'failed'
}

export class WebDAVService {
  private configFile: string
  private client: WebDAVClient | null = null

  constructor() {
    this.configFile = join(process.cwd(), 'server/data/webdav-config.json')
    this.ensureConfigFile()
  }

  private ensureConfigFile() {
    if (!existsSync(this.configFile)) {
      const defaultConfig: WebDAVConfig = {
        enabled: false,
        serverUrl: '',
        username: '',
        password: '',
        email: '',
        storageQuota: '',
        basePath: '/backgrounds',
        lastUpdated: null,
        lastTested: null,
        connectionStatus: 'untested'
      }
      writeFileSync(this.configFile, JSON.stringify(defaultConfig, null, 2))
    }
  }

  getConfig(): WebDAVConfig {
    try {
      const configData = readFileSync(this.configFile, 'utf-8')
      const config = JSON.parse(configData)

      // Ensure backward compatibility - add missing fields with defaults
      return {
        enabled: config.enabled || false,
        serverUrl: config.serverUrl || '',
        username: config.username || '',
        password: config.password || '',
        email: config.email || '',
        storageQuota: config.storageQuota || '',
        basePath: config.basePath || '/backgrounds',
        lastUpdated: config.lastUpdated || null,
        lastTested: config.lastTested || null,
        connectionStatus: config.connectionStatus || 'untested'
      }
    } catch (error) {
      console.error('Error reading WebDAV config:', error)
      throw new Error('Failed to read WebDAV configuration')
    }
  }

  async updateConfig(config: Partial<WebDAVConfig>): Promise<WebDAVConfig> {
    try {
      console.log('Updating WebDAV config:', config)
      const currentConfig = this.getConfig()
      const updatedConfig = {
        ...currentConfig,
        ...config,
        lastUpdated: new Date().toISOString()
      }

      console.log('Writing config to file:', this.configFile)
      writeFileSync(this.configFile, JSON.stringify(updatedConfig, null, 2))

      // Reset client if connection details changed
      if (config.serverUrl || config.username || config.password) {
        console.log('Resetting WebDAV client due to credential changes')
        this.client = null
        updatedConfig.connectionStatus = 'untested'
        updatedConfig.lastTested = null
      }

      console.log('WebDAV config updated successfully')
      return updatedConfig
    } catch (error) {
      console.error('Error updating WebDAV config:', error)
      throw new Error('Failed to update WebDAV configuration')
    }
  }

  private getClient(): WebDAVClient {
    if (!this.client) {
      const config = this.getConfig()
      
      if (!config.enabled || !config.serverUrl || !config.username || !config.password) {
        throw new Error('WebDAV is not properly configured')
      }

      this.client = createClient(config.serverUrl, {
        username: config.username,
        password: config.password
      })
    }

    return this.client
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const config = this.getConfig()
      
      if (!config.serverUrl || !config.username || !config.password) {
        return {
          success: false,
          message: 'WebDAV configuration is incomplete'
        }
      }

      const client = this.getClient()
      
      // Test connection by checking if the server responds
      await client.getDirectoryContents('/')
      
      // Update connection status
      await this.updateConfig({
        connectionStatus: 'connected',
        lastTested: new Date().toISOString()
      })

      return {
        success: true,
        message: 'WebDAV connection successful'
      }
    } catch (error) {
      console.error('WebDAV connection test failed:', error)
      
      // Update connection status
      await this.updateConfig({
        connectionStatus: 'failed',
        lastTested: new Date().toISOString()
      })

      return {
        success: false,
        message: error instanceof Error ? error.message : 'Connection test failed'
      }
    }
  }

  async ensureDirectory(path: string): Promise<void> {
    try {
      const client = this.getClient()
      const exists = await client.exists(path)
      
      if (!exists) {
        await client.createDirectory(path, { recursive: true })
      }
    } catch (error) {
      console.error('Error ensuring WebDAV directory:', error)
      throw new Error('Failed to create WebDAV directory')
    }
  }

  async uploadFile(
    localFilePath: string, 
    remoteFileName: string, 
    fileBuffer?: Buffer
  ): Promise<string> {
    try {
      const config = this.getConfig()
      
      if (!config.enabled) {
        throw new Error('WebDAV storage is not enabled')
      }

      const client = this.getClient()
      
      // Ensure the base directory exists
      await this.ensureDirectory(config.basePath)
      
      const remotePath = `${config.basePath}/${remoteFileName}`
      
      // Upload file
      if (fileBuffer) {
        await client.putFileContents(remotePath, fileBuffer)
      } else {
        const fileData = readFileSync(localFilePath)
        await client.putFileContents(remotePath, fileData)
      }

      // Return the WebDAV URL
      return `${config.serverUrl}${remotePath}`
    } catch (error) {
      console.error('Error uploading file to WebDAV:', error)
      throw new Error('Failed to upload file to WebDAV server')
    }
  }

  async deleteFile(remoteFileName: string): Promise<void> {
    try {
      const config = this.getConfig()
      
      if (!config.enabled) {
        throw new Error('WebDAV storage is not enabled')
      }

      const client = this.getClient()
      const remotePath = `${config.basePath}/${remoteFileName}`
      
      const exists = await client.exists(remotePath)
      if (exists) {
        await client.deleteFile(remotePath)
      }
    } catch (error) {
      console.error('Error deleting file from WebDAV:', error)
      throw new Error('Failed to delete file from WebDAV server')
    }
  }

  async listFiles(): Promise<any[]> {
    try {
      const config = this.getConfig()
      
      if (!config.enabled) {
        return []
      }

      const client = this.getClient()
      
      // Ensure directory exists
      await this.ensureDirectory(config.basePath)
      
      const contents = await client.getDirectoryContents(config.basePath)
      
      return Array.isArray(contents) ? contents.filter(item => item.type === 'file') : []
    } catch (error) {
      console.error('Error listing WebDAV files:', error)
      return []
    }
  }

  isEnabled(): boolean {
    const config = this.getConfig()
    return config.enabled && !!config.serverUrl && !!config.username && !!config.password
  }

  getWebDAVClient(): WebDAVClient {
    return this.getClient()
  }
}

// Export singleton instance
export const webdavService = new WebDAVService()
