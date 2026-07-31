# Data Models & Schemas

## Google Drive File Schema
The primary data entity handled by the application is the Google Drive File object (v3).

### File Object
```typescript
interface DriveFile {
  id: string;             // Unique identifier for the file/folder
  name: string;           // Display name
  mimeType: string;       // MIME type (e.g., 'application/vnd.google-apps.folder')
  thumbnailLink?: string; // Optional thumbnail URL
  webViewLink?: string;   // Optional Google Drive web view URL
}
```

## Mock Local Services
To support the standalone execution without the full productivity suite, several schemas are mocked locally:

### File Metadata Schema (`src/lib/fileMeta.js`)
```typescript
interface FileMeta {
  isProcessed: boolean;
  projectId: string | null;
  taskId: string | null;
  tags: string[];
}
```

### AI Proposal Schema (`src/lib/ai.js`)
```typescript
interface AIProposal {
  folderName: string;
  fileIds: string[]; // List of Drive File IDs suggested for this folder
}
```
