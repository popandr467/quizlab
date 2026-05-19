// QuestionModal.jsx
import React, { useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { Modal, Button, Form, InputGroup } from "react-bootstrap";

/**
 * Модальное окно для создания/редактирования вопроса
 * @param {boolean} show - видимость модального окна
 * @param {function} onHide - колбэк закрытия
 * @param {function} onSubmit - колбэк сохранения (получает данные вопроса)
 * @param {object} initialData - данные редактируемого вопроса (если есть)
 */
const QuestionModal = ({ show, onHide, onSubmit, initialData }) => {
  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      title: "",
      points: 0,
      type: "text",
      correctAnswer: "",
      options: {
        variants: [{ text: "" }, { text: "" }],
        correct: -1,
      },
    },
  });

  const questionType = watch("type");
  const { fields, append, remove } = useFieldArray({
    control,
    name: "options.variants",
  });
  console.log(watch("options"));
  // Сброс формы при открытии (создание или редактирование)
  useEffect(() => {
    if (!show) return;
    console.log("reset");
    if (initialData) {
      reset({
        title: initialData.title,
        type: initialData.type,
        correctAnswer:
          initialData.type === "text" ? initialData.correctAnswer : "",
        options:
          initialData.type === "choice"
            ? initialData.options
            : {
                variants: [{ text: "" }, { text: "" }],
                correct: -1,
              },
      });
    } else {
      console.log("reset with no init data");
      reset(/*{
        title: '',
        type: 'text',
        correctAnswer: '',
        options: [
          { text: '', isCorrect: false },
          { text: '', isCorrect: false },
        ],
      }*/);
    }
  }, [initialData, reset, show]);

  // При переключении на тип "выбор" добавляем недостающие варианты до минимума
  useEffect(() => {
    if (questionType === "choice" && fields.length < 2) {
      console.log("reset 2");
      const missing = 2 - fields.length;
      for (let i = 0; i < missing; i++) {
        append("");
      }
    }
  }, [questionType, fields.length, append]);

  // Выбор правильного варианта (только один)
  const handleCorrectChange = (index) => {
    // const currentOptions = watch('options');
    // const updatedOptions = currentOptions;
    // updatedOptions.correct=index;
    setValue("options.correct", index);
  };

  // Добавление варианта (макс. 10)
  const addOption = () => {
    console.log("option added");
    if (fields.length < 10) {
      append(new Date().toISOString());
    }
  };

  // Удаление варианта (мин. 2)
  const removeOption = (index) => {
    if (fields.length > 2) {
      remove(index);
      // После удаления, если нет правильного варианта, делаем первый правильным
      // setTimeout(() => {
      //   const currentOptions = watch('options');
      //   if (currentOptions.length > 0 && !currentOptions.some((opt) => opt.isCorrect)) {
      //     const newOptions = [...currentOptions];
      //     newOptions[0].isCorrect = true;
      //     setValue('options', newOptions);
      //   }
      // }, 0);
    }
  };

  // Обработка отправки формы
  const onFormSubmit = (data) => {
    if (data.type === "text") {
      onSubmit({
        title: data.title,
        type: "text",
        correctAnswer: data.correctAnswer,
        points: data.points,
      });
    } else {
      // Проверка наличия правильного варианта
      const hasCorrect =
        data.options.correct >= 0 &&
        data.options.correct < data.options.variants.length;
      // console.log(data.options.correct, hasCorrect);
      if (!hasCorrect) {
        alert("Пожалуйста, выберите правильный вариант ответа");
        return;
      }
      onSubmit({
        title: data.title,
        type: "choice",
        options: data.options,
        points: data.points,
      });
    }
    onHide(); // Закрываем окно после сохранения (родитель может переопределить)
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>
          {initialData ? "Редактировать вопрос" : "Создать вопрос"}
        </Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit(onFormSubmit)}>
        <Modal.Body>
          {/* Заголовок вопроса */}
          <Form.Group className="mb-3">
            <Form.Label>Заголовок вопроса</Form.Label>
            <Form.Control
              type="text"
              {...register("title", { required: "Заголовок обязателен" })}
              isInvalid={!!errors.title}
            />
            <Form.Control.Feedback type="invalid">
              {errors.title?.message}
            </Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Баллы</Form.Label>
            <Form.Control
              type="text"
              {...register("points", {
                required: "Заголовок обязателен",
                min: { value: 0, message: "Введите положительное число" },
              })}
              isInvalid={!!errors.points}
            />
            <Form.Control.Feedback type="invalid">
              {errors.points?.message}
            </Form.Control.Feedback>
          </Form.Group>

          {/* Тип вопроса */}
          <Form.Group className="mb-3">
            <Form.Label>Тип вопроса</Form.Label>
            <div>
              <Form.Check
                inline
                label="Текст (ввод ответа)"
                type="radio"
                value="text"
                {...register("type")}
                id="type-text"
              />
              <Form.Check
                inline
                label="Выбор варианта"
                type="radio"
                value="choice"
                {...register("type")}
                id="type-choice"
              />
            </div>
          </Form.Group>

          {/* Поля для типа "текст" */}
          {questionType === "text" && (
            <Form.Group className="mb-3">
              <Form.Label>Правильный ответ</Form.Label>
              <Form.Control
                type="text"
                {...register("correctAnswer", {
                  required: "Введите правильный ответ",
                })}
                isInvalid={!!errors.correctAnswer}
              />
              <Form.Control.Feedback type="invalid">
                {errors.correctAnswer?.message}
              </Form.Control.Feedback>
            </Form.Group>
          )}

          {/* Поля для типа "выбор" */}
          {questionType === "choice" && (
            <div>
              <Form.Label>Варианты ответов (от 2 до 10)</Form.Label>
              {fields.map((field, index) => (
                <InputGroup key={field.id} className="mb-2">
                  <Form.Control
                    placeholder={`Вариант ${index + 1}`}
                    {...register(`options.variants.${index}.text`, {
                      required: "Вариант не может быть пустым",
                    })}
                    isInvalid={!!errors.options?.[index]}
                  />
                  <InputGroup.Text>
                    <Form.Check
                      type="radio"
                      name="correctOptionGroup"
                      checked={index == watch("options.correct")}
                      onChange={() => handleCorrectChange(index)}
                      aria-label="Правильный вариант"
                    />
                  </InputGroup.Text>
                  <Button
                    variant="outline-danger"
                    onClick={() => removeOption(index)}
                    disabled={fields.length <= 2}
                  >
                    Удалить
                  </Button>
                </InputGroup>
              ))}
              <Button
                variant="secondary"
                onClick={addOption}
                disabled={fields.length >= 10}
                className="mt-2"
              >
                Добавить вариант
              </Button>
              {!(
                watch("options.correct") >= 0 &&
                watch("options.correct") < watch("options.variants")?.length
              ) &&
                watch("options.variants")?.length > 0 && (
                  <div className="text-danger mt-2">
                    Необходимо выбрать правильный вариант
                  </div>
                )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>
            Отмена
          </Button>
          <Button variant="primary" type="submit">
            Сохранить
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default QuestionModal;
