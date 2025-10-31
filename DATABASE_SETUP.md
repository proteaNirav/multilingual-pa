# Local Database Setup Guide

## Overview

The Multilingual PA desktop app now supports **multiple local database options** for data storage. Your meeting data stays on your machine - no cloud dependency!

### Supported Databases

| Database | Installation Required | Recommended For | Difficulty |
|----------|----------------------|-----------------|------------|
| **SQLite** ✅ | ❌ No (Embedded) | Most users | ⭐ Easy |
| **SQL Server Express** | ✅ Yes (Free) | Windows users, Enterprises | ⭐⭐ Medium |
| **MySQL** | ✅ Yes (Free) | Cross-platform | ⭐⭐ Medium |
| **PostgreSQL** | ✅ Yes (Free) | Advanced users | ⭐⭐ Medium |

---

## Quick Start (Recommended)

### Option 1: SQLite (Zero Setup)

**Perfect for:** Most users who want it to "just work"

**Setup:**
1. Open app Settings
2. Select "SQLite (Embedded)" from Database Type
3. Leave path empty (auto-creates in AppData)
4. Click "Save"
5. **Done!** No database installation needed

**Benefits:**
- ✅ Zero configuration
- ✅ No installation
- ✅ File-based (portable)
- ✅ Fast for typical usage
- ✅ Automatic backups easy

**Location:**
```
Windows: C:\Users\YourName\AppData\Roaming\multilingual-pa\meetings.db
Mac: ~/Library/Application Support/multilingual-pa/meetings.db
Linux: ~/.config/multilingual-pa/meetings.db
```

---

## SQL Server Express Setup

**Perfect for:** Windows users, businesses, those already using SQL Server

### Step 1: Install SQL Server Express

**Download:**
https://www.microsoft.com/en-us/sql-server/sql-server-downloads

**Installation:**
1. Click "Download now" under Express
2. Run the installer
3. Choose "Basic" installation
4. Accept defaults
5. Note the server name (usually `localhost\SQLEXPRESS`)

### Step 2: Enable TCP/IP (Required)

1. Open "SQL Server Configuration Manager"
2. Navigate to: SQL Server Network Configuration → Protocols for SQLEXPRESS
3. Right-click "TCP/IP" → Enable
4. Restart SQL Server service

### Step 3: Create Database

**Option A: Using SSMS (SQL Server Management Studio)**

1. Download SSMS: https://aka.ms/ssmsfullsetup
2. Connect to `localhost\SQLEXPRESS`
3. Right-click "Databases" → New Database
4. Name: `MultilingualPA`
5. Click OK

**Option B: Using Command Line**

```powershell
sqlcmd -S localhost\SQLEXPRESS -E -Q "CREATE DATABASE MultilingualPA"
```

### Step 4: Configure App

In app Settings:
```
Database Type: SQL Server Express
Host: localhost\SQLEXPRESS
Database: MultilingualPA
Authentication: Windows Authentication (leave user/pass empty)
```

Or use SQL Server Authentication:
```
Database Type: SQL Server Express
Host: localhost\SQLEXPRESS
Database: MultilingualPA
User: sa
Password: YourStrongPassword123!
```

### Step 5: Test Connection

Click "Test Connection" button. Should see: ✅ "SQL Server connection successful"

---

## MySQL Setup

**Perfect for:** Cross-platform users, those familiar with MySQL

### Step 1: Install MySQL

**Download:**
https://dev.mysql.com/downloads/installer/

**Installation:**
1. Run MySQL Installer
2. Choose "Developer Default" or "Server only"
3. Set root password (remember this!)
4. Complete installation

### Step 2: Create Database

**Using MySQL Workbench:**
1. Open MySQL Workbench
2. Connect to local instance
3. Run: `CREATE DATABASE multilingual_pa;`

**Using Command Line:**
```bash
mysql -u root -p
CREATE DATABASE multilingual_pa;
exit
```

### Step 3: Create User (Optional but Recommended)

```sql
CREATE USER 'multilingualpa'@'localhost' IDENTIFIED BY 'YourPassword123!';
GRANT ALL PRIVILEGES ON multilingual_pa.* TO 'multilingualpa'@'localhost';
FLUSH PRIVILEGES;
```

### Step 4: Configure App

In app Settings:
```
Database Type: MySQL
Host: localhost
Port: 3306
Database: multilingual_pa
User: multilingualpa (or root)
Password: YourPassword123!
```

### Step 5: Test Connection

Click "Test Connection" → Should see: ✅ "MySQL connection successful"

---

## PostgreSQL Setup

**Perfect for:** Advanced users, those wanting robust features

### Step 1: Install PostgreSQL

**Download:**
https://www.postgresql.org/download/

**Installation:**
1. Run installer
2. Remember the password you set for `postgres` user
3. Default port: 5432
4. Complete installation

### Step 2: Create Database

**Using pgAdmin:**
1. Open pgAdmin 4
2. Connect to PostgreSQL server
3. Right-click "Databases" → Create → Database
4. Name: `multilingual_pa`
5. Save

**Using Command Line:**
```bash
psql -U postgres
CREATE DATABASE multilingual_pa;
\q
```

### Step 3: Create User (Optional)

```sql
CREATE USER multilingualpa WITH PASSWORD 'YourPassword123!';
GRANT ALL PRIVILEGES ON DATABASE multilingual_pa TO multilingualpa;
```

### Step 4: Configure App

In app Settings:
```
Database Type: PostgreSQL
Host: localhost
Port: 5432
Database: multilingual_pa
User: postgres (or multilingualpa)
Password: YourPassword123!
```

### Step 5: Test Connection

Click "Test Connection" → Should see: ✅ "PostgreSQL connection successful"

---

## Troubleshooting

### "Connection failed" Error

**SQLite:**
- Check if app has write permissions to AppData folder
- Try specifying a custom path: `C:\Data\meetings.db`

**SQL Server:**
- Ensure SQL Server service is running
- Check TCP/IP is enabled in Configuration Manager
- Try adding `,1433` to host: `localhost\SQLEXPRESS,1433`
- For remote: Enable SQL Server Browser service

**MySQL:**
- Check MySQL service is running: `services.msc` → MySQL80
- Verify port 3306 is not blocked by firewall
- Test connection: `mysql -u root -p -h localhost`

**PostgreSQL:**
- Check PostgreSQL service is running
- Verify `pg_hba.conf` allows local connections
- Test: `psql -U postgres -h localhost`

### "Authentication failed" Error

- Double-check username and password
- For SQL Server: Try Windows Authentication (leave user/pass empty)
- For MySQL: User might not have proper grants
- For PostgreSQL: Check `pg_hba.conf` auth method

### "Database not found" Error

- Ensure database was created
- Check database name spelling (case-sensitive on Linux)
- For SQL Server: Include instance name (`\SQLEXPRESS`)

### "Tables not found" Error

- App auto-creates tables on first connection
- If manual creation needed, see SQL schemas below

---

## Manual Table Creation (Advanced)

If auto-creation fails, create tables manually:

### SQLite/MySQL:
```sql
CREATE TABLE meetings (
  id INTEGER PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  transcript TEXT,
  language VARCHAR(50),
  processed_data TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_meetings_created_at ON meetings(created_at);
CREATE INDEX idx_meetings_language ON meetings(language);
```

### SQL Server:
```sql
CREATE TABLE meetings (
  id INT IDENTITY(1,1) PRIMARY KEY,
  title NVARCHAR(255) NOT NULL,
  transcript NVARCHAR(MAX),
  language NVARCHAR(50),
  processed_data NVARCHAR(MAX),
  created_at DATETIME DEFAULT GETDATE()
);

CREATE INDEX idx_meetings_created_at ON meetings(created_at);
CREATE INDEX idx_meetings_language ON meetings(language);
```

### PostgreSQL:
```sql
CREATE TABLE meetings (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  transcript TEXT,
  language VARCHAR(50),
  processed_data JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_meetings_created_at ON meetings(created_at);
CREATE INDEX idx_meetings_language ON meetings(language);
```

---

## Database Migration

### Moving from One DB to Another

**Export from SQLite:**
```bash
sqlite3 meetings.db .dump > backup.sql
```

**Import to MySQL:**
```bash
mysql -u root -p multilingual_pa < backup.sql
```

**Import to PostgreSQL:**
```bash
psql -U postgres -d multilingual_pa -f backup.sql
```

**Note:** Some SQL syntax adjustments may be needed.

---

## Backup & Restore

### SQLite
**Backup:**
```bash
copy %APPDATA%\multilingual-pa\meetings.db backup_meetings.db
```

**Restore:**
```bash
copy backup_meetings.db %APPDATA%\multilingual-pa\meetings.db
```

### SQL Server
**Backup:**
```sql
BACKUP DATABASE MultilingualPA
TO DISK = 'C:\Backups\MultilingualPA.bak'
```

**Restore:**
```sql
RESTORE DATABASE MultilingualPA
FROM DISK = 'C:\Backups\MultilingualPA.bak'
WITH REPLACE
```

### MySQL
**Backup:**
```bash
mysqldump -u root -p multilingual_pa > backup.sql
```

**Restore:**
```bash
mysql -u root -p multilingual_pa < backup.sql
```

### PostgreSQL
**Backup:**
```bash
pg_dump -U postgres multilingual_pa > backup.sql
```

**Restore:**
```bash
psql -U postgres -d multilingual_pa -f backup.sql
```

---

## Performance Tips

### SQLite
- Keep database file on SSD for best performance
- Vacuum periodically: `VACUUM;`
- For large datasets (>10,000 meetings), consider MySQL/PostgreSQL

### SQL Server
- Enable Full-Text Search for better search performance
- Set recovery model to "Simple" for less overhead
- Regularly update statistics

### MySQL
- Use InnoDB engine (default)
- Enable query cache
- Optimize tables: `OPTIMIZE TABLE meetings;`

### PostgreSQL
- Run VACUUM ANALYZE regularly
- Consider partitioning for very large datasets
- Enable pg_stat_statements for query monitoring

---

## Security Best Practices

1. **Use strong passwords** for database users
2. **Don't use root/sa** for app connections (create dedicated user)
3. **Restrict network access** (localhost only unless needed)
4. **Regular backups** (automated if possible)
5. **Encrypt sensitive data** at application level
6. **Keep database software updated**

---

## FAQ

**Q: Which database should I choose?**
A: For most users, **SQLite** is perfect. Choose SQL Server if you're on Windows and want enterprise features. Choose MySQL/PostgreSQL if you need remote access or advanced features.

**Q: Can I change databases later?**
A: Yes! Export your data and import to the new database. However, this requires manual migration.

**Q: Will my data be backed up automatically?**
A: With SQLite, you can easily copy the .db file. For others, set up automated backup jobs using your database's built-in tools.

**Q: Can I use a remote database?**
A: Yes! Just change "Host" from `localhost` to the remote server IP/hostname. Ensure firewall allows connection.

**Q: What about Supabase?**
A: Supabase is now **optional** and used only for app improvement (telemetry, feedback). Your meeting data stays local.

**Q: Is my data encrypted?**
A: Database files are not encrypted by default. For SQLite, you can use SQLCipher. For others, enable Transparent Data Encryption (TDE) if available.

**Q: How much disk space is needed?**
A: Approximately 1-5 MB per 1000 meetings (depends on transcript length). SQLite is most space-efficient.

---

## Summary

**Recommended Setup Flow:**

1. **Start with SQLite** (zero setup)
2. **Test the app** with a few meetings
3. **Upgrade to SQL Server/MySQL** if you need:
   - Remote access
   - Multi-user support
   - Advanced querying
   - Enterprise backup solutions

**Remember:** Your data stays on your machine. No cloud dependency!

---

**Need help?** Use the in-app chat (💬) or report issues via GitHub button (🐛)
