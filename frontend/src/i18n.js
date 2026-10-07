import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
  en: {
    translation: {
      home: "Home",
      about: "About",
      contact: "Contact",
      faqs: "FAQs/HELP",
      login: "Login",
      register: "Register",

      heroTitle: "Together for a",
      heroHighlight: "Better City",
      heroDescription:
        "Report civic issues, track progress, and help us build a cleaner, safer and smarter city.",

      reportIssue: "Report an Issue",

      report: "Report",
      reportDescription:
        "Easily report civic issues in your locality.",

      notify: "Get Notified",
      notifyDescription:
        "Receive updates and notifications about your complaints.",

      impact: "Make Impact",
      impactDescription:
        "Together, let's build a cleaner and better city.",

      aboutTitle: "About CivicPulseAI",
      aboutDescription:
        "CivicPulseAI is a smart public grievance management platform that connects citizens, officers and administrators to improve civic issue reporting and resolution.",

      contactTitle: "Have a Civic Issue?",
      contactDescription:
        "Report it and help make your city better.",

      tagline: "Smart City. Smart Solutions.",
      copyright: "© 2026 CivicPulseAI. All rights reserved."
    }
  },

  hi: {
    translation: {
      home: "होम",
      about: "हमारे बारे में",
      contact: "संपर्क",
      faqs: "अक्सर पूछे जाने वाले प्रश्न",
      login: "लॉगिन",
      register: "रजिस्टर",

      heroTitle: "एक साथ मिलकर",
      heroHighlight: "बेहतर शहर",
      heroDescription:
        "नागरिक समस्याओं की रिपोर्ट करें, उनकी प्रगति देखें और एक स्वच्छ, सुरक्षित और स्मार्ट शहर बनाने में मदद करें।",

      reportIssue: "समस्या की रिपोर्ट करें",

      report: "रिपोर्ट करें",
      reportDescription:
        "अपने क्षेत्र की नागरिक समस्याओं की आसानी से रिपोर्ट करें।",

      notify: "सूचना प्राप्त करें",
      notifyDescription:
        "अपनी शिकायतों से संबंधित अपडेट और सूचनाएं प्राप्त करें।",

      impact: "बदलाव लाएं",
      impactDescription:
        "आइए मिलकर एक स्वच्छ और बेहतर शहर बनाएं।",

      aboutTitle: "CivicPulseAI के बारे में",
      aboutDescription:
        "CivicPulseAI एक स्मार्ट सार्वजनिक शिकायत प्रबंधन प्लेटफॉर्म है जो नागरिकों, अधिकारियों और प्रशासकों को जोड़कर नागरिक समस्याओं की रिपोर्टिंग और समाधान को बेहतर बनाता है।",

      contactTitle: "क्या आपके पास नागरिक समस्या है?",
      contactDescription:
        "रिपोर्ट करें और अपने शहर को बेहतर बनाने में मदद करें।",

      tagline: "स्मार्ट सिटी। स्मार्ट समाधान।",
      copyright: "© 2026 CivicPulseAI. सर्वाधिकार सुरक्षित।"
    }
  },

  mr: {
    translation: {
      home: "मुख्यपृष्ठ",
      about: "आमच्याबद्दल",
      contact: "संपर्क",
      faqs: "वारंवार विचारले जाणारे प्रश्न",
      login: "लॉगिन",
      register: "नोंदणी",

      heroTitle: "एकत्र येऊन",
      heroHighlight: "चांगले शहर",
      heroDescription:
        "नागरी समस्यांची तक्रार करा, त्यांच्या प्रगतीचा मागोवा घ्या आणि स्वच्छ, सुरक्षित व स्मार्ट शहर उभारण्यात मदत करा.",

      reportIssue: "समस्येची तक्रार करा",

      report: "तक्रार करा",
      reportDescription:
        "तुमच्या परिसरातील नागरी समस्यांची सहजपणे तक्रार करा.",

      notify: "सूचना मिळवा",
      notifyDescription:
        "तुमच्या तक्रारींबाबत अपडेट्स आणि सूचना मिळवा.",

      impact: "बदल घडवा",
      impactDescription:
        "चला, मिळून एक स्वच्छ आणि चांगले शहर बनवूया.",

      aboutTitle: "CivicPulseAI बद्दल",
      aboutDescription:
        "CivicPulseAI हे एक स्मार्ट सार्वजनिक तक्रार व्यवस्थापन प्लॅटफॉर्म आहे जे नागरिक, अधिकारी आणि प्रशासकांना जोडून नागरी समस्यांची नोंद आणि निराकरण अधिक प्रभावी बनवते.",

      contactTitle: "तुमच्याकडे नागरी समस्या आहे का?",
      contactDescription:
        "तक्रार करा आणि तुमचे शहर अधिक चांगले बनविण्यात मदत करा.",

      tagline: "स्मार्ट सिटी. स्मार्ट सोल्युशन्स.",
      copyright: "© 2026 CivicPulseAI. सर्व हक्क राखीव."
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: "en",
    fallbackLng: "en",
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;