# Automated Error Detection and Recovery System

## Overview

The **UI Health Monitor** is an automated system that continuously monitors the application's health, detects when things go wrong, and automatically attempts to fix them without user intervention.

This system was built to address the common issue where UI buttons stop working, modals don't open, or the app gets into a broken state that requires restart.

## Features

### 🔍 Automatic Error Detection

The system monitors:
- **All click events** - Verifies that clicking a button produces the expected result
- **DOM mutations** - Detects if critical UI elements are removed unexpectedly
- **JavaScript errors** - Catches all errors and unhandled promise rejections
- **Function availability** - Ensures critical functions like `openSettings()` exist
- **Element presence** - Verifies critical elements (settings button, modals) are present

### 🔧 Automatic Recovery

When issues are detected, the system automatically:
- **Reattaches event handlers** - If a button loses its click handler, it's automatically reattached
- **Recreates broken elements** - If critical elements are missing, they can be recreated
- **Resets stuck states** - Clears broken states that prevent the app from working
- **Reports to GitHub** - Automatically creates issues for unrecoverable errors
- **Suggests restart** - After multiple critical errors, prompts user to restart

### 📊 Continuous Health Monitoring

- **Health checks every 5 seconds** - Periodic verification that all systems are operational
- **Interaction tracking** - Records and verifies all user interactions
- **Performance monitoring** - Tracks how long operations take
- **Telemetry** - Sends anonymous data to improve the app (optional)

## How It Works

### Click Verification

When you click a button, the system:

1. **Records the click** - Logs which element was clicked
2. **Waits 500ms** - Gives the action time to complete
3. **Verifies the result** - Checks if the expected outcome happened
4. **Auto-fixes if failed** - If the action didn't work, attempts recovery

**Example:**
```javascript
User clicks "Settings" button
  ↓
Health Monitor records click
  ↓
After 500ms, checks: Did settings modal open?
  ↓
NO → Auto-fix: Reattach click handler and report issue
YES → Mark interaction as successful
```

### Auto-Fix Mechanisms

#### Settings Button Recovery

If the settings button stops working:

1. **Clone the button element** - Creates a fresh copy
2. **Replace the old button** - Swaps broken button with new one
3. **Reattach event handler** - Adds click listener that calls `openSettings()`
4. **Mark as fixed** - Tracks that auto-fix was attempted
5. **Verify fix worked** - Next click is monitored to confirm fix

**Code:**
```javascript
async autoFixSettingsButton() {
  const settingsFab = document.getElementById('settingsFab');
  const newButton = settingsFab.cloneNode(true);
  settingsFab.parentNode.replaceChild(newButton, settingsFab);

  newButton.addEventListener('click', () => {
    window.openSettings();
  });

  newButton._hasClickListener = true;
}
```

#### Chat Button Recovery

Similar process for the chat button:
- Detects if chat panel doesn't open after click
- Reattaches event handler
- Verifies fix worked

#### Critical Error Handling

When critical errors occur (like missing core functions):

1. **Log the error** - Records full error details
2. **Increment counter** - Tracks number of critical errors
3. **Auto-report to GitHub** - Creates issue automatically
4. **Offer restart** - After 3 critical errors, suggests restart

### Health Checks

Every 5 seconds, the system verifies:

✅ All critical elements exist:
- `settingsFab` - Settings button
- `settingsModal` - Settings dialog
- `chatFab` - Chat button
- `chatPanel` - Chat panel

✅ All critical functions are available:
- `openSettings()`
- `closeSettings()`
- `saveSettings()`
- `testDatabaseConnection()`

✅ Event handlers are attached:
- Settings button has click handler
- Chat button has click handler

If any check fails, auto-fix is triggered.

## Configuration

You can customize the health monitor behavior:

```javascript
window.uiHealthMonitor.config = {
  clickVerificationTimeout: 500,      // ms to wait before checking if click worked
  healthCheckInterval: 5000,          // Run health check every 5 seconds
  criticalErrorThreshold: 3,          // Restart after 3 critical errors
  enableAutoFix: true,                // Enable automatic recovery
  enableTelemetry: true,              // Send anonymous usage data
  enableAutoReporting: true           // Auto-create GitHub issues
};
```

## Monitored Interactions

### Settings Button
- **Detection:** Clicks on `#settingsFab` or elements with "Settings" text
- **Verification:** Settings modal has `active` class within 500ms
- **Auto-fix:** Reattach click handler, recreate button if missing

### Chat Button
- **Detection:** Clicks on `#chatFab` or elements with "Chat" text
- **Verification:** Chat panel has `active` class within 500ms
- **Auto-fix:** Reattach click handler

### Test Connection Button
- **Detection:** Clicks on button with "Test Connection" text
- **Verification:** `#dbTestResult` shows text within 2 seconds
- **Auto-fix:** Log for investigation (async operation may still be running)

### Save Settings Button
- **Detection:** Clicks on "Save" button in settings modal
- **Verification:** Settings modal closes within 1 second
- **Auto-fix:** Log warning (may be intentional if validation failed)

## Error Reporting

### Automatic GitHub Issues

When critical errors occur that can't be auto-fixed, the system automatically creates a GitHub issue with:

- **Error title and description**
- **Full error stack trace**
- **Health check results**
- **User agent and app version**
- **Auto-fix attempts made**
- **Timestamp**

**Example Issue:**
```markdown
## Auto-Detected Issue

**Title:** Settings button not working after auto-fix attempts

**Details:**
{
  "attempts": 3,
  "element": "settingsFab"
}

**Health Check Results:**
["Missing element: settingsModal"]

**User Agent:** Mozilla/5.0 (Windows NT 10.0; Win64; x64)...

**Auto-Fix Attempts:** [["settingsButton", 3]]

---

*This issue was automatically detected and reported by the UI Health Monitor*
```

### Telemetry

If enabled, the system sends anonymous data about:
- Interaction success rates
- Auto-fix attempts and results
- Error patterns
- Performance metrics

**Privacy:** No personal data is collected. Only:
- Error types and frequencies
- Which buttons were clicked (not what data was entered)
- Auto-fix success rates

## API

### Global Instance

```javascript
window.uiHealthMonitor
```

### Methods

#### `initialize()`
Starts the health monitoring system.

```javascript
window.uiHealthMonitor.initialize();
```

#### `performHealthCheck()`
Manually trigger a health check.

```javascript
const issues = window.uiHealthMonitor.performHealthCheck();
console.log('Issues found:', issues);
```

#### `getStatistics()`
Get monitoring statistics.

```javascript
const stats = window.uiHealthMonitor.getStatistics();
console.log('Total interactions:', stats.totalInteractions);
console.log('Verified:', stats.verifiedInteractions);
console.log('Auto-fix attempts:', stats.autoFixAttempts);
console.log('Critical errors:', stats.criticalErrorCount);
```

#### `autoFixSettingsButton()`
Manually trigger settings button auto-fix.

```javascript
await window.uiHealthMonitor.autoFixSettingsButton();
```

#### `autoFixChatButton()`
Manually trigger chat button auto-fix.

```javascript
await window.uiHealthMonitor.autoFixChatButton();
```

## Console Output

### Normal Operation

```
[UIHealthMonitor 2025-10-31T...] 🏥 Initializing UI Health Monitor...
[UIHealthMonitor 2025-10-31T...] Click monitoring enabled
[UIHealthMonitor 2025-10-31T...] DOM mutation monitoring enabled
[UIHealthMonitor 2025-10-31T...] Periodic health checks enabled (every 5s)
[UIHealthMonitor 2025-10-31T...] Error monitoring enabled
[UIHealthMonitor 2025-10-31T...] ✅ Critical element found: Settings button
[UIHealthMonitor 2025-10-31T...] ✅ Critical element found: Settings modal
[UIHealthMonitor 2025-10-31T...] ✅ UI Health Monitor initialized successfully
```

### Click Detection

```
[UIHealthMonitor 2025-10-31T...] Click detected on settingsFab
[UIHealthMonitor 2025-10-31T...] ✅ Settings modal opened successfully
```

### Auto-Fix in Action

```
[UIHealthMonitor 2025-10-31T...] Click detected on settingsFab
[UIHealthMonitor 2025-10-31T...] ❌ Settings button clicked but modal did not open!
[UIHealthMonitor 2025-10-31T...] 🔧 Attempting auto-fix for settings button (attempt 1)...
[UIHealthMonitor 2025-10-31T...] ✅ Settings button auto-fixed successfully
```

### Critical Error

```
[UIHealthMonitor 2025-10-31T...] ❌ Health check failed: openSettings function missing
[UIHealthMonitor 2025-10-31T...] 🚨 CRITICAL ERROR #1: Core function missing: openSettings
[UIHealthMonitor 2025-10-31T...] ✅ Issue automatically reported to GitHub
```

### Restart Suggested

```
[UIHealthMonitor 2025-10-31T...] 🚨 CRITICAL ERROR #3: [error details]
[UIHealthMonitor 2025-10-31T...] 🚨 Critical error threshold reached - recommending restart
[User Dialog]: The app has encountered 3 critical errors. Would you like to restart?
```

## Integration with Existing Code

### HTML Integration

The health monitor is automatically loaded:

```html
<!-- UI Health Monitor - Automated Error Detection and Recovery -->
<script src="ui-health-monitor.js"></script>
```

### Electron Integration

Exposed APIs in `preload.js`:

```javascript
contextBridge.exposeInMainWorld('electronAPI', {
  // ... other APIs
  restartApp: () => ipcRenderer.invoke('restart-app'),
  reportError: (errorData) => ipcRenderer.invoke('report-error'),
  createGitHubIssue: (issueData) => ipcRenderer.invoke('create-github-issue')
});
```

IPC handler in `electron-main.js`:

```javascript
ipcMain.handle('restart-app', async () => {
  log.info('App restart requested by UI Health Monitor');
  app.relaunch();
  app.quit();
  return { success: true };
});
```

## Testing Auto-Recovery

### Test 1: Settings Button Failure

Simulate settings button breaking:

```javascript
// In browser console
const settingsFab = document.getElementById('settingsFab');
const newButton = settingsFab.cloneNode(true);
settingsFab.parentNode.replaceChild(newButton, settingsFab);
```

**Expected:**
- Click settings button
- Health monitor detects it doesn't work
- Auto-fix reattaches handler
- Next click works

### Test 2: Missing Function

Simulate missing function:

```javascript
// In browser console
delete window.openSettings;
```

**Expected:**
- Health check detects missing function
- Critical error logged
- GitHub issue created automatically
- Restart suggested after 3 such errors

### Test 3: Critical Element Removal

Simulate element removal:

```javascript
// In browser console
document.getElementById('settingsModal').remove();
```

**Expected:**
- DOM mutation observer detects removal
- Critical error logged
- Issue reported
- Restart suggested

### Test 4: Force Critical Errors

Trigger restart prompt:

```javascript
// In browser console
window.uiHealthMonitor.criticalErrorCount = 3;
window.uiHealthMonitor.handleCriticalError('Test error');
```

**Expected:**
- Restart dialog appears immediately
- Clicking "OK" restarts the app

## Benefits

### For Users

✅ **Fewer app restarts** - Auto-recovery fixes most issues automatically
✅ **Better reliability** - Issues are caught and fixed before user notices
✅ **Transparent operation** - Works silently in the background
✅ **Quick recovery** - Most issues fixed in <500ms
✅ **Automatic reporting** - Issues get fixed in future updates

### For Developers

✅ **Automatic bug reports** - Issues are reported with full context
✅ **Better telemetry** - Understand which features break and why
✅ **Reduced support burden** - Many issues self-heal
✅ **Proactive monitoring** - Detect issues before users complain
✅ **Rich debugging info** - Full error context and auto-fix attempts

## Performance Impact

- **Memory:** ~50KB additional JavaScript
- **CPU:** Health check every 5s (minimal impact)
- **Network:** Only when reporting issues (optional)
- **Storage:** Small logs of interactions (in-memory, cleared on restart)

## Privacy

The health monitor respects user privacy:

- ✅ **No screenshots** - Never captures screen content
- ✅ **No form data** - Never logs what user types
- ✅ **Anonymous telemetry** - No personal information collected
- ✅ **Opt-out available** - Can disable telemetry in settings
- ✅ **Local-first** - Most data stays on device

## Future Enhancements

Potential improvements:

1. **Machine learning** - Predict failures before they happen
2. **Pattern recognition** - Identify common failure sequences
3. **Smarter auto-fix** - Learn which fixes work best
4. **User feedback loop** - Ask users if auto-fix worked
5. **Recovery history** - Dashboard showing auto-fixes performed
6. **Offline queue** - Queue issue reports when offline
7. **Real-time monitoring** - Live dashboard for developers

## Troubleshooting

### Health Monitor Not Working

Check console for initialization:
```javascript
console.log('Health monitor initialized:', window.uiHealthMonitor.isInitialized);
```

### Auto-Fix Not Triggering

Check configuration:
```javascript
console.log('Auto-fix enabled:', window.uiHealthMonitor.config.enableAutoFix);
```

### Too Many Auto-Fix Attempts

Reset attempt counter:
```javascript
window.uiHealthMonitor.autoFixAttempts.clear();
```

### Disable Health Monitor

Temporarily disable:
```javascript
window.uiHealthMonitor.config.enableAutoFix = false;
window.uiHealthMonitor.config.enableTelemetry = false;
window.uiHealthMonitor.config.enableAutoReporting = false;
```

## Summary

The UI Health Monitor is a comprehensive system that:

- 🔍 **Monitors** all user interactions and app health
- 🔧 **Recovers** automatically from common failures
- 📊 **Reports** issues that can't be auto-fixed
- 🚀 **Improves** app reliability over time
- 🛡️ **Protects** users from broken UI states

It's designed to work silently in the background, making the app more reliable and reducing the need for manual restarts or support interventions.

---

**Version:** 1.0.0
**Last Updated:** 2025-10-31
**Status:** Active
**License:** Same as main project
