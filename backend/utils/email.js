const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendOTPEmail = async (email, otp, purpose) => {

  const isRegistration = purpose === "register";
  const isLogin = purpose === "login";
  const isForgotPassword =
    purpose === "forgot_password";

  let subject;
  let heading;
  let message;

  // =====================================================
  // REGISTRATION OTP
  // =====================================================

  if (isRegistration) {
    subject = "CivicPulse AI - Registration OTP";

    heading = "Verify Your CivicPulse AI Account";

    message =
      "Use this OTP to complete your CivicPulse AI registration.";
  }

  // =====================================================
  // LOGIN OTP
  // =====================================================

  else if (isLogin) {
    subject = "CivicPulse AI - Login OTP";

    heading = "Verify Your CivicPulse AI Login";

    message =
      "Use this OTP to complete your CivicPulse AI login.";
  }

  // =====================================================
  // FORGOT PASSWORD OTP
  // =====================================================

  else if (isForgotPassword) {
    subject =
      "CivicPulse AI - Password Reset OTP";

    heading =
      "Reset Your CivicPulse AI Password";

    message =
      "Use this OTP to verify your identity and reset your CivicPulse AI password.";
  }

  // =====================================================
  // UNKNOWN PURPOSE
  // =====================================================

  else {
    throw new Error(
      "Invalid OTP email purpose."
    );
  }

  // =====================================================
  // SEND EMAIL
  // =====================================================

  await transporter.sendMail({
    from: `"CivicPulse AI" <${process.env.EMAIL_USER}>`,

    to: email,

    subject: subject,

    html: `
      <div style="
        font-family: Arial, sans-serif;
        max-width: 600px;
        margin: 30px auto;
        padding: 30px;
        border: 1px solid #ddd;
        border-radius: 15px;
        background: #ffffff;
      ">

        <h2 style="
          color: #16834a;
          margin-bottom: 10px;
        ">
          CivicPulse AI
        </h2>

        <h3>
          ${heading}
        </h3>

        <p>
          ${message}
        </p>

        <div style="
          font-size: 32px;
          font-weight: bold;
          letter-spacing: 8px;
          text-align: center;
          background: #f1f8f4;
          padding: 20px;
          border-radius: 10px;
          margin: 25px 0;
        ">
          ${otp}
        </div>

        <p>
          This OTP is valid for
          <strong>5 minutes</strong>.
        </p>

        <p style="color: #777;">
          If you did not request this OTP,
          please ignore this email.
        </p>

        <hr />

        <p style="
          font-size: 13px;
          color: #777;
        ">
          Smart City. Smart Solutions.
        </p>

      </div>
    `,
  });
};

module.exports = sendOTPEmail;