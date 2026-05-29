import { useEffect, useState } from "react";
import { api } from "../api";
import { Link, useParams } from "react-router-dom";

export default function TestStats() {
  const [attempts, setAttempts] = useState([]);
  const [testTitle, setTestTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { id } = useParams();

  useEffect(() => {
    setLoading(true);
    setError("");

    api
      .testStats(id)
      .then((data) => {
        setAttempts(data.attempts);
        setTestTitle(data.test_title);
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
        <p>Этот тест еще ни разу не проходили.</p>
      )}

      {!loading && !error && attempts.length > 0 && (
        <div className="table-responsive">
          <table className="table table-striped align-middle">
            <thead>
              <tr>
                <th>Имя пользователя</th>
                <th>Результат</th>
                <th>Дата</th>
                <th>Подробнее</th>
              </tr>
            </thead>

            <tbody>
              {attempts.map((attempt) => (
                <tr key={attempt.id}>
                  <td>{attempt.name}</td>
                  <td>
                    {attempt.score} / {attempt.max_score} ({attempt.percentage}
                    %)
                  </td>
                  <td>
                    {attempt.finished_at
                      ? new Date(attempt.finished_at).toLocaleString()
                      : "—"}
                  </td>
                  <td>
                    <Link to={`/report/${attempt.id}`}>Перейти{">>>"}</Link>
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
