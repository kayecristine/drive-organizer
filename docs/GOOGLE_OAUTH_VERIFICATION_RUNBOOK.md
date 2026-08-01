# Google OAuth Trust & Safety Verification Runbook

This document captures the exact, step-by-step process required to get the Nexus Drive Organizer Chrome Extension verified by Google's Trust & Safety team. Because the app uses Restricted Scopes (`auth/drive`), it requires a rigorous verification process.

## The Vercel "Catch-22"
Google's automated verification bots require a public-facing Application Home Page that clearly outlines the app's purpose and privacy policy. 
- **The Problem:** The bot **cannot** execute JavaScript or render React Single Page Applications (SPAs). If you provide a standard React app URL, the bot sees a blank page and instantly fails the verification.
- **The Solution:** We utilize a hybrid deployment on Vercel. The Chrome Extension runs the React code natively, but we deploy a pure static `public/about.html` file to Vercel (e.g., `https://nexus-drive-organizer.vercel.app/about.html`) to serve as the highly-optimized, bot-readable landing page.

---

## Step 1: Vercel Deployment & Landing Page
1. Ensure the repository contains a static `public/about.html` file.
2. The `about.html` file **must** contain:
   - The exact App Name ("Nexus Drive Organizer") in the `<title>` and `<h1>`.
   - A detailed explanation of the app's core features (Manual Triage, Duplicate Scanner, AI Auto-Pilot).
   - A section explicitly detailing **why** the Google Drive API scope is required.
   - A Data & Privacy Principles section.
3. Deploy the repository to Vercel.

## Step 2: Google Search Console Verification
Google Cloud requires you to prove ownership of your Application Home Page URL.
1. Go to [Google Search Console](https://search.google.com/search-console).
2. Click **Add Property** and select the **URL Prefix** box (on the right). Do *not* use the Domain box, as Vercel subdomains do not allow DNS TXT record editing.
3. Enter exactly: `https://nexus-drive-organizer.vercel.app/about.html`
4. When prompted for a verification method, open the **HTML tag** section.
5. Copy the `<meta name="google-site-verification" content="..." />` tag.
6. Inject this meta tag into the `<head>` of both `public/about.html` and `index.html` in your codebase, commit, and push.
7. Wait for Vercel to build, then click **Verify** in Search Console.

## Step 3: Google Cloud - Branding Section
1. Go to Google Cloud Console > APIs & Services > OAuth Consent Screen > **Branding**.
2. Set the **Application home page** to exactly match the verified URL: `https://nexus-drive-organizer.vercel.app/about.html`
3. Set the Privacy Policy link to `https://nexus-drive-organizer.vercel.app/privacy.html`.
4. Click Save and Proceed.

### Handling the Automated Rejection
Because `.vercel.app` is a public suffix, the automated Google bot may still fail to recognize the Search Console linkage and throw 3 instant errors:
- *"The website of your home page URL... is not registered to you."*
- *"Your home page does not explain the purpose of your app."*
- *"The app name... does not match."*

**The Fix (Manual Appeal):**
1. Select the radio button: **"I believe the issues found are incorrect"**.
2. For the explanations, paste the following:
   - **For Domain Ownership:** *"I have successfully verified ownership of this exact URL prefix (https://nexus-drive-organizer.vercel.app/about.html) in Google Search Console using the HTML meta tag method under my exact Google account."*
   - **For App Purpose/Name:** *"The automated bot was previously reading a blank React SPA page. I have deployed a fully static HTML page at https://nexus-drive-organizer.vercel.app/about.html. Please visit it manually to see the exact app name, purpose, and scope justification."*

## Step 4: Google Cloud - Data Access Section
1. Go to the **Data Access** tab.
2. Click **Add or remove scopes**.
3. Search for the Google Drive API and check `https://www.googleapis.com/auth/drive` (Restricted).
4. For the **"What features will you use?"** dropdown, select **Drive productivity**.
5. For the **Justification** box, paste:
   > *"This permission is required because the application needs to: (1) list all files in the user's Drive to populate the File Manager and Duplicate Scanner; (2) read file metadata to power the AI categorizer; (3) create new folders in Drive; and (4) move files between folders during triage. All actions are core functions and cannot be performed with a narrower scope."*
6. Under **Demo video**, paste the unlisted YouTube link demonstrating the OAuth flow (as scripted in `OAUTH_VERIFICATION_SCRIPT.md`).

## Step 5: Final Submission
1. Review the Verification Questionnaire (confirming the app is not just for internal, staging, or personal use).
2. Add a final note in the "Additional info" box reminding the human reviewer to check the static `/about.html` page.
3. Click **Submit for verification**.
4. The Trust & Safety team typically takes 2-5 business days to review and approve the request.
