# Deployment Guide & Runbook

This guide covers how to build, load, and troubleshoot the Nexus Drive Organizer Chrome Extension.

## Prerequisites
- Node.js & npm installed.
- Google Cloud Console project with a **Chrome App** OAuth Client ID (not a Web Client).
  - In GCP → APIs & Services → Credentials → Create Credentials → OAuth Client ID → Chrome App.
  - Set the App ID to your extension's ID (found in `chrome://extensions` after loading unpacked).

## Environment Variables
Create a `.env.local` file in the project root:
```env
VITE_GOOGLE_CLIENT_ID=your-chrome-app-oauth-client-id
```
Also update `public/manifest.json` — replace `__VITE_GOOGLE_CLIENT_ID__` in the `oauth2.client_id` field with your actual Client ID.

**Warning**: Never commit `.env.local` to version control.

## Deployment Instructions (Chrome Extension)

### 1. Install Dependencies
```bash
npm install
```

### 2. Build the Extension
```bash
npm run build
```
This outputs a production bundle to the `dist/` directory, including `manifest.json`.

### 3. Load into Chrome
1. Open `chrome://extensions` in Chrome.
2. Enable **Developer Mode** (top-right toggle).
3. Click **Load unpacked**.
4. Select the `dist/` directory.

The extension will now appear in your extensions list and override the New Tab page.

### 4. Updating the Extension
After making code changes, run `npm run build` again, then click the **🔄 refresh** icon on the extension card in `chrome://extensions`.

## Pre-Deployment Checklist
- `npm run lint` passes without errors.
- `npm run build` succeeds and `dist/manifest.json` is present.
- Extension loads in Chrome without Manifest errors (check `chrome://extensions` for error badges).

## Runbook / Troubleshooting

### 1. Authentication Fails / `chrome.identity` Error
- **Cause**: The OAuth Client ID in `manifest.json` is a Web Client ID, not a Chrome App Client ID.
- **Fix**: Create a separate **Chrome App** OAuth credential in GCP. The extension ID in the GCP form must match the ID shown in `chrome://extensions`.

### 2. `chrome is not defined` During `npm run dev`
- **Cause**: The `chrome.*` APIs only exist inside a loaded extension context, not in the Vite dev server.
- **Fix**: For local development, build with `npm run build` and load unpacked. The dev server (`npm run dev`) won't have Drive access but is useful for iterating on UI layout.

### 3. Extension Shows Blank Page After Build
- **Cause**: Asset paths in `index.html` are absolute (`/assets/...`) instead of relative.
- **Fix**: Ensure `vite.config.js` has `base: './'`. Rebuild.

### 4. "Cannot read properties of undefined (reading 'getAuthToken')"
- **Cause**: Calling `ensureDriveToken()` outside of the extension context (e.g., in the Vite dev server).
- **Fix**: Same as issue #2 above — test Drive functionality via the loaded unpacked extension only.

## Publishing to the Public (Important)

If you decide to publish this extension to the Chrome Web Store for the general public, you **must** complete the Google OAuth Verification Process so users don't see the "Google hasn't verified this app" warning.

### Vercel Landing Page Deployment
Google Trust & Safety bots require a public-facing HTML landing page that clearly explains the app's purpose, the requested scopes, and a privacy policy. Because bots cannot parse React single-page applications, we deploy a hybrid architecture via Vercel:
- The React application is built via `npm run build` and runs inside the Chrome Extension.
- A purely static HTML site (`public/about.html` and `public/privacy.html`) is deployed to Vercel (e.g., `https://nexus-drive-organizer.vercel.app`).

### Verification Checklist:
1. **Deploy to Vercel**: Connect your GitHub repository to Vercel. Ensure `public/about.html` and `public/privacy.html` are accessible.
2. **Google Search Console**: Verify ownership of the URL prefix `https://nexus-drive-organizer.vercel.app/about.html` using the HTML meta tag method (inject the tag into the `<head>` of `public/about.html` and `index.html`).
3. **Google Cloud Console - Branding**:
   - Application home page: `https://nexus-drive-organizer.vercel.app/about.html`
   - Privacy Policy link: `https://nexus-drive-organizer.vercel.app/privacy.html`
4. **Google Cloud Console - Data Access**:
   - Add the restricted scope `https://www.googleapis.com/auth/drive`.
   - Provide a justification explaining the core features (File Triage, AI Auto-Pilot, Duplicate Scanner).
   - Link an unlisted YouTube video demonstrating the OAuth flow and scope usage.
5. **Submit for Verification**: If the automated bot fails due to the Vercel domain structure, click "I believe the issues found are incorrect" and request a manual review by pointing them to the `/about.html` page and the Search Console verification.
