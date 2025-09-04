// src/components/XPBar.jsx
import { useEffect, useMemo, useState } from 'react';
import { getCurrentUserId } from '../utils/auth';

function authHeaders() {
  const h = new Headers({ Accept: 'application/json' });
  const t = localStorage.getItem('token');
  if (t) h.set('Authorization', `Bearer ${t}`);
  return h;
}

export default function XPBar({ userId: userIdProp, className = '' }) {
  const userId = useMemo(() => userIdProp ?? getCurrentUserId() ?? null, [userIdProp]);

  const [state, setState] = useState({
    loading: true,
    error: null,
    level: 1,
    currentXP: 0,
    nextLevelXP: 100,
    percent: 0,
  });

  const setFromPayload = (payload) => {
    const lvl = Number(payload?.level ?? payload?.newLevel ?? 1);
    const p   = payload?.xp_progress || {};
    const currentXP   = Number(p.current ?? 0);
    const nextLevelXP = Number(p.span ?? 100);
    const percent     = Math.floor((currentXP / Math.max(1, nextLevelXP)) * 100);

    setState({
      loading: false,
      error: null,
      level: lvl,
      currentXP,
      nextLevelXP,
      percent,
    });
  };

  const fetchUser = async () => {
    if (!userId) {
      setState(s => ({ ...s, loading: false, error: 'Utilisateur non identifié' }));
      return;
    }
    setState(s => ({ ...s, loading: true, error: null }));
    try {
      const res = await fetch(`/users/${userId}`, { headers: authHeaders(), cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const u = await res.json(); // { id, xp, level, xp_progress, ... }
      setFromPayload(u);
    } catch (e) {
      setState(s => ({ ...s, loading: false, error: e.message }));
    }
  };

  useEffect(() => {
    fetchUser();

    // Se rafraîchir quand un objectif est validé
    const onXP = (ev) => {
      const data = ev?.detail;
      if (data && (data.xp_progress || typeof data.newLevel === 'number')) {
        setFromPayload(data);
      } else {
        fetchUser();
      }
    };
    window.addEventListener('xp:changed', onXP);
    return () => window.removeEventListener('xp:changed', onXP);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  if (state.loading) return null;
  if (state.error)   return <div className={className + ' text-danger'}>XP : {state.error}</div>;

  const { level, currentXP, nextLevelXP, percent } = state;

  return (
    <div className={className}>
      <div className="d-flex justify-content-between align-items-center mb-1">
        <strong>Niveau {level}</strong>
        <small>{currentXP} / {nextLevelXP} XP</small>
      </div>
      <div
        className="progress xp-progress"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin="0"
        aria-valuemax="100"
        aria-label="Barre d'expérience"
        style={{ height: 10 }}
      >
        <div className="progress-bar bg-xp" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
