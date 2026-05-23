import { useEffect, useState } from "react";
import { api } from "../api";

export default function Reports() {
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");

    api
      .attempts()
      .then((data) => {
        setAttempts(data.attempts);
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <div>
      <h1>Отчёты</h1>

      {loading && <p>Загружаем результаты...</p>}

      {error && <div className="alert alert-danger">{error}</div>}

      {!loading && !error && attempts.length === 0 && (
        <p>Вы ещё не проходили тесты.</p>
      )}

      {!loading && !error && attempts.length > 0 && (
        <div className="table-responsive">
          <table className="table table-striped align-middle">
            <thead>
              <tr>
                <th>Тест</th>
                <th>Результат</th>
                <th>Процент</th>
                <th>Дата</th>
              </tr>
            </thead>

            <tbody>
              {attempts.map((attempt) => (
                <tr key={attempt.id}>
                  <td>{attempt.test_title}</td>
                  <td>
                    {attempt.score} / {attempt.max_score}
                  </td>
                  <td>{attempt.percentage}%</td>
                  <td>
                    {attempt.finished_at
                      ? new Date(attempt.finished_at).toLocaleString()
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}