import { jsonOnlyStorage } from '~/server/utils/jsonOnlyStorage'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const sabbathDate = query.sabbathDate as string | undefined

    const attendance = await jsonOnlyStorage.attendance.getAll(sabbathDate)

    return {
      data: attendance,
      count: attendance.length
    }
  } catch (error) {
    console.error('Error fetching attendance:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch attendance data'
    })
  }
})
