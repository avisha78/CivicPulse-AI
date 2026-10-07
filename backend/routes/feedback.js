const express = require("express");
const jwt = require("jsonwebtoken");
const pool = require("../db");

const router = express.Router();

function authenticate(req, res, next) {
  try {
    const token = (req.headers.authorization || "").split(" ")[1];
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid or expired token" });
  }
}

router.post("/complaints/:id", authenticate, async (req, res) => {
  const rating = Number(req.body.rating);
  const comment = String(req.body.comment || "").trim();
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return res.status(400).json({ message: "Rating must be between 1 and 5" });
  }

  const complaint = await pool.query(
    `SELECT id FROM complaints WHERE id = $1 AND user_id = $2 AND status = 'Resolved'`,
    [req.params.id, req.user.id]
  );
  if (!complaint.rows.length) {
    return res.status(400).json({ message: "Only your resolved complaints can be rated" });
  }

  const result = await pool.query(
    `INSERT INTO complaint_feedback (complaint_id, user_id, rating, comment)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (complaint_id) DO UPDATE SET rating = EXCLUDED.rating, comment = EXCLUDED.comment
     RETURNING *`,
    [req.params.id, req.user.id, rating, comment || null]
  );
  res.status(201).json({ feedback: result.rows[0] });
});

module.exports = router;