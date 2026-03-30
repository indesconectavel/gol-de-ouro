const TERMS_VERSION = 'v1.0';

function extractRequestIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.socket?.remoteAddress || 'unknown';
}

function buildConsentSnapshot(req, termsVersion = TERMS_VERSION) {
  return {
    accepted_terms: true,
    accepted_terms_at: new Date().toISOString(),
    accepted_terms_ip: extractRequestIp(req),
    accepted_terms_version: termsVersion,
    is_adult_confirmed: true
  };
}

function isConsentIncomplete(user) {
  return !(
    user &&
    user.accepted_terms === true &&
    user.is_adult_confirmed === true &&
    user.accepted_terms_at &&
    user.accepted_terms_version
  );
}

module.exports = {
  TERMS_VERSION,
  extractRequestIp,
  buildConsentSnapshot,
  isConsentIncomplete
};
