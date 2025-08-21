
import XPBar from '../components/XPBar';
import Navbar from '../components/Navbar';


function DashBoard() {
return (
    <div className="DashBoard"> 
        <Navbar></Navbar>

        <div className="container py-3">
        <XPBar currentXP={320} nextLevelXP={500} level={7} />
        </div>
                
            
    </div>
);
}
export default DashBoard;