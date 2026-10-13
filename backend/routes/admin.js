const express = require("express");
const jwt = require("jsonwebtoken");
const pool = require("../db");
const { createNotification } = require("../utils/notifications");

const router = express.Router();

/* ==================================================
   ADMIN AUTHENTICATION
================================================== */

const authenticateAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "Authentication token is required",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    /*
      auth.js creates:
      type: "admin"

      Therefore check decoded.type
      NOT decoded.role
    */

    if (decoded.type !== "admin") {
      return res.status(403).json({
        message: "Admin access required",
      });
    }

    req.user = decoded;
    next();
  } catch (error) {
    console.error(
      "Admin authentication error:",
      error.message
    );

    return res.status(403).json({
      message: "Invalid or expired token",
    });
  }
};

/* ==================================================
   ADMIN DASHBOARD
================================================== */

router.get(
  "/dashboard",
  authenticateAdmin,
  async (req, res) => {
    try {
      /* ============================================
         SUMMARY
      ============================================ */

      const summaryResult = await pool.query(`
        SELECT
          COUNT(*)::int AS total_complaints,

          COUNT(*)
          FILTER (
            WHERE status = 'Pending'
          )::int AS pending,

          COUNT(*)
          FILTER (
            WHERE status = 'In Progress'
          )::int AS in_progress,

          COUNT(*)
          FILTER (
            WHERE status = 'Resolved'
          )::int AS resolved

        FROM complaints
      `);

      /* ============================================
         CATEGORIES
      ============================================ */

      const categoryResult = await pool.query(`
        SELECT
          category,
          COUNT(*)::int AS count,

          ROUND(
            COUNT(*) * 100.0 /
            NULLIF(
              (
                SELECT COUNT(*)
                FROM complaints
              ),
              0
            ),
            0
          )::int AS percentage

        FROM complaints

        GROUP BY category

        ORDER BY count DESC, category ASC
      `);

      /* ============================================
         DEPARTMENTS
      ============================================ */

      const departmentResult = await pool.query(`
        SELECT
          CASE
            WHEN category =
              'Road Damage / Potholes'
            THEN 'Roads'

            WHEN category =
              'Garbage & Waste Management'
            THEN 'Sanitation'

            WHEN category =
              'Water Supply'
            THEN 'Water Supply'

            WHEN category =
              'Street Light'
            THEN 'Street Lighting'

            WHEN category =
              'Drainage & Sewerage'
            THEN 'Drainage'

            ELSE 'Others'
          END AS department,

          COUNT(*)::int AS count

        FROM complaints

        GROUP BY 1

        ORDER BY count DESC
      `);

      /* ============================================
         WEEKLY COMPLAINT DATA
      ============================================ */

      const weeklyResult = await pool.query(`
        SELECT
          DATE_TRUNC(
            'week',
            created_at
          ) AS week_start,

          TO_CHAR(
            DATE_TRUNC(
              'week',
              created_at
            ),
            'DD Mon'
          ) AS label,

          COUNT(*)::int AS registered,

          COUNT(*)
          FILTER (
            WHERE status = 'Resolved'
          )::int AS resolved

        FROM complaints

        WHERE created_at >=
          CURRENT_DATE -
          INTERVAL '5 weeks'

        GROUP BY
          DATE_TRUNC(
            'week',
            created_at
          )

        ORDER BY
          DATE_TRUNC(
            'week',
            created_at
          )
      `);

      /* ============================================
         MONTHLY COMPLAINT DATA
      ============================================ */

      const monthlyResult = await pool.query(`
        SELECT
          TO_CHAR(month_start, 'Mon YYYY') AS month,
          COUNT(c.id)::int AS count

        FROM generate_series(
          DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '5 months',
          DATE_TRUNC('month', CURRENT_DATE),
          INTERVAL '1 month'
        ) AS months(month_start)

        LEFT JOIN complaints c
          ON c.created_at >= month_start
          AND c.created_at < month_start + INTERVAL '1 month'

        GROUP BY month_start
        ORDER BY month_start
      `);

      /* ============================================
         RECENT COMPLAINTS
      ============================================ */

      const recentResult = await pool.query(`
        SELECT
          c.id,
          c.category,
          c.location,
          c.status,
          c.created_at,
          ci.name AS citizen_name

        FROM complaints c

        LEFT JOIN citizens ci
          ON c.user_id = ci.id

        ORDER BY c.created_at DESC

        LIMIT 8
      `);

      const summary =
        summaryResult.rows[0] || {
          total_complaints: 0,
          pending: 0,
          in_progress: 0,
          resolved: 0,
        };

      /* ============================================
         SEND DATA TO FRONTEND
      ============================================ */

      res.status(200).json({
        statistics: {
          totalComplaints:
            summary.total_complaints,

          inProgress:
            summary.in_progress,

          resolved:
            summary.resolved,

          pending:
            summary.pending,
        },

        categories:
          categoryResult.rows,

        departments:
          departmentResult.rows,

        weeklyComplaints:
          weeklyResult.rows,

        monthlyComplaints:
          monthlyResult.rows,

        recentComplaints:
          recentResult.rows,
      });
    } catch (error) {
      console.error(
        "Admin dashboard error:",
        error
      );

      res.status(500).json({
        message:
          "Failed to load admin dashboard",

        error: error.message,
      });
    }
  }
);

/* ==================================================
   GET ALL COMPLAINTS
================================================== */

router.get(
  "/complaints",
  authenticateAdmin,
  async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT
          c.*,

          ci.name AS citizen_name,
          ci.email AS citizen_email,
          ci.mobile AS citizen_mobile

        FROM complaints c

        LEFT JOIN citizens ci
          ON c.user_id = ci.id

        ORDER BY c.created_at DESC
      `);

      res.json({
        complaints: result.rows,
      });
    } catch (error) {
      console.error(
        "Fetch admin complaints error:",
        error
      );

      res.status(500).json({
        message:
          "Failed to fetch complaints",
      });
    }
  }
);

/* ==================================================
   UPDATE COMPLAINT STATUS
   + SAVE STATUS HISTORY
================================================== */

router.put(
  "/complaints/:id/status",
  authenticateAdmin,
  async (req, res) => {
    try {
      const { status } = req.body;

      const allowedStatuses = [
        "Pending",
        "In Progress",
        "Resolved",
        "Rejected",
      ];

      /* ============================================
         VALIDATE STATUS
      ============================================ */

      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          message:
            "Invalid complaint status",
        });
      }

      /* ============================================
         GET CURRENT / OLD STATUS
      ============================================ */

      const oldComplaint = await pool.query(
        `
        SELECT status
        FROM complaints
        WHERE id = $1
        `,
        [req.params.id]
      );

      if (oldComplaint.rows.length === 0) {
        return res.status(404).json({
          message:
            "Complaint not found",
        });
      }

      const oldStatus =
        oldComplaint.rows[0].status;

      /* ============================================
         UPDATE COMPLAINT STATUS
      ============================================ */

      const result = await pool.query(
        `
        UPDATE complaints
        SET status = $1
        WHERE id = $2
        RETURNING *
        `,
        [
          status,
          req.params.id,
        ]
      );

      /* ============================================
         SAVE STATUS HISTORY
      ============================================ */

      await pool.query(
        `
        INSERT INTO complaint_status_history
        (
          complaint_id,
          old_status,
          new_status,
          remarks,
          updated_by
        )
        VALUES ($1, $2, $3, $4, $5)
        `,
        [
          req.params.id,
          oldStatus,
          status,
          null,
          "Admin",
        ]
      );

      const complaintOwner = await pool.query(
        `SELECT user_id FROM complaints WHERE id = $1`,
        [req.params.id]
      );
      if (complaintOwner.rows[0]) {
        await createNotification(
          complaintOwner.rows[0].user_id,
          req.params.id,
          "Complaint status updated",
          `Your complaint status changed from ${oldStatus} to ${status}.`
        );
      }

      /* ============================================
         RESPONSE
      ============================================ */

      res.json({
        message:
          "Complaint status updated successfully",

        complaint:
          result.rows[0],
      });
    } catch (error) {
      console.error(
        "Update complaint status error:",
        error
      );

      res.status(500).json({
        message:
          "Failed to update complaint status",

        error: error.message,
      });
    }
  }
);


router.put("/complaints/:id/assign", authenticateAdmin, async (req, res) => {
  try {
    const { officerId } = req.body;

    if (!officerId) {
      return res.status(400).json({
        message: "officerId is required",
      });
    }

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      // Get the actual previous status
      const previousResult = await client.query(
        `SELECT id, status
         FROM complaints
         WHERE id = $1
         FOR UPDATE`,
        [req.params.id]
      );

      if (!previousResult.rows.length) {
        await client.query("ROLLBACK");
        return res.status(404).json({
          message: "Complaint not found",
        });
      }

      const oldStatus = previousResult.rows[0].status;
      const newStatus =
        oldStatus === "Pending" ? "In Progress" : oldStatus;

      const result = await client.query(
        `UPDATE complaints
         SET officer_id = $1, status = $2
         WHERE id = $3
         RETURNING *`,
        [officerId, newStatus, req.params.id]
      );

      const complaint = result.rows[0];

      // Save history only when the status actually changes
      if (oldStatus !== newStatus) {
        await client.query(
          `INSERT INTO complaint_status_history
           (complaint_id, old_status, new_status, remarks, updated_by)
           VALUES ($1, $2, $3, $4, $5)`,
          [
            complaint.id,
            oldStatus,
            newStatus,
            "Assigned to officer",
            String(req.user.id),
          ]
        );
      }

      await client.query("COMMIT");

      await createNotification(
        complaint.user_id,
        complaint.id,
        "Complaint assigned",
        "Your complaint has been assigned to a municipal officer."
      );

      return res.json({ complaint });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Assign complaint error:", error);

    return res.status(500).json({
      message: "Failed to assign complaint",
    });
  }
});


router.get("/complaints/hotspots", authenticateAdmin, async (req, res) => {
  const result = await pool.query(
    `SELECT category, ROUND(latitude::numeric, 3) AS lat_bucket, ROUND(longitude::numeric, 3) AS lng_bucket,
      COUNT(*)::int AS count
     FROM complaints WHERE latitude IS NOT NULL AND longitude IS NOT NULL
     GROUP BY category, ROUND(latitude::numeric, 3), ROUND(longitude::numeric, 3)
     ORDER BY count DESC`
  );
  res.json({ hotspots: result.rows });
});

/* ==================================================
   GET ALL CITIZENS
================================================== */

router.get(
  "/users",
  authenticateAdmin,
  async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT
          id,
          name,
          email,
          mobile,
          created_at

        FROM citizens

        ORDER BY created_at DESC
      `);

      res.json({
        users: result.rows,
      });
    } catch (error) {
      console.error(
        "Fetch citizens error:",
        error
      );

      res.status(500).json({
        message:
          "Failed to fetch citizens",
      });
    }
  }
);

router.get("/officers", authenticateAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, name, email, mobile, department, created_at
      FROM officers
      ORDER BY name ASC, id ASC
    `);
    res.json({ officers: result.rows });
  } catch (error) {
    console.error("Fetch officers error:", error);
    res.status(500).json({ message: "Failed to fetch officers" });
  }
});

/* ==================================================
   GET GIS & MAP DATA (For Leaflet & Hotspots)
================================================== */
router.get("/gis-data", authenticateAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, title, category, status, latitude, longitude, severity
      FROM complaints
      WHERE latitude IS NOT NULL AND longitude IS NOT NULL
    `);
    res.json({ complaints: result.rows });
  } catch (error) {
    console.error("GIS data fetch error:", error);
    res.status(500).json({ message: "Failed to fetch GIS data" });
  }
});
/* ==================================================
   EXPORT ROUTER
================================================== */

module.exports = router;