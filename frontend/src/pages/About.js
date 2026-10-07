import React from "react";

import { BrainCircuit, ArrowRight } from "lucide-react";

import { Link } from "react-router-dom";

import { useAppSettings } from "../components/AppSettingsContext";

import "./Home.css";

function About() {
  const { t } = useAppSettings();

  return (
    <div className="cp-home-page">

      {/* =================================================
          ABOUT PAGE
      ================================================= */}

      <section className="cp-section cp-about">

        <div className="cp-section-container cp-about-grid">

          {/* LEFT CONTENT */}

          <div className="cp-about-text">

            <span className="cp-section-badge">
              {t("aboutCivicPulse")}
            </span>

            <h2>
              {t("aboutTitle")}
            </h2>

            <p>
              {t("aboutDescription1")}
            </p>

            <p>
              {t("aboutDescription2")}
            </p>

            <div className="cp-quote">
              {t("aboutQuote")}
            </div>

            <Link
              to="/report-complaint"
              className="cp-primary-btn"
              style={{
                display: "inline-flex",
                marginTop: "25px",
                textDecoration: "none",
              }}
            >
              {t("reportIssue")}
              <ArrowRight size={18} />
            </Link>

          </div>


          {/* RIGHT VISUAL */}

          <div className="cp-about-visual">

            <div className="cp-about-image">

              <div className="cp-about-image-overlay">

                <div className="cp-about-icon">
                  <BrainCircuit size={35} />
                </div>

                <h3>
                  {t("aiCitizensAdministration")}
                </h3>

                <p>
                  {t("connectedCivicEcosystem")}
                </p>

              </div>

            </div>

          </div>

        </div>

      </section>


      {/* =================================================
          OUR PURPOSE
      ================================================= */}

      <section className="cp-section">

        <div className="cp-section-container">

          <div className="cp-section-heading">

            <span className="cp-section-badge">
              {t("ourPurpose")}
            </span>

            <h2>
              {t("purposeTitle")}
            </h2>

            <p>
              {t("purposeDescription")}
            </p>

          </div>


          <div className="cp-stakeholder-grid">

            {/* AI */}

            <div className="cp-stakeholder-card">

              <div className="cp-stakeholder-icon">
                <BrainCircuit size={30} />
              </div>

              <h3>
                {t("artificialIntelligence")}
              </h3>

              <p>
                {t("aiDescription")}
              </p>

            </div>


            {/* CITIZENS */}

            <div className="cp-stakeholder-card">

              <div className="cp-stakeholder-icon">
                👥
              </div>

              <h3>
                {t("citizenParticipation")}
              </h3>

              <p>
                {t("citizenDescription")}
              </p>

            </div>


            {/* ADMINISTRATION */}

            <div className="cp-stakeholder-card">

              <div className="cp-stakeholder-icon">
                🏛️
              </div>

              <h3>
                {t("betterAdministration")}
              </h3>

              <p>
                {t("administrationDescription")}
              </p>

            </div>

          </div>

        </div>

      </section>


      {/* =================================================
          VISION
      ================================================= */}

      <section className="cp-section">

        <div className="cp-section-container">

          <div className="cp-impact">

            <div className="cp-impact-decoration one"></div>

            <div className="cp-impact-decoration two"></div>

            <div className="cp-section-heading">

              <span className="cp-section-badge">
                {t("ourVision")}
              </span>

              <h2>
                {t("visionTitle")}
              </h2>

              <p>
                {t("visionDescription")}
              </p>

            </div>

          </div>

        </div>

      </section>

    </div>
  );
}

export default About;

