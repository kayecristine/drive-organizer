# Google OAuth Verification - Video Script

*This document outlines the exact step-by-step script and recording instructions required to submit your Google OAuth Consent Screen for verification by the Google Trust & Safety Team.*

---

## 🎥 Recording Checklist
Before you hit record, ensure the following are visible on your screen:
- Your entire browser window (including the URL bar).
- The Nexus Drive Organizer Extension loaded in Chrome.
- You must show the **Client ID** in the URL during the OAuth process.

---

## 📝 The Video Script / Flow

**1. Introduce the App**
> *"Hello Google Trust & Safety Team. My name is [Your Name] and I am demonstrating the OAuth flow for my Chrome Extension, Nexus Drive Organizer."*

**2. Demonstrate How the User Logs In**
- Click on the Nexus extension icon to open the app.
- Click the **"Manual Triage"** or **"AI Auto-Pilot"** button to trigger the Google Login pop-up.

**3. Show the Client ID (CRITICAL STEP)**
- When the Google Sign-in pop-up appears, **pause and highlight the URL bar**.
- Scroll through the URL so the reviewer can clearly see your `client_id=...` parameter.
> *"As you can see in the URL bar, the Client ID perfectly matches the Client ID registered in my Google Cloud Console."*

**4. Show the Consent Screen & Scopes**
- Proceed to select your Google Account.
- When the permissions screen appears, highlight the exact scope requested (Google Drive).
> *"The app requests the `https://www.googleapis.com/auth/drive` scope. We require this scope because the core functionality of the app is to allow users to organize their Google Drive, rename files, and move duplicates to the trash."*

**5. Demonstrate the App Using the Scopes**
- Click **"Allow"** to finish the login.
- Once the app loads, demonstrate exactly how the data is used:
  - **Read:** Point out the files loaded in the File Manager.
  - **Write/Trash:** Select a duplicate file and click the **Trash** button to prove you are using the write/trash capability.
> *"Here you can see the app reading the user's Drive files to display them in the File Manager. I will now select a duplicate file and delete it, demonstrating why we need full Drive access to organize the user's files."*

**6. Conclusion**
> *"Thank you for your time. This concludes the demonstration of Nexus Drive Organizer."*

---

## 📤 Submission Steps
1. Upload the video to YouTube as **Unlisted**.
2. Go to your Google Cloud Console > APIs & Services > OAuth consent screen.
3. Paste the YouTube link into the "YouTube video link" field in your verification submission.
4. Submit for review!
