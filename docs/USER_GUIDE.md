# Nexus Drive Organizer - User Guide

Welcome to Nexus! This extension is designed to help you regain control over your messy Google Drive by identifying large files, tracking down duplicates, and sorting loose files using AI.

## 1. Installation
1. Go to `chrome://extensions` in your Chrome browser.
2. Ensure **Developer mode** (top right) is toggled ON.
3. Click **Load unpacked** and select the folder containing the Nexus compiled code (the `dist/` directory if you built it from source).
4. Pin the extension to your toolbar for easy access.

## 2. Initial Setup
The first time you open Nexus, you will need to grant it permission to interact with your Google Drive. 
- Click on any action (e.g., "Open File Manager" or "Scan My Drive").
- A Google popup will appear asking you to authenticate. 
- Select your account and click **Allow** when it requests access to your Google Drive files.

*(Note: If the app is still in "Testing" mode on the Google Cloud Console, you may see an "Unverified App" warning. You will need to click **Advanced** -> **Go to Nexus (unsafe)** to bypass it).*

## 3. Features

### File Manager & Smart Inbox
- **All Files**: Browse your entire Google Drive hierarchy directly from the extension.
- **Inbox (Unprocessed)**: Find all the loose files floating in your root drive (outside of folders). These are the prime targets for organization.
- **Manual Triage**: Select files and use the "File Manager" button to manually move them into destination folders.
- **AI Auto-Pilot**: When using AI mode, the extension will analyze the content and names of your loose files and automatically sort them into intelligent categories.

### Storage Health
Is your Google Drive almost full? This tool scans your entire drive to find out why.
- **Large Files**: Quickly identify the biggest files taking up space.
- **Old Files**: Find files you haven't touched in years.
- **Duplicates**: The scanner looks for identical files. You can click **Remove duplicate** to trash copies while keeping the original.

## 4. Bring Your Own Key (BYOK) for AI
Nexus uses Google's Gemini AI to power the "AI Auto-Pilot" sorting feature. To use this, you must provide your own API key.
1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey) and create a free API Key.
2. In the Nexus extension, go to the **File Manager** tab.
3. Toggle the mode on the right side to **AI Auto-Pilot**.
4. The system will prompt you to enter your Gemini API Key.
5. Paste it in and click **Save**. 

*(Your key is stored locally in your browser's secure `chrome.storage.local` and is never sent to any external servers other than directly to Google's AI API).*
