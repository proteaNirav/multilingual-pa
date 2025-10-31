# Phase 2 Testing Guide - Database Abstraction Layer

## Overview

Phase 2 implements a complete database abstraction layer that allows users to choose their preferred database system instead of being locked into Supabase.

**Key Changes:**
- ✅ Multi-database support (SQLite, SQL Server, MySQL, PostgreSQL)
- ✅ SQLite as default (zero-setup, embedded)
- ✅ Local data storage (privacy-first)
- ✅ Supabase optional (telemetry only)
- ✅ Graceful fallback mechanisms

---

## Prerequisites

Before testing, ensure:
1. Node.js 22.x installed
2. Fresh `npm install` to get new database drivers:
   ```bash
   npm install
   ```
   This installs: sqlite3, mssql, mysql2, pg

3. For SQL Server testing: SQL Server Express installed
4. Gemini API key configured

---

## Test Suite

### Test 1: SQLite (Zero-Setup) ✅ PRIORITY

**Purpose:** Verify default database works without any configuration

**Steps:**
1. Delete existing settings:
   - Windows: Delete `C:\Users\YourName\AppData\Roaming\multilingual-pa\`
   - macOS: Delete `~/Library/Application Support/multilingual-pa/`
   - Linux: Delete `~/.config/multilingual-pa/`

2. Start the app:
   ```bash
   npm run electron
   ```

3. Configure only Gemini API key in Settings:
   - Open Settings (⚙️ button or File > Settings)
   - Enter Gemini API key
   - Leave database as "SQLite (Recommended)"
   - Leave path empty
   - Click "Save & Restart"

4. Test meeting recording:
   - Click "Start Recording"
   - Speak some test content
   - Click "Stop Recording"
   - Wait for processing
   - Verify meeting is saved

5. Verify database file created:
   - Windows: Check `C:\Users\YourName\AppData\Roaming\multilingual-pa\meetings.db`
   - File should exist and have size > 0 bytes

6. Test data persistence:
   - Close app
   - Reopen app
   - Check "View Meetings" - should show saved meeting

**Expected Results:**
- ✅ App starts without errors
- ✅ SQLite database file created automatically
- ✅ Meetings saved successfully
- ✅ Data persists across restarts
- ✅ No Supabase errors in logs

**Console Output Should Show:**
```
📦 No database configured - using SQLite (embedded)
🔌 Initializing database...
✅ Database connected: SQLITE
✅ Database ready: sqlite
```

---

### Test 2: SQL Server Express Connection 🎯 USER PRIORITY

**Purpose:** Verify connection to user's local SQL Server Express

**Prerequisites:**
- SQL Server Express installed
- Create database first:
  ```sql
  CREATE DATABASE MultilingualPA;
  ```

**Steps:**
1. Open Settings in the app

2. Configure SQL Server:
   - Database Type: "Microsoft SQL Server"
   - Server Host: `localhost` or `.\SQLEXPRESS`
   - Database Name: `MultilingualPA`
   - Username: (leave empty for Windows Auth OR enter `sa`)
   - Password: (leave empty for Windows Auth OR enter sa password)

3. Click "🔍 Test Connection"
   - Should show: ✅ Connection successful!

4. If test fails, check:
   - SQL Server service is running
   - TCP/IP enabled in SQL Server Configuration Manager
   - Windows Firewall allows SQL Server
   - Database exists

5. If test succeeds, click "Save & Restart"

6. Test meeting recording:
   - Record and save a test meeting
   - Verify it appears in "View Meetings"

7. Verify in SQL Server:
   ```sql
   USE MultilingualPA;
   SELECT * FROM meetings;
   ```
   Should show your test meeting

**Expected Results:**
- ✅ Connection test succeeds
- ✅ Tables created automatically
- ✅ Meetings saved to SQL Server
- ✅ Data readable from SQL Server Management Studio

**Console Output Should Show:**
```
Database configured: sqlserver
🔌 Initializing database...
🔍 Testing SQLSERVER connection...
✅ SQLSERVER connection successful
✅ Database connected: SQLSERVER
```

---

### Test 3: Connection Test Failure Handling

**Purpose:** Verify graceful error handling

**Steps:**
1. Open Settings

2. Configure invalid SQL Server:
   - Database Type: "Microsoft SQL Server"
   - Server Host: `invalid-server-that-does-not-exist`
   - Database Name: `MultilingualPA`
   - Username: `testuser`
   - Password: `wrongpassword`

3. Click "🔍 Test Connection"
   - Should show: ❌ Connection failed: [error message]
   - Error should be descriptive

4. Try to save anyway:
   - Click "Save & Restart"
   - App should restart

5. Check app behavior:
   - App should start successfully (fallback to SQLite)
   - Check logs for fallback message

**Expected Results:**
- ✅ Test button shows clear error
- ✅ App falls back to SQLite automatically
- ✅ No crashes or blank screens

**Console Output Should Show:**
```
Database configured: sqlserver
❌ Database initialization failed: [error details]
🔄 Falling back to SQLite...
✅ SQLite fallback successful
```

---

### Test 4: MySQL Connection (If Available)

**Purpose:** Test MySQL support

**Prerequisites:**
- MySQL or MariaDB installed
- Create database:
  ```sql
  CREATE DATABASE multilingual_pa;
  ```

**Steps:**
1. Configure MySQL in Settings:
   - Database Type: "MySQL / MariaDB"
   - Server Host: `localhost`
   - Port: `3306`
   - Database Name: `multilingual_pa`
   - Username: `root`
   - Password: [your password]

2. Test connection
3. Save and restart
4. Record a meeting
5. Verify in MySQL:
   ```sql
   USE multilingual_pa;
   SELECT * FROM meetings;
   ```

**Expected Results:**
- ✅ Connection succeeds
- ✅ Tables auto-created
- ✅ Data stored correctly

---

### Test 5: PostgreSQL Connection (If Available)

**Purpose:** Test PostgreSQL support

**Prerequisites:**
- PostgreSQL installed
- Create database:
  ```sql
  CREATE DATABASE multilingual_pa;
  ```

**Steps:**
1. Configure PostgreSQL in Settings:
   - Database Type: "PostgreSQL"
   - Server Host: `localhost`
   - Port: `5432`
   - Database Name: `multilingual_pa`
   - Username: `postgres`
   - Password: [your password]

2. Test connection
3. Save and restart
4. Record a meeting
5. Verify in PostgreSQL:
   ```sql
   \c multilingual_pa
   SELECT * FROM meetings;
   ```

**Expected Results:**
- ✅ Connection succeeds
- ✅ Tables auto-created
- ✅ Data stored correctly

---

### Test 6: Settings UI Validation

**Purpose:** Ensure UI works correctly

**Steps:**
1. Open Settings

2. Test database type switching:
   - Select "SQLite" - should show only path field
   - Select "SQL Server" - should show host, database, user, password
   - Select "MySQL" - should show host, port, database, user, password
   - Select "PostgreSQL" - should show host, port, database, user, password

3. Verify fields hide/show correctly

4. Test that existing settings load correctly:
   - Save some settings
   - Close settings modal
   - Reopen settings
   - Verify all fields populated

**Expected Results:**
- ✅ Fields show/hide based on database type
- ✅ Settings persist and reload correctly
- ✅ No visual glitches

---

### Test 7: Data Migration Between Databases

**Purpose:** Verify users can switch databases

**Steps:**
1. Start with SQLite:
   - Configure SQLite
   - Record 2-3 test meetings

2. Export data (manually for now):
   - Note the meetings you created

3. Switch to SQL Server:
   - Change database type to SQL Server
   - Configure and test connection
   - Save & restart

4. Verify:
   - Old SQLite data still exists in file
   - New data goes to SQL Server
   - No crashes during switch

**Expected Results:**
- ✅ Can switch databases without errors
- ✅ Each database has independent data
- ✅ No data corruption

---

### Test 8: Telemetry Separation

**Purpose:** Verify Supabase is truly optional

**Steps:**
1. Configure settings with NO Supabase:
   - Gemini API key: [your key]
   - Database: SQLite
   - Supabase URL: (leave empty)
   - Supabase Key: (leave empty)

2. Save and restart

3. Record a meeting

4. Check console logs:
   - Should NOT see Supabase errors
   - Should see "⚠️ Supabase telemetry not available" (one-time message)

5. Verify full functionality:
   - Record meetings ✅
   - View meetings ✅
   - Delete meetings ✅
   - Get statistics ✅

**Expected Results:**
- ✅ App works perfectly without Supabase
- ✅ No error messages about missing Supabase
- ✅ All core features functional

---

### Test 9: Stress Testing

**Purpose:** Ensure database can handle load

**Steps:**
1. Configure SQLite (fast)

2. Record 10 meetings in quick succession

3. Check database:
   - All 10 meetings saved?
   - No data corruption?
   - Reasonable file size?

4. Test queries:
   - View all meetings
   - Search meetings
   - Get statistics

**Expected Results:**
- ✅ All meetings saved
- ✅ Queries fast (<1s)
- ✅ No errors

---

### Test 10: Error Recovery

**Purpose:** Verify app recovers from database failures

**Steps:**
1. While app is running with SQLite:
   - Delete the database file:
     `C:\Users\YourName\AppData\Roaming\multilingual-pa\meetings.db`

2. Try to record a meeting

3. Try to view meetings

4. Restart the app

**Expected Results:**
- ✅ Graceful error messages (not crashes)
- ✅ Database recreated on restart
- ✅ App continues to function

---

## API Endpoint Testing

### Test Database Status Endpoint

```bash
# Get current database status
curl http://localhost:3000/api/database-status
```

**Expected Response:**
```json
{
  "success": true,
  "status": {
    "connected": true,
    "type": "sqlite",
    "ready": true
  }
}
```

### Test Connection Endpoint

```bash
# Test SQLite connection
curl -X POST http://localhost:3000/api/test-database-connection \
  -H "Content-Type: application/json" \
  -d '{"type": "sqlite"}'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Successfully connected to SQLITE database",
  "type": "sqlite"
}
```

### Test Configure Endpoint

```bash
# Configure database
curl -X POST http://localhost:3000/api/configure-database \
  -H "Content-Type: application/json" \
  -d '{"type": "sqlite", "path": null}'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Database configured successfully: SQLITE",
  "type": "sqlite"
}
```

---

## Known Issues & Workarounds

### Issue: SQL Server "Login failed for user"
**Cause:** Windows Authentication not configured
**Fix:** Use SQL Server Authentication with sa account OR enable Windows user

### Issue: MySQL "ER_NOT_SUPPORTED_AUTH_MODE"
**Cause:** MySQL 8+ uses caching_sha2_password
**Fix:**
```sql
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'password';
```

### Issue: PostgreSQL "role does not exist"
**Cause:** User not created
**Fix:**
```sql
CREATE USER myuser WITH PASSWORD 'mypassword';
GRANT ALL PRIVILEGES ON DATABASE multilingual_pa TO myuser;
```

### Issue: SQLite "database is locked"
**Cause:** File in use by another process
**Fix:** Close all connections, restart app

---

## Rollback Plan

If Phase 2 causes issues:

1. **Emergency Rollback to Previous Commit:**
   ```bash
   git checkout 1bc6a7d
   npm install
   npm run electron
   ```

2. **Restore Supabase-only Mode:**
   - Revert server.js to use Supabase client directly
   - Remove database adapter dependency
   - Reinstall old dependencies

---

## Success Criteria

Phase 2 is considered successful if:

✅ **Critical (Must Pass):**
- [ ] SQLite works with zero configuration
- [ ] User can connect to SQL Server Express
- [ ] App falls back to SQLite on database failure
- [ ] No blank screen issues
- [ ] No crashes when database unavailable
- [ ] Settings UI loads and saves correctly

✅ **Important (Should Pass):**
- [ ] MySQL connection works
- [ ] PostgreSQL connection works
- [ ] Connection test button accurate
- [ ] Data persists across restarts
- [ ] App works without Supabase configured

✅ **Nice to Have:**
- [ ] Clear error messages
- [ ] Fast query performance
- [ ] Migration between databases smooth

---

## Reporting Issues

If you find issues during testing:

1. **Check Logs:**
   - Windows: `C:\Users\YourName\AppData\Roaming\multilingual-pa\logs\main.log`
   - Include last 50 lines in bug report

2. **Use In-App Chat:**
   - Click 💬 button
   - Describe the issue
   - Include error message

3. **Create GitHub Issue:**
   - Use Settings > GitHub Token
   - App will auto-create issue with details

4. **Include:**
   - Database type being tested
   - Full error message
   - Steps to reproduce
   - Console output

---

## Next Steps After Testing

Once testing is complete:

1. ✅ Fix any bugs found
2. ✅ Optimize slow queries
3. ✅ Add data export/import
4. ✅ Continue with Track A Week 3 features

---

**Last Updated:** 2025-10-31
**Phase:** 2 - Database Abstraction
**Status:** Ready for Testing
