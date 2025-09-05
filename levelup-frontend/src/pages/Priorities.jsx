// src/pages/Priorities.jsx
import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '../components/Navbar';
import { getCurrentUserId } from '../utils/auth';
import '../styles/Priorities/priorities.css';

function authHeaders() {
  const h = new Headers({ Accept: 'application/json', 'Content-Type': 'application/json' });
  const t = localStorage.getItem('token');
  if (t) h.set('Authorization', `Bearer ${t}`);
  return h;
}

export default function Priorities() {
  const userId = useMemo(() => getCurrentUserId() ?? null, []);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);

  const [orderedCats, setOrderedCats] = useState([]);
  const [flash, setFlash] = useState({ id: null, dir: null });

  const fetchJSON = async (url, init) => {
    const res = await fetch(url, { ...init, headers: authHeaders() });
    if (!res.ok) {
      let message = `HTTP ${res.status}`;
      try { message = (await res.json())?.error || (await res.text()) || message; } catch {}
      throw new Error(message);
    }
    try { return await res.json(); } catch { return null; }
  };

  const loadAll = async () => {
    if (!userId) { setErr('Utilisateur non identifié'); setLoading(false); return; }
    setErr(null); setLoading(true);
    try {
      const [cats, prefs] = await Promise.all([
        fetchJSON('/categories', { cache: 'no-store' }),
        fetchJSON(`/users/${userId}/priorities`, { cache: 'no-store' }),
      ]);

      const catList = Array.isArray(cats) ? cats : (cats?.rows || cats?.data || []);
      const prefList = Array.isArray(prefs) ? prefs : (prefs?.rows || prefs?.data || []);

      const scoreByCat = {};
      for (const p of prefList) {
        const cid = Number(p.category_id ?? p.Category?.id ?? p.id);
        const score = Number(p.score ?? 0);
        if (cid) scoreByCat[cid] = score;
      }

      const merged = catList.map(c => ({
        id: Number(c.id),
        name: c.name || 'Sans nom',
        score: scoreByCat[Number(c.id)],
      }));

      merged.sort((a, b) => {
        const aHas = Number.isFinite(a.score);
        const bHas = Number.isFinite(b.score);
        if (aHas && bHas) return b.score - a.score;
        if (aHas && !bHas) return -1;
        if (!aHas && bHas) return 1;
        return (a.name || '').localeCompare(b.name || '');
      });

      setOrderedCats(merged);
    } catch (e) {
      setErr(e.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); /* eslint-disable-next-line */ }, []);

  const flashRow = (id, dir) => {
    setFlash({ id, dir });
    setTimeout(() => setFlash({ id: null, dir: null }), 650);
  };

  const move = (index, dir) => {
    setOrderedCats(prev => {
      const next = [...prev];
      const j = index + dir;
      if (j < 0 || j >= next.length) return prev;
      const movedId = next[index].id;
      [next[index], next[j]] = [next[j], next[index]];
      flashRow(movedId, dir < 0 ? 'up' : 'down');
      return next;
    });
  };

  const moveTop = (index) => {
    setOrderedCats(prev => {
      if (index <= 0) return prev;
      const next = [...prev];
      const [item] = next.splice(index, 1);
      next.unshift(item);
      flashRow(item.id, 'up');
      return next;
    });
  };

  const moveBottom = (index) => {
    setOrderedCats(prev => {
      if (index >= prev.length - 1) return prev;
      const next = [...prev];
      const [item] = next.splice(index, 1);
      next.push(item);
      flashRow(item.id, 'down');
      return next;
    });
  };

  const saveOrder = async () => {
    if (!userId) return alert('Utilisateur non identifié');
    if (!orderedCats.length) return alert('Rien à enregistrer');

    setSaving(true);
    try {
      const body = { ordered_category_ids: orderedCats.map(c => c.id) };
      await fetchJSON(`/users/${userId}/priorities/order`, {
        method: 'PUT',
        body: JSON.stringify(body),
      });
      alert('Priorités mises à jour ✅');
      window.dispatchEvent(new Event('priorities:changed'));
      await loadAll();
    } catch (e) {
      alert(e.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="DashBoard prio-root">
      <Navbar />
      <div className="container py-3">

        {/* HERO */}
        <div className="p-3 p-sm-4 mb-3 prio-hero">
          <h1 className="m-0">Mes priorités</h1>
          <div className="sub mt-1">
            Classe les catégories par importance. Les 2 premières donnent un bonus d’XP (+50% / +25%).
          </div>
          <div className="mt-3 actions d-flex flex-wrap gap-2">
            <button
              className="btn btn-soft btn-sm"
              onClick={loadAll}
              disabled={loading || saving}
            >
              {loading ? 'Chargement…' : 'Recharger'}
            </button>
            <button
              className="btn btn-save btn-sm"
              onClick={saveOrder}
              disabled={loading || saving || !orderedCats.length}
            >
              {saving ? 'Enregistrement…' : 'Enregistrer l’ordre'}
            </button>
          </div>
        </div>

        {err && <div className="alert alert-danger">{err}</div>}

        {/* CARD LIST */}
        <div className="card prio-card">
          <div className="card-body">
            <h2 className="h5 mb-3" style={{ fontWeight: 800 }}>Ordre des catégories</h2>

            {loading && (
              <div className="prio-skel">
                <div className="row"></div>
                <div className="row"></div>
                <div className="row"></div>
              </div>
            )}

            {!loading && !orderedCats.length && (
              <div className="text-muted">Aucune catégorie disponible.</div>
            )}

            {!loading && !!orderedCats.length && (
              <motion.ul className="prio-list d-flex flex-column gap-2 m-0" layout>
                <AnimatePresence initial={false}>
                  {orderedCats.map((c, idx) => {
                    const rankClass = idx === 0 ? 'rank-1' : idx === 1 ? 'rank-2' : 'rank-other';
                    const flashClass =
                      flash.id === c.id ? (flash.dir === 'up' ? 'is-up' : 'is-down') : '';
                    return (
                      <motion.li
                        key={c.id}
                        layout
                        transition={{ type: 'spring', stiffness: 520, damping: 38 }}
                      >
                        <div className={`rounded px-3 py-2 prio-item ${flashClass}`}>
                          <div className="row-wrap">
                            <div className="prio-main">
                              <div className={`prio-rank ${rankClass}`} title={`Rang ${idx + 1}`}>{idx + 1}</div>
                              <div className="d-flex flex-column">
                                <div className="prio-name">{c.name}</div>
                                {Number.isFinite(c.score) && (
                                  <small className="prio-score">Score actuel : {c.score}</small>
                                )}
                              </div>
                            </div>

                            <div className="prio-actions">
                              <button
                                className="btn btn-outline-secondary btn-sm prio-btn"
                                onClick={() => moveTop(idx)}
                                disabled={idx === 0 || saving}
                                title="Tout en haut"
                              >
                                ⭱
                              </button>
                              <button
                                className="btn btn-outline-secondary btn-sm prio-btn"
                                onClick={() => move(idx, -1)}
                                disabled={idx === 0 || saving}
                                title="Monter"
                              >
                                ▲
                              </button>
                              <button
                                className="btn btn-outline-secondary btn-sm prio-btn"
                                onClick={() => move(idx, +1)}
                                disabled={idx === orderedCats.length - 1 || saving}
                                title="Descendre"
                              >
                                ▼
                              </button>
                              <button
                                className="btn btn-outline-secondary btn-sm prio-btn"
                                onClick={() => moveBottom(idx)}
                                disabled={idx === orderedCats.length - 1 || saving}
                                title="Tout en bas"
                              >
                                ⭳
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.li>
                    );
                  })}
                </AnimatePresence>
              </motion.ul>
            )}

            {!loading && !!orderedCats.length && (
              <div className="mt-3 text-muted" style={{ fontSize: 13 }}>
                Astuce : place tes 2 catégories clés en haut pour maximiser les bonus d’XP.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
