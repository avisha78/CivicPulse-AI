const bcrypt = require("bcryptjs");
const pool = require("./db");

async function resetAdminPassword() {
  try {
    const email = "avishavarkute26@gmail.com";
    const newPassword = "Avisha@123";

    // Create bcrypt password hash
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update admin password
    const result = await pool.query(
      `
      UPDATE users
      SET password = $1,
          role = 'admin'
      WHERE email = $2
      RETURNING id, name, email, role
      `,
      [hashedPassword, email]
    );

    if (result.rows.length === 0) {
      console.log("❌ Admin user not found");
    } else {
      console.log("✅ Admin password updated successfully");
      console.log(result.rows[0]);
      console.log("📧 Email:", email);
      console.log("🔑 Password:", newPassword);
    }

  } catch (error) {
    console.error("❌ Error resetting admin password:");
    console.error(error);
  } finally {
    await pool.end();
  }
}

resetAdminPassword();