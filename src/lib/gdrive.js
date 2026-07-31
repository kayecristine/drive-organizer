// Helper for Google Drive integration
// Uses chrome.identity.getAuthToken for native Chrome Extension OAuth.
// No external scripts required.

let accessToken = null;

// No-op: chrome.identity handles initialization natively.
export function initGoogleDrive() {}

export async function ensureDriveToken() {
  if (accessToken) return accessToken;

  return new Promise((resolve, reject) => {
    chrome.identity.getAuthToken({ interactive: true }, (token) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      accessToken = token;
      resolve(token);
    });
  });
}

export async function uploadToDrive(file, metadata) {
  if (!accessToken) {
    throw new Error("No Drive token available. Please authenticate first.");
  }

  return new Promise((resolve, reject) => {
    const doUpload = async (token) => {
      try {
        const driveMetadata = {
          name: file.name,
          mimeType: file.type,
          description: `Category: ${metadata.category}, Tags: ${metadata.tags?.join(', ')}`
        };
        
        // Step 1: Create the file metadata to get the File ID
        const metaRes = await fetch('https://www.googleapis.com/drive/v3/files?fields=id,webViewLink', {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(driveMetadata)
        });
        
        if (!metaRes.ok) {
           throw new Error('Drive Metadata creation failed: ' + metaRes.statusText);
        }
        
        const fileInfo = await metaRes.json();
        
        // Step 2: Upload the actual file contents (media)
        const mediaRes = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileInfo.id}?uploadType=media`, {
          method: 'PATCH',
          headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': file.type
          },
          body: file
        });
        
        if (!mediaRes.ok) {
           throw new Error('Drive File upload failed: ' + mediaRes.statusText);
        }
        
        resolve(fileInfo);
      } catch (e) {
        reject(e);
      }
    };

    doUpload(accessToken);
  });
}

// Drive Organizer Functions

export async function getLooseFiles() {
  await ensureDriveToken();
  const query = encodeURIComponent("'root' in parents and trashed = false");
  const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,mimeType,thumbnailLink,webViewLink)&pageSize=1000`, {
    headers: { 'Authorization': 'Bearer ' + accessToken }
  });
  
  if (!res.ok) throw new Error('Failed to fetch files: ' + res.statusText);
  const data = await res.json();
  return data.files || [];
}

export async function createFolder(folderName) {
  await ensureDriveToken();
  const metadata = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder'
  };
  
  const res = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + accessToken,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(metadata)
  });
  
  if (!res.ok) throw new Error('Failed to create folder: ' + res.statusText);
  return await res.json(); // returns { id, name, etc }
}

export async function moveFile(fileId, targetFolderId) {
  await ensureDriveToken();
  const fileRes = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?fields=parents&supportsAllDrives=true`, {
    headers: { 'Authorization': 'Bearer ' + accessToken }
  });
  const fileData = await fileRes.json();
  const previousParents = fileData.parents ? fileData.parents.join(',') : '';
  
  let url = `https://www.googleapis.com/drive/v3/files/${fileId}?addParents=${targetFolderId}&supportsAllDrives=true`;
  if (previousParents) {
    url += `&removeParents=${previousParents}`;
  }
  
  const res = await fetch(url, {
    method: 'PATCH',
    headers: { 
      'Authorization': 'Bearer ' + accessToken,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({})
  });
  
  if (!res.ok) throw new Error('Failed to move file: ' + res.statusText);
  return await res.json();
}

export async function renameFile(fileId, newName) {
  await ensureDriveToken();
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?supportsAllDrives=true`, {
    method: 'PATCH',
    headers: {
      'Authorization': 'Bearer ' + accessToken,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ name: newName })
  });
  
  if (!res.ok) throw new Error('Failed to rename file: ' + res.statusText);
  return await res.json();
}

export async function listFolders() {
  await ensureDriveToken();
  const query = encodeURIComponent("'root' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false");
  const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name)&pageSize=1000`, {
    headers: { 'Authorization': 'Bearer ' + accessToken }
  });
  
  if (!res.ok) throw new Error('Failed to fetch folders: ' + res.statusText);
  const data = await res.json();
  return data.files || [];
}

export async function getFilesInFolder(folderId) {
  await ensureDriveToken();
  const query = encodeURIComponent(`'${folderId}' in parents and trashed = false`);
  const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,mimeType,thumbnailLink,webViewLink)&pageSize=1000`, {
    headers: { 'Authorization': 'Bearer ' + accessToken }
  });
  
  if (!res.ok) throw new Error('Failed to fetch folder contents: ' + res.statusText);
  const data = await res.json();
  return data.files || [];
}

export async function getSubfolders(parentFolderId) {
  await ensureDriveToken();
  const query = encodeURIComponent(`'${parentFolderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`);
  const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name)&pageSize=1000`, {
    headers: { 'Authorization': 'Bearer ' + accessToken }
  });
  
  if (!res.ok) throw new Error('Failed to fetch subfolders: ' + res.statusText);
  const data = await res.json();
  return data.files || [];
}

export async function trashFile(fileId) {
  await ensureDriveToken();
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': 'Bearer ' + accessToken,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ trashed: true })
  });
  
  if (!res.ok) throw new Error('Failed to trash file: ' + res.statusText);
  return await res.json();
}

export async function searchDrive(searchQuery) {
  await ensureDriveToken();
  const query = encodeURIComponent(`name contains '${searchQuery}' and trashed = false`);
  const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,mimeType,thumbnailLink,webViewLink)&pageSize=1000`, {
    headers: { 'Authorization': 'Bearer ' + accessToken }
  });
  
  if (!res.ok) throw new Error('Failed to search drive: ' + res.statusText);
  const data = await res.json();
  return data.files || [];
}

// Storage Quota: fetch storage consumed and total limit
export async function getStorageQuota() {
  await ensureDriveToken();
  const res = await fetch('https://www.googleapis.com/drive/v3/about?fields=storageQuota', {
    headers: { 'Authorization': 'Bearer ' + accessToken }
  });
  if (!res.ok) throw new Error('Failed to fetch storage quota: ' + res.statusText);
  const data = await res.json();
  return data.storageQuota; // returns { limit, usage, usageInDrive, usageInDriveTrash }
}

// Storage Health: fetch all non-trashed files with metadata for analytics
export async function getStorageStats() {
  await ensureDriveToken();
  let allFiles = [];
  let pageToken = null;

  do {
    const params = new URLSearchParams({
      q: 'trashed = false',
      fields: 'nextPageToken,files(id,name,mimeType,size,createdTime,modifiedTime,md5Checksum,webViewLink,thumbnailLink,parents)',
      pageSize: '1000',
      ...(pageToken ? { pageToken } : {})
    });
    const res = await fetch(`https://www.googleapis.com/drive/v3/files?${params}`, {
      headers: { 'Authorization': 'Bearer ' + accessToken }
    });
    if (!res.ok) throw new Error('Failed to fetch storage stats: ' + res.statusText);
    const data = await res.json();
    allFiles = allFiles.concat(data.files || []);
    pageToken = data.nextPageToken;
  } while (pageToken);

  return allFiles;
}

// AI content scanning: export a Google Doc/Sheet/Slide as plain text for AI analysis
export async function getFileContentSnippet(fileId, mimeType) {
  await ensureDriveToken();

  // Only Google Workspace formats support the export endpoint
  const exportMimeMap = {
    'application/vnd.google-apps.document': 'text/plain',
    'application/vnd.google-apps.spreadsheet': 'text/csv',
    'application/vnd.google-apps.presentation': 'text/plain',
  };
  const exportMime = exportMimeMap[mimeType];
  if (!exportMime) return null; // Binary files (images, videos) can't be read

  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=${encodeURIComponent(exportMime)}`,
    { headers: { 'Authorization': 'Bearer ' + accessToken } }
  );
  if (!res.ok) return null;
  const text = await res.text();
  // Return first 500 characters as a snippet — enough for AI context, not wasteful
  return text.slice(0, 500).trim() || null;
}
