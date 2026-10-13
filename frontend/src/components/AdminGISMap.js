
import React, { useMemo, useState } from "react";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  ZoomControl,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "./AdminGISMap.css";

const DEFAULT_CENTER = [19.2183, 72.9781]; // Bhiwandi region

function AdminGISMap({ hotspots = [] }) {
  const [selectedCategory, setSelectedCategory] = useState("All");

  const validHotspots = useMemo(() => {
    return (Array.isArray(hotspots) ? hotspots : [])
      .map((item) => ({
        ...item,
        lat: Number(item.lat ?? item.latitude ?? item.lat_bucket),
        lng: Number(
          item.lng ?? item.longitude ?? item.lng_bucket
        ),
        count: Number(item.count) || 0,
      }))
      .filter(
        (item) =>
          Number.isFinite(item.lat) &&
          Number.isFinite(item.lng) &&
          Math.abs(item.lat) <= 90 &&
          Math.abs(item.lng) <= 180
      );
  }, [hotspots]);

  const categories = useMemo(
    () => [
      "All",
      ...new Set(
        validHotspots
          .map((item) => item.category)
          .filter(Boolean)
      ),
    ],
    [validHotspots]
  );

  const filteredHotspots = validHotspots.filter(
    (item) =>
      selectedCategory === "All" ||
      item.category === selectedCategory
  );

  const getColor = (count) => {
    if (count >= 10) return "#dc2626";
    if (count >= 5) return "#f59e0b";
    return "#2563eb";
  };

  const totalComplaints = filteredHotspots.reduce(
    (sum, item) => sum + item.count,
    0
  );

  return (
    <section className="admin-gis-card">
      <div className="admin-gis-header">
        <div>
          <span className="admin-gis-eyebrow">
            GEOGRAPHIC INFORMATION SYSTEM
          </span>
          <h2>GIS Complaint Hotspot Map</h2>
          <p>
            Explore complaint clusters and identify areas
            requiring municipal attention.
          </p>
        </div>

        <div className="admin-gis-filter">
          <label htmlFor="gis-category">Category</label>
          <select
            id="gis-category"
            value={selectedCategory}
            onChange={(event) =>
              setSelectedCategory(event.target.value)
            }
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="admin-gis-summary">
        <div>
          <span>Mapped clusters</span>
          <strong>{filteredHotspots.length}</strong>
        </div>
        <div>
          <span>Complaints in clusters</span>
          <strong>{totalComplaints}</strong>
        </div>
      </div>

      <div className="admin-gis-map">
        <MapContainer
          center={DEFAULT_CENTER}
          zoom={11}
          scrollWheelZoom
          zoomControl={false}
          className="admin-gis-leaflet"
        >
          <ZoomControl position="bottomright" />

          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {filteredHotspots.map((item, index) => {
            const color = getColor(item.count);

            return (
              <CircleMarker
                key={`${item.category}-${item.lat}-${item.lng}-${index}`}
                center={[item.lat, item.lng]}
                radius={Math.min(
                  22,
                  Math.max(7, 5 + item.count * 1.2)
                )}
                pathOptions={{
                  color,
                  fillColor: color,
                  fillOpacity: 0.48,
                  weight: 2,
                }}
              >
                <Popup>
                  <div className="admin-gis-popup">
                    <strong>{item.category || "Civic complaint"}</strong>
                    <p>
                      Complaints: <b>{item.count}</b>
                    </p>
                    <p>
                      Latitude: {item.lat.toFixed(5)}
                    </p>
                    <p>
                      Longitude: {item.lng.toFixed(5)}
                    </p>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>

        {filteredHotspots.length === 0 && (
          <div className="admin-gis-empty">
            <strong>No mappable hotspots found</strong>
            <p>
              Check whether the hotspot API returns numeric
              latitude and longitude values.
            </p>
          </div>
        )}
      </div>

      <div className="admin-gis-legend">
        <span>
          <i className="gis-dot high" /> High density (10+)
        </span>
        <span>
          <i className="gis-dot medium" /> Medium density (5–9)
        </span>
        <span>
          <i className="gis-dot low" /> Low density (1–4)
        </span>
      </div>

      <p className="admin-gis-note">
        Hotspot levels use complaint counts per returned cluster.
        Adjust the thresholds to match your municipal data.
      </p>
    </section>
  );
}

export default AdminGISMap;
