// api/vehicle.js
// Vercel Serverless Function — proxies Fleetlog API to bypass CORS
// This runs on Vercel's server, not in the browser

export default async function handler(req, res) {
  // Allow requests from your GitHub Pages map
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // ═══════════════════════════════════════════════════
  // FLEETLOG CREDENTIALS
  // Add these in Vercel → Environment Variables (safer)
  // OR replace directly here on GitHub
  // ═══════════════════════════════════════════════════
  const TOKEN      = process.env.FLEETLOG_TOKEN      || "PASTE_YOUR_TOKEN_HERE";
  const VEHICLE_ID = process.env.FLEETLOG_VEHICLE_ID || "22538";
  // ═══════════════════════════════════════════════════

  // Try multiple Fleetlog API endpoints
  const endpoints = [
  `https://app.fleetlog.com.au/api/v2/vehicles/${VEHICLE_ID}/position`,
  `https://app.fleetlog.com.au/api/v2/vehicles/${VEHICLE_ID}`,
  `https://api.fleetlog.com.au/v2/vehicles/${VEHICLE_ID}/position`,
  `https://api.fleetlog.com.au/v2/vehicles/${VEHICLE_ID}`,
  `https://old.fleetlog.com.au/api/v2/vehicles/${VEHICLE_ID}/position`,
  `https://old.fleetlog.com.au/api/v2/vehicles/${VEHICLE_ID}`,
];

  let lastError = null;

  for (const url of endpoints) {
    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${TOKEN}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Return the data to the map
        return res.status(200).json({
          success: true,
          endpoint: url,
          data: data
        });
      } else {
        lastError = `${url} → ${response.status} ${response.statusText}`;
      }
    } catch (err) {
      lastError = `${url} → ${err.message}`;
    }
  }

  // All endpoints failed
  return res.status(502).json({
    success: false,
    error: 'All Fleetlog endpoints failed',
    lastError: lastError
  });
}
