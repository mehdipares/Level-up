import RegisterForm from '../components/RegisterForm';
import { Link } from 'react-router-dom';
import RegisterImag from '../img/RegisterIMG.jpg';

function RegisterPage() {
  return (
    <div className='loginPage'>
      
      <RegisterForm />
       <img
        src={RegisterImag}
        className="bg d-none d-lg-block"  /* caché <992px, visible ≥992px */
        alt="Background Login"
        loading="lazy"
      />
    </div>
  );
}

export default RegisterPage;