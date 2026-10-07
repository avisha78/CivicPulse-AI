
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import civicpothole from "../assets/civic-pothole.jpg";
import civicwaste from "../assets/civic-waste.jpg";
import civicwater from "../assets/civic-water.jpg";

import {
  FileText,
  BrainCircuit,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Users,
} from "lucide-react";

import { useAppSettings } from "../components/AppSettingsContext";
import "./Home.css";

function Home() {
  const navigate = useNavigate();

  // ==================================================
  // GLOBAL SETTINGS
  // ==================================================

  const {
    darkMode,
    toggleDarkMode,
    language,
    setLanguage,
    t,
  } = useAppSettings();

  // ==================================================
  // LOCAL STATE
  // ==================================================

  const [showLoginPopup, setShowLoginPopup] = useState(false);

  const isHindi = language === "Hindi";
  const isMarathi = language === "Marathi";

  // ==================================================
  // REPORT ISSUE
  // ==================================================

  const handleReportIssue = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");

    // --------------------------------------------------
    // USER IS NOT LOGGED IN
    // --------------------------------------------------

    if (!token || !userData) {
      setShowLoginPopup(true);
      return;
    }

    let user;

    // --------------------------------------------------
    // CHECK USER DATA
    // --------------------------------------------------

    try {
      user = JSON.parse(userData);
    } catch (error) {
      console.error("Invalid user data:", error);

      localStorage.removeItem("token");
      localStorage.removeItem("user");

      setShowLoginPopup(true);
      return;
    }

    // --------------------------------------------------
    // ONLY CITIZEN CAN REPORT COMPLAINT
    // --------------------------------------------------

    const role = user?.role?.toLowerCase();

    if (role !== "citizen") {
      setShowLoginPopup(true);
      return;
    }

    // --------------------------------------------------
    // CITIZEN IS LOGGED IN
    // --------------------------------------------------

    navigate("/report-complaint");
  };

  // ==================================================
  // LOGIN POPUP
  // ==================================================

  const handlePopupLogin = () => {
    setShowLoginPopup(false);
    navigate("/login");
  };

  return (
    <div
      className={`cp-home-page ${
        darkMode ? "dark-theme" : ""
      }`}
    >

      {/* ==================================================
          NAVBAR
      ================================================== */}

      <nav className="cp-navbar">
        <div className="cp-navbar-inner">

          <Link to="/" className="cp-brand">
            <div className="cp-brand-icon">
              <img
                src="/civicpulse-logo.png"
                alt="CivicPulse AI"
              />
            </div>

            <div className="cp-brand-text">
              <strong>CivicPulse AI</strong>

              <span>
                {isMarathi
                  ? "स्मार्ट शहर. स्मार्ट उपाय."
                  : isHindi
                  ? "स्मार्ट शहर. स्मार्ट समाधान."
                  : "Smart City. Smart Solutions."}
              </span>
            </div>
          </Link>

          <div className="cp-nav-links">

            <Link to="/about">
              {t("about")}
            </Link>

            <Link to="/features">
              {t("features")}
            </Link>

            <Link to="/how-it-works">
              {t("howItWorks")}
            </Link>

            <Link to="/categories">
              {t("categories")}
            </Link>

            <Link to="/daily-news">
              {t("dailyNews")}
            </Link>

            <Link to="/contact">
              {t("contact")}
            </Link>

          </div>

          <div className="cp-nav-actions">

            <button
              className="cp-theme-button"
              onClick={toggleDarkMode}
              type="button"
            >
              {darkMode ? "☀️" : "🌙"}
            </button>

            <select
              value={language}
              onChange={(e) =>
                setLanguage(e.target.value)
              }
            >
              <option value="English">
                English
              </option>

              <option value="Hindi">
                हिंदी
              </option>

              <option value="Marathi">
                मराठी
              </option>
            </select>

            <Link
              to="/login"
              className="cp-login-btn"
            >
              {t("login")}
            </Link>

            <Link
              to="/register"
              className="cp-register-btn"
            >
              {t("register")}
            </Link>

          </div>
        </div>
      </nav>

      {/* ==================================================
          HERO
      ================================================== */}

      <section className="cp-hero">

        <div className="cp-hero-bg"></div>

        <div className="cp-hero-overlay"></div>

        <div className="cp-hero-container">

          <div className="cp-hero-content">

            <div className="cp-hero-badge">
              <span></span>
              AI-POWERED CIVIC MANAGEMENT
            </div>

            <h1>

              <span className="hero-dark-text">
                {t("heroTitle1")}
              </span>

              <br />

              <span className="hero-dark-text">
                {t("heroTitle2")}
              </span>

              <br />

              <span className="hero-amber-text">
                {t("heroTitle3")}
              </span>

            </h1>

            <p>
              {t("heroDescription")}
            </p>

            <div className="cp-hero-buttons">

              <button
                className="cp-primary-btn"
                onClick={handleReportIssue}
                type="button"
              >
                <FileText size={19} />
                {t("reportIssue")}
              </button>

              <Link
                to="/features"
                className="cp-secondary-btn"
              >
                {t("explore")}
                <ArrowRight size={18} />
              </Link>

            </div>

            <div className="cp-hero-mini-stats">

              <div>
                <strong>12,500+</strong>

                <span>
                  {t("issuesReported")}
                </span>
              </div>

              <div>
                <strong>95%</strong>

                <span>
                  {t("resolutionRate")}
                </span>
              </div>

              <div>
                <strong>2.5M+</strong>

                <span>
                  {t("citizensServed")}
                </span>
              </div>

            </div>

          </div>

          {/* ==================================================
              FLOATING CARDS
          ================================================== */}

          <div className="cp-hero-cards">

            <div className="cp-floating-card cp-card-one">

              <div className="cp-card-icon">
                <Users size={20} />
              </div>

              <div>
                <strong>
                  {t("citizenFirst")}
                </strong>

                <p>
                  {t("everyVoice")}
                </p>
              </div>

            </div>

            <div className="cp-floating-card cp-card-two">

              <div className="cp-card-icon">
                <BrainCircuit size={20} />
              </div>

              <div>
                <strong>
                  {t("smartWorkflow")}
                </strong>

                <p>
                  {t("aiRouting")}
                </p>
              </div>

            </div>

            <div className="cp-floating-card cp-card-three">

              <div className="cp-card-icon success">
                <CheckCircle2 size={20} />
              </div>

              <div>
                <strong>
                  {t("fasterResolution")}
                </strong>

                <p>
                  {t("trackEveryStep")}
                </p>
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* ==================================================
          METRICS
      ================================================== */}

      <section className="cp-metrics">

        <div className="cp-section-container cp-metrics-grid">

          <div>
            <strong>12,500+</strong>

            <span>
              {t("issuesReported")}
            </span>
          </div>

          <div>
            <strong>95%</strong>

            <span>
              {t("resolutionRate")}
            </span>
          </div>

          <div>
            <strong>250+</strong>

            <span>
              {t("municipalities")}
            </span>
          </div>

          <div>
            <strong>2.5M+</strong>

            <span>
              {t("citizensServed")}
            </span>
          </div>

        </div>
      </section>

      {/* ==================================================
          REAL CIVIC PROBLEMS
      ================================================== */}

      <section
        className="cp-section cp-problems-section"
        id="problems"
      >

        <div className="cp-section-container">

          <div className="cp-section-heading">

            <span className="cp-section-badge">
              {t("realCivicProblems")}
            </span>

            <h2>
              {t("problemsTitle")}
            </h2>

            <p>
              {t("problemsDescription")}
            </p>

          </div>

          <div className="cp-problem-grid">

            {/* POTHOLES */}

            <div className="cp-problem-card">

              <div
                className="cp-problem-bg road"
                style={{
                  backgroundImage:
                    `url(${civicpothole})`,
                }}
              ></div>

              <div className="cp-problem-overlay"></div>

              <div className="cp-problem-content">

                <div className="cp-problem-number">
                  01
                </div>

                <h3>
                  {t("potholes")}
                </h3>

                <p>
                  {t("potholesDesc")}
                </p>

              </div>

            </div>

            {/* WASTE */}

            <div className="cp-problem-card">

              <div
                className="cp-problem-bg waste"
                style={{
                  backgroundImage:
                    `url(${civicwaste})`,
                }}
              ></div>

              <div className="cp-problem-overlay"></div>

              <div className="cp-problem-content">

                <div className="cp-problem-number">
                  02
                </div>

                <h3>
                  {t("waste")}
                </h3>

                <p>
                  {t("wasteDesc")}
                </p>

              </div>

            </div>

            {/* WATER */}

            <div className="cp-problem-card">

              <div
                className="cp-problem-bg water"
                style={{
                  backgroundImage:
                    `url(${civicwater})`,
                }}
              ></div>

              <div className="cp-problem-overlay"></div>

              <div className="cp-problem-content">

                <div className="cp-problem-number">
                  03
                </div>

                <h3>
                  {t("water")}
                </h3>

                <p>
                  {t("waterDesc")}
                </p>

              </div>

            </div>

          </div>
        </div>
      </section>

      {/* ==================================================
          TRUST
      ================================================== */}

      <section className="cp-trust">

        <div className="cp-section-container">

          <span>
            {t("trustTitle")}
          </span>

          <div className="cp-trust-items">

            <div>
              <ShieldCheck size={22} />
              {t("municipalCorporation")}
            </div>

            <div>
              <ShieldCheck size={22} />
              {t("smartCity")}
            </div>

            <div>
              <ShieldCheck size={22} />
              {t("cityAdministration")}
            </div>

            <div>
              <ShieldCheck size={22} />
              {t("publicServices")}
            </div>

          </div>
        </div>
      </section>

      {/* ==================================================
          FINAL CTA
      ================================================== */}

      <section className="cp-final-cta">

        <div className="cp-final-cta-bg"></div>

        <div className="cp-final-cta-content">

          <span className="cp-section-badge">
            CIVICPULSE AI
          </span>

          <h2>
            {t("ctaTitle")}
          </h2>

          <p>
            {t("ctaDesc")}
          </p>

          <div className="cp-final-buttons">

            <button
              className="cp-primary-btn"
              onClick={handleReportIssue}
              type="button"
            >
              <FileText size={19} />
              {t("reportIssue")}
            </button>

            <Link
              to="/register"
              className="cp-secondary-btn"
            >
              {t("getStarted")}
              <ArrowRight size={18} />
            </Link>

          </div>

        </div>
      </section>

      {/* ==================================================
          LOGIN POPUP
      ================================================== */}

      {showLoginPopup && (

        <div
          className="cp-popup-overlay"
          onClick={() =>
            setShowLoginPopup(false)
          }
        >

          <div
            className="cp-login-popup"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="cp-popup-icon">
              🔒
            </div>

            <h3>
              {t("loginRequired")}
            </h3>

            <p>
              {t("loginMessage")}
            </p>

            <div className="cp-popup-buttons">

              <button
                className="cp-cancel-btn"
                onClick={() =>
                  setShowLoginPopup(false)
                }
                type="button"
              >
                {t("cancel")}
              </button>

              <button
                className="cp-popup-login-btn"
                onClick={handlePopupLogin}
                type="button"
              >
                {t("login")}
              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}

export default Home;

