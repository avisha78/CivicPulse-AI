
import React from "react";

import { useAppSettings } from "../components/AppSettingsContext";

import "./Home.css";

function HowItWorks() {
  const { t } = useAppSettings();

  const workflow = [
    {
      num: "01",
      title: t("reportStep"),
      desc: t("reportStepDesc"),
    },
    {
      num: "02",
      title: t("aiClassification"),
      desc: t("aiClassificationDesc"),
    },
    {
      num: "03",
      title: t("smartRoutingStep"),
      desc: t("smartRoutingStepDesc"),
    },
    {
      num: "04",
      title: t("trackProgress"),
      desc: t("trackProgressDesc"),
    },
    {
      num: "05",
      title: t("resolution"),
      desc: t("resolutionDesc"),
    },
  ];

  return (
    <div className="cp-home-page">
      <section className="cp-section cp-workflow-section">
        <div className="cp-section-container">

          {/* PAGE HEADING */}
          <div className="cp-section-heading">
            <span className="cp-section-badge">
              {t("simpleProcess")}
            </span>

            <h2>
              {t("howItWorksTitle")}
            </h2>

            <p>
              {t("howItWorksDescription")}
            </p>
          </div>

          {/* WORKFLOW */}
          <div className="cp-workflow">
            <div className="cp-workflow-line"></div>

            {workflow.map((step, index) => (
              <div
                className="cp-workflow-card"
                key={index}
              >
                <div className="cp-step-number">
                  {step.num}
                </div>

                <h3>
                  {step.title}
                </h3>

                <p>
                  {step.desc}
                </p>
              </div>
            ))}
          </div>

        </div>
      </section>
    </div>
  );
}

export default HowItWorks;

