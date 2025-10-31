/**
 * Database Abstraction Layer
 * Supports multiple database types with a unified interface
 *
 * Supported databases:
 * - SQLite (embedded, no installation)
 * - SQL Server Express
 * - MySQL
 * - PostgreSQL
 * - Oracle
 * - Supabase (optional, for telemetry only)
 */

const fs = require('fs');
const path = require('path');

// Base Database Adapter Interface
class DatabaseAdapter {
  constructor(config) {
    this.config = config;
    this.connected = false;
  }

  async connect() {
    throw new Error('connect() must be implemented by subclass');
  }

  async disconnect() {
    throw new Error('disconnect() must be implemented by subclass');
  }

  async testConnection() {
    throw new Error('testConnection() must be implemented by subclass');
  }

  async createTables() {
    throw new Error('createTables() must be implemented by subclass');
  }

  async insertMeeting(data) {
    throw new Error('insertMeeting() must be implemented by subclass');
  }

  async getMeetings(filters = {}) {
    throw new Error('getMeetings() must be implemented by subclass');
  }

  async getMeetingById(id) {
    throw new Error('getMeetingById() must be implemented by subclass');
  }

  async deleteMeeting(id) {
    throw new Error('deleteMeeting() must be implemented by subclass');
  }

  async getFinancialSummary() {
    throw new Error('getFinancialSummary() must be implemented by subclass');
  }

  async getStatistics() {
    throw new Error('getStatistics() must be implemented by subclass');
  }
}

// SQLite Adapter (embedded, no installation required)
class SQLiteAdapter extends DatabaseAdapter {
  async connect() {
    const sqlite3 = require('sqlite3').verbose();
    const dbPath = this.config.path || path.join(process.env.APPDATA || process.env.HOME, 'multilingual-pa', 'meetings.db');

    // Ensure directory exists
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
          reject(err);
        } else {
          this.connected = true;
          console.log('✅ SQLite connected:', dbPath);
          resolve();
        }
      });
    });
  }

  async disconnect() {
    if (this.db) {
      return new Promise((resolve) => {
        this.db.close(() => {
          this.connected = false;
          resolve();
        });
      });
    }
  }

  async testConnection() {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT 1', (err) => {
        if (err) reject(err);
        else resolve({ success: true, message: 'SQLite connection successful' });
      });
    });
  }

  async createTables() {
    const schema = `
      CREATE TABLE IF NOT EXISTS meetings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        transcript TEXT,
        language TEXT,
        processed_data TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_meetings_created_at ON meetings(created_at);
      CREATE INDEX IF NOT EXISTS idx_meetings_language ON meetings(language);
    `;

    return new Promise((resolve, reject) => {
      this.db.exec(schema, (err) => {
        if (err) reject(err);
        else {
          console.log('✅ SQLite tables created');
          resolve();
        }
      });
    });
  }

  async insertMeeting(data) {
    const sql = `
      INSERT INTO meetings (title, transcript, language, processed_data, created_at)
      VALUES (?, ?, ?, ?, ?)
    `;

    return new Promise((resolve, reject) => {
      this.db.run(
        sql,
        [data.title, data.transcript, data.language, JSON.stringify(data.processed_data), data.created_at || new Date().toISOString()],
        function(err) {
          if (err) reject(err);
          else resolve({ id: this.lastID, ...data });
        }
      );
    });
  }

  async getMeetings(filters = {}) {
    let sql = 'SELECT * FROM meetings WHERE 1=1';
    const params = [];

    if (filters.search) {
      sql += ' AND title LIKE ?';
      params.push(`%${filters.search}%`);
    }

    if (filters.language) {
      sql += ' AND language = ?';
      params.push(filters.language);
    }

    sql += ' ORDER BY created_at DESC LIMIT ?';
    params.push(filters.limit || 50);

    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else {
          // Parse JSON processed_data
          const meetings = rows.map(row => ({
            ...row,
            processed_data: row.processed_data ? JSON.parse(row.processed_data) : null
          }));
          resolve(meetings);
        }
      });
    });
  }

  async getMeetingById(id) {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT * FROM meetings WHERE id = ?', [id], (err, row) => {
        if (err) reject(err);
        else if (!row) reject(new Error('Meeting not found'));
        else {
          resolve({
            ...row,
            processed_data: row.processed_data ? JSON.parse(row.processed_data) : null
          });
        }
      });
    });
  }

  async deleteMeeting(id) {
    return new Promise((resolve, reject) => {
      this.db.run('DELETE FROM meetings WHERE id = ?', [id], function(err) {
        if (err) reject(err);
        else resolve({ deleted: this.changes > 0 });
      });
    });
  }

  async getFinancialSummary() {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT processed_data, created_at FROM meetings WHERE processed_data IS NOT NULL',
        (err, rows) => {
          if (err) reject(err);
          else {
            const meetings = rows.map(row => ({
              processed_data: JSON.parse(row.processed_data),
              created_at: row.created_at
            }));
            resolve(meetings);
          }
        }
      );
    });
  }

  async getStatistics() {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT COUNT(*) as total, COUNT(DISTINCT language) as languages FROM meetings',
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
  }
}

// SQL Server Adapter
class SQLServerAdapter extends DatabaseAdapter {
  async connect() {
    const sql = require('mssql');

    this.pool = await sql.connect({
      server: this.config.host || 'localhost',
      database: this.config.database || 'MultilingualPA',
      user: this.config.user,
      password: this.config.password,
      port: this.config.port || 1433,
      options: {
        encrypt: this.config.encrypt !== false, // Use encryption by default
        trustServerCertificate: true,
        enableArithAbort: true
      }
    });

    this.connected = true;
    console.log('✅ SQL Server connected:', this.config.host);
  }

  async disconnect() {
    if (this.pool) {
      await this.pool.close();
      this.connected = false;
    }
  }

  async testConnection() {
    const result = await this.pool.request().query('SELECT 1 as test');
    return { success: true, message: 'SQL Server connection successful' };
  }

  async createTables() {
    const schema = `
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='meetings' AND xtype='U')
      CREATE TABLE meetings (
        id INT IDENTITY(1,1) PRIMARY KEY,
        title NVARCHAR(255) NOT NULL,
        transcript NVARCHAR(MAX),
        language NVARCHAR(50),
        processed_data NVARCHAR(MAX),
        created_at DATETIME DEFAULT GETDATE()
      );

      IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name='idx_meetings_created_at')
      CREATE INDEX idx_meetings_created_at ON meetings(created_at);

      IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name='idx_meetings_language')
      CREATE INDEX idx_meetings_language ON meetings(language);
    `;

    await this.pool.request().query(schema);
    console.log('✅ SQL Server tables created');
  }

  async insertMeeting(data) {
    const result = await this.pool.request()
      .input('title', data.title)
      .input('transcript', data.transcript)
      .input('language', data.language)
      .input('processed_data', JSON.stringify(data.processed_data))
      .input('created_at', data.created_at || new Date())
      .query(`
        INSERT INTO meetings (title, transcript, language, processed_data, created_at)
        OUTPUT INSERTED.*
        VALUES (@title, @transcript, @language, @processed_data, @created_at)
      `);

    return result.recordset[0];
  }

  async getMeetings(filters = {}) {
    let query = 'SELECT TOP (@limit) * FROM meetings WHERE 1=1';

    if (filters.search) {
      query += ' AND title LIKE @search';
    }

    if (filters.language) {
      query += ' AND language = @language';
    }

    query += ' ORDER BY created_at DESC';

    const request = this.pool.request()
      .input('limit', filters.limit || 50);

    if (filters.search) {
      request.input('search', `%${filters.search}%`);
    }

    if (filters.language) {
      request.input('language', filters.language);
    }

    const result = await request.query(query);

    return result.recordset.map(row => ({
      ...row,
      processed_data: row.processed_data ? JSON.parse(row.processed_data) : null
    }));
  }

  async getMeetingById(id) {
    const result = await this.pool.request()
      .input('id', id)
      .query('SELECT * FROM meetings WHERE id = @id');

    if (result.recordset.length === 0) {
      throw new Error('Meeting not found');
    }

    const row = result.recordset[0];
    return {
      ...row,
      processed_data: row.processed_data ? JSON.parse(row.processed_data) : null
    };
  }

  async deleteMeeting(id) {
    const result = await this.pool.request()
      .input('id', id)
      .query('DELETE FROM meetings WHERE id = @id');

    return { deleted: result.rowsAffected[0] > 0 };
  }

  async getFinancialSummary() {
    const result = await this.pool.request()
      .query('SELECT processed_data, created_at FROM meetings WHERE processed_data IS NOT NULL');

    return result.recordset.map(row => ({
      processed_data: JSON.parse(row.processed_data),
      created_at: row.created_at
    }));
  }

  async getStatistics() {
    const result = await this.pool.request()
      .query('SELECT COUNT(*) as total, COUNT(DISTINCT language) as languages FROM meetings');

    return result.recordset[0];
  }
}

// MySQL Adapter
class MySQLAdapter extends DatabaseAdapter {
  async connect() {
    const mysql = require('mysql2/promise');

    this.connection = await mysql.createConnection({
      host: this.config.host || 'localhost',
      user: this.config.user,
      password: this.config.password,
      database: this.config.database || 'multilingual_pa',
      port: this.config.port || 3306
    });

    this.connected = true;
    console.log('✅ MySQL connected:', this.config.host);
  }

  async disconnect() {
    if (this.connection) {
      await this.connection.end();
      this.connected = false;
    }
  }

  async testConnection() {
    await this.connection.query('SELECT 1');
    return { success: true, message: 'MySQL connection successful' };
  }

  async createTables() {
    const schema = `
      CREATE TABLE IF NOT EXISTS meetings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        transcript LONGTEXT,
        language VARCHAR(50),
        processed_data LONGTEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_created_at (created_at),
        INDEX idx_language (language)
      );
    `;

    await this.connection.query(schema);
    console.log('✅ MySQL tables created');
  }

  async insertMeeting(data) {
    const [result] = await this.connection.query(
      'INSERT INTO meetings (title, transcript, language, processed_data, created_at) VALUES (?, ?, ?, ?, ?)',
      [data.title, data.transcript, data.language, JSON.stringify(data.processed_data), data.created_at || new Date()]
    );

    return { id: result.insertId, ...data };
  }

  async getMeetings(filters = {}) {
    let query = 'SELECT * FROM meetings WHERE 1=1';
    const params = [];

    if (filters.search) {
      query += ' AND title LIKE ?';
      params.push(`%${filters.search}%`);
    }

    if (filters.language) {
      query += ' AND language = ?';
      params.push(filters.language);
    }

    query += ' ORDER BY created_at DESC LIMIT ?';
    params.push(filters.limit || 50);

    const [rows] = await this.connection.query(query, params);

    return rows.map(row => ({
      ...row,
      processed_data: row.processed_data ? JSON.parse(row.processed_data) : null
    }));
  }

  async getMeetingById(id) {
    const [rows] = await this.connection.query('SELECT * FROM meetings WHERE id = ?', [id]);

    if (rows.length === 0) {
      throw new Error('Meeting not found');
    }

    return {
      ...rows[0],
      processed_data: rows[0].processed_data ? JSON.parse(rows[0].processed_data) : null
    };
  }

  async deleteMeeting(id) {
    const [result] = await this.connection.query('DELETE FROM meetings WHERE id = ?', [id]);
    return { deleted: result.affectedRows > 0 };
  }

  async getFinancialSummary() {
    const [rows] = await this.connection.query(
      'SELECT processed_data, created_at FROM meetings WHERE processed_data IS NOT NULL'
    );

    return rows.map(row => ({
      processed_data: JSON.parse(row.processed_data),
      created_at: row.created_at
    }));
  }

  async getStatistics() {
    const [rows] = await this.connection.query(
      'SELECT COUNT(*) as total, COUNT(DISTINCT language) as languages FROM meetings'
    );

    return rows[0];
  }
}

// PostgreSQL Adapter
class PostgreSQLAdapter extends DatabaseAdapter {
  async connect() {
    const { Client } = require('pg');

    this.client = new Client({
      host: this.config.host || 'localhost',
      user: this.config.user,
      password: this.config.password,
      database: this.config.database || 'multilingual_pa',
      port: this.config.port || 5432
    });

    await this.client.connect();
    this.connected = true;
    console.log('✅ PostgreSQL connected:', this.config.host);
  }

  async disconnect() {
    if (this.client) {
      await this.client.end();
      this.connected = false;
    }
  }

  async testConnection() {
    await this.client.query('SELECT 1');
    return { success: true, message: 'PostgreSQL connection successful' };
  }

  async createTables() {
    const schema = `
      CREATE TABLE IF NOT EXISTS meetings (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        transcript TEXT,
        language VARCHAR(50),
        processed_data JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_meetings_created_at ON meetings(created_at);
      CREATE INDEX IF NOT EXISTS idx_meetings_language ON meetings(language);
    `;

    await this.client.query(schema);
    console.log('✅ PostgreSQL tables created');
  }

  async insertMeeting(data) {
    const result = await this.client.query(
      'INSERT INTO meetings (title, transcript, language, processed_data, created_at) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [data.title, data.transcript, data.language, data.processed_data, data.created_at || new Date()]
    );

    return result.rows[0];
  }

  async getMeetings(filters = {}) {
    let query = 'SELECT * FROM meetings WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (filters.search) {
      query += ` AND title ILIKE $${paramIndex}`;
      params.push(`%${filters.search}%`);
      paramIndex++;
    }

    if (filters.language) {
      query += ` AND language = $${paramIndex}`;
      params.push(filters.language);
      paramIndex++;
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex}`;
    params.push(filters.limit || 50);

    const result = await this.client.query(query, params);
    return result.rows;
  }

  async getMeetingById(id) {
    const result = await this.client.query('SELECT * FROM meetings WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      throw new Error('Meeting not found');
    }

    return result.rows[0];
  }

  async deleteMeeting(id) {
    const result = await this.client.query('DELETE FROM meetings WHERE id = $1', [id]);
    return { deleted: result.rowCount > 0 };
  }

  async getFinancialSummary() {
    const result = await this.client.query(
      'SELECT processed_data, created_at FROM meetings WHERE processed_data IS NOT NULL'
    );

    return result.rows;
  }

  async getStatistics() {
    const result = await this.client.query(
      'SELECT COUNT(*) as total, COUNT(DISTINCT language) as languages FROM meetings'
    );

    return result.rows[0];
  }
}

// Database Factory
class DatabaseFactory {
  static create(type, config) {
    switch (type.toLowerCase()) {
      case 'sqlite':
        return new SQLiteAdapter(config);
      case 'sqlserver':
      case 'mssql':
        return new SQLServerAdapter(config);
      case 'mysql':
        return new MySQLAdapter(config);
      case 'postgresql':
      case 'postgres':
        return new PostgreSQLAdapter(config);
      default:
        throw new Error(`Unsupported database type: ${type}`);
    }
  }

  static getSupportedTypes() {
    return [
      { value: 'sqlite', label: 'SQLite (Embedded - No Install)', recommended: true },
      { value: 'sqlserver', label: 'SQL Server Express', icon: '🗄️' },
      { value: 'mysql', label: 'MySQL', icon: '🐬' },
      { value: 'postgresql', label: 'PostgreSQL', icon: '🐘' }
    ];
  }
}

module.exports = {
  DatabaseFactory,
  DatabaseAdapter,
  SQLiteAdapter,
  SQLServerAdapter,
  MySQLAdapter,
  PostgreSQLAdapter
};
