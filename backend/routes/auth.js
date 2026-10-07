const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../db");
const sendOTPEmail = require("../utils/email");

const router = express.Router();

// =====================================================
// CITIZEN REGISTER
// POST /api/auth/register
// =====================================================

router.post("/register", async (req, res) => {
  try {
    const {
      name,
      email,
      mobile,
      password,
    } = req.body;

    if (!name || !email || !mobile || !password) {
      return res.status(400).json({
        message: "All fields are required.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // CHECK EXISTING CITIZEN
    const existingCitizen = await db.query(
      `SELECT *
       FROM citizens
       WHERE email = $1 OR mobile = $2`,
      [normalizedEmail, mobile]
    );

    if (existingCitizen.rows.length > 0) {
      const existing = existingCitizen.rows[0];

      if (existing.email === normalizedEmail) {
        return res.status(409).json({
          message: "Email already registered.",
        });
      }

      if (existing.mobile === mobile) {
        return res.status(409).json({
          message: "Mobile number already registered.",
        });
      }
    }

    // GENERATE OTP
    const otp = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    // HASH PASSWORD
    const hashedPassword =
      await bcrypt.hash(password, 10);

    // OTP EXPIRY - 5 MINUTES
    const expiresAt = new Date(
      Date.now() + 5 * 60 * 1000
    );

    // REMOVE OLD REGISTRATION OTP
    await db.query(
      `DELETE FROM otp_verifications
       WHERE email = $1
       AND purpose = 'register'`,
      [normalizedEmail]
    );

    // REMOVE OLD PENDING REGISTRATION
    await db.query(
      `DELETE FROM pending_registrations
       WHERE email = $1`,
      [normalizedEmail]
    );

    // STORE OTP
    await db.query(
      `INSERT INTO otp_verifications
       (email, otp, purpose, user_id, expires_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        normalizedEmail,
        otp,
        "register",
        null,
        expiresAt,
      ]
    );

    // STORE TEMPORARY REGISTRATION
    await db.query(
      `INSERT INTO pending_registrations
       (name, email, mobile, password, expires_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        name.trim(),
        normalizedEmail,
        mobile,
        hashedPassword,
        expiresAt,
      ]
    );

    // SEND EMAIL
    await sendOTPEmail(
      normalizedEmail,
      otp,
      "register"
    );

    res.status(200).json({
      message:
        "Registration OTP sent to your email.",
      email: normalizedEmail,
    });

  } catch (error) {
    console.error(
      "Registration OTP error:",
      error
    );

    res.status(500).json({
      message:
        "Failed to send registration OTP.",
    });
  }
});

// =====================================================
// VERIFY REGISTRATION OTP
// POST /api/auth/verify-register-otp
// =====================================================

router.post(
  "/verify-register-otp",
  async (req, res) => {
    try {
      const { email, otp } = req.body;

      if (!email || !otp) {
        return res.status(400).json({
          message:
            "Email and OTP are required.",
        });
      }

      const normalizedEmail =
        email.trim().toLowerCase();

      // CHECK REGISTRATION OTP
      const otpResult = await db.query(
        `SELECT *
         FROM otp_verifications
         WHERE email = $1
         AND otp = $2
         AND purpose = 'register'
         AND verified = FALSE
         AND expires_at > NOW()
         ORDER BY created_at DESC
         LIMIT 1`,
        [normalizedEmail, otp]
      );

      if (otpResult.rows.length === 0) {
        return res.status(400).json({
          message:
            "Invalid or expired registration OTP.",
        });
      }

      // GET PENDING REGISTRATION
      const pendingResult =
        await db.query(
          `SELECT *
           FROM pending_registrations
           WHERE email = $1
           AND expires_at > NOW()`,
          [normalizedEmail]
        );

      if (pendingResult.rows.length === 0) {
        return res.status(400).json({
          message:
            "Registration session expired. Please register again.",
        });
      }

      const registration =
        pendingResult.rows[0];

      // CREATE CITIZEN
      const citizenResult =
        await db.query(
          `INSERT INTO citizens
           (name, email, mobile, password)
           VALUES ($1, $2, $3, $4)
           RETURNING id, name, email, mobile`,
          [
            registration.name,
            registration.email,
            registration.mobile,
            registration.password,
          ]
        );

      // MARK OTP VERIFIED
      await db.query(
        `UPDATE otp_verifications
         SET verified = TRUE
         WHERE id = $1`,
        [otpResult.rows[0].id]
      );

      // DELETE PENDING REGISTRATION
      await db.query(
        `DELETE FROM pending_registrations
         WHERE email = $1`,
        [normalizedEmail]
      );

      res.status(201).json({
        message:
          "Registration successful.",
        citizen: citizenResult.rows[0],
      });

    } catch (error) {
      console.error(
        "Registration OTP verification error:",
        error
      );

      res.status(500).json({
        message:
          "Server error during registration verification.",
      });
    }
  }
);

// =====================================================
// CITIZEN LOGIN
// POST /api/auth/citizen-login
// =====================================================

router.post(
  "/citizen-login",
  async (req, res) => {
    try {
      const {
        email,
        password,
      } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          message:
            "Email and password are required.",
        });
      }

      const normalizedEmail =
        email.trim().toLowerCase();

      // FIND CITIZEN
      const result = await db.query(
        `SELECT *
         FROM citizens
         WHERE email = $1`,
        [normalizedEmail]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({
          message:
            "Invalid email or password.",
        });
      }

      const citizen =
        result.rows[0];

      // CHECK PASSWORD
      const passwordMatch =
        await bcrypt.compare(
          password,
          citizen.password
        );

      if (!passwordMatch) {
        return res.status(401).json({
          message:
            "Invalid email or password.",
        });
      }

      // GENERATE LOGIN OTP
      const otp = Math.floor(
        100000 + Math.random() * 900000
      ).toString();

      const expiresAt = new Date(
        Date.now() + 5 * 60 * 1000
      );

      // DELETE OLD LOGIN OTP
      await db.query(
        `DELETE FROM otp_verifications
         WHERE email = $1
         AND purpose = 'login'`,
        [normalizedEmail]
      );

      // STORE LOGIN OTP
      await db.query(
        `INSERT INTO otp_verifications
         (email, otp, purpose, user_id, expires_at)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          normalizedEmail,
          otp,
          "login",
          citizen.id,
          expiresAt,
        ]
      );

      // SEND LOGIN OTP
      await sendOTPEmail(
        normalizedEmail,
        otp,
        "login"
      );

      // DO NOT GENERATE JWT YET
      res.status(200).json({
        message:
          "Login OTP sent to your email.",
        requiresOTP: true,
        email: normalizedEmail,
      });

    } catch (error) {
      console.error(
        "Citizen login OTP error:",
        error
      );

      res.status(500).json({
        message:
          "Server error during citizen login.",
      });
    }
  }
);

// =====================================================
// VERIFY CITIZEN LOGIN OTP
// POST /api/auth/verify-login-otp
// =====================================================

router.post(
  "/verify-login-otp",
  async (req, res) => {
    try {
      const { email, otp } = req.body;

      if (!email || !otp) {
        return res.status(400).json({
          message:
            "Email and OTP are required.",
        });
      }

      const normalizedEmail =
        email.trim().toLowerCase();

      // CHECK LOGIN OTP
      const otpResult = await db.query(
        `SELECT *
         FROM otp_verifications
         WHERE email = $1
         AND otp = $2
         AND purpose = 'login'
         AND verified = FALSE
         AND expires_at > NOW()
         ORDER BY created_at DESC
         LIMIT 1`,
        [normalizedEmail, otp]
      );

      if (otpResult.rows.length === 0) {
        return res.status(401).json({
          message:
            "Invalid or expired login OTP.",
        });
      }

      // FIND CITIZEN
      const citizenResult =
        await db.query(
          `SELECT id, name, email, mobile
           FROM citizens
           WHERE id = $1`,
          [otpResult.rows[0].user_id]
        );

      if (citizenResult.rows.length === 0) {
        return res.status(401).json({
          message:
            "Citizen account not found.",
        });
      }

      const citizen =
        citizenResult.rows[0];

      // MARK OTP VERIFIED
      await db.query(
        `UPDATE otp_verifications
         SET verified = TRUE
         WHERE id = $1`,
        [otpResult.rows[0].id]
      );

      // GENERATE JWT ONLY AFTER OTP
      const token = jwt.sign(
        {
          id: citizen.id,
          type: "citizen",
        },
        process.env.JWT_SECRET,
        {
          expiresIn: "1d",
        }
      );

      res.status(200).json({
        message:
          "Citizen login successful.",
        token,
        user: {
          id: citizen.id,
          name: citizen.name,
          email: citizen.email,
          mobile: citizen.mobile,
          type: "citizen",
        },
      });

    } catch (error) {
      console.error(
        "Login OTP verification error:",
        error
      );

      res.status(500).json({
        message:
          "Server error during login OTP verification.",
      });
    }
  }
);

// =====================================================
// OFFICER LOGIN
// POST /api/auth/officer-login
// =====================================================

router.post(
  "/officer-login",
  async (req, res) => {
    try {
      const {
        email,
        password,
      } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          message:
            "Email and password are required.",
        });
      }

      const normalizedEmail =
        email.trim().toLowerCase();

      const result = await db.query(
        `SELECT *
         FROM officers
         WHERE email = $1`,
        [normalizedEmail]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({
          message:
            "Invalid email or password.",
        });
      }

      const officer =
        result.rows[0];

      const passwordMatch =
        await bcrypt.compare(
          password,
          officer.password
        );

      if (!passwordMatch) {
        return res.status(401).json({
          message:
            "Invalid email or password.",
        });
      }

      const token = jwt.sign(
        {
          id: officer.id,
          type: "officer",
        },
        process.env.JWT_SECRET,
        {
          expiresIn: "1d",
        }
      );

      res.status(200).json({
        message:
          "Officer login successful.",
        token,
        user: {
          id: officer.id,
          name: officer.name,
          email: officer.email,
          mobile: officer.mobile,
          department: officer.department,
          type: "officer",
        },
      });

    } catch (error) {
      console.error(
        "Officer login error:",
        error
      );

      res.status(500).json({
        message:
          "Server error during officer login.",
      });
    }
  }
);

// =====================================================
// ADMIN LOGIN
// POST /api/auth/admin-login
// =====================================================

router.post(
  "/admin-login",
  async (req, res) => {
    try {
      const {
        email,
        password,
      } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          message:
            "Email and password are required.",
        });
      }

      const normalizedEmail =
        email.trim().toLowerCase();

      console.log(
        "ADMIN LOGIN ATTEMPT:",
        normalizedEmail
      );

      const result = await db.query(
        `SELECT id, name, email, password
         FROM admins
         WHERE LOWER(email) = $1`,
        [normalizedEmail]
      );

      if (result.rows.length === 0) {
        console.log("ADMIN NOT FOUND");

        return res.status(401).json({
          message:
            "Invalid admin email or password.",
        });
      }

      const admin =
        result.rows[0];

      console.log(
        "ADMIN FOUND:",
        admin.email
      );

      if (!admin.password) {
        return res.status(500).json({
          message:
            "Admin password is not configured in database.",
        });
      }

      const passwordMatch =
        await bcrypt.compare(
          password,
          admin.password
        );

      console.log(
        "PASSWORD MATCH:",
        passwordMatch
      );

      if (!passwordMatch) {
        return res.status(401).json({
          message:
            "Invalid admin email or password.",
        });
      }

      const token = jwt.sign(
        {
          id: admin.id,
          type: "admin",
        },
        process.env.JWT_SECRET,
        {
          expiresIn: "1d",
        }
      );

      res.status(200).json({
        message:
          "Admin login successful.",
        token,
        user: {
          id: admin.id,
          name: admin.name,
          email: admin.email,
          type: "admin",
        },
      });

    } catch (error) {
      console.error(
        "Admin login error:",
        error
      );

      res.status(500).json({
        message:
          "Server error during admin login.",
        error: error.message,
      });
    }
  }
);

// =====================================================
// FORGOT PASSWORD - SEND OTP
// POST /api/auth/forgot-password
// =====================================================

router.post(
  "/forgot-password",
  async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          message: "Email is required.",
        });
      }

      const normalizedEmail =
        email.trim().toLowerCase();

      // =====================================================
      // FIND USER
      // =====================================================

      let user = null;
      let userType = null;

      // CHECK CITIZEN
      const citizenResult =
        await db.query(
          `SELECT id, name, email
           FROM citizens
           WHERE LOWER(email) = $1`,
          [normalizedEmail]
        );

      if (citizenResult.rows.length > 0) {
        user = citizenResult.rows[0];
        userType = "citizen";
      }

      // CHECK OFFICER
      if (!user) {
        const officerResult =
          await db.query(
            `SELECT id, name, email
             FROM officers
             WHERE LOWER(email) = $1`,
            [normalizedEmail]
          );

        if (officerResult.rows.length > 0) {
          user = officerResult.rows[0];
          userType = "officer";
        }
      }

      // CHECK ADMIN
      if (!user) {
        const adminResult =
          await db.query(
            `SELECT id, name, email
             FROM admins
             WHERE LOWER(email) = $1`,
            [normalizedEmail]
          );

        if (adminResult.rows.length > 0) {
          user = adminResult.rows[0];
          userType = "admin";
        }
      }

      // USER NOT FOUND
      if (!user) {
        return res.status(404).json({
          message:
            "No account found with this email.",
        });
      }

      // =====================================================
      // GENERATE NEW FORGOT PASSWORD OTP
      // =====================================================

      const otp = Math.floor(
        100000 + Math.random() * 900000
      ).toString();

      // OTP VALID FOR 5 MINUTES
      const expiresAt = new Date(
        Date.now() + 5 * 60 * 1000
      );

      // =====================================================
      // DELETE OLD FORGOT PASSWORD OTP
      // =====================================================

      await db.query(
        `DELETE FROM otp_verifications
         WHERE email = $1
         AND purpose = 'forgot_password'`,
        [normalizedEmail]
      );

      // =====================================================
      // STORE NEW OTP
      // =====================================================

      await db.query(
        `INSERT INTO otp_verifications
         (email, otp, purpose, user_id, expires_at, user_type)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          normalizedEmail,
          otp,
          "forgot_password",
          user.id,
          expiresAt,
          userType,
        ]
      );

      // =====================================================
      // SEND FORGOT PASSWORD OTP
      // =====================================================

      await sendOTPEmail(
        normalizedEmail,
        otp,
        "forgot_password"
      );

      res.status(200).json({
        message:
          "Password reset OTP sent to your email.",
        email: normalizedEmail,
        userType: userType,
      });

    } catch (error) {
      console.error(
        "Forgot password OTP error:",
        error
      );

      res.status(500).json({
        message:
          "Failed to send password reset OTP.",
      });
    }
  }
);

// =====================================================
// VERIFY FORGOT PASSWORD OTP
// POST /api/auth/verify-forgot-password-otp
// =====================================================

router.post(
  "/verify-forgot-password-otp",
  async (req, res) => {
    try {
      const { email, otp } = req.body;

      if (!email || !otp) {
        return res.status(400).json({
          message:
            "Email and OTP are required.",
        });
      }

      const normalizedEmail =
        email.trim().toLowerCase();

      // =====================================================
      // CHECK OTP
      // =====================================================

      const otpResult = await db.query(
        `SELECT *
         FROM otp_verifications
         WHERE email = $1
         AND otp = $2
         AND purpose = 'forgot_password'
         AND verified = FALSE
         AND expires_at > NOW()
         ORDER BY created_at DESC
         LIMIT 1`,
        [normalizedEmail, otp]
      );

      if (otpResult.rows.length === 0) {
        return res.status(400).json({
          message:
            "Invalid or expired password reset OTP.",
        });
      }

      const resetOTP =
        otpResult.rows[0];

      // MAKE SURE USER TYPE EXISTS
      if (!resetOTP.user_type) {
        return res.status(400).json({
          message:
            "Invalid password reset request.",
        });
      }

      res.status(200).json({
        message:
          "OTP verified successfully.",
        userType: resetOTP.user_type,
      });

    } catch (error) {
      console.error(
        "Forgot password OTP verification error:",
        error
      );

      res.status(500).json({
        message:
          "Server error during OTP verification.",
      });
    }
  }
);

// =====================================================
// RESET PASSWORD
// POST /api/auth/reset-password
// =====================================================

router.post(
  "/reset-password",
  async (req, res) => {
    try {
      const {
        email,
        otp,
        newPassword,
      } = req.body;

      if (!email || !otp || !newPassword) {
        return res.status(400).json({
          message:
            "Email, OTP and new password are required.",
        });
      }

      const normalizedEmail =
        email.trim().toLowerCase();

      // =====================================================
      // CHECK PASSWORD FORMAT
      // =====================================================

      const passwordRegex =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$#!%*?&]).{8,}$/;

      if (!passwordRegex.test(newPassword)) {
        return res.status(400).json({
          message:
            "Password must contain uppercase, lowercase, number, special character and be at least 8 characters.",
        });
      }

      // =====================================================
      // VERIFY OTP AGAIN
      // =====================================================

      const otpResult = await db.query(
        `SELECT *
         FROM otp_verifications
         WHERE email = $1
         AND otp = $2
         AND purpose = 'forgot_password'
         AND verified = FALSE
         AND expires_at > NOW()
         ORDER BY created_at DESC
         LIMIT 1`,
        [normalizedEmail, otp]
      );

      if (otpResult.rows.length === 0) {
        return res.status(400).json({
          message:
            "Invalid or expired password reset OTP.",
        });
      }

      const resetOTP =
        otpResult.rows[0];

      const userType =
        resetOTP.user_type;

      if (!userType) {
        return res.status(400).json({
          message:
            "Invalid password reset request.",
        });
      }

      // =====================================================
      // HASH NEW PASSWORD
      // =====================================================

      const hashedPassword =
        await bcrypt.hash(newPassword, 10);

      let updateResult;

      // =====================================================
      // UPDATE CITIZEN PASSWORD
      // =====================================================

      if (userType === "citizen") {
        updateResult = await db.query(
          `UPDATE citizens
           SET password = $1
           WHERE LOWER(email) = $2
           RETURNING id, name, email`,
          [
            hashedPassword,
            normalizedEmail,
          ]
        );
      }

      // =====================================================
      // UPDATE OFFICER PASSWORD
      // =====================================================

      else if (userType === "officer") {
        updateResult = await db.query(
          `UPDATE officers
           SET password = $1
           WHERE LOWER(email) = $2
           RETURNING id, name, email`,
          [
            hashedPassword,
            normalizedEmail,
          ]
        );
      }

      // =====================================================
      // UPDATE ADMIN PASSWORD
      // =====================================================

      else if (userType === "admin") {
        updateResult = await db.query(
          `UPDATE admins
           SET password = $1
           WHERE LOWER(email) = $2
           RETURNING id, name, email`,
          [
            hashedPassword,
            normalizedEmail,
          ]
        );
      }

      // =====================================================
      // INVALID USER TYPE
      // =====================================================

      else {
        return res.status(400).json({
          message:
            "Invalid account type.",
        });
      }

      // =====================================================
      // ACCOUNT NOT FOUND
      // =====================================================

      if (
        !updateResult ||
        updateResult.rows.length === 0
      ) {
        return res.status(404).json({
          message:
            "Account not found.",
        });
      }

      // =====================================================
      // MARK OTP AS USED
      // =====================================================

      await db.query(
        `UPDATE otp_verifications
         SET verified = TRUE
         WHERE id = $1`,
        [resetOTP.id]
      );

      // =====================================================
      // SUCCESS
      // =====================================================

      res.status(200).json({
        message:
          "Password reset successful. You can now login with your new password.",
        userType: userType,
      });

    } catch (error) {
      console.error(
        "Reset password error:",
        error
      );

      res.status(500).json({
        message:
          "Server error while resetting password.",
      });
    }
  }
);

module.exports = router;