
import React, { useState } from "react";

import {
  FaEye,
  FaEyeSlash,
  FaUserTie,
  FaArrowLeft,
  FaSignInAlt,
} from "react-icons/fa";

import { Link, useNavigate } from "react-router-dom";

import axios from "axios";

import { useAppSettings } from "../components/AppSettingsContext";

function OfficerLogin() {
  const navigate = useNavigate();
  const { t } = useAppSettings();

  // ==========================================
  // FORM DATA
  // ==========================================

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  // ==========================================
  // STATES
  // ==========================================

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // ==========================================
  // HANDLE INPUT CHANGE
  // ==========================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: "",
      server: "",
    }));
  };

  // ==========================================
  // VALIDATE FORM
  // ==========================================

  const validateForm = () => {
    const newErrors = {};

    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    const email = formData.email.trim();
    const password = formData.password;

    // EMAIL
    if (!email) {
      newErrors.email = t("officerEmailRequired");
    } else if (!emailRegex.test(email)) {
      newErrors.email = t("validOfficerEmail");
    }

    // PASSWORD
    if (!password) {
      newErrors.password = t("passwordRequired");
    } else if (password.length < 8) {
      newErrors.password =
        t("passwordMinLength");
    }

    return newErrors;
  };

  // ==========================================
  // HANDLE LOGIN
  // ==========================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    // ------------------------------------------
    // VALIDATE
    // ------------------------------------------

    const validationErrors = validateForm();

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      setLoading(true);
      setErrors({});

      // ----------------------------------------
      // CALL OFFICER LOGIN API
      // ----------------------------------------

      const response = await axios.post(
        "http://localhost:5000/api/auth/officer-login",
        {
          email: formData.email
            .trim()
            .toLowerCase(),

          password: formData.password,
        }
      );

      console.log(
        "OFFICER LOGIN RESPONSE:",
        response.data
      );

      const data = response.data;

      // ----------------------------------------
      // CHECK OFFICER DATA
      // ----------------------------------------

      if (!data || !data.user) {
        setErrors({
          server:
            t("officerInformationNotReceived"),
        });

        return;
      }

      const officer = data.user;

      // ----------------------------------------
      // CHECK OFFICER TYPE
      // ----------------------------------------

      if (
        !officer.type ||
        officer.type.toLowerCase() !== "officer"
      ) {
        setErrors({
          server:
            t("officerNotAuthorized"),
        });

        return;
      }

      // ----------------------------------------
      // CHECK TOKEN
      // ----------------------------------------

      if (!data.token) {
        setErrors({
          server:
            t("loginTokenNotReceived"),
        });

        return;
      }

      // ----------------------------------------
      // CLEAR OLD LOGIN DATA
      // ----------------------------------------

      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("officer");
      localStorage.removeItem("currentUser");

      // ----------------------------------------
      // SAVE TOKEN
      // ----------------------------------------

      localStorage.setItem(
        "token",
        data.token
      );

      // ----------------------------------------
      // SAVE OFFICER
      // ----------------------------------------

      localStorage.setItem(
        "officer",
        JSON.stringify(officer)
      );

      // ----------------------------------------
      // SAVE USER
      // ----------------------------------------

      localStorage.setItem(
        "user",
        JSON.stringify(officer)
      );

      // ----------------------------------------
      // SAVE CURRENT USER
      // ----------------------------------------

      localStorage.setItem(
        "currentUser",
        JSON.stringify({
          id: officer.id || null,

          name: officer.name || "",

          email:
            officer.email ||
            formData.email.trim().toLowerCase(),

          role: "officer",

          department:
            officer.department || "",
        })
      );

      // ----------------------------------------
      // DEBUG
      // ----------------------------------------

      console.log(
        "LOGGED-IN OFFICER:",
        officer
      );

      console.log(
        "TOKEN:",
        localStorage.getItem("token")
      );

      console.log(
        "CURRENT USER:",
        localStorage.getItem(
          "currentUser"
        )
      );

      // ----------------------------------------
      // GO TO OFFICER DASHBOARD
      // ----------------------------------------

      navigate("/officer-dashboard", {
        replace: true,
      });

    } catch (error) {
      console.error(
        "Officer login error:",
        error
      );

      // ----------------------------------------
      // SERVER ERROR
      // ----------------------------------------

      if (error.response) {
        console.error(
          "SERVER RESPONSE:",
          error.response.data
        );

        setErrors({
          server:
            error.response.data?.message ||
            t("invalidOfficerCredentials"),
        });

      // ----------------------------------------
      // REQUEST ERROR
      // ----------------------------------------

      } else if (error.request) {
        setErrors({
          server:
            t("serverConnectionError"),
        });

      // ----------------------------------------
      // OTHER ERROR
      // ----------------------------------------

      } else {
        setErrors({
          server:
            t("somethingWentWrong"),
        });
      }

    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // PAGE UI
  // ==========================================

  return (
    <div className="cp-auth-page">

      {/* ======================================
          AUTH CARD
      ====================================== */}

      <div className="cp-auth-card">

        {/* ICON */}
        <div className="cp-auth-logo">
          <FaUserTie />
        </div>

        {/* TITLE */}
        <h1>
          {t("officerLogin")}
        </h1>

        <p className="cp-auth-subtitle">
          {t("officerLoginSubtitle")}
        </p>

        {/* SERVER ERROR */}

        {errors.server && (
          <div className="cp-error-message">
            {errors.server}
          </div>
        )}

        {/* FORM */}

        <form onSubmit={handleSubmit}>

          {/* EMAIL */}

          <div className="cp-form-group">

            <label htmlFor="officerEmail">
              {t("officerEmail")}
            </label>

            <input
              id="officerEmail"
              type="email"
              name="email"
              placeholder={t(
                "officerEmailPlaceholder"
              )}
              value={formData.email}
              onChange={handleChange}
              autoComplete="email"
              className={
                errors.email
                  ? "cp-input cp-input-error"
                  : "cp-input"
              }
            />

            {errors.email && (
              <span className="cp-field-error">
                {errors.email}
              </span>
            )}

          </div>

          {/* PASSWORD */}

          <div className="cp-form-group">

            <label htmlFor="officerPassword">
              {t("password")}
            </label>

            <div className="cp-password-wrapper">

              <input
                id="officerPassword"
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                name="password"
                placeholder={t(
                  "passwordPlaceholderLogin"
                )}
                value={formData.password}
                onChange={handleChange}
                autoComplete="current-password"
                className={
                  errors.password
                    ? "cp-input cp-input-error"
                    : "cp-input"
                }
              />

              {/* PASSWORD TOGGLE */}

              <button
                type="button"
                className="cp-password-toggle"
                onClick={() =>
                  setShowPassword(
                    (prev) => !prev
                  )
                }
                aria-label={
                  showPassword
                    ? t("hidePassword")
                    : t("showPassword")
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
              <span className="cp-field-error">
                {errors.password}
              </span>
            )}

          </div>

          {/* FORGOT PASSWORD */}

          <div className="cp-forgot-password">

            <Link
              to="/forgot-password"
              state={{ from: "officer" }}
            >
              {t("forgotPassword")}
            </Link>

          </div>

          {/* LOGIN BUTTON */}

          <button
            type="submit"
            className="cp-auth-button"
            disabled={loading}
          >

            <FaSignInAlt />

            <span>
              {loading
                ? t("loggingIn")
                : t("loginAsOfficer")}
            </span>

          </button>

        </form>

        {/* BACK TO LOGIN */}

        <div className="cp-auth-footer">

          <Link
            to="/login"
            className="cp-back-home"
          >
            <FaArrowLeft />
            {t("backToLogin")}
          </Link>

        </div>

      </div>

    </div>
  );
}

export default OfficerLogin;

