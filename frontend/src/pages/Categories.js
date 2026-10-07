import React from "react";

import {
  Building2,
  Bus,
  Construction,
  Droplets,
  Lightbulb,
  ShieldAlert,
  ShieldCheck,
  Trash2,
} from "lucide-react";

import { useAppSettings } from "../components/AppSettingsContext";

import "./Home.css";

function Categories() {
  const { t } = useAppSettings();

  const categories = [
    {
      title: t("roadsPotholes"),
      icon: Construction,
    },
    {
      title: t("streetLighting"),
      icon: Lightbulb,
    },
    {
      title: t("waterSupply"),
      icon: Droplets,
    },
    {
      title: t("wasteManagement"),
      icon: Trash2,
    },
    {
      title: t("infrastructure"),
      icon: Building2,
    },
    {
      title: t("traffic"),
      icon: Bus,
    },
    {
      title: t("sanitation"),
      icon: ShieldCheck,
    },
    {
      title: t("publicSafety"),
      icon: ShieldAlert,
    },
  ];

  return (
    <div className="cp-home-page">
      {/* =================================================
          CATEGORIES
      ================================================= */}

      <section className="cp-section cp-category-section">
        <div className="cp-section-container">

          {/* HEADING */}
          <div className="cp-section-heading">
            <span className="cp-section-badge">
              {t("reportAnything")}
            </span>

            <h2>
              {t("civicIssueCategories")}
            </h2>

            <p>
              {t("categoriesDescription")}
            </p>
          </div>

          {/* CATEGORY GRID */}
          <div className="cp-category-grid">
            {categories.map((category, index) => {
              const Icon = category.icon;

              return (
                <div
                  className="cp-category-card"
                  key={index}
                >
                  <div className="cp-category-icon">
                    <Icon size={24} />
                  </div>

                  <span>
                    {category.title}
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

export default Categories;