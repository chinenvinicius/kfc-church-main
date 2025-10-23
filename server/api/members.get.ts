import { readJsonFilePaginated, type PaginationOptions } from '~/server/utils/jsonDb'

export default defineEventHandler(async (event) => {
  try {
    console.log('DEBUG: Members API called - CWD:', process.cwd())
    const query = getQuery(event)
    const includeInactive = query.includeInactive === 'true'
    const page = parseInt(query.page as string) || 1
    const limit = parseInt(query.limit as string) || 50
    const sortBy = query.sortBy as string || 'lastName'
    const sortOrder = (query.sortOrder as 'asc' | 'desc') || 'asc'

    console.log('DEBUG: includeInactive:', includeInactive, 'page:', page, 'limit:', limit)

    // Get all members with pagination
    const result = await readJsonFilePaginated('members.json', {
      page,
      limit,
      sortBy,
      sortOrder
    })

    // Apply filtering for active/inactive members
    let filteredData = result.data
    if (!includeInactive) {
      filteredData = result.data.filter(m => m.isActive !== false)
    }

    console.log('DEBUG: Total members:', result.pagination.total, 'Filtered:', filteredData.length)

    return {
      data: filteredData,
      pagination: result.pagination
    }
  } catch (error) {
    console.error('ERROR fetching members:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch members data'
    })
  }
})