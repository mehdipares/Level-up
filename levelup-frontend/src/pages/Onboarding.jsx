// src/pages/Onboarding.jsx
// -----------------------------------------------------------------------------
// Page d’onboarding : pose ~15 questions (échelle 1..5), calcule les priorités,
// et empêche l’accès si l’utilisateur a déjà complété son onboarding.
// -----------------------------------------------------------------------------
//
// Points clés :
// - Guard d’accès : on lit /users/:id, si onboarding_done = 1 → redirection Dashboard
// - Chargement des questions ensuite seulement (évite un flash avant redirection)
// - Envoi des réponses à /onboarding/answers (le back met onboarding_done = 1)
// - Après succès, on affiche le résultat et un bouton "Aller au Dashboard"
// - Tous les fetch incluent l’Authorization si présent en localStorage
// -----------------------------------------------------------------------------

import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { getCurrentUserId } from '../utils/auth';

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
// value = nombre sélectionné (1..5), onChange(v) = callback quand on clique.
// name sert à grouper les radios (un seul choix possible).
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
            onChange={() => onChange(v)} // on remonte la valeur choisie
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
  // Navigation programmatique (pour rediriger vers le Dashboard)
  const navigate = useNavigate();

  // On récupère l’ID utilisateur depuis le localStorage/JWT utilitaire
  // useMemo pour figer la valeur à l’init (pas besoin de recalculer à chaque render)
  const userId = useMemo(() => getCurrentUserId() ?? null, []);

  // Langue courante (ici en dur, mais pourrait venir du profil)
  const [lang] = useState('fr');

  // États de la page
  const [loading, setLoading] = useState(true);     // vrai pendant le guard + fetch questions
  const [err, setErr] = useState(null);             // message d’erreur à afficher
  const [questions, setQuestions] = useState([]);   // tableau des questions actives

  // Navigation "une question à la fois"
  const [idx, setIdx] = useState(0);                // index de la question courante (0..N-1)
  const [answers, setAnswers] = useState({});       // dictionnaire { [question_id]: 1..5 }

  // Soumission & résultat
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);       // payload renvoyé par le back (priorities, etc.)

  // ---------------------------------------------------------------------------
  // Chargement des questions depuis le backend.
  // On appelle ce fetch SEULEMENT après le guard (voir useEffect plus bas).
  // On passe aussi user_id côté query string (permet au back de refuser si besoin).
  // Si le back répond 409 (déjà complété), on redirige directement.
  // ---------------------------------------------------------------------------
  const fetchQuestions = async () => {
    setErr(null);
    const url = `/onboarding/questions?lang=${lang}&user_id=${userId}`;
    const res = await fetch(url, { headers: authHeaders() });

    if (res.status === 409) {
      // Le backend te dit "déjà onboardé" → on renvoie au Dashboard.
      navigate('/DashBoard', { replace: true });
      return;
    }
    if (!res.ok) {
      // Lève une erreur lisible (texte brut si JSON non parseable)
      throw new Error((await res.text()) || `HTTP ${res.status}`);
    }

    const data = await res.json();
    const items = Array.isArray(data.items) ? data.items : [];
    setQuestions(items);
    setIdx(0); // on place l’index au début
  };

  // ---------------------------------------------------------------------------
  // Guard d’accès + initialisation :
  // 1) On vérifie d’abord l’utilisateur (/users/:id) pour lire onboarding_done.
  //    - s’il est TRUE/1 → redirection immédiate vers /DashBoard
  // 2) Sinon, on charge la liste des questions actives.
  //
  // Remarque: on ne met pas fetchQuestions dans les deps pour éviter le warning.
  // On séquence volontairement : le guard d’accès doit toujours s’exécuter en premier.
  // ---------------------------------------------------------------------------
  useEffect(() => {
    let alive = true; // protection si le composant est démonté pendant les fetch

    (async () => {
      if (!userId) {
        // Si on n’a pas d’ID, on ne peut pas faire l’onboarding → invite à se connecter
        setErr('Utilisateur non identifié');
        setLoading(false);
        return;
      }

      try {
        // 1) Guard : /users/:id pour savoir si l’onboarding est déjà fait
        const resUser = await fetch(`/users/${userId}`, {
          headers: authHeaders(),
          cache: 'no-store', // on veut une info fraîche
        });
        if (!resUser.ok) throw new Error((await resUser.text()) || `HTTP ${resUser.status}`);
        const u = await resUser.json();

        // Si déjà fait → redirection (et on ne charge PAS les questions)
        if (alive && (u.onboarding_done === 1 || u.onboarding_done === true)) {
          navigate('/DashBoard', { replace: true });
          return;
        }

        // 2) Charger les questions si pas encore onboardé
        await fetchQuestions();
      } catch (e) {
        if (alive) setErr(e.message || 'Erreur de chargement');
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, lang]); // on relance si l’ID ou la langue change

  // ---------------------------------------------------------------------------
  // Derivés d’affichage (progression, question en cours, etc.)
  // ---------------------------------------------------------------------------
  const total = questions.length;                           // nombre total de questions
  const current = questions[idx] || null;                   // question courante (ou null si vide)
  const answeredCount = Object.keys(answers).length;        // nombre de réponses données
  const percent = total ? Math.round(((idx + 1) / total) * 100) : 0; // progression visuelle

  // Enregistrer une réponse pour une question donnée
  const setAnswer = (qid, v) => {
    setAnswers(prev => ({ ...prev, [qid]: v }));
  };

  // ---------------------------------------------------------------------------
  // Soumission : on a besoin d’au moins 12 réponses valides.
  // On envoie au back, qui calcule les priorités, met onboarding_done = 1,
  // et renvoie la liste triée (avec rank & score).
  // ---------------------------------------------------------------------------
  const handleSubmit = async () => {
    // On aplatit le dictionnaire => [{question_id, value}, ...]
    const flat = Object.entries(answers)
      .map(([qid, val]) => ({ question_id: Number(qid), value: Number(val) }))
      .filter(a => a.question_id > 0 && a.value >= 1 && a.value <= 5);

    if (!userId) return alert('Connecte-toi pour valider le questionnaire.');
    if (flat.length < 12) return alert('Merci de répondre à au moins 12 questions.');

    setSubmitting(true);
    setErr(null);
    try {
      const res = await fetch('/onboarding/answers', {
        method: 'POST',
        headers: authHeaders(true),
        body: JSON.stringify({ user_id: Number(userId), language: lang, answers: flat })
      });

      // Double sécurité : si le back répond 409 (déjà complété), on redirige.
      if (res.status === 409) {
        navigate('/DashBoard', { replace: true });
        return;
      }
      if (!res.ok) throw new Error((await res.text()) || `HTTP ${res.status}`);

      const payload = await res.json();
      // payload attendu : { onboarding_done: true, user_id, priorities: [...] }
      setResult(payload); // déclenche l’affichage du récap
    } catch (e) {
      setErr(e.message || 'Erreur lors de la soumission');
    } finally {
      setSubmitting(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Rendu : 3 états possibles
  // - loading : on affiche un loader
  // - result   : on affiche le récap des priorités + bouton pour partir au Dashboard
  // - sinon    : on affiche l’UI "1 question à la fois"
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
          {/* Affiche un éventuel message d’erreur (rare) même après résultat */}
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
            {/* IMPORTANT : utiliser la même casse/orthographe que votre route App.js */}
            <Link className="btn btn-primary" to="/DashBoard">Aller au Dashboard</Link>
            {/* Permet de revenir aux réponses pour les modifier avant envoi (UX optionnelle) */}
            <button className="btn btn-outline-secondary" onClick={() => setResult(null)}>
              Revoir mes réponses
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Vue principale : 1 question par écran, navigation "précédent/suivant"
  return (
    <div className="DashBoard">
      <Navbar />
      <div className="container py-4">
        <h2>Onboarding</h2>

        {/* Affichage d’une erreur éventuelle (ex : réseau) */}
        {err && <div className="alert alert-danger mt-2">{String(err)}</div>}

        <p className="text-muted mb-3">
          Réponds sur une échelle de 1 (pas du tout) à 5 (tout à fait).
          Il faut répondre à <b>au moins 12</b> questions sur {total}.
        </p>

        {/* Barre de progression (basée sur l’index courant) */}
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

        {/* Carte de la question courante */}
        {current ? (
          <div className="p-4 border rounded bg-white">
            <div className="mb-3" style={{ fontWeight: 600 }}>
              {current.question}
            </div>
            <Likert
              name={`q-${current.id}`}               // groupe radio unique
              value={answers[current.id] ?? 0}        // valeur sélectionnée (0 = pas encore répondu)
              onChange={(v) => setAnswer(current.id, v)} // enregistre la réponse
            />
          </div>
        ) : (
          <div className="alert alert-warning">Aucune question active pour le moment.</div>
        )}

        {/* Boutons de navigation et soumission */}
        <div className="d-flex justify-content-between mt-3">
          <button
            className="btn btn-outline-secondary"
            disabled={idx === 0}
            onClick={() => setIdx(i => Math.max(0, i - 1))}
          >
            ← Précédent
          </button>

          {idx < total - 1 ? (
            // Tant qu’on n’est pas à la fin : "Passer" et "Suivant"
            <div className="d-flex gap-2">
              {/* "Passer" : autorise d’avancer sans répondre (si tu veux forcer la réponse, supprime ce bouton) */}
              <button
                className="btn btn-outline-secondary"
                onClick={() => setIdx(i => Math.min(total - 1, i + 1))}
              >
                Passer →
              </button>
              {/* "Suivant" : on demande une réponse pour continuer */}
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
            // Dernière question : bouton de soumission
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
