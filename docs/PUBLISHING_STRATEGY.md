# Publishing & Go-To-Market Strategy

This document outlines the step-by-step process for releasing products to the public. It is divided into two phases: **Phase 1** for free Chrome Extensions (like Nexus File Manager) and **Phase 2** for future paid applications.

---

## Phase 1: Releasing a Free Chrome Extension (Current Goal)

Since Nexus interacts directly with users' personal Google Drive files, Google has strict security requirements. Follow these steps in order to get the extension into the hands of strangers.

### Step 1: Establish Your Identity (100% Free)
Before submitting your app, you need a digital "home" for it so Google can verify you.
1. **Setup Free Hosting**: Create a free account on Vercel, Netlify, or GitHub Pages. They will give you a free URL (e.g., `nexus-app.vercel.app` or `yourname.github.io`). You do NOT need to buy a custom domain unless you want to!
2. **Write a Privacy Policy**: Create a simple text or HTML page stating that Nexus does not store user data on external servers and that the Gemini API key is kept locally in the browser. 
3. **Deploy**: Host this privacy policy on your free URL (e.g., `nexus-app.vercel.app/privacy`).

### Step 2: Google Cloud & OAuth Verification (100% Free)
Because Nexus asks to read Google Drive, you must prove to Google that your app is safe.
1. **Domain Verification**: Go to Google Search Console and verify ownership of your free URL (`nexus-app.vercel.app`). You can do this easily by uploading a small HTML file provided by Google to your free host.
2. **OAuth Consent Screen**: In your Google Cloud Console, configure the OAuth screen. Add your verified free URL and the link to your Privacy Policy.
3. **Record a Demo Video**: Record a 1–2 minute YouTube video showing exactly how a user logs in, how the extension sorts files, and why it needs Drive permissions.
4. **Submit for Review**: Click "Publish App" in Google Cloud and submit the form with your video and privacy policy. *Approval takes 3–7 days.*

### Step 3: Chrome Web Store Publication
Once Google Cloud verifies your OAuth screen, you can publish the actual extension.
1. **Developer Registration**: Go to the Chrome Developer Dashboard and pay the one-time $5 developer fee.
2. **Build the Extension**: Run `npm run build` in your terminal to generate the final `dist/` folder. Zip this folder.
3. **Store Listing**: Upload the Zip file. Add your logo, screenshots (use our Framer mockups!), and a catchy description.
4. **Publish**: Hit publish! Your extension is now live and free for anyone to install.

---

## Phase 2: Launching Paid Applications (Future Goal)

When you transition from free tools to paid applications, the deployment process requires more infrastructure to handle money, user accounts, and databases.

### Step 1: Authentication & User Accounts
Instead of relying solely on Google OAuth for Drive access, you need a system to manage *who* is paying you.
- **Action**: Use **Supabase Auth** or **Clerk**. These handle email/password logins, social logins, and secure user sessions out of the box so you don't have to build login screens from scratch.

### Step 2: Database & Architecture
You will need a place to store user profiles, app data, and settings securely.
- **Action**: Use **PostgreSQL via Supabase**. It provides an instant database with Row Level Security (RLS) to ensure users can only see data they own.

### Step 3: Payments & Subscriptions
To sell your application, you need to collect money legally and securely.
- **Action**: Integrate **Stripe** or **Lemon Squeezy**.
  - *Stripe* is the industry standard for payments.
  - *Lemon Squeezy* acts as a "Merchant of Record," meaning they handle global taxes and VAT for you automatically (highly recommended for solo founders).

### Step 4: Web & Mobile Deployment
Unlike a Chrome extension, web apps need a server, and mobile apps need app stores.
- **Web App**: Build your app using Next.js or Vite (React). Deploy it instantly and for free on **Vercel** or **Netlify**.
- **Mobile App**: Use **Capacitor** to wrap your React web app into a native iOS and Android app. 
- **App Stores**: You will need an Apple Developer Account ($99/year) to publish to the iOS App Store, and a Google Play Console Account ($25 one-time) to publish to the Android Play Store.

### Summary Checklist for a Paid App:
- [ ] Domain Name & Landing Page
- [ ] Supabase (Auth + Database)
- [ ] Stripe / Lemon Squeezy (Payments)
- [ ] Vercel (Web Hosting)
- [ ] Apple/Google Developer Accounts (For Mobile)
