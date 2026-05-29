// QuestionModal.jsx
import React, { useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { Modal, Button, Form, InputGroup } from "react-bootstrap";
import MarkdownEditorField from "./MarkdownEditorField"

const TYPE_SPECIFIC_DEFAULTS = Object.freeze({
  text: { correctAnswer: "" },
  choice: {
    variants: [{ text: "" }, { text: "" }],
    correct: -1,
  },
});

const DEFAULTS = Object.freeze({
  title: "",
  points: 0,
  type: "text",
  type_specific: TYPE_SPECIFIC_DEFAULTS,
});

function fill_defaults(data) {
  const res = {
    ...DEFAULTS,
    ...data,
    type_specific: {
      ...TYPE_SPECIFIC_DEFAULTS,
      ...((data.type ?? data.type_specific)
        ? { [data.type]: data.type_specific[data.type] }
        : {}),
    },
  };
  return res;
}

function type_specific_checks(data) {
  if (data.type === "choice") {
    const hasCorrect =
      data.type_specific.choice.correct >= 0 &&
      data.type_specific.choice.correct <
        data.type_specific.choice.variants.length;
    if (!hasCorrect) {
      alert("Пожалуйста, выберите правильный вариант ответа");
      return false;
    }
  }
  return true;
}

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
    defaultValues: DEFAULTS,
  });

  const questionType = watch("type");
  const { fields, append, remove } = useFieldArray({
    control,
    name: "type_specific.choice.variants",
  });
  // Сброс формы при открытии (создание или редактирование)
  useEffect(() => {
    if (questionType === "choice" && fields.length < 2) {
      const missing = 2 - fields.length;
      for (let i = 0; i < missing; i++) {
        append({ text: "" });
      }
    }
  }, [questionType, fields.length, append]);

  // При переключении на тип "выбор" добавляем недостающие варианты до минимума
  useEffect(() => {
    if (questionType === "choice" && fields.length < 2) {
      const missing = 2 - fields.length;
      for (let i = 0; i < missing; i++) {
        append("");
      }
    }
  }, [questionType, fields.length, append]);

  // Добавление варианта (макс. 10)
  const addOption = () => {
    if (fields.length < 10) {
      append({ text: "" });
    }
  };

  // Удаление варианта (мин. 2)
  const removeOption = (index) => {
    if (fields.length > 2) {
      remove(index);
    }
  };

  // Обработка отправки формы
  const onFormSubmit = (data) => {
    if (!type_specific_checks(data)) return;
    onSubmit({
      ...data,
      type_specific: { [data.type]: data.type_specific[data.type] },
    });
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

            <MarkdownEditorField
              control={control}
              name="title"
              rules={{ required: "Введите текст вопроса" }}
              height={220}
              placeholder="Введите текст вопроса. Можно использовать Markdown."
            />

            {errors.title && (
              <div className="text-danger small mt-1">{errors.title.message}</div>
            )}
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
                as="textarea"
                rows={4}
                placeholder="Введите правильный ответ"
                {...register("type_specific.text.correctAnswer", {
                  required: "Введите правильный ответ",
                })}
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
                  <MarkdownEditorField
                    control={control}
                    name={`type_specific.choice.variants.${index}.text`}
                    rules={{ required: "Введите вариант ответа" }}
                    height={120}
                    placeholder={`Вариант ${index + 1}. Можно использовать Markdown.`}
                  />
                  <InputGroup.Text>
                    <Form.Check
                      type="radio"
                      name="correctOptionGroup"
                      checked={index == watch("type_specific.choice.correct")}
                      onChange={() =>
                        setValue("type_specific.choice.correct", index)
                      }
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
                watch("type_specific.choice.correct") >= 0 &&
                watch("type_specific.choice.correct") <
                  watch("type_specific.choice.variants")?.length
              ) &&
                watch("type_specific.choice.variants")?.length > 0 && (
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
