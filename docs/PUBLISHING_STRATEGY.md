# Publishing & Go-To-Market Strategy

This document outlines the step-by-step process for releasing products to the public. It is divided into two phases: **Phase 1** for free Chrome Extensions (like Nexus File Manager) and **Phase 2** for future paid applications.

---

## Phase 1: Releasing a Free Chrome Extension

Because Nexus interacts directly with users' personal Google Drive files, Google has strict security requirements to ensure user safety. Below is the exact end-to-end workflow we used to take the MVP from local code to a verified, published Chrome Extension.

### 🗺️ The Publishing Workflow

```mermaid
flowchart TD
    %% Define Styles
    classDef gitHub fill:#24292e,stroke:#fff,stroke-width:2px,color:#fff;
    classDef vercel fill:#000000,stroke:#fff,stroke-width:2px,color:#fff;
    classDef searchConsole fill:#4285F4,stroke:#fff,stroke-width:2px,color:#fff;
    classDef cloudConsole fill:#DB4437,stroke:#fff,stroke-width:2px,color:#fff;
    classDef webStore fill:#F4B400,stroke:#fff,stroke-width:2px,color:#fff;

    A[1. Push Code to GitHub]:::gitHub --> B[2. Import into Vercel]:::vercel
    B --> C[Vercel Generates Free URL\n(e.g., nexus-drive.vercel.app)]:::vercel
    
    C --> D[3. Google Search Console]:::searchConsole
    D --> |"URL Prefix Property"| E[Add HTML Verification File\nto project 'public' folder]:::searchConsole
    E --> |Push to GitHub| F[Vercel Auto-Deploys]:::vercel
    F --> |Click Verify| G{Domain Verified!}:::searchConsole

    G --> H[4. Google Auth Platform\n(Google Cloud)]:::cloudConsole
    H --> |Branding Tab| I[Link Vercel Homepage & \nPrivacy Policy URL]:::cloudConsole
    I --> J[Add exact domain to \nAuthorized Domains]:::cloudConsole
    J --> K[Submit 1-2 Min\nYouTube Demo Video]:::cloudConsole
    
    K --> |Wait 3-7 Days for Approval| L[5. Chrome Web Store]:::webStore
    L --> M[Zip 'dist' folder \n& Upload to Dashboard]:::webStore
    M --> N(((Extension is Live!))):::webStore
```

### Step 1: Establish Your Identity via Vercel (100% Free)
Before submitting your app, you need a digital "home" for your Privacy Policy so Google can verify you.
1. **GitHub Push**: Push your project repository to GitHub.
2. **Vercel Import**: Go to Vercel, click "Add New Project", and import your GitHub repository. Vercel will automatically build the Vite app and assign you a free URL.
3. **Rename Domain (Optional)**: In Vercel's top navigation, go to **Domains** and edit the URL to something clean (e.g., `nexus-drive-organizer.vercel.app`).
4. **Privacy Policy**: Ensure your `public/privacy.html` file is pushed to GitHub. Vercel will automatically host it at `your-url.vercel.app/privacy.html`.

### Step 2: Google Search Console Verification
Because you are using a `.vercel.app` subdomain, you cannot use DNS verification.
1. **URL Prefix**: In Google Search Console, use the **URL prefix** property method and enter your exact Vercel URL.
2. **HTML File**: Choose the **HTML file** verification method. Google will give you a file name (e.g., `google123.html`).
3. **Deploy & Verify**: Create that file in your `public/` directory with the required `google-site-verification` text. Push it to GitHub, wait for Vercel to rebuild (30s), and hit **VERIFY** in Search Console.

### Step 3: Google Auth Platform (Cloud Console)
Now that Google knows you own the domain, you must link it to your OAuth consent screen.
1. Go to the [Google Cloud Console](https://console.cloud.google.com/) > **APIs & Services** > **OAuth consent screen** (now called Google Auth Platform).
2. Under the **Branding** tab, paste your Vercel URL into the **Application home page**.
3. Paste the path to your privacy policy into **Application privacy policy link**.
4. In the **Authorized domains** section (or the Verification Center), add your exact domain (e.g., `nexus-drive-organizer.vercel.app`). *Do not use just 'vercel.app' as it will be rejected as an invalid top private domain.*
5. **Record a Demo**: Record a 1–2 minute unlisted YouTube video showing a user logging in, sorting files, and explaining why Drive permissions are needed.
6. Submit the app for verification.

### Step 4: Chrome Web Store Publication
1. **Developer Registration**: Go to the Chrome Developer Dashboard and pay the one-time $5 developer fee.
2. **Build the Extension**: Run `npm run build` in your terminal to generate the final `dist/` folder.
3. **Zip It**: Compress the `dist/` folder into a `.zip` file.
4. **Store Listing**: Upload the Zip file. Add your custom neon logo, screenshots, and a catchy description.
5. **Publish**: Hit publish! Users will simply click "Add to Chrome" to install it.

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
