# 🤖 Automated Issue Fix System

## Overview

This project features a **fully automated issue fix system** that uses AI to analyze, fix, and test bugs without human intervention.

### How It Works

```
User clicks GitHub button → Issue created → AI analyzes → Code generated → PR created → Tests run → Issue updated
```

**End-to-end automation** - from bug report to pull request in minutes!

---

## For Users: How to Report Issues

### Step 1: Open the Chat

In the desktop app, click the chat button (💬) in the bottom-right corner.

### Step 2: Describe the Issue

Type a clear description of the bug or feature request:

**Example:**
```
When I click the settings button, nothing happens. The modal doesn't open.
```

### Step 3: Click "GitHub" Button

Click the **🐛 GitHub** button (next to the Chat button).

### Step 4: Watch the Magic!

You'll see:
- ✅ GitHub issue created
- 🤖 Auto-fix bot activated
- Real-time updates in the app

### Step 5: Check Your GitHub Issue

The app will show you a link to the issue. Click it to watch the AI bot:
1. Analyze the problem
2. Write code to fix it
3. Run tests
4. Create a pull request

**Total time:** Usually 2-5 minutes!

---

## Setup Requirements

To enable the auto-fix system, you need to configure:

### 1. GitHub Personal Access Token

**Create a token:**
1. Go to https://github.com/settings/tokens/new
2. Select scopes: `repo` (full control of private repositories)
3. Click "Generate token"
4. Copy the token (starts with `ghp_...`)

**Add to app:**
1. Open Settings (⚙️ button or File > Settings)
2. Scroll to "GitHub Auto-Fix Integration"
3. Paste your token
4. Click "Save & Restart"

### 2. Claude API Key (Repository Secret)

The repository owner needs to add a Claude API key to GitHub Secrets:

1. Go to repository Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Name: `ANTHROPIC_API_KEY`
4. Value: Your Claude API key from https://console.anthropic.com/
5. Click "Add secret"

**Note:** This only needs to be done once by the repository owner.

---

## How the System Works

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Desktop App                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  User clicks "GitHub" button                          │  │
│  │  Describes issue: "Settings button doesn't work"     │  │
│  └─────────────────┬────────────────────────────────────┘  │
│                    │                                         │
│  ┌─────────────────▼────────────────────────────────────┐  │
│  │  Electron Main Process                               │  │
│  │  - Reads GitHub token from settings                  │  │
│  │  - Calls GitHub REST API                             │  │
│  │  - Creates issue with labels: 'auto-fix', 'bug'     │  │
│  └─────────────────┬────────────────────────────────────┘  │
└────────────────────┼────────────────────────────────────────┘
                     │
                     │ HTTPS POST
                     │
         ┌───────────▼──────────────┐
         │   GitHub Repository      │
         │   Issue #123 Created     │
         │   Labels: [auto-fix]     │
         └───────────┬──────────────┘
                     │
                     │ Webhook Trigger
                     │
         ┌───────────▼──────────────┐
         │  GitHub Actions          │
         │  Workflow: auto-fix      │
         └───────────┬──────────────┘
                     │
         ┌───────────▼──────────────┐
         │  1. Analyze Issue        │
         │     - Read issue text    │
         │     - Send to Claude API │
         │     - Get analysis       │
         └───────────┬──────────────┘
                     │
         ┌───────────▼──────────────┐
         │  2. Generate Fix         │
         │     - Claude analyzes    │
         │     - Suggests changes   │
         │     - Provides code      │
         └───────────┬──────────────┘
                     │
         ┌───────────▼──────────────┐
         │  3. Apply Changes        │
         │     - Modify files       │
         │     - Create new branch  │
         │     - Commit changes     │
         └───────────┬──────────────┘
                     │
         ┌───────────▼──────────────┐
         │  4. Run Tests            │
         │     - npm install        │
         │     - npm test           │
         │     - Check results      │
         └───────────┬──────────────┘
                     │
         ┌───────────▼──────────────┐
         │  5. Create Pull Request  │
         │     - Title: "Auto-fix"  │
         │     - Link to issue      │
         │     - Show changes       │
         └───────────┬──────────────┘
                     │
         ┌───────────▼──────────────┐
         │  6. Update Issue         │
         │     - Comment with PR    │
         │     - Add 'fix-available'│
         │     - Show status        │
         └──────────────────────────┘
```

---

## Workflow Steps (Detailed)

### Step 1: Issue Created

When you click the GitHub button in the app:

```javascript
// Desktop app creates issue
const issue = {
  title: "Settings button doesn't work",
  body: "Detailed description...",
  labels: ['auto-fix', 'bug', 'user-reported']
};
```

The `auto-fix` label triggers the GitHub Actions workflow.

### Step 2: AI Analysis

Claude reads the issue and analyzes:

```
Input: "Settings button doesn't work"

Claude analyzes:
- What is the expected behavior?
- What might be wrong?
- Which files need to be checked?
- What are potential fixes?

Output: JSON with analysis and fix plan
```

### Step 3: Code Generation

Claude generates the actual code fix:

```javascript
// Example fix Claude might generate
async function openSettings() {
  const modal = document.getElementById('settingsModal');
  if (!modal) {
    console.error('Settings modal not found!');
    return;
  }
  modal.classList.add('active');
}
```

### Step 4: Apply and Test

The workflow:
1. Creates a new branch: `auto-fix/issue-123`
2. Applies the code changes
3. Commits with message: "🤖 Auto-fix: Settings button doesn't work"
4. Runs tests (`npm test`)

### Step 5: Pull Request

A PR is automatically created with:
- **Title:** 🤖 Auto-fix: Settings button doesn't work
- **Description:** Analysis, changes made, test results
- **Labels:** automated, ai-generated, auto-fix
- **Links:** References issue #123

### Step 6: Notification

The issue gets a comment:

```markdown
✅ Fix Generated Successfully!

I've analyzed the issue and created a pull request with the fix:

🔗 Pull Request: #124

What I did:
1. ✅ Analyzed the issue using Claude AI
2. ✅ Generated code changes
3. ✅ Created a pull request
4. ✅ Ran tests

Next Steps:
- Review the changes in the PR
- Test manually if needed
- Merge if everything looks good!
```

---

## What Issues Can Be Auto-Fixed?

### ✅ Good Candidates for Auto-Fix

- **UI Bugs:** "Button doesn't work", "Modal won't open"
- **Simple Logic Errors:** "Function returns wrong value"
- **Missing Features:** "Add a close button"
- **CSS/Styling:** "Text is too small", "Colors are wrong"
- **Error Handling:** "App crashes when X happens"
- **Configuration Issues:** "Default value is wrong"

### ❌ Not Suitable for Auto-Fix

- **Complex Architecture Changes:** "Rewrite the database layer"
- **Security Vulnerabilities:** Require careful human review
- **Performance Optimization:** Needs benchmarking
- **Design Decisions:** Require human judgment
- **Breaking Changes:** Impact multiple components

---

## Monitoring the System

### Check Workflow Status

1. Go to your GitHub repository
2. Click "Actions" tab
3. See all "Auto-Fix Issues" workflows
4. Click on a run to see detailed logs

### Logs Show:

```
✅ Checkout code
✅ Comment on issue - Starting
✅ Analyze issue with Claude
✅ Generate fix with Claude
✅ Apply fixes to files
✅ Run tests
✅ Create Pull Request
✅ Update issue with PR link
```

### If Something Fails:

The workflow will comment on the issue:

```markdown
❌ Auto-Fix Failed

I encountered an error while trying to fix this issue automatically.

Possible reasons:
- The issue is too complex for automatic fixing
- Missing context or information
- API rate limits or errors

What to do:
- A human developer will need to review this issue
- You can try removing and re-adding the `auto-fix` label to retry
```

---

## Cost and Limits

### GitHub Actions

- **Free tier:** 2,000 minutes/month for private repos
- **Each auto-fix run:** ~2-5 minutes
- **Estimate:** ~400-1000 auto-fixes per month (free)

### Claude API

- **Model:** Claude Sonnet 4.5
- **Cost per auto-fix:** ~$0.03-$0.10 (depends on code size)
- **Monthly budget:** Set your own limit

### Rate Limits

- **GitHub API:** 5,000 requests/hour
- **Claude API:** 50 requests/minute (tier 1)
- **Workflow:** Processes one issue at a time

---

## Advanced Configuration

### Customize the Workflow

Edit `.github/workflows/auto-fix-issues.yml`:

```yaml
# Change AI model
model: 'claude-sonnet-4-5-20250929'  # or claude-opus-4

# Change max tokens (longer responses)
max_tokens: 8192

# Add custom labels
labels: |
  automated
  ai-generated
  auto-fix
  needs-review  # Add this
```

### Add Custom Tests

The workflow runs `npm test`. Configure in `package.json`:

```json
{
  "scripts": {
    "test": "jest",
    "test:fix": "jest --bail --findRelatedTests"
  }
}
```

### Filter Issues

Only auto-fix certain types:

```yaml
jobs:
  auto-fix:
    if: |
      contains(github.event.issue.labels.*.name, 'auto-fix') &&
      contains(github.event.issue.labels.*.name, 'bug')
```

---

## Troubleshooting

### "GitHub token not configured"

**Solution:** Add GitHub token in Settings (see Setup Requirements)

### "Failed to create issue"

**Possible causes:**
- Invalid GitHub token (expired or wrong scope)
- Repository doesn't exist
- No internet connection

**Solution:** Check settings, regenerate token if needed

### "Auto-fix workflow didn't run"

**Possible causes:**
- `ANTHROPIC_API_KEY` secret not set in repository
- Workflow file not committed to main branch
- Issue doesn't have `auto-fix` label

**Solution:**
1. Check repository Secrets
2. Ensure workflow file exists in `.github/workflows/`
3. Manually add `auto-fix` label to issue

### "PR created but tests failed"

**Solution:**
- Review the PR
- Fix tests manually
- Or update the workflow to skip failing tests

### "AI generated wrong fix"

**Solution:**
- Close the PR
- Add more details to the issue
- Remove and re-add `auto-fix` label to retry
- Or fix manually and mention what was wrong

---

## Best Practices

### Writing Good Issue Reports

**Bad:**
```
Settings broken
```

**Good:**
```
When I click the settings button (⚙️) in the bottom-left corner,
nothing happens. I expected a modal to open with API key fields.

Steps to reproduce:
1. Launch desktop app
2. Click settings button
3. Nothing happens

Expected: Settings modal opens
Actual: No response, no error in console
```

### Reviewing Auto-Generated PRs

Always:
1. ✅ Read the code changes
2. ✅ Test manually in your local environment
3. ✅ Check if tests pass
4. ✅ Verify it actually fixes the issue

Never:
1. ❌ Blindly merge without review
2. ❌ Assume AI is always right
3. ❌ Skip testing

### When to Use Manual Fixes

Use manual fixes when:
- Issue is security-related
- Requires architecture decisions
- Needs multiple attempts (AI didn't get it right)
- Affects critical functionality

---

## Metrics and Success Rate

### Track Performance

Add labels after reviewing:
- `auto-fix-success`: AI fix worked perfectly
- `auto-fix-partial`: Needed minor tweaks
- `auto-fix-failed`: AI couldn't fix it

### Expected Success Rate

Based on issue complexity:
- **Simple bugs:** ~80% success rate
- **Medium complexity:** ~50% success rate
- **Complex issues:** ~20% success rate

### Continuous Improvement

The system learns from:
- Failed attempts (add more context to prompts)
- Successful patterns (save as examples)
- User feedback (improve instructions)

---

## Privacy and Security

### What Data is Sent to Claude?

- Issue title and description (what you wrote)
- System information (OS, app version)
- Relevant code context (only public code in repo)

### What is NOT Sent:

- Your API keys
- Personal meetings or transcripts
- Private user data
- Database contents

### Security Measures:

1. ✅ GitHub tokens stored securely in Electron Store
2. ✅ API keys never logged or exposed
3. ✅ All API calls use HTTPS
4. ✅ Workflow runs in isolated GitHub Actions environment

---

## Future Enhancements

### Planned Features:

1. **Multi-attempt fixes:** If first fix fails tests, try again
2. **Interactive fixes:** Ask clarifying questions in issue comments
3. **Learning system:** Remember successful fix patterns
4. **Auto-merge:** Merge PRs automatically if all tests pass
5. **Status dashboard:** See all auto-fix activity in one place

---

## Support

### Getting Help

If the auto-fix system isn't working:

1. **Check logs:** Actions tab → Auto-Fix workflow → View logs
2. **Check settings:** Verify GitHub token is valid
3. **Check secrets:** Repository owner should verify `ANTHROPIC_API_KEY`
4. **Report issue:** Use the chat button (💬) or create a manual issue

### Contact

- **In-app:** Use chat button for support
- **GitHub:** Create an issue (without `auto-fix` label for meta issues)
- **Email:** [Include contact email if available]

---

## Summary

The auto-fix system provides:
- ✅ **Zero-friction bug reporting** (one click in app)
- ✅ **Automated analysis and fixes** (AI-powered)
- ✅ **Fast turnaround** (minutes, not days)
- ✅ **Transparent process** (all changes in GitHub)
- ✅ **Safe implementation** (PRs require review)

**Result:** Bugs get fixed faster, users get updates quicker, developers save time!

---

**Happy auto-fixing! 🤖✨**
