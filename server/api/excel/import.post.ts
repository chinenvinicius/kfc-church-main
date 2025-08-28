import { importAttendanceFromExcel } from '../../utils/excel'
import { importMembersFromCSV, importVisitorsFromCSV, importAttendanceFromCSV } from '../../utils/csvUtils'
import { join } from 'path'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    
    if (!body.filename) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Filename is required'
      })
    }

    const fileExtension = body.filename.split('.').pop()

    let result: any
    if (fileExtension === 'csv') {
      const filepath = join(process.cwd(), 'server/uploads', body.filename)
      // Assuming the CSV import is specifically for members.csv as per the task
      if (body.filename === 'members.csv') {
        result = await importMembersFromCSV(filepath, { overwrite: body.overwrite || false })
        result.message = 'Members CSV imported successfully'
      } else if (body.filename === 'attendance.csv') {
        result = await importAttendanceFromCSV(filepath, { overwrite: body.overwrite || false, validateMembers: body.validateMembers !== false })
        result.message = 'Attendance CSV imported successfully'
      } else if (body.filename === 'visitors.csv') {
        result = await importVisitorsFromCSV(filepath, { overwrite: body.overwrite || false })
        result.message = 'Visitors CSV imported successfully'
      }
      else {
        throw createError({
          statusCode: 400,
          statusMessage: 'Only members.csv, attendance.csv, or visitors.csv import is supported via this endpoint for CSV files.'
        })
      }
    } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
      const filepath = join(process.cwd(), 'server/excel', body.filename)
      const options = {
        sheetName: body.sheetName,
        overwrite: body.overwrite || false,
        validateMembers: body.validateMembers !== false // Default to true
      }
      result = await importAttendanceFromExcel(filepath, options)
      result.message = 'Excel file imported successfully'
    } else {
      throw createError({
        statusCode: 400,
        statusMessage: 'Unsupported file type. Only .csv, .xlsx, and .xls are supported.'
      })
    }
    
    return {
      success: true,
      ...result
    }
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: `Import failed: ${error.message}`
    })
  }
})
