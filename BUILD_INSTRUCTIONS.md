# Building the Desktop Application

This guide will help you build the **Multilingual PA** desktop application (.exe file) on your local Windows machine.

## Prerequisites

Before building, ensure you have:
- **Node.js 22.x** installed ([Download here](https://nodejs.org/))
- **Git** installed ([Download here](https://git-scm.com/))
- **Windows 10 or later** (for building .exe)
- **Internet connection** (for downloading dependencies)

## Step 1: Clone the Repository

```bash
git clone <your-repo-url>
cd multilingual-pa
```

## Step 2: Install Dependencies

Open Command Prompt or PowerShell in the project directory and run:

```bash
npm install
```

This will install:
- Electron (desktop app framework)
- electron-builder (to create the .exe installer)
- electron-store (for settings storage)
- electron-log (for logging)
- All existing dependencies

**Note:** The installation may take 5-10 minutes as it downloads Electron binaries (~150MB).

## Step 3: Build the Windows Executable

Once installation completes, run:

```bash
npm run build
```

This command will:
- Package the application with Electron
- Create a Windows installer (.exe)
- Bundle all dependencies
- Output to the `dist/` folder

**Build time:** 2-5 minutes depending on your system.

## Step 4: Install and Run

After the build completes, you'll find:

```
dist/
  └── Multilingual PA Setup 1.0.0.exe   (Installer ~200MB)
```

**To install:**
1. Double-click `Multilingual PA Setup 1.0.0.exe`
2. Choose installation location
3. Complete the installation wizard
4. The app will launch automatically

**Desktop shortcuts** will be created for easy access.

---

## What You Get in the Desktop App

### 1. One-Click Launch
- No terminal commands needed
- Double-click desktop icon to start
- Automatic Express server startup

### 2. Built-in Chat Interface
- **Chat button** (💬) in bottom-right corner
- Send feedback, bug reports, or feature requests directly
- All messages are automatically logged for review

### 3. Easy Settings Configuration
- **Settings button** (⚙️) in bottom-left corner
- Visual interface to configure:
  - Google Gemini API Key
  - Supabase URL
  - Supabase Anon Key
- No need to edit `.env` files manually
- Settings persist between sessions

### 4. Automatic Error Reporting
- All errors are automatically logged
- Crash reports saved locally
- Helps with debugging and improvements

### 5. Native Desktop Experience
- Windows taskbar integration
- System tray icon
- Native notifications
- Keyboard shortcuts (Ctrl+R to reload, F11 for fullscreen, etc.)

---

## Running in Development Mode

To test the app without building:

```bash
# Install dependencies (first time only)
npm install

# Run in Electron development mode
npm run electron
```

This opens the app in a desktop window but doesn't create an .exe file.

---

## Troubleshooting

### "npm install" fails with network errors

**Solution:** Check your internet connection and retry. Electron needs to download binaries from GitHub.

```bash
# Clear npm cache and retry
npm cache clean --force
npm install
```

### Build fails with "electron-builder not found"

**Solution:** Reinstall dependencies:

```bash
rm -rf node_modules
npm install
```

### Application won't start after installation

**Solution:** Check if antivirus is blocking the app. Add an exception for `Multilingual PA.exe`.

### Settings don't persist

**Solution:** The app uses electron-store which saves to:
```
C:\Users\<YourName>\AppData\Roaming\multilingual-pa\
```

Make sure this folder has write permissions.

---

## Building for Other Platforms

### macOS (.dmg)

```bash
npm run build-all
```

Creates: `dist/Multilingual PA-1.0.0.dmg`

**Note:** You need a Mac to build for macOS, or use a CI service.

### Linux (.AppImage)

```bash
npm run build-all
```

Creates: `dist/Multilingual PA-1.0.0.AppImage`

---

## File Structure

After building, your project structure:

```
multilingual-pa/
├── dist/                          # Build output
│   └── Multilingual PA Setup 1.0.0.exe
├── electron-main.js               # Electron main process
├── preload.js                     # Electron preload script
├── server.js                      # Express server
├── public/
│   └── index.html                 # UI with chat & settings
├── package.json                   # Dependencies & build config
└── BUILD_INSTRUCTIONS.md          # This file
```

---

## Advanced Configuration

### Customizing the Build

Edit `package.json` under the `"build"` section:

```json
"build": {
  "appId": "com.proteahrms.multilingual-pa",
  "productName": "Multilingual PA",
  "win": {
    "target": "nsis",
    "icon": "public/icon.ico"  // Add your custom icon here
  }
}
```

### Custom Icon

1. Create a 512x512 PNG icon
2. Convert to .ico format using [ConvertICO](https://convertio.co/png-ico/)
3. Save as `public/icon.ico`
4. Rebuild: `npm run build`

### Portable Version (No Installer)

To create a portable .exe that doesn't require installation:

Edit `package.json`:

```json
"win": {
  "target": "portable"
}
```

Then rebuild.

---

## FAQ

**Q: How big is the final .exe?**
A: ~200MB (includes Node.js runtime, Chromium, and all dependencies)

**Q: Can I distribute this .exe?**
A: Yes! Once built, the .exe is standalone and can be shared. Users just run the installer.

**Q: Does it require admin rights?**
A: No, users can choose "Install for current user only" during installation.

**Q: How do I update the app?**
A: Rebuild with `npm run build` and users install the new version. Settings are preserved.

**Q: Can I auto-update the app?**
A: Yes, but requires additional setup with `electron-updater`. Let me know if you want this feature!

---

## Next Steps

After successfully building:

1. Test the installer on a clean Windows machine
2. Share the installer with users
3. Use the in-app chat to collect feedback
4. Review logs in the app data folder for reported issues

---

## Support

If you encounter issues during the build process:
1. Check the error log: `%AppData%\multilingual-pa\logs\`
2. Use the in-app chat (💬) to report issues
3. Create a GitHub issue with the error message

---

**Happy Building! 🚀**
