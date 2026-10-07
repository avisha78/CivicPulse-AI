import React, { useCallback, useEffect, useState } from "react";

import { useNavigate } from "react-router-dom";

import {
  FaCity,
  FaTachometerAlt,
  FaClipboardList,
  FaClock,
  FaCheckCircle,
  FaUserTie,
  FaSignOutAlt,
  FaArrowRight,
  FaChartBar,
  FaTasks,
  FaBell,
  FaQuestionCircle,
  FaExclamationCircle,
  FaMapMarkerAlt,
  FaPhone,
  FaEnvelope,
  FaSyncAlt,
} from "react-icons/fa";

import { useAppSettings } from "../components/AppSettingsContext";

import "./OfficerDashboard.css";

function OfficerDashboard() {
  const navigate = useNavigate();
  const { t, language } = useAppSettings();

  // =====================================================
  // LOGGED-IN OFFICER
  // =====================================================

  const getStoredUser = () => {
    try {
      const storedUser =
        localStorage.getItem("user") ||
        localStorage.getItem("currentUser") ||
        localStorage.getItem("officer");

      if (!storedUser) {
        return null;
      }

      return JSON.parse(storedUser);
    } catch (error) {
      console.error("Unable to read stored officer:", error);
      return null;
    }
  };

  const user = getStoredUser();

  // =====================================================
  // TOKEN
  // =====================================================

  const getToken = () => {
    return (
      localStorage.getItem("token") ||
      localStorage.getItem("officerToken") ||
      localStorage.getItem("jwt")
    );
  };

  // =====================================================
  // ACTIVE SECTION
  // =====================================================

  const [activeSection, setActiveSection] = useState("dashboard");

  // =====================================================
  // COMPLAINT STATE
  // =====================================================

  const [complaints, setComplaints] = useState([]);
  const [loadingComplaints, setLoadingComplaints] = useState(true);
  const [complaintError, setComplaintError] = useState("");
  const [resolvingId, setResolvingId] = useState(null);
  const [selectedComplaint, setSelectedComplaint] = useState(null);

  // =====================================================
  // NORMALIZE STATUS
  // =====================================================

  const normalizeStatus = (status) => {
    return String(status || "")
      .trim()
      .toLowerCase()
      .replace(/[_-]+/g, " ")
      .replace(/\s+/g, " ");
  };

  // =====================================================
  // FORMAT STATUS
  // =====================================================

  const formatStatus = (status) => {
    const normalized = normalizeStatus(status);

    if (!normalized) {
      return t("pending");
    }

    if (normalized === "pending") {
      return t("pending");
    }

    if (
      normalized === "in progress" ||
      normalized === "inprogress"
    ) {
      return t("inProgress");
    }

    if (normalized === "resolved") {
      return t("resolved");
    }

    if (normalized === "rejected") {
      const translated = t("rejected");
      return translated === "rejected" ? "Rejected" : translated;
    }

    return String(status);
  };

  // =====================================================
  // FORMAT CATEGORY
  // =====================================================

  const formatCategory = (category) => {
    const categoryMap = {
      Garbage: "garbage",
      Potholes: "potholes",
      "Water Supply": "waterSupply",
      Drainage: "drainage",
      "Street Lights": "streetLights",
    };

    const key = categoryMap[category];

    return key ? t(key) : category || t("notSpecified");
  };

  // =====================================================
  // FORMAT DATE
  // =====================================================

  const formatDateTime = (date) => {
    if (!date) {
      return t("notAvailable");
    }

    const localeMap = {
      English: "en-IN",
      Hindi: "hi-IN",
      Marathi: "mr-IN",
    };

    return new Date(date).toLocaleString(
      localeMap[language] || "en-IN"
    );
  };

  // =====================================================
  // FETCH ASSIGNED COMPLAINTS
  // =====================================================

  const fetchAssignedComplaints = useCallback(async () => {
    try {
      setLoadingComplaints(true);
      setComplaintError("");

      const token = getToken();

      console.log("====================================");
      console.log("OFFICER DASHBOARD");
      console.log("Fetching assigned complaints...");
      console.log("Token exists:", !!token);
      console.log("====================================");

      // -------------------------------------------------
      // TOKEN CHECK
      // -------------------------------------------------

      if (!token) {
        setComplaintError(
          t("officerAuthenticationTokenNotFound")
        );

        setComplaints([]);
        setLoadingComplaints(false);

        return;
      }

      // -------------------------------------------------
      // API REQUEST
      // -------------------------------------------------

      const response = await fetch(
        "http://localhost:5000/api/officer/complaints",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("API status:", response.status);

      // -------------------------------------------------
      // READ RESPONSE
      // -------------------------------------------------

      const contentType =
        response.headers.get("content-type");

      let data;

      if (
        contentType &&
        contentType.includes("application/json")
      ) {
        data = await response.json();
      } else {
        const text = await response.text();

        console.error("Non-JSON response:", text);

        throw new Error(
          t("invalidServerResponse")
        );
      }

      console.log(
        "Officer complaints API response:",
        data
      );

      // -------------------------------------------------
      // HANDLE AUTH ERROR
      // -------------------------------------------------

      if (
        response.status === 401 ||
        response.status === 403
      ) {
        localStorage.removeItem("token");
        localStorage.removeItem("officerToken");
        localStorage.removeItem("jwt");

        setComplaintError(
          data.message ||
            t("officerSessionExpired")
        );

        setComplaints([]);

        return;
      }

      // -------------------------------------------------
      // HANDLE OTHER API ERRORS
      // -------------------------------------------------

      if (!response.ok) {
        throw new Error(
          data.message ||
            t("failedToFetchAssignedComplaints")
        );
      }

      // -------------------------------------------------
      // GET COMPLAINT ARRAY
      // -------------------------------------------------

      let fetchedComplaints = [];

      if (Array.isArray(data)) {
        fetchedComplaints = data;
      } else if (Array.isArray(data.complaints)) {
        fetchedComplaints = data.complaints;
      } else if (Array.isArray(data.data)) {
        fetchedComplaints = data.data;
      }

      console.log(
        "Complaints received:",
        fetchedComplaints
      );

      console.log(
        "Total complaints:",
        fetchedComplaints.length
      );

      // -------------------------------------------------
      // SET STATE
      // -------------------------------------------------

      setComplaints(fetchedComplaints);
    } catch (error) {
      console.error(
        "Fetch assigned complaints error:",
        error
      );

      setComplaintError(
        error.message ||
          t("failedToLoadAssignedComplaints")
      );

      setComplaints([]);
    } finally {
      setLoadingComplaints(false);
    }
  }, [t]);

  // =====================================================
  // LOAD COMPLAINTS ON PAGE LOAD
  // =====================================================

  useEffect(() => {
    fetchAssignedComplaints();
  }, [fetchAssignedComplaints]);

  // =====================================================
  // LOGOUT
  // =====================================================

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("officerToken");
    localStorage.removeItem("jwt");
    localStorage.removeItem("user");
    localStorage.removeItem("currentUser");
    localStorage.removeItem("officer");

    navigate("/login");
  };

  // =====================================================
  // CHANGE SECTION
  // =====================================================

  const handleSectionChange = (section) => {
    setActiveSection(section);
  };

  const openComplaintDetails = (complaint) => {
    setSelectedComplaint(complaint);
    setActiveSection("complaint-details");
  };

  const resolveComplaint = async (event, complaint) => {
    event.preventDefault();
    setResolvingId(complaint.id);
    try {
      const response = await fetch(
        `http://localhost:5000/api/officer/complaints/${complaint.id}/resolve`,
        {
          method: "PUT",
          headers: { Authorization: `Bearer ${getToken()}` },
          body: new FormData(event.currentTarget),
        }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to resolve complaint");
      setComplaints((items) => items.map((item) => item.id === complaint.id ? data.complaint : item));
    } catch (error) {
      setComplaintError(error.message);
    } finally {
      setResolvingId(null);
    }
  };

  // =====================================================
  // STATUS COUNTS
  // =====================================================

  const pendingComplaints = complaints.filter(
    (complaint) =>
      normalizeStatus(complaint.status) === "pending"
  );

  const inProgressComplaints = complaints.filter(
    (complaint) =>
      normalizeStatus(complaint.status) === "in progress"
  );

  const resolvedComplaints = complaints.filter(
    (complaint) =>
      normalizeStatus(complaint.status) === "resolved"
  );

  // =====================================================
  // COMPLAINT IMAGE
  // =====================================================

  const getImageUrl = (image) => {
    if (!image) {
      return "";
    }

    if (
      image.startsWith("http://") ||
      image.startsWith("https://") ||
      image.startsWith("data:")
    ) {
      return image;
    }

    if (image.startsWith("/")) {
      return `http://localhost:5000${image}`;
    }

    return `http://localhost:5000/${image}`;
  };

  // =====================================================
  // COMPLAINT CARD
  // =====================================================

  const renderComplaintCard = (complaint) => {
    const displayStatus = formatStatus(
      complaint.status
    );

    const statusClass =
      normalizeStatus(complaint.status)
        .replace(/\s+/g, "-") || "pending";

    return (
      <div
        key={complaint.id}
        className="cp-officer-complaint-card"
      >
        {/* CARD HEADER */}

        <div className="cp-officer-complaint-card-header">
          <div>
            <span className="cp-officer-complaint-id">
              {t("complaintId")} #{complaint.id}
            </span>

            <h3>
              {complaint.title ||
                t("civicComplaint")}
            </h3>
          </div>

          <span
            className={`cp-officer-status ${statusClass}`}
          >
            {displayStatus}
          </span>
        </div>

        {/* COMPLAINT DETAILS */}

        <div className="cp-officer-complaint-details">
          <p>
            <strong>{t("category")}:</strong>{" "}
            {formatCategory(complaint.category)}
          </p>

          <p>
            <strong>{t("description")}:</strong>{" "}
            {complaint.description ||
              t("noDescriptionAvailable")}
          </p>

          <p>
            <FaMapMarkerAlt />
            <strong> {t("location")}:</strong>{" "}
            {complaint.location ||
              t("locationNotAvailable")}
          </p>

          {complaint.latitude &&
            complaint.longitude && (
              <p>
                <strong>{t("coordinates")}:</strong>{" "}
                {complaint.latitude},{" "}
                {complaint.longitude}
              </p>
            )}

          {complaint.citizen_name && (
            <p>
              <strong>{t("citizen")}:</strong>{" "}
              {complaint.citizen_name}
            </p>
          )}

          {complaint.citizen_email && (
            <p>
              <FaEnvelope />
              <strong> {t("email")}:</strong>{" "}
              {complaint.citizen_email}
            </p>
          )}

          {complaint.citizen_mobile && (
            <p>
              <FaPhone />
              <strong> {t("mobile")}:</strong>{" "}
              {complaint.citizen_mobile}
            </p>
          )}

          <p>
            <strong>{t("submitted")}:</strong>{" "}
            {formatDateTime(complaint.created_at)}
          </p>
        </div>

        {/* IMAGE */}

        {complaint.image && (
          <div className="cp-officer-complaint-image">
            <img
              src={getImageUrl(complaint.image)}
              alt={t("complaint")}
              onError={(event) => {
                event.currentTarget.style.display =
                  "none";
              }}
            />
          </div>
        )}

        {(normalizeStatus(complaint.status) === "pending" || normalizeStatus(complaint.status) === "in progress") && (
          <form className="cp-officer-resolution-form" onSubmit={(event) => resolveComplaint(event, complaint)}>
            <textarea name="remarks" placeholder="Resolution remarks" required />
            <input name="resolutionImage" type="file" accept="image/*" />
            <button type="submit" disabled={resolvingId === complaint.id}>
              {resolvingId === complaint.id ? "Saving..." : "Mark resolved"}
            </button>
          </form>
        )}

        <button type="button" className="cp-officer-details-button" onClick={() => openComplaintDetails(complaint)}>
          View complaint details
        </button>
      </div>
    );
  };

  // =====================================================
  // ERROR / LOADING COMPONENT
  // =====================================================

  const renderComplaintState = () => {
    if (loadingComplaints) {
      return (
        <div className="cp-officer-empty">
          <div className="cp-officer-empty-icon">
            <FaClipboardList />
          </div>

          <h3>{t("loadingComplaints")}</h3>

          <p>
            {t("loadingAssignedComplaintsDescription")}
          </p>
        </div>
      );
    }

    if (complaintError) {
      return (
        <div className="cp-officer-empty">
          <div className="cp-officer-empty-icon">
            <FaExclamationCircle />
          </div>

          <h3>{t("unableToLoadComplaints")}</h3>

          <p>{complaintError}</p>

          <button
            type="button"
            className="cp-officer-empty-button"
            onClick={fetchAssignedComplaints}
          >
            <FaSyncAlt />
            {t("tryAgain")}
          </button>
        </div>
      );
    }

    if (complaints.length === 0) {
      return (
        <div className="cp-officer-empty">
          <div className="cp-officer-empty-icon">
            <FaClipboardList />
          </div>

          <h3>{t("noComplaintsAssignedYet")}</h3>

          <p>
            {t("assignedComplaintsWillAppear")}
          </p>

          <div className="cp-officer-complaint-meta">
            <span>
              <FaExclamationCircle />
              {t("complaintPriorityWillAppear")}
            </span>

            <span>
              <FaMapMarkerAlt />
              {t("complaintLocationWillAppear")}
            </span>
          </div>
        </div>
      );
    }

    return null;
  };

  // =====================================================
  // DASHBOARD
  // =====================================================

  const renderDashboard = () => {
    return (
      <>
        {/* WELCOME */}

        <section className="cp-officer-welcome">
          <div className="cp-officer-welcome-content">
            <span>
              {t("officerPortal").toUpperCase()}
            </span>

            <h2>
              {t("welcomeBack")},{" "}
              {user?.name || t("officer")}!
            </h2>

            <p>
              {t("officerDashboardWelcomeDescription")}
            </p>
          </div>

          <div className="cp-officer-welcome-icon">
            <FaCity />
          </div>
        </section>

        {/* STATISTICS */}

        <section className="cp-officer-stat-section">

          {/* ASSIGNED */}

          <div
            className="cp-officer-stat-card"
            onClick={() =>
              handleSectionChange("assigned")
            }
            style={{ cursor: "pointer" }}
          >
            <div className="cp-officer-stat-icon blue">
              <FaClipboardList />
            </div>

            <div className="cp-officer-stat-content">
              <span>
                {t("assignedComplaints")}
              </span>

              <strong>{complaints.length}</strong>

              <small>
                {t("complaintsAssignedToYou")}
              </small>
            </div>
          </div>

          {/* PENDING */}

          <div
            className="cp-officer-stat-card"
            onClick={() =>
              handleSectionChange("update")
            }
            style={{ cursor: "pointer" }}
          >
            <div className="cp-officer-stat-icon orange">
              <FaClock />
            </div>

            <div className="cp-officer-stat-content">
              <span>
                {t("pendingComplaints")}
              </span>

              <strong>
                {pendingComplaints.length}
              </strong>

              <small>
                {t("complaintsAwaitingAction")}
              </small>
            </div>
          </div>

          {/* IN PROGRESS */}

          <div
            className="cp-officer-stat-card"
            onClick={() =>
              handleSectionChange("update")
            }
            style={{ cursor: "pointer" }}
          >
            <div className="cp-officer-stat-icon blue">
              <FaTasks />
            </div>

            <div className="cp-officer-stat-content">
              <span>{t("inProgress")}</span>

              <strong>
                {inProgressComplaints.length}
              </strong>

              <small>
                {t("complaintsCurrentlyHandled")}
              </small>
            </div>
          </div>

          {/* RESOLVED */}

          <div
            className="cp-officer-stat-card"
            onClick={() =>
              handleSectionChange("resolved")
            }
            style={{ cursor: "pointer" }}
          >
            <div className="cp-officer-stat-icon amber">
              <FaCheckCircle />
            </div>

            <div className="cp-officer-stat-content">
              <span>
                {t("resolvedComplaints")}
              </span>

              <strong>
                {resolvedComplaints.length}
              </strong>

              <small>
                {t("successfullyResolvedComplaints")}
              </small>
            </div>
          </div>
        </section>

        {/* FUNCTIONS */}

        <section className="cp-officer-functions">
          <div className="cp-officer-section-heading">
            <div>
              <span>
                {t("management").toUpperCase()}
              </span>

              <h2>{t("officerFunctions")}</h2>

              <p>
                {t("officerFunctionsDescription")}
              </p>
            </div>

            <FaChartBar />
          </div>

          <div className="cp-officer-function-grid">

            {/* ASSIGNED */}

            <button
              type="button"
              className="cp-officer-function-card"
              onClick={() =>
                handleSectionChange("assigned")
              }
            >
              <div className="cp-officer-function-icon blue">
                <FaClipboardList />
              </div>

              <div className="cp-officer-function-content">
                <h3>
                  {t("viewAssignedComplaints")}
                </h3>

                <p>
                  {t(
                    "viewAssignedComplaintsDescription"
                  )}
                </p>
              </div>

              <FaArrowRight className="cp-officer-function-arrow" />
            </button>

            {/* UPDATE */}

            <button
              type="button"
              className="cp-officer-function-card"
              onClick={() =>
                handleSectionChange("update")
              }
            >
              <div className="cp-officer-function-icon orange">
                <FaTasks />
              </div>

              <div className="cp-officer-function-content">
                <h3>
                  {t("updateComplaintStatus")}
                </h3>

                <p>
                  {t(
                    "updateComplaintStatusDescription"
                  )}
                </p>
              </div>

              <FaArrowRight className="cp-officer-function-arrow" />
            </button>

            {/* RESOLVED */}

            <button
              type="button"
              className="cp-officer-function-card"
              onClick={() =>
                handleSectionChange("resolved")
              }
            >
              <div className="cp-officer-function-icon amber">
                <FaCheckCircle />
              </div>

              <div className="cp-officer-function-content">
                <h3>
                  {t("viewResolvedComplaints")}
                </h3>

                <p>
                  {t(
                    "viewResolvedComplaintsDescription"
                  )}
                </p>
              </div>

              <FaArrowRight className="cp-officer-function-arrow" />
            </button>

          </div>
        </section>

        {/* RECENT COMPLAINTS */}

        <section className="cp-officer-recent">
          <div className="cp-officer-recent-header">
            <div>
              <span>
                {t("activity").toUpperCase()}
              </span>

              <h2>{t("recentComplaints")}</h2>

              <p>
                {t("latestComplaintsAssigned")}
              </p>
            </div>

            <button
              type="button"
              className="cp-officer-view-all"
              onClick={() =>
                handleSectionChange("assigned")
              }
            >
              {t("viewAll")}
              <FaArrowRight />
            </button>
          </div>

          {loadingComplaints ||
          complaintError ||
          complaints.length === 0 ? (
            renderComplaintState()
          ) : (
            <div className="cp-officer-complaint-list">
              {complaints
                .slice(0, 5)
                .map(renderComplaintCard)}
            </div>
          )}
        </section>
      </>
    );
  };

  // =====================================================
  // ASSIGNED COMPLAINTS
  // =====================================================

  const renderAssignedComplaints = () => {
    return (
      <section className="cp-officer-content-section cp-officer-assigned-view">
        <div className="cp-officer-section-heading">
          <div>
            <span>
              {t("complaintManagement").toUpperCase()}
            </span>

            <h2>{t("assignedComplaints")}</h2>

            <p>
              {t("complaintsCurrentlyAssigned")}
            </p>
          </div>

          <FaClipboardList />
        </div>

        {loadingComplaints ||
        complaintError ||
        complaints.length === 0 ? (
          renderComplaintState()
        ) : (
          <div className="cp-officer-complaint-list">
            {complaints.map(renderComplaintCard)}
          </div>
        )}
      </section>
    );
  };

  // =====================================================
  // UPDATE STATUS
  // =====================================================

  const renderUpdateStatus = () => {
    const updateComplaints = complaints.filter(
      (complaint) => {
        const status = normalizeStatus(
          complaint.status
        );

        return (
          status === "pending" ||
          status === "in progress"
        );
      }
    );

    return (
      <section className="cp-officer-content-section cp-officer-update-view">
        <div className="cp-officer-section-heading">
          <div>
            <span>
              {t("complaintManagement").toUpperCase()}
            </span>

            <h2>{t("updateComplaintStatus")}</h2>

            <p>
              {t("updateComplaintProgressDescription")}
            </p>
          </div>

          <FaTasks />
        </div>

        {loadingComplaints ? (
          <div className="cp-officer-empty">
            <h3>{t("loadingComplaints")}</h3>
          </div>
        ) : complaintError ? (
          renderComplaintState()
        ) : updateComplaints.length === 0 ? (
          <div className="cp-officer-empty">
            <div className="cp-officer-empty-icon">
              <FaTasks />
            </div>

            <h3>{t("noPendingComplaints")}</h3>

            <p>
              {t(
                "complaintsRequiringStatusUpdates"
              )}
            </p>
          </div>
        ) : (
          <div className="cp-officer-complaint-list">
            {updateComplaints.map(
              renderComplaintCard
            )}
          </div>
        )}
      </section>
    );
  };

  // =====================================================
  // RESOLVED
  // =====================================================

  const renderResolvedComplaints = () => {
    return (
      <section className="cp-officer-content-section cp-officer-resolved-view">
        <div className="cp-officer-section-heading">
          <div>
            <span>
              {t("complaintHistory").toUpperCase()}
            </span>

            <h2>{t("resolvedComplaints")}</h2>

            <p>
              {t(
                "successfullyResolvedComplaintsDescription"
              )}
            </p>
          </div>

          <FaCheckCircle />
        </div>

        {loadingComplaints ? (
          <div className="cp-officer-empty">
            <h3>{t("loadingComplaints")}</h3>
          </div>
        ) : complaintError ? (
          renderComplaintState()
        ) : resolvedComplaints.length === 0 ? (
          <div className="cp-officer-empty">
            <div className="cp-officer-empty-icon">
              <FaCheckCircle />
            </div>

            <h3>{t("noResolvedComplaints")}</h3>

            <p>
              {t(
                "successfullyResolvedWillAppear"
              )}
            </p>
          </div>
        ) : (
          <div className="cp-officer-complaint-list">
            {resolvedComplaints.map(
              renderComplaintCard
            )}
          </div>
        )}
      </section>
    );
  };

  const renderComplaintDetails = () => {
    if (!selectedComplaint) return renderAssignedComplaints();
    return (
      <section className="cp-officer-content-section cp-officer-details-view">
        <button type="button" className="cp-back-button" onClick={() => handleSectionChange("assigned")}>Back to assigned complaints</button>
        <div className="cp-officer-section-heading">
          <div>
            <span>COMPLAINT DETAILS</span>
            <h2>GCP-{selectedComplaint.id}</h2>
            <p>{selectedComplaint.description}</p>
          </div>
          <FaClipboardList />
        </div>
        <div className="cp-track-details-grid">
          <div><span>Category</span><strong>{formatCategory(selectedComplaint.category)}</strong></div>
          <div><span>Location</span><strong>{selectedComplaint.location || "-"}</strong></div>
          <div><span>Priority</span><strong>{selectedComplaint.priority || "Medium"}</strong></div>
          <div><span>Severity</span><strong>{selectedComplaint.severity || "Medium"}</strong></div>
          <div><span>AI category</span><strong>{selectedComplaint.ai_category || selectedComplaint.category || "-"}</strong></div>
          <div><span>AI department</span><strong>{selectedComplaint.ai_department || "-"}</strong></div>
          <div><span>AI confidence</span><strong>{selectedComplaint.ai_confidence ? `${Math.round(Number(selectedComplaint.ai_confidence) * 100)}%` : "-"}</strong></div>
          <div><span>Duplicate</span><strong>{selectedComplaint.is_duplicate ? `Yes, complaint #${selectedComplaint.duplicate_of || "-"}` : "No"}</strong></div>
          <div><span>Citizen</span><strong>{selectedComplaint.citizen_name || "-"}</strong></div>
          <div><span>Contact</span><strong>{selectedComplaint.citizen_mobile || selectedComplaint.citizen_email || "-"}</strong></div>
        </div>
        {selectedComplaint.image && <img className="cp-officer-complaint-image" src={getImageUrl(selectedComplaint.image)} alt="Complaint evidence" />}
      </section>
    );
  };

  // =====================================================
  // NOTIFICATIONS
  // =====================================================

  const renderNotifications = () => {
    return (
      <section className="cp-officer-content-section">
        <div className="cp-officer-section-heading">
          <div>
            <span>{t("alerts").toUpperCase()}</span>

            <h2>{t("notifications")}</h2>

            <p>
              {t("notificationsDescription")}
            </p>
          </div>

          <FaBell />
        </div>

        <div className="cp-officer-empty">
          <div className="cp-officer-empty-icon">
            <FaBell />
          </div>

          <h3>{t("noNewNotifications")}</h3>

          <p>
            {t(
              "officerNotificationsWillAppear"
            )}
          </p>
        </div>
      </section>
    );
  };

  // =====================================================
  // HELP
  // =====================================================

  const renderHelpSupport = () => {
    return (
      <section className="cp-officer-content-section">
        <div className="cp-officer-section-heading">
          <div>
            <span>{t("support").toUpperCase()}</span>

            <h2>{t("helpSupport")}</h2>

            <p>
              {t("helpSupportOfficerDescription")}
            </p>
          </div>

          <FaQuestionCircle />
        </div>

        <div className="cp-officer-help-grid">

          <div className="cp-officer-help-card">
            <FaQuestionCircle />

            <h3>
              {t("howToManageComplaints")}
            </h3>

            <p>
              {t(
                "howToManageComplaintsDescription"
              )}
            </p>
          </div>

          <div className="cp-officer-help-card">
            <FaEnvelope />

            <h3>{t("emailSupport")}</h3>

            <p>
              {t("emailSupportDescription")}
            </p>
          </div>

          <div className="cp-officer-help-card">
            <FaPhone />

            <h3>{t("contactSupport")}</h3>

            <p>
              {t("contactSupportDescription")}
            </p>
          </div>

        </div>
      </section>
    );
  };

  // =====================================================
  // ACTIVE SECTION
  // =====================================================

  const renderActiveSection = () => {
    switch (activeSection) {
      case "assigned":
        return renderAssignedComplaints();

      case "update":
        return renderUpdateStatus();

      case "resolved":
        return renderResolvedComplaints();

      case "complaint-details":
        return renderComplaintDetails();

      case "notifications":
        return renderNotifications();

      case "help":
        return renderHelpSupport();

      case "dashboard":
      default:
        return renderDashboard();
    }
  };

  // =====================================================
  // HEADER TITLE
  // =====================================================

  const getHeaderTitle = () => {
    const titles = {
      dashboard: t("officerDashboard"),
      assigned: t("assignedComplaints"),
      update: t("updateComplaintStatus"),
      resolved: t("resolvedComplaints"),
      "complaint-details": "Complaint Details",
      notifications: t("notifications"),
      help: t("helpSupport"),
    };

    return (
      titles[activeSection] ||
      t("officerDashboard")
    );
  };

  // =====================================================
  // HEADER DESCRIPTION
  // =====================================================

  const getHeaderDescription = () => {
    const descriptions = {
      dashboard: t(
        "officerDashboardHeaderDescription"
      ),

      assigned: t(
        "assignedComplaintsHeaderDescription"
      ),

      update: t(
        "updateComplaintStatusHeaderDescription"
      ),

      resolved: t(
        "resolvedComplaintsHeaderDescription"
      ),

      notifications: t(
        "officerNotificationsHeaderDescription"
      ),

      help: t(
        "officerHelpHeaderDescription"
      ),
    };

    return (
      descriptions[activeSection] ||
      descriptions.dashboard
    );
  };

  // =====================================================
  // MAIN RETURN
  // =====================================================

  return (
    <div className="cp-officer-dashboard">

      {/* =================================================
          SIDEBAR
      ================================================= */}

      <aside className="cp-officer-sidebar">

        {/* BRAND */}

        <div className="cp-officer-brand">
          <div className="cp-officer-brand-icon">
            <FaCity />
          </div>

          <div className="cp-officer-brand-text">
            <h2>CivicPulse AI</h2>
            <span>{t("officerPortal")}</span>
          </div>
        </div>

        {/* NAVIGATION */}

        <nav className="cp-officer-nav">

          <button
            type="button"
            className={`cp-officer-nav-item ${
              activeSection === "dashboard"
                ? "active"
                : ""
            }`}
            onClick={() =>
              handleSectionChange("dashboard")
            }
          >
            <FaTachometerAlt />
            <span>{t("dashboard")}</span>
          </button>

          <button
            type="button"
            className={`cp-officer-nav-item ${
              activeSection === "assigned"
                ? "active"
                : ""
            }`}
            onClick={() =>
              handleSectionChange("assigned")
            }
          >
            <FaClipboardList />

            <span>
              {t("assignedComplaints")}
            </span>
          </button>

          <button
            type="button"
            className={`cp-officer-nav-item ${
              activeSection === "update"
                ? "active"
                : ""
            }`}
            onClick={() =>
              handleSectionChange("update")
            }
          >
            <FaTasks />
            <span>{t("updateStatus")}</span>
          </button>

          <button
            type="button"
            className={`cp-officer-nav-item ${
              activeSection === "resolved"
                ? "active"
                : ""
            }`}
            onClick={() =>
              handleSectionChange("resolved")
            }
          >
            <FaCheckCircle />

            <span>
              {t("resolvedComplaints")}
            </span>
          </button>

          <button
            type="button"
            className={`cp-officer-nav-item ${
              activeSection === "notifications"
                ? "active"
                : ""
            }`}
            onClick={() =>
              handleSectionChange("notifications")
            }
          >
            <FaBell />
            <span>{t("notifications")}</span>
          </button>

          <button
            type="button"
            className={`cp-officer-nav-item ${
              activeSection === "help"
                ? "active"
                : ""
            }`}
            onClick={() =>
              handleSectionChange("help")
            }
          >
            <FaQuestionCircle />
            <span>{t("helpSupport")}</span>
          </button>

        </nav>

        {/* PROFILE */}

        <div className="cp-officer-sidebar-profile">
          <div className="cp-officer-profile-icon">
            <FaUserTie />
          </div>

          <div className="cp-officer-profile-info">
            <strong>
              {user?.name || t("officer")}
            </strong>

            <span>
              {user?.department ||
                t("municipalOfficer")}
            </span>
          </div>
        </div>

        {/* LOGOUT */}

        <button
          type="button"
          className="cp-officer-logout"
          onClick={handleLogout}
        >
          <FaSignOutAlt />
          <span>{t("logout")}</span>
        </button>

      </aside>

      {/* =================================================
          MAIN
      ================================================= */}

      <main className="cp-officer-main">

        {/* HEADER */}

        <header className="cp-officer-header">
          <div>
            <span className="cp-officer-header-label">
              CIVICPULSE AI
            </span>

            <h1>{getHeaderTitle()}</h1>

            <p>{getHeaderDescription()}</p>
          </div>

          <div className="cp-officer-header-user">
            <div className="cp-officer-header-icon">
              <FaUserTie />
            </div>

            <div>
              <strong>
                {user?.name || t("officer")}
              </strong>

              <span>
                {user?.department ||
                  t("municipalDepartment")}
              </span>
            </div>
          </div>
        </header>

        {/* ACTIVE SECTION */}

        {renderActiveSection()}

        {/* FOOTER */}

        <footer className="cp-officer-footer">
          <strong>CivicPulse AI</strong>

          <span>
            {t("smartGovernanceSmarterSolutions")}
          </span>
        </footer>

      </main>
    </div>
  );
}

export default OfficerDashboard;