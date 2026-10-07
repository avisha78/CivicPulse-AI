import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAppSettings } from "../components/AppSettingsContext";

import {
  FaArrowLeft,
  FaNewspaper,
  FaExternalLinkAlt,
  FaCalendarAlt,
  FaGlobeAsia,
} from "react-icons/fa";

import "./DailyNews.css";

function DailyNews() {
  const navigate = useNavigate();

  // ==================================================
  // SETTINGS
  // ==================================================

  const {
    darkMode,
    language,
  } = useAppSettings();

  // ==================================================
  // STATES
  // ==================================================

  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ==================================================
  // TEXT
  // ==================================================

  const content = {
    English: {
      back: "Back to Home",
      title: "Daily News",
      subtitle:
        "Stay updated with the latest civic issues and important events.",
      loading: "Loading latest civic news...",
      error: "Unable to load news. Please try again later.",
      readMore: "Read Full Article",
      source: "Source",
      noNews: "No civic issue news available right now.",
    },

    Marathi: {
      back: "मुख्यपृष्ठावर परत जा",
      title: "आजच्या बातम्या",
      subtitle:
        "ताज्या नागरी समस्या आणि महत्त्वाच्या घडामोडी जाणून घ्या.",
      loading:
        "ताज्या नागरी समस्या बातम्या लोड होत आहेत...",
      error:
        "बातम्या लोड करता आल्या नाहीत. कृपया नंतर प्रयत्न करा.",
      readMore: "संपूर्ण बातमी वाचा",
      source: "स्रोत",
      noNews:
        "सध्या कोणत्याही नागरी समस्या बातम्या उपलब्ध नाहीत.",
    },

    Hindi: {
      back: "होम पर वापस जाएँ",
      title: "आज की खबरें",
      subtitle:
        "नागरिक समस्याओं और महत्वपूर्ण घटनाओं से अपडेट रहें।",
      loading:
        "नागरिक समस्याओं से जुड़ी ताज़ा खबरें लोड हो रही हैं...",
      error:
        "समाचार लोड नहीं हो सके। कृपया बाद में प्रयास करें।",
      readMore: "पूरी खबर पढ़ें",
      source: "स्रोत",
      noNews:
        "अभी नागरिक समस्याओं से जुड़ी कोई खबर उपलब्ध नहीं है।",
    },
  };

  const t =
    content[language] || content.English;

  // ==================================================
  // ERROR TEXT
  // ==================================================

  const errorText =
    language === "Marathi"
      ? content.Marathi.error
      : language === "Hindi"
      ? content.Hindi.error
      : content.English.error;

  // ==================================================
  // FETCH NEWS
  // ==================================================

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await axios.get(
          "http://localhost:5000/api/news"
        );

        if (
          response.data &&
          response.data.success
        ) {
          setNews(
            response.data.news || []
          );
        } else {
          setError(
            response.data?.message ||
              errorText
          );
        }
      } catch (err) {
        console.error(
          "News fetch error:",
          err
        );

        setError(
          err.response?.data?.message ||
            errorText
        );
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, [language, errorText]);

  // ==================================================
  // RETURN
  // ==================================================

  return (
    <div
      className={
        darkMode
          ? "daily-news-page dark"
          : "daily-news-page"
      }
    >
      <div className="daily-news-container">

        {/* ==================================================
            TOP CONTROLS
        ================================================== */}

        <div className="news-top-controls">

          {/* BACK BUTTON */}

          <button
            type="button"
            className="news-back-btn"
            onClick={() => navigate("/")}
          >
            <FaArrowLeft />
            <span>{t.back}</span>
          </button>

          {/* SETTINGS */}

        </div>


        {/* ==================================================
            HEADER
        ================================================== */}

        <div className="daily-news-header">

          <div className="daily-news-icon">
            <FaNewspaper />
          </div>

          <div>
            <span className="news-label">
              <FaGlobeAsia />
              CIVICPULSE AI
            </span>

            <h1>
              {t.title}
            </h1>

            <p>
              {t.subtitle}
            </p>
          </div>

        </div>

        {/* ==================================================
            DATE
        ================================================== */}

        <div className="news-date">
          <FaCalendarAlt />

          {new Date().toLocaleDateString(
            language === "Marathi"
              ? "mr-IN"
              : language === "Hindi"
              ? "hi-IN"
              : "en-IN",
            {
              day: "numeric",
              month: "long",
              year: "numeric",
            }
          )}
        </div>

        {/* ==================================================
            LOADING
        ================================================== */}

        {loading && (
          <div className="news-loading">
            <FaNewspaper />

            <span>
              {t.loading}
            </span>
          </div>
        )}

        {/* ==================================================
            ERROR
        ================================================== */}

        {!loading && error && (
          <div className="news-error">
            <FaNewspaper />

            <span>
              {error}
            </span>
          </div>
        )}

        {/* ==================================================
            NO NEWS
        ================================================== */}

        {!loading &&
          !error &&
          news.length === 0 && (
            <div className="no-news">
              <FaNewspaper />

              <span>
                {t.noNews}
              </span>
            </div>
          )}

        {/* ==================================================
            NEWS GRID
        ================================================== */}

        {!loading &&
          !error &&
          news.length > 0 && (
            <div className="news-grid">

              {news.map((article) => (
                <div
                  className="news-card"
                  key={article.id}
                >

                  {/* IMAGE */}

                  {article.image ? (
                    <img
                      src={article.image}
                      alt={article.title}
                      className="news-image"
                      onError={(event) => {
                        event.currentTarget.style.display =
                          "none";
                      }}
                    />
                  ) : (
                    <div className="news-image-placeholder">
                      <FaNewspaper />
                    </div>
                  )}

                  {/* CONTENT */}

                  <div className="news-card-content">

                    <span className="news-source">
                      {t.source}:{" "}
                      <strong>
                        {article.source}
                      </strong>
                    </span>

                    <h2>
                      {article.title}
                    </h2>

                    <p>
                      {article.description}
                    </p>

                    {/* READ MORE */}

                    {article.url && (
                      <a
                        href={article.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="news-read-btn"
                      >
                        <span>
                          {t.readMore}
                        </span>

                        <FaExternalLinkAlt />
                      </a>
                    )}

                  </div>

                </div>
              ))}

            </div>
          )}

      </div>
    </div>
  );
}

export default DailyNews;