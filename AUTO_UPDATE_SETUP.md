# Auto-Update Setup Guide

This guide explains how to set up and use the auto-update feature for AG-SubEditor.

## How It Works

AG-SubEditor uses **electron-updater** with **Electron Forge**, **GitHub Releases**, and **Squirrel.Windows** for automatic updates from private repositories:

1. You publish a new version to GitHub Releases using `npm run publish`
2. Users' installed apps automatically check for updates (on startup and hourly)
3. When an update is found, it downloads in the background using embedded authentication
4. Users get a notification to install the update
5. The app restarts with the new version

**Private Repository Support**: electron-updater supports private GitHub repositories by embedding your GitHub token in the built application. This allows your friends to receive updates automatically without needing their own GitHub access.

## Initial Setup (One-Time)

### 1. Create a GitHub Personal Access Token

You need a GitHub token for two purposes:
- **Publishing releases** to GitHub
- **Embedding in the app** so users can check for updates from your private repository

1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
   - Or visit: https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Give it a name: `AG-SubEditor Publisher & Updater`
4. Set expiration: No expiration (or choose your preference)
5. Select scopes:
   - ✅ `repo` (Full control of private repositories)
6. Click "Generate token"
7. **Copy the token** (you won't see it again!)

**Important for Private Repos**: This token will be embedded in your packaged application to allow update checks. Since you're distributing to friends in a private context, this is acceptable. Do not use this approach for public applications.

### 2. Set the GitHub Token as Environment Variable

**IMPORTANT**: You must set this token as `GH_TOKEN` (not `GITHUB_TOKEN`) for electron-updater to embed it in the application.

**Windows (PowerShell):**
```powershell
# Temporary (current session only)
$env:GH_TOKEN = "your_token_here"

# Permanent (user-level) - RECOMMENDED
[Environment]::SetEnvironmentVariable("GH_TOKEN", "your_token_here", "User")
```

**Windows (Command Prompt):**
```cmd
# Temporary (current session only)
set GH_TOKEN=your_token_here

# Permanent (requires new terminal after setting) - RECOMMENDED
setx GH_TOKEN "your_token_here"
```

**Verify it's set:**
```powershell
echo $env:GH_TOKEN
```

**After setting permanently, restart your terminal** so the new environment variable is available.

## Publishing a New Version

### Step 1: Update Version Number

Edit `package.json` and bump the version:
```json
{
  "version": "1.0.1"  // Increment from 1.0.0
}
```

### Step 2: Build and Publish

**Ensure `GH_TOKEN` is set** in your environment before running this command!

```bash
# This will:
# 1. Build your app with embedded GitHub token for private repo updates
# 2. Create Windows installer (Squirrel)
# 3. Create a GitHub Release (as draft) on your private repository
# 4. Upload the installer files
npm run publish
```

**What happens with private repos:**
- electron-updater reads the `GH_TOKEN` environment variable during build
- The token is embedded in the packaged application
- Users' installed apps will use this embedded token to check for updates
- This allows updates from your private repository without users needing GitHub access

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

### Test Locally with Private Repo
1. **Set GH_TOKEN**: Ensure it's set in your environment
2. **Build version 1.0.0**: `npm run make` (with GH_TOKEN set)
3. **Install** the built app on your machine from `out/make/squirrel.windows/x64/`
4. **Bump version** to 1.0.1 in package.json
5. **Publish**: `npm run publish` (creates draft release)
6. **Publish the release** on GitHub (make it public, not draft)
7. **Open installed app** - it should detect and download the update!

**Important**: The app built in step 2 must have been built with `GH_TOKEN` set, or it won't be able to check for updates from the private repository.

### Verify Update Check
Check the logs at:
- Windows: `%APPDATA%\ag-subeditor\logs\main.log`

You should see:
```
[info] Initializing electron-updater for private repository
[info] Checking for updates...
[info] Update available: 1.0.1
[info] Download speed: 1234567 - Downloaded 50%
[info] Update downloaded: 1.0.1
```

If you see authentication errors, the GH_TOKEN wasn't properly embedded during build.

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
- **Private repos**: The GitHub token is embedded in the app - only suitable for trusted distribution (friends/private use)

### 🔒 Private Repository Considerations

**Security Note**: When distributing apps with auto-update from private repos, your GitHub token is embedded in the packaged application. This is acceptable for:
- ✅ Private distribution to friends
- ✅ Closed groups or organizations
- ✅ Internal company tools

This is **NOT recommended** for:
- ❌ Public distribution
- ❌ Open-source projects
- ❌ Any scenario where untrusted users could extract the token

**Alternatives for public distribution:**
1. Make releases public while keeping the repository private
2. Use a proxy server to handle authentication
3. Make the entire repository public

### 🔧 Troubleshooting

**"GH_TOKEN not set" error:**
- Make sure you set the `GH_TOKEN` environment variable (not `GITHUB_TOKEN`)
- Restart your terminal after setting it permanently
- Use `echo $env:GH_TOKEN` to verify
- If still failing, try setting it temporarily in the same terminal session before running `npm run publish`

**Updates not appearing:**
- Check version numbers (new > old)
- Verify release is **published** (not draft) on GitHub
- Check logs in `%APPDATA%\ag-subeditor\logs\main.log`
- Ensure repository URL matches in package.json and forge.config.mts
- Verify `GH_TOKEN` was set when you built the app (check logs for "Checking for updates")

**Private repo access errors:**
- Ensure `GH_TOKEN` was set **during the build** when running `npm run publish`
- The token must have `repo` scope for private repositories
- Check that the repository owner and name match in package.json and forge.config.mts
- Try rebuilding with the token: `npm run make` (after setting `GH_TOKEN`)

**Auto-update not triggering:**
- Only works in packaged apps (not `npm run start`)
- Windows only (macOS/Linux need different setup)
- Check that you published the release on GitHub
- Verify the app was built with `GH_TOKEN` set in the environment

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
