// AI-powered Drive organization
// Architecture:
//   - Free tier (3 scans): proxied through a serverless Edge Function (set FREE_TIER_ENDPOINT env var).
//   - BYOK: user's own OpenAI key, stored in chrome.storage.local. Direct call to OpenAI.
//
// To enable the free tier proxy, deploy a Cloudflare Worker or Vercel Edge Function
// that accepts { files } and returns { proposals }, keeping the API key server-side.
// Then set: VITE_FREE_TIER_ENDPOINT=https://your-worker.workers.dev/api/suggest

const FREE_TIER_ENDPOINT = import.meta.env.VITE_FREE_TIER_ENDPOINT || null;
const FREE_SCAN_LIMIT = 3;
const STORAGE_KEY_SCAN_COUNT = 'ai_scan_count';
const STORAGE_KEY_BYOK = 'openai_api_key';

// --- Scan count helpers (persisted in chrome.storage.local) ---

async function getScanCount() {
  return new Promise(resolve => {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.get([STORAGE_KEY_SCAN_COUNT], result => {
        resolve(result[STORAGE_KEY_SCAN_COUNT] || 0);
      });
    } else {
      resolve(parseInt(localStorage.getItem(STORAGE_KEY_SCAN_COUNT) || '0', 10));
    }
  });
}

async function incrementScanCount() {
  const count = await getScanCount();
  const next = count + 1;
  return new Promise(resolve => {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.set({ [STORAGE_KEY_SCAN_COUNT]: next }, () => resolve(next));
    } else {
      localStorage.setItem(STORAGE_KEY_SCAN_COUNT, String(next));
      resolve(next);
    }
  });
}

export async function getSavedApiKey() {
  return new Promise(resolve => {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.get([STORAGE_KEY_BYOK], result => {
        resolve(result[STORAGE_KEY_BYOK] || null);
      });
    } else {
      resolve(localStorage.getItem(STORAGE_KEY_BYOK));
    }
  });
}

export async function saveApiKey(key) {
  return new Promise(resolve => {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.set({ [STORAGE_KEY_BYOK]: key }, resolve);
    } else {
      localStorage.setItem(STORAGE_KEY_BYOK, key);
      resolve();
    }
  });
}

export async function clearApiKey() {
  return new Promise(resolve => {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.remove([STORAGE_KEY_BYOK], resolve);
    } else {
      localStorage.removeItem(STORAGE_KEY_BYOK);
      resolve();
    }
  });
}

export async function getRemainingFreeScans() {
  if (!FREE_TIER_ENDPOINT) return 0; // No proxy configured
  const count = await getScanCount();
  return Math.max(0, FREE_SCAN_LIMIT - count);
}

// --- Core AI suggestion function ---

function buildPrompt(files) {
  const fileList = files.map(f => {
    let line = `- "${f.name}" (${f.mimeType})`;
    if (f.contentSnippet) line += `\n  Content preview: ${f.contentSnippet}`;
    return line;
  }).join('\n');

  return `You are a Google Drive organization assistant. Group the following files into logical folder categories based on their names and content previews. Return a JSON array where each item has "folderName" (string) and "fileIds" (array of strings). Use 3-8 meaningful category names. Only return valid JSON, no explanation.

Files:
${fileList}

File IDs for reference: ${files.map(f => `"${f.id}": "${f.name}"`).join(', ')}`;
}

async function callOpenAI(apiKey, files) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: buildPrompt(files) }],
      temperature: 0.3,
      max_tokens: 1000
    })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `OpenAI error ${res.status}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content || '[]';
  // Strip markdown code fences if present
  const clean = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(clean);
}

async function callFreeTierProxy(files) {
  const res = await fetch(FREE_TIER_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ files: files.map(f => ({ id: f.id, name: f.name, mimeType: f.mimeType, contentSnippet: f.contentSnippet })) })
  });

  if (!res.ok) throw new Error(`Proxy error ${res.status}`);
  const data = await res.json();
  return data.proposals || [];
}

// Main export used by DriveOrganizer.jsx
// Returns: { proposals, usedFreeTier, remainingFreeScans }
export async function suggestFolderCategory(files) {
  if (!files || files.length === 0) return [];

  const scanCount = await getScanCount();
  const byok = await getSavedApiKey();

  // Try free tier first (if proxy is configured and quota remaining)
  if (FREE_TIER_ENDPOINT && scanCount < FREE_SCAN_LIMIT) {
    try {
      const proposals = await callFreeTierProxy(files);
      await incrementScanCount();
      return proposals;
    } catch {
      // Fall through to BYOK if proxy fails
    }
  }

  // Require BYOK
  if (!byok) {
    // Signal to UI that a key is needed
    throw new Error('BYOK_REQUIRED');
  }

  const proposals = await callOpenAI(byok, files);
  await incrementScanCount();
  return proposals;
}
