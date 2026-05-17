import { Link, NavLink, useNavigate } from "react-router-dom";
import { api } from "../api";

export default function Navbar({ user, setUser }) {
  const navigate = useNavigate();

  async function handleLogout() {
    try {
      await api.logout();
    } finally {
      setUser(null);
      navigate("/");
    }
  }

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary shadow-sm">
      <div className="container">
        <Link className="navbar-brand fw-semibold" to="/">
          <i className="bi bi-journal-bookmark-fill me-2" />
          QuizLab
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#mainNavbar"
          aria-controls="mainNavbar"
          aria-expanded="false"
          aria-label="Переключить навигацию"
        >
          <span className="navbar-toggler-icon" />
        </button>

        <div className="collapse navbar-collapse" id="mainNavbar">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            <li className="nav-item">
              <NavLink className="nav-link" to="/">
                <i className="bi bi-house me-1" />
                Главная
              </NavLink>
            </li>

            {user && (
              <>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/tests/create">
                    <i className="bi bi-plus-circle me-1" />
                    Создать тест
                  </NavLink>
                </li>

                <li className="nav-item">
                  <NavLink className="nav-link" to="/reports">
                    <i className="bi bi-bar-chart me-1" />
                    Отчёты
                  </NavLink>
                </li>
              </>
            )}
          </ul>

          <ul className="navbar-nav ms-auto mb-2 mb-lg-0">
            {user ? (
              <>
                <li className="nav-item">
                  <NavLink
                    className="nav-link"
                    to={`/profiles/${user.username}`}
                  >
                    <i className="bi bi-person-circle me-1" />
                    <span className="d-none d-lg-inline me-1">{user.name}</span>
                    {/* <span className="fw-semibold">@{user.username}</span> */}
                  </NavLink>
                </li>

                <li className="nav-item">
                  <button
                    className="btn btn-link nav-link"
                    type="button"
                    onClick={handleLogout}
                  >
                    <i className="bi bi-box-arrow-right me-1" />
                    Выйти
                  </button>
                </li>
              </>
            ) : (
              <>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/login">
                    Войти
                  </NavLink>
                </li>

                <li className="nav-item">
                  <NavLink className="nav-link" to="/register">
                    Зарегистрироваться
                  </NavLink>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}
