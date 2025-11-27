# Auto-Update Setup Guide

This guide explains how to set up and use the auto-update feature for AG-SubEditor.

## How It Works

AG-SubEditor uses **electron-updater** with **Electron Forge**, **GitHub Releases**, and **Squirrel.Windows** for automatic updates:

1. You publish a new version to GitHub Releases using `npm run publish`
2. The release is made **public** (while the repository stays private)
3. Users' installed apps automatically check for public updates (on startup and hourly)
4. When an update is found, it downloads in the background
5. Users get a notification to install the update
6. The app restarts with the new version

**Private Repository with Public Releases**: Your repository code stays private, but the releases (compiled binaries) are made public. This allows your friends to receive updates automatically without authentication. Since they're only getting compiled executables (not source code), your code remains private.

## Initial Setup (One-Time)

### 1. Create a GitHub Personal Access Token

You need a GitHub token to publish releases to your private repository:

1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
   - Or visit: https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Give it a name: `AG-SubEditor Publisher`
4. Set expiration: No expiration (or choose your preference)
5. Select scopes:
   - ✅ `repo` (Full control of private repositories)
6. Click "Generate token"
7. **Copy the token** (you won't see it again!)

**Note**: This token is only used for publishing releases, not embedded in the app. Users download updates from public releases without needing authentication.

### 2. Set the GitHub Token as Environment Variable

**IMPORTANT**: Set this token as `GH_TOKEN` (not `GITHUB_TOKEN`) for Electron Forge to publish releases.

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
  "version": "1.0.1" // Increment from 1.0.0
}
```

### Step 2: Build and Publish

**Ensure `GH_TOKEN` is set** in your environment before running this command!

```bash
# This will:
# 1. Build your app configured for public releases
# 2. Create Windows installer (Squirrel)
# 3. Create a GitHub Release (as draft) on your private repository
# 4. Upload the installer files
npm run publish
```

**What happens:**

- Your private repository code remains private
- A draft release is created with the compiled binaries
- When you publish the release, it becomes public
- Users' apps check for updates from the public releases API (no authentication needed)
- They download the compiled executables, not your source code

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

1. **Set GH_TOKEN**: Ensure it's set in your environment
2. **Build version 1.0.2** (or any version): `npm run make`
3. **Install** the built app on your machine from `out/make/squirrel.windows/x64/`
4. **Bump version** to 1.0.3 in package.json
5. **Publish**: `npm run publish` (creates draft release)
6. **Publish the release** on GitHub as **public**
7. **Open installed app** - it should detect and download the update!

**Important**: When publishing the release on GitHub, make sure to keep it public (do not check the "Set as a pre-release" or any private options).

### Verify Update Check

Check the logs at:

- Windows: `%APPDATA%\ag-subeditor\logs\main.log`

You should see:

```
[info] Initializing electron-updater for private repository
[info] Checking for updates...
[info] Update available: 1.0.3
[info] Download speed: 1234567 - Downloaded 50%
[info] Update downloaded: 1.0.3
```

If you see 404 errors, make sure your release is published as **public** on GitHub.

## Important Notes

### ✅ Best Practices

- **Always increment version** before publishing
- **Test the installer** before sharing
- **Write clear release notes** for users
- **Keep your GitHub token secure** (never commit it!)

### ⚠️ Limitations

- Only works on **Windows** currently (Squirrel.Windows)
- Requires **GitHub token** with `repo` scope to publish
- Updates only work in **production builds** (not development)
- Users need **internet connection** to check/download updates
- **Releases must be public** for auto-update to work (repository stays private)

### 🔒 Private Repository with Public Releases

**How it works:**

- Your **source code** stays private in the repository
- Only **compiled binaries** (the .exe installer) are made public in releases
- Users can download updates without authentication
- Your code remains protected since they only get the compiled app

**What's Private:**

- ✅ Source code
- ✅ Commit history
- ✅ Issues and pull requests
- ✅ Repository settings

**What's Public:**

- ⚠️ Release binaries (.exe installers)
- ⚠️ Release notes and version numbers
- ⚠️ Asset files you upload to releases

This is a standard approach for commercial/private software distribution.

### 🔧 Troubleshooting

**"GH_TOKEN not set" error:**

- Make sure you set the `GH_TOKEN` environment variable (not `GITHUB_TOKEN`)
- Restart your terminal after setting it permanently
- Use `echo $env:GH_TOKEN` to verify
- If still failing, try setting it temporarily in the same terminal session before running `npm run publish`

**Updates not appearing:**

- Check version numbers (new > old)
- Verify release is **published** (not draft) on GitHub
- **Important**: Make sure the release is **public**, not private
- Check logs in `%APPDATA%\ag-subeditor\logs\main.log`
- Ensure repository URL matches in package.json and forge.config.mts

**404 errors when checking for updates:**

- The release must be **public** for auto-update to work
- Go to your GitHub release and ensure it's not set to private
- Check that owner and repo name are correct in the code

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
