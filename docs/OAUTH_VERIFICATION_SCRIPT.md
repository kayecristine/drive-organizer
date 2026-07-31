# Google OAuth Verification - Video Script

*This document outlines the exact step-by-step script and recording instructions required to submit your Google OAuth Consent Screen for verification by the Google Trust & Safety Team.*

---

## 🎥 Recording Checklist
Before you hit record, ensure the following are visible on your screen:
- Your entire browser window (including the URL bar, do not crop it!).
- The Nexus Drive Organizer Extension loaded in Chrome.
- You must show the **Client ID** in the URL during the OAuth process.

---

## 📝 The Video Script / Flow

**1. Introduce the App & Purpose**
> *"Hello Google Trust & Safety Team. My name is [Your Name] and I am demonstrating the OAuth flow and functionality for my Chrome Extension, Nexus Drive Organizer. This app helps users declutter their Drive using AI categorization, storage analytics, and bulk organization tools."*

**2. Demonstrate How the User Logs In**
- Click on the Nexus extension icon to open the app.
- Click the **"Scan My Drive"** or **"AI Auto-Pilot"** button to trigger the Google Login pop-up.

**3. Show the Client ID (CRITICAL STEP)**
- When the Google Sign-in pop-up appears, **pause and highlight the URL bar**.
- Scroll through the URL so the reviewer can clearly see your `client_id=...` parameter.
> *"As you can see in the URL bar, the Client ID perfectly matches the Client ID registered in my Google Cloud Console."*

**4. Show the Consent Screen & Justify the Scopes**
- Proceed to select your Google Account.
- When the permissions screen appears, highlight the exact scope requested (Google Drive).
> *"The app requests the restricted `https://www.googleapis.com/auth/drive` scope. We absolutely require this full scope because the core functionality of the app is to allow users to fully manage their Drive—this includes reading file metadata to find duplicates, organizing loose files into specific folders, and physically moving unneeded files to the trash."*

**5. Demonstrate Feature 1: Storage Health & Duplicates (Read & Trash)**
- Click **"Allow"** to finish the login.
- Navigate to the **Storage Health** tab. Let the scan run.
> *"Here, the app is reading the user's Drive data to display storage quotas and calculate byte-for-byte duplicates using MD5 checksums. I will now click 'Remove Duplicate', which requires write access to move the redundant file to the user's Trash."*
- *Action: Click a trash button on a duplicate file.*

**6. Demonstrate Feature 2: Manual Triage (Move)**
- Navigate to the **File Manager** tab.
> *"This is the Manual Triage feature. It reads the user's loose files in their root directory and their existing folder structure. By dragging and dropping a file here, the app updates the file's 'parents' metadata to move it into a new folder."*
- *Action: Drag and drop a file into a folder to show it works.*

**7. Demonstrate Feature 3: AI Auto-Pilot (Read)**
- Click the **"AI Auto-Pilot"** button.
> *"Finally, the AI Auto-Pilot reads the file names and MIME types, then automatically groups them into logical folders, drastically reducing the time it takes to organize a messy Drive."*

**8. Conclusion**
> *"Because all these core features require reading metadata, moving files between folders, and trashing files, the full Google Drive scope is essential for Nexus Drive Organizer to function. Thank you for your time reviewing our application."*

---

## 📤 Submission Steps
1. Upload the video to YouTube as **Unlisted**.
2. Go to your Google Cloud Console > APIs & Services > OAuth consent screen.
3. Paste the YouTube link into the "YouTube video link" field in your verification submission.
4. Submit for review!
