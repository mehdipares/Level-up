// src/pages/DashBoard.jsx
import XPBar from '../components/XPBar';
import Navbar from '../components/Navbar';
import QuoteOfTheDay from '../components/QuoteOfTheDay';
import UserGoals from '../components/Dashboard/UserGoals';
import UserPrioritiesCard from '../components/Dashboard/UserPrioritiesCard'; // ✅ nouveau

export default function DashBoard() {
  return (
    <div className="DashBoard">
      <Navbar />

      <div className="container py-3">
        {/* XPBar récupère /users/:id/xp automatiquement */}
        <XPBar />
        {/* Citation motivante */}
        <QuoteOfTheDay />
        {/* Objectifs actifs (user_goals) */}
        <UserGoals className="mt-3" />
        {/* Priorités utilisateur (remplace l'ancien DashboardStats) */}
        <UserPrioritiesCard className="mt-3" />
      </div>
    </div>
  );
}
