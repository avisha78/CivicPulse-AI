import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAppSettings } from "./AppSettingsContext";
import "./Navbar.css";

function Navbar() {
  const location = useLocation();
  const {
    darkMode,
    toggleDarkMode,
    language,
    setLanguage,
  } = useAppSettings();

  const handleThemeToggle = () => {
    toggleDarkMode();
  };

  const isHomePage = location.pathname === "/";

  const scrollToSection = (id) => {
    if (!isHomePage) {
      window.location.href = `/#${id}`;
      return;
    }

    const section = document.getElementById(id);

    if (section) {
      section.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  return (
    <nav className="cp-navbar">
      <div className="cp-navbar-inner">

        {/* ================= LOGO ================= */}
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
              Smart City. Smart Solutions.
            </span>
          </div>

        </Link>


        {/* ================= NAVIGATION ================= */}
        <div className="cp-nav-links">

          <button onClick={() => scrollToSection("about")}>
            About
          </button>

          <button onClick={() => scrollToSection("features")}>
            Features
          </button>

          <button onClick={() => scrollToSection("how-it-works")}>
            How It Works
          </button>

          <button onClick={() => scrollToSection("categories")}>
            Categories
          </button>

          <Link to="/contact">
            Contact
          </Link>

        </div>


        {/* ================= RIGHT SIDE ================= */}
        <div className="cp-nav-actions">

          {/* Theme */}
          <button
            className="cp-theme-button"
            onClick={handleThemeToggle}
            aria-label="Toggle theme"
          >
            {darkMode ? "☀️" : "🌙"}
          </button>


          {/* Language */}
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="cp-language-select"
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


          {/* Login */}
          <Link
            to="/login"
            className="cp-login-btn"
          >
            Login
          </Link>


          {/* Register */}
          <Link
            to="/register"
            className="cp-register-btn"
          >
            Register
          </Link>

        </div>

      </div>
    </nav>
  );
}

export default Navbar;