import React, { useState } from "react";

import { useAppSettings } from "../components/AppSettingsContext";

import "./Contact.css";

function Contact() {
  const { t } = useAppSettings();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    console.log(formData);

    alert(t("contactSuccess"));

    setFormData({
      name: "",
      email: "",
      subject: "",
      message: "",
    });
  };

  return (
    <div className="contact-page">

      {/* ================= HEADER ================= */}
      <section className="contact-hero">
        <div className="contact-hero-content">
          <span className="contact-badge">
            CivicPulse AI
          </span>

          <h1>
            {t("getInTouch")}{" "}
            <span>{t("withUs")}</span>
          </h1>

          <p>
            {t("contactHeroDescription")}
          </p>
        </div>
      </section>

      {/* ================= CONTACT CARDS ================= */}
      <section className="contact-info-section">
        <div className="contact-cards">

          <div className="contact-card">
            <div className="card-icon">
              ✉
            </div>
            <div>
              <h3>{t("email")}</h3>
              <p>
                support@civicpulseai.com
              </p>
            </div>
          </div>

          <div className="contact-card">
            <div className="card-icon">
              ☎
            </div>
            <div>
              <h3>{t("phone")}</h3>
              <p>
                +91 7028076858
              </p>
            </div>
          </div>

          <div className="contact-card">
            <div className="card-icon">
              📍
            </div>
            <div>
              <h3>{t("address")}</h3>
              <p>
                Thane, Maharashtra, India
              </p>
            </div>
          </div>

          <div className="contact-card">
            <div className="card-icon">
              🕒
            </div>
            <div>
              <h3>{t("officeHours")}</h3>
              <p>
                Mon - Sat, 10:00 AM - 6:00 PM
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* ================= CONTACT FORM ================= */}
      <section className="contact-form-section">
        <div className="contact-form-wrapper">

          {/* LEFT SIDE */}
          <div className="contact-form-info">

            <span className="section-tag">
              {t("contactUs")}
            </span>

            <h2>
              {t("wedLoveTo")}{" "}
              <span>{t("hearFromYou")}</span>
            </h2>

            <p>
              {t("contactDescription")}
            </p>

            <div className="contact-highlight">
              <div className="highlight-icon">
                ✓
              </div>

              <div>
                <h4>{t("quickResponse")}</h4>
                <p>
                  {t("quickResponseDesc")}
                </p>
              </div>
            </div>

            <div className="contact-highlight">
              <div className="highlight-icon">
                ✓
              </div>

              <div>
                <h4>{t("citizenSupport")}</h4>
                <p>
                  {t("citizenSupportDesc")}
                </p>
              </div>
            </div>

          </div>

          {/* RIGHT SIDE FORM */}
          <div className="form-container">

            <h2>
              {t("sendMessage")}
            </h2>

            <p className="form-subtitle">
              {t("formSubtitle")}
            </p>

            <form onSubmit={handleSubmit}>

              <div className="form-row">

                <div className="form-group">
                  <label>
                    {t("fullName")}
                  </label>

                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder={t("fullNamePlaceholder")}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>
                    {t("emailAddress")}
                  </label>

                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder={t("emailPlaceholder")}
                    required
                  />
                </div>

              </div>

              <div className="form-group">
                <label>
                  {t("subject")}
                </label>

                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  placeholder={t("subjectPlaceholder")}
                  required
                />
              </div>

              <div className="form-group">
                <label>
                  {t("message")}
                </label>

                <textarea
                  name="message"
                  rows="5"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder={t("messagePlaceholder")}
                  required
                ></textarea>
              </div>

              <button
                type="submit"
                className="submit-btn"
              >
                {t("sendMessage")}
                <span> →</span>
              </button>

            </form>
          </div>

        </div>
      </section>

      {/* ================= BOTTOM CTA ================= */}
      <section className="contact-bottom">
        <div>
          <h2>
            {t("buildingBetterCommunities")}
          </h2>

          <p>
            {t("bottomContactDescription")}
          </p>
        </div>
      </section>

    </div>
  );
}

export default Contact;