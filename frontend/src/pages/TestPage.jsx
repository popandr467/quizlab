// App.jsx
import React, { useState } from "react";
import { Button, Container, Alert } from "react-bootstrap";
import QuestionModal from "../components/QuestionModal";
import "bootstrap/dist/css/bootstrap.min.css";

function App() {
  const [showModal, setShowModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [savedQuestions, setSavedQuestions] = useState([]);

  // Тестовые данные для редактирования
  const sampleQuestion = {
    title: "Столица Франции",
    type: "choice",
    options: {
      variants: ["Берлин", "Мадрид", "Париж", "Лиссабон"],
      correct: 2,
    } /*[
      { text: 'Берлин', isCorrect: false },
      { text: 'Мадрид', isCorrect: false },
      { text: 'Париж', isCorrect: true },
      { text: 'Лиссабон', isCorrect: false },
    ],*/,
  };

  const handleOpenCreate = () => {
    setEditingQuestion(null);
    setShowModal(true);
  };

  const handleOpenEdit = () => {
    setEditingQuestion(sampleQuestion);
    setShowModal(true);
  };

  const handleSaveQuestion = (questionData) => {
    if (editingQuestion) {
      // Редактирование
      setSavedQuestions((prev) =>
        prev.map((q) => (q === editingQuestion ? questionData : q)),
      );
      alert("Вопрос обновлён!");
    } else {
      // Создание
      setSavedQuestions((prev) => [...prev, questionData]);
      alert("Вопрос создан!");
    }
    setShowModal(false);
  };

  return (
    <Container className="mt-4">
      <h1>Управление вопросами</h1>
      <div className="d-flex gap-2 mb-4">
        <Button variant="primary" onClick={handleOpenCreate}>
          Создать вопрос
        </Button>
        <Button variant="secondary" onClick={handleOpenEdit}>
          Редактировать пример
        </Button>
      </div>

      {savedQuestions.length > 0 && (
        <div>
          <h3>Сохранённые вопросы:</h3>
          {savedQuestions.map((q, idx) => (
            <Alert key={idx} variant="info">
              <strong>{q.title}</strong> (
              {q.type === "text" ? "Текст" : "Выбор"})
              {q.type === "text" && (
                <div>Правильный ответ: {q.correctAnswer}</div>
              )}
              {q.type === "choice" && (
                <ul>
                  {q.options.variants.map((opt, i) => (
                    <li key={i}>
                      {opt} {i == q.options.correct && "✓"}
                    </li>
                  ))}
                </ul>
              )}
            </Alert>
          ))}
        </div>
      )}

      <QuestionModal
        show={showModal}
        onHide={() => setShowModal(false)}
        onSubmit={handleSaveQuestion}
        initialData={editingQuestion}
      />
    </Container>
  );
}

export default App;
