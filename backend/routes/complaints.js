const express = require("express");
const jwt = require("jsonwebtoken");
const pool = require("../db");
const axios = require("axios");
const FormData = require("form-data");
const { createNotification } = require("../utils/notifications");


const router = express.Router();

const multer = require("multer");
const path = require("path");

// =====================================
// IMAGE UPLOAD CONFIGURATION
// =====================================
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../uploads"));
  },

  filename: function (req, file, cb) {
    const uniqueName =
      Date.now() +
      "-" +
      Math.round(Math.random() * 1E9) +
      path.extname(file.originalname);

    cb(null, uniqueName);
  },
});

const upload = multer({
  storage: storage,
});

// =====================================
// AUTHENTICATION MIDDLEWARE
// =====================================

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      message: "Authentication token is required",
    });
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      message: "Invalid authentication token",
    });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    req.user = decoded;
    next();
  } catch (error) {
    console.error("Token verification error:", error);

    return res.status(403).json({
      message: "Invalid or expired token",
    });
  }
};

// =====================================
// CREATE COMPLAINT
// =====================================

router.post(
  "/",
  authenticateToken,
  upload.single("image"),
  async (req, res) => {
     
    try {
   
  const {
  category,
  description,
  location,
  latitude,
  longitude,
} = req.body;

const image = req.file
  ? req.file.filename
  : null;

    // -----------------------------
    // VALIDATION
    // -----------------------------

    if (!category || !description || !location) {
      return res.status(400).json({
        message:
          "Category, description and location are required",
      });
    }


    // =====================================
// AI IMAGE CLASSIFICATION
// =====================================

let aiImageResult = null;

if (req.file) {
  try {
    const formData = new FormData();

    formData.append(
      "file",
      require("fs").createReadStream(req.file.path),
      {
        filename: req.file.filename,
        contentType: req.file.mimetype,
      }
    );

    const aiResponse = await axios.post(
      "http://127.0.0.1:8000/classify-image",
      formData,
      {
        headers: {
          ...formData.getHeaders(),
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      }
    );

    aiImageResult = aiResponse.data;

    console.log(
      "AI Image Classification:",
      aiImageResult
    );

  } catch (aiError) {
    console.error(
      "AI image classification error:",
      aiError.response?.data || aiError.message
    );
  }
}


// =====================================
// AI TEXT / NLP CLASSIFICATION
// =====================================
console.log("===== STARTING NLP CLASSIFICATION =====");

let aiTextResult = null;

try {
  const aiResponse = await axios.post(
    "http://127.0.0.1:8000/classify",
    {
      text: description.trim(),
    }
  );

  aiTextResult = aiResponse.data;

  console.log(
    "AI Text Classification:",
    aiTextResult
  );

} catch (aiError) {

  console.error(
    "AI text classification error:",
    aiError.response?.data || aiError.message
  );

}


// =====================================
// FINAL AI CLASSIFICATION
// =====================================

let finalAIResult = null;

if (aiTextResult && aiImageResult) {

  // If both AI models predict the same category
  if (
    aiTextResult.category ===
    aiImageResult.category
  ) {
    finalAIResult = {
      category: aiTextResult.category,
      department: aiTextResult.department,
      confidence: Math.max(
        aiTextResult.confidence,
        aiImageResult.confidence
      ),
      source: "text + image",
    };

  } else {

    // If predictions are different,
    // use the result with higher confidence
    if (
      aiTextResult.confidence >=
      aiImageResult.confidence
    ) {
      finalAIResult = {
        category: aiTextResult.category,
        department: aiTextResult.department,
        confidence: aiTextResult.confidence,
        source: "text",
      };
    } else {
      finalAIResult = {
        category: aiImageResult.category,
        department: aiImageResult.department,
        confidence: aiImageResult.confidence,
        source: "image",
      };
    }
  }

} else if (aiTextResult) {

  finalAIResult = {
    category: aiTextResult.category,
    department: aiTextResult.department,
    confidence: aiTextResult.confidence,
    source: "text",
  };

} else if (aiImageResult) {

  finalAIResult = {
    category: aiImageResult.category,
    department: aiImageResult.department,
    confidence: aiImageResult.confidence,
    source: "image",
  };
}

console.log(
  "FINAL AI RESULT:",
  finalAIResult
);


// =====================================
// DUPLICATE DETECTION
// =====================================

let isDuplicate = false;
let duplicateSimilarity = 0;
let duplicateComplaintId = null;

try {

  // Get previous complaints
  const existingComplaints = await pool.query(
    `
    SELECT id, description
    FROM complaints
    WHERE description IS NOT NULL
    ORDER BY created_at DESC
    `
  );

  for (const existingComplaint of existingComplaints.rows) {

    try {

      const duplicateResponse = await axios.post(
        "http://127.0.0.1:8000/check-duplicate",
        {
          text1: description.trim(),
          text2: existingComplaint.description,
        }
      );

      const duplicateResult = duplicateResponse.data;

      console.log(
        "Duplicate Check:",
        {
          complaintId: existingComplaint.id,
          similarity: duplicateResult.similarity,
          duplicate: duplicateResult.duplicate,
        }
      );

      // Keep highest similarity
      if (
        duplicateResult.similarity >
        duplicateSimilarity
      ) {
        duplicateSimilarity =
          duplicateResult.similarity;
        duplicateComplaintId = existingComplaint.id;
      }

      if (duplicateResult.duplicate) {
        isDuplicate = true;
      }

    } catch (duplicateError) {

      console.error(
        "Individual duplicate check error:",
        duplicateError.response?.data ||
        duplicateError.message
      );

    }
  }

  console.log(
    "FINAL DUPLICATE RESULT:",
    {
      isDuplicate,
      duplicateSimilarity,
    }
  );

} catch (duplicateError) {

  console.error(
    "Duplicate detection error:",
    duplicateError.message
  );

}

    let priorityResult = null;
    try {
      const priorityResponse = await axios.post(
        "http://127.0.0.1:8000/priority",
        {
          text: description.trim(),
          category: finalAIResult?.category || category,
          source: "citizen",
        }
      );
      priorityResult = priorityResponse.data;
    } catch (priorityError) {
      console.error("Priority prediction error:", priorityError.message);
    }

    // -----------------------------
    // INSERT COMPLAINT
    // -----------------------------

    const result = await pool.query(
    `INSERT INTO complaints
(
  user_id,
  category,
  description,
  location,
  latitude,
  longitude,
  image,
  ai_category,
  ai_department,
  ai_confidence,
  ai_source,
  priority,
  severity,
  priority_score,
  is_duplicate,
  duplicate_of,
  duplicate_similarity,
  source
)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      RETURNING *`,
      [
        req.user.id,
        category,
        description.trim(),
        location.trim(),
        latitude || null,
        longitude || null,
        image || null,
        finalAIResult?.category || null,
        finalAIResult?.department || null,
        finalAIResult?.confidence || null,
        finalAIResult?.source || null,
        priorityResult?.priority || "Medium",
        priorityResult?.severity || "Medium",
        priorityResult?.score || null,
        isDuplicate,
        isDuplicate ? duplicateComplaintId : null,
        duplicateSimilarity || null,
        "citizen",
      ]
    );

    let savedComplaint = result.rows[0];
    if (finalAIResult?.department) {
      const officerResult = await pool.query(
        `SELECT id FROM officers
         WHERE LOWER(department) LIKE LOWER($1)
            OR LOWER($1) LIKE '%' || LOWER(department) || '%'
         ORDER BY id LIMIT 1`,
        [`%${finalAIResult.department}%`]
      );
      if (officerResult.rows.length) {
        const assigned = await pool.query(
          `UPDATE complaints SET officer_id = $1, status = 'In Progress'
           WHERE id = $2 RETURNING *`,
          [officerResult.rows[0].id, savedComplaint.id]
        );
        savedComplaint = assigned.rows[0];
      }
    }

    if (savedComplaint.officer_id) {
      await createNotification(
        savedComplaint.user_id,
        savedComplaint.id,
        "Complaint assigned",
        "Your complaint has been routed to the responsible municipal department."
      );
    }

    // -----------------------------
    // SUCCESS RESPONSE
    // -----------------------------

    res.status(201).json({
      message: "Complaint submitted successfully",
      complaint: savedComplaint,
    });
  } catch (error) {
    console.error("Complaint submission error:", error);

    res.status(500).json({
      message: "Failed to submit complaint",
    });
  }
});

// =====================================
// GET LOGGED-IN CITIZEN COMPLAINTS
// =====================================

router.get("/my", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT *
       FROM complaints
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [req.user.id]
    );

    res.json({
      complaints: result.rows,
    });
  } catch (error) {
    console.error("Fetch complaints error:", error);

    res.status(500).json({
      message: "Failed to fetch complaints",
    });
  }
});

router.get("/nearby", async (req, res) => {
  const latitude = Number(req.query.latitude);
  const longitude = Number(req.query.longitude);
  const radius = Math.min(Number(req.query.radius) || 10, 50);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return res.status(400).json({ message: "latitude and longitude are required" });
  }

  const result = await pool.query(
    `SELECT * FROM (
       SELECT complaints.*,
        (6371 * acos(LEAST(1, cos(radians($1)) * cos(radians(latitude)) *
        cos(radians(longitude) - radians($2)) + sin(radians($1)) * sin(radians(latitude))))) AS distance_km
       FROM complaints
       WHERE latitude IS NOT NULL AND longitude IS NOT NULL
     ) nearby
     WHERE distance_km <= $3 ORDER BY distance_km ASC`,
    [latitude, longitude, radius]
  );
  res.json({ complaints: result.rows });
});

router.get("/:id/history", authenticateToken, async (req, res) => {
  const result = await pool.query(
    `SELECT * FROM complaint_status_history WHERE complaint_id = $1 ORDER BY created_at ASC`,
    [req.params.id]
  );
  res.json({ history: result.rows });
});

router.put("/:id/verify", authenticateToken, async (req, res) => {
  const result = await pool.query(
    `UPDATE complaints SET citizen_verified = TRUE
     WHERE id = $1 AND user_id = $2 AND status = 'Resolved' RETURNING *`,
    [req.params.id, req.user.id]
  );
  if (!result.rows.length) return res.status(404).json({ message: "Resolved complaint not found" });
  res.json({ complaint: result.rows[0] });
});

// =====================================
// GET ALL COMPLAINTS - ADMIN
// =====================================

router.get(
  "/admin/all",
  authenticateToken,
  async (req, res) => {
    try {
      // Check admin role

      if (req.user.role !== "admin") {
        return res.status(403).json({
          message: "Admin access required",
        });
      }

      const result = await pool.query(`
        SELECT
          c.id,
          c.category,
          c.description,
          c.location,
          c.latitude,
          c.longitude,
          c.image,
          c.status,
          c.created_at,
          u.name AS citizen_name,
          u.email AS citizen_email,
          u.mobile AS citizen_mobile
        FROM complaints c
        JOIN users u
          ON c.user_id = u.id
        ORDER BY c.created_at DESC
      `);

      res.status(200).json({
        complaints: result.rows,
      });
    } catch (error) {
      console.error("Admin complaints error:", error);

      res.status(500).json({
        message: "Failed to fetch complaints",
      });
    }
  }
);

module.exports = router;