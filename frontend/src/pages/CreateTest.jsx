import { use, useEffect, useState } from "react";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import Form from "react-bootstrap/Form";
import InputGroup from "react-bootstrap/InputGroup";
import Modal from "react-bootstrap/Modal";
import Alert from "react-bootstrap/Alert";
import Button from "react-bootstrap/Button";
import { api } from "../api";
import { Link, NavLink, useNavigate } from "react-router-dom";

import QuestionModal from "../components/QuestionModal";

function ending(n, endings) {
  return endings[
    ("2011122222" +
      "2222222222" +
      "2011122222" +
      "2011122222" +
      "2011122222" +
      "2011122222" +
      "2011122222" +
      "2011122222" +
      "2011122222" +
      "2011122222")[Math.abs(n) % 100]
  ];
}

export default function CreateTest() {
  const { control, handleSubmit, watch } = useForm({
    defaultValues: {
      deadline: "",
      timeLimit: 0,
      name: "",
      description: "",
      attemptsCount: 1,
      shuffleQuestions: false,
      showResult: true,
      showAnswers: true,
      questions: [],
    },
  });
  // const addQuestionForm=useForm();
  const { fields, append, remove, update } = useFieldArray({
    control,
    name: "questions",
  });
  // const [questionsList, setQuestionsList]=useState([]);
  const [modalShown, setModalShown] = useState(false);
  const [editing, setEditing] = useState(null);
  const [rightAnswer, setRightAnswer] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [addQuestionShown, setaAddQuestionShown] = useState(false);
  const navigate = useNavigate();
  // function makeHandler(setter){
  //   return e=>{
  //     setter(e.target.value);
  //   }
  // }
  console.log(watch("questions"));
  return (
    <div className="card">
      <style>
        {/* {`body { background-color: #f4f7fc; }
        .card-custom { border-radius: 1rem; box-shadow: 0 8px 20px rgba(0,0,0,0.05); }
        .question-item { background-color: #ffffff; border-left: 4px solid #0d6efd; transition: all 0.1s; }
        .question-item:hover { background-color: #f8f9ff; }
        .truncate-title { max-width: 100%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }`} */}
        {`.required-field::after { content: "*"; color: #dc3545; margin-left: 4px; }
        label{user-select: none;}`}
        {/* {`.variant-row { display: flex; gap: 0.5rem; margin-bottom: 0.5rem; align-items: center; }
        .variant-text { flex-grow: 1; }
        .radio-correct { flex-shrink: 0; }
        .remove-variant { flex-shrink: 0; }
        .modal-dialog { max-width: 700px; }`} */}
      </style>
      <div className="card-body">
        <h1 className="h4">Создать тест</h1>
        <Form id="testForm">
          <div className="row g-4">
            <Controller
              control={control}
              name="name"
              rules={{
                required: "Название обязательно",
                maxLength: {
                  value: 80,
                  message: "Длина названия - максимум 80 символов",
                },
              }}
              render={({ field, fieldState }) => (
                <Form.Group className="col-12">
                  <Form.Label className="fw-semibold required-field">
                    Название теста
                  </Form.Label>
                  <Form.Control
                    type="text"
                    {...field}
                    className={`form-control-lg${fieldState.error ? " is-invalid" : ""}`}
                    placeholder="Введите название (до 80 символов)"
                  />
                  <Form.Control.Feedback type="invalid">
                    {fieldState.error?.message}
                  </Form.Control.Feedback>
                </Form.Group>
              )}
            />

            <Controller
              control={control}
              name="description"
              render={({ field, fieldState }) => (
                <Form.Group className="col-12">
                  <Form.Label className="fw-semibold">Описание</Form.Label>
                  <Form.Control
                    as="textarea"
                    {...field}
                    className={`${fieldState.error ? " is-invalid" : ""}`}
                    rows="3"
                    placeholder="Детали теста (необязательно)"
                  ></Form.Control>
                  <Form.Control.Feedback type="invalid">
                    {fieldState.error?.message}
                  </Form.Control.Feedback>
                </Form.Group>
              )}
            />

            <Controller
              control={control}
              name="attemptsCount"
              rules={{
                required: "Поле обязательно",
                min: { value: 1, message: "Минимум 1 попытка!" },
              }}
              render={({ field, fieldState }) => (
                <Form.Group className="col-md-6">
                  <Form.Label className="fw-semibold required-field">
                    Количество попыток
                  </Form.Label>
                  <Form.Control
                    {...field}
                    type="number"
                    className={`${fieldState.error ? " is-invalid" : ""}`}
                    step="1"
                  />
                  <Form.Control.Feedback type="invalid">
                    {fieldState.error?.message}
                  </Form.Control.Feedback>
                </Form.Group>
              )}
            />

            <Controller
              control={control}
              name="deadline"
              rules={
                {
                  //required:'Поле обязательно',
                  //min:{value:1, message: 'Минимум 1 попытка!'}
                }
              }
              render={({ field, fieldState }) => (
                <Form.Group className="col-md-6">
                  <Form.Label className="form-label fw-semibold">
                    Дедлайн (дата и время)
                  </Form.Label>
                  <Form.Control
                    {...field}
                    type="datetime-local"
                    className={`${fieldState.error ? " is-invalid" : ""}`}
                  />
                  <Form.Control.Feedback type="invalid">
                    {fieldState.error?.message}
                  </Form.Control.Feedback>
                </Form.Group>
              )}
            />

            <Controller
              control={control}
              name="timeLimit"
              rules={{
                //required:'Поле обязательно',
                min: { value: 1, message: "Минимум 1 минута!" },
              }}
              render={({ field, fieldState }) => (
                <Form.Group className="col-12">
                  <Form.Label className="form-label fw-semibold required-field">
                    ⏱ Время на прохождение
                  </Form.Label>
                  <InputGroup>
                    <Form.Control
                      {...field}
                      type="number"
                      className={`${fieldState.error ? " is-invalid" : ""}`}
                    />
                    <InputGroup.Text className="input-group-text">
                      минут{ending(field.value, ["а", "ы", "\xa0\xa0"])}
                    </InputGroup.Text>
                    <Form.Control.Feedback type="invalid">
                      {fieldState.error?.message}
                    </Form.Control.Feedback>
                  </InputGroup>
                </Form.Group>
              )}
            />

            <Controller
              control={control}
              name="shuffleQuestions"
              rules={{}}
              render={({ field, fieldState }) => (
                <Form.Group className="col-12">
                  <Form.Check
                    type="switch"
                    label="🎲 Перемешать вопросы"
                    {...field}
                    checked={!!field.value}
                    id="shuffleQuestionsSwitch"
                  />
                  {/* <div className="form-check form-switch">
                    <input {...field} checked={!!field.value} className="form-check-input" type="checkbox" role="switch"/>
                    <label className="form-check-label fw-semibold ms-2">🎲 Перемешать вопросы</label>
                  </div> */}
                </Form.Group>
              )}
            />

            <Controller
              control={control}
              name="showResult"
              rules={{}}
              render={({ field, fieldState }) => (
                <Form.Group className="col-12 mt-2">
                  <Form.Check
                    type="switch"
                    label="📊 Показать результат после прохождения"
                    {...field}
                    checked={!!field.value}
                    id="showResultSwitch"
                  />
                  {/* <div className="form-check form-switch">
                    <input {...field} checked={!!field.value} className="form-check-input" type="checkbox" role="switch"/>
                    <label className="form-check-label fw-semibold ms-2">📊 Показать результат после прохождения</label>
                  </div> */}
                </Form.Group>
              )}
            />

            <Controller
              control={control}
              name="showAnswers"
              rules={{}}
              render={({ field, fieldState }) => (
                <Form.Group className="col-12 mt-2">
                  <Form.Check
                    type="switch"
                    label="🔍 Показать ответы после прохождения"
                    {...field}
                    checked={!!field.value}
                    id="showAnswersSwitch"
                  />
                  {/* <div className="form-check form-switch">
                    <input {...field} checked={!!field.value} className="form-check-input" type="checkbox" role="switch"/>
                    <label className="form-check-label fw-semibold ms-2">🔍 Показать ответы после прохождения</label>
                  </div> */}
                </Form.Group>
              )}
            />

            {/* <div className="col-12">
              <label className="form-label fw-semibold mb-2">🔍 Показать ответы после прохождения</label>
              <div className="d-flex flex-wrap gap-4">
                <div className="form-check"><input className="form-check-input" type="radio" name="showAnswersOption" id="answersYes" value="yes"/><label className="form-check-label" htmlFor="answersYes">Да</label></div>
                <div className="form-check"><input className="form-check-input" type="radio" name="showAnswersOption" id="answersNo" value="no" /><label className="form-check-label" htmlFor="answersNo">Нет</label></div>
                <div className="form-check"><input className="form-check-input" type="radio" name="showAnswersOption" id="answersAfterLast" value="after_last_attempt"/><label className="form-check-label" htmlFor="answersAfterLast">Только после последней попытки</label></div>
              </div>
            </div> */}

            <div className="d-flex justify-content-between align-items-center flex-wrap">
              <h3 className="h5 fw-bold mb-0">
                <i className="bi bi-question-circle-fill me-2 text-primary"></i>
                Вопросы теста
              </h3>
              <span
                className="badge bg-light text-dark"
                id="questionsCountBadge"
              >
                {fields.length} вопрос{ending(fields.length, ["", "а", "ов"])}
              </span>
            </div>
            <div className="card-body p-4 mt-0">
              {/* <!-- Контейнер для списка вопросов (динамически через JS) --> */}
              <div id="questionsListContainer">
                <ul
                  className="list-group list-group-custom"
                  id="questionsDynamicList"
                >
                  {fields.length ? (
                    watch("questions").map((question, idx) => (
                      <li
                        key={fields[idx].id}
                        className="list-group-item question-item d-flex justify-content-between align-items-center py-3 px-4"
                        data-question-index="${idx}"
                      >
                        <div className="flex-grow-1 me-3">
                          <span
                            className="fw-semibold truncate-title d-block"
                            style={{ max_width: "100%" }}
                            title={question.title}
                          >
                            {question.title}
                          </span>
                        </div>
                        <div className="d-flex gap-2 flex-shrink-0">
                          <Button
                            variant="outline-secondary"
                            className="btn-sm edit-question-btn"
                            title="Редактировать"
                            onClick={() => {
                              setEditing(idx);
                              setCurrentQuestion(question);
                              setModalShown(true);
                            }}
                          >
                            <i className="bi bi-pencil-square"></i>{" "}
                            Редактировать
                          </Button>
                          <Button
                            variant="outline-danger"
                            className="btn-sm delete-question-btn"
                            title="Удалить вопрос"
                            onClick={() => {
                              remove(idx);
                            }}
                          >
                            <i className="bi bi-trash3"></i> Удалить
                          </Button>
                        </div>
                      </li>
                    ))
                  ) : (
                    <li
                      className="list-group-item text-center text-muted py-4 bg-light"
                      style={{ border_radius: "1rem" }}
                    >
                      <i className="bi bi-inbox fs-1"></i>
                      <p className="mb-0 mt-2">
                        Список вопросов пуст. Добавьте первый вопрос
                      </p>
                    </li>
                  )}
                </ul>
                <div className="mt-4 d-flex justify-content-center">
                  <button
                    type="button"
                    id="addQuestionBtn"
                    className="btn btn-outline-primary rounded-pill px-4"
                    onClick={() => {
                      setEditing(null);
                      setCurrentQuestion(null);
                      setModalShown(true);
                    }}
                  >
                    <i className="bi bi-plus-lg me-2"></i>Добавить вопрос
                  </button>
                </div>
                {/* <div id="emptyQuestionsMessage" className="text-center text-muted mt-3 small d-none">Нет добавленных вопросов. Нажмите «Добавить вопрос»</div> */}
              </div>
            </div>
          </div>
          <Button
            onClick={handleSubmit(async (data) => {
              console.log(data);
              if (fields.length === 0) setaAddQuestionShown(true);
              else {
                try {
                  console.log(data);
                  data.questions.forEach(
                    (i) =>
                      i.type === "choice" &&
                      (i.options.variants = i.options.variants.map(
                        ({ text }) => text,
                      )),
                  );
                  const resp = await api.addTest(data);
                  navigate("/");
                } catch (e) {
                  console.log(e);
                  alert(`Ошибка: ${e.message}`);
                }
              }
            })}
          >
            Submit
          </Button>
        </Form>
      </div>
      <QuestionModal
        show={modalShown}
        onHide={() => {
          setModalShown(false);
        }}
        onSubmit={(data) => {
          let toadd;
          console.log(data);
          const { title, type, correctAnswer, options, points } = data;
          if (type == "text") toadd = { title, type, correctAnswer, points };
          else if (type == "choice") toadd = { title, type, options, points };
          if (editing === null) append(toadd);
          else update(editing, toadd);
          setaAddQuestionShown(false);
        }}
        initialData={currentQuestion}
      />
    </div>
  );
}
