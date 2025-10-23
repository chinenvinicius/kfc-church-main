import { startExcelWatcher } from '~/server/utils/excelWatcher'

export default defineNitroPlugin((nitroApp) => {
  console.log('🚀 Excel Watcher Plugin: Starting...')
  
  // Start the Excel watcher when the server starts
  startExcelWatcher()
  
  console.log('✅ Excel Watcher Plugin: Started')
})