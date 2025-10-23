import { readJsonFilePaginated, type PaginationOptions } from '~/server/utils/jsonDb'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const sabbathDate = query.sabbathDate as string | undefined
    const page = parseInt(query.page as string) || 1
    const limit = parseInt(query.limit as string) || 50
    const sortBy = query.sortBy as string || 'sabbathDate'
    const sortOrder = (query.sortOrder as 'asc' | 'desc') || 'desc'

    // For now, filter by date after loading (could be optimized further)
    let attendance = await readJsonFilePaginated('attendance.json', {
      page,
      limit,
      sortBy,
      sortOrder
    })

    // If sabbathDate is specified, filter the results
    if (sabbathDate) {
      const allAttendance = await readJsonFilePaginated('attendance.json', {
        page: 1,
        limit: 10000, // Large limit to get all records for filtering
        sortBy,
        sortOrder
      })

      const filteredData = allAttendance.data.filter((record: any) =>
        record.sabbathDate === sabbathDate
      )

      // Apply pagination to filtered results
      const startIndex = (page - 1) * limit
      const endIndex = startIndex + limit
      const paginatedData = filteredData.slice(startIndex, endIndex)

      attendance = {
        data: paginatedData,
        pagination: {
          ...attendance.pagination,
          total: filteredData.length,
          totalPages: Math.ceil(filteredData.length / limit),
          hasNext: endIndex < filteredData.length,
          hasPrev: page > 1
        }
      }
    }

    return attendance
  } catch (error) {
    console.error('Error fetching attendance:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch attendance data'
    })
  }
})
