# Architecture Decision Records (ADRs)

### Decision: Extracting to a Standalone App
**Date**: July 2026

- **Context**: Nexus File Manager (formerly Drive Organizer) was tightly coupled with the main productivity-app dashboard. Users requested the ability to deploy and run the Drive organization feature independently.
- **Options Considered**:
  - **Option A**: Build a toggle in the main app to hide other features.
  - **Option B**: Extract the feature into a new React app with stubbed dependencies.
- **Chosen Option & Why**: **Option B**. Extracting it into its own repository/directory ensures a smaller footprint, easier Dockerization, and removes the burden of maintaining heavy unrelated dependencies.
- **Revisit If**: The standalone app needs real backend persistence, at which point a proper database (like Supabase) should be introduced.

### Decision: Mocking Local Services
**Date**: July 2026

- **Context**: The extracted `DriveOrganizer.jsx` relied on `db.js` (for tasks/projects), `fileMeta.js`, and `ai.js` which were tied to the larger app's backend.
- **Options Considered**:
  - **Option A**: Strip out the UI code relating to tags, tasks, and projects.
  - **Option B**: Create mock services to keep the UI intact.
- **Chosen Option & Why**: **Option B**. Maintaining the UI functionality via mocked data ensures the user experience remains premium and fully functional as a prototype, and leaves room for easy extension later.

### Decision: Migrating from Dockerized SPA to Chrome Extension
**Date**: July 2026

- **Context**: The app was initially designed as a Dockerized SPA served by Nginx. However, implementing Google Identity Services on a local/unverified domain presented UX friction (third-party cookie blocking, complex credential setups).
- **Options Considered**:
  - **Option A**: Keep the Docker setup and configure advanced Nginx reverse proxies.
  - **Option B**: Convert the app into a Chrome Extension (MV3).
- **Chosen Option & Why**: **Option B**. A Chrome Extension natively supports `chrome.identity`, completely eliminating the need for external Google Identity scripts and simplifying OAuth. It also removes the need for Docker, allowing users to run the app entirely on the client side with zero infrastructure overhead.
- **Revisit If**: The app needs to be used by non-Chrome users (e.g., Safari/Firefox) or requires heavy backend processing that can't be done in a browser extension context.
