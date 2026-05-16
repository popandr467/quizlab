import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api';

export default function Profile() {
  const { username } = useParams();

  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setError('');

    api.profile(username)
      .then((data) => {
        setProfile(data.profile);
      })
      .catch((err) => {
        setProfile(null);
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [username]);

  if (loading) {
    return <div>Загрузка профиля...</div>;
  }

  if (error) {
    return (
      <div className="card shadow-sm">
        <div className="card-body">
          <h1 className="h4">Профиль не найден</h1>
          <p className="text-muted mb-3">{error}</p>
          <Link className="btn btn-primary" to="/">
            На главную
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="row justify-content-center">
      <div className="col-md-8 col-lg-6">
        <div className="card shadow-sm">
          <div className="card-body">
            <div className="d-flex align-items-center gap-3">
              <div
                className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center"
                style={{ width: 64, height: 64, fontSize: 28 }}
              >
                <i className="bi bi-person" />
              </div>

              <div>
                <h1 className="h4 mb-1">{profile.name || `@${profile.username}`}</h1>
                <div className="text-muted">@{profile.username}</div>
              </div>
            </div>

            <hr />

            <dl className="row mb-0">
              <dt className="col-sm-4">ID</dt>
              <dd className="col-sm-8">{profile.id}</dd>

              <dt className="col-sm-4">Дата регистрации</dt>
              <dd className="col-sm-8">
                {new Date(profile.created_at).toLocaleDateString()}
              </dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}