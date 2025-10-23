import { importAttendanceFromExcel } from '~/server/utils/excel'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    
    if (!body.filename) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Filename is required'
      })
    }

    const filepath = join(process.cwd(), 'server/excel', body.filename)
    
    console.log('🔍 Simple Excel import test...')
    console.log('File path:', filepath)
    
    // Test basic file reading
    const { existsSync } = await import('fs')
    if (!existsSync(filepath)) {
      throw new Error(`File not found: ${filepath}`)
    }
    
    console.log('✅ File exists, attempting import...')
    
    // Try import with minimal options
    const result = await importAttendanceFromExcel(filepath, {
      validateMembers: false, // Skip member validation for testing
      overwrite: true
    })
    
    console.log('✅ Import completed:', result)
    
    return {
      success: true,
      result,
      message: 'Simple Excel import test completed successfully'
    }
  } catch (error) {
    console.error('❌ Simple Excel import test failed:', error)
    throw createError({
      statusCode: 500,
      statusMessage: `Simple import failed: ${error.message}`
    })
  }
})