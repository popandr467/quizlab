import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { api } from "../api";

export default function Register({ setUser }) {
  const navigate = useNavigate();

  const [uname, setUname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [username, setUsername] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const data = await api.register(uname, username, email, password);
      setUser(data.user);
      navigate(`/profiles/${data.user.username}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleUsernameChange(event) {
    setUsername(
      event.target.value.replace(/^@+/, "").replace(/\s+/g, "").toLowerCase(),
    );
  }

  return (
    <div className="row justify-content-center">
      <div className="col-md-7 col-lg-5">
        <div className="card shadow-sm">
          <div className="card-body">
            <h1 className="h4 mb-3">Регистрация</h1>

            {error && <div className="alert alert-danger">{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label" htmlFor="uname">
                  Ваше имя
                </label>
                <input
                  className="form-control"
                  id="uname"
                  type="text"
                  autoComplete="name"
                  value={uname}
                  onChange={(event) => setUname(event.target.value)}
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label" htmlFor="username">
                  Username
                </label>

                <div className="input-group">
                  <span className="input-group-text">@</span>

                  <input
                    className="form-control"
                    id="username"
                    type="text"
                    autoComplete="username"
                    value={username}
                    onChange={handleUsernameChange}
                    pattern="[a-z0-9._-]{3,30}"
                    maxLength={30}
                    required
                  />
                </div>

                <div className="form-text">
                  Будет отображаться как @{username || "username"}, а ссылка
                  будет /profiles/{username || "username"}.
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label" htmlFor="email">
                  Email адрес
                </label>
                <input
                  className="form-control"
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label" htmlFor="password">
                  Пароль
                </label>
                <input
                  className="form-control"
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
              </div>

              <button
                className="btn btn-primary w-100"
                type="submit"
                disabled={loading}
              >
                {loading ? "Регистрируем..." : "Зарегистрироваться"}
              </button>
            </form>

            <p className="mt-3 mb-0">
              Уже есть аккаунт? <Link to="/login">Войти</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
