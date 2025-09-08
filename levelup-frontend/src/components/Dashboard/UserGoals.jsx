// src/components/UserGoals.jsx
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getCurrentUserId } from '../../utils/auth';
import API_BASE from '../../config/api'; // 👈 base URL API (local/prod)
import '../../styles/Dashboard/goal-cards.css'; // ✅ styles dashboard

function authHeaders() {
  const h = new Headers({ 'Accept': 'application/json', 'Content-Type': 'application/json' });
  const t = localStorage.getItem('token');
  if (t) h.set('Authorization', `Bearer ${t}`);
  return h;
}

const spring = { type: 'spring', stiffness: 520, damping: 40, mass: 0.55 };
const ANIM_MS = 260; // ⏱️ laisse l’anim de réorg se terminer

export default function UserGoals({ userId: userIdProp, className = '' }) {
  const userId = useMemo(() => userIdProp ?? getCurrentUserId() ?? null, [userIdProp]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);
  const [err, setErr] = useState(null);

  const [confirm, setConfirm] = useState(null);
  const [doneLocal, setDoneLocal] = useState(new Set()); // ✅ pour réorg immédiate et fluide

  const load = async () => {
    if (!userId) { setErr('Utilisateur non identifié'); setLoading(false); return; }
    setLoading(true); setErr(null);
    try {
      const res = await fetch(`${API_BASE}/users/${userId}/user-goals`, { // 👈
        headers: authHeaders(),
        cache: 'no-store'
      });
      if (!res.ok) throw new Error(await res.text());
      const arr = await res.json();
      setRows(Array.isArray(arr) ? arr : (arr.rows || arr.data || []));
    } catch (e) {
      setErr(e.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [userId]);

  // tri visuel : à faire d’abord, faits ensuite (inclut l’état optimiste)
  const ordered = useMemo(() => {
    const arr = Array.isArray(rows) ? [...rows] : [];
    const isDone = (g) => doneLocal.has(g.id) || !g.can_complete;
    return arr.sort((a, b) => (isDone(a) ? 1 : 0) - (isDone(b) ? 1 : 0));
  }, [rows, doneLocal]);

  const doComplete = async (ugid) => {
    setBusy(ugid);
    // ✅ Optimisme : marque comme “fait” → Framer réorganise en douceur
    setDoneLocal(prev => new Set(prev).add(ugid));

    try {
      const res = await fetch(`${API_BASE}/users/${userId}/user-goals/${ugid}/complete`, { // 👈
        method: 'PATCH',
        headers: authHeaders()
      });
      if (!res.ok) throw new Error(await res.text());
      setConfirm(null);

      // 🕐 laisse l’anim finir avant de recharger (sinon ça coupe)
      await new Promise(r => setTimeout(r, ANIM_MS));

      await load();
      window.dispatchEvent(new Event('xp:changed'));
      window.dispatchEvent(new Event('goals:changed'));
    } catch (e) {
      // rollback si erreur
      setDoneLocal(prev => { const next = new Set(prev); next.delete(ugid); return next; });
      const msg = String(e.message || '');
      if (msg.includes('Déjà complété')) alert('Déjà complété pour la période en cours.');
      else alert(msg);
    } finally { setBusy(null); }
  };

  const doArchive = async (ugid) => {
    setBusy(`arch-${ugid}`);
    try {
      const res = await fetch(`${API_BASE}/users/${userId}/user-goals/${ugid}/archive`, { // 👈
        method: 'PATCH',
        headers: authHeaders()
      });
      if (!res.ok) throw new Error(await res.text());
      setConfirm(null);

      await new Promise(r => setTimeout(r, ANIM_MS));
      await load();
      window.dispatchEvent(new Event('goals:changed'));
    } catch (e) {
      alert(e.message || 'Erreur');
    } finally { setBusy(null); }
  };

  const doneCount = rows.filter(g => !g.can_complete).length;
  const allDone   = rows.length > 0 && doneCount === rows.length;

  const wrapperStyle = allDone
    ? {
        background: 'linear-gradient(180deg, #22c55e 0%, #16a34a 100%)',
        borderColor: '#86efac',
        color: '#fff',
        boxShadow: '0 10px 28px rgba(34,197,94,0.28)',
        borderRadius: 20
      }
    : {
        background: 'linear-gradient(180deg, #3b82f6 0%, #1d4ed8 100%)',
        borderColor: '#93c5fd',
        color: '#fff',
        boxShadow: '0 10px 28px rgba(59,130,246,0.28)',
        borderRadius: 20
      };

  const ITEM_RADIUS = 22;

  return (
    <div className={className}>
      <div className="p-3 p-md-4 border" style={wrapperStyle}>
        <div className="d-flex align-items-center justify-content-between mb-2">
          <h4 className="m-0">Mes objectifs</h4>
          {rows.length ? (
            allDone ? (
              <span className="badge bg-light text-dark">Tout validé ✅</span>
            ) : (
              <span className="badge bg-light text-dark">{doneCount}/{rows.length} validé(s)</span>
            )
          ) : (
            <span className="badge bg-light text-dark">0 objectif</span>
          )}
        </div>

        {/* Skeletons */}
        {loading && (
          <div className="ug-list">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="ug-item skeleton">
                <div className="skeleton-line skeleton-title" />
                <div className="skeleton-line skeleton-sub" />
              </div>
            ))}
          </div>
        )}

        {/* Vide */}
        {!loading && !rows.length && (
          <>
            <div className="opacity-90 mb-3">Aucun objectif actif. Ajoute-en depuis le catalogue.</div>
            <Link
              to="/GoalChoice"
              className="btn btn-light fw-bold w-100"
              style={{ borderRadius: 999, boxShadow: '0 2px 8px rgba(0,0,0,.12)' }}
            >
              Gérer mes objectifs
            </Link>
          </>
        )}

        {/* Liste avec réorg fluide */}
        {!loading && !!rows.length && (
          <motion.div layoutScroll className="ug-list">
            <motion.ul layout transition={spring} className="list-unstyled d-flex flex-column gap-2 m-0">
              <AnimatePresence initial={false}>
                {ordered.map(g => {
                  const can = !!g.can_complete;
                  const doneServer = !can;
                  const done = doneServer || doneLocal.has(g.id);

                  const cadence = g.cadence || (g.effective_frequency_type === 'weekly' ? 'weekly' : 'daily');
                  const isArchBusy = busy === `arch-${g.id}`;
                  const isCompBusy = busy === g.id;
                  const isConfirming = confirm?.id === g.id;

                  const itemStyle = done
                    ? {
                        background: '#eafaf1',
                        border: '2px solid #15803d',
                        boxShadow: '0 6px 14px rgba(21,128,61,0.18)',
                        transform: 'scale(1.01)',
                        borderRadius: ITEM_RADIUS,
                        transition: 'transform .12s ease, border-color .12s ease, box-shadow .12s ease',
                        minHeight: 76,
                        color: '#0f172a'
                      }
                    : {
                        background: '#f5f9ff',
                        border: '1px solid #cfe0ff',
                        boxShadow: '0 2px 8px rgba(0,0,0,.06)',
                        transform: 'scale(1)',
                        borderRadius: ITEM_RADIUS,
                        transition: 'transform .12s ease, border-color .12s ease, box-shadow .12s ease',
                        minHeight: 76,
                        color: '#0f172a'
                      };

                  const checkBtnStyle = done
                    ? { width: 42, height: 42, borderRadius: 999, background: '#16a34a', color: '#fff', border: 'none' }
                    : { width: 42, height: 42, borderRadius: 999, background: can ? '#e7f7ed' : '#eef2f7', color: '#16a34a', border: '1px solid #d1e7dd' };

                  const archiveBtnStyle = { width: 42, height: 42, borderRadius: 999, background: '#fff5f5', border: '1px solid #f7d4d4' };

                  return (
                    <motion.li
                      key={g.id}
                      layout
                      transition={spring}
                      initial={{ opacity: 0, y: 12, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.98 }}
                    >
                      <motion.div
                        layout
                        transition={spring}
                        className={`ug-item d-flex align-items-center justify-content-between px-3 py-2 ${done ? 'is-done' : ''}`}
                        style={itemStyle}
                        whileHover={{ y: -1 }}
                      >
                        <div className="flex-grow-1 me-3">
                          <div
                            title={g.title}
                            className="ug-title-line"
                            style={{
                              fontWeight: 700,
                              lineHeight: 1.2,
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden'
                            }}
                          >
                            {g.title}
                          </div>

                          <div className="d-flex flex-wrap align-items-center gap-2 mt-2">
                            <span className={`badge ${cadence === 'weekly' ? 'bg-info' : 'bg-success'}`} title={`Cadence: ${cadence}`}>
                              {cadence}
                            </span>
                            <span className={`badge ${done ? 'bg-success' : 'bg-secondary'}`} title={done ? 'Déjà validé pour la période' : 'À faire'}>
                              {done ? 'fait' : 'à faire'}
                            </span>
                          </div>
                        </div>

                        <div className="d-flex align-items-center gap-2" style={{ minWidth: 132, justifyContent: 'flex-end' }}>
                          <motion.button
                            whileHover={{ y: -1 }}
                            whileTap={{ y: 1, scale: 0.98 }}
                            transition={{ type: 'spring', stiffness: 600, damping: 30 }}
                            type="button"
                            className={`btn ${done ? '' : 'btn-light'} ug-check ${done ? 'checked' : ''}`}
                            disabled={!can || isCompBusy || isArchBusy}
                            onClick={() => setConfirm({ id: g.id, action: 'complete' })}
                            title={done ? 'Déjà fait' : (can ? 'Valider' : 'Indisponible')}
                            style={checkBtnStyle}
                          >
                            {isCompBusy ? '…' : '✓'}
                          </motion.button>

                          <motion.button
                            whileHover={{ y: -1 }}
                            whileTap={{ y: 1, scale: 0.98 }}
                            transition={{ type: 'spring', stiffness: 600, damping: 30 }}
                            type="button"
                            className="btn btn-light"
                            disabled={isArchBusy || isCompBusy}
                            onClick={() => setConfirm({ id: g.id, action: 'archive' })}
                            title="Archiver"
                            style={archiveBtnStyle}
                          >
                            {isArchBusy ? '…' : '✕'}
                          </motion.button>
                        </div>
                      </motion.div>

                      <AnimatePresence initial={false}>
                        {isConfirming && (
                          <motion.div
                            initial={{ opacity: 0, y: -6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            className="px-3 py-2 border rounded mt-2"
                            style={{ background: '#f8fafc', borderColor: '#e5e7eb', color: '#0f172a' }}
                          >
                            <div className="d-flex align-items-center justify-content-between">
                              <div style={{ fontWeight: 600 }}>
                                {confirm.action === 'complete' ? 'Valider cet objectif ?' : 'Archiver cet objectif ?'}
                              </div>
                              <div className="d-flex align-items-center gap-2">
                                <button
                                  className={`btn btn-sm ${confirm.action === 'complete' ? 'btn-success' : 'btn-danger'}`}
                                  onClick={() => (confirm.action === 'complete' ? doComplete(g.id) : doArchive(g.id))}
                                >
                                  Confirmer
                                </button>
                                <button className="btn btn-sm btn-outline-secondary" onClick={() => setConfirm(null)}>
                                  Annuler
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.li>
                  );
                })}
              </AnimatePresence>
            </motion.ul>
          </motion.div>
        )}
      </div>
    </div>
  );
}
