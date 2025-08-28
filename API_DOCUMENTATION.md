# KFC Church Attendance System - API Documentation

## Overview
This document provides comprehensive documentation for the KFC Church Attendance System API endpoints.

**Base URL:** `http://localhost:3000/api`

---

## Members API

### Get All Members
**GET** `/members`

Retrieves all church members.

**Query Parameters:**
- `includeInactive` (boolean, optional): Include inactive members. Default: false

**Response:**
```json
[
  {
    "id": 1,
    "firstName": "John",
    "lastName": "Doe",
    "category": "adult",
    "registrationDate": "2025-01-01",
    "isActive": true,
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z"
  }
]
```

### Create Member
**POST** `/members`

Creates a new church member.

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "category": "adult"
}
```

**Response:**
```json
{
  "id": 1,
  "firstName": "John",
  "lastName": "Doe",
  "category": "adult",
  "registrationDate": "2025-01-01",
  "isActive": true,
  "createdAt": "2025-01-01T00:00:00.000Z",
  "updatedAt": "2025-01-01T00:00:00.000Z"
}
```

### Update Member
**PUT** `/members/{id}`

Updates an existing member.

**Path Parameters:**
- `id` (integer): Member ID

**Request Body:**
```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "category": "adult",
  "isActive": true
}
```

### Delete Member
**DELETE** `/members/{id}`

Deletes a member.

**Path Parameters:**
- `id` (integer): Member ID

**Response:**
```json
{
  "message": "Member deleted successfully"
}
```

---

## Attendance API

### Get Attendance Records
**GET** `/attendance`

Retrieves attendance records.

**Query Parameters:**
- `sabbathDate` (string, optional): Filter by specific date (YYYY-MM-DD format)
- `memberId` (integer, optional): Filter by specific member

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "memberId": 1,
      "sabbathDate": "2025-06-21",
      "status": "present",
      "notes": "On time",
      "createdAt": "2025-06-21T00:00:00.000Z",
      "updatedAt": "2025-06-21T00:00:00.000Z"
    }
  ]
}
```

### Create/Update Attendance
**POST** `/attendance`

Creates or updates an attendance record.

**Request Body:**
```json
{
  "memberId": 1,
  "sabbathDate": "2025-06-21",
  "status": "present",
  "notes": "On time"
}
```

**Status Values:**
- `present`: Member was present
- `absent`: Member was absent
- `other`: Other status (late, excused, etc.)

### Delete Attendance Record
**DELETE** `/attendance/{id}`

Deletes an attendance record.

**Path Parameters:**
- `id` (integer): Attendance record ID

### Get Attendance Statistics
**GET** `/attendance/stats`

Retrieves attendance statistics.

**Query Parameters:**
- `startDate` (string, optional): Start date for statistics
- `endDate` (string, optional): End date for statistics

**Response:**
```json
{
  "totalSabbaths": 10,
  "averageAttendance": 85.5,
  "memberStats": [
    {
      "memberId": 1,
      "memberName": "John Doe",
      "attendanceRate": 90.0,
      "presentCount": 9,
      "absentCount": 1
    }
  ]
}
```

---

## Visitors API

### Get Visitors
**GET** `/visitors`

Retrieves visitor records.

**Query Parameters:**
- `sabbathDate` (string, optional): Filter by specific date (YYYY-MM-DD format)

**Response:**
```json
[
  {
    "id": "uuid-string",
    "visitorName": "Jane Visitor",
    "sabbathDate": "2025-06-21",
    "notes": "First time visitor",
    "createdAt": "2025-06-21T00:00:00.000Z",
    "updatedAt": "2025-06-21T00:00:00.000Z"
  }
]
```

### Create Visitor
**POST** `/visitors`

Creates a new visitor record.

**Request Body:**
```json
{
  "visitorName": "Jane Visitor",
  "sabbathDate": "2025-06-21",
  "notes": "First time visitor"
}
```

### Update Visitor
**PUT** `/visitors/{id}`

Updates an existing visitor.

**Path Parameters:**
- `id` (string): Visitor UUID

**Request Body:**
```json
{
  "visitorName": "Jane Updated",
  "notes": "Updated notes"
}
```

### Delete Visitor
**DELETE** `/visitors/{id}`

Deletes a visitor record.

**Path Parameters:**
- `id` (string): Visitor UUID

---

---

## File Management API

### Get Files
**GET** `/files`

Retrieves uploaded files list.

### Upload File
**POST** `/files`

Uploads a new file.

**Request:** Multipart form data with file

### Delete File
**DELETE** `/files/{id}`

Deletes an uploaded file.

---

## Excel/Export API

### Export to Excel
**POST** `/excel/export`

Exports data to Excel format.

**Request Body:**
```json
{
  "type": "attendance",
  "startDate": "2025-01-01",
  "endDate": "2025-12-31"
}
```

### Import from Excel
**POST** `/excel/import`

Imports data from Excel file.

### Get Excel Files
**GET** `/excel/files`

Lists available Excel export files.

### Download Excel File
**GET** `/excel/download/{filename}`

Downloads an Excel file.

---

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "statusCode": 400,
  "statusMessage": "Invalid request parameters"
}
```

### 403 Forbidden
```json
{
  "statusCode": 403,
  "statusMessage": "Insufficient permissions"
}
```

### 404 Not Found
```json
{
  "statusCode": 404,
  "statusMessage": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "statusCode": 500,
  "statusMessage": "Internal server error"
}
```

---

## Rate Limiting
API requests are not currently rate limited, but this may be implemented in future versions.

## Versioning
Current API version: v1
All endpoints are prefixed with `/api/`

---

## Background Settings API

### Get Active Background
**GET** `/background/active`

Gets the currently active background image.

**Response:**
```json
{
  "id": 1,
  "filename": "background.jpg",
  "originalName": "church-background.jpg",
  "isActive": true,
  "uploadedAt": "2025-06-21T00:00:00.000Z"
}
```

### Upload Background
**POST** `/background/upload`

Uploads a new background image.

**Request:** Multipart form data with image file

### Set Active Background
**POST** `/background/set-active`

Sets a background as active.

**Request Body:**
```json
{
  "backgroundId": 1
}
```

### List Backgrounds
**GET** `/background/list`

Lists all uploaded background images.

### Delete Background
**POST** `/background/delete`

Deletes a background image.

---

## WebDAV API

### Get WebDAV Configuration
**GET** `/webdav/config`

Gets WebDAV server configuration.

### Update WebDAV Configuration
**POST** `/webdav/config`

Updates WebDAV server settings.

**Request Body:**
```json
{
  "serverUrl": "https://example.com/dav/",
  "username": "user",
  "password": "pass"
}
```

### Test WebDAV Connection
**POST** `/webdav/test`

Tests WebDAV server connection.

### Get WebDAV Quota
**GET** `/webdav/quota`

Gets WebDAV storage quota information.

---

## Import/Export API

### Export to CSV
**POST** `/export/csv`

Exports data to CSV format.

**Request Body:**
```json
{
  "type": "members",
  "includeInactive": false
}
```

### Import Attendance
**POST** `/import/attendance`

Imports attendance data from file.

**Request:** Multipart form data with CSV/Excel file

---

## Data Sync API

### Sync Attendance Data
**POST** `/attendance/sync`

Synchronizes attendance data between local and remote storage.

**Request Body:**
```json
{
  "forceSync": false,
  "direction": "bidirectional"
}
```

**Response:**
```json
{
  "success": true,
  "syncedRecords": 150,
  "conflicts": 0,
  "lastSyncTime": "2025-06-21T00:00:00.000Z"
}
```

---

## Common Response Patterns

### Success Response
```json
{
  "success": true,
  "data": {},
  "message": "Operation completed successfully"
}
```

### Pagination Response
```json
{
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 200,
    "totalPages": 4
  }
}
```

### Validation Error Response
```json
{
  "statusCode": 422,
  "statusMessage": "Validation failed",
  "errors": [
    {
      "field": "firstName",
      "message": "First name is required"
    }
  ]
}
```

---

## API Usage Examples

### JavaScript/Fetch Examples

#### Get Members
```javascript
const response = await fetch('/api/members');
const members = await response.json();
```

#### Create Attendance Record
```javascript
const response = await fetch('/api/attendance', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    memberId: 1,
    sabbathDate: '2025-06-21',
    status: 'present',
    notes: 'On time'
  })
});
```

#### Upload File
```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);

const response = await fetch('/api/files', {
  method: 'POST',
  body: formData
});
```

### cURL Examples

#### Get Visitors for Date
```bash
curl -X GET "http://localhost:3000/api/visitors?sabbathDate=2025-06-21"
```

#### Create New Member
```bash
curl -X POST "http://localhost:3000/api/members" \
  -H "Content-Type: application/json" \
  -d '{"firstName":"John","lastName":"Doe","category":"adult"}'
```

#### Delete Attendance Record
```bash
curl -X DELETE "http://localhost:3000/api/attendance/123"
```

---

## Data Models

### Member Model
```typescript
interface Member {
  id: number;
  firstName: string;
  lastName: string;
  category: 'adult' | 'child';
  registrationDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
```

### Attendance Model
```typescript
interface Attendance {
  id: number;
  memberId: number;
  sabbathDate: string;
  status: 'present' | 'absent' | 'other';
  notes: string;
  createdAt: string;
  updatedAt: string;
}
```

### Visitor Model
```typescript
interface Visitor {
  id: string; // UUID
  visitorName: string;
  sabbathDate: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}
```

---

## Support
For API support, please contact the development team.

## Changelog

### Version 1.0.0 (Current)
- Initial API implementation
- Member management endpoints
- Attendance tracking endpoints
- Visitor management endpoints
---
- File upload/download
- Excel import/export
- Background image management
- WebDAV integration
