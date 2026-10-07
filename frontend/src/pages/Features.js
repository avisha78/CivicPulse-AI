
import React from "react";

import {
  FileText,
  BrainCircuit,
  Activity,
  LayoutDashboard,
  BarChart3,
  Globe,
  ArrowRight,
} from "lucide-react";

import { useAppSettings } from "../components/AppSettingsContext";

import "./Home.css";

function Features() {
  const { t } = useAppSettings();

  const features = [
    {
      title: t("smartReporting"),
      desc: t("smartReportingDesc"),
      icon: FileText,
    },
    {
      title: t("aiRoutingFeature"),
      desc: t("aiRoutingFeatureDesc"),
      icon: BrainCircuit,
    },
    {
      title: t("realTimeTracking"),
      desc: t("realTimeTrackingDesc"),
      icon: Activity,
    },
    {
      title: t("departmentDashboard"),
      desc: t("departmentDashboardDesc"),
      icon: LayoutDashboard,
    },
    {
      title: t("analyticsInsights"),
      desc: t("analyticsInsightsDesc"),
      icon: BarChart3,
    },
    {
      title: t("multiLanguage"),
      desc: t("multiLanguageDesc"),
      icon: Globe,
    },
  ];

  return (
    <div className="cp-home-page">
      {/* =================================================
          FEATURES PAGE
      ================================================= */}

      <section className="cp-section">
        <div className="cp-section-container">

          {/* HEADER */}
          <div className="cp-section-heading">
            <span className="cp-section-badge">
              {t("smartSolution")}
            </span>

            <h2>
              {t("powerfulSmartFeatures")}
            </h2>

            <p>
              {t("featuresDescription")}
            </p>
          </div>

          {/* FEATURES */}
          <div className="cp-features-grid">
            {features.map((feature, index) => {
              const Icon = feature.icon;

              return (
                <div
                  className="cp-feature-card"
                  key={index}
                >
                  <div className="cp-feature-icon">
                    <Icon size={27} />
                  </div>

                  <h3>
                    {feature.title}
                  </h3>

                  <p>
                    {feature.desc}
                  </p>

                  <span className="cp-card-arrow">
                    <ArrowRight size={17} />
                  </span>
                </div>
              );
            })}
          </div>

        </div>
      </section>
    </div>
  );
}

export default Features;

