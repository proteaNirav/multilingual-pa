# Desktop App Features

## Overview

The Multilingual PA desktop application provides a standalone, easy-to-use experience with built-in feedback and configuration tools.

---

## Key Features

### 1. 💬 In-App Chat with Claude

**Location:** Bottom-right floating button

**What it does:**
- Direct communication channel with the developer
- Report bugs instantly
- Request new features
- Ask for improvements
- Get help with the app

**How it works:**
```
1. Click the chat button (💬) in bottom-right
2. Type your message
3. Press Enter or click Send
4. Your feedback is automatically logged and timestamped
5. You'll receive a confirmation message
```

**All feedback is stored in:**
```
Windows: C:\Users\<YourName>\AppData\Roaming\multilingual-pa\config.json
macOS: ~/Library/Application Support/multilingual-pa/config.json
Linux: ~/.config/multilingual-pa/config.json
```

**What you can report:**
- Bugs: "The app crashes when I click X"
- Features: "Can you add dark mode?"
- Improvements: "The chat button is too small"
- Questions: "How do I export to PDF?"

---

### 2. ⚙️ Settings Manager

**Location:** Bottom-left floating button OR File > Settings menu

**What it does:**
- Visual interface to configure API keys
- No need to edit `.env` files manually
- Settings persist between app sessions
- Secure password input fields

**Settings you can configure:**

#### 🤖 Google Gemini API Key
- **Required for:** AI processing of meeting transcripts
- **Where to get it:** [Google AI Studio](https://makersuite.google.com/app/apikey)
- **Format:** Long alphanumeric string (e.g., `AIzaSy...`)

#### 🗄️ Supabase URL
- **Required for:** Database storage of meetings
- **Where to get it:** Your Supabase project dashboard
- **Format:** `https://xxxxx.supabase.co`

#### 🔑 Supabase Anon Key
- **Required for:** Database access
- **Where to get it:** Your Supabase project settings > API
- **Format:** Long JWT token (e.g., `eyJhb...`)

**How to use:**
```
1. Click settings button (⚙️) or File > Settings
2. Enter your API keys
3. Click "Save & Restart"
4. App automatically restarts with new settings
```

**Benefits:**
- ✅ Settings are encrypted and stored securely
- ✅ No manual .env file editing needed
- ✅ Settings persist across app updates
- ✅ Easy to change if you rotate API keys

---

### 3. 🐛 Automatic Error Reporting

**What it does:**
- Automatically captures all JavaScript errors
- Logs unhandled promise rejections
- Records crash information
- Saves stack traces for debugging

**Error logs location:**
```
Windows: C:\Users\<YourName>\AppData\Roaming\multilingual-pa\logs\
macOS: ~/Library/Logs/multilingual-pa/
Linux: ~/.config/multilingual-pa/logs/
```

**What's captured:**
- Error message
- Stack trace
- URL where error occurred
- Timestamp
- User agent / system info

**Privacy note:** Only technical error data is logged. No personal information or meeting content is included in error reports.

---

### 4. 🚀 One-Click Launch

**What it does:**
- Starts the Express server automatically
- Opens the application window
- No terminal commands needed
- No browser needed

**How it works:**
```
1. Double-click desktop shortcut
2. App starts Express server in background (port 3000)
3. Loads web interface in Electron window
4. Ready to use in ~2 seconds
```

**Desktop shortcuts created:**
- Start Menu shortcut
- Desktop icon (if selected during installation)

---

### 5. 🎨 Native Desktop Experience

**Features:**
- ✅ Windows taskbar integration
- ✅ Native window controls (minimize, maximize, close)
- ✅ Keyboard shortcuts
- ✅ Fullscreen mode (F11)
- ✅ Developer tools (Ctrl+Shift+I)
- ✅ Zoom controls (Ctrl +/-)
- ✅ Native context menus (right-click)

**Menu bar:**
- **File** → Settings, Quit
- **Edit** → Undo, Redo, Cut, Copy, Paste
- **View** → Reload, Toggle DevTools, Zoom, Fullscreen
- **Help** → About, Send Feedback

---

### 6. 📦 Self-Contained & Portable

**What it means:**
- All dependencies bundled
- No Node.js installation required
- No browser needed
- Runs offline (after initial API calls)

**File size:**
- Installer: ~200MB
- Installed size: ~250MB

**Why so large?**
- Includes Node.js runtime (~50MB)
- Includes Chromium browser (~150MB)
- Includes all npm dependencies (~50MB)

---

## Comparison: Web vs Desktop

| Feature | Web Version | Desktop App |
|---------|-------------|-------------|
| Installation | None | One-time installer |
| Setup | Manual .env editing | Visual settings UI |
| Launch | Terminal + Browser | Desktop icon |
| Feedback | Email/GitHub | In-app chat |
| Error reporting | Manual | Automatic |
| Updates | Git pull | New installer |
| Offline use | No | Partial (no AI) |
| Platform | Any OS with browser | Windows/Mac/Linux |

---

## User Workflow

### First Time Setup

```
1. Run installer (Multilingual PA Setup.exe)
2. Complete installation wizard
3. Launch app from desktop icon
4. Click Settings (⚙️)
5. Enter API keys
6. Click "Save & Restart"
7. Ready to use!
```

### Daily Usage

```
1. Double-click desktop icon
2. Select language
3. Click "Start Recording"
4. Speak into microphone
5. Click "Stop Recording"
6. Wait for AI processing (progress bar shows status)
7. View results
8. Copy to clipboard / Save to database
```

### Sending Feedback

```
1. Click chat button (💬)
2. Type your message
3. Press Enter
4. Done! Message is logged.
```

---

## Technical Details

### Architecture

```
┌─────────────────────────────┐
│   Electron Main Process     │
│  (electron-main.js)         │
│                             │
│  - Manages window           │
│  - Starts Express server    │
│  - Handles settings         │
│  - Logs feedback/errors     │
└──────────┬──────────────────┘
           │
           │ IPC (Inter-Process Communication)
           │
┌──────────▼──────────────────┐
│  Electron Renderer Process  │
│  (Chromium Browser)         │
│                             │
│  - Loads http://localhost:3000 │
│  - Shows UI (index.html)    │
│  - Chat & Settings widgets  │
└──────────┬──────────────────┘
           │
           │ HTTP Requests
           │
┌──────────▼──────────────────┐
│   Express Server            │
│   (server.js)               │
│                             │
│  - API endpoints            │
│  - AI processing            │
│  - Database operations      │
└─────────────────────────────┘
```

### Security

- **Settings encryption:** electron-store uses OS keychain
- **API keys:** Stored securely, never logged
- **IPC security:** contextIsolation enabled
- **No remote code execution:** nodeIntegration disabled

### Data Storage

**Settings:**
```
config.json (encrypted)
├── geminiApiKey
├── supabaseUrl
└── supabaseAnonKey
```

**Feedback:**
```
config.json
└── feedback: [
      { timestamp, type, message, url, userAgent }
    ]
```

**Errors:**
```
logs/main.log
├── Application startup logs
├── Server logs
├── Error stack traces
└── Crash reports
```

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl+R | Reload app |
| Ctrl+Shift+R | Hard reload |
| F11 | Toggle fullscreen |
| Ctrl+Shift+I | Open DevTools |
| Ctrl++ | Zoom in |
| Ctrl+- | Zoom out |
| Ctrl+0 | Reset zoom |
| Ctrl+W | Close window |
| Ctrl+Q | Quit app |

---

## Advanced Features

### Viewing Logs

**Windows:**
```
1. Press Win+R
2. Type: %APPDATA%\multilingual-pa
3. Press Enter
4. Open "logs" folder
```

**What you'll find:**
- `main.log` - Application logs
- `renderer.log` - UI logs (if enabled)

### Clearing All Data

**Via Settings:**
```
File > Settings > Advanced > Clear All Data
```

**This removes:**
- All settings
- Feedback history
- Error logs

**This DOES NOT remove:**
- Meetings stored in Supabase database

### Running Multiple Instances

By default, only one instance can run at a time. To allow multiple:

Edit `electron-main.js`:
```javascript
// Comment out this line:
// app.requestSingleInstanceLock()
```

Then rebuild.

---

## Troubleshooting

### Chat button not showing

**Cause:** Not running in Electron (running in browser instead)

**Solution:** Launch via desktop icon, not by opening index.html in browser

### Settings don't save

**Cause:** App data folder has no write permissions

**Solution:** Run app as administrator once, then normal permissions will work

### App won't start after update

**Cause:** Corrupted settings

**Solution:** Delete app data folder and reconfigure:
```
%APPDATA%\multilingual-pa  (Windows)
```

---

## Future Enhancements

Planned features for future versions:

- 🔄 Auto-update functionality
- 🌙 Dark mode
- 📊 Usage analytics dashboard
- 🔔 Desktop notifications
- 🎤 Audio file import
- 📄 PDF export
- 📧 Email integration
- 📱 Mobile companion app

**Want to request a feature?** Use the in-app chat! (💬)

---

## Support

**For technical issues:**
- Use in-app chat (💬)
- Check logs in `%APPDATA%\multilingual-pa\logs\`
- Create GitHub issue

**For feature requests:**
- Use in-app chat (💬)
- Start a GitHub discussion

**For security issues:**
- Email: [your-email@example.com]
- Do not use public channels

---

**Enjoy using Multilingual PA! 🎉**
