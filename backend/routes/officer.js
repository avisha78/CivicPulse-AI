const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const router = express.Router();
const db = require("../db");
const multer = require("multer");
const path = require("path");
const { createNotification } = require("../utils/notifications");

const resolutionUpload = multer({
  dest: path.join(__dirname, "../uploads"),
});

// =====================================================
// OFFICER AUTHENTICATION MIDDLEWARE
// =====================================================

const authenticateOfficer = (req, res, next) => {
  try {
    console.log("====================================");
    console.log("OFFICER AUTHENTICATION CHECK");

    const authHeader = req.headers.authorization;

    console.log(
      "Authorization header exists:",
      !!authHeader
    );

    // -------------------------------------------------
    // CHECK AUTHORIZATION HEADER
    // -------------------------------------------------

    if (!authHeader) {
      console.log(
        "ERROR: Authorization header missing"
      );

      return res.status(401).json({
        success: false,
        message: "Authentication token is required.",
      });
    }

    // -------------------------------------------------
    // CHECK BEARER FORMAT
    // -------------------------------------------------

    if (!authHeader.startsWith("Bearer ")) {
      console.log(
        "ERROR: Authorization header is not Bearer"
      );

      return res.status(401).json({
        success: false,
        message: "Invalid authorization format.",
      });
    }

    // -------------------------------------------------
    // GET TOKEN
    // -------------------------------------------------

    const token = authHeader.substring(7).trim();

    if (!token) {
      console.log("ERROR: Token is empty");

      return res.status(401).json({
        success: false,
        message: "Authentication token is required.",
      });
    }

    console.log("Token received: YES");

    // -------------------------------------------------
    // CHECK JWT SECRET
    // -------------------------------------------------

    if (!process.env.JWT_SECRET) {
      console.error(
        "ERROR: JWT_SECRET is missing in .env"
      );

      return res.status(500).json({
        success: false,
        message:
          "JWT configuration is missing on server.",
      });
    }

    // -------------------------------------------------
    // VERIFY JWT
    // -------------------------------------------------

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    console.log("Decoded JWT:", decoded);
    console.log("JWT ID:", decoded.id);
    console.log("JWT Email:", decoded.email);
    console.log("JWT Role:", decoded.role);
    console.log("JWT Type:", decoded.type);

    // -------------------------------------------------
    // SUPPORT BOTH OLD AND NEW JWT
    // -------------------------------------------------

    const officerRole = String(
      decoded.role || decoded.type || ""
    )
      .trim()
      .toLowerCase();

    console.log(
      "Final officer role/type:",
      officerRole
    );

    // -------------------------------------------------
    // CHECK OFFICER ROLE
    // -------------------------------------------------

    if (officerRole !== "officer") {
      console.log(
        "ERROR: Invalid officer role/type:",
        officerRole
      );

      return res.status(403).json({
        success: false,
        message: "Officer access required.",
      });
    }

    // -------------------------------------------------
    // CHECK OFFICER ID
    // -------------------------------------------------

    if (!decoded.id) {
      console.log(
        "ERROR: Officer ID missing from JWT"
      );

      return res.status(403).json({
        success: false,
        message:
          "Officer ID is missing from authentication token.",
      });
    }

    // -------------------------------------------------
    // SAVE OFFICER IN REQUEST
    // -------------------------------------------------

    req.user = {
      id: decoded.id,
      email: decoded.email || null,
      role: "officer",
    };

    console.log(
      "Officer authentication SUCCESS"
    );

    console.log(
      "Authenticated Officer ID:",
      req.user.id
    );

    console.log("====================================");

    next();
  } catch (error) {
    console.error(
      "Officer authentication error:",
      error.message
    );

    console.log("====================================");

    return res.status(403).json({
      success: false,
      message: "Invalid or expired token.",
    });
  }
};

// =====================================================
// OFFICER LOGIN
// POST /api/officer/login
// =====================================================

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log("====================================");
    console.log("OFFICER LOGIN");
    console.log("Email:", email);

    // -------------------------------------------------
    // VALIDATION
    // -------------------------------------------------

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message:
          "Email and password are required.",
      });
    }

    // -------------------------------------------------
    // FIND OFFICER
    // -------------------------------------------------

    const result = await db.query(
      `
      SELECT *
      FROM officers
      WHERE LOWER(TRIM(email)) = LOWER(TRIM($1))
      LIMIT 1
      `,
      [email]
    );

    if (result.rows.length === 0) {
      console.log("Officer not found");

      return res.status(401).json({
        success: false,
        message:
          "Invalid officer email or password.",
      });
    }

    const officer = result.rows[0];

    console.log("Officer found:");
    console.log({
      id: officer.id,
      name: officer.name,
      email: officer.email,
      department: officer.department,
    });

    // -------------------------------------------------
    // CHECK PASSWORD
    // -------------------------------------------------

    if (!officer.password) {
      console.error(
        "Officer password is missing in database."
      );

      return res.status(500).json({
        success: false,
        message:
          "Officer password is not configured.",
      });
    }

    const passwordMatch = await bcrypt.compare(
      password,
      officer.password
    );

    console.log(
      "Password match:",
      passwordMatch
    );

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid officer email or password.",
      });
    }

    // -------------------------------------------------
    // CREATE NEW JWT
    // -------------------------------------------------

    const token = jwt.sign(
      {
        id: officer.id,
        email: officer.email,
        role: "officer",
        type: "officer",
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      }
    );

    console.log(
      "JWT created successfully"
    );

    console.log("JWT Officer ID:", officer.id);
    console.log("JWT Role: officer");
    console.log("JWT Type: officer");

    console.log("====================================");

    // -------------------------------------------------
    // SEND RESPONSE
    // -------------------------------------------------

    return res.status(200).json({
      success: true,

      message: "Officer login successful.",

      token: token,

      officer: {
        id: officer.id,
        name: officer.name,
        email: officer.email,
        mobile: officer.mobile,
        department: officer.department,
        role: "officer",
      },
    });
  } catch (error) {
    console.error(
      "Officer login error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error during officer login.",
      error: error.message,
    });
  }
});

// =====================================================
// GET OFFICER ASSIGNED COMPLAINTS
// GET /api/officer/complaints
// =====================================================

router.get(
  "/complaints",
  authenticateOfficer,
  async (req, res) => {
    try {
      const officerId = req.user.id;

      console.log("====================================");
      console.log(
        "FETCHING OFFICER COMPLAINTS"
      );
      console.log(
        "Officer ID:",
        officerId
      );

      // -------------------------------------------------
      // FETCH COMPLAINTS
      // -------------------------------------------------

      const result = await db.query(
        `
        SELECT
          c.id,
          c.user_id,
          c.category,
          c.description,
          c.location,
          c.latitude,
          c.longitude,
          c.image,
          c.status,
          c.created_at,
          c.officer_id,
          c.priority,
          c.severity,
          c.is_duplicate,
          c.duplicate_of,
          c.resolution_image,
          c.resolution_remarks,
          c.ai_category,
          c.ai_department,
          c.ai_confidence,
          c.ai_source,

          u.name AS citizen_name,
          u.email AS citizen_email,
          u.mobile AS citizen_mobile

        FROM complaints c

        LEFT JOIN users u
          ON c.user_id = u.id

        WHERE c.officer_id = $1

        ORDER BY c.created_at DESC
        `,
        [officerId]
      );

      console.log(
        "Total complaints:",
        result.rows.length
      );

      console.log(
        "Assigned complaints:",
        result.rows
      );

      console.log("====================================");

      return res.status(200).json({
        success: true,
        complaints: result.rows,
      });
    } catch (error) {
      console.error(
        "Fetch assigned complaints error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to fetch assigned complaints.",
        error: error.message,
      });
    }
  }
);

router.put("/complaints/:id/resolve", authenticateOfficer, resolutionUpload.single("resolutionImage"), async (req, res) => {
  const remarks = String(req.body.remarks || "").trim();
  const result = await db.query(
    `UPDATE complaints SET status = 'Resolved', resolution_image = $1, resolution_remarks = $2, resolved_at = CURRENT_TIMESTAMP
     WHERE id = $3 AND officer_id = $4 RETURNING *`,
    [req.file?.filename || null, remarks || null, req.params.id, req.user.id]
  );
  if (!result.rows.length) return res.status(404).json({ message: "Assigned complaint not found" });
  const complaint = result.rows[0];
  await db.query(
    `INSERT INTO complaint_status_history (complaint_id, old_status, new_status, remarks, updated_by)
     VALUES ($1, 'In Progress', 'Resolved', $2, $3)`,
    [complaint.id, remarks || null, String(req.user.id)]
  );
  await createNotification(complaint.user_id, complaint.id, "Complaint resolved", "Your complaint has been marked resolved. Please verify and rate the resolution.");
  res.json({ complaint });
});

// =====================================================
// TEST OFFICER ROUTE
// GET /api/officer/test
// =====================================================

router.get("/test", (req, res) => {
  console.log(
    "Officer test route accessed."
  );

  return res.status(200).json({
    success: true,
    message:
      "Officer routes are working.",
  });
});

// =====================================================
// EXPORT ROUTER
// =====================================================

module.exports = router;