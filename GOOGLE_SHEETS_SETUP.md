# Google Sheets Integration Setup Guide

This guide will help you set up Google Sheets integration for real-time attendance data synchronization.

## Prerequisites

1. Google Cloud Project with Google Sheets API enabled
2. Service account credentials
3. Google Sheet with proper sharing permissions

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google Sheets API:
   - Go to "APIs & Services" > "Library"
   - Search for "Google Sheets API"
   - Click "Enable"

## Step 2: Create Service Account

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "Service Account"
3. Fill in the service account details:
   - Name: "Church Attendance System"
   - Description: "Service account for attendance data synchronization"
4. Click "Create and Continue"
5. Skip the "Grant this service account access to project" step (click "Done")
6. After creation, click on the service account name
7. Go to "Keys" tab
8. Click "Add Key" > "Create new key"
9. Select "JSON" as the key type
10. Click "Create" - this will download a JSON file with your credentials

## Step 3: Create and Share Google Sheet

1. Create a new Google Sheet at [sheets.google.com](https://sheets.google.com)
2. Name it something like "Church Attendance Data"
3. Share the sheet with your service account:
   - Click "Share" button
   - Enter the service account email (found in your JSON credentials file)
   - Give it "Editor" permissions
4. Copy the spreadsheet ID from the URL:
   - URL format: `https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit`
   - The SPREADSHEET_ID is the long string between `/d/` and `/edit`

## Step 4: Configure in Application

1. Open your application and navigate to the Google Sheets settings
2. Enter the following information from your JSON credentials:
   - **Client Email**: The `client_email` field from your JSON file
   - **Private Key**: The entire `private_key` field (including `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`)
   - **Spreadsheet ID**: The ID copied from step 3
3. Enable the integration by toggling the "Enabled" switch
4. Click "Test Connection" to verify everything is working

## Step 5: Install Dependencies

The following dependencies are required for Google Sheets integration:

```bash
pnpm add google-spreadsheet google-auth-library
```

## How It Works

Once configured, the system will automatically:

1. **Create Worksheets**: Automatically creates worksheets for different dates and summary views
2. **Real-time Sync**: Syncs attendance data to Google Sheets when:
   - New attendance records are created
   - Attendance notes are updated
   - Bulk imports are performed
3. **Data Organization**:
   - Detailed sheets: One row per attendance record
   - Summary sheets: One row per member with their status
   - Separate sheets for different Sabbath dates

## API Endpoints

### Configuration
- `GET /api/google-sheets/config` - Get current configuration
- `POST /api/google-sheets/config` - Update configuration

### Sync Operations
- `POST /api/google-sheets/sync` - Manual sync of attendance data
- `POST /api/google-sheets/test` - Test connection and list worksheets

## Troubleshooting

### Common Issues

1. **"Forbidden" Error**
   - Ensure the service account email has "Editor" access to the Google Sheet
   - Verify the spreadsheet ID is correct

2. **"Invalid Credentials" Error**
   - Check that the private key is copied exactly (including line breaks)
   - Verify the client email is correct

3. **"Spreadsheet Not Found" Error**
   - Ensure the spreadsheet ID is correct
   - Check that the sheet is shared with the service account

### Testing

Use the test endpoint to verify your setup:
```javascript
// Test connection
POST /api/google-sheets/test
{
  "action": "connection"
}

// List worksheets
POST /api/google-sheets/test
{
  "action": "worksheets"
}
```

## Security Notes

- Store your service account credentials securely
- The private key should never be exposed in client-side code
- Consider using environment variables for production deployments
- Regularly rotate your service account keys

## Data Structure

The system creates the following worksheets:

### Attendance [Date]
Contains detailed attendance records with columns:
- ID, Member ID, First Name, Last Name, Category
- Sabbath Date, Status, Notes, Is Active
- Created At, Updated At

### Summary [Date]
Contains member summary with columns:
- Member ID, First Name, Last Name, Category
- Status, Notes, Sabbath Date, Is Active

### All Attendance / Summary All
Contains all attendance data regardless of date