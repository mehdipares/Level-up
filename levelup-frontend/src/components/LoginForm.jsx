// Importation de React et du hook useState pour gérer l'état des champs du formulaire
import { useState } from 'react';

// Importation d'axios pour effectuer des requêtes HTTP vers l'API
import axios from 'axios';

// Importation du logo
import Logo from '../img/logo.png';

import { useNavigate } from 'react-router-dom';

import API_BASE from "../config/api";

// Utilitaire: décoder le payload d'un JWT (base64url)
function decodeJWT(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length < 2) return null;
  try {
    const payload = parts[1];
    const pad = '='.repeat((4 - (payload.length % 4)) % 4);
    const b64 = (payload + pad).replace(/-/g, '+').replace(/_/g, '/');
    const json = atob(b64);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function LoginForm() {
  // Déclaration des états pour stocker l'email, le mot de passe et un message (erreur ou succès)
  const [email, setEmail] = useState('');       // Champ email
  const [password, setPassword] = useState(''); // Champ mot de passe
  const [message, setMessage] = useState('');   // Message affiché après tentative de connexion
  const navigate = useNavigate();

  // Fonction exécutée lors de la soumission du formulaire
  const handleSubmit = async (e) => {
    e.preventDefault(); // Empêche le rechargement de la page
    setMessage('');     // Réinitialise le message

    try {
      // Envoi de la requête POST vers l'API backend pour tenter une connexion
      const res = await axios.post('http://localhost:3000/auth/login', {
        email,
        password
      });

      // Récupération du token renvoyé par le backend
      const { token } = res.data;

      // Sauvegarde du token dans le localStorage pour rester connecté
      localStorage.setItem('token', token);

      // Décoder le token pour récupérer l'id utilisateur (payload: { id, ... })
      const payload = decodeJWT(token);
      const userId = payload?.id ?? payload?.userId ?? payload?.sub ?? null;

      // Sauvegarder aussi l'utilisateur minimal pour que le front puisse lire l'id
      if (userId) {
        localStorage.setItem('user', JSON.stringify({
          id: userId,
          email: payload?.email || email
        }));
      }

      // Redirection vers Dashboard
      navigate('/DashBoard');
    } catch (error) {
      // Gestion des erreurs (mauvais identifiants, problème serveur, etc.)
      console.error('Erreur de connexion :', error);
      setMessage('❌ Email ou mot de passe invalide');
    }
  };

  // Rendu du composant
  return (
    <div className="login">
      {/* Conteneur pour afficher le logo */}
      <div className='logo-container'>
        <img src={Logo} className='logo' alt="logo"/>
      </div>

      {/* Formulaire de connexion */}
      <form onSubmit={handleSubmit} className="loginForm">
        
        {/* Titre de bienvenue */}
        <h2 className="loginTitle">Contents de te revoir !</h2>

        {/* Champ email */}
        <input
          type="email"
          placeholder="Adresse e-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)} // Mise à jour de l'état email
          required
        />

        {/* Champ mot de passe */}
        <input
          type="password"
          placeholder="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)} // Mise à jour de l'état password
          required
        />

        {/* Bouton pour soumettre le formulaire */}
        <button type="submit" className="btn-blue">Se connecter</button>

        {/* Bouton pour rediriger vers la page d'inscription */}
        <button
          type="button"
          className="btn-green"
          onClick={() => window.location.href = '/register'}
        >
          S’inscrire
        </button>

        {/* Affichage du message (succès ou erreur) */}
        {message && <p className="message">{message}</p>}
      </form>
    </div>
  );
}

export default LoginForm;
