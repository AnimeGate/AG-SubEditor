# Auto-Update Setup Guide

This guide explains how to set up and use the auto-update feature for AG-SubEditor.

## How It Works

AG-SubEditor uses **Electron Forge** with **GitHub Releases** and **Squirrel.Windows** for automatic updates:

1. You publish a new version to GitHub Releases using `npm run publish`
2. Users' installed apps automatically check for updates (on startup and hourly)
3. When an update is found, it downloads in the background
4. Users get a notification to install the update
5. The app restarts with the new version

## Initial Setup (One-Time)

### 1. Create a GitHub Personal Access Token

You need a GitHub token to publish releases:

1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
   - Or visit: https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Give it a name: `AG-SubEditor Publisher`
4. Set expiration: No expiration (or choose your preference)
5. Select scopes:
   - ✅ `repo` (Full control of private repositories)
6. Click "Generate token"
7. **Copy the token** (you won't see it again!)

### 2. Set the GitHub Token as Environment Variable

**Windows (PowerShell):**
```powershell
# Temporary (current session only)
$env:GITHUB_TOKEN = "your_token_here"

# Permanent (user-level)
[Environment]::SetEnvironmentVariable("GITHUB_TOKEN", "your_token_here", "User")
```

**Windows (Command Prompt):**
```cmd
# Temporary (current session only)
set GITHUB_TOKEN=your_token_here

# Permanent (requires new terminal after setting)
setx GITHUB_TOKEN "your_token_here"
```

**Verify it's set:**
```powershell
echo $env:GITHUB_TOKEN
```

## Publishing a New Version

### Step 1: Update Version Number

Edit `package.json` and bump the version:
```json
{
  "version": "1.0.1"  // Increment from 1.0.0
}
```

### Step 2: Build and Publish

```bash
# This will:
# 1. Build your app
# 2. Create Windows installer (Squirrel)
# 3. Create a GitHub Release (as draft)
# 4. Upload the installer files
npm run publish
```

### Step 3: Publish the Release

1. Go to your GitHub repository
2. Navigate to "Releases"
3. Find the draft release
4. Edit it if needed (add release notes)
5. Click "Publish release"

## How Users Receive Updates

### First Time Installation
1. Share the installer with your friend: `AG-SubEditor-X.X.X Setup.exe`
2. Friend installs the app normally

### Automatic Updates
Once installed, the app will:
- Check for updates **3 seconds** after launch
- Check for updates **every hour** while running
- Download updates automatically in the background
- Show a notification when an update is ready:
  ```
  Nowa wersja została pobrana
  Wersja X.X.X jest gotowa do zainstalowania.
  Aplikacja zostanie zrestartowana.

  [Zainstaluj teraz] [Później]
  ```

### Update Notification
- **Zainstaluj teraz**: Quits and installs immediately
- **Później**: User can continue working, install later

## Files Generated

After `npm run publish`, you'll find in `out/make/squirrel.windows/x64/`:
- `ag_subeditor-X.X.X Setup.exe` - **Share this with users**
- `RELEASES` - Update manifest file
- `.nupkg` files - Update packages

## Testing Updates

### Test Locally
1. Build version 1.0.0: `npm run make`
2. Install it on your machine
3. Bump version to 1.0.1 in package.json
4. Publish: `npm run publish`
5. Publish the release on GitHub
6. Open the installed app - it should detect the update!

### Verify Update Check
Check the logs at:
- Windows: `%APPDATA%\ag-subeditor\logs\main.log`

You should see:
```
[info] Checking for updates...
[info] Update available. Downloading...
[info] Update downloaded: { releaseName: '1.0.1', ... }
```

## Important Notes

### ✅ Best Practices
- **Always increment version** before publishing
- **Test the installer** before sharing
- **Write clear release notes** for users
- **Keep your GitHub token secure** (never commit it!)

### ⚠️ Limitations
- Only works on **Windows** currently (Squirrel.Windows)
- Requires **GitHub token** with `repo` scope
- Updates only work in **production builds** (not development)
- Users need **internet connection** to check/download updates

### 🔧 Troubleshooting

**"GITHUB_TOKEN not set" error:**
- Make sure you set the environment variable
- Restart your terminal after setting it
- Use `echo $env:GITHUB_TOKEN` to verify

**Updates not appearing:**
- Check version numbers (new > old)
- Verify release is **published** (not draft)
- Check logs in `%APPDATA%\ag-subeditor\logs\main.log`
- Ensure repository URL matches in package.json and forge.config.mts

**Auto-update not triggering:**
- Only works in packaged apps (not `npm run start`)
- Windows only (macOS/Linux need different setup)
- Check that you published the release on GitHub

## Version Numbering

Follow semantic versioning:
- **1.0.0** → **1.0.1**: Bug fixes
- **1.0.0** → **1.1.0**: New features
- **1.0.0** → **2.0.0**: Breaking changes

## Workflow Summary

```
1. Make changes to code
2. Bump version in package.json (1.0.0 → 1.0.1)
3. npm run publish (creates draft release)
4. Go to GitHub → Releases → Publish release
5. Users' apps auto-update! ✨
```

## Optional: Add App Icon

To customize the installer:
1. Create `assets/icon.ico` (256x256px Windows icon)
2. Create `assets/loading.gif` (optional loading animation)
3. These are already referenced in `forge.config.mts`

---

**You're all set!** 🎉

Your app now has professional auto-update capabilities. Push updates and your users will get them automatically!
