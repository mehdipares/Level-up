import LoginForm from '../components/LoginForm';

import Loginimg from '../img/LoginIMG.jpg';

function LoginPage() {
  return (
    <div class="loginPage"> 
      
      <LoginForm />
      <img src={Loginimg} className= "bg" alt="Background Login"/>
    </div>
  );
}

export default LoginPage;