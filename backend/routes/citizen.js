const express = require("express");
const jwt = require("jsonwebtoken");

const router = express.Router();

const pool = require("../db");

// ==================================================
// AUTHENTICATION MIDDLEWARE
// ==================================================

const authenticateCitizen = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // ----------------------------------------------
    // CHECK TOKEN
    // ----------------------------------------------

    if (!authHeader) {
      return res.status(401).json({
        message: "Authentication token is required.",
      });
    }

    // Expected:
    // Authorization: Bearer TOKEN

    const parts = authHeader.split(" ");

    if (
      parts.length !== 2 ||
      parts[0] !== "Bearer"
    ) {
      return res.status(401).json({
        message: "Invalid authorization format.",
      });
    }

    const token = parts[1];

    // ----------------------------------------------
    // VERIFY TOKEN
    // ----------------------------------------------

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    // ----------------------------------------------
    // CHECK ROLE
    // ----------------------------------------------

    if (
      !decoded.role ||
      decoded.role.toLowerCase() !== "citizen"
    ) {
      return res.status(403).json({
        message:
          "Access denied. Citizen account required.",
      });
    }

    // ----------------------------------------------
    // SAVE USER DATA IN REQUEST
    // ----------------------------------------------

    req.user = decoded;

    next();

  } catch (error) {
    console.error(
      "Citizen authentication error:",
      error
    );

    return res.status(401).json({
      message:
        "Invalid or expired authentication token.",
    });
  }
};

// ==================================================
// TEST CITIZEN ROUTE
// GET /api/citizen/test
// ==================================================

router.get("/test", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Citizen routes are working!",
  });
});

// ==================================================
// GET LOGGED-IN CITIZEN
// GET /api/citizen/me
// ==================================================

router.get(
  "/me",
  authenticateCitizen,
  async (req, res) => {
    try {
      const citizenId = req.user.id;

      const result = await pool.query(
        `
        SELECT
          id,
          name,
          email,
          mobile,
          role,
          created_at
        FROM users
        WHERE id = $1
        LIMIT 1
        `,
        [citizenId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          message: "Citizen not found.",
        });
      }

      const citizen = result.rows[0];

      // --------------------------------------------
      // CHECK ROLE
      // --------------------------------------------

      if (
        citizen.role &&
        citizen.role.toLowerCase() !== "citizen"
      ) {
        return res.status(403).json({
          message:
            "This account is not a citizen account.",
        });
      }

      return res.status(200).json({
        success: true,
        citizen,
      });

    } catch (error) {
      console.error(
        "Get citizen profile error:",
        error
      );

      return res.status(500).json({
        message:
          "Server error while loading citizen profile.",
      });
    }
  }
);

// ==================================================
// GET CITIZEN PROFILE
// GET /api/citizen/profile
// ==================================================

router.get(
  "/profile",
  authenticateCitizen,
  async (req, res) => {
    try {
      const citizenId = req.user.id;

      const result = await pool.query(
        `
        SELECT
          id,
          name,
          email,
          mobile,
          role,
          created_at
        FROM users
        WHERE id = $1
        LIMIT 1
        `,
        [citizenId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          message: "Citizen profile not found.",
        });
      }

      return res.status(200).json({
        success: true,
        profile: result.rows[0],
      });

    } catch (error) {
      console.error(
        "Citizen profile error:",
        error
      );

      return res.status(500).json({
        message:
          "Server error while loading profile.",
      });
    }
  }
);

// ==================================================
// UPDATE CITIZEN NAME
// PUT /api/citizen/profile
// ==================================================

router.put(
  "/profile",
  authenticateCitizen,
  async (req, res) => {
    try {
      const citizenId = req.user.id;

      const { name } = req.body;

      // --------------------------------------------
      // VALIDATION
      // --------------------------------------------

      if (!name || !name.trim()) {
        return res.status(400).json({
          message: "Name is required.",
        });
      }

      const cleanName = name.trim();

      // --------------------------------------------
      // UPDATE
      // --------------------------------------------

      const result = await pool.query(
        `
        UPDATE users
        SET name = $1
        WHERE id = $2
        RETURNING
          id,
          name,
          email,
          mobile,
          role,
          created_at
        `,
        [cleanName, citizenId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          message: "Citizen not found.",
        });
      }

      return res.status(200).json({
        success: true,
        message:
          "Profile updated successfully.",
        citizen: result.rows[0],
      });

    } catch (error) {
      console.error(
        "Update citizen profile error:",
        error
      );

      return res.status(500).json({
        message:
          "Server error while updating profile.",
      });
    }
  }
);

// ==================================================
// GET CITIZEN COMPLAINT COUNT
// GET /api/citizen/statistics
// ==================================================

router.get(
  "/statistics",
  authenticateCitizen,
  async (req, res) => {
    try {
      const citizenId = req.user.id;

      const result = await pool.query(
        `
        SELECT
          COUNT(*) AS total,
          COUNT(*) FILTER (
            WHERE status = 'Pending'
          ) AS pending,
          COUNT(*) FILTER (
            WHERE status = 'Resolved'
          ) AS resolved
        FROM complaints
        WHERE user_id = $1
        `,
        [citizenId]
      );

      return res.status(200).json({
        success: true,
        statistics: {
          total:
            Number(result.rows[0].total) || 0,

          pending:
            Number(result.rows[0].pending) || 0,

          resolved:
            Number(result.rows[0].resolved) || 0,
        },
      });

    } catch (error) {
      console.error(
        "Citizen statistics error:",
        error
      );

      return res.status(500).json({
        message:
          "Server error while loading statistics.",
      });
    }
  }
);

// ==================================================
// LOGOUT INFO
// GET /api/citizen/logout
// ==================================================
//
// JWT logout is handled on frontend by removing
// the token from localStorage.
// This endpoint simply confirms logout action.
// ==================================================

router.get(
  "/logout",
  authenticateCitizen,
  (req, res) => {
    res.status(200).json({
      success: true,
      message:
        "Citizen logout successful. Remove token on client.",
    });
  }
);

// ==================================================
// EXPORT ROUTER
// ==================================================

module.exports = router;