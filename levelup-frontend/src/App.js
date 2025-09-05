import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import HomePage from './pages/Home';
import DashBoard from "./pages/DashBoard";
import MyGoals from "./pages/MyGoals";
import CreateGoal from "./pages/CreateGoal";
import GoalChoice from "./pages/GoalChoice";
import Onboarding from "./pages/Onboarding";
import User from "./pages/user";
import Priorities from "./pages/Priorities";
import Legal from './pages/Legal';

// ✅ importe ton guard (là où tu l’as créé)
import RequireOnboarding from './components/RequireOnboarding';

function App() {
  return (
    <Router>
      <Routes>
        {/* Routes publiques */}
        <Route path="/Home" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        {/* Onboarding doit rester accessible sans guard */}
        <Route path="/Onboarding" element={<Onboarding />} />

        {/* Routes protégées par le guard (auth + onboarding_done) */}
        <Route element={<RequireOnboarding />}>
          <Route path="/DashBoard" element={<DashBoard />} />
          <Route path="/MyGoals" element={<MyGoals />} />
          <Route path="/CreateGoal" element={<CreateGoal />} />
          <Route path="/GoalChoice" element={<GoalChoice />} />
          <Route path="/User" element={<User />} />
          <Route path="/Priorities" element={<Priorities />} />
          <Route path="/Legal" element={<Legal />} />
          
        </Route>

        {/* Redirection par défaut */}
        <Route path="*" element={<Navigate to="/Home" />} />
      </Routes>
    </Router>
  );
}

export default App;
