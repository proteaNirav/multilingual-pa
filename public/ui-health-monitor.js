/**
 * UI Health Monitor - Automated Error Detection and Recovery System
 *
 * This system automatically:
 * - Monitors all UI interactions (clicks, inputs, etc.)
 * - Detects when expected actions don't happen
 * - Attempts automatic recovery
 * - Reports issues to GitHub if auto-fix fails
 * - Provides telemetry for app improvement
 */

class UIHealthMonitor {
  constructor() {
    this.isElectron = typeof window.electronAPI !== 'undefined';
    this.interactions = new Map(); // Track all interactions
    this.healthChecks = new Map(); // Scheduled health checks
    this.autoFixAttempts = new Map(); // Track fix attempts
    this.maxAutoFixAttempts = 3;
    this.issuesReported = new Set(); // Prevent duplicate reports

    // Configuration
    this.config = {
      clickVerificationTimeout: 500, // ms to wait before verifying click worked
      healthCheckInterval: 5000, // Check UI health every 5 seconds
      criticalErrorThreshold: 3, // Auto-restart after 3 critical errors
      enableAutoFix: true,
      enableTelemetry: true,
      enableAutoReporting: true
    };

    this.criticalErrorCount = 0;
    this.isInitialized = false;

    this.log('UI Health Monitor created');
  }

  /**
   * Initialize the health monitoring system
   */
  initialize() {
    if (this.isInitialized) {
      this.log('Already initialized');
      return;
    }

    this.log('🏥 Initializing UI Health Monitor...');

    // Monitor all clicks
    this.monitorClicks();

    // Monitor DOM mutations
    this.monitorDOMMutations();

    // Periodic health checks
    this.startHealthChecks();

    // Monitor errors
    this.monitorErrors();

    // Verify critical elements exist
    this.verifyCriticalElements();

    this.isInitialized = true;
    this.log('✅ UI Health Monitor initialized successfully');
  }

  /**
   * Monitor all click events and verify they work
   */
  monitorClicks() {
    document.addEventListener('click', async (event) => {
      const target = event.target;
      const elementInfo = this.getElementInfo(target);

      this.log(`Click detected on ${elementInfo.description}`);

      // Record the interaction
      const interactionId = Date.now() + Math.random();
      this.interactions.set(interactionId, {
        type: 'click',
        target: elementInfo,
        timestamp: Date.now(),
        verified: false
      });

      // Verify the click worked after a short delay
      setTimeout(() => {
        this.verifyClickWorked(interactionId, target, elementInfo);
      }, this.config.clickVerificationTimeout);
    }, true); // Use capture to catch all clicks

    this.log('Click monitoring enabled');
  }

  /**
   * Verify that a click event produced the expected result
   */
  async verifyClickWorked(interactionId, target, elementInfo) {
    const interaction = this.interactions.get(interactionId);
    if (!interaction) return;

    // Check if it's a button we care about
    if (elementInfo.id === 'settingsFab' || elementInfo.description.includes('Settings')) {
      // Verify settings modal opened
      const modal = document.getElementById('settingsModal');
      if (!modal || !modal.classList.contains('active')) {
        this.log('❌ Settings button clicked but modal did not open!', 'error');
        await this.autoFixSettingsButton();
      } else {
        this.log('✅ Settings modal opened successfully');
        interaction.verified = true;
      }
    }

    else if (elementInfo.id === 'chatFab' || elementInfo.description.includes('Chat')) {
      const chatPanel = document.getElementById('chatPanel');
      if (!chatPanel || !chatPanel.classList.contains('active')) {
        this.log('❌ Chat button clicked but panel did not open!', 'error');
        await this.autoFixChatButton();
      } else {
        this.log('✅ Chat panel opened successfully');
        interaction.verified = true;
      }
    }

    else if (elementInfo.description.includes('Test Connection')) {
      // Verify test result appears
      setTimeout(() => {
        const resultEl = document.getElementById('dbTestResult');
        if (!resultEl || resultEl.textContent === '') {
          this.log('❌ Test connection clicked but no result shown!', 'error');
          this.autoFixTestConnection();
        } else {
          this.log('✅ Test connection executed successfully');
          interaction.verified = true;
        }
      }, 2000); // Give it 2s for async operation
    }

    else if (elementInfo.description.includes('Save') && elementInfo.description.includes('Settings')) {
      // Verify settings were saved
      setTimeout(() => {
        const modal = document.getElementById('settingsModal');
        if (modal && modal.classList.contains('active')) {
          this.log('❌ Save button clicked but modal still open (save may have failed)', 'warn');
          // This might be intentional if validation failed
        } else {
          this.log('✅ Settings saved and modal closed');
          interaction.verified = true;
        }
      }, 1000);
    }
  }

  /**
   * Get information about a DOM element
   */
  getElementInfo(element) {
    return {
      id: element.id || '',
      className: element.className || '',
      tagName: element.tagName || '',
      text: element.textContent?.substring(0, 50) || '',
      description: element.id || element.className || element.tagName || 'unknown'
    };
  }

  /**
   * Monitor DOM mutations to detect if elements disappear unexpectedly
   */
  monitorDOMMutations() {
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        // Check if critical elements were removed
        if (mutation.type === 'childList' && mutation.removedNodes.length > 0) {
          for (const node of mutation.removedNodes) {
            if (node.id === 'settingsModal' || node.id === 'settingsFab') {
              this.log('❌ Critical element removed from DOM: ' + node.id, 'error');
              this.handleCriticalError('Critical UI element removed: ' + node.id);
            }
          }
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    this.log('DOM mutation monitoring enabled');
  }

  /**
   * Start periodic health checks
   */
  startHealthChecks() {
    setInterval(() => {
      this.performHealthCheck();
    }, this.config.healthCheckInterval);

    this.log('Periodic health checks enabled (every 5s)');
  }

  /**
   * Perform a comprehensive health check
   */
  performHealthCheck() {
    const issues = [];

    // Check critical elements exist
    const criticalElements = [
      'settingsFab',
      'settingsModal',
      'chatFab',
      'chatPanel'
    ];

    for (const elementId of criticalElements) {
      const element = document.getElementById(elementId);
      if (!element) {
        issues.push(`Missing element: ${elementId}`);
        this.log(`❌ Health check failed: ${elementId} is missing`, 'error');
      }
    }

    // Check if settings button has event handler
    const settingsFab = document.getElementById('settingsFab');
    if (settingsFab) {
      const hasClickHandler = settingsFab.onclick !== null ||
                             this.hasEventListener(settingsFab, 'click');
      if (!hasClickHandler) {
        issues.push('Settings button has no click handler');
        this.log('❌ Health check failed: Settings button has no click handler', 'error');
        this.autoFixSettingsButton();
      }
    }

    // Check if functions are accessible
    if (typeof window.openSettings !== 'function') {
      issues.push('openSettings function is not defined');
      this.log('❌ Health check failed: openSettings function missing', 'error');
    }

    if (typeof window.closeSettings !== 'function') {
      issues.push('closeSettings function is not defined');
      this.log('❌ Health check failed: closeSettings function missing', 'error');
    }

    if (issues.length === 0) {
      // Periodic success log (every 10 checks)
      if (Math.random() < 0.1) {
        this.log('✅ Health check passed - all systems operational');
      }
    } else {
      this.log(`⚠️ Health check found ${issues.length} issues`, 'warn');

      // Attempt auto-fix if enabled
      if (this.config.enableAutoFix) {
        this.attemptAutoFix(issues);
      }
    }

    return issues;
  }

  /**
   * Check if an element has an event listener
   */
  hasEventListener(element, eventType) {
    // This is a heuristic - we can't directly check for listeners
    // but we can check if the element was created with an addEventListener
    return element._hasClickListener === true;
  }

  /**
   * Monitor errors
   */
  monitorErrors() {
    window.addEventListener('error', (event) => {
      this.log(`❌ Error caught: ${event.message} at ${event.filename}:${event.lineno}`, 'error');
      this.handleError({
        type: 'error',
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.log(`❌ Unhandled promise rejection: ${event.reason}`, 'error');
      this.handleError({
        type: 'unhandledRejection',
        message: event.reason?.message || 'Unhandled promise rejection',
        stack: event.reason?.stack
      });
    });

    this.log('Error monitoring enabled');
  }

  /**
   * Verify critical elements exist on page load
   */
  verifyCriticalElements() {
    const criticalElements = {
      'settingsFab': 'Settings button',
      'settingsModal': 'Settings modal',
      'chatFab': 'Chat button',
      'chatPanel': 'Chat panel'
    };

    let allPresent = true;

    for (const [id, description] of Object.entries(criticalElements)) {
      const element = document.getElementById(id);
      if (!element) {
        this.log(`❌ Critical element missing: ${description} (${id})`, 'error');
        allPresent = false;
      } else {
        this.log(`✅ Critical element found: ${description}`);
      }
    }

    if (!allPresent) {
      this.handleCriticalError('Some critical UI elements are missing on page load');
    }

    return allPresent;
  }

  /**
   * AUTO-FIX: Repair settings button
   */
  async autoFixSettingsButton() {
    const attemptKey = 'settingsButton';
    const attempts = this.autoFixAttempts.get(attemptKey) || 0;

    if (attempts >= this.maxAutoFixAttempts) {
      this.log(`❌ Auto-fix failed after ${attempts} attempts - giving up`, 'error');
      await this.reportIssue('Settings button not working after auto-fix attempts', {
        attempts,
        element: 'settingsFab'
      });
      return false;
    }

    this.log(`🔧 Attempting auto-fix for settings button (attempt ${attempts + 1})...`);
    this.autoFixAttempts.set(attemptKey, attempts + 1);

    try {
      const settingsFab = document.getElementById('settingsFab');

      if (!settingsFab) {
        this.log('❌ Settings button element not found - cannot fix', 'error');
        return false;
      }

      // Remove old handlers
      const newButton = settingsFab.cloneNode(true);
      settingsFab.parentNode.replaceChild(newButton, settingsFab);

      // Reattach click handler
      newButton.addEventListener('click', () => {
        this.log('Settings button clicked via auto-fixed handler');
        if (typeof window.openSettings === 'function') {
          window.openSettings();
        } else {
          this.log('❌ openSettings function not found!', 'error');
        }
      });

      // Mark that it has listener
      newButton._hasClickListener = true;

      this.log('✅ Settings button auto-fixed successfully');

      // Reset attempt counter on success
      this.autoFixAttempts.set(attemptKey, 0);

      return true;
    } catch (error) {
      this.log(`❌ Auto-fix failed: ${error.message}`, 'error');
      return false;
    }
  }

  /**
   * AUTO-FIX: Repair chat button
   */
  async autoFixChatButton() {
    this.log('🔧 Attempting auto-fix for chat button...');

    try {
      const chatFab = document.getElementById('chatFab');

      if (!chatFab) {
        this.log('❌ Chat button element not found - cannot fix', 'error');
        return false;
      }

      const newButton = chatFab.cloneNode(true);
      chatFab.parentNode.replaceChild(newButton, chatFab);

      newButton.addEventListener('click', () => {
        this.log('Chat button clicked via auto-fixed handler');
        const chatPanel = document.getElementById('chatPanel');
        if (chatPanel) {
          chatPanel.classList.add('active');
        }
      });

      newButton._hasClickListener = true;

      this.log('✅ Chat button auto-fixed successfully');
      return true;
    } catch (error) {
      this.log(`❌ Auto-fix failed: ${error.message}`, 'error');
      return false;
    }
  }

  /**
   * AUTO-FIX: Repair test connection functionality
   */
  autoFixTestConnection() {
    this.log('🔧 Test connection appears broken - logging for investigation');
    // The function might still be running, just slow
    // We'll log this for telemetry but not auto-fix aggressively
  }

  /**
   * Attempt to auto-fix detected issues
   */
  async attemptAutoFix(issues) {
    this.log(`🔧 Attempting auto-fix for ${issues.length} issues...`);

    for (const issue of issues) {
      if (issue.includes('Settings button')) {
        await this.autoFixSettingsButton();
      }

      if (issue.includes('openSettings function')) {
        // Can't auto-fix missing functions - this is a serious error
        this.handleCriticalError('Core function missing: openSettings');
      }
    }
  }

  /**
   * Handle errors
   */
  async handleError(errorData) {
    // Check if error is critical
    const isCritical = this.isCriticalError(errorData);

    if (isCritical) {
      this.handleCriticalError(errorData.message, errorData);
    }

    // Report to telemetry
    if (this.config.enableTelemetry && this.isElectron) {
      try {
        await window.electronAPI.reportError(errorData);
      } catch (e) {
        this.log('Failed to send error telemetry', 'warn');
      }
    }
  }

  /**
   * Check if error is critical
   */
  isCriticalError(errorData) {
    const criticalPatterns = [
      'openSettings is not a function',
      'closeSettings is not a function',
      'Cannot read property.*settingsModal',
      'settingsModal is null',
      'critical.*missing'
    ];

    const message = errorData.message || '';
    return criticalPatterns.some(pattern => new RegExp(pattern, 'i').test(message));
  }

  /**
   * Handle critical errors
   */
  async handleCriticalError(message, details = {}) {
    this.criticalErrorCount++;
    this.log(`🚨 CRITICAL ERROR #${this.criticalErrorCount}: ${message}`, 'error');

    // Auto-report to GitHub if enabled and this is new
    if (this.config.enableAutoReporting && this.isElectron) {
      await this.reportIssue(message, details);
    }

    // If too many critical errors, suggest restart
    if (this.criticalErrorCount >= this.config.criticalErrorThreshold) {
      this.log('🚨 Critical error threshold reached - recommending restart', 'error');

      if (this.isElectron) {
        const shouldRestart = confirm(
          `The app has encountered ${this.criticalErrorCount} critical errors.\n\n` +
          `Would you like to restart the app to recover?\n\n` +
          `(A bug report has been automatically created)`
        );

        if (shouldRestart) {
          window.electronAPI.restartApp();
        }
      }
    }
  }

  /**
   * Report issue to GitHub automatically
   */
  async reportIssue(title, details = {}) {
    // Prevent duplicate reports
    const issueKey = title.substring(0, 50);
    if (this.issuesReported.has(issueKey)) {
      this.log('Issue already reported, skipping duplicate');
      return;
    }

    if (!this.isElectron || !this.config.enableAutoReporting) {
      this.log('Auto-reporting disabled or not in Electron');
      return;
    }

    try {
      this.issuesReported.add(issueKey);

      const issueBody = `
## Auto-Detected Issue

**Title:** ${title}

**Details:**
${JSON.stringify(details, null, 2)}

**Health Check Results:**
${JSON.stringify(this.performHealthCheck(), null, 2)}

**User Agent:** ${navigator.userAgent}

**Timestamp:** ${new Date().toISOString()}

**Auto-Fix Attempts:** ${this.autoFixAttempts.size > 0 ? Array.from(this.autoFixAttempts.entries()) : 'None'}

---

*This issue was automatically detected and reported by the UI Health Monitor*
      `;

      await window.electronAPI.createGitHubIssue({
        title: `[Auto-Detected] ${title}`,
        body: issueBody,
        type: 'bug',
        labels: ['auto-detected', 'ui-health-monitor'],
        userAgent: navigator.userAgent,
        appVersion: await window.electronAPI.getAppInfo().then(info => info.version)
      });

      this.log('✅ Issue automatically reported to GitHub');
    } catch (error) {
      this.log(`❌ Failed to auto-report issue: ${error.message}`, 'error');
    }
  }

  /**
   * Log messages with timestamp
   */
  log(message, level = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = `[UIHealthMonitor ${timestamp}]`;

    switch (level) {
      case 'error':
        console.error(prefix, message);
        break;
      case 'warn':
        console.warn(prefix, message);
        break;
      default:
        console.log(prefix, message);
    }
  }

  /**
   * Get statistics about health monitoring
   */
  getStatistics() {
    return {
      totalInteractions: this.interactions.size,
      verifiedInteractions: Array.from(this.interactions.values()).filter(i => i.verified).length,
      autoFixAttempts: Array.from(this.autoFixAttempts.entries()),
      criticalErrorCount: this.criticalErrorCount,
      issuesReported: Array.from(this.issuesReported)
    };
  }
}

// Create global instance
window.uiHealthMonitor = new UIHealthMonitor();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.uiHealthMonitor.initialize();
  });
} else {
  window.uiHealthMonitor.initialize();
}

console.log('✅ UI Health Monitor script loaded');
