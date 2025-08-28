import { getAttendanceStatsJsonOnly } from '../../utils/jsonOnlyStorage'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const sabbathDate = query.sabbathDate as string

    const stats = await getAttendanceStatsJsonOnly(sabbathDate)
    
    return {
      success: true,
      stats,
      percentages: {
        present: stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0,
        absent: stats.total > 0 ? Math.round((stats.absent / stats.total) * 100) : 0,
        other: stats.total > 0 ? Math.round((stats.other / stats.total) * 100) : 0
      }
    }
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to get attendance statistics'
    })
  }
})
