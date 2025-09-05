// src/pages/Profile.jsx
import { useEffect, useMemo, useState } from 'react';
import Navbar from '../components/Navbar';
import XPBar from '../components/XPBar';
import { getCurrentUserId } from '../utils/auth';

function authHeaders() {
  const h = new Headers({ Accept: 'application/json', 'Content-Type': 'application/json' });
  const t = localStorage.getItem('token');
  if (t) h.set('Authorization', `Bearer ${t}`);
  return h;
}

export default function Profile() {
  const userId = useMemo(() => getCurrentUserId() ?? null, []);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  // Form state (account)
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');

  // Prefs locales (pas besoin de back pour commencer)
  const [theme, setTheme] = useState(() => localStorage.getItem('pref:theme') || 'system'); // light|dark|system
  const [defaultCadence, setDefaultCadence] = useState(() => localStorage.getItem('pref:cadence') || 'daily'); // daily|weekly

  const fetchJSON = async (url, init) => {
    const res = await fetch(url, { ...init, headers: authHeaders() });
    if (!res.ok) {
      let message = `HTTP ${res.status}`;
      try { message = (await res.json())?.error || (await res.text()) || message; } catch {}
      throw new Error(message);
    }
    try { return await res.json(); } catch { return null; }
  };

  const loadMe = async () => {
    if (!userId) {
      setErr('Utilisateur non identifié');
      setLoading(false);
      return;
    }
    setLoading(true);
    setErr(null);
    try {
      const me = await fetchJSON(`/users/${userId}`, { cache: 'no-store' });
      setUser(me);
      setUsername(me?.username || '');
      setEmail(me?.email || '');
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadMe(); /* eslint-disable-next-line */ }, []);

  const saveAccount = async (e) => {
    e.preventDefault();
    if (!userId) return;
    try {
      const payload = { username: username.trim(), email: email.trim() };
      await fetchJSON(`/users/${userId}`, { method: 'PATCH', body: JSON.stringify(payload) });
      await loadMe();
      alert('Profil mis à jour ✅');
    } catch (e) {
      alert(e.message || 'Erreur sauvegarde profil');
    }
  };

  const savePrefs = () => {
    localStorage.setItem('pref:theme', theme);
    localStorage.setItem('pref:cadence', defaultCadence);
    alert('Préférences enregistrées ✅');
  };

  const logout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  const initial = (user?.username || user?.email || 'U').trim().charAt(0).toUpperCase();

  return (
    <div className="DashBoard">
      <Navbar />
      <div className="container py-3">

        {/* HEADER bleu avec avatar + XP */}
        <div
          className="p-3 p-sm-4 mb-3 d-flex flex-column gap-3"
          style={{
            background: 'linear-gradient(180deg, #2563eb, #1e40af)',
            color: '#fff',
            borderRadius: 24,
            boxShadow: '0 12px 30px rgba(37,99,235,.25)'
          }}
        >
          <div className="d-flex align-items-center gap-3">
            <div
              aria-hidden
              className="d-flex align-items-center justify-content-center"
              style={{
                width: 72, height: 72, borderRadius: '50%',
                background: 'rgba(255,255,255,.15)',
                border: '2px solid rgba(255,255,255,.35)',
                fontSize: 28, fontWeight: 900, color: '#fff'
              }}
              title={user?.username || user?.email}
            >
              {initial}
            </div>
            <div className="flex-grow-1">
              <h1 className="m-0" style={{ fontWeight: 900, fontSize: 24, color: '#F8FAFC' }}>
                Mon profil
              </h1>
              <div className="opacity-90">
                {user?.email || (loading ? 'Chargement…' : '—')}
              </div>
            </div>
          </div>

          {/* Barre d'XP */}
          {userId && (
            <XPBar userId={userId} className="mt-1" />
          )}
        </div>

        {/* Erreur globale */}
        {err && <div className="alert alert-danger">{err}</div>}

        {/* INFOS DU COMPTE */}
        <div className="card border-0 shadow-sm mb-3" style={{ borderRadius: 18 }}>
          <div className="card-body">
            <h2 className="h5 mb-3" style={{ fontWeight: 800 }}>Infos du compte</h2>
            <form onSubmit={saveAccount} className="row g-3">
              <div className="col-12 col-md-6">
                <label className="form-label">Nom d’utilisateur</label>
                <input
                  className="form-control"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Ton pseudo"
                  required
                  style={{ borderRadius: 12 }}
                  disabled={loading}
                />
              </div>
              <div className="col-12 col-md-6">
                <label className="form-label">Email</label>
                <input
                  className="form-control"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ton@email.com"
                  required
                  style={{ borderRadius: 12 }}
                  disabled={loading}
                />
              </div>

              <div className="col-12 d-flex gap-2">
                <button className="btn btn-primary" type="submit" disabled={loading} style={{ borderRadius: 12 }}>
                  Sauvegarder
                </button>
                <button
                  className="btn btn-outline-secondary"
                  type="button"
                  onClick={() => { setUsername(user?.username || ''); setEmail(user?.email || ''); }}
                  disabled={loading}
                  style={{ borderRadius: 12 }}
                >
                  Réinitialiser
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* PRÉFÉRENCES LOCALES */}
        <div className="card border-0 shadow-sm mb-3" style={{ borderRadius: 18 }}>
          <div className="card-body">
            <h2 className="h5 mb-3" style={{ fontWeight: 800 }}>Préférences</h2>
            <div className="row g-3">
              <div className="col-12 col-md-6">
                <label className="form-label">Thème</label>
                <select
                  className="form-select"
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  style={{ borderRadius: 12 }}
                >
                  <option value="system">Système</option>
                  <option value="light">Clair</option>
                  <option value="dark">Sombre</option>
                </select>
                <div className="form-text">Sauvegardé localement.</div>
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label">Cadence par défaut</label>
                <select
                  className="form-select"
                  value={defaultCadence}
                  onChange={(e) => setDefaultCadence(e.target.value)}
                  style={{ borderRadius: 12 }}
                >
                  <option value="daily">Quotidien</option>
                  <option value="weekly">1× / semaine</option>
                </select>
                <div className="form-text">Utilisé quand tu ajoutes rapidement un objectif depuis le catalogue.</div>
              </div>

              <div className="col-12">
                <button className="btn btn-outline-primary" onClick={savePrefs} style={{ borderRadius: 12 }}>
                  Enregistrer les préférences
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* DANGER / DÉCONNEXION */}
        <div className="card border-0 shadow-sm" style={{ borderRadius: 18 }}>
          <div className="card-body">
            <h2 className="h5 mb-3" style={{ fontWeight: 800 }}>Sécurité</h2>
            <div className="d-flex flex-wrap gap-2">
              <button className="btn btn-outline-danger" onClick={logout} style={{ borderRadius: 12 }}>
                Se déconnecter
              </button>
              {/* Si tu ajoutes une route de changement de mot de passe :
              <button className="btn btn-outline-secondary" onClick={openPwdModal} style={{ borderRadius: 12 }}>
                Changer de mot de passe
              </button> */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
