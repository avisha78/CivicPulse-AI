import React from "react";

import {
  Routes,
  Route,
} from "react-router-dom";

import Footer from "./components/Footer";

import {
  AppSettingsProvider,
} from "./components/AppSettingsContext";

// ==================================================
// PAGES
// ==================================================

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import CitizenLogin from "./pages/CitizenLogin";
import CitizenDashboard from "./pages/CitizenDashboard";
import CitizenProfile from "./pages/CitizenProfile";
import ReportComplaint from "./pages/ReportComplaint";
import OfficerLogin from "./pages/OfficerLogin";
import OfficerDashboard from "./pages/OfficerDashboard";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import ForgotPassword from "./pages/ForgotPassword";
import About from "./pages/About";
import Features from "./pages/Features";
import HowItWorks from "./pages/HowItWorks";
import Categories from "./pages/Categories";
import Contact from "./pages/Contact";
import DailyNews from "./pages/Dailynews";
import ProtectedRoute from "./components/ProtectedRoute";

// ==================================================
// APP
// ==================================================

function App() {
  return (
    <AppSettingsProvider>
      <div className="app-container">

        {/* ==================================================
            MAIN CONTENT
        ================================================== */}

        <main className="main-content">

          <Routes>

            {/* ==================================================
                HOME
            ================================================== */}

            <Route
              path="/"
              element={<Home />}
            />

            {/* ==================================================
                MAIN WEBSITE PAGES
            ================================================== */}

            <Route
              path="/about"
              element={<About />}
            />

            <Route
              path="/features"
              element={<Features />}
            />

            <Route
              path="/how-it-works"
              element={<HowItWorks />}
            />

            <Route
              path="/categories"
              element={<Categories />}
            />

            <Route
              path="/contact"
              element={<Contact />}
            />

            {/* ==================================================
                DAILY NEWS
            ================================================== */}

            <Route
              path="/daily-news"
              element={<DailyNews />}
            />

            {/* ==================================================
                LOGIN / REGISTER
            ================================================== */}

            <Route
              path="/login"
              element={<Login />}
            />

            <Route
              path="/register"
              element={<Register />}
            />

            {/* ==================================================
                CITIZEN
            ================================================== */}

            <Route
              path="/citizen-login"
              element={<CitizenLogin />}
            />

            <Route
              path="/forgot-password"
              element={<ForgotPassword />}
            />

            <Route
              path="/citizen-dashboard"
              element={<CitizenDashboard />}
            />

            <Route
              path="/my-complaints"
              element={<CitizenDashboard />}
            />

            <Route
              path="/citizen-profile"
              element={<CitizenProfile />}
            />

            <Route
              path="/report-complaint"
              element={
                <ProtectedRoute>
                  <ReportComplaint />
                </ProtectedRoute>
              }
            />

            {/* ==================================================
                OFFICER
            ================================================== */}

            <Route
              path="/officer-login"
              element={<OfficerLogin />}
            />

            <Route
              path="/officer-dashboard"
              element={<OfficerDashboard />}
            />

            {/* ==================================================
                ADMIN
            ================================================== */}

            <Route
              path="/admin-login"
              element={<AdminLogin />}
            />

            <Route
              path="/admin-dashboard"
              element={<AdminDashboard />}
            />

          </Routes>

        </main>

        {/* ==================================================
            GLOBAL FOOTER
        ================================================== */}

        <Footer />

      </div>
    </AppSettingsProvider>
  );
}

export default App;