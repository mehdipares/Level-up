import { useRef, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import '../../styles/Goalchoice/goal-cards.css'; // styles

/**
 * Carte BLEUE du catalogue d'objectifs (mobile-first) avec anim de réorg.
 * Props:
 * - q, onChangeQ
 * - categories, activeFilter, onChangeFilter
 * - filteredItems (array de templates)
 * - onAdd(tplId), busyId
 * - ownedTemplateIds: Set<number> des templates déjà ajoutés (optionnel)
 */
export default function CatalogCard({
  q,
  onChangeQ,
  categories = [],
  activeFilter = 'tous',
  onChangeFilter,
  filteredItems = [],
  onAdd,
  busyId = null,
  ownedTemplateIds = new Set(),
}) {
  // On garantit la présence de 'tous' et 'perso' dans les chips
  const chips = useMemo(() => {
    const set = new Set(['tous', 'perso', ...categories.map(c => String(c).toLowerCase())]);
    return Array.from(set);
  }, [categories]);

  // Ruban catégories : centrage auto sur le chip actif
  const catStripRef = useRef(null);
  const catRefs = useRef({});

  const centerCatChip = (catKey) => {
    const container = catStripRef.current;
    const chip = catRefs.current[catKey];
    if (!container || !chip) return;
    const chipCenter = chip.offsetLeft + chip.offsetWidth / 2;
    const target = chipCenter - container.clientWidth / 2;
    container.scrollTo({ left: Math.max(0, target), behavior: 'smooth' });
  };

  useEffect(() => {
    const id = setTimeout(() => centerCatChip(activeFilter), 50);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFilter, chips.length]);

  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const catLabel = (c) => (c === 'tous' ? 'Tous' : c === 'perso' ? 'Perso' : cap(c));

  // --- Animations bouton ---
  const sparkle = (btnEl) => {
    if (!btnEl) return;
    btnEl.classList.remove('spark');
    // eslint-disable-next-line no-unused-expressions
    btnEl.offsetWidth; // reflow
    btnEl.classList.add('spark');
    setTimeout(() => btnEl.classList.remove('spark'), 650);
  };
  const bounce = (btnEl) => {
    if (!btnEl) return;
    btnEl.classList.remove('bounce');
    // eslint-disable-next-line no-unused-expressions
    btnEl.offsetWidth;
    btnEl.classList.add('bounce');
    setTimeout(() => btnEl.classList.remove('bounce'), 220);
  };

  // --- Optimisme local : on pousse l’item en bas immédiatement ---
  const [optimisticOwned, setOptimisticOwned] = useState(new Set());
  const isOwned = (tplId) =>
    ownedTemplateIds.has(Number(tplId)) || optimisticOwned.has(Number(tplId));

  const spring = { type: 'spring', stiffness: 500, damping: 40, mass: 0.5 };

  // Ordonner: non possédés d’abord, possédés ensuite
  const ordered = useMemo(() => {
    const arr = Array.isArray(filteredItems) ? [...filteredItems] : [];
    return arr.sort((a, b) => (isOwned(a.id) ? 1 : 0) - (isOwned(b.id) ? 1 : 0));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredItems, ownedTemplateIds, optimisticOwned]);

  return (
    <div className="goalchoice-card p-3 p-sm-3 mb-3">
      {/* En-tête */}
      <div className="d-flex justify-content-between align-items-center mb-2 goalchoice-header">
        <h2 className="m-0 goalchoice-title">Objectifs</h2>
        <span className="badge bg-light text-dark goalchoice-count">
          {filteredItems.length} résultat{filteredItems.length > 1 ? 's' : ''}
        </span>
      </div>

      {/* Recherche */}
      <div className="mb-1 goalchoice-search">
        <input
          className="form-control"
          placeholder="Rechercher un objectif…"
          value={q}
          onChange={(e) => onChangeQ?.(e.target.value)}
          aria-label="Rechercher"
        />
      </div>

      {/* Ruban catégories */}
      <div ref={catStripRef} className="w-100 mb-1 goalchoice-catstrip">
        <div className="d-flex align-items-center gap-2 py-1 goalchoice-catstrip-inner">
          {chips.map((c) => {
            const active = activeFilter === c;
            return (
              <button
                key={c}
                ref={(el) => { if (el) catRefs.current[c] = el; }}
                type="button"
                onClick={() => {
                  onChangeFilter?.(c);
                  centerCatChip(c);
                }}
                className={`btn btn-sm goalchoice-chip${active ? ' is-active' : ''}`}
                aria-pressed={active}
              >
                {catLabel(c)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Liste avec layout animé */}
      <div className="mt-1 goalchoice-list">
        <motion.ul
          layout
          transition={spring}
          className="list-unstyled d-flex flex-column gap-2 mb-0"
        >
          <AnimatePresence initial={false}>
            {ordered.map((t) => {
              const owned = isOwned(t.id);
              return (
                <motion.li
                  key={t.id}
                  layout
                  transition={spring}
                  initial={{ opacity: 0, y: 12, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.98 }}
                >
                  <motion.div
                    layout
                    transition={spring}
                    className={`goal-card d-flex align-items-center justify-content-between px-3 py-2${owned ? ' owned' : ''}`}
                    whileHover={{ scale: 1.02 }}
                  >
                    {/* Titre + description */}
                    <div className="pe-3 flex-grow-1">
                      <div className="goal-card-title" title={t.title}>{t.title}</div>
                      {t.description && (
                        <small className="d-block mt-1 goal-card-desc">{t.description}</small>
                      )}
                    </div>

                    {/* Action */}
                    <div className="d-flex align-items-center">
                      <motion.button
                        whileTap={{ scale: 0.98, y: 1 }}
                        transition={{ type: 'spring', stiffness: 600, damping: 30 }}
                        className="btn btn-success btn-add"
                        disabled={busyId === t.id || owned}
                        onClick={(e) => {
                          // Optimisme local: marque comme possédé pour glisser en bas tout de suite
                          setOptimisticOwned(prev => new Set(prev).add(Number(t.id)));
                          onAdd?.(t.id);                  // réseau
                          bounce(e.currentTarget);        // tactile
                          sparkle(e.currentTarget);       // ✨
                        }}
                        aria-label={owned ? `Déjà ajouté : ${t.title}` : `Ajouter l’objectif ${t.title}`}
                      >
                        {owned ? 'Ajouté' : busyId === t.id ? 'Ajout…' : 'Ajouter'}
                      </motion.button>
                    </div>
                  </motion.div>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </motion.ul>
      </div>
    </div>
  );
}
