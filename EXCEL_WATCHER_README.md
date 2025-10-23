# Excel File Watcher System

This system automatically monitors Excel files for changes and updates the JSON database in real-time, with immediate frontend updates.

## Features

- **Automatic File Monitoring**: Watches Excel directory for file changes
- **Real-time Updates**: Updates JSON database when Excel files change
- **Frontend Notifications**: Immediate updates in the browser without refresh
- **Configurable Settings**: Adjustable watch intervals and directories
- **Manual Control**: Enable/disable watcher and trigger manual checks
- **Error Handling**: Robust error handling with detailed logging

## How It Works

1. **File Watching**: The system monitors the `/server/excel` directory for changes
2. **Change Detection**: Detects file modifications by size and timestamp
3. **Auto Import**: Automatically imports changed Excel files
4. **JSON Update**: Updates the attendance JSON file with new data
5. **Real-time Notification**: Notifies frontend clients of updates
6. **Frontend Refresh**: Automatically refreshes data in open browser tabs

## Setup and Configuration

### 1. Access the Excel Watcher Interface

Navigate to `/excel-watcher` in your browser to access the management interface.

### 2. Configure the Watcher

- **Enable Watcher**: Turn on the file monitoring system
- **Auto-Import**: Enable automatic importing of changed files
- **Check Interval**: Set how often to check for changes (minimum 10 seconds)
- **Watch Directory**: Specify the directory to monitor (default: `/server/excel`)

### 3. Manual Operations

- **Check for Changes Now**: Manually trigger a file check
- **Import Individual Files**: Import specific Excel files on demand
- **View Recent Updates**: See history of recent imports and changes

## API Endpoints

### Configuration
- `GET /api/excel-watcher/config` - Get current configuration
- `POST /api/excel-watcher/config` - Update configuration

### Operations
- `POST /api/excel-watcher/check` - Trigger manual file check
- `GET /api/excel/files` - Get list of Excel files
- `POST /api/excel/import` - Import specific Excel file

### Updates
- `GET /api/updates/notifications` - Get real-time update notifications

### Testing
- `POST /api/test/excel-watcher` - Test endpoint with various actions

## File Structure

```
server/
├── utils/
│   └── excelWatcher.ts          # Core watcher functionality
├── plugins/
│   └── excel-watcher.ts         # Server startup plugin
├── api/
│   ├── excel-watcher/
│   │   ├── config.get.ts        # Get configuration
│   │   ├── config.post.ts       # Update configuration
│   │   └── check.post.ts        # Manual check
│   ├── updates/
│   │   └── notifications.get.ts # Update notifications
│   └── test/
│       └── excel-watcher.post.ts # Test endpoint
└── data/
    ├── excel-watcher-config.json # Watcher configuration
    └── last-update-notification.json # Latest update notification
```

## Excel File Format

The watcher expects Excel files with the following columns:

- **Member ID** (required): Numeric member ID
- **Sabbath Date** (required): Date in YYYY-MM-DD format
- **Status** (required): "present", "absent", or "other"
- **Notes** (optional): Additional notes

Example:
| Member ID | Sabbath Date | Status | Notes |
|-----------|--------------|--------|-------|
| 1         | 2025-10-22   | present | On time |
| 2         | 2025-10-22   | absent  | Sick |

## Real-time Updates

The system uses a polling mechanism for real-time updates:

1. **Server Side**: When Excel files are imported, a notification is saved
2. **Client Side**: Frontend polls for updates every 5 seconds
3. **Auto Refresh**: When updates are detected, the attendance data refreshes automatically

## Testing

Run the test script to verify the system:

```bash
node test-excel-watcher.js
```

This will test:
- Configuration management
- File detection
- Manual checks
- Update notifications
- Data retrieval

## Troubleshooting

### Common Issues

1. **Watcher not starting**
   - Check server logs for startup messages
   - Verify configuration is saved correctly
   - Ensure directory permissions are correct

2. **Files not being detected**
   - Verify files are in the correct directory
   - Check file extensions (.xlsx, .xls)
   - Ensure files have proper permissions

3. **Import failures**
   - Check Excel file format matches expected columns
   - Verify member IDs exist in the system
   - Check server logs for detailed error messages

4. **Frontend not updating**
   - Check browser console for JavaScript errors
   - Verify polling is active (check network requests)
   - Ensure notifications are being generated

### Logging

The system provides detailed logging:
- Watcher startup and configuration
- File change detection
- Import results and errors
- Update notifications

Check the server console for real-time logging information.

## Performance Considerations

- **Check Interval**: Minimum 10 seconds to avoid excessive file system access
- **File Size**: Large Excel files may take longer to process
- **Concurrent Users**: Polling mechanism scales well with multiple users
- **Memory Usage**: File states are cached to minimize disk access

## Security

- File access is restricted to configured directory
- Import validation prevents malicious data
- Configuration changes require proper authentication
- Error messages don't expose sensitive system information

## Future Enhancements

- WebSocket support for true real-time updates
- File filtering by name pattern
- Bulk import operations
- Import history and rollback
- Email notifications for failed imports
- Integration with cloud storage services