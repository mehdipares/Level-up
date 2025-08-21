
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import HomePage from './pages/Home';
import DashBoard from "./pages/DashBoard";
import MyGoals from "./pages/MyGoals";
import CreateGoal from "./pages/CreateGoal";
import GoalChoice from "./pages/CreateGoal";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path='/Home' element={<HomePage />} />
        <Route path="/DashBoard" element={<DashBoard />} />
        <Route path ="/MyGoals" element={<MyGoals/>} /> 
        <Route path ='/CreateGoal' element ={<MyGoals/>} />
        <Route path ='/GoalChoice' element ={<GoalChoice/>} />
        {/* Redirection par défaut */}
        <Route path="*" element={<Navigate to="/Home" />} />
      </Routes>
    </Router>
  );
}

export default App;