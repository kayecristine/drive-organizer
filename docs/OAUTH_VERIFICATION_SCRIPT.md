# Google OAuth Verification - Video Script

*This document outlines a professional, confident script to demonstrate the value of Nexus Drive Organizer to the Google Trust & Safety Team, while clearly hitting all compliance requirements.*

---

## 🎥 Recording Checklist
Before you hit record, ensure the following are visible on your screen:
- Your entire browser window (including the URL bar, do not crop it!).
- The Nexus Drive Organizer Extension loaded in Chrome.
- You must show the **Client ID** in the URL during the OAuth process.

---

## 📝 The Video Script / Flow

**1. The Introduction**
> *"Hello Google Trust & Safety Team. My name is [Your Name], and I am demonstrating Nexus Drive Organizer. We built Nexus to help users efficiently manage and clean up their Google Drive workspace. Our Chrome extension uses local logic and AI to organize scattered files in seconds."*

**2. The Login & Client ID Verification (CRITICAL STEP)**
- Click on the Nexus extension icon.
- Click the **"Scan My Drive"** button.
- When the Google Sign-in pop-up appears, **pause and highlight the URL bar**.
> *"Before demonstrating the features, I want to verify our OAuth flow. As you can see in the URL bar, our Client ID perfectly matches the one registered in our Google Cloud Console."*

**3. The Scope Justification**
- Proceed to select your Google Account.
- When the permissions screen appears, highlight the Google Drive scope.
> *"Nexus is a comprehensive file manager, which is why we request the restricted `auth/drive` scope. To organize a user's Drive, the app fundamentally needs the ability to read file data, move items into organized folders, and permanently send duplicate files to the trash."*

**4. Feature Showcase: Manual Triage (Drag & Drop)**
- Click **"Allow"** to finish the login.
- Once loaded, navigate to the **File Manager** tab.
> *"Let's start with our Manual Triage interface, which allows for quick, hands-on organization. By dragging a file here, Nexus uses its write access to instantly update the file's location in Google Drive."*
- *Action: Drag and drop a file into one of the folders to show it works.*

**5. Feature Showcase: Storage Health & Bulk Deletion**
- Navigate to the **Storage Health** tab. Wait for the scan to finish.
> *"Next, we help users reclaim their storage space. Nexus reads the drive to identify exact byte-for-byte duplicates using MD5 checksums. I will delete one of these duplicates right now, demonstrating exactly why we need write access to move redundant files to the user's trash."*
- *Action: Click a trash button on a duplicate file.*

**6. Feature Showcase: The AI Auto-Pilot**
- Navigate back to the **File Manager** and click **"AI Auto-Pilot"**.
> *"Finally, for automated organization, our AI Auto-Pilot reads loose file metadata and automatically suggests logical folders to group them into, saving significant manual effort."*

**7. The Closing**
> *"Because our core functionality relies entirely on reading, moving, and trashing files, the full Google Drive scope is necessary for Nexus Drive Organizer to work. Thank you for your time and for reviewing our application."*

---

## 📤 Submission Steps
1. Upload the video to YouTube as **Unlisted**.
2. Go to your Google Cloud Console > APIs & Services > OAuth consent screen.
3. Paste the YouTube link into the "YouTube video link" field in your verification submission.
4. Submit for review!
