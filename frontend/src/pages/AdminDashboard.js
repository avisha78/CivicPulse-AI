import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Line, Doughnut, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import {
  FaTachometerAlt,
  FaClipboardList,
  FaTags,
  FaBuilding,
  FaUsers,
  FaChartBar,
  FaFileAlt,
  FaCog,
  FaSignOutAlt,
  FaSearch,
  FaCheckCircle,
  FaClock,
  FaTimes,
  FaMicrochip,
  FaExclamationCircle,
  FaCity,
  FaUserTie,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useAppSettings } from "../components/AppSettingsContext";
import AdminGISMap from "../components/AdminGISMap";
import "./AdminDashboard.css";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend
);

const ALL_CATEGORIES = [
  "Garbage & Waste Management",
  "Road Damage / Potholes",
  "Water Supply",
  "Drainage & Sewerage",
  "Street Light",
];

const ALL_DEPARTMENTS = [
  "Sanitation",
  "Roads",
  "Water Supply",
  "Drainage",
  "Street Lighting",
];

function AdminDashboard() {
  const navigate = useNavigate();
  const { t } = useAppSettings();

  const [activeSection, setActiveSection] = useState("Dashboard");

  const [data, setData] = useState({
    statistics: {
      totalComplaints: 0,
      inProgress: 0,
      resolved: 0,
      pending: 0,
      totalCitizens: 0,
      totalOfficers: 0,
    },
    categories: ALL_CATEGORIES.map((category) => ({
      category,
      count: 0,
    })),
    departments: ALL_DEPARTMENTS.map((department) => ({
      department,
      count: 0,
    })),
    weeklyComplaints: [],
    recentComplaints: [],
    monthlyComplaints: [],
  });

  const [complaints, setComplaints] = useState([]);
  const [complaintsLoading, setComplaintsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [officers, setOfficers] = useState([]);
  const [officersLoading, setOfficersLoading] = useState(false);

  const [iotReadings, setIotReadings] = useState([]);
  const [hotspots, setHotspots] = useState([]);

  // MERGE CATEGORY DATA
  const mergeCategories = (backendCategories) => {
    const categoryMap = {};

    if (Array.isArray(backendCategories)) {
      backendCategories.forEach((item) => {
        const name = String(item.category || "").trim().toLowerCase();

        if (name) {
          categoryMap[name] = Number(item.count) || 0;
        }
      });
    }

    return ALL_CATEGORIES.map((category) => ({
      category,
      count: categoryMap[category.toLowerCase()] || 0,
    }));
  };

  // MERGE DEPARTMENT DATA
  const mergeDepartments = (backendDepartments) => {
    const departmentMap = {};

    if (Array.isArray(backendDepartments)) {
      backendDepartments.forEach((item) => {
        const name = String(item.department || "").trim().toLowerCase();

        if (name) {
          departmentMap[name] = Number(item.count) || 0;
        }
      });
    }

    return ALL_DEPARTMENTS.map((department) => ({
      department,
      count: departmentMap[department.toLowerCase()] || 0,
    }));
  };

  // LOAD DASHBOARD
  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = JSON.parse(localStorage.getItem("user") || "null");

    if (!token || !storedUser || storedUser.type !== "admin") {
      navigate("/admin-login", { replace: true });
      return;
    }

    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await axios.get(
          "http://localhost:5000/api/admin/dashboard",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const dashboardData = response.data || {};

        setData({
          statistics: {
            totalComplaints:
              Number(dashboardData.statistics?.totalComplaints) || 0,
            inProgress: Number(dashboardData.statistics?.inProgress) || 0,
            resolved: Number(dashboardData.statistics?.resolved) || 0,
            pending: Number(dashboardData.statistics?.pending) || 0,
            totalCitizens:
              Number(dashboardData.statistics?.totalCitizens) || 0,
            totalOfficers:
              Number(dashboardData.statistics?.totalOfficers) || 0,
          },
          categories: mergeCategories(dashboardData.categories),
          departments: mergeDepartments(dashboardData.departments),
          weeklyComplaints: Array.isArray(dashboardData.weeklyComplaints)
            ? dashboardData.weeklyComplaints
            : [],
          recentComplaints: Array.isArray(dashboardData.recentComplaints)
            ? dashboardData.recentComplaints
            : [],
          monthlyComplaints: Array.isArray(dashboardData.monthlyComplaints)
            ? dashboardData.monthlyComplaints
            : [],
        });
      } catch (err) {
        console.error("Admin dashboard error:", err);

        if (
          err.response?.status === 401 ||
          err.response?.status === 403
        ) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigate("/admin-login", { replace: true });
          return;
        }

        setError(
          err.response?.data?.message || t("unableToLoadDashboard")
        );
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [navigate, t]);

  // LOAD IOT READINGS AND HOTSPOTS
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const headers = {
      Authorization: `Bearer ${token}`,
    };

    Promise.allSettled([
      axios.get("http://localhost:5000/api/iot/readings", {
        headers,
      }),
      axios.get("http://localhost:5000/api/admin/complaints/hotspots", {
        headers,
      }),
    ]).then(([readingsResult, hotspotsResult]) => {
      if (readingsResult.status === "fulfilled") {
        setIotReadings(
          Array.isArray(readingsResult.value.data?.readings)
            ? readingsResult.value.data.readings
            : []
        );
      } else {
        console.error(
          "IoT readings loading error:",
          readingsResult.reason
        );
      }

      if (hotspotsResult.status === "fulfilled") {
        setHotspots(
          Array.isArray(hotspotsResult.value.data?.hotspots)
            ? hotspotsResult.value.data.hotspots
            : []
        );
      } else {
        console.error(
          "Hotspots loading error:",
          hotspotsResult.reason
        );
      }
    });
  }, []);

  // LOAD COMPLAINTS
  const loadComplaints = async () => {
    try {
      setComplaintsLoading(true);
      setError("");

      const token = localStorage.getItem("token");

      const response = await axios.get(
        "http://localhost:5000/api/admin/complaints",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setComplaints(
        Array.isArray(response.data?.complaints)
          ? response.data.complaints
          : []
      );
    } catch (err) {
      console.error("Complaints loading error:", err);

      if (
        err.response?.status === 401 ||
        err.response?.status === 403
      ) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/admin-login", { replace: true });
        return;
      }

      setError(
        err.response?.data?.message || t("unableToLoadComplaints")
      );
    } finally {
      setComplaintsLoading(false);
    }
  };

  // LOAD OFFICERS
  const loadOfficers = async () => {
    try {
      setOfficersLoading(true);

      const token = localStorage.getItem("token");

      const response = await axios.get(
        "http://localhost:5000/api/admin/officers",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setOfficers(
        Array.isArray(response.data?.officers)
          ? response.data.officers
          : []
      );
    } catch (err) {
      console.error("Officers loading error:", err);
      setError(
        err.response?.data?.message || "Unable to load officers"
      );
    } finally {
      setOfficersLoading(false);
    }
  };

  // LOAD USERS
  const loadUsers = async () => {
    try {
      setUsersLoading(true);
      setError("");

      const token = localStorage.getItem("token");

      const response = await axios.get(
        "http://localhost:5000/api/admin/users",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setUsers(
        Array.isArray(response.data?.users)
          ? response.data.users
          : []
      );
    } catch (err) {
      console.error("Users loading error:", err);

      if (err.response?.status === 404) {
        setUsers([]);
        setError(t("usersEndpointNotFound"));
      } else if (
        err.response?.status === 401 ||
        err.response?.status === 403
      ) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/admin-login", { replace: true });
        return;
      } else {
        setError(
          err.response?.data?.message || t("unableToLoadUsers")
        );
      }
    } finally {
      setUsersLoading(false);
    }
  };

  // SIDEBAR MENU
  const menuItems = [
    {
      icon: FaTachometerAlt,
      label: "Dashboard",
      translationKey: "dashboard",
    },
    {
      icon: FaClipboardList,
      label: "Complaints",
      translationKey: "complaints",
    },
    {
      icon: FaTags,
      label: "Categories",
      translationKey: "categories",
    },
    {
      icon: FaBuilding,
      label: "Departments",
      translationKey: "departments",
    },
    {
      icon: FaUsers,
      label: "Users",
      translationKey: "users",
    },
    {
      icon: FaUserTie,
      label: "Officers",
      translationKey: "officers",
    },
    {
      icon: FaChartBar,
      label: "Analytics",
      translationKey: "analytics",
    },
    {
      icon: FaCity,
      label: "GIS & Hotspots",
      translationKey: "gisHotspots",
    },
    {
      icon: FaMicrochip,
      label: "IoT Monitor",
      translationKey: "iotMonitor",
    },
    {
      icon: FaFileAlt,
      label: "Reports",
      translationKey: "reports",
    },
    {
      icon: FaCog,
      label: "Settings",
      translationKey: "settings",
    },
  ];

  const handleMenuClick = (label) => {
    setActiveSection(label);
    setSearchTerm("");
    setError("");

    if (
      ["Complaints", "Categories", "Departments", "Reports"].includes(label)
    ) {
      loadComplaints();
    }

    if (label === "Users") {
      loadUsers();
    }

    if (label === "Officers") {
      loadOfficers();
    }
  };

  // LOGOUT
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const stats = data.statistics || {};

  // CATEGORY CHART
  const categoryChart = useMemo(() => {
    const categories = Array.isArray(data.categories) ? data.categories : [];

    return {
      labels: categories.map((item) => item.category || "Unknown"),
      datasets: [
        {
          data: categories.map((item) => Number(item.count) || 0),
          backgroundColor: [
            "#2f6fe4",
            "#173f9f",
            "#D88900",
            "#9aa7b8",
            "#F5A623",
          ],
          borderWidth: 0,
        },
      ],
    };
  }, [data.categories]);

  // MONTHLY CHART
  const overviewChart = useMemo(() => {
    const monthly =
      Array.isArray(data.monthlyComplaints) &&
      data.monthlyComplaints.length > 0
        ? data.monthlyComplaints
        : Array.isArray(data.weeklyComplaints)
          ? data.weeklyComplaints.map((item) => ({
              month: item.label || item.week_start || "",
              count: Number(item.registered) || 0,
            }))
          : [];

    return {
      labels: monthly.map((item) => item.month || ""),
      datasets: [
        {
          label: t("registered"),
          data: monthly.map((item) => Number(item.count) || 0),
          borderColor: "#D88900",
          backgroundColor: "rgba(245, 166, 35, 0.10)",
          tension: 0.35,
          pointRadius: 4,
        },
      ],
    };
  }, [data.monthlyComplaints, data.weeklyComplaints, t]);

  // DEPARTMENT CHART
  const departmentChart = useMemo(() => {
    const departments = Array.isArray(data.departments)
      ? data.departments
      : [];

    return {
      labels: departments.map((item) => item.department || "Unknown"),
      datasets: [
        {
          label: t("complaints"),
          data: departments.map((item) => Number(item.count) || 0),
          backgroundColor: [
            "#0B1F3A",
            "#D88900",
            "#F5A623",
            "#f47b20",
            "#0B1F3A",
          ],
          borderRadius: 5,
        },
      ],
    };
  }, [data.departments, t]);

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0,
        },
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "62%",
    plugins: {
      legend: {
        display: false,
      },
    },
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0,
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
  };

  // FILTER COMPLAINTS
  const openComplaintBreakdown = (filter) => {
    setSearchTerm(filter);
    setActiveSection("Complaints");
    loadComplaints();
  };

  const filteredComplaints = Array.isArray(complaints)
    ? complaints.filter((complaint) => {
        const text = `
          ${complaint.title || ""}
          ${complaint.category || ""}
          ${complaint.ai_department || ""}
          ${complaint.location || ""}
          ${complaint.status || ""}
          ${complaint.citizen_name || ""}
        `.toLowerCase();

        return text.includes(searchTerm.toLowerCase());
      })
    : [];

  // UPDATE COMPLAINT STATUS
  const updateComplaintStatus = async (id, status) => {
    try {
      const token = localStorage.getItem("token");

      await axios.put(
        `http://localhost:5000/api/admin/complaints/${id}/status`,
        { status },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      await loadComplaints();
    } catch (err) {
      console.error("Status update error:", err);
      alert(
        err.response?.data?.message || t("unableToUpdateComplaint")
      );
    }
  };

  // REUSABLE IOT TABLE
  const renderIoTTable = (limit) => {
    const readings =
      typeof limit === "number"
        ? iotReadings.slice(0, limit)
        : iotReadings;

    if (readings.length === 0) {
      return (
        <p className="chart-loading">
          No sensor readings received yet.
        </p>
      );
    }

    return (
      <div className="table-responsive">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Device</th>
              <th>Reading</th>
              <th>Value</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            {readings.map((reading, index) => (
              <tr key={reading.id ?? `${reading.device_id}-${index}`}>
                <td>{reading.device_id || "-"}</td>
                <td>{reading.reading_type || "-"}</td>
                <td>
                  {reading.value ?? "-"} {reading.unit || ""}
                </td>
                <td>
                  {reading.created_at
                    ? new Date(reading.created_at).toLocaleString()
                    : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // REUSABLE HOTSPOTS TABLE
  const renderHotspotsTable = (limit) => {
    const visibleHotspots =
      typeof limit === "number"
        ? hotspots.slice(0, limit)
        : hotspots;

    if (visibleHotspots.length === 0) {
      return (
        <p className="chart-loading">
          No location clusters available yet.
        </p>
      );
    }

    return (
      <div className="table-responsive">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Category</th>
              <th>Area / Coordinates</th>
              <th>Complaints</th>
            </tr>
          </thead>
          <tbody>
            {visibleHotspots.map((hotspot, index) => (
              <tr
                key={`${hotspot.category || "unknown"}-${hotspot.lat_bucket ?? hotspot.lat ?? hotspot.latitude ?? index}-${index}`}
              >
                <td>{hotspot.category || "Unknown"}</td>
                <td>
                  {hotspot.lat_bucket ?? hotspot.lat ?? hotspot.latitude ?? "-"},
                  {" "}
                  {hotspot.lng_bucket ??
                    hotspot.lng ??
                    hotspot.longitude ??
                    "-"}
                </td>
                <td>
                  <strong>{hotspot.count || 0}</strong>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // DASHBOARD VIEW — NO GIS OR IOT DUPLICATES HERE
  const renderDashboard = () => {
    const categories = Array.isArray(data.categories) ? data.categories : [];

    const totalCategoryComplaints = categories.reduce(
      (sum, category) => sum + (Number(category.count) || 0),
      0
    );

    return (
      <>
        <section className="admin-stats-grid">
          <div className="admin-stat-card">
            <div className="admin-stat-icon amber">
              <FaClipboardList />
            </div>
            <div>
              <div className="admin-stat-label">{t("totalComplaints")}</div>
              <div className="admin-stat-number">
                {loading
                  ? "..."
                  : (Number(stats.totalComplaints) || 0).toLocaleString()}
              </div>
              <div className="admin-stat-trend positive">
                {t("totalRegistered")}
              </div>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-icon blue">
              <FaSearch />
            </div>
            <div>
              <div className="admin-stat-label">{t("inProgress")}</div>
              <div className="admin-stat-number">
                {loading
                  ? "..."
                  : (Number(stats.inProgress) || 0).toLocaleString()}
              </div>
              <div className="admin-stat-trend positive">
                {t("currentComplaints")}
              </div>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-icon amber-dark">
              <FaCheckCircle />
            </div>
            <div>
              <div className="admin-stat-label">{t("resolved")}</div>
              <div className="admin-stat-number">
                {loading
                  ? "..."
                  : (Number(stats.resolved) || 0).toLocaleString()}
              </div>
              <div className="admin-stat-trend positive">
                {t("successfullyResolved")}
              </div>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-icon orange">
              <FaClock />
            </div>
            <div>
              <div className="admin-stat-label">{t("pending")}</div>
              <div className="admin-stat-number">
                {loading
                  ? "..."
                  : (Number(stats.pending) || 0).toLocaleString()}
              </div>
              <div className="admin-stat-trend negative">
                {t("awaitingAction")}
              </div>
            </div>
          </div>
        </section>

        <section className="admin-chart-grid">
          <div className="admin-card">
            <h2>{t("complaintsOverview")}</h2>
            <div className="chart-box line-chart-box">
              {loading ? (
                <div className="chart-loading">{t("loadingChart")}</div>
              ) : overviewChart.labels.length === 0 ? (
                <div className="chart-loading">
                  {t("noComplaintDataYet")}
                </div>
              ) : (
                <Line data={overviewChart} options={lineOptions} />
              )}
            </div>
          </div>

          <div className="admin-card">
            <h2>{t("topComplaintCategories")}</h2>
            <div className="category-layout">
              <div className="chart-box doughnut-box">
                {loading ? (
                  <div className="chart-loading">{t("loading")}</div>
                ) : (
                  <Doughnut
                    data={categoryChart}
                    options={doughnutOptions}
                  />
                )}
              </div>

              <div className="category-legend">
                {categories.map((item, index) => {
                  const count = Number(item.count) || 0;
                  const percentage =
                    totalCategoryComplaints > 0
                      ? Math.round(
                          (count / totalCategoryComplaints) * 100
                        )
                      : 0;

                  return (
                    <div
                      className="category-legend-row"
                      key={item.category || index}
                    >
                      <span className="category-name">
                        <i
                          className={`category-color color-${index % 5}`}
                        />
                        {item.category || t("unknown")}
                      </span>
                      <strong>{percentage}%</strong>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <section className="admin-card department-card">
          <h2>{t("complaintsByDepartment")}</h2>
          <div className="chart-box department-chart-box">
            {loading ? (
              <div className="chart-loading">{t("loadingChart")}</div>
            ) : (
              <Bar data={departmentChart} options={barOptions} />
            )}
          </div>
        </section>
      </>
    );
  };

  // COMPLAINTS VIEW
  const renderComplaints = () => (
    <div className="admin-card">
      <div className="admin-section-header">
        <div>
          <h2>{t("allComplaints")}</h2>
          <p>{t("manageUpdateComplaints")}</p>
        </div>
        <input
          type="text"
          className="admin-search"
          placeholder={t("searchComplaints")}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {complaintsLoading ? (
        <div className="chart-loading">{t("loadingComplaints")}</div>
      ) : filteredComplaints.length === 0 ? (
        <div className="chart-loading">
          <FaClipboardList />
          <p>{t("noComplaintsFound")}</p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>{t("id")}</th>
                <th>{t("title")}</th>
                <th>{t("category")}</th>
                <th>{t("citizen")}</th>
                <th>{t("location")}</th>
                <th>{t("status")}</th>
                <th>Priority</th>
                <th>Severity</th>
                <th>Duplicate</th>
                <th>Department</th>
                <th>Officer</th>
                <th>{t("date")}</th>
              </tr>
            </thead>
            <tbody>
              {filteredComplaints.map((complaint) => (
                <tr key={complaint.id}>
                  <td>#{complaint.id}</td>
                  <td>{complaint.title || "-"}</td>
                  <td>{complaint.category || "-"}</td>
                  <td>{complaint.citizen_name || t("unknown")}</td>
                  <td>{complaint.location || "-"}</td>
                  <td>
                    <select
                      value={complaint.status || "Pending"}
                      onChange={(e) =>
                        updateComplaintStatus(
                          complaint.id,
                          e.target.value
                        )
                      }
                      className="status-select"
                    >
                      <option value="Pending">{t("pending")}</option>
                      <option value="In Progress">{t("inProgress")}</option>
                      <option value="Resolved">{t("resolved")}</option>
                    </select>
                  </td>
                  <td>{complaint.priority || "Medium"}</td>
                  <td>{complaint.severity || "Medium"}</td>
                  <td>
                    {complaint.is_duplicate
                      ? `Yes (#${complaint.duplicate_of || "-"})`
                      : "No"}
                  </td>
                  <td>{complaint.ai_department || "-"}</td>
                  <td>{complaint.officer_id || "Unassigned"}</td>
                  <td>
                    {complaint.created_at
                      ? new Date(
                          complaint.created_at
                        ).toLocaleDateString()
                      : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  // GIS & HOTSPOTS VIEW — MAP AND HOTSPOT TABLE ONLY
  const renderGISHotspots = () => (
    <>
      <section className="admin-gis-dashboard-section">
        <AdminGISMap hotspots={hotspots} />
      </section>

      <section className="admin-card">
        <div className="admin-section-header">
          <div>
            <h2>Complaint Hotspots</h2>
            <p>
              Complaint locations grouped by category and geographic area.
            </p>
          </div>
          <FaSearch />
        </div>

        {renderHotspotsTable()}
      </section>
    </>
  );

  // IOT MONITOR VIEW — SENSOR READINGS ONLY
  const renderIoTMonitor = () => {
    const hardwareConnected = iotReadings.length > 0;

    return (
      <div className="admin-iot-view">
        <section className="admin-card admin-iot-overview">
          <div className="admin-section-header">
            <div>
              <span className="admin-eyebrow">LIVE OPERATIONS</span>
              <h2>IoT Sensor Monitor</h2>
              <p>
                Monitor readings from ESP32 and connected civic hardware in
                real time.
              </p>
            </div>
            <div
              className={`admin-iot-status ${
                hardwareConnected ? "connected" : "waiting"
              }`}
            >
              <span />
              {hardwareConnected ? "Hardware connected" : "Awaiting hardware"}
            </div>
          </div>

          <div className="admin-iot-stat-grid">
            <div className="admin-iot-stat">
              <div className="admin-iot-stat-icon">
                <FaMicrochip />
              </div>
              <div>
                <span>Connected devices</span>
                <strong>{hardwareConnected ? "Active" : "0"}</strong>
              </div>
            </div>
            <div className="admin-iot-stat">
              <div className="admin-iot-stat-icon blue">
                <FaClock />
              </div>
              <div>
                <span>Last sync</span>
                <strong>{hardwareConnected ? "Available" : "Not synced"}</strong>
              </div>
            </div>
            <div className="admin-iot-stat">
              <div className="admin-iot-stat-icon alert">
                <FaExclamationCircle />
              </div>
              <div>
                <span>Hardware alerts</span>
                <strong>0 active</strong>
              </div>
            </div>
          </div>
        </section>

        <section className="admin-iot-content-grid">
          <div className="admin-card admin-hardware-alert-card">
            <div className="admin-section-header">
              <div>
                <h2>Hardware Alerts</h2>
                <p>Connection and device health notifications.</p>
              </div>
              <FaExclamationCircle />
            </div>
            <div className="admin-iot-empty compact">
              <div className="admin-iot-empty-icon">
                <FaCheckCircle />
              </div>
              <h3>No hardware alerts</h3>
              <p>
                Alerts will appear here when a connected device reports a
                fault, threshold breach, or connection problem.
              </p>
            </div>
          </div>

          <div className="admin-card admin-iot-setup-card">
            <div className="admin-section-header">
              <div>
                <h2>Connect hardware</h2>
                <p>Start sending sensor readings to CivicPulse AI.</p>
              </div>
              <FaMicrochip />
            </div>
            <ol className="admin-iot-steps">
              <li><span>1</span><div><strong>Register your device</strong><small>Use a unique device ID for each ESP32.</small></div></li>
              <li><span>2</span><div><strong>Send the first reading</strong><small>Post readings to the IoT readings endpoint.</small></div></li>
              <li><span>3</span><div><strong>Monitor alerts here</strong><small>Threshold breaches will be surfaced automatically.</small></div></li>
            </ol>
          </div>
        </section>

        <section className="admin-card admin-iot-readings-card">
          <div className="admin-section-header">
            <div>
              <h2>Recent sensor readings</h2>
              <p>Latest values received from connected devices.</p>
            </div>
            <FaMicrochip />
          </div>
          {iotReadings.length === 0 ? (
            <div className="admin-iot-empty">
              <div className="admin-iot-empty-icon">
                <FaMicrochip />
              </div>
              <h3>No sensor data yet</h3>
              <p>
                No hardware is connected yet. Once an ESP32 or other sensor
                sends its first reading, it will appear in this monitor.
              </p>
            </div>
          ) : (
            renderIoTTable()
          )}
        </section>
      </div>
    );
  };

  // CATEGORIES VIEW
  const renderCategories = () => {
    const categories = [
      ...ALL_CATEGORIES,
      ...Array.from(
        new Set(
          complaints
            .map((item) => item.category)
            .filter(
              (category) =>
                category && !ALL_CATEGORIES.includes(category)
            )
        )
      ),
    ];

    return (
      <div className="admin-card admin-breakdown-view">
        <h2>{t("complaintCategories")}</h2>
        <p>Every category with the complaints currently mapped to it.</p>
        <div className="admin-breakdown-grid">
          {categories.map((category) => {
            const items = complaints.filter(
              (item) => item.category === category
            );

            return (
              <button
                type="button"
                className="admin-breakdown-card"
                key={category}
                onClick={() => openComplaintBreakdown(category)}
              >
                <div className="admin-breakdown-card-header">
                  <span>
                    <FaTags /> {category}
                  </span>
                  <strong>{items.length}</strong>
                </div>
                <small>Complaints in this category</small>
                <div className="admin-breakdown-ids">
                  {items.slice(0, 6).map((item) => (
                    <span key={item.id}>GCP-{item.id}</span>
                  ))}
                </div>
                {items.length > 6 && <em>+{items.length - 6} more</em>}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  // DEPARTMENTS VIEW
  const renderDepartments = () => {
    const departmentMap = {
      "Garbage & Waste Management": "Sanitation",
      "Road Damage / Potholes": "Roads",
      "Water Supply": "Water Supply",
      "Drainage & Sewerage": "Drainage",
      "Street Light": "Street Lighting",
    };

    const grouped = {};

    ALL_DEPARTMENTS.forEach((department) => {
      grouped[department] = [];
    });

    complaints.forEach((item) => {
      const department =
        item.ai_department ||
        departmentMap[item.category] ||
        "Unassigned";

      grouped[department] = grouped[department] || [];
      grouped[department].push(item);
    });

    return (
      <div className="admin-card admin-breakdown-view">
        <h2>{t("departments")}</h2>
        <p>See which complaints are routed to each municipal department.</p>
        <div className="admin-breakdown-grid">
          {Object.entries(grouped).map(([department, items]) => (
            <button
              type="button"
              className="admin-breakdown-card department"
              key={department}
              onClick={() => openComplaintBreakdown(department)}
            >
              <div className="admin-breakdown-card-header">
                <span>
                  <FaBuilding /> {department}
                </span>
                <strong>{items.length}</strong>
              </div>
              <small>Assigned complaint cases</small>
              <div className="admin-breakdown-ids">
                {items.slice(0, 6).map((item) => (
                  <span key={item.id}>GCP-{item.id}</span>
                ))}
              </div>
              {items.length > 6 && <em>+{items.length - 6} more</em>}
            </button>
          ))}
        </div>
      </div>
    );
  };

  // USERS VIEW
  const renderUsers = () => (
    <div className="admin-card">
      <div className="admin-section-header">
        <div>
          <h2>{t("users")}</h2>
          <p>{t("registeredCitizensOfficers")}</p>
        </div>
      </div>

      {usersLoading ? (
        <div className="chart-loading">{t("loadingUsers")}</div>
      ) : users.length === 0 ? (
        <div className="chart-loading">
          <FaUsers />
          <p>{t("noUsersAvailable")}</p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>{t("id")}</th>
                <th>{t("name")}</th>
                <th>{t("email")}</th>
                <th>{t("mobile")}</th>
                <th>{t("role")}</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>#{user.id}</td>
                  <td>{user.name || "-"}</td>
                  <td>{user.email || "-"}</td>
                  <td>{user.mobile || "-"}</td>
                  <td>{user.role || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  // OFFICERS VIEW
  const renderOfficers = () => (
    <div className="admin-card admin-officers-view">
      <div className="admin-section-header">
        <div>
          <h2>Municipal Officers</h2>
          <p>
            View officers available for complaint assignment and monitor their workload.
          </p>
        </div>
        <FaUserTie />
      </div>

      {officersLoading ? (
        <div className="chart-loading">Loading officers...</div>
      ) : officers.length === 0 ? (
        <div className="chart-loading">
          <FaUserTie />
          <p>No officers registered yet.</p>
        </div>
      ) : (
        <div className="admin-officer-grid">
          {officers.map((officer) => {
            const assigned = complaints.filter(
              (item) => String(item.officer_id) === String(officer.id)
            );

            const open = assigned.filter(
              (item) => item.status !== "Resolved"
            ).length;

            return (
              <article className="admin-officer-card" key={officer.id}>
                <div className="admin-officer-avatar">
                  <FaUserTie />
                </div>
                <div className="admin-officer-main">
                  <span>OFFICER #{officer.id}</span>
                  <h3>{officer.name || "Unnamed officer"}</h3>
                  <p>{officer.department || "Department not set"}</p>
                </div>
                <div className="admin-officer-contact">
                  <small>{officer.email || "No email"}</small>
                  <small>{officer.mobile || "No mobile"}</small>
                </div>
                <div className="admin-officer-workload">
                  <div>
                    <strong>{assigned.length}</strong>
                    <span>Assigned</span>
                  </div>
                  <div>
                    <strong>{open}</strong>
                    <span>Open</span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );

  // ANALYTICS VIEW
  const renderAnalytics = () => (
    <>
      <div className="admin-card">
        <h2>{t("analytics")}</h2>
        <p>{t("complaintStatisticsAnalytics")}</p>

        <div className="simple-grid">
          <div className="simple-card">
            <div className="simple-card-icon">
              <FaChartBar />
            </div>
            <h3>{t("totalComplaints")}</h3>
            <p>{stats.totalComplaints || 0}</p>
          </div>
          <div className="simple-card">
            <div className="simple-card-icon">
              <FaClock />
            </div>
            <h3>{t("pending")}</h3>
            <p>{stats.pending || 0}</p>
          </div>
          <div className="simple-card">
            <div className="simple-card-icon">
              <FaCheckCircle />
            </div>
            <h3>{t("resolved")}</h3>
            <p>{stats.resolved || 0}</p>
          </div>
        </div>
      </div>

      <div className="admin-card department-card">
        <h2>{t("monthlyComplaintAnalytics")}</h2>
        <div className="chart-box department-chart-box">
          {overviewChart.labels.length === 0 ? (
            <div className="chart-loading">{t("noMonthlyData")}</div>
          ) : (
            <Line data={overviewChart} options={lineOptions} />
          )}
        </div>
      </div>
    </>
  );

  // REPORTS VIEW
  const renderReports = () => {
    const reportComplaints = Array.isArray(complaints) ? complaints : [];

    const resolvedCount = reportComplaints.filter(
      (item) => item.status === "Resolved"
    ).length;

    const inProgressCount = reportComplaints.filter(
      (item) => item.status === "In Progress"
    ).length;

    const duplicateCount = reportComplaints.filter(
      (item) => item.is_duplicate
    ).length;

    const resolutionRate = reportComplaints.length
      ? Math.round((resolvedCount / reportComplaints.length) * 100)
      : 0;

    const priorityCounts = ["Critical", "High", "Medium", "Low"].map(
      (priority) => ({
        label: priority,
        count: reportComplaints.filter(
          (item) => item.priority === priority
        ).length,
      })
    );

    const sourceCounts = ["citizen", "iot"].map((source) => ({
      label: source === "iot" ? "IoT sensors" : "Citizens",
      count: reportComplaints.filter(
        (item) => (item.source || "citizen") === source
      ).length,
    }));

    const exportReport = () => {
      const header = [
        "Complaint ID",
        "Category",
        "Priority",
        "Severity",
        "Status",
        "Department",
        "Source",
        "Created At",
      ];

      const rows = reportComplaints.map((item) => [
        `GCP-${item.id}`,
        item.category || "",
        item.priority || "Medium",
        item.severity || "Medium",
        item.status || "Pending",
        item.ai_department || "",
        item.source || "citizen",
        item.created_at || "",
      ]);

      const csv = [header, ...rows]
        .map((row) =>
          row
            .map((value) => `"${String(value).replace(/"/g, '""')}"`)
            .join(",")
        )
        .join("\n");

      const blob = new Blob([csv], {
        type: "text/csv;charset=utf-8;",
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = "civicpulse-complaint-report.csv";
      link.click();

      URL.revokeObjectURL(url);
    };

    return (
      <div className="admin-reports-view">
        <div className="admin-reports-hero">
          <div>
            <span>OPERATIONS INTELLIGENCE</span>
            <h2>Complaint Reports</h2>
            <p>
              Monitor resolution performance, urgency, duplicates and complaint sources.
            </p>
          </div>
          <button
            type="button"
            className="admin-report-export"
            onClick={exportReport}
          >
            <FaFileAlt /> Export CSV
          </button>
        </div>

        <div className="admin-report-kpis">
          <div className="admin-report-kpi blue">
            <span>Total complaints</span>
            <strong>
              {reportComplaints.length || stats.totalComplaints || 0}
            </strong>
            <small>All registered cases</small>
          </div>
          <div className="admin-report-kpi amber">
            <span>Resolution rate</span>
            <strong>{resolutionRate}%</strong>
            <small>{resolvedCount} resolved cases</small>
          </div>
          <div className="admin-report-kpi indigo">
            <span>In progress</span>
            <strong>{inProgressCount}</strong>
            <small>Currently assigned</small>
          </div>
          <div className="admin-report-kpi rose">
            <span>Duplicates flagged</span>
            <strong>{duplicateCount}</strong>
            <small>Needs review/merge</small>
          </div>
        </div>

        <div className="admin-report-grid">
          <section className="admin-report-panel">
            <div className="admin-report-panel-heading">
              <div>
                <span>URGENCY MIX</span>
                <h3>Priority distribution</h3>
              </div>
              <FaExclamationCircle />
            </div>
            <div className="admin-report-bars">
              {priorityCounts.map((item) => (
                <div className="admin-report-bar-row" key={item.label}>
                  <span>{item.label}</span>
                  <div>
                    <i
                      style={{
                        width: `${
                          reportComplaints.length
                            ? Math.max(
                                5,
                                (item.count / reportComplaints.length) * 100
                              )
                            : 5
                        }%`,
                      }}
                    />
                  </div>
                  <strong>{item.count}</strong>
                </div>
              ))}
            </div>
          </section>

          <section className="admin-report-panel">
            <div className="admin-report-panel-heading">
              <div>
                <span>INPUT CHANNELS</span>
                <h3>Where reports come from</h3>
              </div>
              <FaCity />
            </div>
            <div className="admin-source-list">
              {sourceCounts.map((item) => (
                <div className="admin-source-row" key={item.label}>
                  <span>{item.label}</span>
                  <strong>{item.count}</strong>
                  <small>
                    {reportComplaints.length
                      ? Math.round(
                          (item.count / reportComplaints.length) * 100
                        )
                      : 0}
                    %
                  </small>
                </div>
              ))}
            </div>
          </section>
        </div>

        <section className="admin-report-panel admin-report-table-panel">
          <div className="admin-report-panel-heading">
            <div>
              <span>CASE REGISTER</span>
              <h3>Latest complaint report</h3>
            </div>
            <FaClipboardList />
          </div>

          {reportComplaints.length === 0 ? (
            <p className="chart-loading">
              No complaint data available yet.
            </p>
          ) : (
            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Category</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Department</th>
                    <th>Source</th>
                  </tr>
                </thead>
                <tbody>
                  {reportComplaints.slice(0, 10).map((item) => (
                    <tr key={item.id}>
                      <td>
                        <strong>GCP-{item.id}</strong>
                      </td>
                      <td>{item.category || "-"}</td>
                      <td>
                        <span
                          className={`admin-report-pill ${
                            (item.priority || "Medium").toLowerCase()
                          }`}
                        >
                          {item.priority || "Medium"}
                        </span>
                      </td>
                      <td>{item.status || "Pending"}</td>
                      <td>{item.ai_department || "Unassigned"}</td>
                      <td>{item.source === "iot" ? "IoT" : "Citizen"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    );
  };

  // SETTINGS VIEW
  const renderSettings = () => {
    const user = JSON.parse(localStorage.getItem("user") || "null");

    return (
      <div className="admin-card">
        <h2>{t("settings")}</h2>
        <p>{t("administratorAccountInformation")}</p>

        <div className="simple-grid">
          <div className="simple-card">
            <div className="simple-card-icon">
              <FaCog />
            </div>
            <h3>{t("adminAccount")}</h3>
            <p>{user?.email || t("administrator")}</p>
          </div>
          <div className="simple-card">
            <div className="simple-card-icon">
              <FaUsers />
            </div>
            <h3>{t("role")}</h3>
            <p>{t("administrator")}</p>
          </div>
        </div>

        <button
          type="button"
          className="btn btn-danger mt-4"
          onClick={handleLogout}
        >
          <FaSignOutAlt className="me-2" />
          {t("logout")}
        </button>
      </div>
    );
  };

  // SELECT ACTIVE SECTION
  const renderActiveSection = () => {
    switch (activeSection) {
      case "Complaints":
        return renderComplaints();

      case "Categories":
        return renderCategories();

      case "Departments":
        return renderDepartments();

      case "Users":
        return renderUsers();

      case "Officers":
        return renderOfficers();

      case "Analytics":
        return renderAnalytics();

      case "GIS & Hotspots":
        return renderGISHotspots();

      case "IoT Monitor":
        return renderIoTMonitor();

      case "Reports":
        return renderReports();

      case "Settings":
        return renderSettings();

      case "Dashboard":
      default:
        return renderDashboard();
    }
  };

  // MAIN UI
  return (
    <div className="admin-page">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <div className="admin-brand-icon">▦</div>
          <div>
            <div className="admin-brand-title">CivicPulse AI</div>
            <div className="admin-brand-subtitle">{t("adminPanel")}</div>
          </div>
        </div>

        <nav className="admin-nav">
          {menuItems.map((item) => {
            const Icon = item.icon;

            return (
              <button
                type="button"
                key={item.label}
                className={`admin-nav-item ${
                  activeSection === item.label ? "active" : ""
                }`}
                onClick={() => handleMenuClick(item.label)}
              >
                <Icon />
                <span>
                  {item.label === "GIS & Hotspots" ||
                  item.label === "IoT Monitor"
                    ? item.label
                    : t(item.translationKey)}
                </span>
              </button>
            );
          })}
        </nav>

        <button
          type="button"
          className="admin-nav-item admin-logout"
          onClick={handleLogout}
        >
          <FaSignOutAlt />
          <span>{t("logout")}</span>
        </button>
      </aside>

      <main className="admin-main">
        <div className="admin-topbar">
          <div>
            <h1>
              {activeSection === "GIS & Hotspots" ||
              activeSection === "IoT Monitor"
                ? activeSection
                : t(
                    menuItems.find((item) => item.label === activeSection)
                      ?.translationKey || "dashboard"
                  )}
            </h1>
            <p>{t("civicPulseAdministration")}</p>
          </div>

          {activeSection === "Dashboard" && (
            <select className="admin-period" defaultValue="current">
              <option value="current">{t("currentPeriod")}</option>
              <option value="7days">{t("last7Days")}</option>
              <option value="30days">{t("last30Days")}</option>
              <option value="year">{t("thisYear")}</option>
            </select>
          )}
        </div>

        {error && (
          <div className="admin-error">
            <span>{error}</span>
            <button type="button" onClick={() => setError("")}>
              <FaTimes />
            </button>
          </div>
        )}

        {renderActiveSection()}
      </main>
    </div>
  );
}

export default AdminDashboard;
