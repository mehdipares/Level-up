// src/components/XPBar.jsx
import { useEffect, useMemo, useRef, useState } from 'react';
import { getCurrentUserId } from '../utils/auth';
import '../styles/XP/xp-bar.css'; // garde ton CSS actuel

function authHeaders() {
  const h = new Headers({ Accept: 'application/json' });
  const t = localStorage.getItem('token');
  if (t) h.set('Authorization', `Bearer ${t}`);
  return h;
}

// easing bien fluide
const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export default function XPBar({ userId: userIdProp, className = '' }) {
  const userId = useMemo(() => userIdProp ?? getCurrentUserId() ?? null, [userIdProp]);

  const [state, setState] = useState({
    loading: true,
    error: null,
    level: 1,
    currentXP: 0,
    nextLevelXP: 100,
    percent: 0, // cible logique (serveur)
  });

  // pour l’UI : % affiché, animé par rAF (pas par CSS)
  const [uiPercent, setUiPercent] = useState(0);

  // refs pour détection level-up / animations
  const prevRef = useRef({ level: 1, percent: 0, currentXP: 0, nextLevelXP: 100 });
  const rafRef = useRef(0);

  // tween générique
  const tweenTo = (from, to, dur = 650, onDone) => {
    cancelAnimationFrame(rafRef.current);
    let start = 0;
    const step = (ts) => {
      if (!start) start = ts;
      const t = Math.min((ts - start) / dur, 1);
      const v = from + (to - from) * easeInOutCubic(t);
      setUiPercent(v);
      if (t < 1) rafRef.current = requestAnimationFrame(step);
      else onDone?.();
    };
    rafRef.current = requestAnimationFrame(step);
  };

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  const applyPayload = (payload) => {
    const lvl = Number(payload?.level ?? payload?.newLevel ?? 1);
    const p = payload?.xp_progress || {};
    const currentXP = Number(p.current ?? 0);
    const span = Number(p.span ?? 100);
    const nextPercent = Math.floor((currentXP / Math.max(1, span)) * 100);

    const prev = prevRef.current;
    const leveledUp = lvl > (prev.level || 1);

    setState({
      loading: false,
      error: null,
      level: lvl,
      currentXP,
      nextLevelXP: span,
      percent: nextPercent,
    });

    // --- animation lissée ---
    if (leveledUp || nextPercent < uiPercent) {
      // Level up / rollover : A) vers 100%, B) reset → 0, C) vers le nouveau %
      tweenTo(uiPercent, 100, 500, () => {
        // reset instant sans CSS transition (on anime côté JS)
        setUiPercent(0);
        // micro délai pour laisse React appliquer 0%, puis on repart
        setTimeout(() => tweenTo(0, nextPercent, 650), 16);
      });
    } else {
      // Gain simple
      tweenTo(uiPercent, nextPercent, 650);
    }

    prevRef.current = { level: lvl, percent: nextPercent, currentXP, nextLevelXP: span };
  };

  const fetchUser = async () => {
    if (!userId) {
      setState((s) => ({ ...s, loading: false, error: 'Utilisateur non identifié' }));
      return;
    }
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const res = await fetch(`/users/${userId}`, { headers: authHeaders(), cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const u = await res.json();
      applyPayload(u);
    } catch (e) {
      setState((s) => ({ ...s, loading: false, error: e.message }));
    }
  };

  useEffect(() => {
    fetchUser();
    const onXP = (ev) => {
      const data = ev?.detail;
      if (data && (data.xp_progress || typeof data.newLevel === 'number' || typeof data.level === 'number')) {
        applyPayload(data);
      } else {
        fetchUser();
      }
    };
    window.addEventListener('xp:changed', onXP);
    return () => window.removeEventListener('xp:changed', onXP);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  if (state.loading) return null;
  if (state.error) return <div className={className + ' text-danger'}>XP : {state.error}</div>;

  const { level, currentXP, nextLevelXP } = state;

  return (
    <div className={className}>
      <div className="d-flex justify-content-between align-items-center mb-1">
        <strong>Niveau {level}</strong>
        <small>{currentXP} / {nextLevelXP} XP</small>
      </div>
      <div
        className="progress xp-progress"
        role="progressbar"
        aria-valuenow={Math.round(uiPercent)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Barre d'expérience"
        style={{ height: 10 }}
      >
        {/* pas de transition CSS : on anime par JS */}
        <div className="progress-bar bg-xp no-trans" style={{ width: `${uiPercent}%` }} />
      </div>
    </div>
  );
}
