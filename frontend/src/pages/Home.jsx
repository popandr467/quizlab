import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { api } from "../api";

export default function Home({ user }) {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) {
      setTests([]);
      return;
    }

    setLoading(true);
    setError("");

    api
      .tests()
      .then((data) => {
        setTests(data.tests);
      })
      .catch((err) => {
        setError(err.message);
        setTests([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [user]);

  if (!user) {
    return (
      <div className="row justify-content-center">
        <div className="col-lg-8">
          <div className="p-5 bg-light border rounded-3">
            <h1 className="display-6">QuizLab</h1>
            <p className="lead">
              Платформа для создания тестов, прохождения заданий и просмотра
              результатов.
            </p>

            <div className="d-flex gap-2">
              <Link className="btn btn-primary" to="/login">
                Войти
              </Link>
              <Link className="btn btn-outline-primary" to="/register">
                Зарегистрироваться
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div>
          <h1 className="h3 mb-1">Ваши тесты</h1>
          <p className="text-muted mb-0">
            Управляйте своими тестами и смотрите статистику.
          </p>
        </div>

        <Link className="btn btn-primary" to="/tests/create">
          <i className="bi bi-plus-circle me-1" />
          Новый тест
        </Link>
      </div>

      <div className="row g-4">
        <div className="col-lg-6">
          <section className="card h-100">
            <div className="card-body">
              <h2 className="h5 mb-3">Список тестов</h2>

              {loading && (
                <div className="alert alert-secondary">Загружаем тесты...</div>
              )}

              {error && <div className="alert alert-danger">{error}</div>}

              {!loading && !error && tests.length === 0 && (
                <div className="alert alert-info mb-0">
                  У вас пока нет тестов.
                </div>
              )}

              {!loading && tests.length > 0 && (
                <div className="list-group">
                  {tests.map((test) => (
                    <div
                      className="list-group-item list-group-item-action"
                      key={test.id}
                    >
                      <div className="d-flex w-100 justify-content-between">
                        <h5 className="mb-1">{test.title}</h5>
                        <small className="text-muted">#{test.id}</small>
                      </div>

                      {test.description && (
                        <p className="mb-1">{test.description}</p>
                      )}

                      <p className="text-muted">
                        Попыток: {test.max_attempts ?? 1}
                        {test.time_limit
                          ? ` · Лимит: ${test.time_limit} мин.`
                          : ""}
                      </p>
                      <div>
                        <Link className="btn btn-sm btn-primary" to={`/tests/${test.id}/take`}>
                          Пройти
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="col-lg-6">
          <section className="card h-100">
            <div className="card-body">
              <h2 className="h5 mb-3">Статистика</h2>

              <div className="mb-3">
                <div className="text-muted small">Всего тестов</div>
                <div className="fs-3 fw-semibold">{tests.length}</div>
              </div>

              <div className="mb-3">
                <div className="text-muted small">Попытки</div>
                <div className="fs-5">Скоро появится</div>
              </div>

              <div>
                <div className="text-muted small">Средний результат</div>
                <div className="fs-5">Скоро появится</div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
