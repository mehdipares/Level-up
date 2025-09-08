// src/pages/Onboarding.jsx
// -----------------------------------------------------------------------------
// Page d’onboarding : pose ~15 questions (échelle 1..5), calcule les priorités,
// et empêche l’accès si l’utilisateur a déjà complété son onboarding.
// -----------------------------------------------------------------------------

import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { getCurrentUserId } from '../utils/auth';
import API_BASE from '../config/api'; // 👈 base URL API

// -----------------------------------------------------------------------------
// Utilitaire d’en-têtes HTTP : ajoute "Authorization: Bearer ..." si on a un token
// et "Content-Type: application/json" quand on envoie un body JSON.
// -----------------------------------------------------------------------------
function authHeaders(json = false) {
  const h = new Headers({ Accept: 'application/json' });
  const t = localStorage.getItem('token');
  if (t) h.set('Authorization', `Bearer ${t}`);
  if (json) h.set('Content-Type', 'application/json');
  return h;
}

// -----------------------------------------------------------------------------
// Composant "Likert" : l’échelle 1..5 pour chaque question.
// -----------------------------------------------------------------------------
function Likert({ value, onChange, name }) {
  return (
    <div className="d-flex align-items-center gap-3 flex-wrap">
      {[1, 2, 3, 4, 5].map(v => (
        <label key={v} className="d-inline-flex align-items-center gap-2">
          <input
            type="radio"
            name={name}
            className="form-check-input"
            checked={value === v}
            onChange={() => onChange(v)}
          />
          <small className="text-muted fw-semibold">{v}</small>
        </label>
      ))}
    </div>
  );
}

// -----------------------------------------------------------------------------
// Page principale
// -----------------------------------------------------------------------------
export default function Onboarding() {
  const navigate = useNavigate();
  const userId = useMemo(() => getCurrentUserId() ?? null, []);
  const [lang] = useState('fr');

  const [loading, setLoading]   = useState(true);
  const [err, setErr]           = useState(null);
  const [questions, setQuestions] = useState([]);

  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState({});

  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  // ---------------------------------------------------------------------------
  // Chargement des questions (appelé après le guard)
  // ---------------------------------------------------------------------------
  const fetchQuestions = async () => {
    setErr(null);
    const url = `${API_BASE}/onboarding/questions?lang=${lang}&user_id=${userId}`; // 👈
    const res = await fetch(url, { headers: authHeaders() });

    if (res.status === 409) {
      navigate('/DashBoard', { replace: true });
      return;
    }
    if (!res.ok) throw new Error((await res.text()) || `HTTP ${res.status}`);

    const data = await res.json();
    const items = Array.isArray(data.items) ? data.items : [];
    setQuestions(items);
    setIdx(0);
  };

  // ---------------------------------------------------------------------------
  // Guard d’accès + init (vérifie /users/:id puis charge les questions)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    let alive = true;

    (async () => {
      if (!userId) {
        setErr('Utilisateur non identifié');
        setLoading(false);
        return;
      }

      try {
        // Guard
        const resUser = await fetch(`${API_BASE}/users/${userId}`, { // 👈
          headers: authHeaders(),
          cache: 'no-store',
        });
        if (!resUser.ok) throw new Error((await resUser.text()) || `HTTP ${resUser.status}`);
        const u = await resUser.json();

        if (alive && (u.onboarding_done === 1 || u.onboarding_done === true)) {
          navigate('/DashBoard', { replace: true });
          return;
        }

        await fetchQuestions();
      } catch (e) {
        if (alive) setErr(e.message || 'Erreur de chargement');
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, lang]);

  // ---------------------------------------------------------------------------
  // Dérivés d’affichage
  // ---------------------------------------------------------------------------
  const total = questions.length;
  const current = questions[idx] || null;
  const percent = total ? Math.round(((idx + 1) / total) * 100) : 0;

  const setAnswer = (qid, v) => setAnswers(prev => ({ ...prev, [qid]: v }));

  // ---------------------------------------------------------------------------
  // Soumission du questionnaire
  // ---------------------------------------------------------------------------
  const handleSubmit = async () => {
    const flat = Object.entries(answers)
      .map(([qid, val]) => ({ question_id: Number(qid), value: Number(val) }))
      .filter(a => a.question_id > 0 && a.value >= 1 && a.value <= 5);

    if (!userId) return alert('Connecte-toi pour valider le questionnaire.');
    if (flat.length < 12) return alert('Merci de répondre à au moins 12 questions.');

    setSubmitting(true);
    setErr(null);
    try {
      const res = await fetch(`${API_BASE}/onboarding/answers`, { // 👈
        method: 'POST',
        headers: authHeaders(true),
        body: JSON.stringify({ user_id: Number(userId), language: lang, answers: flat })
      });

      if (res.status === 409) {
        navigate('/DashBoard', { replace: true });
        return;
      }
      if (!res.ok) throw new Error((await res.text()) || `HTTP ${res.status}`);

      const payload = await res.json(); // { onboarding_done, user_id, priorities: [...] }
      setResult(payload);
    } catch (e) {
      setErr(e.message || 'Erreur lors de la soumission');
    } finally {
      setSubmitting(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Rendus
  // ---------------------------------------------------------------------------
  if (loading) {
    return (
      <div className="DashBoard">
        <Navbar />
        <div className="container py-4">
          <h2>Onboarding</h2>
          <div>Chargement…</div>
        </div>
      </div>
    );
  }

  if (result) {
    const list = Array.isArray(result.priorities) ? result.priorities : [];
    return (
      <div className="DashBoard">
        <Navbar />
        <div className="container py-4">
          <h2>Tes priorités 💡</h2>
          {err && <div className="alert alert-danger mt-2">{String(err)}</div>}
          <p className="text-muted">Catégorie #1 : +50% d’XP · Catégorie #2 : +25%.</p>

          <ul className="list-unstyled d-flex flex-column gap-2">
            {list.map(row => (
              <li key={row.category_id} className="p-3 border rounded bg-white">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <strong>#{row.rank} — {row.category_name}</strong>
                  <small>{row.score}%</small>
                </div>
                <div className="progress" role="progressbar" aria-valuemin="0" aria-valuemax="100">
                  <div className="progress-bar" style={{ width: `${Math.round(row.score)}%` }} />
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-4 d-flex gap-2">
            <Link className="btn btn-primary" to="/DashBoard">Aller au Dashboard</Link>
            <button className="btn btn-outline-secondary" onClick={() => setResult(null)}>
              Revoir mes réponses
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Vue principale : 1 question par écran
  return (
    <div className="DashBoard">
      <Navbar />
      <div className="container py-4">
        <h2>Onboarding</h2>

        {err && <div className="alert alert-danger mt-2">{String(err)}</div>}

        <p className="text-muted mb-3">
          Réponds sur une échelle de 1 (pas du tout) à 5 (tout à fait).
          Il faut répondre à <b>au moins 12</b> questions sur {total}.
        </p>

        <div className="d-flex align-items-center gap-3 mb-3">
          <div className="flex-grow-1">
            <div className="progress" role="progressbar" aria-valuemin="0" aria-valuemax="100">
              <div className="progress-bar" style={{ width: `${percent}%` }} />
            </div>
          </div>
          <small>
            Question {Math.min(idx + 1, total)} / {total} — {Object.keys(answers).length}/{total} répondues
          </small>
        </div>

        {current ? (
          <div className="p-4 border rounded bg-white">
            <div className="mb-3" style={{ fontWeight: 600 }}>
              {current.question}
            </div>
            <Likert
              name={`q-${current.id}`}
              value={answers[current.id] ?? 0}
              onChange={(v) => setAnswer(current.id, v)}
            />
          </div>
        ) : (
          <div className="alert alert-warning">Aucune question active pour le moment.</div>
        )}

        <div className="d-flex justify-content-between mt-3">
          <button
            className="btn btn-outline-secondary"
            disabled={idx === 0}
            onClick={() => setIdx(i => Math.max(0, i - 1))}
          >
            ← Précédent
          </button>

          {idx < total - 1 ? (
            <div className="d-flex gap-2">
              <button
                className="btn btn-outline-secondary"
                onClick={() => setIdx(i => Math.min(total - 1, i + 1))}
              >
                Passer →
              </button>
              <button
                className="btn btn-primary"
                onClick={() => setIdx(i => Math.min(total - 1, i + 1))}
                disabled={(answers[current?.id] ?? 0) === 0}
                title={(answers[current?.id] ?? 0) === 0 ? 'Choisis une réponse pour continuer' : ''}
              >
                Suivant →
              </button>
            </div>
          ) : (
            <button
              className="btn btn-success"
              disabled={submitting || Object.keys(answers).length < 12}
              onClick={handleSubmit}
              title={Object.keys(answers).length < 12 ? 'Réponds à au moins 12 questions' : 'Envoyer mes réponses'}
            >
              {submitting ? 'Envoi…' : 'Valider mes réponses'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
