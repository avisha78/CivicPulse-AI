import React from "react";
import { Link } from "react-router-dom";
import {
  FaHome,
  FaClipboardList,
  FaPlusCircle,
  FaSearch,
  FaBell,
  FaUser,
  FaQuestionCircle,
  FaSignOutAlt,
} from "react-icons/fa";

function Sidebar() {
  return (
    <div
      className="bg-dark text-white p-3"
      style={{
        width: "250px",
        minHeight: "100vh",
      }}
    >
      <h3 className="text-center mb-4">
        CivicPulse AI
      </h3>

      <div className="d-grid gap-2">

        <Link className="btn btn-success text-start" to="/citizen-dashboard">
          <FaHome /> Dashboard
        </Link>

        <Link className="btn btn-dark text-start" to="/my-complaints">
          <FaClipboardList /> My Complaints
        </Link>

        <Link className="btn btn-dark text-start" to="/report-complaint">
          <FaPlusCircle /> Report Complaint
        </Link>

        <Link className="btn btn-dark text-start" to="/track-complaint">
          <FaSearch /> Track Complaint
        </Link>

        <Link className="btn btn-dark text-start" to="/notifications">
          <FaBell /> Notifications
        </Link>

        <Link className="btn btn-dark text-start" to="/profile">
          <FaUser /> Profile
        </Link>

        <Link className="btn btn-dark text-start" to="/help">
          <FaQuestionCircle /> Help & Support
        </Link>

        <Link className="btn btn-danger text-start mt-3" to="/">
          <FaSignOutAlt /> Logout
        </Link>

      </div>
    </div>
  );
}

export default Sidebar;