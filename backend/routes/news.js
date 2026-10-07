const express = require("express");
const axios = require("axios");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const response = await axios.get("https://gnews.io/api/v4/search", {
      params: {
      q: "pothole OR garbage OR drainage OR sewage OR \"water supply\" OR \"street lights\"",
        lang: "en",
        country: "in",
        max: 10,
        apikey: process.env.GNEWS_API_KEY,
      },
    });

    const articles = response.data.articles || [];

    const news = articles.map((article, index) => ({
      id: index + 1,
      title: article.title,
      description: article.description,
      image: article.image,
      url: article.url,
      source: article.source?.name || "GNews",
    }));

    res.status(200).json({
      success: true,
      news,
    });
  } catch (error) {
    console.error(
      "GNews API Error:",
      error.response?.data || error.message
    );

    res.status(500).json({
      success: false,
      message: "Unable to fetch latest news.",
    });
  }
});

module.exports = router;