
import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import {
  FaEye,
  FaEyeSlash,
  FaUser,
  FaEnvelope,
  FaPhone,
  FaTimes,
} from "react-icons/fa";
import { useAppSettings } from "../components/AppSettingsContext";
import cityWards from "./cityWards";
import "./Register.css";

function Register() {
  const navigate = useNavigate();
  const { t } = useAppSettings();

  // ==================================================
  // FORM DATA
  // ==================================================

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    mobile: "",
    password: "",
    confirmPassword: "",
    city: "",
    ward: "",
    nationalId: "",
  });

  // ==================================================
  // STATES
  // ==================================================

  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showOTP, setShowOTP] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Policy modals
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  // ==================================================
  // HANDLE INPUT
  // ==================================================

  const handleChange = (e) => {
    const { name, value } = e.target;



    let newValue = value;


    // Full name - only letters and spaces
    if (name === "fullName") {
      newValue = value.replace(/[^A-Za-z ]/g, "");
    }

    // Mobile - only numbers, max 10 digits
    if (name === "mobile") {
      newValue = value.replace(/\D/g, "").slice(0, 10);
    }

    // National ID - only numbers, max 12 digits
    if (name === "nationalId") {
      newValue = value.replace(/\D/g, "").slice(0, 12);
    }

    // ==================================================
    // CITY CHANGE
    // Reset ward whenever city changes
    // ==================================================

    if (name === "city") {
      setFormData((prev) => ({
        ...prev,
        city: newValue,
        ward: "",
      }));

      setErrors((prev) => ({
        ...prev,
        city: "",
        ward: "",
        server: "",
      }));

      setSuccessMessage("");
      return;
    }

    // ==================================================
    // NORMAL INPUT
    // ==================================================

    setFormData((prev) => ({
      ...prev,
      [name]: newValue,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: "",
      server: "",
    }));

    setSuccessMessage("");
  };

  // ==================================================
  // REGISTER
  // ==================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = {};

    // -----------------------------
    // FULL NAME
    // -----------------------------

    if (!formData.fullName.trim()) {
      newErrors.fullName = t("fullNameRequired");
    } else if (formData.fullName.trim().length < 3) {
      newErrors.fullName = t("fullNameMinLength");
    }

    // -----------------------------
    // EMAIL
    // -----------------------------

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formData.email.trim()) {
      newErrors.email = t("emailRequired");
    } else if (!emailRegex.test(formData.email.trim())) {
      newErrors.email = t("validEmail");
    }

    // -----------------------------
    // MOBILE
    // -----------------------------

    if (!/^\d{10}$/.test(formData.mobile)) {
      newErrors.mobile = t("mobileExactDigits");
    }

    // -----------------------------
    // PASSWORD
    // -----------------------------

    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$#!%*?&]).{8,}$/;

    if (!formData.password) {
      newErrors.password = t("passwordRequired");
    } else if (!passwordRegex.test(formData.password)) {
      newErrors.password = t("passwordRequirements");
    }

    // -----------------------------
    // CONFIRM PASSWORD
    // -----------------------------

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = t("confirmPasswordRequired");
    } else if (formData.confirmPassword !== formData.password) {
      newErrors.confirmPassword = t("passwordMismatch");
    }

    // -----------------------------
    // CITY
    // -----------------------------

    if (!formData.city) {
      newErrors.city = "Please select your City";
    }

    // -----------------------------
    // WARD
    // -----------------------------

    if (!formData.ward) {
      newErrors.ward = "Please select your Ward";
    }

    // -----------------------------
    // NATIONAL ID
    // OPTIONAL
    // -----------------------------

    if (
      formData.nationalId &&
      !/^\d{12}$/.test(formData.nationalId)
    ) {
      newErrors.nationalId = "National ID must be 12 digits";
    }

    // -----------------------------
    // TERMS
    // -----------------------------

    if (!termsAccepted) {
      newErrors.terms =
        "Please accept the Terms & Conditions and Privacy Policy";
    }

    // -----------------------------
    // STOP IF ERRORS
    // -----------------------------

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // ==================================================
    // API CALL
    // ==================================================

    try {
      setRegisterLoading(true);
      setErrors({});
      setSuccessMessage("");

      const response = await axios.post(
        "http://localhost:5000/api/auth/register",
        {
          name: formData.fullName.trim(),
          email: formData.email.trim().toLowerCase(),
          mobile: formData.mobile,
          password: formData.password,
                    // NEW
          city: formData.city,
          ward: formData.ward,
          street: formData.street,
          nationalId: formData.nationalId,
        }
      );

      console.log("Registration response:", response.data);

      // Show OTP section
      setShowOTP(true);

      setSuccessMessage(t("otpSent"));
    } catch (error) {
      console.error("Registration error:", error);

      if (error.response) {
        const message =
          error.response.data?.message ||
          t("registrationFailed");

        if (message.toLowerCase().includes("email")) {
          setErrors({
            email: message,
          });
        } else if (message.toLowerCase().includes("mobile")) {
          setErrors({
            mobile: message,
          });
        } else {
          setErrors({
            server: message,
          });
        }
      } else {
        setErrors({
          server: t("serverConnectionError"),
        });
      }
    } finally {
      setRegisterLoading(false);
    }
  };

  // ==================================================
  // VERIFY REGISTRATION OTP
  // ==================================================

  const handleVerifyOTP = async () => {
    if (!/^\d{6}$/.test(otp)) {
      setErrors({
        otp: t("validOTP"),
      });
      return;
    }

    try {
      setOtpLoading(true);
      setErrors({});
      setSuccessMessage("");

      const response = await axios.post(
        "http://localhost:5000/api/auth/verify-register-otp",
        {
          email: formData.email.trim().toLowerCase(),
          otp: otp,
        }
      );

      console.log("OTP verification:", response.data);

      setSuccessMessage(t("registrationSuccessful"));

      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (error) {
      console.error("OTP verification error:", error);

      setErrors({
        otp:
          error.response?.data?.message ||
          t("invalidExpiredOTP"),
      });
    } finally {
      setOtpLoading(false);
    }
  };

  // ==================================================
  // CLOSE POLICY MODALS
  // ==================================================

  const closePolicyModals = () => {
    setShowTermsModal(false);
    setShowPrivacyModal(false);
  };

  // ==================================================
  // PAGE
  // ==================================================

  return (
    <div className="register-page">

      {/* BACKGROUND SHAPES */}

      <div className="register-bg-shape register-bg-one"></div>
      <div className="register-bg-shape register-bg-two"></div>

      {/* ==================================================
          NAVBAR
      ================================================== */}

      <nav className="register-navbar">
        <div className="register-navbar-inner">

          {/* BRAND */}

          <Link
            to="/"
            className="register-brand"
          >
            <div className="register-brand-icon">
              <img
                src="/civicpulse-logo.png"
                alt="CivicPulse AI"
              />
            </div>

            <div className="register-brand-text">
              <strong>
                CivicPulse AI
              </strong>

              <span>
                {t("smartCitySmartSolutions")}
              </span>
            </div>
          </Link>

          {/* NAV RIGHT */}

          <div className="register-nav-right">
            <span>
              {t("alreadyHaveAccount")}
            </span>

            <button
              onClick={() => navigate("/login")}
              className="register-login-nav"
            >
              {t("login")}
            </button>
          </div>

        </div>
      </nav>

      {/* ==================================================
          MAIN
      ================================================== */}

      <main className="register-main">

        <div className="register-container">

          {/* ==================================================
              LEFT INFORMATION SECTION
          ================================================== */}

          <div className="register-info">

            <div className="register-badge">
              <span></span>
              CIVICPULSE AI
            </div>

            <h1>
              {t("joinThe")}
              <br />

              <span>
                CivicPulse
              </span>

              <br />

              {t("community")}
            </h1>

            <p>
              {t("registerDescription")}
            </p>

            {/* BENEFITS */}

            <div className="register-benefits">

              {/* BENEFIT 1 */}

              <div className="register-benefit">

                <div className="register-benefit-icon">
                  <FaUser />
                </div>

                <div>
                  <strong>
                    {t("citizenFirst")}
                  </strong>

                  <span>
                    {t("yourVoiceMatters")}
                  </span>
                </div>

              </div>

              {/* BENEFIT 2 */}

              <div className="register-benefit">

                <div className="register-benefit-icon">
                  ✓
                </div>

                <div>
                  <strong>
                    {t("trackComplaints")}
                  </strong>

                  <span>
                    {t("followEveryStep")}
                  </span>
                </div>

              </div>

              {/* BENEFIT 3 */}

              <div className="register-benefit">

                <div className="register-benefit-icon">
                  ⚡
                </div>

                <div>
                  <strong>
                    {t("fasterResolution")}
                  </strong>

                  <span>
                    {t("helpAuthorities")}
                  </span>
                </div>

              </div>

            </div>

          </div>

          {/* ==================================================
              REGISTER CARD
          ================================================== */}

          <div className="register-card">

            {/* CARD HEADER */}

            <div className="register-card-header">

              <div className="register-card-icon">
                <FaUser />
              </div>

              <div>

                <h2>
                  {showOTP
                    ? t("verifyYourEmail")
                    : t("createCitizenAccount")}
                </h2>

                <p>
                  {showOTP
                    ? t("enterOTPFromEmail")
                    : t("registerToReportTrack")}
                </p>

              </div>

            </div>

            {/* ==================================================
                SUCCESS MESSAGE
            ================================================== */}

            {successMessage && (
              <div className="register-success">
                <span>✓</span>
                {successMessage}
              </div>
            )}

            {/* ==================================================
                SERVER ERROR
            ================================================== */}

            {errors.server && (
              <div className="register-error-box">
                {errors.server}
              </div>
            )}

            {/* ==================================================
                REGISTRATION FORM
            ================================================== */}

            {!showOTP ? (

              <form onSubmit={handleSubmit}>

                {/* FULL NAME */}

                <div className="register-form-group">

                  <label>
                    <FaUser />
                    {t("fullName")}
                  </label>

                  <div
                    className={`register-input-wrapper ${
                      errors.fullName
                        ? "input-error"
                        : ""
                    }`}
                  >

                    <input
                      type="text"
                      name="fullName"
                      placeholder={t("fullNamePlaceholder")}
                      value={formData.fullName}
                      onChange={handleChange}
                    />

                  </div>

                  {errors.fullName && (
                    <div className="register-field-error">
                      {errors.fullName}
                    </div>
                  )}

                </div>

                {/* EMAIL */}

                <div className="register-form-group">

                  <label>
                    <FaEnvelope />
                    {t("emailAddress")}
                  </label>

                  <div
                    className={`register-input-wrapper ${
                      errors.email
                        ? "input-error"
                        : ""
                    }`}
                  >

                    <input
                      type="email"
                      name="email"
                      placeholder={t("emailPlaceholder")}
                      value={formData.email}
                      onChange={handleChange}
                    />

                  </div>

                  {errors.email && (
                    <div className="register-field-error">
                      {errors.email}
                    </div>
                  )}

                </div>

                {/* MOBILE */}

                <div className="register-form-group">

                  <label>
                    <FaPhone />
                    {t("mobileNumber")}
                  </label>

                  <div
                    className={`register-input-wrapper ${
                      errors.mobile
                        ? "input-error"
                        : ""
                    }`}
                  >

                    <input
                      type="text"
                      name="mobile"
                      placeholder={t("mobilePlaceholder")}
                      value={formData.mobile}
                      onChange={handleChange}
                      maxLength="10"
                      inputMode="numeric"
                    />

                  </div>

                  {errors.mobile && (
                    <div className="register-field-error">
                      {errors.mobile}
                    </div>
                  )}

                </div>

                {/* PASSWORD + CONFIRM PASSWORD */}

                <div className="register-password-row">

                  {/* PASSWORD */}

                  <div className="register-form-group">

                    <label>
                      {t("password")}
                    </label>

                    <div
                      className={`register-input-wrapper ${
                        errors.password
                          ? "input-error"
                          : ""
                      }`}
                    >

                      <input
                        type={
                          showPassword
                            ? "text"
                            : "password"
                        }
                        name="password"
                        placeholder={t("passwordPlaceholder")}
                        value={formData.password}
                        onChange={handleChange}
                      />

                      <button
                        type="button"
                        className="password-toggle"
                        onClick={() =>
                          setShowPassword(
                            !showPassword
                          )
                        }
                      >
                        {showPassword ? (
                          <FaEyeSlash />
                        ) : (
                          <FaEye />
                        )}
                      </button>

                    </div>

                    {errors.password && (
                      <div className="register-field-error">
                        {errors.password}
                      </div>
                    )}

                    <small>
                      {t("passwordHint")}
                    </small>

                  </div>

                  {/* CONFIRM PASSWORD */}

                  <div className="register-form-group">

                    <label>
                      {t("confirmPassword")}
                    </label>

                    <div
                      className={`register-input-wrapper ${
                        errors.confirmPassword
                          ? "input-error"
                          : ""
                      }`}
                    >

                      <input
                        type={
                          showConfirmPassword
                            ? "text"
                            : "password"
                        }
                        name="confirmPassword"
                        placeholder={t(
                          "confirmPasswordPlaceholder"
                        )}
                        value={
                          formData.confirmPassword
                        }
                        onChange={handleChange}
                      />

                      <button
                        type="button"
                        className="password-toggle"
                        onClick={() =>
                          setShowConfirmPassword(
                            !showConfirmPassword
                          )
                        }
                      >
                        {showConfirmPassword ? (
                          <FaEyeSlash />
                        ) : (
                          <FaEye />
                        )}
                      </button>

                    </div>

                    {errors.confirmPassword && (
                      <div className="register-field-error">
                        {errors.confirmPassword}
                      </div>
                    )}

                  </div>

                </div>

                {/* CITY */}

                <div className="register-form-group">

                  <label>
                    City
                  </label>

                  <div
                    className={`register-input-wrapper ${
                      errors.city
                        ? "input-error"
                        : ""
                    }`}
                  >

                    <select
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      className="register-select"
                    >

                      <option value="">
                        Select City
                      </option>

                      {Object.keys(cityWards).map(
                        (city) => (
                          <option
                            key={city}
                            value={city}
                          >
                            {city}
                          </option>
                        )
                      )}

                    </select>

                  </div>

                  {errors.city && (
                    <div className="register-field-error">
                      {errors.city}
                    </div>
                  )}

                </div>

                {/* WARD */}

                <div className="register-form-group">

                  <label>
                    Ward
                  </label>

                  <div
                    className={`register-input-wrapper ${
                      errors.ward
                        ? "input-error"
                        : ""
                    }`}
                  >

                    <select
                      name="ward"
                      value={formData.ward}
                      onChange={handleChange}
                      className="register-select"
                      disabled={!formData.city}
                    >

                      <option value="">
                        {formData.city
                          ? "Select Ward"
                          : "First Select City"}
                      </option>

                      {(cityWards[formData.city] || []).map(
                        (ward) => (
                          <option
                            key={ward}
                            value={ward}
                          >
                            {ward}
                          </option>
                        )
                      )}

                    </select>

                  </div>

                  {errors.ward && (
                    <div className="register-field-error">
                      {errors.ward}
                    </div>
                  )}

                </div>

                {/* AADHAAR / NATIONAL ID */}

                <div className="register-form-group">

                  <label>
                    Aadhaar / National ID

                    <span className="optional-label">
                      {" "}
                      (Optional)
                    </span>
                  </label>

                  <div
                    className={`register-input-wrapper ${
                      errors.nationalId
                        ? "input-error"
                        : ""
                    }`}
                  >

                    <input
                      type="text"
                      name="nationalId"
                      placeholder="12-digit number for instant verification"
                      value={formData.nationalId}
                      onChange={handleChange}
                      maxLength="12"
                      inputMode="numeric"
                    />

                  </div>

                  {errors.nationalId && (
                    <div className="register-field-error">
                      {errors.nationalId}
                    </div>
                  )}

                </div>

                {/* ==================================================
                    TERMS & CONDITIONS
                ================================================== */}

                <div className="register-terms">

                  <label className="register-checkbox-label">

                    <input
                      type="checkbox"
                      checked={termsAccepted}
                      onChange={(e) => {
                        setTermsAccepted(
                          e.target.checked
                        );

                        if (e.target.checked) {
                          setErrors((prev) => ({
                            ...prev,
                            terms: "",
                          }));
                        }
                      }}
                    />

                    <span>
                      I agree to{" "}

                      <button
                        type="button"
                        className="register-policy-link"
                        onClick={() =>
                          setShowTermsModal(true)
                        }
                      >
                        Terms & Conditions
                      </button>

                      {" "}and{" "}

                      <button
                        type="button"
                        className="register-policy-link"
                        onClick={() =>
                          setShowPrivacyModal(true)
                        }
                      >
                        Privacy Policy
                      </button>

                    </span>

                  </label>

                  {errors.terms && (
                    <div className="register-field-error">
                      {errors.terms}
                    </div>
                  )}

                </div>

                {/* REGISTER BUTTON */}

                <button
                  type="submit"
                  className="register-submit"
                  disabled={registerLoading}
                >

                  {registerLoading
                    ? t("sendingOTP")
                    : t("createAccount")}

                  <span>
                    →
                  </span>

                </button>

              </form>

            ) : (

              /* ==================================================
                 OTP FORM
              ================================================== */

              <div className="register-otp-section">

                {/* OTP EMAIL */}

                <div
                  style={{
                    textAlign: "center",
                    marginBottom: "20px",
                  }}
                >

                  <div
                    style={{
                      fontSize: "45px",
                      marginBottom: "10px",
                    }}
                  >
                    📧
                  </div>

                  <p>
                    {t("otpSentTo")}
                  </p>

                  <strong>
                    {formData.email}
                  </strong>

                </div>

                {/* OTP INPUT */}

                <div className="register-form-group">

                  <label>
                    {t("enterOTP")}
                  </label>

                  <div
                    className={`register-input-wrapper ${
                      errors.otp
                        ? "input-error"
                        : ""
                    }`}
                  >

                    <input
                      type="text"
                      placeholder={t("otpPlaceholder")}
                      value={otp}
                      onChange={(e) =>
                        setOtp(
                          e.target.value
                            .replace(/\D/g, "")
                            .slice(0, 6)
                        )
                      }
                      maxLength="6"
                      inputMode="numeric"
                    />

                  </div>

                  {errors.otp && (
                    <div className="register-field-error">
                      {errors.otp}
                    </div>
                  )}

                </div>

                {/* VERIFY OTP */}

                <button
                  type="button"
                  className="register-submit"
                  onClick={handleVerifyOTP}
                  disabled={otpLoading}
                >

                  {otpLoading
                    ? t("verifying")
                    : t("verifyOTP")}

                  <span>
                    ✓
                  </span>

                </button>

                {/* EDIT DETAILS */}

                <button
                  type="button"
                  onClick={() => {
                    setShowOTP(false);
                    setOtp("");
                    setErrors({});
                    setSuccessMessage("");
                  }}
                  style={{
                    width: "100%",
                    marginTop: "12px",
                    padding: "12px",
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                  }}
                >
                  ← {t("editRegistrationDetails")}
                </button>

              </div>
            )}

            {/* ==================================================
                LOGIN
            ================================================== */}

            <div className="register-login-bottom">

              <span>
                {t("alreadyHaveAccount")}
              </span>

              <button
                type="button"
                onClick={() => navigate("/login")}
              >
                {t("login")}
              </button>

            </div>

          </div>

        </div>

      </main>

      {/* ==================================================
          FOOTER
      ================================================== */}

      <footer className="register-footer">

        <div>
          © {new Date().getFullYear()} CivicPulse AI
        </div>

        <span>
          {t("smartCitySmartSolutions")}
        </span>

      </footer>

      {/* ==================================================
          TERMS & CONDITIONS MODAL
      ================================================== */}

      {showTermsModal && (
        <div
          className="register-policy-overlay"
          onClick={closePolicyModals}
        >
          <div
            className="register-policy-modal"
            onClick={(e) => e.stopPropagation()}
          >

            <div className="register-policy-header">

              <h2>
                Terms & Conditions
              </h2>

              <button
                type="button"
                className="register-policy-close"
                onClick={closePolicyModals}
                aria-label="Close Terms & Conditions"
              >
                <FaTimes />
              </button>

            </div>

            <div className="register-policy-content">

              <h3>1. Acceptance of Terms</h3>

              <p>
                By creating an account on CivicPulse AI,
                you agree to follow these Terms & Conditions.
                If you do not agree with these terms, please
                do not create an account.
              </p>

              <h3>2. Use of CivicPulse AI</h3>

              <p>
                CivicPulse AI is a civic grievance management
                platform that allows citizens to report public
                issues and track their complaints.
              </p>

              <h3>3. Accurate Information</h3>

              <p>
                You agree to provide accurate and genuine
                information while creating your account and
                submitting complaints.
              </p>

              <h3>4. Responsible Complaints</h3>

              <p>
                Complaints should relate to genuine civic
                issues. False, misleading, abusive or
                inappropriate complaints should not be submitted.
              </p>

              <h3>5. Complaint Processing</h3>

              <p>
                CivicPulse AI may use automated AI systems to
                classify, prioritize and route complaints to
                the appropriate department.
              </p>

              <h3>6. Account Security</h3>

              <p>
                You are responsible for keeping your login
                credentials secure and for all activities
                performed through your account.
              </p>

              <h3>7. Changes to Terms</h3>

              <p>
                CivicPulse AI may update these Terms &
                Conditions when necessary. Continued use of
                the platform means you accept the updated terms.
              </p>

            </div>

            <div className="register-policy-footer">

              <button
                type="button"
                onClick={closePolicyModals}
              >
                Close
              </button>

            </div>

          </div>
        </div>
      )}

      {/* ==================================================
          PRIVACY POLICY MODAL
      ================================================== */}

      {showPrivacyModal && (
        <div
          className="register-policy-overlay"
          onClick={closePolicyModals}
        >
          <div
            className="register-policy-modal"
            onClick={(e) => e.stopPropagation()}
          >

            <div className="register-policy-header">

              <h2>
                Privacy Policy
              </h2>

              <button
                type="button"
                className="register-policy-close"
                onClick={closePolicyModals}
                aria-label="Close Privacy Policy"
              >
                <FaTimes />
              </button>

            </div>

            <div className="register-policy-content">

              <h3>1. Information We Collect</h3>

              <p>
                CivicPulse AI may collect information such as
                your name, email address, mobile number, city,
                ward and complaint details when you use the
                platform.
              </p>

              <h3>2. Complaint Information</h3>

              <p>
                Information submitted with a civic complaint,
                including descriptions, locations and uploaded
                images, may be used to process and manage the
                complaint.
              </p>

              <h3>3. Use of Information</h3>

              <p>
                Your information is used to provide civic
                grievance services, verify your account,
                process complaints and improve the platform.
              </p>

              <h3>4. AI Processing</h3>

              <p>
                CivicPulse AI may process complaint text,
                images and location information using AI
                systems for classification, prioritization,
                verification and duplicate detection.
              </p>

              <h3>5. Data Security</h3>

              <p>
                Reasonable security measures are used to
                protect account and complaint information from
                unauthorized access.
              </p>

              <h3>6. Information Sharing</h3>

              <p>
                Complaint information may be shared with the
                relevant civic department or authorized
                officials when required to process and resolve
                the reported issue.
              </p>

              <h3>7. Policy Updates</h3>

              <p>
                This Privacy Policy may be updated from time
                to time to reflect changes in the platform or
                applicable requirements.
              </p>

            </div>

            <div className="register-policy-footer">

              <button
                type="button"
                onClick={closePolicyModals}
              >
                Close
              </button>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}

export default Register;



