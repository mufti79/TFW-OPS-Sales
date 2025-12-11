# Deployment Guide for Toggi Fun World App

This guide will help you deploy your application to Firebase Hosting and Vercel.

## Overview

Your app is now ready for deployment with all configurations in place:
- ✅ Build errors fixed
- ✅ Operator panel with tickets and packages working
- ✅ Operation reports calculating total guest count correctly
- ✅ Improved loading screen with animations
- ✅ Firebase configuration ready
- ✅ Vercel configuration ready

## Quick Start - Deploy to Firebase Hosting

### Prerequisites
1. Firebase CLI installed (if not, install with: `npm install -g firebase-tools`)
2. Access to the Firebase project (toggifunworld-app)

### Steps:

1. **Login to Firebase** (if not already logged in):
   ```bash
   firebase login
   ```

2. **Build the application**:
   ```bash
   npm run build
   ```

3. **Deploy to Firebase**:
   ```bash
   firebase deploy --only hosting
   ```

4. **Your app will be live at**:
   - https://toggifunworld-app.web.app
   - https://toggifunworld-app.firebaseapp.com

## Quick Start - Deploy to Vercel

### Option 1: Using Vercel Dashboard (Easiest)

1. Go to https://vercel.com and sign in
2. Click "Add New..." → "Project"
3. Import your GitHub repository (mufti79/TFW-OPS-Sales)
4. Vercel will automatically detect the settings from `vercel.json`
5. Click "Deploy"
6. Your app will be live in ~2 minutes!

### Option 2: Using Vercel CLI

1. **Install Vercel CLI** (if not installed):
   ```bash
   npm install -g vercel
   ```

2. **Deploy**:
   ```bash
   vercel
   ```

3. **Follow the prompts** to link your project

4. **For production deployment**:
   ```bash
   vercel --prod
   ```

### Option 3: One-Click Deploy

Simply click this button:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/mufti79/TFW-OPS-Sales)

## Automated Deployment with GitHub Actions

Your repository now includes an automated deployment workflow that deploys to Firebase whenever you push to the `main` or `master` branch.

### Setup Instructions:

1. **Generate a Firebase Service Account**:
   - Go to Firebase Console: https://console.firebase.google.com
   - Select your project (toggifunworld-app)
   - Go to Project Settings → Service Accounts
   - Click "Generate New Private Key"
   - Save the JSON file securely

2. **Add the Service Account to GitHub Secrets**:
   - Go to your GitHub repository
   - Navigate to Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `FIREBASE_SERVICE_ACCOUNT`
   - Value: Paste the entire contents of the JSON file
   - Click "Add secret"

3. **Enable the workflow**:
   - The workflow file is already in `.github/workflows/firebase-deploy.yml`
   - Push to `main` or `master` branch to trigger deployment
   - Or manually trigger from GitHub Actions tab

## Features Confirmed Working

### ✅ Operator Panel
- Operators can see their assigned rides
- Ticket and Package counters are working correctly
- Split counter shows:
  - Total Guests (tickets + packages)
  - Separate counters for Tickets
  - Separate counters for Packages

### ✅ Operation Reports
- Total guest count is calculated correctly
- Reports show breakdown by tickets and packages
- Monthly reports working
- Date range reports working

### ✅ Loading Screen
- Improved with gradient background
- Animated spinner
- Better branding with "Toggi Fun World - Feel The Thrill"

## Firebase Configuration

The app is already configured to use your Firebase project:
- **Project ID**: toggifunworld-app
- **Database URL**: https://toggifunworld-app-default-rtdb.firebaseio.com
- **Hosting URL**: https://toggifunworld-app.web.app

## Vercel Configuration

The `vercel.json` file configures:
- Build command: `npm run build`
- Output directory: `dist`
- SPA rewrites for client-side routing
- Optimized caching headers

## Troubleshooting

### Firebase Deployment Issues

**Problem**: "Permission denied" or "Unauthorized"
**Solution**: Run `firebase login` again to refresh your credentials

**Problem**: "Project not found"
**Solution**: Check that `.firebaserc` has the correct project ID

### Vercel Deployment Issues

**Problem**: Build fails
**Solution**: Make sure all dependencies are in `package.json` and run `npm install` locally first

**Problem**: Environment variables
**Solution**: Add environment variables in Vercel dashboard under Project Settings → Environment Variables

### Build Issues

If you encounter build errors:
1. Delete `node_modules` and `package-lock.json`
2. Run `npm install`
3. Run `npm run build`
4. Try deployment again

## Support

For Firebase help: https://firebase.google.com/support
For Vercel help: https://vercel.com/support

## Next Steps

1. Deploy to Firebase and Vercel using the instructions above
2. Share the deployed URLs with your team
3. Set up custom domains (optional)
4. Enable continuous deployment via GitHub Actions

Your app is ready to go live! 🚀
