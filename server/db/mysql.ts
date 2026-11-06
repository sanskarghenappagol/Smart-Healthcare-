import mysql, { Pool, PoolConnection } from 'mysql2/promise';
import fs from 'fs';

// MySQL Connection Pool configuration
export const pool: Pool = mysql.createPool({
  host: process.env.MYSQL_HOST || '127.0.0.1',
  port: Number(process.env.MYSQL_PORT) || 3306,
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'healthcare_db',
  socketPath: fs.existsSync('/run/mysqld/mysqld.sock') ? '/run/mysqld/mysqld.sock' : undefined,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  decimalNumbers: true,
  dateStrings: true,
  multipleStatements: true
});

/**
 * Executes a parameterized SQL query
 */
export async function query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  const [rows] = await pool.query(sql, params);
  return rows as T[];
}

/**
 * Executes a query returning a single row or null
 */
export async function queryOne<T = any>(sql: string, params: any[] = []): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

/**
 * Gets a dedicated connection for manual transaction management (ACID demo & atomic workflows)
 */
export async function getTransactionConnection(): Promise<PoolConnection> {
  const connection = await pool.getConnection();
  return connection;
}

/**
 * Tests database health
 */
export async function testConnection(): Promise<boolean> {
  try {
    const [rows] = await pool.query('SELECT 1 AS connected');
    return Array.isArray(rows) && rows.length > 0;
  } catch (error) {
    console.error('MySQL connection error:', error);
    return false;
  }
}
