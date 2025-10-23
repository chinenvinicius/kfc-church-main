import { jsonOnlyStorage } from '~/server/utils/jsonOnlyStorage'
import { syncAttendanceToGoogleSheets } from '~/server/utils/googleSheetsService'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)

    // Validate required fields
    if (!body.memberId || !body.sabbathDate || !body.status) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing required fields: memberId, sabbathDate, status'
      })
    }

    // Validate status
    if (!['present', 'absent', 'other'].includes(body.status)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid status. Must be: present, absent, or other'
      })
    }

    const attendanceRecord = await jsonOnlyStorage.attendance.create({
      memberId: body.memberId,
      sabbathDate: body.sabbathDate,
      status: body.status,
      notes: body.notes || ''
    })

    // Sync to Google Sheets if enabled (non-blocking)
    if (body.syncToGoogleSheets !== false) {
      // Run sync in background without waiting
      syncAttendanceToGoogleSheets(body.sabbathDate).catch(error => {
        console.error('Background Google Sheets sync failed:', error)
      })
    }

    return {
      success: true,
      data: attendanceRecord,
    }
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }
    console.error('Error creating attendance:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to create attendance'
    })
  }
})
