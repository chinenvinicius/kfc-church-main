import { jsonOnlyStorage } from '~/server/utils/jsonOnlyStorage'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)

    // Validate required fields
    if (!body.memberId || !body.sabbathDate || body.notes === undefined) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing required fields: memberId, sabbathDate, notes'
      })
    }

    // Find the existing attendance record
    const attendanceRecords = await jsonOnlyStorage.attendance.getAll(body.sabbathDate)
    const existingRecord = attendanceRecords.find(r => 
      r.memberId === body.memberId && r.sabbathDate === body.sabbathDate
    )

    if (!existingRecord) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Attendance record not found for notes update'
      })
    }

    // Update only the notes field
    const updatedRecord = await jsonOnlyStorage.attendance.update(existingRecord.id, {
      notes: body.notes
    })

    return {
      success: true,
      data: updatedRecord,
    }
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }
    console.error('Error updating attendance notes:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to update attendance notes'
    })
  }
})