const isPrivateHost = (host) =>
  /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)/.test(host);

const getPublicBaseUrl = (req) => {
  const fallback = `${req.protocol}://${req.get("host")}`; // Always correct for this request
  const raw = (process.env.API_BASE_URL || "").trim();
  if (!raw) return fallback;

  try {
    const u = new URL(raw);

    // If API_BASE_URL points to a private/local host but doesn't match this request host,
    // it's almost always misconfigured (causes ERR_CONNECTION_TIMED_OUT).
    const reqHost = req.get("host");
    if (isPrivateHost(u.host) && u.host !== reqHost) return fallback;

    // Strip common API path suffixes; uploads are served from `/uploads`.
    const cleanedPath = (u.pathname || "")
      .replace(/\/+$/, "")
      .replace(/\/api\/v1$/i, "")
      .replace(/\/api$/i, "");

    u.pathname = cleanedPath || "/";
    const base = u.toString().replace(/\/+$/, "");
    return base;
  } catch {
    return fallback;
  }
};

const buildUploadUrl = (req, filename) => `${getPublicBaseUrl(req)}/uploads/${filename}`;

module.exports = {
  getPublicBaseUrl,
  buildUploadUrl
};
