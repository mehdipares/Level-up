import { useRef, useEffect, useMemo } from 'react';

/**
 * Carte BLEUE du catalogue d'objectifs (mobile-first).
 * Props:
 * - q, onChangeQ(string) : recherche live
 * - categories(string[]) : ex. ['sport','freelance','mindset']
 * - activeFilter(string) : 'tous' | 'perso' | <cat>
 * - onChangeFilter(fn)
 * - filteredItems(array) : items déjà filtrés par la page
 * - onAdd(tplId:number), busyId:number|null
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

  return (
    <div
      className="p-3 p-sm-3 mb-3"
      style={{
        background: 'linear-gradient(180deg, #2563eb, #1e40af)',
        color: '#fff',
        borderRadius: 28,
        boxShadow: '0 12px 30px rgba(37, 99, 235, 0.25)',
      }}
    >
      {/* En-tête */}
      <div className="d-flex justify-content-between align-items-center mb-2">
        <h2 className="m-0" style={{ fontWeight: 900, color: '#F8FAFC', textShadow: '0 1px 0 rgba(0,0,0,.18)' }}>
          Objectifs
        </h2>
        <span className="badge bg-light text-dark" style={{ fontWeight: 700 }}>
          {filteredItems.length} résultat{filteredItems.length > 1 ? 's' : ''}
        </span>
      </div>

      {/* Recherche live */}
      <div className="mb-1">
        <input
          className="form-control"
          placeholder="Rechercher un objectif…"
          value={q}
          onChange={(e) => onChangeQ?.(e.target.value)}
          aria-label="Rechercher"
          style={{ borderRadius: 16, boxShadow: '0 6px 22px rgba(0,0,0,.12)' }}
        />
      </div>

      {/* Ruban catégories (inclut 'tous' et 'perso') */}
      <div
        ref={catStripRef}
        className="w-100 mb-1"
        style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}
      >
        <div className="d-flex align-items-center gap-2 py-1" style={{ minHeight: 42, width: 'max-content' }}>
          {chips.map((c) => {
            const active = activeFilter === c;
            return (
              <button
                key={c}
                ref={(el) => {
                  if (el) catRefs.current[c] = el;
                }}
                type="button"
                onClick={() => {
                  onChangeFilter?.(c);       // <-- la page doit gérer 'perso'
                  centerCatChip(c);
                }}
                className="btn btn-sm"
                style={{
                  borderRadius: 999,
                  border: active ? '2px solid #ffffff' : '1px solid #e5e7eb',
                  background: active ? '#ffffff' : '#f8fafc',
                  color: active ? '#1f2937' : '#374151',
                  padding: '8px 14px',
                  whiteSpace: 'nowrap',
                  boxShadow: active ? '0 6px 18px rgba(255,255,255,.25)' : '0 1px 4px rgba(0,0,0,.06)',
                }}
                aria-pressed={active}
              >
                {catLabel(c)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Liste (scrollable) */}
      <div className="mt-1" style={{ maxHeight: '45vh', overflowY: 'auto', overscrollBehavior: 'contain', borderRadius: 16 }}>
        <ul className="list-unstyled d-flex flex-column gap-2 mb-0">
          {filteredItems.map((t) => (
            <li key={t.id}>
              <div
                className="d-flex align-items-center justify-content-between rounded px-3 py-2 border bg-white"
                style={{
                  position: 'relative',
                  borderRadius: 28,
                  border: '1px solid #c7d2fe',
                  background: '#ffffff',
                  boxShadow: '0 6px 22px rgba(59,130,246,0.10)',
                  gap: 12,
                  minHeight: 64,
                }}
              >
                {/* Titre + description */}
                <div className="pe-3 flex-grow-1">
                  <div
                    title={t.title}
                    style={{
                      color: '#0f172a',
                      fontWeight: 800,
                      lineHeight: 1.2,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {t.title}
                  </div>
                  {t.description && <small className="text-muted d-block mt-1">{t.description}</small>}
                </div>

                {/* Action */}
                <div className="d-flex align-items-center">
                  <button
                    className="btn btn-success"
                    disabled={busyId === t.id}
                    onClick={() => onAdd?.(t.id)}
                    aria-label={`Ajouter l’objectif ${t.title}`}
                    style={{ minWidth: 120, borderRadius: 999 }}
                  >
                    {busyId === t.id ? 'Ajout…' : 'Ajouter'}
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
