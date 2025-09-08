import { useEffect, useMemo, useState } from 'react';
import Navbar from '../components/Navbar';
import { getCurrentUserId } from '../utils/auth';
import API_BASE from '../config/api'; // 👈 base URL API (local/prod)

import CatalogCard from '../components/GoalChoice/CatalogCard';
import ManageCard from '../components/GoalChoice/ManageCard';
import '../styles/Goalchoice/goal-cards.css'; // pour les styles des cartes + toast

export default function GoalChoice() {
  const userId = useMemo(() => getCurrentUserId() ?? null, []);

  // ✅ toast non-bloquant (utilise .toast-lite en CSS)
  const [flash, setFlash] = useState(null);

  const [items, setItems] = useState([]);
  const [q, setQ] = useState('');
  const [cadence] = useState('daily');

  const [catMap, setCatMap] = useState({});
  const [filter, setFilter] = useState('tous'); // 'tous' | 'perso' | <cat>
  const [busy, setBusy] = useState(null);
  const [err, setErr] = useState(null);

  // ----- Espace Gestion -----
  const [manageStatus, setManageStatus] = useState('all'); // ✅ par défaut 'all'
  const [goals, setGoals] = useState([]);
  const [mgmtBusy, setMgmtBusy] = useState(null);
  const [cadenceEdit, setCadenceEdit] = useState({}); // ✅ objet (pas null)

  // ✅ fetchJSON avec base URL + token Authorization
  const fetchJSON = async (url, init) => {
    const h = new Headers(init?.headers || {});
    h.set('Accept', 'application/json');
    const t = localStorage.getItem('token');
    if (t) h.set('Authorization', `Bearer ${t}`);
    if (init?.body && !h.has('Content-Type')) h.set('Content-Type', 'application/json');

    const fullUrl = url.startsWith('http') ? url : `${API_BASE}${url}`; // 👈 préfixe auto
    const res = await fetch(fullUrl, { ...init, headers: h });
    if (!res.ok) {
      let message = `HTTP ${res.status}`;
      try { message = (await res.json())?.error || (await res.text()) || message; } catch {}
      throw new Error(message);
    }
    try { return await res.json(); } catch { return null; }
  };

  const loadCategories = async () => {
    try {
      const arr = await fetchJSON('/categories', { cache: 'no-store' });
      const map = {};
      (Array.isArray(arr) ? arr : []).forEach((c) => { map[(c.name || '').toLowerCase()] = c.id; });
      setCatMap(map);
    } catch {}
  };

  // 👉 prend en compte 'perso' (owner=me) et les catégories (category_id)
  const loadTemplates = async () => {
    const params = new URLSearchParams();
    params.set('enabled', '1');
    if (q) params.set('q', q);

    if (filter === 'perso') {
      params.set('owner', 'me');
    } else if (filter !== 'tous') {
      const catId = catMap[filter];
      if (catId) params.set('category_id', String(catId));
    }

    try {
      const arr = await fetchJSON(`/goal-templates?${params.toString()}`, { cache: 'no-store' });
      setItems(Array.isArray(arr) ? arr : (arr?.rows || arr?.data || []));
      setErr(null);
    } catch (e) {
      const msg = e.message || 'Erreur chargement';
      if (filter === 'perso' && (msg.includes('401') || msg.toLowerCase().includes('auth'))) {
        setItems([]);
        setErr('Connecte-toi pour voir tes objectifs perso.');
      } else {
        setErr(msg);
      }
    }
  };

  const loadUserGoals = async (status = manageStatus) => {
    if (!userId) return;
    try {
      const arr = await fetchJSON(`/users/${userId}/user-goals?status=${status}`, { cache: 'no-store' });
      const rows = Array.isArray(arr) ? arr : (arr?.rows || arr?.data || []);
      setGoals(rows);
      const map = {};
      rows.forEach((g) => {
        map[g.id] = g.cadence || (g.effective_frequency_type === 'weekly' ? 'weekly' : 'daily');
      });
      setCadenceEdit(map);
    } catch (e) {
      console.error('loadUserGoals', e);
    }
  };

  // Mount
  useEffect(() => {
    loadCategories();
    loadTemplates();
    loadUserGoals('all'); // ✅ charge tout au départ
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 🔍 Recherche dynamique (debounce)
  useEffect(() => {
    const id = setTimeout(() => { loadTemplates(); }, 300);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  // 🔁 Filtre changed
  useEffect(() => {
    loadTemplates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  // 🔁 Catégories prêtes
  useEffect(() => {
    if (filter !== 'tous' && filter !== 'perso' && Object.keys(catMap).length) {
      loadTemplates();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catMap]);

  const addToUser = async (tplId) => {
    if (!userId) return alert('Connecte-toi');
    setBusy(tplId);
    try {
      await fetchJSON(`/users/${userId}/user-goals`, {
        method: 'POST',
        body: JSON.stringify({ template_id: Number(tplId), cadence }),
      });
      // ✅ toast non bloquant
      setFlash({ type: 'success', text: 'Ajouté à tes objectifs ✅' });
      setErr(null);
      await loadUserGoals(manageStatus);
    } catch (e) {
      alert(e.message);
    } finally {
      setBusy(null);
    }
  };

  // auto-hide du toast après 2.2s
  useEffect(() => {
    if (!flash) return;
    const id = setTimeout(() => setFlash(null), 2200);
    return () => clearTimeout(id);
  }, [flash]);

  // ⚠️ en mode 'perso', on ne re-filtre pas côté client (déjà fait par l'API)
  const byCategory = (g) => {
    if (filter === 'tous' || filter === 'perso') return true;
    const wantedId = catMap[filter];
    if (wantedId && g.category_id) return Number(g.category_id) === Number(wantedId);
    const catText = ((g.category?.name || g.category || g.type || '') + '').toLowerCase();
    return catText.includes(filter);
  };

  // Gestion handlers
  const archiveUG = async (ugid) => {
    setMgmtBusy(ugid);
    try {
      await fetchJSON(`/users/${userId}/user-goals/${ugid}/archive`, { method: 'PATCH' });
      await loadUserGoals(manageStatus);
    } catch (e) {
      alert(e.message);
    } finally {
      setMgmtBusy(null);
    }
  };
  const unarchiveUG = async (ugid) => {
    setMgmtBusy(`unarch-${ugid}`);
    try {
      await fetchJSON(`/users/${userId}/user-goals/${ugid}/unarchive`, { method: 'PATCH' });
      await loadUserGoals(manageStatus);
    } catch (e) {
      alert(e.message);
    } finally {
      setMgmtBusy(null);
    }
  };
  const deleteUG = async (ugid) => {
    if (!window.confirm('Supprimer définitivement cet objectif archivé ? Cette action est irréversible.')) return;
    setMgmtBusy(`del-${ugid}`);
    try {
      await fetchJSON(`/users/${userId}/user-goals/${ugid}`, { method: 'DELETE' });
      await loadUserGoals(manageStatus);
    } catch (e) {
      alert(e.message);
    } finally {
      setMgmtBusy(null);
    }
  };
  const applyCadence = async (ugid, cadenceValue) => {
    setMgmtBusy(`sched-${ugid}`);
    try {
      const normalized = cadenceValue === 'weekly' ? 'weekly' : 'daily';
      await fetchJSON(`/users/${userId}/user-goals/${ugid}/schedule`, {
        method: 'PATCH',
        body: JSON.stringify({ cadence: normalized }),
      });
      await loadUserGoals(manageStatus);
      alert('Cadence mise à jour ✅');
    } catch (e) {
      alert(e.message);
    } finally {
      setMgmtBusy(null);
    }
  };

  // Inclut 'perso' pour le composant
  const categories = ['tous', 'perso', ...Object.keys(catMap)];
  const filtered = items.filter(byCategory);

  return (
    <div className="DashBoard">
      <Navbar />

      {/* ✅ Toast centré stylé (utilise .toast-lite en CSS) */}
      {flash && (
        <div
          className={`toast-lite ${flash.type === 'success' ? 'toast-success' : ''}`}
          role="status"
          aria-live="polite"
        >
          {flash.text}
        </div>
      )}

      <div className="container py-3">
        {/* Carte BLEUE : catalogue */}
        <CatalogCard
          q={q}
          onChangeQ={setQ}
          categories={categories}
          activeFilter={filter}
          onChangeFilter={setFilter}
          filteredItems={filtered}
          onAdd={addToUser}
          busyId={busy}
        />

        {err && <div className="text-danger mt-2">{err}</div>}

        {/* Carte VIOLETTE : gestion */}
        <ManageCard
          goals={goals}                 // ✅ bon prop name
          manageStatus={manageStatus}   // ✅ bon prop name
          onChangeStatus={async (v) => {
            setManageStatus(v);
            await loadUserGoals(v);
          }}
          onRefresh={() => loadUserGoals(manageStatus)}
          cadenceEdit={cadenceEdit}
          setCadenceEdit={setCadenceEdit}
          mgmtBusy={mgmtBusy}
          onArchive={archiveUG}
          onUnarchive={unarchiveUG}
          onDelete={deleteUG}
          onApplyCadence={applyCadence}
        />
      </div>
    </div>
  );
}
