import RegisterForm from '../components/RegisterForm';
import { Link } from 'react-router-dom';
import RegisterImag from '../img/RegisterIMG.jpg';

function RegisterPage() {
  return (
    <div className='loginPage'>
      
      <RegisterForm />
      <img src={RegisterImag} className= "bg" alt="Background Login"/>
    </div>
  );
}

export default RegisterPage;