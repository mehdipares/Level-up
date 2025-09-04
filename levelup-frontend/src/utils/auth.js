// Décodage base64url sûr (JWT payload)
function base64UrlDecode(str) {
  try {
    const pad = '='.repeat((4 - (str.length % 4)) % 4);
    const b64 = (str + pad).replace(/-/g, '+').replace(/_/g, '/');
    return atob(b64);
  } catch {
    return '';
  }
}

export function decodeJWT(token) {
  if (!token || typeof token !== 'string' || token.split('.').length < 2) return null;
  try {
    const payload = token.split('.')[1];
    return JSON.parse(base64UrlDecode(payload));
  } catch {
    return null;
  }
}

export function getCurrentUserId() {
  // 1) localStorage.user
  try {
    const u = JSON.parse(localStorage.getItem('user') || 'null');
    if (u?.id) return u.id;
  } catch {}
  // 2) token JWT
  const token = localStorage.getItem('token');
  const payload = decodeJWT(token);
  return payload?.id ?? payload?.userId ?? payload?.sub ?? null;
}
