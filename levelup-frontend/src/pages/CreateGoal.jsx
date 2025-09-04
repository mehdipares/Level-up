// src/pages/CreateGoal.jsx
import Navbar from '../components/Navbar';
import CreateGoalForm from '../components/CreateGoal/CreateGoalForm';

export default function CreateGoal() {
  return (
    <div className="DashBoard">
      <Navbar />

      <div className="container py-3">
        <div
          className="p-3 p-sm-4"
          style={{
            background: 'linear-gradient(180deg,#7c3aed,#5b21b6)',
            color: '#fff',
            borderRadius: 28,
            boxShadow: '0 12px 30px rgba(124,58,237,.25)',
          }}
        >
          <h2 className="m-0 mb-2" style={{ fontWeight: 900, color: '#F8FAFC' }}>
            Nouvel objectif personnalisé
          </h2>
          <p className="mb-3" style={{ opacity: 0.9 }}>
            Crée ton propre objectif : il apparaîtra ensuite dans l’espace Gestion.
          </p>

          <CreateGoalForm />
        </div>
      </div>
    </div>
  );
}
