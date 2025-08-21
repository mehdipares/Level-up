import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; // Pour redirection
import Logo from '../img/logo.png';


function RegisterForm() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    try {
      await axios.post('http://localhost:3000/auth/register', {
        username,
        email,
        password
      });

      setMessage('✅ Inscription réussie ! Vous pouvez maintenant vous connecter.');
      setUsername('');
      setEmail('');
      setPassword('');
    } catch (error) {
      console.error('Erreur inscription :', error.response?.data || error.message);
      setMessage('❌ ' + (error.response?.data?.error || 'Erreur lors de l’inscription'));
    }
  };

  return (
    <div className='login'>
      <div className='logo-container'>
      <img src={Logo} className='logo' alt="logo"/>
    </div>
      <form onSubmit={handleSubmit} className="loginForm">
        
        <h2 className="loginTitle">Bienvenue dans l'ascension !</h2>

        <input
          type="text"
          placeholder="Nom d’utilisateur"
          value={username}
          onChange={e => setUsername(e.target.value)}
          required
        />
        <input
          type="email"
          placeholder="Adresse e-mail"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Mot de passe"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />

        {/* Bouton principal bleu */}
        <button type="submit" className="btn-blue">S’inscrire</button>

        {/* Bouton secondaire vert */}
        <button
          type="button"
          className="btn-green"
          onClick={() => navigate('/login')}
        >
          Se connecter
        </button>

        {message && <p className="message">{message}</p>}
      </form>
    </div>
  );
}

export default RegisterForm;
