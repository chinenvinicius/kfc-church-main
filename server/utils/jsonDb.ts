import { readFile, writeFile, existsSync } from 'fs/promises'
import { writeFileSync, existsSync as existsSyncFallback } from 'fs'
import { join } from 'path'

// Simple in-memory cache for frequently accessed files
const fileCache = new Map<string, { data: any[], timestamp: number }>()
const CACHE_TTL = 5000 // 5 seconds cache

/**
 * Read data from a JSON file with caching and async I/O
 * @param filename - The name of the JSON file (e.g., 'visitors.json')
 * @param useCache - Whether to use cached data if available
 * @returns Promise<any[]> - The parsed JSON data
 */
export async function readJsonFile(filename: string, useCache: boolean = true): Promise<any[]> {
  try {
    const dataPath = join(process.cwd(), 'server/data', filename)
    console.log(`DEBUG: Reading ${filename} from ${dataPath}`)

    // Check if file exists, if not return empty array
    if (!existsSyncFallback(dataPath)) {
      console.log(`DEBUG: File ${filename} does not exist at ${dataPath}`)
      return []
    }

    // Check cache first
    if (useCache) {
      const cached = fileCache.get(filename)
      if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
        console.log(`DEBUG: Using cached data for ${filename}`)
        return cached.data
      }
    }

    // Read file asynchronously (non-blocking)
    const data = await readFile(dataPath, 'utf-8')
    const parsed = JSON.parse(data)

    // Cache the result
    if (useCache) {
      fileCache.set(filename, {
        data: parsed,
        timestamp: Date.now()
      })
    }

    console.log(`DEBUG: Successfully read ${filename}: ${Array.isArray(parsed) ? parsed.length : 'non-array'} records`)
    return parsed
  } catch (error) {
    console.error(`Error reading ${filename}:`, error)
    return []
  }
}

/**
 * Read data from a JSON file synchronously (for backward compatibility)
 * @param filename - The name of the JSON file (e.g., 'visitors.json')
 * @returns any[] - The parsed JSON data
 */
export function readJsonFileSync(filename: string): any[] {
  try {
    const dataPath = join(process.cwd(), 'server/data', filename)
    console.log(`DEBUG: Reading ${filename} synchronously from ${dataPath}`)

    if (!existsSyncFallback(dataPath)) {
      console.log(`DEBUG: File ${filename} does not exist at ${dataPath}`)
      return []
    }

    const { readFileSync } = require('fs')
    const data = readFileSync(dataPath, 'utf-8')
    const parsed = JSON.parse(data)
    console.log(`DEBUG: Successfully read ${filename}: ${Array.isArray(parsed) ? parsed.length : 'non-array'} records`)
    return parsed
  } catch (error) {
    console.error(`Error reading ${filename}:`, error)
    return []
  }
}

/**
 * Write data to a JSON file
 * @param filename - The name of the JSON file (e.g., 'visitors.json')
 * @param data - The data to write to the file
 * @param invalidateCache - Whether to invalidate the cache after writing
 * @returns Promise<void>
 */
export async function writeJsonFile(filename: string, data: any[], invalidateCache: boolean = true): Promise<void> {
  try {
    const dataPath = join(process.cwd(), 'server/data', filename)

    // Write file asynchronously
    await writeFile(dataPath, JSON.stringify(data, null, 2), 'utf-8')

    // Invalidate cache for this file
    if (invalidateCache) {
      fileCache.delete(filename)
    }

    console.log(`DEBUG: Successfully wrote ${data.length} records to ${filename}`)
  } catch (error) {
    console.error(`Error writing ${filename}:`, error)
    throw error
  }
}

/**
 * Write data to a JSON file synchronously (for backward compatibility)
 * @param filename - The name of the JSON file (e.g., 'visitors.json')
 * @param data - The data to write to the file
 */
export function writeJsonFileSync(filename: string, data: any[]): void {
  try {
    const dataPath = join(process.cwd(), 'server/data', filename)
    const { writeFileSync } = require('fs')
    writeFileSync(dataPath, JSON.stringify(data, null, 2))
    console.log(`DEBUG: Successfully wrote ${data.length} records to ${filename} (sync)`)
  } catch (error) {
    console.error(`Error writing ${filename}:`, error)
    throw error
  }
}

/**
 * Clear cache for a specific file or all files
 * @param filename - Optional filename to clear cache for, if not provided clears all cache
 */
export function clearCache(filename?: string): void {
  if (filename) {
    fileCache.delete(filename)
    console.log(`DEBUG: Cache cleared for ${filename}`)
  } else {
    fileCache.clear()
    console.log(`DEBUG: All cache cleared`)
  }
}

/**
 * Pagination options interface
 */
export interface PaginationOptions {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

/**
 * Paginated result interface
 */
export interface PaginatedResult<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

/**
 * Apply pagination and sorting to an array of data
 * @param data - The data array to paginate
 * @param options - Pagination options
 * @returns PaginatedResult
 */
export function paginateData<T>(
  data: T[],
  options: PaginationOptions = {}
): PaginatedResult<T> {
  const { page = 1, limit = 50, sortBy, sortOrder = 'asc' } = options

  let result = [...data]

  // Apply sorting if specified
  if (sortBy) {
    result.sort((a, b) => {
      const aVal = (a as any)[sortBy]
      const bVal = (b as any)[sortBy]

      let comparison = 0
      if (aVal < bVal) comparison = -1
      if (aVal > bVal) comparison = 1

      return sortOrder === 'desc' ? -comparison : comparison
    })
  }

  // Apply pagination
  const startIndex = (page - 1) * limit
  const endIndex = startIndex + limit
  const paginatedData = result.slice(startIndex, endIndex)

  const total = data.length
  const totalPages = Math.ceil(total / limit)

  return {
    data: paginatedData,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    }
  }
}

/**
 * Read data from a JSON file with pagination support
 * @param filename - The name of the JSON file
 * @param options - Pagination options
 * @param useCache - Whether to use cached data
 * @returns Promise<PaginatedResult<any>>
 */
export async function readJsonFilePaginated(
  filename: string,
  options: PaginationOptions = {},
  useCache: boolean = true
): Promise<PaginatedResult<any>> {
  const data = await readJsonFile(filename, useCache)
  return paginateData(data, options)
}

/**
 * Optimized JSON parsing with better error handling and performance
 * @param jsonString - The JSON string to parse
 * @returns Parsed data or empty array on error
 */
function parseJSONOptimized(jsonString: string): any[] {
  try {
    // Remove any BOM if present
    const cleanString = jsonString.trim().replace(/^\uFEFF/, '')

    if (!cleanString) {
      return []
    }

    // Use native JSON.parse with better error context
    return JSON.parse(cleanString)
  } catch (error) {
    console.error('JSON parsing error:', error)
    console.error('First 500 characters:', jsonString.substring(0, 500))
    return []
  }
}

/**
 * Read and parse JSON file with optimized parsing
 * @param filename - The name of the JSON file
 * @param useCache - Whether to use cached data
 * @returns Promise<any[]>
 */
export async function readJsonFileOptimized(filename: string, useCache: boolean = true): Promise<any[]> {
  try {
    const dataPath = join(process.cwd(), 'server/data', filename)
    console.log(`DEBUG: Reading ${filename} from ${dataPath} (optimized)`)

    // Check if file exists, if not return empty array
    if (!existsSyncFallback(dataPath)) {
      console.log(`DEBUG: File ${filename} does not exist at ${dataPath}`)
      return []
    }

    // Check cache first
    if (useCache) {
      const cached = fileCache.get(filename)
      if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
        console.log(`DEBUG: Using cached data for ${filename}`)
        return cached.data
      }
    }

    // Read file asynchronously with optimized parsing
    const data = await readFile(dataPath, 'utf-8')
    const parsed = parseJSONOptimized(data)

    // Cache the result
    if (useCache) {
      fileCache.set(filename, {
        data: parsed,
        timestamp: Date.now()
      })
    }

    console.log(`DEBUG: Successfully read ${filename}: ${Array.isArray(parsed) ? parsed.length : 'non-array'} records (optimized)`)
    return parsed
  } catch (error) {
    console.error(`Error reading ${filename}:`, error)
    return []
  }
}

/**
 * Get file size for performance monitoring
 * @param filename - The name of the JSON file
 * @returns Promise<number> - File size in bytes
 */
export async function getJsonFileSize(filename: string): Promise<number> {
  try {
    const { stat } = await import('fs/promises')
    const dataPath = join(process.cwd(), 'server/data', filename)
    const stats = await stat(dataPath)
    return stats.size
  } catch (error) {
    console.error(`Error getting size for ${filename}:`, error)
    return 0
  }
}

/**
 * Performance monitoring utility
 */
export async function getPerformanceStats(): Promise<{
  cacheSize: number
  cacheHitRate: number
  fileSizes: Record<string, number>
}> {
  try {
    const fileSizes: Record<string, number> = {}
    const dataFiles = ['attendance.json', 'members.json', 'visitors.json', 'files.json']

    for (const file of dataFiles) {
      fileSizes[file] = await getJsonFileSize(file)
    }

    return {
      cacheSize: fileCache.size,
      cacheHitRate: 0.85, // Placeholder - would need to track actual hits/misses
      fileSizes
    }
  } catch (error) {
    console.error('Error getting performance stats:', error)
    return {
      cacheSize: 0,
      cacheHitRate: 0,
      fileSizes: {}
    }
  }
}
