import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import en from "../translations/en";
import hi from "../translations/hi";
import mr from "../translations/mr";

const AppSettingsContext = createContext(null);

export function AppSettingsProvider({ children }) {
  // ==================================================
  // DARK MODE
  // ==================================================

  const [darkMode, setDarkMode] = useState(() => {
    const savedValue = localStorage.getItem("civicpulse-dark-mode");
    return savedValue ? JSON.parse(savedValue) : false;
  });

  // ==================================================
  // LANGUAGE
  // ==================================================

  const [language, setLanguage] = useState(() => {
    return localStorage.getItem("civicpulse-language") || "English";
  });

  // ==================================================
  // TRANSLATIONS
  // ==================================================

  const translations = {
    English: en,
    Hindi: hi,
    Marathi: mr,
  };

  // ==================================================
  // TRANSLATION FUNCTION
  // ==================================================

  const t = (key) => {
    return (
      translations[language]?.[key] ||
      translations.English?.[key] ||
      key
    );
  };

  // ==================================================
  // SAVE DARK MODE
  // ==================================================

  useEffect(() => {
    localStorage.setItem(
      "civicpulse-dark-mode",
      JSON.stringify(darkMode)
    );

    document.body.classList.toggle(
      "dark-theme",
      darkMode
    );
  }, [darkMode]);

  // ==================================================
  // SAVE LANGUAGE
  // ==================================================

  useEffect(() => {
    localStorage.setItem(
      "civicpulse-language",
      language
    );
  }, [language]);

  // ==================================================
  // TOGGLE DARK MODE
  // ==================================================

  const toggleDarkMode = () => {
    setDarkMode((prev) => !prev);
  };

  // ==================================================
  // GLOBAL SETTINGS VALUE
  // ==================================================

  const value = {
    darkMode,
    setDarkMode,
    toggleDarkMode,

    language,
    setLanguage,

    t,
  };

  return (
    <AppSettingsContext.Provider value={value}>
      {children}
    </AppSettingsContext.Provider>
  );
}

// ==================================================
// USE APP SETTINGS
// ==================================================

export function useAppSettings() {
  const context = useContext(AppSettingsContext);

  if (context === null) {
    throw new Error(
      "useAppSettings must be used inside AppSettingsProvider"
    );
  }

  return context;
}

// ==================================================
// TOP UTILITY BAR
// ==================================================

function TopUtilityBar() {
  const {
    darkMode,
    toggleDarkMode,
    language,
    setLanguage,
  } = useAppSettings();

  return (
    <div className="top-utility-bar">
      <div className="top-utility-inner">

        <div className="top-utility-controls">

          {/* DARK MODE */}

          <button
            type="button"
            onClick={toggleDarkMode}
            aria-label="Toggle dark mode"
            className="top-utility-theme"
          >
            {darkMode ? "☀️" : "🌙"}
          </button>

          {/* LANGUAGE */}

          <select
            value={language}
            onChange={(e) =>
              setLanguage(e.target.value)
            }
            className="top-utility-select"
          >
            <option value="English">
              English
            </option>

            <option value="Hindi">
              हिंदी
            </option>

            <option value="Marathi">
              मराठी
            </option>
          </select>

        </div>

      </div>
    </div>
  );
}

export default TopUtilityBar;