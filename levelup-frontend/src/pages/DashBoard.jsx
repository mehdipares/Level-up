// src/pages/DashBoard.jsx
import XPBar from '../components/XPBar';
import Navbar from '../components/Navbar';
import QuoteOfTheDay from '../components/QuoteOfTheDay';
import UserGoals from '../components/Dashboard/UserGoals';
import UserPrioritiesCard from '../components/Dashboard/UserPrioritiesCard';
import InstallPrompt from '../components/InstallPrompt'; // ⬅️ NEW

export default function DashBoard() {
  return (
    <div className="DashBoard">
      <Navbar />

      <div className="container py-3">
        {/* ⬇️ Bannière d’installation PWA */}
        <InstallPrompt className="mb-3" />

        {/* XPBar récupère /users/:id/xp automatiquement */}
        <XPBar />

        {/* Citation motivante */}
        <QuoteOfTheDay />

        {/* Objectifs actifs (user_goals) */}
        <UserGoals className="mt-3" />

        {/* Priorités utilisateur */}
        <UserPrioritiesCard className="mt-3" />
      </div>
    </div>
  );
}
