const { pool } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

/**
 * Logs an action to the audit_logs table.
 * @param {string} userId - The ID of the user performing the action.
 * @param {string} action - The action performed (e.g., 'LOGIN', 'DELETE_PATIENT').
 * @param {string} tableName - The table affected.
 * @param {string} recordId - The ID of the affected record.
 * @param {Object|string} details - Additional details about the action.
 * @param {string} ipAddress - The IP address of the user.
 */
const logAction = async (userId, action, tableName = null, recordId = null, details = null, ipAddress = null) => {
  try {
    const detailString = typeof details === 'object' ? JSON.stringify(details) : details;
    await pool.execute(
      'INSERT INTO audit_logs (id, user_id, action, table_name, record_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [uuidv4(), userId, action, tableName, recordId, detailString, ipAddress]
    );
  } catch (error) {
    console.error('❌ Failed to log audit action:', error.message);
  }
};

module.exports = { logAction };
