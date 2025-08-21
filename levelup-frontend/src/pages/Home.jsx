import Logo from '../img/logo.png';
import Muscle from '../img/muscle2.png';
import Objectif from "../img/objectif.png";
import Routine from "../img/routine.png";
import { useNavigate } from 'react-router-dom';


function HomePage() {
    const navigate = useNavigate();

  return (
    <div className='HomePage'>
      <div className="Head">
            <div className="HeadContainer">
                <img src={Logo} className= "HeadLogo" alt="Logo HomeHead"/>
                <div className='HeadHomeButton'>
                    <button
                        type="button"
                        className="HeadButton"
                        onClick={() => navigate('/login')}> Se connecter
                    </button>
                    <button
                        type="button"
                        className="HeadButton"
                        onClick={() => navigate('/Register')}> S'inscrire
                    </button>
            </div>
        </div>
      </div>
      <div className='IconContainer'>
            <div className='IconBox'>
                <img src={Muscle} className='Icon' alt ="Muscle Icon"/>
                <h2>Fixe tes objectifs</h2>
                <p>routines sportives et mentales adaptées à ton niveau.</p>

            </div>
            
            <div className='IconBox'>
                <img src={Objectif} className='Icon' alt ="Goal Icon"/>
                <h2>Accomplis ta routine</h2>
                <p>Coche chaque action quotidienne et gagne de l'XP.</p>
            </div>
            
            <div className='IconBox'>
                <img src={Routine} className='Icon' alt ="Routine Icon"/>
                <h2>Transforme-toi</h2>
                <p> Progresse vers une version plus forte de toi-même.</p>
            </div>
        </div>
    </div>
  );
}
export default HomePage;