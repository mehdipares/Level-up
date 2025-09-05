import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import '../../styles/Goalchoice/goal-cards.css';

/**
 * Carte VIOLETTE de gestion des objectifs (compacte + scrollable).
 * Cadence = select "pilule" coloré (Quotidien ↔ 1× / semaine) avec APPLY auto.
 */
export default function ManageCard({
  goals = [],
  manageStatus = 'all',
  onChangeStatus,
  onRefresh,
  cadenceEdit = {},
  setCadenceEdit,
  mgmtBusy = null,
  onArchive,
  onUnarchive,
  onDelete,
  onApplyCadence,
}) {
  // ---------- Helpers ----------
  const isArchivedFlag = (g) =>
    !!(
      g?.archived ||
      g?.is_archived ||
      (g?.status && String(g.status).toLowerCase() === 'archived') ||
      g?.archived_at
    );

  // Tri : actifs d’abord, archivés ensuite (pour "all")
  const orderedGoals = useMemo(() => {
    const arr = Array.isArray(goals) ? [...goals] : [];
    return arr.sort((a, b) => (isArchivedFlag(a) ? 1 : 0) - (isArchivedFlag(b) ? 1 : 0));
  }, [goals]);

  const spring = { type: 'spring', stiffness: 500, damping: 40, mass: 0.5 };

  // ---------- UI theming ----------
  const themeFor = (mode) =>
    mode === 'weekly'
      ? { bg: '#eef2ff', border: '#c7d2fe', text: '#3730a3', ring: '0 0 0 4px rgba(99,102,241,.15)' }
      : { bg: '#ecfdf5', border: '#bbf7d0', text: '#065f46', ring: '0 0 0 4px rgba(16,185,129,.12)' };

  const CadenceSelectPill = ({ value, disabled, onChange }) => {
    const th = themeFor(value);
    return (
      <select
        className="form-select form-select-sm"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value === 'weekly' ? 'weekly' : 'daily')}
        aria-label="Cadence"
        style={{
          appearance: 'none',
          WebkitAppearance: 'none',
          MozAppearance: 'none',
          borderRadius: 999,
          padding: '8px 36px 8px 14px',
          minWidth: 170,
          border: `2px solid ${th.border}`,
          background: th.bg,
          color: th.text,
          fontWeight: 800,
          boxShadow: '0 4px 12px rgba(0,0,0,.06)',
          backgroundImage:
            `url("data:image/svg+xml;utf8,` +
            `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20'>` +
            `<path fill='${encodeURIComponent(th.text)}' d='M5.5 7.5l4.5 5 4.5-5z'/></svg>")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 12px center',
          backgroundSize: '14px 14px',
        }}
        onFocus={(e) => (e.currentTarget.style.boxShadow = `${th.ring}, 0 4px 12px rgba(0,0,0,.06)`)}
        onBlur={(e) => (e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,.06)')}
      >
        <option value="daily">Quotidien</option>
        <option value="weekly">1× / semaine</option>
      </select>
    );
  };

  // Style "ultra-compact" pour les boutons des éléments archivés
  const compactBtn = {
    padding: '4px 10px',
    lineHeight: 1.1,
    borderRadius: 12,
    fontWeight: 700,
  };

  return (
    <div
      className="p-3 p-sm-3 mt-3"
      style={{
        background: 'linear-gradient(180deg, #7c3aed, #5b21b6)',
        color: '#fff',
        borderRadius: 28,
        boxShadow: '0 12px 30px rgba(124, 58, 237, 0.25)',
      }}
    >
      {/* En-tête */}
      <div className="d-flex flex-wrap gap-2 justify-content-between align-items-center mb-2">
        <h3 className="m-0" style={{ fontWeight: 900, color: '#F8FAFC' }}>
          Gestion des objectifs
        </h3>
        <div className="d-flex gap-2">
          <select
            className="form-select form-select-sm"
            value={manageStatus}
            onChange={(e) => onChangeStatus?.(e.target.value)}
            aria-label="Filtrer"
            style={{ borderRadius: 12 }}
          >
            <option value="all">Tous</option>
            <option value="active">Actifs</option>
            <option value="archived">Archivés</option>
          </select>
          <motion.button
            whileHover={{ y: -1 }}
            whileTap={{ y: 1, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 600, damping: 30 }}
            className="btn btn-light btn-sm"
            onClick={onRefresh}
            style={{ borderRadius: 12 }}
          >
            Rafraîchir
          </motion.button>
        </div>
      </div>

      {/* Liste */}
      {!orderedGoals.length && (
        <div className="text-light" style={{ opacity: 0.9 }}>
          Aucun objectif à afficher.
        </div>
      )}

      {!!orderedGoals.length && (
        <div
          className="mt-1"
          style={{
            maxHeight: '32vh',
            overflowY: 'auto',
            overscrollBehavior: 'contain',
            borderRadius: 16,
            paddingRight: 4,
          }}
        >
          <motion.ul
            layout
            transition={spring}
            className="list-unstyled d-flex flex-column gap-2 m-0"
          >
            <AnimatePresence initial={false}>
              {orderedGoals.map((g) => {
                const archived = isArchivedFlag(g);
                const selected =
                  cadenceEdit[g.id] ?? g.cadence ?? (g.effective_frequency_type === 'weekly' ? 'weekly' : 'daily');

                const disabledAny =
                  mgmtBusy === g.id ||
                  mgmtBusy === `sched-${g.id}` ||
                  mgmtBusy === `unarch-${g.id}` ||
                  mgmtBusy === `del-${g.id}`;

                const applyCad = async (val) => {
                  setCadenceEdit?.((prev) => ({ ...prev, [g.id]: val })); // optimiste
                  try {
                    await onApplyCadence?.(g.id, val);
                  } catch {
                    setCadenceEdit?.((prev) => ({ ...prev, [g.id]: selected }));
                  }
                };

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
                      className="d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between rounded px-3 py-2 border bg-white"
                      style={{
                        position: 'relative',
                        borderRadius: 28,
                        border: '1px solid #d6bcfa',
                        boxShadow: '0 6px 22px rgba(124,58,237,0.10)',
                        gap: 10,
                        minHeight: 56,
                        background: archived ? 'linear-gradient(180deg, #fbfaff, #f6f1ff)' : '#ffffff',
                      }}
                      whileHover={{ y: -1 }}
                    >
                      {/* Badge Archivé */}
                      {archived && (
                        <span className="badge bg-secondary" style={{ position: 'absolute', top: 8, right: 8 }}>
                          Archivé
                        </span>
                      )}

                      {/* Titre */}
                      <div
                        className="pe-sm-3 flex-grow-1"
                        title={g.title}
                        style={{
                          fontWeight: 800,
                          lineHeight: 1.2,
                          color: archived ? '#6b7280' : '#111827',
                        }}
                      >
                        {g.title}
                      </div>

                      {/* Cadence (pilule) + actions */}
                      <div className="d-flex align-items-stretch gap-2">
                        <CadenceSelectPill
                          value={selected}
                          disabled={archived || disabledAny}
                          onChange={applyCad}
                        />

                        {!archived ? (
                          <motion.button
                            whileHover={{ y: -1 }}
                            whileTap={{ y: 1, scale: 0.98 }}
                            transition={{ type: 'spring', stiffness: 600, damping: 30 }}
                            className="btn btn-outline-danger btn-sm"
                            disabled={disabledAny}
                            onClick={() => onArchive?.(g.id)}
                            title="Archiver (conserve l'historique)"
                            style={{ borderRadius: 12 }}
                          >
                            {mgmtBusy === g.id ? '…' : 'Archiver'}
                          </motion.button>
                        ) : (
                          <div className="d-flex flex-column gap-1">
                            <motion.button
                              whileHover={{ y: -1 }}
                              whileTap={{ y: 1, scale: 0.98 }}
                              transition={{ type: 'spring', stiffness: 600, damping: 30 }}
                              className="btn btn-success btn-sm"
                              disabled={mgmtBusy === `unarch-${g.id}` || mgmtBusy === `del-${g.id}`}
                              onClick={() => onUnarchive?.(g.id)}
                              title="Réactiver"
                              style={compactBtn}
                            >
                              {mgmtBusy === `unarch-${g.id}` ? '…' : 'Réactiver'}
                            </motion.button>
                            <motion.button
                              whileHover={{ y: -1 }}
                              whileTap={{ y: 1, scale: 0.98 }}
                              transition={{ type: 'spring', stiffness: 600, damping: 30 }}
                              className="btn btn-danger btn-sm"
                              disabled={mgmtBusy === `del-${g.id}` || mgmtBusy === `unarch-${g.id}`}
                              onClick={() => onDelete?.(g.id)}
                              title="Supprimer définitivement (archivé uniquement)"
                              style={compactBtn}
                            >
                              {mgmtBusy === `del-${g.id}` ? '…' : 'Supprimer'}
                            </motion.button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </motion.ul>
        </div>
      )}
    </div>
  );
}
