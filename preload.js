const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Settings
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),

  // Feedback & Chat
  sendFeedback: (feedback) => ipcRenderer.invoke('send-feedback', feedback),
  getFeedbackHistory: () => ipcRenderer.invoke('get-feedback-history'),

  // GitHub Integration
  createGitHubIssue: (issueData) => ipcRenderer.invoke('create-github-issue', issueData),

  // Error reporting
  reportError: (errorData) => ipcRenderer.invoke('report-error', errorData),

  // App info
  getAppInfo: () => ipcRenderer.invoke('get-app-info'),

  // Clear data
  clearData: () => ipcRenderer.invoke('clear-data'),

  // Listen for events from main process
  onOpenSettings: (callback) => ipcRenderer.on('open-settings', callback),
  onOpenChat: (callback) => ipcRenderer.on('open-chat', callback)
});

// Auto error reporting - catch and report all errors
window.addEventListener('error', (event) => {
  ipcRenderer.invoke('report-error', {
    type: 'error',
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    stack: event.error?.stack
  });
});

window.addEventListener('unhandledrejection', (event) => {
  ipcRenderer.invoke('report-error', {
    type: 'unhandledRejection',
    message: event.reason?.message || 'Unhandled promise rejection',
    stack: event.reason?.stack
  });
});

console.log('Electron preload script loaded successfully');
