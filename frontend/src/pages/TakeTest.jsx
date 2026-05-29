import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api";
import { ending, shuffleArray } from "../utils";
import { Question } from "../components/Question";
import useTimer from "../hooks/timer";

export default function TakeTest() {
  const { id } = useParams();

  const [test, setTest] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [attemptID, setAttemptID] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const navigate = useNavigate();
  const timer = useTimer(() => {
    alert("Время вышло! Ваши ответы будут отправлены как есть.");
    api
      .finishAttempt(attemptID)
      .then(() => navigate(`/report/${attemptID}`))
      .catch((e) => {
        alert(e.message);
        navigate("/");
      });
  });

  useEffect(() => {
    setLoading(true);
    setError("");
    setResult(null);

    api
      .testForPassing(id)
      .then((data) => {
        const questions = data.questions;
        if (data.test.shuffle_questions) shuffleArray(questions);
        setTest(data.test);
        setQuestions(questions);
        setAttemptID(data.attemptId);
        setAnswers({});
        console.log(timer);
        timer.setTime(data.test.time_limit * 60, true);
        console.log(data);
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });

    return () => {
      api.terminateAttempt(attemptID);
    };
  }, [id]);

  function updateAnswer(questionId, value) {
    setAnswers((current) => ({
      ...current,
      [questionId]: value,
    }));
  }

  // async function handleSubmit(event) {
  //   event.preventDefault();

  //   const unansweredCount = questions.filter((question) => {
  //     const answer = answers[question.id];
  //     return answer === undefined || answer === null || answer === "";
  //   }).length;

  //   if (unansweredCount > 0) {
  //     const confirmed = window.confirm(
  //       `Не отвечено вопросов: ${unansweredCount}. Всё равно завершить тест?`,
  //     );

  //     if (!confirmed) return;
  //   }

  //   setSubmitting(true);
  //   setError("");

  //   try {
  //     const data = await api.submitTest(id, answers);
  //     setResult(data.result);
  //     window.scrollTo({ top: 0, behavior: "smooth" });
  //   } catch (err) {
  //     setError(err.message);
  //   } finally {
  //     setSubmitting(false);
  //   }
  // }

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

  // if (result) {
  //   return (
  //     <div>
  //       <h1>Результат</h1>

  //       <div className="alert alert-success">
  //         <strong>
  //           {result.score} / {result.maxScore}
  //         </strong>{" "}
  //         баллов, {result.percentage}%
  //       </div>

  //       <h2>Ответы</h2>

  //       <div className="list-group mb-3">
  //         {result.answers.map((answer, index) => (
  //           <div className="list-group-item" key={answer.questionId}>
  //             <div className="d-flex justify-content-between">
  //               <strong>Вопрос {index + 1}</strong>
  //               <span>{answer.correct ? "Верно" : "Неверно"}</span>
  //             </div>

  //             <div>
  //               Баллы: {answer.earned} / {answer.points}
  //             </div>

  //             {answer.correctAnswerText && (
  //               <div>Правильный ответ: {answer.correctAnswerText}</div>
  //             )}

  //             {!answer.correctAnswerText && answer.correctAnswer !== null && (
  //               <div>Правильный ответ: {String(answer.correctAnswer)}</div>
  //             )}
  //           </div>
  //         ))}
  //       </div>

  //       <Link className="btn btn-primary" to="/reports">
  //         Перейти в отчёты
  //       </Link>
  //     </div>
  //   );
  // }

  return (
    <div>
      <h1>{test.title}</h1>

      {test.description && <p>{test.description}</p>}

      <p className="text-muted">
        Осталось попыток:{" "}
        {test.attemptsLeft === null ? "без ограничений" : test.attemptsLeft}
        {test.time_limit ? ` · Лимит времени: ${test.time_limit} мин.` : ""}
        {test.time_limit
          ? ` · Осталось: ${timer.days}:${timer.hours}:${timer.minutes}:${timer.seconds}`
          : ""}
      </p>

      {/* <form onSubmit={handleSubmit}>
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
      </form> */}
      <Question
        index={currentQuestion}
        question={questions[currentQuestion]}
        last={currentQuestion === questions.length - 1}
        onNext={(index, answer) => {
          api
            .giveAnswer(attemptID, questions[currentQuestion].id, answer)
            .then(() => {
              if (currentQuestion === questions.length - 1) {
                api
                  .finishAttempt(attemptID)
                  .then(() => navigate(`/report/${attemptID}`))
                  .catch((e) => alert(e.message));
              } else {
                setCurrentQuestion(currentQuestion + 1);
              }
            })
            .catch((e) => alert(e.message));
        }}
        onFinish={(index, answer) => {
          const n = questions.length - currentQuestion;
          if (
            confirm(
              `Вы уверены, что хотите завершить тест досрочно?\nОтвет на текущий вопрос не будет отправлен.\nВы не ответили на ${n} вопрос${ending(n, ["", "а", "ов"])}`,
            )
          )
            api
              .finishAttempt(attemptID)
              .then(() => navigate(`/report/${attemptID}`))
              .catch((e) => alert(e.message));
        }}
      />
    </div>
  );
}
