import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import {
  FaTachometerAlt,
  FaClipboardList,
  FaPlusCircle,
  FaSearch,
  FaBell,
  FaSignOutAlt,
  FaMapMarkerAlt,
  FaCheckCircle,
  FaClock,
  FaCity,
  FaUser,
  FaQuestionCircle,
  FaSpinner,
  FaArrowRight,
  FaExclamationCircle,
  FaChartLine,
  FaFileAlt,
  FaBrain,
} from "react-icons/fa";
import "./CitizenDashboard.css";
import { useAppSettings } from "../components/AppSettingsContext";
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";

function CitizenDashboard() {
  const { t } = useAppSettings();

  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  // =====================================
  // ACTIVE SIDEBAR SECTION
  // =====================================
  const location = useLocation();
  const [activeSection, setActiveSection] = useState(
    location.pathname === "/my-complaints" ? "my-complaints" : "dashboard"
  );
  const [openHelpCard, setOpenHelpCard] = useState(null);
  // =====================================
  // SELECTED COMPLAINT FOR TRACKING
  // =====================================
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [nearbyIssues, setNearbyIssues] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [mapPosition, setMapPosition] = useState([19.076, 72.8777]);
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [complaintHistory, setComplaintHistory] = useState([]);

  const navigate = useNavigate();

  // =====================================
  // GET CITIZEN INFORMATION
  // =====================================
  const getCitizen = () => {
    try {
      const storedUser =
        localStorage.getItem("user") ||
        localStorage.getItem("currentUser");

      return storedUser ? JSON.parse(storedUser) : null;
    } catch (error) {
      console.error("Unable to read citizen information:", error);
      return null;
    }
  };

  const citizen = getCitizen();
  const citizenName = citizen?.name || t("citizen");

  // =====================================
  // STATUS NORMALIZATION
  // =====================================
  const getStatus = (status) => {
    if (!status) {
      return "Pending";
    }

    const normalized = status.toLowerCase();

    if (normalized.includes("resolve")) {
      return "Resolved";
    }

    if (
      normalized.includes("progress") ||
      normalized.includes("assigned")
    ) {
      return "In Progress";
    }

    if (
      normalized.includes("reject") ||
      normalized.includes("closed")
    ) {
      return "Rejected";
    }

    return "Pending";
  };

  // =====================================
  // TRANSLATED STATUS
  // =====================================
  const getStatusText = (status) => {
    const normalizedStatus = getStatus(status);

    if (normalizedStatus === "Pending") {
      return t("pending");
    }

    if (normalizedStatus === "In Progress") {
      return t("inProgress");
    }

    if (normalizedStatus === "Resolved") {
      return t("resolved");
    }

    if (normalizedStatus === "Rejected") {
      return t("rejected") || "Rejected";
    }

    return normalizedStatus;
  };

  // =====================================
  // TRANSLATED CATEGORY
  // =====================================
  const getCategoryText = (category) => {
    if (!category) {
      return "-";
    }

    const categoryMap = {
      Garbage: "garbage",
      Potholes: "potholes",
      "Water Supply": "waterSupply",
      Drainage: "drainage",
      "Street Lights": "streetLights",
    };

    return categoryMap[category]
      ? t(categoryMap[category])
      : category;
  };

  // =====================================
  // LOAD CITIZEN COMPLAINTS
  // =====================================
  useEffect(() => {
    const fetchComplaints = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/citizen-login");
        return;
      }

      try {
        const response = await axios.get(
          "http://localhost:5000/api/complaints/my",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setComplaints(response.data.complaints || []);
      } catch (error) {
        console.error("Failed to fetch complaints:", error);

        if (
          error.response &&
          (error.response.status === 401 ||
            error.response.status === 403)
        ) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          localStorage.removeItem("currentUser");

          navigate("/citizen-login");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchComplaints();
  }, [navigate]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    const headers = { Authorization: `Bearer ${token}` };

    const loadNotifications = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/notifications", { headers });
        setNotifications(response.data.notifications || []);
      } catch (error) {
        console.error("Failed to fetch notifications:", error);
      }
    };

    const loadNearbyIssues = async (latitude, longitude) => {
      try {
        const response = await axios.get("http://localhost:5000/api/complaints/nearby", {
          params: { latitude, longitude, radius: 10 },
        });
        setNearbyIssues(response.data.complaints || []);
      } catch (error) {
        console.error("Failed to fetch nearby issues:", error);
      }
    };

    loadNotifications();
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const nextPosition = [position.coords.latitude, position.coords.longitude];
          setMapPosition(nextPosition);
          loadNearbyIssues(nextPosition[0], nextPosition[1]);
        },
        () => loadNearbyIssues(19.076, 72.8777)
      );
    } else {
      loadNearbyIssues(19.076, 72.8777);
    }
  }, []);

  const submitFeedback = async () => {
    if (!selectedComplaint) return;
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `http://localhost:5000/api/feedback/complaints/${selectedComplaint.id}`,
        { rating: feedbackRating, comment: feedbackComment },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setFeedbackMessage("Thank you for your feedback.");
    } catch (error) {
      setFeedbackMessage(error.response?.data?.message || "Unable to submit feedback.");
    }
  };

  const verifyResolution = async () => {
    if (!selectedComplaint) return;
    try {
      const token = localStorage.getItem("token");
      const response = await axios.put(
        `http://localhost:5000/api/complaints/${selectedComplaint.id}/verify`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSelectedComplaint(response.data.complaint);
      setComplaints((items) => items.map((item) => item.id === response.data.complaint.id ? response.data.complaint : item));
    } catch (error) {
      setFeedbackMessage(error.response?.data?.message || "Unable to verify resolution.");
    }
  };

  // =====================================
  // LOGOUT
  // =====================================
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("currentUser");

    navigate("/citizen-login");
  };

  // =====================================
  // DATE FORMAT
  // =====================================
  const formatDate = (date) => {
    if (!date) {
      return "-";
    }

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // =====================================
  // COMPLAINT STATISTICS
  // =====================================
  const statistics = useMemo(() => {
    const total = complaints.length;

    const pending = complaints.filter(
      (item) => getStatus(item.status) === "Pending"
    ).length;

    const inProgress = complaints.filter(
      (item) => getStatus(item.status) === "In Progress"
    ).length;

    const resolved = complaints.filter(
      (item) => getStatus(item.status) === "Resolved"
    ).length;

    return {
      total,
      pending,
      inProgress,
      resolved,
    };
  }, [complaints]);

  // =====================================
  // CHANGE SIDEBAR SECTION
  // =====================================
  const changeSection = (section) => {
    setActiveSection(section);

    if (section !== "track-complaint" && section !== "ai-analysis") {
      setSelectedComplaint(null);
    }

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // =====================================
  // TRACK COMPLAINT
  // =====================================
  const handleTrackComplaint = (complaint) => {
    setSelectedComplaint(complaint);
    setComplaintHistory([]);
    setActiveSection("track-complaint");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    if (!selectedComplaint) return;
    const token = localStorage.getItem("token");
    axios.get(`http://localhost:5000/api/complaints/${selectedComplaint.id}/history`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then((response) => setComplaintHistory(response.data.history || []))
      .catch((error) => console.error("Failed to fetch complaint history:", error));
  }, [selectedComplaint]);

  // =====================================
  // LOADING
  // =====================================
  if (loading) {
    return (
      <div className="cp-dashboard-loading">
        <div className="cp-loading-card">
          <FaSpinner className="cp-loading-icon cp-spin" />

          <h3>{t("loadingDashboard")}</h3>

          <p>{t("loadingDashboardDescription")}</p>
        </div>
      </div>
    );
  }

  // =====================================
  // MAIN DASHBOARD
  // =====================================
  return (
    <div className="cp-citizen-dashboard">

      {/* =====================================
          SIDEBAR
      ===================================== */}
      <aside className="cp-citizen-sidebar">

        {/* BRAND */}
        <div className="cp-citizen-brand">
          <div className="cp-citizen-brand-icon">
            <FaCity />
          </div>

          <div>
            <h2>CivicPulse AI</h2>
            <span>{t("citizenPortal")}</span>
          </div>
        </div>

        {/* NAVIGATION */}
        <nav className="cp-citizen-nav">

          {/* DASHBOARD */}
          <button
            type="button"
            className={`cp-citizen-nav-item ${
              activeSection === "dashboard" ? "active" : ""
            }`}
            onClick={() => changeSection("dashboard")}
          >
            <FaTachometerAlt />
            <span>{t("dashboard")}</span>
          </button>

          {/* MY COMPLAINTS */}
          <button
            type="button"
            className={`cp-citizen-nav-item ${
              activeSection === "my-complaints" ? "active" : ""
            }`}
            onClick={() => changeSection("my-complaints")}
          >
            <FaClipboardList />
            <span>{t("myComplaints")}</span>
          </button>

          {/* TRACK COMPLAINT */}
          <button
            type="button"
            className={`cp-citizen-nav-item ${
              activeSection === "track-complaint" ? "active" : ""
            }`}
            onClick={() => changeSection("track-complaint")}
          >
            <FaSearch />
            <span>{t("trackComplaint")}</span>
          </button>

          <button
            type="button"
            className={`cp-citizen-nav-item ${
              activeSection === "ai-analysis" ? "active" : ""
            }`}
            onClick={() => changeSection("ai-analysis")}
          >
            <FaBrain />
            <span>AI Analysis</span>
          </button>

          {/* REPORT COMPLAINT */}
          <button
            type="button"
            className="cp-citizen-nav-item"
            onClick={() => navigate("/report-complaint")}
          >
            <FaPlusCircle />
            <span>{t("reportComplaint")}</span>
          </button>

          {/* NEARBY ISSUES */}
          <button
            type="button"
            className={`cp-citizen-nav-item ${
              activeSection === "nearby-issues" ? "active" : ""
            }`}
            onClick={() => changeSection("nearby-issues")}
          >
            <FaMapMarkerAlt />
            <span>{t("nearbyIssues")}</span>
          </button>

          {/* NOTIFICATIONS */}
          <button
            type="button"
            className={`cp-citizen-nav-item ${
              activeSection === "notifications" ? "active" : ""
            }`}
            onClick={() => changeSection("notifications")}
          >
            <FaBell />
            <span>{t("notifications")}</span>
          </button>

          {/* HELP & SUPPORT */}
          <button
            type="button"
            className={`cp-citizen-nav-item cp-citizen-nav-button ${
              activeSection === "help" ? "active" : ""
            }`}
            onClick={() => changeSection("help")}
          >
            <FaQuestionCircle />
            <span>{t("helpSupport")}</span>
          </button>
        </nav>

        {/* SIDEBAR BOTTOM */}
        <div className="cp-sidebar-bottom">

          {/* PROFILE CARD */}
          <button
            type="button"
            className={`cp-sidebar-profile ${
              activeSection === "profile" ? "active" : ""
            }`}
            onClick={() => navigate("/citizen-profile")}
          >
            <div className="cp-profile-avatar">
              <FaUser />
            </div>

            <div className="cp-profile-info">
              <strong>{citizenName}</strong>
              <span>{t("citizen")}</span>
            </div>

            <div className="cp-profile-arrow">
              <FaArrowRight />
            </div>
          </button>

          {/* LOGOUT */}
          <button
            type="button"
            className="cp-citizen-logout"
            onClick={handleLogout}
          >
            <FaSignOutAlt />
            <span>{t("logout")}</span>
          </button>
        </div>
      </aside>

      {/* =====================================
          MAIN CONTENT
      ===================================== */}
      <main className="cp-citizen-main">

        {/* HEADER */}
        <header className="cp-citizen-header">
          <div>
            <span className="cp-header-label">
              {t("citizenPortalLabel")}
            </span>

            <h1>
              {t("welcomeBack")}, {citizenName} 👋
            </h1>

            <p>{t("stayInformed")}</p>
          </div>

          <div className="cp-citizen-user">
            <div className="cp-citizen-user-icon">
              <FaUser />
            </div>

            <div>
              <strong>{citizenName}</strong>
              <span>{t("citizenAccount")}</span>
            </div>
          </div>
        </header>

        {/* =====================================
            DASHBOARD SECTION
        ===================================== */}
        {activeSection === "dashboard" && (
          <>
            {/* HERO */}
            <section className="cp-welcome-banner">
              <div className="cp-banner-content">
                <span className="cp-banner-label">
                  {t("smartCivicReporting")}
                </span>

                <h2>{t("yourVoiceCanImprove")}</h2>

                <p>{t("reportTrackDescription")}</p>

                <div className="cp-banner-actions">

                  {/* REPORT AN ISSUE */}
                  <button
                    type="button"
                    className="cp-banner-primary"
                    onClick={() =>
                      navigate("/report-complaint")
                    }
                  >
                    <FaPlusCircle />
                    {t("reportAnIssue")}
                  </button>

                  {/* TRACK COMPLAINT */}
                  <button
                    type="button"
                    className="cp-banner-secondary"
                    onClick={() =>
                      changeSection("track-complaint")
                    }
                  >
                    <FaSearch />
                    {t("trackComplaint")}
                  </button>
                </div>
              </div>

              <div className="cp-banner-visual">
                <div className="cp-banner-circle">
                  <FaCity />
                </div>

                <div className="cp-banner-floating-card">
                  <FaCheckCircle />

                  <div>
                    <strong>{t("makeAnImpact")}</strong>
                    <span>{t("oneReportAtATime")}</span>
                  </div>
                </div>
              </div>
            </section>

            {/* STATISTICS */}
            <section className="cp-stat-section">

              <div className="cp-stat-card">
                <div className="cp-stat-icon blue">
                  <FaClipboardList />
                </div>

                <div>
                  <span>{t("totalComplaints")}</span>
                  <strong>{statistics.total}</strong>
                  <small>{t("submittedByYou")}</small>
                </div>
              </div>

              <div className="cp-stat-card">
                <div className="cp-stat-icon orange">
                  <FaClock />
                </div>

                <div>
                  <span>{t("pending")}</span>
                  <strong>{statistics.pending}</strong>
                  <small>{t("awaitingAction")}</small>
                </div>
              </div>

              <div className="cp-stat-card">
                <div className="cp-stat-icon purple">
                  <FaChartLine />
                </div>

                <div>
                  <span>{t("inProgress")}</span>
                  <strong>{statistics.inProgress}</strong>
                  <small>{t("beingHandled")}</small>
                </div>
              </div>

              <div className="cp-stat-card">
                <div className="cp-stat-icon amber">
                  <FaCheckCircle />
                </div>

                <div>
                  <span>{t("resolved")}</span>
                  <strong>{statistics.resolved}</strong>
                  <small>{t("successfullyCompleted")}</small>
                </div>
              </div>
            </section>

            {/* QUICK ACTIONS */}
            <section className="cp-dashboard-section">
              <div className="cp-section-heading">
                <div>
                  <span>{t("getThingsDone")}</span>
                  <h2>{t("quickActions")}</h2>
                  <p>{t("quickActionsDescription")}</p>
                </div>
              </div>

              <div className="cp-quick-grid">

                {/* REPORT */}
                <button
                  type="button"
                  className="cp-quick-card"
                  onClick={() =>
                    navigate("/report-complaint")
                  }
                >
                  <div className="cp-quick-icon blue">
                    <FaPlusCircle />
                  </div>

                  <div className="cp-quick-content">
                    <h3>{t("reportComplaintAction")}</h3>

                    <p>
                      {t("reportComplaintActionDescription")}
                    </p>
                  </div>

                  <FaArrowRight className="cp-card-arrow" />
                </button>

                {/* TRACK */}
                <button
                  type="button"
                  className="cp-quick-card"
                  onClick={() =>
                    changeSection("track-complaint")
                  }
                >
                  <div className="cp-quick-icon amber">
                    <FaSearch />
                  </div>

                  <div className="cp-quick-content">
                    <h3>{t("trackComplaintAction")}</h3>

                    <p>
                      {t("trackComplaintActionDescription")}
                    </p>
                  </div>

                  <FaArrowRight className="cp-card-arrow" />
                </button>

                {/* NEARBY */}
                <button
                  type="button"
                  className="cp-quick-card"
                  onClick={() =>
                    changeSection("nearby-issues")
                  }
                >
                  <div className="cp-quick-icon orange">
                    <FaMapMarkerAlt />
                  </div>

                  <div className="cp-quick-content">
                    <h3>{t("nearbyIssuesAction")}</h3>

                    <p>
                      {t("nearbyIssuesActionDescription")}
                    </p>
                  </div>

                  <FaArrowRight className="cp-card-arrow" />
                </button>

                {/* NOTIFICATIONS */}
                <button
                  type="button"
                  className="cp-quick-card"
                  onClick={() =>
                    changeSection("notifications")
                  }
                >
                  <div className="cp-quick-icon purple">
                    <FaBell />
                  </div>

                  <div className="cp-quick-content">
                    <h3>{t("notificationsAction")}</h3>

                    <p>
                      {t("notificationsActionDescription")}
                    </p>
                  </div>

                  <FaArrowRight className="cp-card-arrow" />
                </button>
              </div>
            </section>

            {/* CIVIC IMPACT */}
            <section className="cp-impact-card">
              <div className="cp-impact-icon">
                <FaCity />
              </div>

              <div className="cp-impact-content">
                <span>{t("yourCivicImpact")}</span>

                <h2>{t("everyComplaintHelps")}</h2>

                <p>
                  {t("youHaveSubmitted")}{" "}
                  <strong>{statistics.total}</strong>{" "}
                  {statistics.total === 1
                    ? t("issue")
                    : t("issues")}{" "}
                  {t("throughCivicPulse")}
                </p>
              </div>

              <div className="cp-impact-number">
                <strong>{statistics.total}</strong>
                <span>{t("reports")}</span>
              </div>
            </section>

            {/* RECENT COMPLAINTS */}
            <section className="cp-recent-card">
              <div className="cp-recent-header">
                <div>
                  <span>{t("activity")}</span>

                  <h2>
                    <FaClipboardList />
                    {t("recentComplaints")}
                  </h2>

                  <p>
                    {t("recentComplaintsDescription")}
                  </p>
                </div>

                {complaints.length > 0 && (
                  <button
                    type="button"
                    className="cp-view-all"
                    onClick={() =>
                      changeSection("my-complaints")
                    }
                  >
                    {t("viewAll")}
                    <FaArrowRight />
                  </button>
                )}
              </div>

              <div className="cp-recent-body">
                {complaints.length === 0 ? (
                  <div className="cp-empty-state">
                    <div className="cp-empty-icon">
                      <FaClipboardList />
                    </div>

                    <h3>{t("noComplaintsYet")}</h3>

                    <p>
                      {t("noComplaintsYetDescription")}
                    </p>

                    <button
                      type="button"
                      className="cp-primary-button"
                      onClick={() =>
                        navigate("/report-complaint")
                      }
                    >
                      <FaPlusCircle />
                      {t("reportYourFirstComplaint")}
                    </button>
                  </div>
                ) : (
                  <div className="cp-table-wrapper">
                    <table className="cp-complaints-table">
                      <thead>
                        <tr>
                          <th>{t("complaintId")}</th>
                          <th>{t("complaint")}</th>
                          <th>{t("category")}</th>
                          <th>Priority</th>
                          <th>Severity</th>
                          <th>Duplicate</th>
                          <th>{t("status")}</th>
                          <th>{t("date")}</th>
                          <th>{t("action")}</th>
                        </tr>
                      </thead>

                      <tbody>
                        {complaints
                          .slice(0, 5)
                          .map((item, index) => {
                            const status = getStatus(
                              item.status
                            );

                            return (
                              <tr
                                key={item.id || index}
                              >
                                <td>
                                  <span className="cp-complaint-id">
                                    GCP-{item.id}
                                  </span>
                                </td>

                                <td>
                                  <strong>
                                    {item.title || "-"}
                                  </strong>
                                </td>

                                <td>
                                  <span className="cp-category-badge">
                                    {getCategoryText(
                                      item.category
                                    )}
                                  </span>
                                </td>

                                <td><span className={`cp-status-badge ${(item.priority || "Medium").toLowerCase()}`}>{item.priority || "Medium"}</span></td>
                                <td><span className={`cp-status-badge ${(item.severity || "Medium").toLowerCase()}`}>{item.severity || "Medium"}</span></td>
                                <td>{item.is_duplicate ? `Yes${item.duplicate_of ? ` (#${item.duplicate_of})` : ""}` : "No"}</td>

                                <td>
                                  <span
                                    className={`cp-status-badge ${status
                                      .toLowerCase()
                                      .replace(" ", "-")}`}
                                  >
                                    {status === "Resolved" && (
                                      <FaCheckCircle />
                                    )}

                                    {status === "Pending" && (
                                      <FaClock />
                                    )}

                                    {status === "In Progress" && (
                                      <FaChartLine />
                                    )}

                                    {status === "Rejected" && (
                                      <FaExclamationCircle />
                                    )}

                                    {getStatusText(
                                      item.status
                                    )}
                                  </span>
                                </td>

                                <td>
                                  {formatDate(
                                    item.created_at
                                  )}
                                </td>

                                <td>
                                  <button
                                    type="button"
                                    className="cp-track-link"
                                    onClick={() =>
                                      handleTrackComplaint(item)
                                    }
                                  >
                                    {t("track")}
                                    <FaArrowRight />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>

                    {complaints.length > 5 && (
                      <div className="cp-table-footer">
                        <button
                          type="button"
                          className="cp-outline-button"
                          onClick={() =>
                            changeSection("my-complaints")
                          }
                        >
                          {t("viewAllComplaints")}
                          <FaArrowRight />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </section>
          </>
        )}

        {/* =====================================
            MY COMPLAINTS SECTION
        ===================================== */}
        {activeSection === "my-complaints" && (
          <section className="cp-section-page">
            <div className="cp-page-title">
              <div>
                <span>{t("complaintManagement")}</span>

                <h2>
                  <FaClipboardList />
                  {t("myComplaints")}
                </h2>

                <p>
                  {t("myComplaintsDescription")}
                </p>
              </div>

              <button
                type="button"
                className="cp-banner-primary"
                onClick={() =>
                  navigate("/report-complaint")
                }
              >
                <FaPlusCircle />
                {t("newComplaint")}
              </button>
            </div>

            {/* SUMMARY */}
            <div className="cp-stat-section">

              <div className="cp-stat-card">
                <div className="cp-stat-icon blue">
                  <FaClipboardList />
                </div>

                <div>
                  <span>{t("total")}</span>
                  <strong>{statistics.total}</strong>
                  <small>{t("allComplaints")}</small>
                </div>
              </div>

              <div className="cp-stat-card">
                <div className="cp-stat-icon orange">
                  <FaClock />
                </div>

                <div>
                  <span>{t("pending")}</span>
                  <strong>{statistics.pending}</strong>
                  <small>{t("awaitingAction")}</small>
                </div>
              </div>

              <div className="cp-stat-card">
                <div className="cp-stat-icon purple">
                  <FaChartLine />
                </div>

                <div>
                  <span>{t("inProgress")}</span>
                  <strong>{statistics.inProgress}</strong>
                  <small>{t("beingHandled")}</small>
                </div>
              </div>

              <div className="cp-stat-card">
                <div className="cp-stat-icon amber">
                  <FaCheckCircle />
                </div>

                <div>
                  <span>{t("resolved")}</span>
                  <strong>{statistics.resolved}</strong>
                  <small>{t("completed")}</small>
                </div>
              </div>
            </div>

            {/* COMPLAINT LIST */}
            <div className="cp-my-complaints-card">
              {complaints.length === 0 ? (
                <div className="cp-empty-state">
                  <div className="cp-empty-icon">
                    <FaClipboardList />
                  </div>

                  <h3>{t("noComplaintsFound")}</h3>

                  <p>
                    {t("noComplaintsFoundDescription")}
                  </p>

                  <button
                    type="button"
                    className="cp-primary-button"
                    onClick={() =>
                      navigate("/report-complaint")
                    }
                  >
                    <FaPlusCircle />
                    {t("reportComplaint")}
                  </button>
                </div>
              ) : (
                <div className="cp-table-wrapper">
                  <table className="cp-complaints-table">
                    <thead>
                      <tr>
                        <th>{t("complaintId")}</th>
                        <th>{t("complaint")}</th>
                        <th>{t("category")}</th>
                        <th>{t("location")}</th>
                        <th>Priority</th>
                        <th>Severity</th>
                        <th>{t("status")}</th>
                        <th>{t("date")}</th>
                        <th>{t("action")}</th>
                      </tr>
                    </thead>

                    <tbody>
                      {complaints.map((item, index) => {
                        const status = getStatus(
                          item.status
                        );

                        return (
                          <tr
                            key={item.id || index}
                          >
                            <td>
                              <span className="cp-complaint-id">
                                GCP-{item.id}
                              </span>
                            </td>

                            <td>
                              <strong>
                                {item.title || "-"}
                              </strong>
                            </td>

                            <td>
                              <span className="cp-category-badge">
                                {getCategoryText(
                                  item.category
                                )}
                              </span>
                            </td>

                            <td>
                              {item.location || "-"}
                            </td>

                            <td>{item.priority || "Medium"}</td>
                            <td>{item.severity || "Medium"}</td>

                            <td>
                              <span
                                className={`cp-status-badge ${status
                                  .toLowerCase()
                                  .replace(" ", "-")}`}
                              >
                                {status === "Resolved" && (
                                  <FaCheckCircle />
                                )}

                                {status === "Pending" && (
                                  <FaClock />
                                )}

                                {status === "In Progress" && (
                                  <FaChartLine />
                                )}

                                {status === "Rejected" && (
                                  <FaExclamationCircle />
                                )}

                                {getStatusText(
                                  item.status
                                )}
                              </span>
                            </td>

                            <td>
                              {formatDate(
                                item.created_at
                              )}
                            </td>

                            <td>
                              <button
                                type="button"
                                className="cp-track-link"
                                onClick={() =>
                                  handleTrackComplaint(item)
                                }
                              >
                                {t("track")}
                                <FaArrowRight />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        )}

        {/* =====================================
            TRACK COMPLAINT SECTION
        ===================================== */}
        {activeSection === "track-complaint" && (
          <section className="cp-section-page cp-track-complaint-page">
            <div className="cp-page-title">
              <div>
                <span>{t("complaintTracking")}</span>

                <h2>
                  <FaSearch />
                  {t("trackComplaint")}
                </h2>

                <p>
                  {t("trackComplaintDescription")}
                </p>
              </div>
            </div>

            {!selectedComplaint ? (
              <div className="cp-my-complaints-card">
                <div className="cp-section-heading">
                  <div>
                    <span>{t("selectAComplaint")}</span>

                    <h2>
                      {t("chooseComplaintToTrack")}
                    </h2>

                    <p>
                      {t("chooseComplaintDescription")}
                    </p>
                  </div>
                </div>

                {complaints.length === 0 ? (
                  <div className="cp-empty-state">
                    <div className="cp-empty-icon">
                      <FaSearch />
                    </div>

                    <h3>
                      {t("noComplaintsAvailable")}
                    </h3>

                    <p>
                      {t("needToSubmitBeforeTracking")}
                    </p>

                    <button
                      type="button"
                      className="cp-primary-button"
                      onClick={() =>
                        navigate("/report-complaint")
                      }
                    >
                      <FaPlusCircle />
                      {t("reportComplaint")}
                    </button>
                  </div>
                ) : (
                  <div className="cp-track-list">
                    {complaints.map((item, index) => {
                      const status = getStatus(
                        item.status
                      );

                      return (
                        <div
                          className="cp-track-item"
                          key={item.id || index}
                        >
                          <div className="cp-track-item-left">
                            <div className="cp-track-item-icon">
                              <FaFileAlt />
                            </div>

                            <div>
                              <span className="cp-complaint-id">
                                GCP-{item.id}
                              </span>

                              <h3>
                                {item.title ||
                                  t("complaint")}
                              </h3>

                              <p>
                                {item.location ||
                                  t("location")}
                              </p>
                            </div>
                          </div>

                          <div className="cp-track-item-right">
                            <span
                              className={`cp-status-badge ${status
                                .toLowerCase()
                                .replace(" ", "-")}`}
                            >
                              {getStatusText(
                                item.status
                              )}
                            </span>

                            <button
                              type="button"
                              className="cp-outline-button"
                              onClick={() =>
                                handleTrackComplaint(item)
                              }
                            >
                              {t("viewStatus")}
                              <FaArrowRight />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div className="cp-track-detail-card">

                <button
                  type="button"
                  className="cp-back-button"
                  onClick={() =>
                    setSelectedComplaint(null)
                  }
                >
                  ← {t("backToComplaints")}
                </button>

                <div className="cp-track-detail-header">
                  <div>
                    <span className="cp-complaint-id">
                      GCP-{selectedComplaint.id}
                    </span>

                    <h2>
                      {selectedComplaint.title ||
                        t("complaint")}
                    </h2>

                    <p>
                      {selectedComplaint.description ||
                        t("noDescriptionAvailable")}
                    </p>
                  </div>

                  <span
                    className={`cp-status-badge ${getStatus(
                      selectedComplaint.status
                    )
                      .toLowerCase()
                      .replace(" ", "-")}`}
                  >
                    {getStatusText(
                      selectedComplaint.status
                    )}
                  </span>
                </div>

                {/* DETAILS */}
                <div className="cp-track-details-grid">

                  <div>
                    <span>{t("category")}</span>

                    <strong>
                      {getCategoryText(
                        selectedComplaint.category
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>{t("location")}</span>

                    <strong>
                      {selectedComplaint.location || "-"}
                    </strong>
                  </div>

                  <div>
                    <span>{t("submittedOn")}</span>

                    <strong>
                      {formatDate(
                        selectedComplaint.created_at
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>{t("complaintId")}</span>

                    <strong>
                      GCP-{selectedComplaint.id}
                    </strong>
                  </div>

                  <div>
                    <span>Priority / Severity</span>
                    <strong>{selectedComplaint.priority || "Medium"} / {selectedComplaint.severity || "Medium"}</strong>
                  </div>

                  <div>
                    <span>Department</span>
                    <strong>{selectedComplaint.ai_department || "Pending assignment"}</strong>
                  </div>

                  <div>
                    <span>Duplicate check</span>
                    <strong>{selectedComplaint.is_duplicate ? `Duplicate of #${selectedComplaint.duplicate_of || "existing complaint"}` : "No duplicate found"}</strong>
                  </div>
                </div>

                {/* TIMELINE */}
                <div className="cp-complaint-timeline">
                  <h3>{t("complaintProgress")}</h3>

                  <div className="cp-timeline">

                    {/* SUBMITTED */}
                    <div className="cp-timeline-item completed">
                      <div className="cp-timeline-icon">
                        <FaCheckCircle />
                      </div>

                      <div>
                        <strong>
                          {t("complaintSubmitted")}
                        </strong>

                        <span>
                          {formatDate(
                            selectedComplaint.created_at
                          )}
                        </span>

                        <p>
                          {t(
                            "complaintSubmittedSuccessfully"
                          )}
                        </p>
                      </div>
                    </div>

                    {/* IN PROGRESS */}
                    <div
                      className={`cp-timeline-item ${
                        ["In Progress", "Resolved"].includes(
                          getStatus(
                            selectedComplaint.status
                          )
                        )
                          ? "completed"
                          : ""
                      }`}
                    >
                      <div className="cp-timeline-icon">
                        <FaClock />
                      </div>

                      <div>
                        <strong>
                          {t("underReview")}
                        </strong>

                        <span>
                          {t("currentProcessingStage")}
                        </span>

                        <p>
                          {t("complaintBeingProcessed")}
                        </p>
                      </div>
                    </div>

                    {/* RESOLVED */}
                    <div
                      className={`cp-timeline-item ${
                        getStatus(
                          selectedComplaint.status
                        ) === "Resolved"
                          ? "completed"
                          : ""
                      }`}
                    >
                      <div className="cp-timeline-icon">
                        <FaCheckCircle />
                      </div>

                      <div>
                        <strong>
                          {t("complaintResolved")}
                        </strong>

                        <span>
                          {t("finalResolution")}
                        </span>

                        <p>
                          {t("complaintWillAppear")}
                        </p>
                      </div>
                    </div>

                  </div>
                </div>

                <div className="cp-complaint-timeline">
                  <h3>Status history</h3>
                  {complaintHistory.length === 0 ? (
                    <p>History will appear after the first status update.</p>
                  ) : complaintHistory.map((event) => (
                    <div className="cp-timeline-item completed" key={event.id}>
                      <div className="cp-timeline-icon"><FaCheckCircle /></div>
                      <div>
                        <strong>{event.new_status}</strong>
                        <span>{formatDate(event.created_at)}{event.updated_by ? ` - ${event.updated_by}` : ""}</span>
                        {event.remarks && <p>{event.remarks}</p>}
                      </div>
                    </div>
                  ))}
                </div>

                {selectedComplaint.resolution_remarks && (
                  <div className="cp-resolution-proof">
                    <h3>Resolution proof</h3>
                    <p>{selectedComplaint.resolution_remarks}</p>
                    {selectedComplaint.resolution_image && <img src={`http://localhost:5000/${selectedComplaint.resolution_image}`} alt="Resolution proof" />}
                  </div>
                )}

                {getStatus(selectedComplaint.status) === "Resolved" && (
                  <div className="cp-feedback-panel">
                    <h3>{selectedComplaint.citizen_verified ? "Resolution verified" : "Verify this resolution"}</h3>
                    {!selectedComplaint.citizen_verified && (
                      <button type="button" className="cp-primary-button" onClick={verifyResolution}>
                        <FaCheckCircle /> Confirm resolution
                      </button>
                    )}
                    <div className="cp-feedback-form">
                      <label htmlFor="feedback-rating">Rating</label>
                      <select id="feedback-rating" value={feedbackRating} onChange={(event) => setFeedbackRating(Number(event.target.value))}>
                        {[5, 4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>{rating} / 5</option>)}
                      </select>
                      <textarea value={feedbackComment} onChange={(event) => setFeedbackComment(event.target.value)} placeholder="Share feedback about the resolution" />
                      <button type="button" className="cp-outline-button" onClick={submitFeedback}>Submit feedback</button>
                      {feedbackMessage && <p>{feedbackMessage}</p>}
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        {activeSection === "ai-analysis" && (
          <section className="cp-section-page cp-ai-analysis-page">
            <div className="cp-page-title">
              <div>
                <span>AI PROCESSING CENTER</span>
                <h2><FaBrain /> Complaint AI Analysis</h2>
                <p>View the AI classification, priority, severity and duplicate analysis for your complaints.</p>
              </div>
            </div>

            {complaints.length === 0 ? (
              <div className="cp-empty-state"><h3>No complaint analysis available</h3><p>Submit a complaint to see its AI analysis.</p></div>
            ) : (
              <div className="cp-ai-analysis-layout">
                <div className="cp-track-list">
                  {complaints.map((item) => (
                    <button type="button" className={`cp-track-item ${selectedComplaint?.id === item.id ? "active" : ""}`} key={item.id} onClick={() => setSelectedComplaint(item)}>
                      <div className="cp-track-item-left">
                        <div className="cp-track-item-icon"><FaBrain /></div>
                        <div><span className="cp-complaint-id">GCP-{item.id}</span><h3>{item.category || "Complaint"}</h3><p>{item.location || "Location unavailable"}</p></div>
                      </div>
                      <span className="cp-status-badge">View analysis</span>
                    </button>
                  ))}
                </div>

                {selectedComplaint && (
                  <div className="cp-track-detail-card">
                    <span className="cp-complaint-id">GCP-{selectedComplaint.id}</span>
                    <h2>AI Analysis Result</h2>
                    <div className="cp-track-details-grid">
                      <div><span>Detected category</span><strong>{selectedComplaint.ai_category || selectedComplaint.category || "Pending"}</strong></div>
                      <div><span>Department</span><strong>{selectedComplaint.ai_department || "Pending"}</strong></div>
                      <div><span>Confidence</span><strong>{selectedComplaint.ai_confidence ? `${Math.round(Number(selectedComplaint.ai_confidence) * 100)}%` : "Pending"}</strong></div>
                      <div><span>Priority</span><strong>{selectedComplaint.priority || "Medium"}</strong></div>
                      <div><span>Severity</span><strong>{selectedComplaint.severity || "Medium"}</strong></div>
                      <div><span>Analysis source</span><strong>{selectedComplaint.ai_source || "Rule engine"}</strong></div>
                      <div><span>Duplicate result</span><strong>{selectedComplaint.is_duplicate ? `Duplicate of #${selectedComplaint.duplicate_of || "existing complaint"}` : "No duplicate found"}</strong></div>
                      <div><span>Complaint ID</span><strong>GCP-{selectedComplaint.id}</strong></div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        {/* =====================================
            NEARBY ISSUES SECTION
        ===================================== */}
        {activeSection === "nearby-issues" && (
          <section className="cp-section-page">
            <div className="cp-page-title">
              <div>
                <span>{t("communityMap")}</span>

                <h2>
                  <FaMapMarkerAlt />
                  {t("nearbyIssues")}
                </h2>

                <p>
                  {t("nearbyIssuesDescription")}
                </p>
              </div>
            </div>

            <div className="cp-nearby-card">
              <MapContainer center={mapPosition} zoom={13} style={{ height: "420px", width: "100%" }}>
                <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                {nearbyIssues.filter((issue) => issue.latitude && issue.longitude).map((issue) => (
                  <Marker key={issue.id} position={[Number(issue.latitude), Number(issue.longitude)]}>
                    <Popup>{issue.category}: {issue.status}<br />{issue.location}</Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          </section>
        )}

{/* =====================================
            NOTIFICATIONS SECTION
        ===================================== */}
{activeSection === "notifications" && (
  <section className="cp-section-page">
    <div className="cp-page-title">
      <div>
        <span>{t("updatesAlerts")}</span>

        <h2>
          <FaBell />
          {t("notifications")}
        </h2>

        <p>
          {t("notificationsDescription")}
        </p>
      </div>
    </div>

    <div className="cp-notifications-card">
      {notifications.length === 0 ? (
        <div className="cp-empty-state">
          <div className="cp-empty-icon">
            <FaBell />
          </div>

          <h3>{t("allCaughtUp")}</h3>

          <p>{t("newNotifications")}</p>
        </div>
      ) : (
        notifications.map((notification) => (
          <button
            type="button"
            key={notification.id}
            className={`cp-notification-item ${
              notification.is_read ? "read" : "unread"
            }`}
            onClick={async () => {
              try {
                await axios.put(
                  `http://localhost:5000/api/notifications/${notification.id}/read`,
                  {},
                  {
                    headers: {
                      Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                  }
                );

                setNotifications((prev) =>
                  prev.map((item) =>
                    item.id === notification.id
                      ? { ...item, is_read: true }
                      : item
                  )
                );
              } catch (error) {
                console.error(
                  "Failed to mark notification as read:",
                  error
                );
              }
            }}
          >
            <div className="cp-notification-icon">
              <FaClipboardList />
            </div>

            <div className="cp-notification-content">
              <div className="cp-notification-title-row">
                <strong>{notification.title}</strong>

                {!notification.is_read && (
                  <span className="cp-notification-unread-dot"></span>
                )}
              </div>

              <p>{notification.message}</p>

              <small>
                {formatDate(notification.created_at)}
              </small>
            </div>
          </button>
        ))
      )}
    </div>
  </section>
)}
        {/* =====================================
            PROFILE SECTION
        ===================================== */}
        {activeSection === "profile" && (
          <section className="cp-section-page">
            <div className="cp-page-title">
              <div>
                <span>{t("accountManagement")}</span>

                <h2>
                  <FaUser />
                  {t("myProfile")}
                </h2>

                <p>
                  {t("profileDescription")}
                </p>
              </div>
            </div>

            <div className="cp-profile-card">
              <div className="cp-profile-avatar">
                <FaUser />
              </div>

              <div className="cp-profile-info">

                <div>
                  <span>{t("name")}</span>

                  <strong>
                    {citizen?.name || t("citizen")}
                  </strong>
                </div>

                <div>
                  <span>{t("email")}</span>

                  <strong>
                    {citizen?.email || "-"}
                  </strong>
                </div>

                <div>
                  <span>{t("mobile")}</span>

                  <strong>
                    {citizen?.mobile || "-"}
                  </strong>
                </div>

                <div>
                  <span>{t("accountType")}</span>

                  <strong>
                    {t("citizen")}
                  </strong>
                </div>

              </div>
            </div>
          </section>
        )}

        {/* =====================================
            HELP & SUPPORT SECTION
        ===================================== */}
        {activeSection === "help" && (
          <section className="cp-section-page">
            <div className="cp-page-title">
              <div>
                <span>{t("supportCenter")}</span>

                <h2>
                  <FaQuestionCircle />
                  {t("helpSupport")}
                </h2>

                <p>
                  {t("helpSupportDescription")}
                </p>
              </div>
            </div>

            <button
  type="button"
  className={`cp-help-card ${
    openHelpCard === "report" ? "open" : ""
  }`}
  onClick={() =>
    setOpenHelpCard(
      openHelpCard === "report" ? null : "report"
    )
  }
>
  <FaPlusCircle />

  <h3>{t("howToReport")}</h3>

  <p>{t("howToReportDescription")}</p>

  {openHelpCard === "report" && (
    <div className="cp-help-details">
      <strong>How to report a civic issue:</strong>

      <ol>
        <li>Open the <b>Report Complaint</b> section.</li>
        <li>Select or upload an image of the issue.</li>
        <li>Enter a clear description of the problem.</li>
        <li>Allow location access or select the location manually.</li>
        <li>Submit your complaint.</li>
        <li>
          AI will analyze the complaint and automatically identify
          the category, department and priority.
        </li>
      </ol>
    </div>
  )}
</button>

             <button
  type="button"
  className={`cp-help-card ${
    openHelpCard === "track" ? "open" : ""
  }`}
  onClick={() =>
    setOpenHelpCard(
      openHelpCard === "track" ? null : "track"
    )
  }
>
  <FaSearch />

  <h3>{t("howToTrack")}</h3>

  <p>{t("howToTrackDescription")}</p>

  {openHelpCard === "track" && (
    <div className="cp-help-details">
      <strong>How to track your complaint:</strong>

      <ol>
        <li>Open the <b>My Complaints</b> section.</li>
        <li>Select the complaint you want to check.</li>
        <li>View its current status and complaint details.</li>
        <li>
          The status can be <b>Pending</b>, <b>In Progress</b>,
          <b> Resolved</b> or <b>Rejected</b>.
        </li>
        <li>
          You can also check the complaint location and assigned
          department.
        </li>
      </ol>
    </div>
  )}
</button>

              <button
  type="button"
  className={`cp-help-card ${
    openHelpCard === "notifications" ? "open" : ""
  }`}
  onClick={() =>
    setOpenHelpCard(
      openHelpCard === "notifications" ? null : "notifications"
    )
  }
>
  <FaBell />

  <h3>{t("notifications")}</h3>

  <p>{t("complaintStatusUpdates")}</p>

  {openHelpCard === "notifications" && (
    <div className="cp-help-details">
      <strong>How notifications work:</strong>

      <ol>
        <li>You receive notifications when there is an update to your complaint.</li>
        <li>You may be notified when your complaint is assigned to a department.</li>
        <li>You can check status updates from the <b>Notifications</b> section.</li>
        <li>Click a notification to mark it as read.</li>
        <li>Unread notifications are highlighted for easy identification.</li>
      </ol>
    </div>
  )}
</button>
<button
  type="button"
  className={`cp-help-card ${
    openHelpCard === "assistance" ? "open" : ""
  }`}
  onClick={() =>
    setOpenHelpCard(
      openHelpCard === "assistance" ? null : "assistance"
    )
  }
>
  <FaQuestionCircle />

  <h3>{t("needAssistance")}</h3>

  <p>{t("needAssistanceDescription")}</p>

  {openHelpCard === "assistance" && (
    <div className="cp-help-details">
      <strong>Need help?</strong>

      <ol>
        <li>Make sure your complaint information is complete.</li>
        <li>Check your complaint status from <b>My Complaints</b>.</li>
        <li>Check the <b>Notifications</b> section for updates.</li>
        <li>
          If you are still facing an issue, contact the CivicPulse
          support team.
        </li>
      </ol>

      <div className="cp-help-contact">
        <strong>Support</strong>
        <span>support@civicpulse.com</span>
      </div>
    </div>
  )}
</button>
    
          </section>
        )}
      </main>
    </div>
  );
}

export default CitizenDashboard;