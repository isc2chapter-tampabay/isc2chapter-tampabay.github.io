// Fetch events from D1 API at build time
// Falls back to static JSON if API is unavailable
const fs = require('fs');
const path = require('path');

module.exports = async function () {
  const apiUrl = process.env.API_URL;

  if (apiUrl) {
    try {
      const res = await fetch(`${apiUrl}/api/events`);
      if (res.ok) {
        const events = await res.json();
        // Map D1 column names to template field names
        return events.map(e => ({
          title: e.title,
          date: e.date,
          endDate: e.end_date || null,
          startTime: e.start_time,
          endTime: e.end_time,
          location: e.location,
          type: e.type,
          description: e.description,
          url: e.url || null
        }));
      }
    } catch (err) {
      console.warn('Failed to fetch events from API, falling back to JSON:', err.message);
    }
  }

  // Fallback: read static JSON
  const jsonPath = path.join(__dirname, 'events.json');
  if (fs.existsSync(jsonPath)) {
    return JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  }

  return [];
};
