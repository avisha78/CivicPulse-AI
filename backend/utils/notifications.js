const pool = require("../db");

async function createNotification(userId, complaintId, title, message) {
  if (!userId) return;
  await pool.query(
    `INSERT INTO notifications (user_id, complaint_id, title, message)
     VALUES ($1, $2, $3, $4)`,
    [userId, complaintId || null, title, message]
  );
}

module.exports = { createNotification };