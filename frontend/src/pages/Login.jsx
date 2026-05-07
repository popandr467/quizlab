import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { api } from '../api';

export default function Login({ setUser }) {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    setError('');
    setLoading(true);

    try {
      const data = await api.login(email, password);
      setUser(data.user);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="row justify-content-center">
      <div className="col-md-7 col-lg-5">
        <div className="card shadow-sm">
          <div className="card-body">
            <h1 className="h4 mb-3">Вход в систему</h1>

            {error && (
              <div className="alert alert-danger">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
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
                  autoComplete="current-password"
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
                {loading ? 'Входим...' : 'Войти'}
              </button>
            </form>

            <p className="mt-3 mb-0">
              Нет аккаунта? <Link to="/register">Зарегистрироваться</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}