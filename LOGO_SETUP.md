# Adding Your G&R Logo and Pictures

This guide explains how to customize the application logo and ride pictures (G&R = Guests & Rides).

## Quick Start: Add Your Logo

The easiest way to add your custom logo is through the application interface:

### Step 1: Access the Backup Manager
1. Log in as an **admin** user
2. Click the **"Backup"** button in the header navigation
3. The Backup & Restore modal will open

### Step 2: Upload Your Logo
1. Scroll to the **"Manage Application Logo"** section
2. Click the **"Choose Image..."** button
3. Select your logo file (PNG, JPEG, or WebP format)
   - Maximum file size: 5MB
   - Recommended dimensions: 256x256 pixels or larger
4. Preview your logo in the modal
5. Click **"Save New Logo"** to apply it

### Step 3: Verify the Logo
Your logo will now appear in:
- ✅ Application header (top left corner)
- ✅ Login screen
- ✅ Browser tab icon (favicon)

## Alternative: Manual Logo Setup

If you prefer to replace the default logo file directly:

1. Navigate to the `public/` directory in the repository
2. Replace the `logo.svg` file with your logo file
3. Supported formats: SVG, PNG, JPG, WebP
4. Update `index.html` and `manifest.json` if you change the filename

## Add Custom Ride Pictures

You can customize each ride's picture individually:

### Method 1: Through the Application (Recommended)
1. Log in as an **admin** or **operation-officer**
2. Navigate to the **"G&R"** (Guests & Rides) view
3. Hover over any ride card
4. Click the **edit icon** (pencil) that appears in the top-right corner
5. Choose a new image for that ride
6. The image will be saved to Firebase and synced across all devices

### Method 2: Update Constants File
1. Edit the `constants.ts` file
2. Find the `RIDES_ARRAY` constant
3. Update the `imageUrl` property for any ride:
   ```typescript
   export const RIDES_ARRAY: Ride[] = [
     { id: 1, name: 'Paintball', floor: '17th', imageUrl: '/your-image.jpg' },
     // ... other rides
   ];
   ```
4. Place your image file in the `public/` directory

## Tips

- **Logo Size**: Keep logos under 256x256 pixels for optimal performance
- **Format**: SVG is recommended for logos (scales perfectly, small file size)
- **Ride Images**: Use 400x300 pixels for consistent appearance
- **Compression**: Compress images before uploading to reduce Firebase storage usage
- **Backup**: The logo is included in full application backups

## Troubleshooting

**Logo not appearing?**
- Clear your browser cache (Ctrl+Shift+R or Cmd+Shift+R)
- Check the browser console for errors
- Verify the logo file exists in `public/logo.svg`
- Ensure you're logged in as admin to upload logos

**Ride images not updating?**
- Check your Firebase connection status (shown in header)
- Verify you have admin or operation-officer permissions
- Try refreshing the page after upload

## Default Logo

A placeholder TFW (Toggi Fun World) logo is provided in `public/logo.svg`. This is a purple-pink gradient design with the TFW branding. Feel free to replace it with your own logo following the instructions above.
