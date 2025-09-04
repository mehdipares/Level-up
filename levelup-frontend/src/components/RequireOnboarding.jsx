// src/routes/RequireOnboarding.jsx
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import useOnboardingGuard from '../hooks/useOnboardingGuard';

export default function RequireOnboarding() {
  const { loading, authenticated, onboardingDone } = useOnboardingGuard();
  const loc = useLocation();

  // Évite tout loop si on est déjà sur /onboarding
  const alreadyOnOnboarding = loc.pathname.startsWith('/onboarding');

  if (loading) {
    return (
      <div className="container py-4">
        <div className="text-muted">Vérification de votre profil…</div>
      </div>
    );
  }

  if (!authenticated) {
    // adapte l’URL si ton app a une autre page d’auth
    return <Navigate to="/login" replace />;
  }

  if (!onboardingDone && !alreadyOnOnboarding) {
    return <Navigate to="/onboarding" replace state={{ from: loc }} />;
  }

  return <Outlet />;
}
