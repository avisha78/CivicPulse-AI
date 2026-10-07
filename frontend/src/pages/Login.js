import React from "react";

import { Link } from "react-router-dom";

import {
  FaUser,
  FaUserTie,
  FaUserShield,
  FaSignInAlt,
  FaArrowLeft,
} from "react-icons/fa";

import { useAppSettings } from "../components/AppSettingsContext";

function Login() {
  const { t } = useAppSettings();

  return (
    <div className="cp-auth-page">

      {/* =====================================================
          LOGIN CARD
      ===================================================== */}

      <div className="cp-auth-card">

        {/* LOGO / ICON */}
        <div className="cp-auth-logo">
          <FaSignInAlt />
        </div>

        {/* HEADER */}
        <h1>{t("welcome")}</h1>

        <p className="cp-auth-subtitle">
          {t("loginSubtitle")}
        </p>

        {/* =================================================
            LOGIN OPTIONS
        ================================================= */}

        <div className="cp-login-options">

          {/* CITIZEN LOGIN */}
          <Link
            to="/citizen-login"
            className="cp-login-option"
          >
            <div className="cp-login-option-icon">
              <FaUser />
            </div>

            <div className="cp-login-option-content">
              <strong>{t("citizenLogin")}</strong>
              <span>
                {t("citizenLoginDesc")}
              </span>
            </div>

            <span className="cp-login-option-arrow">
              →
            </span>
          </Link>

          {/* OFFICER LOGIN */}
          <Link
            to="/officer-login"
            className="cp-login-option"
          >
            <div className="cp-login-option-icon">
              <FaUserTie />
            </div>

            <div className="cp-login-option-content">
              <strong>{t("officerLogin")}</strong>
              <span>
                {t("officerLoginDesc")}
              </span>
            </div>

            <span className="cp-login-option-arrow">
              →
            </span>
          </Link>

          {/* ADMIN LOGIN */}
          <Link
            to="/admin-login"
            className="cp-login-option"
          >
            <div className="cp-login-option-icon">
              <FaUserShield />
            </div>

            <div className="cp-login-option-content">
              <strong>{t("adminLogin")}</strong>
              <span>
                {t("adminLoginDesc")}
              </span>
            </div>

            <span className="cp-login-option-arrow">
              →
            </span>
          </Link>

        </div>

        {/* =================================================
            REGISTER
        ================================================= */}

        <div className="cp-auth-footer">

          <span>
            {t("dontHaveAccount")}{" "}
          </span>

          <Link
            to="/register"
            className="cp-auth-link"
          >
            {t("register")}
          </Link>

          <br />

          <Link
            to="/"
            className="cp-back-home"
          >
            <FaArrowLeft />
            {t("backToHome")}
          </Link>

        </div>

      </div>
    </div>
  );
}

export default Login;