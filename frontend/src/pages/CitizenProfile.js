import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FaBell, FaBrain, FaCheck, FaClipboardList, FaCity, FaEnvelope, FaMapMarkerAlt, FaPhone, FaPlusCircle, FaQuestionCircle, FaSave, FaSearch, FaSignOutAlt, FaTachometerAlt, FaUser } from "react-icons/fa";
import "./CitizenProfile.css";
import "./CitizenProfileLayout.css";

function CitizenProfile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [name, setName] = useState("");
  const [city, setCity] = useState("Bengaluru");
  const [ward, setWard] = useState("Ward 74 - Indiranagar");
  const [address, setAddress] = useState("12, 12th Main Road, Indiranagar, Bengaluru 560038");
  const [smsUpdates, setSmsUpdates] = useState(true);
  const [emailSummaries, setEmailSummaries] = useState(true);
  const [wardAlerts, setWardAlerts] = useState(false);
  const [statistics, setStatistics] = useState({ total: 0, resolved: 0 });
  const [message, setMessage] = useState("");

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) { navigate("/citizen-login"); return; }
    try {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      setName(parsedUser.name || "");
      setCity(parsedUser.city || "Bengaluru");
      setWard(parsedUser.ward || "Ward 74 - Indiranagar");
      const token = localStorage.getItem("token");
      axios.get("http://localhost:5000/api/citizen/statistics", { headers: { Authorization: `Bearer ${token}` } })
        .then((response) => setStatistics(response.data.statistics || { total: 0, resolved: 0 }))
        .catch(() => undefined);
    } catch (error) {
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      navigate("/citizen-login");
    }
  }, [navigate]);

  const initials = useMemo(() => name.split(" ").filter(Boolean).map((part) => part[0]).join("").slice(0, 2).toUpperCase() || "CP", [name]);

  const saveProfile = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) return;
    const updatedUser = { ...user, name: trimmedName, city, ward };
    try {
      const token = localStorage.getItem("token");
      await axios.put("http://localhost:5000/api/citizen/profile", { name: trimmedName }, { headers: { Authorization: `Bearer ${token}` } });
    } catch (error) { console.error("Profile save error:", error); }
    setUser(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));
    setMessage("Profile preferences saved");
    window.setTimeout(() => setMessage(""), 2500);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/citizen-login");
  };

  if (!user) return <div className="citizen-profile-loading">Loading profile...</div>;

  return (
    <div className="citizen-profile-app">
      <aside className="citizen-profile-sidebar-nav">
        <div className="citizen-profile-brand"><div><FaCity /></div><section><strong>CivicPulse AI</strong><small>Citizen Portal</small></section></div>
        <nav>
          <button type="button" onClick={() => navigate("/citizen-dashboard")}><FaTachometerAlt /> Dashboard</button>
          <button type="button" onClick={() => navigate("/my-complaints")}><FaClipboardList /> My Complaints</button>
          <button type="button" onClick={() => navigate("/citizen-dashboard")}><FaSearch /> Track Complaint</button>
          <button type="button" onClick={() => navigate("/citizen-dashboard")}><FaBrain /> AI Analysis</button>
          <button type="button" onClick={() => navigate("/report-complaint")}><FaPlusCircle /> Report Complaint</button>
          <button type="button" onClick={() => navigate("/citizen-dashboard")}><FaMapMarkerAlt /> Nearby Issues</button>
          <button type="button" onClick={() => navigate("/citizen-dashboard")}><FaBell /> Notifications</button>
          <button type="button" onClick={() => navigate("/citizen-dashboard")}><FaQuestionCircle /> Help &amp; Support</button>
        </nav>
        <div className="citizen-profile-sidebar-bottom"><div className="citizen-profile-sidebar-user"><div>{initials}</div><span><strong>{name || "Citizen"}</strong><small>Citizen</small></span></div><button type="button" onClick={logout}><FaSignOutAlt /> Logout</button></div>
      </aside>
      <div className="citizen-profile-main">
      <header className="citizen-profile-topbar">
        <span className="citizen-profile-portal">CITIZEN PORTAL</span>
        <div className="citizen-profile-topbar-user"><FaBell /><span>{name || "Citizen"}</span><div className="citizen-profile-mini-avatar">{initials}</div></div>
      </header>
      <main className="citizen-profile-shell">
        <div className="citizen-profile-heading"><div><h1>Profile &amp; preferences</h1><p>Manage your contact information, ward and notification settings.</p></div><button type="button" className="citizen-profile-save" onClick={saveProfile}><FaSave /> Save changes</button></div>
        <div className="citizen-profile-layout">
          <aside className="citizen-profile-sidebar">
            <section className="citizen-profile-card citizen-profile-identity"><div className="citizen-profile-avatar">{initials}</div><h2>{name || "Citizen"}</h2><p>Citizen member since March 2025</p><span className="citizen-profile-active"><i /> Active</span><button type="button"><FaUser /> Change profile photo</button></section>
            <section className="citizen-profile-card citizen-profile-contribution"><span>Civic contribution</span><strong>{statistics.total || 0} reports</strong><p>{statistics.resolved || 0} resolved issues have improved services for your ward residents.</p></section>
          </aside>
          <div className="citizen-profile-content">
            <section className="citizen-profile-card citizen-profile-panel"><div className="citizen-profile-panel-title"><h2>Personal information</h2><p>Used to contact you about complaint updates.</p></div><div className="citizen-profile-form-grid"><label>Full name<input value={name} onChange={(event) => setName(event.target.value)} /></label><label>Citizen ID<input value={`CP-${user.id || "001"}`} readOnly /></label><label><FaPhone /> Mobile number<input value={user.mobile || "Not available"} readOnly /></label><label><FaEnvelope /> Email address<input value={user.email || "Not available"} readOnly /></label></div></section>
            <section className="citizen-profile-card citizen-profile-panel"><div className="citizen-profile-panel-title"><h2>Address &amp; municipal ward</h2><p>Helps pre-fill locations and local service updates.</p></div><label><FaMapMarkerAlt /> Residential address<input value={address} onChange={(event) => setAddress(event.target.value)} /></label><div className="citizen-profile-form-grid"><label>City<select value={city} onChange={(event) => setCity(event.target.value)}><option>Bengaluru</option><option>Mumbai</option><option>Pune</option><option>Thane</option></select></label><label>Ward<select value={ward} onChange={(event) => setWard(event.target.value)}><option>Ward 74 - Indiranagar</option><option>Ward 12 - Central</option><option>Ward 28 - East</option></select></label></div></section>
            <section className="citizen-profile-card citizen-profile-panel citizen-profile-notifications"><div className="citizen-profile-panel-title"><h2>Notification preferences</h2></div><label className="citizen-profile-toggle-row"><span><strong>SMS status updates</strong><small>Receive important complaint status changes</small></span><input type="checkbox" checked={smsUpdates} onChange={(event) => setSmsUpdates(event.target.checked)} /><i /></label><label className="citizen-profile-toggle-row"><span><strong>Email summaries</strong><small>Weekly civic activity and resolution summary</small></span><input type="checkbox" checked={emailSummaries} onChange={(event) => setEmailSummaries(event.target.checked)} /><i /></label><label className="citizen-profile-toggle-row"><span><strong>Ward alerts</strong><small>Urgent service disruptions near your address</small></span><input type="checkbox" checked={wardAlerts} onChange={(event) => setWardAlerts(event.target.checked)} /><i /></label></section>
          </div>
        </div>
        {message && <div className="citizen-profile-toast"><FaCheck /> {message}</div>}
      </main>
      </div>
    </div>
  );
}

export default CitizenProfile;
