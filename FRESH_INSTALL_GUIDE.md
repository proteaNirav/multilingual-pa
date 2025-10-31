# Fresh Installation Guide - Windows

**Purpose:** Download latest code and perform clean installation

**Time Required:** 5-10 minutes

---

## Step 1: Navigate to Project Folder

Open **Command Prompt** or **PowerShell** as Administrator (optional but recommended):

```bash
# Navigate to your project directory
cd C:\path\to\multilingual-pa

# For example:
# cd C:\Users\YourName\Documents\multilingual-pa
```

**Verify you're in the right folder:**
```bash
dir
```

You should see:
- `package.json`
- `server.js`
- `electron-main.js`
- `public` folder

---

## Step 2: Check Current Branch

```bash
git status
git branch
```

**Expected output:**
```
On branch claude/complete-project-011CUd7up4hJDX7TaudtrhXY
```

**If you're on a different branch:**
```bash
git checkout claude/complete-project-011CUd7up4hJDX7TaudtrhXY
```

---

## Step 3: Pull Latest Code

```bash
git pull origin claude/complete-project-011CUd7up4hJDX7TaudtrhXY
```

**Expected output:**
```
From http://...
 * branch            claude/complete-project-011CUd7up4hJDX7TaudtrhXY -> FETCH_HEAD
Already up to date.
OR
Updating [hash]..[hash]
Fast-forward
 [files changed]
```

**Latest commit should be:**
```bash
git log -1 --oneline
```

Should show:
```
837f54b Add testing session tracking document
```

---

## Step 4: Clean Old Installations

### 4a. Remove node_modules folder

**Windows Command Prompt:**
```bash
rmdir /s /q node_modules
```

**Windows PowerShell:**
```powershell
Remove-Item -Recurse -Force node_modules
```

**Alternative (if above fails):**
- Open File Explorer
- Navigate to project folder
- Delete `node_modules` folder manually
- (This may take a minute - it has many files)

### 4b. Remove package-lock.json

**Windows Command Prompt:**
```bash
del package-lock.json
```

**Windows PowerShell:**
```powershell
Remove-Item package-lock.json
```

### 4c. Clear npm cache (optional but recommended)

```bash
npm cache clean --force
```

**Expected output:**
```
npm WARN using --force Recommended protections disabled.
npm cache cleaned
```

### 4d. Verify cleanup

```bash
dir
```

You should **NOT** see:
- ❌ `node_modules` folder
- ❌ `package-lock.json` file

You should still see:
- ✅ `package.json`
- ✅ `server.js`
- ✅ `electron-main.js`
- ✅ All other project files

---

## Step 5: Fresh Installation

Now install everything cleanly:

```bash
npm install
```

### What You'll See:

**Stage 1: Resolving dependencies**
```
npm WARN deprecated [various warnings - NORMAL]
⸨░░░░░░░░░░░░░░░░⸩ ⠴ idealTree: timing
```

**Stage 2: Downloading packages**
```
⸨████████████████⸩ ⠹ reify: downloading
```

**Stage 3: Building native modules**
```
> sqlite3@5.1.6 install
> node-pre-gyp install --fallback-to-build
```

**Stage 4: Complete**
```
added 500+ packages, and audited 501 packages in 2m

150 packages are looking for funding
  run `npm fund` for details

found 0 vulnerabilities
```

### Installation Time:
- **First time:** 3-5 minutes
- **With good internet:** 2-3 minutes
- **Slow internet:** 5-10 minutes

### Possible Warnings (SAFE TO IGNORE):

✅ **OK - Not a problem:**
```
npm WARN deprecated inflight@1.0.6
npm WARN deprecated rimraf@3.0.2
npm WARN deprecated glob@7.2.3
npm WARN deprecated @npmcli/move-file@1.1.2
npm WARN deprecated npmlog@6.0.2
npm WARN deprecated are-we-there-yet@3.0.1
npm WARN deprecated gauge@4.0.4
npm WARN deprecated boolean@3.2.0
```

✅ **OK - sqlite3 will still work:**
```
node-pre-gyp WARN Using request for node-pre-gyp https download
[sqlite3] Success: "..." is installed via remote
```

### Actual Errors to Report:

❌ **Report these:**
```
npm ERR! code ELIFECYCLE
npm ERR! errno 1
```

❌ **Report these:**
```
npm ERR! network request to https://registry.npmjs.org/... failed
npm ERR! network This is a problem related to network connectivity
```

---

## Step 6: Verify Installation

### 6a. Check node_modules was created

```bash
dir node_modules
```

You should see hundreds of folders including:
- `sqlite3`
- `mssql`
- `mysql2`
- `pg`
- `electron`
- `express`
- `@google`
- And many more...

### 6b. Check database drivers specifically

```bash
dir node_modules | findstr /I "sqlite3 mssql mysql2 pg"
```

**Expected output:**
```
sqlite3
mssql
mysql2
pg
```

### 6c. Check package-lock.json was created

```bash
dir | findstr package-lock
```

Should show:
```
package-lock.json
```

### 6d. Check installation size

```bash
# PowerShell
(Get-ChildItem node_modules -Recurse | Measure-Object -Property Length -Sum).Sum / 1GB
```

**Expected:** ~0.5 - 1.5 GB (this is normal for Electron apps)

---

## Step 7: Verify Project Files

Make sure all new files from Phase 2 & Auto-Recovery are present:

```bash
dir *.md
```

Should show:
```
AUTO_RECOVERY_SYSTEM.md
DATABASE_SETUP.md
FRESH_INSTALL_GUIDE.md
TESTING_PHASE2.md
TESTING_SESSION.md
TEST_RESULTS.md
README.md
```

```bash
dir database-adapter.js
```

Should show:
```
database-adapter.js
```

```bash
dir public\ui-health-monitor.js
```

Should show:
```
ui-health-monitor.js
```

---

## Step 8: Quick Sanity Check

### Check Node.js version:
```bash
node --version
```

**Expected:** v18.x.x or v20.x.x or v22.x.x

### Check npm version:
```bash
npm --version
```

**Expected:** 9.x.x or 10.x.x

### Check if Electron is installed:
```bash
npm list electron --depth=0
```

**Expected:**
```
multilingual-pa@1.0.0
└── electron@28.x.x
```

### Check if database drivers are installed:
```bash
npm list sqlite3 mssql mysql2 pg --depth=0
```

**Expected:**
```
multilingual-pa@1.0.0
├── sqlite3@5.1.6
├── mssql@10.0.2
├── mysql2@3.6.5
└── pg@8.11.3
```

---

## Troubleshooting

### Problem: "git is not recognized"

**Solution:** Git is not in PATH. Either:
1. Download latest code as ZIP from GitHub
2. Extract to your project folder
3. Proceed with Step 4 (cleanup)

### Problem: "npm is not recognized"

**Solution:** Node.js not installed or not in PATH.
1. Download Node.js from https://nodejs.org/
2. Install LTS version (v20.x.x or v22.x.x)
3. Restart terminal
4. Try again

### Problem: Cannot delete node_modules

**Solution 1:** Close all apps using the files:
- Close VS Code
- Close any file explorers
- Close the app if it's running
- Try again

**Solution 2:** Use a tool:
```bash
npm install -g rimraf
rimraf node_modules
```

**Solution 3:** Restart Windows and try again

### Problem: npm install hangs

**Solution 1:** Cancel (Ctrl+C) and try with verbose:
```bash
npm install --verbose
```

**Solution 2:** Try with different registry:
```bash
npm install --registry=https://registry.npmjs.org
```

**Solution 3:** Check internet connection and try again

### Problem: sqlite3 build fails

**Solution:** This is usually OK. Electron includes prebuilt binaries.

To verify it will work:
```bash
node -e "require('sqlite3')"
```

If no error, it works!

### Problem: Permission denied

**Solution:** Run Command Prompt as Administrator:
1. Press Windows key
2. Type "cmd"
3. Right-click "Command Prompt"
4. Select "Run as administrator"
5. Navigate to project folder
6. Try again

---

## Success Checklist

Before moving to testing, verify:

- ✅ On correct git branch (claude/complete-project-011CUd7up4hJDX7TaudtrhXY)
- ✅ Latest commit is 837f54b
- ✅ Old node_modules deleted
- ✅ Old package-lock.json deleted
- ✅ npm cache cleaned
- ✅ Fresh npm install completed successfully
- ✅ node_modules folder recreated
- ✅ package-lock.json recreated
- ✅ All database drivers installed (sqlite3, mssql, mysql2, pg)
- ✅ Electron installed
- ✅ No critical errors during installation
- ✅ All new Phase 2 files present (database-adapter.js, ui-health-monitor.js)

---

## Next Steps

Once everything above is ✅:

1. **Test server startup:**
   ```bash
   node server.js
   ```
   Press Ctrl+C to stop after verifying it starts.

2. **Test Electron app:**
   ```bash
   npm run electron
   ```

3. **Begin comprehensive testing** using TESTING_SESSION.md

---

## Need Help?

If you encounter any issues during this process:

1. **Copy the exact error message**
2. **Note which step failed**
3. **Share with Claude for assistance**

Common issues are usually:
- Permission problems → Run as Administrator
- Network issues → Check internet, try again
- Path issues → Verify you're in correct folder
- Locked files → Close all apps and try again

---

**Last Updated:** 2025-10-31
**For:** Phase 2 & Auto-Recovery System Testing
**Status:** Ready to use
