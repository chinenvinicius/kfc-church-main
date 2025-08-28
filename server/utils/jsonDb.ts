import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'

/**
 * Read data from a JSON file
 * @param filename - The name of the JSON file (e.g., 'visitors.json')
 * @returns Promise<any[]> - The parsed JSON data
 */
export async function readJsonFile(filename: string): Promise<any[]> {
  try {
    const dataPath = join(process.cwd(), 'server/data', filename)
    console.log(`DEBUG: Reading ${filename} from ${dataPath}`)
    
    // Check if file exists, if not return empty array
    if (!existsSync(dataPath)) {
      console.log(`DEBUG: File ${filename} does not exist at ${dataPath}`)
      return []
    }
    
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
 * @returns Promise<void>
 */
export async function writeJsonFile(filename: string, data: any[]): Promise<void> {
  try {
    const dataPath = join(process.cwd(), 'server/data', filename)
    writeFileSync(dataPath, JSON.stringify(data, null, 2))
  } catch (error) {
    console.error(`Error writing ${filename}:`, error)
    throw error
  }
}
