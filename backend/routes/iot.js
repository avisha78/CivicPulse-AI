const express = require("express");
const pool = require("../db");

const router = express.Router();

const DEVICE_RULES = {
  garbage_bin: { reading: "fill_level", threshold: 80, category: "Garbage", department: "Sanitation", severity: "High" },
  water_leak: { reading: "flow_rate", threshold: 100, category: "Water Supply", department: "Water Supply", severity: "High" },
  street_light: { reading: "fault", threshold: 1, category: "Street Lights", department: "Street Lighting", severity: "Medium" },
  drainage_level: { reading: "water_level", threshold: 80, category: "Drainage", department: "Drainage", severity: "Critical" },
  air_quality: { reading: "aqi", threshold: 150, category: "Environment", department: "Environment", severity: "High" },
};

router.post("/readings", async (req, res) => {
  const { deviceId, deviceType, readingType, value, unit, latitude, longitude, name } = req.body;
  if (!deviceId || !deviceType || !readingType || value === undefined) {
    return res.status(400).json({ message: "deviceId, deviceType, readingType and value are required" });
  }

  await pool.query(
    `INSERT INTO iot_devices (device_id, device_type, name, latitude, longitude)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (device_id) DO UPDATE SET latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude`,
    [deviceId, deviceType, name || deviceId, latitude || null, longitude || null]
  );
  await pool.query(
    `INSERT INTO iot_readings (device_id, reading_type, value, unit, latitude, longitude)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [deviceId, readingType, value, unit || null, latitude || null, longitude || null]
  );

  const rule = DEVICE_RULES[deviceType];
  const triggered = rule && rule.reading === readingType && Number(value) >= rule.threshold;
  let complaint = null;
  if (triggered) {
    const description = `${deviceType} sensor detected ${readingType} ${value}${unit || ""} at ${deviceId}`;
    const result = await pool.query(
      `INSERT INTO complaints (category, description, location, latitude, longitude, status, ai_category, ai_department, priority, severity, source, sensor_id, ai_source)
       VALUES ($1, $2, $3, $4, $5, 'Pending', $1, $6, $7, $7, 'iot', $8, 'iot-rule') RETURNING *`,
      [rule.category, description, name || deviceId, latitude || null, longitude || null, rule.department, rule.severity, deviceId]
    );
    complaint = result.rows[0];
  }
  res.status(201).json({ readingAccepted: true, triggered, complaint });
});

router.get("/readings", async (req, res) => {
  const result = await pool.query(`SELECT * FROM iot_readings ORDER BY created_at DESC LIMIT 200`);
  res.json({ readings: result.rows });
});

module.exports = router;