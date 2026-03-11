# SEDMHA Tournament Scheduler 2026

## Source
[redmondmj/sedmha-scheduler](https://github.com/redmondmj/sedmha-scheduler)

## Overview
A high-performance Single Page Application (SPA) designed to track and visualize the tournament progress for the **Truro Bearcats** (U11 A, U13 C, and U15 C) during the 2026 SEDMHA tournament. The app dynamically calculates bracket paths (Odyssey, Accord, or Civic) based on game results.

## Prerequisites
- **Node.js:** v18.0.0 or higher
- **npm:** v9.0.0 or higher
- **Firebase CLI:** For deployment and hosting management

## Installation
1.  **Clone the repository:**
    ```bash
    git clone https://github.com/redmondmj/sedmha-scheduler.git
    cd sedmha-scheduler
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Environment Setup:** Ensure your Firebase configuration is correctly set in `src/firebase.ts`.

## Usage/Features
- **Live Bracket Tracking:** Real-time updates for U11 A, U13 C, and U15 C divisions.
- **Dynamic Path Projection:** Visualize "If Win" and "If Loss" scenarios for upcoming games.
- **Arena Integration:** Integrated Google Maps links for all tournament venues.
- **Admin Mode:** PIN-protected score entry for authorized tournament officials.

### Available Commands
- `npm run dev`: Start local development server with HMR.
- `npm run build`: Build the production-ready application.
- `npm run lint`: Run ESLint for code quality checks.
- `firebase deploy`: Deploy the application to Firebase Hosting.

## Troubleshooting
- **Tab Blank Screen:** Ensure that the team category (e.g., `u15c`) exists in `src/data/schedule.json` and matches the `App.tsx` selection logic.
- **Caching Issues:** If updates don't appear after deployment, perform a hard refresh (Ctrl + F5).
- **Firebase Permissions:** Ensure the `tournament/state` document in Firestore is accessible with correct security rules.

## License
MIT License - Copyright (c) 2026 Matt Redmond
