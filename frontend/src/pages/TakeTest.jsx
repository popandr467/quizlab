import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api";

export default function TakeTest() {
  const { id } = useParams();

  const [test, setTest] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    setResult(null);

    api
      .testForPassing(id)
      .then((data) => {
        setTest(data.test);
        setQuestions(data.questions);
        setAnswers({});
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  function updateAnswer(questionId, value) {
    setAnswers((current) => ({
      ...current,
      [questionId]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const unansweredCount = questions.filter((question) => {
      const answer = answers[question.id];
      return answer === undefined || answer === null || answer === "";
    }).length;

    if (unansweredCount > 0) {
      const confirmed = window.confirm(
        `Не отвечено вопросов: ${unansweredCount}. Всё равно завершить тест?`,
      );

      if (!confirmed) return;
    }

    setSubmitting(true);
    setError("");

    try {
      const data = await api.submitTest(id, answers);
      setResult(data.result);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <p>Загружаем тест...</p>;
  }

  if (error) {
    return (
      <div>
        <h1>Прохождение теста</h1>
        <div className="alert alert-danger">{error}</div>
        <Link to="/">На главную</Link>
      </div>
    );
  }

  if (result) {
    return (
      <div>
        <h1>Результат</h1>

        <div className="alert alert-success">
          <strong>
            {result.score} / {result.maxScore}
          </strong>{" "}
          баллов, {result.percentage}%
        </div>

        <h2>Ответы</h2>

        <div className="list-group mb-3">
          {result.answers.map((answer, index) => (
            <div className="list-group-item" key={answer.questionId}>
              <div className="d-flex justify-content-between">
                <strong>Вопрос {index + 1}</strong>
                <span>{answer.correct ? "Верно" : "Неверно"}</span>
              </div>

              <div>
                Баллы: {answer.earned} / {answer.points}
              </div>

              {answer.correctAnswerText && (
                <div>Правильный ответ: {answer.correctAnswerText}</div>
              )}

              {!answer.correctAnswerText && answer.correctAnswer !== null && (
                <div>Правильный ответ: {String(answer.correctAnswer)}</div>
              )}
            </div>
          ))}
        </div>

        <Link className="btn btn-primary" to="/reports">
          Перейти в отчёты
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1>{test.title}</h1>

      {test.description && <p>{test.description}</p>}

      <p className="text-muted">
        Осталось попыток:{" "}
        {test.attemptsLeft === null ? "без ограничений" : test.attemptsLeft}
        {test.time_limit ? ` · Лимит времени: ${test.time_limit} мин.` : ""}
      </p>

      <form onSubmit={handleSubmit}>
        {questions.map((question, index) => (
          <div className="card mb-3" key={question.id}>
            <div className="card-body">
              <h2 className="h5">
                {index + 1}. {question.text}
              </h2>

              <div className="text-muted mb-2">Баллы: {question.points}</div>

              {question.type === "text" && (
                <textarea
                  className="form-control"
                  rows="3"
                  value={answers[question.id] ?? ""}
                  onChange={(event) =>
                    updateAnswer(question.id, event.target.value)
                  }
                  placeholder="Введите ответ"
                />
              )}

              {question.type === "choice" && (
                <div>
                  {question.options?.variants?.map((variant, variantIndex) => (
                    <label className="d-block mb-2" key={variantIndex}>
                      <input
                        className="form-check-input me-2"
                        type="radio"
                        name={`question-${question.id}`}
                        checked={Number(answers[question.id]) === variantIndex}
                        onChange={() => updateAnswer(question.id, variantIndex)}
                      />
                      {variant}
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        <button className="btn btn-success" type="submit" disabled={submitting}>
          {submitting ? "Проверяем..." : "Завершить тест"}
        </button>
      </form>
    </div>
  );
}