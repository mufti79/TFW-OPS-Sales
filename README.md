<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Toggi Fun World - Operations Management System

This is a comprehensive operations management system for Toggi Fun World theme park, including ride management, operator scheduling, ticket sales tracking, and reporting features.

## Features

- **Ride Management**: Track guest counts with separate tickets and packages
- **Operator Panel**: Daily roster, assignments, and check-in system
- **Ticket Sales**: Package sales tracking and reporting
- **Reports**: Monthly and date range reports with detailed breakdowns
- **Real-time Sync**: Firebase Realtime Database integration
- **Offline Support**: Works even when disconnected

## Run Locally

**Prerequisites:** Node.js 18+ and npm

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the development server:
   ```bash
   npm run dev
   ```

3. Build for production:
   ```bash
   npm run build
   ```

## Deploy to Firebase Hosting

1. Install Firebase CLI globally:
   ```bash
   npm install -g firebase-tools
   ```

2. Login to Firebase:
   ```bash
   firebase login
   ```

3. Build the application:
   ```bash
   npm run build
   ```

4. Deploy to Firebase:
   ```bash
   firebase deploy --only hosting
   ```

The app will be deployed to: https://toggifunworld-app.web.app

## Deploy to Vercel

### Option 1: Using Vercel CLI

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Deploy:
   ```bash
   vercel
   ```

3. Follow the prompts to link your project

### Option 2: Using Vercel Dashboard

1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Vercel will automatically detect the configuration from `vercel.json`
5. Click "Deploy"

### Option 3: Deploy Button

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/mufti79/TFW-OPS-Sales)

## Automated Deployment

The repository includes a GitHub Actions workflow that automatically deploys to Firebase Hosting when you push to the `main` or `master` branch.

To enable this:
1. Generate a Firebase service account key
2. Add it as a GitHub secret named `FIREBASE_SERVICE_ACCOUNT`
3. Push to main/master branch to trigger deployment

## Configuration

The Firebase configuration is in `firebaseConfig.ts`. The current setup uses the project:
- **Project ID**: toggifunworld-app
- **Database URL**: https://toggifunworld-app-default-rtdb.firebaseio.com

## Tech Stack

- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Database**: Firebase Realtime Database
- **Hosting**: Firebase Hosting / Vercel
