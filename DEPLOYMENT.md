# Deployment Guide: Ticket and Package Counters

## Overview
This deployment adds ticket and package counters to the Operator Panel (My Roster) and Operational Report without breaking existing functionality.

## Pre-Deployment Checklist

- [x] Code changes reviewed and approved
- [x] Build successful (`npm run build`)
- [x] Security scan passed (CodeQL - 0 vulnerabilities)
- [x] No breaking changes
- [x] Backward compatible with existing data
- [x] Vercel configuration file (`vercel.json`) added for proper SPA routing

## Deployment Steps

### 1. All Environments (Dev/Staging/Prod)

The application uses Vite and is deployed to Vercel. Follow these steps:

#### Local Build Verification
```bash
npm install
npm run build
```

Expected output: Build completes successfully with no errors

#### Deploy to Vercel

**Option A: Automatic Deployment (Recommended)**
- Merge this PR to the main branch
- Vercel will automatically detect changes and deploy
- Monitor the Vercel dashboard for deployment status

**Option B: Manual Deployment**
```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Deploy to preview environment
vercel

# Deploy to production (after vercel preview succeeds)
vercel --prod
```

### 2. Environment Variables

**No new environment variables required.**

Existing configuration remains unchanged:
- `GEMINI_API_KEY` - Already configured (optional, for AI assistant feature)
- Firebase configuration - Already configured in `firebaseConfig.ts`

### 3. Vercel Configuration

A `vercel.json` file has been added to ensure proper SPA routing. This configuration:
- Specifies the build command and output directory
- Configures rewrites to handle client-side routing
- Sets up caching headers for optimal performance

**Important**: If deploying for the first time, ensure your Vercel project is set up with:
- Framework Preset: Vite
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`

### 3. Vercel Configuration

A `vercel.json` file has been added to ensure proper SPA routing. This configuration:
- Specifies the build command and output directory
- Configures rewrites to handle client-side routing
- Sets up caching headers for optimal performance

**Important**: If deploying for the first time, ensure your Vercel project is set up with:
- Framework Preset: Vite
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`

### 4. Database/Data Migration

**No migrations required.**

The feature uses existing data structures:
- `dailyRideDetails` - Already stores tickets and packages per ride
- No schema changes
- Backward compatible - if old data doesn't have details, defaults to tickets=count, packages=0

### 5. Post-Deployment Verification

After deployment, verify the following:

#### 5.1 App Loads Correctly (Black Screen Fix Verification)
- [ ] Navigate to the deployed URL
- [ ] Verify the app loads without a black screen
- [ ] Check that Firebase connection status is displayed in the header
- [ ] Verify the login screen appears correctly

#### 5.2 G&R Counter View
- [ ] Navigate to G&R section
- [ ] Verify "Total Guests Today" displays correctly
- [ ] Add guest counts using the ride cards
- [ ] Verify Footer shows correct total

#### 5.3 My Roster - Operator View
- [ ] Log in as an operator
- [ ] Check that three counters are displayed: Total Guests, Tickets, Packages
- [ ] Verify counters show correct aggregated values from assigned rides
- [ ] Change date selector and verify counters update

#### 5.4 My Roster - Manager View
- [ ] Log in as admin or operation-officer
- [ ] Navigate to My Roster
- [ ] Verify three counters displayed below Present/Absent counts
- [ ] Verify counters aggregate across all operators
- [ ] Test with different dates

#### 5.5 Operational Report
- [ ] Navigate to Reports section
- [ ] Verify "Month Total" card shows Tickets and Packages breakdown
- [ ] Select a date range
- [ ] Verify "Selected Range Total" card shows Tickets and Packages breakdown
- [ ] Verify ride breakdown table shows tickets, packages, and total columns
- [ ] Download CSV and verify ticket/package columns present

## Rollback Plan

If issues are detected after deployment:

### Quick Rollback (Vercel)
1. Go to Vercel Dashboard
2. Navigate to Deployments
3. Select previous stable deployment
4. Click "Promote to Production"

### Git Rollback
```bash
# Revert to previous commit
git revert HEAD~3..HEAD
git push origin main
```

## Known Limitations

1. **Manual Testing**: Screenshots and UI testing were not possible in the development environment. First deployment should be to a staging environment for thorough UI testing.

2. **Large Bundle Size**: The build warning about chunk size (645 KB) existed before these changes. Consider code-splitting in a future update.

3. **Historical Data**: Old ride counts that don't have ticket/package breakdown will default to showing all count as "tickets" and 0 "packages". This maintains accuracy for total counts.

## Support & Troubleshooting

### Issue: Counters show 0 when they shouldn't
**Solution**: Check that operators are using the updated ride cards with the split counter (tickets/packages). Old direct count updates will need the details field populated.

### Issue: Totals don't match
**Solution**: Total = Tickets + Packages. If they don't match, check the dailyRideDetails data structure in Firebase.

### Issue: Build fails
**Solution**: 
1. Clear node_modules: `rm -rf node_modules package-lock.json`
2. Reinstall: `npm install`
3. Rebuild: `npm run build`

## Monitoring

After deployment, monitor:
- Vercel deployment logs
- Firebase Realtime Database usage
- User feedback on counter accuracy
- Performance metrics (should be unchanged)

## Timeline

- **Staging Deployment**: Deploy immediately for testing
- **Production Deployment**: After 24-48 hours of staging validation
- **Documentation**: Updated README and CHANGELOG included in this PR

## Contact

For issues or questions:
- Review the CHANGELOG.md for detailed changes
- Check the README.md for feature documentation
- Refer to code comments in DailyRoster.tsx and Reports.tsx
