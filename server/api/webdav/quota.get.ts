import { webdavService } from '~/server/utils/webdavService'

export default defineEventHandler(async (event) => {
  try {
    // Check if WebDAV is enabled
    if (!webdavService.isEnabled()) {
      throw createError({
        statusCode: 400,
        statusMessage: 'WebDAV is not enabled'
      })
    }

    try {
      const client = webdavService.getWebDAVClient()
      
      // Try to get quota information using PROPFIND
      const quotaInfo = await client.customRequest('/', {
        method: 'PROPFIND',
        headers: {
          'Content-Type': 'application/xml',
          'Depth': '0'
        },
        data: `<?xml version="1.0" encoding="utf-8" ?>
<D:propfind xmlns:D="DAV:">
  <D:prop>
    <D:quota-available-bytes/>
    <D:quota-used-bytes/>
  </D:prop>
</D:propfind>`
      })

      // Parse the XML response to extract quota information
      let quotaUsed = null
      let quotaAvailable = null
      let totalQuota = null

      if (quotaInfo.data) {
        const xmlString = quotaInfo.data.toString()
        
        // Simple regex parsing for quota values
        const usedMatch = xmlString.match(/<D:quota-used-bytes[^>]*>(\d+)<\/D:quota-used-bytes>/)
        const availableMatch = xmlString.match(/<D:quota-available-bytes[^>]*>(\d+)<\/D:quota-available-bytes>/)
        
        if (usedMatch) {
          quotaUsed = parseInt(usedMatch[1])
        }
        
        if (availableMatch) {
          quotaAvailable = parseInt(availableMatch[1])
        }
        
        if (quotaUsed !== null && quotaAvailable !== null) {
          totalQuota = quotaUsed + quotaAvailable
        }
      }

      // Format bytes to human readable format
      const formatBytes = (bytes: number | null): string => {
        if (bytes === null) return 'Unknown'
        
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
        if (bytes === 0) return '0 Bytes'
        
        const i = Math.floor(Math.log(bytes) / Math.log(1024))
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
      }

      return {
        success: true,
        data: {
          quotaUsed: quotaUsed,
          quotaAvailable: quotaAvailable,
          totalQuota: totalQuota,
          quotaUsedFormatted: formatBytes(quotaUsed),
          quotaAvailableFormatted: formatBytes(quotaAvailable),
          totalQuotaFormatted: formatBytes(totalQuota),
          usagePercentage: totalQuota && quotaUsed ? Math.round((quotaUsed / totalQuota) * 100) : null
        }
      }

    } catch (quotaError) {
      console.log('Quota information not available:', quotaError)
      
      // Return basic connection info if quota is not supported
      return {
        success: true,
        data: {
          quotaUsed: null,
          quotaAvailable: null,
          totalQuota: null,
          quotaUsedFormatted: 'Not available',
          quotaAvailableFormatted: 'Not available',
          totalQuotaFormatted: 'Not available',
          usagePercentage: null,
          message: 'Quota information is not supported by this WebDAV server'
        }
      }
    }

  } catch (error) {
    console.error('Error getting WebDAV quota:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to get WebDAV quota information'
    })
  }
})
