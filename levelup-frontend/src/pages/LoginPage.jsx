import LoginForm from '../components/LoginForm';

import Loginimg from '../img/LoginIMG.jpg';

function LoginPage() {
  return (
    <div class="loginPage"> 
      
      <LoginForm />
       <img
        src={Loginimg}
        className="bg d-none d-lg-block"  /* caché <992px, visible ≥992px */
        alt="Background Login"
        loading="lazy"
      />
    </div>
  );
}

export default LoginPage;