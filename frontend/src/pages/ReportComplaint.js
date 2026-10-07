import React, { useEffect, useState } from "react";

import axios from "axios";

import { useNavigate } from "react-router-dom";

import {
  MapContainer,
  TileLayer,
  Marker,
  useMap,
  useMapEvents,
} from "react-leaflet";

import L from "leaflet";

import "leaflet/dist/leaflet.css";

import {
  FaMapMarkerAlt,
  FaMap,
  FaImage,
  FaPaperPlane,
  FaFileAlt,
  FaArrowLeft,
  FaLocationArrow,
  FaCheckCircle,
  FaSearch,
  FaShieldAlt,
} from "react-icons/fa";

import "./ReportComplaint.css";

/* =====================================================
   FIX LEAFLET MARKER ICON
===================================================== */

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",

  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",

  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

/* =====================================================
   GET ADDRESS FROM LATITUDE / LONGITUDE
===================================================== */

const getAddressFromCoordinates = async (
  latitude,
  longitude
) => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
      {
        headers: {
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to get address");
    }

    const data = await response.json();

    if (data.display_name) {
      return data.display_name;
    }

    return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
  } catch (error) {
    console.error("Reverse geocoding error:", error);

    return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
  }
};

/* =====================================================
   GET COORDINATES FROM LOCATION NAME
===================================================== */

const getCoordinatesFromLocation = async (location) => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        location
      )}&limit=1`,
      {
        headers: {
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error("Location search failed");
    }

    const data = await response.json();

    if (!data || data.length === 0) {
      return null;
    }

    return {
      latitude: parseFloat(data[0].lat),
      longitude: parseFloat(data[0].lon),
      displayName: data[0].display_name,
    };
  } catch (error) {
    console.error("Location search error:", error);

    return null;
  }
};

/* =====================================================
   LOCATION MARKER
===================================================== */

function LocationMarker({
  position,
  setPosition,
  setLocation,
  setCoordinates,
  setErrors,
}) {
  useMapEvents({
    click: async (e) => {
      const { lat, lng } = e.latlng;

      const newPosition = [lat, lng];

      // Move marker
      setPosition(newPosition);

      // Save coordinates
      setCoordinates({
        latitude: lat,
        longitude: lng,
      });

      // Clear location error
      setErrors((prev) => ({
        ...prev,
        location: "",
      }));

      // Show coordinates immediately
      setLocation(
        `${lat.toFixed(6)}, ${lng.toFixed(6)}`
      );

      // Get readable address
      const address = await getAddressFromCoordinates(
        lat,
        lng
      );

      setLocation(address);
    },
  });

  if (!position) {
    return null;
  }

  return <Marker position={position} />;
}

/* =====================================================
   UPDATE MAP POSITION
===================================================== */

function MapUpdater({ position }) {
  const map = useMap();

  useEffect(() => {
    if (position) {
      map.flyTo(position, 15, {
        duration: 1.2,
      });
    }
  }, [position, map]);

  return null;
}

/* =====================================================
   REPORT COMPLAINT
===================================================== */

function ReportComplaint() {
  const navigate = useNavigate();

  /* =====================================================
     FORM DATA
  ===================================================== */

  const [complaint, setComplaint] = useState({
    category: "",
    description: "",
    location: "",
    image: null,
  });

  /* =====================================================
     IMAGE PREVIEW
  ===================================================== */

  const [imagePreview, setImagePreview] = useState("");

  /* =====================================================
     ERRORS
  ===================================================== */

  const [errors, setErrors] = useState({});

  /* =====================================================
     MAP POSITION
  ===================================================== */

  const [position, setPosition] = useState(null);

  /* =====================================================
     COORDINATES
  ===================================================== */

  const [coordinates, setCoordinates] = useState({
    latitude: null,
    longitude: null,
  });

  /* =====================================================
     LOCATION LOADING
  ===================================================== */

  const [gettingLocation, setGettingLocation] =
    useState(false);

  /* =====================================================
     SUBMIT LOADING
  ===================================================== */

  const [submitting, setSubmitting] = useState(false);

  /* =====================================================
     LOCATION SEARCH LOADING
  ===================================================== */

  const [searchingLocation, setSearchingLocation] =
    useState(false);

  /* =====================================================
     HANDLE INPUT CHANGE
  ===================================================== */

  const handleChange = (e) => {
    const {
      name,
      value,
      files,
    } = e.target;

    /* =================================================
       IMAGE
    ================================================= */

    if (name === "image") {
      const file = files && files[0];

      if (!file) {
        setComplaint((prev) => ({
          ...prev,
          image: null,
        }));

        setImagePreview("");

        setErrors((prev) => ({
          ...prev,
          image: "",
        }));

        return;
      }

      /* ===============================================
         5 MB IMAGE LIMIT
      =============================================== */

      const maxSize = 5 * 1024 * 1024;

      if (file.size > maxSize) {
        setErrors((prev) => ({
          ...prev,
          image:
            "Image size must be less than 5 MB.",
        }));

        e.target.value = "";

        setComplaint((prev) => ({
          ...prev,
          image: null,
        }));

        setImagePreview("");

        return;
      }

      /* ===============================================
         VALID IMAGE
      =============================================== */

      setErrors((prev) => ({
        ...prev,
        image: "",
      }));

      setComplaint((prev) => ({
        ...prev,
        image: file,
      }));

      setImagePreview(
        URL.createObjectURL(file)
      );

      return;
    }

    /* =================================================
       NORMAL INPUT
    ================================================= */

    setComplaint((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  };

  /* =====================================================
     AUTOMATIC LOCATION SEARCH
  ===================================================== */

  useEffect(() => {
    const location = complaint.location.trim();

    if (!location) {
      return;
    }

    const timer = setTimeout(async () => {
      setSearchingLocation(true);

      const result =
        await getCoordinatesFromLocation(
          location
        );

      if (result) {
        const newPosition = [
          result.latitude,
          result.longitude,
        ];

        // Update map marker
        setPosition(newPosition);

        // Save coordinates
        setCoordinates({
          latitude: result.latitude,
          longitude: result.longitude,
        });

        setErrors((prev) => ({
          ...prev,
          location: "",
        }));
      }

      setSearchingLocation(false);
    }, 1000);

    return () => {
      clearTimeout(timer);
    };
  }, [complaint.location]);

  /* =====================================================
     CURRENT LOCATION
  ===================================================== */

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setErrors((prev) => ({
        ...prev,
        location:
          "Geolocation is not supported by your browser.",
      }));

      return;
    }

    setGettingLocation(true);

    setErrors((prev) => ({
      ...prev,
      location: "",
    }));

    navigator.geolocation.getCurrentPosition(
      async (locationData) => {
        const latitude =
          locationData.coords.latitude;

        const longitude =
          locationData.coords.longitude;

        const newPosition = [
          latitude,
          longitude,
        ];

        /* =============================================
           MAP POSITION
        ============================================= */

        setPosition(newPosition);

        /* =============================================
           COORDINATES
        ============================================= */

        setCoordinates({
          latitude,
          longitude,
        });

        /* =============================================
           TEMPORARY COORDINATES
        ============================================= */

        setComplaint((prev) => ({
          ...prev,
          location: `${latitude.toFixed(
            6
          )}, ${longitude.toFixed(6)}`,
        }));

        try {
          const address =
            await getAddressFromCoordinates(
              latitude,
              longitude
            );

          setComplaint((prev) => ({
            ...prev,
            location: address,
          }));
        } catch (error) {
          console.error(error);
        } finally {
          setGettingLocation(false);
        }
      },

      (error) => {
        console.error(
          "Location error:",
          error
        );

        let message =
          "Unable to get your current location.";

        if (error.code === 1) {
          message =
            "Location permission denied. Please allow location access.";
        } else if (error.code === 2) {
          message =
            "Your current location could not be determined.";
        } else if (error.code === 3) {
          message =
            "Location request timed out. Please try again.";
        }

        setErrors((prev) => ({
          ...prev,
          location: message,
        }));

        setGettingLocation(false);
      },

      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  };

  /* =====================================================
     SUBMIT COMPLAINT
  ===================================================== */

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = {};

    /* ===============================================
       CATEGORY
    =============================================== */

    if (!complaint.category) {
      newErrors.category =
        "Please select a category";
    }

    /* ===============================================
       DESCRIPTION
    =============================================== */

    if (!complaint.description.trim()) {
      newErrors.description =
        "Please describe the complaint";
    }

    /* ===============================================
       LOCATION
    =============================================== */

    if (!complaint.location.trim()) {
      newErrors.location =
        "Complaint location is required";
    }

    /* ===============================================
       VALIDATION
    =============================================== */

    if (
      Object.keys(newErrors).length > 0
    ) {
      setErrors(newErrors);
      return;
    }

    /* ===============================================
       TOKEN
    =============================================== */

    const token =
      localStorage.getItem("token");

    if (!token) {
      setErrors({
        general:
          "You are not logged in. Please login first.",
      });

      return;
    }

    /* ===============================================
       CHECK COORDINATES
    =============================================== */

    if (
      coordinates.latitude === null ||
      coordinates.longitude === null
    ) {
      setErrors({
        location:
          "Please select a valid location from the map.",
      });

      return;
    }

    try {
      setSubmitting(true);

      setErrors({});

      /* =============================================
         SEND TO BACKEND
      ============================================= */

      const formData = new FormData();

formData.append(
  "category",
  complaint.category
);

formData.append(
  "description",
  complaint.description.trim()
);

formData.append(
  "location",
  complaint.location.trim()
);

formData.append(
  "latitude",
  coordinates.latitude
);

formData.append(
  "longitude",
  coordinates.longitude
);

// Actual image file
if (complaint.image) {
  formData.append(
    "image",
    complaint.image
  );
}

const response = await axios.post(
  "http://localhost:5000/api/complaints",
  formData,
  {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "multipart/form-data",
    },
  }
);
      console.log(
        "Complaint submitted:",
        response.data
      );

      alert(
        "Complaint submitted successfully!"
      );

      navigate("/my-complaints");
    } catch (error) {
      console.error(
        "Complaint submission error:",
        error
      );

      if (error.response) {
        setErrors({
          general:
            error.response.data?.message ||
            "Failed to submit complaint.",
        });
      } else {
        setErrors({
          general:
            "Unable to connect to the server.",
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  /* =====================================================
     PAGE
  ===================================================== */

  return (
    <div className="cp-report-page">

      {/* =================================================
          HEADER
      ================================================= */}

      <header className="cp-report-header">
        <div className="cp-report-header-inner">

          <button
            type="button"
            className="cp-report-back"
            onClick={() => navigate(-1)}
            aria-label="Go Back"
          >
            <FaArrowLeft />
          </button>

          <div className="cp-report-header-content">
            <h1>Report Complaint</h1>

            <p>
              Help us improve your city
            </p>
          </div>

          <div className="cp-report-header-badge">
            <FaFileAlt />
          </div>

        </div>
      </header>

      {/* =================================================
          MAIN CONTAINER
      ================================================= */}

      <main className="cp-report-container">

        {/* =================================================
            INTRO
        ================================================= */}

        <section className="cp-report-intro">

          <div className="cp-report-intro-icon">
            <FaShieldAlt />
          </div>

          <div className="cp-report-intro-content">

            <span>
              CIVICPULSE AI
            </span>

            <h2>
              Your voice matters!
            </h2>

            <p>
              Report issues you see in your area.
              Your complaint helps make the city
              cleaner, safer and better.
            </p>

          </div>

          <div className="cp-report-intro-decoration">
            <div></div>
            <div></div>
            <div></div>
          </div>

        </section>

        <div className="cp-report-stepper" aria-label="Complaint submission progress">
          <div className="cp-report-step active"><b>1</b><span>Issue details</span></div>
          <i />
          <div className="cp-report-step"><b>2</b><span>Photo evidence</span></div>
          <i />
          <div className="cp-report-step"><b>3</b><span>Location</span></div>
          <i />
          <div className="cp-report-step"><b>4</b><span>Review</span></div>
        </div>

        {/* =================================================
            GENERAL ERROR
        ================================================= */}

        {errors.general && (
          <div className="cp-report-error">
            <FaFileAlt />

            <span>
              {errors.general}
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit}>

          {/* =================================================
              CATEGORY
          ================================================= */}

          <section className="cp-report-card">

            <div className="cp-report-section-title">

              <div className="cp-report-section-icon">
                <FaMap />
              </div>

              <div>
                <span>
                  COMPLAINT CATEGORY
                </span>

                <h2>
                  Select the issue type
                </h2>
              </div>

            </div>

            <div className="cp-category-grid">

              {/* GARBAGE */}

              <button
                type="button"
                className={`cp-category-item ${
                  complaint.category ===
                  "Garbage & Waste Management"
                    ? "selected"
                    : ""
                }`}
                onClick={() =>
                  handleChange({
                    target: {
                      name: "category",
                      value:
                        "Garbage & Waste Management",
                    },
                  })
                }
              >
                <span className="cp-category-emoji">
                  🗑️
                </span>

                <strong>
                  Garbage
                </strong>

                <small>
                  Waste Management
                </small>
              </button>

              {/* ROAD */}

              <button
                type="button"
                className={`cp-category-item ${
                  complaint.category ===
                  "Road Damage / Potholes"
                    ? "selected"
                    : ""
                }`}
                onClick={() =>
                  handleChange({
                    target: {
                      name: "category",
                      value:
                        "Road Damage / Potholes",
                    },
                  })
                }
              >
                <span className="cp-category-emoji">
                  🛣️
                </span>

                <strong>
                  Road Damage
                </strong>

                <small>
                  Potholes
                </small>
              </button>

              {/* STREET LIGHT */}

              <button
                type="button"
                className={`cp-category-item ${
                  complaint.category ===
                  "Street Light"
                    ? "selected"
                    : ""
                }`}
                onClick={() =>
                  handleChange({
                    target: {
                      name: "category",
                      value:
                        "Street Light",
                    },
                  })
                }
              >
                <span className="cp-category-emoji">
                  💡
                </span>

                <strong>
                  Street Light
                </strong>

                <small>
                  Lighting Issues
                </small>
              </button>

              {/* DRAINAGE */}

              <button
                type="button"
                className={`cp-category-item ${
                  complaint.category ===
                  "Drainage & Sewerage"
                    ? "selected"
                    : ""
                }`}
                onClick={() =>
                  handleChange({
                    target: {
                      name: "category",
                      value:
                        "Drainage & Sewerage",
                    },
                  })
                }
              >
                <span className="cp-category-emoji">
                  🌊
                </span>

                <strong>
                  Drainage
                </strong>

                <small>
                  Sewerage Issues
                </small>
              </button>

              {/* WATER */}

              <button
                type="button"
                className={`cp-category-item ${
                  complaint.category ===
                  "Water Supply"
                    ? "selected"
                    : ""
                }`}
                onClick={() =>
                  handleChange({
                    target: {
                      name: "category",
                      value:
                        "Water Supply",
                    },
                  })
                }
              >
                <span className="cp-category-emoji">
                  💧
                </span>

                <strong>
                  Water Supply
                </strong>

                <small>
                  Water Issues
                </small>
              </button>

              {/* OTHER */}

              <button
                type="button"
                className={`cp-category-item ${
                  complaint.category ===
                  "Other"
                    ? "selected"
                    : ""
                }`}
                onClick={() =>
                  handleChange({
                    target: {
                      name: "category",
                      value: "Other",
                    },
                  })
                }
              >
                <span className="cp-category-emoji">
                  •••
                </span>

                <strong>
                  Other
                </strong>

                <small>
                  Other Issues
                </small>
              </button>

            </div>

            {errors.category && (
              <div className="cp-report-field-error">
                {errors.category}
              </div>
            )}

          </section>

          {/* =================================================
              DESCRIPTION
          ================================================= */}

          <section className="cp-report-card">

            <div className="cp-report-section-title">

              <div className="cp-report-section-icon">
                ✎
              </div>

              <div>
                <span>
                  DESCRIPTION
                </span>

                <h2>
                  Describe the problem
                </h2>
              </div>

            </div>

            <textarea
              className={`cp-report-textarea ${
                errors.description
                  ? "cp-report-input-error"
                  : ""
              }`}
              rows="6"
              name="description"
              value={complaint.description}
              onChange={handleChange}
              placeholder="Describe the issue in detail..."
            />

            <div className="cp-description-footer">

              <span>
                Provide as much detail as possible
              </span>

              <span>
                {complaint.description.length}
              </span>

            </div>

            {errors.description && (
              <div className="cp-report-field-error">
                {errors.description}
              </div>
            )}

          </section>

          {/* =================================================
              LOCATION
          ================================================= */}

          <section className="cp-report-card">

            <div className="cp-report-location-heading">

              <div className="cp-report-section-title">

                <div className="cp-report-section-icon">
                  <FaMapMarkerAlt />
                </div>

                <div>
                  <span>
                    LOCATION
                  </span>

                  <h2>
                    Where did this happen?
                  </h2>
                </div>

              </div>

              <button
                type="button"
                className="cp-current-location-btn"
                onClick={getCurrentLocation}
                disabled={gettingLocation}
              >
                <FaLocationArrow />

                {gettingLocation
                  ? "Getting Location..."
                  : "Use Current Location"}
              </button>

            </div>

            {/* LOCATION INPUT */}

            <div className="cp-location-input-wrapper">

              <FaSearch />

              <input
                type="text"
                className={`cp-report-input cp-location-input ${
                  errors.location
                    ? "cp-report-input-error"
                    : ""
                }`}
                name="location"
                value={complaint.location}
                onChange={handleChange}
                placeholder="Enter location e.g. Thane"
              />

            </div>

            {searchingLocation && (
              <div className="cp-location-searching">

                <FaSearch />

                Searching location...

              </div>
            )}

            {errors.location && (
              <div className="cp-report-field-error">
                {errors.location}
              </div>
            )}

            {/* MAP */}

            <div className="cp-map-wrapper">

              <div className="cp-map-top-label">

                <FaMap />

                <span>
                  Select location on map
                </span>

                <small>
                  Click anywhere on the map
                </small>

              </div>

              <div className="cp-report-map">

                <MapContainer
                  center={[
                    19.076,
                    72.8777,
                  ]}
                  zoom={11}
                  style={{
                    height: "100%",
                    width: "100%",
                  }}
                >

                  <TileLayer
                    attribution="&copy; OpenStreetMap contributors"
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />

                  <LocationMarker
                    position={position}
                    setPosition={setPosition}
                    setLocation={(location) =>
                      setComplaint(
                        (prev) => ({
                          ...prev,
                          location,
                        })
                      )
                    }
                    setCoordinates={
                      setCoordinates
                    }
                    setErrors={setErrors}
                  />

                  <MapUpdater
                    position={position}
                  />

                </MapContainer>

              </div>

              <div className="cp-map-help">

                <FaMapMarkerAlt />

                <span>
                  Type a location above and the map
                  will automatically move there.
                  You can also click directly on
                  the map.
                </span>

              </div>

            </div>

          </section>

          {/* =================================================
              IMAGE
          ================================================= */}

          <section className="cp-report-card">

            <div className="cp-report-section-title">

              <div className="cp-report-section-icon">
                <FaImage />
              </div>

              <div>
                <span>
                  PHOTO EVIDENCE
                </span>

                <h2>
                  Add a photo
                </h2>
              </div>

            </div>

            <label className="cp-upload-box">

              <div className="cp-upload-icon">
                <FaImage />
              </div>

              <strong>
                Click to upload an image
              </strong>

              <span>
                JPG, PNG or JPEG • Maximum 5 MB
              </span>

              <input
                type="file"
                name="image"
                accept="image/*"
                onChange={handleChange}
              />

            </label>

            {errors.image && (
              <div className="cp-report-field-error">
                {errors.image}
              </div>
            )}

            {imagePreview && (
              <div className="cp-preview-wrapper">

                <div className="cp-preview-label">

                  <FaCheckCircle />

                  Image Preview

                </div>

                <div className="cp-preview-image-wrapper">

                  <img
                    src={imagePreview}
                    alt="Complaint Preview"
                    className="cp-report-preview"
                  />

                </div>

              </div>
            )}

          </section>

          {/* =================================================
              PRIVACY
          ================================================= */}

          <div className="cp-report-privacy">

            <div className="cp-privacy-icon">
              <FaShieldAlt />
            </div>

            <div>

              <strong>
                Your information is secure
              </strong>

              <span>
                Your complaint details will only be
                shared with authorized civic officials.
              </span>

            </div>

          </div>

          {/* =================================================
              SUBMIT
          ================================================= */}

          <button
            type="submit"
            className="cp-submit-complaint"
            disabled={submitting}
          >
            <FaPaperPlane />

            {submitting
              ? "Submitting Complaint..."
              : "Submit Complaint"}
          </button>

          <p className="cp-submit-note">
            By submitting this complaint, you confirm
            that the information provided is accurate.
          </p>

        </form>

      </main>

    </div>
  );
}

export default ReportComplaint;