import Logo from '../img/logoblanc.png';

export default function Navbar() {        // <-- Composant en PascalCase
  return (
    <nav className="navbar navbar-dark navbar-custom position-relative">
      <div className="container-fluid d-flex justify-content-center">
        {/* Bouton burger à gauche */}
        <button
          className="navbar-toggler position-absolute start-0 ms-2"
          type="button"
          data-bs-toggle="offcanvas"
          data-bs-target="#offcanvasNavbar"
          aria-controls="offcanvasNavbar"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        {/* Logo centré */}
        <a className="navbar-brand mx-auto" href="#">
          <img src={Logo} className="DashBoardLogo" alt="Logo DashBoardHead" />
        </a>
      </div>

      {/* Menu offcanvas */}
      <div
        className="offcanvas offcanvas-start text-bg-dark offcanvas-custom"
        tabIndex="-1"
        id="offcanvasNavbar"
        aria-labelledby="offcanvasNavbarLabel"
      >
        <div className="offcanvas-header">
          <h5 className="offcanvas-title" id="offcanvasNavbarLabel">Menu</h5>
          <button
            type="button"
            className="btn-close btn-close-white"
            data-bs-dismiss="offcanvas"
            aria-label="Close"
          ></button>
        </div>
        <div className="offcanvas-body">
          <ul className="navbar-nav">
            <li className="nav-item">
              <a className="nav-link" href="/DashBoard">DashBoard</a>
            </li>
            <li className="nav-item">
              <a className="nav-link" href="GoalChoice">GoalChoice</a>
            </li>
            <li className="nav-item">
              <a className="nav-link" href="CreateGoal">CreateGoal</a>
            </li>
            <li className="nav-item">
              <a className="nav-link" href="User">Profil</a>
            </li>
            <li className="nav-item">
              <a className="nav-link" href="Priorities">Priorités</a>
            </li>
            <li className="nav-item">
              <a className="nav-link" href="Legal">Legal</a>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}

