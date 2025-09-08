// src/config/api.js
const API_BASE =
  process.env.REACT_APP_API_URL || // prod (Render) / local si .env
  'http://localhost:10000';        // fallback local si ton back écoute sur 10000

export default API_BASE;
