// Opens the Drive Organizer app in a new tab when the toolbar icon is clicked
chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({ url: 'index.html' });
});

// --- Background Auto-Scan (Watch Mode) ---
// Fires every 60 minutes when the user has opted in via chrome.storage.local { watchMode: true }

const ALARM_NAME = 'drive-organizer-auto-scan';

// Create the alarm on install / startup
chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create(ALARM_NAME, { periodInMinutes: 60 });
});

chrome.runtime.onStartup.addListener(() => {
  chrome.alarms.create(ALARM_NAME, { periodInMinutes: 60 });
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== ALARM_NAME) return;

  // Only run if watch mode is enabled by the user
  const settings = await chrome.storage.local.get(['watchMode']);
  if (!settings.watchMode) return;

  try {
    // Get a cached token non-interactively (don't prompt if not already authed)
    const token = await new Promise((resolve) => {
      chrome.identity.getAuthToken({ interactive: false }, (t) => {
        if (chrome.runtime.lastError || !t) resolve(null);
        else resolve(t);
      });
    });
    if (!token) return; // User not authenticated, skip

    // Fetch root-level loose files (files added to Drive root, not in folders)
    const params = new URLSearchParams({
      q: "'root' in parents and trashed = false",
      fields: 'files(id,name,mimeType,createdTime)',
      pageSize: '100',
      orderBy: 'createdTime desc'
    });
    const res = await fetch(`https://www.googleapis.com/drive/v3/files?${params}`, {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    if (!res.ok) return;
    const data = await res.json();
    const files = data.files || [];

    // Compare with last-seen snapshot to find truly new files
    const lastScan = await chrome.storage.local.get(['lastScanTime']);
    const since = lastScan.lastScanTime ? new Date(lastScan.lastScanTime) : null;

    const newFiles = since
      ? files.filter(f => new Date(f.createdTime) > since)
      : [];

    // Store timestamp and queue new files for the inbox banner
    await chrome.storage.local.set({
      lastScanTime: new Date().toISOString(),
      ...(newFiles.length > 0 ? { pendingInbox: newFiles } : {})
    });

    // Show a Chrome notification if new files arrived
    if (newFiles.length > 0) {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'favicon.svg',
        title: 'Nexus',
        message: `${newFiles.length} new file${newFiles.length > 1 ? 's' : ''} arrived in your Drive root. Click to triage.`
      });
    }
  } catch (err) {
    console.error('[Drive Organizer] Auto-scan error:', err);
  }
});

// Open app when user clicks a notification
chrome.notifications.onClicked.addListener(() => {
  chrome.tabs.create({ url: 'index.html' });
});
