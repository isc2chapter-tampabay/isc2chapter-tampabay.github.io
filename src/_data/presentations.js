// Fetch presentations from D1 API at build time
// Falls back to static JSON if API is unavailable
const fs = require('fs');
const path = require('path');

module.exports = async function () {
  const apiUrl = process.env.API_URL;

  if (apiUrl) {
    try {
      const res = await fetch(`${apiUrl}/api/presentations`);
      if (res.ok) {
        return res.json();
      }
    } catch (err) {
      console.warn('Failed to fetch presentations from API, falling back to JSON:', err.message);
    }
  }

  // Fallback: read static JSON
  const jsonPath = path.join(__dirname, 'presentations.json');
  if (fs.existsSync(jsonPath)) {
    return JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  }

  return [];
};
