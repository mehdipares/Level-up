// src/hooks/useOnboardingGuard.js
import { useEffect, useMemo, useState } from 'react';
import { getCurrentUserId } from '../utils/auth';

function authHeaders() {
  const h = new Headers({ Accept: 'application/json' });
  const t = localStorage.getItem('token');
  if (t) h.set('Authorization', `Bearer ${t}`);
  return h;
}

export default function useOnboardingGuard() {
  const userId = useMemo(() => getCurrentUserId() ?? null, []);
  const [state, setState] = useState({
    loading: true,
    authenticated: !!userId,
    onboardingDone: true,
    error: null,
  });

  useEffect(() => {
    let alive = true;

    const run = async () => {
      if (!userId) {
        if (alive) setState(s => ({ ...s, loading: false, authenticated: false, onboardingDone: true }));
        return;
      }
      try {
        const res = await fetch(`/users/${userId}`, { headers: authHeaders(), cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const u = await res.json();
        // On tolère les anciens back qui ne renvoient pas onboarding_done → on le considère "false" (pour forcer l’onboarding)
        const onboardingDone = typeof u.onboarding_done === 'boolean' ? u.onboarding_done : false;
        if (alive) setState({ loading: false, authenticated: true, onboardingDone, error: null });
      } catch (e) {
        if (alive) setState({ loading: false, authenticated: true, onboardingDone: true, error: e.message });
      }
    };

    run();
    return () => { alive = false; };
  }, [userId]);

  return state; // { loading, authenticated, onboardingDone, error }
}
