// src/components/UserPrioritiesCard.jsx
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getCurrentUserId } from '../../utils/auth';
import API_BASE from '../../config/api'; // 👈 base URL API

/** Headers with Accept + Authorization (if token) */
function authHeaders() {
  const h = new Headers({ Accept: 'application/json' });
  const t = localStorage.getItem('token');
  if (t) h.set('Authorization', `Bearer ${t}`);
  return h;
}

/** Skeleton row while loading (light bars on purple bg) */
function SkeletonRow() {
  return (
    <li className="mb-3">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <div style={{ width: 160, height: 12, borderRadius: 6, background: 'rgba(255,255,255,.25)' }} />
        <div style={{ width: 40, height: 12, borderRadius: 6, background: 'rgba(255,255,255,.25)' }} />
      </div>
      <div className="progress" aria-hidden="true" style={{ height: 10, background: 'rgba(255,255,255,.2)', borderRadius: 999 }}>
        <div className="progress-bar" style={{ width: '30%', background: 'rgba(255,255,255,.9)', borderRadius: 999 }} />
      </div>
    </li>
  );
}

/**
 * Card "Mes priorités"
 * - GET /users/:id/priorities  +  GET /users/:id
 */
export default function UserPrioritiesCard({
  userId: userIdProp,
  className = '',
  manageTo = '/Priorities',
  max = 3
}) {
  const userId = useMemo(() => userIdProp ?? getCurrentUserId() ?? null, [userIdProp]);

  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [priorities, setPriorities] = useState([]); // [{category_id, category_name, score}]
  const [onboardingDone, setOnboardingDone] = useState(false);

  const load = async () => {
    if (!userId) {
      setLoading(false);
      setError('Utilisateur non identifié');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [priRes, userRes] = await Promise.all([
        fetch(`${API_BASE}/users/${userId}/priorities`, { headers: authHeaders(), cache: 'no-store' }), // 👈
        fetch(`${API_BASE}/users/${userId}`,            { headers: authHeaders(), cache: 'no-store' })  // 👈
      ]);
      if (!priRes.ok)  throw new Error(await priRes.text());
      if (!userRes.ok) throw new Error(await userRes.text());

      const priData  = await priRes.json();
      const userData = await userRes.json();

      const list = Array.isArray(priData) ? priData : (priData.rows || priData.data || []);
      const normalized = list
        .map(r => ({
          category_id: Number(r.category_id ?? r.Category?.id ?? 0),
          category_name: r.Category?.name ?? r.category_name ?? `Catégorie ${r.category_id}`,
          score: Number(r.score ?? 0),
        }))
        .sort((a, b) => b.score - a.score);

      setPriorities(normalized);
      setOnboardingDone(!!userData.onboarding_done);
      setLoading(false);
    } catch (e) {
      setError(e.message || 'Erreur de chargement');
      setLoading(false);
    }
  };

  useEffect(() => {
    let alive = true;
    (async () => { if (alive) await load(); })();
    const refresh = () => { if (alive) load(); };
    window.addEventListener('priorities:changed', refresh);
    return () => { alive = false; window.removeEventListener('priorities:changed', refresh); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const top = priorities.slice(0, Math.max(1, max));

  return (
    <div
      className={className}
      style={{
        background: 'linear-gradient(135deg, #6d28d9 0%, #7c3aed 100%)',
        borderRadius: 16,
        boxShadow: '0 6px 22px rgba(110, 60, 200, .25)',
        color: '#fff',
        padding: 16,
      }}
    >
      {/* En-tête minimaliste */}
      <div className="d-flex justify-content-between align-items-center mb-2">
        <h5 className="m-0" style={{ fontWeight: 800 }}>Mes priorités</h5>
      </div>

      {/* Erreur */}
      {!loading && error && (
        <div className="alert alert-warning py-2 px-3 mb-3" style={{ background: 'rgba(255,255,255,.15)', color: '#fff', border: 'none' }}>
          {String(error)}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <ul className="list-unstyled mb-0">
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
        </ul>
      )}

      {/* Onboarding pas fait */}
      {!loading && !error && (!onboardingDone || priorities.length === 0) && (
        <div className="d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between gap-3">
          <div className="text-white-75">
            Tu n’as pas encore défini tes priorités. Réponds au questionnaire pour booster tes gains d’XP
            <span className="opacity-100"> (+50% sur la #1, +25% sur la #2).</span>
          </div>
          <Link
            className="btn btn-light"
            to="/Onboarding"
            style={{ borderRadius: 999, fontWeight: 700 }}
          >
            Compléter mon questionnaire
          </Link>
        </div>
      )}

      {/* Liste top 3 */}
      {!loading && !error && onboardingDone && priorities.length > 0 && (
        <>
          <ul className="list-unstyled d-flex flex-column gap-3 mb-0">
            {top.map((row, idx) => {
              const pct = Math.max(0, Math.min(100, Math.round(row.score)));
              const bonus = idx === 0 ? '+50% XP' : idx === 1 ? '+25% XP' : '—';

              const badgeStyle = {
                border: '1px solid rgba(255,255,255,.7)',
                color: '#fff',
                background: 'transparent',
                fontWeight: 700,
              };

              return (
                <li key={`${row.category_id}-${idx}`}>
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <div
                      title={row.category_name}
                      style={{
                        fontWeight: 700,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        maxWidth: '75%',
                      }}
                    >
                      #{idx + 1} — {row.category_name}
                    </div>
                    <span className="badge" style={badgeStyle}>{bonus}</span>
                  </div>

                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <small className="text-white-75">Score</small>
                    <small className="text-white-75" style={{ fontVariantNumeric: 'tabular-nums' }}>
                      {pct}%
                    </small>
                  </div>

                  <div
                    className="progress"
                    role="progressbar"
                    aria-valuenow={pct}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`Priorité ${row.category_name} à ${pct}%`}
                    style={{ height: 10, background: 'rgba(255,255,255,.2)', borderRadius: 999 }}
                  >
                    <div
                      className="progress-bar"
                      style={{ width: `${pct}%`, background: 'rgba(255,255,255,.9)', borderRadius: 999 }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>

          {/* CTA bas de carte */}
          <div className="mt-3 d-flex">
            <Link
              to={manageTo}
              className="btn btn-light w-100"
              style={{ borderRadius: 999, fontWeight: 700 }}
              title="Modifier mes priorités"
            >
              Gérer mes priorités
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
