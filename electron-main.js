const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron');
const path = require('path');
const Store = require('electron-store');
const log = require('electron-log');
const { fork } = require('child_process');

// Initialize electron-store for settings
const store = new Store();

// Configure logging
log.transports.file.level = 'info';
log.info('Application starting...');

let mainWindow;
let serverProcess;
let serverPort = 3000;

// Create the main application window
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, 'public', 'icon.png'),
    title: 'Multilingual PA - Meeting Assistant'
  });

  // Create application menu
  const menu = Menu.buildFromTemplate([
    {
      label: 'File',
      submenu: [
        {
          label: 'Settings',
          click: () => mainWindow.webContents.send('open-settings')
        },
        { type: 'separator' },
        { role: 'quit' }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'About Multilingual PA',
              message: 'Multilingual PA - Meeting Assistant',
              detail: 'Version 1.0.0\n\nAI-powered meeting assistant with multilingual support.\n\nBuilt with Electron and Google Gemini AI.'
            });
          }
        },
        {
          label: 'Send Feedback',
          click: () => mainWindow.webContents.send('open-chat')
        }
      ]
    }
  ]);
  Menu.setApplicationMenu(menu);

  // Start the Express server
  startServer();

  // Load the application after server starts
  setTimeout(() => {
    mainWindow.loadURL(`http://localhost:${serverPort}`);
  }, 2000);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Start Express server as a child process
function startServer() {
  try {
    // Set environment variables from store
    const settings = store.get('settings', {});

    process.env.GEMINI_API_KEY = settings.geminiApiKey || '';
    process.env.SUPABASE_URL = settings.supabaseUrl || '';
    process.env.SUPABASE_ANON_KEY = settings.supabaseAnonKey || '';
    process.env.PORT = serverPort;

    // Set database configuration
    const dbConfig = settings.database || { type: 'sqlite' };
    process.env.DB_TYPE = dbConfig.type || 'sqlite';
    process.env.DB_HOST = dbConfig.host || '';
    process.env.DB_NAME = dbConfig.database || '';
    process.env.DB_USER = dbConfig.user || '';
    process.env.DB_PASSWORD = dbConfig.password || '';
    process.env.DB_PATH = dbConfig.path || '';
    process.env.DB_PORT = dbConfig.port ? dbConfig.port.toString() : '';

    log.info(`Database configured: ${dbConfig.type}`);

    // Start server
    serverProcess = fork(path.join(__dirname, 'server.js'), [], {
      env: process.env,
      stdio: 'pipe'
    });

    serverProcess.stdout.on('data', (data) => {
      log.info(`Server: ${data.toString()}`);
    });

    serverProcess.stderr.on('data', (data) => {
      log.error(`Server Error: ${data.toString()}`);
    });

    serverProcess.on('exit', (code) => {
      log.info(`Server exited with code ${code}`);
    });

    log.info('Express server started successfully');
  } catch (error) {
    log.error('Failed to start server:', error);
    dialog.showErrorBox('Server Error', `Failed to start server: ${error.message}`);
  }
}

// App ready
app.whenReady().then(() => {
  // Check if settings exist
  const settings = store.get('settings', {});

  if (!settings.geminiApiKey) {
    // Show settings dialog first
    dialog.showMessageBox({
      type: 'info',
      title: 'Welcome to Multilingual PA',
      message: 'First Time Setup',
      detail: 'Please configure your Gemini API key in Settings (File > Settings) before using the application.\n\nDatabase will use SQLite by default (zero setup required).'
    });
  }

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    if (serverProcess) {
      serverProcess.kill();
    }
    app.quit();
  }
});

// Handle app quit
app.on('will-quit', () => {
  if (serverProcess) {
    serverProcess.kill();
  }
});

// IPC Handlers

// Get settings
ipcMain.handle('get-settings', async () => {
  return store.get('settings', {
    geminiApiKey: '',
    supabaseUrl: '',
    supabaseAnonKey: ''
  });
});

// Save settings
ipcMain.handle('save-settings', async (event, settings) => {
  try {
    store.set('settings', settings);
    log.info('Settings saved successfully');

    // Show restart dialog
    const result = await dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Settings Saved',
      message: 'Settings have been saved successfully.',
      detail: 'The application needs to restart for changes to take effect.',
      buttons: ['Restart Now', 'Restart Later'],
      defaultId: 0
    });

    if (result.response === 0) {
      app.relaunch();
      app.quit();
    }

    return { success: true };
  } catch (error) {
    log.error('Failed to save settings:', error);
    return { success: false, error: error.message };
  }
});

// Save feedback/chat message
ipcMain.handle('send-feedback', async (event, feedback) => {
  try {
    // Save feedback to log file
    log.info('User Feedback:', JSON.stringify(feedback, null, 2));

    // Save to store for history
    const feedbackHistory = store.get('feedback', []);
    feedbackHistory.push({
      ...feedback,
      timestamp: new Date().toISOString()
    });
    store.set('feedback', feedbackHistory);

    return {
      success: true,
      message: 'Thank you for your feedback! It has been logged and will be reviewed to improve the application.'
    };
  } catch (error) {
    log.error('Failed to save feedback:', error);
    return { success: false, error: error.message };
  }
});

// Get feedback history
ipcMain.handle('get-feedback-history', async () => {
  return store.get('feedback', []);
});

// Create GitHub issue with auto-fix
ipcMain.handle('create-github-issue', async (event, issueData) => {
  try {
    const settings = store.get('settings', {});
    const githubToken = settings.githubToken;
    const githubRepo = settings.githubRepo || 'proteaNirav/multilingual-pa';

    if (!githubToken) {
      throw new Error('GitHub token not configured. Please add it in Settings.');
    }

    log.info('Creating GitHub issue:', issueData.title);

    // Create issue via GitHub REST API
    const https = require('https');
    const url = new URL(`https://api.github.com/repos/${githubRepo}/issues`);

    const issueBody = `
## Issue Description

${issueData.body}

---

## System Information

- **App Version:** ${issueData.appVersion}
- **User Agent:** ${issueData.userAgent}
- **Platform:** ${process.platform}
- **Reported via:** Desktop App

---

**Note:** This issue was automatically created by the user via the desktop app. The auto-fix bot will now analyze and attempt to resolve this issue.
`;

    const postData = JSON.stringify({
      title: issueData.title,
      body: issueBody,
      labels: ['auto-fix', issueData.type === 'bug' ? 'bug' : 'enhancement', 'user-reported']
    });

    return new Promise((resolve, reject) => {
      const options = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': postData.length,
          'Authorization': `token ${githubToken}`,
          'User-Agent': 'Multilingual-PA-Desktop',
          'Accept': 'application/vnd.github.v3+json'
        }
      };

      const req = https.request(url, options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          if (res.statusCode === 201) {
            const issue = JSON.parse(data);
            log.info('GitHub issue created successfully:', issue.number);
            resolve({
              success: true,
              issueNumber: issue.number,
              issueUrl: issue.html_url
            });
          } else {
            log.error('GitHub API error:', res.statusCode, data);
            reject(new Error(`GitHub API returned ${res.statusCode}: ${data}`));
          }
        });
      });

      req.on('error', (error) => {
        log.error('Failed to create GitHub issue:', error);
        reject(error);
      });

      req.write(postData);
      req.end();
    });

  } catch (error) {
    log.error('Failed to create GitHub issue:', error);
    return { success: false, error: error.message };
  }
});

// Report error
ipcMain.handle('report-error', async (event, errorData) => {
  try {
    log.error('Application Error:', JSON.stringify(errorData, null, 2));

    // Save to error log
    const errorHistory = store.get('errors', []);
    errorHistory.push({
      ...errorData,
      timestamp: new Date().toISOString()
    });
    store.set('errors', errorHistory);

    return { success: true };
  } catch (error) {
    log.error('Failed to log error:', error);
    return { success: false };
  }
});

// Get app info
ipcMain.handle('get-app-info', async () => {
  return {
    version: app.getVersion(),
    name: app.getName(),
    platform: process.platform,
    electronVersion: process.versions.electron,
    nodeVersion: process.versions.node
  };
});

// Clear all data
ipcMain.handle('clear-data', async () => {
  try {
    const result = await dialog.showMessageBox(mainWindow, {
      type: 'warning',
      title: 'Clear All Data',
      message: 'Are you sure you want to clear all application data?',
      detail: 'This will remove all settings, feedback history, and error logs. This action cannot be undone.',
      buttons: ['Cancel', 'Clear Data'],
      defaultId: 0,
      cancelId: 0
    });

    if (result.response === 1) {
      store.clear();
      log.info('All application data cleared');
      return { success: true, message: 'All data cleared successfully' };
    }

    return { success: false, message: 'Operation cancelled' };
  } catch (error) {
    log.error('Failed to clear data:', error);
    return { success: false, error: error.message };
  }
});

// Restart app (used by UI Health Monitor for auto-recovery)
ipcMain.handle('restart-app', async () => {
  try {
    log.info('App restart requested by UI Health Monitor');
    app.relaunch();
    app.quit();
    return { success: true };
  } catch (error) {
    log.error('Failed to restart app:', error);
    return { success: false, error: error.message };
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  log.error('Uncaught Exception:', error);
  dialog.showErrorBox('Application Error', `An unexpected error occurred: ${error.message}`);
});

process.on('unhandledRejection', (reason, promise) => {
  log.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
