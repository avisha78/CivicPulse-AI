const pool = require("../db");

async function ensureSchema() {
  await pool.query(`
    ALTER TABLE complaints
      ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'Medium',
      ADD COLUMN IF NOT EXISTS severity VARCHAR(20) DEFAULT 'Medium',
      ADD COLUMN IF NOT EXISTS priority_score NUMERIC(6, 4),
      ADD COLUMN IF NOT EXISTS is_duplicate BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS duplicate_of INTEGER,
      ADD COLUMN IF NOT EXISTS duplicate_similarity NUMERIC(6, 4),
      ADD COLUMN IF NOT EXISTS source VARCHAR(20) DEFAULT 'citizen',
      ADD COLUMN IF NOT EXISTS sensor_id VARCHAR(120),
      ADD COLUMN IF NOT EXISTS resolution_image VARCHAR(255),
      ADD COLUMN IF NOT EXISTS resolution_remarks TEXT,
      ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMP,
      ADD COLUMN IF NOT EXISTS citizen_verified BOOLEAN DEFAULT FALSE;

    CREATE TABLE IF NOT EXISTS complaint_status_history (
      id SERIAL PRIMARY KEY,
      complaint_id INTEGER NOT NULL,
      old_status VARCHAR(40),
      new_status VARCHAR(40) NOT NULL,
      remarks TEXT,
      updated_by VARCHAR(120),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      complaint_id INTEGER,
      title VARCHAR(200) NOT NULL,
      message TEXT NOT NULL,
      is_read BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS complaint_feedback (
      id SERIAL PRIMARY KEY,
      complaint_id INTEGER NOT NULL UNIQUE,
      user_id INTEGER NOT NULL,
      rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
      comment TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS iot_devices (
      id SERIAL PRIMARY KEY,
      device_id VARCHAR(120) NOT NULL UNIQUE,
      device_type VARCHAR(80) NOT NULL,
      name VARCHAR(160),
      latitude NUMERIC(10, 7),
      longitude NUMERIC(10, 7),
      active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS iot_readings (
      id SERIAL PRIMARY KEY,
      device_id VARCHAR(120) NOT NULL,
      reading_type VARCHAR(80) NOT NULL,
      value NUMERIC,
      unit VARCHAR(30),
      latitude NUMERIC(10, 7),
      longitude NUMERIC(10, 7),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

module.exports = ensureSchema;