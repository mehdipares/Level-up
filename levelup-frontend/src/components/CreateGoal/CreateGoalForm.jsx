// src/components/CreateGoal/CreateGoalForm.jsx
import { useEffect, useMemo, useState } from 'react';
import { getCurrentUserId } from '../../utils/auth';

/** Headers JSON + token */
function authHeaders() {
  const h = new Headers({ Accept: 'application/json', 'Content-Type': 'application/json' });
  const t = localStorage.getItem('token');
  if (t) h.set('Authorization', `Bearer ${t}`);
  return h;
}

/** Barème de base par catégorie (tu peux ajuster) */
const XP_BY_CATEGORY = {
  sport:     { daily: 15, weekly: 45 },
  freelance: { daily: 18, weekly: 50 },
  mindset:   { daily: 12, weekly: 36 },
  _default:  { daily: 12, weekly: 36 },
};

function baseXPFor(categoryName = '', cadence = 'daily') {
  const key = (categoryName || '').toLowerCase();
  const cfg = XP_BY_CATEGORY[key] || XP_BY_CATEGORY._default;
  return cadence === 'weekly' ? cfg.weekly : cfg.daily;
}

/** Bonus selon le rang de priorité (#1 = +50%, #2 = +25%) */
function bonusMultiplierForRank(rank) {
  if (rank === 1) return 1.5;
  if (rank === 2) return 1.25;
  return 1.0;
}

export default function CreateGoalForm() {
  const userId = useMemo(() => getCurrentUserId() ?? null, []);

  // Form state
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [cadence, setCadence] = useState('daily'); // 'daily' | 'weekly'
  const [categoryId, setCategoryId] = useState('');
  const [categoryName, setCategoryName] = useState('');

  // Data
  const [categories, setCategories] = useState([]);
  const [loadingCats, setLoadingCats] = useState(true);

  // Priorités utilisateur
  const [prioMap, setPrioMap] = useState({}); // { [category_id]: rank(1..N) }
  const [loadingPrio, setLoadingPrio] = useState(true);

  // XP affichée
  const [baseXP, setBaseXP] = useState(0);
  const [xpEffective, setXpEffective] = useState(0);
  const [appliedBonusLabel, setAppliedBonusLabel] = useState('—');

  // UX
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Fetch categories
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoadingCats(true);
        const res = await fetch('/categories', { headers: authHeaders(), cache: 'no-store' });
        if (!res.ok) throw new Error(await res.text());
        const arr = await res.json();
        const list = Array.isArray(arr) ? arr : (arr.rows || arr.data || []);
        if (!alive) return;
        setCategories(list);

        if (!categoryId && list.length) {
          const first = list[0];
          setCategoryId(String(first.id));
          setCategoryName(first.name || '');
        }
      } catch (e) {
        if (!alive) return;
        setError(e.message || 'Erreur de chargement des catégories');
      } finally {
        if (alive) setLoadingCats(false);
      }
    })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch priorités utilisateur
  useEffect(() => {
    let alive = true;
    (async () => {
      if (!userId) { setLoadingPrio(false); return; }
      try {
        setLoadingPrio(true);
        const res = await fetch(`/users/${userId}/priorities`, { headers: authHeaders(), cache: 'no-store' });
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        const list = Array.isArray(data) ? data : (data.rows || data.data || []);
        // Tri décroissant par score, puis rang 1..N
        const ordered = [...list].sort((a, b) => Number(b.score ?? 0) - Number(a.score ?? 0));
        const map = {};
        ordered.forEach((row, idx) => {
          const cid = Number(row.category_id ?? row.Category?.id ?? 0);
          if (cid) map[cid] = idx + 1;
        });
        if (!alive) return;
        setPrioMap(map);
      } catch (e) {
        if (!alive) return;
        // On n’empêche pas la création si ça rate; on affichera juste la base sans bonus
        setPrioMap({});
      } finally {
        if (alive) setLoadingPrio(false);
      }
    })();
    return () => { alive = false; };
  }, [userId]);

  // Recalc XP quand catégorie / cadence / priorités changent
  useEffect(() => {
    const bxp = baseXPFor(categoryName, cadence);
    const rank = prioMap[Number(categoryId)] ?? null;
    const mult = bonusMultiplierForRank(rank);
    const eff = Math.round(bxp * mult);

    setBaseXP(bxp);
    setXpEffective(eff);
    setAppliedBonusLabel(rank === 1 ? '+50% (prio #1)' : rank === 2 ? '+25% (prio #2)' : '—');
  }, [categoryId, categoryName, cadence, prioMap]);

  const onCategoryChange = (val) => {
    setCategoryId(val);
    const cat = categories.find(c => String(c.id) === String(val));
    setCategoryName(cat?.name || '');
  };

  const resetForm = () => {
    setTitle('');
    setDesc('');
    setCadence('daily');
    if (categories.length) {
      const first = categories[0];
      setCategoryId(String(first.id));
      setCategoryName(first.name || '');
    } else {
      setCategoryId('');
      setCategoryName('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userId) return setError('Utilisateur non identifié');
    if (!title.trim()) return setError('Le titre est obligatoire');
    if (!categoryId)  return setError('Choisis une catégorie');

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      // 🧱 On stocke la base "neutre" (le bonus sera appliqué à la complétion côté back)
      const tplBody = {
        title: title.trim(),
        description: desc.trim() || null,
        category_id: Number(categoryId),
        base_xp: Number(baseXP), // ← garder la base (ne pas multiplier ici pour éviter double bonus)
        frequency_type: cadence === 'weekly' ? 'weekly' : 'daily',
        frequency_interval: 1,
        enabled: true,
        visibility: 'private',
        owner_user_id: Number(userId),
      };

      const resTpl = await fetch('/goal-templates', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(tplBody),
      });
      if (!resTpl.ok) throw new Error(await resTpl.text());
      const created = await resTpl.json();
      const tplId = Number(created?.id ?? created?.template?.id);
      if (!tplId) throw new Error("Template créé, mais l'ID est introuvable.");

      // Lier à l'utilisateur
      const resLink = await fetch(`/users/${userId}/user-goals`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ template_id: tplId, cadence }),
      });
      if (!resLink.ok) throw new Error(await resLink.text());

      setSuccess('Objectif créé et ajouté à tes objectifs 🎉');
      resetForm();
      window.dispatchEvent(new Event('goals:changed'));
    } catch (e2) {
      setError(e2.message || 'Erreur lors de la création de l’objectif');
    } finally {
      setSubmitting(false);
    }
  };

  // Styles utilitaires
  const inputStyle = { borderRadius: 14, boxShadow: '0 4px 14px rgba(0,0,0,.06)' };
  const labelStyle = { fontWeight: 700, color: '#F1F5F9' };

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="alert alert-danger">{String(error)}</div>}
      {success && <div className="alert alert-success">{String(success)}</div>}

      {/* Titre */}
      <div className="mb-3">
        <label className="form-label" style={labelStyle}>Titre de l’objectif *</label>
        <input
          className="form-control"
          placeholder="Ex : Boire 2 litres d’eau"
          value={title}
          onChange={e => setTitle(e.target.value)}
          style={inputStyle}
          maxLength={120}
          required
        />
      </div>

      {/* Description */}
      <div className="mb-3">
        <label className="form-label" style={labelStyle}>Description (optionnel)</label>
        <textarea
          className="form-control"
          rows={3}
          placeholder="Détails, pourquoi, comment…"
          value={desc}
          onChange={e => setDesc(e.target.value)}
          style={inputStyle}
          maxLength={500}
        />
      </div>

      {/* Catégorie + Cadence + XP */}
      <div className="row g-3">
        {/* Catégorie */}
        <div className="col-12 col-md-6">
          <label className="form-label" style={labelStyle}>Catégorie *</label>
          <select
            className="form-select"
            value={categoryId}
            onChange={e => onCategoryChange(e.target.value)}
            style={inputStyle}
            disabled={loadingCats}
            required
          >
            {loadingCats && <option>Chargement…</option>}
            {!loadingCats && categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <div className="form-text" style={{ color: '#E9D5FF' }}>
            L’XP est calculée automatiquement selon tes priorités.
          </div>
        </div>

        {/* Cadence → toggle visible (pas de menu) */}
        <div className="col-12 col-md-3">
          <label className="form-label" style={labelStyle}>Cadence *</label>
          <div
            className="d-inline-flex w-100"
            role="group"
            aria-label="Choix cadence"
            style={{
              ...inputStyle,
              padding: 4,
              background: '#fff',
              border: '1px solid #e5e7eb',
            }}
          >
            <button
              type="button"
              onClick={() => setCadence('daily')}
              className="btn btn-sm flex-fill"
              aria-pressed={cadence === 'daily'}
              style={{
                borderRadius: 12,
                border: 'none',
                background: cadence === 'daily' ? '#22c55e' : 'transparent',
                color: cadence === 'daily' ? '#fff' : '#111827',
                fontWeight: 700,
              }}
            >
              Quotidien
            </button>
            <button
              type="button"
              onClick={() => setCadence('weekly')}
              className="btn btn-sm flex-fill"
              aria-pressed={cadence === 'weekly'}
              style={{
                borderRadius: 12,
                border: 'none',
                background: cadence === 'weekly' ? '#3b82f6' : 'transparent',
                color: cadence === 'weekly' ? '#fff' : '#111827',
                fontWeight: 700,
              }}
            >
              1× / semaine
            </button>
          </div>
        </div>

        {/* XP auto (affiche la valeur effective + badge bonus) */}
        <div className="col-12 col-md-3">
          <label className="form-label" style={labelStyle}>XP (auto, selon tes priorités)</label>
          <div
            className="d-flex align-items-center justify-content-between px-3"
            style={{
              ...inputStyle,
              height: 38,
              background: '#f1f5f9',
              fontWeight: 800,
              color: '#0f172a',
            }}
            aria-live="polite"
            title={loadingPrio ? 'Calcul des priorités…' : `Bonus: ${appliedBonusLabel}`}
          >
            <span>{xpEffective} XP</span>
            <span className="badge bg-secondary" style={{ fontWeight: 700 }}>
              {loadingPrio ? '…' : appliedBonusLabel}
            </span>
          </div>
          <div className="form-text" style={{ color: '#E9D5FF' }}>
            Affiché avec bonus: #1 = +50%, #2 = +25%.
          </div>
        </div>
      </div>

      {/* Submit */}
      <div className="mt-4 d-flex gap-2">
        <button className="btn btn-light" type="button" onClick={resetForm} disabled={submitting}>
          Réinitialiser
        </button>
        <button className="btn btn-success" type="submit" disabled={submitting || loadingCats}>
          {submitting ? 'Création…' : 'Créer l’objectif'}
        </button>
      </div>
    </form>
  );
}
